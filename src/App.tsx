import PosterMap from './components/PosterMap';
import { IconNavSidebar, ActiveTabFlyout } from './components/IconNavSidebar';
import type { NavTab } from './components/IconNavSidebar';
import { useMapStore } from './store/useMapStore';
import { getTheme } from './constants/themes';
import { getFontByValue } from './constants/fonts';
import { Lock, RotateCw, ZoomIn, ZoomOut, Download, Info, Maximize2, Minimize2, ChevronDown, Check } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { exportPosterCanvas, type ExportFormat } from './utils/mapExport';
import { getUIThemeColors } from './utils/themeColors';
    
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
    route,
    routeWaypoints,
    autoScaleToViewport,
  } = useMapStore();

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

  // Smooth camera zoom handler
  const handleSmoothZoom = (deltaZoom: number) => {
    const targetZoom = Math.min(18, Math.max(1, zoom + deltaZoom));
    const mapInstance = window.__mapboxInstance;
    if (mapInstance) {
      try {
        mapInstance.easeTo({
          zoom: targetZoom,
          duration: 450,
          easing: (t: number) => t * (2 - t),
        });
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
        markersData: markers,
        routeWaypoints,
        routeColor: route.color,
        routeWaypointSize: route.waypointSize,
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

  return (
    <div className="flex h-screen w-screen bg-[#11161d] text-white font-sans overflow-hidden select-none">
      {/* Icon Navigation Bar */}
      <IconNavSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Canvas Area */}
      <main className="flex-1 relative flex flex-col items-center justify-between overflow-hidden bg-[#181c22]">
        {/* Flyout Panel — attached to left edge, slides in/out horizontally */}
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
            className="w-full h-full overflow-hidden"
            style={{
              borderRadius: '0 16px 16px 0',
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
        {/* 1. Single Interactive Map Engine (Full Screen) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <PosterMap 
            interactive={true} 
            bgZoomOffset={0} 
            mapLocked={isMapLocked} 
            rotationEnabled={rotationEnabled} 
          />
        </div>

        {/* 2. Top-Right Floating Current Settings Card */}
        <div 
          className="absolute top-6 right-6 z-20 backdrop-blur-md border rounded-xl p-4 text-xs shadow-2xl w-80 pointer-events-auto transition-colors"
          style={{
            backgroundColor: `${uiColors.flyoutBg}EA`,
            borderColor: uiColors.borderColor,
            color: uiColors.textColor,
          }}
        >
          <div className="font-mono text-[10px] tracking-[0.18em] font-semibold mb-3 uppercase" style={{ color: uiColors.subtextColor }}>
            CURRENT SETTINGS
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
                    <span>© terraink.app</span>
                    <span>© OpenStreetMap contributors</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Action Controls Toolbar - Unified Full-Segmented Bar */}
          <div 
            className="flex items-stretch backdrop-blur-xl h-10 rounded-2xl border shadow-2xl text-xs z-30 shrink-0 my-3 pointer-events-auto transition-all duration-300 ease-out mx-auto overflow-hidden select-none"
            style={{
              backgroundColor: `${uiColors.flyoutBg}F2`,
              borderColor: uiColors.borderColor,
              color: uiColors.textColor,
            }}
          >
            {/* SEGMENT 1: Toggle Poster Frame vs Full Map View */}
            <button 
              type="button"
              onClick={() => setShowPosterFrame(!showPosterFrame)}
              className="flex items-center justify-center gap-1.5 w-[146px] h-full font-medium transition-all duration-200 cursor-pointer hover:opacity-90 active:opacity-75 border-r"
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

            {/* SEGMENT 4: Zoom Navigation Controls */}
            <div 
              className="flex items-center gap-1.5 px-3 h-full shrink-0 border-r"
              style={{ borderColor: uiColors.borderColor }}
            >
              {/* Smooth Zoom Out Button */}
              <button 
                type="button"
                onClick={() => handleSmoothZoom(-0.75)}
                className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-neutral-500/20 hover:scale-110 active:scale-95"
                style={{ color: uiColors.textColor }}
                title="Smooth Zoom Out (-0.75)"
              >
                <ZoomOut size={13} />
              </button>

              {/* Interactive Zoom Level Slider & Readout */}
              <div className="flex items-center gap-2 px-1">
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

              {/* Smooth Zoom In Button */}
              <button 
                type="button"
                onClick={() => handleSmoothZoom(+0.75)}
                className="p-1.5 rounded-lg transition-all cursor-pointer hover:bg-neutral-500/20 hover:scale-110 active:scale-95"
                style={{ color: uiColors.textColor }}
                title="Smooth Zoom In (+0.75)"
              >
                <ZoomIn size={13} />
              </button>
            </div>

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
              className="flex items-center justify-center gap-1.5 w-[124px] h-full font-bold shadow-lg transition-all disabled:opacity-50 cursor-pointer hover:opacity-90 active:opacity-75 shrink-0"
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

        {/* Global Footer Status Bar */}
        <footer className="w-full h-8 bg-[#0a0d12] border-t border-neutral-800/80 px-4 flex items-center justify-between text-[11px] text-neutral-400 z-20 shrink-0 font-mono">
          <div className="flex items-center gap-3">
            <a href="#" className="hover:text-neutral-200 transition-colors">hello@terraink.app</a>
            <span>|</span>
            <a href="#" className="hover:text-neutral-200 transition-colors">Imprint</a>
            <span>|</span>
            <a href="#" className="hover:text-neutral-200 transition-colors">Data Privacy</a>
            <span>|</span>
            <a href="#" className="hover:text-neutral-200 transition-colors">Cookie Settings</a>
          </div>

          <div>
            Terraink™ v0.4.2 | Layout: <span className="font-bold" style={{ color: uiColors.accentColor }}>{activeLayout.name} ({activeLayout.widthPx}x{activeLayout.heightPx})</span> | Font: <span className="text-emerald-400 font-bold">{selectedFontObj.label} ({letterSpacingMultiplier}x)</span> | Made with <span className="text-red-500">❤️</span> in Hannover, Germany
          </div>

          <div className="flex items-center gap-1">
            <span>Map data ©OpenStreetMap contributors</span>
            <Info size={12} className="cursor-pointer hover:text-white" />
          </div>
        </footer>
      </main>
    </div>
  );
}

export default App;

