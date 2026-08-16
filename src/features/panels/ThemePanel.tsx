import React, { useState, useMemo } from 'react';
import {
  MAP_THEMES,
  getTheme,
  useMapStore,
  getUIThemeColors,
  type ColorOverrideKeys,
} from '@/core';
import { Palette, RotateCcw, Check, Plus, Trash2, Sparkles, Search, SlidersHorizontal } from 'lucide-react';

export const ThemePanel: React.FC = () => {
  const {
    themeId,
    setTheme,
    colorOverrides,
    setColorOverride,
    resetColorOverrides,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
  } = useMapStore();

  const [showColorEditor, setShowColorEditor] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [themeFilter, setThemeFilter] = useState<'all' | 'dark' | 'light'>('all');

  const activeTheme = getTheme(themeId, customThemes);
  const { palette } = activeTheme;

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const textColor = uiColors.textColor;
  const brightAccent = uiColors.brightAccent;
  const dangerText = uiColors.dangerText;

  const colorItems: { key: ColorOverrideKeys; label: string; defaultColor: string }[] = [
    { key: 'land', label: 'Land', defaultColor: palette.land },
    { key: 'landcover', label: 'Landcover', defaultColor: palette.landcover },
    { key: 'water', label: 'Water', defaultColor: palette.water },
    { key: 'waterway', label: 'Waterways', defaultColor: palette.waterway },
    { key: 'parks', label: 'Parks', defaultColor: palette.parks },
    { key: 'buildings', label: 'Buildings', defaultColor: palette.buildings },
    { key: 'aeroway', label: 'Aeroway', defaultColor: palette.aeroway },
    { key: 'rail', label: 'Rail', defaultColor: palette.rail },
    { key: 'roadsMajor', label: 'Roads Major', defaultColor: palette.roads.major },
    { key: 'roadsMinorHigh', label: 'Roads Minor', defaultColor: palette.roads.minor_high },
    { key: 'roadsMinorMid', label: 'Roads Mid', defaultColor: palette.roads.minor_mid },
    { key: 'roadsMinorLow', label: 'Roads Low', defaultColor: palette.roads.minor_low },
    { key: 'roadsPath', label: 'Paths', defaultColor: palette.roads.path },
    { key: 'roadsOutline', label: 'Road Outline', defaultColor: palette.roads.outline },
  ];

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;
    saveCustomTheme(newThemeName);
    setNewThemeName('');
    setShowColorEditor(false);
  };

  // Helper to test if a color is perceptually dark
  const isColorDark = (hex: string) => {
    const cleanHex = hex.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
    const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
    const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  // Filtered Preset Themes
  const filteredThemes = useMemo(() => {
    return MAP_THEMES.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (themeFilter === 'all') return true;
      const isDark = isColorDark(t.palette.land);
      return themeFilter === 'dark' ? isDark : !isDark;
    });
  }, [searchQuery, themeFilter]);

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── 1. HEADER & SEARCH / FILTER CONTROLS ── */}
      <div className="flex flex-col gap-2.5 pb-3 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Palette size={15} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
              THEME PALETTES
            </span>
          </div>

          {/* Custom Editor Toggle Button */}
          <button
            type="button"
            onClick={() => setShowColorEditor(!showColorEditor)}
            className="flex items-center gap-1.5 text-[11px] font-sans font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            style={
              showColorEditor
                ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                : { backgroundColor: cardBg, borderColor, color: textColor }
            }
          >
            <SlidersHorizontal size={12} />
            <span>{showColorEditor ? 'Close' : 'Customize'}</span>
          </button>
        </div>

        {/* Search & Mode Filter Pills */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: subtextColor }}
            />
            <input
              type="text"
              placeholder="Search palette names..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 border pl-8 pr-7 rounded-xl text-xs font-sans font-medium focus:outline-none transition-all shadow-2xs"
              style={{
                backgroundColor: cardBg,
                borderColor,
                color: textColor,
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-5 h-5 rounded-lg absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center text-xs opacity-60 hover:opacity-100 cursor-pointer"
                style={{ color: textColor }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1">
            {(['all', 'dark', 'light'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setThemeFilter(mode)}
                className="px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider border transition-all cursor-pointer shadow-2xs"
                style={
                  themeFilter === mode
                    ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                    : { backgroundColor: cardBg, borderColor, color: subtextColor }
                }
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 2. GPU-ACCELERATED CUSTOM PALETTE ACCORDION EDITOR ── */}
      <div 
        className="shrink-0 transform-gpu grid transition-all"
        style={{
          gridTemplateRows: showColorEditor ? '1fr' : '0fr',
          opacity: showColorEditor ? 1 : 0,
          transition: 'grid-template-rows 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease',
        }}
      >
        <div className="overflow-hidden">
          <div className="pb-3 border-b flex flex-col gap-3" style={{ borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                CUSTOM COLOR OVERRIDES
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const randomHex = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                    colorItems.forEach((item) => {
                      setColorOverride(item.key, randomHex());
                    });
                  }}
                  className="flex items-center gap-1 text-[11px] font-sans font-bold hover:underline cursor-pointer"
                  style={{ color: brightAccent }}
                  title="Randomly generate harmonized theme colors"
                >
                  <Sparkles size={12} />
                  <span>AI Vibe</span>
                </button>
                <button
                  type="button"
                  onClick={resetColorOverrides}
                  className="flex items-center gap-1 text-[11px] font-sans font-bold hover:underline cursor-pointer"
                  style={{ color: dangerText }}
                >
                  <RotateCcw size={12} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* 14 Color Pickers Grid */}
            <div className="grid grid-cols-4 gap-2">
              {colorItems.map((item) => {
                const currentColor = colorOverrides[item.key] || item.defaultColor;
                return (
                  <div
                    key={item.key}
                    className="p-1.5 rounded-xl border flex flex-col items-center gap-1 relative group transition-all shadow-2xs"
                    style={{ backgroundColor: cardBg, borderColor }}
                  >
                    <label className="w-full h-8 rounded-lg border shadow-inner cursor-pointer relative overflow-hidden block" style={{ borderColor }}>
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setColorOverride(item.key, e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: currentColor }}
                      />
                    </label>
                    <span className="text-[10px] font-sans font-bold text-center line-clamp-1 leading-tight" style={{ color: textColor }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Save Palette as Custom Theme Bar */}
            <form onSubmit={handleSaveTheme} className="flex items-center gap-2 pt-3 mt-1 border-t" style={{ borderColor }}>
              <input
                type="text"
                placeholder="Name your custom theme..."
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="flex-1 h-10 px-3.5 border rounded-2xl text-xs font-sans font-medium focus:outline-none transition-colors shadow-2xs"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-2xl text-xs font-sans font-bold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95 shrink-0"
                style={{ backgroundColor: brightAccent }}
              >
                <Plus size={14} />
                <span>Save Theme</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ── 3. MY CUSTOM THEMES SECTION ── */}
      {customThemes.length > 0 && (
        <div className="flex flex-col gap-2 pb-3 border-b" style={{ borderColor }}>
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase flex items-center gap-1.5" style={{ color: headingColor }}>
              <Sparkles size={13} style={{ color: brightAccent }} />
              MY CUSTOM THEMES
            </span>
            <span className="text-[10px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
              {customThemes.length} CREATED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {customThemes.map((themeItem) => {
              const isSelected = themeId === themeItem.id;
              const themePal = themeItem.palette;

              return (
                <div key={themeItem.id} className="relative group w-full">
                  <button
                    type="button"
                    onClick={() => setTheme(themeItem.id)}
                    className={`w-full p-2.5 rounded-2xl border flex flex-col gap-2 text-left transition-all duration-200 cursor-pointer shadow-2xs ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: isSelected ? brightAccent : borderColor,
                      boxShadow: isSelected ? `0 0 0 1.5px ${brightAccent}60, 0 4px 12px ${brightAccent}20` : undefined,
                    }}
                  >
                    {/* 5-color Swatch Bar */}
                    <div className="w-full h-5 rounded-lg flex overflow-hidden border" style={{ borderColor }}>
                      <div className="flex-1 h-full" style={{ backgroundColor: themePal.land }} />
                      <div className="flex-1 h-full" style={{ backgroundColor: themePal.water }} />
                      <div className="flex-1 h-full" style={{ backgroundColor: themePal.parks }} />
                      <div className="flex-1 h-full" style={{ backgroundColor: themePal.roads.major }} />
                      <div className="flex-1 h-full" style={{ backgroundColor: themePal.buildings }} />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black font-sans tracking-tight uppercase truncate" style={{ color: textColor }}>
                        {themeItem.name}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: brightAccent }} />
                      )}
                    </div>
                  </button>

                  {/* Delete Custom Theme Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteCustomTheme(themeItem.id);
                    }}
                    title="Delete Custom Theme"
                    className="absolute top-2 right-2 z-10 w-6 h-6 rounded-lg bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 4. PRESET MAP THEMES (Symmetrical 2-Column Grid) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
            PRESET PALETTES
          </span>
          <span className="text-[10px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
            {filteredThemes.length} STYLES
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {filteredThemes.map((themeItem) => {
            const isSelected = themeId === themeItem.id;
            const themePal = themeItem.palette;

            return (
              <button
                key={themeItem.id}
                type="button"
                onClick={() => setTheme(themeItem.id)}
                className={`p-2.5 rounded-2xl border flex flex-col gap-2 text-left transition-all duration-200 cursor-pointer group shadow-2xs ${
                  isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: isSelected ? brightAccent : borderColor,
                  boxShadow: isSelected ? `0 0 0 1.5px ${brightAccent}60, 0 4px 12px ${brightAccent}20` : undefined,
                }}
              >
                {/* 5-Color Gradient Swatch Bar */}
                <div className="w-full h-5 rounded-lg flex overflow-hidden border" style={{ borderColor }}>
                  <div className="flex-1 h-full" style={{ backgroundColor: themePal.land }} title="Land" />
                  <div className="flex-1 h-full" style={{ backgroundColor: themePal.water }} title="Water" />
                  <div className="flex-1 h-full" style={{ backgroundColor: themePal.parks }} title="Parks" />
                  <div className="flex-1 h-full" style={{ backgroundColor: themePal.roads.major }} title="Roads" />
                  <div className="flex-1 h-full" style={{ backgroundColor: themePal.buildings }} title="Buildings" />
                </div>

                {/* Theme Name and Active Indicator */}
                <div className="flex items-center justify-between min-w-0">
                  <span className="text-xs font-black font-sans tracking-tight uppercase truncate" style={{ color: textColor }}>
                    {themeItem.name}
                  </span>
                  {isSelected ? (
                    <span 
                      className="w-4.5 h-4.5 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: brightAccent }}
                    >
                      <Check size={10} className="stroke-[3]" />
                    </span>
                  ) : (
                    <span 
                      className="w-2 h-2 rounded-full shrink-0 opacity-40 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: themePal.roads.major }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
