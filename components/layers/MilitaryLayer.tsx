"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Cesium from "cesium";
import { useMilitary } from "@/hooks/useMilitary";
import { useWorldViewStore, type Viewport } from "@/stores/worldview-store";
import { getCategoryIcon, createInfoBoxImage, CATEGORY_COLORS } from "@/lib/military-icons";
import type { MilitaryCategory, MilitaryAction } from "@/types";

interface Props {
  viewer: Cesium.Viewer;
}

const CATEGORY_LABELS: Record<MilitaryCategory, string> = {
  airstrikes: "AIR",
  missileStrikes: "MSL",
  groundOps: "GND",
  navalOps: "NAV",
  other: "MIL",
};

/** Altitude threshold: below this, show info box billboards for nearby events */
const INFOBOX_ALT_THRESHOLD = 500_000; // 500km
/** Max distance (degrees) from camera center to show info boxes */
const INFOBOX_RADIUS_DEG = 3; // ~300km at equator

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function MilitaryLayer({ viewer }: Props) {
  const { actions } = useMilitary(true);
  const dsRef = useRef<Cesium.CustomDataSource | null>(null);
  const infoboxDsRef = useRef<Cesium.CustomDataSource | null>(null);
  const setSelectedEntity = useWorldViewStore((s) => s.setSelectedEntity);
  const flyTo = useWorldViewStore((s) => s.flyTo);
  const militaryFilters = useWorldViewStore((s) => s.militaryFilters);
  const viewport = useWorldViewStore((s) => s.viewport);
  const prevViewportRef = useRef<Viewport | null>(null);

  // Mount datasources + click handler
  useEffect(() => {
    const ds = new Cesium.CustomDataSource("military");
    const infoDs = new Cesium.CustomDataSource("military-infobox");
    viewer.dataSources.add(ds);
    viewer.dataSources.add(infoDs);
    dsRef.current = ds;
    infoboxDsRef.current = infoDs;

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction(
      (click: { position: Cesium.Cartesian2 }) => {
        const picked = viewer.scene.pick(click.position);
        if (Cesium.defined(picked) && picked.id?._militaryData) {
          const d = picked.id._militaryData as MilitaryAction;
          setSelectedEntity({
            id: d.id,
            type: "military",
            name: d.title,
            details: {
              Category: d.category.toUpperCase(),
              Location: d.location,
              Mentions: d.numMentions,
              ...(d.actor1 ? { Actor1: d.actor1 } : {}),
              ...(d.actor2 ? { Actor2: d.actor2 } : {}),
              "Goldstein": d.goldsteinScale,
              URL: d.sourceUrl,
            },
            lon: d.longitude,
            lat: d.latitude,
            alt: 300_000,
          });
          flyTo(d.longitude, d.latitude, 300_000);
        }
      },
      Cesium.ScreenSpaceEventType.LEFT_CLICK
    );

    return () => {
      handler.destroy();
      if (dsRef.current) viewer.dataSources.remove(dsRef.current, true);
      if (infoboxDsRef.current) viewer.dataSources.remove(infoboxDsRef.current, true);
    };
  }, [viewer, setSelectedEntity, flyTo]);

  // Update icon entities when data or filters change
  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;
    ds.entities.removeAll();

    const filtered = actions.filter((a) => militaryFilters[a.category]);

    for (const action of filtered) {
      const color = CATEGORY_COLORS[action.category];
      const label = CATEGORY_LABELS[action.category];
      const iconUrl = getCategoryIcon(action.category);

      const entity = ds.entities.add({
        position: Cesium.Cartesian3.fromDegrees(action.longitude, action.latitude),
        billboard: {
          image: iconUrl,
          width: 24,
          height: 24,
          color: Cesium.Color.WHITE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1_000, 1.4, 8_000_000, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(0, 1, 12_000_000, 0.6),
        },
        label: {
          text: label,
          font: "bold 9px monospace",
          fillColor: Cesium.Color.fromCssColorString(color),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(16, -4),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5_000_000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1_000, 1.2, 5_000_000, 0.7),
        },
      });

      (entity as unknown as Record<string, unknown>)._militaryData = action;
    }
  }, [actions, militaryFilters]);

  // Update info box billboards based on viewport (2nd tier)
  const updateInfoBoxes = useCallback(() => {
    const infoDs = infoboxDsRef.current;
    if (!infoDs) return;

    const alt = viewport.altitude;
    const isZoomed = alt < INFOBOX_ALT_THRESHOLD;

    // Clear if zoomed out
    if (!isZoomed) {
      if (infoDs.entities.values.length > 0) {
        infoDs.entities.removeAll();
      }
      return;
    }

    const filtered = actions.filter((a) => militaryFilters[a.category]);

    // Only show info boxes for actions near camera center
    const nearby = filtered.filter((a) => {
      const dLat = Math.abs(a.latitude - viewport.centerLat);
      const dLon = Math.abs(a.longitude - viewport.centerLon);
      return dLat < INFOBOX_RADIUS_DEG && dLon < INFOBOX_RADIUS_DEG;
    });

    // Limit to nearest 8 to avoid clutter
    const sorted = nearby
      .map((a) => ({
        action: a,
        dist: haversineKm(viewport.centerLat, viewport.centerLon, a.latitude, a.longitude),
      }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);

    infoDs.entities.removeAll();

    for (const { action } of sorted) {
      const infoUrl = createInfoBoxImage(action);

      const entity = infoDs.entities.add({
        position: Cesium.Cartesian3.fromDegrees(action.longitude, action.latitude),
        billboard: {
          image: infoUrl,
          width: 220,
          height: 110,
          pixelOffset: new Cesium.Cartesian2(0, -70),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(10_000, 1, 800_000, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(10_000, 1, 600_000, 0),
        },
      });

      (entity as unknown as Record<string, unknown>)._militaryData = action;
    }
  }, [actions, militaryFilters, viewport]);

  // React to viewport changes for info boxes
  useEffect(() => {
    const prev = prevViewportRef.current;
    // Skip if viewport hasn't meaningfully changed
    if (
      prev &&
      Math.abs(prev.altitude - viewport.altitude) < 5000 &&
      Math.abs(prev.centerLat - viewport.centerLat) < 0.1 &&
      Math.abs(prev.centerLon - viewport.centerLon) < 0.1
    ) {
      return;
    }
    prevViewportRef.current = viewport;
    updateInfoBoxes();
  }, [viewport, updateInfoBoxes]);

  return null;
}
