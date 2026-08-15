import PosterMap from './components/PosterMap';
import { IconNavSidebar, ActiveTabFlyout } from './components/IconNavSidebar';
import type { NavTab } from './components/IconNavSidebar';
import { useMapStore } from './store/useMapStore';
import { getTheme } from './constants/themes';
import { getFontByValue } from './constants/fonts';
import { Lock, RotateCw, ZoomIn, ZoomOut, Download, Info } from 'lucide-react';
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
  const [rotationEnabled, setRotationEnabled] = useState(false);
  const [isMapLocked, setIsMapLocked] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab | null>('theme');

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

  // Scale multiplier for overlay typography inside poster frame
  const overlayScale = Math.min(activeLayout.widthPx, activeLayout.heightPx) / 1000;

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

  return (
    <div className="flex h-screen w-screen bg-[#11161d] text-white font-sans overflow-hidden select-none">
      {/* Icon Navigation Bar */}
      <IconNavSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Flyout Panel for Active Tab */}
      {activeTab && <ActiveTabFlyout activeTab={activeTab} />}

      {/* Main Canvas Area */}
      <main className="flex-1 relative flex flex-col items-center justify-between overflow-hidden bg-[#181c22]">
        {/* 1. Less Dim Unblurred Zoomed Map Behind */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute -inset-5 opacity-90 scale-105 filter brightness-100 contrast-100">
            <PosterMap interactive={false} scaleFactor={1} bgZoomOffset={2.5} />
          </div>
          {/* Subtle light overlay */}
          <div className="absolute inset-0 bg-black/5" />
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
          className="flex-1 w-full flex flex-col items-center justify-between relative z-10 px-4 pt-2 pb-4 overflow-visible"
        >
          {/* Poster Frame Center Area */}
          <div className="flex-1 w-full flex items-center justify-center overflow-visible">
            {/* Poster Frame Container Wrapper matching scaled bounds */}
            <div 
              className="relative flex items-center justify-center shrink-0 my-auto"
              style={{
                width: `${activeLayout.widthPx * scaleFactor}px`,
                height: `${activeLayout.heightPx * scaleFactor}px`,
              }}
            >
              {/* Exact Map Rectangle Frame */}
              <div
                id="poster-frame"
                className="bg-white shadow-[0_25px_60px_rgba(0,0,0,0.65)] absolute flex flex-col shrink-0 origin-center transition-transform duration-300 overflow-hidden rounded-[1rem] border border-white/5"
                style={{
                  width: `${activeLayout.widthPx}px`,
                  height: `${activeLayout.heightPx}px`,
                  backgroundColor: currentTheme.palette.land,
                  transform: `scale(${scaleFactor})`,
                }}
              >
                {/* Full-bleed Map Canvas Layer */}
                <div className="absolute inset-0 z-0">
                  <PosterMap 
                    interactive={true} 
                    scaleFactor={scaleFactor} 
                    mapLocked={isMapLocked} 
                    rotationEnabled={rotationEnabled} 
                  />
                </div>

                {/* Top & Bottom Theme-Aware Gradient Overlay */}
                {showGradientOverlay && (
                  <>
                    <div
                      className="absolute inset-x-0 top-0 z-10 pointer-events-none"
                      style={{
                        height: `${Math.round(120 * overlayScale)}px`,
                        background: `linear-gradient(to bottom, ${currentTheme.palette.land}B3 0%, ${currentTheme.palette.land}40 60%, transparent 100%)`,
                      }}
                    />
                    <div
                      className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
                      style={{
                        height: `${Math.round(260 * overlayScale)}px`,
                        background: `linear-gradient(to top, ${currentTheme.palette.land}E6 35%, ${currentTheme.palette.land}70 70%, transparent 100%)`,
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
                      paddingBottom: `${Math.round(30 * overlayScale)}px`,
                      paddingTop: `${Math.round(40 * overlayScale)}px`,
                      paddingLeft: `${Math.round(28 * overlayScale)}px`,
                      paddingRight: `${Math.round(28 * overlayScale)}px`,
                    }}
                  >
                    {/* Larger Main Poster Title - Generous tracking & comfortable line-height */}
                    <h2 
                      className="font-black uppercase drop-shadow-xl transition-all"
                      style={{
                        fontSize: `${Math.round(
                          title.length > 20 ? 42 * overlayScale :
                          title.length > 14 ? 48 * overlayScale : 58 * overlayScale
                        )}px`,
                        letterSpacing: titleLetterSpacing,
                        lineHeight: 1.15,
                        marginBottom: `${Math.round(16 * overlayScale)}px`,
                      }}
                    >
                      {title}
                    </h2>

                    {/* Elegant Accent Divider Line */}
                    <div
                      className="rounded-full opacity-90 shadow-sm transition-all"
                      style={{ 
                        backgroundColor: currentTheme.palette.roads.major,
                        width: `${Math.round(220 * overlayScale * (letterSpacingMultiplier >= 1.2 ? 1.15 : 1))}px`,
                        height: `${Math.max(2, Math.round(3.5 * overlayScale))}px`,
                      }}
                    />

                    {/* Country Subtitle - Generous letter spacing */}
                    <p 
                      className="font-semibold uppercase opacity-90 drop-shadow transition-all"
                      style={{
                        fontSize: `${Math.round(19 * overlayScale)}px`,
                        letterSpacing: subLetterSpacing,
                        lineHeight: 1.35,
                        marginTop: `${Math.round(16 * overlayScale)}px`,
                      }}
                    >
                      {subtitle}
                    </p>

                    {/* Precise Coordinate Display - Monospace spacing */}
                    <p 
                      className="font-mono font-medium opacity-80 drop-shadow transition-all"
                      style={{
                        fontSize: `${Math.round(11.5 * overlayScale)}px`,
                        letterSpacing: coordLetterSpacing,
                        lineHeight: 1.4,
                        marginTop: `${Math.round(12 * overlayScale)}px`,
                      }}
                    >
                      {Math.abs(lat).toFixed(4)}° {lat >= 0 ? 'N' : 'S'} / {Math.abs(lng).toFixed(4)}° {lng >= 0 ? 'E' : 'W'}
                    </p>

                    {/* Watermarks */}
                    <div 
                      className="w-full flex justify-between items-center font-mono opacity-50 drop-shadow transition-all"
                      style={{
                        fontSize: `${Math.round(9.5 * overlayScale)}px`,
                        letterSpacing: '0.18em',
                        marginTop: `${Math.round(28 * overlayScale)}px`,
                        paddingLeft: `${Math.round(16 * overlayScale)}px`,
                        paddingRight: `${Math.round(16 * overlayScale)}px`,
                      }}
                    >
                      <span>© terraink.app</span>
                      <span>© OpenStreetMap contributors</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Controls Toolbar */}
          <div 
            className="flex items-center gap-3 backdrop-blur-md px-4 py-2 rounded-xl border shadow-2xl text-xs z-30 shrink-0 mt-2 mb-2 transform -translate-y-1 transition-colors"
            style={{
              backgroundColor: `${uiColors.flyoutBg}F2`,
              borderColor: uiColors.borderColor,
              color: uiColors.textColor,
            }}
          >
              {/* Lock Map Control */}
              <button 
                onClick={() => setIsMapLocked(!isMapLocked)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer hover:scale-105"
                style={
                  isMapLocked
                    ? { backgroundColor: '#be123c', color: '#ffffff', borderColor: '#be123c', boxShadow: '0 0 10px rgba(190,18,60,0.4)' }
                    : { backgroundColor: uiColors.cardBg, borderColor: uiColors.borderColor, color: uiColors.textColor }
                }
                title={isMapLocked ? "Unlock Map Navigation & Click Placing" : "Lock Map Position & Stop Map Pan/Zoom"}
              >
                <Lock size={13} />
                <span>{isMapLocked ? 'Map Locked' : 'Lock Map'}</span>
              </button>

              {/* Enable/Disable 3D Rotation */}
              <button
                onClick={() => setRotationEnabled(!rotationEnabled)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all border cursor-pointer hover:scale-105"
                style={
                  rotationEnabled
                    ? { backgroundColor: uiColors.accentColor, color: uiColors.activeItemText, borderColor: uiColors.accentColor }
                    : { backgroundColor: uiColors.cardBg, borderColor: uiColors.borderColor, color: uiColors.textColor }
                }
                title={rotationEnabled ? "Click to Disable 3D Rotation" : "Click to Enable 3D Map Pitch & Bearing Rotation"}
              >
                <RotateCw size={13} className={rotationEnabled ? 'animate-spin' : ''} />
                <span>{rotationEnabled ? '3D Rotation On' : 'Enable Rotation'}</span>
              </button>

              <div className="h-4 w-[1px] my-auto mx-1" style={{ backgroundColor: uiColors.borderColor }} />

              {/* Zoom Out Button */}
              <button 
                onClick={() => setLocation(lat, lng, Math.max(1, zoom - 0.5))}
                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-neutral-500/20"
                style={{ color: uiColors.textColor }}
                title="Zoom Out (-0.5)"
              >
                <ZoomOut size={14} />
              </button>

              {/* Interactive Zoom Level Slider & Readout */}
              <div className="flex items-center gap-1.5">
                <input
                  type="range"
                  min="1"
                  max="18"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setLocation(lat, lng, Number(e.target.value))}
                  className="w-20 cursor-pointer h-1.5 rounded-lg accent-[var(--bright-accent)]"
                  style={{ accentColor: uiColors.accentColor }}
                  title={`Zoom Level: Z${zoom.toFixed(1)}`}
                />
                <span className="text-[10px] font-mono font-bold w-10 text-center shrink-0" style={{ color: uiColors.accentColor }}>
                  Z{zoom.toFixed(1)}
                </span>
              </div>

              {/* Zoom In Button */}
              <button 
                onClick={() => setLocation(lat, lng, Math.min(18, zoom + 0.5))}
                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:bg-neutral-500/20"
                style={{ color: uiColors.textColor }}
                title="Zoom In (+0.5)"
              >
                <ZoomIn size={14} />
              </button>

              <div className="h-4 w-[1px] my-auto mx-1" style={{ backgroundColor: uiColors.borderColor }} />

              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
                className="text-xs rounded-lg px-2.5 py-1.5 focus:outline-none transition-colors cursor-pointer uppercase font-mono font-bold border"
                style={{
                  backgroundColor: uiColors.cardBg,
                  borderColor: uiColors.borderColor,
                  color: uiColors.textColor,
                }}
              >
                <option value="png">PNG</option>
                <option value="jpeg">JPG</option>
                <option value="webp">WEBP</option>
              </select>

              <button
                onClick={handleDownload}
                disabled={downloading}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold shadow-lg transition-all disabled:opacity-50 cursor-pointer hover:scale-105"
                style={{
                  backgroundColor: uiColors.accentColor,
                  color: uiColors.activeItemText,
                  boxShadow: `0 4px 14px ${uiColors.accentColor}40`,
                }}
              >
                <Download size={13} />
                <span className="tracking-wider">{downloading ? 'Exporting...' : 'DOWNLOAD'}</span>
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

