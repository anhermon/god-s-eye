"use client";

import { useEffect, useRef, useCallback } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";
import type { AgentSwarmState, AgentResultSummary } from "@/types";

const POLL_IDLE_MS = 10_000;
const POLL_RUNNING_MS = 3_000;

// Agent ID → display name mapping
const AGENT_NAMES: Record<string, string> = {
  "news-scout": "News Scout",
  "military-analyst": "Military Analyst",
  "disaster-monitor": "Disaster Monitor",
  "geoint-analyst": "GEOINT Analyst",
};

interface SwarmApiResponse {
  running: boolean;
  lastRun: number;
  totalItems: number;
  ollamaConnected: boolean;
  modelName: string | null;
  agentResults: Array<{
    agentId: string;
    success: boolean;
    data: unknown[];
    error?: string;
    processingTimeMs: number;
  }>;
}

function mapApiToState(data: SwarmApiResponse): AgentSwarmState {
  const agentResults: AgentResultSummary[] = (data.agentResults || []).map(
    (r) => ({
      agentId: r.agentId,
      agentName: AGENT_NAMES[r.agentId] || r.agentId,
      success: r.success,
      itemCount: r.data?.length ?? 0,
      processingTimeMs: r.processingTimeMs,
      error: r.error,
    })
  );

  return {
    ollamaConnected: data.ollamaConnected,
    modelName: data.modelName,
    running: data.running,
    lastRun: data.lastRun,
    totalItems: data.totalItems,
    agentResults,
  };
}

export function useAgentSwarm() {
  const status = useWorldViewStore((s) => s.agentSwarmStatus);
  const setStatus = useWorldViewStore((s) => s.setAgentSwarmStatus);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const poll = useCallback(async () => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch("/api/agents", {
        signal: abortRef.current.signal,
      });
      if (res.ok) {
        const data: SwarmApiResponse = await res.json();
        setStatus(mapApiToState(data));
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        // Ollama is probably offline — mark as disconnected
        setStatus({
          ...status,
          ollamaConnected: false,
          running: false,
        });
      }
    }
  }, [setStatus, status]);

  // Poll on mount and adjust interval based on running state
  useEffect(() => {
    poll();

    const interval = status.running ? POLL_RUNNING_MS : POLL_IDLE_MS;
    intervalRef.current = setInterval(poll, interval);

    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status.running]); // eslint-disable-line react-hooks/exhaustive-deps

  const runSwarm = useCallback(async () => {
    try {
      setStatus({ ...status, running: true });
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      if (res.ok) {
        // Immediately poll to get fresh results
        await poll();
      }
    } catch {
      await poll();
    }
  }, [status, setStatus, poll]);

  const resetConnection = useCallback(async () => {
    try {
      await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      // Re-poll to get updated status
      await poll();
    } catch {
      // ignore
    }
  }, [poll]);

  return { status, runSwarm, resetConnection };
}
