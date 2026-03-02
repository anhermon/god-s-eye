"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import * as Cesium from "cesium";
import "cesium/Build/Cesium/Widgets/widgets.css";
import {
  initCesium,
  createDarkImageryProvider,
  createSatelliteImageryProvider,
  createLabelsOverlayProvider,
  createWorldTerrain,
  createOsmBuildings,
  hasIonToken,
  viewerOptions,
} from "@/lib/cesium-config";
import type { MapStyle } from "@/types";
import { useWorldViewStore } from "@/stores/worldview-store";
import { haversineKm } from "@/lib/utils";
import FlightLayer from "@/components/layers/FlightLayer";
import SatelliteLayer from "@/components/layers/SatelliteLayer";
import DisasterLayer from "@/components/layers/DisasterLayer";
import AsteroidLayer from "@/components/layers/AsteroidLayer";
import WeatherLayer from "@/components/layers/WeatherLayer";
import CameraLayer from "@/components/layers/CameraLayer";
import LiveStreamLayer from "@/components/layers/LiveStreamLayer";
import NewsLayer from "@/components/layers/NewsLayer";
import MilitaryLayer from "@/components/layers/MilitaryLayer";
import DeploymentLayer from "@/components/layers/DeploymentLayer";

export default function Globe() {
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const setCursorPosition = useWorldViewStore((s) => s.setCursorPosition);
  const setViewer = useWorldViewStore((s) => s.setViewer);
  const setViewport = useWorldViewStore((s) => s.setViewport);
  const layers = useWorldViewStore((s) => s.layers);
  const mapStyle = useWorldViewStore((s) => s.mapStyle);
  const buildingsTilesetRef = useRef<Cesium.Cesium3DTileset | null>(null);
  const lastViewportRef = useRef({ lat: 30.2672, lon: -97.7431, alt: 15_000_000 });

  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    initCesium();

    const viewer = new Cesium.Viewer(containerRef.current, {
      ...viewerOptions,
      baseLayer: false,
    });

    // Add dark map tiles
    viewer.imageryLayers.addImageryProvider(createDarkImageryProvider());

    // Dark space background
    viewer.scene.backgroundColor = Cesium.Color.fromCssColorString("#000a00");
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#001200");
    viewer.scene.globe.showGroundAtmosphere = false;
    viewer.scene.fog.enabled = false;

    // Green glow on the globe edges for that NV feel
    if (viewer.scene.globe) {
      viewer.scene.globe.enableLighting = false;
    }

    // Set initial camera to show the earth from a nice angle
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(-97.7431, 30.2672, 15000000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
    });

    viewerRef.current = viewer;
    setViewer(viewer);
    setViewerReady(true);

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
        setViewer(null);
        setViewerReady(false);
      }
    };
  }, [setViewer]);

  // Apply map style changes (imagery, terrain, buildings)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    const applyStyle = async (style: MapStyle) => {
      // Remove all existing imagery layers
      viewer.imageryLayers.removeAll();

      // Remove existing buildings tileset
      if (buildingsTilesetRef.current) {
        viewer.scene.primitives.remove(buildingsTilesetRef.current);
        buildingsTilesetRef.current = null;
      }

      if (style === "dark") {
        // Flat dark tiles, no terrain
        viewer.imageryLayers.addImageryProvider(createDarkImageryProvider());
        viewer.scene.terrainProvider = new Cesium.EllipsoidTerrainProvider();
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#001200");
        viewer.scene.globe.enableLighting = false;
        viewer.scene.globe.showGroundAtmosphere = false;
      } else if (style === "terrain" || style === "city") {
        if (!hasIonToken()) {
          // Fall back to dark if no Ion token
          viewer.imageryLayers.addImageryProvider(createDarkImageryProvider());
          console.warn("NEXT_PUBLIC_CESIUM_ION_TOKEN not set — terrain/city modes require a free Cesium Ion token");
          return;
        }

        // Satellite imagery + world terrain
        const satImagery = await createSatelliteImageryProvider();
        viewer.imageryLayers.addImageryProvider(satImagery);
        try {
          viewer.scene.terrainProvider = await createWorldTerrain();
        } catch (e) {
          console.error("Failed to load Cesium World Terrain:", e);
        }

        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1a2a");
        viewer.scene.globe.enableLighting = true;
        viewer.scene.globe.showGroundAtmosphere = true;

        // Add labels overlay + 3D buildings for city mode
        if (style === "city") {
          viewer.imageryLayers.addImageryProvider(createLabelsOverlayProvider());

          try {
            const tileset = await createOsmBuildings();
            viewer.scene.primitives.add(tileset);
            buildingsTilesetRef.current = tileset;
          } catch (e) {
            console.error("Failed to load OSM Buildings:", e);
          }
        }
      }
    };

    applyStyle(mapStyle);
  }, [mapStyle, viewerReady]);

  // Track camera movement and update viewport state (debounced)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || viewer.isDestroyed()) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const onMoveEnd = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (!viewer || viewer.isDestroyed()) return;
        const carto = viewer.camera.positionCartographic;
        const lat = Cesium.Math.toDegrees(carto.latitude);
        const lon = Cesium.Math.toDegrees(carto.longitude);
        const alt = carto.height;

        const prev = lastViewportRef.current;
        const distMoved = haversineKm(prev.lat, prev.lon, lat, lon);
        const altRatio = prev.alt > 0 ? Math.abs(alt - prev.alt) / prev.alt : 1;

        // Only update if moved >150km or altitude changed >50%
        if (distMoved < 150 && altRatio < 0.5) return;

        lastViewportRef.current = { lat, lon, alt };
        setViewport({
          centerLat: lat,
          centerLon: lon,
          altitude: alt,
          radiusKm: Math.min((alt * 2.5) / 1000, 20000),
          isZoomedIn: alt < 5_000_000,
        });
      }, 300);
    };

    viewer.camera.moveEnd.addEventListener(onMoveEnd);
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (!viewer.isDestroyed()) {
        viewer.camera.moveEnd.removeEventListener(onMoveEnd);
      }
    };
  }, [viewerReady, setViewport]);

  // Track mouse position on globe
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!viewerRef.current) return;
      const viewer = viewerRef.current;
      const cartesian = viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(e.nativeEvent.offsetX, e.nativeEvent.offsetY),
        viewer.scene.globe.ellipsoid
      );
      if (cartesian) {
        const carto = Cesium.Cartographic.fromCartesian(cartesian);
        setCursorPosition({
          lat: Cesium.Math.toDegrees(carto.latitude),
          lon: Cesium.Math.toDegrees(carto.longitude),
          alt: viewer.camera.positionCartographic.height,
        });
      }
    },
    [setCursorPosition]
  );

  return (
    <div className="w-full h-full relative">
      <div
        ref={containerRef}
        className="w-full h-full"
        onMouseMove={handleMouseMove}
      />
      {viewerReady && viewerRef.current && (
        <>
          {layers.flights && <FlightLayer viewer={viewerRef.current} />}
          {layers.satellites && <SatelliteLayer viewer={viewerRef.current} />}
          {layers.disasters && <DisasterLayer viewer={viewerRef.current} />}
          {layers.asteroids && <AsteroidLayer viewer={viewerRef.current} />}
          {layers.weather && <WeatherLayer viewer={viewerRef.current} />}
          {layers.cameras && <CameraLayer viewer={viewerRef.current} />}
          {layers.livestreams && <LiveStreamLayer viewer={viewerRef.current} />}
          {layers.news && <NewsLayer viewer={viewerRef.current} />}
          {layers.militaryActions && <MilitaryLayer viewer={viewerRef.current} />}
          <DeploymentLayer viewer={viewerRef.current} />
        </>
      )}
    </div>
  );
}
