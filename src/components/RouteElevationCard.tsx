import React from 'react';
import { Mountain } from 'lucide-react';
import type { RouteData } from '../store/useMapStore';
import type { UIThemeColors } from '../utils/themeColors';

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
  const svgHeight = 70;
  const paddingY = 8;
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
      className="p-3.5 rounded-2xl border flex flex-col gap-2.5 shadow-sm transition-all"
      style={{
        backgroundColor: uiColors.cardBg,
        borderColor: `${uiColors.accentColor}35`,
      }}
    >
      {/* Header with Title and Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
            style={{ backgroundColor: route.color || uiColors.accentColor }}
          >
            <Mountain size={13} />
          </div>
          <span className="text-xs font-sans font-extrabold tracking-wider uppercase" style={{ color: uiColors.textColor }}>
            ELEVATION & TOPO STATS
          </span>
        </div>
        {onTogglePosterBadge && (
          <button
            type="button"
            onClick={onTogglePosterBadge}
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer hover:scale-105"
            style={{
              backgroundColor: route.showElevationProfile ? `${uiColors.accentColor}25` : uiColors.flyoutBg,
              borderColor: route.showElevationProfile ? uiColors.accentColor : uiColors.borderColor,
              color: route.showElevationProfile ? uiColors.accentColor : uiColors.subtextColor,
            }}
          >
            {route.showElevationProfile ? 'Poster Badge ON' : 'Poster Badge OFF'}
          </button>
        )}
      </div>

      {/* 4 Stat Badges Grid */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="p-1.5 rounded-xl border flex flex-col items-center" style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor }}>
          <span className="text-[8px] font-mono uppercase opacity-70" style={{ color: uiColors.subtextColor }}>DIST</span>
          <span className="text-[11px] font-mono font-black" style={{ color: uiColors.textColor }}>{route.distanceKm || 0} km</span>
        </div>
        <div className="p-1.5 rounded-xl border flex flex-col items-center" style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor }}>
          <span className="text-[8px] font-mono uppercase opacity-70" style={{ color: uiColors.subtextColor }}>ASCENT</span>
          <span className="text-[11px] font-mono font-black text-emerald-500">+{route.elevationGainMeters || 0}m</span>
        </div>
        <div className="p-1.5 rounded-xl border flex flex-col items-center" style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor }}>
          <span className="text-[8px] font-mono uppercase opacity-70" style={{ color: uiColors.subtextColor }}>DESCENT</span>
          <span className="text-[11px] font-mono font-black text-rose-500">-{route.elevationLossMeters || 0}m</span>
        </div>
        <div className="p-1.5 rounded-xl border flex flex-col items-center" style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor }}>
          <span className="text-[8px] font-mono uppercase opacity-70" style={{ color: uiColors.subtextColor }}>TIME</span>
          <span className="text-[11px] font-mono font-black" style={{ color: uiColors.accentColor }}>{route.durationMin || 0}m</span>
        </div>
      </div>

      {/* SVG Elevation Profile Chart */}
      <div
        className="w-full rounded-xl p-2 border relative overflow-hidden flex flex-col justify-end"
        style={{ backgroundColor: uiColors.flyoutBg, borderColor: uiColors.borderColor, height: 85 }}
      >
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-[65px] overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={route.color || uiColors.accentColor} stopOpacity="0.5" />
              <stop offset="100%" stopColor={route.color || uiColors.accentColor} stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Shaded Area */}
          <polygon points={areaPoints} fill="url(#elevGradient)" />

          {/* Line Stroke */}
          <polyline
            points={polylineStr}
            fill="none"
            stroke={route.color || uiColors.accentColor}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>

        {/* Min/Max Elevation Labels */}
        <div className="flex items-center justify-between text-[8px] font-mono opacity-70 px-1 pt-1" style={{ color: uiColors.subtextColor }}>
          <span>Min: {minElev}m</span>
          <span>Max Summit: {maxElev}m</span>
        </div>
      </div>
    </div>
  );
};
