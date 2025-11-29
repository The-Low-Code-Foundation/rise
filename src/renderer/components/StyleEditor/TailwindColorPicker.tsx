/**
 * @file TailwindColorPicker.tsx
 * @description Visual color picker using Tailwind CSS color palette
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Uses standard Tailwind palette with visual swatches
 * 
 * PROBLEM SOLVED:
 * Users need to select colors without knowing Tailwind class names.
 * A visual color picker with the Tailwind palette makes it intuitive.
 * 
 * SOLUTION:
 * - Grid of color palettes (gray, red, orange, etc.)
 * - Each palette shows all shades (50-900)
 * - Color preview swatch shows selected color
 * - Special colors (white, black, transparent) available
 * - Clear button to remove color
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Background Color   [████] blue-500       [Clear]   │
 * ├─────────────────────────────────────────────────────┤
 * │ ┌────────────────────────────────────────────────┐ │
 * │ │ gray   ○○○○○○○○○○○                              │ │
 * │ │ red    ○○○○○○○○○○○                              │ │
 * │ │ blue   ○○○○○●○○○○○  ← selected                  │ │
 * │ │ green  ○○○○○○○○○○○                              │ │
 * │ │ ...                                             │ │
 * │ └────────────────────────────────────────────────┘ │
 * │                                                     │
 * │ [white] [black] [transparent]                       │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback, useMemo } from 'react';
import { XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { 
  COLOR_PALETTE, 
  COLOR_SHADES, 
  SPECIAL_COLORS,
  getColorHex,
  type ColorPalette,
  type ColorShade,
} from '../../utils/tailwindMappings';
import type { ColorPickerProps, ColorType } from './types';

/**
 * Get display name for color type
 */
function getColorTypeLabel(type: ColorType): string {
  switch (type) {
    case 'backgroundColor': return 'Background';
    case 'textColor': return 'Text Color';
    case 'borderColor': return 'Border Color';
    default: return 'Color';
  }
}

/**
 * Parse color value into components
 */
function parseColor(value: string | undefined): {
  colorName: string | null;
  shade: string | null;
  isSpecial: boolean;
} {
  if (!value) {
    return { colorName: null, shade: null, isSpecial: false };
  }

  // Check special colors
  if (SPECIAL_COLORS.some((c) => c.name === value)) {
    return { colorName: value, shade: null, isSpecial: true };
  }

  // Parse color-shade format
  const match = value.match(/^([a-z]+)-(\d+)$/);
  if (match) {
    return { colorName: match[1], shade: match[2], isSpecial: false };
  }

  return { colorName: null, shade: null, isSpecial: false };
}

/**
 * Color swatch button
 */
interface SwatchButtonProps {
  hex: string;
  isSelected: boolean;
  onClick: () => void;
  title: string;
  size?: 'sm' | 'md';
}

