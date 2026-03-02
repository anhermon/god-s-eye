import { getOllamaClient, getModelName, isOllamaAvailable } from "./ollama-client";
import { AGENTS } from "./agents";
import { gatherGeoSearchResults, type SearchItem } from "./geo-context";
import { processMicroBatch } from "./micro-agents";
import { emitMissionLog, emitAgentStatus, emitPhase } from "./mission-emitter";
import type {
  AgentResult,
  AgentIntelItem,
  DeploymentArea,
  MissionState,
  MissionAgentState,
  MissionLogEntry,
} from "./types";

// ── Global singleton state (survives Turbopack HMR) ─────────────

const g = globalThis as typeof globalThis & {
  __mission?: MissionState | null;
  __missionPaused?: Set<string>;
  __missionCancelled?: Set<string>;
  __missionPrompts?: Map<string, string>;
  __missionAbort?: AbortController | null;
};

if (!g.__missionPaused) g.__missionPaused = new Set();
if (!g.__missionCancelled) g.__missionCancelled = new Set();
if (!g.__missionPrompts) g.__missionPrompts = new Map();

const pausedAgents = g.__missionPaused;
const cancelledAgents = g.__missionCancelled;
const promptOverrides = g.__missionPrompts;

/** Map agent category to search item category */
const AGENT_TO_SEARCH: Record<string, SearchItem["category"]> = {
  "news-scout": "news",
  "military-analyst": "military",
  "disaster-monitor": "disasters",
  "geoint-analyst": "geoint",
};

/**
 * Deploy a targeted mission using the micro-agent pipeline.
 *
 * Pipeline:
 *   1. Web search → individual SearchItems (~200 chars each)
 *   2. Per agent: filter items by category
 *   3. Per item: micro-agent extraction (~400 char input, 256 token output)
 *   4. Emit results as each micro-agent completes
 *
 * Each micro-agent call is stateless (fresh) with a 60s timeout.
 * Much faster than the old approach of sending 3000 chars to one big call.
 */
