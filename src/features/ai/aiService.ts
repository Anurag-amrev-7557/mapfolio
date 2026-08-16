/**
 * AI Service Client with Intelligent Client-Side Semantic Discovery Fallback
 * Handles communication with AI backend services with graceful fallback to Nominatim & curated database.
 */

export interface LocationResult {
  name: string;
  lat: number;
  lon: number;
  description: string;
  match_score: number;
  features: {
    scenery_type: string;
    urban_density: number;
    popularity: number;
    location_type: string;
  };
}

export interface LocationResponse {
  success: boolean;
  query: string;
  criteria: Record<string, boolean>;
  results: LocationResult[];
  total_found: number;
  error: string | null;
}

// Curated Global Semantic Knowledge Base
const CURATED_LOCATIONS: LocationResult[] = [
  {
    name: 'Mount Fuji, Japan',
    lat: 35.3606,
    lon: 138.7274,
    description: 'Iconic snow-capped volcanic cone surrounded by the Fuji Five Lakes.',
    match_score: 0.98,
    features: { scenery_type: 'mountain', urban_density: 0.1, popularity: 0.95, location_type: 'volcano' },
  },
  {
    name: 'Shibuya & Shinjuku, Tokyo',
    lat: 35.6580,
    lon: 139.7016,
    description: 'Cyberpunk metropolis with neon skyscraper canyons and bustling nightlife.',
    match_score: 0.96,
    features: { scenery_type: 'urban', urban_density: 0.98, popularity: 0.95, location_type: 'city' },
  },
  {
    name: 'Matterhorn & Zermatt, Switzerland',
    lat: 45.9765,
    lon: 7.7491,
    description: 'Dramatic alpine pyramid summit towering over pristine Swiss glaciers and lakes.',
    match_score: 0.97,
    features: { scenery_type: 'mountain', urban_density: 0.2, popularity: 0.92, location_type: 'peak' },
  },
  {
    name: 'Oia, Santorini, Greece',
    lat: 36.4618,
    lon: 25.3753,
    description: 'Whitewashed cliffside village overlooking the deep blue Aegean volcanic caldera.',
    match_score: 0.95,
    features: { scenery_type: 'coastal', urban_density: 0.4, popularity: 0.96, location_type: 'island' },
  },
  {
    name: 'Manhattan & Central Park, New York',
    lat: 40.785091,
    lon: -73.968285,
    description: 'Iconic green urban oasis framed by soaring architectural skyscraper skylines.',
    match_score: 0.94,
    features: { scenery_type: 'urban', urban_density: 0.95, popularity: 0.98, location_type: 'park' },
  },
  {
    name: 'Amalfi Coast, Italy',
    lat: 40.6333,
    lon: 14.6029,
    description: 'Dramatic vertical Mediterranean cliffs dotted with pastel villas and lemon groves.',
    match_score: 0.93,
    features: { scenery_type: 'coastal', urban_density: 0.35, popularity: 0.91, location_type: 'coast' },
  },
  {
    name: 'Lake Louise & Banff, Canada',
    lat: 51.4254,
    lon: -116.1773,
    description: 'Turquoise glacial alpine waters surrounded by rugged Rocky Mountain peaks.',
    match_score: 0.96,
    features: { scenery_type: 'mountain', urban_density: 0.1, popularity: 0.94, location_type: 'lake' },
  },
  {
    name: 'Reykjavik & Golden Circle, Iceland',
    lat: 64.1466,
    lon: -21.9426,
    description: 'Land of geothermal geysers, volcanic lava fields, and aurora borealis night skies.',
    match_score: 0.92,
    features: { scenery_type: 'nature', urban_density: 0.25, popularity: 0.89, location_type: 'geothermal' },
  },
  {
    name: 'Yosemite Valley, California',
    lat: 37.7456,
    lon: -119.5936,
    description: 'Granite monoliths El Capitan and Half Dome carved by ancient glacial waterfalls.',
    match_score: 0.95,
    features: { scenery_type: 'mountain', urban_density: 0.05, popularity: 0.95, location_type: 'valley' },
  },
  {
    name: 'Kyoto Arashiyama & Gion, Japan',
    lat: 35.0116,
    lon: 135.6778,
    description: 'Historic bamboo groves, traditional wooden machiya shrines, and tranquil gardens.',
    match_score: 0.94,
    features: { scenery_type: 'park', urban_density: 0.5, popularity: 0.93, location_type: 'cultural' },
  },
  {
    name: 'Dolomites & Tre Cime, Italy',
    lat: 46.6186,
    lon: 12.2987,
    description: 'Stunning jagged limestone spires rising from lush green South Tyrolean meadows.',
    match_score: 0.97,
    features: { scenery_type: 'mountain', urban_density: 0.1, popularity: 0.92, location_type: 'peak' },
  },
  {
    name: 'Eiffel Tower & Seine, Paris',
    lat: 48.8584,
    lon: 2.2945,
    description: 'Haussmannian boulevards, romantic river bridges, and timeless architectural beauty.',
    match_score: 0.95,
    features: { scenery_type: 'urban', urban_density: 0.92, popularity: 0.99, location_type: 'city' },
  },
];

