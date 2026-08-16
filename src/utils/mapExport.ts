/**
 * High-precision canvas poster export engine.
 *
 * Renders the MapLibre GL map layer, gradient overlays, and typography
 * directly onto a master HTML5 2D Canvas of resolution (widthPx x heightPx).
 * Bypasses all DOM transform/scaling and html-to-image top-left alignment bugs.
 */
import type { Listener, Map as MaplibreMap, MapEventType } from 'maplibre-gl';
import { getTheme } from '../constants/themes';
import { getFontByValue } from '../constants/fonts';
import type { MarkerData } from '../store/useMapStore';

/** Loose event name ('load', 'idle', …) narrowed for the typed Evented API. */
type MapEventName = keyof MapEventType;

import { jsPDF } from 'jspdf';

export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'pdf';

export interface PosterExportData {
  width: number;
  height: number;
  filename: string;
  format?: ExportFormat;
  quality?: number;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
  fontFamily: string;
  letterSpacingMultiplier?: number;
  themeId: string;
  customThemes?: any[];
  showTextOverlay?: boolean;
  showGradientOverlay?: boolean;
  borderStyle?: 'none' | 'thin' | 'double' | 'rounded' | 'art-deco';
  showCompass?: boolean;
  showScaleBar?: boolean;
  showRouteStats?: boolean;
  routeDistanceKm?: number;
  markers?: Array<{ lat: number; lng: number }>;
  markersData?: MarkerData[];
  routeWaypoints?: Array<{ lat: number; lng: number }>;
  routeColor?: string;
  routeWaypointSize?: number;
  zoom?: number;
}

declare global {
  interface Window {
    /** Live MapLibre instance, registered by PosterMap for the export features. */
    __mapboxInstance?: MaplibreMap;
  }
}

/** Wait for a single map event with a timeout so exports never hang. */
function waitForEvent(mapInstance: MaplibreMap, event: MapEventName, timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      mapInstance.off(event, handler);
      resolve();
    }, timeoutMs);

    const handler: Listener = () => {
      window.clearTimeout(timer);
      resolve();
    };

    mapInstance.once(event, handler);
  });
}

/**
 * Make sure the map has painted a fresh, complete frame:
 * 1. If the style is not loaded yet, wait for the 'load' event.
 * 2. Force a repaint and wait for 'idle' (fires once the frame is fully
 *    rendered with all tiles drawn and nothing left dirty).
 */
export async function waitForMapIdle(mapInstance: MaplibreMap | undefined, timeoutMs = 8000): Promise<void> {
  if (!mapInstance) return;

  if (!mapInstance.loaded()) {
    await waitForEvent(mapInstance, 'load', timeoutMs);
  }

  mapInstance.triggerRepaint();
  await waitForEvent(mapInstance, 'idle', timeoutMs);
}

/**
 * Convert Hex color string to RGBA string with alpha.
 */
