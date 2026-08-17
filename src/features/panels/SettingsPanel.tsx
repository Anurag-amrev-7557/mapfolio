import React from 'react';
import {
  Github,
  ExternalLink,
  Star,
  BookOpen,
  Bug,
  Cpu,
  Download,
  Maximize2,
  Minimize2,
  Lock,
  Unlock,
  Globe,
  Check,
} from 'lucide-react';
import { useMapStore, getFontByValue, getUIThemeColors, MAP_THEMES } from '@/core';
import { exportPosterCanvas, type ExportFormat } from '@/features/poster';

export const SettingsPanel: React.FC = () => {
  const {
    activeLayout,
    fontFamily,
    themeId,
    colorOverrides,
    customThemes,
    engineMode,
    setEngineMode,
    title,
    subtitle,
    lat,
    lng,
    letterSpacingMultiplier,
    showTextOverlay,
    showGradientOverlay,
    borderStyle,
    showCompass,
    showScaleBar,
    exportFormat,
    setExportFormat,
    downloading,
    setDownloading,
    showPosterFrame,
    setShowPosterFrame,
    isMapLocked,
    setIsMapLocked,
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

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await exportPosterCanvas({
        width: activeLayout.widthPx,
        height: activeLayout.heightPx,
        filename: `${title.toLowerCase().replace(/\s+/g, '-')}-${activeLayout.id}`,
        format: exportFormat,
        title,
        subtitle,
        lat,
        lng,
        fontFamily,
        letterSpacingMultiplier,
        themeId,
        showTextOverlay,
        showGradientOverlay,
        borderStyle,
        showCompass,
        showScaleBar,
        customThemes,
      });
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formats: { fmt: ExportFormat; label: string; badge: string; desc: string }[] = [
    { fmt: 'png', label: 'PNG Image', badge: 'HD', desc: 'Lossless quality poster' },
    { fmt: 'jpeg', label: 'JPEG Image', badge: 'JPG', desc: 'Compact file size' },
    { fmt: 'webp', label: 'WebP Format', badge: 'WEB', desc: 'Modern web image' },
    { fmt: 'pdf', label: 'PDF Vector', badge: 'DOC', desc: 'Print-ready vector' },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. EXPORT ARTWORK ── */}
      <div className="flex flex-col gap-3 pb-4 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download size={16} style={{ color: brightAccent }} />
            <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              EXPORT ARTWORK
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-lg border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            {exportFormat.toUpperCase()} · {activeLayout.name}
          </span>
        </div>

        {/* Format Selector Grid */}
        <div className="grid grid-cols-2 gap-2">
          {formats.map(({ fmt, label, badge, desc }) => {
            const isSelected = exportFormat === fmt;
            return (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className="flex flex-col p-2.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-95 relative"
                style={{
                  backgroundColor: isSelected ? `${brightAccent}18` : cardBg,
                  borderColor: isSelected ? brightAccent : borderColor,
                }}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className="text-[9.5px] font-mono font-black px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: isSelected ? brightAccent : `${textColor}15`,
                      color: isSelected ? '#ffffff' : textColor,
                    }}
                  >
                    {badge}
                  </span>
                  {isSelected ? (
                    <Check size={14} style={{ color: brightAccent }} />
                  ) : (
                    <Download size={12} className="opacity-30" style={{ color: textColor }} />
                  )}
                </div>
                <span className="text-xs font-bold font-sans leading-tight" style={{ color: textColor }}>
                  {label}
                </span>
                <span className="text-[9.5px] opacity-60 mt-0.5 leading-tight" style={{ color: subtextColor }}>
                  {desc}
                </span>
              </button>
            );
          })}
        </div>

        {/* Download Trigger Button */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="w-full h-11 rounded-2xl border flex items-center justify-center gap-2 text-xs font-sans font-black uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-98 disabled:opacity-50"
          style={{ backgroundColor: brightAccent, borderColor: brightAccent, color: '#ffffff' }}
        >
          <Download size={15} className={downloading ? 'animate-bounce' : ''} />
          <span>{downloading ? 'Generating Poster…' : `Download ${exportFormat.toUpperCase()} Poster`}</span>
        </button>
      </div>

      {/* ── 2. QUICK VIEW CONTROLS ── */}
      <div className="flex flex-col gap-2.5 pb-4 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
            VIEW & CONTROLS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {/* Poster / Full View */}
          <button
            type="button"
            onClick={() => setShowPosterFrame(!showPosterFrame)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
            style={{
              backgroundColor: !showPosterFrame ? `${brightAccent}20` : cardBg,
              borderColor: !showPosterFrame ? brightAccent : borderColor,
              color: textColor,
            }}
          >
            {showPosterFrame ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
            <span className="text-[10px] font-bold mt-1.5 uppercase tracking-tight leading-none">
              {showPosterFrame ? 'Full Map' : 'Poster Frame'}
            </span>
          </button>

          {/* Map Lock */}
          <button
            type="button"
            onClick={() => setIsMapLocked(!isMapLocked)}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
            style={{
              backgroundColor: isMapLocked ? '#be123c20' : cardBg,
              borderColor: isMapLocked ? '#be123c' : borderColor,
              color: isMapLocked ? '#f43f5e' : textColor,
            }}
          >
            {isMapLocked ? <Lock size={16} /> : <Unlock size={16} />}
            <span className="text-[10px] font-bold mt-1.5 uppercase tracking-tight leading-none">
              {isMapLocked ? 'Locked' : 'Unlocked'}
            </span>
          </button>

          {/* 3D Engine */}
          <button
            type="button"
            onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
            className="flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
            style={{
              backgroundColor: engineMode === 'photorealistic' ? '#2563eb20' : cardBg,
              borderColor: engineMode === 'photorealistic' ? '#2563eb' : borderColor,
              color: engineMode === 'photorealistic' ? '#3b82f6' : textColor,
            }}
          >
            <Globe size={16} />
            <span className="text-[10px] font-bold mt-1.5 uppercase tracking-tight leading-none">
              {engineMode === 'photorealistic' ? 'Photoreal' : 'Vector 2D'}
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. GITHUB & STUDIO ── */}
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

      {/* ── 4. SYSTEM TELEMETRY ── */}
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
            { label: 'EXPORT OPTIONS', value: 'PNG · JPEG · WebP · PDF' },
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

      {/* ── 5. RESOURCES & GUIDES ── */}
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center rounded-2xl border shadow-xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group w-full"
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
            className="p-3 flex items-center justify-between transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group w-full"
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
