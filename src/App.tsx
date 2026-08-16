import PosterMap from './components/PosterMap';
import { IconNavSidebar, ActiveTabFlyout } from './components/IconNavSidebar';
import type { NavTab } from './components/IconNavSidebar';
import { useMapStore } from './store/useMapStore';
import { getTheme } from './constants/themes';
import { getFontByValue } from './constants/fonts';
import { Download, Info, Maximize2, Minimize2, ChevronDown, ChevronUp, Check, X, MapPin, Layout, Layers, Route, Search, Lock, RotateCw, ZoomIn, ZoomOut, Droplet, Type, Map as MarkerIcon } from 'lucide-react';
import { exportPosterCanvas, type ExportFormat } from './utils/mapExport';
import { getUIThemeColors, type UIThemeColors } from './utils/themeColors';
import { useMobile } from './hooks/useMobile';
import { fetchOsrmRoadRoute } from './utils/routing';

// ─── Mobile Bottom Island ────────────────────────────────────────────────────
interface MobileBottomIslandProps {
  uiColors: UIThemeColors;
  activeTab: NavTab | null;
  setActiveTab: (t: NavTab | null) => void;
  mountedTab: NavTab | null;
  slideDirection: 'up' | 'down' | null;
  isTabTransitioning: boolean;
  MOBILE_NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[];
  showPosterFrame: boolean;
  setShowPosterFrame: (v: boolean) => void;
  isMapLocked: boolean;
  setIsMapLocked: (v: boolean) => void;
  rotationEnabled: boolean;
  setRotationEnabled: (v: boolean) => void;
  zoom: number;
  handleSmoothZoom: (d: number) => void;
  exportFormat: ExportFormat;
  setExportFormat: (f: ExportFormat) => void;
  downloading: boolean;
  handleDownload: () => void;
}

