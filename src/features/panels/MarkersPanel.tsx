import React from 'react';
import {
  MapPin,
  Star,
  Heart,
  Flag,
  Target,
  Home,
  Landmark,
  Compass,
  Sparkles,
  CircleDot,
  Upload,
  Trash2,
  X,
  Crosshair,
  Palette,
} from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';

export const MarkersPanel: React.FC = () => {
  const {
    markers,
    clearMarkers,
    deleteMarker,
    activeMarkerSettings,
    setActiveMarkerSettings,
    customMarkers,
    addCustomMarker,
    removeCustomMarker,
    lat,
    lng,
    addMarker,
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
  const dangerText = uiColors.dangerText;

  const ICONS_GRID = [
    { name: 'MapPin', icon: <MapPin size={17} />, label: 'Pin' },
    { name: 'Star', icon: <Star size={17} />, label: 'Star' },
    { name: 'Heart', icon: <Heart size={17} />, label: 'Heart' },
    { name: 'Flag', icon: <Flag size={17} />, label: 'Flag' },
    { name: 'Target', icon: <Target size={17} />, label: 'Target' },
    { name: 'Home', icon: <Home size={17} />, label: 'Home' },
    { name: 'Landmark', icon: <Landmark size={17} />, label: 'Sight' },
    { name: 'Compass', icon: <Compass size={17} />, label: 'Nav' },
    { name: 'Sparkles', icon: <Sparkles size={17} />, label: 'Glow' },
    { name: 'dot', icon: <CircleDot size={17} />, label: 'Dot' },
  ];

  const COLOR_PALETTE = [
    '#ef4444',
    '#f97316',
    '#eab308',
    '#10b981',
    '#06b6d4',
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#18181b',
    '#ffffff',
  ];

  const handleDropCenterPin = () => {
    const customImg = activeMarkerSettings.customMarkerId
      ? customMarkers.find(c => c.id === activeMarkerSettings.customMarkerId)?.url
      : undefined;

    addMarker(lat, lng, {
      label: activeMarkerSettings.label || `Pin #${markers.length + 1}`,
      color: activeMarkerSettings.color,
      size: activeMarkerSettings.size,
      type: activeMarkerSettings.type,
      iconName: activeMarkerSettings.iconName,
      customImageUrl: customImg,
    });
  };

  return (
    <div className="flex flex-col gap-4.5">
      {/* ── 1. ACTIVE PIN STYLE & ICON SELECTION ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MapPin size={16} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              PIN STYLE & ICON
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-xl border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            {activeMarkerSettings.type === 'dot' ? 'DOT' : activeMarkerSettings.iconName}
          </span>
        </div>

        {/* 10-Icon Symmetrical 2x5 Grid */}
        <div className="grid grid-cols-5 gap-1.5 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {ICONS_GRID.map((item) => {
            const isDot = item.name === 'dot';
            const isActive = isDot 
              ? activeMarkerSettings.type === 'dot' 
              : activeMarkerSettings.iconName === item.name && activeMarkerSettings.type !== 'dot';

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => {
                  if (isDot) {
                    setActiveMarkerSettings({ type: 'dot' });
                  } else {
                    setActiveMarkerSettings({ type: 'icon', iconName: item.name });
                  }
                }}
                className={`py-2 px-1 flex flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 cursor-pointer text-center ${
                  isActive ? 'scale-[1.03]' : 'hover:scale-[1.03] active:scale-95'
                }`}
                style={
                  isActive
                    ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 10px ${brightAccent}45` }
                    : { color: subtextColor }
                }
              >
                {item.icon}
                <span className="text-[9px] font-mono font-bold uppercase tracking-wider">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. COLOR PALETTE & PIN SIZE ── */}
      <div className="flex flex-col gap-3 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette size={16} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              COLOR & SIZE
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-xl border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            {activeMarkerSettings.size}px
          </span>
        </div>

        {/* 10 Curated Color Swatches Row + Native Picker */}
        <div className="flex items-center justify-between p-2 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center gap-1.5 flex-1 justify-between pr-2">
            {COLOR_PALETTE.map((hex) => {
              const isSelected = activeMarkerSettings.color.toLowerCase() === hex.toLowerCase();
              return (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setActiveMarkerSettings({ color: hex })}
                  className={`w-5.5 h-5.5 rounded-full border transition-all cursor-pointer hover:scale-120 shrink-0 ${
                    isSelected ? 'ring-2 ring-offset-2 scale-115' : 'opacity-85 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: hex,
                    borderColor: borderColor,
                    outlineColor: brightAccent,
                  }}
                />
              );
            })}
          </div>

          <label className="w-6 h-6 rounded-full border shadow-inner cursor-pointer relative overflow-hidden shrink-0 flex items-center justify-center" style={{ borderColor }}>
            <input
              type="color"
              value={activeMarkerSettings.color}
              onChange={(e) => setActiveMarkerSettings({ color: e.target.value })}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
            <div className="w-full h-full" style={{ backgroundColor: activeMarkerSettings.color }} />
          </label>
        </div>

        {/* 4 Quick Size Presets */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {[
            { label: 'SMALL (32)', size: 32 },
            { label: 'MEDIUM (64)', size: 64 },
            { label: 'LARGE (128)', size: 128 },
            { label: 'XLARGE (200)', size: 200 },
          ].map((s) => {
            const isSelected = activeMarkerSettings.size === s.size;
            return (
              <button
                key={s.size}
                type="button"
                onClick={() => setActiveMarkerSettings({ size: s.size })}
                className="py-1.5 text-[9.5px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer text-center hover:scale-105 active:scale-95"
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

        {/* Pin Label Field */}
        <input
          type="text"
          placeholder="Default Pin Label (optional)..."
          value={activeMarkerSettings.label || ''}
          onChange={(e) => setActiveMarkerSettings({ label: e.target.value })}
          className="w-full h-11 border px-3.5 rounded-2xl text-xs font-sans font-bold focus:outline-none transition-colors shadow-xs"
          style={{ backgroundColor: cardBg, borderColor, color: textColor }}
        />
      </div>

      {/* ── 3. CUSTOM ICON UPLOADER ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
            CUSTOM ICON UPLOAD
          </span>
        </div>

        <label
          className="w-full h-11 rounded-2xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-neutral-400 group shadow-xs hover:scale-[1.008]"
          style={{ backgroundColor: cardBg, borderColor, color: textColor }}
        >
          <Upload size={15} className="group-hover:scale-110 transition-transform" style={{ color: brightAccent }} />
          <span className="text-xs font-sans font-extrabold uppercase tracking-wide">Upload Custom PNG / SVG</span>
          <input
            type="file"
            accept="image/png,image/svg+xml,image/jpeg"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (ev) => {
                const url = ev.target?.result as string;
                if (url) {
                  const newItem = addCustomMarker(file.name, url);
                  setActiveMarkerSettings({ type: 'custom', customMarkerId: newItem.id });
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </label>

        {customMarkers.length > 0 && (
          <div className="grid grid-cols-4 gap-2 pt-0.5">
            {customMarkers.map((cm) => {
              const isSelected = activeMarkerSettings.type === 'custom' && activeMarkerSettings.customMarkerId === cm.id;
              return (
                <div key={cm.id} className="relative group/cm">
                  <button
                    type="button"
                    onClick={() => setActiveMarkerSettings({ type: 'custom', customMarkerId: cm.id })}
                    className="w-full h-12 rounded-2xl border flex items-center justify-center p-1.5 cursor-pointer transition-all hover:scale-105 overflow-hidden shadow-xs"
                    style={
                      isSelected
                        ? { backgroundColor: brightAccent, borderColor: brightAccent }
                        : { backgroundColor: cardBg, borderColor }
                    }
                  >
                    <img src={cm.url} alt={cm.name} className="w-6 h-6 object-contain" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeCustomMarker(cm.id)}
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/cm:opacity-100 transition-opacity shadow-sm cursor-pointer"
                    title="Remove"
                  >
                    <X size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── 4. PLACED MARKERS LIST & CENTER DROP CTA ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
            PLACED MARKERS
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
              {markers.length} PINS
            </span>
            {markers.length > 0 && (
              <button
                type="button"
                onClick={clearMarkers}
                className="flex items-center gap-1 text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                style={{ backgroundColor: cardBg, borderColor, color: dangerText }}
              >
                <Trash2 size={11} />
                <span>CLEAR</span>
              </button>
            )}
          </div>
        </div>

        {/* Drop at Center Quick CTA Button */}
        <button
          type="button"
          onClick={handleDropCenterPin}
          className="w-full h-11 rounded-2xl border flex items-center justify-center gap-2 font-sans font-extrabold text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
          style={{ backgroundColor: `${brightAccent}15`, borderColor: brightAccent, color: brightAccent }}
        >
          <Crosshair size={15} />
          <span>+ Drop Pin at Canvas Center</span>
        </button>

        {markers.length === 0 ? (
          <div className="p-3.5 rounded-2xl border text-center flex items-center justify-center gap-2 opacity-65 shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
            <MapPin size={16} style={{ color: subtextColor }} />
            <span className="text-xs font-sans font-bold" style={{ color: textColor }}>Click anywhere on map poster to drop pins</span>
          </div>
        ) : (
          <div className="flex flex-col rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
            {markers.map((m, idx) => (
              <div
                key={m.id}
                className="p-3 flex items-center justify-between transition-all group hover:bg-black/5 dark:hover:bg-white/5 gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div 
                    className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
                    style={{ backgroundColor: flyoutBg, borderColor, color: m.color || '#ef4444' }}
                  >
                    {m.type === 'custom' && m.customImageUrl ? (
                      <img 
                        src={m.customImageUrl} 
                        alt="" 
                        className="w-5 h-5 object-contain" 
                      />
                    ) : (
                      <MapPin size={16} className="fill-current" />
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-black font-sans tracking-tight truncate" style={{ color: textColor }}>
                      {m.label || `Marker #${idx + 1}`}
                    </span>
                    <span className="text-[10px] font-mono opacity-75 truncate" style={{ color: subtextColor }}>
                      {m.lat.toFixed(3)}°, {m.lng.toFixed(3)}°
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteMarker(m.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-500 shrink-0"
                  style={{ color: subtextColor }}
                  title="Remove marker"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
