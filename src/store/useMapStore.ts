import { create } from 'zustand';
import { DEFAULT_THEME_ID, getTheme, type CustomTheme, type ThemePalette } from '../constants/themes';
import { LAYOUTS, type LayoutType } from '../constants/layouts';
import { DEFAULT_FONT } from '../constants/fonts';

export interface CustomMarkerItem {
  id: string;
  name: string;
  url: string; // Data URL or SVG string
  createdAt: number;
}

export interface MarkerData {
  id: string;
  lat: number;
  lng: number;
  type: 'pin' | 'dot' | 'badge' | 'icon' | 'custom';
  iconName: string; // Lucide icon name or custom ID
  color: string;
  size: number; // 16 - 256
  label?: string;
  customImageUrl?: string;
}

export interface ActiveMarkerSettings {
  type: 'pin' | 'dot' | 'badge' | 'icon' | 'custom';
  iconName: string;
  color: string;
  size: number;
  label: string;
  customMarkerId?: string;
}

export interface RouteData {
  geojson: any | null;
  name?: string;
  color: string;
  width: number;
  distanceKm?: number;
  waypointSize?: number;
}

export type ColorOverrideKeys =
  | 'land'
  | 'landcover'
  | 'water'
  | 'waterway'
  | 'parks'
  | 'buildings'
  | 'aeroway'
  | 'rail'
  | 'roadsMajor'
  | 'roadsMinorHigh'
  | 'roadsMinorMid'
  | 'roadsMinorLow'
  | 'roadsPath'
  | 'roadsOutline';

export interface LayerVisibilityState {
  landcover: boolean;
  buildings: boolean;
  water: boolean;
  parks: boolean;
  roads: boolean;
  rail: boolean;
  aeroway: boolean;
  labels: boolean;
}

interface MapState {
  lat: number;
  lng: number;
  zoom: number;
  themeId: string;
  title: string;
  subtitle: string;
  activeLayout: LayoutType;
  fontFamily: string;
  letterSpacingMultiplier: number;
  
  // Custom Themes State
  customThemes: CustomTheme[];
  saveCustomTheme: (name: string) => CustomTheme;
  deleteCustomTheme: (id: string) => void;

  // Markers State
  markers: MarkerData[];
  activeMarkerSettings: ActiveMarkerSettings;
  customMarkers: CustomMarkerItem[];

  // Route State
  route: RouteData;
  isDrawingRoute: boolean;
  routeWaypoints: { lat: number; lng: number }[];
  routingProfile: 'driving' | 'cycling' | 'foot' | 'direct';
  routePreference: 'shortest' | 'fastest';

  // Overrides & Visibility & Elements
  colorOverrides: Partial<Record<ColorOverrideKeys, string>>;
  layerVisibility: LayerVisibilityState;
  showTextOverlay: boolean;
  showGradientOverlay: boolean;
  borderStyle: 'none' | 'thin' | 'double' | 'rounded' | 'art-deco';
  showCompass: boolean;
  showScaleBar: boolean;
  showRouteStats: boolean;

  // Actions
  setLocation: (lat: number, lng: number, zoom?: number) => void;
  setTheme: (id: string) => void;
  setText: (title: string, subtitle: string) => void;
  setLayout: (layout: LayoutType) => void;
  setFontFamily: (fontFamily: string) => void;
  setLetterSpacingMultiplier: (multiplier: number) => void;

  // Marker Actions
  setActiveMarkerSettings: (settings: Partial<ActiveMarkerSettings>) => void;
  addMarker: (lat: number, lng: number, customOpts?: Partial<MarkerData>) => void;
  updateMarker: (id: string, data: Partial<MarkerData>) => void;
  deleteMarker: (id: string) => void;
  clearMarkers: () => void;

  // Custom Marker Library Actions
  addCustomMarker: (name: string, url: string) => CustomMarkerItem;
  removeCustomMarker: (id: string) => void;

