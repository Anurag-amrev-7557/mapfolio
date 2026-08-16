"""
Mapfolio AI Services - Main Entry Point
AI-powered services for theme generation, route optimization, and location intelligence
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv
from prometheus_client import CollectorRegistry

# Load environment variables
load_dotenv()

# Create a custom registry to avoid conflicts
REGISTRY = CollectorRegistry()

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://localhost:8000")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    FRONTEND_URL,
    API_GATEWAY_URL,
    "https://mapfolio.pages.dev",  # Cloudflare Pages default domain
    "https://*.pages.dev",  # Allow all Cloudflare Pages domains
    "https://*.onrender.com",  # Allow all Render domains
]

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    # Startup
    print("🚀 Starting Mapfolio AI Services...")
    print(f"🔧 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Initialize ML models
    # TODO: Initialize models when ready
    # initialize_models()
    
    yield
    
    # Shutdown
    print("🛑 Shutting down Mapfolio AI Services...")

# Create FastAPI application
app = FastAPI(
    title="Mapfolio AI Services",
    description="AI-powered services for map poster design",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "mapfolio-ai-services",
        "version": "1.0.0"
    }

# Include routers
from routers import theme_router, location_router

app.include_router(theme_router, prefix="/api/ai/theme", tags=["Theme Generation"])
app.include_router(location_router, prefix="/api/ai/location", tags=["Location Discovery"])

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8001))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )