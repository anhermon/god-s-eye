"use client";

import { useEffect, useRef, useCallback } from "react";
import * as Cesium from "cesium";
import { useWorldViewStore } from "@/stores/worldview-store";

interface Props {
  viewer: Cesium.Viewer;
}

/**
 * DeploymentLayer — handles pin-drop targeting on the globe.
 * When deploymentMode is true, clicking the globe sets a deployment area
 * and renders a center pin + semi-transparent radius circle.
 */
export default function DeploymentLayer({ viewer }: Props) {
  const deploymentMode = useWorldViewStore((s) => s.missionControl.deploymentMode);
  const deploymentArea = useWorldViewStore((s) => s.missionControl.deploymentArea);
  const setDeploymentArea = useWorldViewStore((s) => s.setDeploymentArea);
  const openMissionModal = useWorldViewStore((s) => s.openMissionModal);
  const dsRef = useRef<Cesium.CustomDataSource | null>(null);
  const handlerRef = useRef<Cesium.ScreenSpaceEventHandler | null>(null);

  // Mount datasource
  useEffect(() => {
    const ds = new Cesium.CustomDataSource("deployment");
    viewer.dataSources.add(ds);
    dsRef.current = ds;

    return () => {
      if (dsRef.current) {
        viewer.dataSources.remove(dsRef.current, true);
        dsRef.current = null;
      }
    };
  }, [viewer]);

  // Handle click to place pin
  const handleGlobeClick = useCallback(
    (click: { position: Cesium.Cartesian2 }) => {
      if (!deploymentMode) return;

      const cartesian = viewer.camera.pickEllipsoid(
        click.position,
        viewer.scene.globe.ellipsoid
      );
      if (!cartesian) return;

      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lon = Cesium.Math.toDegrees(carto.longitude);

      // Default 200km radius
      const currentRadius = useWorldViewStore.getState().missionControl.deploymentArea?.radiusKm || 200;
      setDeploymentArea({ lat, lon, radiusKm: currentRadius });
      openMissionModal();
    },
    [deploymentMode, viewer, setDeploymentArea, openMissionModal]
  );

  // Register/unregister click handler based on deploymentMode
  useEffect(() => {
    if (viewer.isDestroyed()) return;

    if (deploymentMode) {
      const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
      handler.setInputAction(
        handleGlobeClick,
        Cesium.ScreenSpaceEventType.LEFT_CLICK
      );
      handlerRef.current = handler;

      // Change cursor to crosshair
      viewer.scene.canvas.style.cursor = "crosshair";
    } else {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (!viewer.isDestroyed()) {
        viewer.scene.canvas.style.cursor = "";
      }
    }

    return () => {
      if (handlerRef.current) {
        handlerRef.current.destroy();
        handlerRef.current = null;
      }
      if (!viewer.isDestroyed()) {
        viewer.scene.canvas.style.cursor = "";
      }
    };
  }, [deploymentMode, viewer, handleGlobeClick]);

  // Render pin + radius circle when deploymentArea is set
  useEffect(() => {
    const ds = dsRef.current;
    if (!ds) return;
    ds.entities.removeAll();

    if (!deploymentArea) return;

    const { lat, lon, radiusKm } = deploymentArea;

    // Center pin point
    ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromCssColorString("#00ff41"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1_000, 1.5, 8_000_000, 0.5),
      },
      label: {
        text: `DEPLOY ZONE\n${lat.toFixed(4)}°, ${lon.toFixed(4)}°\n${radiusKm}km`,
        font: "bold 10px monospace",
        fillColor: Cesium.Color.fromCssColorString("#00ff41"),
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, -30),
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        scaleByDistance: new Cesium.NearFarScalar(1_000, 1.2, 5_000_000, 0.5),
      },
    });

    // Radius circle (semi-transparent green ellipse on the ground)
    ds.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat),
      ellipse: {
        semiMajorAxis: radiusKm * 1000,
        semiMinorAxis: radiusKm * 1000,
        material: Cesium.Color.fromCssColorString("#00ff41").withAlpha(0.08),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString("#00ff41").withAlpha(0.5),
        outlineWidth: 2,
        height: 0,
      },
    });
  }, [deploymentArea]);

  return null;
}