function SwatchButton({
  hex,
  isSelected,
  onClick,
  title,
  size = 'sm',
}: SwatchButtonProps): React.ReactElement {
  const sizeClasses = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${sizeClasses} rounded-sm border transition-transform hover:scale-110
                 ${isSelected 
                   ? 'ring-2 ring-blue-500 ring-offset-1' 
                   : 'ring-0'}
                 ${hex === 'transparent' 
                   ? 'bg-checkered border-gray-300' 
                   : 'border-gray-300'}`}
      style={{ 
        backgroundColor: hex === 'transparent' ? undefined : hex,
        backgroundImage: hex === 'transparent' 
          ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
          : undefined,
        backgroundSize: hex === 'transparent' ? '8px 8px' : undefined,
        backgroundPosition: hex === 'transparent' ? '0 0, 0 4px, 4px -4px, -4px 0px' : undefined,
      }}
      aria-label={title}
    />
  );
}

/**
 * Color row showing one color family with all shades
 */
interface ColorRowProps {
  palette: ColorPalette;
  selectedShade: string | null;
  onSelect: (shade: ColorShade) => void;
}

function ColorRow({
  palette,
  selectedShade,
  onSelect,
}: ColorRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1 py-0.5">
      {/* Color name label */}
      <span className="w-14 text-[10px] text-gray-500 font-medium truncate">
        {palette.label}
      </span>
      
      {/* Shade swatches */}
      <div className="flex gap-0.5">
        {COLOR_SHADES.map((shade) => (
          <SwatchButton
            key={shade}
            hex={palette.shades[shade]}
            isSelected={selectedShade === shade}
            onClick={() => onSelect(shade)}
            title={`${palette.name}-${shade}`}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Special colors row (white, black, transparent)
 */
interface SpecialColorsRowProps {
  selectedColor: string | null;
  onSelect: (color: string) => void;
}

function SpecialColorsRow({
  selectedColor,
  onSelect,
}: SpecialColorsRowProps): React.ReactElement {
  return (
    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
      <span className="text-[10px] text-gray-500 font-medium">Special:</span>
      <div className="flex gap-1">
        {SPECIAL_COLORS.map((color) => (
          <SwatchButton
            key={color.name}
            hex={color.hex}
            isSelected={selectedColor === color.name}
            onClick={() => onSelect(color.name)}
            title={color.label}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Color preview showing current selection
 */
interface ColorPreviewProps {
  value: string | undefined;
  label: string;
  onClear: () => void;
}

function ColorPreview({
  value,
  label,
  onClear,
}: ColorPreviewProps): React.ReactElement {
  const hex = value ? getColorHex(value) : null;
  
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        
        {/* Color swatch */}
        <div 
          className="w-6 h-6 rounded border border-gray-300"
          style={{ 
            backgroundColor: hex || '#ffffff',
            backgroundImage: !hex 
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
              : undefined,
            backgroundSize: !hex ? '8px 8px' : undefined,
          }}
          title={value || 'No color'}
        />
        
        {/* Color name */}
        {value && (
          <span className="text-xs text-gray-500 font-mono">{value}</span>
        )}
      </div>
      
      {/* Clear button */}
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded
                     transition-colors"
          title="Clear color"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * TailwindColorPicker Component
 * 
 * Visual color picker using Tailwind CSS palette.
 * Shows color swatches organized by color family and shade.
 * 
 * @param props - ColorPicker props
 * @returns Color picker element
 * 
 * @example
 * ```tsx
 * <TailwindColorPicker
 *   type="backgroundColor"
 *   value="blue-500"
 *   onChange={(color) => updateStyles(color)}
 *   label="Background"
 * />
 * ```
 */
export function TailwindColorPicker({
  type,
  value,
  onChange,
  disabled = false,
  label,
}: ColorPickerProps): React.ReactElement {
  // State for expanded/collapsed palette
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Parse current value
  const { colorName, shade, isSpecial } = useMemo(
    () => parseColor(value),
    [value]
  );

  // Get display label
  const displayLabel = label || getColorTypeLabel(type);

  /**
   * Handle color selection from palette
   */
  const handleColorSelect = useCallback((paletteName: string, selectedShade: ColorShade) => {
    onChange(`${paletteName}-${selectedShade}`);
  }, [onChange]);

  /**
   * Handle special color selection
   */
  const handleSpecialSelect = useCallback((colorName: string) => {
    onChange(colorName);
  }, [onChange]);

  /**
   * Handle clear
   */
  const handleClear = useCallback(() => {
    onChange(undefined);
  }, [onChange]);

  return (
    <div className="space-y-2">
      {/* Preview row */}
      <ColorPreview
        value={value}
        label={displayLabel}
        onClear={handleClear}
      />

      {/* Expand/collapse toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExpanded ? (
          <>
            <ChevronUpIcon className="w-3 h-3" />
            <span>Hide palette</span>
          </>
        ) : (
          <>
            <ChevronDownIcon className="w-3 h-3" />
            <span>Show palette</span>
          </>
        )}
      </button>

      {/* Color palette (when expanded) */}
      {isExpanded && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
          {/* Main color palettes */}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {COLOR_PALETTE.map((palette) => (
              <ColorRow
                key={palette.name}
                palette={palette}
                selectedShade={
                  colorName === palette.name && shade ? shade : null
                }
                onSelect={(s) => handleColorSelect(palette.name, s)}
              />
            ))}
          </div>

          {/* Special colors */}
          <SpecialColorsRow
            selectedColor={isSpecial ? colorName : null}
            onSelect={handleSpecialSelect}
          />
        </div>
      )}

      {/* Quick shade selector (when a color is selected) */}
      {!isExpanded && colorName && !isSpecial && (
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-gray-500">Shade:</span>
          <div className="flex gap-0.5">
            {COLOR_SHADES.map((s) => {
              const palette = COLOR_PALETTE.find((p) => p.name === colorName);
              if (!palette) return null;
              
              return (
                <SwatchButton
                  key={s}
                  hex={palette.shades[s]}
                  isSelected={shade === s}
                  onClick={() => handleColorSelect(colorName, s)}
                  title={`${colorName}-${s}`}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TailwindColorPicker;
