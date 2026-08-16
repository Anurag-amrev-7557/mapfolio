import { useEffect } from 'react';
import { useMapStore } from '@/core';

const AUTOSAVE_KEY = 'mapfolio_autosave';

export function useAutosave() {
  const { setLocation } = useMapStore();

  // Restore from URL Hash or Auto-Save on mount
  useEffect(() => {
    try {
      // Check URL Hash first
      if (window.location.hash && window.location.hash.length > 2) {
        const hashStr = decodeURIComponent(window.location.hash.slice(1));
        const data = JSON.parse(hashStr);
        if (data.lat && data.lng) setLocation(data.lat, data.lng, data.zoom || 12);
        if (data.themeId) useMapStore.getState().setTheme(data.themeId);
        if (data.title || data.subtitle) useMapStore.getState().setText(data.title || '', data.subtitle || '');
        if (data.fontFamily) useMapStore.getState().setFontFamily(data.fontFamily);
        if (data.borderStyle) useMapStore.getState().setBorderStyle(data.borderStyle);
        if (data.showCompass !== undefined && data.showCompass !== useMapStore.getState().showCompass) useMapStore.getState().toggleCompass();
        if (data.showScaleBar !== undefined && data.showScaleBar !== useMapStore.getState().showScaleBar) useMapStore.getState().toggleScaleBar();
        return;
      }

      // Fallback to localStorage Autosave
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data = JSON.parse(saved);
        if (data.lat && data.lng) setLocation(data.lat, data.lng, data.zoom || 12);
        if (data.themeId) useMapStore.getState().setTheme(data.themeId);
        if (data.title || data.subtitle) useMapStore.getState().setText(data.title || '', data.subtitle || '');
        if (data.fontFamily) useMapStore.getState().setFontFamily(data.fontFamily);
      }
    } catch (e) {
      console.warn('Failed to restore poster state:', e);
    }
  }, [setLocation]);

  // Sync to URL Hash and Auto-Save every 10 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const state = useMapStore.getState();
        const payload = {
          lat: Number(state.lat.toFixed(4)),
          lng: Number(state.lng.toFixed(4)),
          zoom: Number(state.zoom.toFixed(1)),
          themeId: state.themeId,
          title: state.title,
          subtitle: state.subtitle,
          fontFamily: state.fontFamily,
          borderStyle: state.borderStyle,
          showCompass: state.showCompass,
          showScaleBar: state.showScaleBar,
        };
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(payload));
        window.history.replaceState(null, '', `#${encodeURIComponent(JSON.stringify(payload))}`);
      } catch {
        // Silently fail
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, []);
}
