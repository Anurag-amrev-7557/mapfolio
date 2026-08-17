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
  ExternalLink,
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
  const [showActionsModal, setShowActionsModal] = useState(false);
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
  const sheetBottomSpacing = 'calc(env(safe-area-inset-bottom, 0px) + 70px)';

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

      {/* ── 3. Centered Quick Actions & Export Modal Dialog ── */}
      {/* Frosted Modal Backdrop */}
      <div
        className="fixed inset-0 z-50 transition-opacity duration-300 ease-out"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          opacity: showActionsModal ? 1 : 0,
          pointerEvents: showActionsModal ? 'auto' : 'none',
        }}
        onClick={() => setShowActionsModal(false)}
      />

      {/* Centered Modal Card */}
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[calc(100%-32px)] max-w-[360px] rounded-[28px] border shadow-[0_16px_60px_rgba(0,0,0,0.6)] p-4.5 flex flex-col gap-4 will-change-transform pointer-events-auto"
        style={{
          backgroundColor: `${uiColors.flyoutBg}FA`,
          borderColor: uiColors.borderColor,
          opacity: showActionsModal ? 1 : 0,
          transform: showActionsModal
            ? 'translate(-50%, -50%) scale(1)'
            : 'translate(-50%, -46%) scale(0.92)',
          pointerEvents: showActionsModal ? 'auto' : 'none',
          transition: 'transform 0.32s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.25s ease',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: `${uiColors.borderColor}60` }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${uiColors.brightAccent}25`, color: uiColors.brightAccent }}
            >
              <Download size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight leading-tight" style={{ color: uiColors.textColor }}>
                Export & Actions
              </h3>
              <p className="text-[10px] opacity-60 leading-none mt-0.5" style={{ color: uiColors.textColor }}>
                Download artwork or toggle views
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowActionsModal(false)}
            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90 cursor-pointer transition-colors"
            style={{ backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Section 1: File Formats (1-Tap Export Grid) */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9.5px] font-black uppercase tracking-widest opacity-60" style={{ color: uiColors.textColor }}>
            Download Format
          </span>
          <div className="grid grid-cols-2 gap-2">
            {([
              { fmt: 'png', label: 'PNG Image', badge: 'HD', desc: 'Lossless quality' },
              { fmt: 'jpeg', label: 'JPEG Image', badge: 'JPG', desc: 'Compact file' },
              { fmt: 'webp', label: 'WebP Format', badge: 'WEB', desc: 'Fast modern' },
              { fmt: 'pdf', label: 'PDF Vector', badge: 'DOC', desc: 'Print ready' },
            ] as const).map(({ fmt, label, badge, desc }) => {
              const isCurrent = exportFormat === fmt;
              return (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    setExportFormat(fmt);
                    setShowActionsModal(false);
                    handleDownload();
                  }}
                  className="flex flex-col p-2.5 rounded-2xl border text-left cursor-pointer transition-all active:scale-95 group relative overflow-hidden"
                  style={{
                    backgroundColor: isCurrent ? `${uiColors.brightAccent}20` : `${uiColors.textColor}08`,
                    borderColor: isCurrent ? `${uiColors.brightAccent}60` : uiColors.borderColor,
                  }}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className="text-[9px] font-mono font-black px-1.5 py-0.5 rounded-md"
                      style={{
                        backgroundColor: isCurrent ? uiColors.brightAccent : `${uiColors.textColor}15`,
                        color: isCurrent ? '#ffffff' : uiColors.textColor,
                      }}
                    >
                      {badge}
                    </span>
                    <Download size={13} className={isCurrent ? 'opacity-100' : 'opacity-40'} style={{ color: isCurrent ? uiColors.brightAccent : uiColors.textColor }} />
                  </div>
                  <span className="text-xs font-bold font-sans leading-tight" style={{ color: uiColors.textColor }}>
                    {label}
                  </span>
                  <span className="text-[9px] opacity-60 mt-0.5" style={{ color: uiColors.textColor }}>
                    {desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Quick Map View Toggles */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[9.5px] font-black uppercase tracking-widest opacity-60" style={{ color: uiColors.textColor }}>
            Quick Controls
          </span>
          <div className="grid grid-cols-3 gap-2">
            {/* Poster / Full View */}
            <button
              type="button"
              onClick={() => setShowPosterFrame(!showPosterFrame)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
              style={{
                backgroundColor: !showPosterFrame ? `${uiColors.accentColor}25` : `${uiColors.textColor}08`,
                borderColor: !showPosterFrame ? `${uiColors.accentColor}70` : uiColors.borderColor,
                color: uiColors.textColor,
              }}
            >
              {showPosterFrame ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              <span className="text-[9.5px] font-bold mt-1 uppercase tracking-tight leading-none">
                {showPosterFrame ? 'Full' : 'Poster'}
              </span>
            </button>

            {/* Map Lock */}
            <button
              type="button"
              onClick={() => setIsMapLocked(!isMapLocked)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
              style={{
                backgroundColor: isMapLocked ? '#be123c25' : `${uiColors.textColor}08`,
                borderColor: isMapLocked ? '#be123c70' : uiColors.borderColor,
                color: isMapLocked ? '#f43f5e' : uiColors.textColor,
              }}
            >
              {isMapLocked ? <Lock size={14} /> : <Unlock size={14} />}
              <span className="text-[9.5px] font-bold mt-1 uppercase tracking-tight leading-none">
                {isMapLocked ? 'Locked' : 'Lock'}
              </span>
            </button>

            {/* 3D Photoreal Engine */}
            <button
              type="button"
              onClick={() => setEngineMode(engineMode === 'photorealistic' ? 'vector' : 'photorealistic')}
              className="flex flex-col items-center justify-center p-2 rounded-2xl border text-center active:scale-95 cursor-pointer transition-all"
              style={{
                backgroundColor: engineMode === 'photorealistic' ? '#2563eb25' : `${uiColors.textColor}08`,
                borderColor: engineMode === 'photorealistic' ? '#2563eb70' : uiColors.borderColor,
                color: engineMode === 'photorealistic' ? '#3b82f6' : uiColors.textColor,
              }}
            >
              <Globe size={14} />
              <span className="text-[9.5px] font-bold mt-1 uppercase tracking-tight leading-none">
                {engineMode === 'photorealistic' ? 'Photoreal' : 'Vector'}
              </span>
            </button>
          </div>
        </div>

        {/* Section 3: GitHub Link */}
        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: `${uiColors.borderColor}60` }}>
          <a
            href="https://github.com/Anurag-amrev-7557/mapfolio"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-2xl border w-full justify-center active:scale-95 transition-all"
            style={{
              backgroundColor: `${uiColors.textColor}08`,
              borderColor: uiColors.borderColor,
              color: uiColors.textColor,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
            </svg>
            <span className="text-xs font-bold font-sans">GitHub Repository</span>
            <ExternalLink size={12} className="opacity-50" />
          </a>
        </div>
      </div>

      {/* ── 4. Main Pure Rounded Floating Bottom Navigation Island Pill ── */}
      <div
        className="fixed left-2.5 right-2.5 z-40 flex flex-col pointer-events-none select-none"
        style={{ bottom: bottomInset }}
      >
        <div
          className="rounded-full border shadow-[0_8px_40px_rgba(0,0,0,0.6)] overflow-hidden pointer-events-auto flex items-center px-1.5 py-1"
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

          {/* Download & Quick Actions Trigger Button on BottomNav Right */}
          <button
            type="button"
            onClick={() => setShowActionsModal(true)}
            className="flex items-center justify-center shrink-0 w-11 h-11 rounded-full active:scale-90 cursor-pointer ml-1 transition-all z-10 shadow-sm"
            style={{
              backgroundColor: uiColors.brightAccent,
              color: '#ffffff',
            }}
            title="Export Poster & Actions"
          >
            <Download size={18} className={downloading ? 'animate-bounce' : ''} />
          </button>
        </div>
      </div>
    </>
  );
}

