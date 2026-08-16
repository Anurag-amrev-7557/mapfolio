/**
 * Smart Location Search Component
 * AI-powered location discovery with semantic search
 */

import { useState } from 'react';
import { Search, Loader2, MapPin, Mountain, Camera, Sparkles, MapPin as PinIcon, Trees } from 'lucide-react';
import { useMapStore } from '../store/useMapStore';
import { aiService } from '../services/aiService';
import { getUIThemeColors } from '../utils/themeColors';

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
  { id: 'scenic', label: 'Scenic Views', icon: Camera },
  { id: 'urban', label: 'Urban Areas', icon: MapPin },
  { id: 'nature', label: 'Nature Spots', icon: Mountain },
  { id: 'quiet', label: 'Quiet Places', icon: Sparkles },
];

export function SmartLocationSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [searchCriteria, setSearchCriteria] = useState<Record<string, boolean>>({});
  const [selectedFilters, setSelectedFilters] = useState<string[]>(['scenic']);

  const { setLocation, setText, addMarker, themeId, colorOverrides, customThemes } = useMapStore();

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const headingColor = uiColors.headingColor;
  const textColor = uiColors.textColor;
  const brightAccent = uiColors.brightAccent;
  const subtextColor = uiColors.subtextColor;

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      const preferences: Record<string, any> = {};
      selectedFilters.forEach(filter => {
        preferences[`prefer_${filter}`] = true;
      });

      const response = await aiService.discoverLocations({
        query,
        preferences,
        limit: 8,
      });

      console.log('Location discovery response:', response);

      if (response.success && response.results) {
        setResults(response.results);
        setSearchCriteria(response.criteria);
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

  const getSceneryIcon = (sceneryType: string) => {
    switch (sceneryType) {
      case 'mountain': return Mountain;
      case 'coastal': return Camera;
      case 'park': return Sparkles;
      case 'urban': return MapPin;
      case 'viewpoint': return Camera;
      case 'forest': return Trees;
      case 'beach': return Camera;
      case 'lake': return Camera;
      case 'river': return Camera;
      default: return PinIcon;
    }
  };

  return (
    <div className="flex flex-col gap-0 h-full">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: borderColor }}>
        <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
          SMART LOCATION DISCOVERY
        </span>
        <div className="flex items-center gap-1 text-[11px] font-sans font-bold px-2 py-1 rounded-lg" style={{ 
          color: brightAccent,
          backgroundColor: `${brightAccent}15`
        }}>
          <Search size={12} />
          <span>AI POWERED</span>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex flex-col px-0.5 pt-3 pb-4 gap-3 overflow-y-auto flex-1">
        {/* Search Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-sans font-bold tracking-wider uppercase" style={{ color: headingColor }}>
            Describe Your Ideal Location
          </label>
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Scenic mountain viewpoints, peaceful beaches..."
              className="w-full bg-neutral-800 border rounded-lg pl-9 pr-3 py-2.5 text-xs focus:outline-none transition-all duration-200 focus:ring-2"
              style={{ 
                borderColor: borderColor, 
                color: textColor, 
                backgroundColor: cardBg,
                borderRadius: '8px'
              }}
              disabled={isSearching}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: subtextColor }} />
          </div>
        </div>

        {/* Preference Filters */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-sans font-bold tracking-wider uppercase" style={{ color: headingColor }}>
            Preferences
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {FILTER_OPTIONS.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedFilters.includes(filter.id);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id)}
                  className={`p-2 rounded text-[11px] font-sans font-bold capitalize transition-all flex items-center justify-center gap-1.5 ${
                    isSelected ? 'text-white' : 'text-neutral-400 hover:text-neutral-300'
                  }`}
                  style={{
                    backgroundColor: isSelected ? brightAccent : cardBg,
                    border: isSelected ? 'none' : `1px solid ${borderColor}`,
                    borderRadius: '8px',
                  }}
                >
                  <Icon size={12} />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={isSearching || !query.trim()}
          className="w-full h-[36px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-sans font-bold border transition-all duration-200 cursor-pointer shadow-sm shrink-0 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: brightAccent,
            color: '#ffffff',
            borderColor: brightAccent,
            borderRadius: '10px',
          }}
        >
          {isSearching ? (
            <>
              <Loader2 className="animate-spin" size={14} />
              <span>Discovering...</span>
            </>
          ) : (
            <>
              <Search size={14} />
              <span>Discover Locations</span>
            </>
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="text-xs p-3 rounded-lg border" style={{ 
            color: '#ef4444', 
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            borderColor: 'rgba(239, 68, 68, 0.2)',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}

        {/* Detected Criteria */}
        {searchCriteria && Object.values(searchCriteria).some(Boolean) && (
          <div className="flex flex-col gap-1.5 p-3 rounded-lg border" style={{ backgroundColor: cardBg, borderColor: borderColor, borderRadius: '8px' }}>
            <span className="text-[11px] font-sans font-bold tracking-wider uppercase" style={{ color: headingColor }}>
              Detected Criteria
            </span>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(searchCriteria).map(([key, value]) => 
                value ? (
                  <span key={key} className="text-[11px] px-2.5 py-1 rounded-full" style={{ 
                    backgroundColor: `${brightAccent}15`,
                    color: brightAccent,
                    borderRadius: '12px'
                  }}>
                    {key}
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}

        {/* Results - Full height */}
        {results.length > 0 && (
          <div className="flex flex-col gap-2 flex-1 min-h-0">
            <div className="flex items-center justify-between shrink-0">
              <span className="text-[11px] font-sans font-bold tracking-wider uppercase" style={{ color: headingColor }}>
                Found {results.length} Locations
              </span>
              <span className="text-[11px]" style={{ color: subtextColor }}>
                Sorted by relevance
              </span>
            </div>
            <div className="flex flex-col gap-2 overflow-y-auto flex-1 pr-1">
              {results.map((result, index) => {
                const SceneryIcon = getSceneryIcon(result.features?.scenery_type || 'default');
                return (
                  <button
                    key={index}
                    onClick={() => selectLocation(result)}
                    className="w-full p-3 rounded-lg text-left transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm hover:shadow-md"
                    style={{ 
                      backgroundColor: cardBg, 
                      border: `1px solid ${borderColor}`,
                      borderRadius: '10px'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold truncate" style={{ color: textColor }}>
                          {result.name}
                        </div>
                        <div className="text-[11px] mt-1.5 truncate" style={{ color: subtextColor }}>
                          {result.description}
                        </div>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ 
                            backgroundColor: `${brightAccent}15`,
                            color: brightAccent,
                            borderRadius: '10px'
                          }}>
                            <SceneryIcon size={10} />
                            {result.features?.scenery_type || 'location'}
                          </span>
                          <span className="text-[11px] font-medium" style={{ color: brightAccent }}>
                            {Math.round(result.match_score * 100)}% match
                          </span>
                        </div>
                      </div>
                      <PinIcon size={14} style={{ color: brightAccent }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* No results message */}
        {!isSearching && results.length === 0 && query && (
          <div className="text-xs p-4 rounded-lg border text-center" style={{ 
            color: subtextColor,
            backgroundColor: cardBg,
            borderColor: borderColor,
            borderRadius: '10px'
          }}>
            No locations found. Try a different search term.
          </div>
        )}
      </div>
    </div>
  );
}
