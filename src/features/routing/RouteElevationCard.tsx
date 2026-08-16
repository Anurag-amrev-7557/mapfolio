import React from 'react';
import { Mountain } from 'lucide-react';
import type { RouteData, UIThemeColors } from '@/core';

interface RouteElevationCardProps {
  route: RouteData;
  uiColors: UIThemeColors;
  onTogglePosterBadge?: () => void;
}

export const RouteElevationCard: React.FC<RouteElevationCardProps> = ({
  route,
  uiColors,
  onTogglePosterBadge,
}) => {
  if (!route.geojson || !route.elevationProfile || route.elevationProfile.length < 2) {
    return null;
  }

  const profile = route.elevationProfile;
  const maxElev = route.maxElevationMeters || Math.max(...profile.map((p) => p.elevationMeters));
  const minElev = route.minElevationMeters || Math.min(...profile.map((p) => p.elevationMeters));
  const range = Math.max(20, maxElev - minElev);

  // Generate SVG Points for smooth area graph
  const svgWidth = 280;
  const svgHeight = 65;
  const paddingY = 6;
  const availableH = svgHeight - paddingY * 2;

  const points = profile.map((p, idx) => {
    const x = (idx / (profile.length - 1)) * svgWidth;
    const y = svgHeight - paddingY - ((p.elevationMeters - minElev) / range) * availableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const polylineStr = points.join(' ');
  const areaPoints = `0,${svgHeight} ${polylineStr} ${svgWidth},${svgHeight}`;

  return (
    <div
      className="p-3 rounded-2xl border flex flex-col gap-2.5 shadow-xs transition-all"
      style={{
        backgroundColor: uiColors.cardBg,
        borderColor: uiColors.borderColor,
      }}
    >
      {/* Header with Title and Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-2xs"
            style={{ backgroundColor: route.color || uiColors.brightAccent }}
          >
            <Mountain size={13} />
          </div>
          <span className="text-[12px] font-sans font-black tracking-wider uppercase" style={{ color: uiColors.headingColor }}>
            ELEVATION STATS
          </span>
        </div>
        {onTogglePosterBadge && (
          <button
            type="button"
            onClick={onTogglePosterBadge}
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-lg border transition-all cursor-pointer hover:scale-105 active:scale-95"
            style={{
              backgroundColor: route.showElevationProfile ? `${uiColors.brightAccent}25` : uiColors.flyoutBg,
              borderColor: route.showElevationProfile ? uiColors.brightAccent : uiColors.borderColor,
              color: route.showElevationProfile ? uiColors.brightAccent : uiColors.subtextColor,
            }}
          >
            {route.showElevationProfile ? 'POSTER BADGE ON' : 'BADGE OFF'}
          </button>
        )}
      </div>

      {/* 4 Stat Badges in a Sleek Unified Bar */}
      <div className="grid grid-cols-4 gap-1 p-1 rounded-xl border" style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor }}>
        <div className="flex flex-col items-center py-1">
          <span className="text-[8.5px] font-mono uppercase opacity-75" style={{ color: uiColors.subtextColor }}>DIST</span>
          <span className="text-xs font-mono font-bold" style={{ color: uiColors.textColor }}>{route.distanceKm || 0} km</span>
        </div>
        <div className="flex flex-col items-center py-1">
          <span className="text-[8.5px] font-mono uppercase opacity-75" style={{ color: uiColors.subtextColor }}>ASCENT</span>
          <span className="text-xs font-mono font-bold text-emerald-500">+{route.elevationGainMeters || 0}m</span>
        </div>
        <div className="flex flex-col items-center py-1">
          <span className="text-[8.5px] font-mono uppercase opacity-75" style={{ color: uiColors.subtextColor }}>DESCENT</span>
          <span className="text-xs font-mono font-bold text-rose-500">-{route.elevationLossMeters || 0}m</span>
        </div>
        <div className="flex flex-col items-center py-1">
          <span className="text-[8.5px] font-mono uppercase opacity-75" style={{ color: uiColors.subtextColor }}>TIME</span>
          <span className="text-xs font-mono font-bold" style={{ color: uiColors.brightAccent }}>{route.durationMin || 0}m</span>
        </div>
      </div>

      {/* SVG Elevation Profile Chart */}
      <div
        className="w-full rounded-xl p-2 border relative overflow-hidden flex flex-col justify-end shadow-inner"
        style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor, height: 75 }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="elevGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={route.color || uiColors.brightAccent} stopOpacity="0.5" />
              <stop offset="100%" stopColor={route.color || uiColors.brightAccent} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#elevGrad)" />
          <polyline
            points={polylineStr}
            fill="none"
            stroke={route.color || uiColors.brightAccent}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex items-center justify-between text-[8.5px] font-mono pt-1 opacity-75 z-10" style={{ color: uiColors.subtextColor }}>
          <span>Min: {minElev}m</span>
          <span>Max: {maxElev}m</span>
        </div>
      </div>
    </div>
  );
};
