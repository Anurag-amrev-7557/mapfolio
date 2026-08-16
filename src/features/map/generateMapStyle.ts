import type { StyleSpecification } from 'maplibre-gl';
import type { ThemePalette, LayerVisibilityState } from '@/core';

/**
 * Generates a MapLibre style for a theme palette, rendered from OpenFreeMap
 * (OpenMapTiles-based) vector tiles. This mirrors how the original Mapfolio
 * app renders its curated themes: every map layer is painted from the
 * theme's palette instead of swapping generic basemap styles.
 */

const OPENFREEMAP_SOURCE = 'https://tiles.openfreemap.org/planet';
const SOURCE_ID = 'openfreemap';
const SOURCE_MAX_ZOOM = 14;

const BUILDING_FILL_OPACITY = 1.0;
const MAP_BUILDING_MIN_ZOOM = 8;

const MAP_WATERWAY_WIDTH_STOPS: [number, number][] = [
  [0, 0.2],
  [6, 0.34],
  [12, 0.8],
  [18, 2.4],
];

const MAP_RAIL_WIDTH_STOPS: [number, number][] = [
  [3, 0.4],
  [6, 0.7],
  [10, 1],
  [18, 1.5],
];

const MAP_ROAD_MAJOR_CLASSES = ['motorway'];

const MAP_ROAD_MINOR_HIGH_CLASSES = [
  'primary',
  'primary_link',
  'secondary',
  'secondary_link',
  'motorway_link',
  'trunk',
  'trunk_link',
];

const MAP_ROAD_MINOR_MID_CLASSES = ['tertiary', 'tertiary_link', 'minor'];

const MAP_ROAD_MINOR_LOW_CLASSES = [
  'residential',
  'living_street',
  'unclassified',
  'road',
  'street',
  'street_limited',
  'service',
];

const MAP_ROAD_PATH_CLASSES = ['path', 'pedestrian', 'cycleway', 'track'];
const MAP_RAIL_CLASSES = ['rail', 'transit'];

const MAP_ROAD_MINOR_HIGH_OVERVIEW_WIDTH_STOPS: [number, number][] = [
  [0, 0.1],
  [4, 0.18],
  [8, 0.3],
  [11, 0.46],
];
const MAP_ROAD_MINOR_MID_OVERVIEW_WIDTH_STOPS: [number, number][] = [
  [0, 0.08],
  [4, 0.14],
  [8, 0.24],
  [11, 0.36],
];
const MAP_ROAD_MINOR_LOW_OVERVIEW_WIDTH_STOPS: [number, number][] = [
  [0, 0.06],
  [4, 0.1],
  [8, 0.18],
  [11, 0.3],
];
const MAP_ROAD_MINOR_HIGH_DETAIL_WIDTH_STOPS: [number, number][] = [
  [6, 0.46],
  [10, 0.8],
  [14, 1.48],
  [18, 2.7],
];
const MAP_ROAD_MINOR_MID_DETAIL_WIDTH_STOPS: [number, number][] = [
  [6, 0.34],
  [10, 0.62],
  [14, 1.2],
  [18, 2.35],
];
const MAP_ROAD_MINOR_LOW_DETAIL_WIDTH_STOPS: [number, number][] = [
  [6, 0.24],
  [10, 0.44],
  [14, 0.84],
  [18, 1.65],
];
const MAP_ROAD_PATH_OVERVIEW_WIDTH_STOPS: [number, number][] = [
  [5, 0.06],
  [8, 0.1],
  [11, 0.2],
];
const MAP_ROAD_PATH_DETAIL_WIDTH_STOPS: [number, number][] = [
  [8, 0.2],
  [12, 0.42],
  [16, 0.85],
  [18, 1.3],
];
const MAP_ROAD_MAJOR_WIDTH_STOPS: [number, number][] = [
  [0, 0.36],
  [3, 0.52],
  [9, 1.1],
  [14, 2.05],
  [18, 3.3],
];

const ROAD_MINOR_OVERVIEW_MIN_ZOOM = 0;
const ROAD_MINOR_DETAIL_MIN_ZOOM = 6;
const ROAD_PATH_OVERVIEW_MIN_ZOOM = 5;
const ROAD_PATH_DETAIL_MIN_ZOOM = 8;
const ROAD_OVERVIEW_MAX_ZOOM = 11.8;

const LINE_GEOMETRY_FILTER = [
  'match',
  ['geometry-type'],
  ['LineString', 'MultiLineString'],
  true,
  false,
] as const;

