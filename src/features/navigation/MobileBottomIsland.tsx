import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  X,
} from 'lucide-react';
import type { NavTab } from '@/shared/types';
import { ActiveTabFlyout } from '@/features/panels';
import type { ExportFormat } from '@/features/poster';
import { type UIThemeColors, getReadableTextColor } from '@/core';

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
}: MobileBottomIslandProps) {
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

  const currentTabId = activeTab || mountedTab;
  const activeTabItem = currentTabId === 'settings'
    ? { id: 'settings' as NavTab, label: 'SETTINGS', icon: <Download size={16} strokeWidth={2.2} /> }
    : MOBILE_NAV_ITEMS.find((item) => item.id === currentTabId);
  const activeNavIndex = MOBILE_NAV_ITEMS.findIndex((item) => item.id === activeTab);
  const isSheetOpen = Boolean(activeTab);

  // Safe area bottom offset
  const bottomInset = 'calc(env(safe-area-inset-bottom, 0px) + 8px)';
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

      {/* ── 3. Main Pure Rounded Floating Bottom Navigation Island Pill ── */}
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
            className="relative flex items-center flex-1 overflow-x-auto no-scrollbar gap-[3px] py-0.5"
            style={{ WebkitOverflowScrolling: 'touch' as any }}
          >
            {/* Sliding Active Indicator Pill */}
            <div
              className="absolute rounded-full pointer-events-none"
              style={{
                width: 68,
                height: 46,
                top: 2,
                left: 0,
                backgroundColor: `${uiColors.brightAccent}22`,
                border: `1px solid ${uiColors.brightAccent}35`,
                transform: `translateX(${activeNavIndex >= 0 ? activeNavIndex * 71 : 0}px)`,
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
                  onClick={() => setActiveTab(isActive ? null : item.id)}
                  className="flex flex-col items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all duration-200 rounded-full px-0.5 z-10"
                  style={{
                    width: 68,
                    minWidth: 68,
                    maxWidth: 68,
                    height: 46,
                    gap: 2,
                    backgroundColor: 'transparent',
                    color: isActive ? uiColors.brightAccent : uiColors.inactiveItemText,
                  }}
                >
                  <div
                    className="transition-transform duration-200"
                    style={{ transform: isActive ? 'scale(1.05)' : 'scale(1)' }}
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

          {/* ── Pinned Ultra-Premium Download Icon Button on Right End with Fade Divider ── */}
          <div className="relative flex items-center shrink-0 pl-1.5 pr-0.5 ml-0.5">
            {/* Vertical Fade Divider Line */}
            <div
              className="absolute left-0 top-2.5 bottom-2.5 w-[1px] pointer-events-none"
              style={{
                background: `linear-gradient(180deg, transparent 0%, ${uiColors.borderColor} 35%, ${uiColors.borderColor} 65%, transparent 100%)`,
              }}
            />

            {/* Soft Edge Fade Shadow */}
            <div
              className="absolute -left-3.5 top-0 bottom-0 w-3.5 pointer-events-none"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${uiColors.sidebarBg}F5 100%)`,
              }}
            />

            <button
              type="button"
              onClick={() => setActiveTab(activeTab === 'settings' ? null : 'settings')}
              className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all duration-200 z-10"
              style={{
                backgroundColor: activeTab === 'settings'
                  ? uiColors.brightAccent
                  : uiColors.darkestThemeColor,
                color: activeTab === 'settings'
                  ? uiColors.activeItemText
                  : getReadableTextColor(uiColors.darkestThemeColor),
                border: activeTab === 'settings'
                  ? `1.5px solid ${uiColors.brightAccent}`
                  : `1px solid ${uiColors.borderColor}`,
                boxShadow: '0 3px 12px rgba(0, 0, 0, 0.4)',
              }}
              title="Export Poster & Artwork"
            >
              <div
                className="transition-transform duration-200"
                style={{ transform: activeTab === 'settings' ? 'scale(1.12)' : 'scale(1)' }}
              >
                <Download
                  size={20}
                  strokeWidth={2.2}
                  style={{
                    color: activeTab === 'settings'
                      ? uiColors.activeItemText
                      : getReadableTextColor(uiColors.darkestThemeColor),
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

