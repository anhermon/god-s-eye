"use client";

import { useWorldViewStore } from "@/stores/worldview-store";
import type { AgentIntelItemClient } from "@/types";

interface Props {
  results: AgentIntelItemClient[];
}

const CATEGORY_COLORS: Record<string, string> = {
  news: "border-cyan-700/40 text-cyan-500/70",
  military: "border-red-700/40 text-red-400/70",
  disasters: "border-amber-700/40 text-amber-400/70",
  general: "border-purple-700/40 text-purple-400/70",
};

export default function MissionResults({ results }: Props) {
  const flyTo = useWorldViewStore((s) => s.flyTo);
  const closeMissionModal = useWorldViewStore((s) => s.closeMissionModal);

  const handleClick = (item: AgentIntelItemClient) => {
    if (item.latitude && item.longitude) {
      flyTo(item.longitude, item.latitude, 500_000);
      closeMissionModal();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="text-[9px] font-mono tracking-[0.15em] text-green-600/50 px-3 py-2 flex-shrink-0">
        INTEL RESULTS ({results.length})
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
        {results.length === 0 ? (
          <div className="text-[8px] font-mono text-green-700/30 text-center py-4">
            No results yet...
          </div>
        ) : (
          <div className="space-y-1.5">
            {results.map((item) => (
              <button
                key={item.id}
                onClick={() => handleClick(item)}
                className="w-full text-left p-2 border border-green-900/20 bg-green-950/10 hover:bg-green-950/25 hover:border-green-800/30 transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[9px] font-mono text-green-400/90 leading-tight">
                    {item.title}
                  </span>
                  {/* Confidence bar */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <div className="w-12 h-1 bg-green-950/40 overflow-hidden">
                      <div
                        className="h-full bg-green-500/60"
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[7px] font-mono text-green-600/40">
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </div>
                </div>

                {item.summary && (
                  <div className="text-[8px] font-mono text-green-600/50 leading-tight mb-1">
                    {item.summary.slice(0, 120)}
                    {item.summary.length > 120 && "..."}
                  </div>
                )}

                <div className="flex items-center gap-2">
                  {item.subcategory && (
                    <span
                      className={`text-[7px] font-mono px-1 py-0 border ${
                        CATEGORY_COLORS[item.category] || "border-green-800/30 text-green-600/50"
                      }`}
                    >
                      {item.subcategory.toUpperCase()}
                    </span>
                  )}
                  {(item.latitude !== 0 || item.longitude !== 0) && (
                    <span className="text-[7px] font-mono text-green-700/30">
                      {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
