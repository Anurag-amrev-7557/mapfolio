/**
 * Routing Engine for Mapfolio
 * Fetches road-snapped GeoJSON routes from OSRM for waypoints,
 * with automatic profile support and direct point-to-point fallbacks.
 */

export interface Waypoint {
  lat: number;
  lng: number;
}

export type RoutingProfile = 'driving' | 'cycling' | 'foot' | 'direct';
export type RoutePreference = 'shortest' | 'fastest';

export async function fetchOsrmRoadRoute(
  waypoints: Waypoint[],
  profile: RoutingProfile,
  preference: RoutePreference = 'shortest'
): Promise<{ geojson: any; distanceKm: number } | null> {
  if (!waypoints || waypoints.length < 2) return null;

  // Direct Point-to-Point Mode
  if (profile === 'direct') {
    const coords = waypoints.map((w) => [w.lng, w.lat]);
    let dist = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      const p1 = coords[i];
      const p2 = coords[i + 1];
      const dx = (p2[0] - p1[0]) * 111.32;
      const dy = (p2[1] - p1[1]) * 111.32;
      dist += Math.sqrt(dx * dx + dy * dy);
    }
    return {
      geojson: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coords },
      },
      distanceKm: parseFloat(dist.toFixed(2)),
    };
  }

  const osrmProfile = profile === 'driving' ? 'driving' : profile === 'cycling' ? 'bike' : 'foot';

  // Segment-by-segment routing to eliminate intermediate U-turn penalties and forced highway loops
  const segmentPromises = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    const w1 = waypoints[i];
    const w2 = waypoints[i + 1];
    const coordsStr = `${w1.lng.toFixed(6)},${w1.lat.toFixed(6)};${w2.lng.toFixed(6)},${w2.lat.toFixed(6)}`;
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coordsStr}?overview=full&geometries=geojson&alternatives=3&continue_straight=false&radiuses=3500;3500`;

    segmentPromises.push(
      fetch(url)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (!data || !data.routes || data.routes.length === 0) return null;
          let chosen = data.routes[0];
          if (preference === 'shortest' && data.routes.length > 1) {
            chosen = data.routes.reduce((prev: any, curr: any) =>
              curr.distance < prev.distance ? curr : prev
            );
          }
          return chosen;
        })
        .catch(() => null)
    );
  }

  try {
    const results = await Promise.all(segmentPromises);
    const validSegments = results.filter((r) => r !== null);

    if (validSegments.length === 0) {
      // Fallback to direct straight line if OSRM fails or has no network
      return fetchOsrmRoadRoute(waypoints, 'direct', preference);
    }

    let combinedCoordinates: [number, number][] = [];
    let totalDistMeters = 0;

    for (let i = 0; i < results.length; i++) {
      const seg = results[i];
      if (seg && seg.geometry && seg.geometry.coordinates) {
        const segCoords = seg.geometry.coordinates as [number, number][];
        if (combinedCoordinates.length > 0) {
          combinedCoordinates.push(...segCoords.slice(1));
        } else {
          combinedCoordinates.push(...segCoords);
        }
        totalDistMeters += seg.distance || 0;
      } else {
        // Fallback straight segment between the two points
        const w1 = waypoints[i];
        const w2 = waypoints[i + 1];
        if (combinedCoordinates.length === 0) {
          combinedCoordinates.push([w1.lng, w1.lat]);
        }
        combinedCoordinates.push([w2.lng, w2.lat]);
      }
    }

    return {
      geojson: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: combinedCoordinates,
        },
      },
      distanceKm: parseFloat((totalDistMeters / 1000).toFixed(2)),
    };
  } catch (err) {
    // Graceful fallback to direct line
    return fetchOsrmRoadRoute(waypoints, 'direct', preference);
  }
}
