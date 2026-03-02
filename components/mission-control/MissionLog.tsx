"use client";

import { useEffect, useRef } from "react";
import type { MissionLogClientEntry } from "@/types";

interface Props {
  logs: MissionLogClientEntry[];
}

/** Agent color map for log tags */
const AGENT_COLORS: Record<string, string> = {
  "news-scout": "text-cyan-400/80",
  "military-analyst": "text-red-400/80",
  "disaster-monitor": "text-amber-400/80",
  "geoint-analyst": "text-purple-400/80",
};

const LEVEL_COLORS: Record<string, string> = {
  info: "text-green-500/70",
  warn: "text-amber-400/80",
  error: "text-red-400/80",
  success: "text-green-400",
};

const LEVEL_ICONS: Record<string, string> = {
  info: "i",
  warn: "!",
  error: "x",
  success: "+",
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toISOString().slice(11, 19);
}

function getAgentTag(agentId: string | null): string {
  if (!agentId) return "SYS";
  const parts = agentId.split("-");
  return parts.map((p) => p[0]?.toUpperCase()).join("").slice(0, 3);
}

export default function MissionLog({ logs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="text-[9px] font-mono tracking-[0.15em] text-green-600/50 px-3 py-2 flex-shrink-0">
        MISSION LOG ({logs.length})
      </div>
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 pb-2 min-h-0"
      >
        {logs.length === 0 ? (
          <div className="text-[8px] font-mono text-green-700/30 text-center py-4">
            Awaiting mission deployment...
          </div>
        ) : (
          <div className="space-y-px">
            {logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-1.5 leading-tight">
                <span className="text-[8px] font-mono text-green-700/30 flex-shrink-0 w-[52px]">
                  {formatTime(entry.timestamp)}
                </span>
                <span
                  className={`text-[8px] font-mono flex-shrink-0 w-[24px] text-center ${
                    entry.agentId
                      ? AGENT_COLORS[entry.agentId] || "text-green-500/60"
                      : "text-green-600/40"
                  }`}
                >
                  {getAgentTag(entry.agentId)}
                </span>
                <span
                  className={`text-[8px] font-mono flex-shrink-0 w-[8px] ${LEVEL_COLORS[entry.level]}`}
                >
                  {LEVEL_ICONS[entry.level]}
                </span>
                <span className={`text-[8px] font-mono ${LEVEL_COLORS[entry.level]} break-all`}>
                  {entry.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
