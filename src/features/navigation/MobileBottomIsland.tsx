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
  RotateCw,
  ZoomIn,
  ZoomOut,
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
  const { pitch, setPitch } = useMapStore();

  const handleToggle3D = () => {
    if (pitch === 0) {
      setPitch(60);
      setRotationEnabled(true);
    } else {
      setPitch(0);
      setRotationEnabled(false);
    }
  };

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
          className="flex flex-col border-b shrink-0 px-4 pt-2 pb-2.5 sticky top-0 z-30 select-none cursor-grab active:cursor-grabbing touch-none backdrop-blur-2xl"
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
        {/* ── Enhanced Action Bar (Floating Pill above BottomNav) ── */}
        <div
          className="flex items-center justify-between rounded-2xl border shadow-xl backdrop-blur-2xl px-2 py-1.5 pointer-events-auto transition-all duration-300 ease-out"
          style={{
            backgroundColor: `${uiColors.sidebarBg}F2`,
            borderColor: uiColors.borderColor,
            opacity: showActionBar ? 1 : 0,
            transform: showActionBar ? 'translateY(0)' : 'translateY(16px)',
            pointerEvents: showActionBar ? 'auto' : 'none',
            display: showActionBar ? 'flex' : 'none',
          }}
        >
          {/* Left Action Controls (Frame / Lock / 3D / Engine) */}
          <div
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 pr-2"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {/* Frame View Mode Toggle */}
            <button
              type="button"
              onClick={() => setShowPosterFrame(!showPosterFrame)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
              style={{
                backgroundColor: isMapLocked ? '#be123c' : `${uiColors.textColor}12`,
                color: isMapLocked ? '#ffffff' : uiColors.textColor,
              }}
              title="Lock / Unlock Map Navigation"
            >
              {isMapLocked ? <Lock size={12} /> : <Unlock size={12} />}
              <span>{isMapLocked ? 'Locked' : 'Lock'}</span>
            </button>

            {/* 3D Plane Tilt Toggle */}
            <button
              type="button"
              onClick={handleToggle3D}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
              style={{
                backgroundColor: pitch > 0 ? uiColors.accentColor : `${uiColors.textColor}12`,
                color: pitch > 0 ? uiColors.activeItemText : uiColors.textColor,
              }}
              title="Toggle 2D / 3D Tilt View"
            >
              <RotateCw size={12} className={pitch > 0 ? 'rotate-45' : ''} />
              <span>{pitch > 0 ? `3D ${Math.round(pitch)}°` : '2D'}</span>
            </button>

            {/* Engine Mode Toggle (Vector / Photoreal) */}
            <button
              type="button"
              onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shrink-0"
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

          {/* Right Action Controls (Zoom Stepper & Format / Download) */}
          <div className="flex items-center gap-1 shrink-0 pl-1.5 border-l" style={{ borderColor: uiColors.borderColor }}>
            {/* Zoom Stepper */}
            <div
              className="flex items-center rounded-xl p-0.5"
              style={{ backgroundColor: `${uiColors.textColor}10` }}
            >
              <button
                type="button"
                onClick={() => handleSmoothZoom(-0.75)}
                className="w-6 h-6 flex items-center justify-center rounded-lg active:scale-90 cursor-pointer"
                style={{ color: uiColors.textColor }}
                title="Zoom Out"
              >
                <ZoomOut size={12} />
              </button>

              <span
                className="text-[10px] font-black font-mono px-1 min-w-[32px] text-center"
                style={{ color: uiColors.brightAccent }}
              >
                Z{zoom.toFixed(1)}
              </span>

              <button
                type="button"
                onClick={() => handleSmoothZoom(+0.75)}
                className="w-6 h-6 flex items-center justify-center rounded-lg active:scale-90 cursor-pointer"
                style={{ color: uiColors.textColor }}
                title="Zoom In"
              >
                <ZoomIn size={12} />
              </button>
            </div>

            {/* Export Format Selector */}
            <div className="relative" ref={formatDropdownRef}>
              <button
                type="button"
                onClick={() => setFmtOpen(!fmtOpen)}
                className="flex items-center gap-0.5 px-2 py-1.5 rounded-xl text-[10px] font-mono font-black active:scale-90 cursor-pointer"
                style={{ backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
              >
                <span>{exportFormat.toUpperCase()}</span>
                <ChevronDown size={10} className={`transition-transform duration-200 ${fmtOpen ? 'rotate-180' : ''}`} />
              </button>

              {fmtOpen && (
                <div
                  className="absolute bottom-full mb-2 right-0 rounded-2xl border shadow-2xl p-1.5 z-50 flex flex-col gap-0.5"
                  style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor, minWidth: 120 }}
                >
                  {(['png', 'jpeg', 'webp', 'pdf'] as ExportFormat[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setExportFormat(f);
                        setFmtOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold cursor-pointer transition-colors"
                      style={{
                        backgroundColor: exportFormat === f ? `${uiColors.brightAccent}20` : 'transparent',
                        color: exportFormat === f ? uiColors.brightAccent : uiColors.textColor,
                      }}
                    >
                      <span>{f.toUpperCase()}</span>
                      {exportFormat === f && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Download / Export Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-black uppercase tracking-wider transition-all active:scale-90 cursor-pointer shadow-md disabled:opacity-50"
              style={{ backgroundColor: uiColors.brightAccent, color: '#ffffff' }}
              title="Download Poster"
            >
              <Download size={12} className={downloading ? 'animate-bounce' : ''} />
              <span>{downloading ? '…' : 'Export'}</span>
            </button>
          </div>
        </div>

        {/* ── Main Bottom Navigation Island Pill ── */}
        <div
          className="rounded-[24px] border shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden pointer-events-auto flex items-center px-1.5 py-1.5"
          style={{ backgroundColor: `${uiColors.sidebarBg}F5`, borderColor: uiColors.borderColor }}
        >
          {/* Scrollable Navigation Tabs */}
          <div
            className="flex items-center flex-1 overflow-x-auto no-scrollbar gap-1"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
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
                  className="flex flex-col items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all duration-200"
                  style={{
                    minWidth: 58,
                    height: 50,
                    borderRadius: 16,
                    gap: 2.5,
                    backgroundColor: isActive ? `${uiColors.brightAccent}20` : 'transparent',
                    color: isActive ? uiColors.brightAccent : uiColors.inactiveItemText,
                  }}
                >
                  <div
                    className="transition-transform duration-200"
                    style={{ transform: isActive ? 'scale(1.12)' : 'scale(1)' }}
                  >
                    {item.icon}
                  </div>
                  <span className="text-[9px] font-black font-sans uppercase tracking-tight">
                    {item.label}
                  </span>
                  {isActive && (
                    <span
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full shadow-sm"
                      style={{ width: 14, height: 2.5, backgroundColor: uiColors.brightAccent }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Bar Toggle Button */}
          <button
            type="button"
            onClick={() => setShowActionBar(!showActionBar)}
            className="flex items-center justify-center shrink-0 w-8 h-12 rounded-xl active:scale-90 cursor-pointer ml-1 transition-all"
            style={{
              backgroundColor: showActionBar ? `${uiColors.brightAccent}20` : `${uiColors.textColor}10`,
              color: showActionBar ? uiColors.brightAccent : uiColors.inactiveItemText,
            }}
            title={showActionBar ? 'Hide Action Bar' : 'Show Action Bar'}
          >
            {showActionBar ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>
      </div>
    </>
  );
}