  // Route Actions
  setRouteGeoJson: (geojson: any, name?: string, distanceKm?: number) => void;
  setRouteColor: (color: string) => void;
  setRouteWidth: (width: number) => void;
  setRouteWaypointSize: (waypointSize: number) => void;
  clearRoute: () => void;
  setIsDrawingRoute: (isDrawing: boolean) => void;
  addRouteWaypoint: (lat: number, lng: number) => void;
  removeRouteWaypoint: (index: number) => void;
  clearRouteWaypoints: () => void;
  setRoutingProfile: (profile: 'driving' | 'cycling' | 'foot' | 'direct') => void;
  setRoutePreference: (preference: 'shortest' | 'fastest') => void;

  // Layer & Overlay Actions
  setColorOverride: (key: ColorOverrideKeys, value: string) => void;
  resetColorOverrides: () => void;
  toggleLayerVisibility: (key: keyof LayerVisibilityState) => void;
  toggleTextOverlay: () => void;
  toggleGradientOverlay: () => void;
  setBorderStyle: (style: 'none' | 'thin' | 'double' | 'rounded' | 'art-deco') => void;
  toggleCompass: () => void;
  toggleScaleBar: () => void;
  toggleRouteStats: () => void;
  autoScaleToViewport: (viewportWidth: number, viewportHeight: number) => void;
}

// Initial default custom marker icons (sample default SVGs/graphics)
const INITIAL_CUSTOM_MARKERS: CustomMarkerItem[] = [
  {
    id: 'default-custom-compass',
    name: 'Compass Rose',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="%233b82f6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>',
    createdAt: Date.now() - 10000,
  },
  {
    id: 'default-custom-crest',
    name: 'Shield Crest',
    url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="%23ef4444" stroke="%23ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    createdAt: Date.now() - 5000,
  }
];

// Load custom themes from localStorage
const loadSavedCustomThemes = (): CustomTheme[] => {
  try {
    const saved = localStorage.getItem('terraink_custom_themes');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Failed to load custom themes:', e);
  }
  return [];
};