export async function deployMission(
  area: DeploymentArea,
  agentIds?: string[],
  prompts?: Record<string, string>
): Promise<void> {
  const current = g.__mission;
  if (current && current.phase === "deploying") {
    emitMissionLog(null, "warn", "Mission already in progress");
    return;
  }

  // Apply prompt overrides
  promptOverrides.clear();
  if (prompts) {
    for (const [id, prompt] of Object.entries(prompts)) {
      promptOverrides.set(id, prompt);
    }
  }

  // Reset control sets
  pausedAgents.clear();
  cancelledAgents.clear();
  g.__missionAbort = new AbortController();

  const missionId = `mission-${Date.now()}`;
  const selectedAgents = agentIds
    ? AGENTS.filter((a) => agentIds.includes(a.id))
    : AGENTS;

  const agentStates: MissionAgentState[] = selectedAgents.map((a) => ({
    agentId: a.id,
    status: "pending",
    systemPrompt: promptOverrides.get(a.id) || a.systemPrompt,
  }));

  const mission: MissionState = {
    missionId,
    phase: "configuring",
    deploymentArea: area,
    agents: agentStates,
    logs: [],
    ollamaConnected: isOllamaAvailable(),
    modelName: getModelName(),
  };
  g.__mission = mission;

  // Check Ollama availability
  const client = await getOllamaClient();
  if (!client) {
    mission.ollamaConnected = false;
    emitMissionLog(null, "error", "Ollama not available — cannot deploy mission");
    mission.phase = "aborted";
    emitPhase(missionId, "aborted");
    return;
  }

  mission.ollamaConnected = true;
  mission.modelName = getModelName();

  // Start deployment
  mission.phase = "deploying";
  mission.startedAt = Date.now();
  emitPhase(missionId, "deploying");
  emitMissionLog(null, "info", `Mission deploying — micro-agent pipeline`);

  try {
    // Phase 1: Gather search results as individual items
    const searchResults = await gatherGeoSearchResults(area);

    if (g.__missionAbort?.signal.aborted) {
      mission.phase = "aborted";
      emitPhase(missionId, "aborted");
      return;
    }

    if (searchResults.items.length === 0) {
      emitMissionLog(null, "warn", "No search results — aborting");
      mission.phase = "aborted";
      emitPhase(missionId, "aborted");
      return;
    }

    // Phase 2: Process each agent's items through micro-agents
    for (const agentState of mission.agents) {
      if (g.__missionAbort?.signal.aborted) break;

      // Check if skipped
      if (agentState.status === "skipped") {
        emitMissionLog(agentState.agentId, "info", "Skipped");
        emitAgentStatus(agentState.agentId, "skipped");
        continue;
      }

      // Check if cancelled
      if (cancelledAgents.has(agentState.agentId)) {
        agentState.status = "cancelled";
        emitAgentStatus(agentState.agentId, "cancelled");
        continue;
      }

      // Filter search items for this agent's category
      const searchCategory = AGENT_TO_SEARCH[agentState.agentId];
      const agentItems = searchCategory
        ? searchResults.items.filter((i) => i.category === searchCategory)
        : searchResults.items;

      if (agentItems.length === 0) {
        agentState.status = "completed";
        agentState.completedAt = Date.now();
        agentState.result = {
          agentId: agentState.agentId,
          category: AGENTS.find((a) => a.id === agentState.agentId)?.category || "general",
          success: true,
          data: [],
          processingTimeMs: 0,
        };
        emitMissionLog(agentState.agentId, "warn", "No search items — skipping");
        emitAgentStatus(agentState.agentId, "completed", agentState.result);
        continue;
      }

      // Gathering phase
      agentState.status = "gathering";
      agentState.startedAt = Date.now();
      emitAgentStatus(agentState.agentId, "gathering");
      emitMissionLog(agentState.agentId, "info", `${agentItems.length} items to process`);

      // Check for pause
      await checkPause(agentState.agentId);
      if (cancelledAgents.has(agentState.agentId) || g.__missionAbort?.signal.aborted) {
        agentState.status = "cancelled";
        emitAgentStatus(agentState.agentId, "cancelled");
        continue;
      }

      // Running phase — fan out micro-agents over individual items
      agentState.status = "running";
      emitAgentStatus(agentState.agentId, "running");

      const collectedItems: AgentIntelItem[] = [];

      const results = await processMicroBatch(
        agentItems,
        searchResults.locationName,
        agentState.agentId,
        (item) => {
          collectedItems.push(item);
          // Emit partial result so UI can show items as they arrive
          emitAgentStatus(agentState.agentId, "running", {
            agentId: agentState.agentId,
            category: AGENTS.find((a) => a.id === agentState.agentId)?.category || "general",
            success: true,
            data: collectedItems,
            processingTimeMs: Date.now() - (agentState.startedAt || Date.now()),
          });
        }
      );

      // Check for cancel after processing
      if (cancelledAgents.has(agentState.agentId)) {
        agentState.status = "cancelled";
        emitAgentStatus(agentState.agentId, "cancelled");
        continue;
      }

      agentState.completedAt = Date.now();
      const agentCategory = AGENTS.find((a) => a.id === agentState.agentId)?.category || "general";
      agentState.result = {
        agentId: agentState.agentId,
        category: agentCategory,
        success: true,
        data: results,
        processingTimeMs: agentState.completedAt - (agentState.startedAt || agentState.completedAt),
      };

      agentState.status = "completed";
      emitMissionLog(agentState.agentId, "success", `Done: ${results.length} items in ${agentState.result.processingTimeMs}ms`);
      emitAgentStatus(agentState.agentId, "completed", agentState.result);
    }

    // Mission complete
    mission.completedAt = Date.now();
    if (g.__missionAbort?.signal.aborted) {
      mission.phase = "aborted";
      emitPhase(missionId, "aborted");
      emitMissionLog(null, "warn", "Mission aborted");
    } else {
      mission.phase = "completed";
      emitPhase(missionId, "completed");
      const totalItems = mission.agents.reduce(
        (sum, a) => sum + (a.result?.data.length || 0),
        0
      );
      emitMissionLog(null, "success", `Mission complete: ${totalItems} items from ${mission.agents.filter((a) => a.status === "completed").length} agents`);
    }
  } catch (err) {
    mission.phase = "aborted";
    emitPhase(missionId, "aborted");
    emitMissionLog(null, "error", `Mission error: ${(err as Error).message}`);
  }
}