class AIService {
  private baseUrl: string;

  constructor() {
    const apiUrl = import.meta.env.VITE_API_URL || '';
    this.baseUrl = apiUrl ? `${apiUrl}/api/ai` : '/api/ai';
  }

  async discoverLocations(params: {
    query: string;
    preferences?: Record<string, any>;
    limit?: number;
  }): Promise<LocationResponse> {
    const { query, preferences = {}, limit = 8 } = params;

    // 1. Try Backend API if configured and available
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500); // 2.5s fast timeout

      const response = await fetch(`${this.baseUrl}/location/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data && data.success && data.results && data.results.length > 0) {
          return data;
        }
      }
    } catch {
      // Backend unavailable or timed out; continue to intelligent client-side semantic discovery
    }

    // 2. Intelligent Client-Side Semantic Discovery
    return this.fallbackSemanticSearch(query, preferences, limit);
  }

  private async fallbackSemanticSearch(
    query: string,
    preferences: Record<string, any>,
    limit: number
  ): Promise<LocationResponse> {
    const cleanQuery = query.toLowerCase().trim();
    const queryTokens = cleanQuery.split(/[\s,.-]+/).filter(Boolean);

    // Score Curated Locations based on semantic match
    const scoredCurated = CURATED_LOCATIONS.map((loc) => {
      let score = 0.5;
      const targetText = `${loc.name} ${loc.description} ${loc.features.scenery_type} ${loc.features.location_type}`.toLowerCase();

      // Check token matches
      let matchCount = 0;
      queryTokens.forEach((token) => {
        if (targetText.includes(token)) {
          matchCount++;
          score += 0.15;
        }
      });

      // Preferences matching bonus
      if (preferences.prefer_scenic && (loc.features.scenery_type === 'coastal' || loc.features.scenery_type === 'mountain')) {
        score += 0.1;
      }
      if (preferences.prefer_urban && loc.features.scenery_type === 'urban') {
        score += 0.15;
      }
      if (preferences.prefer_nature && (loc.features.scenery_type === 'mountain' || loc.features.scenery_type === 'forest')) {
        score += 0.15;
      }
      if (preferences.prefer_quiet && loc.features.urban_density < 0.3) {
        score += 0.1;
      }

      if (matchCount > 0) {
        score = Math.min(0.99, score + (matchCount / queryTokens.length) * 0.3);
      }

      return {
        ...loc,
        match_score: parseFloat(score.toFixed(2)),
      };
    })
      .filter((loc) => loc.match_score > 0.6)
      .sort((a, b) => b.match_score - a.match_score);

    // If query didn't match curated database well, query OpenStreetMap Nominatim
    if (scoredCurated.length < 3) {
      try {
        const osmRes = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=${limit}&addressdetails=1`,
          {
            headers: { 'Accept-Language': 'en' },
          }
        );
        if (osmRes.ok) {
          const osmData = await osmRes.json();
          if (Array.isArray(osmData) && osmData.length > 0) {
            const osmLocations: LocationResult[] = osmData.map((item: any) => {
              const type = item.type || item.class || 'location';
              let scenery = 'urban';
              if (type.includes('peak') || type.includes('mountain') || type.includes('volcano')) scenery = 'mountain';
              else if (type.includes('water') || type.includes('coast') || type.includes('beach') || type.includes('bay')) scenery = 'coastal';
              else if (type.includes('park') || type.includes('forest') || type.includes('wood')) scenery = 'park';

              return {
                name: item.display_name.split(',').slice(0, 3).join(','),
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
                description: item.display_name,
                match_score: 0.92,
                features: {
                  scenery_type: scenery,
                  urban_density: scenery === 'urban' ? 0.8 : 0.2,
                  popularity: 0.85,
                  location_type: type,
                },
              };
            });

            return {
              success: true,
              query,
              criteria: { semantic_match: true, osm_geocoded: true },
              results: [...scoredCurated, ...osmLocations].slice(0, limit),
              total_found: scoredCurated.length + osmLocations.length,
              error: null,
            };
          }
        }
      } catch {
        // Fall back to best curated matches
      }
    }

    const finalResults = scoredCurated.length > 0 ? scoredCurated.slice(0, limit) : CURATED_LOCATIONS.slice(0, 4);

    return {
      success: true,
      query,
      criteria: { semantic_curated: true },
      results: finalResults,
      total_found: finalResults.length,
      error: null,
    };
  }
}

export const aiService = new AIService();
