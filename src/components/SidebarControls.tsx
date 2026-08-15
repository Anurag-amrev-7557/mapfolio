import { useState } from 'react';
import { Search, Map as MapIcon, Palette, Download, LayoutTemplate, Type, MapPin, Sliders } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { LAYOUTS, type LayoutType } from '../constants/layouts';
import { exportPosterCanvas, type ExportFormat } from '../utils/mapExport';
import { ThemeSelector } from './ThemeSelector';
import { FONT_OPTIONS, getFontByValue } from '../constants/fonts';

export default function SidebarControls() {
  const {
    setLocation,
    setText,
    setLayout,
    activeLayout,
    lat,
    lng,
    zoom,
    title,
    subtitle,
    fontFamily,
    themeId,
    showTextOverlay,
    showGradientOverlay,
    markers,
    clearMarkers,
    route,
    routeWaypoints,
    letterSpacingMultiplier = 1.0,
    setLetterSpacingMultiplier
  } = useMapStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await res.json();

      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        
        const nameParts = result.display_name.split(',');
        const newTitle = nameParts[0].trim().toUpperCase();
        const newSubtitle = nameParts.length > 1 ? nameParts[nameParts.length - 1].trim().toUpperCase() : 'MAP POSTER';

        setLocation(newLat, newLng, 12);
        setText(newTitle, newSubtitle);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
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
      setExporting(false);
    }
  };

  const currentFont = getFontByValue(useMapStore((state) => state.fontFamily));

  return (
    <div className="flex flex-col gap-8">
      {/* Search Block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <MapIcon size={16} /> Location
        </h3>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            placeholder="Search city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-neutral-900 border border-neutral-700 text-white px-3 py-2 rounded-md text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Search size={18} />
          </button>
        </form>
        
        {/* Live Coordinates Display */}
        <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800 font-mono text-xs text-neutral-400 flex flex-col gap-1 mt-2">
          <span>Lat: {lat.toFixed(4)}</span>
          <span>Lng: {lng.toFixed(4)}</span>
          <span>Zoom: {zoom.toFixed(2)}</span>
        </div>
      </section>

      {/* Typography Block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Type size={16} /> Typography
        </h3>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-neutral-400 font-medium flex justify-between">
              <span>Font Family</span>
              <span className="text-blue-400 font-mono uppercase text-[10px]">{currentFont.category}</span>
            </label>
            <select
              value={useMapStore((state) => state.fontFamily)}
              onChange={(e) => useMapStore.getState().setFontFamily(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-sm rounded-lg p-2.5 focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
            >
              {FONT_OPTIONS.map((font) => (
                <option key={font.id} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label} ({font.category.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Letter Spacing Adjustment Slider */}
          <div className="flex flex-col gap-2 p-3 bg-neutral-900/80 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between text-xs text-neutral-300 font-medium">
              <span className="flex items-center gap-1.5"><Sliders size={13} className="text-blue-400" /> Letter Spacing</span>
              <span className="font-mono text-blue-400 font-bold">{letterSpacingMultiplier.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={letterSpacingMultiplier}
              onChange={(e) => setLetterSpacingMultiplier(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <div className="flex justify-between gap-1 text-[9px] font-mono text-neutral-400 pt-1">
              <span>Default: {currentFont.titleTracking}</span>
              <span>Effective: {(parseFloat(currentFont.titleTracking) * letterSpacingMultiplier).toFixed(2)}em</span>
            </div>
          </div>
        </div>
      </section>

      {/* Layout Block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <LayoutTemplate size={16} /> Layout
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {LAYOUTS.map((layout: LayoutType) => (
            <button
              key={layout.id}
              onClick={() => setLayout(layout)}
              className={`px-3 py-2 rounded-md text-xs font-medium border transition-all text-left flex justify-between items-center ${
                activeLayout.id === layout.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_10px_rgba(37,99,235,0.3)]' 
                  : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
              }`}
            >
              <span>{layout.name}</span>
              <span className="text-[10px] font-mono text-neutral-400">{layout.aspectRatio}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Markers Block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <MapPin size={16} /> Markers
        </h3>
        <div className="flex items-center justify-between bg-neutral-900 border border-neutral-700 p-3 rounded-md">
          <span className="text-sm text-neutral-300">
            {markers.length} {markers.length === 1 ? 'Marker' : 'Markers'} Dropped
          </span>
          <button
            onClick={clearMarkers}
            disabled={markers.length === 0}
            className="text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-red-900/50"
          >
            Clear All
          </button>
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Click anywhere on the map to drop a pin.
        </p>
      </section>

      {/* Theme Palettes Block */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
          <Palette size={16} /> Theme Palettes
        </h3>
        <ThemeSelector />
      </section>

      {/* Export Block */}
      <section className="pt-4 border-t border-neutral-800 space-y-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-neutral-400 font-medium">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {(['png', 'jpeg', 'webp'] as const).map((fmt) => (
              <button
                key={fmt}
                type="button"
                onClick={() => setExportFormat(fmt)}
                className={`py-1.5 text-xs font-mono font-bold rounded-md border uppercase transition-colors ${
                  exportFormat === fmt
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-neutral-900 border-neutral-700 text-neutral-300 hover:border-neutral-500'
                }`}
              >
                {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
        >
          <Download size={20} />
          {exporting ? 'Generating Image...' : `Download Poster (${exportFormat === 'jpeg' ? 'JPG' : exportFormat.toUpperCase()})`}
        </button>
        <p className="text-xs text-neutral-500 text-center mt-2">
          Exports as high-resolution {exportFormat.toUpperCase()} suitable for printing.
        </p>
      </section>
    </div>
  );
}
