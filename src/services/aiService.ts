/**
 * AI Service Client
 * Handles communication with the AI backend services
 */

interface LocationResponse {
  success: boolean;
  query: string;
  criteria: Record<string, boolean>;
  results: Array<{
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
  }>;
  total_found: number;
  error: string | null;
}

class AIService {
  private baseUrl: string;

  constructor() {
    // Use environment variable for production, fallback to proxy for development
    const apiUrl = import.meta.env.VITE_API_URL || '';
    this.baseUrl = apiUrl ? `${apiUrl}/api/ai` : '/api/ai';
  }

  async discoverLocations(params: {
    query: string;
    preferences?: Record<string, any>;
    limit?: number;
  }): Promise<LocationResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/location/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error discovering locations:', error);
      return {
        success: false,
        query: params.query,
        criteria: {},
        results: [],
        total_found: 0,
        error: error instanceof Error ? error.message : 'Failed to discover locations',
      };
    }
  }
}

export const aiService = new AIService();
