import React, { useState, useRef, useEffect, lazy, Suspense } from 'react';
import {
  useMapStore,
  getTheme,
  getFontByValue,
  getUIThemeColors,
} from '@/core';
import { PosterMap } from '@/features/map';
import {
  PosterOverlays,
  TextOverlay,
  exportPosterCanvas,
  type ExportFormat,
} from '@/features/poster';
import {
  IconNavSidebar,
  MobileBottomIsland,
  DesktopToolbar,
  SettingsCard,
} from '@/features/navigation';
import { ActiveTabFlyout } from '@/features/panels';
import { fetchOsrmRoadRoute } from '@/features/routing';
import { ErrorBoundary } from '@/shared/components';
import {
  useMobile,
  useWorkspaceDimensions,
  useKeyboardShortcuts,
  useAutosave,
} from '@/shared/hooks';
import type { NavTab } from '@/shared/types';
import {
  MapPin,
  Droplet,
  Layout,
  Type,
  Layers,
  Map as MarkerIcon,
  Route,
  Search,
  Loader2,
  Download
} from 'lucide-react';

// Code-split heavy 3D Cesium Photoreal Engine on-demand
const Cesium3DMap = lazy(() => import('@/features/map/Cesium3DMap'));

export function App() {
  const {
    lat,
    lng,
    zoom,
    setLocation,
    title,
    subtitle,
    activeLayout,
    fontFamily,
    letterSpacingMultiplier = 1.0,
    themeId,
    colorOverrides,
    customThemes,
    markers,
    showTextOverlay,
    showGradientOverlay,
    borderStyle = 'none',
    showCompass = false,
    showScaleBar = false,
    showRouteStats = false,
    layerVisibility,
    weatherPosition = 'bottom-right',
    route,
    routeWaypoints,
    routingProfile,
    routePreference,
    isDrawingRoute,
    clearRoute,
    setRouteGeoJson,
    engineMode,
    setEngineMode,
    autoScaleToViewport,
  } = useMapStore();

  const isMobile = useMobile();
  const workspaceRef = useRef<HTMLDivElement>(null);
  const workspaceDimensions = useWorkspaceDimensions(workspaceRef);

  const currentTheme = getTheme(themeId, customThemes);
  const selectedFontObj = getFontByValue(fontFamily);
  const fontFamilyCSS = selectedFontObj.value;
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);

  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab | null>('theme');
  const [showSettingsCard, setShowSettingsCard] = useState(true);

  // Tab transition state
  const [mountedTab, setMountedTab] = useState<NavTab | null>(activeTab);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | 'left' | 'right' | null>(null);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const prevTabRef = useRef<NavTab | null>(activeTab);
  const TAB_ORDER: NavTab[] = ['location', 'theme', 'layout', 'style', 'layers', 'markers', 'routes', 'ai-location', 'settings'];

  // Global Route Manager: calculates route on waypoints change
  useEffect(() => {
    if (routeWaypoints.length >= 2) {
      fetchOsrmRoadRoute(routeWaypoints, routingProfile, routePreference).then((res) => {
        if (res) {
          setRouteGeoJson(res.geojson, `Custom ${routingProfile.toUpperCase()} Route`, res.distanceKm, {
            durationMin: res.durationMin,
            elevationGainMeters: res.elevationGainMeters,
            elevationLossMeters: res.elevationLossMeters,
            maxElevationMeters: res.maxElevationMeters,
            elevationProfile: res.elevationProfile,
          });
        }
      });
    }
  }, [routeWaypoints, routingProfile, routePreference, setRouteGeoJson]);

  // Clear route when waypoints drop below 2
  useEffect(() => {
    if (routeWaypoints.length < 2 && route.geojson && isDrawingRoute) {
      clearRoute();
    }
  }, [routeWaypoints.length, route.geojson, isDrawingRoute, clearRoute]);

  // Auto-scale defaults on screen resize or poster layout changes
  useEffect(() => {
    if (workspaceDimensions.width > 0 && workspaceDimensions.height > 0) {
      autoScaleToViewport(workspaceDimensions.width, workspaceDimensions.height);
    }
  }, [workspaceDimensions.width, workspaceDimensions.height, activeLayout.id, autoScaleToViewport]);

  // Handle Tab transitions
  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    if (activeTab) {
      if (prevTab && prevTab !== activeTab) {
        const prevIdx = TAB_ORDER.indexOf(prevTab);
        const newIdx = TAB_ORDER.indexOf(activeTab);
        const dir: 'left' | 'right' | 'up' | 'down' = isMobile
          ? (newIdx > prevIdx ? 'left' : 'right')
          : (newIdx > prevIdx ? 'up' : 'down');

        setSlideDirection(dir);
        setIsTabTransitioning(true);
        const timer = setTimeout(() => {
          setMountedTab(activeTab);
          setSlideDirection(dir);
          requestAnimationFrame(() => {
            setIsTabTransitioning(false);
          });
        }, 180);
        return () => clearTimeout(timer);
      } else {
        setMountedTab(activeTab);
      }
    } else {
      const timer = setTimeout(() => {
        setMountedTab(null);
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isMobile]);

  // Letter spacing calculations
  const parseTracking = (trackingStr: string, fallback: number): number => {
    if (!trackingStr) return fallback;
    const num = parseFloat(trackingStr);
    return isNaN(num) ? fallback : num;
  };

  const baseTitleTracking = parseTracking(selectedFontObj.titleTracking, 0.42);
  const baseSubTracking = parseTracking(selectedFontObj.subtitleTracking, 0.32);
  const baseCoordTracking = parseTracking(selectedFontObj.coordTracking, 0.28);

  const titleLetterSpacing = title.length > 18
    ? `${(baseTitleTracking * 0.8 * letterSpacingMultiplier).toFixed(3)}em`
    : `${(baseTitleTracking * letterSpacingMultiplier).toFixed(3)}em`;

  const subLetterSpacing = `${(baseSubTracking * letterSpacingMultiplier).toFixed(3)}em`;
  const coordLetterSpacing = `${(baseCoordTracking * letterSpacingMultiplier).toFixed(3)}em`;

  // Scale calculations for poster frame fitting
  const paddingX = 110;
  const paddingY = 140;
  const availableW = Math.max(200, workspaceDimensions.width - paddingX);
  const availableH = Math.max(200, workspaceDimensions.height - paddingY);
  const scaleFactor = Math.min(
    availableW / activeLayout.widthPx,
    availableH / activeLayout.heightPx
  );
  const overlayScale = Math.min(activeLayout.widthPx, activeLayout.heightPx) / 1000;
  const effectiveFontScale = overlayScale * scaleFactor;

  // Smooth camera zoom
  const handleSmoothZoom = (deltaZoom: number) => {
    const targetZoom = Math.min(18, Math.max(1, zoom + deltaZoom));
    const mapInstance = (window as any).__mapboxInstance;
    if (mapInstance) {
      try {
        mapInstance.easeTo({
          zoom: targetZoom,
          duration: 380,
          easing: (t: number) => t * (2 - t),
        });
        return;
      } catch {
        // Fallback to direct state update
      }
    }
    setLocation(lat, lng, targetZoom);
  };

  // Export handler
  const handleDownload = async () => {
    setDownloading(true);
    try {
      await exportPosterCanvas({
        width: activeLayout.widthPx,
        height: activeLayout.heightPx,
        filename: `${title.toLowerCase().replace(/\s+/g, '-')}-${activeLayout.id}`,
        format: exportFormat,
        title,
        subtitle,
        lat,
        lng,
        fontFamily,
        letterSpacingMultiplier,
        themeId,
        showTextOverlay,
        showGradientOverlay,
        borderStyle,
        showCompass,
        showScaleBar,
        showRouteStats,
        routeDistanceKm: route.distanceKm,
        zoom,
        markersData: markers,
        routeWaypoints,
        routeColor: route.color,
        routeWaypointSize: route.waypointSize,
        customThemes,
      });
    } catch (err) {
      console.error('Failed to export poster:', err);
      alert('Failed to export poster. Make sure the map is fully loaded.');
    } finally {
      setDownloading(false);
    }
  };

  // Keyboard shortcuts and autosave
  useKeyboardShortcuts({
    activeTab,
    setActiveTab,
    zoom,
    handleSmoothZoom,
    handleDownload,
    setShowPosterFrame,
    setIsFormatDropdownOpen,
  });

  useAutosave();

  const MOBILE_NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'location', label: 'Location', icon: <MapPin size={18} /> },
    { id: 'theme', label: 'Theme', icon: <Droplet size={18} /> },
    { id: 'layout', label: 'Layout', icon: <Layout size={18} /> },
    { id: 'style', label: 'Style', icon: <Type size={18} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={18} /> },
    { id: 'markers', label: 'Markers', icon: <MarkerIcon size={18} /> },
    { id: 'routes', label: 'Routes', icon: <Route size={18} /> },
    { id: 'ai-location', label: 'AI Search', icon: <Search size={18} /> },
    { id: 'settings', label: 'Export', icon: <Download size={18} /> },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#11161d] text-white font-sans overflow-hidden select-none">
      {/* Icon Navigation Bar — desktop only */}
      {!isMobile && <IconNavSidebar activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* Main Canvas Area */}
      <main className={`flex-1 relative flex flex-col items-center justify-between overflow-hidden bg-[#181c22] ${isMobile ? 'pb-[72px]' : ''}`}>
        {/* Flyout Panel — desktop only */}
        {!isMobile && (
          <div 
            className="absolute left-0 top-3 bottom-3 z-30"
            style={{ 
              width: '360px',
              transform: activeTab ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'transform',
            }}
          >
            <div 
              className="w-full h-full"
              style={{
                borderRadius: '0 16px 16px 0',
                overflow: 'clip',
              }}
            >
              {mountedTab && (
                <ActiveTabFlyout 
                  activeTab={mountedTab} 
                  slideDirection={slideDirection}
                  isTransitioning={isTabTransitioning}
                />
              )}
            </div>
          </div>
        )}

        {/* 1. Interactive Map Engine with ErrorBoundary & Lazy Loading */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <ErrorBoundary fallbackTitle="Map Engine Error">
            {engineMode === 'photorealistic' ? (
              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#11161d] text-neutral-400">
                    <Loader2 className="animate-spin text-blue-500" size={32} />
                    <span className="text-xs font-mono">Loading Photorealistic 3D Globe Engine...</span>
                  </div>
                }
              >
                <Cesium3DMap />
              </Suspense>
            ) : (
              <PosterMap 
                interactive={true} 
                bgZoomOffset={0} 
                mapLocked={isMapLocked} 
                rotationEnabled={rotationEnabled} 
              />
            )}
          </ErrorBoundary>
        </div>

        {/* 2. Top-Right Floating Settings Card */}
        <SettingsCard
          showSettingsCard={showSettingsCard}
          setShowSettingsCard={setShowSettingsCard}
          uiColors={uiColors}
          title={title}
          subtitle={subtitle}
          currentTheme={currentTheme}
          selectedFontObj={selectedFontObj}
          letterSpacingMultiplier={letterSpacingMultiplier}
          activeLayout={activeLayout}
          markersCount={markers.length}
        />

        {/* 3. Main Poster Display Workspace */}
        <div 
          ref={workspaceRef}
          className="flex-1 w-full flex flex-col items-center justify-between relative z-10 px-4 pt-2 pb-4 overflow-visible pointer-events-none"
        >
          {/* Poster Frame Center Area */}
          <div className="flex-1 w-full flex items-center justify-center overflow-visible">
            <div
              id="poster-frame"
              className="relative flex flex-col shrink-0 origin-center overflow-hidden rounded-[1rem] border-2 border-white/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] ring-1 ring-black/40 pointer-events-none"
              style={{
                width: `${Math.round(activeLayout.widthPx * scaleFactor)}px`,
                height: `${Math.round(activeLayout.heightPx * scaleFactor)}px`,
                opacity: showPosterFrame ? 1 : 0,
                transform: showPosterFrame ? 'scale(1)' : 'scale(0.94)',
                transition: 'width 0.38s cubic-bezier(0.25, 1, 0.5, 1), height 0.38s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.28s ease, transform 0.28s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
            >
              {/* Clear transparent cutout */}
              <div className="absolute inset-0 z-0 bg-transparent" />

              {/* Decorative Frame Overlays */}
              <PosterOverlays
                currentTheme={currentTheme}
                effectiveFontScale={effectiveFontScale}
                showGradientOverlay={showGradientOverlay}
                borderStyle={borderStyle}
                showCompass={showCompass}
                showScaleBar={showScaleBar}
                showRouteStats={showRouteStats}
                zoom={zoom}
                title={title}
                route={route}
                routeWaypoints={routeWaypoints}
                layerVisibility={layerVisibility}
                weatherPosition={weatherPosition}
              />

              {/* Poster Typography Overlay */}
              {showTextOverlay && (
                <TextOverlay
                  title={title}
                  subtitle={subtitle}
                  lat={lat}
                  lng={lng}
                  fontFamilyCSS={fontFamilyCSS}
                  currentTheme={currentTheme}
                  effectiveFontScale={effectiveFontScale}
                  titleLetterSpacing={titleLetterSpacing}
                  subLetterSpacing={subLetterSpacing}
                  coordLetterSpacing={coordLetterSpacing}
                  letterSpacingMultiplier={letterSpacingMultiplier}
                />
              )}
            </div>
          </div>

          {/* Desktop Toolbar */}
          {!isMobile && (
            <DesktopToolbar
              uiColors={uiColors}
              showPosterFrame={showPosterFrame}
              setShowPosterFrame={setShowPosterFrame}
              isMapLocked={isMapLocked}
              setIsMapLocked={setIsMapLocked}
              engineMode={engineMode}
              setEngineMode={setEngineMode}
              rotationEnabled={rotationEnabled}
              setRotationEnabled={setRotationEnabled}
              zoom={zoom}
              handleSmoothZoom={handleSmoothZoom}
              exportFormat={exportFormat}
              setExportFormat={setExportFormat}
              isFormatDropdownOpen={isFormatDropdownOpen}
              setIsFormatDropdownOpen={setIsFormatDropdownOpen}
              downloading={downloading}
              handleDownload={handleDownload}
            />
          )}
        </div>
      </main>

      {/* ── Mobile Floating Bottom Island ── */}
      {isMobile && (
        <MobileBottomIsland
          uiColors={uiColors}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          mountedTab={mountedTab}
          slideDirection={slideDirection}
          isTabTransitioning={isTabTransitioning}
          MOBILE_NAV_ITEMS={MOBILE_NAV_ITEMS}
          showPosterFrame={showPosterFrame}
          setShowPosterFrame={setShowPosterFrame}
          isMapLocked={isMapLocked}
          setIsMapLocked={setIsMapLocked}
          rotationEnabled={rotationEnabled}
          setRotationEnabled={setRotationEnabled}
          engineMode={engineMode}
          setEngineMode={setEngineMode}
          zoom={zoom}
          handleSmoothZoom={handleSmoothZoom}
          exportFormat={exportFormat}
          setExportFormat={setExportFormat}
          downloading={downloading}
          handleDownload={handleDownload}
        />
      )}
    </div>
  );
}

export default App;
