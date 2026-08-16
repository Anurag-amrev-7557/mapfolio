# 🚀 AI Integration Setup Guide

This guide will help you set up the AI services for Mapfolio Pro, including the AI theme generator and smart location search features.

## 📋 Prerequisites

- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher  
- **Docker**: Latest version
- **Docker Compose**: Latest version
- **Git**: For cloning the repository

## 🛠️ Installation Steps

### 1. Clone and Install Frontend Dependencies

```bash
# Navigate to project directory
cd /Users/anurag/Downloads/terraink/terraink-pro

# Install frontend dependencies
npm install
```

### 2. Set Up AI Services Environment

#### AI Services Environment (`backend/ai-services/.env`)

Create a `.env` file in `backend/ai-services/`:

```bash
# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# Database Configuration (optional for basic features)
DATABASE_URL=postgresql://user:password@localhost:5432/mapfolio_ai
REDIS_URL=redis://localhost:6379/0

# AI Model Configuration
MODEL_PATH=./models
CACHE_MODELS=true
GPU_ENABLED=false
NUM_WORKERS=4

# External API Keys (optional - for advanced features)
OPENAI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here

# Service Configuration
API_GATEWAY_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_DSN=

# Security
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30
```

#### API Gateway Environment (`backend/api-gateway/.env`)

Create a `.env` file in `backend/api-gateway/`:

```bash
# Application Settings
ENVIRONMENT=development
DEBUG=true
LOG_LEVEL=INFO

# AI Services Configuration
AI_SERVICES_URL=http://localhost:8001

# Security
JWT_SECRET_KEY=dev-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=30

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100

# Monitoring
PROMETHEUS_ENABLED=true
SENTRY_DSN=
```

### 3. Install Python Dependencies

```bash
# Install AI services dependencies
cd backend/ai-services
pip install -r requirements.txt

# Install API gateway dependencies
cd ../api-gateway
pip install -r requirements.txt
```

### 4. Start Services with Docker Compose

```bash
# Return to project root
cd /Users/anurag/Downloads/terraink/terraink-pro

# Start all services
docker-compose up -d

# Check service status
docker-compose ps
```

### 5. Start Frontend Development Server

```bash
# In a new terminal, start the frontend
npm run dev
```

## 🎯 Quick Start without Docker

If you prefer to run services directly without Docker:

### Start AI Services

```bash
# Terminal 1: Start AI Services
cd backend/ai-services
python main.py
```

### Start API Gateway

```bash
# Terminal 2: Start API Gateway  
cd backend/api-gateway
python main.py
```

### Start Frontend

```bash
# Terminal 3: Start Frontend
npm run dev
```

## ✅ Verification

### 1. Check API Gateway Health

```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "services": {
    "ai_services": "healthy"
  }
}
```

### 2. Check AI Services Health

```bash
curl http://localhost:8001/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "mapfolio-ai-services",
  "version": "1.0.0"
}
```

### 3. Test AI Theme Generation

```bash
curl -X POST http://localhost:8000/api/ai/theme/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A peaceful ocean theme with sunset colors",
    "style_keywords": ["ocean", "sunset"],
    "color_harmony": "complementary"
  }'
```

### 4. Test Location Discovery

```bash
curl -X POST http://localhost:8000/api/ai/location/discover \
  -H "Content-Type: application/json" \
  -d '{
    "query": "scenic mountain viewpoints",
    "preferences": {
      "prefer_scenic": true
    },
    "limit": 5
  }'
```

## 🎨 Using AI Features in the App

Once services are running, you'll find two new AI-powered tabs in the Mapfolio Pro interface:

### AI Theme Generator (Press 8)
- **Navigate**: Click the sparkles icon or press `8`
- **Describe**: Enter a description of your desired theme
- **Style**: Choose a style preset (Cyberpunk, Vintage, Minimal, etc.)
- **Harmony**: Select color harmony (Complementary, Analogous, etc.)
- **Generate**: Click "Generate AI Theme" to create a custom palette
- **Apply**: Apply the generated theme to your poster

### Smart Location Search (Press 9)
- **Navigate**: Click the search icon or press `9`
- **Describe**: Enter natural language description of ideal location
- **Preferences**: Toggle filters (Scenic, Urban, Nature, Quiet)
- **Discover**: Click "Discover Locations" to find matching places
- **Select**: Click a result to navigate to that location

## 🔧 Troubleshooting

### Services won't start

```bash
# Check Docker logs
docker-compose logs ai-services
docker-compose logs api-gateway

# Restart services
docker-compose restart
```

### Python dependencies missing

```bash
# Reinstall dependencies
cd backend/ai-services
pip install --force-reinstall -r requirements.txt
```

### Port conflicts

```bash
# Check what's using ports 8000, 8001, 5173
lsof -i :8000
lsof -i :8001
lsof -i :5173

# Change ports in docker-compose.yml if needed
```

### Frontend can't connect to AI services

1. Check that AI services are running: `docker-compose ps`
2. Verify API gateway is accessible: `curl http://localhost:8000/health`
3. Check browser console for CORS errors
4. Ensure `VITE_API_URL` is set correctly in frontend environment

## 🚀 Next Steps

Once basic AI features are working:

1. **Add OpenAI API Key** for advanced LLM features
2. **Enable GPU** for faster ML model processing
3. **Add PostgreSQL** for persistent user preferences
4. **Implement rate limiting** for production use
5. **Set up monitoring** with Prometheus and Grafana

## 📚 Development

### Adding New AI Features

1. Create service in `backend/ai-services/services/`
2. Add router in `backend/ai-services/routers/`
3. Register router in `backend/ai-services/main.py`
4. Add frontend component in `src/components/`
5. Integrate with `src/services/aiService.ts`

### Testing AI Services

```bash
# Run AI services tests
cd backend/ai-services
pytest tests/

# Run API gateway tests
cd backend/api-gateway
pytest tests/
```

## 🔐 Security Notes

- **Never commit** `.env` files to version control
- **Change** JWT secret keys in production
- **Use** environment-specific configurations
- **Enable** rate limiting in production
- **Implement** proper authentication for production use

## 📈 Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f ai-services
docker-compose logs -f api-gateway
```

### Check Metrics

```bash
# Prometheus metrics
curl http://localhost:8000/metrics
```

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Docker logs: `docker-compose logs`
3. Verify all services are running: `docker-compose ps`
4. Check network connectivity between services
5. Review environment configuration

## 🎉 Success!

You should now have AI-powered theme generation and location discovery working in Mapfolio Pro! The AI services will continuously improve as you add more training data and refine the algorithms.