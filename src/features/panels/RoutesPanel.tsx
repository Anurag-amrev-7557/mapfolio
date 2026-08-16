import React, { useState } from 'react';
import {
  Route as RouteIcon,
  Navigation,
  Upload,
  Car,
  Bike,
  Footprints,
  Crosshair,
  Trash2,
  X,
} from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';
import { fetchOsrmRoadRoute, RouteElevationCard, parseGpxTrack } from '@/features/routing';

export const RoutesPanel: React.FC = () => {
  const {
    route,
    setRouteGeoJson,
    setRouteColor,
    setRouteWidth,
    setRouteLineStyle,
    setRouteWaypointSize,
    toggleElevationProfile,
    clearRoute,
    isDrawingRoute,
    setIsDrawingRoute,
    routeWaypoints,
    addRouteWaypoint,
    removeRouteWaypoint,
    clearRouteWaypoints,
    routingProfile,
    setRoutingProfile,
    routePreference,
    setRoutePreference,
    setLocation,
    autoScaleToViewport,
    themeId,
    colorOverrides,
    customThemes,
  } = useMapStore();

  const [routeSubTab, setRouteSubTab] = useState<'build' | 'style' | 'presets'>('build');

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;
  const dangerText = uiColors.dangerText;

  const handleGpxFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseGpxTrack(content);
      if (parsed) {
        setRouteGeoJson(parsed.geojson, parsed.name || file.name, parsed.distanceKm);

        // Auto-center map on middle GPX coordinate
        const coords = parsed.geojson.geometry.coordinates;
        if (coords && coords.length > 0) {
          const midIdx = Math.floor(coords.length / 2);
          const [midLng, midLat] = coords[midIdx];
          setLocation(midLat, midLng, 12);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. HEADER & NAVIGATION ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <RouteIcon size={16} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              ROUTES & TRACKS
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xl border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
              {route.distanceKm ? `${route.distanceKm} KM` : 'NO ROUTE'}
            </span>
            {route.geojson && (
              <button
                type="button"
                onClick={clearRoute}
                className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                style={{ backgroundColor: cardBg, borderColor, color: dangerText }}
              >
                <Trash2 size={11} />
                <span>CLEAR</span>
              </button>
            )}
          </div>
        </div>

        {/* 3-Segment Sub-Tab Control Bar */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {(
            [
              { id: 'build', label: 'BUILDER' },
              { id: 'style', label: 'STYLE' },
              { id: 'presets', label: 'PRESETS' },
            ] as const
          ).map((tab) => {
            const isActive = routeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRouteSubTab(tab.id)}
                className="py-2 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
                style={
                  isActive
                    ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                    : { color: subtextColor }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. SUB-TAB 1: ROUTE BUILDER & WAYPOINTS ── */}
      {routeSubTab === 'build' && (
        <div className="flex flex-col gap-4">
          {/* Interactive Plotter Mode Controller */}
          <div
            onClick={() => setIsDrawingRoute(!isDrawingRoute)}
            className={`p-3 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-xs ${
              isDrawingRoute ? 'scale-[1.01]' : 'hover:scale-[1.01]'
            }`}
            style={{
              backgroundColor: isDrawingRoute ? `${brightAccent}15` : cardBg,
              borderColor: isDrawingRoute ? brightAccent : borderColor,
              boxShadow: isDrawingRoute ? `0 0 0 1px ${brightAccent}40, 0 4px 16px ${brightAccent}20` : undefined,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform"
                style={{
                  backgroundColor: isDrawingRoute ? brightAccent : flyoutBg,
                  color: isDrawingRoute ? '#ffffff' : brightAccent,
                  borderColor: isDrawingRoute ? brightAccent : `${brightAccent}40`,
                }}
              >
                <Navigation size={16} className={isDrawingRoute ? 'animate-pulse' : ''} />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-sans font-black uppercase tracking-wide truncate" style={{ color: textColor }}>
                    {isDrawingRoute ? 'Plotting Active' : 'Route Plotter'}
                  </span>
                  {isDrawingRoute && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                  )}
                </div>
                <span className="text-[10px] font-sans truncate opacity-75 leading-tight" style={{ color: subtextColor }}>
                  {isDrawingRoute ? 'Click map canvas to add waypoints' : 'Click to enable waypoint plotting'}
                </span>
              </div>
            </div>

            {/* iOS Switch Toggle */}
            <div
              className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex items-center px-0.5 shrink-0 ${
                isDrawingRoute ? '' : 'bg-neutral-500/25'
              }`}
              style={{
                backgroundColor: isDrawingRoute ? brightAccent : undefined,
              }}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                  isDrawingRoute ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
          </div>

          {/* Network Profile & Priority Combined */}
          <div className="flex flex-col gap-2 pb-3.5 border-b" style={{ borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                ROUTING MODE
              </span>
              <span className="text-[11px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
                {routingProfile}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
              {(
                [
                  { id: 'driving', label: 'Drive', icon: <Car size={15} /> },
                  { id: 'cycling', label: 'Bike', icon: <Bike size={15} /> },
                  { id: 'foot', label: 'Walk', icon: <Footprints size={15} /> },
                  { id: 'direct', label: 'Direct', icon: <Crosshair size={15} /> },
                ] as const
              ).map((mode) => {
                const isActive = routingProfile === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setRoutingProfile(mode.id)}
                    className="py-2 flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
                    style={
                      isActive
                        ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                        : { color: subtextColor }
                    }
                  >
                    {mode.icon}
                    <span className="text-[9.5px] font-mono font-bold uppercase">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Subtle Priority Toggle */}
            {routingProfile !== 'direct' && (
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl border shadow-xs mt-0.5" style={{ backgroundColor: cardBg, borderColor }}>
                {(
                  [
                    { id: 'shortest', label: 'SHORTEST' },
                    { id: 'fastest', label: 'FASTEST' },
                  ] as const
                ).map((pref) => {
                  const isActive = routePreference === pref.id;
                  return (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setRoutePreference(pref.id)}
                      className="py-1.5 text-[9.5px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
                      style={
                        isActive
                          ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                          : { color: subtextColor }
                      }
                    >
                      {pref.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Elevation Profile Card */}
          <RouteElevationCard
            route={route}
            uiColors={uiColors}
            onTogglePosterBadge={toggleElevationProfile}
          />

          {/* Placed Waypoints List */}
          {routeWaypoints.length > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                  WAYPOINTS
                </span>
                <button
                  type="button"
                  onClick={clearRouteWaypoints}
                  className="text-[10px] font-mono font-bold uppercase hover:underline cursor-pointer"
                  style={{ color: dangerText }}
                >
                  Clear Points ({routeWaypoints.length})
                </button>
              </div>

              <div className="flex flex-col rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10 max-h-48 overflow-y-auto no-scrollbar" style={{ backgroundColor: cardBg, borderColor }}>
                {routeWaypoints.map((wp, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 flex items-center justify-between transition-all group hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <div className="flex items-center gap-2.5">
                      <span 
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono font-bold text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: route.color || brightAccent }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-mono font-bold" style={{ color: textColor }}>
                        {wp.lat.toFixed(4)}°, {wp.lng.toFixed(4)}°
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRouteWaypoint(idx)}
                      className="w-6 h-6 rounded-lg flex items-center justify-center opacity-60 hover:opacity-100 hover:text-rose-500 cursor-pointer"
                      style={{ color: subtextColor }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. SUB-TAB 2: STYLE & VISUAL OPTIONS ── */}
      {routeSubTab === 'style' && (
        <div className="flex flex-col gap-4">
          {/* Pattern & Effect Segmented Bar */}
          <div className="flex flex-col gap-2 pb-3.5 border-b" style={{ borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              LINE PATTERN
            </span>

            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
              {(
                [
                  { id: 'solid', label: 'Solid' },
                  { id: 'dashed', label: 'Dashed' },
                  { id: 'dotted', label: 'Dotted' },
                  { id: 'neon', label: 'Neon' },
                ] as const
              ).map((style) => {
                const isActive = (route.lineStyle || 'solid') === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setRouteLineStyle(style.id)}
                    className="py-2 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
                    style={
                      isActive
                        ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                        : { color: subtextColor }
                    }
                  >
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Line Color Swatches & Thickness */}
          <div className="flex flex-col gap-3 pb-3.5 border-b" style={{ borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                LINE COLOR & WIDTH
              </span>
              <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xl border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                {route.width || 4}px WIDTH
              </span>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center justify-between p-2 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
              <div className="flex items-center gap-2">
                {[
                  { color: brightAccent, label: 'Theme' },
                  { color: '#3b82f6', label: 'Blue' },
                  { color: '#ef4444', label: 'Red' },
                  { color: '#10b981', label: 'Green' },
                  { color: '#f59e0b', label: 'Gold' },
                  { color: '#ec4899', label: 'Pink' },
                  { color: '#18181b', label: 'Dark' },
                  { color: '#ffffff', label: 'White' },
                ].map((preset) => (
                  <button
                    key={preset.color}
                    type="button"
                    onClick={() => setRouteColor(preset.color)}
                    className={`w-6 h-6 rounded-full border transition-all cursor-pointer hover:scale-115 shrink-0 ${
                      route.color === preset.color ? 'ring-2 ring-offset-2 scale-115' : ''
                    }`}
                    style={{
                      backgroundColor: preset.color,
                      borderColor,
                      outlineColor: brightAccent,
                    }}
                    title={preset.label}
                  />
                ))}
              </div>

              <input
                type="color"
                value={route.color || brightAccent}
                onChange={(e) => setRouteColor(e.target.value)}
                className="w-6 h-6 rounded-full border cursor-pointer p-0 bg-transparent shrink-0 overflow-hidden"
                style={{ borderColor }}
                title="Custom color picker"
              />
            </div>

            {/* Line Thickness Slider */}
            <div className="flex items-center gap-3 px-1">
              <span className="text-[10px] font-mono font-bold opacity-75 shrink-0" style={{ color: subtextColor }}>1px</span>
              <input
                type="range"
                min="1"
                max="32"
                step="1"
                value={route.width || 4}
                onChange={(e) => setRouteWidth(parseInt(e.target.value))}
                className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
                style={{ backgroundColor: flyoutBg, accentColor: brightAccent }}
              />
              <span className="text-[10px] font-mono font-bold opacity-75 shrink-0" style={{ color: subtextColor }}>32px</span>
            </div>
          </div>

          {/* Waypoint Dot Size */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                WAYPOINT PIN SIZE
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => autoScaleToViewport(window.innerWidth, window.innerHeight)}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95"
                  style={{ backgroundColor: cardBg, borderColor, color: brightAccent }}
                >
                  ⚡ Auto-Fit
                </button>
                <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xl border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                  {route.waypointSize || 36}px
                </span>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
              {[
                { label: 'SM', size: 32 },
                { label: 'MD', size: 64 },
                { label: 'LG', size: 96 },
                { label: 'XL', size: 144 },
                { label: '2XL', size: 200 },
              ].map((s) => {
                const isSelected = (route.waypointSize || 36) === s.size;
                return (
                  <button
                    key={s.size}
                    type="button"
                    onClick={() => setRouteWaypointSize(s.size)}
                    className="py-1.5 text-[10px] font-mono font-bold rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
                    style={
                      isSelected
                        ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                        : { color: subtextColor }
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SUB-TAB 3: PRESETS & GPX IMPORT ── */}
      {routeSubTab === 'presets' && (
        <div className="flex flex-col gap-4">
          {/* GPX Upload Zone */}
          <div className="flex flex-col gap-2 pb-3.5 border-b" style={{ borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              IMPORT GPX TRACK
            </span>

            <label 
              className="w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-neutral-400 group shadow-xs hover:scale-[1.008]"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <Upload size={22} style={{ color: brightAccent }} className="transition-transform group-hover:scale-110" />
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: textColor }}>
                  Drop .GPX track file here
                </span>
                <span className="text-[10.5px] font-sans opacity-75 mt-0.5" style={{ color: subtextColor }}>
                  Strava, Garmin, Komoot & AllTrails
                </span>
              </div>
              <input
                type="file"
                accept=".gpx"
                onChange={handleGpxFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Curated Route Presets Grid */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                ICONIC ROUTES
              </span>
              <span className="text-[11px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
                1-CLICK LOAD
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  name: 'NYC Marathon',
                  desc: 'Staten Island to Central Park',
                  dist: '42.2 KM',
                  pts: [
                    { lat: 40.6033, lng: -74.0535 },
                    { lat: 40.6500, lng: -73.9900 },
                    { lat: 40.7128, lng: -73.9550 },
                    { lat: 40.7484, lng: -73.9857 },
                    { lat: 40.7829, lng: -73.9654 },
                  ],
                },
                {
                  name: 'Paris Circuit',
                  desc: 'Eiffel to Arc de Triomphe',
                  dist: '16.8 KM',
                  pts: [
                    { lat: 48.8584, lng: 2.2945 },
                    { lat: 48.8606, lng: 2.3376 },
                    { lat: 48.8530, lng: 2.3499 },
                    { lat: 48.8738, lng: 2.2950 },
                  ],
                },
                {
                  name: 'London Path',
                  desc: 'Westminster to Tower Bridge',
                  dist: '12.5 KM',
                  pts: [
                    { lat: 51.4995, lng: -0.1248 },
                    { lat: 51.5074, lng: -0.1278 },
                    { lat: 51.5081, lng: -0.0980 },
                    { lat: 51.5055, lng: -0.0754 },
                  ],
                },
                {
                  name: 'Coast Run',
                  desc: 'Golden Gate to Ocean Beach',
                  dist: '18.4 KM',
                  pts: [
                    { lat: 37.8199, lng: -122.4783 },
                    { lat: 37.7950, lng: -122.4680 },
                    { lat: 37.7690, lng: -122.4862 },
                    { lat: 37.7600, lng: -122.5080 },
                  ],
                },
              ].map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    clearRouteWaypoints();
                    preset.pts.forEach((pt) => addRouteWaypoint(pt.lat, pt.lng));
                    setLocation(preset.pts[0].lat, preset.pts[0].lng, 12);
                    fetchOsrmRoadRoute(preset.pts, routingProfile, routePreference).then((res) => {
                      if (res) {
                        setRouteGeoJson(res.geojson, preset.name, res.distanceKm, {
                          durationMin: res.durationMin,
                          elevationGainMeters: res.elevationGainMeters,
                          elevationLossMeters: res.elevationLossMeters,
                          maxElevationMeters: res.maxElevationMeters,
                          elevationProfile: res.elevationProfile,
                        });
                      }
                    });
                  }}
                  className="p-3 rounded-2xl border flex flex-col justify-between gap-1.5 text-left transition-all hover:scale-105 active:scale-95 cursor-pointer group shadow-xs"
                  style={{ backgroundColor: cardBg, borderColor }}
                >
                  <div className="flex flex-col">
                    <span className="text-xs font-black font-sans uppercase tracking-tight truncate" style={{ color: textColor }}>
                      {preset.name}
                    </span>
                    <span className="text-[10px] font-sans opacity-75 truncate" style={{ color: subtextColor }}>
                      {preset.desc}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-bold" style={{ color: brightAccent }}>
                    {preset.dist}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
