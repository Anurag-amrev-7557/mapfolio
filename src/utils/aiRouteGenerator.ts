/**
 * Semantic Journey & AI Roadtrip Generator (RAG)
 * Converts natural language prompts into road-snapped routes,
 * milestone waypoints, scenic landmark markers, and typographic poster copy.
 */

export interface RouteMilestone {
  name: string;
  lat: number;
  lng: number;
  description?: string;
  category?: 'viewpoint' | 'monument' | 'city' | 'pass' | 'beach';
}

export interface GeneratedJourney {
  title: string;
  subtitle: string;
  description: string;
  profile: 'driving' | 'cycling' | 'foot';
  milestones: RouteMilestone[];
  suggestedTheme?: string;
}

// Curated RAG Knowledge Base of World-Class Scenic Roadtrips and Epic Journeys
const CURATED_JOURNEYS: GeneratedJourney[] = [
  {
    title: 'PACIFIC COAST HIGHWAY',
    subtitle: 'MONTEREY TO BIG SUR • CALIFORNIA',
    description: 'Iconic coastal cliffs, Bixby Creek Bridge, and sweeping Pacific Ocean vistas.',
    profile: 'driving',
    suggestedTheme: 'nordic',
    milestones: [
      { name: 'Monterey Bay', lat: 36.6002, lng: -121.8947, category: 'city' },
      { name: 'Carmel-by-the-Sea', lat: 36.5552, lng: -121.9233, category: 'city' },
      { name: 'Bixby Creek Bridge', lat: 36.3714, lng: -121.9018, category: 'viewpoint' },
      { name: 'Pfeiffer Big Sur', lat: 36.2486, lng: -121.7828, category: 'viewpoint' },
      { name: 'McWay Falls', lat: 36.1578, lng: -121.6723, category: 'viewpoint' },
    ],
  },
  {
    title: 'AMALFI COASTAL DRIVE',
    subtitle: 'SORRENTO TO RAVELLO • ITALY',
    description: 'Breathtaking Mediterranean cliffside curves, pastel villages, and sea vistas.',
    profile: 'driving',
    suggestedTheme: 'sunset',
    milestones: [
      { name: 'Sorrento', lat: 40.6263, lng: 14.3758, category: 'city' },
      { name: 'Positano', lat: 40.6281, lng: 14.4850, category: 'city' },
      { name: 'Praiano', lat: 40.6136, lng: 14.5327, category: 'viewpoint' },
      { name: 'Amalfi Town', lat: 40.6340, lng: 14.6027, category: 'monument' },
      { name: 'Ravello Cliff', lat: 40.6493, lng: 14.6119, category: 'viewpoint' },
    ],
  },
  {
    title: 'TOKYO TO MOUNT FUJI',
    subtitle: 'SHINJUKU TO LAKE KAWAGUCHIKO • JAPAN',
    description: 'From neon metropolis skyscrapers through mountain passes to the sacred volcano peak.',
    profile: 'driving',
    suggestedTheme: 'tokyo',
    milestones: [
      { name: 'Shinjuku Tokyo', lat: 35.6895, lng: 139.6917, category: 'city' },
      { name: 'Takao Pass', lat: 35.6254, lng: 139.2437, category: 'pass' },
      { name: 'Chureito Pagoda', lat: 35.5015, lng: 138.8016, category: 'monument' },
      { name: 'Lake Kawaguchiko', lat: 35.5171, lng: 138.7518, category: 'viewpoint' },
      { name: 'Fuji 5th Station', lat: 35.3606, lng: 138.7274, category: 'monument' },
    ],
  },
  {
    title: 'ICELAND GOLDEN CIRCLE',
    subtitle: 'REYKJAVIK TO GULLFOSS • ICELAND',
    description: 'Tectonic rifts, erupting geysers, and thundering glacial waterfalls.',
    profile: 'driving',
    suggestedTheme: 'midnight',
    milestones: [
      { name: 'Reykjavik', lat: 64.1466, lng: -21.9426, category: 'city' },
      { name: 'Thingvellir National Park', lat: 64.2559, lng: -21.1295, category: 'viewpoint' },
      { name: 'Geysir Geothermal Area', lat: 64.3104, lng: -20.3024, category: 'viewpoint' },
      { name: 'Gullfoss Waterfall', lat: 64.3271, lng: -20.1199, category: 'monument' },
      { name: 'Kerid Volcanic Crater', lat: 64.0412, lng: -20.8851, category: 'viewpoint' },
    ],
  },
  {
    title: 'GREAT OCEAN ROAD',
    subtitle: 'TORQUAY TO TWELVE APOSTLES • AUSTRALIA',
    description: 'Rugged Southern Ocean limestone stacks, rainforest gorges, and surf beaches.',
    profile: 'driving',
    suggestedTheme: 'emerald',
    milestones: [
      { name: 'Torquay Surf Coast', lat: -38.3328, lng: 144.3168, category: 'beach' },
      { name: 'Bells Beach', lat: -38.3686, lng: 144.2818, category: 'beach' },
      { name: 'Lorne Coastal Town', lat: -38.5414, lng: 143.9749, category: 'city' },
      { name: 'Apollo Bay', lat: -38.7574, lng: 143.6669, category: 'city' },
      { name: 'Twelve Apostles', lat: -38.6658, lng: 143.1054, category: 'viewpoint' },
    ],
  },
  {
    title: 'SWISS ALPS FURKA PASS',
    subtitle: 'ANDWERMATT TO GRIMSEL • SWITZERLAND',
    description: 'High-alpine hairpin mountain passes, Rhone glacier, and granite peaks.',
    profile: 'driving',
    suggestedTheme: 'rustic',
    milestones: [
      { name: 'Andermatt Village', lat: 46.6342, lng: 8.5947, category: 'city' },
      { name: 'Furka Pass Summit', lat: 46.5727, lng: 8.4150, category: 'pass' },
      { name: 'Rhone Glacier Belvedere', lat: 46.5772, lng: 8.3881, category: 'viewpoint' },
      { name: 'Gletsch Valley', lat: 46.5620, lng: 8.3606, category: 'city' },
      { name: 'Grimsel Pass Lake', lat: 46.5714, lng: 8.3340, category: 'pass' },
    ],
  },
  {
    title: 'NAPA VALLEY WINE TRAIL',
    subtitle: 'NAPA TO CALISTOGA • CALIFORNIA',
    description: 'World-renowned rolling vineyards, historic stone wineries, and oak-lined avenues.',
    profile: 'cycling',
    suggestedTheme: 'vintage',
    milestones: [
      { name: 'Downtown Napa', lat: 38.2975, lng: -122.2869, category: 'city' },
      { name: 'Yountville Culinary Hub', lat: 38.4016, lng: -122.3608, category: 'city' },
      { name: 'Oakville Vineyards', lat: 38.4363, lng: -122.4047, category: 'viewpoint' },
      { name: 'St. Helena Stone Winery', lat: 38.5052, lng: -122.4703, category: 'monument' },
      { name: 'Calistoga Geothermal', lat: 38.5788, lng: -122.5797, category: 'viewpoint' },
    ],
  },
  {
    title: 'SCOTTISH NORTH COAST 500',
    subtitle: 'INVERNESS TO APPLECROSS • SCOTLAND',
    description: 'Ancient lochs, Bealach na Bà mountain pass, and rugged Atlantic cliffs.',
    profile: 'driving',
    suggestedTheme: 'charcoal',
    milestones: [
      { name: 'Inverness Castle', lat: 57.4764, lng: -4.2255, category: 'monument' },
      { name: 'Loch Maree Viewpoint', lat: 57.6934, lng: -5.4674, category: 'viewpoint' },
      { name: 'Torridon Mountain Glen', lat: 57.5458, lng: -5.5126, category: 'pass' },
      { name: 'Bealach na Bà Pass', lat: 57.4192, lng: -5.7369, category: 'pass' },
      { name: 'Applecross Bay', lat: 57.4332, lng: -5.8137, category: 'beach' },
    ],
  },
];

