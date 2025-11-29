/**
 * @file types.ts
 * @description Type definitions for visual style editor components
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-defined types for style controls
 * 
 * @see src/renderer/utils/tailwindParser.ts - ParsedStyles interface
 * @see src/renderer/utils/tailwindMappings.ts - Tailwind constants
 * 
 * @security-critical false
 * @performance-critical false
 */

import type { SpacingStyles, ParsedStyles } from '../../utils/tailwindParser';

// ============================================================================
// COMMON TYPES
// ============================================================================

/**
 * Callback for when a style property changes
 */
export type StyleChangeHandler = (property: string, value: string | undefined) => void;

/**
 * Common props for all style control components
 */
export interface BaseStyleControlProps {
  /** Current parsed styles */
  styles: ParsedStyles;
  /** Handler called when any style changes */
  onChange: StyleChangeHandler;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ============================================================================
// SPACING TYPES
// ============================================================================

/**
 * Mode for spacing input (all sides vs individual)
 */
export type SpacingMode = 'all' | 'axis' | 'individual';

/**
 * Props for SpacingControl component
 */
export interface SpacingControlProps {
  /** Type of spacing (padding or margin) */
  type: 'padding' | 'margin';
  /** Current spacing values */
  value: SpacingStyles;
  /** Handler called when spacing changes */
  onChange: (value: SpacingStyles) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

/**
 * Props for single spacing input
 */
export interface SpacingInputProps {
  /** Current value (Tailwind suffix like '4', 'px', 'auto') */
  value: string;
  /** Handler called when value changes */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether to allow 'auto' value (for margin only) */
  allowAuto?: boolean;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Label for accessibility */
  label: string;
}

// ============================================================================
// COLOR TYPES
// ============================================================================

/**
 * Color type for different styling purposes
 */
export type ColorType = 'backgroundColor' | 'textColor' | 'borderColor';

/**
 * Props for TailwindColorPicker component
 */
export interface ColorPickerProps {
  /** Type of color being picked */
  type: ColorType;
  /** Current color value (e.g., 'blue-500', 'white') */
  value: string | undefined;
  /** Handler called when color changes */
  onChange: (value: string | undefined) => void;
  /** Whether the picker is disabled */
  disabled?: boolean;
  /** Label for the color picker */
  label: string;
}

/**
 * Props for color swatch button
 */
export interface ColorSwatchProps {
  /** Color name (e.g., 'blue') */
  colorName: string;
  /** Shade value (e.g., '500') */
  shade: string;
  /** Hex value for display */
  hex: string;
  /** Whether this swatch is selected */
  isSelected: boolean;
  /** Click handler */
  onClick: () => void;
}

// ============================================================================
// TYPOGRAPHY TYPES
// ============================================================================

/**
 * Props for TypographyControl component
 */
export interface TypographyControlProps {
  /** Current font size (e.g., 'lg', '2xl') */
  fontSize: string | undefined;
  /** Current font weight (e.g., 'bold', 'medium') */
  fontWeight: string | undefined;
  /** Current text alignment (e.g., 'center', 'left') */
  textAlign: string | undefined;
  /** Handler called when typography changes */
  onChange: (property: 'fontSize' | 'fontWeight' | 'textAlign', value: string | undefined) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ============================================================================
// SIZE TYPES
// ============================================================================

/**
 * Props for SizeControl component
 */
export interface SizeControlProps {
  /** Dimension type */
  dimension: 'width' | 'height' | 'minWidth' | 'maxWidth' | 'minHeight' | 'maxHeight';
  /** Current value (e.g., 'full', '64', '1/2') */
  value: string | undefined;
  /** Handler called when size changes */
  onChange: (value: string | undefined) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
  /** Label for the control */
  label: string;
}

// ============================================================================
// BORDER TYPES
// ============================================================================

/**
 * Props for BorderControl component
 */
export interface BorderControlProps {
  /** Current border width (e.g., '', '2', '4') */
  borderWidth: string | undefined;
  /** Current border radius (e.g., 'md', 'lg', 'full') */
  borderRadius: string | undefined;
  /** Current border style (e.g., 'solid', 'dashed') */
  borderStyle: string | undefined;
  /** Current border color (e.g., 'gray-300') */
  borderColor: string | undefined;
  /** Handler called when border changes */
  onChange: (
    property: 'borderWidth' | 'borderRadius' | 'borderStyle' | 'borderColor',
    value: string | undefined
  ) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ============================================================================
// EFFECTS TYPES
// ============================================================================

/**
 * Props for EffectsControl component
 */
export interface EffectsControlProps {
  /** Current shadow value (e.g., 'md', 'lg') */
  shadow: string | undefined;
  /** Current opacity value (e.g., '50', '75') */
  opacity: string | undefined;
  /** Handler called when effect changes */
  onChange: (property: 'shadow' | 'opacity', value: string | undefined) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ============================================================================
// LAYOUT TYPES
// ============================================================================

/**
 * Props for LayoutControl component
 */
export interface LayoutControlProps {
  /** Current display value */
  display: string | undefined;
  /** Current position value */
  position: string | undefined;
  /** Handler called when layout changes */
  onChange: (property: 'display' | 'position', value: string | undefined) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

/**
 * Props for FlexboxControl component
 */
export interface FlexboxControlProps {
  /** Current flex direction */
  flexDirection: string | undefined;
  /** Current justify content */
  justifyContent: string | undefined;
  /** Current align items */
  alignItems: string | undefined;
  /** Current gap */
  gap: string | undefined;
  /** Handler called when flexbox prop changes */
  onChange: (
    property: 'flexDirection' | 'justifyContent' | 'alignItems' | 'gap',
    value: string | undefined
  ) => void;
  /** Whether the control is disabled */
  disabled?: boolean;
}

// ============================================================================
// CATEGORY SECTION TYPES
// ============================================================================

/**
 * Style category for organizing controls
 */
export type StyleCategory = 
  | 'spacing'
  | 'colors'
  | 'typography'
  | 'sizing'
  | 'borders'
  | 'effects'
  | 'layout';

/**
 * Props for collapsible category section
 */
export interface StyleCategorySectionProps {
  /** Category name */
  category: StyleCategory;
  /** Display label */
  label: string;
  /** Whether section is initially expanded */
  defaultExpanded?: boolean;
  /** Child controls */
  children: React.ReactNode;
}
