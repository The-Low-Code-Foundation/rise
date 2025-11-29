/**
 * @file tailwindMappings.ts
 * @description Tailwind CSS class mappings for visual style controls
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Tailwind scale/palette mappings
 * 
 * PROBLEM SOLVED:
 * Visual style controls need to know the valid Tailwind values for:
 * - Spacing (padding/margin): 0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, etc.
 * - Colors: gray, red, orange, yellow, green, blue, etc. with shades 50-900
 * - Typography: text-xs through text-5xl, font weights
 * - Borders: widths, radii
 * - Effects: shadows, opacity
 * 
 * SOLUTION:
 * Export constant objects mapping Tailwind class suffixes to:
 * - Display labels (for UI)
 * - CSS values (for preview)
 * - Class names (for generation)
 * 
 * @security-critical false
 * @performance-critical false - Static data
 */

// ============================================================================
// SPACING SCALE
// ============================================================================

/**
 * Tailwind spacing scale
 * Maps numeric values to Tailwind suffixes and CSS values
 * 
 * Values: 0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 72, 80, 96
 */
export interface SpacingValue {
  /** Tailwind class suffix (e.g., '4' for p-4) */
  suffix: string;
  /** CSS value (e.g., '1rem' or '16px') */
  css: string;
  /** Pixel value for display */
  px: number;
  /** Display label */
  label: string;
}

/**
 * Common spacing values used in UI controls
 * Subset of full Tailwind scale for simplicity
 */
export const SPACING_SCALE: SpacingValue[] = [
  { suffix: '0', css: '0px', px: 0, label: '0' },
  { suffix: 'px', css: '1px', px: 1, label: '1px' },
  { suffix: '0.5', css: '0.125rem', px: 2, label: '2px' },
  { suffix: '1', css: '0.25rem', px: 4, label: '4px' },
  { suffix: '1.5', css: '0.375rem', px: 6, label: '6px' },
  { suffix: '2', css: '0.5rem', px: 8, label: '8px' },
  { suffix: '2.5', css: '0.625rem', px: 10, label: '10px' },
  { suffix: '3', css: '0.75rem', px: 12, label: '12px' },
  { suffix: '3.5', css: '0.875rem', px: 14, label: '14px' },
  { suffix: '4', css: '1rem', px: 16, label: '16px' },
  { suffix: '5', css: '1.25rem', px: 20, label: '20px' },
  { suffix: '6', css: '1.5rem', px: 24, label: '24px' },
  { suffix: '7', css: '1.75rem', px: 28, label: '28px' },
  { suffix: '8', css: '2rem', px: 32, label: '32px' },
  { suffix: '9', css: '2.25rem', px: 36, label: '36px' },
  { suffix: '10', css: '2.5rem', px: 40, label: '40px' },
  { suffix: '11', css: '2.75rem', px: 44, label: '44px' },
  { suffix: '12', css: '3rem', px: 48, label: '48px' },
  { suffix: '14', css: '3.5rem', px: 56, label: '56px' },
  { suffix: '16', css: '4rem', px: 64, label: '64px' },
  { suffix: '20', css: '5rem', px: 80, label: '80px' },
  { suffix: '24', css: '6rem', px: 96, label: '96px' },
];

/**
 * Simplified spacing scale for compact UI
 * Most commonly used values
 */
export const SPACING_SCALE_COMPACT: SpacingValue[] = [
  { suffix: '0', css: '0px', px: 0, label: '0' },
  { suffix: '1', css: '0.25rem', px: 4, label: '4' },
  { suffix: '2', css: '0.5rem', px: 8, label: '8' },
  { suffix: '3', css: '0.75rem', px: 12, label: '12' },
  { suffix: '4', css: '1rem', px: 16, label: '16' },
  { suffix: '5', css: '1.25rem', px: 20, label: '20' },
  { suffix: '6', css: '1.5rem', px: 24, label: '24' },
  { suffix: '8', css: '2rem', px: 32, label: '32' },
  { suffix: '10', css: '2.5rem', px: 40, label: '40' },
  { suffix: '12', css: '3rem', px: 48, label: '48' },
  { suffix: '16', css: '4rem', px: 64, label: '64' },
];

/**
 * Map spacing suffix to SpacingValue
 * Used for parsing existing classes
 */
export const SPACING_BY_SUFFIX: Record<string, SpacingValue> = {};
SPACING_SCALE.forEach((s) => {
  SPACING_BY_SUFFIX[s.suffix] = s;
});

