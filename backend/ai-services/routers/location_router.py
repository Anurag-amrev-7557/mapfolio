"""
Location Discovery Router - API endpoints for AI-powered location search
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional, List
from services.location_service import location_service

router = APIRouter()

class LocationRequest(BaseModel):
    query: str
    preferences: Optional[Dict] = None
    bounds: Optional[Dict] = None
    limit: int = 10

class LocationResponse(BaseModel):
    success: bool
    query: Optional[str] = None
    criteria: Optional[Dict] = None
    results: Optional[List[Dict]] = None
    total_found: Optional[int] = None
    error: Optional[str] = None

@router.post("/discover", response_model=LocationResponse)
async def discover_locations(request: LocationRequest):
    """
    Discover locations based on semantic query and preferences
    
    Args:
        request: Location discovery request with query and preferences
    
    Returns:
        Ranked list of discovered locations with match scores
    """
    try:
        result = await location_service.discover_locations(
            query=request.query,
            preferences=request.preferences,
            bounds=request.bounds,
            limit=request.limit
        )
        
        if "error" in result:
            return LocationResponse(
                success=False,
                error=result["error"]
            )
        
        # Convert LocationResult objects to dictionaries
        results_dict = []
        for location_result in result.get("results", []):
            results_dict.append({
                "name": location_result.name,
                "lat": location_result.lat,
                "lon": location_result.lon,
                "description": location_result.description,
                "match_score": location_result.match_score,
                "features": location_result.features,
                "source": location_result.source
            })
        
        return LocationResponse(
            success=True,
            query=result["query"],
            criteria=result["criteria"],
            results=results_dict,
            total_found=result["total_found"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Location discovery failed: {str(e)}")

@router.get("/features")
async def get_available_features():
    """Get available location features for filtering"""
    return {
        "features": [
            {"id": "scenic", "name": "Scenic Views", "description": "Locations with beautiful views and scenery"},
            {"id": "urban", "name": "Urban Areas", "description": "City centers and metropolitan areas"},
            {"id": "nature", "name": "Nature Spots", "description": "Parks, forests, mountains, and natural areas"},
            {"id": "cultural", "name": "Cultural Sites", "description": "Museums, historic sites, and landmarks"},
            {"id": "quiet", "name": "Quiet Places", "description": "Peaceful, secluded locations"},
            {"id": "popular", "name": "Popular Spots", "description": "Famous tourist destinations and landmarks"}
        ]
    }