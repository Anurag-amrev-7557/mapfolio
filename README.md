# 🗺️ Mapfolio Pro Studio

> **Mapfolio Pro** is a high-precision, aesthetic cartographic poster design engine and GIS studio built with **React**, **TypeScript**, **Vite**, **MapLibre GL**, **Tailwind CSS**, and **Zustand**.

---

## ✨ Features

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

### Installation

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
