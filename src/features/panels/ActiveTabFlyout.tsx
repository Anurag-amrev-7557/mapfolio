import React, { lazy, Suspense } from 'react';
import { useMapStore, getUIThemeColors } from '@/core';
import { ErrorBoundary } from '@/shared/components';
import type { NavTab } from '@/shared/types';
import { PanelSkeleton } from './PanelSkeleton';

// Code-split panels on-demand
const LocationPanel = lazy(() => import('./LocationPanel').then((m) => ({ default: m.LocationPanel })));
const ThemePanel = lazy(() => import('./ThemePanel').then((m) => ({ default: m.ThemePanel })));
const LayoutPanel = lazy(() => import('./LayoutPanel').then((m) => ({ default: m.LayoutPanel })));
const StylePanel = lazy(() => import('./StylePanel').then((m) => ({ default: m.StylePanel })));
const LayersPanel = lazy(() => import('./LayersPanel').then((m) => ({ default: m.LayersPanel })));
const MarkersPanel = lazy(() => import('./MarkersPanel').then((m) => ({ default: m.MarkersPanel })));
const RoutesPanel = lazy(() => import('./RoutesPanel').then((m) => ({ default: m.RoutesPanel })));
const AISearchPanel = lazy(() => import('./AISearchPanel').then((m) => ({ default: m.AISearchPanel })));
const SettingsPanel = lazy(() => import('./SettingsPanel').then((m) => ({ default: m.SettingsPanel })));

interface ActiveTabFlyoutProps {
  activeTab: NavTab;
  slideDirection?: 'up' | 'down' | 'left' | 'right' | null;
  isTransitioning?: boolean;
}

export const ActiveTabFlyout: React.FC<ActiveTabFlyoutProps> = ({
  activeTab,
  slideDirection = null,
  isTransitioning = false,
}) => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;

  const getSlideTransform = () => {
    if (!slideDirection) return 'translate(0, 0)';
    if (isTransitioning) {
      if (slideDirection === 'left') return 'translateX(-28px)';
      if (slideDirection === 'right') return 'translateX(28px)';
      if (slideDirection === 'up') return 'translateY(-28px)';
      if (slideDirection === 'down') return 'translateY(28px)';
    }
    return 'translate(0, 0)';
  };

  return (
    <div
      className="w-full h-full backdrop-blur-xl border-y border-r flex flex-col shrink-0 z-20 shadow-2xl transition-colors overflow-hidden"
      style={{ backgroundColor: `${flyoutBg}F2`, borderColor }}
    >
      <div
        className="flex flex-col gap-4.5 flex-1 overflow-y-auto px-4 py-4.5 no-scrollbar"
        style={{
          transform: getSlideTransform(),
          opacity: isTransitioning ? 0 : 1,
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <ErrorBoundary fallbackTitle={`Error loading ${activeTab} panel`}>
          <Suspense fallback={<PanelSkeleton tab={activeTab} />}>
            {activeTab === 'location' && <LocationPanel />}
            {activeTab === 'theme' && <ThemePanel />}
            {activeTab === 'ai-location' && <AISearchPanel />}
            {activeTab === 'layout' && <LayoutPanel />}
            {activeTab === 'style' && <StylePanel />}
            {activeTab === 'layers' && <LayersPanel />}
            {activeTab === 'markers' && <MarkersPanel />}
            {activeTab === 'routes' && <RoutesPanel />}
            {activeTab === 'settings' && <SettingsPanel />}
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  );
};
