import React, { useState, useRef, useEffect } from 'react';
import {
  MapPin,
  Droplet,
  Layout,
  Type,
  Layers,
  Map as MarkerIcon,
  Route,
  Settings,
  Search,
  Crosshair,
  ChevronDown,
  Check,
  Upload,
  Car,
  Bike,
  Footprints,
  Navigation,
  X,
  Building2,
  Landmark,
  Compass,
  Globe2,
  TowerControl,
  Plane,
  Trees,
  Train,
  Sparkles,
  Star,
  Heart,
  Flag,
  Target,
  Home,
  Plus,
  Minus
} from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { LAYOUTS, type LayoutType, type LayoutOrientation } from '../constants/layouts';
import { ThemeSelector } from './ThemeSelector';
import { FONT_OPTIONS, getFontByValue, type FontCategory } from '../constants/fonts';
import { getUIThemeColors } from '../utils/themeColors';

/** Fetch road-snapped GeoJSON route from OSRM for a list of waypoints */
async function fetchOsrmRoadRoute(
  waypoints: { lat: number; lng: number }[],
  profile: 'driving' | 'cycling' | 'foot' | 'direct',
  preference: 'shortest' | 'fastest' = 'shortest'
): Promise<{ geojson: any; distanceKm: number } | null> {
  if (!waypoints || waypoints.length < 2) return null;

  // Direct Point-to-Point Mode
  if (profile === 'direct') {
    const coords = waypoints.map((w) => [w.lng, w.lat]);
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dx = (p2[0] - p1[0]) * 111.32;
      const dy = (p2[1] - p1[1]) * 111.32;
      dist += Math.sqrt(dx * dx + dy * dy);
    }
    return {
      geojson: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
      distanceKm: parseFloat(dist.toFixed(2)),
    };
  }

  const osrmProfile = profile === 'driving' ? 'driving' : profile === 'cycling' ? 'bike' : 'foot';

  // Segment-by-segment routing to eliminate intermediate U-turn penalties and forced highway loops
  const segmentPromises = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const w1 = waypoints[i];
    const w2 = waypoints[i + 1];
    const coordsStr = `${w1.lng.toFixed(6)},${w1.lat.toFixed(6)};${w2.lng.toFixed(6)},${w2.lat.toFixed(6)}`;
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordsStr}?overview=full&geometries=geojson&alternatives=3&continue_straight=false&radiuses=3500;3500`;

    segmentPromises.push(
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || !data.routes || data.routes.length === 0) return null;
          let chosen = data.routes[0];
          if (preference === 'shortest' && data.routes.length > 1) {
            chosen = data.routes.reduce((prev: any, curr: any) =>
              curr.distance < prev.distance ? curr : prev
            );
          }
          return chosen;
        })
        .catch(() => null)
    );
  }

  const results = await Promise.all(segmentPromises);

  let allCoords: [number, number][] = [];
  let totalDistanceMeters = 0;

  for (let i = 0; i < results.length; i++) {
    const segRoute = results[i];
    const w1: [number, number] = [waypoints[i].lng, waypoints[i].lat];
    const w2: [number, number] = [waypoints[i + 1].lng, waypoints[i + 1].lat];

    if (segRoute && segRoute.geometry && segRoute.geometry.coordinates) {
      let segCoords: [number, number][] = [...segRoute.geometry.coordinates];
      totalDistanceMeters += segRoute.distance || 0;

      if (segCoords.length > 0) {
        // Anchor segment start & end to exact waypoints
        if (Math.hypot(segCoords[0][0] - w1[0], segCoords[0][1] - w1[1]) > 0.00001) {
          segCoords = [w1, ...segCoords];
        }
        if (Math.hypot(segCoords[segCoords.length - 1][0] - w2[0], segCoords[segCoords.length - 1][1] - w2[1]) > 0.00001) {
          segCoords = [...segCoords, w2];
        }

        if (allCoords.length === 0) {
          allCoords = segCoords;
        } else {
          // Join seamlessly without repeating boundary point
          allCoords = [...allCoords, ...segCoords.slice(1)];
        }
      } else {
        allCoords.push(w1, w2);
      }
    } else {
      // Fallback direct line segment if OSRM segment query fails
      if (allCoords.length === 0) {
        allCoords.push(w1, w2);
      } else {
        allCoords.push(w2);
      }
      const dx = (w2[0] - w1[0]) * 111.32;
      const dy = (w2[1] - w1[1]) * 111.32;
      totalDistanceMeters += Math.sqrt(dx * dx + dy * dy) * 1000;
    }
  }

  const distanceKm = parseFloat((totalDistanceMeters / 1000).toFixed(2));
  return {
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: allCoords,
      },
    },
    distanceKm,
  };

  // Fallback straight-line segments if OSRM is unreachable
  const fallbackCoords = waypoints.map((w) => [w.lng, w.lat]);
  let fallbackDistance = 0;
  for (let i = 0; i < fallbackCoords.length - 1; i++) {
    const p1 = fallbackCoords[i];
    const p2 = fallbackCoords[i + 1];
    const dx = (p2[0] - p1[0]) * 111.32;
    const dy = (p2[1] - p1[1]) * 111.32;
    fallbackDistance += Math.sqrt(dx * dx + dy * dy);
  }

  return {
    geojson: {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: fallbackCoords,
      },
    },
    distanceKm: parseFloat(fallbackDistance.toFixed(2)),
  };
}

/** Parse XML GPX file content into GeoJSON LineString */
function parseGpxTrack(gpxContent: string): { geojson: any; distanceKm: number; name?: string } | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

    const nameNode = xmlDoc.querySelector('name');
    const routeName = nameNode ? nameNode.textContent || 'Imported GPX Track' : 'Imported GPX Track';

    const points = Array.from(xmlDoc.querySelectorAll('trkpt, rtept, wpt'));
    if (points.length === 0) return null;

    const coordinates: [number, number][] = points
      .map((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') || '');
        const lon = parseFloat(pt.getAttribute('lon') || '');
        return [lon, lat] as [number, number];
      })
      .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat));

    if (coordinates.length < 2) return null;

    let totalDist = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const dx = (p2[0] - p1[0]) * 111.32;
      const dy = (p2[1] - p1[1]) * 111.32;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    const geojson = {
      type: 'Feature',
      properties: { name: routeName },
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };

    return {
      geojson,
      distanceKm: parseFloat(totalDist.toFixed(2)),
      name: routeName,
    };
  } catch (err) {
    console.error('GPX parse error:', err);
    return null;
  }
}

export type NavTab =
  | 'location'
  | 'theme'
  | 'layout'
  | 'style'
  | 'layers'
  | 'markers'
  | 'routes'
  | 'settings';

interface IconNavSidebarProps {
  activeTab: NavTab | null;
  onTabChange: (tab: NavTab) => void;
}

export const IconNavSidebar: React.FC<IconNavSidebarProps> = ({
  activeTab,
  onTabChange
}) => {
  const {
    themeId,
    colorOverrides,
    customThemes
  } = useMapStore();
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);

  const mainNavItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'location', label: 'LOCATION', icon: <MapPin size={20} /> },
    { id: 'theme', label: 'THEME', icon: <Droplet size={20} /> },
    { id: 'layout', label: 'LAYOUT', icon: <Layout size={20} /> },
    { id: 'style', label: 'STYLE', icon: <Type size={20} /> },
    { id: 'layers', label: 'LAYERS', icon: <Layers size={20} /> },
    { id: 'markers', label: 'MARKERS', icon: <MarkerIcon size={20} /> },
    { id: 'routes', label: 'ROUTES', icon: <Route size={20} /> }
  ];

  // Refs for measuring button positions for the sliding indicator
  const sidebarRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const settingsRef = useRef<HTMLButtonElement>(null);
  const [indicatorPos, setIndicatorPos] = useState<{ top: number; height: number }>({ top: 0, height: 60 });
  const [hasPosition, setHasPosition] = useState(false);

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
    if (activeTab) {
      const pos = getButtonPosition(activeTab);
      if (pos) {
        setIndicatorPos(pos);
        setHasPosition(true);
      } else {
        requestAnimationFrame(() => {
          const delayedPos = getButtonPosition(activeTab);
          if (delayedPos) {
            setIndicatorPos(delayedPos);
            setHasPosition(true);
          }
        });
      }
    }
    // When activeTab becomes null, keep indicatorPos at last known position so it slides out cleanly to the left
  }, [activeTab]);

  return (
    <aside 
      ref={sidebarRef}
      className="w-[72px] flex flex-col justify-between border-r shrink-0 z-30 select-none py-3 transition-colors duration-200 shadow-xl relative overflow-hidden"
      style={{ backgroundColor: uiColors.sidebarBg, borderColor: uiColors.borderColor }}
    >
      {/* Sliding active indicator pill attached to left edge */}
      <div
        className="absolute left-0 right-1.5 pointer-events-none"
        style={{
          top: `${indicatorPos.top}px`,
          height: `${indicatorPos.height}px`,
          borderRadius: '0 14px 14px 0',
          backgroundColor: uiColors.activeItemBg,
          transform: activeTab && hasPosition ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1), top 0.3s cubic-bezier(0.25, 1, 0.5, 1), height 0.15s ease',
          willChange: 'transform, top',
          boxShadow: activeTab ? '2px 4px 12px rgba(0,0,0,0.18)' : 'none',
        }}
      />

      {/* Top Main Navigation Tabs */}
      <div className="flex flex-col gap-1 pl-1 pr-1.5">
        {mainNavItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              ref={(el) => { if (el) buttonRefs.current.set(item.id, el); }}
              onClick={() => onTabChange(isActive ? (null as any) : item.id)}
              className="flex flex-col items-center justify-center py-3 px-1 rounded-r-xl transition-colors gap-1 cursor-pointer group relative z-10"
              style={{
                color: isActive ? uiColors.activeItemText : uiColors.inactiveItemText,
              }}
            >
              <div className="transition-transform group-hover:scale-110">
                {item.icon}
              </div>
              <span className="text-[9px] tracking-wider font-bold font-mono">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Settings Tab */}
      <div className="pl-1 pr-1.5 pt-2 border-t" style={{ borderColor: uiColors.borderColor }}>
        <button
          ref={settingsRef}
          onClick={() =>
            onTabChange(activeTab === 'settings' ? (null as any) : 'settings')
          }
          className="w-full flex flex-col items-center justify-center py-3 px-1 rounded-r-xl transition-colors gap-1 cursor-pointer group relative z-10"
          style={{
            color: activeTab === 'settings' ? uiColors.activeItemText : uiColors.inactiveItemText,
          }}
        >
          <div className="transition-transform group-hover:scale-110">
            <Settings size={20} />
          </div>
          <span className="text-[9px] tracking-wider font-bold font-mono">
            SETTINGS
          </span>
        </button>
      </div>
    </aside>
  );
};

export const ActiveTabFlyout: React.FC<{ 
  activeTab: NavTab; 
  slideDirection?: 'up' | 'down' | null;
  isTransitioning?: boolean;
}> = ({
  activeTab,
  slideDirection = null,
  isTransitioning = false,
}) => {
  const {
    lat,
    lng,
    zoom,
    title,
    subtitle,
    themeId,
    colorOverrides,
    customThemes,
    setLocation,
    setText,
    setLayout,
    activeLayout,
    fontFamily,
    setFontFamily,
    letterSpacingMultiplier = 1.0,
    setLetterSpacingMultiplier,
    markers,
    clearMarkers,
    deleteMarker,
    updateMarker,
    activeMarkerSettings,
    setActiveMarkerSettings,
    customMarkers,
    addCustomMarker,
    removeCustomMarker,
    layerVisibility,
    toggleLayerVisibility,
    showTextOverlay,
    showGradientOverlay,
    toggleTextOverlay,
    toggleGradientOverlay,
    route,
    setRouteGeoJson,
    setRouteColor,
    setRouteWidth,
    setRouteWaypointSize,
    clearRoute,
    isDrawingRoute,
    setIsDrawingRoute,
    routeWaypoints,
    removeRouteWaypoint,
    clearRouteWaypoints,
    routingProfile,
    setRoutingProfile,
    routePreference,
    setRoutePreference,
    autoScaleToViewport,
  } = useMapStore();

  // Auto-fetch road-snapped route when waypoints, routing profile, or preference change
  useEffect(() => {
    if (routeWaypoints.length >= 2) {
      fetchOsrmRoadRoute(routeWaypoints, routingProfile, routePreference).then((res) => {
        if (res) {
          setRouteGeoJson(res.geojson, `Custom ${routingProfile.toUpperCase()} Route`, res.distanceKm);
        }
      });
    } else if (routeWaypoints.length < 2 && route.geojson && isDrawingRoute) {
      clearRoute();
    }
  }, [routeWaypoints, routingProfile, routePreference]);

  const handleGpxFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const parsed = parseGpxTrack(content);
      if (parsed) {
        setRouteGeoJson(parsed.geojson, parsed.name || file.name, parsed.distanceKm);

        // Auto-center map on middle GPX coordinate
        const coords = parsed.geojson.geometry.coordinates;
        if (coords && coords.length > 0) {
          const midIdx = Math.floor(coords.length / 2);
          const [midLng, midLat] = coords[midIdx];
          setLocation(midLat, midLng, 12);
        }
      }
    };
    reader.readAsText(file);
  };

  // Fully theme-responsive flyout backgrounds and borders with high contrast ratios
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const accentColor = uiColors.accentColor;
  const brightAccent = uiColors.brightAccent;
  const dangerText = uiColors.dangerText;

  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);

  // Search Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fine-tuning Manual Coordinates State
  const [manualLat, setManualLat] = useState<number>(lat);
  const [manualLng, setManualLng] = useState<number>(lng);

  // Recent Searches State
  const [recentLocations, setRecentLocations] = useState<{ title: string; subtitle: string; lat: number; lng: number }[]>(() => {
    try {
      const saved = localStorage.getItem('terraink_recent_locations');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Featured Poster Destinations
  const FEATURED_DESTINATIONS = [
    { city: 'New York', country: 'United States', code: 'USA', lat: 40.7128, lng: -74.0060, icon: <Building2 size={16} /> },
    { city: 'Paris', country: 'France', code: 'FRA', lat: 48.8566, lng: 2.3522, icon: <Landmark size={16} /> },
    { city: 'Tokyo', country: 'Japan', code: 'JPN', lat: 35.6762, lng: 139.6503, icon: <TowerControl size={16} /> },
    { city: 'London', country: 'United Kingdom', code: 'GBR', lat: 51.5074, lng: -0.1278, icon: <Compass size={16} /> },
    { city: 'San Francisco', country: 'United States', code: 'USA', lat: 37.7749, lng: -122.4194, icon: <Navigation size={16} /> },
    { city: 'Sydney', country: 'Australia', code: 'AUS', lat: -33.8688, lng: 151.2093, icon: <Globe2 size={16} /> },
    { city: 'Berlin', country: 'Germany', code: 'DEU', lat: 52.5200, lng: 13.4050, icon: <Sparkles size={16} /> },
    { city: 'Amsterdam', country: 'Netherlands', code: 'NLD', lat: 52.3676, lng: 4.9041, icon: <MapPin size={16} /> },
    { city: 'Rome', country: 'Italy', code: 'ITA', lat: 41.9028, lng: 12.4964, icon: <Plane size={16} /> },
  ];

  // Sync manual lat/lng with active map position (rounded to 4 decimals for clean UI)
  useEffect(() => {
    setManualLat(Number(lat.toFixed(4)));
    setManualLng(Number(lng.toFixed(4)));
  }, [lat, lng]);

  // Debounced Search Autocomplete Effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=6`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setSuggestions(data);
          setShowSuggestions(true);
        }
      } catch (err) {
        console.warn('Autocomplete fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (latVal: number, lngVal: number, cityName: string, countryName: string) => {
    setLocation(latVal, lngVal, 12);
    setText(cityName.toUpperCase(), countryName.toUpperCase());
    setShowSuggestions(false);
    setSearchQuery('');

    // Save to Recent Searches (up to 5 items)
    const newEntry = { title: cityName.toUpperCase(), subtitle: countryName.toUpperCase(), lat: latVal, lng: lngVal };
    const updated = [newEntry, ...recentLocations.filter((item) => item.title !== newEntry.title)].slice(0, 5);
    setRecentLocations(updated);
    try {
      localStorage.setItem('terraink_recent_locations', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentLocation = (indexToRemove: number) => {
    const updated = recentLocations.filter((_, idx) => idx !== indexToRemove);
    setRecentLocations(updated);
    try {
      localStorage.setItem('terraink_recent_locations', JSON.stringify(updated));
    } catch {}
  };

  // Layout Orientation Filter & Custom Editor State
  const [layoutOrientationFilter, setLayoutOrientationFilter] = useState<'all' | 'landscape' | 'portrait' | 'square'>('all');
  const [showCustomLayoutEditor, setShowCustomLayoutEditor] = useState(false);

  // Font Category Filter
  const [fontCategoryFilter, setFontCategoryFilter] = useState<FontCategory | 'all'>('all');

  // Custom Select dropdown state
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const fontDropdownRef = useRef<HTMLDivElement>(null);

  // Custom Resolution State
  const [customWidth, setCustomWidth] = useState<number>(activeLayout.widthPx || 1920);
  const [customHeight, setCustomHeight] = useState<number>(activeLayout.heightPx || 1080);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fontDropdownRef.current && !fontDropdownRef.current.contains(event.target as Node)) {
        setIsFontDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedFontOption = getFontByValue(fontFamily);

  const filteredLayouts = LAYOUTS.filter(
    (l: LayoutType) => layoutOrientationFilter === 'all' || l.orientation === layoutOrientationFilter
  );

  const filteredFonts = FONT_OPTIONS.filter(
    (f) => fontCategoryFilter === 'all' || f.category === fontCategoryFilter
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          searchQuery
        )}&format=json&limit=1`
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);

        const nameParts = result.display_name.split(',');
        const newTitle = nameParts[0].trim().toUpperCase();
        const newSubtitle =
          nameParts.length > 1
            ? nameParts[nameParts.length - 1].trim().toUpperCase()
            : 'MAP POSTER';

        selectLocation(newLat, newLng, newTitle, newSubtitle);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAutoDetectLocation = () => {
    setLocating(true);

    const fallbackToIpLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data && data.latitude && data.longitude) {
          const userLat = parseFloat(data.latitude);
          const userLng = parseFloat(data.longitude);
          const city = data.city || data.region || 'CURRENT LOCATION';
          const country = data.country_name || 'POSTER MAP';

          setLocation(userLat, userLng, 12);
          setText(city.toUpperCase(), country.toUpperCase());
          return;
        }
      } catch (err) {
        console.warn('IP geolocation fallback failed:', err);
      }
      alert('Unable to detect location automatically. Please search for a city above.');
    };

    if (!navigator.geolocation) {
      fallbackToIpLocation().finally(() => setLocating(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const userLat = position.coords.latitude;
        const userLng = position.coords.longitude;
        setLocation(userLat, userLng, 13);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLng}&format=json`
          );
          const data = await res.json();
          if (data && data.address) {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county ||
              'CURRENT LOCATION';
            const country = data.address.country || 'POSTER MAP';
            setText(city.toUpperCase(), country.toUpperCase());
          }
        } catch (err) {
          console.error('Reverse geocode failed:', err);
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        console.warn('Browser geolocation failed (falling back to IP location):', error);
        fallbackToIpLocation().finally(() => setLocating(false));
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  };

  // Determine the vertical transform for tab-change slide
  const getSlideTransform = () => {
    if (!slideDirection) return 'translateY(0)';
    if (isTransitioning) {
      // Exit: current content slides out
      return slideDirection === 'up' ? 'translateY(-30px)' : 'translateY(30px)';
    }
    // Enter: new content is already in position
    return 'translateY(0)';
  };

  return (
    <div 
      className="w-full h-full backdrop-blur-xl border-y border-r px-4 py-4.5 flex flex-col shrink-0 z-20 shadow-2xl transition-colors"
      style={{ backgroundColor: `${flyoutBg}F2`, borderColor: borderColor }}
    >
      {/* Vertically sliding content wrapper */}
      <div 
        className="flex flex-col gap-4.5 flex-1 overflow-y-auto"
        style={{
          transform: getSlideTransform(),
          opacity: isTransitioning ? 0 : 1,
          transition: 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.2s ease',
        }}
      >
      {/* 1. LOCATION TAB */}
      {activeTab === 'location' && (
        <div className="flex flex-col relative">
          {/* SECTION 1: LOCATION SEARCH & EXPLORER */}
          <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                LOCATION SEARCH & EXPLORER
              </span>
              <span className="text-[11px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
                GPS / OSM
              </span>
            </div>

            {/* Location Search Input + Auto-Locate Button (Exact Same Height h-11) */}
            <div className="relative">
              <form onSubmit={handleSearch} className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2"
                    style={{ color: subtextColor }}
                  />
                  <input
                    type="text"
                    placeholder="Search city, country, or landmark..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    className="w-full h-11 border pl-10 pr-8 py-2 rounded-2xl text-xs font-sans font-medium focus:outline-none transition-colors"
                    style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                  />
                  {isSearching ? (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: brightAccent }} />
                  ) : (
                    searchQuery && (
                      <button
                        type="button"
                        onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-70 hover:opacity-100 cursor-pointer"
                        style={{ color: textColor }}
                      >
                        ✕
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={locating}
                  title="Detect Current Location"
                  className="h-11 w-11 border rounded-2xl flex items-center justify-center transition-all duration-200 disabled:opacity-50 cursor-pointer shadow-sm shrink-0 hover:scale-105 active:scale-95"
                  style={{ backgroundColor: cardBg, borderColor: borderColor, color: brightAccent }}
                >
                  <Crosshair size={18} className={locating ? 'animate-spin' : ''} />
                </button>
              </form>

              {/* Live Autocomplete Suggestions Floating Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl flex flex-col p-1.5 gap-0.5 max-h-64 overflow-y-auto"
                  style={{ backgroundColor: cardBg, borderColor: borderColor }}
                >
                  {suggestions.map((item, idx) => {
                    const nameParts = item.display_name.split(',');
                    const cityName = nameParts[0].trim();
                    const countryName = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim() : '';

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => selectLocation(parseFloat(item.lat), parseFloat(item.lon), cityName, countryName)}
                        className="w-full px-3.5 py-2.5 rounded-xl text-left flex items-center justify-between transition-colors hover:bg-black/10 group cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <MapPin size={16} style={{ color: brightAccent }} className="shrink-0" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-extrabold font-sans tracking-tight truncate" style={{ color: textColor }}>
                              {cityName}
                            </span>
                            <span className="text-[11px] font-sans truncate opacity-85" style={{ color: subtextColor }}>
                              {item.display_name}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border shrink-0" style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: subtextColor }}>
                          {item.type || 'place'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: COORDINATES */}
          <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-center gap-1.5">
              <Compass size={15} className="shrink-0" style={{ color: brightAccent }} />
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                COORDINATES
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* SINGLE UNIFIED BAR LATITUDE STEPPER */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                  LATITUDE (ºN)
                </label>
                <div 
                  className="h-10 rounded-xl border flex items-center overflow-hidden relative transition-all"
                  style={{ backgroundColor: cardBg, borderColor: borderColor }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const nextLat = manualLat - 0.005;
                      setManualLat(nextLat);
                      setLocation(nextLat, manualLng, zoom);
                    }}
                    title="Decrease Latitude"
                    className="w-9 h-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 active:scale-95 shrink-0"
                    style={{ color: textColor }}
                  >
                    <Minus size={14} className="stroke-[2.5]" />
                  </button>

                  <input
                    type="number"
                    step="0.0001"
                    value={Number(manualLat.toFixed(4))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setManualLat(val);
                    }}
                    className="flex-1 h-full bg-transparent text-[13px] font-mono font-black text-center focus:outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ color: textColor }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const nextLat = manualLat + 0.005;
                      setManualLat(nextLat);
                      setLocation(nextLat, manualLng, zoom);
                    }}
                    title="Increase Latitude"
                    className="w-9 h-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 active:scale-95 shrink-0"
                    style={{ color: textColor }}
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* SINGLE UNIFIED BAR LONGITUDE STEPPER */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                  LONGITUDE (ºE)
                </label>
                <div 
                  className="h-10 rounded-xl border flex items-center overflow-hidden relative transition-all"
                  style={{ backgroundColor: cardBg, borderColor: borderColor }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      const nextLng = manualLng - 0.005;
                      setManualLng(nextLng);
                      setLocation(manualLat, nextLng, zoom);
                    }}
                    title="Decrease Longitude"
                    className="w-9 h-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 active:scale-95 shrink-0"
                    style={{ color: textColor }}
                  >
                    <Minus size={14} className="stroke-[2.5]" />
                  </button>

                  <input
                    type="number"
                    step="0.0001"
                    value={Number(manualLng.toFixed(4))}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setManualLng(val);
                    }}
                    className="flex-1 h-full bg-transparent text-[13px] font-mono font-black text-center focus:outline-none min-w-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    style={{ color: textColor }}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      const nextLng = manualLng + 0.005;
                      setManualLng(nextLng);
                      setLocation(manualLat, nextLng, zoom);
                    }}
                    title="Increase Longitude"
                    className="w-9 h-full flex items-center justify-center transition-colors cursor-pointer hover:bg-black/10 active:scale-95 shrink-0"
                    style={{ color: textColor }}
                  >
                    <Plus size={14} className="stroke-[2.5]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Apply Coordinates Button */}
            <button
              type="button"
              onClick={() => setLocation(manualLat, manualLng, zoom)}
              className="w-full h-11 px-3 rounded-2xl text-xs font-sans font-extrabold uppercase tracking-wider border shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99]"
              style={{
                backgroundColor: accentColor,
                color: uiColors.activeItemText,
                borderColor: accentColor,
                boxShadow: `0 4px 14px ${accentColor}35`,
              }}
            >
              <Navigation size={15} />
              <span>Update Map Location</span>
            </button>
          </div>

          {/* SECTION 3: RECENT SEARCHES HISTORY */}
          {recentLocations.length > 0 && (
            <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                  RECENT POSTER SEARCHES
                </span>
                <button
                  type="button"
                  onClick={() => { setRecentLocations([]); localStorage.removeItem('terraink_recent_locations'); }}
                  className="text-xs font-sans font-bold hover:underline cursor-pointer"
                  style={{ color: dangerText }}
                >
                  Clear History
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {recentLocations.map((item, idx) => (
                  <div key={idx} className="relative group w-full">
                    <button
                      type="button"
                      onClick={() => selectLocation(item.lat, item.lng, item.title, item.subtitle)}
                      className="w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 hover:scale-[1.005] group cursor-pointer"
                      style={{ backgroundColor: cardBg, borderColor: borderColor }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border" style={{ backgroundColor: flyoutBg, color: brightAccent, borderColor: `${brightAccent}40` }}>
                          <MapPin size={15} />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-xs font-extrabold font-sans uppercase tracking-tight truncate" style={{ color: textColor }}>
                            {item.title}
                          </span>
                          <span className="text-[11px] font-sans opacity-90 truncate" style={{ color: subtextColor }}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Coordinates (Hidden by default, reveals on hover) */}
                        <span className="text-xs font-mono font-bold opacity-0 group-hover:opacity-85 transition-opacity duration-200" style={{ color: subtextColor }}>
                          {item.lat.toFixed(2)}°, {item.lng.toFixed(2)}°
                        </span>

                        {/* Permanently Visible Item Remove Button */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            removeRecentLocation(idx);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              removeRecentLocation(idx);
                            }
                          }}
                          title="Remove from history"
                          className="w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-500"
                          style={{ color: subtextColor }}
                        >
                          <X size={14} />
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 4: FEATURED ICONIC POSTER DESTINATIONS */}
          <div className="flex flex-col gap-3">
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              POPULAR DESTINATIONS
            </span>

            <div className="grid grid-cols-3 gap-2.5">
              {FEATURED_DESTINATIONS.map((dest) => {
                const isCurrentCity = title.trim().toUpperCase() === dest.city.toUpperCase();
                return (
                  <button
                    key={dest.city}
                    type="button"
                    onClick={() => selectLocation(dest.lat, dest.lng, dest.city, dest.country)}
                    className={`p-3 h-[98px] rounded-2xl border flex flex-col justify-between transition-all duration-200 cursor-pointer relative overflow-hidden group hover:scale-[1.03] shadow-sm text-left ${
                      isCurrentCity ? 'scale-[1.02]' : ''
                    }`}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: isCurrentCity ? brightAccent : borderColor,
                      boxShadow: isCurrentCity ? `0 0 0 1px ${brightAccent}40, 0 4px 12px ${brightAccent}20` : undefined,
                    }}
                  >
                    {/* Top Row: Icon Badge */}
                    <div className="flex items-center justify-between w-full">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 border shrink-0 shadow-2xs"
                        style={{
                          backgroundColor: flyoutBg,
                          color: brightAccent,
                          borderColor: isCurrentCity ? brightAccent : `${brightAccent}40`
                        }}
                      >
                        {dest.icon}
                      </div>
                    </div>

                    {/* Bottom Row: City Name & Country */}
                    <div className="flex flex-col min-w-0 w-full pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-sans font-black tracking-tight uppercase truncate" style={{ color: textColor }} title={dest.city}>
                          {dest.city}
                        </span>
                        {isCurrentCity && (
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: brightAccent }} />
                        )}
                      </div>
                      <span className="text-[11px] font-sans truncate opacity-80 leading-tight" style={{ color: subtextColor }} title={dest.country}>
                        {dest.country}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. THEME TAB */}
      {activeTab === 'theme' && (
        <ThemeSelector />
      )}

      {/* 3. LAYOUT TAB (Matching reference 2-column grid aesthetic) */}
      {activeTab === 'layout' && (
        <div className="flex flex-col gap-0">
          {/* Top Header Bar with Custom Layout Toggle Button (Identical to Theme Tab) */}
          <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              POSTER LAYOUTS ({LAYOUTS.length})
            </span>
            <button
              type="button"
              onClick={() => setShowCustomLayoutEditor(!showCustomLayoutEditor)}
              className="w-[96px] h-[32px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-sans font-bold border transition-all duration-200 cursor-pointer shadow-sm shrink-0 hover:scale-105 active:scale-95"
              style={
                showCustomLayoutEditor
                  ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                  : { backgroundColor: cardBg, borderColor: borderColor, color: textColor }
              }
            >
              <Layout size={14} className="shrink-0" />
              <span className="truncate">{showCustomLayoutEditor ? 'Close' : 'Custom'}</span>
            </button>
          </div>

          {/* Main Flow Container */}
          <div className="flex flex-col px-0.5 pt-3 pb-4">
            {/* 120 FPS GPU Hardware-Accelerated Accordion Custom Layout Editor */}
            <div 
              className="shrink-0 transform-gpu grid transition-all"
              style={{
                gridTemplateRows: showCustomLayoutEditor ? '1fr' : '0fr',
                opacity: showCustomLayoutEditor ? 1 : 0,
                transition: 'grid-template-rows 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="overflow-hidden">
                <div className="pb-3 mb-3 border-b flex flex-col gap-3" style={{ borderColor: borderColor }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                      CUSTOM CANVAS RESOLUTION
                    </span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: borderColor }}>
                      {((customWidth || 1) / (customHeight || 1)).toFixed(2)}:1 Ratio
                    </span>
                  </div>

                  {/* Quick Aspect Ratio Presets */}
                  <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                    {[
                      { label: '16:9', w: 1920, h: 1080 },
                      { label: '4:3', w: 1600, h: 1200 },
                      { label: '1:1', w: 1200, h: 1200 },
                      { label: '9:16', w: 1080, h: 1920 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => { setCustomWidth(preset.w); setCustomHeight(preset.h); }}
                        className="py-1.5 px-2 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer text-center hover:scale-105"
                        style={{
                          backgroundColor: customWidth === preset.w && customHeight === preset.h ? brightAccent : cardBg,
                          color: customWidth === preset.w && customHeight === preset.h ? '#ffffff' : subtextColor,
                          borderColor: customWidth === preset.w && customHeight === preset.h ? brightAccent : borderColor,
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                        WIDTH (PX)
                      </label>
                      <input
                        type="number"
                        min="400"
                        max="8000"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(parseInt(e.target.value) || 0)}
                        className="w-full border px-3 py-2 rounded-xl text-xs font-mono font-bold focus:outline-none transition-colors"
                        style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                        HEIGHT (PX)
                      </label>
                      <input
                        type="number"
                        min="400"
                        max="8000"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(parseInt(e.target.value) || 0)}
                        className="w-full border px-3 py-2 rounded-xl text-xs font-mono font-bold focus:outline-none transition-colors"
                        style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                      />
                    </div>
                  </div>

                  {/* Live Aspect Preview Shape */}
                  <div className="w-full h-10 rounded-xl border flex items-center justify-center p-2" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                    <div
                      className="rounded transition-all border border-dashed"
                      style={{
                        width: `${Math.min(100, (customWidth / Math.max(customWidth, customHeight)) * 100)}%`,
                        height: `${Math.min(100, (customHeight / Math.max(customWidth, customHeight)) * 100)}%`,
                        borderColor: brightAccent,
                        backgroundColor: `${brightAccent}25`,
                      }}
                    />
                  </div>

                  {/* Apply Button */}
                  <button
                    type="button"
                    onClick={() => {
                      const validW = Math.max(400, Math.min(8000, customWidth || 1920));
                      const validH = Math.max(400, Math.min(8000, customHeight || 1080));
                      const orientation: LayoutOrientation = validW > validH ? 'landscape' : validW < validH ? 'portrait' : 'square';
                      
                      setLayout({
                        id: `custom-${validW}x${validH}`,
                        name: `Custom ${validW}×${validH}`,
                        category: 'desktop',
                        orientation,
                        aspectRatio: `${validW}:${validH}`,
                        widthPx: validW,
                        heightPx: validH,
                        width: `${validW} PX`,
                        height: `${validH} PX`,
                        description: `${validW} × ${validH} px custom resolution canvas`,
                        badge: 'Custom',
                      });
                      setShowCustomLayoutEditor(false);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl text-xs font-sans font-extrabold uppercase tracking-wider border shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                    style={{
                      backgroundColor: brightAccent,
                      color: '#ffffff',
                      borderColor: brightAccent,
                      boxShadow: `0 4px 14px ${brightAccent}35`,
                    }}
                  >
                    Apply Custom Size
                  </button>
                </div>
              </div>
            </div>

            {/* Orientation Filter Toggler Bar */}
            <div className="flex flex-col gap-2 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
              <div className="text-[11px] font-mono tracking-wider uppercase font-black" style={{ color: headingColor }}>
                ORIENTATIONS & FORMATS
              </div>
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                {[
                  { id: 'all', label: 'ALL' },
                  { id: 'landscape', label: 'LANDSCAPE' },
                  { id: 'portrait', label: 'PORTRAIT' },
                  { id: 'square', label: 'SQUARE' },
                ].map((tab) => {
                  const isFilterActive = layoutOrientationFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setLayoutOrientationFilter(tab.id as any)}
                      className="py-1.5 text-[10px] font-mono font-extrabold rounded-lg transition-all cursor-pointer border"
                      style={
                        isFilterActive
                          ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                          : { backgroundColor: 'transparent', borderColor: 'transparent', color: subtextColor }
                      }
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

          {/* Grouped 2-Column Grid Layout Sections */}
          {[
            { category: 'print', title: 'PRINT' },
            { category: 'social', title: 'SOCIAL MEDIA' },
            { category: 'wallpaper', title: 'WALLPAPER' },
            { category: 'web', title: 'WEB' },
          ].map((sec) => {
            const secLayouts = filteredLayouts.filter((l) => l.category === sec.category);
            if (secLayouts.length === 0) return null;

            return (
              <div key={sec.category} className="flex flex-col gap-2.5 pt-2">
                <div className="text-[11px] font-mono font-extrabold tracking-widest uppercase" style={{ color: headingColor }}>
                  {sec.title}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  {secLayouts.map((layout) => {
                    const isSelected = activeLayout.id === layout.id;

                    const ratio = layout.widthPx / layout.heightPx;
                    const isLand = ratio > 1.1;
                    const isPort = ratio < 0.9;
                    const innerW = isLand ? '82%' : isPort ? `${Math.max(28, Math.min(65, ratio * 75))}%` : '60%';
                    const innerH = isLand ? `${Math.max(24, Math.min(65, (1 / ratio) * 70))}%` : isPort ? '82%' : '60%';

                    return (
                      <button
                        key={layout.id}
                        onClick={() => setLayout(layout)}
                        className={`p-3 rounded-2xl border text-left flex flex-col justify-between gap-2.5 transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected ? 'shadow-lg ring-1' : 'hover:border-neutral-500'
                        }`}
                        style={{
                          backgroundColor: cardBg,
                          borderColor: isSelected ? brightAccent : borderColor,
                          color: textColor,
                          boxShadow: isSelected ? `0 0 16px ${brightAccent}40` : undefined,
                        }}
                      >
                        {/* Header Name & Dimensions */}
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider line-clamp-1" style={{ color: textColor }}>
                            {layout.name}
                          </span>
                          <span className="text-[9.5px] font-mono font-bold truncate opacity-85" style={{ color: subtextColor }}>
                            {layout.width}
                          </span>
                        </div>

                        {/* Aspect Ratio Preview Shape Box */}
                        <div 
                          className="w-full h-16 rounded-xl border flex items-center justify-center p-1.5 shrink-0 transition-colors"
                          style={{ backgroundColor: flyoutBg, borderColor: isSelected ? `${brightAccent}50` : borderColor }}
                        >
                          <div 
                            className="rounded-sm transition-all duration-200"
                            style={{
                              width: innerW,
                              height: innerH,
                              backgroundColor: isSelected ? brightAccent : (uiColors.isLight ? '#64748b' : `${brightAccent}70`),
                              opacity: isSelected ? 1 : 0.8,
                              boxShadow: isSelected ? `0 0 10px ${brightAccent}60` : undefined,
                            }}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* 4. STYLE TAB */}
      {activeTab === 'style' && (
        <div className="flex flex-col gap-0">
          {/* Main Flow Container */}
          <div className="flex flex-col px-0.5 pb-4">
            {/* SECTION 1: POSTER TEXT DETAILS */}
            <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                POSTER TEXT DETAILS
              </span>

              <div className="flex flex-col gap-2.5">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                    CITY TITLE
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setText(e.target.value.toUpperCase(), subtitle)}
                    className="w-full h-10 border px-3 rounded-xl text-xs font-sans font-bold focus:outline-none transition-colors"
                    style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                    COUNTRY SUBTITLE
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setText(title, e.target.value.toUpperCase())}
                    className="w-full h-10 border px-3 rounded-xl text-xs font-sans font-bold focus:outline-none transition-colors"
                    style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                  />
                </div>
              </div>
            </div>

            {/* SECTION 2: FONT FAMILY & TYPOGRAPHY */}
            <div className="flex flex-col gap-2.5 pb-3 mb-3 border-b relative" ref={fontDropdownRef} style={{ borderColor: borderColor }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                  FONT FAMILY
                </span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                  {selectedFontOption.category}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setIsFontDropdownOpen(!isFontDropdownOpen)}
                className="w-full border text-xs rounded-xl p-3 flex items-center justify-between focus:outline-none transition-all shadow-sm cursor-pointer hover:border-neutral-400"
                style={{ 
                  backgroundColor: cardBg, 
                  borderColor: isFontDropdownOpen ? brightAccent : borderColor,
                  color: textColor 
                }}
              >
                <div className="flex flex-col text-left truncate pr-2">
                  <span 
                    className="font-bold text-sm tracking-wide truncate"
                    style={{ fontFamily: selectedFontOption.value, color: textColor }}
                  >
                    {selectedFontOption.label}
                  </span>
                  <span className="text-[11px] font-sans truncate opacity-85" style={{ color: subtextColor }}>
                    {selectedFontOption.description}
                  </span>
                </div>
                <ChevronDown 
                  size={16} 
                  className={`shrink-0 transition-transform duration-200 ${isFontDropdownOpen ? 'rotate-180' : ''}`}
                  style={{ color: subtextColor }}
                />
              </button>

              {isFontDropdownOpen && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 rounded-2xl border shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-2xl flex flex-col"
                  style={{ 
                    backgroundColor: cardBg, 
                    borderColor: borderColor,
                    maxHeight: '340px'
                  }}
                >
                  {/* Font Category Filter Tabs inside dropdown */}
                  <div className="p-2 border-b flex gap-1 shrink-0 bg-black/20" style={{ borderColor: borderColor }}>
                    {[
                      { id: 'all', label: 'ALL' },
                      { id: 'sans-serif', label: 'SANS' },
                      { id: 'serif', label: 'SERIF' },
                      { id: 'display', label: 'DISPLAY' },
                      { id: 'monospace', label: 'MONO' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFontCategoryFilter(cat.id as any)}
                        className="flex-1 py-1 text-[9px] font-mono font-extrabold rounded-md transition-all cursor-pointer border"
                        style={
                          fontCategoryFilter === cat.id
                            ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                            : { backgroundColor: 'transparent', borderColor: 'transparent', color: subtextColor }
                        }
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Font Options List */}
                  <div className="p-1.5 flex flex-col gap-1 overflow-y-auto max-h-[280px]">
                    {filteredFonts.map((font) => {
                      const isSelected = font.value === fontFamily || font.id === selectedFontOption.id;
                      return (
                        <button
                          key={font.id}
                          type="button"
                          onClick={() => {
                            setFontFamily(font.value);
                            setIsFontDropdownOpen(false);
                          }}
                          className={`w-full flex flex-col items-start px-3.5 py-2.5 rounded-xl transition-all cursor-pointer text-left ${
                            isSelected ? 'font-semibold shadow-md' : 'hover:bg-black/10'
                          }`}
                          style={
                            isSelected
                              ? { backgroundColor: brightAccent, color: '#ffffff' }
                              : { color: textColor }
                          }
                        >
                          <div className="w-full flex items-center justify-between">
                            <span 
                              className="text-sm font-bold truncate"
                              style={{ fontFamily: font.value, letterSpacing: font.titleTracking }}
                            >
                              {font.label}
                            </span>
                            <span 
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold border"
                              style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: subtextColor }}
                            >
                              {font.category}
                            </span>
                          </div>
                          <span 
                            className="text-[11px] font-sans mt-0.5 leading-tight truncate w-full opacity-85"
                          >
                            {font.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3: LETTER SPACING MULTIPLIER */}
            <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-sans font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: headingColor }}>
                  LETTER SPACING
                </span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                  {letterSpacingMultiplier.toFixed(1)}x
                </span>
              </div>

              {/* Slider */}
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={letterSpacingMultiplier}
                onChange={(e) => setLetterSpacingMultiplier(parseFloat(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ backgroundColor: flyoutBg, accentColor: brightAccent }}
              />

              {/* Quick Preset Buttons */}
              <div className="grid grid-cols-4 gap-1.5 pt-0.5">
                {[
                  { val: 0.8, label: '0.8x' },
                  { val: 1.0, label: '1.0x' },
                  { val: 1.2, label: '1.2x' },
                  { val: 1.5, label: '1.5x' },
                ].map((preset) => (
                  <button
                    key={preset.val}
                    type="button"
                    onClick={() => setLetterSpacingMultiplier(preset.val)}
                    className="py-1.5 text-xs font-mono font-black rounded-xl transition-all cursor-pointer border hover:scale-105"
                    style={
                      letterSpacingMultiplier === preset.val
                        ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                        : { backgroundColor: cardBg, borderColor: borderColor, color: subtextColor }
                    }
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SECTION 4: POSTER OVERLAYS & FRAMES */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                POSTER OVERLAYS
              </span>

              {[
                {
                  key: 'text',
                  label: 'Show Bottom Text Overlay',
                  description: 'Title, subtitle, coordinates & watermarks frame',
                  value: showTextOverlay,
                  toggle: toggleTextOverlay
                },
                {
                  key: 'gradient',
                  label: 'Show Gradient Overlay',
                  description: 'Smooth fade effect at top & bottom map margins',
                  value: showGradientOverlay,
                  toggle: toggleGradientOverlay
                },
              ].map((item) => (
                <div
                  key={item.key}
                  onClick={item.toggle}
                  className="flex items-center justify-between p-3.5 rounded-2xl border text-xs cursor-pointer transition-all hover:border-neutral-400 group shadow-sm"
                  style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold font-sans text-xs tracking-wide" style={{ color: textColor }}>{item.label}</span>
                    <span className="text-[11px] font-sans opacity-85" style={{ color: subtextColor }}>{item.description}</span>
                  </div>

                  {/* Ultra-Premium Custom Checkbox */}
                  <div 
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0 ${
                      item.value ? 'shadow-sm scale-105' : 'group-hover:border-neutral-400'
                    }`}
                    style={{
                      backgroundColor: item.value ? brightAccent : flyoutBg,
                      borderColor: item.value ? brightAccent : borderColor
                    }}
                  >
                    <Check 
                      size={13} 
                      className={`transition-transform duration-200 ${item.value ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                      style={{ color: '#ffffff' }} 
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. LAYERS TAB */}
      {activeTab === 'layers' && (
        <div className="flex flex-col gap-0">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              MAP LAYERS ({Object.keys(layerVisibility).length})
            </span>
            <button
              type="button"
              onClick={() => {
                const allOn = Object.values(layerVisibility).every(Boolean);
                const targetVal = !allOn;
                Object.keys(layerVisibility).forEach((k) => {
                  if (layerVisibility[k as keyof typeof layerVisibility] !== targetVal) {
                    toggleLayerVisibility(k as keyof typeof layerVisibility);
                  }
                });
              }}
              className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer hover:scale-105"
              style={{ backgroundColor: cardBg, borderColor: borderColor, color: brightAccent }}
            >
              {Object.values(layerVisibility).every(Boolean) ? 'Hide All' : 'Show All'}
            </button>
          </div>

          {/* Main Flow Container */}
          <div className="flex flex-col px-0.5 pt-3 pb-4 gap-2.5">
            {[
              { key: 'landcover', label: 'Landcover & Vegetation', subtitle: 'Forests, fields & natural terrain', icon: <Trees size={18} /> },
              { key: 'water', label: 'Lakes, Rivers & Oceans', subtitle: 'Hydrography vector water layers', icon: <Droplet size={18} /> },
              { key: 'parks', label: 'Parks & Urban Greenery', subtitle: 'City parks, gardens & reserves', icon: <Landmark size={18} /> },
              { key: 'buildings', label: 'Buildings & 3D Structures', subtitle: 'Building footprints & structural shapes', icon: <Building2 size={18} /> },
              { key: 'roads', label: 'Roads & Highways', subtitle: 'Major freeways, avenues & paths', icon: <Car size={18} /> },
              { key: 'rail', label: 'Railway Tracks & Transit', subtitle: 'Train tracks & metro transit corridors', icon: <Train size={18} /> },
              { key: 'aeroway', label: 'Airports & Runways', subtitle: 'Flight runways, helipads & taxiways', icon: <Plane size={18} /> },
            ].map((item) => {
              const isChecked = layerVisibility[item.key as keyof typeof layerVisibility];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleLayerVisibility(item.key as keyof typeof layerVisibility)}
                  className="flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 hover:border-neutral-400 group shadow-sm"
                  style={{ backgroundColor: cardBg, borderColor: borderColor }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div 
                      className="w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 transition-all group-hover:scale-105"
                      style={{
                        backgroundColor: isChecked ? `${brightAccent}1F` : flyoutBg,
                        color: isChecked ? brightAccent : subtextColor,
                        borderColor: isChecked ? `${brightAccent}40` : borderColor
                      }}
                    >
                      {item.icon}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold font-sans text-xs tracking-wide truncate" style={{ color: textColor }}>
                        {item.label}
                      </span>
                      <span className="text-[11px] font-sans truncate opacity-85 leading-tight" style={{ color: subtextColor }}>
                        {item.subtitle}
                      </span>
                    </div>
                  </div>

                  {/* Ultra-Premium Custom Checkbox */}
                  <div 
                    className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all duration-200 shrink-0 ${
                      isChecked ? 'shadow-sm scale-105' : 'group-hover:border-neutral-400'
                    }`}
                    style={{
                      backgroundColor: isChecked ? brightAccent : flyoutBg,
                      borderColor: isChecked ? brightAccent : borderColor
                    }}
                  >
                    <Check 
                      size={13} 
                      className={`transition-transform duration-200 ${isChecked ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}
                      style={{ color: '#ffffff' }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. MARKERS TAB */}
      {activeTab === 'markers' && (
        <div className="flex flex-col gap-0">
          {/* Top Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              MAP MARKERS ({markers.length})
            </span>
            {markers.length > 0 && (
              <button
                type="button"
                onClick={clearMarkers}
                className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition-all cursor-pointer hover:scale-105"
                style={{ backgroundColor: cardBg, borderColor: borderColor, color: dangerText }}
              >
                Clear All
              </button>
            )}
          </div>

          {/* Main Flow Container */}
          <div className="flex flex-col px-0.5 pt-3 pb-4 gap-4">
            {/* Instruction banner */}
            <div className="p-3 rounded-xl border flex items-center gap-2.5" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${brightAccent}1F`, color: brightAccent }}>
                <MapPin size={15} />
              </div>
              <span className="text-[11px] font-sans opacity-90 leading-tight" style={{ color: subtextColor }}>
                Click anywhere on the map canvas to drop a location pin with your active style.
              </span>
            </div>

            {/* SECTION 1: PREDEFINED MARKER ICONS & STYLES */}
            <div className="flex flex-col gap-2.5 pb-3 mb-1 border-b" style={{ borderColor: borderColor }}>
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                MARKER ICON STYLE
              </span>

              <div className="grid grid-cols-5 gap-2">
                {[
                  { name: 'MapPin', icon: <MapPin size={18} />, label: 'Pin' },
                  { name: 'Star', icon: <Star size={18} />, label: 'Star' },
                  { name: 'Heart', icon: <Heart size={18} />, label: 'Heart' },
                  { name: 'Flag', icon: <Flag size={18} />, label: 'Flag' },
                  { name: 'Target', icon: <Target size={18} />, label: 'Target' },
                  { name: 'Crosshair', icon: <Crosshair size={18} />, label: 'Scope' },
                  { name: 'Home', icon: <Home size={18} />, label: 'House' },
                  { name: 'Landmark', icon: <Landmark size={18} />, label: 'Icon' },
                  { name: 'Compass', icon: <Compass size={18} />, label: 'Nav' },
                  { name: 'Sparkles', icon: <Sparkles size={18} />, label: 'Glow' },
                ].map((item) => {
                  const isActive = activeMarkerSettings.iconName === item.name && activeMarkerSettings.type !== 'dot';
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setActiveMarkerSettings({ type: 'icon', iconName: item.name })}
                      className="p-2 h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:scale-105"
                      style={
                        isActive
                          ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent, boxShadow: `0 0 12px ${brightAccent}40` }
                          : { backgroundColor: cardBg, borderColor: borderColor, color: textColor }
                      }
                    >
                      {item.icon}
                      <span className="text-[9px] font-mono font-bold truncate opacity-90">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: MARKER COLOR & SIZE */}
            <div className="flex flex-col gap-3 pb-3 mb-1 border-b" style={{ borderColor: borderColor }}>
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                COLOR & SIZE
              </span>

              {/* Color Swatches */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                  MARKER COLOR
                </label>
                <div className="flex items-center gap-2">
                  {[
                    '#ef4444',
                    '#f59e0b',
                    '#10b981',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                    '#18181b',
                    '#ffffff'
                  ].map((hex) => {
                    const isSelected = activeMarkerSettings.color.toLowerCase() === hex.toLowerCase();
                    return (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setActiveMarkerSettings({ color: hex })}
                        className={`w-7 h-7 rounded-full border transition-all cursor-pointer hover:scale-110 shrink-0 ${
                          isSelected ? 'ring-2 ring-offset-2 scale-110' : ''
                        }`}
                        style={{
                          backgroundColor: hex,
                          borderColor: borderColor,
                          outlineColor: brightAccent
                        }}
                      />
                    );
                  })}
                  
                  {/* Native Color Picker Input */}
                  <input
                    type="color"
                    value={activeMarkerSettings.color}
                    onChange={(e) => setActiveMarkerSettings({ color: e.target.value })}
                    className="w-7 h-7 rounded-full border cursor-pointer p-0 bg-transparent shrink-0 overflow-hidden"
                    style={{ borderColor: borderColor }}
                    title="Custom color picker"
                  />
                </div>
              </div>

              {/* Size Steppers & Range Slider */}
              <div className="flex flex-col gap-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                    MARKER SIZE
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => autoScaleToViewport(window.innerWidth, window.innerHeight)}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                      style={{ backgroundColor: cardBg, borderColor: borderColor, color: brightAccent }}
                      title="Automatically calculate ideal marker size for your screen"
                    >
                      ⚡ Auto-Fit
                    </button>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                      {activeMarkerSettings.size}px
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1">
                  {[
                    { label: 'SM (32)', size: 32 },
                    { label: 'MD (64)', size: 64 },
                    { label: 'LG (96)', size: 96 },
                    { label: 'XL (144)', size: 144 },
                    { label: '2XL (200)', size: 200 },
                    { label: '3XL (256)', size: 256 },
                  ].map((s) => {
                    const isSelected = activeMarkerSettings.size === s.size;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setActiveMarkerSettings({ size: s.size })}
                        className="py-1 text-[8.5px] font-mono font-bold rounded-xl transition-all cursor-pointer border hover:scale-105"
                        style={
                          isSelected
                            ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                            : { backgroundColor: cardBg, borderColor: borderColor, color: subtextColor }
                        }
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Continuous Range Slider */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono font-bold shrink-0 opacity-70" style={{ color: subtextColor }}>16px</span>
                  <input
                    type="range"
                    min="16"
                    max="256"
                    step="4"
                    value={activeMarkerSettings.size}
                    onChange={(e) => setActiveMarkerSettings({ size: Number(e.target.value) })}
                    className="w-full cursor-pointer h-1.5 rounded-lg accent-[var(--bright-accent)]"
                    style={{ accentColor: brightAccent }}
                  />
                  <span className="text-[10px] font-mono font-bold shrink-0 opacity-70" style={{ color: subtextColor }}>256px</span>
                </div>
              </div>

              {/* Optional Label Field */}
              <div className="flex flex-col gap-1 pt-1">
                <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                  DEFAULT PIN LABEL (OPTIONAL)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Favorite Spot, Meeting Place"
                  value={activeMarkerSettings.label || ''}
                  onChange={(e) => setActiveMarkerSettings({ label: e.target.value })}
                  className="w-full h-10 border px-3 rounded-xl text-xs font-sans font-bold focus:outline-none transition-colors"
                  style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
                />
              </div>
            </div>

            {/* SECTION 3: CUSTOM MARKER UPLOADER */}
            <div className="flex flex-col gap-2.5 pb-3 mb-1 border-b" style={{ borderColor: borderColor }}>
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                CUSTOM MARKER UPLOAD
              </span>

              <label
                className="w-full h-12 rounded-xl border border-dashed flex items-center justify-center gap-2 cursor-pointer transition-all hover:border-neutral-400 group"
                style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
              >
                <Upload size={16} className="group-hover:scale-110 transition-transform" style={{ color: brightAccent }} />
                <span className="text-xs font-sans font-bold">Upload Custom PNG / SVG Icon</span>
                <input
                  type="file"
                  accept="image/png,image/svg+xml,image/jpeg"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const url = ev.target?.result as string;
                      if (url) {
                        const newItem = addCustomMarker(file.name, url);
                        setActiveMarkerSettings({ type: 'custom', customMarkerId: newItem.id });
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </label>

              {/* Saved Custom Markers Grid */}
              {customMarkers.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <label className="text-[10px] font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                    SAVED CUSTOM MARKERS
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {customMarkers.map((cm) => {
                      const isSelected = activeMarkerSettings.type === 'custom' && activeMarkerSettings.customMarkerId === cm.id;
                      return (
                        <div key={cm.id} className="relative group/cm">
                          <button
                            type="button"
                            onClick={() => setActiveMarkerSettings({ type: 'custom', customMarkerId: cm.id })}
                            className="w-full h-14 rounded-xl border flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 overflow-hidden"
                            style={
                              isSelected
                                ? { backgroundColor: brightAccent, borderColor: brightAccent }
                                : { backgroundColor: cardBg, borderColor: borderColor }
                            }
                          >
                            <img src={cm.url} alt={cm.name} className="w-7 h-7 object-contain" />
                          </button>
                          <button
                            type="button"
                            onClick={() => removeCustomMarker(cm.id)}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover/cm:opacity-100 transition-opacity shadow-sm"
                            title="Remove custom marker"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: MARKERS USED LIST */}
            <div className="flex flex-col gap-2.5">
              <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                MARKERS USED ({markers.length})
              </span>

              {markers.length === 0 ? (
                <div className="p-4 rounded-2xl border text-center flex flex-col items-center justify-center gap-1 opacity-75" style={{ backgroundColor: cardBg, borderColor: borderColor }}>
                  <MapPin size={24} style={{ color: subtextColor }} />
                  <span className="text-xs font-sans font-bold" style={{ color: textColor }}>No Markers Placed Yet</span>
                  <span className="text-[11px] font-sans" style={{ color: subtextColor }}>Click anywhere on the map poster canvas to drop pins</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {markers.map((m, idx) => (
                    <div
                      key={m.id}
                      className="p-3 rounded-2xl border flex items-center justify-between transition-all group hover:border-neutral-400 gap-2"
                      style={{ backgroundColor: cardBg, borderColor: borderColor }}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Marker Swatch / Icon Preview */}
                        <div 
                          className="w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-2xs"
                          style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: m.color || '#ef4444' }}
                        >
                          {m.type === 'custom' && m.customImageUrl ? (
                            <img src={m.customImageUrl} alt="" className="w-5 h-5 object-contain" />
                          ) : (
                            <MapPin size={16} className="fill-current" />
                          )}
                        </div>

                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-sans font-bold truncate" style={{ color: textColor }}>
                            {m.label || `Marker #${idx + 1}`}
                          </span>
                          <span className="text-[10px] font-mono font-medium opacity-85 truncate" style={{ color: subtextColor }}>
                            {m.lat.toFixed(3)}°N, {m.lng.toFixed(3)}°E
                          </span>
                        </div>
                      </div>

                      {/* Per-Marker Size Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateMarker(m.id, { size: Math.max(16, (m.size || 48) - 8) })}
                          className="w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                          style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: textColor }}
                          title="Decrease size (-8px)"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="text-[10px] font-mono font-bold w-8 text-center shrink-0" style={{ color: brightAccent }}>
                          {m.size || 48}p
                        </span>
                        <button
                          type="button"
                          onClick={() => updateMarker(m.id, { size: Math.min(256, (m.size || 48) + 8) })}
                          className="w-6 h-6 rounded-lg border flex items-center justify-center transition-all cursor-pointer hover:scale-105"
                          style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: textColor }}
                          title="Increase size (+8px)"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMarker(m.id)}
                          className="w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer opacity-70 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-500 ml-1 shrink-0"
                          style={{ color: subtextColor }}
                          title="Remove marker"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 7. ROUTES TAB */}
      {activeTab === 'routes' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: borderColor }}>
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              ROUTES & GPX TRACKS
            </span>
            <span className="text-[10px] font-mono font-semibold uppercase opacity-70" style={{ color: subtextColor }}>
              CUSTOM PATH BUILDER
            </span>
          </div>

          {/* Active Route Overview Card */}
          <div 
            className="p-4 rounded-2xl border flex flex-col gap-3 transition-all shadow-sm"
            style={{ backgroundColor: cardBg, borderColor: borderColor }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div 
                  className="p-2 rounded-xl border flex items-center justify-center shrink-0 shadow-sm"
                  style={{ backgroundColor: `${route.color || accentColor}20`, borderColor: `${route.color || accentColor}50`, color: brightAccent }}
                >
                  <Navigation size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold font-sans uppercase tracking-wider line-clamp-1" style={{ color: textColor }}>
                    {route.name || (route.geojson ? 'Active Custom Route' : 'No Active Route')}
                  </span>
                  <span className="text-[11px] font-sans opacity-90" style={{ color: subtextColor }}>
                    {route.distanceKm ? `${route.distanceKm} KM total distance` : 'Draw or upload GPX track'}
                  </span>
                </div>
              </div>

              {route.geojson && (
                <button
                  type="button"
                  onClick={clearRoute}
                  className="text-xs font-sans font-bold hover:underline cursor-pointer"
                  style={{ color: dangerText }}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Road-Snapped Route Builder */}
          <div 
            className="p-4 rounded-2xl border flex flex-col gap-3.5 transition-all shadow-sm"
            style={{ backgroundColor: cardBg, borderColor: borderColor }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                ROAD-SNAPPED BUILDER
              </span>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-sm" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}60` }}>
                {routeWaypoints.length} {routeWaypoints.length === 1 ? 'Point' : 'Points'}
              </span>
            </div>

            {/* Start / Stop Interactive Drawing Button */}
            <button
              type="button"
              onClick={() => setIsDrawingRoute(!isDrawingRoute)}
              className="w-full py-3 px-3 rounded-xl text-xs font-sans font-bold uppercase tracking-wider border shadow-md transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
              style={
                isDrawingRoute
                  ? { backgroundColor: '#be123c', color: '#ffffff', borderColor: '#be123c', boxShadow: '0 4px 14px rgba(190,18,60,0.4)' }
                  : { backgroundColor: accentColor, color: uiColors.activeItemText, borderColor: accentColor, boxShadow: `0 4px 14px ${accentColor}40` }
              }
            >
              <Navigation size={14} className={isDrawingRoute ? 'animate-spin' : ''} />
              {isDrawingRoute ? 'Stop Drawing Mode (Click Map to Draw)' : 'Start Drawing Route on Map'}
            </button>

            {/* Profile Selector (Driving, Cycling, Walking, Direct) */}
            <div className="flex flex-col gap-1.5 pt-1">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider" style={{ color: subtextColor }}>
                ROAD NETWORK MODE
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { id: 'driving', label: 'Driving', icon: <Car size={13} /> },
                  { id: 'cycling', label: 'Cycling', icon: <Bike size={13} /> },
                  { id: 'foot', label: 'Walking', icon: <Footprints size={13} /> },
                  { id: 'direct', label: 'Direct', icon: <Crosshair size={13} /> },
                ].map((mode) => {
                  const isActive = routingProfile === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setRoutingProfile(mode.id as any)}
                      className="py-2 px-1 rounded-xl text-[10px] font-sans font-bold border transition-all cursor-pointer flex items-center justify-center gap-1 hover:scale-105"
                      style={
                        isActive
                          ? { backgroundColor: accentColor, color: uiColors.activeItemText, borderColor: accentColor }
                          : { backgroundColor: flyoutBg, borderColor: borderColor, color: subtextColor }
                      }
                    >
                      {mode.icon}
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Route Priority Preference (Shortest Path vs Fastest Route) */}
            {routingProfile !== 'direct' && (
              <div className="flex flex-col gap-1.5 pt-1">
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider" style={{ color: subtextColor }}>
                  ROUTE PRIORITY ALGORITHM
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'shortest', label: 'Shortest Distance Path' },
                    { id: 'fastest', label: 'Fastest Motorway Route' },
                  ].map((pref) => {
                    const isActive = routePreference === pref.id;
                    return (
                      <button
                        key={pref.id}
                        type="button"
                        onClick={() => setRoutePreference(pref.id as any)}
                        className="py-2 px-2 rounded-xl text-[10px] font-sans font-bold border transition-all cursor-pointer text-center hover:scale-105"
                        style={
                          isActive
                            ? { backgroundColor: accentColor, color: uiColors.activeItemText, borderColor: accentColor }
                            : { backgroundColor: flyoutBg, borderColor: borderColor, color: subtextColor }
                        }
                      >
                        {pref.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Waypoints List */}
            {routeWaypoints.length > 0 && (
              <div className="flex flex-col gap-2 pt-1 border-t" style={{ borderColor: borderColor }}>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider" style={{ color: subtextColor }}>
                    ACTIVE WAYPOINTS
                  </span>
                  <button
                    type="button"
                    onClick={clearRouteWaypoints}
                    className="text-xs font-sans font-bold hover:underline cursor-pointer"
                    style={{ color: dangerText }}
                  >
                    Reset Points
                  </button>
                </div>

                <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {routeWaypoints.map((wp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl border text-xs font-mono"
                      style={{ backgroundColor: flyoutBg, borderColor: borderColor, color: textColor }}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 shadow-sm"
                          style={{ backgroundColor: route.color || accentColor }}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold" style={{ color: textColor }}>{wp.lat.toFixed(4)}°, {wp.lng.toFixed(4)}°</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRouteWaypoint(idx)}
                        className="p-0.5 cursor-pointer hover:opacity-100 opacity-60"
                        style={{ color: dangerText }}
                      >
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GPX Track File Import */}
          <div 
            className="p-4 rounded-2xl border flex flex-col gap-3 transition-all shadow-sm"
            style={{ backgroundColor: cardBg, borderColor: borderColor }}
          >
            <span className="text-xs font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
              IMPORT GPX TRACK
            </span>

            <label 
              className="w-full p-4 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all hover:border-neutral-400 group"
              style={{ backgroundColor: flyoutBg, borderColor: borderColor }}
            >
              <Upload size={22} style={{ color: brightAccent }} className="transition-transform group-hover:scale-110" />
              <div className="flex flex-col items-center text-center">
                <span className="text-xs font-bold font-sans" style={{ color: textColor }}>
                  Drop .GPX track file here
                </span>
                <span className="text-[11px] font-sans opacity-90 mt-0.5" style={{ color: subtextColor }}>
                  Compatible with Strava, Garmin, Komoot & AllTrails
                </span>
              </div>
              <input
                type="file"
                accept=".gpx"
                onChange={handleGpxFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Route Line Styling */}
          {route.geojson && (
            <div 
              className="p-4 rounded-2xl border flex flex-col gap-3 transition-all shadow-sm"
              style={{ backgroundColor: cardBg, borderColor: borderColor }}
            >
              <span className="text-xs font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                ROUTE LINE STYLING
              </span>

              {/* Color Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-sans font-bold uppercase tracking-wider" style={{ color: subtextColor }}>
                  LINE COLOR
                </label>
                <div className="flex items-center gap-2">
                  {[
                    { color: accentColor, label: 'Theme Accent' },
                    { color: '#3b82f6', label: 'Cyan Blue' },
                    { color: '#ef4444', label: 'Crimson Red' },
                    { color: '#10b981', label: 'Emerald' },
                    { color: '#f59e0b', label: 'Gold' },
                    { color: '#ffffff', label: 'Pure White' },
                  ].map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setRouteColor(preset.color)}
                      className="w-6 h-6 rounded-full border border-white/20 transition-transform hover:scale-110 cursor-pointer shadow-sm"
                      style={{ backgroundColor: preset.color }}
                      title={preset.label}
                    />
                  ))}
                </div>
              </div>

              {/* Line Width Slider */}
              <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-mono font-medium uppercase" style={{ color: subtextColor }}>
                    Line Thickness
                  </label>
                  <span className="text-[10px] font-mono font-bold" style={{ color: accentColor }}>
                    {route.width || 4} PX
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="64"
                  step="1"
                  value={route.width || 4}
                  onChange={(e) => setRouteWidth(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-lg appearance-none cursor-pointer"
                  style={{ backgroundColor: flyoutBg, accentColor: accentColor }}
                />
              </div>

              {/* Waypoint Marker Size Steppers & Slider */}
              <div className="flex flex-col gap-2 pt-2 border-t" style={{ borderColor: borderColor }}>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-sans font-extrabold uppercase tracking-wider" style={{ color: subtextColor }}>
                    WAYPOINT MARKER SIZE
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => autoScaleToViewport(window.innerWidth, window.innerHeight)}
                      className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105"
                      style={{ backgroundColor: cardBg, borderColor: borderColor, color: brightAccent }}
                      title="Automatically calculate ideal route waypoint size for your screen"
                    >
                      ⚡ Auto-Fit
                    </button>
                    <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border shadow-2xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
                      {route.waypointSize || 36}px
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {[
                    { label: 'SM (32)', size: 32 },
                    { label: 'MD (64)', size: 64 },
                    { label: 'LG (96)', size: 96 },
                    { label: 'XL (144)', size: 144 },
                    { label: '2XL (200)', size: 200 },
                  ].map((s) => {
                    const isSelected = (route.waypointSize || 36) === s.size;
                    return (
                      <button
                        key={s.size}
                        type="button"
                        onClick={() => setRouteWaypointSize(s.size)}
                        className="py-1 text-[9px] font-mono font-bold rounded-xl transition-all cursor-pointer border hover:scale-105"
                        style={
                          isSelected
                            ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
                            : { backgroundColor: cardBg, borderColor: borderColor, color: subtextColor }
                        }
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>

                {/* Continuous Range Slider */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-mono font-bold shrink-0 opacity-70" style={{ color: subtextColor }}>16px</span>
                  <input
                    type="range"
                    min="16"
                    max="256"
                    step="4"
                    value={route.waypointSize || 36}
                    onChange={(e) => setRouteWaypointSize(Number(e.target.value))}
                    className="w-full cursor-pointer h-1.5 rounded-lg accent-[var(--bright-accent)]"
                    style={{ accentColor: brightAccent }}
                  />
                  <span className="text-[10px] font-mono font-bold shrink-0 opacity-70" style={{ color: subtextColor }}>256px</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 8. SETTINGS TAB */}
      {activeTab === 'settings' && (
        <div className="flex flex-col gap-4">
          <div className="text-xs font-mono tracking-wider text-neutral-400 uppercase font-semibold">
            GENERAL SETTINGS
          </div>
          <div 
            className="p-4 rounded-xl border text-xs text-neutral-400 flex flex-col gap-2"
            style={{ backgroundColor: cardBg, borderColor: borderColor }}
          >
            <div>Terraink™ Pro Studio v0.4.2</div>
            <div>Multi-Layout Engine: Active ({activeLayout.name})</div>
            <div>Resolution: {activeLayout.widthPx} × {activeLayout.heightPx} px</div>
            <div>Typography Engine: 18 Expanded Google Fonts</div>
            <div>Spacing Scale: {letterSpacingMultiplier.toFixed(1)}x ({selectedFontOption.titleTracking} / {selectedFontOption.subtitleTracking})</div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
