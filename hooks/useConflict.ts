"use client";

import { useState, useEffect } from "react";
import type { ConflictEvent, ConflictFeatureType } from "@/types";
import { useWorldViewStore } from "@/stores/worldview-store";

interface GeoJsonFeature {
  type: "Feature";
  geometry: {
    type: string;
    coordinates: number[] | number[][];
  };
  properties: Record<string, unknown>;
}

interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

function parseFeature(f: GeoJsonFeature, idx: number): ConflictEvent | null {
  const p = f.properties;
  const featureType = (p.feature_type as ConflictFeatureType) || null;

  if (!featureType || !["launch_point", "target_point", "attack_arc"].includes(featureType)) {
    return null;
  }

  // For Point features
  if (f.geometry.type === "Point") {
    const [lon, lat] = f.geometry.coordinates as number[];
    if (!lon || !lat) return null;

    return {
      id: `conflict-${idx}`,
      featureType,
      latitude: lat,
      longitude: lon,
      waveNumber: (p.wave_number as number) ?? 0,
      waveCodename: (p.wave_codename as string) ?? "Unknown",
      announcedUtc: (p.announced_utc as string) ?? "",
      conflictDay: (p.conflict_day as number) ?? 0,
      payload: (p.payload as string) ?? "",
      dronesUsed: Boolean(p.drones_used),
      ballisticMissilesUsed: Boolean(p.ballistic_missiles_used),
      cruiseMissilesUsed: Boolean(p.cruise_missiles_used),
      launchLabel: (p.launch_label as string) ?? undefined,
      targetName: (p.target_name as string) ?? undefined,
      targetType: (p.target_type as string) ?? undefined,
      targetCountry: (p.target_country as string) ?? undefined,
    };
  }

  // For LineString attack arcs
  if (f.geometry.type === "LineString") {
    const coords = f.geometry.coordinates as number[][];
    if (!coords || coords.length < 2) return null;
    const [startLon, startLat] = coords[0];

    return {
      id: `conflict-arc-${idx}`,
      featureType: "attack_arc",
      latitude: startLat,
      longitude: startLon,
      arcCoordinates: coords.map(([lon, lat]) => [lon, lat] as [number, number]),
      waveNumber: (p.wave_number as number) ?? 0,
      waveCodename: (p.wave_codename as string) ?? "Unknown",
      announcedUtc: (p.announced_utc as string) ?? "",
      conflictDay: (p.conflict_day as number) ?? 0,
      payload: (p.payload as string) ?? "",
      dronesUsed: Boolean(p.drones_used),
      ballisticMissilesUsed: Boolean(p.ballistic_missiles_used),
      cruiseMissilesUsed: Boolean(p.cruise_missiles_used),
    };
  }

  return null;
}

export function useConflict(enabled: boolean) {
  const [events, setEvents] = useState<ConflictEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const setConflictEvents = useWorldViewStore((s) => s.setConflictEvents);

  useEffect(() => {
    if (!enabled) {
      setEvents([]);
      setConflictEvents([]);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/data/iran-conflict-tp4.geojson");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const geojson: GeoJsonCollection = await res.json();

        const parsed: ConflictEvent[] = [];
        geojson.features.forEach((f, i) => {
          const ev = parseFeature(f, i);
          if (ev) parsed.push(ev);
        });

        if (!cancelled) {
          setEvents(parsed);
          setConflictEvents(parsed);
        }
      } catch (err) {
        console.error("Conflict data fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [enabled, setConflictEvents]);

  return { events, loading };
}