// ============================================================================
// COLOR PALETTE
// ============================================================================

/**
 * Tailwind color shade values
 */
export type ColorShade = '50' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900' | '950';

/**
 * Tailwind color names
 */
export type ColorName = 
  | 'slate' | 'gray' | 'zinc' | 'neutral' | 'stone'
  | 'red' | 'orange' | 'amber' | 'yellow' | 'lime'
  | 'green' | 'emerald' | 'teal' | 'cyan' | 'sky'
  | 'blue' | 'indigo' | 'violet' | 'purple' | 'fuchsia'
  | 'pink' | 'rose'
  | 'white' | 'black' | 'transparent';

/**
 * Color shades available (in order)
 */
export const COLOR_SHADES: ColorShade[] = [
  '50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'
];

/**
 * Color palette with hex values for preview
 * Based on Tailwind CSS default colors
 */
export interface ColorPalette {
  name: ColorName;
  label: string;
  shades: Record<ColorShade, string>;
}

/**
 * Special colors (no shades)
 */
export const SPECIAL_COLORS: Array<{ name: string; label: string; hex: string }> = [
  { name: 'white', label: 'White', hex: '#ffffff' },
  { name: 'black', label: 'Black', hex: '#000000' },
  { name: 'transparent', label: 'Transparent', hex: 'transparent' },
  { name: 'current', label: 'Current Color', hex: 'currentColor' },
];

/**
 * Full Tailwind color palette with hex values
 * Enables color preview in UI without loading Tailwind CSS
 */
