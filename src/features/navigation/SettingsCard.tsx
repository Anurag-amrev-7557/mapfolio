import React from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { useMapStore, getUIThemeColors, type MapTheme, type FontOption, type LayoutType, type UIThemeColors } from '@/core';

interface SettingsCardProps {
  showSettingsCard: boolean;
  setShowSettingsCard: (show: boolean) => void;
  uiColors?: UIThemeColors;
  title: string;
  subtitle: string;
  currentTheme: MapTheme;
  selectedFontObj: FontOption;
  letterSpacingMultiplier: number;
  activeLayout: LayoutType;
  markersCount: number;
}

export const SettingsCard: React.FC<SettingsCardProps> = ({
  showSettingsCard,
  setShowSettingsCard,
  title,
  subtitle,
  currentTheme,
  selectedFontObj,
  activeLayout,
  markersCount,
}) => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  if (!showSettingsCard) {
    return (
      <button
        type="button"
        onClick={() => setShowSettingsCard(true)}
        className="hidden md:flex absolute top-5 right-5 z-30 backdrop-blur-2xl rounded-2xl px-3.5 py-2 shadow-xl pointer-events-auto transition-all hover:scale-105 active:scale-95 items-center gap-2 cursor-pointer text-xs font-sans font-bold border"
        style={{
          backgroundColor: `${flyoutBg}F0`,
          borderColor: borderColor,
          color: textColor,
        }}
        title="Show Studio Specs"
      >
        <SlidersHorizontal size={14} style={{ color: brightAccent }} />
        <span className="text-xs font-sans font-bold uppercase tracking-wider">Specs</span>
      </button>
    );
  }

  const specRows = [
    { label: 'Location', value: `${title || 'Unknown'}${subtitle ? `, ${subtitle}` : ''}` },
    { label: 'Theme', value: currentTheme.name },
    { label: 'Typography', value: selectedFontObj.label },
    { label: 'Format', value: `${activeLayout.name} (${activeLayout.aspectRatio})` },
    { label: 'Resolution', value: `${activeLayout.widthPx} × ${activeLayout.heightPx} px` },
    { label: 'Markers', value: `${markersCount} placed` },
  ];

  return (
    <div
      className="hidden md:flex flex-col absolute top-5 right-5 z-30 backdrop-blur-2xl rounded-2xl p-4 text-xs shadow-2xl w-76 pointer-events-auto transition-all animate-scale-in gap-2.5 select-none border"
      style={{
        backgroundColor: `${flyoutBg}F8`,
        borderColor: borderColor,
        color: textColor,
      }}
    >
      {/* Sleek Minimal Header */}
      <div className="flex items-center justify-between pb-2.5 border-b" style={{ borderColor }}>
        <div className="flex items-center gap-1.5">
          <SlidersHorizontal size={14} style={{ color: brightAccent }} />
          <span className="text-xs font-sans font-black uppercase tracking-wider" style={{ color: headingColor }}>
            Studio Specs
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowSettingsCard(false)}
          className="w-6 h-6 rounded-lg flex items-center justify-center opacity-50 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all cursor-pointer"
          style={{ color: textColor }}
          title="Close Specs"
        >
          <X size={13} />
        </button>
      </div>

      {/* Clean Compact Telemetry Key-Value Rows */}
      <div className="flex flex-col gap-2 text-xs">
        {specRows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-3">
            <span className="font-sans font-medium opacity-75 shrink-0" style={{ color: subtextColor }}>
              {row.label}
            </span>
            <span className="font-sans font-bold truncate text-right" style={{ color: textColor }}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
