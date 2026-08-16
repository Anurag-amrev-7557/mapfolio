import React from 'react';
import {
  Github,
  ExternalLink,
  Star,
  BookOpen,
  Bug,
  Cpu,
  Compass,
} from 'lucide-react';
import { useMapStore, getFontByValue, getUIThemeColors, MAP_THEMES } from '@/core';

export const SettingsPanel: React.FC = () => {
  const {
    activeLayout,
    fontFamily,
    themeId,
    colorOverrides,
    customThemes,
    engineMode,
  } = useMapStore();

  const selectedFontOption = getFontByValue(fontFamily);
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const currentTheme = MAP_THEMES.find((t) => t.id === themeId) || MAP_THEMES[0];

  const flyoutBg = uiColors.flyoutBg;
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. GITHUB & STUDIO ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Github size={16} style={{ color: brightAccent }} />
            <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              GITHUB & STUDIO
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-lg border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            v0.4.2 PRO
          </span>
        </div>

        {/* GitHub Action Card */}
        <div className="p-3.5 rounded-2xl border flex flex-col gap-3 shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-sans font-bold" style={{ color: textColor }}>
                Mapfolio Studio Pro
              </span>
              <span className="text-xs font-sans opacity-70 mt-0.5" style={{ color: subtextColor }}>
                Open-source map poster creation engine
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-md border text-emerald-500" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
              MIT
            </span>
          </div>

          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-10 rounded-xl border flex items-center justify-center gap-2 text-xs font-sans font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs hover:scale-[1.01] active:scale-[0.99]"
            style={{ backgroundColor: `${brightAccent}15`, borderColor: brightAccent, color: brightAccent }}
          >
            <Star size={14} className="fill-current" />
            <span>Star & Fork on GitHub</span>
            <ExternalLink size={12} className="opacity-75" />
          </a>
        </div>
      </div>

      {/* ── 2. SYSTEM TELEMETRY ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu size={16} style={{ color: brightAccent }} />
            <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              SYSTEM SPECS
            </span>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
          {[
            { label: 'RENDER ENGINE', value: engineMode === 'photorealistic' ? 'Cesium 3D Globe' : 'MapLibre Vector GL' },
            { label: 'POSTER FORMAT', value: `${activeLayout.name} (${activeLayout.aspectRatio})` },
            { label: 'ACTIVE THEME', value: currentTheme.name },
            { label: 'ACTIVE FONT', value: selectedFontOption.label },
            { label: 'EXPORT OPTIONS', value: 'PNG · SVG · Ultra-Res PDF' },
          ].map((spec) => (
            <div key={spec.label} className="p-3 flex items-center justify-between text-xs select-none">
              <span className="text-xs font-sans font-medium opacity-75" style={{ color: subtextColor }}>
                {spec.label}
              </span>
              <span className="text-xs font-sans font-bold text-right" style={{ color: textColor }}>
                {spec.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── 3. RESOURCES & GUIDES ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass size={16} style={{ color: brightAccent }} />
            <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              RESOURCES & GUIDES
            </span>
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <BookOpen size={15} className="opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: brightAccent }} />
              <span className="text-xs font-sans font-bold" style={{ color: textColor }}>
                Documentation & Styling Guides
              </span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: subtextColor }} />
          </a>

          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio/issues"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group"
          >
            <div className="flex items-center gap-2.5">
              <Bug size={15} className="opacity-70 group-hover:opacity-100 transition-opacity" style={{ color: brightAccent }} />
              <span className="text-xs font-sans font-bold" style={{ color: textColor }}>
                Report an Issue or Feature Request
              </span>
            </div>
            <ExternalLink size={12} className="opacity-40 group-hover:opacity-100 transition-opacity" style={{ color: subtextColor }} />
          </a>
        </div>
      </div>
    </div>
  );
};
