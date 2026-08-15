export type FontCategory = 'sans-serif' | 'serif' | 'display' | 'monospace';

export interface FontOption {
  id: string;
  label: string;
  value: string;
  category: FontCategory;
  description: string;
  defaultTracking: string;
  titleTracking: string;
  subtitleTracking: string;
  coordTracking: string;
}

export const FONT_OPTIONS: FontOption[] = [
  // Modern Sans-Serif
  {
    id: 'space-grotesk',
    label: 'Space Grotesk',
    value: "'Space Grotesk', -apple-system, BlinkMacSystemFont, sans-serif",
    category: 'sans-serif',
    description: 'Modern geometric tech & architectural sans-serif (Default)',
    defaultTracking: '0.35em',
    titleTracking: '0.42em',
    subtitleTracking: '0.32em',
    coordTracking: '0.28em',
  },
  {
    id: 'montserrat',
    label: 'Montserrat',
    value: "'Montserrat', sans-serif",
    category: 'sans-serif',
    description: 'Clean geometric uppercase with generous open proportions',
    defaultTracking: '0.40em',
    titleTracking: '0.48em',
    subtitleTracking: '0.36em',
    coordTracking: '0.30em',
  },
  {
    id: 'outfit',
    label: 'Outfit',
    value: "'Outfit', sans-serif",
    category: 'sans-serif',
    description: 'Sleek contemporary display sans with wide, spacious tracking',
    defaultTracking: '0.38em',
    titleTracking: '0.45em',
    subtitleTracking: '0.34em',
    coordTracking: '0.28em',
  },
  {
    id: 'raleway',
    label: 'Raleway',
    value: "'Raleway', sans-serif",
    category: 'sans-serif',
    description: 'Elegant, light-to-bold sans with distinct airy character',
    defaultTracking: '0.38em',
    titleTracking: '0.46em',
    subtitleTracking: '0.35em',
    coordTracking: '0.28em',
  },
  {
    id: 'plus-jakarta-sans',
    label: 'Plus Jakarta Sans',
    value: "'Plus Jakarta Sans', sans-serif",
    category: 'sans-serif',
    description: 'Fresh modern geometric sans with balanced, open spacing',
    defaultTracking: '0.35em',
    titleTracking: '0.42em',
    subtitleTracking: '0.32em',
    coordTracking: '0.26em',
  },
  {
    id: 'inter',
    label: 'Inter',
    value: "'Inter', system-ui, -apple-system, sans-serif",
    category: 'sans-serif',
    description: 'Contemporary high-precision UI typography',
    defaultTracking: '0.32em',
    titleTracking: '0.40em',
    subtitleTracking: '0.30em',
    coordTracking: '0.25em',
  },
  {
    id: 'lato',
    label: 'Lato',
    value: "'Lato', sans-serif",
    category: 'sans-serif',
    description: 'Warm & balanced sans-serif with subtle elegance',
    defaultTracking: '0.32em',
    titleTracking: '0.40em',
    subtitleTracking: '0.30em',
    coordTracking: '0.25em',
  },

  // Elegant Serif
  {
    id: 'playfair-display',
    label: 'Playfair Display',
    value: "'Playfair Display', Georgia, serif",
    category: 'serif',
    description: 'High-contrast editorial classic for luxury poster art',
    defaultTracking: '0.35em',
    titleTracking: '0.44em',
    subtitleTracking: '0.34em',
    coordTracking: '0.26em',
  },
  {
    id: 'cinzel',
    label: 'Cinzel',
    value: "'Cinzel', Georgia, serif",
    category: 'serif',
    description: 'Classical Roman proportions inspired by ancient stone inscriptions',
    defaultTracking: '0.40em',
    titleTracking: '0.50em',
    subtitleTracking: '0.38em',
    coordTracking: '0.30em',
  },
  {
    id: 'cormorant-garamond',
    label: 'Cormorant Garamond',
    value: "'Cormorant Garamond', Garamond, serif",
    category: 'serif',
    description: 'Refined serif elegance with timeless delicate curves',
    defaultTracking: '0.32em',
    titleTracking: '0.42em',
    subtitleTracking: '0.32em',
    coordTracking: '0.26em',
  },
  {
    id: 'merriweather',
    label: 'Merriweather',
    value: "'Merriweather', serif",
    category: 'serif',
    description: 'Robust editorial serif with exceptional structural clarity',
    defaultTracking: '0.32em',
    titleTracking: '0.40em',
    subtitleTracking: '0.30em',
    coordTracking: '0.25em',
  },

  // High-Impact Display
  {
    id: 'syne',
    label: 'Syne',
    value: "'Syne', sans-serif",
    category: 'display',
    description: 'Avant-garde editorial font with striking open letterforms',
    defaultTracking: '0.38em',
    titleTracking: '0.46em',
    subtitleTracking: '0.35em',
    coordTracking: '0.28em',
  },
  {
    id: 'bebas-neue',
    label: 'Bebas Neue',
    value: "'Bebas Neue', 'Impact', sans-serif",
    category: 'display',
    description: 'Bold tall condensed display for strong visual impact',
    defaultTracking: '0.25em',
    titleTracking: '0.35em',
    subtitleTracking: '0.28em',
    coordTracking: '0.24em',
  },
  {
    id: 'oswald',
    label: 'Oswald',
    value: "'Oswald', sans-serif",
    category: 'display',
    description: 'Re-drawn classic gothic display for punchy poster titles',
    defaultTracking: '0.28em',
    titleTracking: '0.38em',
    subtitleTracking: '0.30em',
    coordTracking: '0.25em',
  },
  {
    id: 'unica-one',
    label: 'Unica One',
    value: "'Unica One', sans-serif",
    category: 'display',
    description: 'Slim geometric display sans for minimalist cartography',
    defaultTracking: '0.30em',
    titleTracking: '0.40em',
    subtitleTracking: '0.30em',
    coordTracking: '0.25em',
  },

  // Technical Monospace
  {
    id: 'space-mono',
    label: 'Space Mono',
    value: "'Space Mono', monospace",
    category: 'monospace',
    description: 'Retro-futuristic fixed-width cartographic typography',
    defaultTracking: '0.28em',
    titleTracking: '0.36em',
    subtitleTracking: '0.28em',
    coordTracking: '0.25em',
  },
  {
    id: 'jetbrains-mono',
    label: 'JetBrains Mono',
    value: "'JetBrains Mono', monospace",
    category: 'monospace',
    description: 'Precision technical monospace with crisp line clarity',
    defaultTracking: '0.25em',
    titleTracking: '0.34em',
    subtitleTracking: '0.26em',
    coordTracking: '0.22em',
  },
  {
    id: 'fira-code',
    label: 'Fira Code',
    value: "'Fira Code', monospace",
    category: 'monospace',
    description: 'Clean architectural code font with balanced character spacing',
    defaultTracking: '0.25em',
    titleTracking: '0.34em',
    subtitleTracking: '0.26em',
    coordTracking: '0.22em',
  },
];

export const DEFAULT_FONT = FONT_OPTIONS[0];

export function getFontByValue(val: string): FontOption {
  if (!val) return DEFAULT_FONT;
  const normalized = val.toLowerCase();
  const match = FONT_OPTIONS.find(
    (f) =>
      f.value.toLowerCase() === normalized ||
      f.label.toLowerCase() === normalized ||
      f.id.toLowerCase() === normalized ||
      f.value.toLowerCase().includes(normalized) ||
      normalized.includes(f.label.toLowerCase())
  );
  return match || DEFAULT_FONT;
}
