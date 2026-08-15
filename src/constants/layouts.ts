export type LayoutOrientation = 'landscape' | 'portrait' | 'square';
export type LayoutCategory = 'print' | 'social' | 'wallpaper' | 'web' | 'desktop';

export interface LayoutType {
  id: string;
  name: string;
  category: LayoutCategory;
  orientation: LayoutOrientation;
  aspectRatio: string;
  widthPx: number;
  heightPx: number;
  width: string;
  height: string;
  description: string;
  badge?: string;
}

export const LAYOUTS: LayoutType[] = [
  // --- PRINT ---
  {
    id: 'a3-portrait',
    name: 'A3 Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.41',
    widthPx: 3508,
    heightPx: 4960,
    width: '29.7 X 42 CM',
    height: '29.7 X 42 CM',
    description: '29.7 × 42 cm poster print',
    badge: 'A3'
  },
  {
    id: 'a4-portrait',
    name: 'A4 Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.41',
    widthPx: 2480,
    heightPx: 3508,
    width: '21 X 29.7 CM',
    height: '21 X 29.7 CM',
    description: '21 × 29.7 cm standard document',
    badge: 'A4'
  },
  {
    id: 'a5-portrait',
    name: 'A5 Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.41',
    widthPx: 1748,
    heightPx: 2480,
    width: '14.8 X 21 CM',
    height: '14.8 X 21 CM',
    description: '14.8 × 21 cm compact print',
    badge: 'A5'
  },
  {
    id: 'letter-portrait',
    name: 'Letter (US) Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.29',
    widthPx: 2550,
    heightPx: 3300,
    width: '21.6 X 27.9 CM',
    height: '21.6 X 27.9 CM',
    description: '21.6 × 27.9 cm US Letter format',
    badge: 'Letter'
  },
  {
    id: 'a2-portrait',
    name: 'A2 Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.41',
    widthPx: 4960,
    heightPx: 7016,
    width: '42 X 59.4 CM',
    height: '42 X 59.4 CM',
    description: '42 × 59.4 cm large poster print',
    badge: 'A2'
  },
  {
    id: 'tabloid-portrait',
    name: 'Tabloid (US) Portrait',
    category: 'print',
    orientation: 'portrait',
    aspectRatio: '1:1.55',
    widthPx: 3300,
    heightPx: 5100,
    width: '27.9 X 43.2 CM',
    height: '27.9 X 43.2 CM',
    description: '27.9 × 43.2 cm US Tabloid format',
    badge: 'Tabloid'
  },

  // --- SOCIAL MEDIA ---
  {
    id: 'ig-post',
    name: 'Instagram Square',
    category: 'social',
    orientation: 'square',
    aspectRatio: '1:1',
    widthPx: 1080,
    heightPx: 1080,
    width: '1080 X 1080 PX',
    height: '1080 X 1080 PX',
    description: 'Square post for IG feed & social media',
    badge: '1:1'
  },
  {
    id: 'ig-portrait',
    name: 'Instagram Portrait',
    category: 'social',
    orientation: 'portrait',
    aspectRatio: '4:5',
    widthPx: 1080,
    heightPx: 1350,
    width: '1080 X 1350 PX',
    height: '1080 X 1350 PX',
    description: 'Optimized portrait feed post',
    badge: '4:5'
  },
  {
    id: 'ig-story',
    name: 'Story (9:16)',
    category: 'social',
    orientation: 'portrait',
    aspectRatio: '9:16',
    widthPx: 1080,
    heightPx: 1920,
    width: '1080 X 1920 PX',
    height: '1080 X 1920 PX',
    description: 'Fullscreen vertical format for Stories & Reels',
    badge: '9:16'
  },
  {
    id: 'linkedin-post',
    name: 'LinkedIn Post',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '1.91:1',
    widthPx: 1200,
    heightPx: 627,
    width: '1200 X 627 PX',
    height: '1200 X 627 PX',
    description: 'Professional feed card post',
    badge: 'LinkedIn'
  },
  {
    id: 'linkedin-cover',
    name: 'LinkedIn Cover',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '4:1',
    widthPx: 1584,
    heightPx: 396,
    width: '1584 X 396 PX',
    height: '1584 X 396 PX',
    description: 'Personal profile background banner',
    badge: 'Cover'
  },
  {
    id: 'pinterest-pin',
    name: 'Pinterest Pin',
    category: 'social',
    orientation: 'portrait',
    aspectRatio: '2:3',
    widthPx: 1000,
    heightPx: 1500,
    width: '1000 X 1500 PX',
    height: '1000 X 1500 PX',
    description: 'Vertical Pinterest pin graphics',
    badge: '2:3'
  },
  {
    id: 'reddit-post',
    name: 'Reddit Post (16:9)',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 1200,
    heightPx: 675,
    width: '1200 X 675 PX',
    height: '1200 X 675 PX',
    description: 'Community feed image post',
    badge: '16:9'
  },
  {
    id: 'reddit-banner',
    name: 'Reddit Banner',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '7.5:1',
    widthPx: 1920,
    heightPx: 256,
    width: '1920 X 256 PX',
    height: '1920 X 256 PX',
    description: 'Subreddit header banner',
    badge: 'Banner'
  },
  {
    id: 'twitter-header',
    name: 'Twitter Header',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '3:1',
    widthPx: 1500,
    heightPx: 500,
    width: '1500 X 500 PX',
    height: '1500 X 500 PX',
    description: 'X / Twitter profile banner image',
    badge: '3:1'
  },
  {
    id: 'yt-thumbnail',
    name: 'YouTube Thumbnail',
    category: 'social',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 1280,
    heightPx: 720,
    width: '1280 X 720 PX',
    height: '1280 X 720 PX',
    description: 'HD video thumbnail image',
    badge: '16:9'
  },

  // --- WALLPAPER & DEVICES ---
  {
    id: 'desktop-fhd',
    name: 'Desktop Full HD',
    category: 'wallpaper',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 1920,
    heightPx: 1080,
    width: '1920 X 1080 PX',
    height: '1920 X 1080 PX',
    description: 'Standard PC & laptop widescreen display',
    badge: '1080p'
  },
  {
    id: 'desktop-4k',
    name: 'Desktop 4K',
    category: 'wallpaper',
    orientation: 'landscape',
    aspectRatio: '16:9',
    widthPx: 3840,
    heightPx: 2160,
    width: '3840 X 2160 PX',
    height: '3840 X 2160 PX',
    description: 'Ultra High-Definition 4K wallpaper',
    badge: '4K UHD'
  },
  {
    id: 'desktop-ultrawide',
    name: 'Desktop Ultrawide',
    category: 'wallpaper',
    orientation: 'landscape',
    aspectRatio: '21:9',
    widthPx: 3440,
    heightPx: 1440,
    width: '3440 X 1440 PX',
    height: '3440 X 1440 PX',
    description: '21:9 Ultrawide gaming & workspace monitor wallpaper',
    badge: '21:9'
  },
  {
    id: 'iphone-15-pro',
    name: 'iPhone 15 Pro',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '9:19.5',
    widthPx: 1179,
    heightPx: 2556,
    width: '1179 X 2556 PX',
    height: '1179 X 2556 PX',
    description: 'Super Retina XDR OLED wallpaper',
    badge: 'OLED'
  },
  {
    id: 'iphone-15-promax',
    name: 'iPhone 15 Pro Max',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '9:19.5',
    widthPx: 1290,
    heightPx: 2796,
    width: '1290 X 2796 PX',
    height: '1290 X 2796 PX',
    description: 'Pro Max Super Retina XDR wallpaper',
    badge: 'Pro Max'
  },
  {
    id: 'galaxy-s24-ultra',
    name: 'Galaxy S24 Ultra',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '9:19.5',
    widthPx: 1440,
    heightPx: 3120,
    width: '1440 X 3120 PX',
    height: '1440 X 3120 PX',
    description: 'Quad HD+ Dynamic AMOLED 2X display wallpaper',
    badge: 'QHD+'
  },
  {
    id: 'ipad-pro-11',
    name: 'iPad Pro 11"',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '1:1.43',
    widthPx: 1668,
    heightPx: 2388,
    width: '1668 X 2388 PX',
    height: '1668 X 2388 PX',
    description: 'Liquid Retina tablet wallpaper',
    badge: 'Tablet'
  },
  {
    id: 'ipad-pro-129',
    name: 'iPad Pro 12.9"',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '3:4',
    widthPx: 2048,
    heightPx: 2732,
    width: '2048 X 2732 PX',
    height: '2048 X 2732 PX',
    description: 'Liquid Retina XDR large tablet wallpaper',
    badge: '3:4'
  },
  {
    id: 'xteink-x4',
    name: 'Xteink X4 (E-Ink)',
    category: 'wallpaper',
    orientation: 'portrait',
    aspectRatio: '3:5',
    widthPx: 480,
    heightPx: 800,
    width: '480 X 800 PX',
    height: '480 X 800 PX',
    description: 'E-paper reader lockscreen graphic',
    badge: 'E-Ink'
  },

  // --- WEB & DIGITAL ---
  {
    id: 'web-hero',
    name: 'Hero Banner',
    category: 'web',
    orientation: 'landscape',
    aspectRatio: '2.4:1',
    widthPx: 1440,
    heightPx: 600,
    width: '1440 X 600 PX',
    height: '1440 X 600 PX',
    description: 'Website header & hero section graphic',
    badge: 'Hero'
  },
  {
    id: 'blog-featured',
    name: 'Blog Featured',
    category: 'web',
    orientation: 'landscape',
    aspectRatio: '1.9:1',
    widthPx: 1200,
    heightPx: 630,
    width: '1200 X 630 PX',
    height: '1200 X 630 PX',
    description: 'Article featured thumbnail image',
    badge: 'Blog'
  },
  {
    id: 'dashboard-card',
    name: 'Dashboard Card',
    category: 'web',
    orientation: 'landscape',
    aspectRatio: '4:3',
    widthPx: 1280,
    heightPx: 960,
    width: '1280 X 960 PX',
    height: '1280 X 960 PX',
    description: 'UI card & presentation graphic',
    badge: '4:3'
  }
];

export const DEFAULT_LAYOUT = LAYOUTS[0];
