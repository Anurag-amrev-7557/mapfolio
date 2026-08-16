import Map, { Marker, Source, Layer } from 'react-map-gl/maplibre';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore } from '../store/useMapStore';
import { getTheme } from '../constants/themes';
import { generateMapStyle } from '../utils/generateMapStyle';
import { MapPin, Star, Heart, Flag, Target, Crosshair, Home, Landmark, Compass } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';

const MapComponent = Map as React.ComponentType<any>;

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
    themeId,
    activeLayout,
    colorOverrides,
    layerVisibility,
    setLocation,
    markers,
    addMarker,
    route,
    isDrawingRoute,
    routeWaypoints,
    addRouteWaypoint,
    customThemes,
    heatmapData,
  } = useMapStore();

  const mapRef = useRef<any>(null);
  const effectiveZoom = interactive ? zoom : Math.max(1, zoom - bgZoomOffset);

  // Rebuild style when themeId, customThemes, colorOverrides, or layerVisibility change
  const mapStyle = useMemo(() => {
    const basePalette = getTheme(themeId, customThemes).palette;
    const effectivePalette = {
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

    // Auto-generate sample heatmap points around current location if no custom data uploaded
    let effectiveHeatmapData = heatmapData;
    if (!heatmapData && layerVisibility.heatmap) {
      const spread = Math.max(0.005, 0.15 / Math.pow(2, Math.max(0, zoom - 10)));
      const features = [];
      // Generate clustered point hotspots around the map center
      const clusters = [
        { cLat: lat, cLng: lng, count: 40 },
        { cLat: lat + spread * 0.6, cLng: lng - spread * 0.4, count: 25 },
        { cLat: lat - spread * 0.5, cLng: lng + spread * 0.7, count: 20 },
        { cLat: lat + spread * 0.3, cLng: lng + spread * 0.5, count: 15 },
        { cLat: lat - spread * 0.7, cLng: lng - spread * 0.3, count: 18 },
      ];
      for (const c of clusters) {
        for (let i = 0; i < c.count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = Math.random() * spread * 0.5;
          features.push({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [c.cLng + Math.cos(angle) * r, c.cLat + Math.sin(angle) * r],
            },
            properties: {},
          });
        }
      }
      effectiveHeatmapData = { type: 'FeatureCollection', features };
    }

    return generateMapStyle(effectivePalette, layerVisibility, effectiveHeatmapData);
  }, [themeId, colorOverrides, layerVisibility, heatmapData, lat, lng, zoom]);

  const handleMapLoad = (event: any) => {
    const instance = event.target;
    if (interactive) {
      (window as any).__mapboxInstance = instance;
    }
    setTimeout(() => {
      try {
        instance.resize();
      } catch (err) {
        // ignore
      }
    }, 100);
  };

  useEffect(() => {
    if (interactive && mapRef.current && mapRef.current.getMap()) {
      const instance = mapRef.current.getMap();
      (window as any).__mapboxInstance = instance;
      setTimeout(() => {
        try {
          instance.resize();
        } catch (err) {
          // ignore
        }
      }, 50);
    }
  }, [interactive, activeLayout.id, activeLayout.widthPx, activeLayout.heightPx]);

  const handleMapClick = (e: any) => {
    if (!interactive || mapLocked) return;
    if (isDrawingRoute) {
      let clickLat = e.lngLat.lat;
      let clickLng = e.lngLat.lng;

      // Try snapping to nearest vector road feature if clicked near a road
      if (mapRef.current) {
        try {
          const mapInstance = mapRef.current.getMap();
          const bbox = [
            [e.point.x - 12, e.point.y - 12],
            [e.point.x + 12, e.point.y + 12],
          ];
          const features = mapInstance.queryRenderedFeatures(bbox);
          const roadFeature = features.find((f: any) =>
            f.layer &&
            (f.layer.id.includes('road') ||
             f.layer.id.includes('highway') ||
             f.layer['source-layer'] === 'transportation')
          );

          if (roadFeature && roadFeature.geometry) {
            const geom = roadFeature.geometry;
            const pointsToTest: [number, number][] =
              geom.type === 'LineString' ? geom.coordinates :
              geom.type === 'MultiLineString' ? geom.coordinates.flat() : [];

            if (pointsToTest.length > 0) {
              let minDist = Infinity;
              let bestPt = [clickLng, clickLat];
              for (const pt of pointsToTest) {
                const d = Math.hypot(pt[0] - clickLng, pt[1] - clickLat);
                if (d < minDist) {
                  minDist = d;
                  bestPt = pt;
                }
              }
              clickLng = bestPt[0];
              clickLat = bestPt[1];
            }
          }
        } catch (err) {
          // ignore fallback
        }
      }

      addRouteWaypoint(clickLat, clickLng);
    } else {
      addMarker(e.lngLat.lat, e.lngLat.lng);
    }
  };

  const isNavigable = interactive && !mapLocked;

  // Synchronize external center/zoom changes (like search or presets) smoothly without interfering with active animations
  useEffect(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap();
        if (map && !map.isMoving()) {
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
      <MapComponent
        ref={mapRef}
        mapLib={maplibregl as any}
        initialViewState={{ longitude: lng, latitude: lat, zoom: effectiveZoom }}
        onMove={(e: any) => isNavigable && setLocation(e.viewState.latitude, e.viewState.longitude, e.viewState.zoom)}
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
      >
        {/* Render Route GeoJSON Line */}
        {route.geojson && (
          <Source id="poster-route-source" type="geojson" data={route.geojson}>
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
            <Marker key={`wp-${idx}`} latitude={wp.lat} longitude={wp.lng} anchor="center">
              <div 
                className="rounded-full text-white font-mono font-bold flex items-center justify-center shadow-lg animate-pulse"
                style={{ 
                  width: `${wpSize}px`,
                  height: `${wpSize}px`,
                  fontSize: `${wpFontSize}px`,
                  border: `${wpBorderWidth}px solid #ffffff`,
                  backgroundColor: route.color || '#3b82f6'
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
            <Marker key={marker.id} latitude={marker.lat} longitude={marker.lng} anchor="bottom">
              <div className="relative flex flex-col items-center group cursor-pointer transition-transform duration-200 hover:scale-110">
                {/* Dynamic Pulse Halo Animation */}
                <div 
                  className="absolute rounded-full animate-ping opacity-35 pointer-events-none"
                  style={{ 
                    backgroundColor: color,
                    top: `-${haloInset}px`,
                    bottom: `-${haloInset}px`,
                    left: `-${haloInset}px`,
                    right: `-${haloInset}px`,
                  }}
                />

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
      </MapComponent>
    </div>
  );
}