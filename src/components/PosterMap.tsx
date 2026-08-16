import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../store/useMapStore';
import { getTheme } from '../constants/themes';
import { generateMapStyle } from '../utils/generateMapStyle';
import { MapPin, Star, Heart, Flag, Target, Crosshair, Home, Landmark, Compass } from 'lucide-react';
import { useEffect, useMemo, useRef, useCallback } from 'react';
import { smoothCoordinatesChaikin, computePolylineTotalDistance, interpolatePolylineByDistance, m3EmphasizedEasing } from '../utils/routing';

// Optimize vector tile parser concurrency across CPU cores
if (typeof navigator !== 'undefined') {
  maplibregl.workerCount = Math.min(navigator.hardwareConcurrency || 4, 6);
}

interface PosterMapProps {
  interactive?: boolean;
  scaleFactor?: number;
  mapLocked?: boolean;
  rotationEnabled?: boolean;
  bgZoomOffset?: number;
}

export default function PosterMap({ 
  interactive = true, 
  mapLocked = false, 
  rotationEnabled = false,
  bgZoomOffset = 2.5
}: PosterMapProps) {
  const {
    lat,
    lng,
    zoom,
    pitch,
    bearing,
    themeId,
    activeLayout,
    colorOverrides,
    layerVisibility,
    setLocation,
    markers,
    addMarker,
    deleteMarker,
    route,
    isDrawingRoute,
    routeWaypoints,
    addRouteWaypoint,
    customThemes,
    heatmapData,
  } = useMapStore();

  const mapRef = useRef<MapRef>(null);
  const effectiveZoom = interactive ? zoom : Math.max(1, zoom - bgZoomOffset);

  // Compute effective palette for map layers
  const effectivePalette = useMemo(() => {
    const basePalette = getTheme(themeId, customThemes).palette;
    return {
      ...basePalette,
      land: colorOverrides.land ?? basePalette.land,
      landcover: colorOverrides.landcover ?? basePalette.landcover,
      water: colorOverrides.water ?? basePalette.water,
      waterway: colorOverrides.waterway ?? basePalette.waterway,
      parks: colorOverrides.parks ?? basePalette.parks,
      buildings: colorOverrides.buildings ?? basePalette.buildings,
      aeroway: colorOverrides.aeroway ?? basePalette.aeroway,
      rail: colorOverrides.rail ?? basePalette.rail,
      roads: {
        ...basePalette.roads,
        major: colorOverrides.roadsMajor ?? basePalette.roads.major,
        minor_high: colorOverrides.roadsMinorHigh ?? basePalette.roads.minor_high,
        minor_mid: colorOverrides.roadsMinorMid ?? basePalette.roads.minor_mid,
        minor_low: colorOverrides.roadsMinorLow ?? basePalette.roads.minor_low,
        path: colorOverrides.roadsPath ?? basePalette.roads.path,
        outline: colorOverrides.roadsOutline ?? basePalette.roads.outline,
      },
    };
  }, [themeId, customThemes, colorOverrides]);

  // Rebuild base style when structure/layers/heatmap change
  const mapStyle = useMemo(() => {
    return generateMapStyle(effectivePalette, layerVisibility, heatmapData);
  }, [effectivePalette, layerVisibility, heatmapData]);

  const wpKey = useMemo(() => {
    return routeWaypoints.map((w) => `${w.lat.toFixed(5)},${w.lng.toFixed(5)}`).join('|');
  }, [routeWaypoints]);

  // Robust route GeoJSON: uses high-precision road network geometry with optimistic Chaikin smoothing
  const effectiveRouteGeoJson = useMemo(() => {
    if (route.geojson) return route.geojson;
    if (routeWaypoints.length >= 2) {
      const coords = routeWaypoints.map((w) => [w.lng, w.lat]);
      const smoothed = smoothCoordinatesChaikin(coords as any, 2);
      return {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: smoothed },
      };
    }
    return null;
  }, [route.geojson, wpKey]);

  // 60fps GPU-Native Path Creation Streamer: animates along real road network curves
  const animFrameRef = useRef<number | null>(null);
  const prevAnimTotalDistRef = useRef<number>(0);
  const lastAnimatedCoordsSigRef = useRef<string>('');

  const roadCoords = useMemo(() => {
    return (route.geojson?.geometry?.coordinates as [number, number][]) || 
           (effectiveRouteGeoJson?.geometry?.coordinates as [number, number][]) || 
           null;
  }, [route.geojson, effectiveRouteGeoJson]);

  const roadSig = useMemo(() => {
    if (!roadCoords || roadCoords.length < 2) return '';
    return `${roadCoords.length}-${roadCoords[0]?.[0]}-${roadCoords[0]?.[1]}-${roadCoords[roadCoords.length - 1]?.[0]}-${roadCoords[roadCoords.length - 1]?.[1]}`;
  }, [roadCoords]);

  useEffect(() => {
    if (!roadCoords || roadCoords.length < 2) {
      prevAnimTotalDistRef.current = 0;
      lastAnimatedCoordsSigRef.current = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    if (lastAnimatedCoordsSigRef.current === roadSig) {
      return;
    }
    lastAnimatedCoordsSigRef.current = roadSig;

    const totalDist = computePolylineTotalDistance(roadCoords);
    const prevDist = prevAnimTotalDistRef.current;
    prevAnimTotalDistRef.current = totalDist;

    // Smoothly stream from previous waypoint distance to new waypoint distance along road curves
    const startDist = prevDist > 0 && prevDist < totalDist ? prevDist : 0;
    const deltaDist = totalDist - startDist;
    const startTime = performance.now();
    const duration = Math.min(680, Math.max(340, Math.sqrt(deltaDist) * 16));

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Material Design 3 Emphasized Decelerate Motion Curve (0.05, 0.7, 0.1, 1.0)
      const ease = m3EmphasizedEasing(progress);
      const currentDist = startDist + deltaDist * ease;

      const sampled = interpolatePolylineByDistance(roadCoords, currentDist);
      const map = mapRef.current?.getMap?.();
      if (map && map.getSource && map.getSource('poster-route-source')) {
        (map.getSource('poster-route-source') as any).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: sampled },
        });
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Guarantee 100% exact connection into target pin center
        if (map && map.getSource && map.getSource('poster-route-source')) {
          (map.getSource('poster-route-source') as any).setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: roadCoords },
          });
        }
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [roadCoords, roadSig]);

  // Fast GPU paint update path for real-time color changes
  useEffect(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap?.();
        if (map && map.isStyleLoaded && map.isStyleLoaded()) {
          if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', effectivePalette.land);
          if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', effectivePalette.water);
          if (map.getLayer('landcover-park')) map.setPaintProperty('landcover-park', 'fill-color', effectivePalette.parks);
          if (map.getLayer('building-3d')) map.setPaintProperty('building-3d', 'fill-extrusion-color', effectivePalette.buildings);
          if (map.getLayer('road-major-casing')) map.setPaintProperty('road-major-casing', 'line-color', effectivePalette.roads.major);
          if (map.getLayer('road-minor-high-casing')) map.setPaintProperty('road-minor-high-casing', 'line-color', effectivePalette.roads.minor_high);
          if (map.getLayer('road-minor-mid-casing')) map.setPaintProperty('road-minor-mid-casing', 'line-color', effectivePalette.roads.minor_mid);
          if (map.getLayer('road-minor-low-casing')) map.setPaintProperty('road-minor-low-casing', 'line-color', effectivePalette.roads.minor_low);
        }
      } catch (_) {}
    }
  }, [effectivePalette]);

  const handleMapLoad = (event: any) => {
    const instance = event.target;
    if (interactive) {
      (window as any).__mapboxInstance = instance;
      try {
        instance.prefetchZoomDelta = 1;
      } catch (_) {}
      setTimeout(() => { try { instance.resize(); } catch (_) {} }, 100);
    }
  };

  useEffect(() => {
    if (interactive && mapRef.current) {
      const instance = mapRef.current.getMap?.();
      if (instance) {
        (window as any).__mapboxInstance = instance;
        setTimeout(() => { try { instance.resize(); } catch (_) {} }, 50);
      }
    }
  }, [interactive, activeLayout.id, activeLayout.widthPx, activeLayout.heightPx]);

  const handleMapClick = (e: any) => {
    if (!interactive || mapLocked || !e.lngLat) return;
    if (isDrawingRoute) {
      addRouteWaypoint(e.lngLat.lat, e.lngLat.lng);
    } else {
      addMarker(e.lngLat.lat, e.lngLat.lng);
    }
  };

  const isNavigable = interactive && !mapLocked;

  // Throttle onMove/onViewportChange to ~30fps to avoid flooding Zustand at 60fps
  const lastMoveRef = useRef(0);
  const handleMove = useCallback((e: any) => {
    if (!isNavigable) return;
    const now = performance.now();
    if (now - lastMoveRef.current < 32) return;
    lastMoveRef.current = now;
    const vs = e.viewState || e;
    setLocation(vs.latitude ?? lat, vs.longitude ?? lng, vs.zoom ?? effectiveZoom, vs.pitch ?? pitch, vs.bearing ?? bearing);
  }, [isNavigable, setLocation, lat, lng, effectiveZoom, pitch, bearing]);

  // Synchronize external center/zoom changes (like search or presets) smoothly without interfering with active animations
  useEffect(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap?.() || mapRef.current;
        if (map && typeof map.isMoving === 'function' && !map.isMoving()) {
          const center = map.getCenter();
          const currentZoom = map.getZoom();
          const dist = Math.hypot(center.lat - lat, center.lng - lng);
          const zoomDiff = Math.abs(currentZoom - effectiveZoom);
          if (dist > 0.0001 || zoomDiff > 0.05) {
            map.jumpTo({
              center: [lng, lat],
              zoom: effectiveZoom,
            });
          }
        }
      } catch (e) {}
    }
  }, [lat, lng, effectiveZoom]);

  return (
    <div className="w-full h-full absolute inset-0 bg-gray-100">
      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: lng, latitude: lat, zoom: effectiveZoom, pitch, bearing }}
        onMove={handleMove}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        interactive={isNavigable}
        dragPan={isNavigable}
        scrollZoom={isNavigable}
        doubleClickZoom={isNavigable}
        touchZoomRotate={isNavigable}
        dragRotate={isNavigable && rotationEnabled}
        touchPitch={isNavigable && rotationEnabled}
        attributionControl={false}
        preserveDrawingBuffer={true}
        reuseMaps={true}
        maxTileCacheSize={120}
        fadeDuration={0}
        pixelRatio={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)}
        cooperativeGestures={false}
        trackResize={true}
        terrain={layerVisibility.terrain ? {
          source: 'terrain-source',
          exaggeration: 1.0
        } : undefined}
      >
        {/* Render Route GeoJSON Line */}
        {effectiveRouteGeoJson && (
          <Source id="poster-route-source" type="geojson" data={effectiveRouteGeoJson}>
            {/* Neon Glow Layer if lineStyle === 'neon' */}
            {route.lineStyle === 'neon' && (
              <Layer
                id="poster-route-neon-glow"
                type="line"
                layout={{
                  'line-cap': 'round',
                  'line-join': 'round',
                }}
                paint={{
                  'line-color': route.color || '#3b82f6',
                  'line-width': (route.width || 3.5) * 3,
                  'line-opacity': 0.35,
                  'line-blur': 4,
                }}
              />
            )}
            {/* Dark casing outline */}
            <Layer
              id="poster-route-casing"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': '#000000',
                'line-width': (route.width || 3.5) + 2.5,
                'line-opacity': 0.5,
                ...(route.lineStyle === 'dashed' ? { 'line-dasharray': [3, 2] } : {}),
                ...(route.lineStyle === 'dotted' ? { 'line-dasharray': [0.5, 2] } : {}),
              }}
            />
            {/* Main Route Path Line */}
            <Layer
              id="poster-route-line"
              type="line"
              layout={{
                'line-cap': 'round',
                'line-join': 'round',
              }}
              paint={{
                'line-color': route.color || '#3b82f6',
                'line-width': route.width || 3.5,
                'line-opacity': 0.95,
                ...(route.lineStyle === 'dashed' ? { 'line-dasharray': [3, 2] } : {}),
                ...(route.lineStyle === 'dotted' ? { 'line-dasharray': [0.5, 2] } : {}),
              }}
            />
          </Source>
        )}

        {/* Render Route Waypoint Markers */}
        {routeWaypoints.map((wp, idx) => {
          const wpSize = route.waypointSize || 28;
          const wpFontSize = Math.max(10, Math.round(wpSize * 0.35));
          const wpBorderWidth = Math.max(2, Math.round(wpSize * 0.07));
          return (
            <Marker key={`wp-${idx}`} latitude={wp.lat} longitude={wp.lng} anchor="center" style={{ zIndex: 40 }}>
              <div 
                className="rounded-full text-white font-mono font-bold flex items-center justify-center shadow-lg transition-transform hover:scale-110"
                style={{ 
                  width: `${wpSize}px`,
                  height: `${wpSize}px`,
                  fontSize: `${wpFontSize}px`,
                  border: `${wpBorderWidth}px solid #ffffff`,
                  backgroundColor: route.color || '#3b82f6',
                }}
              >
                {idx + 1}
              </div>
            </Marker>
          );
        })}

        {/* Render Placed Poster Markers */}
        {markers.map((marker) => {
          const isCustom = marker.type === 'custom' && marker.customImageUrl;
          const isDot = marker.type === 'dot';
          const size = marker.size || 36;
          const color = marker.color || '#ef4444';
          const labelFontSize = Math.max(10, Math.round(size * 0.28));
          const dotSize = Math.round(size * 0.85);
          const haloInset = Math.max(2, Math.round(size * 0.08));
          // Only pulse the most recently placed marker (last in array)
          const isPulsing = marker.id === markers[markers.length - 1]?.id;

          const renderIcon = () => {
            if (isCustom) {
              return (
                <img 
                  src={marker.customImageUrl} 
                  alt={marker.label || 'Marker'} 
                  className="object-contain drop-shadow-md" 
                  style={{ width: `${size}px`, height: `${size}px` }} 
                />
              );
            }
            if (isDot) {
              return (
                <div 
                  className="rounded-full shadow-md"
                  style={{ 
                    width: `${dotSize}px`, 
                    height: `${dotSize}px`, 
                    backgroundColor: color,
                    border: `${Math.max(2, Math.round(size * 0.06))}px solid #ffffff`
                  }}
                />
              );
            }
            if (marker.iconName === 'Star') return <Star size={size} className="fill-current" />;
            if (marker.iconName === 'Heart') return <Heart size={size} className="fill-current" />;
            if (marker.iconName === 'Flag') return <Flag size={size} className="fill-current" />;
            if (marker.iconName === 'Target') return <Target size={size} />;
            if (marker.iconName === 'Crosshair') return <Crosshair size={size} />;
            if (marker.iconName === 'Home') return <Home size={size} className="fill-current" />;
            if (marker.iconName === 'Landmark') return <Landmark size={size} />;
            if (marker.iconName === 'Compass') return <Compass size={size} />;
            return <MapPin size={size} className="fill-current" />;
          };

          return (
            <Marker key={marker.id} latitude={marker.lat} longitude={marker.lng} anchor="bottom" style={{ zIndex: 30 }}>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMarker(marker.id);
                }}
                className="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-110"
                title="Click to remove marker"
              >
                {/* Dynamic Pulse Halo Animation — only on latest marker */}
                {isPulsing && <div 
                  className="absolute rounded-full animate-ping opacity-35 pointer-events-none"
                  style={{ 
                    backgroundColor: color,
                    top: `-${haloInset}px`,
                    bottom: `-${haloInset}px`,
                    left: `-${haloInset}px`,
                    right: `-${haloInset}px`,
                  }}
                />}

                {/* Marker Main Element */}
                <div className="drop-shadow-md flex items-center justify-center" style={{ color: color }}>
                  {renderIcon()}
                </div>

                {/* Floating Label with Proportional Font Size */}
                {marker.label && (
                  <span 
                    className="mt-1 px-2.5 py-0.5 font-sans font-extrabold rounded-md shadow-md bg-black/85 text-white whitespace-nowrap border border-white/20"
                    style={{ fontSize: `${labelFontSize}px` }}
                  >
                    {marker.label}
                  </span>
                )}
              </div>
            </Marker>
          );
        })}
      </Map>
    </div>
  );
}