function MobileBottomIsland({
  uiColors, activeTab, setActiveTab, mountedTab, slideDirection, isTabTransitioning,
  MOBILE_NAV_ITEMS, showPosterFrame, setShowPosterFrame, isMapLocked, setIsMapLocked,
  rotationEnabled, setRotationEnabled, zoom, handleSmoothZoom,
  exportFormat, setExportFormat, downloading, handleDownload,
}: MobileBottomIslandProps) {
  const [actionsExpanded, setActionsExpanded] = useState(false);
  const [fmtOpen, setFmtOpen] = useState(false);

  // island bottom offset
  const islandBottom = 'calc(env(safe-area-inset-bottom, 0px) + 12px)';

  // sheet sits flush on top of the island
  // island height: nav row 64px + (actions row 48px when expanded) + border
  const islandHeight = actionsExpanded ? 116 : 68;

  return (
    <>
      {/* Tab content sheet — slides up from just above the island */}
      <div
        className="fixed left-3 right-3 z-40 overflow-hidden rounded-3xl border shadow-2xl"
        style={{
          bottom: `calc(env(safe-area-inset-bottom, 0px) + ${islandHeight + 20}px)`,
          maxHeight: 'calc(100dvh - 180px)',
          backgroundColor: `${uiColors.flyoutBg}F8`,
          borderColor: uiColors.borderColor,
          transform: activeTab ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: activeTab ? 1 : 0,
          pointerEvents: activeTab ? 'auto' : 'none',
          transition: 'transform 0.32s cubic-bezier(0.25,1,0.5,1), opacity 0.25s ease, bottom 0.3s cubic-bezier(0.25,1,0.5,1)',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch' as any,
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sticky top-0 z-10" style={{ backgroundColor: `${uiColors.flyoutBg}F8` }}>
          <div className="w-9 h-[3px] rounded-full opacity-25" style={{ backgroundColor: uiColors.textColor }} />
        </div>
        {mountedTab && (
          <ActiveTabFlyout activeTab={mountedTab} slideDirection={slideDirection} isTransitioning={isTabTransitioning} />
        )}
      </div>

      {/* Backdrop */}
      {activeTab && (
        <div
          className="fixed inset-0 z-30"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={() => setActiveTab(null)}
        />
      )}

      {/* Floating island pill */}
      <div className="fixed left-3 right-3 z-50" style={{ bottom: islandBottom }}>
        <div
          className="rounded-[22px] border shadow-[0_8px_40px_rgba(0,0,0,0.6)] backdrop-blur-2xl overflow-hidden"
          style={{ backgroundColor: `${uiColors.sidebarBg}EE`, borderColor: uiColors.borderColor }}
        >

          {/* ── Action bar row (collapsible) ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: actionsExpanded ? '1fr' : '0fr',
              transition: 'grid-template-rows 0.28s cubic-bezier(0.25,1,0.5,1)',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div
                className="flex items-center border-b"
                style={{ borderColor: uiColors.borderColor, height: 48, paddingLeft: 4, paddingRight: 4, gap: 2 }}
              >
                {/* Frame toggle */}
                <button
                  type="button"
                  onClick={() => setShowPosterFrame(!showPosterFrame)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: !showPosterFrame ? uiColors.accentColor : `${uiColors.textColor}12`,
                    color: !showPosterFrame ? uiColors.activeItemText : uiColors.textColor,
                  }}
                >
                  {showPosterFrame ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
                  <span style={{ fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {showPosterFrame ? 'Full Map' : 'Poster'}
                  </span>
                </button>

                {/* Lock */}
                <button
                  type="button"
                  onClick={() => setIsMapLocked(!isMapLocked)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: isMapLocked ? '#be123c' : `${uiColors.textColor}12`,
                    color: isMapLocked ? '#fff' : uiColors.textColor,
                  }}
                >
                  <Lock size={13} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>{isMapLocked ? 'Locked' : 'Lock'}</span>
                </button>

                {/* Rotation */}
                <button
                  type="button"
                  onClick={() => setRotationEnabled(!rotationEnabled)}
                  className="flex items-center justify-center gap-1 rounded-xl transition-all active:scale-90 cursor-pointer shrink-0"
                  style={{
                    height: 36, paddingLeft: 10, paddingRight: 10,
                    backgroundColor: rotationEnabled ? uiColors.accentColor : `${uiColors.textColor}12`,
                    color: rotationEnabled ? uiColors.activeItemText : uiColors.textColor,
                  }}
                >
                  <RotateCw size={13} className={rotationEnabled ? 'animate-spin' : ''} />
                  <span style={{ fontSize: 11, fontWeight: 600 }}>3D</span>
                </button>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Zoom out */}
                <button
                  type="button"
                  onClick={() => handleSmoothZoom(-0.75)}
                  className="flex items-center justify-center rounded-xl active:scale-90 cursor-pointer shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                >
                  <ZoomOut size={15} />
                </button>

                {/* Zoom label */}
                <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: uiColors.accentColor, minWidth: 36, textAlign: 'center' }}>
                  Z{zoom.toFixed(1)}
                </span>

                {/* Zoom in */}
                <button
                  type="button"
                  onClick={() => handleSmoothZoom(+0.75)}
                  className="flex items-center justify-center rounded-xl active:scale-90 cursor-pointer shrink-0"
                  style={{ width: 36, height: 36, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                >
                  <ZoomIn size={15} />
                </button>

                {/* Format picker */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setFmtOpen(!fmtOpen)}
                    className="flex items-center gap-0.5 rounded-xl active:scale-90 cursor-pointer"
                    style={{ height: 36, paddingLeft: 10, paddingRight: 8, backgroundColor: `${uiColors.textColor}12`, color: uiColors.textColor }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{exportFormat.toUpperCase()}</span>
                    <ChevronDown size={11} className={fmtOpen ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
                  </button>
                  {fmtOpen && (
                    <div
                      className="absolute bottom-full mb-2 right-0 rounded-2xl border shadow-2xl p-1.5 z-50"
                      style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor, minWidth: 130 }}
                    >
                      {(['png', 'jpeg', 'webp', 'pdf'] as ExportFormat[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => { setExportFormat(f); setFmtOpen(false); }}
                          className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl cursor-pointer"
                          style={{
                            backgroundColor: exportFormat === f ? `${uiColors.accentColor}20` : 'transparent',
                            color: exportFormat === f ? uiColors.accentColor : uiColors.textColor,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'monospace' }}>{f.toUpperCase()}</span>
                          {exportFormat === f && <Check size={12} />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Download */}
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={downloading}
                  className="flex items-center justify-center gap-1 rounded-xl active:scale-90 cursor-pointer shrink-0 disabled:opacity-50"
                  style={{ height: 36, paddingLeft: 12, paddingRight: 12, backgroundColor: uiColors.accentColor, color: uiColors.activeItemText }}
                >
                  <Download size={13} className={downloading ? 'animate-bounce' : ''} />
                  <span style={{ fontSize: 11, fontWeight: 700 }}>{downloading ? '…' : 'Export'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── Nav tab row ── */}
          <div className="flex items-center" style={{ height: 64, paddingLeft: 4, paddingRight: 4 }}>
            {/* Scrollable tabs */}
            <div
              className="flex items-center flex-1 overflow-x-auto"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' as any, gap: 0 }}
            >
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
                    className="flex flex-col items-center justify-center shrink-0 relative active:scale-90 cursor-pointer transition-all"
                    style={{
                      width: 60, height: 52, borderRadius: 14, gap: 3,
                      backgroundColor: isActive ? `${uiColors.brightAccent}20` : 'transparent',
                      color: isActive ? uiColors.brightAccent : uiColors.inactiveItemText,
                    }}
                  >
                    <div style={{ transform: isActive ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.18s' }}>
                      {item.icon}
                    </div>
                    <span style={{ fontSize: 9.5, fontWeight: 600, lineHeight: 1 }}>{item.label}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-[5px] left-1/2 -translate-x-1/2 rounded-full"
                        style={{ width: 14, height: 2.5, backgroundColor: uiColors.brightAccent }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Collapse / expand chevron */}
            <button
              type="button"
              onClick={() => setActionsExpanded(!actionsExpanded)}
              className="flex items-center justify-center shrink-0 rounded-xl active:scale-90 cursor-pointer ml-1"
              style={{
                width: 36, height: 36,
                backgroundColor: actionsExpanded ? `${uiColors.brightAccent}20` : `${uiColors.textColor}10`,
                color: actionsExpanded ? uiColors.brightAccent : uiColors.inactiveItemText,
              }}
            >
              {actionsExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
    
function App() { 
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
    autoScaleToViewport,
  } = useMapStore();

  // Global Route Manager: ensures route calculates on BOTH mobile and desktop
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
  }, [routeWaypoints, routingProfile, routePreference, route.geojson, isDrawingRoute, clearRoute, setRouteGeoJson]);

  const currentTheme = getTheme(themeId, customThemes);
  const selectedFontObj = getFontByValue(fontFamily);
  const fontFamilyCSS = selectedFontObj.value;
  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);

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

  const [downloading, setDownloading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [showPosterFrame, setShowPosterFrame] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab | null>('theme');
  const isMobile = useMobile();

  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Close custom export format dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatDropdownRef.current && !formatDropdownRef.current.contains(e.target as Node)) {
        setIsFormatDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Smooth camera zoom handler without visual flashing
  const handleSmoothZoom = (deltaZoom: number) => {
    const targetZoom = Math.min(18, Math.max(1, zoom + deltaZoom));
    const mapInstance = window.__mapboxInstance;
    if (mapInstance) {
      try {
        mapInstance.easeTo({
          zoom: targetZoom,
          duration: 380,
          easing: (t: number) => t * (2 - t),
        });
        return;
      } catch (err) {
        // ignore
      }
    }
    setLocation(lat, lng, targetZoom);
  };

  // Workspace container reference and dimensions for dynamic scale calculation
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceDimensions, setWorkspaceDimensions] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const updateDimensions = () => {
      if (workspaceRef.current) {
        setWorkspaceDimensions({
          width: workspaceRef.current.clientWidth,
          height: workspaceRef.current.clientHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    const observer = new ResizeObserver(updateDimensions);
    if (workspaceRef.current) observer.observe(workspaceRef.current);

    return () => {
      window.removeEventListener('resize', updateDimensions);
      observer.disconnect();
    };
  }, []);

  // Auto-scale defaults on screen resize or poster layout changes
  useEffect(() => {
    if (workspaceDimensions.width > 0 && workspaceDimensions.height > 0) {
      autoScaleToViewport(workspaceDimensions.width, workspaceDimensions.height);
    }
  }, [workspaceDimensions.width, workspaceDimensions.height, activeLayout.id]);

  // Compute scale factor to fit poster frame dynamically inside workspace with room for drop shadow
  const paddingX = 110;
  const paddingY = 140;
  const availableW = Math.max(200, workspaceDimensions.width - paddingX);
  const availableH = Math.max(200, workspaceDimensions.height - paddingY);

  const scaleFactor = Math.min(
    availableW / activeLayout.widthPx,
    availableH / activeLayout.heightPx
  );

  // Scale multiplier matching target poster layout resolution
  const overlayScale = Math.min(activeLayout.widthPx, activeLayout.heightPx) / 1000;
  const effectiveFontScale = overlayScale * scaleFactor;

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

  const [mountedTab, setMountedTab] = useState<NavTab | null>(activeTab);
  const [slideDirection, setSlideDirection] = useState<'up' | 'down' | null>(null);
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [showSettingsCard, setShowSettingsCard] = useState(true);
  const prevTabRef = useRef<NavTab | null>(activeTab);

  const TAB_ORDER: NavTab[] = ['location', 'theme', 'layout', 'style', 'layers', 'markers', 'routes', 'settings'];

  useEffect(() => {
    const prevTab = prevTabRef.current;
    prevTabRef.current = activeTab;

    if (activeTab) {
      if (prevTab && prevTab !== activeTab) {
        // Tab change — determine direction and animate
        const prevIdx = TAB_ORDER.indexOf(prevTab);
        const newIdx = TAB_ORDER.indexOf(activeTab);
        setSlideDirection(newIdx > prevIdx ? 'up' : 'down');
        setIsTabTransitioning(true);
        // Brief exit animation, then swap content
        const timer = setTimeout(() => {
          setMountedTab(activeTab);
          setSlideDirection(newIdx > prevIdx ? 'up' : 'down');
          // Allow enter animation to start
          requestAnimationFrame(() => {
            setIsTabTransitioning(false);
          });
        }, 150);
        return () => clearTimeout(timer);
      } else {
        // First open or same tab
        setMountedTab(activeTab);
      }
    } else {
      // Closing — keep content mounted during slide-out
      const timer = setTimeout(() => {
        setMountedTab(null);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // ============================
  // KEYBOARD SHORTCUTS
  // ============================
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

      // Escape → Close sidebar
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
  }, [activeTab, zoom, downloading]);

  // ============================
  // SHAREABLE URL HASH & AUTO-SAVE
  // ============================
  const AUTOSAVE_KEY = 'mapfolio_autosave';

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
  }, []);

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
      } catch (e) {
        // Silently fail
      }
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  const MOBILE_NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: 'location', label: 'Location', icon: <MapPin size={20} /> },
    { id: 'theme', label: 'Theme', icon: <Droplet size={20} /> },
    { id: 'layout', label: 'Layout', icon: <Layout size={20} /> },
    { id: 'style', label: 'Style', icon: <Type size={20} /> },
    { id: 'layers', label: 'Layers', icon: <Layers size={20} /> },
    { id: 'markers', label: 'Markers', icon: <MarkerIcon size={20} /> },
    { id: 'routes', label: 'Routes', icon: <Route size={20} /> },
    { id: 'ai-location', label: 'AI Search', icon: <Search size={20} /> },
    { id: 'settings', label: 'GitHub', icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg> },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#11161d] text-white font-sans overflow-hidden select-none">
      {/* Icon Navigation Bar — desktop only */}
      {!isMobile && <IconNavSidebar activeTab={activeTab} onTabChange={setActiveTab} />}

      {/* Main Canvas Area */}
      <main className={`flex-1 relative flex flex-col items-center justify-between overflow-hidden bg-[#181c22] ${isMobile ? 'pb-[72px]' : ''}`}>
        {/* Flyout Panel — attached to left edge, slides in/out horizontally (desktop only) */}
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
        {/* 1. Single Interactive Map Engine (Full Screen) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <PosterMap 
            interactive={true} 
            bgZoomOffset={0} 
            mapLocked={isMapLocked} 
            rotationEnabled={rotationEnabled} 
          />
        </div>

        {/* 2. Top-Right Floating Current Settings Card (With Hide/Show Support — desktop only) */}
        {showSettingsCard ? (
          <div 
            className="hidden md:block absolute top-6 right-6 z-20 backdrop-blur-md border rounded-2xl p-4 text-xs shadow-2xl w-80 pointer-events-auto transition-all animate-scale-in"
            style={{
              backgroundColor: `${uiColors.flyoutBg}EA`,
              borderColor: uiColors.borderColor,
              color: uiColors.textColor,
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] tracking-[0.18em] font-semibold uppercase" style={{ color: uiColors.subtextColor }}>
                CURRENT SETTINGS
              </div>
              <button
                type="button"
                onClick={() => setShowSettingsCard(false)}
                className="p-1 rounded-lg opacity-60 hover:opacity-100 hover:bg-neutral-500/20 transition-all cursor-pointer"
                title="Hide Settings Panel"
              >
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>LOCATION</div>
                <div className="font-semibold truncate" style={{ color: uiColors.headingColor }}>{title}, {subtitle}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>THEME</div>
                <div className="font-semibold truncate" style={{ color: uiColors.headingColor }}>{currentTheme.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>FONT</div>
                <div className="font-semibold truncate" style={{ color: uiColors.headingColor }}>{selectedFontObj.label}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>SPACING</div>
                <div className="font-semibold truncate font-mono" style={{ color: uiColors.headingColor }}>{letterSpacingMultiplier.toFixed(1)}x ({selectedFontObj.titleTracking})</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>LAYOUT</div>
                <div className="font-semibold truncate" style={{ color: uiColors.headingColor }}>{activeLayout.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-mono tracking-wider uppercase" style={{ color: uiColors.subtextColor }}>MARKERS</div>
                <div className="font-semibold truncate" style={{ color: uiColors.headingColor }}>{markers.length} markers</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowSettingsCard(true)}
            className="hidden md:flex absolute top-6 right-6 z-20 backdrop-blur-md border rounded-xl px-3 py-2 text-xs shadow-2xl pointer-events-auto transition-all hover:scale-105 items-center gap-1.5 font-mono font-semibold cursor-pointer"
            style={{
              backgroundColor: `${uiColors.flyoutBg}EA`,
              borderColor: uiColors.borderColor,
              color: uiColors.textColor,
            }}
            title="Show Current Settings Card"
          >
            <Info size={13} style={{ color: uiColors.accentColor }} />
            <span className="text-[11px] tracking-wider uppercase">Settings</span>
          </button>
        )}

        {/* Main Poster Display Workspace */}
        <div 
          ref={workspaceRef}
          className="flex-1 w-full flex flex-col items-center justify-between relative z-10 px-4 pt-2 pb-4 overflow-visible pointer-events-none"
        >
          {/* Poster Frame Center Area - Clipped Region Overlay */}
          <div className="flex-1 w-full flex items-center justify-center overflow-visible">
            {/* Exact Map Rectangle Frame matching aspect ratio without CSS scale transform */}
            <div
              key={`${activeLayout.id}-${showPosterFrame}`}
              id="poster-frame"
              className={`relative flex flex-col shrink-0 origin-center overflow-hidden rounded-[1rem] border-2 border-white/40 shadow-[0_25px_70px_rgba(0,0,0,0.85)] pointer-events-none ring-1 ring-black/40 ${
                showPosterFrame ? 'animate-scale-in' : 'animate-scale-out pointer-events-none opacity-0'
              }`}
              style={{
                width: `${Math.round(activeLayout.widthPx * scaleFactor)}px`,
                height: `${Math.round(activeLayout.heightPx * scaleFactor)}px`,
              }}
            >
              {/* Clear transparent cutout */}
              <div className="absolute inset-0 z-0 bg-transparent" />

              {/* Top & Bottom Theme-Aware Gradient Overlay */}
              {showGradientOverlay && (
                <>
                  <div
                    className="absolute inset-x-0 top-0 z-10 pointer-events-none"
                    style={{
                      height: `${Math.round(120 * effectiveFontScale)}px`,
                      background: `linear-gradient(to bottom, ${currentTheme.palette.land}B3 0%, ${currentTheme.palette.land}40 60%, ${currentTheme.palette.land}00 100%)`,
                    }}
                  />
                  <div
                    className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
                    style={{
                      height: `${Math.round(260 * effectiveFontScale)}px`,
                      background: `linear-gradient(to top, ${currentTheme.palette.land}E6 35%, ${currentTheme.palette.land}70 70%, ${currentTheme.palette.land}00 100%)`,
                    }}
                  />
                </>
              )}

              {/* Decorative Border Frames */}
              {borderStyle === 'thin' && (
                <div 
                  className="absolute z-20 pointer-events-none border"
                  style={{
                    inset: `${Math.round(18 * effectiveFontScale)}px`,
                    borderColor: `${currentTheme.palette.roads.major}60`,
                    borderWidth: `${Math.max(1, Math.round(1.5 * effectiveFontScale))}px`,
                  }}
                />
              )}
              {borderStyle === 'double' && (
                <>
                  <div 
                    className="absolute z-20 pointer-events-none border"
                    style={{
                      inset: `${Math.round(14 * effectiveFontScale)}px`,
                      borderColor: `${currentTheme.palette.roads.major}80`,
                      borderWidth: `${Math.max(1, Math.round(2 * effectiveFontScale))}px`,
                    }}
                  />
                  <div 
                    className="absolute z-20 pointer-events-none border"
                    style={{
                      inset: `${Math.round(22 * effectiveFontScale)}px`,
                      borderColor: `${currentTheme.palette.roads.major}40`,
                      borderWidth: `${Math.max(1, Math.round(1 * effectiveFontScale))}px`,
                    }}
                  />
                </>
              )}
              {borderStyle === 'rounded' && (
                <div 
                  className="absolute z-20 pointer-events-none border"
                  style={{
                    inset: `${Math.round(20 * effectiveFontScale)}px`,
                    borderRadius: `${Math.round(24 * effectiveFontScale)}px`,
                    borderColor: `${currentTheme.palette.roads.major}70`,
                    borderWidth: `${Math.max(1, Math.round(2 * effectiveFontScale))}px`,
                  }}
                />
              )}
              {borderStyle === 'art-deco' && (
                <div 
                  className="absolute z-20 pointer-events-none border-2"
                  style={{
                    inset: `${Math.round(16 * effectiveFontScale)}px`,
                    borderColor: `${currentTheme.palette.roads.major}90`,
                    borderWidth: `${Math.max(1, Math.round(2.5 * effectiveFontScale))}px`,
                    outline: `${Math.max(1, Math.round(1 * effectiveFontScale))}px solid ${currentTheme.palette.roads.major}40`,
                    outlineOffset: `${Math.round(6 * effectiveFontScale)}px`,
                  }}
                />
              )}

              {/* Ornamental Compass Rose */}
              {showCompass && (
                <div 
                  className="absolute top-6 left-6 z-20 pointer-events-none flex flex-col items-center justify-center drop-shadow-lg"
                  style={{
                    width: `${Math.round(70 * effectiveFontScale)}px`,
                    height: `${Math.round(70 * effectiveFontScale)}px`,
                    color: currentTheme.palette.roads.major,
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full" fill="currentColor">
                    <polygon points="50,5 57,43 50,50 43,43" fill={currentTheme.palette.roads.major} />
                    <polygon points="50,95 57,57 50,50 43,57" fill={`${currentTheme.palette.roads.major}80`} />
                    <polygon points="5,50 43,43 50,50 43,57" fill={`${currentTheme.palette.roads.major}80`} />
                    <polygon points="95,50 57,43 50,50 57,57" fill={currentTheme.palette.roads.major} />
                    <circle cx="50" cy="50" r="8" fill="none" stroke={currentTheme.palette.roads.major} strokeWidth="2" />
                    <text x="50" y="0" textAnchor="middle" dominantBaseline="hanging" fontSize="11" fontWeight="bold" fill={currentTheme.palette.roads.major} fontFamily="sans-serif">N</text>
                  </svg>
                </div>
              )}

              {/* Cartographic Scale Bar */}
              {showScaleBar && (
                <div 
                  className="absolute top-6 right-6 z-20 pointer-events-none flex flex-col items-end gap-1 drop-shadow-md"
                  style={{ color: currentTheme.palette.roads.major }}
                >
                  <div className="flex items-center gap-1">
                    <div 
                      className="border-b-2 border-l-2 border-r-2"
                      style={{
                        width: `${Math.round(80 * effectiveFontScale)}px`,
                        height: `${Math.round(6 * effectiveFontScale)}px`,
                        borderColor: currentTheme.palette.roads.major,
                      }}
                    />
                  </div>
                  <span className="font-mono font-bold tracking-wider" style={{ fontSize: `${Math.round(11 * effectiveFontScale)}px` }}>
                    {zoom >= 14 ? '500 M' : zoom >= 11 ? '2 KM' : zoom >= 8 ? '10 KM' : '50 KM'}
                  </span>
                </div>
              )}

              {/* Route Activity Statistics Card */}
              {showRouteStats && (route.geojson || routeWaypoints.length >= 2) && (
                <div 
                  className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none backdrop-blur-md rounded-2xl border px-4 py-2 flex items-center gap-4 shadow-xl"
                  style={{
                    backgroundColor: `${currentTheme.palette.land}D9`,
                    borderColor: `${currentTheme.palette.roads.major}40`,
                    color: currentTheme.palette.roads.major,
                    transform: `translateX(-50%) scale(${Math.max(0.7, Math.min(1.4, effectiveFontScale))})`,
                    transformOrigin: 'top center',
                  }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">DISTANCE</span>
                    <span className="text-xs font-mono font-black">{route.distanceKm || '12.4'} KM</span>
                  </div>
                  <div className="w-px h-6 bg-current opacity-20" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">WAYPOINTS</span>
                    <span className="text-xs font-mono font-black">{routeWaypoints.length || 2} PTS</span>
                  </div>
                  <div className="w-px h-6 bg-current opacity-20" />
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">EST. TIME</span>
                    <span className="text-xs font-mono font-black">{Math.round((route.distanceKm || 12.4) * 1.8)} MIN</span>
                  </div>
                </div>
              )}

              {/* Live Weather Overlay Badge with Dynamic Custom Position */}
              {layerVisibility.weather && (
                <div 
                  className={`absolute z-20 pointer-events-none backdrop-blur-md rounded-xl border px-3 py-1.5 flex items-center gap-2 shadow-lg transition-all duration-300 ${
                    weatherPosition === 'top-left' ? 'top-6 left-6' :
                    weatherPosition === 'top-center' ? 'top-6 left-1/2 -translate-x-1/2' :
                    weatherPosition === 'top-right' ? 'top-6 right-6' :
                    weatherPosition === 'bottom-left' ? 'bottom-24 left-6' :
                    'bottom-24 right-6'
                  }`}
                  style={{
                    backgroundColor: `${currentTheme.palette.land}D9`,
                    borderColor: `${currentTheme.palette.roads.major}30`,
                    color: currentTheme.palette.roads.major,
                  }}
                >
                  <span className="text-sm">☀️</span>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono font-bold leading-tight">22°C • Clear</span>
                    <span className="text-[8px] font-sans opacity-70 uppercase tracking-tight">Weather at {title}</span>
                  </div>
                </div>
              )}

              {/* Floating Overlay Typography matching target layout */}
              {showTextOverlay && (
                <div
                  className="absolute inset-x-0 bottom-0 z-20 flex flex-col items-center justify-center text-center pointer-events-none select-none transition-all duration-300"
                  style={{
                    fontFamily: fontFamilyCSS,
                    color: currentTheme.palette.roads.major,
                    paddingBottom: `${Math.round(12 * effectiveFontScale)}px`,
                    paddingTop: `${Math.round(20 * effectiveFontScale)}px`,
                    paddingLeft: `${Math.round(12 * effectiveFontScale)}px`,
                    paddingRight: `${Math.round(12 * effectiveFontScale)}px`,
                  }}
                >
                  {/* Main Title */}
                  <h2 
                    className="font-black uppercase drop-shadow-xl transition-all"
                    style={{
                      fontSize: `${Math.round(
                        title.length > 20 ? 44 * effectiveFontScale :
                        title.length > 14 ? 50 * effectiveFontScale : 60 * effectiveFontScale
                      )}px`,
                      letterSpacing: titleLetterSpacing,
                      lineHeight: 1.12,
                      marginBottom: `${Math.round(14 * effectiveFontScale)}px`,
                    }}
                  >
                    {title}
                  </h2>

                  {/* Accent Divider Line */}
                  <div
                    className="rounded-full opacity-90 shadow-sm transition-all"
                    style={{ 
                      backgroundColor: currentTheme.palette.roads.major,
                      width: `${Math.round(220 * effectiveFontScale * (letterSpacingMultiplier >= 1.2 ? 1.15 : 1))}px`,
                      height: `${Math.max(2, Math.round(3.5 * effectiveFontScale))}px`,
                    }}
                  />

                  {/* Subtitle */}
                  <p 
                    className="font-semibold uppercase opacity-90 drop-shadow transition-all"
                    style={{
                      fontSize: `${Math.round(30 * effectiveFontScale)}px`,
                      letterSpacing: subLetterSpacing,
                      lineHeight: 1.3,
                      marginTop: `${Math.round(14 * effectiveFontScale)}px`,
                    }}
                  >
                    {subtitle}
                  </p>

                  {/* Coordinate Display */}
                  <p 
                    className="font-mono font-medium opacity-80 drop-shadow transition-all"
                    style={{
                      fontSize: `${Math.round(20.5 * effectiveFontScale)}px`,
                      letterSpacing: coordLetterSpacing,
                      lineHeight: 1.35,
                      marginTop: `${Math.round(10 * effectiveFontScale)}px`,
                    }}
                  >
                    {Math.abs(lat).toFixed(4)}° {lat >= 0 ? 'N' : 'S'} / {Math.abs(lng).toFixed(4)}° {lng >= 0 ? 'E' : 'W'}
                  </p>

                  {/* Watermarks */}
                  <div 
                    className="w-full flex justify-between items-center font-mono opacity-50 drop-shadow transition-all"
                    style={{
                      fontSize: `${Math.round(15.5 * effectiveFontScale)}px`,
                      letterSpacing: '0.18em',
                      marginTop: `${Math.round(24 * effectiveFontScale)}px`,
                      paddingLeft: `${Math.round(16 * effectiveFontScale)}px`,
                      paddingRight: `${Math.round(16 * effectiveFontScale)}px`,
                    }}
                  >
                    <span>© mapfolio.app</span>
                    <span>© OpenStreetMap contributors</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Controls Toolbar - Unified Full-Segmented Bar — desktop only */}
          <div 
            className={`flex items-stretch backdrop-blur-xl h-11 rounded-2xl shadow-2xl text-xs z-30 shrink-0 my-3 pointer-events-auto transition-all duration-300 ease-out mx-auto select-none relative ${isMobile ? 'hidden' : ''}`}
            style={{
              backgroundColor: `${uiColors.flyoutBg}F2`,
              color: uiColors.textColor,
            }}
          >
            {/* SEGMENT 1: Toggle Poster Frame vs Full Map View */}
            <button 
              type="button"
              onClick={() => setShowPosterFrame(!showPosterFrame)}
              className="flex items-center justify-center gap-1.5 w-[146px] h-full font-medium transition-all duration-200 cursor-pointer hover:opacity-90 active:opacity-75 border-r rounded-l-2xl"
              style={
                !showPosterFrame
                  ? { backgroundColor: uiColors.accentColor, color: uiColors.activeItemText, borderColor: 'transparent' }
                  : { backgroundColor: 'transparent', color: uiColors.textColor, borderColor: uiColors.borderColor }
              }
              title={showPosterFrame ? "Hide Poster Frame to View Full Unclipped Map" : "Show Poster Frame Clipped View"}
            >
              {showPosterFrame ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              <span className="whitespace-nowrap">{showPosterFrame ? 'Full Map View' : 'Poster Frame View'}</span>
            </button>

            {/* SEGMENT 2: Lock Map Control */}
            <button 
              type="button"
              onClick={() => setIsMapLocked(!isMapLocked)}
              className="flex items-center justify-center gap-1.5 w-[116px] h-full font-medium transition-all duration-200 cursor-pointer hover:bg-neutral-500/10 active:opacity-75 border-r"
              style={
                isMapLocked
                  ? { backgroundColor: '#be123c', color: '#ffffff', borderColor: 'transparent' }
                  : { backgroundColor: 'transparent', color: uiColors.textColor, borderColor: uiColors.borderColor }
              }
              title={isMapLocked ? "Unlock Map Navigation & Click Placing" : "Lock Map Position & Stop Map Pan/Zoom"}
            >
              <Lock size={13} />
              <span className="whitespace-nowrap">{isMapLocked ? 'Map Locked' : 'Lock Map'}</span>
            </button>

            {/* SEGMENT 3: Enable/Disable 3D Rotation */}
            <button 
              type="button"
              onClick={() => setRotationEnabled(!rotationEnabled)}
              className="flex items-center justify-center gap-1.5 w-[146px] h-full font-medium transition-all duration-200 cursor-pointer hover:bg-neutral-500/10 active:opacity-75 border-r"
              style={
                rotationEnabled
                  ? { backgroundColor: uiColors.accentColor, color: uiColors.activeItemText, borderColor: 'transparent' }
                  : { backgroundColor: 'transparent', color: uiColors.textColor, borderColor: uiColors.borderColor }
              }
              title={rotationEnabled ? "Click to Disable 3D Rotation" : "Click to Enable 3D Map Pitch & Bearing Rotation"}
            >
              <RotateCw size={13} className={rotationEnabled ? 'animate-spin' : ''} />
              <span className="whitespace-nowrap">{rotationEnabled ? '3D Rotation On' : 'Enable Rotation'}</span>
            </button>

            {/* SEGMENT 4: Zoom Out Button */}
            <button 
              type="button"
              onClick={() => handleSmoothZoom(-0.75)}
              className="flex items-center justify-center w-10 h-full transition-all cursor-pointer hover:bg-neutral-500/15 active:opacity-75 border-r"
              style={{ color: uiColors.textColor, borderColor: uiColors.borderColor }}
              title="Smooth Zoom Out (-0.75)"
            >
              <ZoomOut size={14} />
            </button>

            {/* SEGMENT 5: Zoom Slider & Readout */}
            <div 
              className="flex items-center gap-2 px-3 h-full shrink-0 border-r"
              style={{ borderColor: uiColors.borderColor }}
            >
              <input 
                type="range"
                min="1"
                max="18"
                step="0.1"
                value={zoom}
                onChange={(e) => handleSmoothZoom(Number(e.target.value) - zoom)}
                className="w-18 cursor-pointer h-1.5 rounded-lg accent-[var(--bright-accent)]"
                style={{ accentColor: uiColors.accentColor }}
                title={`Zoom Level: Z${zoom.toFixed(1)}`}
              />
              <span className="text-[10px] font-mono font-bold w-9 text-center shrink-0" style={{ color: uiColors.accentColor }}>
                Z{zoom.toFixed(1)}
              </span>
            </div>

            {/* SEGMENT 6: Zoom In Button */}
            <button 
              type="button"
              onClick={() => handleSmoothZoom(+0.75)}
              className="flex items-center justify-center w-10 h-full transition-all cursor-pointer hover:bg-neutral-500/15 active:opacity-75 border-r"
              style={{ color: uiColors.textColor, borderColor: uiColors.borderColor }}
              title="Smooth Zoom In (+0.75)"
            >
              <ZoomIn size={14} />
            </button>

            {/* SEGMENT 5: Custom Export Format Dropdown Popover */}
            <div 
              className="relative shrink-0 h-full flex items-center border-r" 
              ref={formatDropdownRef}
              style={{ borderColor: uiColors.borderColor }}
            >
              <button
                type="button"
                onClick={() => setIsFormatDropdownOpen(!isFormatDropdownOpen)}
                className="flex items-center justify-center gap-1.5 w-[76px] h-full font-mono font-bold text-xs transition-colors cursor-pointer hover:bg-neutral-500/10 active:opacity-75"
                style={{
                  color: uiColors.textColor,
                }}
                title="Select Export Format"
              >
                <span className="uppercase">{exportFormat}</span>
                <ChevronDown size={13} className={`transition-transform duration-200 ${isFormatDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isFormatDropdownOpen && (
                <div
                  className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-44 rounded-2xl border p-1.5 shadow-2xl backdrop-blur-xl z-50 animate-scale-in"
                  style={{
                    backgroundColor: `${uiColors.flyoutBg}FA`,
                    borderColor: uiColors.borderColor,
                    color: uiColors.textColor,
                  }}
                >
                  {[
                    { value: 'png' as ExportFormat, label: 'PNG', desc: 'Lossless 4K Image' },
                    { value: 'jpeg' as ExportFormat, label: 'JPG', desc: 'Compressed Image' },
                    { value: 'webp' as ExportFormat, label: 'WEBP', desc: 'Next-Gen Web Format' },
                    { value: 'pdf' as ExportFormat, label: 'PDF', desc: 'Print-Ready Vector Doc' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setExportFormat(opt.value);
                        setIsFormatDropdownOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-left transition-all hover:bg-neutral-500/20 cursor-pointer"
                      style={
                        exportFormat === opt.value
                          ? { backgroundColor: `${uiColors.accentColor}20`, color: uiColors.accentColor }
                          : {}
                      }
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-xs uppercase">{opt.label}</span>
                        <span className="text-[9px] opacity-60 font-sans">{opt.desc}</span>
                      </div>
                      {exportFormat === opt.value && <Check size={13} className="shrink-0" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* SEGMENT 6: Download Action Button (Rightmost Full-Bleed) */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center justify-center gap-1.5 w-[124px] h-full font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer hover:opacity-90 active:opacity-75 shrink-0 rounded-r-2xl"
              style={{
                backgroundColor: uiColors.accentColor,
                color: uiColors.activeItemText,
              }}
              title={`Export 4K Ultra-HD ${exportFormat.toUpperCase()} Poster`}
            >
              <Download size={13} className={downloading ? 'animate-bounce' : ''} />
              <span className="whitespace-nowrap">{downloading ? 'Exporting...' : 'DOWNLOAD'}</span>
            </button>
          </div>
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
          // action bar props
          showPosterFrame={showPosterFrame}
          setShowPosterFrame={setShowPosterFrame}
          isMapLocked={isMapLocked}
          setIsMapLocked={setIsMapLocked}
          rotationEnabled={rotationEnabled}
          setRotationEnabled={setRotationEnabled}
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