/**
 * Cooperative pause check — polls every 500ms until unpaused or cancelled.
 */
async function checkPause(agentId: string): Promise<void> {
  while (pausedAgents.has(agentId)) {
    if (cancelledAgents.has(agentId) || g.__missionAbort?.signal.aborted) return;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

// ── Control functions ────────────────────────────────────────────

export function pauseAgent(id: string): void {
  pausedAgents.add(id);
  const mission = g.__mission;
  if (mission) {
    const agent = mission.agents.find((a) => a.agentId === id);
    if (agent && agent.status === "running") {
      agent.status = "paused";
      emitAgentStatus(id, "paused");
      emitMissionLog(id, "warn", "Paused");
    }
  }
}

export function resumeAgent(id: string): void {
  pausedAgents.delete(id);
  const mission = g.__mission;
  if (mission) {
    const agent = mission.agents.find((a) => a.agentId === id);
    if (agent && agent.status === "paused") {
      agent.status = "running";
      emitAgentStatus(id, "running");
      emitMissionLog(id, "info", "Resumed");
    }
  }
}

export function cancelAgent(id: string): void {
  cancelledAgents.add(id);
  pausedAgents.delete(id);
  const mission = g.__mission;
  if (mission) {
    const agent = mission.agents.find((a) => a.agentId === id);
    if (agent && (agent.status === "pending" || agent.status === "gathering" || agent.status === "running" || agent.status === "paused")) {
      agent.status = "cancelled";
      emitAgentStatus(id, "cancelled");
      emitMissionLog(id, "warn", "Cancelled");
    }
  }
}

export function skipAgent(id: string): void {
  const mission = g.__mission;
  if (mission) {
    const agent = mission.agents.find((a) => a.agentId === id);
    if (agent && agent.status === "pending") {
      agent.status = "skipped";
      emitAgentStatus(id, "skipped");
      emitMissionLog(id, "info", "Skipped");
    }
  }
}

export function abortMission(): void {
  g.__missionAbort?.abort();
  const mission = g.__mission;
  if (mission && mission.phase === "deploying") {
    emitMissionLog(null, "warn", "Aborting mission...");
  }
}

export function setAgentPrompt(id: string, prompt: string): void {
  promptOverrides.set(id, prompt);
  const mission = g.__mission;
  if (mission) {
    const agent = mission.agents.find((a) => a.agentId === id);
    if (agent) agent.systemPrompt = prompt;
  }
}

export function getActiveMission(): MissionState | null {
  return g.__mission ?? null;
}

export function initMissionState(area: DeploymentArea): MissionState {
  const agentStates: MissionAgentState[] = AGENTS.map((a) => ({
    agentId: a.id,
    status: "pending",
    systemPrompt: promptOverrides.get(a.id) || a.systemPrompt,
  }));

  const mission: MissionState = {
    missionId: `mission-${Date.now()}`,
    phase: "configuring",
    deploymentArea: area,
    agents: agentStates,
    logs: [],
    ollamaConnected: isOllamaAvailable(),
    modelName: getModelName(),
  };
  g.__mission = mission;
  return mission;
}

export function addLogToMission(entry: MissionLogEntry): void {
  const mission = g.__mission;
  if (mission) mission.logs.push(entry);
}
