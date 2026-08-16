#!/usr/bin/env python3
"""
3D Tiles Pipeline for Terraink/Mapfolio
Converts OSM building footprints to 3D Tiles with procedural textures
"""

import os
import json
import math
from typing import Dict, List, Tuple
import requests
from pyproj import Transformer
import numpy as np

# Configuration
OUTPUT_DIR = "output_3dtiles"
TILESET_OUTPUT = os.path.join(OUTPUT_DIR, "tileset.json")
OSM_API = "https://overpass-api.de/api/interpreter"

class Building3DGenerator:
    """Generate 3D building models from OSM data"""
    
    def __init__(self):
        self.transformer = Transformer.from_crs("EPSG:4326", "EPSG:3857", always_xy=True)
        self.buildings = []
    
    def fetch_osm_buildings(self, bbox: Tuple[float, float, float, float]) -> List[Dict]:
        """
        Fetch building footprints from OSM Overpass API
        bbox: (min_lon, min_lat, max_lon, max_lat)
        """
        min_lon, min_lat, max_lon, max_lat = bbox
        
        query = f"""
        [out:json][timeout:300];
        (
          way["building"]({min_lat},{min_lon},{max_lat},{max_lon});
          relation["building"]({min_lat},{min_lon},{max_lat},{max_lon});
        );
        out body;
        >;
        out skel qt;
        """
        
        try:
            headers = {
                'User-Agent': 'Terraink-Mapfolio-3D-Tiles-Pipeline/1.0',
                'Accept': 'application/json'
            }
            response = requests.post(OSM_API, data=query, headers=headers, timeout=300)
            response.raise_for_status()
            data = response.json()
            return data.get('elements', [])
        except Exception as e:
            print(f"Error fetching OSM data: {e}")
            return []
    
    def estimate_building_height(self, tags: Dict) -> float:
        """Estimate building height from OSM tags"""
        # Explicit height
        if 'height' in tags:
            try:
                return float(tags['height'])
            except:
                pass
        
        # Levels (typical 3m per level)
        if 'building:levels' in tags:
            try:
                return float(tags['building:levels']) * 3.0
            except:
                pass
        
        # Building type heuristics
        building_type = tags.get('building', 'yes')
        height_map = {
            'apartments': 15.0,
            'commercial': 12.0,
            'office': 20.0,
            'retail': 8.0,
            'industrial': 10.0,
            'house': 6.0,
            'residential': 8.0,
            'church': 15.0,
            'cathedral': 25.0,
            'school': 10.0,
            'hospital': 15.0,
        }
        
        return height_map.get(building_type, 8.0)
    
    def get_building_material(self, tags: Dict) -> str:
        """Determine building material from OSM tags"""
        if 'building:material' in tags:
            return tags['building:material']
        
        building_type = tags.get('building', 'yes')
        material_map = {
            'apartments': 'concrete',
            'commercial': 'glass',
            'office': 'glass',
            'retail': 'glass',
            'industrial': 'steel',
            'house': 'brick',
            'residential': 'brick',
            'church': 'stone',
            'cathedral': 'stone',
        }
        
        return material_map.get(building_type, 'concrete')
    
    def create_building_geometry(self, nodes: List[Dict], height: float) -> Dict:
        """Create 3D geometry from building footprint"""
        if not nodes:
            return None
        
        # Convert to mercator
        coords = []
        for node in nodes:
            lon, lat = node['lon'], node['lat']
            x, y = self.transformer.transform(lon, lat)
            coords.append([x, y])
        
        # Close the polygon
        if coords[0] != coords[-1]:
            coords.append(coords[0])
        
        # Calculate centroid
        centroid_x = sum(c[0] for c in coords) / len(coords)
        centroid_y = sum(c[1] for c in coords) / len(coords)
        
        # Create simple extruded geometry (box)
        # In a full implementation, this would use proper 3D modeling
        geometry = {
            "type": "Polygon",
            "coordinates": [coords],
            "properties": {
                "height": height,
                "min_height": 0,
                "centroid": [centroid_x, centroid_y]
            }
        }
        
        return geometry
    
    def process_osm_element(self, element: Dict) -> Dict:
        """Process a single OSM element into a building"""
        if element['type'] not in ['way', 'relation']:
            return None
        
        tags = element.get('tags', {})
        if 'building' not in tags:
            return None
        
        # Get nodes (simplified - relation handling would be more complex)
        if element['type'] == 'way':
            nodes = element.get('nodes', [])
            # In a real implementation, you'd fetch node coordinates
            # For now, we'll create a placeholder
            return {
                "id": element['id'],
                "type": tags.get('building', 'yes'),
                "height": self.estimate_building_height(tags),
                "material": self.get_building_material(tags),
                "tags": tags
            }
        
        return None
    
    def generate_tileset(self, buildings: List[Dict], bbox: Tuple[float, float, float, float]) -> Dict:
        """Generate 3D Tiles tileset structure"""
        min_lon, min_lat, max_lon, max_max_lat = bbox
        
        # Convert bbox to region
        min_x, min_y = self.transformer.transform(min_lon, min_lat)
        max_x, max_y = self.transformer.transform(max_lon, max_max_lat)
        
        tileset = {
            "asset": {
                "version": "1.0"
            },
            "geometricError": 500.0,
            "root": {
                "boundingVolume": {
                    "region": [
                        min_lon, min_lat, max_lon, max_max_lat, 0, 100
                    ]
                },
                "geometricError": 500.0,
                "refine": "ADD",
                "children": []
            }
        }
        
        # Add buildings as tiles (simplified - real implementation would use spatial indexing)
        for i, building in enumerate(buildings):
            tile = {
                "boundingVolume": {
                    "box": [
                        0, 0, 0,  # center
                        100, 0, 0,  # half x
                        0, 100, 0,  # half y
                        0, 0, building['height']  # half z
                    ]
                },
                "geometricError": 50.0,
                "refine": "ADD",
                "content": {
                    "uri": f"building_{i}.b3dm"
                }
            }
            tileset['root']['children'].append(tile)
        
        return tileset
    
    def save_tileset(self, tileset: Dict):
        """Save tileset.json"""
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        with open(TILESET_OUTPUT, 'w') as f:
            json.dump(tileset, f, indent=2)
        print(f"Tileset saved to {TILESET_OUTPUT}")


def main():
    """Main execution"""
    print("3D Tiles Pipeline for Terraink/Mapfolio")
    print("=" * 50)
    
    # Example: Generate tiles for a small area
    # bbox: (min_lon, min_lat, max_lon, max_lat)
    # Example: Hanover, Germany
    bbox = (9.70, 52.35, 9.75, 52.40)
    
    generator = Building3DGenerator()
    
    print(f"Fetching buildings for bbox: {bbox}")
    elements = generator.fetch_osm_buildings(bbox)
    print(f"Found {len(elements)} elements")
    
    buildings = []
    for element in elements:
        building = generator.process_osm_element(element)
        if building:
            buildings.append(building)
    
    print(f"Processed {len(buildings)} buildings")
    
    tileset = generator.generate_tileset(buildings, bbox)
    generator.save_tileset(tileset)
    
    print("\nNext steps:")
    print("1. Install py3dtiles: pip install py3dtiles")
    print("2. Generate actual glTF models for each building")
    print("3. Convert to b3dm format")
    print("4. Host the tiles on a static server")
    print("5. Load in MapLibre using the tileset URL")


if __name__ == "__main__":
    main()
