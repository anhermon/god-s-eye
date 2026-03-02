import { NextRequest, NextResponse } from "next/server";
import {
  deployMission,
  getActiveMission,
  initMissionState,
  pauseAgent,
  resumeAgent,
  cancelAgent,
  skipAgent,
  abortMission,
  setAgentPrompt,
} from "@/lib/agents/mission";
import { getOllamaClient, isOllamaAvailable, getModelName } from "@/lib/agents/ollama-client";

/**
 * GET /api/agents/mission — Get current mission state + Ollama status
 */
export async function GET() {
  // Attempt connection check
  await getOllamaClient();

  const mission = getActiveMission();
  return NextResponse.json({
    mission,
    ollamaConnected: isOllamaAvailable(),
    modelName: getModelName(),
  });
}

/**
 * POST /api/agents/mission — Mission control actions
 * Body: { action: "deploy" | "abort" | "pause" | "resume" | "cancel" | "skip" | "set_prompt", ... }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      case "deploy": {
        const { area, agentIds, prompts } = body;
        if (!area || typeof area.lat !== "number" || typeof area.lon !== "number") {
          return NextResponse.json(
            { success: false, error: "Invalid deployment area" },
            { status: 400 }
          );
        }
        // Non-blocking: deploy runs in background, SSE pushes events
        deployMission(area, agentIds, prompts);
        return NextResponse.json({ success: true, message: "Mission deploying" });
      }

      case "abort":
        abortMission();
        return NextResponse.json({ success: true, message: "Mission aborting" });

      case "pause": {
        const { agentId } = body;
        if (!agentId) return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
        pauseAgent(agentId);
        return NextResponse.json({ success: true });
      }

      case "resume": {
        const { agentId } = body;
        if (!agentId) return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
        resumeAgent(agentId);
        return NextResponse.json({ success: true });
      }

      case "cancel": {
        const { agentId } = body;
        if (!agentId) return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
        cancelAgent(agentId);
        return NextResponse.json({ success: true });
      }

      case "skip": {
        const { agentId } = body;
        if (!agentId) return NextResponse.json({ success: false, error: "Missing agentId" }, { status: 400 });
        skipAgent(agentId);
        return NextResponse.json({ success: true });
      }

      case "set_prompt": {
        const { agentId, prompt } = body;
        if (!agentId || !prompt) return NextResponse.json({ success: false, error: "Missing agentId or prompt" }, { status: 400 });
        setAgentPrompt(agentId, prompt);
        return NextResponse.json({ success: true });
      }

      case "init": {
        const { area } = body;
        if (!area) return NextResponse.json({ success: false, error: "Missing area" }, { status: 400 });
        const state = initMissionState(area);
        return NextResponse.json({ success: true, mission: state });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Mission API error:", error);
    return NextResponse.json(
      { success: false, error: "Mission control error" },
      { status: 500 }
    );
  }
}
