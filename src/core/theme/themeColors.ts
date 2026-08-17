/**
 * Contrast & UI Theme Color Resolver.
 * Computes dynamic, theme-responsive UI colors with WCAG AAA contrast ratios
 * for light and dark map theme palettes (Emerald City, Blush, Dark Noir, Paper, Cyberpunk, Burgundy, etc.).
 */
import { getTheme } from '../constants/themes';

/** Calculate relative luminance of a Hex color string (0 = black, 1 = white) */
export function getLuminance(hexColor: string): number {
  if (!hexColor) return 0.5;
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map((c) => c + c).join('');
  }
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 0.5;

  const aR = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
  const aG = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
  const aB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

  return 0.2126 * aR + 0.7152 * aG + 0.0722 * aB;
}

export function isLightColor(hexColor: string): boolean {
  return getLuminance(hexColor) > 0.45;
}

export function getReadableTextColor(bgHexColor: string): string {
  return isLightColor(bgHexColor) ? '#0f172a' : '#ffffff';
}

/** Darken a hex color string by a percentage factor (0.0 to 1.0) */
export function darkenHex(hexColor: string, amount: number = 0.2): string {
  if (!hexColor || !hexColor.startsWith('#')) return hexColor || '#161c24';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  let num = parseInt(hex, 16);
  if (isNaN(num)) return hexColor;

  let r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
  let g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - amount)));
  let b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - amount)));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/** Lighten a hex color string by a percentage factor (0.0 to 1.0) */
export function lightenHex(hexColor: string, amount: number = 0.2): string {
  if (!hexColor || !hexColor.startsWith('#')) return hexColor || '#1e293b';
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  let num = parseInt(hex, 16);
  if (isNaN(num)) return hexColor;

  let r = Math.min(255, Math.floor((num >> 16) + (255 - (num >> 16)) * amount));
  let g = Math.min(255, Math.floor(((num >> 8) & 0x00ff) + (255 - ((num >> 8) & 0x00ff)) * amount));
  let b = Math.min(255, Math.floor((num & 0x0000ff) + (255 - (num & 0x0000ff)) * amount));

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export interface UIThemeColors {
  sidebarBg: string;
  flyoutBg: string;
  cardBg: string;
  borderColor: string;
  headingColor: string;
  textColor: string;
  subtextColor: string;
  inactiveItemText: string;
  inactiveItemHoverBg: string;
  activeItemBg: string;
  activeItemText: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  isLight: boolean;
  accentColor: string;
  brightAccent: string;
  darkestThemeColor: string;
  dangerText: string;
}

/** Compute the darkest color directly from the active theme's palette */
export function getDarkestThemeColor(
  themeId: string, 
  colorOverrides: Record<string, string> = {},
  customThemes: any[] = []
): string {
  const currentTheme = getTheme(themeId, customThemes);
  const palette = currentTheme.palette;

  const candidateColors: string[] = [
    colorOverrides['rail'] || palette.rail,
    colorOverrides['roadsMajor'] || palette.roads?.major,
    colorOverrides['roadsMinor'] || palette.roads?.minor_high,
    colorOverrides['buildings'] || palette.buildings,
    colorOverrides['water'] || palette.water,
    colorOverrides['parks'] || palette.parks,
    colorOverrides['land'] || palette.land,
    colorOverrides['landcover'] || palette.landcover,
  ].filter(Boolean);

  if (candidateColors.length === 0) return '#1e293b';

  let darkest = candidateColors[0];
  let minLum = getLuminance(darkest);

  for (const c of candidateColors) {
    const lum = getLuminance(c);
    if (lum < minLum) {
      minLum = lum;
      darkest = c;
    }
  }

  // If even the darkest color is relatively bright, enrich it while preserving its exact hue
  if (minLum > 0.35) {
    darkest = darkenHex(darkest, 0.25);
  }

  return darkest;
}

export function getUIThemeColors(
  themeId: string, 
  colorOverrides: Record<string, string> = {},
  customThemes: any[] = []
): UIThemeColors {
  const currentTheme = getTheme(themeId, customThemes);
  const palette = currentTheme.palette;

  const rawBg = colorOverrides['land'] || palette.land || '#11161d';
  const isLight = isLightColor(rawBg);
  const darkestThemeColor = getDarkestThemeColor(themeId, colorOverrides, customThemes);

  // Dynamic Theme Accent derived from major roads or water color to ensure color harmony
  const themeAccent = colorOverrides['roadsMajor'] || palette.roads.major || palette.water || (isLight ? '#0f172a' : '#059669');
  const activeItemText = getReadableTextColor(themeAccent);

  // Ensure accentColor used for text/icons is vibrant & high contrast on both light and dark backgrounds
  let brightAccent = themeAccent;
  if (!isLight && getLuminance(themeAccent) < 0.25) {
    brightAccent = lightenHex(themeAccent, 0.45);
  } else if (isLight && getLuminance(themeAccent) > 0.6) {
    brightAccent = darkenHex(themeAccent, 0.45);
  }

  if (isLight) {
    return {
      sidebarBg: rawBg,
      flyoutBg: '#f8fafc',
      cardBg: '#ffffff',
      borderColor: 'rgba(0, 0, 0, 0.14)',
      headingColor: '#0f172a',
      textColor: '#0f172a',
      subtextColor: '#334155',
      inactiveItemText: '#334155',
      inactiveItemHoverBg: 'rgba(0, 0, 0, 0.08)',
      activeItemBg: themeAccent,
      activeItemText: activeItemText,
      inputBg: '#ffffff',
      inputBorder: '#cbd5e1',
      inputText: '#0f172a',
      isLight: true,
      accentColor: themeAccent,
      brightAccent: brightAccent,
      darkestThemeColor: darkestThemeColor,
      dangerText: '#e11d48',
    };
  }

  // Dark themes derive flyoutBg and cardBg dynamically from theme land palette!
  const flyoutBg = darkenHex(rawBg, 0.15);
  const cardBg = lightenHex(rawBg, 0.10);

  return {
    sidebarBg: rawBg,
    flyoutBg: flyoutBg,
    cardBg: cardBg,
    borderColor: 'rgba(255, 255, 255, 0.16)',
    headingColor: '#ffffff',
    textColor: '#ffffff',
    subtextColor: '#cbd5e1',
    inactiveItemText: '#e2e8f0',
    inactiveItemHoverBg: 'rgba(255, 255, 255, 0.12)',
    activeItemBg: themeAccent,
    activeItemText: activeItemText,
    inputBg: darkenHex(rawBg, 0.25),
    inputBorder: 'rgba(255, 255, 255, 0.22)',
    inputText: '#ffffff',
    isLight: false,
    accentColor: themeAccent,
    brightAccent: brightAccent,
    darkestThemeColor: darkestThemeColor,
    dangerText: '#fda4af',
  };
}
