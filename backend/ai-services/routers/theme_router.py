"""
Theme Generation Router - API endpoints for AI theme generation
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from services.theme_service import theme_service

router = APIRouter()

class ThemeRequest(BaseModel):
    prompt: str
    style_keywords: List[str] = []
    color_harmony: str = "complementary"
    base_theme_id: Optional[str] = None

class ThemeResponse(BaseModel):
    success: bool
    palette: Optional[dict] = None
    theme_name: Optional[str] = None
    description: Optional[str] = None
    mood_analysis: Optional[dict] = None
    confidence_score: Optional[float] = None
    error: Optional[str] = None

@router.post("/generate", response_model=ThemeResponse)
async def generate_theme(request: ThemeRequest):
    """
    Generate an AI-powered theme based on prompt and style preferences
    
    Args:
        request: Theme generation request with prompt and style preferences
    
    Returns:
        Generated theme palette and metadata
    """
    try:
        result = await theme_service.generate_theme(
            prompt=request.prompt,
            style_keywords=request.style_keywords,
            color_harmony=request.color_harmony,
            base_theme_id=request.base_theme_id
        )
        
        if "error" in result:
            return ThemeResponse(
                success=False,
                error=result["error"]
            )
        
        return ThemeResponse(
            success=True,
            palette=result["palette"],
            theme_name=result["theme_name"],
            description=result["description"],
            mood_analysis=result["mood_analysis"],
            confidence_score=result["confidence_score"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Theme generation failed: {str(e)}")

@router.get("/harmonies")
async def get_available_harmonies():
    """Get available color harmony options"""
    return {
        "harmonies": [
            {"id": "complementary", "name": "Complementary", "description": "Opposite colors on color wheel"},
            {"id": "analogous", "name": "Analogous", "description": "Adjacent colors on color wheel"},
            {"id": "triadic", "name": "Triadic", "description": "Three evenly spaced colors"},
            {"id": "monochromatic", "name": "Monochromatic", "description": "Variations of same color"},
            {"id": "split_complementary", "name": "Split Complementary", "description": "Base color + two adjacent to complement"}
        ]
    }

@router.get("/moods")
async def get_available_moods():
    """Get available mood options"""
    return {
        "moods": [
            {"id": "dark", "name": "Dark", "description": "Dark, sophisticated colors"},
            {"id": "light", "name": "Light", "description": "Bright, airy colors"},
            {"id": "vibrant", "name": "Vibrant", "description": "High saturation, energetic colors"},
            {"id": "muted", "name": "Muted", "description": "Subtle, understated colors"},
            {"id": "warm", "name": "Warm", "description": "Red, orange, yellow tones"},
            {"id": "cool", "name": "Cool", "description": "Blue, green, purple tones"},
            {"id": "nature", "name": "Nature", "description": "Earth, forest, ocean tones"}
        ]
    }