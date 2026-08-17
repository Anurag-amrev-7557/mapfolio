import React from 'react';
import { Github, Star } from 'lucide-react';
import { type UIThemeColors } from '@/core';

interface TopNavBarProps {
  uiColors: UIThemeColors;
  isMobile?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ uiColors, isMobile }) => {
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 pointer-events-none px-3 sm:px-5 pt-3 pb-2 flex items-center justify-between transition-all duration-300">
      {/* ── Left: Website Logo + Name + 1-Line About ── */}
      <div
        className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl border shadow-xl backdrop-blur-2xl transition-all duration-200 select-none group"
        style={{
          backgroundColor: `${flyoutBg}E6`,
          borderColor: borderColor,
        }}
      >
        {/* Website Logo Image */}
        <div
          className="relative shrink-0 flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-xs border"
          style={{ borderColor: `${brightAccent}30`, backgroundColor: `${flyoutBg}FA` }}
        >
          <img
            src="/favicon.svg"
            alt="Mapfolio Logo"
            className="w-full h-full object-contain p-0.5 group-hover:scale-105 transition-transform duration-300"
          />
        </div>

        {/* Brand Text Stack */}
        <div className="flex flex-col justify-center text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs sm:text-sm font-black font-sans tracking-tight leading-none"
              style={{ color: textColor }}
            >
              Mapfolio
            </span>
            <span
              className="text-[9px] sm:text-[9.5px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-md border"
              style={{
                backgroundColor: `${brightAccent}18`,
                borderColor: `${brightAccent}40`,
                color: brightAccent,
              }}
            >
              PRO
            </span>
          </div>

          <span
            className="text-[9.5px] sm:text-[10.5px] font-sans font-medium opacity-75 leading-tight mt-0.5 truncate max-w-[200px] sm:max-w-[340px]"
            style={{ color: subtextColor }}
          >
            Custom minimalist map poster prints & 3D geospatial art
          </span>
        </div>
      </div>

      {/* ── Right: GitHub & Studio Quick Link (Desktop & Tablet) ── */}
      {!isMobile && (
        <div className="pointer-events-auto flex items-center gap-2">
          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border shadow-xl backdrop-blur-2xl text-xs font-sans font-bold transition-all active:scale-95 hover:scale-[1.02] cursor-pointer"
            style={{
              backgroundColor: `${flyoutBg}E6`,
              borderColor: borderColor,
              color: textColor,
            }}
          >
            <Github size={14} style={{ color: brightAccent }} />
            <span className="hidden sm:inline">Star on GitHub</span>
            <Star size={12} className="fill-current opacity-75" style={{ color: brightAccent }} />
          </a>
        </div>
      )}
    </header>
  );
};
