import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Type, Frame, Sliders, Layers, Sun, Moon, Sparkles, Compass } from 'lucide-react';
import {
  useMapStore,
  FONT_OPTIONS,
  getFontByValue,
  getUIThemeColors,
  type FontOption,
  type FontCategory,
} from '@/core';

export const StylePanel: React.FC = () => {
  const {
    title,
    subtitle,
    setText,
    fontFamily,
    setFontFamily,
    letterSpacingMultiplier = 1.0,
    setLetterSpacingMultiplier,
    borderStyle,
    setBorderStyle,
    showTextOverlay,
    toggleTextOverlay,
    showGradientOverlay,
    toggleGradientOverlay,
    showCompass,
    toggleCompass,
    showScaleBar,
    toggleScaleBar,
    showRouteStats,
    toggleRouteStats,
    sunAzimuth,
    setSunAzimuth,
    sunPolarAngle,
    setSunPolarAngle,
    sunIntensity,
    setSunIntensity,
    celestialBody,
    setCelestialBody,
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

  // Font Category Filter
  const [fontCategoryFilter, setFontCategoryFilter] = useState<FontCategory | 'all'>('all');

  // Custom Select dropdown state
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFontOption = getFontByValue(fontFamily);

  const filteredFonts = FONT_OPTIONS.filter(
    (f: FontOption) => fontCategoryFilter === 'all' || f.category === fontCategoryFilter
  );

  return (
    <div className="flex flex-col gap-4.5">
      {/* ── 1. POSTER LABELS ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Type size={18} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              POSTER TEXT
            </span>
          </div>

          {/* Quick Uppercase / Title Case Transform */}
          <button
            type="button"
            onClick={() => setText(title === title.toUpperCase() ? title.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : title.toUpperCase(), subtitle)}
            className="text-[9px] font-sans font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            style={{ backgroundColor: cardBg, borderColor, color: subtextColor }}
            title="Toggle Upper / Title case"
          >
            Aa CASE
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <input
            type="text"
            placeholder="POSTER TITLE"
            value={title}
            onChange={(e) => setText(e.target.value, subtitle)}
            className="w-full h-12 border px-4 rounded-2xl text-sm font-sans font-black tracking-wide focus:outline-none transition-all shadow-xs"
            style={{ backgroundColor: cardBg, borderColor, color: textColor }}
          />

          <input
            type="text"
            placeholder="Subtitle, Country, Coordinates..."
            value={subtitle}
            onChange={(e) => setText(title, e.target.value)}
            className="w-full h-11 border px-4 rounded-2xl text-xs font-sans font-bold focus:outline-none transition-all shadow-xs"
            style={{ backgroundColor: cardBg, borderColor, color: textColor }}
          />
        </div>
      </div>

      {/* ── 2. TYPOGRAPHY & LETTER SPACING ── */}
      <div className="flex flex-col gap-3 pb-3.5 border-b relative" ref={fontDropdownRef} style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders size={18} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              TYPOGRAPHY
            </span>
          </div>
          <span className="text-[9px] font-sans font-black tracking-widest uppercase px-2.5 py-1 rounded-lg border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            {letterSpacingMultiplier.toFixed(1)}x SPACING
          </span>
        </div>

        {/* Font Trigger Bar */}
        <button
          type="button"
          onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
          className="w-full h-12 border rounded-2xl px-4 flex items-center justify-between focus:outline-none transition-all shadow-xs cursor-pointer hover:border-neutral-400"
          style={{ 
            backgroundColor: cardBg, 
            borderColor: isFontDropdownOpen ? brightAccent : borderColor,
            color: textColor 
          }}
        >
          <div className="flex items-center gap-2.5 truncate">
            <span 
              className="font-bold text-base tracking-wide truncate"
              style={{ fontFamily: selectedFontOption.value, color: textColor }}
            >
              {selectedFontOption.label}
            </span>
            <span className="text-[9px] font-sans font-black tracking-widest uppercase px-2 py-0.5 rounded-md border" style={{ backgroundColor: flyoutBg, borderColor, color: subtextColor }}>
              {selectedFontOption.category}
            </span>
          </div>
          <ChevronDown 
            size={18} 
            className={`shrink-0 transition-transform duration-200 ${isFontDropdownOpen ? 'rotate-180' : ''}`}
            style={{ color: subtextColor }}
          />
        </button>

        {/* Floating Font Dropdown Menu */}
        {isFontDropdownOpen && (
          <div 
            className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl flex flex-col"
            style={{ 
              backgroundColor: cardBg, 
              borderColor,
              maxHeight: '320px'
            }}
          >
            {/* Category Filter Tabs */}
            <div className="p-1.5 border-b flex gap-1 shrink-0 bg-black/20" style={{ borderColor }}>
              {(
                [
                  { id: 'all', label: 'ALL' },
                  { id: 'sans-serif', label: 'SANS' },
                  { id: 'serif', label: 'SERIF' },
                  { id: 'display', label: 'DISPLAY' },
                  { id: 'monospace', label: 'MONO' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFontCategoryFilter(cat.id)}
                  className="flex-1 py-1.5 text-[9px] font-sans font-black tracking-widest uppercase rounded-lg transition-all cursor-pointer"
                  style={
                    fontCategoryFilter === cat.id
                      ? { backgroundColor: brightAccent, color: '#ffffff' }
                      : { color: subtextColor }
                  }
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Font Options List */}
            <div className="p-1.5 flex flex-col gap-1 overflow-y-auto max-h-[260px] no-scrollbar">
              {filteredFonts.map((font: FontOption) => {
                const isSelected = font.value === fontFamily || font.id === selectedFontOption.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      setFontFamily(font.value);
                      setIsFontDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                      isSelected ? 'shadow-xs font-bold' : 'hover:bg-black/10'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: brightAccent, color: '#ffffff' }
                        : { color: textColor }
                    }
                  >
                    <span 
                      className="text-base truncate"
                      style={{ fontFamily: font.value, letterSpacing: font.titleTracking }}
                    >
                      {font.label}
                    </span>
                    <span 
                      className="text-[8.5px] font-sans font-black tracking-widest uppercase px-2 py-0.5 rounded-md border shrink-0"
                      style={{ backgroundColor: flyoutBg, borderColor, color: isSelected ? '#ffffff' : subtextColor }}
                    >
                      {font.category}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Compact Letter Spacing Slider */}
        <div className="flex items-center gap-3 px-1">
          <span className="text-[9px] font-sans font-black tracking-widest uppercase opacity-75 shrink-0" style={{ color: subtextColor }}>
            TRACKING
          </span>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={letterSpacingMultiplier}
            onChange={(e) => setLetterSpacingMultiplier(parseFloat(e.target.value))}
            className="flex-1 h-2 rounded-lg appearance-none cursor-pointer"
            style={{ backgroundColor: flyoutBg, accentColor: brightAccent }}
          />
        </div>
      </div>

      {/* ── 3. BORDER & FRAME MOTIFS ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Frame size={18} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              FRAME STYLE
            </span>
          </div>
          <span className="text-[9px] font-sans font-black tracking-widest uppercase opacity-75" style={{ color: subtextColor }}>
            {borderStyle.toUpperCase()}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {(
            [
              { id: 'none', label: 'NONE' },
              { id: 'thin', label: 'THIN' },
              { id: 'double', label: 'DOUBLE' },
              { id: 'rounded', label: 'ROUND' },
              { id: 'art-deco', label: 'DECO' },
            ] as const
          ).map((styleOpt) => {
            const isSelected = (borderStyle || 'none') === styleOpt.id;
            return (
              <button
                key={styleOpt.id}
                type="button"
                onClick={() => setBorderStyle(styleOpt.id)}
                className="py-2.5 text-[9px] font-sans font-black tracking-widest uppercase rounded-xl transition-all cursor-pointer text-center"
                style={
                  isSelected
                    ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                    : { color: subtextColor }
                }
              >
                {styleOpt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 4. CELESTIAL LIGHTING STUDIO (SUN / MOON & SHADOWS) ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {celestialBody === 'moon' ? (
              <Moon size={18} style={{ color: '#93c5fd' }} />
            ) : celestialBody === 'sun' ? (
              <Sun size={18} style={{ color: '#f59e0b' }} />
            ) : (
              <Sparkles size={18} style={{ color: brightAccent }} />
            )}
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              SUN & MOON LIGHTING
            </span>
          </div>
          <span className="text-[9px] font-sans font-black tracking-widest uppercase opacity-80" style={{ color: subtextColor }}>
            3D SHADOWS
          </span>
        </div>

        {/* Celestial Body Mode Switcher */}
        <div className="grid grid-cols-3 p-1 rounded-2xl border gap-1" style={{ backgroundColor: cardBg, borderColor }}>
          {[
            { id: 'auto', label: 'Auto (Theme)', icon: <Sparkles size={13} /> },
            { id: 'sun', label: 'Sunlight', icon: <Sun size={13} /> },
            { id: 'moon', label: 'Moonlight', icon: <Moon size={13} /> },
          ].map((mode) => {
            const isSelected = celestialBody === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setCelestialBody(mode.id as any)}
                className="flex items-center justify-center gap-1.5 py-2 text-[9px] font-sans font-black tracking-wider uppercase rounded-xl transition-all cursor-pointer"
                style={
                  isSelected
                    ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                    : { color: subtextColor }
                }
              >
                {mode.icon}
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quick Atmosphere Presets */}
        <div className="grid grid-cols-5 gap-1 pt-1">
          {[
            { label: 'Dawn', az: 90, el: 20, body: 'sun', icon: '🌅' },
            { label: 'Noon', az: 180, el: 80, body: 'sun', icon: '☀️' },
            { label: 'Sunset', az: 270, el: 18, body: 'sun', icon: '🌇' },
            { label: 'Moon', az: 140, el: 45, body: 'moon', icon: '🌙' },
            { label: 'Eclipse', az: 315, el: 25, body: 'moon', icon: '🌌' },
          ].map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setSunAzimuth(preset.az);
                setSunPolarAngle(preset.el);
                setCelestialBody(preset.body as any);
              }}
              className="flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 text-center"
              style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              title={`${preset.label} Lighting Preset`}
            >
              <span className="text-xs">{preset.icon}</span>
              <span className="text-[8px] font-sans font-black uppercase tracking-tight" style={{ color: subtextColor }}>
                {preset.label}
              </span>
            </button>
          ))}
        </div>

        {/* Direction & Azimuth Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black font-sans uppercase tracking-wider flex items-center gap-1.5" style={{ color: textColor }}>
              <Compass size={13} style={{ color: brightAccent }} />
              Light Direction (Azimuth)
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10" style={{ color: brightAccent }}>
              {sunAzimuth}° {
                sunAzimuth >= 337.5 || sunAzimuth < 22.5 ? 'N' :
                sunAzimuth < 67.5 ? 'NE' :
                sunAzimuth < 112.5 ? 'E' :
                sunAzimuth < 157.5 ? 'SE' :
                sunAzimuth < 202.5 ? 'S' :
                sunAzimuth < 247.5 ? 'SW' :
                sunAzimuth < 292.5 ? 'W' : 'NW'
              }
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            step="5"
            value={sunAzimuth}
            onChange={(e) => setSunAzimuth(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-black/10 dark:bg-white/10"
          />
        </div>

        {/* Altitude / Polar Angle Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black font-sans uppercase tracking-wider" style={{ color: textColor }}>
              Sun / Moon Altitude (Shadow Length)
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10" style={{ color: brightAccent }}>
              {sunPolarAngle}°
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="85"
            step="1"
            value={sunPolarAngle}
            onChange={(e) => setSunPolarAngle(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-black/10 dark:bg-white/10"
          />
        </div>

        {/* Light Intensity Slider */}
        <div className="flex flex-col gap-1.5 p-3 rounded-2xl border" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black font-sans uppercase tracking-wider" style={{ color: textColor }}>
              Light & Shadow Intensity
            </span>
            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10" style={{ color: brightAccent }}>
              {Math.round(sunIntensity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={sunIntensity}
            onChange={(e) => setSunIntensity(parseFloat(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 rounded-lg bg-black/10 dark:bg-white/10"
          />
        </div>
      </div>

      {/* ── 5. POSTER OVERLAYS ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              OVERLAY ELEMENTS
            </span>
          </div>
          <span className="text-[9px] font-sans font-black tracking-widest uppercase opacity-75" style={{ color: subtextColor }}>
            TOGGLES
          </span>
        </div>

        <div className="flex flex-col rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
          {[
            { key: 'text', label: 'Bottom Text Banner', value: showTextOverlay, toggle: toggleTextOverlay },
            { key: 'gradient', label: 'Gradient Vignette', value: showGradientOverlay, toggle: toggleGradientOverlay },
            { key: 'compass', label: 'Compass Rose', value: showCompass, toggle: toggleCompass },
            { key: 'scalebar', label: 'Map Scale Bar', value: showScaleBar, toggle: toggleScaleBar },
            { key: 'routestats', label: 'Route Stats Card', value: showRouteStats, toggle: toggleRouteStats },
          ].map((item) => (
            <div
              key={item.key}
              onClick={item.toggle}
              className="flex items-center justify-between py-3 px-4 cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5 select-none"
            >
              <span className="text-xs font-black font-sans uppercase tracking-wide" style={{ color: textColor }}>
                {item.label}
              </span>

              {/* Spacious iOS Switch Toggle */}
              <div 
                className={`w-11 h-6 rounded-full transition-colors duration-200 relative flex items-center px-0.5 shrink-0 ${
                  item.value ? '' : 'bg-neutral-500/25'
                }`}
                style={{
                  backgroundColor: item.value ? brightAccent : undefined,
                }}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-200 ${
                    item.value ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
