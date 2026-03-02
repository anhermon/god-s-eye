import { getOllamaClient, getModelName } from "./ollama-client";
import { emitMissionLog } from "./mission-emitter";
import type { SearchItem } from "./geo-context";
import type { AgentIntelItem, AgentCategory } from "./types";

/**
 * Token budget constants for micro-agents.
 * On CPU, qwen3 thinking mode makes even tiny calls take 60s+.
 * We use a fast timeout and fall back to direct extraction from search data.
 */
const MAX_INPUT_CHARS = 400;
const CALL_TIMEOUT_MS = 20_000; // 20s — if it takes longer, use fallback
const PROBE_TIMEOUT_MS = 15_000; // 15s — initial speed probe

const EXTRACT_PROMPT = `Extract intel from this search result. Reply with ONLY a JSON object:
{"title":"<short title>","summary":"<1 sentence>","lat":0,"lon":0,"confidence":0.5,"subcategory":"<type>"}
JSON only. No explanation. No thinking.`;

const CATEGORY_MAP: Record<SearchItem["category"], AgentCategory> = {
  military: "military",
  news: "news",
  disasters: "disasters",
  geoint: "general",
};

/** Track whether LLM is fast enough on this hardware */
let llmUsable: boolean | null = null; // null = untested

/**
 * Probe LLM speed with a trivial call. If it responds within 15s, use LLM.
 * Otherwise, mark LLM as too slow and use fallback for all items.
 */
async function probeLlmSpeed(): Promise<boolean> {
  if (llmUsable !== null) return llmUsable;

  const client = await getOllamaClient();
  const model = getModelName();
  if (!client || !model) {
    llmUsable = false;
    return false;
  }

  emitMissionLog(null, "info", "Probing LLM speed...");
  try {
    const start = Date.now();
    await Promise.race([
      client.chat({
        model,
        messages: [
          { role: "system", content: "Reply: {\"ok\":true}" },
          { role: "user", content: "test" },
        ],
        options: { num_predict: 16, temperature: 0 },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("probe timeout")), PROBE_TIMEOUT_MS)
      ),
    ]);
    const elapsed = Date.now() - start;
    llmUsable = elapsed < PROBE_TIMEOUT_MS;
    emitMissionLog(null, llmUsable ? "success" : "warn",
      `LLM probe: ${elapsed}ms — ${llmUsable ? "fast enough, using LLM" : "too slow, using direct extraction"}`
    );
    return llmUsable;
  } catch {
    llmUsable = false;
    emitMissionLog(null, "warn", "LLM probe timed out — using direct extraction (no LLM)");
    return false;
  }
}

/** Reset probe (e.g., after reconnection) */
export function resetLlmProbe(): void {
  llmUsable = null;
}

/**
 * Sliding window truncation.
 */
function truncate(text: string): string {
  return text.length <= MAX_INPUT_CHARS ? text : text.slice(0, MAX_INPUT_CHARS) + "...";
}

/**
 * Extract an intel item using LLM (fast path — only if probe passed).
 */
async function extractWithLlm(
  item: SearchItem,
  locationName: string,
  index: number
): Promise<AgentIntelItem | null> {
  const client = await getOllamaClient();
  const model = getModelName();
  if (!client || !model) return null;

  const input = truncate(
    `[${item.category.toUpperCase()}] ${item.title}\n${item.snippet}\nLocation: ${locationName}`
  );

  try {
    const response = await Promise.race([
      client.chat({
        model,
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: input },
        ],
        options: { temperature: 0.1, num_predict: 128 },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), CALL_TIMEOUT_MS)
      ),
    ]);

    return parseLlmResponse(response.message.content, item, index);
  } catch {
    return null; // Caller falls back to direct extraction
  }
}

/**
 * Parse LLM JSON response into an intel item.
 */
function parseLlmResponse(
  content: string,
  item: SearchItem,
  index: number
): AgentIntelItem | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    const objMatch = jsonStr.match(/\{[\s\S]*?\}/);
    if (!objMatch) return null;

    const p = JSON.parse(objMatch[0]);
    return {
      id: `micro-${item.category}-${Date.now()}-${index}`,
      title: String(p.title || item.title).slice(0, 120),
      summary: String(p.summary || item.snippet).slice(0, 200),
      latitude: Number(p.lat) || 0,
      longitude: Number(p.lon) || 0,
      category: CATEGORY_MAP[item.category],
      subcategory: String(p.subcategory || p.type || item.category),
      confidence: Math.min(1, Math.max(0, Number(p.confidence) || 0.5)),
      sourceUrl: item.url,
      timestamp: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

/**
 * Direct extraction — no LLM, just structured transform of search data.
 * Fast, always works, lower confidence since no AI enrichment.
 */
function extractDirect(item: SearchItem, index: number): AgentIntelItem {
  return {
    id: `micro-${item.category}-${Date.now()}-${index}`,
    title: item.title.slice(0, 120),
    summary: item.snippet.slice(0, 200),
    latitude: 0,
    longitude: 0,
    category: CATEGORY_MAP[item.category],
    subcategory: item.category,
    confidence: 0.4,
    sourceUrl: item.url,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Process a batch of search items through the micro-agent pipeline.
 *
 * Strategy:
 *   1. Probe LLM speed once (15s test)
 *   2. If fast → use LLM extraction per item (with 20s timeout, fallback on failure)
 *   3. If slow → use direct extraction (instant, no LLM)
 *
 * Either way, results stream to the UI as each item completes.
 */
export async function processMicroBatch(
  items: SearchItem[],
  locationName: string,
  agentId: string,
  onItem: (item: AgentIntelItem) => void
): Promise<AgentIntelItem[]> {
  const results: AgentIntelItem[] = [];
  const useLlm = await probeLlmSpeed();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const num = i + 1;
    emitMissionLog(agentId, "info", `[${num}/${items.length}] "${item.title.slice(0, 50)}..."`);

    let result: AgentIntelItem | null = null;

    if (useLlm) {
      result = await extractWithLlm(item, locationName, num);
      if (result) {
        emitMissionLog(agentId, "success", `[${num}/${items.length}] LLM extracted: ${result.title.slice(0, 40)}`);
      }
    }

    // Fallback: direct extraction (always works, instant)
    if (!result) {
      result = extractDirect(item, num);
      if (useLlm) {
        emitMissionLog(agentId, "warn", `[${num}/${items.length}] LLM failed, using direct extraction`);
      }
    }

    results.push(result);
    onItem(result);
  }

  return results;
}
