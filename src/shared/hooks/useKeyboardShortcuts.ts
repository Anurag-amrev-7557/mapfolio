import { useEffect } from 'react';
import type { NavTab } from '@/shared/types';

interface ShortcutOptions {
  activeTab: NavTab | null;
  setActiveTab: (tab: NavTab | null) => void;
  zoom: number;
  handleSmoothZoom: (delta: number) => void;
  handleDownload: () => void;
  setShowPosterFrame: React.Dispatch<React.SetStateAction<boolean>>;
  setIsFormatDropdownOpen: (open: boolean) => void;
}

export function useKeyboardShortcuts({
  activeTab,
  setActiveTab,
  zoom,
  handleSmoothZoom,
  handleDownload,
  setShowPosterFrame,
  setIsFormatDropdownOpen,
}: ShortcutOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Ctrl+E / Cmd+E → Export
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleDownload();
        return;
      }

      // Escape → Close sidebar / dropdowns
      if (e.key === 'Escape') {
        setActiveTab(null);
        setIsFormatDropdownOpen(false);
        return;
      }

      // Number keys 1-9 → Navigate to tabs
      const tabMap: Record<string, NavTab> = {
        '1': 'location',
        '2': 'theme',
        '3': 'layout',
        '4': 'style',
        '5': 'layers',
        '6': 'markers',
        '7': 'routes',
        '8': 'ai-location',
        '9': 'theme',
      };
      if (tabMap[e.key]) {
        const targetTab = tabMap[e.key];
        setActiveTab(activeTab === targetTab ? null : targetTab);
        return;
      }

      // +/= → Zoom In, -/_ → Zoom Out
      if (e.key === '=' || e.key === '+') {
        handleSmoothZoom(+0.75);
        return;
      }
      if (e.key === '-' || e.key === '_') {
        handleSmoothZoom(-0.75);
        return;
      }

      // F → Toggle poster frame
      if (e.key === 'f' || e.key === 'F') {
        setShowPosterFrame((prev) => !prev);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, zoom, handleSmoothZoom, handleDownload, setActiveTab, setIsFormatDropdownOpen, setShowPosterFrame]);
}
