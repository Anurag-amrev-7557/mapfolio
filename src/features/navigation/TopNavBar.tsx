import React from 'react';
import { Github, Star, Download, Loader2 } from 'lucide-react';
import { useMapStore, getUIThemeColors, type UIThemeColors } from '@/core';

interface TopNavBarProps {
  uiColors?: UIThemeColors;
  isMobile?: boolean;
  onDownload?: () => void;
  downloading?: boolean;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({ onDownload, downloading = false }) => {
  const { themeId, colorOverrides, customThemes, exportFormat } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  return (
    <header
      className="md:hidden w-full fixed top-0 left-0 right-0 z-20 border-b shadow-xs backdrop-blur-2xl px-4 py-2.5 flex items-center justify-between transition-all select-none"
      style={{
        backgroundColor: `${flyoutBg}F5`,
        borderColor: borderColor,
      }}
    >
      {/* ── Left: Website Logo + Name + 1-Line About ── */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Clean Logo Emblem Enlarged */}
        <img
          src="/favicon.svg"
          alt="Mapfolio Logo"
          className="w-9 h-9 object-contain shrink-0 select-none"
        />

        {/* Brand Text Stack */}
        <div className="flex flex-col justify-center text-left min-w-0">
          <span
            className="text-sm font-black font-sans tracking-tight leading-none"
            style={{ color: textColor }}
          >
            Mapfolio
          </span>

          <span
            className="text-[10.5px] font-sans font-medium opacity-75 leading-tight mt-0.5 truncate max-w-[140px] sm:max-w-[300px]"
            style={{ color: subtextColor }}
          >
            Minimalist Map Poster Studio
          </span>
        </div>
      </div>

      {/* ── Right: Download Action + GitHub Link ── */}
      <div className="flex items-center gap-2 shrink-0 ml-2">
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border shadow-xs text-xs font-sans font-black uppercase tracking-wider transition-all active:scale-95 cursor-pointer disabled:opacity-50"
            style={{
              backgroundColor: brightAccent,
              borderColor: brightAccent,
              color: '#ffffff',
            }}
            title="Download Poster"
          >
            {downloading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Download size={13} strokeWidth={2.5} />
            )}
            <span className="text-[11px] font-mono font-bold leading-none">
              {downloading ? 'SAVING…' : exportFormat.toUpperCase()}
            </span>
          </button>
        )}

        <a
          href="https://github.com/Anurag-amrev-7557/mapfolio"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border shadow-xs text-xs font-sans font-bold transition-all active:scale-95 cursor-pointer"
          style={{
            backgroundColor: `${textColor}08`,
            borderColor: borderColor,
            color: textColor,
          }}
        >
          <Github size={14} style={{ color: brightAccent }} />
          <Star size={12} className="fill-current opacity-75" style={{ color: brightAccent }} />
        </a>
      </div>
    </header>
  );
};