export const useMapStore = create<MapState>((set, get) => ({
  lat: 52.3759,
  lng: 9.7320,
  zoom: 12,
  themeId: DEFAULT_THEME_ID,
  title: 'HANOVER',
  subtitle: 'GERMANY',
  activeLayout: LAYOUTS[0],
  fontFamily: DEFAULT_FONT.value,
  letterSpacingMultiplier: 1.0,

  // Custom Themes
  customThemes: loadSavedCustomThemes(),
  saveCustomTheme: (name: string) => {
    const state = get();
    const activeBaseTheme = getTheme(state.themeId, state.customThemes);
    const overrides = state.colorOverrides;

    const newPalette: ThemePalette = {
      land: overrides.land || activeBaseTheme.palette.land,
      landcover: overrides.landcover || activeBaseTheme.palette.landcover,
      water: overrides.water || activeBaseTheme.palette.water,
      waterway: overrides.waterway || activeBaseTheme.palette.waterway,
      parks: overrides.parks || activeBaseTheme.palette.parks,
      buildings: overrides.buildings || activeBaseTheme.palette.buildings,
      aeroway: overrides.aeroway || activeBaseTheme.palette.aeroway,
      rail: overrides.rail || activeBaseTheme.palette.rail,
      roads: {
        major: overrides.roadsMajor || activeBaseTheme.palette.roads.major,
        minor_high: overrides.roadsMinorHigh || activeBaseTheme.palette.roads.minor_high,
        minor_mid: overrides.roadsMinorMid || activeBaseTheme.palette.roads.minor_mid,
        minor_low: overrides.roadsMinorLow || activeBaseTheme.palette.roads.minor_low,
        path: overrides.roadsPath || activeBaseTheme.palette.roads.path,
        outline: overrides.roadsOutline || activeBaseTheme.palette.roads.outline,
      },
    };

    const newTheme: CustomTheme = {
      id: `custom-${Date.now()}`,
      name: name.trim() || `Custom Palette ${state.customThemes.length + 1}`,
      description: `User-created theme palette`,
      palette: newPalette,
      createdAt: Date.now(),
    };

    const updated = [newTheme, ...state.customThemes];
    try {
      localStorage.setItem('terraink_custom_themes', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save custom themes:', e);
    }

    set({ customThemes: updated, themeId: newTheme.id, colorOverrides: {} });
    return newTheme;
  },

  deleteCustomTheme: (id: string) => {
    set((state) => {
      const updated = state.customThemes.filter((t) => t.id !== id);
      try {
        localStorage.setItem('terraink_custom_themes', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update custom themes:', e);
      }
      const nextThemeId = state.themeId === id ? DEFAULT_THEME_ID : state.themeId;
      return { customThemes: updated, themeId: nextThemeId };
    });
  },

  // Markers
  markers: [],
  activeMarkerSettings: {
    type: 'pin',
    iconName: 'MapPin',
    color: '#ef4444',
    size: 36,
    label: '',
  },
  customMarkers: INITIAL_CUSTOM_MARKERS,

  // Route
  route: {
    geojson: null,
    color: '#3b82f6',
    width: 3.5,
    waypointSize: 28,
  },
  isDrawingRoute: false,
  routeWaypoints: [],
  routingProfile: 'driving',
  routePreference: 'shortest',

  // Color Overrides & Visibility
  colorOverrides: {},
  layerVisibility: {
    landcover: true,
    buildings: false,
    water: true,
    parks: true,
    roads: true,
    rail: true,
    aeroway: true,
    labels: true,
  },
  showTextOverlay: true,
  showGradientOverlay: true,
  borderStyle: 'none',
  showCompass: false,
  showScaleBar: false,
  showRouteStats: false,

  // Basic Actions
  setLocation: (lat, lng, zoom) => set((state) => ({ 
    lat, lng, zoom: zoom !== undefined ? zoom : state.zoom 
  })),
  setTheme: (themeId) => set({ themeId, colorOverrides: {} }),
  setText: (title, subtitle) => set({ title, subtitle }),
  setLayout: (activeLayout) => set({ activeLayout }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setLetterSpacingMultiplier: (letterSpacingMultiplier) => set({ letterSpacingMultiplier }),

  // Marker Settings Action
  setActiveMarkerSettings: (settings) => set((state) => ({
    activeMarkerSettings: { ...state.activeMarkerSettings, ...settings }
  })),

  // Add Marker on map click or manual placement
  addMarker: (lat, lng, customOpts) => set((state) => {
    const settings = state.activeMarkerSettings;
    let customImgUrl: string | undefined = undefined;

    if (settings.type === 'custom' && settings.customMarkerId) {
      const found = state.customMarkers.find(c => c.id === settings.customMarkerId);
      if (found) customImgUrl = found.url;
    }

    const newMarker: MarkerData = {
      id: crypto.randomUUID(),
      lat,
      lng,
      type: customOpts?.type || settings.type,
      iconName: customOpts?.iconName || settings.iconName,
      color: customOpts?.color || settings.color,
      size: customOpts?.size || settings.size,
      label: customOpts?.label !== undefined ? customOpts.label : settings.label,
      customImageUrl: customOpts?.customImageUrl || customImgUrl,
    };

    return { markers: [...state.markers, newMarker] };
  }),

  updateMarker: (id, data) => set((state) => ({
    markers: state.markers.map((m) => (m.id === id ? { ...m, ...data } : m))
  })),

  deleteMarker: (id) => set((state) => ({
    markers: state.markers.filter((m) => m.id !== id)
  })),

  clearMarkers: () => set({ markers: [] }),

  // Custom Marker Library Management
  addCustomMarker: (name, url) => {
    const newItem: CustomMarkerItem = {
      id: `custom-${crypto.randomUUID()}`,
      name: name || 'Custom Marker',
      url,
      createdAt: Date.now(),
    };
    set((state) => ({
      customMarkers: [newItem, ...state.customMarkers],
      activeMarkerSettings: {
        ...state.activeMarkerSettings,
        type: 'custom',
        customMarkerId: newItem.id,
      }
    }));
    return newItem;
  },

  removeCustomMarker: (id) => set((state) => {
    const updatedCustom = state.customMarkers.filter((c) => c.id !== id);
    const activeIsRemoved = state.activeMarkerSettings.customMarkerId === id;
    
    return {
      customMarkers: updatedCustom,
      activeMarkerSettings: activeIsRemoved
        ? { ...state.activeMarkerSettings, type: 'pin', iconName: 'MapPin', customMarkerId: undefined }
        : state.activeMarkerSettings,
      // Reset placed custom markers using this image to pin fallback
      markers: state.markers.map((m) => 
        m.customImageUrl && state.customMarkers.find(c => c.id === id)?.url === m.customImageUrl
          ? { ...m, type: 'pin', iconName: 'MapPin', customImageUrl: undefined }
          : m
      )
    };
  }),

  // Route Actions
  setRouteGeoJson: (geojson, name, distanceKm) => set((state) => ({
    route: { ...state.route, geojson, name, distanceKm }
  })),
  setRouteColor: (color) => set((state) => ({
    route: { ...state.route, color }
  })),
  setRouteWidth: (width) => set((state) => ({
    route: { ...state.route, width }
  })),
  setRouteWaypointSize: (waypointSize) => set((state) => ({
    route: { ...state.route, waypointSize }
  })),
  clearRoute: () => set((state) => ({
    route: { ...state.route, geojson: null, name: undefined, distanceKm: undefined },
    routeWaypoints: [],
  })),
  setIsDrawingRoute: (isDrawingRoute) => set({ isDrawingRoute }),
  addRouteWaypoint: (lat, lng) => set((state) => ({
    routeWaypoints: [...state.routeWaypoints, { lat, lng }]
  })),
  removeRouteWaypoint: (index) => set((state) => {
    const updated = state.routeWaypoints.filter((_, i) => i !== index);
    if (updated.length < 2) {
      return {
        routeWaypoints: updated,
        route: { ...state.route, geojson: null, name: undefined, distanceKm: undefined },
      };
    }
    return { routeWaypoints: updated };
  }),
  clearRouteWaypoints: () => set((state) => ({
    routeWaypoints: [],
    route: { ...state.route, geojson: null, name: undefined, distanceKm: undefined },
  })),
  setRoutingProfile: (routingProfile) => set({ routingProfile }),
  setRoutePreference: (routePreference) => set({ routePreference }),

  // Color Overrides & Visibility Actions
  setColorOverride: (key, value) => set((state) => ({
    colorOverrides: { ...state.colorOverrides, [key]: value }
  })),
  resetColorOverrides: () => set({ colorOverrides: {} }),
  toggleLayerVisibility: (key) => set((state) => ({
    layerVisibility: {
      ...state.layerVisibility,
      [key]: !state.layerVisibility[key],
    },
  })),
  toggleTextOverlay: () => set((state) => ({ showTextOverlay: !state.showTextOverlay })),
  toggleGradientOverlay: () => set((state) => ({ showGradientOverlay: !state.showGradientOverlay })),
  setBorderStyle: (borderStyle) => set({ borderStyle }),
  toggleCompass: () => set((state) => ({ showCompass: !state.showCompass })),
  toggleScaleBar: () => set((state) => ({ showScaleBar: !state.showScaleBar })),
  toggleRouteStats: () => set((state) => ({ showRouteStats: !state.showRouteStats })),
  autoScaleToViewport: (viewportWidth: number, viewportHeight: number) => {
    const minDim = Math.min(viewportWidth, viewportHeight);
    const sf = Math.max(0.6, Math.min(2.5, minDim / 800));
    const newMarkerSize = Math.min(256, Math.max(20, Math.round(36 * sf)));
    const newWpSize = Math.min(256, Math.max(16, Math.round(28 * sf)));
    const newRouteWidth = Math.min(64, Math.max(2, Math.round(3.5 * sf)));

    set((state) => ({
      activeMarkerSettings: { ...state.activeMarkerSettings, size: newMarkerSize },
      route: { ...state.route, waypointSize: newWpSize, width: newRouteWidth },
      markers: state.markers.map((m) => ({ ...m, size: Math.min(256, Math.max(20, Math.round((m.size || 36) * sf))) })),
    }));
  },
}));
