import Map, { Marker, Source, Layer, type MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useMapStore, getTheme } from '@/core';
import { generateMapStyle } from './generateMapStyle';
import { MapPin, Star, Heart, Flag, Target, Crosshair, Home, Landmark, Compass } from 'lucide-react';
import { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { computePolylineTotalDistance, interpolatePolylineByDistance, m3EmphasizedEasing } from '@/features/routing';

// Optimize vector tile parser concurrency and tile request throughput across CPU cores
if (typeof navigator !== 'undefined') {
  maplibregl.workerCount = Math.min(navigator.hardwareConcurrency || 4, 8);
  maplibregl.maxParallelImageRequests = 32;
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
    setText,
    setPitch,
    setBearing,
    markers,
    addMarker,
    deleteMarker,
    route,
    isDrawingRoute,
    routeWaypoints,
    addRouteWaypoint,
    customThemes,
    heatmapData,
    sunAzimuth,
    sunPolarAngle,
    sunIntensity,
    celestialBody,
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

// Color blending utility for theme atmosphere harmonization
function blendHex(baseHex: string, tintHex: string, weight: number): string {
  try {
    const h1 = (baseHex || '#ffffff').replace('#', '');
    const h2 = (tintHex || '#ffffff').replace('#', '');
    const clean1 = h1.length === 3 ? h1.split('').map((c) => c + c).join('') : h1.padEnd(6, '0');
    const clean2 = h2.length === 3 ? h2.split('').map((c) => c + c).join('') : h2.padEnd(6, '0');
    const r1 = parseInt(clean1.substring(0, 2), 16) || 0;
    const g1 = parseInt(clean1.substring(2, 4), 16) || 0;
    const b1 = parseInt(clean1.substring(4, 6), 16) || 0;
    const r2 = parseInt(clean2.substring(0, 2), 16) || 0;
    const g2 = parseInt(clean2.substring(2, 4), 16) || 0;
    const b2 = parseInt(clean2.substring(4, 6), 16) || 0;

    const r = Math.round(r1 * (1 - weight) + r2 * weight);
    const g = Math.round(g1 * (1 - weight) + g2 * weight);
    const b = Math.round(b1 * (1 - weight) + b2 * weight);

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch (_) {
    return baseHex;
  }
}

  // Natural Rayleigh Sky Atmosphere: dynamically adapts to Sun/Moon, altitude & theme
  const isDark = useMemo(() => {
    return effectivePalette.land.startsWith('#') && parseInt(effectivePalette.land.slice(1, 3), 16) < 120;
  }, [effectivePalette.land]);

  const isMoonMode = useMemo(() => {
    return celestialBody === 'moon' || (celestialBody === 'auto' && isDark);
  }, [celestialBody, isDark]);

  const skyAtmosphere = useMemo(() => {
    const landColor = effectivePalette.land || '#f3f4f6';

    if (isMoonMode) {
      // Moonlit / Night Sky Dome
      const horizon = blendHex(landColor, '#0f172a', 0.5);
      const mid = blendHex(landColor, '#0a0f1d', 0.7);
      const top = '#020617';
      return {
        top,
        horizon,
        gradient: `linear-gradient(to top, ${horizon} 0%, ${mid} 40%, ${top} 100%)`,
        lightColor: '#cbd5e1',
      };
    }

    // Solar Elevation Dynamics (Dawn / Sunset vs Noon)
    if (sunPolarAngle <= 28) {
      // Golden Hour / Twilight Sky
      const horizon = blendHex(landColor, '#fb923c', 0.4);
      const mid = blendHex(landColor, '#818cf8', 0.35);
      const top = blendHex(landColor, '#1e1b4b', 0.55);
      return {
        top,
        horizon,
        gradient: `linear-gradient(to top, ${horizon} 0%, ${blendHex(horizon, mid, 0.45)} 25%, ${mid} 60%, ${top} 100%)`,
        lightColor: '#f59e0b',
      };
    }

    // Clear Daylight / High Noon Sky
    const horizon = landColor;
    const mid = blendHex(landColor, '#93c5fd', 0.28);
    const top = blendHex(landColor, '#1e40af', 0.25);
    return {
      top,
      horizon,
      gradient: `linear-gradient(to top, ${horizon} 0%, ${blendHex(horizon, mid, 0.5)} 20%, ${mid} 55%, ${top} 100%)`,
      lightColor: '#ffffff',
    };
  }, [effectivePalette, isMoonMode, sunPolarAngle]);

  // Real-Time 60/120fps 3D Celestial Projection Calculator
  const calculateCelestial = useCallback(
    (curPitch: number, curBearing: number) => {
      if (curPitch < 20) return null;

      // Relative azimuth to camera bearing: [-180°, 180°]
      const relAz = (((sunAzimuth - curBearing) % 360) + 540) % 360 - 180;
      // Visible within horizontal camera FOV (~80°)
      if (Math.abs(relAz) > 78) return null;

      // Screen X: 50% is center, maps smoothly across horizontal FOV
      const screenX = 50 + (relAz / 78) * 46;

      // Horizon line in perspective view:
      // pitch 20° -> ~4%; pitch 60° -> ~11%; pitch 78° -> ~16%; pitch 85° -> ~22%
      const horizonPercent = Math.max(4, Math.min(23, (curPitch - 20) * 0.32));

      // Sun altitude placement above the horizon:
      // Low sunPolarAngle (10°) touches the horizon; High sunPolarAngle (85°) sits near zenith (1.5% - 3%)
      const altRatio = Math.max(0, Math.min(1, (sunPolarAngle - 10) / 75));
      const screenY = Math.max(1.5, horizonPercent - altRatio * (horizonPercent - 1.5));

      return {
        x: screenX,
        y: screenY,
      };
    },
    [sunAzimuth, sunPolarAngle]
  );

  // Synchronous State + Live WebGL Camera Event Stream
  const [liveCelestial, setLiveCelestial] = useState<{ x: number; y: number } | null>(() =>
    calculateCelestial(pitch, bearing)
  );

  useEffect(() => {
    setLiveCelestial(calculateCelestial(pitch, bearing));
  }, [calculateCelestial, pitch, bearing]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap?.() || mapRef.current;
    if (!map || typeof map.on !== 'function') return;

    const onMapTransform = () => {
      const curPitch = typeof map.getPitch === 'function' ? map.getPitch() : pitch;
      const curBearing = typeof map.getBearing === 'function' ? map.getBearing() : bearing;
      setLiveCelestial(calculateCelestial(curPitch, curBearing));
    };

    map.on('move', onMapTransform);
    map.on('rotate', onMapTransform);
    map.on('pitch', onMapTransform);

    return () => {
      map.off('move', onMapTransform);
      map.off('rotate', onMapTransform);
      map.off('pitch', onMapTransform);
    };
  }, [calculateCelestial, pitch, bearing]);

  // Rebuild base style when structure/layers/heatmap/lighting change
  const mapStyle = useMemo(() => {
    return generateMapStyle(effectivePalette, layerVisibility, heatmapData, {
      sunAzimuth,
      sunPolarAngle,
      sunIntensity,
      celestialBody,
    });
  }, [effectivePalette, layerVisibility, heatmapData, sunAzimuth, sunPolarAngle, sunIntensity, celestialBody]);

  // Instantly apply updated mapStyle to MapLibre instance with zero-lag diffing
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current.getMap?.() || mapRef.current;
    if (!map || !mapStyle) return;

    try {
      if (typeof map.setStyle === 'function') {
        map.setStyle(mapStyle, { diff: true });
      }
    } catch (_) {
      // Ignore if style not ready yet
    }
  }, [mapStyle]);

  // Only use real OSRM/BRouter road geometry — no straight-line fallback
  const routeGeoJson = route.geojson || null;

  // Ref-driven GeoJSON state so the animation can update the Source without React re-render fights
  const [displayGeoJson, setDisplayGeoJson] = useState<any>(null);

  // 60fps GPU-Native Path Creation Streamer: animates along real road network curves
  const animFrameRef = useRef<number | null>(null);
  const prevAnimTotalDistRef = useRef<number>(0);
  const lastAnimatedCoordsSigRef = useRef<string>('');

  const roadCoords = useMemo(() => {
    if (!routeGeoJson?.geometry?.coordinates) return null;
    return routeGeoJson.geometry.coordinates as [number, number][];
  }, [routeGeoJson]);

  const roadSig = useMemo(() => {
    if (!roadCoords || roadCoords.length < 2) return '';
    return `${roadCoords.length}-${roadCoords[0][0]}-${roadCoords[0][1]}-${roadCoords[roadCoords.length - 1][0]}-${roadCoords[roadCoords.length - 1][1]}`;
  }, [roadCoords]);

  useEffect(() => {
    if (!roadCoords || roadCoords.length < 2) {
      prevAnimTotalDistRef.current = 0;
      lastAnimatedCoordsSigRef.current = '';
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setDisplayGeoJson(null);
      return;
    }

    if (lastAnimatedCoordsSigRef.current === roadSig) {
      return;
    }
    lastAnimatedCoordsSigRef.current = roadSig;

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const totalDist = computePolylineTotalDistance(roadCoords);
    const prevDist = prevAnimTotalDistRef.current;
    prevAnimTotalDistRef.current = totalDist;

    // Smoothly stream from previous waypoint distance to new waypoint distance along road curves
    const startDist = prevDist > 0 && prevDist < totalDist ? prevDist : 0;
    const deltaDist = totalDist - startDist;

    if (deltaDist < 1) {
      // No meaningful new distance — just show the full route immediately
      setDisplayGeoJson(routeGeoJson);
      return;
    }

    const startTime = performance.now();
    const duration = Math.min(700, Math.max(350, Math.sqrt(deltaDist) * 18));

    const makeGeoJson = (coords: [number, number, number?][]) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: coords },
    });

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Material Design 3 Emphasized Decelerate Motion Curve (0.05, 0.7, 0.1, 1.0)
      const ease = m3EmphasizedEasing(progress);
      const currentDist = startDist + deltaDist * ease;

      const sampled = interpolatePolylineByDistance(roadCoords, currentDist);

      // Direct GPU source update — bypasses React reconciliation for buttery 60fps
      const map = mapRef.current?.getMap?.();
      if (map && map.getSource && map.getSource('poster-route-source')) {
        (map.getSource('poster-route-source') as any).setData(makeGeoJson(sampled));
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Animation complete: lock to full road geometry and sync React state
        setDisplayGeoJson(routeGeoJson);
        const mapFinal = mapRef.current?.getMap?.();
        if (mapFinal && mapFinal.getSource && mapFinal.getSource('poster-route-source')) {
          (mapFinal.getSource('poster-route-source') as any).setData(routeGeoJson);
        }
      }
    };

    // Set initial empty line so the Source element exists in the DOM
    setDisplayGeoJson(makeGeoJson([roadCoords[0]]));

    // Start animation on next frame (after React paints the Source)
    requestAnimationFrame(() => {
      animFrameRef.current = requestAnimationFrame(animate);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [roadCoords, roadSig, routeGeoJson]);

  // Fast GPU paint update path for real-time color changes and sky atmosphere
  useEffect(() => {
    if (mapRef.current) {
      try {
        const map = mapRef.current.getMap?.();
        if (map && map.isStyleLoaded && map.isStyleLoaded()) {
          if (map.getLayer('background')) map.setPaintProperty('background', 'background-color', effectivePalette.land);
          if (map.getLayer('water')) map.setPaintProperty('water', 'fill-color', effectivePalette.water);
          if (map.getLayer('landcover-park')) map.setPaintProperty('landcover-park', 'fill-color', effectivePalette.parks);
          if (map.getLayer('building-3d')) {
            map.setPaintProperty('building-3d', 'fill-extrusion-color', effectivePalette.buildings);
            map.setPaintProperty('building-3d', 'fill-extrusion-opacity', 1);
          }
          if (map.getLayer('road-major-casing')) map.setPaintProperty('road-major-casing', 'line-color', effectivePalette.roads.major);
          if (map.getLayer('road-minor-high-casing')) map.setPaintProperty('road-minor-high-casing', 'line-color', effectivePalette.roads.minor_high);
          if (map.getLayer('road-minor-mid-casing')) map.setPaintProperty('road-minor-mid-casing', 'line-color', effectivePalette.roads.minor_mid);
          if (map.getLayer('road-minor-low-casing')) map.setPaintProperty('road-minor-low-casing', 'line-color', effectivePalette.roads.minor_low);

          // Real-Time Celestial Sun / Moon Lighting & Soft Architectural Shading
          const isDark = effectivePalette.land.startsWith('#') && parseInt(effectivePalette.land.slice(1, 3), 16) < 120;
          const isMoon = celestialBody === 'moon' || (celestialBody === 'auto' && isDark);
          const celestialColor = isMoon ? '#cbd5e1' : '#ffffff';
          const effectiveIntensity = (isMoon ? 0.85 : 0.95) * sunIntensity;

          if (typeof (map as any).setLight === 'function') {
            (map as any).setLight({
              anchor: 'map',
              color: celestialColor,
              intensity: effectiveIntensity,
              position: [1.5, sunAzimuth, sunPolarAngle],
            });
          }

          if (typeof (map as any).setSky === 'function') {
            (map as any).setSky({
              'sky-color': skyAtmosphere.top,
              'sky-horizon-blend': 0.65,
              'horizon-color': skyAtmosphere.horizon,
              'horizon-fog-blend': 0.88,
              'fog-color': skyAtmosphere.horizon,
              'fog-ground-blend': 0.98,
            });
          }
        }
      } catch (_) {}
    }
  }, [effectivePalette, skyAtmosphere, sunAzimuth, sunPolarAngle, sunIntensity, celestialBody]);

  const handleMapLoad = (event: any) => {
    const instance = event.target;
    if (interactive) {
      (window as any).__mapboxInstance = instance;
      try {
        instance.prefetchZoomDelta = 1;
        if (typeof instance.setSky === 'function') {
          instance.setSky({
            'sky-color': skyAtmosphere.top,
            'sky-horizon-blend': 0.65,
            'horizon-color': skyAtmosphere.horizon,
            'horizon-fog-blend': 0.88,
            'fog-color': skyAtmosphere.horizon,
            'fog-ground-blend': 0.98,
          });
        }
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

  // Dynamic Auto-Reverse Geocoding Cache & Debounce on Map Pan
  const lastGeocodedCoordsRef = useRef<{ lat: number; lng: number; zoom: number } | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const geocodeAbortRef = useRef<AbortController | null>(null);
  const geocodeCacheRef = useRef<Record<string, { title: string; subtitle: string }>>({});

  const performReverseGeocode = useCallback(async (targetLat: number, targetLng: number, targetZoom: number) => {
    const cacheKey = `${targetLat.toFixed(2)}_${targetLng.toFixed(2)}_${Math.round(targetZoom)}`;
    if (geocodeCacheRef.current[cacheKey]) {
      const cached = geocodeCacheRef.current[cacheKey];
      setText(cached.title, cached.subtitle);
      return;
    }

    if (geocodeAbortRef.current) {
      geocodeAbortRef.current.abort();
    }
    const abortCtrl = new AbortController();
    geocodeAbortRef.current = abortCtrl;

    try {
      const osmZoom = Math.min(16, Math.max(3, Math.round(targetZoom)));
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${targetLat}&lon=${targetLng}&zoom=${osmZoom}&format=json`,
        { signal: abortCtrl.signal }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.address) return;

      const city =
        data.address.city ||
        data.address.town ||
        data.address.municipality ||
        data.address.village ||
        data.address.county ||
        data.address.state_district ||
        data.address.island ||
        data.name ||
        data.address.state ||
        'MAP POSTER';

      const country =
        data.address.country ||
        data.address.state ||
        'POSTER MAP';

      const formattedTitle = city.toUpperCase();
      const formattedSubtitle = country.toUpperCase();

      geocodeCacheRef.current[cacheKey] = { title: formattedTitle, subtitle: formattedSubtitle };
      setText(formattedTitle, formattedSubtitle);
    } catch (e) {
      // Ignored if aborted
    }
  }, [setText]);

  // Trigger debounced reverse geocoding on move end / user pan
  const handleMoveEnd = useCallback((e: any) => {
    if (!isNavigable) return;
    const vs = e.viewState || e;
    const curLat = vs.latitude ?? lat;
    const curLng = vs.longitude ?? lng;
    const curZoom = vs.zoom ?? effectiveZoom;

    // Check distance threshold to avoid unnecessary lookups on tiny micro-nudges
    const last = lastGeocodedCoordsRef.current;
    if (last) {
      const dist = Math.hypot(curLat - last.lat, curLng - last.lng);
      const zoomDiff = Math.abs(curZoom - last.zoom);
      if (dist < 0.015 && zoomDiff < 1) return;
    }

    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    geocodeTimeoutRef.current = setTimeout(() => {
      lastGeocodedCoordsRef.current = { lat: curLat, lng: curLng, zoom: curZoom };
      performReverseGeocode(curLat, curLng, curZoom);
    }, 450);
  }, [isNavigable, lat, lng, effectiveZoom, performReverseGeocode]);

  // Right-Click Drag to Rotate & Pitch Plane (Cross-browser Native Fluid Controller)
  useEffect(() => {
    if (!interactive || mapLocked) return;
    const map = mapRef.current?.getMap?.() || mapRef.current;
    if (!map) return;
    const container = map.getContainer?.();
    if (!container) return;

    let isRightDragging = false;
    let startX = 0;
    let startY = 0;
    let startPitch = 0;
    let startBearing = 0;

    const onMouseDown = (e: MouseEvent) => {
      // Right click (button === 2) or Ctrl/Shift/Meta + Left click
      if (e.button === 2 || (e.button === 0 && (e.ctrlKey || e.shiftKey || e.metaKey))) {
        e.preventDefault();
        isRightDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPitch = map.getPitch();
        startBearing = map.getBearing();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isRightDragging) return;
      e.preventDefault();
      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      // Vertical drag adjusts 3D plane tilt (0 to 85 deg)
      const newPitch = Math.max(0, Math.min(85, startPitch - deltaY * 0.45));
      // Horizontal drag rotates lateral bearing
      const newBearing = (startBearing + deltaX * 0.45) % 360;

      map.setPitch(newPitch);
      map.setBearing(newBearing);
      setLocation(lat, lng, effectiveZoom, newPitch, newBearing);
    };

    const onMouseUp = () => {
      if (isRightDragging) {
        isRightDragging = false;
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [interactive, mapLocked, lat, lng, effectiveZoom, setLocation]);

  // Reactive Pitch & Bearing synchronization from external store updates
  const prevPitchRef = useRef(pitch);
  const prevBearingRef = useRef(bearing);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap?.() || mapRef.current;
      if (map && typeof map.getPitch === 'function') {
        const curPitch = map.getPitch();
        const curBearing = map.getBearing();
        if (Math.abs(curPitch - pitch) > 0.5 && prevPitchRef.current !== pitch) {
          prevPitchRef.current = pitch;
          map.easeTo({ pitch, duration: 400, essential: true });
        }
        if (Math.abs(curBearing - bearing) > 0.5 && prevBearingRef.current !== bearing) {
          prevBearingRef.current = bearing;
          map.easeTo({ bearing, duration: 400, essential: true });
        }
      }
    }
  }, [pitch, bearing]);

  // Synchronize external center/zoom changes with cinematic drone flyTo
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
            if (dist > 0.1 || zoomDiff > 2) {
              map.flyTo({
                center: [lng, lat],
                zoom: effectiveZoom,
                speed: 1.35,
                curve: 1.42,
                essential: true,
              });
            } else {
              map.easeTo({
                center: [lng, lat],
                zoom: effectiveZoom,
                duration: 350,
                essential: true,
              });
            }
          }
        }
      } catch (e) {}
    }
  }, [lat, lng, effectiveZoom]);

  // Fixed Cosmic Star Field for Night & Moonlight Sky
  const nightStars = useMemo(() => {
    const stars = [];
    const seedPrng = (s: number) => {
      const x = Math.sin(s) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 0; i < 48; i++) {
      const x = seedPrng(i * 13.37 + 1) * 98 + 1;
      const y = seedPrng(i * 37.19 + 7) * 22 + 1;
      const size = seedPrng(i * 7.91 + 3) > 0.8 ? 2.5 : seedPrng(i * 7.91 + 3) > 0.4 ? 1.8 : 1.2;
      const duration = 2.5 + seedPrng(i * 5.23 + 2) * 3.5;
      const delay = seedPrng(i * 9.17 + 5) * 4;
      const opacity = 0.4 + seedPrng(i * 11.11 + 4) * 0.55;

      stars.push({ id: i, x, y, size, duration, delay, opacity });
    }
    return stars;
  }, []);

  // Dynamic 3D Perspective Horizon Height
  const skyHorizonHeightPercent = useMemo(() => {
    if (pitch < 20) return 0;
    return Math.max(3.5, Math.min(23, (pitch - 20) * 0.32));
  }, [pitch]);

  return (
    <div 
      className="w-full h-full absolute inset-0 select-none overflow-hidden"
      style={{ background: skyAtmosphere.gradient }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* ── Night Sky Cosmic Starfield & Starlight (Strictly in 3D Sky Dome) ── */}
      {isMoonMode && skyHorizonHeightPercent > 0 && (
        <div 
          className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden z-0"
          style={{
            height: `${skyHorizonHeightPercent}%`,
          }}
        >
          {/* Constellation Container rotating with Compass Bearing */}
          <div 
            className="relative w-full h-full pointer-events-none transition-transform duration-75"
            style={{
              transform: `translateX(${-(bearing % 360) * 0.2}%)`,
            }}
          >
            {/* Subtle Galactic Nebula Glow Trail */}
            <div 
              className="absolute inset-0 opacity-25 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 55% 40%, rgba(147,197,253,0.35) 0%, rgba(99,102,241,0.18) 45%, transparent 75%)',
              }}
            />
            {nightStars.map((star) => (
              <div
                key={star.id}
                className="absolute rounded-full bg-white pointer-events-none"
                style={{
                  left: `${star.x}%`,
                  top: `${(star.y / 24) * 90}%`,
                  width: `${star.size}px`,
                  height: `${star.size}px`,
                  opacity: star.opacity,
                  boxShadow: star.size > 2 ? '0 0 4px #ffffff, 0 0 8px rgba(147,197,253,0.8)' : undefined,
                  animation: `starTwinkle ${star.duration}s ease-in-out infinite`,
                  animationDelay: `${star.delay}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Daytime & Golden Hour Atmospheric Clouds (Strictly in 3D Sky Dome) ── */}
      {!isMoonMode && skyHorizonHeightPercent > 0 && (
        <div 
          className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden z-0"
          style={{
            height: `${skyHorizonHeightPercent}%`,
          }}
        >
          {/* Cloud Container rotating with Compass Bearing */}
          <div 
            className="relative w-full h-full pointer-events-none transition-transform duration-75"
            style={{
              transform: `translateX(${-(bearing % 360) * 0.15}%)`,
            }}
          >
            {/* Cloud Band 1: Upper High-Altitude Cirrus */}
            <div
              className="absolute -left-[20%] w-[140%] h-full top-0 opacity-30 pointer-events-none"
              style={{
                background: sunPolarAngle <= 28
                  ? 'radial-gradient(ellipse at 50% 40%, rgba(254,215,170,0.5) 0%, rgba(251,146,60,0.18) 45%, transparent 70%)'
                  : 'radial-gradient(ellipse at 50% 40%, rgba(255,255,255,0.65) 0%, rgba(241,245,249,0.25) 45%, transparent 70%)',
                filter: 'blur(12px)',
                animation: 'skyCloudDrift 50s ease-in-out infinite',
              }}
            />
            {/* Cloud Band 2: Mid Atmospheric Stratocumulus Wisps */}
            <div
              className="absolute -left-[10%] w-[120%] h-full top-1 opacity-22 pointer-events-none"
              style={{
                background: sunPolarAngle <= 28
                  ? 'radial-gradient(ellipse at 40% 50%, rgba(253,186,116,0.55) 0%, rgba(244,114,182,0.18) 40%, transparent 68%)'
                  : 'radial-gradient(ellipse at 40% 50%, rgba(255,255,255,0.6) 0%, rgba(226,232,240,0.2) 40%, transparent 68%)',
                filter: 'blur(16px)',
                animation: 'skyCloudDriftSlow 70s ease-in-out infinite',
              }}
            />
          </div>
        </div>
      )}

      {/* ── Photorealistic Optical Sun & HD Lunar Moon in 3D Sky ── */}
      {liveCelestial && (
        <div
          className="absolute z-0 pointer-events-none select-none"
          style={{
            left: `${liveCelestial.x}%`,
            top: `${liveCelestial.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {isMoonMode ? (
            /* Photorealistic Luminous Moon with Surface Topography & Silvery Halo */
            <div className="relative flex items-center justify-center pointer-events-none">
              {/* Ethereal Atmospheric Lunar Corona */}
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: '180px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(199,210,254,0.38) 0%, rgba(147,197,253,0.14) 40%, rgba(15,23,42,0) 70%)',
                }}
              />

              {/* High-Definition Photorealistic Moon Disc */}
              <div 
                className="rounded-full relative overflow-hidden pointer-events-none shadow-2xl"
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'radial-gradient(circle at 38% 38%, #ffffff 0%, #e2e8f0 40%, #cbd5e1 75%, #94a3b8 100%)',
                  boxShadow: '0 0 25px rgba(199,210,254,0.85), 0 0 60px rgba(147,197,253,0.4), inset -3px -3px 6px rgba(15,23,42,0.45)',
                }}
              >
                {/* Organic Lunar Maria & Basalt Plains */}
                <div className="absolute top-1.5 left-2 w-3.5 h-3 rounded-full bg-slate-500/30 blur-[0.6px]" />
                <div className="absolute top-4 left-4 w-4 h-3.5 rounded-full bg-slate-500/28 blur-[0.6px]" />
                <div className="absolute bottom-2 left-1.5 w-3 h-2.5 rounded-full bg-slate-500/22 blur-[0.6px]" />
                <div className="absolute bottom-2 right-2 w-3.5 h-4 rounded-full bg-slate-500/32 blur-[0.6px]" />
                <div className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-slate-500/25 blur-[0.6px]" />
                {/* Tycho Impact Crater Ray Highlight */}
                <div className="absolute bottom-1.5 right-2.5 w-1 h-1 rounded-full bg-white/90 shadow-[0_0_3px_#fff]" />
              </div>
            </div>
          ) : (
            /* Photorealistic High-Dynamic-Range Optical Sun & Corona */
            <div className="relative flex items-center justify-center pointer-events-none">
              {/* Outer Inverse-Square Photometric Corona */}
              <div 
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: `${Math.max(220, 340 * (sunIntensity || 0.74))}px`,
                  height: `${Math.max(220, 340 * (sunIntensity || 0.74))}px`,
                  background: sunPolarAngle <= 28 
                    ? 'radial-gradient(circle, rgba(254,215,170,0.65) 0%, rgba(251,146,60,0.3) 30%, rgba(245,158,11,0.1) 55%, transparent 75%)'
                    : 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(254,240,138,0.35) 30%, rgba(251,191,36,0.12) 55%, transparent 75%)',
                }}
              />

              {/* Anamorphic Horizontal Lens Glow Beam */}
              <div 
                className="absolute pointer-events-none"
                style={{
                  width: '380px',
                  height: '3px',
                  background: sunPolarAngle <= 28
                    ? 'linear-gradient(to right, transparent 0%, rgba(254,215,170,0.6) 50%, transparent 100%)'
                    : 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.75) 50%, transparent 100%)',
                }}
              />

              {/* Delicate 8-Point Optical Diffraction Starburst Rays */}
              <div 
                className="absolute pointer-events-none opacity-30"
                style={{
                  width: '180px',
                  height: '180px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                  clipPath: 'polygon(50% 0%, 53% 47%, 100% 50%, 53% 53%, 50% 100%, 47% 53%, 0% 50%, 47% 47%)',
                }}
              />
              <div 
                className="absolute pointer-events-none opacity-20 rotate-45"
                style={{
                  width: '130px',
                  height: '130px',
                  background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%)',
                  clipPath: 'polygon(50% 0%, 53% 47%, 100% 50%, 53% 53%, 50% 100%, 47% 53%, 0% 50%, 47% 47%)',
                }}
              />

              {/* Pure Radiant High-Luminance Solar Core */}
              <div 
                className="rounded-full relative pointer-events-none"
                style={{
                  width: '32px',
                  height: '32px',
                  background: '#ffffff',
                  boxShadow: sunPolarAngle <= 28
                    ? '0 0 25px #ffffff, 0 0 50px rgba(254,215,170,0.95), 0 0 90px rgba(249,115,22,0.65)'
                    : '0 0 25px #ffffff, 0 0 50px rgba(254,240,138,0.95), 0 0 90px rgba(251,191,36,0.6)',
                }}
              />
            </div>
          )}
        </div>
      )}

      <Map
        ref={mapRef}
        mapLib={maplibregl}
        initialViewState={{ longitude: lng, latitude: lat, zoom: effectiveZoom, pitch, bearing }}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        onClick={handleMapClick}
        onLoad={handleMapLoad}
        mapStyle={mapStyle}
        style={{ width: '100%', height: '100%', position: 'absolute' }}
        interactive={isNavigable}
        dragPan={isNavigable}
        scrollZoom={isNavigable}
        doubleClickZoom={isNavigable}
        touchZoomRotate={isNavigable}
        dragRotate={isNavigable}
        touchPitch={isNavigable}
        pitchWithRotate={isNavigable}
        keyboard={isNavigable}
        boxZoom={false}
        maxPitch={85}
        minPitch={0}
        bearingSnap={0}
        attributionControl={false}
        preserveDrawingBuffer={true}
        reuseMaps={true}
        maxTileCacheSize={350}
        fadeDuration={0}
        antialias={true}
        pixelRatio={Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 1, 3)}
        cooperativeGestures={false}
        trackResize={true}
        terrain={layerVisibility.terrain ? {
          source: 'terrain-source',
          exaggeration: 1.0
        } : undefined}
      >
        {/* Render Route GeoJSON Line */}
        {displayGeoJson && (
          <Source id="poster-route-source" type="geojson" data={displayGeoJson}>
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

      {/* ── Precision Compass Rose & 3D Tilt HUD Widget ── */}
      {interactive && (Math.abs(bearing) > 0.5 || pitch > 0.5) && (
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-center gap-1.5 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto select-none">
          <button
            type="button"
            onClick={() => {
              setBearing(0);
              setPitch(0);
            }}
            title="Reset Bearing to True North (0°) and Pitch to Flat (0°)"
            className="group flex items-center justify-center w-10 h-10 rounded-full bg-black/70 dark:bg-white/15 backdrop-blur-xl border border-white/25 shadow-2xl hover:bg-black/90 dark:hover:bg-white/25 active:scale-90 transition-all duration-200 cursor-pointer"
          >
            <div 
              className="w-5 h-5 flex flex-col items-center justify-center transition-transform duration-100 ease-out"
              style={{ transform: `rotate(${-bearing}deg)` }}
            >
              {/* Compass Needle (North Red, South White) */}
              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[9px] border-b-rose-500" />
              <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[9px] border-t-white/80" />
            </div>
          </button>
          
          {/* Live Pitch/Bearing Indicator */}
          <div className="px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/15 text-[10px] font-mono font-bold text-white/90 shadow-md">
            {Math.round(pitch)}° / {Math.round(bearing)}°
          </div>
        </div>
      )}
    </div>
  );
}