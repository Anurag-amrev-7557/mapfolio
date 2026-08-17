import React from 'react';
import { Github, Star } from 'lucide-react';
import { useMapStore, getUIThemeColors, type UIThemeColors } from '@/core';

interface TopNavBarProps {
  uiColors?: UIThemeColors;
  isMobile?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = () => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  return (
    <header
      className="md:hidden w-full fixed top-0 left-0 right-0 z-20 border-b shadow-xs backdrop-blur-2xl px-4.5 py-3 flex items-center justify-between transition-all select-none"
      style={{
        backgroundColor: `${flyoutBg}F5`,
        borderColor: borderColor,
      }}
    >
      {/* ── Left: Website Logo + Name + 1-Line About ── */}
      <div className="flex items-center gap-3.5 min-w-0">
        {/* Clean Logo Emblem Enlarged */}
        <img
          src="/favicon.svg"
          alt="Mapfolio Logo"
          className="w-11 h-11 object-contain shrink-0 select-none"
        />

        {/* Brand Text Stack */}
        <div className="flex flex-col justify-center text-left min-w-0">
          <span
            className="text-base font-black font-sans tracking-tight leading-none"
            style={{ color: textColor }}
          >
            Mapfolio
          </span>

          <span
            className="text-xs font-sans font-medium opacity-75 leading-tight mt-1 truncate max-w-[230px] sm:max-w-[480px]"
            style={{ color: subtextColor }}
          >
            Custom minimalist map poster prints & 3D geospatial art
          </span>
        </div>
      </div>

      {/* ── Right: GitHub Quick Link Badge ── */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        <a
          href="https://github.com/Anurag-amrev-7557/mapfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-xs text-xs font-sans font-bold transition-all active:scale-95 hover:scale-[1.02] cursor-pointer"
          style={{
            backgroundColor: `${textColor}08`,
            borderColor: borderColor,
            color: textColor,
          }}
        >
          <Github size={16} style={{ color: brightAccent }} />
          <Star size={13} className="fill-current opacity-75" style={{ color: brightAccent }} />
        </a>
      </div>
    </header>
  );
};
