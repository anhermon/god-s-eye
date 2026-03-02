export { getOllamaClient, getModelName, isOllamaAvailable, resetConnection } from "./ollama-client";
export { AGENTS, getAgent, getAgentsByCategory } from "./agents";
export { executeSwarm, getSwarmStatus, getCachedResults } from "./swarm";
export type { AgentConfig, AgentCategory, AgentResult, AgentIntelItem, SwarmStatus } from "./types";
