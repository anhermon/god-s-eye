import { getOllamaClient, getModelName, isOllamaAvailable } from "./ollama-client";
import { AGENTS } from "./agents";
import { parseAgentResponse } from "./parse-response";
import type {
  AgentConfig,
  AgentResult,
  SwarmStatus,
} from "./types";

// Swarm state
let swarmRunning = false;
let lastSwarmRun = 0;
let cachedResults: AgentResult[] = [];
const SWARM_COOLDOWN_MS = 120_000; // 2 minutes between swarm runs

/**
 * Run a single agent with the given context data.
 * Sends the data to Ollama for analysis and returns structured results.
 */
async function runAgent(
  agent: AgentConfig,
  contextData: string
): Promise<AgentResult> {
  const start = Date.now();

  const client = await getOllamaClient();
  const model = getModelName();

  if (!client || !model) {
    return {
      agentId: agent.id,
      category: agent.category,
      success: false,
      data: [],
      error: "Ollama not available",
      processingTimeMs: Date.now() - start,
    };
  }

  try {
    // Truncate context to prevent long processing times on CPU models
    const truncated = contextData.slice(0, 3000);

    const response = await Promise.race([
      client.chat({
        model,
        messages: [
          { role: "system", content: agent.systemPrompt },
          {
            role: "user",
            content: `Analyze the following data and provide structured intelligence:\n\n${truncated}`,
          },
        ],
        options: {
          temperature: 0.3,
          num_predict: 1024,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Ollama response timeout (5min)")), 300_000)
      ),
    ]);

    const content = response.message.content;
    const items = parseAgentResponse(content, agent);

    return {
      agentId: agent.id,
      category: agent.category,
      success: true,
      data: items,
      processingTimeMs: Date.now() - start,
    };
  } catch (err) {
    console.error(`[Agent:${agent.id}] Error:`, err);
    return {
      agentId: agent.id,
      category: agent.category,
      success: false,
      data: [],
      error: (err as Error).message,
      processingTimeMs: Date.now() - start,
    };
  }
}

/**
 * Gather context data for agents from external sources.
 * Fetches raw data that agents will analyze.
 */
async function gatherContextData(): Promise<
  Record<string, string>
> {
  const contexts: Record<string, string> = {};

  // Fetch multiple data sources in parallel
  const fetches = await Promise.allSettled([
    // GDELT military events (for military analyst)
    fetch(
      "http://api.gdeltproject.org/api/v2/geo/geo?query=theme:MILITARY&mode=PointData&format=GeoJSON&timespan=4h&maxpoints=50",
      { signal: AbortSignal.timeout(15_000) }
    ).then((r) => r.text()),

    // GDELT conflict news (for news scout)
    fetch(
      "http://api.gdeltproject.org/api/v2/geo/geo?query=(conflict OR crisis OR attack OR war)&mode=PointData&format=GeoJSON&timespan=4h&maxpoints=50",
      { signal: AbortSignal.timeout(15_000) }
    ).then((r) => r.text()),

    // USGS earthquakes (for disaster monitor)
    fetch(
      "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson",
      { signal: AbortSignal.timeout(10_000) }
    ).then((r) => r.text()),

    // EONET natural events (for disaster monitor)
    fetch(
      "https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=20",
      { signal: AbortSignal.timeout(10_000) }
    ).then((r) => r.text()),
  ]);

  const labels = ["military_gdelt", "news_gdelt", "earthquakes", "eonet"];
  fetches.forEach((result, i) => {
    if (result.status === "fulfilled") {
      // Truncate to avoid overloading the LLM context
      contexts[labels[i]] = result.value.slice(0, 8000);
    }
  });

  return contexts;
}

/**
 * Execute the full agent swarm — runs all agents in parallel.
 * Returns aggregated results from all agents.
 */
export async function executeSwarm(): Promise<AgentResult[]> {
  const now = Date.now();

  // Prevent concurrent runs
  if (swarmRunning) {
    console.log("[Swarm] Already running, returning cached results");
    return cachedResults;
  }

  // Cooldown between runs
  if (now - lastSwarmRun < SWARM_COOLDOWN_MS && cachedResults.length > 0) {
    return cachedResults;
  }

  // Check Ollama availability
  const client = await getOllamaClient();
  if (!client) {
    console.warn("[Swarm] Ollama unavailable — skipping swarm execution");
    return cachedResults;
  }

  swarmRunning = true;
  console.log("[Swarm] Starting agent swarm execution...");

  try {
    // Gather context data from external sources
    const contexts = await gatherContextData();

    // Map agents to their context data
    const agentTasks = AGENTS.map((agent) => {
      let contextData = "";

      switch (agent.category) {
        case "military":
          contextData = contexts["military_gdelt"] || "No military data available.";
          break;
        case "news":
          contextData = contexts["news_gdelt"] || "No news data available.";
          break;
        case "disasters":
          contextData = [
            contexts["earthquakes"] || "",
            contexts["eonet"] || "",
          ]
            .filter(Boolean)
            .join("\n\n---\n\n") || "No disaster data available.";
          break;
        default:
          contextData = Object.values(contexts).join("\n\n---\n\n").slice(0, 4000);
          break;
      }

      return runAgent(agent, contextData);
    });

    // Execute agents sequentially on CPU to avoid resource contention
    // (On GPU, these could run in parallel)
    const results: AgentResult[] = [];
    for (const task of agentTasks) {
      results.push(await task);
    }

    cachedResults = results;
    lastSwarmRun = Date.now();

    const totalItems = results.reduce((sum, r) => sum + r.data.length, 0);
    const successful = results.filter((r) => r.success).length;
    console.log(
      `[Swarm] Complete: ${successful}/${results.length} agents succeeded, ${totalItems} total items`
    );

    return results;
  } catch (err) {
    console.error("[Swarm] Execution error:", err);
    return cachedResults;
  } finally {
    swarmRunning = false;
  }
}

/** Get current swarm status without triggering execution */
export function getSwarmStatus(): SwarmStatus {
  return {
    running: swarmRunning,
    lastRun: lastSwarmRun,
    agentResults: cachedResults,
    totalItems: cachedResults.reduce((sum, r) => sum + r.data.length, 0),
    ollamaConnected: isOllamaAvailable(),
    modelName: getModelName(),
  };
}

/** Get cached results without triggering a new run */
export function getCachedResults(): AgentResult[] {
  return cachedResults;
}