export const COLOR_PALETTE: ColorPalette[] = [
  {
    name: 'slate',
    label: 'Slate',
    shades: {
      '50': '#f8fafc', '100': '#f1f5f9', '200': '#e2e8f0', '300': '#cbd5e1',
      '400': '#94a3b8', '500': '#64748b', '600': '#475569', '700': '#334155',
      '800': '#1e293b', '900': '#0f172a', '950': '#020617',
    },
  },
  {
    name: 'gray',
    label: 'Gray',
    shades: {
      '50': '#f9fafb', '100': '#f3f4f6', '200': '#e5e7eb', '300': '#d1d5db',
      '400': '#9ca3af', '500': '#6b7280', '600': '#4b5563', '700': '#374151',
      '800': '#1f2937', '900': '#111827', '950': '#030712',
    },
  },
  {
    name: 'zinc',
    label: 'Zinc',
    shades: {
      '50': '#fafafa', '100': '#f4f4f5', '200': '#e4e4e7', '300': '#d4d4d8',
      '400': '#a1a1aa', '500': '#71717a', '600': '#52525b', '700': '#3f3f46',
      '800': '#27272a', '900': '#18181b', '950': '#09090b',
    },
  },
  {
    name: 'neutral',
    label: 'Neutral',
    shades: {
      '50': '#fafafa', '100': '#f5f5f5', '200': '#e5e5e5', '300': '#d4d4d4',
      '400': '#a3a3a3', '500': '#737373', '600': '#525252', '700': '#404040',
      '800': '#262626', '900': '#171717', '950': '#0a0a0a',
    },
  },
  {
    name: 'stone',
    label: 'Stone',
    shades: {
      '50': '#fafaf9', '100': '#f5f5f4', '200': '#e7e5e4', '300': '#d6d3d1',
      '400': '#a8a29e', '500': '#78716c', '600': '#57534e', '700': '#44403c',
      '800': '#292524', '900': '#1c1917', '950': '#0c0a09',
    },
  },
  {
    name: 'red',
    label: 'Red',
    shades: {
      '50': '#fef2f2', '100': '#fee2e2', '200': '#fecaca', '300': '#fca5a5',
      '400': '#f87171', '500': '#ef4444', '600': '#dc2626', '700': '#b91c1c',
      '800': '#991b1b', '900': '#7f1d1d', '950': '#450a0a',
    },
  },
  {
    name: 'orange',
    label: 'Orange',
    shades: {
      '50': '#fff7ed', '100': '#ffedd5', '200': '#fed7aa', '300': '#fdba74',
      '400': '#fb923c', '500': '#f97316', '600': '#ea580c', '700': '#c2410c',
      '800': '#9a3412', '900': '#7c2d12', '950': '#431407',
    },
  },
  {
    name: 'amber',
    label: 'Amber',
    shades: {
      '50': '#fffbeb', '100': '#fef3c7', '200': '#fde68a', '300': '#fcd34d',
      '400': '#fbbf24', '500': '#f59e0b', '600': '#d97706', '700': '#b45309',
      '800': '#92400e', '900': '#78350f', '950': '#451a03',
    },
  },
  {
    name: 'yellow',
    label: 'Yellow',
    shades: {
      '50': '#fefce8', '100': '#fef9c3', '200': '#fef08a', '300': '#fde047',
      '400': '#facc15', '500': '#eab308', '600': '#ca8a04', '700': '#a16207',
      '800': '#854d0e', '900': '#713f12', '950': '#422006',
    },
  },
  {
    name: 'lime',
    label: 'Lime',
    shades: {
      '50': '#f7fee7', '100': '#ecfccb', '200': '#d9f99d', '300': '#bef264',
      '400': '#a3e635', '500': '#84cc16', '600': '#65a30d', '700': '#4d7c0f',
      '800': '#3f6212', '900': '#365314', '950': '#1a2e05',
    },
  },
  {
    name: 'green',
    label: 'Green',
    shades: {
      '50': '#f0fdf4', '100': '#dcfce7', '200': '#bbf7d0', '300': '#86efac',
      '400': '#4ade80', '500': '#22c55e', '600': '#16a34a', '700': '#15803d',
      '800': '#166534', '900': '#14532d', '950': '#052e16',
    },
  },
  {
    name: 'emerald',
    label: 'Emerald',
    shades: {
      '50': '#ecfdf5', '100': '#d1fae5', '200': '#a7f3d0', '300': '#6ee7b7',
      '400': '#34d399', '500': '#10b981', '600': '#059669', '700': '#047857',
      '800': '#065f46', '900': '#064e3b', '950': '#022c22',
    },
  },
  {
    name: 'teal',
    label: 'Teal',
    shades: {
      '50': '#f0fdfa', '100': '#ccfbf1', '200': '#99f6e4', '300': '#5eead4',
      '400': '#2dd4bf', '500': '#14b8a6', '600': '#0d9488', '700': '#0f766e',
      '800': '#115e59', '900': '#134e4a', '950': '#042f2e',
    },
  },
  {
    name: 'cyan',
    label: 'Cyan',
    shades: {
      '50': '#ecfeff', '100': '#cffafe', '200': '#a5f3fc', '300': '#67e8f9',
      '400': '#22d3ee', '500': '#06b6d4', '600': '#0891b2', '700': '#0e7490',
      '800': '#155e75', '900': '#164e63', '950': '#083344',
    },
  },
  {
    name: 'sky',
    label: 'Sky',
    shades: {
      '50': '#f0f9ff', '100': '#e0f2fe', '200': '#bae6fd', '300': '#7dd3fc',
      '400': '#38bdf8', '500': '#0ea5e9', '600': '#0284c7', '700': '#0369a1',
      '800': '#075985', '900': '#0c4a6e', '950': '#082f49',
    },
  },
  {
    name: 'blue',
    label: 'Blue',
    shades: {
      '50': '#eff6ff', '100': '#dbeafe', '200': '#bfdbfe', '300': '#93c5fd',
      '400': '#60a5fa', '500': '#3b82f6', '600': '#2563eb', '700': '#1d4ed8',
      '800': '#1e40af', '900': '#1e3a8a', '950': '#172554',
    },
  },
  {
    name: 'indigo',
    label: 'Indigo',
    shades: {
      '50': '#eef2ff', '100': '#e0e7ff', '200': '#c7d2fe', '300': '#a5b4fc',
      '400': '#818cf8', '500': '#6366f1', '600': '#4f46e5', '700': '#4338ca',
      '800': '#3730a3', '900': '#312e81', '950': '#1e1b4b',
    },
  },
  {
    name: 'violet',
    label: 'Violet',
    shades: {
      '50': '#f5f3ff', '100': '#ede9fe', '200': '#ddd6fe', '300': '#c4b5fd',
      '400': '#a78bfa', '500': '#8b5cf6', '600': '#7c3aed', '700': '#6d28d9',
      '800': '#5b21b6', '900': '#4c1d95', '950': '#2e1065',
    },
  },
  {
    name: 'purple',
    label: 'Purple',
    shades: {
      '50': '#faf5ff', '100': '#f3e8ff', '200': '#e9d5ff', '300': '#d8b4fe',
      '400': '#c084fc', '500': '#a855f7', '600': '#9333ea', '700': '#7e22ce',
      '800': '#6b21a8', '900': '#581c87', '950': '#3b0764',
    },
  },
  {
    name: 'fuchsia',
    label: 'Fuchsia',
    shades: {
      '50': '#fdf4ff', '100': '#fae8ff', '200': '#f5d0fe', '300': '#f0abfc',
      '400': '#e879f9', '500': '#d946ef', '600': '#c026d3', '700': '#a21caf',
      '800': '#86198f', '900': '#701a75', '950': '#4a044e',
    },
  },
  {
    name: 'pink',
    label: 'Pink',
    shades: {
      '50': '#fdf2f8', '100': '#fce7f3', '200': '#fbcfe8', '300': '#f9a8d4',
      '400': '#f472b6', '500': '#ec4899', '600': '#db2777', '700': '#be185d',
      '800': '#9d174d', '900': '#831843', '950': '#500724',
    },
  },
  {
    name: 'rose',
    label: 'Rose',
    shades: {
      '50': '#fff1f2', '100': '#ffe4e6', '200': '#fecdd3', '300': '#fda4af',
      '400': '#fb7185', '500': '#f43f5e', '600': '#e11d48', '700': '#be123c',
      '800': '#9f1239', '900': '#881337', '950': '#4c0519',
    },
  },
];

