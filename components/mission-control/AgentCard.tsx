"use client";

import { useState } from "react";
import type { MissionAgentClientState, MissionPhaseClient } from "@/types";

interface Props {
  agent: MissionAgentClientState;
  missionPhase: MissionPhaseClient;
  onSkip: (id: string) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  onPromptChange: (id: string, prompt: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "text-green-700/50",
  gathering: "text-amber-400/80 animate-pulse",
  running: "text-green-400 animate-pulse",
  paused: "text-yellow-400/80",
  completed: "text-green-400",
  failed: "text-red-400",
  cancelled: "text-green-700/30 line-through",
  skipped: "text-green-700/30 italic",
};

const STATUS_DOT_STYLES: Record<string, string> = {
  pending: "bg-green-800/50",
  gathering: "bg-amber-400 animate-pulse shadow-[0_0_4px_#f59e0b]",
  running: "bg-green-400 animate-pulse shadow-[0_0_4px_#00ff41]",
  paused: "bg-yellow-400 shadow-[0_0_4px_#eab308]",
  completed: "bg-green-400 shadow-[0_0_4px_#00ff41]",
  failed: "bg-red-500 shadow-[0_0_4px_#ef4444]",
  cancelled: "bg-green-900/30",
  skipped: "bg-green-900/30",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "PENDING",
  gathering: "GATHERING",
  running: "RUNNING",
  paused: "PAUSED",
  completed: "COMPLETE",
  failed: "FAILED",
  cancelled: "CANCELLED",
  skipped: "SKIPPED",
};

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentCard({
  agent,
  missionPhase,
  onSkip,
  onPause,
  onResume,
  onCancel,
  onPromptChange,
}: Props) {
  const [promptExpanded, setPromptExpanded] = useState(false);
  const isConfiguring = missionPhase === "configuring";
  const isActive = agent.status === "running" || agent.status === "gathering";
  const elapsed = agent.startedAt
    ? (agent.completedAt || Date.now()) - agent.startedAt
    : 0;

  return (
    <div className="border border-green-900/25 bg-green-950/15 p-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT_STYLES[agent.status]}`} />
          <span className="text-[10px] font-mono tracking-wide text-green-400 truncate">
            {agent.agentName}
          </span>
        </div>
        <span className={`text-[8px] font-mono tracking-wider ${STATUS_STYLES[agent.status]}`}>
          {STATUS_LABELS[agent.status]}
        </span>
      </div>

      {/* Role */}
      <div className="text-[8px] font-mono text-green-600/40 mb-2 pl-4">
        {agent.role}
      </div>

      {/* System prompt (configuring phase) */}
      {isConfiguring && agent.status === "pending" && (
        <div className="mb-2">
          <button
            onClick={() => setPromptExpanded(!promptExpanded)}
            className="text-[8px] font-mono text-green-600/50 hover:text-green-500/70 cursor-pointer transition-colors"
          >
            {promptExpanded ? "[-] SYSTEM PROMPT" : "[+] SYSTEM PROMPT"}
          </button>
          {promptExpanded && (
            <textarea
              value={agent.systemPrompt}
              onChange={(e) => onPromptChange(agent.agentId, e.target.value)}
              rows={4}
              className="w-full mt-1 px-1.5 py-1 text-[8px] font-mono text-green-500/70 bg-green-950/30 border border-green-900/20 focus:border-green-700/40 outline-none resize-y leading-tight"
            />
          )}
        </div>
      )}

      {/* Stats row (active/completed) */}
      {(isActive || agent.status === "completed" || agent.status === "failed") && (
        <div className="flex items-center justify-between text-[8px] font-mono pl-4">
          {agent.status === "completed" && (
            <>
              <span className="text-green-500/60">{agent.itemCount} items</span>
              <span className="text-green-600/40">{formatMs(agent.processingTimeMs)}</span>
            </>
          )}
          {isActive && (
            <span className="text-green-600/40">
              {formatMs(elapsed)}
            </span>
          )}
          {agent.status === "failed" && (
            <span className="text-red-400/70 truncate">{agent.error}</span>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5 mt-2 pl-4">
        {isConfiguring && agent.status === "pending" && (
          <button
            onClick={() => onSkip(agent.agentId)}
            className="px-2 py-0.5 text-[8px] font-mono tracking-wide border border-green-900/25 text-green-600/50 hover:text-green-500/70 hover:border-green-800/40 cursor-pointer transition-all"
          >
            SKIP
          </button>
        )}

        {agent.status === "running" && (
          <button
            onClick={() => onPause(agent.agentId)}
            className="px-2 py-0.5 text-[8px] font-mono tracking-wide border border-yellow-900/30 text-yellow-500/70 hover:text-yellow-400 hover:border-yellow-800/40 cursor-pointer transition-all"
          >
            PAUSE
          </button>
        )}

        {agent.status === "paused" && (
          <button
            onClick={() => onResume(agent.agentId)}
            className="px-2 py-0.5 text-[8px] font-mono tracking-wide border border-green-700/30 text-green-500/70 hover:text-green-400 hover:border-green-600/40 cursor-pointer transition-all"
          >
            RESUME
          </button>
        )}

        {(agent.status === "running" || agent.status === "paused" || agent.status === "gathering") && (
          <button
            onClick={() => onCancel(agent.agentId)}
            className="px-2 py-0.5 text-[8px] font-mono tracking-wide border border-red-900/25 text-red-500/50 hover:text-red-400 hover:border-red-800/40 cursor-pointer transition-all"
          >
            CANCEL
          </button>
        )}
      </div>
    </div>
  );
}
