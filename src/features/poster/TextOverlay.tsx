import React from 'react';
import type { MapTheme } from '@/core';

interface TextOverlayProps {
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  fontFamilyCSS: string;
  currentTheme: MapTheme;
  effectiveFontScale: number;
  titleLetterSpacing: string;
  subLetterSpacing: string;
  coordLetterSpacing: string;
  letterSpacingMultiplier: number;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({
  title,
  subtitle,
  lat,
  lng,
  fontFamilyCSS,
  currentTheme,
  effectiveFontScale,
  titleLetterSpacing,
  subLetterSpacing,
  coordLetterSpacing,
  letterSpacingMultiplier,
}) => {
  return (
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
  );
};
