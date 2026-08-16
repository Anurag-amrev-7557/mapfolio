# 3D Tiles Pipeline for Mapfolio

This pipeline generates custom 3D building tiles from OpenStreetMap data for photorealistic rendering.

## Overview

**Phase 1: Current State** ✅
- Simple fill-extrusion buildings with procedural coloring
- Height-based and material-based coloring
- Works at zoom 15+

**Phase 2: Procedural Textures** ✅
- Building colors based on height (skyscrapers, offices, residential)
- Material-based coloring (brick, concrete, glass, steel, wood)
- Vertical gradient for realism
- No external data needed

**Phase 3: Custom 3D Tiles** (In Progress)
- Fetch OSM building footprints
- Generate 3D geometry with textures
- Convert to 3D Tiles format
- Host on static server
- Load in MapLibre

## Quick Start

### Option A: Use Existing Open 3D Tile Services

**Re:Earth Buildings (Free)**
- URL: `https://buildings.reearth.land/3dtiles/root.json`
- Coverage: Global (2.6B buildings)
- Format: 3D Tiles 1.1 + glTF
- License: ODbL 1.0 (attribution required)

**Cesium ion OSM Buildings (Free Tier)**
- Sign up at https://cesium.com/ion/
- Import OSM data
- Export as 3D Tiles
- Free tier: 1 GB storage

### Option B: Generate Your Own 3D Tiles

#### Prerequisites
```bash
pip install py3dtiles requests pyproj numpy
```

#### Generate Tiles
```bash
cd backend/3d-tiles-pipeline
python generate_3d_tiles.py
```

This will:
1. Fetch building footprints from OSM
2. Estimate heights from building tags
3. Determine materials
4. Generate tileset structure
5. Save to `output_3dtiles/tileset.json`

#### Convert to B3DM Format
```bash
# Install tools
pip install 3d-tiles-tools

# Convert glTF to b3dm
3d-tiles-tools gltf-to-b3dm input.glb output.b3dm
```

#### Host the Tiles
```bash
# Option 1: GitHub Pages
git init
git add output_3dtiles/
git commit -m "Add 3D tiles"
git push

# Option 2: AWS S3
aws s3 sync output_3dtiles/ s3://your-bucket/3dtiles/

# Option 3: Cloudflare R2
rclone sync output_3dtiles/ r2:your-bucket/3dtiles/
```

#### Load in MapLibre
```typescript
import MaplibreGL3DTiles from 'maplibre-gl-3d-tiles';

const control = new MaplibreGL3DTiles.ThreeDTilesControl({
  tilesetUrl: 'https://your-domain.com/3dtiles/tileset.json',
  altitudeOffset: 0,
  visible: true,
  flyToOnLoad: false,
  collapsed: false,
});

map.addControl(control, 'top-right');
```

## Data Sources

### OpenStreetMap Building Footprints
- **Microsoft Building Footprints**: 135M buildings globally
  - Download: https://github.com/microsoft/Global-Microsoft-Building-Footprints
- **Google Open Buildings**: 1.5B building footprints
  - Access: Google Cloud Platform
- **OpenStreetMap**: Real-time data via Overpass API

### Height Data
- OSM tags: `height`, `building:levels`
- Estimated from building type
- Or use digital elevation models (DEM)

### Material Data
- OSM tags: `building:material`
- Heuristic based on building type
- Procedural generation for missing data

## Pipeline Stages

### Stage 1: Data Collection
```
OSM Overpass API → Building Footprints
     ↓
Height Estimation → Building Heights
     ↓
Material Detection → Building Materials
```

### Stage 2: 3D Geometry Generation
```
Footprint → Extruded Geometry
     ↓
Texture Generation → Procedural Textures
     ↓
glTF Export → 3D Model Files
```

### Stage 3: Tileset Creation
```
3D Models → Spatial Indexing
     ↓
LOD Generation → Multi-resolution Tiles
     ↓
3D Tiles Format → tileset.json + .b3dm
```

### Stage 4: Hosting & Loading
```
Tileset Files → Static Hosting
     ↓
CDN Distribution → Fast Loading
     ↓
MapLibre Integration → Display in App
```

## Performance Optimization

### Level of Detail (LOD)
- **LOD 0** (zoom 12-14): Simplified geometries, no textures
- **LOD 1** (zoom 15-16): Medium detail, basic textures
- **LOD 2** (zoom 17+): Full detail, high-res textures

### Caching
- Browser cache for static tiles
- CDN for global distribution
- Pre-generate popular cities

### Compression
- Draco geometry compression (glTF)
- KTX2 texture compression
- Brotli for JSON files

## Current Implementation Status

### ✅ Phase 1: Simple Extrusion
- Working in `src/utils/generateMapStyle.ts`
- Height-based coloring
- Material-based coloring
- Vertical gradient

### ✅ Phase 2: Procedural Textures
- Height-based color mapping
- Material detection (brick, concrete, glass, steel, wood)
- Vertical gradient enabled
- High opacity for realism

### 🚧 Phase 3: 3D Tiles Pipeline
- Python pipeline script created
- OSM data fetching
- Height estimation
- Material detection
- Tileset structure generation
- **Missing**: Actual glTF generation
- **Missing**: B3DM conversion
- **Missing**: MapLibre integration

## Next Steps

1. **Test Phase 2** - Enable "3D Building Extrusion" in layers and zoom to 15+
2. **Complete Phase 3** - Set up full 3D Tiles pipeline for specific cities
3. **Or use Re:Earth** - Try the free Re:Earth Buildings service again with proper integration

## Troubleshooting

### Buildings Not Showing
- Ensure zoom level is 15+
- Check "3D Building Extrusion" is enabled in LAYERS
- Check browser console for errors

### 3D Tiles Not Loading
- Verify tileset URL is accessible
- Check CORS headers on hosting server
- Ensure .b3dm files are served with correct MIME type
- Check tileset.json is valid JSON

### Performance Issues
- Reduce LOD levels
- Enable tile caching
- Use CDN for hosting
- Limit geographic area

## License

- OSM data: ODbL 1.0 (attribution required)
- Pipeline code: MIT
- Generated tiles: ODbL 1.0 (if using OSM data)
