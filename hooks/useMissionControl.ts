"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";
import type {
  DeploymentAreaClient,
  MissionAgentClientState,
  AgentIntelItemClient,
} from "@/types";

/** Agent ID → display name / role mapping */
const AGENT_INFO: Record<string, { name: string; role: string }> = {
  "news-scout": { name: "News Scout", role: "Breaking news & geopolitical events" },
  "military-analyst": { name: "Military Analyst", role: "Conflict & military operations" },
  "disaster-monitor": { name: "Disaster Monitor", role: "Natural disasters & emergencies" },
  "geoint-analyst": { name: "GEOINT Analyst", role: "Geospatial intelligence enrichment" },
};

export function useMissionControl() {
  const mc = useWorldViewStore((s) => s.missionControl);
  const setMissionPhase = useWorldViewStore((s) => s.setMissionPhase);
  const updateAgentState = useWorldViewStore((s) => s.updateAgentState);
  const setAgentStates = useWorldViewStore((s) => s.setAgentStates);
  const addMissionLog = useWorldViewStore((s) => s.addMissionLog);
  const setMissionResults = useWorldViewStore((s) => s.setMissionResults);
  const setMissionOllamaStatus = useWorldViewStore((s) => s.setMissionOllamaStatus);
  const clearMission = useWorldViewStore((s) => s.clearMission);

  const eventSourceRef = useRef<EventSource | null>(null);

  // Check Ollama status on mount
  useEffect(() => {
    if (!mc.missionModalOpen) return;

    const checkStatus = async () => {
      try {
        const res = await fetch("/api/agents/mission");
        if (res.ok) {
          const data = await res.json();
          setMissionOllamaStatus(data.ollamaConnected, data.modelName);

          // If there's an active mission with agents, restore state
          if (data.mission?.agents?.length > 0 && mc.agentStates.length === 0) {
            const states: MissionAgentClientState[] = data.mission.agents.map(
              (a: { agentId: string; status: string; systemPrompt: string; startedAt?: number; completedAt?: number; result?: { data: unknown[] }; error?: string; processingTimeMs?: number }) => ({
                agentId: a.agentId,
                agentName: AGENT_INFO[a.agentId]?.name || a.agentId,
                role: AGENT_INFO[a.agentId]?.role || "",
                status: a.status,
                systemPrompt: a.systemPrompt,
                startedAt: a.startedAt,
                completedAt: a.completedAt,
                itemCount: a.result?.data?.length || 0,
                processingTimeMs: a.completedAt && a.startedAt ? a.completedAt - a.startedAt : 0,
                error: a.error,
              })
            );
            setAgentStates(states);
          }
        }
      } catch {
        setMissionOllamaStatus(false, null);
      }
    };

    checkStatus();
  }, [mc.missionModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Connect SSE when deploying
  useEffect(() => {
    if (mc.missionPhase !== "deploying" || !mc.missionModalOpen) {
      // Clean up if not deploying
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    const es = new EventSource("/api/agents/mission/stream");
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "log":
            addMissionLog({
              id: data.id,
              timestamp: data.timestamp,
              agentId: data.agentId,
              level: data.level,
              message: data.message,
            });
            break;

          case "agent_status": {
            const update: Partial<MissionAgentClientState> = {
              status: data.status,
            };
            if (data.error) update.error = data.error;
            if (data.result) {
              update.itemCount = data.result.data?.length || 0;
              update.processingTimeMs = data.result.processingTimeMs || 0;
              if (data.status === "completed") update.completedAt = Date.now();

              // Merge results by ID (micro-agents send cumulative lists per agent)
              if (data.result.data?.length > 0) {
                const newItems: AgentIntelItemClient[] = data.result.data.map(
                  (item: Record<string, unknown>) => ({
                    id: String(item.id || ""),
                    title: String(item.title || ""),
                    summary: String(item.summary || ""),
                    latitude: Number(item.latitude) || 0,
                    longitude: Number(item.longitude) || 0,
                    category: String(item.category || ""),
                    subcategory: String(item.subcategory || ""),
                    confidence: Number(item.confidence) || 0,
                    sourceUrl: String(item.sourceUrl || ""),
                    timestamp: String(item.timestamp || ""),
                  })
                );
                const existing = useWorldViewStore.getState().missionControl.missionResults;
                const existingIds = new Set(existing.map((i) => i.id));
                const uniqueNew = newItems.filter((i) => !existingIds.has(i.id));
                if (uniqueNew.length > 0) {
                  setMissionResults([...existing, ...uniqueNew]);
                }
              }
            }
            updateAgentState(data.agentId, update);
            break;
          }

          case "phase":
            setMissionPhase(data.phase);
            break;

          case "connected":
            // SSE connected, no action needed
            break;
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // EventSource will auto-reconnect, but if mission is done, close
      if (mc.missionPhase !== "deploying") {
        es.close();
        eventSourceRef.current = null;
      }
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [mc.missionPhase, mc.missionModalOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── API actions ────────────────────────────────────────────────

  const deploy = useCallback(
    async (area: DeploymentAreaClient, prompts?: Record<string, string>) => {
      // Initialize agent states for UI display
      const agentIds = mc.agentStates
        .filter((a) => a.status !== "skipped")
        .map((a) => a.agentId);

      setMissionPhase("deploying");

      try {
        await fetch("/api/agents/mission", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "deploy",
            area,
            agentIds: agentIds.length > 0 ? agentIds : undefined,
            prompts,
          }),
        });
      } catch {
        setMissionPhase("aborted");
      }
    },
    [mc.agentStates, setMissionPhase]
  );

  const abort = useCallback(async () => {
    try {
      await fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "abort" }),
      });
    } catch {
      // ignore
    }
  }, []);

  const pauseAgentAction = useCallback(async (agentId: string) => {
    try {
      await fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pause", agentId }),
      });
      updateAgentState(agentId, { status: "paused" });
    } catch {
      // ignore
    }
  }, [updateAgentState]);

  const resumeAgentAction = useCallback(async (agentId: string) => {
    try {
      await fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resume", agentId }),
      });
      updateAgentState(agentId, { status: "running" });
    } catch {
      // ignore
    }
  }, [updateAgentState]);

  const cancelAgentAction = useCallback(async (agentId: string) => {
    try {
      await fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel", agentId }),
      });
      updateAgentState(agentId, { status: "cancelled" });
    } catch {
      // ignore
    }
  }, [updateAgentState]);

  const skipAgentAction = useCallback(async (agentId: string) => {
    try {
      await fetch("/api/agents/mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "skip", agentId }),
      });
      updateAgentState(agentId, { status: "skipped" });
    } catch {
      // ignore
    }
  }, [updateAgentState]);

  const initAgentStates = useCallback(() => {
    const states: MissionAgentClientState[] = Object.entries(AGENT_INFO).map(
      ([id, info]) => ({
        agentId: id,
        agentName: info.name,
        role: info.role,
        status: "pending" as const,
        systemPrompt: "",
        itemCount: 0,
        processingTimeMs: 0,
      })
    );
    setAgentStates(states);

    // Fetch actual system prompts from server
    fetch("/api/agents/mission")
      .then((r) => r.json())
      .then((data) => {
        if (data.mission?.agents) {
          const updated: MissionAgentClientState[] = data.mission.agents.map(
            (a: { agentId: string; systemPrompt: string; status: string }) => ({
              agentId: a.agentId,
              agentName: AGENT_INFO[a.agentId]?.name || a.agentId,
              role: AGENT_INFO[a.agentId]?.role || "",
              status: a.status || "pending",
              systemPrompt: a.systemPrompt,
              itemCount: 0,
              processingTimeMs: 0,
            })
          );
          setAgentStates(updated);
        }
      })
      .catch(() => {});
  }, [setAgentStates]);

  return {
    missionControl: mc,
    deploy,
    abort,
    pauseAgent: pauseAgentAction,
    resumeAgent: resumeAgentAction,
    cancelAgent: cancelAgentAction,
    skipAgent: skipAgentAction,
    initAgentStates,
    clearMission,
  };
}
