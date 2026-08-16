import React from 'react';
import {
  Layers,
  Globe2,
  Landmark,
  Compass,
  Droplet,
  TowerControl,
  Sparkles,
  MapPin,
  Activity,
  Trees,
  Building2,
  Car,
  Train,
  Plane,
  Mountain,
} from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';

export const LayersPanel: React.FC = () => {
  const {
    layerVisibility,
    toggleLayerVisibility,
    weatherPosition,
    setWeatherPosition,
    heatmapData,
    setHeatmapData,
    engineMode,
    setEngineMode,
    themeId,
    colorOverrides,
    customThemes,
  } = useMapStore();

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  const ALL_LAYERS = [
    { key: 'labels', label: 'Labels', icon: <Globe2 size={16} /> },
    { key: 'poiIcons', label: 'Landmarks', icon: <Landmark size={16} /> },
    { key: 'roads', label: 'Roads', icon: <Car size={16} /> },
    { key: 'buildings', label: 'Buildings', icon: <Building2 size={16} /> },
    { key: 'water', label: 'Water', icon: <Droplet size={16} /> },
    { key: 'landcover', label: 'Forests', icon: <Trees size={16} /> },
    { key: 'parks', label: 'Parks', icon: <Trees size={16} /> },
    { key: 'rail', label: 'Railways', icon: <Train size={16} /> },
    { key: 'aeroway', label: 'Airports', icon: <Plane size={16} /> },
    { key: 'buildings3D', label: '3D Heights', icon: <Building2 size={16} /> },
    { key: 'terrain', label: '3D Relief', icon: <Mountain size={16} /> },
    { key: 'contours', label: 'Contours', icon: <Compass size={16} /> },
    { key: 'bathymetry', label: 'Bathymetry', icon: <Droplet size={16} /> },
    { key: 'satellite', label: 'Satellite', icon: <TowerControl size={16} /> },
    { key: 'weather', label: 'Weather', icon: <Sparkles size={16} /> },
    { key: 'historical', label: 'Vintage', icon: <MapPin size={16} /> },
    { key: 'heatmap', label: 'Heatmap', icon: <Activity size={16} /> },
  ] as const;

  const activeLayersCount = Object.values(layerVisibility).filter(Boolean).length;

  const setPresetVisibility = (preset: 'all' | 'minimal' | 'roads' | 'outdoor') => {
    const keys = Object.keys(layerVisibility) as (keyof typeof layerVisibility)[];
    keys.forEach((k) => {
      let shouldBeOn = false;
      if (preset === 'all') shouldBeOn = true;
      else if (preset === 'minimal') shouldBeOn = k === 'water' || k === 'roads' || k === 'labels';
      else if (preset === 'roads') shouldBeOn = k === 'roads' || k === 'rail' || k === 'labels';
      else if (preset === 'outdoor') shouldBeOn = k === 'terrain' || k === 'contours' || k === 'water' || k === 'landcover' || k === 'labels';

      if (layerVisibility[k] !== shouldBeOn) {
        toggleLayerVisibility(k);
      }
    });
  };

  return (
    <div className="flex flex-col gap-4.5">
      {/* ── 1. HEADER & PRESETS ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layers size={16} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              MAP LAYERS
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-xl border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            {activeLayersCount} / {ALL_LAYERS.length} ON
          </span>
        </div>

        {/* 4 Presets */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {[
            { id: 'all', label: 'ALL' },
            { id: 'minimal', label: 'MINIMAL' },
            { id: 'roads', label: 'ROADS' },
            { id: 'outdoor', label: 'OUTDOOR' },
          ].map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPresetVisibility(p.id as any)}
              className="py-2 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
              style={{ color: subtextColor }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── 2. ENGINE MODE ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Globe2 size={16} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              ENGINE
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
            {engineMode === 'photorealistic' ? '3D GLOBE' : 'VECTOR'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          <button
            type="button"
            onClick={() => setEngineMode('vector')}
            className="py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
            style={
              engineMode === 'vector'
                ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                : { color: subtextColor }
            }
          >
            <Layers size={15} />
            <span className="text-[11px] font-sans font-extrabold tracking-wide uppercase">Vector Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setEngineMode('photorealistic')}
            className="py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
            style={
              engineMode === 'photorealistic'
                ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                : { color: subtextColor }
            }
          >
            <Globe2 size={15} />
            <span className="text-[11px] font-sans font-extrabold tracking-wide uppercase">Photoreal 3D</span>
          </button>
        </div>
      </div>

      {/* ── 3. CLEAN 2-COLUMN MATRIX OF LAYER CHIPS ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
            TOGGLE LAYERS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {ALL_LAYERS.map((item, idx) => {
            const isChecked = layerVisibility[item.key as keyof typeof layerVisibility];
            const isLastOdd = idx === ALL_LAYERS.length - 1 && ALL_LAYERS.length % 2 !== 0;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleLayerVisibility(item.key as keyof typeof layerVisibility)}
                className={`h-11 px-3.5 rounded-2xl border flex items-center justify-between transition-all cursor-pointer shadow-xs ${
                  isLastOdd ? 'col-span-2' : ''
                } ${
                  isChecked ? 'scale-[1.01]' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: isChecked ? `${brightAccent}18` : cardBg,
                  borderColor: isChecked ? brightAccent : borderColor,
                  color: isChecked ? textColor : subtextColor,
                  boxShadow: isChecked ? `0 0 0 1px ${brightAccent}40` : undefined,
                }}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span style={{ color: isChecked ? brightAccent : subtextColor }}>
                    {item.icon}
                  </span>
                  <span className="text-xs font-sans font-extrabold tracking-wide truncate">
                    {item.label}
                  </span>
                </div>

                {/* Minimalist Active Indicator Dot */}
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                    isChecked ? 'scale-100 shadow-xs' : 'opacity-25'
                  }`}
                  style={{ backgroundColor: isChecked ? brightAccent : subtextColor }}
                />
              </button>
            );
          })}
        </div>

        {/* Weather Position Drawer */}
        {layerVisibility.weather && (
          <div className="p-3 rounded-2xl border flex flex-col gap-2 mt-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
            <span className="text-[11px] font-mono font-bold uppercase" style={{ color: subtextColor }}>
              WEATHER BADGE POSITION
            </span>
            <div className="grid grid-cols-5 gap-1">
              {[
                { id: 'top-left', label: 'TL' },
                { id: 'top-center', label: 'TC' },
                { id: 'top-right', label: 'TR' },
                { id: 'bottom-left', label: 'BL' },
                { id: 'bottom-right', label: 'BR' },
              ].map((pos) => {
                const isPosActive = (weatherPosition || 'bottom-right') === pos.id;
                return (
                  <button
                    key={pos.id}
                    type="button"
                    onClick={() => setWeatherPosition(pos.id as any)}
                    className="py-1.5 text-[10px] font-mono font-bold rounded-xl border transition-all cursor-pointer text-center"
                    style={
                      isPosActive
                        ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                        : { backgroundColor: flyoutBg, borderColor, color: subtextColor }
                    }
                  >
                    {pos.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Heatmap Upload Drawer */}
        {layerVisibility.heatmap && (
          <div className="p-3 rounded-2xl border flex flex-col gap-2 mt-1 shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
            <span className="text-[11px] font-mono font-bold uppercase" style={{ color: subtextColor }}>
              HEATMAP DATA FILE (GEOJSON / CSV)
            </span>
            <label
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase border cursor-pointer transition-all hover:scale-[1.01]"
              style={{ backgroundColor: flyoutBg, borderColor, color: brightAccent }}
            >
              <Activity size={14} />
              {heatmapData ? 'Replace File' : 'Upload Data File'}
              <input
                type="file"
                accept=".geojson,.json,.csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const text = ev.target?.result as string;
                    try {
                      if (file.name.endsWith('.csv')) {
                        const lines = text.trim().split('\n');
                        const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
                        const latIdx = headers.indexOf('lat') !== -1 ? headers.indexOf('lat') : headers.indexOf('latitude');
                        const lngIdx = headers.indexOf('lng') !== -1 ? headers.indexOf('lng') : headers.indexOf('longitude');
                        if (latIdx === -1 || lngIdx === -1) {
                          alert('CSV must contain "lat" and "lng" column headers');
                          return;
                        }
                        const features = lines
                          .slice(1)
                          .map((line) => {
                            const cols = line.split(',');
                            const latVal = parseFloat(cols[latIdx]);
                            const lngVal = parseFloat(cols[lngIdx]);
                            if (isNaN(latVal) || isNaN(lngVal)) return null;
                            return {
                              type: 'Feature',
                              geometry: { type: 'Point', coordinates: [lngVal, latVal] },
                              properties: {},
                            };
                          })
                          .filter(Boolean);
                        setHeatmapData({ type: 'FeatureCollection', features });
                      } else {
                        const json = JSON.parse(text);
                        setHeatmapData(json);
                      }
                    } catch (err) {
                      console.error('Heatmap parse error:', err);
                      alert('Invalid data file format');
                    }
                  };
                  reader.readAsText(file);
                }}
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
