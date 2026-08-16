import React from 'react';
import { useMapStore, getUIThemeColors } from '@/core';

interface PanelSkeletonProps {
  tab?: string;
}

export const PanelSkeleton: React.FC<PanelSkeletonProps> = () => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const brightAccent = uiColors.brightAccent;

  return (
    <div className="flex flex-col gap-3.5 w-full animate-pulse select-none">
      {/* 1. Header & Badge Row */}
      <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor }}>
        <div 
          className="h-4 w-32 rounded-md"
          style={{ backgroundColor: `${brightAccent}30` }}
        />
        <div 
          className="h-5 w-16 rounded-full"
          style={{ backgroundColor: `${brightAccent}20` }}
        />
      </div>

      {/* 2. Main Search / Hero Input Bar */}
      <div 
        className="h-10 w-full rounded-2xl border p-2 flex items-center gap-2"
        style={{ backgroundColor: cardBg, borderColor }}
      >
        <div className="w-4 h-4 rounded-full bg-neutral-500/30 shrink-0" />
        <div className="h-3 w-40 rounded bg-neutral-500/25" />
      </div>

      {/* 3. Action / Quick Preset Tabs */}
      <div className="grid grid-cols-3 gap-1.5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-8 rounded-xl border flex items-center justify-center"
            style={{ backgroundColor: cardBg, borderColor }}
          >
            <div className="h-2.5 w-12 rounded bg-neutral-500/20" />
          </div>
        ))}
      </div>

      {/* 4. Large Section Header */}
      <div className="flex items-center justify-between pt-1">
        <div className="h-3 w-28 rounded bg-neutral-500/35" />
        <div className="h-3 w-10 rounded bg-neutral-500/20" />
      </div>

      {/* 5. Grid of 6 Interactive Swatch / Layout Cards */}
      <div className="grid grid-cols-2 gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3 rounded-2xl border flex flex-col gap-2 relative overflow-hidden"
            style={{ backgroundColor: cardBg, borderColor }}
          >
            {/* Card header placeholder */}
            <div className="flex items-center justify-between">
              <div className="h-3 w-16 rounded bg-neutral-500/30" />
              <div className="w-3.5 h-3.5 rounded-full bg-neutral-500/25" />
            </div>
            {/* Card preview box */}
            <div className="w-full h-12 rounded-xl bg-neutral-500/15" />
            {/* Card caption */}
            <div className="h-2 w-20 rounded bg-neutral-500/20" />
          </div>
        ))}
      </div>

      {/* 6. Slider / Range Control Bar */}
      <div 
        className="p-3.5 rounded-2xl border flex flex-col gap-2"
        style={{ backgroundColor: cardBg, borderColor }}
      >
        <div className="flex items-center justify-between">
          <div className="h-2.5 w-24 rounded bg-neutral-500/30" />
          <div className="h-3 w-8 rounded bg-neutral-500/25" />
        </div>
        <div className="h-2 w-full rounded-full bg-neutral-500/20" />
      </div>

      {/* 7. Bottom Action Button */}
      <div 
        className="w-full h-11 rounded-2xl border mt-1 flex items-center justify-center gap-2"
        style={{ backgroundColor: `${brightAccent}25`, borderColor: `${brightAccent}40` }}
      >
        <div className="w-4 h-4 rounded-full bg-white/30" />
        <div className="h-3.5 w-28 rounded bg-white/40" />
      </div>
    </div>
  );
};
