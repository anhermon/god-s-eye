import { EventEmitter } from "events";
import type { MissionAgentStatus, MissionLogLevel, MissionPhase, AgentResult } from "./types";

// ── Event types ──────────────────────────────────────────────────

export interface MissionLogEvent {
  type: "log";
  id: string;
  timestamp: number;
  agentId: string | null;
  level: MissionLogLevel;
  message: string;
}

export interface MissionAgentStatusEvent {
  type: "agent_status";
  agentId: string;
  status: MissionAgentStatus;
  result?: AgentResult;
  error?: string;
}

export interface MissionPhaseEvent {
  type: "phase";
  missionId: string;
  phase: MissionPhase;
}

export type MissionEvent = MissionLogEvent | MissionAgentStatusEvent | MissionPhaseEvent;

/**
 * Global singleton EventEmitter bridging mission executor → SSE endpoint.
 *
 * MUST use globalThis to survive Turbopack module reloading — without this,
 * the SSE route and mission executor get different EventEmitter instances
 * and events never reach the client.
 */
const globalForEmitter = globalThis as typeof globalThis & {
  __missionEmitter?: EventEmitter;
  __missionLogCounter?: number;
};

if (!globalForEmitter.__missionEmitter) {
  globalForEmitter.__missionEmitter = new EventEmitter();
  globalForEmitter.__missionEmitter.setMaxListeners(20);
}
if (globalForEmitter.__missionLogCounter === undefined) {
  globalForEmitter.__missionLogCounter = 0;
}

export const missionEmitter = globalForEmitter.__missionEmitter;

// ── Emit helpers ─────────────────────────────────────────────────

export function emitMissionLog(
  agentId: string | null,
  level: MissionLogLevel,
  message: string
): void {
  const counter = globalForEmitter.__missionLogCounter!++;
  const event: MissionLogEvent = {
    type: "log",
    id: `log-${Date.now()}-${counter}`,
    timestamp: Date.now(),
    agentId,
    level,
    message,
  };
  missionEmitter.emit("mission", event);
}

export function emitAgentStatus(
  agentId: string,
  status: MissionAgentStatus,
  result?: AgentResult,
  error?: string
): void {
  const event: MissionAgentStatusEvent = {
    type: "agent_status",
    agentId,
    status,
    result,
    error,
  };
  missionEmitter.emit("mission", event);
}

export function emitPhase(missionId: string, phase: MissionPhase): void {
  const event: MissionPhaseEvent = {
    type: "phase",
    missionId,
    phase,
  };
  missionEmitter.emit("mission", event);
}
