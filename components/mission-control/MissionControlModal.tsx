"use client";

import { useEffect, useCallback } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";
import { useMissionControl } from "@/hooks/useMissionControl";
import MissionHeader from "./MissionHeader";
import AgentCardList from "./AgentCardList";
import MissionLog from "./MissionLog";
import MissionResults from "./MissionResults";

export default function MissionControlModal() {
  const isOpen = useWorldViewStore((s) => s.missionControl.missionModalOpen);
  const mc = useWorldViewStore((s) => s.missionControl);
  const closeMissionModal = useWorldViewStore((s) => s.closeMissionModal);
  const updateAgentState = useWorldViewStore((s) => s.updateAgentState);

  const {
    skipAgent,
    pauseAgent,
    resumeAgent,
    cancelAgent,
    initAgentStates,
  } = useMissionControl();

  // Initialize agent states when modal opens
  useEffect(() => {
    if (isOpen && mc.agentStates.length === 0 && mc.deploymentArea) {
      // Init mission on server with area, then load agent states
      fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "init", area: mc.deploymentArea }),
      })
        .then(() => initAgentStates())
        .catch(() => initAgentStates());
    }
  }, [isOpen, mc.deploymentArea]); // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMissionModal();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, closeMissionModal]);

  const handlePromptChange = useCallback(
    (agentId: string, prompt: string) => {
      updateAgentState(agentId, { systemPrompt: prompt });
      // Also update server-side
      fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_prompt", agentId, prompt }),
      }).catch(() => {});
    },
    [updateAgentState]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#000a00]/95 border border-green-900/30">
      {/* Header */}
      <MissionHeader />

      {/* 3-region layout: agents left | log top-right + results bottom-right */}
      <div className="flex flex-1 min-h-0">
        {/* Left column: Agent cards (~40%) */}
        <div className="w-[40%] border-r border-green-900/20 flex flex-col min-h-0">
          <AgentCardList
            agents={mc.agentStates}
            missionPhase={mc.missionPhase}
            onSkip={skipAgent}
            onPause={pauseAgent}
            onResume={resumeAgent}
            onCancel={cancelAgent}
            onPromptChange={handlePromptChange}
          />
        </div>

        {/* Right column: Log (top) + Results (bottom) */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Log — top half */}
          <div className="flex-1 border-b border-green-900/20 flex flex-col min-h-0">
            <MissionLog logs={mc.missionLogs} />
          </div>

          {/* Results — bottom half */}
          <div className="flex-1 flex flex-col min-h-0">
            <MissionResults results={mc.missionResults} />
          </div>
        </div>
      </div>
    </div>
  );
}
