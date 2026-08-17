import React from 'react';
import { useMapStore, getUIThemeColors } from '@/core';
import { ErrorBoundary } from '@/shared/components';
import type { NavTab } from '@/shared/types';
import { LocationPanel } from './LocationPanel';
import { ThemePanel } from './ThemePanel';
import { LayoutPanel } from './LayoutPanel';
import { StylePanel } from './StylePanel';
import { LayersPanel } from './LayersPanel';
import { MarkersPanel } from './MarkersPanel';
import { RoutesPanel } from './RoutesPanel';
import { AISearchPanel } from './AISearchPanel';
import { SettingsPanel } from './SettingsPanel';

interface ActiveTabFlyoutProps {
  activeTab: NavTab;
  slideDirection?: 'up' | 'down' | 'left' | 'right' | null;
  isTransitioning?: boolean;
}

export const ActiveTabFlyout: React.FC<ActiveTabFlyoutProps> = ({
  activeTab,
}) => {
  const { themeId, colorOverrides, customThemes } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;

  return (
    <div
      className="w-full min-h-full md:h-full md:min-h-0 backdrop-blur-xl md:border-y md:border-r flex flex-col z-20 transition-colors overflow-hidden"
      style={{ backgroundColor: `${flyoutBg}F2`, borderColor }}
    >
      <div
        key={activeTab}
        className="flex flex-col gap-4.5 flex-1 min-h-0 md:overflow-y-auto overflow-visible px-4 py-3.5 no-scrollbar animate-in fade-in duration-150"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          overscrollBehavior: 'contain',
        }}
      >
        <ErrorBoundary fallbackTitle={`Error loading ${activeTab} panel`}>
          {activeTab === 'location' && <LocationPanel />}
          {activeTab === 'theme' && <ThemePanel />}
          {activeTab === 'ai-location' && <AISearchPanel />}
          {activeTab === 'layout' && <LayoutPanel />}
          {activeTab === 'style' && <StylePanel />}
          {activeTab === 'layers' && <LayersPanel />}
          {activeTab === 'markers' && <MarkersPanel />}
          {activeTab === 'routes' && <RoutesPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </ErrorBoundary>
      </div>
    </div>
  );
};