function widthExpr(stops: [number, number][]): any {
  const flat = stops.flatMap(([zoom, width]) => [zoom, width]);
  return ['interpolate', ['linear'], ['zoom'], ...flat];
}

function opacityExpr(stops: [number, number][]): any {
  const flat = stops.flatMap(([zoom, opacity]) => [zoom, opacity]);
  return ['interpolate', ['linear'], ['zoom'], ...flat];
}

function lineClassFilter(classes: string[]): any {
  return [
    'all',
    LINE_GEOMETRY_FILTER,
    ['match', ['get', 'class'], classes, true, false],
  ];
}

export function generateMapStyle(
  theme: ThemePalette,
  visibility?: LayerVisibilityState,
  heatmapData?: any,
  lighting?: {
    sunAzimuth?: number;
    sunPolarAngle?: number;
    sunIntensity?: number;
    celestialBody?: 'auto' | 'sun' | 'moon';
  }
): StyleSpecification {
  const {
    land,
    landcover,
    water,
    waterway,
    parks,
    buildings,
    aeroway,
    rail,
    roads,
  } = theme;

  const isVisible = (key: keyof LayerVisibilityState) =>
    visibility ? (visibility[key] ? 'visible' : 'none') : 'visible';

  // Real-time Celestial Sun / Moon Lighting & Soft Architectural Shading
  const isDark = land.startsWith('#') && parseInt(land.slice(1, 3), 16) < 120;
  const isMoon = lighting?.celestialBody === 'moon' || (lighting?.celestialBody !== 'sun' && isDark);
  const celestialColor = isMoon ? '#cbd5e1' : '#ffffff';
  const azimuth = lighting?.sunAzimuth ?? 315;
  const polarAngle = lighting?.sunPolarAngle ?? 36;
  const intensity = (lighting?.sunIntensity ?? 0.38) * (isMoon ? 0.85 : 0.95);

  return {
    version: 8,
    name: 'Mapfolio Pro Style',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    light: {
      anchor: 'map',
      color: celestialColor,
      intensity,
      position: [1.5, azimuth, polarAngle],
    },
    sources: {
      [SOURCE_ID]: {
        type: 'vector',
        url: OPENFREEMAP_SOURCE,
        maxzoom: SOURCE_MAX_ZOOM,
      },
      'satellite-source': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
      },
      'historical-source': {
        type: 'raster',
        tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 19,
      },
      'contours-source': {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        encoding: 'terrarium',
        tileSize: 256,
        maxzoom: 15,
      },
      'bathymetry-source': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 13,
      },
      'heatmap-source': {
        type: 'geojson',
        data: heatmapData || { type: 'FeatureCollection', features: [] },
      },
      'terrain-source': {
        type: 'raster-dem',
        tiles: ['https://elevation-tiles-prod.s3.amazonaws.com/v2/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        maxzoom: 14,
        encoding: 'terrarium',
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': land },
      },

      // Elevation Contours & Topo Relief Layer
      {
        id: 'contours-blend',
        type: 'hillshade',
        source: 'contours-source',
        layout: { visibility: isVisible('contours') },
        paint: {
          'hillshade-exaggeration': 0.6,
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-accent-color': '#000000',
        },
      },

      // Satellite Imagery Blend Layer
      {
        id: 'satellite-blend',
        type: 'raster',
        source: 'satellite-source',
        layout: { visibility: isVisible('satellite') },
        paint: {
          'raster-opacity': 0.65,
          'raster-saturation': -0.2,
          'raster-contrast': 0.1,
        },
      },

      // Historical Vintage Blend Layer
      {
        id: 'historical-blend',
        type: 'raster',
        source: 'historical-source',
        layout: { visibility: isVisible('historical') },
        paint: {
          'raster-opacity': 0.35,
          'raster-saturation': -0.8,
          'raster-contrast': 0.2,
        },
      },

      {
        id: 'landcover',
        source: SOURCE_ID,
        'source-layer': 'landcover',
        type: 'fill',
        layout: { visibility: isVisible('landcover') },
        paint: {
          'fill-color': landcover,
          'fill-opacity': 0.7,
        },
      },

      {
        id: 'park',
        source: SOURCE_ID,
        'source-layer': 'park',
        type: 'fill',
        layout: { visibility: isVisible('parks') },
        paint: { 'fill-color': parks },
      },

      {
        id: 'water',
        source: SOURCE_ID,
        'source-layer': 'water',
        type: 'fill',
        layout: { visibility: isVisible('water') },
        paint: { 'fill-color': water },
      },

      // Coastal Shoreline Buffer Vignette (Outer & Inner Depth Glow)
      {
        id: 'water-coastal-glow-outer',
        source: SOURCE_ID,
        'source-layer': 'water',
        type: 'line',
        layout: {
          visibility: isVisible('water'),
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': roads.minor_high || '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.2, 10, 2.6, 16, 5],
          'line-blur': 2.5,
          'line-opacity': 0.28,
        },
      },
      {
        id: 'water-coastal-glow-inner',
        source: SOURCE_ID,
        'source-layer': 'water',
        type: 'line',
        layout: {
          visibility: isVisible('water'),
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.6, 10, 1.4, 16, 2.5],
          'line-opacity': 0.22,
        },
      },

      // Multi-Directional Shaded Relief (MDS): Primary NW Sun + Ambient SE Fill
      {
        id: 'terrain-primary',
        type: 'hillshade',
        source: 'terrain-source',
        layout: { visibility: isVisible('terrain') },
        paint: {
          'hillshade-exaggeration': 0.75,
          'hillshade-shadow-color': roads.minor_high || '#000000',
          'hillshade-highlight-color': '#ffffff',
          'hillshade-accent-color': land,
          'hillshade-illumination-direction': 315,
          'hillshade-illumination-anchor': 'viewport',
        },
      },
      {
        id: 'terrain-ambient-fill',
        type: 'hillshade',
        source: 'terrain-source',
        layout: { visibility: isVisible('terrain') },
        paint: {
          'hillshade-exaggeration': 0.32,
          'hillshade-shadow-color': '#000000',
          'hillshade-highlight-color': landcover || '#ffffff',
          'hillshade-illumination-direction': 135,
          'hillshade-illumination-anchor': 'viewport',
        },
      },

      // Ocean Bathymetry Blend Layer (renders on top of water fill)
      {
        id: 'bathymetry-blend',
        type: 'raster',
        source: 'bathymetry-source',
        layout: { visibility: isVisible('bathymetry') },
        paint: {
          'raster-opacity': 0.7,
          'raster-saturation': -0.1,
          'raster-contrast': 0.15,
        },
      },
      {
        id: 'waterway',
        source: SOURCE_ID,
        'source-layer': 'waterway',
        type: 'line',
        filter: lineClassFilter(['river', 'canal', 'stream', 'ditch']),
        layout: {
          visibility: isVisible('water'),
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': waterway,
          'line-width': widthExpr(MAP_WATERWAY_WIDTH_STOPS),
        },
      },

      {
        id: 'aeroway',
        source: SOURCE_ID,
        'source-layer': 'aeroway',
        type: 'fill',
        filter: [
          'match',
          ['geometry-type'],
          ['MultiPolygon', 'Polygon'],
          true,
          false,
        ],
        layout: { visibility: isVisible('aeroway') },
        paint: {
          'fill-color': aeroway,
          'fill-opacity': 0.85,
        },
      },

      {
        id: 'building',
        source: SOURCE_ID,
        'source-layer': 'building',
        type: 'fill',
        minzoom: MAP_BUILDING_MIN_ZOOM,
        layout: { visibility: visibility?.buildings && !visibility?.buildings3D ? 'visible' : 'none' },
        paint: {
          'fill-color': buildings,
          'fill-opacity': BUILDING_FILL_OPACITY,
        },
      },

      {
        id: 'rail',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        filter: lineClassFilter(MAP_RAIL_CLASSES),
        layout: {
          visibility: isVisible('rail'),
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': rail,
          'line-width': widthExpr(MAP_RAIL_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [0, 0.56],
            [12, 0.62],
            [18, 0.72],
          ]),
          'line-dasharray': [2, 1.6],
        },
      },

      {
        id: 'road-minor-overview-high',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_OVERVIEW_MIN_ZOOM,
        maxzoom: ROAD_OVERVIEW_MAX_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_HIGH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': roads.minor_high,
          'line-width': widthExpr(MAP_ROAD_MINOR_HIGH_OVERVIEW_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [0, 0.66],
            [8, 0.76],
            [12, 0],
          ]),
        },
      },
      {
        id: 'road-minor-overview-mid',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_OVERVIEW_MIN_ZOOM,
        maxzoom: ROAD_OVERVIEW_MAX_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_MID_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': roads.minor_mid,
          'line-width': widthExpr(MAP_ROAD_MINOR_MID_OVERVIEW_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [0, 0.46],
            [8, 0.56],
            [12, 0],
          ]),
        },
      },
      {
        id: 'road-minor-overview-low',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_OVERVIEW_MIN_ZOOM,
        maxzoom: ROAD_OVERVIEW_MAX_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_LOW_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': roads.minor_low,
          'line-width': widthExpr(MAP_ROAD_MINOR_LOW_OVERVIEW_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [0, 0.26],
            [8, 0.34],
            [12, 0],
          ]),
        },
      },
      {
        id: 'road-path-overview',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_PATH_OVERVIEW_MIN_ZOOM,
        maxzoom: ROAD_OVERVIEW_MAX_ZOOM,
        filter: lineClassFilter(MAP_ROAD_PATH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': roads.path,
          'line-width': widthExpr(MAP_ROAD_PATH_OVERVIEW_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [5, 0.45],
            [9, 0.58],
            [12, 0],
          ]),
        },
      },

      {
        id: 'road-major-casing',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        filter: lineClassFilter(MAP_ROAD_MAJOR_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.outline,
          'line-width': widthExpr(
            MAP_ROAD_MAJOR_WIDTH_STOPS.map(([z, w]) => [z, w * 1.38]),
          ),
          'line-opacity': 0.95,
        },
      },
      {
        id: 'road-minor-high-casing',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_HIGH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.outline,
          'line-width': widthExpr(
            MAP_ROAD_MINOR_HIGH_DETAIL_WIDTH_STOPS.map(([z, w]) => [z, w * 1.45]),
          ),
          'line-opacity': opacityExpr([
            [6, 0.72],
            [12, 0.85],
            [18, 0.92],
          ]),
        },
      },
      {
        id: 'road-minor-mid-casing',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_MID_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.outline,
          'line-width': widthExpr(
            MAP_ROAD_MINOR_MID_DETAIL_WIDTH_STOPS.map(([z, w]) => [z, w * 1.15]),
          ),
          'line-opacity': opacityExpr([
            [6, 0.42],
            [12, 0.56],
            [18, 0.66],
          ]),
        },
      },
      {
        id: 'road-path-casing',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_PATH_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_PATH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.outline,
          'line-width': widthExpr(
            MAP_ROAD_PATH_DETAIL_WIDTH_STOPS.map(([z, w]) => [z, w * 1.6]),
          ),
          'line-opacity': opacityExpr([
            [8, 0.62],
            [12, 0.72],
            [18, 0.85],
          ]),
        },
      },

      {
        id: 'road-major',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        filter: lineClassFilter(MAP_ROAD_MAJOR_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.major,
          'line-width': widthExpr(MAP_ROAD_MAJOR_WIDTH_STOPS),
        },
      },
      {
        id: 'road-minor-high',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_HIGH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.minor_high,
          'line-width': widthExpr(MAP_ROAD_MINOR_HIGH_DETAIL_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [6, 0.84],
            [10, 0.92],
            [18, 1],
          ]),
        },
      },
      {
        id: 'road-minor-mid',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_MID_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.minor_mid,
          'line-width': widthExpr(MAP_ROAD_MINOR_MID_DETAIL_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [6, 0.62],
            [10, 0.74],
            [18, 0.86],
          ]),
        },
      },
      {
        id: 'road-minor-low',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_MINOR_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_MINOR_LOW_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.minor_low,
          'line-width': widthExpr(MAP_ROAD_MINOR_LOW_DETAIL_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [6, 0.34],
            [10, 0.46],
            [18, 0.58],
          ]),
        },
      },
      {
        id: 'road-path',
        source: SOURCE_ID,
        'source-layer': 'transportation',
        type: 'line',
        minzoom: ROAD_PATH_DETAIL_MIN_ZOOM,
        filter: lineClassFilter(MAP_ROAD_PATH_CLASSES),
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          'line-sort-key': ['coalesce', ['get', 'layer'], 0],
        },
        paint: {
          'line-color': roads.path,
          'line-width': widthExpr(MAP_ROAD_PATH_DETAIL_WIDTH_STOPS),
          'line-opacity': opacityExpr([
            [8, 0.7],
            [12, 0.82],
            [18, 0.95],
          ]),
        },
      },

      // Heatmap Data Layer
      {
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-source',
        layout: { visibility: isVisible('heatmap') },
        paint: {
          'heatmap-weight': 1,
          'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 1,
            9, 3
          ],
          'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(33,102,172,0)',
            0.2, 'rgb(103,169,207)',
            0.4, 'rgb(209,229,240)',
            0.6, 'rgb(253,219,199)',
            0.8, 'rgb(239,138,98)',
            1, 'rgb(178,24,43)'
          ],
          'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 2,
            9, 20
          ],
          'heatmap-opacity': 0.8
        }
      },

      // ==========================================
      // 3D BUILDING EXTRUSIONS (RENDERED OVER ROADS)
      // ==========================================
      {
        id: 'building-3d',
        source: SOURCE_ID,
        'source-layer': 'building',
        type: 'fill-extrusion',
        minzoom: 12,
        layout: { visibility: isVisible('buildings3D') },
        paint: {
          // Theme-Harmonized Architectural Materials with Legible Ambient Contrast
          'fill-extrusion-color': buildings,
          'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 8],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
          'fill-extrusion-opacity': 1.0,
          // Subtle vertical gradient for realistic ground ambient occlusion
          'fill-extrusion-vertical-gradient': true,
        },
      },

      // ==========================================
      // MAP LOCATION LABELS & TYPOGRAPHY
      // ==========================================
      {
        id: 'label-country',
        source: SOURCE_ID,
        'source-layer': 'place',
        type: 'symbol',
        minzoom: 1,
        maxzoom: 6,
        filter: ['==', 'class', 'country'],
        layout: {
          visibility: isVisible('labels'),
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 1, 10, 4, 14, 6, 16],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.15,
          'text-max-width': 8,
        },
        paint: {
          'text-color': roads.major,
          'text-halo-color': land,
          'text-halo-width': 1.5,
          'text-halo-blur': 0.5,
          'text-opacity': 0.9,
        },
      },
      {
        id: 'label-state',
        source: SOURCE_ID,
        'source-layer': 'place',
        type: 'symbol',
        minzoom: 4,
        maxzoom: 9,
        filter: ['==', 'class', 'state'],
        layout: {
          visibility: isVisible('labels'),
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 4, 9, 7, 12, 9, 14],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.12,
        },
        paint: {
          'text-color': roads.minor_high,
          'text-halo-color': land,
          'text-halo-width': 1.5,
          'text-opacity': 0.85,
        },
      },
      {
        id: 'label-city',
        source: SOURCE_ID,
        'source-layer': 'place',
        type: 'symbol',
        minzoom: 5,
        maxzoom: 14,
        filter: ['in', 'class', 'city', 'town'],
        layout: {
          visibility: isVisible('labels'),
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 5, 11, 8, 13, 11, 16, 14, 18],
          'text-letter-spacing': 0.06,
          'text-max-width': 9,
        },
        paint: {
          'text-color': roads.major,
          'text-halo-color': land,
          'text-halo-width': 1.8,
          'text-halo-blur': 0.5,
          'text-opacity': 0.95,
        },
      },
      {
        id: 'label-neighborhood',
        source: SOURCE_ID,
        'source-layer': 'place',
        type: 'symbol',
        minzoom: 11,
        maxzoom: 17,
        filter: ['in', 'class', 'village', 'suburb', 'neighbourhood', 'quarter'],
        layout: {
          visibility: isVisible('labels'),
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 13, 12, 16, 14],
          'text-letter-spacing': 0.04,
          'text-transform': 'none',
        },
        paint: {
          'text-color': roads.minor_high,
          'text-halo-color': land,
          'text-halo-width': 1.2,
          'text-opacity': 0.8,
        },
      },
      {
        id: 'label-street',
        source: SOURCE_ID,
        'source-layer': 'transportation_name',
        type: 'symbol',
        minzoom: 13,
        layout: {
          visibility: isVisible('labels'),
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 9, 15, 11, 18, 13],
          'text-letter-spacing': 0.04,
          'text-rotation-alignment': 'map',
          'text-pitch-alignment': 'viewport',
          'text-max-angle': 38,
          'text-keep-upright': true,
          'text-padding': 4,
          'symbol-avoid-edges': true,
        },
        paint: {
          'text-color': roads.minor_mid,
          'text-halo-color': land,
          'text-halo-width': 1.4,
          'text-halo-blur': 0.4,
          'text-opacity': 0.85,
        },
      },
      // POI Landmark Icons & Labels
      {
        id: 'poi-landmarks',
        source: SOURCE_ID,
        'source-layer': 'poi',
        type: 'symbol',
        minzoom: 12,
        layout: {
          visibility: isVisible('poiIcons'),
          'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 15, 11, 18, 13],
          'text-letter-spacing': 0.05,
          'text-offset': [0, 0.8],
          'text-anchor': 'top',
        },
        paint: {
          'text-color': roads.major,
          'text-halo-color': land,
          'text-halo-width': 1.5,
          'text-opacity': 0.85,
        },
      },
    ],
  };
}