function hexToRgba(hex: string, alpha: number): string {
  if (!hex) return `rgba(255, 255, 255, ${alpha})`;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map((c) => c + c).join('');
  }
  const num = parseInt(cleanHex, 16);
  if (isNaN(num)) return `rgba(255, 255, 255, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Render text with tracking / letter spacing on 2D Canvas.
 */
function drawTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  letterSpacingEm: number,
  fontSizePx: number
) {
  if ('letterSpacing' in ctx) {
    try {
      (ctx as any).letterSpacing = `${letterSpacingEm.toFixed(3)}em`;
      ctx.fillText(text, x, y);
      (ctx as any).letterSpacing = '0px';
      return;
    } catch (e) {
      // Fallback to manual character spacing if browser rejects prop
    }
  }

  const spacingPx = letterSpacingEm * fontSizePx;
  const chars = text.split('');
  let totalWidth = 0;
  for (let i = 0; i < chars.length; i++) {
    totalWidth += ctx.measureText(chars[i]).width;
    if (i < chars.length - 1) totalWidth += spacingPx;
  }

  let startX = x;
  if (ctx.textAlign === 'center') {
    startX = x - totalWidth / 2;
  } else if (ctx.textAlign === 'right') {
    startX = x - totalWidth;
  }

  const savedAlign = ctx.textAlign;
  ctx.textAlign = 'left';
  let currentX = startX;
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], currentX, y);
    currentX += ctx.measureText(chars[i]).width + spacingPx;
  }
  ctx.textAlign = savedAlign;
}

/**
 * Master Canvas Poster Export Engine.
 * Composites Map WebGL pixels, color palette backgrounds, linear gradients,
 * and typography overlays onto a master canvas of resolution (width x height).
 */
export async function exportPosterCanvas(options: PosterExportData): Promise<string> {
  const targetWidth = options.width;
  const targetHeight = options.height;
  const format = options.format || 'png';
  const quality = options.quality ?? 0.95;

  const mapInstance = window.__mapboxInstance;
  if (mapInstance) {
    await waitForMapIdle(mapInstance);
  }

  const masterCanvas = document.createElement('canvas');
  masterCanvas.width = targetWidth;
  masterCanvas.height = targetHeight;
  const ctx = masterCanvas.getContext('2d');
  if (!ctx) throw new Error('Could not create master canvas context');

  const currentTheme = getTheme(options.themeId, options.customThemes ?? []);
  const selectedFontObj = getFontByValue(options.fontFamily);
  const fontFamilyCSS = selectedFontObj.value;

  // Scale multiplier matching App.tsx typography scaling
  const overlayScale = Math.min(targetWidth, targetHeight) / 1000;

  // 1. Background Fill
  ctx.fillStyle = currentTheme.palette.land || '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // 2. Map WebGL Canvas Snapshot (cropped to poster-frame region if present)
  let frameLeftRel = 0;
  let frameTopRel = 0;
  let frameWidthRel = mapInstance ? mapInstance.getCanvas().width : targetWidth;
  let frameHeightRel = mapInstance ? mapInstance.getCanvas().height : targetHeight;

  if (mapInstance) {
    const mapCanvas = mapInstance.getCanvas();
    const posterFrameEl = document.getElementById('poster-frame');
    const mapContainer = mapInstance.getContainer();
    const mapRect = mapContainer ? mapContainer.getBoundingClientRect() : null;

    if (mapCanvas && posterFrameEl && mapRect) {
      const frameRect = posterFrameEl.getBoundingClientRect();
      frameLeftRel = frameRect.left - mapRect.left;
      frameTopRel = frameRect.top - mapRect.top;
      frameWidthRel = frameRect.width;
      frameHeightRel = frameRect.height;

      const webglScaleX = mapCanvas.width / mapRect.width;
      const webglScaleY = mapCanvas.height / mapRect.height;

      const srcX = frameLeftRel * webglScaleX;
      const srcY = frameTopRel * webglScaleY;
      const srcW = frameWidthRel * webglScaleX;
      const srcH = frameHeightRel * webglScaleY;

      ctx.drawImage(
        mapCanvas,
        srcX, srcY, srcW, srcH,
        0, 0, targetWidth, targetHeight
      );
    } else if (mapCanvas) {
      ctx.drawImage(
        mapCanvas,
        0, 0, mapCanvas.width, mapCanvas.height,
        0, 0, targetWidth, targetHeight
      );
    }
  }

  // 2.5 Draw Placed Map Markers directly on Master Export Canvas with proportional resolution scaling
  const markersToDraw: MarkerData[] = options.markersData || (options.markers || []).map((m, idx) => ({
    id: `export-m-${idx}`,
    lat: m.lat,
    lng: m.lng,
    type: 'pin',
    iconName: 'MapPin',
    color: '#ef4444',
    size: 36,
    label: (m as any).label
  }));

  if (mapInstance && markersToDraw.length > 0) {
    const scaleX = targetWidth / frameWidthRel;
    const scaleY = targetHeight / frameHeightRel;

    for (const marker of markersToDraw) {
      const pos = mapInstance.project([marker.lng, marker.lat]);
      if (!pos) continue;

      const relX = pos.x - frameLeftRel;
      const relY = pos.y - frameTopRel;

      // Skip markers positioned far outside the poster frame crop box
      if (relX < -60 || relX > frameWidthRel + 60 || relY < -60 || relY > frameHeightRel + 60) {
        continue;
      }

      const canvasX = relX * scaleX;
      const canvasY = relY * scaleY;
      const rawSize = marker.size || 36;
      const markerSize = rawSize * scaleX;
      const color = marker.color || '#ef4444';

      ctx.save();
      if (marker.type === 'dot') {
        const dotRadius = (markerSize * 0.85) / 2;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY, dotRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.lineWidth = Math.max(2, Math.round(markerSize * 0.06));
        ctx.strokeStyle = '#FFFFFF';
        ctx.stroke();
      } else {
        // Draw Pin Icon shape
        const pinRadius = markerSize * 0.4;
        ctx.beginPath();
        ctx.arc(canvasX, canvasY - pinRadius, pinRadius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6 * scaleX;
        ctx.fill();

        // Pin Pointer Triangle
        ctx.beginPath();
        ctx.moveTo(canvasX - pinRadius * 0.6, canvasY - pinRadius * 0.5);
        ctx.lineTo(canvasX + pinRadius * 0.6, canvasY - pinRadius * 0.5);
        ctx.lineTo(canvasX, canvasY);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }

      // Draw Marker Label if present
      if (marker.label) {
        const labelFontSize = Math.max(12, Math.round(markerSize * 0.28));
        ctx.font = `800 ${labelFontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const labelText = marker.label;
        const textMetrics = ctx.measureText(labelText);
        const paddingX = Math.round(10 * scaleX);
        const paddingY = Math.round(4 * scaleX);
        const bgW = textMetrics.width + paddingX * 2;
        const bgH = labelFontSize + paddingY * 2;
        const bgX = canvasX - bgW / 2;
        const bgY = canvasY + Math.round(4 * scaleX);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.beginPath();
        if (typeof ctx.roundRect === 'function') {
          ctx.roundRect(bgX, bgY, bgW, bgH, Math.round(6 * scaleX));
        } else {
          ctx.rect(bgX, bgY, bgW, bgH);
        }
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
        ctx.lineWidth = Math.max(1, Math.round(1.5 * scaleX));
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(labelText, canvasX, bgY + paddingY);
      }
      ctx.restore();
    }
  }

  // 2.6 Draw Route Waypoint Markers (Numbered circles 1, 2, 3...)
  const waypointsToDraw = options.routeWaypoints || [];
  if (mapInstance && waypointsToDraw.length > 0) {
    const scaleX = targetWidth / frameWidthRel;
    const scaleY = targetHeight / frameHeightRel;
    const rawWpSize = options.routeWaypointSize || 28;
    const wpSize = rawWpSize * scaleX;
    const routeColor = options.routeColor || '#3b82f6';
    const radius = wpSize / 2;
    const fontSize = Math.max(10, Math.round(wpSize * 0.35));
    const borderWidth = Math.max(2, Math.round(wpSize * 0.07));

    waypointsToDraw.forEach((wp, idx) => {
      const pos = mapInstance.project([wp.lng, wp.lat]);
      if (!pos) return;

      const relX = pos.x - frameLeftRel;
      const relY = pos.y - frameTopRel;

      if (relX < -60 || relX > frameWidthRel + 60 || relY < -60 || relY > frameHeightRel + 60) {
        return;
      }

      const canvasX = relX * scaleX;
      const canvasY = relY * scaleY;

      ctx.save();
      // Background Circle
      ctx.beginPath();
      ctx.arc(canvasX, canvasY, radius, 0, Math.PI * 2);
      ctx.fillStyle = routeColor;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 8 * scaleX;
      ctx.fill();

      // White Border
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Waypoint Index Number
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${fontSize}px monospace, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(idx + 1), canvasX, canvasY);

      ctx.restore();
    });
  }

  const showGradientOverlay = options.showGradientOverlay ?? true;
  const showTextOverlay = options.showTextOverlay ?? true;

  // 3. Theme-Aware Gradient Shadow Overlays (Top & Bottom)
  if (showGradientOverlay) {
    // Top Gradient Shadow
    const topGradHeight = Math.round(120 * overlayScale);
    const topGrad = ctx.createLinearGradient(0, 0, 0, topGradHeight);
    topGrad.addColorStop(0, hexToRgba(currentTheme.palette.land, 0.7));
    topGrad.addColorStop(0.6, hexToRgba(currentTheme.palette.land, 0.25));
    topGrad.addColorStop(1, hexToRgba(currentTheme.palette.land, 0));
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, targetWidth, topGradHeight);

    // Bottom Gradient Shadow
    const botGradHeight = Math.round(360 * overlayScale);
    const botGrad = ctx.createLinearGradient(0, targetHeight - botGradHeight, 0, targetHeight);
    botGrad.addColorStop(0, hexToRgba(currentTheme.palette.land, 0));
    botGrad.addColorStop(0.3, hexToRgba(currentTheme.palette.land, 0.44));
    botGrad.addColorStop(0.65, hexToRgba(currentTheme.palette.land, 0.9));
    botGrad.addColorStop(1, currentTheme.palette.land);
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, targetHeight - botGradHeight, targetWidth, botGradHeight);
  }

  // 4. Floating Typography Overlay Layer (Pure Text Elements)
  if (showTextOverlay) {

    const textColor = currentTheme.palette.roads.major || '#000000';
    const letterSpacingMultiplier = options.letterSpacingMultiplier ?? 1.0;

    const parseTracking = (trackingStr: string, fallback: number): number => {
      if (!trackingStr) return fallback;
      const num = parseFloat(trackingStr);
      return isNaN(num) ? fallback : num;
    };

    const baseTitleTracking = parseTracking(selectedFontObj.titleTracking, 0.42);
    const baseSubTracking = parseTracking(selectedFontObj.subtitleTracking, 0.32);
    const baseCoordTracking = parseTracking(selectedFontObj.coordTracking, 0.28);

    const titleTrackingNum = options.title.length > 18 ? baseTitleTracking * 0.8 * letterSpacingMultiplier : baseTitleTracking * letterSpacingMultiplier;
    const subTrackingNum = baseSubTracking * letterSpacingMultiplier;
    const coordTrackingNum = baseCoordTracking * letterSpacingMultiplier;

    // Draw Main Title
    const titleText = options.title.toUpperCase();
    const titleFontSize = Math.round(
      options.title.length > 20 ? 42 * overlayScale :
      options.title.length > 14 ? 48 * overlayScale : 58 * overlayScale
    );

    ctx.fillStyle = textColor;
    ctx.font = `900 ${titleFontSize}px ${fontFamilyCSS}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const titleY = targetHeight - Math.round(230 * overlayScale);
    drawTextWithSpacing(ctx, titleText, targetWidth / 2, titleY, titleTrackingNum, titleFontSize);

    // Accent Line
    const lineWidth = Math.round(220 * overlayScale * (letterSpacingMultiplier >= 1.2 ? 1.15 : 1));
    const lineHeight = Math.max(2, Math.round(3.5 * overlayScale));
    const lineY = titleY + Math.round(40 * overlayScale);
    ctx.fillStyle = textColor;
    ctx.fillRect((targetWidth - lineWidth) / 2, lineY, lineWidth, lineHeight);

    // Subtitle
    const subText = options.subtitle.toUpperCase();
    const subFontSize = Math.round(19 * overlayScale);
    ctx.font = `600 ${subFontSize}px ${fontFamilyCSS}`;
    const subY = lineY + Math.round(32 * overlayScale);
    drawTextWithSpacing(ctx, subText, targetWidth / 2, subY, subTrackingNum, subFontSize);

    // Coordinates
    const lat = options.lat;
    const lng = options.lng;
    const coordText = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'} / ${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`;
    const coordFontSize = Math.round(11.5 * overlayScale);
    ctx.font = `500 ${coordFontSize}px monospace, ${fontFamilyCSS}`;
    const coordY = subY + Math.round(28 * overlayScale);
    drawTextWithSpacing(ctx, coordText, targetWidth / 2, coordY, coordTrackingNum, coordFontSize);

    // Watermarks
    const wmFontSize = Math.round(9.5 * overlayScale);
    ctx.font = `400 ${wmFontSize}px monospace`;
    const wmY = targetHeight - Math.round(25 * overlayScale);
    const wmPadding = Math.round(28 * overlayScale);

    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.5;

    ctx.textAlign = 'left';
    ctx.fillText('© mapfolio.app', wmPadding, wmY);

    ctx.textAlign = 'right';
    ctx.fillText('© OpenStreetMap contributors', targetWidth - wmPadding, wmY);

    ctx.globalAlpha = 1.0;
  }

  // 5. Decorative Borders, Compass Rose, Scale Bar & Route Stats on Export Canvas
  const borderStyle = options.borderStyle ?? 'none';
  const textColor = currentTheme.palette.roads.major || '#000000';

  if (borderStyle === 'thin') {
    const inset = Math.round(35 * overlayScale);
    ctx.strokeStyle = `${textColor}99`;
    ctx.lineWidth = Math.max(2, Math.round(3 * overlayScale));
    ctx.strokeRect(inset, inset, targetWidth - inset * 2, targetHeight - inset * 2);
  } else if (borderStyle === 'double') {
    const inset1 = Math.round(28 * overlayScale);
    const inset2 = Math.round(44 * overlayScale);
    ctx.strokeStyle = `${textColor}CC`;
    ctx.lineWidth = Math.max(3, Math.round(4 * overlayScale));
    ctx.strokeRect(inset1, inset1, targetWidth - inset1 * 2, targetHeight - inset1 * 2);
    ctx.strokeStyle = `${textColor}66`;
    ctx.lineWidth = Math.max(1, Math.round(2 * overlayScale));
    ctx.strokeRect(inset2, inset2, targetWidth - inset2 * 2, targetHeight - inset2 * 2);
  } else if (borderStyle === 'rounded') {
    const inset = Math.round(38 * overlayScale);
    const radius = Math.round(48 * overlayScale);
    ctx.strokeStyle = `${textColor}B3`;
    ctx.lineWidth = Math.max(2, Math.round(3.5 * overlayScale));
    ctx.beginPath();
    ctx.roundRect(inset, inset, targetWidth - inset * 2, targetHeight - inset * 2, radius);
    ctx.stroke();
  } else if (borderStyle === 'art-deco') {
    const inset = Math.round(32 * overlayScale);
    ctx.strokeStyle = `${textColor}E6`;
    ctx.lineWidth = Math.max(3, Math.round(5 * overlayScale));
    ctx.strokeRect(inset, inset, targetWidth - inset * 2, targetHeight - inset * 2);
    const insetInner = Math.round(44 * overlayScale);
    ctx.strokeStyle = `${textColor}66`;
    ctx.lineWidth = Math.max(1, Math.round(2 * overlayScale));
    ctx.strokeRect(insetInner, insetInner, targetWidth - insetInner * 2, targetHeight - insetInner * 2);
  }

  // Compass Rose
  if (options.showCompass) {
    const cx = Math.round(80 * overlayScale);
    const cy = Math.round(80 * overlayScale);
    const r = Math.round(45 * overlayScale);

    ctx.save();
    ctx.translate(cx, cy);

    // North Pointer
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.2, -r * 0.2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r * 0.2, -r * 0.2);
    ctx.closePath();
    ctx.fill();

    // South Pointer
    ctx.fillStyle = `${textColor}80`;
    ctx.beginPath();
    ctx.moveTo(0, r);
    ctx.lineTo(r * 0.2, r * 0.2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r * 0.2, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // East Pointer
    ctx.fillStyle = textColor;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(r * 0.2, -r * 0.2);
    ctx.lineTo(0, 0);
    ctx.lineTo(r * 0.2, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // West Pointer
    ctx.fillStyle = `${textColor}80`;
    ctx.beginPath();
    ctx.moveTo(-r, 0);
    ctx.lineTo(-r * 0.2, -r * 0.2);
    ctx.lineTo(0, 0);
    ctx.lineTo(-r * 0.2, r * 0.2);
    ctx.closePath();
    ctx.fill();

    // Center Ring & N Label
    ctx.strokeStyle = textColor;
    ctx.lineWidth = Math.max(1, Math.round(2 * overlayScale));
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(14 * overlayScale)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('N', 0, -r - 4);
    ctx.restore();
  }

  // Scale Bar
  if (options.showScaleBar) {
    const sbWidth = Math.round(140 * overlayScale);
    const sbHeight = Math.round(10 * overlayScale);
    const sbX = targetWidth - Math.round(60 * overlayScale) - sbWidth;
    const sbY = Math.round(70 * overlayScale);

    ctx.strokeStyle = textColor;
    ctx.lineWidth = Math.max(2, Math.round(3 * overlayScale));
    ctx.beginPath();
    ctx.moveTo(sbX, sbY);
    ctx.lineTo(sbX, sbY + sbHeight);
    ctx.lineTo(sbX + sbWidth, sbY + sbHeight);
    ctx.lineTo(sbX + sbWidth, sbY);
    ctx.stroke();

    const z = options.zoom ?? 12;
    const scaleLabel = z >= 14 ? '500 M' : z >= 11 ? '2 KM' : z >= 8 ? '10 KM' : '50 KM';
    ctx.fillStyle = textColor;
    ctx.font = `bold ${Math.round(14 * overlayScale)}px monospace`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(scaleLabel, targetWidth - Math.round(60 * overlayScale), sbY + sbHeight + 6);
  }

  // 5. Convert & Download
  const cleanFilename = options.filename.toLowerCase().replace(/\s+/g, '-').replace(/\.[^/.]+$/, '');

  if (format === 'pdf') {
    const isLandscape = targetWidth > targetHeight;
    const pdf = new jsPDF({
      orientation: isLandscape ? 'landscape' : 'portrait',
      unit: 'px',
      format: [targetWidth, targetHeight],
      hotfixes: ['px_scaling'],
    });

    const imgData = masterCanvas.toDataURL('image/jpeg', 0.95);
    pdf.addImage(imgData, 'JPEG', 0, 0, targetWidth, targetHeight);
    pdf.save(`${cleanFilename}.pdf`);
    return imgData;
  }

  const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
  const dataUrl = masterCanvas.toDataURL(mimeType, quality);
  const link = document.createElement('a');
  const ext = format === 'jpeg' ? 'jpg' : format;
  link.download = `${cleanFilename}.${ext}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
