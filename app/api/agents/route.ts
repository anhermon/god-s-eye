import { NextRequest, NextResponse } from "next/server";
import { executeSwarm, getSwarmStatus } from "@/lib/agents/swarm";
import { resetConnection, getOllamaClient, isOllamaAvailable, getModelName } from "@/lib/agents/ollama-client";

/**
 * GET /api/agents — Get swarm status and cached results
 */
export async function GET() {
  const status = getSwarmStatus();
  return NextResponse.json(status);
}

/**
 * POST /api/agents — Trigger a swarm execution
 * Body: { "action": "run" | "reset" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = (body as Record<string, string>).action || "run";

    if (action === "reset") {
      // Clear cached state, then actually attempt reconnection
      resetConnection();
      await getOllamaClient();
      return NextResponse.json({
        success: true,
        message: "Connection reset",
        ollamaConnected: isOllamaAvailable(),
        modelName: getModelName(),
      });
    }

    // Execute swarm (will skip if on cooldown or Ollama unavailable)
    const results = await executeSwarm();

    const totalItems = results.reduce((sum, r) => sum + r.data.length, 0);
    const successful = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      agents: results.length,
      successful,
      totalItems,
      results,
    });
  } catch (error) {
    console.error("Agent swarm API error:", error);
    return NextResponse.json(
      { success: false, error: "Swarm execution failed" },
      { status: 500 }
    );
  }
}
