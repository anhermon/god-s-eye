"use client";

import AgentCard from "./AgentCard";
import type { MissionAgentClientState, MissionPhaseClient } from "@/types";

interface Props {
  agents: MissionAgentClientState[];
  missionPhase: MissionPhaseClient;
  onSkip: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onPromptChange: (id: string, prompt: string) => void;
}

export default function AgentCardList({
  agents,
  missionPhase,
  onSkip,
  onPause,
  onResume,
  onCancel,
  onPromptChange,
}: Props) {
  return (
    <div className="flex flex-col gap-2 overflow-y-auto p-3 flex-1 min-h-0">
      <div className="text-[9px] font-mono tracking-[0.15em] text-green-600/50 mb-1">
        AGENTS ({agents.length})
      </div>
      {agents.map((agent) => (
        <AgentCard
          key={agent.agentId}
          agent={agent}
          missionPhase={missionPhase}
          onSkip={onSkip}
          onPause={onPause}
          onResume={onResume}
          onCancel={onCancel}
          onPromptChange={onPromptChange}
        />
      ))}
    </div>
  );
}