/**
 * Map color name to palette
 */
export const COLOR_BY_NAME: Record<string, ColorPalette> = {};
COLOR_PALETTE.forEach((p) => {
  COLOR_BY_NAME[p.name] = p;
});

/**
 * Get hex color from Tailwind color string (e.g., 'blue-500')
 */
export function getColorHex(colorString: string): string | null {
  // Handle special colors
  const special = SPECIAL_COLORS.find((c) => c.name === colorString);
  if (special) return special.hex;

  // Parse color-shade format
  const match = colorString.match(/^([a-z]+)-(\d+)$/);
  if (!match) return null;

  const [, colorName, shade] = match;
  const palette = COLOR_BY_NAME[colorName];
  if (!palette) return null;

  return palette.shades[shade as ColorShade] || null;
}

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

/**
 * Font size scale
 */
export interface FontSizeValue {
  suffix: string;
  css: string;
  label: string;
}

export const FONT_SIZE_SCALE: FontSizeValue[] = [
  { suffix: 'xs', css: '0.75rem', label: 'XS (12px)' },
  { suffix: 'sm', css: '0.875rem', label: 'SM (14px)' },
  { suffix: 'base', css: '1rem', label: 'Base (16px)' },
  { suffix: 'lg', css: '1.125rem', label: 'LG (18px)' },
  { suffix: 'xl', css: '1.25rem', label: 'XL (20px)' },
  { suffix: '2xl', css: '1.5rem', label: '2XL (24px)' },
  { suffix: '3xl', css: '1.875rem', label: '3XL (30px)' },
  { suffix: '4xl', css: '2.25rem', label: '4XL (36px)' },
  { suffix: '5xl', css: '3rem', label: '5XL (48px)' },
  { suffix: '6xl', css: '3.75rem', label: '6XL (60px)' },
  { suffix: '7xl', css: '4.5rem', label: '7XL (72px)' },
  { suffix: '8xl', css: '6rem', label: '8XL (96px)' },
  { suffix: '9xl', css: '8rem', label: '9XL (128px)' },
];

/**
 * Font weight scale
 */
export interface FontWeightValue {
  suffix: string;
  css: string;
  label: string;
}

export const FONT_WEIGHT_SCALE: FontWeightValue[] = [
  { suffix: 'thin', css: '100', label: 'Thin (100)' },
  { suffix: 'extralight', css: '200', label: 'Extra Light (200)' },
  { suffix: 'light', css: '300', label: 'Light (300)' },
  { suffix: 'normal', css: '400', label: 'Normal (400)' },
  { suffix: 'medium', css: '500', label: 'Medium (500)' },
  { suffix: 'semibold', css: '600', label: 'Semibold (600)' },
  { suffix: 'bold', css: '700', label: 'Bold (700)' },
  { suffix: 'extrabold', css: '800', label: 'Extra Bold (800)' },
  { suffix: 'black', css: '900', label: 'Black (900)' },
];

/**
 * Text alignment options
 */
export const TEXT_ALIGN_OPTIONS = [
  { suffix: 'left', label: 'Left', icon: 'align-left' },
  { suffix: 'center', label: 'Center', icon: 'align-center' },
  { suffix: 'right', label: 'Right', icon: 'align-right' },
  { suffix: 'justify', label: 'Justify', icon: 'align-justify' },
];

