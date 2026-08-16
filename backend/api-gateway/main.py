"""
Mapfolio API Gateway - Unified API entry point
Routes requests to appropriate AI services and handles authentication/rate limiting
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os
import time
from dotenv import load_dotenv
import httpx
from prometheus_client import Counter, Histogram, generate_latest, CollectorRegistry
from fastapi.responses import Response

# Load environment variables
load_dotenv()

# Create a custom registry to avoid conflicts
REGISTRY = CollectorRegistry()

# CORS configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:3000",
    FRONTEND_URL,
    "https://mapfolio.pages.dev",  # Cloudflare Pages default domain
    "https://*.pages.dev",  # Allow all Cloudflare Pages domains
    "https://*.onrender.com",  # Allow all Render domains
]

# Prometheus metrics with custom registry
request_counter = Counter('api_requests_total', 'Total API requests', ['endpoint', 'method', 'status'], registry=REGISTRY)
request_duration = Histogram('api_request_duration_seconds', 'API request duration', ['endpoint'], registry=REGISTRY)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan events"""
    print("🚀 Starting Mapfolio API Gateway...")
    print(f"🔧 Environment: {os.getenv('ENVIRONMENT', 'development')}")
    
    # Initialize connections
    # TODO: Initialize Redis connection for caching
    # TODO: Initialize database connection
    
    yield
    
    print("🛑 Shutting down Mapfolio API Gateway...")

# Create FastAPI application
app = FastAPI(
    title="Mapfolio API Gateway",
    description="Unified API gateway for Mapfolio AI services",
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

# AI Services configuration
AI_SERVICES_URL = os.getenv("AI_SERVICES_URL", "http://localhost:8001")

async def forward_to_ai_service(service: str, request_data: dict):
    """Forward request to appropriate AI service"""
    start_time = time.time()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{AI_SERVICES_URL}/api/ai/{service}",
                json=request_data,
                timeout=30.0
            )
            response.raise_for_status()
            
            # Record metrics
            duration = time.time() - start_time
            request_duration.labels(endpoint=service).observe(duration)
            request_counter.labels(endpoint=service, method="POST", status="success").inc()
            
            return response.json()
            
    except httpx.HTTPError as e:
        request_counter.labels(endpoint=service, method="POST", status="error").inc()
        raise HTTPException(status_code=502, detail=f"AI service unavailable: {str(e)}")
    except Exception as e:
        request_counter.labels(endpoint=service, method="POST", status="error").inc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Check AI services health
        async with httpx.AsyncClient() as client:
            ai_health = await client.get(f"{AI_SERVICES_URL}/health", timeout=5.0)
            ai_healthy = ai_health.status_code == 200
    except:
        ai_healthy = False
    
    return {
        "status": "healthy" if ai_healthy else "degraded",
        "services": {
            "ai_services": "healthy" if ai_healthy else "unavailable"
        }
    }

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(content=generate_latest(REGISTRY), media_type="text/plain")

# Unified AI endpoint
@app.post("/api/ai/unified")
async def unified_ai_endpoint(request: Request):
    """Unified endpoint for all AI services"""
    try:
        request_data = await request.json()
        service = request_data.get("service")
        parameters = request_data.get("parameters", {})
        context = request_data.get("context")
        
        if not service:
            raise HTTPException(status_code=400, detail="Service parameter is required")
        
        # Route to appropriate AI service
        result = await forward_to_ai_service(service, {
            "parameters": parameters,
            "context": context
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Theme generation endpoint
@app.post("/api/ai/theme/generate")
async def generate_theme(request: Request):
    """Generate AI-powered theme"""
    request_data = await request.json()
    return await forward_to_ai_service("theme/generate", request_data)

# Design assistant endpoint
@app.post("/api/ai/design/assistant")
async def design_assistant(request: Request):
    """AI design assistant"""
    request_data = await request.json()
    return await forward_to_ai_service("design/assistant", request_data)

# Route optimization endpoint
@app.post("/api/ai/route/optimize")
async def optimize_route(request: Request):
    """Optimize route using AI"""
    request_data = await request.json()
    return await forward_to_ai_service("route/optimize", request_data)

# Location discovery endpoint
@app.post("/api/ai/location/discover")
async def discover_locations(request: Request):
    """Discover locations using AI"""
    request_data = await request.json()
    return await forward_to_ai_service("location/discover", request_data)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("ENVIRONMENT") == "development" else False
    )