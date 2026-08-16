import React, { useRef, useEffect } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  Lock,
  Globe,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronDown,
  Check,
} from 'lucide-react';
import type { ExportFormat } from '@/features/poster';
import { useMapStore, type UIThemeColors } from '@/core';

interface DesktopToolbarProps {
  uiColors: UIThemeColors;
  showPosterFrame: boolean;
  setShowPosterFrame: (show: boolean) => void;
  isMapLocked: boolean;
  setIsMapLocked: (locked: boolean) => void;
  engineMode: 'vector' | 'photorealistic';
  setEngineMode: (mode: 'vector' | 'photorealistic') => void;
  rotationEnabled: boolean;
  setRotationEnabled: (enabled: boolean) => void;
  zoom: number;
  handleSmoothZoom: (delta: number) => void;
  exportFormat: ExportFormat;
  setExportFormat: (f: ExportFormat) => void;
  isFormatDropdownOpen: boolean;
  setIsFormatDropdownOpen: (open: boolean) => void;
  downloading: boolean;
  handleDownload: () => void;
}

export const DesktopToolbar: React.FC<DesktopToolbarProps> = ({
  uiColors,
  showPosterFrame,
  setShowPosterFrame,
  isMapLocked,
  setIsMapLocked,
  engineMode,
  setEngineMode,
  rotationEnabled,
  setRotationEnabled,
  zoom,
  handleSmoothZoom,
  exportFormat,
  setExportFormat,
  isFormatDropdownOpen,
  setIsFormatDropdownOpen,
  downloading,
  handleDownload,
}) => {
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsFormatDropdownOpen]);

  const { pitch, setPitch } = useMapStore();

  const handleToggle3DPlane = () => {
    if (pitch === 0) {
      setPitch(60);
      setRotationEnabled(true);
    } else {
      setPitch(0);
      setRotationEnabled(false);
    }
  };

  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const brightAccent = uiColors.brightAccent;
  const activeItemText = uiColors.activeItemText;

  return (
    <div 
      className="hidden md:flex items-stretch backdrop-blur-2xl h-11 rounded-2xl shadow-2xl text-xs z-30 shrink-0 my-3 pointer-events-auto transition-all duration-350 ease-out mx-auto select-none relative overflow-hidden transform-gpu will-change-transform"
      style={{
        backgroundColor: `${flyoutBg}FA`,
        color: textColor,
        transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)',
      }}
    >
      {/* ── 1. POSTER FRAME VIEW TOGGLE ── */}
      <button 
        type="button"
        onClick={() => setShowPosterFrame(!showPosterFrame)}
        className="flex items-center justify-center gap-2 px-4 h-full font-sans font-bold transition-all duration-200 cursor-pointer hover:opacity-90 active:scale-95 border-r rounded-l-2xl shrink-0"
        style={
          showPosterFrame
            ? { backgroundColor: brightAccent, color: activeItemText, borderColor: 'transparent' }
            : { backgroundColor: 'transparent', color: textColor, borderColor }
        }
        title={showPosterFrame ? "Hide Poster Frame (View Full Canvas)" : "Show Poster Frame"}
      >
        {showPosterFrame ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
        <span className="whitespace-nowrap uppercase text-[11px] font-black tracking-wider">
          {showPosterFrame ? 'Poster Frame' : 'Full Map'}
        </span>
      </button>

      {/* ── 2. LOCK MAP TOGGLE ── */}
      <button 
        type="button"
        onClick={() => setIsMapLocked(!isMapLocked)}
        className="flex items-center justify-center gap-1.5 px-3.5 h-full font-sans font-bold transition-all duration-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 border-r shrink-0"
        style={
          isMapLocked
            ? { backgroundColor: '#e11d48', color: '#ffffff', borderColor: 'transparent' }
            : { backgroundColor: 'transparent', color: textColor, borderColor }
        }
        title={isMapLocked ? "Unlock Map Navigation" : "Lock Map Navigation"}
      >
        <Lock size={13} />
        <span className="whitespace-nowrap uppercase text-[11px] font-black tracking-wider">
          {isMapLocked ? 'Locked' : 'Lock Map'}
        </span>
      </button>

      {/* ── 3. 3D PHOTOREAL ENGINE TOGGLE ── */}
      <button 
        type="button"
        onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
        className="flex items-center justify-center gap-1.5 px-3.5 h-full font-sans font-bold transition-all duration-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 border-r shrink-0"
        style={
          engineMode === 'photorealistic'
            ? { backgroundColor: '#2563eb', color: '#ffffff', borderColor: 'transparent' }
            : { backgroundColor: 'transparent', color: textColor, borderColor }
        }
        title="Switch between Vector Poster and 3D Photoreal Globe"
      >
        <Globe size={13} className={engineMode === 'photorealistic' ? 'animate-pulse' : ''} />
        <span className="whitespace-nowrap uppercase text-[11px] font-black tracking-wider">
          3D Globe
        </span>
      </button>

      {/* ── 4. 3D TILT & ROTATION TOGGLE ── */}
      <button 
        type="button"
        onClick={handleToggle3DPlane}
        className="flex items-center justify-center gap-1.5 px-3.5 h-full font-sans font-bold transition-all duration-200 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 border-r shrink-0"
        style={
          pitch > 0 || rotationEnabled
            ? { backgroundColor: brightAccent, color: activeItemText, borderColor: 'transparent' }
            : { backgroundColor: 'transparent', color: textColor, borderColor }
        }
        title={pitch > 0 ? "Click to Return Map to Flat 0° Top-Down View" : "Click to Tilt Map Plane to 60° 3D Horizon View"}
      >
        <RotateCw size={13} className={pitch > 0 ? 'animate-spin' : ''} />
        <span className="whitespace-nowrap uppercase text-[11px] font-black tracking-wider">
          {pitch > 0 ? `${Math.round(pitch)}° 3D Tilt` : '3D Tilt'}
        </span>
      </button>

      {/* ── 5. ZOOM CONTROLS (Zoom Out, Slider, Zoom In) ── */}
      <div className="flex items-center h-full border-r shrink-0" style={{ borderColor }}>
        <button 
          type="button"
          onClick={() => handleSmoothZoom(-0.75)}
          className="flex items-center justify-center w-9 h-full transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
          style={{ color: textColor }}
          title="Zoom Out (-0.75)"
        >
          <ZoomOut size={13} />
        </button>

        <div className="flex items-center gap-2 px-2.5 h-full">
          <input 
            type="range"
            min="1"
            max="18"
            step="0.1"
            value={zoom}
            onChange={(e) => handleSmoothZoom(Number(e.target.value) - zoom)}
            className="w-16 cursor-pointer h-1.5 rounded-lg"
            style={{ accentColor: brightAccent }}
            title={`Zoom: Z${zoom.toFixed(1)}`}
          />
          <span className="text-[10.5px] font-mono font-bold w-8 text-center" style={{ color: brightAccent }}>
            Z{zoom.toFixed(1)}
          </span>
        </div>

        <button 
          type="button"
          onClick={() => handleSmoothZoom(+0.75)}
          className="flex items-center justify-center w-9 h-full transition-all cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:scale-90"
          style={{ color: textColor }}
          title="Zoom In (+0.75)"
        >
          <ZoomIn size={13} />
        </button>
      </div>

      {/* ── 6. EXPORT FORMAT DROPDOWN ── */}
      <div 
        className="relative shrink-0 h-full flex items-center border-r" 
        ref={formatDropdownRef}
        style={{ borderColor }}
      >
        <button
          type="button"
          onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
          className="flex items-center justify-center gap-1.5 px-3.5 h-full font-mono font-bold text-xs transition-colors cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 active:opacity-75"
          style={{ color: textColor }}
          title="Select Export Format"
        >
          <span className="uppercase">{exportFormat}</span>
          <ChevronDown size={12} className={`transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isFormatDropdownOpen && (
          <div
            className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-44 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-2xl z-50 animate-scale-in"
            style={{
              backgroundColor: `${flyoutBg}FA`,
              borderColor,
              color: textColor,
            }}
          >
            {[
              { value: 'png' as ExportFormat, label: 'PNG', desc: 'Lossless 4K Image' },
              { value: 'jpeg' as ExportFormat, label: 'JPG', desc: 'Compressed Image' },
              { value: 'webp' as ExportFormat, label: 'WEBP', desc: 'Next-Gen Web Format' },
              { value: 'pdf' as ExportFormat, label: 'PDF', desc: 'Print-Ready Vector Doc' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setExportFormat(opt.value);
                  setIsFormatDropdownOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
                style={
                  exportFormat === opt.value
                    ? { backgroundColor: `${brightAccent}20`, color: brightAccent }
                    : {}
                }
              >
                <div className="flex flex-col">
                  <span className="font-mono font-bold text-xs uppercase">{opt.label}</span>
                  <span className="text-[9.5px] opacity-60 font-sans">{opt.desc}</span>
                </div>
                {exportFormat === opt.value && <Check size={13} className="shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── 7. DOWNLOAD / EXPORT ACTION BUTTON ── */}
      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center justify-center gap-2 px-5 h-full font-sans font-black tracking-wider uppercase text-xs shadow-lg transition-all disabled:opacity-50 cursor-pointer hover:opacity-90 active:scale-95 shrink-0 rounded-r-2xl"
        style={{
          backgroundColor: brightAccent,
          color: activeItemText,
        }}
        title={`Export Ultra-HD ${exportFormat.toUpperCase()} Poster`}
      >
        <Download size={14} className={downloading ? 'animate-bounce' : ''} />
        <span className="whitespace-nowrap">{downloading ? 'Exporting...' : 'DOWNLOAD'}</span>
      </button>
    </div>
  );
};