// ============================================================================
// BORDER SCALE
// ============================================================================

/**
 * Border width values
 */
export const BORDER_WIDTH_SCALE = [
  { suffix: '0', css: '0px', label: 'None' },
  { suffix: '', css: '1px', label: '1px' },  // border (no suffix) = 1px
  { suffix: '2', css: '2px', label: '2px' },
  { suffix: '4', css: '4px', label: '4px' },
  { suffix: '8', css: '8px', label: '8px' },
];

/**
 * Border radius values
 */
export const BORDER_RADIUS_SCALE = [
  { suffix: 'none', css: '0px', label: 'None' },
  { suffix: 'sm', css: '0.125rem', label: 'SM (2px)' },
  { suffix: '', css: '0.25rem', label: 'Default (4px)' },  // rounded (no suffix)
  { suffix: 'md', css: '0.375rem', label: 'MD (6px)' },
  { suffix: 'lg', css: '0.5rem', label: 'LG (8px)' },
  { suffix: 'xl', css: '0.75rem', label: 'XL (12px)' },
  { suffix: '2xl', css: '1rem', label: '2XL (16px)' },
  { suffix: '3xl', css: '1.5rem', label: '3XL (24px)' },
  { suffix: 'full', css: '9999px', label: 'Full (pill)' },
];

// ============================================================================
// EFFECTS SCALE
// ============================================================================

/**
 * Shadow values
 */
export const SHADOW_SCALE = [
  { suffix: 'none', css: 'none', label: 'None' },
  { suffix: 'sm', css: '0 1px 2px 0 rgb(0 0 0 / 0.05)', label: 'Small' },
  { suffix: '', css: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)', label: 'Default' },
  { suffix: 'md', css: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', label: 'Medium' },
  { suffix: 'lg', css: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', label: 'Large' },
  { suffix: 'xl', css: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', label: 'XL' },
  { suffix: '2xl', css: '0 25px 50px -12px rgb(0 0 0 / 0.25)', label: '2XL' },
];

/**
 * Opacity values
 */
export const OPACITY_SCALE = [
  { suffix: '0', css: '0', label: '0%' },
  { suffix: '5', css: '0.05', label: '5%' },
  { suffix: '10', css: '0.1', label: '10%' },
  { suffix: '20', css: '0.2', label: '20%' },
  { suffix: '25', css: '0.25', label: '25%' },
  { suffix: '30', css: '0.3', label: '30%' },
  { suffix: '40', css: '0.4', label: '40%' },
  { suffix: '50', css: '0.5', label: '50%' },
  { suffix: '60', css: '0.6', label: '60%' },
  { suffix: '70', css: '0.7', label: '70%' },
  { suffix: '75', css: '0.75', label: '75%' },
  { suffix: '80', css: '0.8', label: '80%' },
  { suffix: '90', css: '0.9', label: '90%' },
  { suffix: '95', css: '0.95', label: '95%' },
  { suffix: '100', css: '1', label: '100%' },
];

// ============================================================================
// SIZE SCALE
// ============================================================================

/**
 * Width/Height preset values
 */
export const SIZE_PRESETS = [
  { suffix: 'auto', label: 'Auto' },
  { suffix: 'full', label: '100%' },
  { suffix: 'screen', label: '100vw/vh' },
  { suffix: 'min', label: 'min-content' },
  { suffix: 'max', label: 'max-content' },
  { suffix: 'fit', label: 'fit-content' },
  { suffix: '1/2', label: '50%' },
  { suffix: '1/3', label: '33.33%' },
  { suffix: '2/3', label: '66.67%' },
  { suffix: '1/4', label: '25%' },
  { suffix: '3/4', label: '75%' },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Find spacing value by suffix
 */
export function getSpacingBySuffix(suffix: string): SpacingValue | undefined {
  return SPACING_BY_SUFFIX[suffix];
}

/**
 * Find closest spacing value to a pixel amount
 */
export function getClosestSpacing(px: number): SpacingValue {
  let closest = SPACING_SCALE[0];
  let closestDiff = Math.abs(px - closest.px);

  for (const spacing of SPACING_SCALE) {
    const diff = Math.abs(px - spacing.px);
    if (diff < closestDiff) {
      closest = spacing;
      closestDiff = diff;
    }
  }

  return closest;
}
