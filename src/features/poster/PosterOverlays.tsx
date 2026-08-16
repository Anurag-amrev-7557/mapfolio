import React from 'react';
import type { MapTheme, RouteData, LayerVisibilityState } from '@/core';

interface PosterOverlaysProps {
  currentTheme: MapTheme;
  effectiveFontScale: number;
  showGradientOverlay: boolean;
  borderStyle: 'none' | 'thin' | 'double' | 'rounded' | 'art-deco';
  showCompass: boolean;
  showScaleBar: boolean;
  showRouteStats: boolean;
  zoom: number;
  title: string;
  route: RouteData;
  routeWaypoints: { lat: number; lng: number }[];
  layerVisibility: LayerVisibilityState;
  weatherPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center';
}

export const PosterOverlays: React.FC<PosterOverlaysProps> = ({
  currentTheme,
  effectiveFontScale,
  showGradientOverlay,
  borderStyle,
  showCompass,
  showScaleBar,
  showRouteStats,
  zoom,
  title,
  route,
  routeWaypoints,
  layerVisibility,
  weatherPosition,
}) => {
  return (
    <>
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
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">GAIN</span>
            <span className="text-xs font-mono font-black text-emerald-500">+{route.elevationGainMeters || 120} M</span>
          </div>
          <div className="w-px h-6 bg-current opacity-20" />
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-mono uppercase tracking-wider opacity-70">EST. TIME</span>
            <span className="text-xs font-mono font-black">{route.durationMin || Math.round((route.distanceKm || 12.4) * 1.8)} MIN</span>
          </div>
        </div>
      )}

      {/* Route Elevation Profile Badge on Poster */}
      {route.showElevationProfile && route.elevationProfile && route.elevationProfile.length > 2 && (
        <div 
          className="absolute bottom-24 left-6 z-20 pointer-events-none backdrop-blur-md rounded-2xl border p-3 flex flex-col gap-1.5 shadow-xl"
          style={{
            backgroundColor: `${currentTheme.palette.land}E6`,
            borderColor: `${currentTheme.palette.roads.major}40`,
            color: currentTheme.palette.roads.major,
            width: `${Math.round(220 * effectiveFontScale)}px`,
            transform: `scale(${Math.max(0.7, Math.min(1.3, effectiveFontScale))})`,
            transformOrigin: 'bottom left',
          }}
        >
          <div className="flex items-center justify-between text-[9px] font-mono font-bold">
            <span className="uppercase opacity-75">ROUTE ELEVATION</span>
            <span className="text-emerald-500">+{route.elevationGainMeters || 0}m</span>
          </div>
          <svg viewBox="0 0 200 40" className="w-full h-8 overflow-visible" preserveAspectRatio="none">
            <defs>
              <linearGradient id="posterElevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={route.color || currentTheme.palette.roads.major} stopOpacity="0.4" />
                <stop offset="100%" stopColor={route.color || currentTheme.palette.roads.major} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <polygon
              points={`0,40 ${route.elevationProfile.map((p: { distanceKm: number; elevationMeters: number }, i: number) => `${(i / (route.elevationProfile!.length - 1)) * 200},${40 - ((p.elevationMeters - (route.minElevationMeters || 0)) / Math.max(10, (route.maxElevationMeters || 100) - (route.minElevationMeters || 0))) * 34}`).join(' ')} 200,40`}
              fill="url(#posterElevGrad)"
            />
            <polyline
              points={route.elevationProfile.map((p: { distanceKm: number; elevationMeters: number }, i: number) => `${(i / (route.elevationProfile!.length - 1)) * 200},${40 - ((p.elevationMeters - (route.minElevationMeters || 0)) / Math.max(10, (route.maxElevationMeters || 100) - (route.minElevationMeters || 0))) * 34}`).join(' ')}
              fill="none"
              stroke={route.color || currentTheme.palette.roads.major}
              strokeWidth="2"
            />
          </svg>
          <div className="flex items-center justify-between text-[8px] font-mono opacity-65">
            <span>0 km</span>
            <span>Peak: {route.maxElevationMeters || 0}m</span>
            <span>{route.distanceKm || 0} km</span>
          </div>
        </div>
      )}

      {/* Live Weather Overlay Badge */}
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
    </>
  );
};
