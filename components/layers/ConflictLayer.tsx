"use client";

import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { useConflict } from "@/hooks/useConflict";
import { useWorldViewStore } from "@/stores/worldview-store";
import type { ConflictEvent, ConflictFeatureType } from "@/types";

interface Props {
  viewer: Cesium.Viewer;
}

// Color scheme: Iran/Iraq launch = red/orange, Israeli targets = yellow/amber, arcs = dim orange
const FEATURE_COLORS: Record<ConflictFeatureType, Cesium.Color> = {
  launch_point: Cesium.Color.fromCssColorString("#ff3300").withAlpha(0.9),
  target_point: Cesium.Color.fromCssColorString("#ffcc00").withAlpha(0.9),
  attack_arc: Cesium.Color.fromCssColorString("#ff6600").withAlpha(0.4),
};

const FEATURE_LABELS: Record<ConflictFeatureType, string> = {
  launch_point: "LAUNCH",
  target_point: "TARGET",
  attack_arc: "TRAJ",
};

function getMunitionLabel(ev: ConflictEvent): string {
  const types: string[] = [];
  if (ev.ballisticMissilesUsed) types.push("BALISTIC");
  if (ev.cruiseMissilesUsed) types.push("CRUISE");
  if (ev.dronesUsed) types.push("UAV");
  return types.join("/") || "UNKNOWN";
}

export default function ConflictLayer({ viewer }: Props) {
  const { events } = useConflict(true);
  const dsRef = useRef<Cesium.CustomDataSource | null>(null);
  const setSelectedEntity = useWorldViewStore((s) => s.setSelectedEntity);
  const flyTo = useWorldViewStore((s) => s.flyTo);
  const simulationDate = useWorldViewStore((s) => s.simulationDate);
  const isLive = useWorldViewStore((s) => s.isLive);

  // Mount datasource + click handler once
  useEffect(() => {
    const ds = new Cesium.CustomDataSource("iran-conflict");
    viewer.dataSources.add(ds);
    dsRef.current = ds;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(
      (click: { position: Cesium.Cartesian2 }) => {
        const picked = viewer.scene.pick(click.position);
        if (!Cesium.defined(picked)) return;

        if (picked.id?._conflictData) {
          const ev = picked.id._conflictData as ConflictEvent;
          const dateStr = ev.announcedUtc
            ? new Date(ev.announcedUtc).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "Unknown";

          setSelectedEntity({
            id: ev.id,
            type: "military",
            name:
              ev.featureType === "launch_point"
                ? (ev.launchLabel ?? `Wave ${ev.waveNumber} Launch Site`)
                : ev.featureType === "target_point"
                ? (ev.targetName ?? `Wave ${ev.waveNumber} Target`)
                : `Wave ${ev.waveNumber} Trajectory`,
            details: {
              Operation: ev.waveCodename,
              Wave: ev.waveNumber,
              Date: dateStr,
              Day: `D+${ev.conflictDay}`,
              Type: FEATURE_LABELS[ev.featureType],
              Munitions: getMunitionLabel(ev),
              Payload: ev.payload?.slice(0, 60) + (ev.payload?.length > 60 ? "…" : "") || "N/A",
              ...(ev.targetName ? { Target: ev.targetName } : {}),
              ...(ev.targetCountry ? { Country: ev.targetCountry === "IL" ? "Israel" : ev.targetCountry } : {}),
            },
            lon: ev.longitude,
            lat: ev.latitude,
            alt: 1_500_000,
          });
          flyTo(ev.longitude, ev.latitude, 1_500_000);
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    return () => {
      handler.destroy();
      if (dsRef.current) viewer.dataSources.remove(dsRef.current, true);
    };
  }, [viewer, setSelectedEntity, flyTo]);

  // Rebuild entities when data changes or simulation date changes
  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;
    ds.entities.removeAll();

    // In historical mode, filter to events at or before the simulated date
    const cutoff = isLive ? null : simulationDate;

    const filtered = cutoff
      ? events.filter((ev) => {
          if (!ev.announcedUtc) return true;
          return new Date(ev.announcedUtc) <= cutoff;
        })
      : events;

    for (const ev of filtered) {
      const color = FEATURE_COLORS[ev.featureType];

      if (ev.featureType === "attack_arc" && ev.arcCoordinates) {
        // Render trajectory as a polyline on the ellipsoid
        const positions = ev.arcCoordinates.map(([lon, lat]) =>
          Cesium.Cartesian3.fromDegrees(lon, lat, 50_000)
        );
        const entity = ds.entities.add({
          polyline: {
            positions,
            width: 1.5,
            material: new Cesium.PolylineDashMaterialProperty({
              color,
              dashLength: 18,
            }),
            clampToGround: false,
            arcType: Cesium.ArcType.GEODESIC,
          },
        });
        (entity as unknown as Record<string, unknown>)._conflictData = ev;
        continue;
      }

      if (ev.featureType === "launch_point" || ev.featureType === "target_point") {
        const isTarget = ev.featureType === "target_point";
        const entity = ds.entities.add({
          position: Cesium.Cartesian3.fromDegrees(ev.longitude, ev.latitude, 5_000),
          point: {
            pixelSize: isTarget ? 8 : 10,
            color,
            outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
            outlineWidth: 1,
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
          },
          label: {
            text: isTarget
              ? (ev.targetName ?? "TARGET").slice(0, 16).toUpperCase()
              : `W${ev.waveNumber}`,
            font: "bold 8px monospace",
            fillColor: color,
            outlineColor: Cesium.Color.BLACK,
            outlineWidth: 2,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            pixelOffset: new Cesium.Cartesian2(0, -16),
            heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
            disableDepthTestDistance: Number.POSITIVE_INFINITY,
            show: true,
          },
        });
        (entity as unknown as Record<string, unknown>)._conflictData = ev;
      }
    }
  }, [events, simulationDate, isLive]);

  return null;
}
