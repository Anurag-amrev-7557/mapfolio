import React, { useState } from 'react';
import { Layout, Check, SlidersHorizontal } from 'lucide-react';
import {
  useMapStore,
  LAYOUTS,
  getUIThemeColors,
  type LayoutType,
  type LayoutOrientation,
} from '@/core';

export const LayoutPanel: React.FC = () => {
  const {
    activeLayout,
    setLayout,
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

  const [layoutOrientationFilter, setLayoutOrientationFilter] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');
  const [showCustomLayoutEditor, setShowCustomLayoutEditor] = useState(false);

  // Custom Resolution State
  const [customWidth, setCustomWidth] = useState<number>(activeLayout.widthPx || 1920);
  const [customHeight, setCustomHeight] = useState<number>(activeLayout.heightPx || 1080);

  const filteredLayouts = LAYOUTS.filter(
    (l: LayoutType) => layoutOrientationFilter === 'all' || l.orientation === layoutOrientationFilter
  );

  const CATEGORY_SECTIONS = [
    { category: 'print', title: 'PRINT FORMATS' },
    { category: 'social', title: 'SOCIAL MEDIA' },
    { category: 'wallpaper', title: 'WALLPAPERS & SCREENS' },
    { category: 'web', title: 'DIGITAL & WEB' },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── 1. HEADER & CUSTOM RESOLUTION TOGGLE ── */}
      <div className="flex flex-col gap-2.5 pb-3 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Layout size={15} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
              POSTER LAYOUTS
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowCustomLayoutEditor(!showCustomLayoutEditor)}
            className="flex items-center gap-1.5 text-[11px] font-sans font-bold px-2.5 py-1 rounded-xl border transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            style={
              showCustomLayoutEditor
                ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                : { backgroundColor: cardBg, borderColor, color: textColor }
            }
          >
            <SlidersHorizontal size={12} />
            <span>{showCustomLayoutEditor ? 'Close' : 'Custom'}</span>
          </button>
        </div>

        {/* Orientation Filter Pill Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border shadow-2xs" style={{ backgroundColor: cardBg, borderColor }}>
          {(
            [
              { id: 'all', label: 'ALL' },
              { id: 'landscape', label: 'LANDSCAPE' },
              { id: 'portrait', label: 'PORTRAIT' },
              { id: 'square', label: 'SQUARE' },
            ] as const
          ).map((tab) => {
            const isFilterActive = layoutOrientationFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setLayoutOrientationFilter(tab.id)}
                className="py-1 text-[10px] font-mono font-bold uppercase rounded-lg transition-all cursor-pointer text-center"
                style={
                  isFilterActive
                    ? { backgroundColor: brightAccent, color: '#ffffff' }
                    : { color: subtextColor }
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. GPU-ACCELERATED ACCORDION CUSTOM RESOLUTION EDITOR ── */}
      <div 
        className="shrink-0 transform-gpu grid transition-all"
        style={{
          gridTemplateRows: showCustomLayoutEditor ? '1fr' : '0fr',
          opacity: showCustomLayoutEditor ? 1 : 0,
          transition: 'grid-template-rows 350ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms ease',
        }}
      >
        <div className="overflow-hidden">
          <div className="pb-3 border-b flex flex-col gap-3" style={{ borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                CUSTOM RESOLUTION
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                {((customWidth || 1) / (customHeight || 1)).toFixed(2)}:1 Ratio
              </span>
            </div>

            {/* Quick Aspect Ratio Presets */}
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { label: 'IG Story', w: 1080, h: 1920 },
                { label: '4K Desk', w: 3840, h: 2160 },
                { label: 'iPhone', w: 1170, h: 2532 },
                { label: 'A3 Print', w: 3508, h: 4960 },
                { label: '16:9', w: 1920, h: 1080 },
                { label: '4:3', w: 1600, h: 1200 },
                { label: '1:1', w: 1200, h: 1200 },
                { label: '9:16', w: 1080, h: 1920 },
              ].map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => { setCustomWidth(preset.w); setCustomHeight(preset.h); }}
                  className="py-1 px-1 rounded-xl text-[9.5px] font-mono font-bold border transition-all cursor-pointer text-center hover:scale-105 active:scale-95 shadow-2xs"
                  style={{
                    backgroundColor: customWidth === preset.w && customHeight === preset.h ? brightAccent : cardBg,
                    color: customWidth === preset.w && customHeight === preset.h ? '#ffffff' : subtextColor,
                    borderColor: customWidth === preset.w && customHeight === preset.h ? brightAccent : borderColor,
                  }}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Width & Height Inputs */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider px-1" style={{ color: subtextColor }}>
                  WIDTH (PX)
                </label>
                <input
                  type="number"
                  min="400"
                  max="8000"
                  value={customWidth}
                  onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                  className="w-full h-10 border px-3 rounded-2xl text-xs font-mono font-bold focus:outline-none transition-colors shadow-2xs"
                  style={{ backgroundColor: cardBg, borderColor, color: textColor }}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider px-1" style={{ color: subtextColor }}>
                  HEIGHT (PX)
                </label>
                <input
                  type="number"
                  min="400"
                  max="8000"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                  className="w-full h-10 border px-3 rounded-2xl text-xs font-mono font-bold focus:outline-none transition-colors shadow-2xs"
                  style={{ backgroundColor: cardBg, borderColor, color: textColor }}
                />
              </div>
            </div>

            {/* Live Aspect Preview Wireframe Box */}
            <div className="w-full h-10 rounded-2xl border flex items-center justify-center p-2 shadow-2xs" style={{ backgroundColor: cardBg, borderColor }}>
              <div
                className="rounded-sm transition-all border border-dashed"
                style={{
                  width: `${Math.min(100, (customWidth / Math.max(customWidth, customHeight)) * 100)}%`,
                  height: `${Math.min(100, (customHeight / Math.max(customWidth, customHeight)) * 100)}%`,
                  borderColor: brightAccent,
                  backgroundColor: `${brightAccent}25`,
                }}
              />
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={() => {
                const validW = Math.max(400, Math.min(8000, customWidth || 1920));
                const validH = Math.max(400, Math.min(8000, customHeight || 1080));
                const orientation: LayoutOrientation = validW > validH ? 'landscape' : validW < validH ? 'portrait' : 'square';
                
                setLayout({
                  id: `custom-${validW}x${validH}`,
                  name: `Custom ${validW}×${validH}`,
                  category: 'desktop',
                  orientation,
                  aspectRatio: `${validW}:${validH}`,
                  widthPx: validW,
                  heightPx: validH,
                  width: `${validW} PX`,
                  height: `${validH} PX`,
                  description: `${validW} × ${validH} px custom resolution canvas`,
                  badge: 'Custom',
                });
                setShowCustomLayoutEditor(false);
              }}
              className="w-full h-10 px-4 rounded-2xl text-xs font-sans font-extrabold uppercase tracking-wider text-white border shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: brightAccent,
                borderColor: brightAccent,
                boxShadow: `0 4px 14px ${brightAccent}35`,
              }}
            >
              Apply Custom Size
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. GROUPED 2-COLUMN LAYOUT SECTIONS ── */}
      {CATEGORY_SECTIONS.map((sec, idx) => {
        const secLayouts = filteredLayouts.filter((l) => l.category === sec.category);
        if (secLayouts.length === 0) return null;

        const isLastSection = idx === CATEGORY_SECTIONS.length - 1;

        return (
          <div 
            key={sec.category} 
            className={`flex flex-col gap-2 ${!isLastSection ? 'pb-3 border-b' : ''}`}
            style={{ borderColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                {sec.title}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
                {secLayouts.length} SIZES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {secLayouts.map((layout) => {
                const isSelected = activeLayout.id === layout.id;

                const ratio = layout.widthPx / layout.heightPx;
                const isLand = ratio > 1.1;
                const isPort = ratio < 0.9;
                const innerW = isLand ? '80%' : isPort ? `${Math.max(28, Math.min(62, ratio * 72))}%` : '58%';
                const innerH = isLand ? `${Math.max(24, Math.min(62, (1 / ratio) * 68))}%` : isPort ? '80%' : '58%';

                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setLayout(layout)}
                    className={`p-2.5 rounded-2xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer relative overflow-hidden group shadow-2xs ${
                      isSelected ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                    }`}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: isSelected ? brightAccent : borderColor,
                      boxShadow: isSelected ? `0 0 0 1.5px ${brightAccent}60, 0 4px 12px ${brightAccent}20` : undefined,
                    }}
                  >
                    {/* Header: Title & Checkmark */}
                    <div className="flex items-center justify-between min-w-0 w-full">
                      <span className="text-xs font-black font-sans uppercase tracking-tight truncate" style={{ color: textColor }}>
                        {layout.name}
                      </span>
                      {isSelected && (
                        <span 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: brightAccent }}
                        >
                          <Check size={9} className="stroke-[3]" />
                        </span>
                      )}
                    </div>

                    {/* Aspect Ratio Preview Shape Wireframe */}
                    <div 
                      className="w-full h-14 rounded-xl border flex items-center justify-center p-1.5 shrink-0 transition-colors"
                      style={{ 
                        backgroundColor: flyoutBg, 
                        borderColor: isSelected ? `${brightAccent}40` : borderColor 
                      }}
                    >
                      <div 
                        className="rounded-sm transition-all duration-200 border"
                        style={{
                          width: innerW,
                          height: innerH,
                          backgroundColor: isSelected ? `${brightAccent}35` : (uiColors.isLight ? '#cbd5e1' : '#334155'),
                          borderColor: isSelected ? brightAccent : (uiColors.isLight ? '#94a3b8' : '#475569'),
                        }}
                      />
                    </div>

                    {/* Dimensions Caption */}
                    <span className="text-[10px] font-mono font-bold truncate opacity-75 leading-tight" style={{ color: subtextColor }}>
                      {layout.width}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};
