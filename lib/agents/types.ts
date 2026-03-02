/** Agent identity and configuration */
export interface AgentConfig {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  category: AgentCategory;
}

/** Data categories agents can gather intelligence for */
export type AgentCategory = "news" | "military" | "disasters" | "cameras" | "general";

/** Result returned by an agent after processing */
export interface AgentResult {
  agentId: string;
  category: AgentCategory;
  success: boolean;
  data: AgentIntelItem[];
  error?: string;
  processingTimeMs: number;
}

/** Individual intelligence item produced by an agent */
export interface AgentIntelItem {
  id: string;
  title: string;
  summary: string;
  latitude: number;
  longitude: number;
  category: AgentCategory;
  subcategory?: string;
  confidence: number; // 0-1 confidence score
  sourceUrl?: string;
  timestamp: string;
  rawData?: Record<string, unknown>;
}

/** Swarm execution status */
export interface SwarmStatus {
  running: boolean;
  lastRun: number;
  agentResults: AgentResult[];
  totalItems: number;
  ollamaConnected: boolean;
  modelName: string | null;
}

// ── Mission Control Types ────────────────────────────────────────

/** Geographic area for targeted agent deployment */
export interface DeploymentArea {
  lat: number;
  lon: number;
  radiusKm: number;
}

/** Status progression for a mission agent */
export type MissionAgentStatus =
  | "pending"
  | "gathering"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped";

/** Server-side state for a single agent within a mission */
export interface MissionAgentState {
  agentId: string;
  status: MissionAgentStatus;
  systemPrompt: string;
  startedAt?: number;
  completedAt?: number;
  result?: AgentResult;
  error?: string;
}

/** Log severity levels */
export type MissionLogLevel = "info" | "warn" | "error" | "success";

/** Single log entry from a mission */
export interface MissionLogEntry {
  id: string;
  timestamp: number;
  agentId: string | null;
  level: MissionLogLevel;
  message: string;
}

/** Overall mission phase */
export type MissionPhase = "configuring" | "deploying" | "completed" | "aborted";

/** Full server-side mission state */
export interface MissionState {
  missionId: string;
  phase: MissionPhase;
  deploymentArea: DeploymentArea;
  agents: MissionAgentState[];
  logs: MissionLogEntry[];
  startedAt?: number;
  completedAt?: number;
  ollamaConnected: boolean;
  modelName: string | null;
}
