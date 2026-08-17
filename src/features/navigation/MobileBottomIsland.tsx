import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Check,
  Lock,
  Unlock,
  Globe,
  X,
} from 'lucide-react';
import type { NavTab } from '@/shared/types';
import { ActiveTabFlyout } from '@/features/panels';
import type { ExportFormat } from '@/features/poster';
import { useMapStore, type UIThemeColors } from '@/core';

export interface MobileBottomIslandProps {
  uiColors: UIThemeColors;
  activeTab: NavTab | null;
  setActiveTab: (t: NavTab | null) => void;
  mountedTab: NavTab | null;
  slideDirection: 'up' | 'down' | 'left' | 'right' | null;
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
  const [showActionBar, setShowActionBar] = useState(true);
  const [fmtOpen, setFmtOpen] = useState(false);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setFmtOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [sheetContentHeight, setSheetContentHeight] = useState<number | null>(null);
  const sheetContentRef = useRef<HTMLDivElement>(null);

  // Measure content height dynamically with ResizeObserver for buttery-smooth height transitions
  useEffect(() => {
    if (!sheetContentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === sheetContentRef.current) {
          const contentH = entry.contentRect.height || sheetContentRef.current.scrollHeight;
          const maxAllowed = typeof window !== 'undefined' ? window.innerHeight * 0.82 - 100 : 540;
          const targetH = Math.min(maxAllowed, Math.max(220, contentH + 58));
          setSheetContentHeight(targetH);
        }
      }
    });

    observer.observe(sheetContentRef.current);
    return () => observer.disconnect();
  }, [mountedTab]);

  // Drag Down to Dismiss Gesture with Velocity Tracking & Haptics
  const [dragOffsetY, setDragOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartYRef = useRef(0);
  const lastTouchTimeRef = useRef(0);
  const lastTouchYRef = useRef(0);
  const dragVelocityRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragOffsetYRef = useRef(0);
  const hasTriggeredHapticRef = useRef(false);

  const handleDragStart = (e: React.TouchEvent | React.MouseEvent) => {
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    dragStartYRef.current = clientY;
    lastTouchYRef.current = clientY;
    lastTouchTimeRef.current = performance.now();
    dragVelocityRef.current = 0;
    isDraggingRef.current = true;
    dragOffsetYRef.current = 0;
    hasTriggeredHapticRef.current = false;
    setIsDragging(true);
  };

  useEffect(() => {
    const handleWindowTouchMove = (e: TouchEvent | MouseEvent) => {
      if (!isDraggingRef.current) return;
      const clientY = 'touches' in e ? (e as TouchEvent).touches[0].clientY : (e as MouseEvent).clientY;
      const deltaY = clientY - dragStartYRef.current;
      const now = performance.now();
      const timeDelta = Math.max(1, now - lastTouchTimeRef.current);
      const moveDelta = clientY - lastTouchYRef.current;
      
      // Calculate instantaneous velocity in px/ms
      dragVelocityRef.current = moveDelta / timeDelta;
      lastTouchTimeRef.current = now;
      lastTouchYRef.current = clientY;

      if (deltaY > 0) {
        dragOffsetYRef.current = deltaY;
        setDragOffsetY(deltaY);

        // Tactile Haptic Click when passing dismiss threshold
        if (deltaY > 70 && !hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = true;
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(10);
            }
          } catch (_) {}
        } else if (deltaY <= 70 && hasTriggeredHapticRef.current) {
          hasTriggeredHapticRef.current = false;
        }
      } else {
        const resisted = deltaY * 0.15;
        dragOffsetYRef.current = resisted;
        setDragOffsetY(resisted);
      }
    };

    const handleWindowTouchEnd = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      const finalDragY = dragOffsetYRef.current;
      const isFlick = dragVelocityRef.current > 0.38 && finalDragY > 15;
      const isPastThreshold = finalDragY > 60;

      if (isFlick || isPastThreshold) {
        try {
          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            navigator.vibrate([6, 12, 6]);
          }
        } catch (_) {}
        setActiveTab(null);
        // Preserve offset while dismissing and smoothly reset once off-screen
        setTimeout(() => {
          setDragOffsetY(0);
          dragOffsetYRef.current = 0;
        }, 420);
      } else {
        if (finalDragY > 15) {
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate(4);
            }
          } catch (_) {}
        }
        setDragOffsetY(0);
        dragOffsetYRef.current = 0;
      }

      hasTriggeredHapticRef.current = false;
    };

    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handleWindowTouchEnd);
    window.addEventListener('mousemove', handleWindowTouchMove);
    window.addEventListener('mouseup', handleWindowTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
      window.removeEventListener('mousemove', handleWindowTouchMove);
      window.removeEventListener('mouseup', handleWindowTouchEnd);
    };
  }, [setActiveTab]);

  const activeTabItem = MOBILE_NAV_ITEMS.find((item) => item.id === (activeTab || mountedTab));
  const activeNavIndex = MOBILE_NAV_ITEMS.findIndex((item) => item.id === activeTab);
  const isSheetOpen = Boolean(activeTab);

  // Safe area bottom offset
  const bottomInset = 'calc(env(safe-area-inset-bottom, 0px) + 8px)';
  const navHeight = 62;
  const sheetBottomSpacing = `calc(env(safe-area-inset-bottom, 0px) + ${navHeight + (showActionBar ? 54 : 12)}px)`;

  const currentSheetTransform = isDragging
    ? `translateY(${Math.max(0, dragOffsetY)}px) scale(${1 - Math.min(0.05, Math.max(0, dragOffsetY) / 1000)})`
    : isSheetOpen
      ? 'translateY(0) scale(1)'
      : 'translateY(calc(100% + 40px)) scale(0.96)';

  const dynamicBorderRadius = isDragging
    ? `${Math.min(34, 28 + Math.max(0, dragOffsetY) * 0.08)}px`
    : '28px';

  const dynamicShadow = isDragging
    ? `0 ${Math.max(4, 24 - dragOffsetY * 0.15)}px ${Math.max(10, 48 - dragOffsetY * 0.3)}px rgba(0,0,0,0.5)`
    : undefined;

  const backdropOpacity = isSheetOpen
    ? Math.max(0, 1 - Math.max(0, dragOffsetY) / 320)
    : 0;

  return (
    <>
      {/* ── 1. Frosted Backdrop with Smooth Fade In / Out ── */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-400 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.52)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          opacity: backdropOpacity,
          pointerEvents: isSheetOpen ? 'auto' : 'none',
        }}
        onClick={() => setActiveTab(null)}
      />

      {/* ── 2. Mobile Modal Sheet (Smooth Slide Up / Slide Down & Drag-to-Close) ── */}
      <div
        className="fixed left-2.5 right-2.5 z-40 overflow-hidden border shadow-2xl flex flex-col will-change-transform"
        style={{
          bottom: sheetBottomSpacing,
          height: isSheetOpen && sheetContentHeight ? `${sheetContentHeight}px` : 'auto',
          maxHeight: 'calc(84dvh - 90px)',
          borderRadius: dynamicBorderRadius,
          boxShadow: dynamicShadow,
          backgroundColor: uiColors.flyoutBg,
          borderColor: uiColors.borderColor,
          transform: currentSheetTransform,
          opacity: isSheetOpen ? 1 : 0,
          pointerEvents: isSheetOpen ? 'auto' : 'none',
          overscrollBehavior: 'none',
          overscrollBehaviorY: 'none',
          transition: isDragging
            ? 'none'
            : 'height 0.42s cubic-bezier(0.22, 1, 0.36, 1), transform 0.44s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.32s ease, bottom 0.35s cubic-bezier(0.22, 1, 0.36, 1), border-radius 0.28s ease',
        }}
      >
        {/* Sheet Top Bar: Drag Handle + Header + Close Button (Interactive Drag Area) */}
        <div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          className="flex flex-col border-b shrink-0 px-4 pt-2 pb-2.5 sticky top-0 z-30 select-none cursor-grab active:cursor-grabbing touch-none"
          style={{ backgroundColor: `${uiColors.flyoutBg}FA`, borderColor: uiColors.borderColor }}
        >
          {/* Dynamic Morphing Drag Pill */}
          <div className="flex justify-center mb-1.5 py-0.5">
            <div
              className="h-1.5 rounded-full transition-all duration-150 flex items-center justify-center"
              style={{
                width: isDragging ? `${Math.min(68, 48 + dragOffsetY * 0.2)}px` : '48px',
                backgroundColor: isDragging && dragOffsetY > 70 ? uiColors.brightAccent : uiColors.textColor,
                opacity: isDragging ? 0.9 : 0.35,
                boxShadow: isDragging && dragOffsetY > 70 ? `0 0 8px ${uiColors.brightAccent}80` : undefined,
              }}
            />
          </div>

          {/* Title & Close Action */}
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-center gap-2.5">
              <div
                className="w-7 h-7 rounded-xl flex items-center justify-center shadow-xs"
                style={{ backgroundColor: `${uiColors.brightAccent}20`, color: uiColors.brightAccent }}
              >
                {activeTabItem?.icon}
              </div>
              <span
                className="text-xs font-black font-sans tracking-widest uppercase"
                style={{ color: uiColors.textColor }}
              >
                {activeTabItem?.label || 'SETTINGS'}
              </span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(null);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all active:scale-90"
              style={{ backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
              title="Close panel"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Sheet Content Area (with Smooth Horizontal Slide Left/Right on Tab Switch) */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar"
          style={{
            WebkitOverflowScrolling: 'touch' as any,
            overscrollBehavior: 'contain',
            overscrollBehaviorY: 'contain',
          }}
        >
          <div ref={sheetContentRef} className="w-full pb-6">
            {mountedTab && (
              <ActiveTabFlyout
                activeTab={mountedTab}
                slideDirection={slideDirection}
                isTransitioning={isTabTransitioning}
              />
            )}
          </div>
        </div>
      </div>

      {/* ── 3. Floating Mobile Navigation Container (Dock & Action Bar) ── */}
      <div
        className="fixed left-2.5 right-2.5 z-50 flex flex-col gap-2 pointer-events-none select-none"
        style={{ bottom: bottomInset }}
      >
        {/* ── Enhanced Action Bar (Smooth Slide Up / Slide Down Floating Dock) ── */}
        <div
          className="flex items-center justify-between rounded-full border shadow-xl backdrop-blur-2xl px-2 py-1.5 pointer-events-auto will-change-transform"
          style={{
            backgroundColor: `${uiColors.sidebarBg}F6`,
            borderColor: uiColors.borderColor,
            opacity: showActionBar ? 1 : 0,
            transform: showActionBar ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.95)',
            pointerEvents: showActionBar ? 'auto' : 'none',
            maxHeight: showActionBar ? '64px' : '0px',
            marginBottom: showActionBar ? '2px' : '0px',
            paddingTop: showActionBar ? '5px' : '0px',
            paddingBottom: showActionBar ? '5px' : '0px',
            borderWidth: showActionBar ? '1px' : '0px',
            overflow: 'visible',
            transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.28s ease, max-height 0.32s cubic-bezier(0.22, 1, 0.36, 1), margin 0.32s ease, padding 0.32s ease, border-width 0.32s ease',
          }}
        >
          {/* Left Action Controls (Frame / Lock / Engine) */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 pr-1.5"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {/* Frame View Mode Toggle */}
            <button
              type="button"
              onClick={() => setShowPosterFrame(!showPosterFrame)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
              style={{
                backgroundColor: !showPosterFrame ? uiColors.accentColor : `${uiColors.textColor}12`,
                color: !showPosterFrame ? uiColors.activeItemText : uiColors.textColor,
              }}
              title="Toggle Full Map / Poster Frame"
            >
              {showPosterFrame ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
              <span>{showPosterFrame ? 'Full' : 'Poster'}</span>
            </button>

            {/* Map Lock Toggle */}
            <button
              type="button"
              onClick={() => setIsMapLocked(!isMapLocked)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
              style={{
                backgroundColor: isMapLocked ? '#be123c' : `${uiColors.textColor}12`,
                color: isMapLocked ? '#ffffff' : uiColors.textColor,
              }}
              title="Lock / Unlock Map Navigation"
            >
              {isMapLocked ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{isMapLocked ? 'Locked' : 'Lock'}</span>
            </button>

            {/* Engine Mode Toggle (Vector / Photoreal) */}
            <button
              type="button"
              onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
              style={{
                backgroundColor: engineMode === 'photorealistic' ? '#2563eb' : `${uiColors.textColor}12`,
                color: engineMode === 'photorealistic' ? '#ffffff' : uiColors.textColor,
              }}
              title="Toggle Vector / 3D Photoreal Engine"
            >
              <Globe size={12} />
              <span>{engineMode === 'photorealistic' ? 'Photoreal' : 'Vector'}</span>
            </button>
          </div>

          {/* Right Action Controls: Unified Smart Export Pill with Dropdown */}
          <div className="relative shrink-0" ref={formatDropdownRef}>
            <button
              type="button"
              onClick={() => setFmtOpen(!fmtOpen)}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shadow-md disabled:opacity-50"
              style={{ backgroundColor: uiColors.brightAccent, color: '#ffffff' }}
              title="Export Poster Format & Download"
            >
              <Download size={12} className={downloading ? 'animate-bounce' : ''} />
              <span>{downloading ? 'Exporting…' : `Export · ${exportFormat.toUpperCase()}`}</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${fmtOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Floating Format Chooser & Download Menu */}
            {fmtOpen && (
              <div
                className="absolute bottom-full mb-2.5 right-0 rounded-2xl border shadow-2xl p-1.5 z-50 flex flex-col gap-1 backdrop-blur-2xl"
                style={{
                  backgroundColor: `${uiColors.flyoutBg}FA`,
                  borderColor: uiColors.borderColor,
                  minWidth: 160,
                }}
              >
                <div className="px-2.5 pt-1.5 pb-1 border-b" style={{ borderColor: `${uiColors.borderColor}60` }}>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-50" style={{ color: uiColors.textColor }}>
                    Choose Format
                  </span>
                </div>

                {([
                  { fmt: 'png', label: 'PNG Image', desc: 'Lossless quality' },
                  { fmt: 'jpeg', label: 'JPEG Image', desc: 'Smaller size' },
                  { fmt: 'webp', label: 'WebP Format', desc: 'Ultra modern' },
                  { fmt: 'pdf', label: 'PDF Document', desc: 'Print vector' },
                ] as const).map(({ fmt, label, desc }) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => {
                      setExportFormat(fmt);
                      setFmtOpen(false);
                      handleDownload();
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left cursor-pointer transition-all active:scale-95"
                    style={{
                      backgroundColor: exportFormat === fmt ? `${uiColors.brightAccent}20` : 'transparent',
                      color: exportFormat === fmt ? uiColors.brightAccent : uiColors.textColor,
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold font-sans">{label}</span>
                      <span className="text-[8.5px] opacity-60">{desc}</span>
                    </div>
                    {exportFormat === fmt ? (
                      <Check size={13} className="shrink-0" />
                    ) : (
                      <Download size={11} className="opacity-40 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Main Pure Rounded Bottom Navigation Island Pill ── */}
        <div
          className="rounded-full border shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto flex items-center px-1 py-0.5"
          style={{ backgroundColor: `${uiColors.sidebarBg}F5`, borderColor: uiColors.borderColor }}
        >
          {/* Scrollable Navigation Tabs Container */}
          <div
            className="relative flex items-center flex-1 overflow-x-auto no-scrollbar gap-1 py-0.5"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {/* Sliding Active Indicator Pill */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 76,
                height: 48,
                top: 2,
                left: 0,
                backgroundColor: `${uiColors.brightAccent}22`,
                border: `1px solid ${uiColors.brightAccent}35`,
                transform: `translateX(${activeNavIndex >= 0 ? activeNavIndex * 80 : 0}px)`,
                opacity: activeNavIndex >= 0 ? 1 : 0,
                transition: 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.22s ease',
                zIndex: 1,
              }}
            />

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
                  className="flex flex-col items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all duration-200 rounded-full px-1 z-10"
                  style={{
                    width: 76,
                    minWidth: 76,
                    maxWidth: 76,
                    height: 48,
                    gap: 2.5,
                    backgroundColor: 'transparent',
                    color: isActive ? uiColors.brightAccent : uiColors.inactiveItemText,
                  }}
                >
                  <div
                    className="transition-transform duration-200"
                    style={{ transform: isActive ? 'scale(1.06)' : 'scale(1)' }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-bold font-sans uppercase tracking-tight leading-none whitespace-nowrap text-center">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Action Bar Toggle Button */}
          <button
            type="button"
            onClick={() => setShowActionBar(!showActionBar)}
            className="flex items-center justify-center shrink-0 w-8 h-10 rounded-full active:scale-90 cursor-pointer ml-1 transition-all z-10"
            style={{
              backgroundColor: showActionBar ? `${uiColors.brightAccent}20` : `${uiColors.textColor}10`,
              color: showActionBar ? uiColors.brightAccent : uiColors.inactiveItemText,
            }}
            title={showActionBar ? 'Hide Action Bar' : 'Show Action Bar'}
          >
            {showActionBar ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
          </button>
        </div>
      </div>
    </>
  );
}

