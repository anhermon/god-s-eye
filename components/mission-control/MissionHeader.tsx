"use client";

import { useWorldViewStore } from "@/stores/worldview-store";
import { useMissionControl } from "@/hooks/useMissionControl";

const RADIUS_PRESETS = [50, 200, 500];

export default function MissionHeader() {
  const mc = useWorldViewStore((s) => s.missionControl);
  const setDeploymentArea = useWorldViewStore((s) => s.setDeploymentArea);
  const closeMissionModal = useWorldViewStore((s) => s.closeMissionModal);
  const { deploy, abort } = useMissionControl();

  const area = mc.deploymentArea;
  const isConfiguring = mc.missionPhase === "configuring";
  const isDeploying = mc.missionPhase === "deploying";
  const canDeploy = isConfiguring && mc.ollamaConnected && area;

  const handleRadiusChange = (km: number) => {
    if (!area) return;
    setDeploymentArea({ ...area, radiusKm: km });
  };

  const handleDeploy = () => {
    if (!area) return;
    // Collect prompt overrides from agent states
    const prompts: Record<string, string> = {};
    for (const agent of mc.agentStates) {
      if (agent.systemPrompt) {
        prompts[agent.agentId] = agent.systemPrompt;
      }
    }
    deploy(area, Object.keys(prompts).length > 0 ? prompts : undefined);
  };

  return (
    <div className="border-b border-green-900/30 px-4 py-3 flex items-center justify-between gap-4 flex-shrink-0">
      {/* Left: Title + coords */}
      <div className="flex items-center gap-4 min-w-0">
        <div>
          <div className="text-[11px] font-mono tracking-[0.2em] text-green-400 hud-glow">
            MISSION CONTROL
          </div>
          {area && (
            <div className="text-[9px] font-mono text-green-600/60 mt-0.5">
              TARGET: {area.lat.toFixed(4)}°, {area.lon.toFixed(4)}° | {area.radiusKm}km
            </div>
          )}
        </div>

        {/* Ollama status */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              mc.ollamaConnected
                ? "bg-green-400 shadow-[0_0_4px_#00ff41]"
                : "bg-red-500 shadow-[0_0_4px_#ff0000]"
            }`}
          />
          <span className="text-[8px] font-mono tracking-wide text-green-500/60">
            {mc.ollamaConnected ? "ONLINE" : "OFFLINE"}
          </span>
          {mc.modelName && (
            <span className="text-[8px] font-mono text-green-600/40 truncate max-w-[100px]">
              {mc.modelName}
            </span>
          )}
        </div>
      </div>

      {/* Center: Radius controls */}
      {isConfiguring && area && (
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-green-600/50 tracking-wide">RADIUS</span>
          <div className="flex gap-1">
            {RADIUS_PRESETS.map((km) => (
              <button
                key={km}
                onClick={() => handleRadiusChange(km)}
                className={`px-2 py-0.5 text-[9px] font-mono tracking-wide border transition-all cursor-pointer ${
                  area.radiusKm === km
                    ? "border-green-500/60 text-green-400 bg-green-950/40"
                    : "border-green-900/30 text-green-600/50 bg-transparent hover:border-green-700/40 hover:text-green-500/70"
                }`}
              >
                {km}km
              </button>
            ))}
          </div>
          <input
            type="number"
            min={10}
            max={5000}
            value={area.radiusKm}
            onChange={(e) => handleRadiusChange(Number(e.target.value) || 200)}
            className="w-16 px-1 py-0.5 text-[9px] font-mono text-green-400 bg-green-950/30 border border-green-900/30 focus:border-green-600/50 outline-none"
          />
        </div>
      )}

      {/* Right: Action buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {isConfiguring && (
          <button
            onClick={handleDeploy}
            disabled={!canDeploy}
            className={`px-4 py-1.5 text-[10px] font-mono tracking-[0.15em] border transition-all ${
              canDeploy
                ? "border-green-500/50 text-green-400 bg-green-950/30 hover:bg-green-900/30 hover:border-green-400/60 cursor-pointer shadow-[0_0_8px_rgba(0,255,65,0.1)]"
                : "border-green-900/20 text-green-700/30 bg-green-950/10 cursor-not-allowed"
            }`}
          >
            DEPLOY ALL
          </button>
        )}

        {isDeploying && (
          <button
            onClick={abort}
            className="px-4 py-1.5 text-[10px] font-mono tracking-[0.15em] border border-red-800/50 text-red-400/80 bg-red-950/20 hover:bg-red-900/20 hover:border-red-700/50 cursor-pointer transition-all"
          >
            ABORT ALL
          </button>
        )}

        <button
          onClick={closeMissionModal}
          className="px-2 py-1.5 text-[10px] font-mono text-green-600/50 hover:text-green-400 cursor-pointer transition-colors"
        >
          [X]
        </button>
      </div>
    </div>
  );
}
