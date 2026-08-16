import React, { useState } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Globe,
} from 'lucide-react';
import type { NavTab } from '@/shared/types';
import { ActiveTabFlyout } from '@/features/panels';
import type { ExportFormat } from '@/features/poster';
import type { UIThemeColors } from '@/core';

export interface MobileBottomIslandProps {
  uiColors: UIThemeColors;
  activeTab: NavTab | null;
  setActiveTab: (t: NavTab | null) => void;
  mountedTab: NavTab | null;
  slideDirection: 'up' | 'down' | null;
  isTabTransitioning: boolean;
  MOBILE_NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[];
  showPosterFrame: boolean;
  setShowPosterFrame: (v: boolean) => void;
  isMapLocked: boolean;
  setIsMapLocked: (v: boolean) => void;
  rotationEnabled: boolean;
  setRotationEnabled: (v: boolean) => void;
  engineMode: 'vector' | 'photorealistic';
  setEngineMode: (mode: 'vector' | 'photorealistic') => void;
  zoom: number;
  handleSmoothZoom: (d: number) => void;
  exportFormat: ExportFormat;
  setExportFormat: (f: ExportFormat) => void;
  downloading: boolean;
  handleDownload: () => void;
}

export function MobileBottomIsland({
  uiColors,
  activeTab,
  setActiveTab,
  mountedTab,
  slideDirection,
  isTabTransitioning,
  MOBILE_NAV_ITEMS,
  showPosterFrame,
  setShowPosterFrame,
  isMapLocked,
  setIsMapLocked,
  rotationEnabled,
  setRotationEnabled,
  engineMode,
  setEngineMode,
  zoom,
  handleSmoothZoom,
  exportFormat,
  setExportFormat,
  downloading,
  handleDownload,
}: MobileBottomIslandProps) {
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [fmtOpen, setFmtOpen] = useState(false);

  // island bottom offset
  const islandBottom = 'calc(env(safe-area-inset-bottom, 0px) + 12px)';

  // sheet sits flush on top of the island
  // island height: nav row 64px + (actions row 48px when expanded) + border
  const islandHeight = actionsExpanded ? 116 : 68;

  return (
    <>
      {/* Tab content sheet — slides up from just above the island */}
      <div
        className="fixed left-3 right-3 z-40 overflow-hidden rounded-3xl border shadow-2xl"
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${islandHeight + 20}px)`,
          maxHeight: 'calc(100dvh - 180px)',
          backgroundColor: `${uiColors.flyoutBg}F8`,
          borderColor: uiColors.borderColor,
          transform: activeTab ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: activeTab ? 1 : 0,
          pointerEvents: activeTab ? 'auto' : 'none',
          transition: 'transform 0.32s cubic-bezier(0.25,1,0.5,1), opacity 0.25s ease, bottom 0.3s cubic-bezier(0.25,1,0.5,1)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 z-10" style={{ backgroundColor: `${uiColors.flyoutBg}F8` }}>
          <div className="w-9 h-[3px] rounded-full opacity-25" style={{ backgroundColor: uiColors.textColor }} />
        </div>
        {mountedTab && (
          <ActiveTabFlyout activeTab={mountedTab} slideDirection={slideDirection} isTransitioning={isTabTransitioning} />
        )}
      </div>

      {/* Backdrop */}
      {activeTab && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setActiveTab(null)}
        />
      )}

      {/* Floating island pill */}
      <div className="fixed left-3 right-3 z-50" style={{ bottom: islandBottom }}>
        <div
          className="rounded-[22px] border shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden"
          style={{ backgroundColor: `${uiColors.sidebarBg}EE`, borderColor: uiColors.borderColor }}
        >
          {/* ── Action bar row (collapsible) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: actionsExpanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.28s cubic-bezier(0.25,1,0.5,1)',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                className="flex items-center border-b"
                style={{ borderColor: uiColors.borderColor, height: 48, paddingLeft: 4, paddingRight: 4, gap: 2 }}
              >
                {/* Frame toggle */}
                <button
                  type="button"
                  onClick={() => setShowPosterFrame(!showPosterFrame)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: !showPosterFrame ? uiColors.accentColor : `${uiColors.textColor}12`,
                    color: !showPosterFrame ? uiColors.activeItemText : uiColors.textColor,
                  }}
                >
                  {showPosterFrame ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                  <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {showPosterFrame ? 'Full Map' : 'Poster'}
                  </span>
                </button>

                {/* Lock */}
                <button
                  type="button"
                  onClick={() => setIsMapLocked(!isMapLocked)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: isMapLocked ? '#be123c' : `${uiColors.textColor}12`,
                    color: isMapLocked ? '#fff' : uiColors.textColor,
                  }}
                >
                  <Lock size={13} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{isMapLocked ? 'Locked' : 'Lock'}</span>
                </button>

                {/* Rotation */}
                <button
                  type="button"
                  onClick={() => setRotationEnabled(!rotationEnabled)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: rotationEnabled ? uiColors.accentColor : `${uiColors.textColor}12`,
                    color: rotationEnabled ? uiColors.activeItemText : uiColors.textColor,
                  }}
                >
                  <RotateCw size={13} className={rotationEnabled ? 'animate-spin' : ''} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>3D</span>
                </button>

                {/* 3D Photoreal Engine Toggle */}
                <button
                  type="button"
                  onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: engineMode === 'photorealistic' ? '#2563eb' : `${uiColors.textColor}12`,
                    color: engineMode === 'photorealistic' ? '#fff' : uiColors.textColor,
                  }}
                >
                  <Globe size={13} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>Photoreal</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Zoom out */}
                <button
                  type="button"
                  onClick={() => handleSmoothZoom(-0.75)}
                  className="flex items-center justify-center rounded-xl active:scale-90 cursor-pointer shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                >
                  <ZoomOut size={15} />
                </button>

                {/* Zoom label */}
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: uiColors.accentColor, minWidth: 36, textAlign: 'center' }}>
                  Z{zoom.toFixed(1)}
                </span>

                {/* Zoom in */}
                <button
                  type="button"
                  onClick={() => handleSmoothZoom(+0.75)}
                  className="flex items-center justify-center rounded-xl active:scale-90 cursor-pointer shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                >
                  <ZoomIn size={15} />
                </button>

                {/* Format picker */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setFmtOpen(!fmtOpen)}
                    className="flex items-center gap-0.5 rounded-xl active:scale-90 cursor-pointer"
                    style={{ height: 36, paddingLeft: 10, paddingRight: 8, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{exportFormat.toUpperCase()}</span>
                    <ChevronDown size={11} className={fmtOpen ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
                  </button>
                  {fmtOpen && (
                    <div
                      className="absolute bottom-full mb-2 right-0 rounded-2xl border shadow-2xl p-1.5 z-50"
                      style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor, minWidth: 130 }}
                    >
                      {(['png', 'jpeg', 'webp', 'pdf'] as ExportFormat[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => { setExportFormat(f); setFmtOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer"
                          style={{
                            backgroundColor: exportFormat === f ? `${uiColors.accentColor}20` : 'transparent',
                            color: exportFormat === f ? uiColors.accentColor : uiColors.textColor,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{f.toUpperCase()}</span>
                          {exportFormat === f && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-1 rounded-xl active:scale-90 cursor-pointer shrink-0 disabled:opacity-50"
                  style={{ height: 36, paddingLeft: 12, paddingRight: 12, backgroundColor: uiColors.accentColor, color: uiColors.activeItemText }}
                >
                  <Download size={13} className={downloading ? 'animate-bounce' : ''} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{downloading ? '…' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Nav tab row ── */}
          <div className="flex items-center" style={{ height: 64, paddingLeft: 4, paddingRight: 4 }}>
            {/* Scrollable tabs */}
            <div
              className="flex items-center flex-1 overflow-x-auto"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any, gap: 0 }}
            >
              {MOBILE_NAV_ITEMS.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (item.id === 'settings') {
                        window.open('https://github.com/Anurag-amrev-7557/mapfolio', '_blank', 'noopener,noreferrer');
                      } else {
                        setActiveTab(isActive ? null : item.id);
                      }
                    }}
                    className="flex flex-col items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all"
                    style={{
                      width: 60, height: 52, borderRadius: 14, gap: 3,
                      backgroundColor: isActive ? `${uiColors.brightAccent}20` : 'transparent',
                      color: isActive ? uiColors.brightAccent : uiColors.inactiveItemText,
                    }}
                  >
                    <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.18s' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1 }}>{item.label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-[5px] left-1/2 -translate-x-1/2 rounded-full"
                        style={{ width: 14, height: 2.5, backgroundColor: uiColors.brightAccent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse / expand chevron */}
            <button
              type="button"
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="flex items-center justify-center shrink-0 rounded-xl active:scale-90 cursor-pointer ml-1"
              style={{
                width: 36, height: 36,
                backgroundColor: actionsExpanded ? `${uiColors.brightAccent}20` : `${uiColors.textColor}10`,
                color: actionsExpanded ? uiColors.brightAccent : uiColors.inactiveItemText,
              }}
            >
              {actionsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
