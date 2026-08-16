"""
Enhanced Location Service - AI-powered location search and recommendations
Initial implementation using basic ML and semantic analysis
"""

import httpx
import json
from typing import List, Dict, Optional, Any
from dataclasses import dataclass
import re
import asyncio

# Try to import geopy, provide fallback if not available
try:
    from geopy.geocoders import Nominatim
    from geopy.distance import geodesic
    GEOPY_AVAILABLE = True
except ImportError:
    GEOPY_AVAILABLE = False
    print("Warning: geopy not available, using fallback location service")

@dataclass
class LocationResult:
    """Structured location result"""
    name: str
    lat: float
    lon: float
    description: str
    match_score: float
    features: Dict[str, Any]
    source: str

class LocationService:
    """Enhanced location discovery and analysis service"""
    
    def __init__(self):
        self.geocoder = Nominatim(user_agent="mapfolio_ai") if GEOPY_AVAILABLE else None
        self.feature_keywords = {
            'scenic': ['view', 'overlook', 'scenic', 'vista', 'panorama', 'sunset', 'sunrise'],
            'urban': ['city', 'downtown', 'urban', 'metropolitan', 'skyline', 'architecture'],
            'nature': ['park', 'forest', 'mountain', 'beach', 'lake', 'river', 'trail', 'hiking'],
            'cultural': ['museum', 'historic', 'monument', 'landmark', 'cathedral', 'castle'],
            'quiet': ['peaceful', 'quiet', 'secluded', 'hidden', 'remote', 'serene'],
            'popular': ['famous', 'popular', 'tourist', 'iconic', 'well-known', 'landmark']
        }
    
    async def discover_locations(
        self,
        query: str,
        preferences: Optional[Dict] = None,
        bounds: Optional[Dict] = None,
        limit: int = 10
    ) -> Dict:
        """
        Discover locations based on semantic query and preferences
        """
        try:
            # Parse the query for semantic features
            search_criteria = self._parse_query(query)

            # Get base location results from multiple sources
            base_results = await self._get_base_results(query, None, limit * 2)

            if not base_results:
                return {
                    "query": query,
                    "criteria": search_criteria,
                    "results": [],
                    "total_found": 0
                }

            # Score and rank results based on criteria and preferences
            scored_results = self._score_results(base_results, search_criteria, preferences)

            # Apply additional filtering and ranking
            final_results = self._apply_preferences(scored_results, preferences)

            return {
                "query": query,
                "criteria": search_criteria,
                "results": final_results[:limit],
                "total_found": len(final_results)
            }

        except Exception as e:
            print(f"Error in location discovery: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "query": query,
                "criteria": {},
                "results": [],
                "error": str(e)
            }
    
    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract meaningful search terms from poetic/natural language queries"""
        query_lower = query.lower()

        # Define meaningful location-related keywords
        location_keywords = [
            'beach', 'ocean', 'sea', 'coast', 'shore', 'harbor', 'bay',
            'mountain', 'hill', 'peak', 'summit', 'viewpoint', 'overlook',
            'park', 'garden', 'forest', 'nature', 'wilderness',
            'city', 'town', 'village', 'urban', 'downtown',
            'lake', 'river', 'waterfall', 'spring',
            'island', 'peninsula', 'cape', 'cliff',
            'valley', 'canyon', 'gorge', 'desert',
            'castle', 'temple', 'church', 'monument', 'landmark'
        ]

        # Extract location keywords from the query
        found_keywords = [kw for kw in location_keywords if kw in query_lower]

        # If we found location keywords, search for them
        if found_keywords:
            return [' '.join(found_keywords[:3])]  # Limit to top 3 keywords

        # If no location keywords, use common fallback searches
        fallback_terms = ['scenic viewpoint', 'nature park', 'beach', 'mountain']
        return fallback_terms

    def _parse_query(self, query: str) -> Dict[str, bool]:
        """Parse query for semantic features"""
        query_lower = query.lower()
        criteria = {}
        
        for category, keywords in self.feature_keywords.items():
            criteria[category] = any(keyword in query_lower for keyword in keywords)
        
        return criteria
    
    async def _get_base_results(
        self,
        query: str,
        bounds: Optional[Dict],
        limit: int
    ) -> List[Dict]:
        """Get base location results from geocoding services"""
        results = []

        # Use the original query first, then try extracted terms as fallback
        search_queries = [query]
        search_queries.extend(self._extract_search_terms(query))

        if not GEOPY_AVAILABLE:
            # Fallback: Use Nominatim API directly
            try:
                async with httpx.AsyncClient() as client:
                    # Try multiple search strategies
                    for search_query in search_queries:
                        response = await client.get(
                            "https://nominatim.openstreetmap.org/search",
                            params={
                                "q": search_query,
                                "format": "json",
                                "limit": limit,
                                "addressdetails": 1
                            },
                            timeout=10.0
                        )
                        if response.status_code == 200:
                            data = response.json()
                            print(f"Search for '{search_query}' returned {len(data)} results")
                            for item in data:
                                address = item.get('address', {})
                                # Handle case where address might be a string
                                if isinstance(address, str):
                                    address = {}
                                location_data = {
                                    "name": address.get('name', item.get('display_name', '')),
                                    "lat": float(item.get('lat', 0)),
                                    "lon": float(item.get('lon', 0)),
                                    "description": item.get('display_name', ''),
                                    "raw_address": address,
                                    "importance": item.get('importance', 0),
                                    "type": item.get('type', 'unknown')
                                }
                                results.append(location_data)
                            if results:
                                break  # Stop if we found results
            except Exception as e:
                print(f"Error getting OSM results via API: {str(e)}")
            return results

        try:
            # Use Nominatim for OpenStreetMap data
            for search_query in search_queries:
                osm_results = self.geocoder.geocode(
                    search_query,
                    exactly_one=False,
                    limit=limit,
                    addressdetails=True
                )

                if osm_results:
                    for result in osm_results:
                        address = result.address
                        # Handle case where address might be a string
                        if isinstance(address, str):
                            address = {}
                        location_data = {
                            "name": address.get('name', result.raw.get('display_name', '')),
                            "lat": result.latitude,
                            "lon": result.longitude,
                            "description": result.raw.get('display_name', ''),
                            "raw_address": address,
                            "importance": result.raw.get('importance', 0),
                            "type": result.raw.get('type', 'unknown')
                        }
                        results.append(location_data)
                if results:
                    break

        except Exception as e:
            print(f"Error getting OSM results: {str(e)}")

        return results
    
    def _score_results(
        self,
        results: List[Dict],
        criteria: Dict[str, bool],
        preferences: Optional[Dict]
    ) -> List[LocationResult]:
        """Score location results based on criteria and analysis"""
        scored_results = []
        
        for result in results:
            # Calculate base match score
            match_score = self._calculate_match_score(result, criteria)
            
            # Extract features from the location data
            features = self._extract_features(result)
            
            # Apply preference adjustments
            if preferences:
                match_score = self._apply_preference_scoring(match_score, features, preferences)
            
            scored_result = LocationResult(
                name=result["name"],
                lat=result["lat"],
                lon=result["lon"],
                description=result["description"],
                match_score=match_score,
                features=features,
                source="osm"
            )
            scored_results.append(scored_result)
        
        # Sort by match score
        scored_results.sort(key=lambda x: x.match_score, reverse=True)
        
        return scored_results
    
    def _calculate_match_score(self, result: Dict, criteria: Dict[str, bool]) -> float:
        """Calculate base match score for a location"""
        score = 0.5  # Base score
        
        # Boost score based on importance
        importance = result.get('importance', 0)
        score += importance * 0.3
        
        # Check if location type matches criteria
        location_type = result.get('type', '').lower()
        location_name = result.get('name', '').lower()
        description = result.get('description', '').lower()
        
        text_to_check = f"{location_type} {location_name} {description}"
        
        for category, is_matched in criteria.items():
            if is_matched:
                keywords = self.feature_keywords[category]
                if any(keyword in text_to_check for keyword in keywords):
                    score += 0.15
        
        return min(score, 1.0)
    
    def _extract_features(self, result: Dict) -> Dict[str, Any]:
        """Extract features from location data"""
        features = {
            'scenery_type': self._classify_scenery(result),
            'urban_density': self._calculate_urban_density(result),
            'popularity': result.get('importance', 0),
            'location_type': result.get('type', 'unknown')
        }
        return features
    
    def _classify_scenery(self, result: Dict) -> str:
        """Classify the scenery type of a location"""
        location_type = result.get('type', '').lower()
        name = result.get('name', '').lower()
        description = result.get('description', '').lower()
        
        text = f"{location_type} {name} {description}"
        
        if any(word in text for word in ['mountain', 'peak', 'summit', 'hill']):
            return 'mountain'
        elif any(word in text for word in ['beach', 'coast', 'shore', 'ocean', 'sea']):
            return 'coastal'
        elif any(word in text for word in ['park', 'forest', 'wood', 'garden', 'nature']):
            return 'park'
        elif any(word in text for word in ['city', 'town', 'urban', 'downtown']):
            return 'urban'
        elif any(word in text for word in ['lake', 'river', 'water', 'pond']):
            return 'water'
        else:
            return 'general'
    
    def _calculate_urban_density(self, result: Dict) -> float:
        """Calculate urban density score (0-1)"""
        location_type = result.get('type', '').lower()
        importance = result.get('importance', 0)
        
        urban_types = ['city', 'town', 'suburb', 'neighbourhood', 'residential']
        if location_type in urban_types:
            return min(0.5 + importance * 0.5, 1.0)
        return importance * 0.3
    
    def _apply_preference_scoring(
        self,
        base_score: float,
        features: Dict,
        preferences: Dict
    ) -> float:
        """Apply user preference adjustments to score"""
        adjusted_score = base_score
        
        # Scenic preference
        if preferences.get('prefer_scenic'):
            if features['scenery_type'] in ['mountain', 'coastal', 'park']:
                adjusted_score += 0.2
        
        # Urban preference
        if preferences.get('prefer_urban'):
            adjusted_score += features['urban_density'] * 0.3
        
        # Quiet preference (inverse of urban density)
        if preferences.get('prefer_quiet'):
            adjusted_score += (1 - features['urban_density']) * 0.2
        
        # Popular preference
        if preferences.get('prefer_popular'):
            adjusted_score += features['popularity'] * 0.3
        
        return min(adjusted_score, 1.0)
    
    def _apply_preferences(
        self,
        results: List[LocationResult],
        preferences: Optional[Dict]
    ) -> List[LocationResult]:
        """Apply additional preference filtering"""
        if not preferences:
            return results
        
        filtered = results
        
        # Filter by minimum match score if specified
        min_score = preferences.get('min_match_score', 0.0)
        if min_score > 0:
            filtered = [r for r in filtered if r.match_score >= min_score]
        
        return filtered

# Singleton instance
location_service = LocationService()