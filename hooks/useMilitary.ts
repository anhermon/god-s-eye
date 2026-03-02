"use client";

import { useState, useEffect, useRef } from "react";
import type { MilitaryAction } from "@/types";
import { useWorldViewStore } from "@/stores/worldview-store";

export function useMilitary(enabled: boolean) {
  const [actions, setActions] = useState<MilitaryAction[]>([]);
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const setMilitaryActions = useWorldViewStore((s) => s.setMilitaryActions);

  useEffect(() => {
    if (!enabled) {
      setActions([]);
      setMilitaryActions([]);
      return;
    }

    const fetchData = async () => {
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setLoading(true);
      try {
        const res = await fetch("/api/military", {
          signal: abortRef.current.signal,
        });
        if (res.ok) {
          const data: MilitaryAction[] = await res.json();
          setActions(data);
          setMilitaryActions(data);
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Military fetch error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    intervalRef.current = setInterval(fetchData, 300_000); // 5 min

    return () => {
      abortRef.current?.abort();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, setMilitaryActions]);

  return { actions, loading };
}
