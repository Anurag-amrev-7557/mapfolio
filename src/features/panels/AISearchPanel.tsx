/**
 * Smart Location Search Component
 * AI-powered location discovery with semantic search
 */

import { useState } from 'react';
import { Search, Loader2, MapPin, Mountain, Camera, Sparkles, ArrowRight } from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';
import { aiService } from '@/features/ai';

interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  description: string;
  match_score: number;
  features: {
    scenery_type: string;
    urban_density: number;
    popularity: number;
    location_type: string;
  };
}

const FILTER_OPTIONS = [
  { id: 'scenic', label: 'Scenic', icon: Camera },
  { id: 'urban', label: 'Urban', icon: MapPin },
  { id: 'nature', label: 'Nature', icon: Mountain },
  { id: 'quiet', label: 'Quiet', icon: Sparkles },
];

const INSPIRATION_PROMPTS = [
  'Tokyo Skyline',
  'Alpine Lakes',
  'Santorini Coast',
  'Central Park',
];

export function AISearchPanel() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['scenic']);

  const { setLocation, setText, addMarker, themeId, colorOverrides, customThemes } = useMapStore();

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const flyoutBg = uiColors.flyoutBg;
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const headingColor = uiColors.headingColor;
  const textColor = uiColors.textColor;
  const brightAccent = uiColors.brightAccent;
  const subtextColor = uiColors.subtextColor;

  const handleSearch = async (overrideQuery?: string) => {
    const q = overrideQuery || query;
    if (!q.trim()) return;
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const preferences: Record<string, any> = {};
      selectedFilters.forEach(filter => {
        preferences[`prefer_${filter}`] = true;
      });

      const response = await aiService.discoverLocations({
        query: q,
        preferences,
        limit: 8,
      });

      if (response.success && response.results) {
        setResults(response.results);
      } else {
        setError(response.error || 'Failed to discover locations');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to discover locations');
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (result: LocationResult) => {
    setLocation(result.lat, result.lon, 14);
    
    const title = result.name.split(',')[0].trim().toUpperCase();
    const subtitle = result.description.split(',').slice(-2).join(',').trim().toUpperCase();
    
    setText(title, subtitle.substring(0, 50));
    addMarker(result.lat, result.lon, {
      label: title,
      type: 'pin',
      iconName: 'MapPin',
      color: '#ef4444',
      size: 36,
    });
  };

  const toggleFilter = (filterId: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterId)
        ? prev.filter(f => f !== filterId)
        : [...prev, filterId]
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ── 1. HEADER & INTEGRATED SEARCH BAR ── */}
      <div className="flex flex-col gap-2.5 pb-3.5 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} style={{ color: brightAccent }} />
            <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              AI DISCOVERY
            </span>
          </div>
          <span className="text-[11px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-xl border shadow-xs" style={{ color: brightAccent, backgroundColor: flyoutBg, borderColor: `${brightAccent}40` }}>
            SEMANTIC AI
          </span>
        </div>

        {/* Integrated Search Input Pill */}
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 pointer-events-none" style={{ color: subtextColor }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Describe any scenic location or vibe..."
            className="w-full h-11 border pl-10 pr-20 rounded-2xl text-xs font-sans font-bold focus:outline-none transition-all shadow-xs"
            style={{ 
              borderColor, 
              color: textColor, 
              backgroundColor: cardBg,
            }}
            disabled={isSearching}
          />
          <div className="absolute right-1.5 flex items-center gap-1">
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="w-6 h-6 rounded-lg flex items-center justify-center text-xs opacity-60 hover:opacity-100 cursor-pointer"
                style={{ color: textColor }}
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => handleSearch()}
              disabled={isSearching || !query.trim()}
              className="h-8 px-3 rounded-xl text-[10px] font-sans font-black tracking-widest uppercase text-white flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: brightAccent }}
            >
              {isSearching ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              <span>FIND</span>
            </button>
          </div>
        </div>

        {/* Preference Filters Segmented Bar */}
        <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl border shadow-xs" style={{ backgroundColor: cardBg, borderColor }}>
          {FILTER_OPTIONS.map((filter) => {
            const Icon = filter.icon;
            const isSelected = selectedFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                type="button"
                onClick={() => toggleFilter(filter.id)}
                className="py-2 flex items-center justify-center gap-1.5 rounded-xl text-[10px] font-sans font-black tracking-wider uppercase transition-all cursor-pointer hover:scale-105 active:scale-95"
                style={
                  isSelected
                    ? { backgroundColor: brightAccent, color: '#ffffff', boxShadow: `0 2px 8px ${brightAccent}40` }
                    : { color: subtextColor }
                }
              >
                <Icon size={14} />
                <span>{filter.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. INSPIRATION PROMPTS (Minimal 2-Column Matrix) ── */}
      {results.length === 0 && !isSearching && (
        <div className="flex flex-col gap-2 pb-3.5 border-b" style={{ borderColor }}>
          <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
            QUICK INSPIRATIONS
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {INSPIRATION_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => {
                  setQuery(prompt);
                  handleSearch(prompt);
                }}
                className="h-10 px-3 rounded-2xl border text-left text-xs font-bold font-sans transition-all hover:scale-[1.02] active:scale-95 cursor-pointer truncate shadow-2xs"
                style={{ backgroundColor: cardBg, borderColor, color: textColor }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 3. RESULTS DISPLAY ── */}
      {error && (
        <div className="text-xs p-3 rounded-2xl border font-sans font-bold shadow-2xs" style={{ 
          color: '#ef4444', 
          backgroundColor: 'rgba(239, 68, 68, 0.08)',
          borderColor: 'rgba(239, 68, 68, 0.2)',
        }}>
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-sans font-black tracking-widest uppercase" style={{ color: headingColor }}>
              DISCOVERED LOCATIONS
            </span>
            <span className="text-[9px] font-sans font-black tracking-widest uppercase opacity-75" style={{ color: subtextColor }}>
              {results.length} MATCHES
            </span>
          </div>

          <div className="flex flex-col rounded-2xl border shadow-2xs overflow-hidden divide-y divide-black/10 dark:divide-white/10" style={{ backgroundColor: cardBg, borderColor }}>
            {results.map((result, index) => {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => selectLocation(result)}
                  className="p-3 text-left transition-all hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer group flex items-center justify-between gap-2"
                >
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black font-sans uppercase tracking-tight truncate" style={{ color: textColor }}>
                        {result.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-emerald-500 shrink-0">
                        {Math.round(result.match_score * 100)}%
                      </span>
                    </div>
                    <span className="text-[10px] font-sans truncate opacity-75 mt-0.5" style={{ color: subtextColor }}>
                      {result.description}
                    </span>
                  </div>

                  <div className="w-7 h-7 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105" style={{ backgroundColor: flyoutBg, borderColor, color: brightAccent }}>
                    <ArrowRight size={13} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
