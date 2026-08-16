# 🗺️ Mapfolio Pro Studio

> **Mapfolio Pro** is a high-precision, aesthetic cartographic poster design engine and GIS studio built with **React**, **TypeScript**, **Vite**, **MapLibre GL**, **Tailwind CSS**, and **Zustand**.

---

## ✨ Features

### 🤖 AI-Powered Design Tools
* **AI Theme Generator**: Create unlimited custom color palettes using AI-powered color theory and generation algorithms
* **Smart Location Discovery**: Semantic search for locations based on natural language descriptions and preferences
* **Intelligent Recommendations**: AI-driven suggestions for themes, layouts, and design elements
* **Natural Language Interface**: Describe your vision in plain language and let AI create the design

### 🖼️ Map Poster Generation & Canvas Engine
* **High-Resolution Master Poster Export**: Renders 1:1 pixel-perfect PNG, JPEG, and WebP exports at up to 4K / 300 DPI print quality.
* **Aspect Ratios & Presets**: Classic 4:5, Square 1:1, Cinema 16:9, Panoramic 21:9, and Portrait 2:3 poster frame dimensions.
* **Screen & Poster Responsive Auto-Sizing**: Dynamic viewport-aware scale calculation for map pins, route waypoints, and road path thickness.

### 📍 Custom Map Markers & Location Pins
* **Multi-Style Pins**: Choose from classic map pins, dot badges, target scopes, stars, hearts, house icons, and custom SVG uploads.
* **16px – 256px Marker Scaling**: Fine-tune size presets (`SM` to `3XL`) or use continuous range sliders.
* **Per-Marker Editing**: Customize size, color, and floating typography labels per individual placed marker.

### 🚴 Road-Snapped Route & GPX Track Builder
* **OSRM Road Network Snapping**: Draw paths for Driving, Cycling, Walking, or Direct straight lines.
* **GPX Import & Render**: Drag and drop `.gpx` files from Strava, Garmin, Komoot, or AllTrails.
* **Custom Path Styling**: Adjust line color, path thickness (`1px` to `64px`), and numbered waypoint badges (`16px` to `256px`).

### 🎨 Theme & Typography Engine
* **Curated Color Palettes**: Noir Dark, Minimal Slate, Vintage Sepia, Cyberpunk Neon, Terracotta, Midnight Ocean, and custom color overrides.
* **Google Typography Overlays**: Custom tracking, letter spacing, coordinates display, and accent lines.

### 🕹️ Interactive Viewport & Action Toolbar
* **Clear Background Canvas**: View-through regional context map behind poster container.
* **Interactive Controls Toolbar**: Lock map navigation, toggle 3D pitch/bearing rotation, step zoom controls, and live `Z` zoom level sliders.

---

## 🚀 Getting Started

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **Python**: v3.11 or higher (for AI services)
* **Docker**: Latest version (for AI services)

### Installation

#### Quick Start (Frontend Only)

```bash
# Clone the repository
git clone https://github.com/Anurag-amrev-7557/mapfolio.git

# Navigate into project directory
cd mapfolio

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be running locally at `http://localhost:5173`.

#### Full Setup (Including AI Features)

For AI-powered theme generation and smart location search, follow the [AI Setup Guide](AI_SETUP.md) to set up the backend services.

```bash
# Start AI services with Docker
docker-compose up -d

# Start frontend (in another terminal)
npm run dev
```

### AI Features

Once AI services are running, you'll have access to:

- **AI Theme Generator** (Press `8`): Generate custom color palettes using AI
- **Smart Location Search** (Press `9`): Discover locations with semantic search

See [AI_SETUP.md](AI_SETUP.md) for detailed setup instructions.

---

## 🛠️ Build & Deployment

```bash
# Typecheck TypeScript definitions
npm run tsc

# Production Bundle Build
npm run build
```

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
