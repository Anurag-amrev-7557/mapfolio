import React, { useState } from 'react';
import { MAP_THEMES, getTheme } from '../constants/themes';
import { useMapStore } from '../store/useMapStore';
import type { ColorOverrideKeys } from '../store/useMapStore';
import { Palette, RotateCcw, Check, Plus, Trash2, Sparkles } from 'lucide-react';
import { getUIThemeColors } from '../utils/themeColors';

export const ThemeSelector: React.FC = () => {
  const {
    themeId,
    setTheme,
    colorOverrides,
    setColorOverride,
    resetColorOverrides,
    customThemes,
    saveCustomTheme,
    deleteCustomTheme,
  } = useMapStore();

  const [showColorEditor, setShowColorEditor] = useState(false);
  const [newThemeName, setNewThemeName] = useState('');

  const activeTheme = getTheme(themeId, customThemes);
  const { palette } = activeTheme;

  const uiColors = getUIThemeColors(themeId, colorOverrides, customThemes);
  const cardBg = uiColors.cardBg;
  const borderColor = uiColors.borderColor;
  const headingColor = uiColors.headingColor;
  const textColor = uiColors.textColor;
  const brightAccent = uiColors.brightAccent;
  const dangerText = uiColors.dangerText;

  const colorItems: { key: ColorOverrideKeys; label: string; defaultColor: string }[] = [
    { key: 'land', label: 'Land', defaultColor: palette.land },
    { key: 'landcover', label: 'Landcover', defaultColor: palette.landcover },
    { key: 'water', label: 'Water', defaultColor: palette.water },
    { key: 'waterway', label: 'Waterways', defaultColor: palette.waterway },
    { key: 'parks', label: 'Parks', defaultColor: palette.parks },
    { key: 'buildings', label: 'Buildings', defaultColor: palette.buildings },
    { key: 'aeroway', label: 'Aeroway', defaultColor: palette.aeroway },
    { key: 'rail', label: 'Rail', defaultColor: palette.rail },
    { key: 'roadsMajor', label: 'Roads Major', defaultColor: palette.roads.major },
    { key: 'roadsMinorHigh', label: 'Roads Minor High', defaultColor: palette.roads.minor_high },
    { key: 'roadsMinorMid', label: 'Roads Minor Mid', defaultColor: palette.roads.minor_mid },
    { key: 'roadsMinorLow', label: 'Roads Minor Low', defaultColor: palette.roads.minor_low },
    { key: 'roadsPath', label: 'Roads Path', defaultColor: palette.roads.path },
    { key: 'roadsOutline', label: 'Road Outline', defaultColor: palette.roads.outline },
  ];

  const handleSaveTheme = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newThemeName.trim()) return;
    saveCustomTheme(newThemeName);
    setNewThemeName('');
    setShowColorEditor(false);
  };

  const allThemesList = [...customThemes, ...MAP_THEMES];

  return (
    <div className="flex flex-col gap-0">
      {/* Top Header Bar with Color Editor Toggle */}
      <div className="flex items-center justify-between pb-3 border-b shrink-0" style={{ borderColor: borderColor }}>
        <span className="text-[13px] font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
          THEME PALETTES ({allThemesList.length})
        </span>
        <button
          type="button"
          onClick={() => setShowColorEditor(!showColorEditor)}
          className="w-[96px] h-[32px] flex items-center justify-center gap-1.5 rounded-xl text-xs font-sans font-bold border transition-all duration-200 cursor-pointer shadow-sm shrink-0 hover:scale-105 active:scale-95"
          style={
            showColorEditor
              ? { backgroundColor: brightAccent, color: '#ffffff', borderColor: brightAccent }
              : { backgroundColor: cardBg, borderColor: borderColor, color: textColor }
          }
        >
          <Palette size={14} className="shrink-0" />
          <span className="truncate">{showColorEditor ? 'Close' : 'Custom'}</span>
        </button>
      </div>

      {/* Main Flow Container */}
      <div className="flex flex-col px-0.5 pt-3 pb-4">
        {/* 120 FPS GPU Hardware-Accelerated Accordion Custom Palette Editor */}
        <div 
          className="shrink-0 transform-gpu grid transition-all"
          style={{
            gridTemplateRows: showColorEditor ? '1fr' : '0fr',
            opacity: showColorEditor ? 1 : 0,
            transition: 'grid-template-rows 400ms cubic-bezier(0.16, 1, 0.3, 1), opacity 400ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="overflow-hidden">
            <div className="pb-3 mb-3 border-b flex flex-col gap-3" style={{ borderColor: borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
                CUSTOM PALETTE EDITOR
              </span>
              <button
                type="button"
                onClick={resetColorOverrides}
                className="flex items-center gap-1 text-xs font-sans font-bold hover:underline cursor-pointer"
                style={{ color: dangerText }}
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            </div>

            {/* 14 Color Pickers Grid */}
            <div className="grid grid-cols-4 gap-2.5">
              {colorItems.map((item) => {
                const currentColor = colorOverrides[item.key] || item.defaultColor;
                return (
                  <div
                    key={item.key}
                    className="p-2 rounded-xl border flex flex-col items-center gap-1.5 relative group transition-all"
                    style={{ backgroundColor: cardBg, borderColor: borderColor }}
                  >
                    <label className="w-full h-10 rounded-lg border shadow-inner cursor-pointer relative overflow-hidden block" style={{ borderColor: borderColor }}>
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => setColorOverride(item.key, e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      />
                      <div
                        className="w-full h-full"
                        style={{ backgroundColor: currentColor }}
                      />
                    </label>
                    <span className="text-[11px] font-sans font-bold text-center line-clamp-1 leading-tight" style={{ color: textColor }}>
                      {item.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Save Palette as Custom Theme Bar */}
            <form onSubmit={handleSaveTheme} className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: borderColor }}>
              <input
                type="text"
                placeholder="Name your custom theme..."
                value={newThemeName}
                onChange={(e) => setNewThemeName(e.target.value)}
                className="flex-1 h-9 px-3 border rounded-xl text-xs font-sans font-medium focus:outline-none transition-colors"
                style={{ backgroundColor: cardBg, borderColor: borderColor, color: textColor }}
              />
              <button
                type="submit"
                className="h-9 px-3.5 rounded-xl text-xs font-sans font-extrabold text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105 shrink-0"
                style={{ backgroundColor: brightAccent }}
              >
                <Plus size={14} />
                <span>Save Theme</span>
              </button>
            </form>
          </div>
        </div>
      </div>

        {/* CUSTOM THEMES SECTION */}
        {customThemes.length > 0 && (
          <div className="flex flex-col gap-3 pb-3 mb-3 border-b" style={{ borderColor: borderColor }}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-sans font-black tracking-wider uppercase flex items-center gap-1.5" style={{ color: headingColor }}>
                <Sparkles size={13} style={{ color: brightAccent }} />
                MY CUSTOM THEMES ({customThemes.length})
              </span>
            </div>

            <div className="flex flex-col gap-3">
              {customThemes.map((themeItem) => {
                const isSelected = themeId === themeItem.id;
                const themePal = themeItem.palette;

                return (
                  <div
                    key={themeItem.id}
                    className="relative group w-full"
                  >
                    <button
                      type="button"
                      onClick={() => setTheme(themeItem.id)}
                      className={`w-full h-24 min-h-[96px] shrink-0 rounded-2xl transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                        isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'
                      }`}
                      style={{
                        border: isSelected 
                          ? `1.5px solid ${uiColors.isLight ? '#0f172a' : '#ffffff'}` 
                          : `1px solid ${borderColor}`,
                        boxShadow: isSelected ? `inset 0 0 0 1px ${themePal.roads.major}` : undefined,
                      }}
                    >
                      <div className="w-full h-full flex relative overflow-hidden">
                        <div className="flex-1 h-full" style={{ backgroundColor: themePal.land }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: themePal.landcover }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: themePal.water }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: themePal.roads.major }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: themePal.buildings }} />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end justify-between p-3.5">
                          <span className="text-xs font-sans font-extrabold tracking-wider uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                            {themeItem.name}
                          </span>
                          {isSelected && (
                            <span className="text-[10px] font-sans font-extrabold bg-white text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                              <Check size={11} className="stroke-[3]" />
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {/* Delete Custom Theme Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCustomTheme(themeItem.id);
                      }}
                      title="Delete Custom Theme"
                      className="absolute top-2.5 right-2.5 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PRESET MAP THEMES SECTION */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-sans font-black tracking-wider uppercase" style={{ color: headingColor }}>
              PRESET THEMES ({MAP_THEMES.length})
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {MAP_THEMES.map((themeItem) => {
              const isSelected = themeId === themeItem.id;
              const themePal = themeItem.palette;

              return (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() => setTheme(themeItem.id)}
                  className={`w-full h-24 min-h-[96px] shrink-0 rounded-2xl transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                    isSelected ? 'scale-[1.01]' : 'hover:scale-[1.005]'
                  }`}
                  style={{
                    border: isSelected 
                      ? `1.5px solid ${uiColors.isLight ? '#0f172a' : '#ffffff'}` 
                      : `1px solid ${borderColor}`,
                    boxShadow: isSelected ? `inset 0 0 0 1px ${themePal.roads.major}` : undefined,
                  }}
                >
                  <div className="w-full h-full flex relative overflow-hidden">
                    <div className="flex-1 h-full" style={{ backgroundColor: themePal.land }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: themePal.landcover }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: themePal.water }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: themePal.roads.major }} />
                    <div className="flex-1 h-full" style={{ backgroundColor: themePal.buildings }} />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex items-end justify-between p-3.5">
                      <span className="text-xs font-sans font-extrabold tracking-wider uppercase text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {themeItem.name}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-sans font-extrabold bg-white text-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md flex items-center gap-1">
                          <Check size={11} className="stroke-[3]" />
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
