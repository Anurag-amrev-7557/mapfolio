/**
 * Cesium 3D Map Component
 * Full 3D globe with terrain and detailed 3D buildings
 */

import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

// Configure Cesium static assets
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
window.CESIUM_BASE_URL = '/cesium/';

// Set default terrain provider
Cesium.Ion.defaultAccessToken = ''; // No Ion token - using free sources

interface Cesium3DMapProps {
  className?: string;
}

export default function Cesium3DMap({ className }: Cesium3DMapProps) {
  const { lat, lng, zoom, pitch, bearing } = useMapStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Cesium viewer
    const viewer = new Cesium.Viewer(containerRef.current, {
      timeline: false,
      animation: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      infoBox: false,
      selectionIndicator: false,
    });

    viewerRef.current = viewer;

    // Set initial camera position
    viewer.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(
        lng,
        lat,
        20000 / Math.pow(2, zoom - 5)
      ),
      orientation: {
        heading: Cesium.Math.toRadians(bearing),
        pitch: Cesium.Math.toRadians(pitch),
        roll: 0,
      },
    });

    // Enable lighting for realistic 3D
    viewer.scene.globe.enableLighting = true;

    // Cleanup on unmount
    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, [lat, lng, zoom, pitch, bearing]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
