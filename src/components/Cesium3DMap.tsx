/**
 * Cesium 3D Map Component
 * Full 3D globe with terrain and detailed 3D buildings
 */

import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

// Configure Cesium static assets
declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
window.CESIUM_BASE_URL = '/cesium/';

// Use dynamic import for Cesium to avoid build issues
interface Cesium3DMapProps {
  className?: string;
}

export default function Cesium3DMap({ className }: Cesium3DMapProps) {
  const mapStore = useMapStore();
  const { lat, lng, zoom } = mapStore;
  const pitch = (mapStore as any).pitch || 0;
  const bearing = (mapStore as any).bearing || 0;
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let viewer: any = null;

    const initCesium = async () => {
      if (!containerRef.current) return;

      try {
        // Dynamic import to avoid build issues
        const Cesium = await import('cesium');
        await import('cesium/Build/Cesium/Widgets/widgets.css');

        // Set default terrain provider
        Cesium.Ion.defaultAccessToken = ''; // No Ion token - using free sources

        // Create Cesium viewer
        viewer = new Cesium.Viewer(containerRef.current, {
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
      } catch (error) {
        console.error('Failed to initialize Cesium:', error);
      }
    };

    initCesium();

    // Cleanup on unmount
    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, [lat, lng, zoom, pitch, bearing]);

  return <div ref={containerRef} className={className} style={{ width: '100%', height: '100%' }} />;
}
