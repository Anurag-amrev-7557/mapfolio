import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Droplet,
  Layout,
  Type,
  Layers,
  Map as MarkerIcon,
  Route,
  Search,
} from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';
import type { NavTab } from '@/shared/types';

interface IconNavSidebarProps {
  activeTab: NavTab | null;
  onTabChange: (tab: NavTab | null) => void;
}

export const IconNavSidebar: React.FC<IconNavSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);

  const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'location', label: 'LOCATION', icon: <MapPin size={20} /> },
    { id: 'theme', label: 'THEME', icon: <Droplet size={20} /> },
    { id: 'layout', label: 'LAYOUT', icon: <Layout size={20} /> },
    { id: 'style', label: 'STYLE', icon: <Type size={20} /> },
    { id: 'layers', label: 'LAYERS', icon: <Layers size={20} /> },
    { id: 'markers', label: 'MARKERS', icon: <MarkerIcon size={20} /> },
    { id: 'routes', label: 'ROUTES', icon: <Route size={20} /> },
    { id: 'ai-location', label: 'AI SEARCH', icon: <Search size={20} /> },
  ];

  // Refs for measuring button positions for the sliding indicator
  const sidebarRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const settingsRef = useRef<HTMLButtonElement>(null);
  const [indicatorPos, setIndicatorPos] = useState<{ top: number; height: number }>({ top: 0, height: 56 });
  const [hasPosition, setHasPosition] = useState(false);
  const prevActiveTabRef = useRef<NavTab | null>(activeTab);
  const [isOpeningFromClosed, setIsOpeningFromClosed] = useState(false);

  // Measure button position for any tab
  const getButtonPosition = (tabId: NavTab) => {
    const container = sidebarRef.current;
    if (!container) return null;

    let targetButton: HTMLButtonElement | null = null;
    if (tabId === 'settings') {
      targetButton = settingsRef.current;
    } else {
      targetButton = buttonRefs.current.get(tabId) || null;
    }

    if (targetButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = targetButton.getBoundingClientRect();
      return {
        top: buttonRect.top - containerRect.top,
        height: buttonRect.height,
      };
    }
    return null;
  };

  // Update sliding indicator position when activeTab changes
  useEffect(() => {
    const prevTab = prevActiveTabRef.current;
    prevActiveTabRef.current = activeTab;

    if (activeTab) {
      const pos = getButtonPosition(activeTab);
      if (pos) {
        if (!prevTab) {
          // Opening from completely closed state -> set top position with NO vertical animation!
          setIsOpeningFromClosed(true);
          setIndicatorPos(pos);
          setHasPosition(true);
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              setIsOpeningFromClosed(false);
            });
          });
        } else {
          // Already open -> smoothly glide vertically between tabs!
          setIsOpeningFromClosed(false);
          setIndicatorPos(pos);
          setHasPosition(true);
        }
      }
    }
  }, [activeTab]);

  return (
    <aside 
      ref={sidebarRef}
      className="w-18 h-full backdrop-blur-xl border-r flex flex-col justify-between pt-2.5 pb-3 shrink-0 z-40 select-none relative transition-colors duration-300"
      style={{
        backgroundColor: `${uiColors.sidebarBg}FA`,
        borderColor: uiColors.borderColor,
      }}
    >
      {/* ── Top Brand Logo ── */}
      <div className="w-full flex flex-col items-center justify-center shrink-0">
        <button
          type="button"
          onClick={() => onTabChange(null)}
          className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer mb-2 p-0 bg-transparent border-0 shadow-none outline-none"
          title="Mapfolio Studio"
        >
          <img src="/favicon.svg" alt="Mapfolio" className="w-11 h-11 object-contain" />
        </button>

        {/* Dark Divider below Logo */}
        <div 
          className="w-11 h-px rounded-full"
          style={{ backgroundColor: uiColors.isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.2)' }}
        />
      </div>

      {/* ── Sliding Active Indicator Full-Width Flush Across Sidebar ── */}
      {hasPosition && (
        <div
          className="absolute inset-x-0 w-full pointer-events-none z-0"
          style={{
            top: `${indicatorPos.top}px`,
            height: `${indicatorPos.height}px`,
            opacity: activeTab ? 1 : 0,
            transform: activeTab ? 'scale(1)' : 'scale(0.95)',
            transition: isOpeningFromClosed
              ? 'opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1), transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'top 0.32s cubic-bezier(0.25, 1, 0.5, 1), height 0.32s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <div
            className="w-full h-full border-y shadow-sm"
            style={{
              backgroundColor: uiColors.activeItemBg,
              borderColor: `${uiColors.accentColor}35`,
            }}
          />
        </div>
      )}

      {/* Navigation Buttons List */}
      <div className="flex-1 flex flex-col gap-1 w-full relative z-10 py-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) buttonRefs.current.set(item.id, el);
                else buttonRefs.current.delete(item.id);
              }}
              onClick={() => onTabChange(isActive ? null : item.id)}
              className="w-full h-13.5 flex flex-col items-center justify-center gap-1 transition-colors duration-200 cursor-pointer group relative shrink-0"
              style={{
                color: isActive ? uiColors.activeItemText : uiColors.inactiveItemText,
              }}
              title={item.label}
            >
              <div 
                className="transition-transform duration-200 group-hover:scale-110 flex items-center justify-center"
                style={{
                  color: isActive ? uiColors.activeItemText : 'currentColor',
                }}
              >
                {item.icon}
              </div>
              <span 
                className="text-[8.5px] font-sans font-black tracking-widest leading-none uppercase"
                style={{
                  color: isActive ? uiColors.activeItemText : 'currentColor',
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Button with Dark Divider */}
      <div className="w-full flex flex-col items-center relative z-10 shrink-0">
        {/* Dark Divider above GitHub/Settings button */}
        <div 
          className="w-11 h-px rounded-full mb-1.5"
          style={{ backgroundColor: uiColors.isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.2)' }}
        />

        <button
          ref={settingsRef}
          onClick={() => onTabChange(activeTab === 'settings' ? null : 'settings')}
          className="w-full h-13 flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer group"
          style={{
            color: activeTab === 'settings' ? uiColors.activeItemText : uiColors.inactiveItemText,
          }}
          title="Settings & Info"
        >
          <div 
            className="transition-transform duration-200 group-hover:scale-110 flex items-center justify-center"
            style={{
              color: activeTab === 'settings' ? uiColors.activeItemText : 'currentColor',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/>
            </svg>
          </div>
          <span 
            className="text-[8.5px] font-sans font-black tracking-widest leading-none uppercase"
            style={{
              color: activeTab === 'settings' ? uiColors.activeItemText : 'currentColor',
            }}
          >
            ABOUT
          </span>
        </button>
      </div>
    </aside>
  );
};