/**
 * Geocode a location query using OpenStreetMap Nominatim
 */
async function geocodePlace(query: string): Promise<{ lat: number; lng: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`,
      {
        headers: { 'User-Agent': 'Mapfolio-AI-Router/1.0' },
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        name: data[0].name || query,
      };
    }
  } catch (_) {}
  return null;
}

/**
 * Generate a journey from natural language prompt using RAG retrieval + geocoding
 */
export async function generateJourneyFromPrompt(prompt: string): Promise<GeneratedJourney | null> {
  const normalized = prompt.toLowerCase().trim();

  // 1. Check if prompt matches our Curated RAG Knowledge Base
  for (const journey of CURATED_JOURNEYS) {
    const titleMatch = journey.title.toLowerCase().includes(normalized) || normalized.includes(journey.title.toLowerCase());
    const subMatch = journey.subtitle.toLowerCase().includes(normalized) || normalized.includes(journey.subtitle.toLowerCase());
    const descMatch = normalized.split(' ').some((word) => word.length > 4 && journey.description.toLowerCase().includes(word));

    if (titleMatch || subMatch || descMatch) {
      return journey;
    }
  }

  // 2. Extract "from X to Y" or "X to Y via Z" pattern for custom dynamic routing
  const toMatch = normalized.match(/from\s+([^to]+)\s+to\s+([^via,]+)(?:\s+via\s+([^,]+))?/i) ||
                  normalized.match(/([^to]+)\s+to\s+([^via,]+)(?:\s+via\s+([^,]+))?/i);

  if (toMatch) {
    const originName = toMatch[1].trim();
    const destName = toMatch[2].trim();
    const viaName = toMatch[3]?.trim();

    const origin = await geocodePlace(originName);
    const dest = await geocodePlace(destName);
    const via = viaName ? await geocodePlace(viaName) : null;

    if (origin && dest) {
      const milestones: RouteMilestone[] = [
        { name: origin.name.toUpperCase(), lat: origin.lat, lng: origin.lng, category: 'city' },
      ];
      if (via) {
        milestones.push({ name: via.name.toUpperCase(), lat: via.lat, lng: via.lng, category: 'viewpoint' });
      }
      milestones.push({ name: dest.name.toUpperCase(), lat: dest.lat, lng: dest.lng, category: 'city' });

      const profile: 'driving' | 'cycling' | 'foot' =
        normalized.includes('bike') || normalized.includes('cycl') ? 'cycling' :
        normalized.includes('walk') || normalized.includes('hike') || normalized.includes('run') ? 'foot' : 'driving';

      return {
        title: `${origin.name.toUpperCase()} TO ${dest.name.toUpperCase()}`,
        subtitle: `SCENIC ${profile.toUpperCase()} ROADTRIP`,
        description: `Custom AI generated route from ${origin.name} to ${dest.name}.`,
        profile,
        milestones,
      };
    }
  }

  // Fallback to top curated journey
  return CURATED_JOURNEYS[0];
}

export { CURATED_JOURNEYS };
