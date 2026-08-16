# Mapfolio Deployment Guide

This guide explains how to deploy Mapfolio to production using **Render.com** for backend services (with keep-alive pings) and **Cloudflare Pages** for the frontend.

## Architecture Overview

```
Cloudflare Pages (Frontend - Free)
         ↓
Render.com - API Gateway (Free + Keep-Alive Pings)
         ↓
Render.com - AI Services (Free + Keep-Alive Pings)
         ↓
Neon Database + Upstash Redis (Free)
         ↓
GitHub Actions / UptimeRobot (Keep-Alive Pings - Free)
```

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com) (no credit card required)
2. **Cloudflare Account**: Sign up at [cloudflare.com](https://cloudflare.com)
3. **Neon Database**: Sign up at [neon.tech](https://neon.tech)
4. **Upstash Redis**: Sign up at [upstash.com](https://upstash.com) (free tier)
5. **GitHub Repository**: Push your code to GitHub

## Key Strategy: Keep-Alive Pings

**Problem**: Render's free tier spins down services after 15 minutes of inactivity.

**Solution**: Automated pings every 20 seconds to keep services alive.

**Implementation**: GitHub Actions workflows ping services every 20 seconds, preventing spin-down.

## Deployment Steps

### 1. Deploy AI Services to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your GitHub repository
4. **Configuration**:
   - **Name**: `mapfolio-ai-services`
   - **Root Directory**: `backend/ai-services`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

5. **Environment Variables**:
   ```
   ENVIRONMENT=production
   DATABASE_URL=your_neon_database_url
   REDIS_URL=your_upstash_redis_url
   OPENAI_API_KEY=your_openai_api_key
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key
   API_GATEWAY_URL=https://mapfolio-api-gateway.onrender.com
   FRONTEND_URL=https://mapfolio.pages.dev
   ```

6. Click **Deploy Web Service**

### 2. Deploy API Gateway to Render

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. **Configuration**:
   - **Name**: `mapfolio-api-gateway`
   - **Root Directory**: `backend/api-gateway`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Free

4. **Environment Variables**:
   ```
   ENVIRONMENT=production
   AI_SERVICES_URL=https://mapfolio-ai-services.onrender.com
   FRONTEND_URL=https://mapfolio.pages.dev
   JWT_SECRET_KEY=generate_secure_random_string
   RATE_LIMIT_ENABLED=true
   RATE_LIMIT_PER_MINUTE=100
   ```

5. Click **Deploy Web Service**

### 3. Set Up Keep-Alive Pings

#### Option 1: GitHub Actions (Recommended)

1. **Enable GitHub Actions** in your repository
2. **Push the workflow files** (already included in `.github/workflows/`)
3. **Update service URLs** in workflow files after deployment:
   - Edit `.github/workflows/keep-alive-1.yml`
   - Edit `.github/workflows/keep-alive-2.yml`
   - Edit `.github/workflows/keep-alive-3.yml`
   - Replace placeholder URLs with your actual Render URLs

**The workflows will:**
- Ping services every 20 seconds (offset by 0, 20, 40 seconds)
- This ensures pings every 20 seconds total
- Prevents Render's 15-minute spin-down

#### Option 2: UptimeRobot (Backup)

1. Sign up at [uptimerobot.com](https://uptimerobot.com)
2. Add monitors:
   - **Monitor 1**: `https://mapfolio-api-gateway.onrender.com/health` (every 1 minute)
   - **Monitor 2**: `https://mapfolio-ai-services.onrender.com/health` (every 1 minute)
3. This provides backup ping service

### 4. Set Up Redis (Upstash)

1. Sign up at [upstash.com](https://upstash.com)
2. Create a Redis database
3. Get the connection URL
4. Update AI Services environment variable: `REDIS_URL=your_upstash_url`

### 5. Get Your Service URLs

After deployment, note your service URLs:
- API Gateway: `https://mapfolio-api-gateway.onrender.com`
- AI Services: `https://mapfolio-ai-services.onrender.com`

### 6. Deploy Frontend to Cloudflare Pages

#### Connect GitHub Repository
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **Create application**
3. Select **Pages** → **Connect to Git**
4. Select your repository

#### Configure Build Settings
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/` (repository root)

#### Set Environment Variables
Add these environment variables in Cloudflare Pages settings:
```
VITE_API_URL=https://mapfolio-api-gateway.fly.dev
VITE_APP_NAME=Mapfolio
VITE_ENVIRONMENT=production
```

#### Deploy
Click **Save and Deploy**. Cloudflare will automatically deploy on git push.

### 7. Update CORS Configuration

After getting your Cloudflare Pages URL, update the CORS configuration in Render:

1. Go to Render Dashboard → mapfolio-api-gateway
2. Update `FRONTEND_URL` environment variable with your actual Cloudflare Pages URL
3. Go to mapfolio-ai-services
4. Update `FRONTEND_URL` environment variable with your actual Cloudflare Pages URL

### 8. Verify Deployment

#### Check Backend Health
```bash
curl https://mapfolio-api-gateway.onrender.com/health
curl https://mapfolio-ai-services.onrender.com/health
```

#### Check Keep-Alive Pings
1. Go to GitHub Actions tab in your repository
2. Verify the keep-alive workflows are running
3. Check that pings are successful

#### Check Frontend
Visit your Cloudflare Pages URL and verify the application loads correctly.

## Environment Variables Reference

### Frontend (.env.production)
```env
VITE_API_URL=https://mapfolio-api-gateway.onrender.com
VITE_APP_NAME=Mapfolio
VITE_ENVIRONMENT=production
VITE_MAPLIBRE_ACCESS_TOKEN=your_maplibre_token
VITE_CESIUM_ION_ACCESS_TOKEN=your_cesium_token
```

### API Gateway (Render.com)
```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
AI_SERVICES_URL=https://mapfolio-ai-services.onrender.com
FRONTEND_URL=https://mapfolio.pages.dev
JWT_SECRET_KEY=your_jwt_secret
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=100
```

### AI Services (Render.com)
```env
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING
DATABASE_URL=your_neon_database_url
REDIS_URL=redis://your_redis_url
OPENAI_API_KEY=your_openai_api_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
API_GATEWAY_URL=https://mapfolio-api-gateway.onrender.com
FRONTEND_URL=https://mapfolio.pages.dev
```

## Cost Breakdown

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Cloudflare Pages | Unlimited bandwidth, 500 builds/month | Pay for overages |
| Render.com | 750 hours/month (per service) | $7/month per service (always-on) |
| Neon Database | Free tier (0.5GB) | $0.20/GB-month |
| Upstash Redis | 10K commands/day free | $0.20/100K commands |
| GitHub Actions | 2,000 free minutes/month | Pay for overages |

**Estimated Free Tier Cost**: $0/month (with keep-alive pings)

## Monitoring and Scaling

### Render.com Monitoring
- **Logs**: Available in Render Dashboard under each service
- **Metrics**: Render provides basic metrics for free tier
- **Status**: Check service status in Render Dashboard

### GitHub Actions Monitoring
- Check workflow runs in GitHub Actions tab
- Verify keep-alive pings are succeeding
- Monitor for any failed pings

### Cloudflare Analytics
Available in Cloudflare Dashboard under Pages → Analytics

### Render Scaling
Free tier automatically scales. To upgrade for better performance:
- Go to service settings → Change plan
- Paid tiers start at $7/month for always-on instances

## Troubleshooting

### Backend Health Checks
```bash
curl https://mapfolio-api-gateway.onrender.com/health
curl https://mapfolio-ai-services.onrender.com/health
```

### Service Spin-Down Issues
- Verify GitHub Actions workflows are enabled and running
- Check that keep-alive pings are succeeding
- Ensure service URLs in workflows match actual Render URLs
- Consider adding UptimeRobot as backup ping service

### CORS Issues
- Verify FRONTEND_URL matches your actual Cloudflare Pages URL
- Check that both services have the correct CORS configuration
- Ensure environment variables are properly set in Render

### Database Connection Issues
- Verify DATABASE_URL is correctly set
- Check Neon database status
- Ensure Render can connect to Neon (may need IP whitelisting)

### Redis Connection Issues
- Verify REDIS_URL is correctly set
- Check Upstash Redis status
- Ensure Render can connect to Upstash

### GitHub Actions Issues
- Verify workflows are enabled in repository settings
- Check that service URLs are correct in workflow files
- Monitor workflow runs for failures
- Ensure repository has Actions enabled

## CI/CD Pipeline

Both platforms support automatic deployments from Git:
- **Render.com**: Auto-deploys on git push to connected branches
- **Cloudflare Pages**: Auto-deploys on push to configured branch

### Keep-Alive Automation
- **GitHub Actions**: Automatically pings services every 20 seconds
- **UptimeRobot**: Backup ping service (optional)
- Both ensure services stay awake and responsive

## Security Considerations

1. **API Keys**: Never commit API keys to git - use Render environment variables
2. **CORS**: Restrict allowed origins in production
3. **Rate Limiting**: Enable and configure rate limiting
4. **HTTPS**: Both platforms provide automatic HTTPS
5. **Environment Variables**: Use different keys for development and production
6. **Render Secrets**: Use Render's secret management for sensitive data
7. **Keep-Alive Security**: Monitor ping patterns to prevent abuse

## Backup and Recovery

- **Database**: Neon provides automated backups and point-in-time recovery
- **Redis**: Upstash provides persistence options
- **Code**: Version controlled in Git
- **Configuration**: Documented in this guide
- **Render**: Automatic deployments and rollback support

## Support

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Cloudflare Pages Documentation**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- **Neon Documentation**: [neon.tech/docs](https://neon.tech/docs)
- **Upstash Documentation**: [upstash.com/docs](https://upstash.com/docs)
- **GitHub Actions Documentation**: [docs.github.com/actions](https://docs.github.com/actions)
