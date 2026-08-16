"""
Basic Theme Generation Service - Initial implementation using color theory and algorithms
Can be extended with ML models for more sophisticated generation
"""

import random
import colorsys
from typing import Dict, List, Optional
from dataclasses import dataclass
import json

@dataclass
class ColorPalette:
    """Structured color palette for map themes"""
    land: str
    landcover: str
    water: str
    waterway: str
    parks: str
    buildings: str
    aeroway: str
    rail: str
    roads: Dict[str, str]

class ThemeService:
    """AI-powered theme generation service"""

    def __init__(self):
        # Predefined color harmony rules
        self.harmony_rules = {
            'complementary': self._generate_complementary,
            'analogous': self._generate_analogous,
            'triadic': self._generate_triadic,
            'monochromatic': self._generate_monochromatic,
            'split_complementary': self._generate_split_complementary
        }

        # High-quality curated palettes for different styles
        self.curated_palettes = {
            'ocean': {
                'land': '#8B7355',
                'landcover': '#A0896C',
                'water': '#1E88E5',
                'waterway': '#42A5F5',
                'parks': '#2E7D32',
                'buildings': '#6D4C41',
                'aeroway': '#8D6E63',
                'rail': '#5D4037',
                'roads': {
                    'major': '#FFFFFF',
                    'minor_high': '#E0E0E0',
                    'minor_mid': '#BDBDBD',
                    'minor_low': '#9E9E9E',
                    'path': '#FFFFFF',
                    'outline': '#757575'
                }
            },
            'sunset': {
                'land': '#D87A4A',
                'landcover': '#E8966A',
                'water': '#1565C0',
                'waterway': '#1976D2',
                'parks': '#2E7D32',
                'buildings': '#BF360C',
                'aeroway': '#E65100',
                'rail': '#8D6E63',
                'roads': {
                    'major': '#FFD54F',
                    'minor_high': '#FFCA28',
                    'minor_mid': '#FFC107',
                    'minor_low': '#FFB300',
                    'path': '#FFE082',
                    'outline': '#FF6F00'
                }
            },
            'cyberpunk': {
                'land': '#1A1A2E',
                'landcover': '#16213E',
                'water': '#0F3460',
                'waterway': '#1B4F72',
                'parks': '#E94560',
                'buildings': '#0F0F1A',
                'aeroway': '#1A1A2E',
                'rail': '#E94560',
                'roads': {
                    'major': '#00FFF5',
                    'minor_high': '#00D4AA',
                    'minor_mid': '#00A085',
                    'minor_low': '#007A60',
                    'path': '#00FFF5',
                    'outline': '#E94560'
                }
            },
            'vintage': {
                'land': '#8D6E63',
                'landcover': '#A1887F',
                'water': '#5D4037',
                'waterway': '#6D4C41',
                'parks': '#795548',
                'buildings': '#4E342E',
                'aeroway': '#6D4C41',
                'rail': '#3E2723',
                'roads': {
                    'major': '#D7CCC8',
                    'minor_high': '#BCAAA4',
                    'minor_mid': '#A1887F',
                    'minor_low': '#8D6E63',
                    'path': '#D7CCC8',
                    'outline': '#5D4037'
                }
            },
            'nature': {
                'land': '#4CAF50',
                'landcover': '#66BB6A',
                'water': '#2196F3',
                'waterway': '#42A5F5',
                'parks': '#388E3C',
                'buildings': '#8D6E63',
                'aeroway': '#A1887F',
                'rail': '#6D4C41',
                'roads': {
                    'major': '#FFEB3B',
                    'minor_high': '#FFF176',
                    'minor_mid': '#FFEE58',
                    'minor_low': '#FFF9C4',
                    'path': '#FFF176',
                    'outline': '#33691E'
                }
            },
            'minimal': {
                'land': '#F5F5F5',
                'landcover': '#EEEEEE',
                'water': '#BDBDBD',
                'waterway': '#9E9E9E',
                'parks': '#E0E0E0',
                'buildings': '#9E9E9E',
                'aeroway': '#BDBDBD',
                'rail': '#757575',
                'roads': {
                    'major': '#424242',
                    'minor_high': '#616161',
                    'minor_mid': '#757575',
                    'minor_low': '#9E9E9E',
                    'path': '#BDBDBD',
                    'outline': '#212121'
                }
            }
        }

        # Mood-based color tendencies
        self.mood_colors = {
            'neutral': {'base_hue': 0.0, 'saturation': 0.5, 'lightness': 0.5},
            'dark': {'base_hue': 0.0, 'saturation': 0.3, 'lightness': 0.15},
            'light': {'base_hue': 0.0, 'saturation': 0.4, 'lightness': 0.85},
            'vibrant': {'base_hue': 0.0, 'saturation': 0.8, 'lightness': 0.5},
            'muted': {'base_hue': 0.0, 'saturation': 0.2, 'lightness': 0.6},
            'warm': {'base_hue': 0.08, 'saturation': 0.6, 'lightness': 0.5},  # Orange/red
            'cool': {'base_hue': 0.6, 'saturation': 0.5, 'lightness': 0.5},  # Blue
            'nature': {'base_hue': 0.3, 'saturation': 0.5, 'lightness': 0.4},  # Green
        }
    
    async def generate_theme(
        self,
        prompt: str,
        style_keywords: List[str],
        color_harmony: str = 'complementary',
        base_theme_id: Optional[str] = None
    ) -> Dict:
        """
        Generate a new theme based on prompt and style preferences
        """
        try:
            # Analyze prompt for mood and style indicators
            mood_analysis = self._analyze_prompt(prompt, style_keywords)

            # Extract color suggestions from prompt
            color_suggestions = self._extract_color_suggestions(prompt)

            # Use curated palette as base and tint with user colors
            palette = self._generate_tinted_curated_palette(color_suggestions, mood_analysis, style_keywords)
            theme_name = f"{self._generate_theme_name_from_prompt(prompt)}"

            # Generate theme metadata
            theme_metadata = self._generate_theme_metadata(prompt, mood_analysis)

            return {
                "palette": palette,
                "theme_name": theme_name,
                "description": theme_metadata['description'],
                "mood_analysis": mood_analysis,
                "confidence_score": 0.9
            }

        except Exception as e:
            print(f"Error generating theme: {str(e)}")
            import traceback
            traceback.print_exc()
            return {
                "error": str(e),
                "palette": None
            }
    
    def _analyze_prompt(self, prompt: str, style_keywords: List[str]) -> Dict:
        """Analyze prompt for mood and style indicators with improved color psychology"""
        prompt_lower = prompt.lower()
        all_keywords = prompt_lower.split() + [k.lower() for k in style_keywords]

        # Enhanced mood detection with color psychology
        mood = 'neutral'
        mood_scores = {
            'dark': 0,
            'light': 0,
            'vibrant': 0,
            'muted': 0,
            'warm': 0,
            'cool': 0,
            'nature': 0,
        }

        # Keywords for each mood with color psychology
        mood_keywords = {
            'dark': ['dark', 'night', 'midnight', 'shadow', 'gloomy', 'dim', 'noir', 'eclipse', 'moon', 'black', 'coal', 'smoke'],
            'light': ['light', 'bright', 'sunny', 'day', 'sun', 'radiant', 'glowing', 'clear', 'white', 'shine', 'luminous'],
            'vibrant': ['vibrant', 'bold', 'intense', 'vivid', 'electric', 'neon', 'saturated', 'rich', 'deep', 'strong'],
            'muted': ['muted', 'soft', 'gentle', 'calm', 'quiet', 'subtle', 'pastel', 'faded', 'washed', 'pale'],
            'warm': ['warm', 'hot', 'sunny', 'fire', 'heat', 'tropical', 'golden', 'sunset', 'sunrise', 'cozy', 'autumn'],
            'cool': ['cool', 'cold', 'icy', 'frost', 'winter', 'chill', 'crisp', 'fresh', 'arctic', 'glacial'],
            'nature': ['nature', 'natural', 'organic', 'forest', 'green', 'earth', 'wild', 'outdoor', 'garden', 'plant'],
        }

        # Score each mood based on keyword matches
        for mood_name, keywords in mood_keywords.items():
            for keyword in keywords:
                if keyword in prompt_lower:
                    mood_scores[mood_name] += 1

        # Also check style keywords
        for keyword in style_keywords:
            keyword_lower = keyword.lower()
            for mood_name, keywords in mood_keywords.items():
                if keyword_lower in keywords:
                    mood_scores[mood_name] += 2  # Style keywords have higher weight

        # Select mood with highest score
        max_score = max(mood_scores.values())
        if max_score > 0:
            mood = max(mood_scores, key=mood_scores.get)[0]

        # Detect specific color mentions
        detected_colors = []
        color_names = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white']
        for color in color_names:
            if color in all_keywords:
                detected_colors.append(color)

        return {
            'mood': mood,
            'detected_colors': detected_colors,
            'style_keywords': style_keywords,
            'complexity': len(all_keywords),
            'mood_scores': mood_scores
        }

    def _extract_color_suggestions(self, prompt: str) -> List[str]:
        """Extract color names and suggestions from the prompt"""
        prompt_lower = prompt.lower()

        # Color name mappings (color name -> Colormind compatible format)
        color_map = {
            'red': ['red'],
            'blue': ['blue'],
            'green': ['green'],
            'yellow': ['yellow'],
            'orange': ['orange'],
            'purple': ['purple'],
            'pink': ['pink'],
            'brown': ['brown'],
            'black': ['black'],
            'white': ['white'],
            'gray': ['gray', 'grey'],
            'cyan': ['cyan'],
            'magenta': ['magenta'],
            'teal': ['teal'],
            'navy': ['navy'],
            'gold': ['gold'],
            'silver': ['silver'],
            'beige': ['beige'],
            'coral': ['coral'],
            'indigo': ['indigo'],
            'violet': ['violet'],
            'lime': ['lime'],
            'olive': ['olive'],
            'maroon': ['maroon'],
            'crimson': ['crimson'],
            'turquoise': ['turquoise'],
            'azure': ['azure'],
            'scarlet': ['red'],
            'emerald': ['green'],
            'ruby': ['red'],
            'sapphire': ['blue'],
            'topaz': ['yellow'],
            'amethyst': ['purple'],
            'ocean': ['blue'],
            'forest': ['green'],
            'sunset': ['orange', 'red'],
            'sunrise': ['orange', 'yellow'],
            'midnight': ['navy', 'black'],
            'sky': ['blue', 'cyan'],
            'grass': ['green'],
            'sand': ['beige', 'yellow'],
            'dirt': ['brown'],
            'earth': ['brown'],
            'fire': ['red', 'orange'],
            'ice': ['cyan', 'white'],
            'rose': ['pink', 'red'],
            'lavender': ['purple'],
            'peach': ['orange', 'pink'],
            'mint': ['green'],
            'lemon': ['yellow'],
            'cherry': ['red'],
            'chocolate': ['brown'],
            'coffee': ['brown'],
            'sugar': ['white'],
            'coal': ['black'],
            'smoke': ['gray'],
            'cloud': ['white', 'gray'],
            'night': ['navy', 'black'],
            'day': ['yellow', 'blue'],
            'sun': ['yellow', 'orange'],
            'moon': ['white', 'gray'],
            'star': ['yellow', 'white'],
        }

        suggestions = []
        for color, variants in color_map.items():
            if color in prompt_lower:
                suggestions.extend(variants)

        return suggestions[:3] if suggestions else []  # Limit to 3 suggestions

    def _generate_tinted_curated_palette(self, color_suggestions: List[str], mood_analysis: Dict, style_keywords: List[str]) -> Dict:
        """Generate theme using user's colors as primary foundation with color theory"""
        # Convert color suggestions to RGB
        color_rgb_map = {
            'red': [220, 38, 38],
            'blue': [37, 99, 235],
            'green': [34, 197, 94],
            'yellow': [234, 179, 8],
            'orange': [249, 115, 22],
            'purple': [168, 85, 247],
            'pink': [236, 72, 153],
            'brown': [120, 53, 15],
            'cyan': [6, 182, 212],
            'navy': [15, 23, 42],
            'gold': [251, 191, 36],
            'teal': [20, 184, 166],
            'emerald': [16, 185, 129],
            'sky': [14, 165, 233],
            'forest': [34, 197, 94],
            'fire': [239, 68, 68],
            'ice': [186, 230, 253],
            'ocean': [37, 99, 235],
            'sunset': [251, 146, 60],
            'lavender': [167, 139, 250],
            'mint': [52, 211, 153],
            'sand': [251, 246, 228],
            'midnight': [15, 23, 42],
        }

        suggestion_rgbs = []
        for color in color_suggestions[:2]:
            if color in color_rgb_map:
                suggestion_rgbs.append(color_rgb_map[color])

        if suggestion_rgbs:
            # Use user's colors as primary foundation
            primary_rgb = suggestion_rgbs[0]
            primary_hsl = self._rgb_to_hsl(primary_rgb)

            # Generate harmonious palette around primary color
            palette = self._build_color_theory_palette(primary_hsl, suggestion_rgbs[1] if len(suggestion_rgbs) > 1 else None, mood_analysis)
            return palette
        else:
            # Fallback to curated palette
            style_match = None
            for keyword in style_keywords:
                if keyword in self.curated_palettes:
                    style_match = keyword
                    break
            if not style_match:
                for style_id in self.curated_palettes:
                    if style_id in style_keywords:
                        style_match = style_id
                        break

            if not style_match:
                mood = mood_analysis['mood']
                mood_map = {
                    'dark': 'cyberpunk',
                    'light': 'minimal',
                    'vibrant': 'sunset',
                    'muted': 'vintage',
                    'warm': 'sunset',
                    'cool': 'ocean',
                    'nature': 'nature',
                }
                style_match = mood_map.get(mood, 'minimal')

            base_palette = self.curated_palettes[style_match]
            return self._apply_variations_to_palette(base_palette, mood_analysis)

    def _build_color_theory_palette(self, primary_hsl: tuple, secondary_rgb: Optional[List[int]], mood_analysis: Dict) -> Dict:
        """Build palette using cartographic color theory with proper contrast and accessibility"""
        h, s, l = primary_hsl

        mood = mood_analysis['mood']

        # Cartographic color assignment with WCAG contrast considerations
        # Maps need: good contrast between land/roads, distinct water, accessible colors

        if mood == 'dark':
            # Dark mode: high contrast, dark backgrounds, bright accents
            land = self._hsl_to_hex(h, min(s * 0.5, 0.4), 0.15)  # Dark land
            landcover = self._hsl_to_hex(h, min(s * 0.4, 0.35), 0.12)
            water = self._hsl_to_hex(0.6, 0.5, 0.25)  # Dark blue water
            waterway = self._hsl_to_hex(0.6, 0.6, 0.3)
            parks = self._hsl_to_hex(0.3, 0.4, 0.2)
            buildings = self._hsl_to_hex(h, min(s * 0.3, 0.3), 0.1)
            aeroway = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.08)
            rail = self._hsl_to_hex(h, min(s * 0.35, 0.35), 0.15)
            # Bright roads for contrast against dark land
            roads_major = self._hsl_to_hex(0.08, 0.9, 0.7)  # Bright yellow/white
            roads_minor_high = self._hsl_to_hex(0.08, 0.85, 0.6)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.8, 0.5)
            roads_minor_low = self._hsl_to_hex(h, min(s * 0.3, 0.3), 0.25)
            roads_path = self._hsl_to_hex(0.08, 0.85, 0.65)
            roads_outline = self._hsl_to_hex(0.08, 0.15, 0.15)

        elif mood == 'light':
            # Light mode: light backgrounds, dark elements for readability
            land = self._hsl_to_hex(h, min(s * 0.3, 0.3), 0.92)  # Light land
            landcover = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.88)
            water = self._hsl_to_hex(0.6, 0.5, 0.75)  # Light blue water
            waterway = self._hsl_to_hex(0.6, 0.45, 0.7)
            parks = self._hsl_to_hex(0.3, 0.4, 0.8)
            buildings = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.75)
            aeroway = self._hsl_to_hex(h, min(s * 0.2, 0.2), 0.7)
            rail = self._hsl_to_hex(h, min(s * 0.3, 0.3), 0.65)
            # Dark roads for contrast against light land
            roads_major = self._hsl_to_hex(0.08, 0.3, 0.25)  # Dark gray
            roads_minor_high = self._hsl_to_hex(0.08, 0.25, 0.3)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.2, 0.35)
            roads_minor_low = self._hsl_to_hex(h, min(s * 0.15, 0.15), 0.45)
            roads_path = self._hsl_to_hex(0.08, 0.25, 0.32)
            roads_outline = self._hsl_to_hex(0.08, 0.15, 0.2)

        elif mood == 'vibrant':
            # Vibrant: high saturation, good contrast
            land = self._hsl_to_hex(h, min(s * 0.7, 0.7), 0.55)
            landcover = self._hsl_to_hex(h, min(s * 0.65, 0.65), 0.5)
            water = self._hsl_to_hex(0.6, 0.7, 0.55)
            waterway = self._hsl_to_hex(0.6, 0.65, 0.6)
            parks = self._hsl_to_hex(0.3, 0.7, 0.55)
            buildings = self._hsl_to_hex(h, min(s * 0.75, 0.75), 0.5)
            aeroway = self._hsl_to_hex(h, min(s * 0.6, 0.6), 0.45)
            rail = self._hsl_to_hex(h, min(s * 0.8, 0.8), 0.55)
            # Complementary high-contrast roads
            comp_h = (h + 0.5) % 1.0
            roads_major = self._hsl_to_hex(comp_h, 0.9, 0.55)
            roads_minor_high = self._hsl_to_hex(comp_h, 0.85, 0.5)
            roads_minor_mid = self._hsl_to_hex(comp_h, 0.8, 0.45)
            roads_minor_low = self._hsl_to_hex(h, min(s * 0.5, 0.5), 0.55)
            roads_path = self._hsl_to_hex(h, min(s * 0.6, 0.6), 0.6)
            roads_outline = self._hsl_to_hex(0.08, 0.2, 0.25)

        elif mood == 'muted':
            # Muted: lower saturation, good readability
            land = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.65)
            landcover = self._hsl_to_hex(h, min(s * 0.2, 0.2), 0.6)
            water = self._hsl_to_hex(0.6, 0.3, 0.65)
            waterway = self._hsl_to_hex(0.6, 0.25, 0.6)
            parks = self._hsl_to_hex(0.3, 0.3, 0.6)
            buildings = self._hsl_to_hex(h, min(s * 0.2, 0.2), 0.55)
            aeroway = self._hsl_to_hex(h, min(s * 0.15, 0.15), 0.5)
            rail = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.6)
            # Muted but visible roads
            roads_major = self._hsl_to_hex(0.08, 0.3, 0.35)
            roads_minor_high = self._hsl_to_hex(0.08, 0.25, 0.4)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.2, 0.45)
            roads_minor_low = self._hsl_to_hex(h, min(s * 0.15, 0.15), 0.5)
            roads_path = self._hsl_to_hex(0.08, 0.25, 0.42)
            roads_outline = self._hsl_to_hex(0.08, 0.15, 0.3)

        elif mood == 'warm':
            # Warm: oranges, yellows, reds with good contrast
            warm_h = 0.08 if not (0 <= h <= 0.16 or h >= 0.83) else h
            land = self._hsl_to_hex(warm_h, min(s * 0.5, 0.5), 0.55)
            landcover = self._hsl_to_hex(warm_h, min(s * 0.45, 0.45), 0.5)
            water = self._hsl_to_hex(0.6, 0.4, 0.55)  # Blue for contrast
            waterway = self._hsl_to_hex(0.6, 0.35, 0.5)
            parks = self._hsl_to_hex(0.3, 0.5, 0.5)
            buildings = self._hsl_to_hex(warm_h, min(s * 0.4, 0.4), 0.45)
            aeroway = self._hsl_to_hex(warm_h, min(s * 0.35, 0.35), 0.4)
            rail = self._hsl_to_hex(warm_h, min(s * 0.45, 0.45), 0.5)
            # Warm high-contrast roads
            roads_major = self._hsl_to_hex(warm_h, 0.8, 0.65)
            roads_minor_high = self._hsl_to_hex(warm_h, 0.75, 0.55)
            roads_minor_mid = self._hsl_to_hex(warm_h, 0.7, 0.45)
            roads_minor_low = self._hsl_to_hex(warm_h, min(s * 0.4, 0.4), 0.5)
            roads_path = self._hsl_to_hex(warm_h, 0.7, 0.6)
            roads_outline = self._hsl_to_hex(0.05, 0.3, 0.3)

        elif mood == 'cool':
            # Cool: blues, cyans, greens
            cool_h = 0.6 if not (0.4 <= h <= 0.8) else h
            land = self._hsl_to_hex(cool_h, min(s * 0.4, 0.4), 0.55)
            landcover = self._hsl_to_hex(cool_h, min(s * 0.35, 0.35), 0.5)
            water = self._hsl_to_hex(cool_h, min(s * 0.5, 0.5), 0.55)
            waterway = self._hsl_to_hex(cool_h, min(s * 0.45, 0.45), 0.5)
            parks = self._hsl_to_hex(0.3, 0.5, 0.5)
            buildings = self._hsl_to_hex(cool_h, min(s * 0.3, 0.3), 0.45)
            aeroway = self._hsl_to_hex(cool_h, min(s * 0.25, 0.25), 0.4)
            rail = self._hsl_to_hex(cool_h, min(s * 0.35, 0.35), 0.5)
            # Cool roads with warm accent for contrast
            roads_major = self._hsl_to_hex(0.08, 0.7, 0.55)  # Warm accent
            roads_minor_high = self._hsl_to_hex(0.08, 0.65, 0.5)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.6, 0.45)
            roads_minor_low = self._hsl_to_hex(cool_h, min(s * 0.35, 0.35), 0.5)
            roads_path = self._hsl_to_hex(0.08, 0.65, 0.52)
            roads_outline = self._hsl_to_hex(0.05, 0.25, 0.3)

        elif mood == 'nature':
            # Nature: greens and earth tones
            land = self._hsl_to_hex(0.3, min(s * 0.4, 0.4), 0.55)
            landcover = self._hsl_to_hex(0.3, min(s * 0.35, 0.35), 0.5)
            water = self._hsl_to_hex(0.6, 0.5, 0.55)
            waterway = self._hsl_to_hex(0.6, 0.45, 0.5)
            parks = self._hsl_to_hex(0.3, min(s * 0.6, 0.6), 0.55)
            buildings = self._hsl_to_hex(0.08, 0.35, 0.45)
            aeroway = self._hsl_to_hex(0.3, 0.3, 0.4)
            rail = self._hsl_to_hex(0.08, 0.3, 0.5)
            # Earth-toned roads
            roads_major = self._hsl_to_hex(0.08, 0.6, 0.5)
            roads_minor_high = self._hsl_to_hex(0.08, 0.55, 0.45)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.5, 0.4)
            roads_minor_low = self._hsl_to_hex(0.3, min(s * 0.35, 0.35), 0.5)
            roads_path = self._hsl_to_hex(0.08, 0.55, 0.48)
            roads_outline = self._hsl_to_hex(0.08, 0.2, 0.3)

        else:  # neutral
            # Neutral: balanced, WCAG-compliant
            land = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.7)
            landcover = self._hsl_to_hex(h, min(s * 0.2, 0.2), 0.65)
            water = self._hsl_to_hex(0.6, 0.4, 0.7)
            waterway = self._hsl_to_hex(0.6, 0.35, 0.65)
            parks = self._hsl_to_hex(0.3, 0.3, 0.65)
            buildings = self._hsl_to_hex(h, min(s * 0.2, 0.2), 0.6)
            aeroway = self._hsl_to_hex(h, min(s * 0.15, 0.15), 0.55)
            rail = self._hsl_to_hex(h, min(s * 0.25, 0.25), 0.65)
            # High-contrast dark roads
            roads_major = self._hsl_to_hex(0.08, 0.3, 0.3)
            roads_minor_high = self._hsl_to_hex(0.08, 0.25, 0.35)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.2, 0.4)
            roads_minor_low = self._hsl_to_hex(h, min(s * 0.15, 0.15), 0.5)
            roads_path = self._hsl_to_hex(0.08, 0.25, 0.38)
            roads_outline = self._hsl_to_hex(0.08, 0.15, 0.25)

        # Secondary color integration with cartographic principles
        if secondary_rgb:
            secondary_hsl = self._rgb_to_hsl(secondary_rgb)
            sh, ss, sl = secondary_hsl

            # Cartographic rule: water should be cool colors
            if 0.4 <= sh <= 0.8:
                water = self._hsl_to_hex(sh, min(ss * 0.5, 0.5), 0.55)
                waterway = self._hsl_to_hex(sh, min(ss * 0.45, 0.45), 0.5)
            # Cartographic rule: urban features can be warm
            else:
                buildings = self._hsl_to_hex(sh, min(ss * 0.3, 0.3), 0.5)
                rail = self._hsl_to_hex(sh, min(ss * 0.25, 0.25), 0.55)

        return {
            'land': land,
            'landcover': landcover,
            'water': water,
            'waterway': waterway,
            'parks': parks,
            'buildings': buildings,
            'aeroway': aeroway,
            'rail': rail,
            'roads': {
                'major': roads_major,
                'minor_high': roads_minor_high,
                'minor_mid': roads_minor_mid,
                'minor_low': roads_minor_low,
                'path': roads_path,
                'outline': roads_outline
            }
        }

    def _tint_color(self, hex_color: str, tint_hsl: tuple, intensity: float) -> str:
        """Tint a color with another color at given intensity"""
        h1, s1, l1 = self._hex_to_hsl(hex_color)
        h2, s2, l2 = tint_hsl

        # Blend the colors
        h = (h1 * (1 - intensity) + h2 * intensity) % 1.0
        s = s1 * (1 - intensity) + s2 * intensity
        l = l1 * (1 - intensity) + l2 * intensity

        return self._hsl_to_hex(h, s, l)

    def _generate_map_optimized_palette(self, color_suggestions: List[str], mood_analysis: Dict, harmony: str) -> Dict:
        """Generate map-optimized palette using cartographic color theory"""
        # Map color suggestions to professional RGB values
        color_rgb_map = {
            'red': [220, 38, 38],
            'blue': [37, 99, 235],
            'green': [34, 197, 94],
            'yellow': [234, 179, 8],
            'orange': [249, 115, 22],
            'purple': [168, 85, 247],
            'pink': [236, 72, 153],
            'brown': [120, 53, 15],
            'black': [30, 30, 30],
            'white': [250, 250, 250],
            'gray': [128, 128, 128],
            'cyan': [6, 182, 212],
            'navy': [15, 23, 42],
            'gold': [251, 191, 36],
            'silver': [192, 192, 192],
            'teal': [20, 184, 166],
            'olive': [161, 98, 7],
            'emerald': [16, 185, 129],
            'sky': [14, 165, 233],
            'forest': [34, 197, 94],
            'earth': [120, 53, 15],
            'fire': [239, 68, 68],
            'ice': [186, 230, 253],
            'ocean': [37, 99, 235],
            'sunset': [251, 146, 60],
            'lavender': [167, 139, 250],
            'mint': [52, 211, 153],
            'sand': [251, 246, 228],
            'midnight': [15, 23, 42],
        }

        # Extract RGB values from suggestions
        suggestion_rgbs = []
        for color in color_suggestions[:2]:  # Use up to 2 color suggestions
            if color in color_rgb_map:
                suggestion_rgbs.append(color_rgb_map[color])

        # Generate base hue
        if suggestion_rgbs:
            base_hue = self._rgb_to_hsl(suggestion_rgbs[0])[0]
        else:
            mood_config = self.mood_colors.get(mood_analysis['mood'], self.mood_colors['neutral'])
            base_hue = mood_config['base_hue']

        # Cartographic color assignments based on mood
        mood = mood_analysis['mood']

        if mood == 'dark':
            land = self._hsl_to_hex(base_hue, 0.3, 0.2)
            landcover = self._hsl_to_hex(base_hue, 0.25, 0.15)
            water = self._hsl_to_hex(0.6, 0.6, 0.3)
            waterway = self._hsl_to_hex(0.6, 0.7, 0.4)
            parks = self._hsl_to_hex(0.3, 0.5, 0.25)
            buildings = self._hsl_to_hex(base_hue, 0.2, 0.15)
            aeroway = self._hsl_to_hex(base_hue, 0.15, 0.1)
            rail = self._hsl_to_hex(base_hue, 0.25, 0.2)
            roads_major = self._hsl_to_hex(0.6, 0.8, 0.6)
            roads_minor_high = self._hsl_to_hex(0.6, 0.7, 0.5)
            roads_minor_mid = self._hsl_to_hex(0.6, 0.6, 0.4)
            roads_minor_low = self._hsl_to_hex(base_hue, 0.3, 0.3)
            roads_path = self._hsl_to_hex(0.6, 0.75, 0.55)
            roads_outline = self._hsl_to_hex(0.1, 0.1, 0.1)

        elif mood == 'light':
            land = self._hsl_to_hex(base_hue, 0.2, 0.85)
            landcover = self._hsl_to_hex(base_hue, 0.15, 0.8)
            water = self._hsl_to_hex(0.6, 0.5, 0.7)
            waterway = self._hsl_to_hex(0.6, 0.45, 0.6)
            parks = self._hsl_to_hex(0.3, 0.4, 0.75)
            buildings = self._hsl_to_hex(base_hue, 0.15, 0.7)
            aeroway = self._hsl_to_hex(base_hue, 0.1, 0.65)
            rail = self._hsl_to_hex(base_hue, 0.2, 0.6)
            roads_major = self._hsl_to_hex(0.1, 0.2, 0.3)
            roads_minor_high = self._hsl_to_hex(0.1, 0.15, 0.35)
            roads_minor_mid = self._hsl_to_hex(0.1, 0.1, 0.4)
            roads_minor_low = self._hsl_to_hex(base_hue, 0.05, 0.45)
            roads_path = self._hsl_to_hex(0.1, 0.15, 0.4)
            roads_outline = self._hsl_to_hex(0.05, 0.05, 0.3)

        elif mood == 'vibrant':
            land = self._hsl_to_hex(base_hue, 0.7, 0.5)
            landcover = self._hsl_to_hex(base_hue, 0.65, 0.45)
            water = self._hsl_to_hex(0.6, 0.8, 0.5)
            waterway = self._hsl_to_hex(0.6, 0.75, 0.55)
            parks = self._hsl_to_hex(0.3, 0.8, 0.5)
            buildings = self._hsl_to_hex(base_hue, 0.75, 0.45)
            aeroway = self._hsl_to_hex(base_hue, 0.7, 0.4)
            rail = self._hsl_to_hex(base_hue, 0.8, 0.5)
            roads_major = self._hsl_to_hex((base_hue + 0.5) % 1.0, 0.9, 0.5)
            roads_minor_high = self._hsl_to_hex((base_hue + 0.5) % 1.0, 0.85, 0.45)
            roads_minor_mid = self._hsl_to_hex((base_hue + 0.5) % 1.0, 0.8, 0.4)
            roads_minor_low = self._hsl_to_hex(base_hue, 0.6, 0.5)
            roads_path = self._hsl_to_hex(base_hue, 0.7, 0.55)
            roads_outline = self._hsl_to_hex(0.1, 0.1, 0.2)

        elif mood == 'warm':
            land = self._hsl_to_hex(0.08, 0.5, 0.5)
            landcover = self._hsl_to_hex(0.1, 0.45, 0.45)
            water = self._hsl_to_hex(0.6, 0.4, 0.5)
            waterway = self._hsl_to_hex(0.6, 0.35, 0.55)
            parks = self._hsl_to_hex(0.3, 0.5, 0.45)
            buildings = self._hsl_to_hex(0.05, 0.4, 0.4)
            aeroway = self._hsl_to_hex(0.1, 0.35, 0.35)
            rail = self._hsl_to_hex(0.08, 0.45, 0.4)
            roads_major = self._hsl_to_hex(0.08, 0.8, 0.6)
            roads_minor_high = self._hsl_to_hex(0.08, 0.75, 0.5)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.7, 0.4)
            roads_minor_low = self._hsl_to_hex(0.08, 0.5, 0.45)
            roads_path = self._hsl_to_hex(0.08, 0.7, 0.55)
            roads_outline = self._hsl_to_hex(0.05, 0.3, 0.3)

        elif mood == 'cool':
            land = self._hsl_to_hex(0.6, 0.3, 0.5)
            landcover = self._hsl_to_hex(0.6, 0.25, 0.45)
            water = self._hsl_to_hex(0.6, 0.6, 0.5)
            waterway = self._hsl_to_hex(0.6, 0.55, 0.55)
            parks = self._hsl_to_hex(0.3, 0.5, 0.45)
            buildings = self._hsl_to_hex(0.6, 0.2, 0.4)
            aeroway = self._hsl_to_hex(0.6, 0.15, 0.35)
            rail = self._hsl_to_hex(0.6, 0.25, 0.45)
            roads_major = self._hsl_to_hex(0.5, 0.7, 0.6)
            roads_minor_high = self._hsl_to_hex(0.5, 0.65, 0.5)
            roads_minor_mid = self._hsl_to_hex(0.5, 0.6, 0.4)
            roads_minor_low = self._hsl_to_hex(0.6, 0.4, 0.45)
            roads_path = self._hsl_to_hex(0.5, 0.65, 0.55)
            roads_outline = self._hsl_to_hex(0.5, 0.2, 0.3)

        elif mood == 'nature':
            land = self._hsl_to_hex(0.3, 0.4, 0.5)
            landcover = self._hsl_to_hex(0.3, 0.35, 0.45)
            water = self._hsl_to_hex(0.6, 0.5, 0.5)
            waterway = self._hsl_to_hex(0.6, 0.45, 0.55)
            parks = self._hsl_to_hex(0.3, 0.6, 0.5)
            buildings = self._hsl_to_hex(0.08, 0.35, 0.4)
            aeroway = self._hsl_to_hex(0.3, 0.3, 0.35)
            rail = self._hsl_to_hex(0.08, 0.3, 0.45)
            roads_major = self._hsl_to_hex(0.08, 0.6, 0.5)
            roads_minor_high = self._hsl_to_hex(0.08, 0.55, 0.45)
            roads_minor_mid = self._hsl_to_hex(0.08, 0.5, 0.4)
            roads_minor_low = self._hsl_to_hex(0.3, 0.4, 0.45)
            roads_path = self._hsl_to_hex(0.3, 0.5, 0.55)
            roads_outline = self._hsl_to_hex(0.08, 0.2, 0.3)

        else:  # neutral, muted
            land = self._hsl_to_hex(base_hue, 0.2, 0.6)
            landcover = self._hsl_to_hex(base_hue, 0.15, 0.55)
            water = self._hsl_to_hex(0.6, 0.4, 0.6)
            waterway = self._hsl_to_hex(0.6, 0.35, 0.55)
            parks = self._hsl_to_hex(0.3, 0.3, 0.55)
            buildings = self._hsl_to_hex(base_hue, 0.15, 0.5)
            aeroway = self._hsl_to_hex(base_hue, 0.1, 0.45)
            rail = self._hsl_to_hex(base_hue, 0.2, 0.55)
            roads_major = self._hsl_to_hex(0.1, 0.3, 0.35)
            roads_minor_high = self._hsl_to_hex(0.1, 0.25, 0.4)
            roads_minor_mid = self._hsl_to_hex(0.1, 0.2, 0.45)
            roads_minor_low = self._hsl_to_hex(base_hue, 0.15, 0.5)
            roads_path = self._hsl_to_hex(base_hue, 0.2, 0.55)
            roads_outline = self._hsl_to_hex(0.05, 0.1, 0.3)

        # If we have color suggestions, tint the palette
        if suggestion_rgbs:
            primary_hue = self._rgb_to_hsl(suggestion_rgbs[0])[0]
            land = self._hsl_to_hex(primary_hue, 0.3, 0.6)
            parks = self._hsl_to_hex(primary_hue, 0.4, 0.55)
            if len(suggestion_rgbs) > 1:
                second_hue = self._rgb_to_hsl(suggestion_rgbs[1])[0]
                if 0.4 <= second_hue <= 0.8:
                    water = self._hsl_to_hex(second_hue, 0.5, 0.6)
                    waterway = self._hsl_to_hex(second_hue, 0.45, 0.55)
                else:
                    buildings = self._hsl_to_hex(second_hue, 0.3, 0.5)
                    rail = self._hsl_to_hex(second_hue, 0.25, 0.55)

        return {
            'land': land,
            'landcover': landcover,
            'water': water,
            'waterway': waterway,
            'parks': parks,
            'buildings': buildings,
            'aeroway': aeroway,
            'rail': rail,
            'roads': {
                'major': roads_major,
                'minor_high': roads_minor_high,
                'minor_mid': roads_minor_mid,
                'minor_low': roads_minor_low,
                'path': roads_path,
                'outline': roads_outline
            }
        }

    def _rgb_to_hsl(self, rgb: List[int]) -> tuple:
        """Convert RGB to HSL"""
        r, g, b = [x / 255.0 for x in rgb]
        max_c = max(r, g, b)
        min_c = min(r, g, b)
        delta = max_c - min_c

        h = 0
        if delta != 0:
            if max_c == r:
                h = ((g - b) / delta) % 6
            elif max_c == g:
                h = ((b - r) / delta) + 2
            else:
                h = ((r - g) / delta) + 4
            h /= 6

        l = (max_c + min_c) / 2
        s = 0 if delta == 0 else delta / (1 - abs(2 * l - 1))

        return (h, s, l)

    async def _generate_palette_from_api(self, color_suggestions: List[str]) -> Optional[List[str]]:
        """Generate color palette using Colormind API with improved color accuracy"""
        try:
            import httpx

            # Colormind API endpoint
            url = "http://colormind.io/api/"

            # Prepare request body
            body = {"model": "default"}

            if color_suggestions:
                # Enhanced color-to-RGB mapping with better color psychology
                color_rgb_map = {
                    'red': [220, 38, 38],      # Professional red
                    'blue': [37, 99, 235],     # Bright blue
                    'green': [34, 197, 94],    # Fresh green
                    'yellow': [234, 179, 8],  # Warm yellow
                    'orange': [249, 115, 22],  # Vibrant orange
                    'purple': [168, 85, 247],  # Rich purple
                    'pink': [236, 72, 153],    # Hot pink
                    'brown': [120, 53, 15],    # Earth brown
                    'black': [0, 0, 0],        # Pure black
                    'white': [255, 255, 255],  # Pure white
                    'gray': [107, 114, 128],   # Neutral gray
                    'cyan': [6, 182, 212],     # Bright cyan
                    'magenta': [236, 72, 153], # Magenta
                    'teal': [20, 184, 166],    # Teal
                    'navy': [15, 23, 42],      # Navy blue
                    'gold': [251, 191, 36],    # Gold
                    'silver': [209, 213, 219], # Silver
                    'beige': [251, 246, 228],  # Beige
                    'coral': [251, 146, 60],   # Coral
                    'indigo': [99, 102, 241], # Indigo
                    'violet': [139, 92, 246], # Violet
                    'lime': [132, 204, 22],   # Lime
                    'olive': [161, 98, 7],    # Olive
                    'maroon': [185, 28, 28],   # Maroon
                    'crimson': [220, 38, 38], # Crimson
                    'turquoise': [6, 182, 212], # Turquoise
                    'azure': [14, 165, 233],   # Azure
                    'emerald': [16, 185, 129], # Emerald
                    'ruby': [224, 17, 95],    # Ruby
                    'sapphire': [15, 82, 186], # Sapphire
                    'amber': [245, 158, 11],  # Amber
                    'rose': [244, 63, 94],    # Rose
                    'lavender': [167, 139, 250], # Lavender
                    'peach': [255, 159, 64],  # Peach
                    'mint': [52, 211, 153],   # Mint
                    'lemon': [250, 204, 21],  # Lemon
                    'cherry': [216, 27, 96],   # Cherry
                    'chocolate': [185, 28, 28], # Chocolate
                    'coffee': [141, 110, 99], # Coffee
                    'sugar': [253, 224, 71],  # Sugar
                    'coal': [15, 23, 42],      # Coal
                    'smoke': [75, 85, 99],     # Smoke
                    'cloud': [226, 232, 240],  # Cloud
                    'night': [15, 23, 42],     # Night
                    'day': [253, 224, 71],    # Day
                    'sun': [251, 191, 36],    # Sun
                    'moon': [226, 232, 240],  # Moon
                    'star': [251, 191, 36],    # Star
                    'fire': [239, 68, 68],    # Fire
                    'ice': [6, 182, 212],     # Ice
                    'forest': [34, 197, 94],  # Forest
                    'earth': [120, 53, 15],   # Earth
                    'dirt': [120, 53, 15],    # Dirt
                    'grass': [34, 197, 94],   # Grass
                    'sand': [251, 246, 228],  # Sand
                    'ocean': [37, 99, 235],   # Ocean
                    'sky': [14, 165, 233],    # Sky
                }

                # Convert color suggestions to RGB
                input_colors = []
                for color in color_suggestions[:3]:  # Limit to 3
                    if color in color_rgb_map:
                        input_colors.append(color_rgb_map[color])

                if input_colors:
                    body["input"] = input_colors

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, json=body)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('result'):
                        # Convert RGB to hex
                        palette = []
                        for rgb in data['result']:
                            hex_color = '#{:02x}{:02x}{:02x}'.format(*rgb)
                            palette.append(hex_color)
                        return palette
                else:
                    print(f"Colormind API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Error calling Colormind API: {str(e)}")

        return None

    def _convert_api_palette_to_theme(self, palette: List[str], mood_analysis: Dict) -> Dict:
        """Convert API palette to map theme structure with improved color theory"""
        # Ensure we have at least 5 colors
        while len(palette) < 5:
            palette.append(self._adjust_color(palette[-1], random.uniform(-0.1, 0.1)))

        # Analyze the palette for color properties
        hsl_palette = [self._hex_to_hsl(color) for color in palette[:5]]

        # Sort by lightness to assign intelligently
        by_lightness = sorted(enumerate(hsl_palette), key=lambda x: x[1][2])

        # Color psychology-based assignment
        mood = mood_analysis['mood']

        if mood == 'dark':
            # Dark theme: darkest for land, lightest for water/roads
            land_idx = by_lightness[0][0]  # Darkest
            water_idx = by_lightness[2][0]  # Mid
            parks_idx = by_lightness[1][0]  # Second darkest
            buildings_idx = by_lightness[0][0]  # Darkest
            roads_idx = by_lightness[4][0]  # Lightest
        elif mood == 'light':
            # Light theme: lightest for land, darkest for roads
            land_idx = by_lightness[4][0]  # Lightest
            water_idx = by_lightness[0][0]  # Darkest
            parks_idx = by_lightness[3][0]  # Second lightest
            buildings_idx = by_lightness[2][0]  # Mid
            roads_idx = by_lightness[0][0]  # Darkest
        elif mood == 'vibrant':
            # Vibrant: Use most saturated colors
            by_saturation = sorted(enumerate(hsl_palette), key=lambda x: x[1][1], reverse=True)
            land_idx = by_saturation[2][0]
            water_idx = by_saturation[0][0]
            parks_idx = by_saturation[1][0]
            buildings_idx = by_saturation[3][0]
            roads_idx = by_saturation[4][0]
        elif mood == 'muted':
            # Muted: Use least saturated colors
            by_saturation = sorted(enumerate(hsl_palette), key=lambda x: x[1][1])
            land_idx = by_saturation[1][0]
            water_idx = by_saturation[2][0]
            parks_idx = by_saturation[0][0]
            buildings_idx = by_saturation[3][0]
            roads_idx = by_saturation[4][0]
        elif mood == 'warm':
            # Warm: Prefer colors with hue in warm range (0-0.16, 0.8-1.0)
            warm_indices = [i for i, (h, s, l) in enumerate(hsl_palette) if (h < 0.16 or h > 0.8)]
            if len(warm_indices) >= 3:
                land_idx = warm_indices[0]
                water_idx = warm_indices[1]
                parks_idx = warm_indices[2]
                buildings_idx = warm_indices[0]
                roads_idx = warm_indices[1] if len(warm_indices) > 1 else 0
            else:
                land_idx, water_idx, parks_idx, buildings_idx, roads_idx = 0, 1, 2, 3, 4
        elif mood == 'cool':
            # Cool: Prefer colors with hue in cool range (0.4-0.8)
            cool_indices = [i for i, (h, s, l) in enumerate(hsl_palette) if 0.4 <= h <= 0.8]
            if len(cool_indices) >= 3:
                land_idx = cool_indices[0]
                water_idx = cool_indices[1]
                parks_idx = cool_indices[2]
                buildings_idx = cool_indices[0]
                roads_idx = cool_indices[1] if len(cool_indices) > 1 else 0
            else:
                land_idx, water_idx, parks_idx, buildings_idx, roads_idx = 0, 1, 2, 3, 4
        elif mood == 'nature':
            # Nature: Prefer greens and earth tones
            nature_indices = [i for i, (h, s, l) in enumerate(hsl_palette) if 0.25 <= h <= 0.45]
            if len(nature_indices) >= 2:
                land_idx = nature_indices[0]
                parks_idx = nature_indices[1]
                water_idx = 1 if 1 not in nature_indices else nature_indices[0]
                buildings_idx = 3
                roads_idx = 4
            else:
                land_idx, water_idx, parks_idx, buildings_idx, roads_idx = 0, 1, 2, 3, 4
        else:
            # Neutral: Balanced assignment
            land_idx, water_idx, parks_idx, buildings_idx, roads_idx = 0, 1, 2, 3, 4

        # Ensure good contrast for roads against land
        land_hsl = hsl_palette[land_idx]
        roads_hsl = hsl_palette[roads_idx]
        # If roads are too similar to land in lightness, adjust
        if abs(land_hsl[2] - roads_hsl[2]) < 0.3:
            if land_hsl[2] > 0.5:
                # Make roads darker
                h, s, l = roads_hsl
                roads_idx = 4  # Use the darkest color for roads
            else:
                # Make roads lighter
                h, s, l = roads_hsl
                roads_idx = 4 if hsl_palette[4][2] > land_hsl[2] + 0.3 else 0

        return {
            'land': palette[land_idx],
            'landcover': self._adjust_color(palette[land_idx], -0.05),
            'water': palette[water_idx],
            'waterway': self._adjust_color(palette[water_idx], 0.05),
            'parks': palette[parks_idx],
            'buildings': palette[buildings_idx],
            'aeroway': self._adjust_color(palette[land_idx], -0.08),
            'rail': self._adjust_color(palette[buildings_idx], 0.1),
            'roads': {
                'major': palette[roads_idx],
                'minor_high': self._adjust_color(palette[roads_idx], -0.1),
                'minor_mid': self._adjust_color(palette[roads_idx], -0.2),
                'minor_low': self._adjust_color(palette[land_idx], 0.1),
                'path': self._adjust_color(palette[land_idx], 0.15),
                'outline': self._adjust_color(palette[land_idx], -0.15)
            }
        }

    def _generate_theme_name_from_prompt(self, prompt: str) -> str:
        """Generate a theme name from the prompt"""
        words = prompt.split()
        if len(words) >= 2:
            return f"{words[0].capitalize()} {words[1].capitalize()} Theme"
        elif len(words) == 1:
            return f"{words[0].capitalize()} Theme"
        else:
            return "Custom Theme"

    def _generate_base_colors(self, mood: str, harmony: str) -> List[str]:
        """Generate base colors using color harmony rules"""
        mood_config = self.mood_colors.get(mood, self.mood_colors['neutral'])
        
        # Generate base hue with some variation
        base_hue = mood_config['base_hue'] + random.uniform(-0.1, 0.1)
        base_hue = base_hue % 1.0  # Keep in valid range
        
        # Use harmony rule to generate color set
        harmony_func = self.harmony_rules.get(harmony, self._generate_complementary)
        base_colors = harmony_func(base_hue, mood_config['saturation'], mood_config['lightness'])
        
        return base_colors
    
    def _generate_complementary(self, hue: float, saturation: float, lightness: float) -> List[str]:
        """Generate complementary color scheme"""
        color1 = self._hsl_to_hex(hue, saturation, lightness)
        color2 = self._hsl_to_hex((hue + 0.5) % 1.0, saturation, lightness)
        color3 = self._hsl_to_hex(hue, saturation * 0.7, lightness * 0.8)
        return [color1, color2, color3]
    
    def _generate_analogous(self, hue: float, saturation: float, lightness: float) -> List[str]:
        """Generate analogous color scheme"""
        color1 = self._hsl_to_hex(hue, saturation, lightness)
        color2 = self._hsl_to_hex((hue + 0.08) % 1.0, saturation, lightness)
        color3 = self._hsl_to_hex((hue - 0.08) % 1.0, saturation, lightness)
        return [color1, color2, color3]
    
    def _generate_triadic(self, hue: float, saturation: float, lightness: float) -> List[str]:
        """Generate triadic color scheme"""
        color1 = self._hsl_to_hex(hue, saturation, lightness)
        color2 = self._hsl_to_hex((hue + 0.33) % 1.0, saturation, lightness)
        color3 = self._hsl_to_hex((hue + 0.66) % 1.0, saturation, lightness)
        return [color1, color2, color3]
    
    def _generate_monochromatic(self, hue: float, saturation: float, lightness: float) -> List[str]:
        """Generate monochromatic color scheme"""
        color1 = self._hsl_to_hex(hue, saturation, lightness)
        color2 = self._hsl_to_hex(hue, saturation, lightness * 0.7)
        color3 = self._hsl_to_hex(hue, saturation, lightness * 1.3)
        return [color1, color2, color3]
    
    def _generate_split_complementary(self, hue: float, saturation: float, lightness: float) -> List[str]:
        """Generate split complementary color scheme"""
        color1 = self._hsl_to_hex(hue, saturation, lightness)
        color2 = self._hsl_to_hex((hue + 0.42) % 1.0, saturation, lightness)
        color3 = self._hsl_to_hex((hue + 0.58) % 1.0, saturation, lightness)
        return [color1, color2, color3]
    
    def _apply_variations_to_palette(self, base_palette: Dict, mood_analysis: Dict) -> Dict:
        """Apply slight variations to a curated palette for uniqueness"""
        palette = {}
        lightness_adjust = random.uniform(-0.05, 0.05)
        saturation_adjust = random.uniform(-0.05, 0.05)

        # Apply variations to flat colors
        for key, value in base_palette.items():
            if key != 'roads' and isinstance(value, str):
                palette[key] = self._adjust_color_with_both(value, lightness_adjust, saturation_adjust)

        # Apply variations to nested road colors
        if 'roads' in base_palette:
            palette['roads'] = {}
            for road_key, road_value in base_palette['roads'].items():
                palette['roads'][road_key] = self._adjust_color_with_both(
                    road_value,
                    lightness_adjust * 0.5,  # Less variation for roads
                    saturation_adjust * 0.5
                )

        return palette

    def _adjust_color_with_both(self, hex_color: str, lightness_adjust: float, saturation_adjust: float) -> str:
        """Adjust both lightness and saturation of a hex color"""
        h, s, l = self._hex_to_hsl(hex_color)
        l = max(0, min(1, l + lightness_adjust))
        s = max(0, min(1, s + saturation_adjust))
        return self._hsl_to_hex(h, s, l)

    def _generate_palette_from_base(self, base_colors: List[str], mood_analysis: Dict) -> Dict:
        """Generate complete map palette from base colors"""
        # Assign base colors to key palette elements
        land_color = base_colors[0]
        water_color = base_colors[1] if len(base_colors) > 1 else self._adjust_color(base_colors[0], -0.1)
        accent_color = base_colors[2] if len(base_colors) > 2 else self._adjust_color(base_colors[0], 0.1)
        
        # Generate related colors for other elements
        palette = {
            'land': land_color,
            'landcover': self._adjust_color(land_color, -0.05),
            'water': water_color,
            'waterway': self._adjust_color(water_color, 0.05),
            'parks': self._adjust_color(land_color, 0.08),
            'buildings': self._adjust_color(accent_color, -0.1),
            'aeroway': self._adjust_color(land_color, -0.08),
            'rail': self._adjust_color(accent_color, 0.15),
            'roads': {
                'major': accent_color,
                'minor_high': self._adjust_color(accent_color, -0.1),
                'minor_mid': self._adjust_color(accent_color, -0.2),
                'minor_low': self._adjust_color(land_color, 0.1),
                'path': self._adjust_color(land_color, 0.15),
                'outline': self._adjust_color(land_color, -0.15)
            }
        }
        
        return palette
    
    def _adjust_color(self, hex_color: str, lightness_adjustment: float) -> str:
        """Adjust a color's lightness"""
        h, s, l = self._hex_to_hsl(hex_color)
        new_l = max(0.1, min(0.9, l + lightness_adjustment))
        return self._hsl_to_hex(h, s, new_l)
    
    def _hsl_to_hex(self, h: float, s: float, l: float) -> str:
        """Convert HSL to HEX color"""
        r, g, b = colorsys.hls_to_rgb(h, l, s)
        return '#{:02x}{:02x}{:02x}'.format(
            int(r * 255),
            int(g * 255),
            int(b * 255)
        )
    
    def _hex_to_hsl(self, hex_color: str) -> tuple:
        """Convert HEX color to HSL"""
        hex_color = hex_color.lstrip('#')
        r, g, b = tuple(int(hex_color[i:i+2], 16) / 255.0 for i in (0, 2, 4))
        h, l, s = colorsys.rgb_to_hls(r, g, b)
        return h, s, l
    
    def _generate_theme_metadata(self, prompt: str, mood_analysis: Dict) -> Dict:
        """Generate theme name and description"""
        mood = mood_analysis['mood']
        style_keywords = mood_analysis['style_keywords']
        
        # Generate creative name
        name_templates = [
            f"{mood.capitalize()} {random.choice(['Dream', 'Vision', 'Essence', 'Horizon'])}",
            f"{random.choice(['Modern', 'Classic', 'Elegant', 'Bold'])} {mood.capitalize()}",
            f"{mood.capitalize()} {random.choice(['Collection', 'Series', 'Palette'])}"
        ]
        name = random.choice(name_templates)
        
        # Generate description
        description = f"A {mood} theme with {', '.join(style_keywords[:3]) if style_keywords else 'minimal'} influences. "
        description += f"Generated from the prompt: '{prompt}'"
        
        return {
            'name': name,
            'description': description
        }

# Singleton instance
theme_service = ThemeService()