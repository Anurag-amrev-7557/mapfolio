/**
 * Parse XML GPX file content into GeoJSON LineString
 */
export interface GpxTrackResult {
  geojson: {
    type: 'Feature';
    properties: { name: string };
    geometry: {
      type: 'LineString';
      coordinates: [number, number][];
    };
  };
  distanceKm: number;
  name?: string;
}

export function parseGpxTrack(gpxContent: string): GpxTrackResult | null {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(gpxContent, 'text/xml');

    const nameNode = xmlDoc.querySelector('name');
    const routeName = nameNode ? nameNode.textContent || 'Imported GPX Track' : 'Imported GPX Track';

    const points = Array.from(xmlDoc.querySelectorAll('trkpt, rtept, wpt'));
    if (points.length === 0) return null;

    const coordinates: [number, number][] = points
      .map((pt) => {
        const lat = parseFloat(pt.getAttribute('lat') || '');
        const lon = parseFloat(pt.getAttribute('lon') || '');
        return [lon, lat] as [number, number];
      })
      .filter(([lon, lat]) => !isNaN(lon) && !isNaN(lat));

    if (coordinates.length < 2) return null;

    let totalDist = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const p1 = coordinates[i];
      const p2 = coordinates[i + 1];
      const dx = (p2[0] - p1[0]) * 111.32;
      const dy = (p2[1] - p1[1]) * 111.32;
      totalDist += Math.sqrt(dx * dx + dy * dy);
    }

    const geojson: GpxTrackResult['geojson'] = {
      type: 'Feature',
      properties: { name: routeName },
      geometry: {
        type: 'LineString',
        coordinates,
      },
    };

    return {
      geojson,
      distanceKm: parseFloat(totalDist.toFixed(2)),
      name: routeName,
    };
  } catch (err) {
    console.error('GPX parse error:', err);
    return null;
  }
}
