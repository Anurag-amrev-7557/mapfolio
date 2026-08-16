/**
 * Photorealistic 3D Globe & Aerial Mesh Engine
 * Powered by CesiumJS with high-resolution satellite photogrammetry,
 * real 3D building meshes, terrain, and atmospheric scattering.
 */

import { useEffect, useRef } from 'react';
import { useMapStore } from '../store/useMapStore';

declare global {
  interface Window {
    CESIUM_BASE_URL: string;
  }
}
window.CESIUM_BASE_URL = '/cesium/';

interface Cesium3DMapProps {
  className?: string;
}

export default function Cesium3DMap({ className }: Cesium3DMapProps) {
  const { lat, lng, zoom, pitch, bearing, setLocation } = useMapStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const isUpdatingFromCesium = useRef(false);

  useEffect(() => {
    let viewer: any = null;
    let removeCameraListener: (() => void) | null = null;

    const initCesium = async () => {
      if (!containerRef.current) return;

      try {
        const Cesium = await import('cesium');
        await import('cesium/Build/Cesium/Widgets/widgets.css');

        // Set Cesium ion Access Token
        const ionToken =
          import.meta.env.VITE_CESIUM_ION_TOKEN ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IkszN1Rtc2FTM0FZS0R3TUMiLCJqdGkiOiJlYjFiMGU3YS0xZjYzLTRiYzctYjQ4Yy00YmZlODYzNWM2N2IiLCJpZCI6NDY4NTQ3LCJzdWIiOiJ3YXJpb3JhIiwiaXNzIjoiaHR0cHM6Ly9hcGkuY2VzaXVtLmNvbSIsImF1ZCI6Im1hcGZvbGlvIiwiaWF0IjoxNzg2ODkwMDI4fQ.MScSaB5JnhnxLbyByTFiuM2HMItm10a403Q5U09q1SU';
        Cesium.Ion.defaultAccessToken = ionToken;

        // High-res Global Aerial Imagery Provider
        const imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
          maximumLevel: 19,
          credit: 'Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        });

        // Initialize Photorealistic Cesium Viewer
        viewer = new Cesium.Viewer(containerRef.current, {
          baseLayer: new Cesium.ImageryLayer(imageryProvider),
          timeline: false,
          animation: false,
          baseLayerPicker: false,
          geocoder: false,
          homeButton: false,
          sceneModePicker: false,
          navigationHelpButton: false,
          infoBox: false,
          selectionIndicator: false,
          shouldAnimate: false,
        } as any);

        viewerRef.current = viewer;

        // Enhanced Real-World Atmospheric Lighting & Sun Shadows
        viewer.scene.globe.enableLighting = true;
        viewer.scene.fog.enabled = true;
        viewer.scene.globe.depthTestAgainstTerrain = true;
        if (viewer.scene.skyAtmosphere) {
          viewer.scene.skyAtmosphere.show = true;
        }

        // Load Global 3D World Terrain
        try {
          const worldTerrain = await Cesium.createWorldTerrainAsync();
          viewer.terrainProvider = worldTerrain;
        } catch (_) {}

        // Add 3D OSM Building Meshes with real architectural heights
        try {
          const osmBuildings = await Cesium.createOsmBuildingsAsync();
          viewer.scene.primitives.add(osmBuildings);
        } catch (_) {}

        // Calculate altitude from map zoom
        const altitude = 40000000 / Math.pow(2, zoom);

        // Position initial camera
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(lng, lat, altitude),
          orientation: {
            heading: Cesium.Math.toRadians(bearing || 0),
            pitch: Cesium.Math.toRadians(pitch ? -pitch : -45),
            roll: 0,
          },
        });

        // Sync camera changes back to useMapStore on user interaction
        let moveTimer: any = null;
        removeCameraListener = viewer.camera.changed.addEventListener(() => {
          if (moveTimer) clearTimeout(moveTimer);
          moveTimer = setTimeout(() => {
            if (!viewer || isUpdatingFromCesium.current) return;
            try {
              const cartographic = viewer.camera.positionCartographic;
              if (cartographic) {
                const currentLng = Cesium.Math.toDegrees(cartographic.longitude);
                const currentLat = Cesium.Math.toDegrees(cartographic.latitude);
                const currentHeight = cartographic.height;
                const calcZoom = Math.max(1, Math.min(20, Math.log2(40000000 / Math.max(10, currentHeight))));
                const currentHeading = Cesium.Math.toDegrees(viewer.camera.heading);
                const currentPitch = Math.abs(Cesium.Math.toDegrees(viewer.camera.pitch));

                isUpdatingFromCesium.current = true;
                setLocation(currentLat, currentLng, calcZoom, currentPitch, currentHeading);
                setTimeout(() => {
                  isUpdatingFromCesium.current = false;
                }, 100);
              }
            } catch (_) {}
          }, 60);
        });
      } catch (error) {
        console.error('Failed to initialize Cesium 3D Photoreal Engine:', error);
      }
    };

    initCesium();

    return () => {
      if (removeCameraListener) removeCameraListener();
      if (viewer && !viewer.isDestroyed()) {
        viewer.destroy();
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={className || 'w-full h-full absolute inset-0'}
      style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
    />
  );
}
