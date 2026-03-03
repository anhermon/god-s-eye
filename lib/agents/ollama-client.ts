import { Ollama } from "ollama";

// Preferred models in order of priority
// lfm2 preferred — no thinking mode overhead, fast structured output
const PREFERRED_MODELS = [
  "sam860/lfm2:8b",  // 5.9GB — fits fully in 12GB VRAM, fast on GPU
  "lfm2:24b",        // Best quality, needs 16GB+ VRAM
  "lfm2:24b-a2b",    // MoE variant, needs 16GB+ VRAM
  "sam860/lfm2:2.6b",// 1.8GB — tiny, fast even on CPU
  "qwen3.5:35b-a3b", // MoE, fast, good tool calling (GPU only)
  "qwen3.5:27b",
  "qwen3.5:3b",
  "qwen3:1.7b",      // Minimal — thinking mode makes it slow on CPU
  "llama3.1:8b",
  "mistral:7b",
];

let ollamaInstance: Ollama | null = null;
let connectionFailed = false;
let lastConnectionAttempt = 0;
const CONNECTION_BACKOFF_MS = 60_000; // 1 minute backoff on failure
let resolvedModel: string | null = null;

/**
 * Get or create Ollama client instance.
 * Returns null if Ollama is unreachable (with 1-minute backoff on failure).
 */
export async function getOllamaClient(): Promise<Ollama | null> {
  const now = Date.now();

  // If we failed recently, don't retry yet
  if (connectionFailed && now - lastConnectionAttempt < CONNECTION_BACKOFF_MS) {
    return null;
  }

  if (ollamaInstance) return ollamaInstance;

  try {
    lastConnectionAttempt = now;
    const host = process.env.OLLAMA_HOST || "http://127.0.0.1:11434";
    const client = new Ollama({ host });

    // Test connection by listing models
    const models = await Promise.race([
      client.list(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Connection timeout")), 3000)
      ),
    ]);

    ollamaInstance = client;
    connectionFailed = false;

    // Resolve the best available model
    const available = models.models.map((m) => m.name);
    resolvedModel = PREFERRED_MODELS.find((m) =>
      available.some((a) => a.startsWith(m))
    ) || available[0] || null;

    if (resolvedModel) {
      console.log(`[AgentSwarm] Connected to Ollama, using model: ${resolvedModel}`);
    } else {
      console.warn("[AgentSwarm] Ollama connected but no models available");
    }

    return client;
  } catch {
    connectionFailed = true;
    console.warn("[AgentSwarm] Ollama not available — agent swarm disabled");
    return null;
  }
}

/** Get the resolved model name, or null if not connected */
export function getModelName(): string | null {
  return resolvedModel;
}

/** Check if Ollama is currently available without attempting reconnection */
export function isOllamaAvailable(): boolean {
  return ollamaInstance !== null && !connectionFailed;
}

/** Reset connection state (e.g., for manual retry) */
export function resetConnection(): void {
  ollamaInstance = null;
  connectionFailed = false;
  lastConnectionAttempt = 0;
  resolvedModel = null;
}
