import React, { useState, useEffect } from 'react';
import {
  Search,
  Crosshair,
  MapPin,
  Compass,
  Minus,
  Plus,
  X,
  Building2,
  Landmark,
  TowerControl,
  Globe2,
  Sparkles,
  Trees,
  History,
  Check,
  Copy,
} from 'lucide-react';
import { useMapStore, getUIThemeColors } from '@/core';

export const LocationPanel: React.FC = () => {
  const {
    lat,
    lng,
    zoom,
    title,
    themeId,
    colorOverrides,
    customThemes,
    setLocation,
    setText,
    addMarker,
  } = useMapStore();

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const cardBg = uiColors.cardBg;
  const flyoutBg = uiColors.flyoutBg;
  const borderColor = uiColors.borderColor;
  const textColor = uiColors.textColor;
  const headingColor = uiColors.headingColor;
  const subtextColor = uiColors.subtextColor;
  const brightAccent = uiColors.brightAccent;
  const dangerText = uiColors.dangerText;

  const [searchQuery, setSearchQuery] = useState('');
  const [locating, setLocating] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  // Search Autocomplete State
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fine-tuning Manual Coordinates State
  const [manualLat, setManualLat] = useState<number>(lat);
  const [manualLng, setManualLng] = useState<number>(lng);

  // Recent Searches State (Limit to top 3 for optimal vertical rhythm)
  const [recentLocations, setRecentLocations] = useState<{ title: string; subtitle: string; lat: number; lng: number }[]>(() => {
    try {
      const saved = localStorage.getItem('mapfolio_recent_locations');
      return saved ? JSON.parse(saved).slice(0, 3) : [];
    } catch {
      return [];
    }
  });

  // Curated Iconic Destinations with ISO Country Codes
  const FEATURED_DESTINATIONS = [
    { city: 'Paris', country: 'France', code: 'FRA', lat: 48.8566, lng: 2.3522, icon: <Landmark size={16} /> },
    { city: 'Tokyo', country: 'Japan', code: 'JPN', lat: 35.6762, lng: 139.6503, icon: <TowerControl size={16} /> },
    { city: 'New York', country: 'United States', code: 'USA', lat: 40.7128, lng: -74.0060, icon: <Building2 size={16} /> },
    { city: 'London', country: 'United Kingdom', code: 'GBR', lat: 51.5074, lng: -0.1278, icon: <Compass size={16} /> },
    { city: 'San Francisco', country: 'United States', code: 'USA', lat: 37.7749, lng: -122.4194, icon: <Trees size={16} /> },
    { city: 'Rome', country: 'Italy', code: 'ITA', lat: 41.9028, lng: 12.4964, icon: <Sparkles size={16} /> },
    { city: 'Amsterdam', country: 'Netherlands', code: 'NLD', lat: 52.3676, lng: 4.9041, icon: <MapPin size={16} /> },
    { city: 'Sydney', country: 'Australia', code: 'AUS', lat: -33.8688, lng: 151.2093, icon: <Globe2 size={16} /> },
  ];

  // Sync manual coordinates with active map position
  useEffect(() => {
    setManualLat(Number(lat.toFixed(4)));
    setManualLng(Number(lng.toFixed(4)));
  }, [lat, lng]);

  // Debounced Search Autocomplete
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
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&addressdetails=1&limit=5`
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
    }, 320);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const selectLocation = (latVal: number, lngVal: number, cityName: string, countryName: string) => {
    setLocation(latVal, lngVal, 12);
    setText(cityName.toUpperCase(), countryName.toUpperCase());
    addMarker(latVal, lngVal, {
      label: cityName.toUpperCase(),
      type: 'pin',
      iconName: 'MapPin',
      color: '#ef4444',
      size: 36,
    });
    setShowSuggestions(false);
    setSearchQuery('');

    // Save to Recent Searches (top 3 items)
    const newEntry = { title: cityName.toUpperCase(), subtitle: countryName.toUpperCase(), lat: latVal, lng: lngVal };
    const updated = [newEntry, ...recentLocations.filter((item) => item.title !== newEntry.title)].slice(0, 3);
    setRecentLocations(updated);
    try {
      localStorage.setItem('mapfolio_recent_locations', JSON.stringify(updated));
    } catch {}
  };

  const removeRecentLocation = (indexToRemove: number) => {
    const updated = recentLocations.filter((_, idx) => idx !== indexToRemove);
    setRecentLocations(updated);
    try {
      localStorage.setItem('mapfolio_recent_locations', JSON.stringify(updated));
    } catch {}
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`
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
      () => {
        console.warn('Browser geolocation failed, falling back to IP location');
        fallbackToIpLocation().finally(() => setLocating(false));
      },
      { timeout: 5000, maximumAge: 60000 }
    );
  };

  const copyCoordinates = () => {
    const coordString = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
    navigator.clipboard.writeText(coordString);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── 1. LOCATION SEARCH & AUTO-DISCOVERY ── */}
      <div className="flex flex-col gap-2 pb-3 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
            LOCATION SEARCH
          </span>
          <span className="text-[10px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
            GLOBAL INDEX
          </span>
        </div>

        {/* Integrated Clean Search Bar */}
        <div className="relative">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: subtextColor }}
            />
            <input
              type="text"
              placeholder="Search city, town, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              className="w-full h-11.5 border pl-10 pr-20 rounded-2xl text-xs font-sans font-semibold focus:outline-none transition-all shadow-xs"
              style={{
                backgroundColor: cardBg,
                borderColor: showSuggestions ? brightAccent : borderColor,
                color: textColor,
              }}
            />

            {/* Action buttons inside the search input pill */}
            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              {isSearching ? (
                <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mr-1" style={{ borderColor: brightAccent }} />
              ) : (
                searchQuery && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setShowSuggestions(false); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-xs opacity-60 hover:opacity-100 hover:bg-neutral-500/15 cursor-pointer"
                    style={{ color: textColor }}
                    title="Clear input"
                  >
                    ✕
                  </button>
                )
              )}

              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={locating}
                title="Auto-detect current GPS location"
                className="w-8 h-8 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50 shadow-xs"
                style={{
                  backgroundColor: flyoutBg,
                  borderColor: `${brightAccent}50`,
                  color: brightAccent,
                }}
              >
                <Crosshair size={16} className={locating ? 'animate-spin' : ''} />
              </button>
            </div>
          </form>

          {/* Autocomplete Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              className="absolute top-full left-0 right-0 mt-1.5 rounded-2xl border shadow-2xl z-50 overflow-hidden backdrop-blur-xl flex flex-col p-1.5 gap-1 max-h-64 overflow-y-auto no-scrollbar"
              style={{ backgroundColor: cardBg, borderColor }}
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
                        <span className="text-[13px] font-extrabold font-sans tracking-tight truncate" style={{ color: textColor }}>
                          {cityName}
                        </span>
                        <span className="text-xs font-sans truncate opacity-85" style={{ color: subtextColor }}>
                          {item.display_name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border shrink-0 opacity-80 font-bold" style={{ backgroundColor: flyoutBg, borderColor, color: subtextColor }}>
                      {item.type || 'place'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 2. PRECISE COORDINATES STEPPER & CONTROLS ── */}
      <div className="flex flex-col gap-2 pb-3 border-b" style={{ borderColor }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass size={15} style={{ color: brightAccent }} />
            <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
              COORDINATES
            </span>
          </div>

          {/* Quick Copy Coordinates Icon Button */}
          <button
            type="button"
            onClick={copyCoordinates}
            className="w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95 shadow-2xs"
            style={{
              backgroundColor: cardBg,
              borderColor: copiedCoords ? '#10b981' : borderColor,
              color: copiedCoords ? '#10b981' : subtextColor,
            }}
            title={copiedCoords ? 'Copied to clipboard!' : `Copy coordinates (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`}
          >
            {copiedCoords ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
          </button>
        </div>

        {/* Dual Coordinates Steppers */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Latitude */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-sans font-extrabold uppercase tracking-wider px-1" style={{ color: subtextColor }}>
              LATITUDE
            </label>
            <div 
              className="h-11 rounded-2xl border flex items-center overflow-hidden transition-all shadow-xs"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <button
                type="button"
                onClick={() => {
                  const nextLat = manualLat - 0.005;
                  setManualLat(nextLat);
                  setLocation(nextLat, manualLng, zoom);
                }}
                className="w-9 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all shrink-0 cursor-pointer"
                style={{ color: textColor }}
                title="Decrease Latitude"
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
                  setLocation(val, manualLng, zoom);
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
                className="w-9 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all shrink-0 cursor-pointer"
                style={{ color: textColor }}
                title="Increase Latitude"
              >
                <Plus size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Longitude */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-sans font-extrabold uppercase tracking-wider px-1" style={{ color: subtextColor }}>
              LONGITUDE
            </label>
            <div 
              className="h-11 rounded-2xl border flex items-center overflow-hidden transition-all shadow-xs"
              style={{ backgroundColor: cardBg, borderColor }}
            >
              <button
                type="button"
                onClick={() => {
                  const nextLng = manualLng - 0.005;
                  setManualLng(nextLng);
                  setLocation(manualLat, nextLng, zoom);
                }}
                className="w-9 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all shrink-0 cursor-pointer"
                style={{ color: textColor }}
                title="Decrease Longitude"
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
                  setLocation(manualLat, val, zoom);
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
                className="w-9 h-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition-all shrink-0 cursor-pointer"
                style={{ color: textColor }}
                title="Increase Longitude"
              >
                <Plus size={14} className="stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. RECENT POSTER SEARCHES (Top 3 Compact Rows) ── */}
      {recentLocations.length > 0 && (
        <div className="flex flex-col gap-2 pb-3 border-b" style={{ borderColor }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <History size={14} style={{ color: brightAccent }} />
              <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
                RECENT SEARCHES
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setRecentLocations([]); localStorage.removeItem('mapfolio_recent_locations'); }}
              className="text-xs font-sans font-bold hover:underline cursor-pointer"
              style={{ color: dangerText }}
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {recentLocations.map((item, idx) => (
              <div
                key={idx}
                className="group relative w-full flex items-center justify-between py-2 px-3 rounded-xl border transition-all hover:scale-[1.008] cursor-pointer shadow-2xs"
                style={{ backgroundColor: cardBg, borderColor }}
                onClick={() => selectLocation(item.lat, item.lng, item.title, item.subtitle)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                  <div 
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border"
                    style={{ backgroundColor: flyoutBg, color: brightAccent, borderColor: `${brightAccent}35` }}
                  >
                    <MapPin size={13} />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-black font-sans uppercase tracking-tight truncate" style={{ color: textColor }}>
                      {item.title}
                    </span>
                    <span className="text-[10.5px] font-sans opacity-75 truncate" style={{ color: subtextColor }}>
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeRecentLocation(idx);
                  }}
                  className="w-6 h-6 rounded-lg flex items-center justify-center opacity-40 hover:opacity-100 hover:bg-rose-500/15 hover:text-rose-500 transition-all cursor-pointer shrink-0"
                  style={{ color: subtextColor }}
                  title="Remove from history"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 4. CURATED ICONIC DESTINATIONS (Symmetrical 2-Column Grid with Country Codes) ── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-sans font-extrabold tracking-wider uppercase" style={{ color: headingColor }}>
            FEATURED CITIES
          </span>
          <span className="text-[10px] font-mono font-bold uppercase opacity-75" style={{ color: subtextColor }}>
            PRESETS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {FEATURED_DESTINATIONS.map((dest) => {
            const isCurrentCity = title.trim().toUpperCase() === dest.city.toUpperCase();
            return (
              <button
                key={dest.city}
                type="button"
                onClick={() => selectLocation(dest.lat, dest.lng, dest.city, dest.country)}
                className={`p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all duration-200 cursor-pointer group shadow-2xs ${
                  isCurrentCity ? 'scale-[1.02]' : 'hover:scale-[1.02]'
                }`}
                style={{
                  backgroundColor: cardBg,
                  borderColor: isCurrentCity ? brightAccent : borderColor,
                  boxShadow: isCurrentCity ? `0 0 0 1.5px ${brightAccent}60, 0 4px 12px ${brightAccent}20` : undefined,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-1">
                  {/* Left Icon Badge */}
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 transition-transform group-hover:scale-105"
                    style={{
                      backgroundColor: flyoutBg,
                      color: brightAccent,
                      borderColor: isCurrentCity ? brightAccent : `${brightAccent}35`,
                    }}
                  >
                    {dest.icon}
                  </div>

                  {/* City & Country */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black font-sans tracking-tight uppercase truncate" style={{ color: textColor }}>
                        {dest.city}
                      </span>
                      {isCurrentCity && (
                        <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: brightAccent }} />
                      )}
                    </div>
                    <span className="text-[10.5px] font-sans truncate opacity-75 leading-tight" style={{ color: subtextColor }}>
                      {dest.country}
                    </span>
                  </div>
                </div>

                {/* Country Code Pill */}
                <span 
                  className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-md border shrink-0 opacity-70"
                  style={{
                    backgroundColor: flyoutBg,
                    borderColor: isCurrentCity ? `${brightAccent}50` : borderColor,
                    color: isCurrentCity ? brightAccent : subtextColor,
                  }}
                >
                  {dest.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
