import React from 'react';
import {
  MapPin,
  Map,
  Star,
  Heart,
  Flag,
  Camera,
  Home,
  Utensils,
  Coffee,
  Anchor,
  Compass,
  Navigation,
  Landmark,
  Building,
  Crosshair,
  Droplet,
  Flame,
  Sparkles
} from 'lucide-react';

export const AVAILABLE_ICON_NAMES = [
  { id: 'MapPin', label: 'Pin', icon: MapPin },
  { id: 'Star', label: 'Star', icon: Star },
  { id: 'Heart', label: 'Heart', icon: Heart },
  { id: 'Flag', label: 'Flag', icon: Flag },
  { id: 'Camera', label: 'Camera', icon: Camera },
  { id: 'Home', label: 'Home', icon: Home },
  { id: 'Utensils', label: 'Food', icon: Utensils },
  { id: 'Coffee', label: 'Coffee', icon: Coffee },
  { id: 'Anchor', label: 'Anchor', icon: Anchor },
  { id: 'Compass', label: 'Compass', icon: Compass },
  { id: 'Navigation', label: 'Nav', icon: Navigation },
  { id: 'Landmark', label: 'Landmark', icon: Landmark },
  { id: 'Building', label: 'City', icon: Building },
  { id: 'Crosshair', label: 'Target', icon: Crosshair },
  { id: 'Droplet', label: 'Droplet', icon: Droplet },
  { id: 'Flame', label: 'Flame', icon: Flame },
  { id: 'Sparkles', label: 'Sparkles', icon: Sparkles },
  { id: 'Map', label: 'Map', icon: Map },
];

export interface RenderMarkerIconProps {
  type?: 'pin' | 'dot' | 'badge' | 'icon' | 'custom';
  iconName?: string;
  color?: string;
  size?: number;
  customImageUrl?: string;
  className?: string;
}

export const RenderMarkerIcon: React.FC<RenderMarkerIconProps> = ({
  type = 'pin',
  iconName = 'MapPin',
  color = '#ef4444',
  size = 32,
  customImageUrl,
  className = ''
}) => {
  // If custom image marker
  if (type === 'custom' && customImageUrl) {
    return (
      <div 
        className={`relative flex items-center justify-center shrink-0 drop-shadow-xl transition-transform hover:scale-110 ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={customImageUrl} 
          alt="Custom Marker" 
          className="w-full h-full object-contain rounded-md"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </div>
    );
  }

  // Find matching Lucide Component
  const matched = AVAILABLE_ICON_NAMES.find((i) => i.id === iconName);
  const IconComponent = matched ? matched.icon : MapPin;

  if (type === 'dot') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-full shadow-lg border-2 border-white/80 transition-transform hover:scale-110 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
        }}
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full opacity-90" />
      </div>
    );
  }

  if (type === 'badge') {
    return (
      <div
        className={`relative flex items-center justify-center rounded-xl shadow-xl border-2 border-white/90 p-1.5 transition-transform hover:scale-110 ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: color,
          color: '#ffffff'
        }}
      >
        <IconComponent size={Math.round(size * 0.55)} strokeWidth={2.2} />
      </div>
    );
  }

  if (type === 'icon') {
    return (
      <div
        className={`relative flex items-center justify-center shrink-0 drop-shadow-lg transition-transform hover:scale-110 ${className}`}
        style={{ color: color }}
      >
        <IconComponent size={size} strokeWidth={2} />
      </div>
    );
  }

  // Default 'pin' type
  return (
    <div
      className={`relative flex flex-col items-center shrink-0 drop-shadow-xl transition-transform hover:scale-110 ${className}`}
      style={{ color: color }}
    >
      <div
        className="rounded-full p-1.5 flex items-center justify-center shadow-md border border-white/40"
        style={{ backgroundColor: color, color: '#ffffff' }}
      >
        <IconComponent size={Math.round(size * 0.5)} strokeWidth={2.2} />
      </div>
      {/* Pointer triangle tail */}
      <div
        className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] -mt-0.5"
        style={{ borderTopColor: color }}
      />
    </div>
  );
};
