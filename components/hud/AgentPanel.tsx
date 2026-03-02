"use client";

import { useAgentSwarm } from "@/hooks/useAgentSwarm";
import { useWorldViewStore } from "@/stores/worldview-store";
import { useCallback } from "react";

function formatTimeAgo(timestamp: number): string {
  if (!timestamp) return "never";
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AgentPanel() {
  const { status, runSwarm, resetConnection } = useAgentSwarm();
  const expanded = useWorldViewStore((s) => s.agentPanelExpanded);
  const setExpanded = useWorldViewStore((s) => s.setAgentPanelExpanded);
  const setDeploymentMode = useWorldViewStore((s) => s.setDeploymentMode);
  const setDeploymentArea = useWorldViewStore((s) => s.setDeploymentArea);
  const openMissionModal = useWorldViewStore((s) => s.openMissionModal);
  const clearMission = useWorldViewStore((s) => s.clearMission);
  const viewport = useWorldViewStore((s) => s.viewport);

  const handleMissionControl = useCallback(() => {
    clearMission();
    // Use current viewport center as default deployment area
    setDeploymentArea({
      lat: viewport.centerLat,
      lon: viewport.centerLon,
      radiusKm: 200,
    });
    setDeploymentMode(true);
    openMissionModal();
  }, [clearMission, setDeploymentArea, setDeploymentMode, openMissionModal, viewport.centerLat, viewport.centerLon]);

  const hasResults = status.agentResults.length > 0;
  const successCount = status.agentResults.filter((r) => r.success).length;

  return (
    <div className="panel-section">
      <div className="panel-label">AGENT SWARM</div>

      {/* Connection status */}
      <div className="flex items-center justify-between px-2 py-1">
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              status.ollamaConnected
                ? "bg-green-400 shadow-[0_0_4px_#00ff41]"
                : "bg-red-500 shadow-[0_0_4px_#ff0000]"
            }`}
          />
          <span className="text-[9px] font-mono tracking-wide text-green-500/80">
            {status.ollamaConnected ? "OLLAMA ONLINE" : "OLLAMA OFFLINE"}
          </span>
        </div>
        {status.modelName && (
          <span className="text-[8px] font-mono text-green-600/60 truncate max-w-[80px]">
            {status.modelName}
          </span>
        )}
      </div>

      {/* Action button */}
      <div className="px-2 py-1">
        {status.ollamaConnected ? (
          <button
            onClick={runSwarm}
            disabled={status.running}
            className={`w-full py-1 px-2 text-[9px] font-mono tracking-wider border transition-all ${
              status.running
                ? "border-green-800/40 text-green-700/50 bg-green-950/20 cursor-wait"
                : "border-green-700/40 text-green-400 bg-green-950/30 hover:bg-green-900/30 hover:border-green-600/50 cursor-pointer"
            }`}
          >
            {status.running ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                RUNNING...
              </span>
            ) : (
              "RUN SWARM"
            )}
          </button>
        ) : (
          <button
            onClick={resetConnection}
            className="w-full py-1 px-2 text-[9px] font-mono tracking-wider border border-red-800/40 text-red-400/80 bg-red-950/20 hover:bg-red-900/20 hover:border-red-700/40 cursor-pointer transition-all"
          >
            RETRY CONNECTION
          </button>
        )}
      </div>

      {/* Mission Control button */}
      <div className="px-2 py-1">
        <button
          onClick={handleMissionControl}
          className="w-full py-1 px-2 text-[9px] font-mono tracking-wider border border-green-700/30 text-green-500/70 bg-green-950/20 hover:bg-green-900/25 hover:border-green-600/40 hover:text-green-400 cursor-pointer transition-all"
        >
          MISSION CONTROL
        </button>
      </div>

      {/* Last run info */}
      {hasResults && (
        <div className="px-2 py-0.5 flex items-center justify-between text-[8px] font-mono text-green-600/50">
          <span>Last: {formatTimeAgo(status.lastRun)}</span>
          <span>{status.totalItems} items</span>
        </div>
      )}

      {/* Expandable agent results */}
      {hasResults && (
        <div className="px-2 py-0.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[9px] font-mono text-green-500/70 hover:text-green-400 cursor-pointer transition-colors w-full"
          >
            <span className="text-[8px]">{expanded ? "[-]" : "[+]"}</span>
            <span className="tracking-wide">
              AGENT RESULTS ({successCount}/{status.agentResults.length})
            </span>
          </button>

          {expanded && (
            <div className="mt-1 space-y-0.5">
              {status.agentResults.map((r) => (
                <div
                  key={r.agentId}
                  className="flex items-center justify-between text-[8px] font-mono pl-2"
                >
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={`inline-block w-1 h-1 rounded-full flex-shrink-0 ${
                        r.success
                          ? "bg-green-400"
                          : "bg-red-500"
                      }`}
                    />
                    <span className="text-green-500/70 truncate">
                      {r.agentName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 text-green-600/50">
                    {r.success ? (
                      <>
                        <span>{r.itemCount}</span>
                        <span>{formatMs(r.processingTimeMs)}</span>
                      </>
                    ) : (
                      <span className="text-red-500/70">ERR</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
