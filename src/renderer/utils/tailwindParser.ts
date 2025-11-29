/**
 * @file tailwindParser.ts
 * @description Parse Tailwind classes into structured style data and vice versa
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive pattern matching for common Tailwind classes
 * 
 * PROBLEM SOLVED:
 * Visual style controls need to:
 * 1. Parse existing Tailwind classes to populate control values (classes → data)
 * 2. Generate Tailwind classes from control inputs (data → classes)
 * 
 * This enables bidirectional sync: edit in controls, see classes update; 
 * edit classes manually, see controls update.
 * 
 * SOLUTION:
 * - ParsedStyles interface represents all style properties as structured data
 * - parseClasses() extracts values from class string using regex patterns
 * - generateClasses() creates class string from structured data
 * - Unknown classes are preserved as-is (pass-through)
 * 
 * SUPPORTED PATTERNS:
 * - Spacing: p-4, px-2, pt-8, m-4, mx-auto, etc.
 * - Colors: bg-blue-500, text-gray-700, border-red-300
 * - Typography: text-lg, font-bold, text-center
 * - Sizing: w-full, h-64, max-w-lg
 * - Borders: border, border-2, rounded-lg
 * - Effects: shadow-md, opacity-50
 * 
 * @security-critical false
 * @performance-critical false - Called on user interactions, not hot path
 */

import { SPACING_BY_SUFFIX, COLOR_BY_NAME, SPECIAL_COLORS } from './tailwindMappings';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Spacing value for padding/margin
 * Can be "all sides" or individual sides
 */
export interface SpacingStyles {
  /** All sides (p-4, m-4) */
  all?: string;
  /** Horizontal (px-4, mx-4) */
  x?: string;
  /** Vertical (py-4, my-4) */
  y?: string;
  /** Top (pt-4, mt-4) */
  top?: string;
  /** Right (pr-4, mr-4) */
  right?: string;
  /** Bottom (pb-4, mb-4) */
  bottom?: string;
  /** Left (pl-4, ml-4) */
  left?: string;
}

/**
 * Structured representation of parsed Tailwind styles
 * This is the data structure that visual controls will read/write
 */
export interface ParsedStyles {
  // Spacing
  padding: SpacingStyles;
  margin: SpacingStyles;

  // Colors
  backgroundColor?: string;  // e.g., 'blue-500', 'white'
  textColor?: string;        // e.g., 'gray-700'
  borderColor?: string;      // e.g., 'red-300'

  // Typography
  fontSize?: string;         // e.g., 'lg', '2xl'
  fontWeight?: string;       // e.g., 'bold', 'medium'
  textAlign?: string;        // e.g., 'center', 'left'
  textDecoration?: string;   // e.g., 'underline', 'line-through'
  textTransform?: string;    // e.g., 'uppercase', 'lowercase'

  // Sizing
  width?: string;            // e.g., 'full', '1/2', '64'
  height?: string;           // e.g., 'screen', '32'
  minWidth?: string;         // e.g., 'full', '0'
  maxWidth?: string;         // e.g., 'lg', 'xl', 'prose'
  minHeight?: string;        // e.g., 'screen'
  maxHeight?: string;        // e.g., '96'

  // Borders
  borderWidth?: string;      // e.g., '', '2', '4' (empty = border = 1px)
  borderRadius?: string;     // e.g., 'md', 'lg', 'full'
  borderStyle?: string;      // e.g., 'solid', 'dashed'

  // Effects
  shadow?: string;           // e.g., 'md', 'lg', '2xl'
  opacity?: string;          // e.g., '50', '75', '100'

  // Display/Layout
  display?: string;          // e.g., 'flex', 'grid', 'block', 'hidden'
  position?: string;         // e.g., 'absolute', 'relative', 'fixed'

  // Flexbox
  flexDirection?: string;    // e.g., 'row', 'col'
  flexWrap?: string;         // e.g., 'wrap', 'nowrap'
  justifyContent?: string;   // e.g., 'center', 'between'
  alignItems?: string;       // e.g., 'center', 'start'
  gap?: string;              // e.g., '4', '8'

  // Classes that couldn't be parsed (preserved as-is)
  unknownClasses: string[];
}

// ============================================================================
// PARSING PATTERNS
// ============================================================================

/**
 * Regex patterns for extracting Tailwind class values
 * Each pattern captures the value part of the class
 */
const PATTERNS = {
  // Padding
  paddingAll: /^p-(\d+(?:\.\d+)?|px)$/,
  paddingX: /^px-(\d+(?:\.\d+)?|px)$/,
  paddingY: /^py-(\d+(?:\.\d+)?|px)$/,
  paddingTop: /^pt-(\d+(?:\.\d+)?|px)$/,
  paddingRight: /^pr-(\d+(?:\.\d+)?|px)$/,
  paddingBottom: /^pb-(\d+(?:\.\d+)?|px)$/,
  paddingLeft: /^pl-(\d+(?:\.\d+)?|px)$/,

  // Margin
  marginAll: /^m-(\d+(?:\.\d+)?|px|auto)$/,
  marginX: /^mx-(\d+(?:\.\d+)?|px|auto)$/,
  marginY: /^my-(\d+(?:\.\d+)?|px|auto)$/,
  marginTop: /^mt-(\d+(?:\.\d+)?|px|auto)$/,
  marginRight: /^mr-(\d+(?:\.\d+)?|px|auto)$/,
  marginBottom: /^mb-(\d+(?:\.\d+)?|px|auto)$/,
  marginLeft: /^ml-(\d+(?:\.\d+)?|px|auto)$/,

  // Colors
  bgColor: /^bg-([a-z]+-\d+|white|black|transparent|current)$/,
  textColor: /^text-([a-z]+-\d+|white|black|transparent|current)$/,
  borderColor: /^border-([a-z]+-\d+|white|black|transparent|current)$/,

  // Typography
  fontSize: /^text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)$/,
  fontWeight: /^font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)$/,
  textAlign: /^text-(left|center|right|justify)$/,
  textDecoration: /^(underline|line-through|no-underline)$/,
  textTransform: /^(uppercase|lowercase|capitalize|normal-case)$/,

  // Sizing
  width: /^w-(\d+(?:\/\d+)?|full|screen|auto|min|max|fit|px)$/,
  height: /^h-(\d+(?:\/\d+)?|full|screen|auto|min|max|fit|px)$/,
  minWidth: /^min-w-(\d+|full|min|max|fit|0)$/,
  maxWidth: /^max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|min|max|fit|prose|screen-sm|screen-md|screen-lg|screen-xl|screen-2xl|none)$/,
  minHeight: /^min-h-(\d+|full|screen|min|max|fit|0)$/,
  maxHeight: /^max-h-(\d+|full|screen|min|max|fit|none)$/,

  // Borders
  borderWidth: /^border(?:-(\d+))?$/,  // border, border-2, border-4, border-8
  borderRadius: /^rounded(?:-(.+))?$/,  // rounded, rounded-md, rounded-lg, rounded-full
  borderStyle: /^border-(solid|dashed|dotted|double|none)$/,

  // Effects
  shadow: /^shadow(?:-(.+))?$/,  // shadow, shadow-md, shadow-lg
  opacity: /^opacity-(\d+)$/,

  // Display
  display: /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden)$/,
  position: /^(static|fixed|absolute|relative|sticky)$/,

  // Flexbox
  flexDirection: /^flex-(row|row-reverse|col|col-reverse)$/,
  flexWrap: /^flex-(wrap|wrap-reverse|nowrap)$/,
  justifyContent: /^justify-(start|end|center|between|around|evenly)$/,
  alignItems: /^items-(start|end|center|baseline|stretch)$/,
  gap: /^gap-(\d+(?:\.\d+)?)$/,
};

// ============================================================================
// PARSER FUNCTIONS
// ============================================================================

/**
 * Parse a Tailwind class string into structured style data
 * 
 * ALGORITHM:
 * 1. Split class string into individual classes
 * 2. Try each class against all known patterns
 * 3. If matched, store value in appropriate field
 * 4. If not matched, add to unknownClasses
 * 
 * @param classString - Space-separated Tailwind classes
 * @returns Structured style data with parsed values
 * 
 * @example
 * ```typescript
 * const styles = parseClasses('p-4 bg-blue-500 text-white rounded-lg');
 * // styles.padding.all === '4'
 * // styles.backgroundColor === 'blue-500'
 * // styles.textColor === 'white'
 * // styles.borderRadius === 'lg'
 * ```
 */
export function parseClasses(classString: string): ParsedStyles {
  // Initialize result with empty values
  const result: ParsedStyles = {
    padding: {},
    margin: {},
    unknownClasses: [],
  };

  // Handle empty input
  if (!classString || !classString.trim()) {
    return result;
  }

  // Split and filter empty strings
  const classes = classString.split(/\s+/).filter(Boolean);

  for (const cls of classes) {
    let matched = false;

    // Try padding patterns
    let match = cls.match(PATTERNS.paddingAll);
    if (match) { result.padding.all = match[1]; matched = true; }

    if (!matched && (match = cls.match(PATTERNS.paddingX))) {
      result.padding.x = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.paddingY))) {
      result.padding.y = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.paddingTop))) {
      result.padding.top = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.paddingRight))) {
      result.padding.right = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.paddingBottom))) {
      result.padding.bottom = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.paddingLeft))) {
      result.padding.left = match[1]; matched = true;
    }

    // Try margin patterns
    if (!matched && (match = cls.match(PATTERNS.marginAll))) {
      result.margin.all = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginX))) {
      result.margin.x = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginY))) {
      result.margin.y = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginTop))) {
      result.margin.top = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginRight))) {
      result.margin.right = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginBottom))) {
      result.margin.bottom = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.marginLeft))) {
      result.margin.left = match[1]; matched = true;
    }

    // Try color patterns
    if (!matched && (match = cls.match(PATTERNS.bgColor))) {
      result.backgroundColor = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.textColor))) {
      result.textColor = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.borderColor))) {
      result.borderColor = match[1]; matched = true;
    }

    // Try typography patterns
    if (!matched && (match = cls.match(PATTERNS.fontSize))) {
      result.fontSize = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.fontWeight))) {
      result.fontWeight = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.textAlign))) {
      result.textAlign = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.textDecoration))) {
      result.textDecoration = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.textTransform))) {
      result.textTransform = match[1]; matched = true;
    }

    // Try sizing patterns
    if (!matched && (match = cls.match(PATTERNS.width))) {
      result.width = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.height))) {
      result.height = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.minWidth))) {
      result.minWidth = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.maxWidth))) {
      result.maxWidth = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.minHeight))) {
      result.minHeight = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.maxHeight))) {
      result.maxHeight = match[1]; matched = true;
    }

    // Try border patterns
    if (!matched) {
      match = cls.match(PATTERNS.borderWidth);
      if (match) {
        // border = '' (1px), border-2 = '2', etc.
        result.borderWidth = match[1] || '';
        matched = true;
      }
    }
    if (!matched) {
      match = cls.match(PATTERNS.borderRadius);
      if (match) {
        // rounded = '' (default), rounded-lg = 'lg', etc.
        result.borderRadius = match[1] || '';
        matched = true;
      }
    }
    if (!matched && (match = cls.match(PATTERNS.borderStyle))) {
      result.borderStyle = match[1]; matched = true;
    }

    // Try effects patterns
    if (!matched) {
      match = cls.match(PATTERNS.shadow);
      if (match) {
        // shadow = '' (default), shadow-md = 'md', etc.
        result.shadow = match[1] || '';
        matched = true;
      }
    }
    if (!matched && (match = cls.match(PATTERNS.opacity))) {
      result.opacity = match[1]; matched = true;
    }

    // Try display patterns
    if (!matched && (match = cls.match(PATTERNS.display))) {
      result.display = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.position))) {
      result.position = match[1]; matched = true;
    }

    // Try flexbox patterns
    if (!matched && (match = cls.match(PATTERNS.flexDirection))) {
      result.flexDirection = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.flexWrap))) {
      result.flexWrap = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.justifyContent))) {
      result.justifyContent = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.alignItems))) {
      result.alignItems = match[1]; matched = true;
    }
    if (!matched && (match = cls.match(PATTERNS.gap))) {
      result.gap = match[1]; matched = true;
    }

    // If no pattern matched, preserve as unknown class
    if (!matched) {
      result.unknownClasses.push(cls);
    }
  }

  return result;
}

// ============================================================================
// GENERATOR FUNCTIONS
// ============================================================================

/**
 * Generate Tailwind class string from structured style data
 * 
 * ALGORITHM:
 * 1. For each populated field, generate corresponding class(es)
 * 2. Spacing: prefer 'all' over axis over individual
 * 3. Append unknown classes at the end (preserves custom/hover/focus)
 * 
 * @param styles - Structured style data
 * @returns Space-separated Tailwind class string
 * 
 * @example
 * ```typescript
 * const classString = generateClasses({
 *   padding: { all: '4' },
 *   backgroundColor: 'blue-500',
 *   textColor: 'white',
 *   borderRadius: 'lg',
 *   unknownClasses: ['hover:bg-blue-600'],
 * });
 * // 'p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600'
 * ```
 */
export function generateClasses(styles: ParsedStyles): string {
  const classes: string[] = [];

  // Generate padding classes
  if (styles.padding.all !== undefined) {
    classes.push(`p-${styles.padding.all}`);
  } else {
    if (styles.padding.x !== undefined) classes.push(`px-${styles.padding.x}`);
    if (styles.padding.y !== undefined) classes.push(`py-${styles.padding.y}`);
    if (styles.padding.top !== undefined) classes.push(`pt-${styles.padding.top}`);
    if (styles.padding.right !== undefined) classes.push(`pr-${styles.padding.right}`);
    if (styles.padding.bottom !== undefined) classes.push(`pb-${styles.padding.bottom}`);
    if (styles.padding.left !== undefined) classes.push(`pl-${styles.padding.left}`);
  }

  // Generate margin classes
  if (styles.margin.all !== undefined) {
    classes.push(`m-${styles.margin.all}`);
  } else {
    if (styles.margin.x !== undefined) classes.push(`mx-${styles.margin.x}`);
    if (styles.margin.y !== undefined) classes.push(`my-${styles.margin.y}`);
    if (styles.margin.top !== undefined) classes.push(`mt-${styles.margin.top}`);
    if (styles.margin.right !== undefined) classes.push(`mr-${styles.margin.right}`);
    if (styles.margin.bottom !== undefined) classes.push(`mb-${styles.margin.bottom}`);
    if (styles.margin.left !== undefined) classes.push(`ml-${styles.margin.left}`);
  }

  // Generate color classes
  if (styles.backgroundColor) {
    classes.push(`bg-${styles.backgroundColor}`);
  }
  if (styles.textColor) {
    classes.push(`text-${styles.textColor}`);
  }
  if (styles.borderColor) {
    classes.push(`border-${styles.borderColor}`);
  }

  // Generate typography classes
  if (styles.fontSize) {
    classes.push(`text-${styles.fontSize}`);
  }
  if (styles.fontWeight) {
    classes.push(`font-${styles.fontWeight}`);
  }
  if (styles.textAlign) {
    classes.push(`text-${styles.textAlign}`);
  }
  if (styles.textDecoration) {
    classes.push(styles.textDecoration);
  }
  if (styles.textTransform) {
    classes.push(styles.textTransform);
  }

  // Generate sizing classes
  if (styles.width) {
    classes.push(`w-${styles.width}`);
  }
  if (styles.height) {
    classes.push(`h-${styles.height}`);
  }
  if (styles.minWidth) {
    classes.push(`min-w-${styles.minWidth}`);
  }
  if (styles.maxWidth) {
    classes.push(`max-w-${styles.maxWidth}`);
  }
  if (styles.minHeight) {
    classes.push(`min-h-${styles.minHeight}`);
  }
  if (styles.maxHeight) {
    classes.push(`max-h-${styles.maxHeight}`);
  }

  // Generate border classes
  if (styles.borderWidth !== undefined) {
    classes.push(styles.borderWidth === '' ? 'border' : `border-${styles.borderWidth}`);
  }
  if (styles.borderRadius !== undefined) {
    classes.push(styles.borderRadius === '' ? 'rounded' : `rounded-${styles.borderRadius}`);
  }
  if (styles.borderStyle) {
    classes.push(`border-${styles.borderStyle}`);
  }

  // Generate effects classes
  if (styles.shadow !== undefined) {
    classes.push(styles.shadow === '' ? 'shadow' : `shadow-${styles.shadow}`);
  }
  if (styles.opacity) {
    classes.push(`opacity-${styles.opacity}`);
  }

  // Generate display classes
  if (styles.display) {
    classes.push(styles.display);
  }
  if (styles.position) {
    classes.push(styles.position);
  }

  // Generate flexbox classes
  if (styles.flexDirection) {
    classes.push(`flex-${styles.flexDirection}`);
  }
  if (styles.flexWrap) {
    classes.push(`flex-${styles.flexWrap}`);
  }
  if (styles.justifyContent) {
    classes.push(`justify-${styles.justifyContent}`);
  }
  if (styles.alignItems) {
    classes.push(`items-${styles.alignItems}`);
  }
  if (styles.gap) {
    classes.push(`gap-${styles.gap}`);
  }

  // Append unknown classes at the end
  classes.push(...styles.unknownClasses);

  return classes.join(' ');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Update a specific style property and regenerate the class string
 * Preserves all other properties and unknown classes
 * 
 * @param currentClasses - Current class string
 * @param property - Property to update (e.g., 'padding.all', 'backgroundColor')
 * @param value - New value (or undefined to remove)
 * @returns Updated class string
 * 
 * @example
 * ```typescript
 * const newClasses = updateStyleProperty(
 *   'p-4 bg-blue-500',
 *   'padding.all',
 *   '6'
 * );
 * // 'p-6 bg-blue-500'
 * ```
 */
export function updateStyleProperty(
  currentClasses: string,
  property: string,
  value: string | undefined
): string {
  const styles = parseClasses(currentClasses);

  // Handle nested properties (e.g., 'padding.all')
  const parts = property.split('.');
  
  if (parts.length === 2) {
    const [category, subProp] = parts;
    if (category === 'padding' || category === 'margin') {
      const spacing = styles[category] as SpacingStyles;
      if (value === undefined) {
        delete spacing[subProp as keyof SpacingStyles];
      } else {
        spacing[subProp as keyof SpacingStyles] = value;
      }
    }
  } else {
    // Top-level property
    // Use type assertion through unknown for dynamic property access
    const stylesObj = styles as unknown as Record<string, unknown>;
    if (value === undefined) {
      delete stylesObj[property];
    } else {
      stylesObj[property] = value;
    }
  }

  return generateClasses(styles);
}

/**
 * Merge new styles into existing class string
 * New styles override existing ones
 * 
 * @param currentClasses - Current class string
 * @param newStyles - Partial styles to merge
 * @returns Merged class string
 */
export function mergeStyles(
  currentClasses: string,
  newStyles: Partial<ParsedStyles>
): string {
  const styles = parseClasses(currentClasses);

  // Deep merge padding
  if (newStyles.padding) {
    styles.padding = { ...styles.padding, ...newStyles.padding };
  }

  // Deep merge margin
  if (newStyles.margin) {
    styles.margin = { ...styles.margin, ...newStyles.margin };
  }

  // Merge other properties
  const { padding, margin, unknownClasses, ...rest } = newStyles;
  Object.assign(styles, rest);

  // Merge unknown classes (deduplicate)
  if (unknownClasses) {
    const existing = new Set(styles.unknownClasses);
    unknownClasses.forEach((cls) => existing.add(cls));
    styles.unknownClasses = Array.from(existing);
  }

  return generateClasses(styles);
}

/**
 * Check if a color string is a valid Tailwind color
 * 
 * @param color - Color string to validate (e.g., 'blue-500', 'white')
 * @returns true if valid Tailwind color
 */
export function isValidTailwindColor(color: string): boolean {
  // Check special colors
  if (SPECIAL_COLORS.some((c) => c.name === color)) {
    return true;
  }

  // Check color-shade format
  const match = color.match(/^([a-z]+)-(\d+)$/);
  if (!match) return false;

  const [, colorName, shade] = match;
  const palette = COLOR_BY_NAME[colorName];
  if (!palette) return false;

  // Validate shade
  const validShades = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950'];
  return validShades.includes(shade);
}

/**
 * Check if a spacing string is a valid Tailwind spacing value
 * 
 * @param spacing - Spacing string to validate (e.g., '4', 'px', 'auto')
 * @returns true if valid Tailwind spacing
 */
export function isValidTailwindSpacing(spacing: string): boolean {
  if (spacing === 'auto') return true;
  return spacing in SPACING_BY_SUFFIX;
}

/**
 * Extract only the spacing classes from a class string
 * Useful for displaying just spacing in compact views
 */
export function extractSpacingClasses(classString: string): string {
  const styles = parseClasses(classString);
  return generateClasses({
    padding: styles.padding,
    margin: styles.margin,
    unknownClasses: [],
  });
}

/**
 * Get summary of parsed styles for display
 * Returns a human-readable list of applied styles
 */
export function getStyleSummary(classString: string): string[] {
  const styles = parseClasses(classString);
  const summary: string[] = [];

  // Padding summary
  if (styles.padding.all) {
    summary.push(`Padding: ${styles.padding.all}`);
  } else if (Object.keys(styles.padding).length > 0) {
    const parts: string[] = [];
    if (styles.padding.x) parts.push(`x:${styles.padding.x}`);
    if (styles.padding.y) parts.push(`y:${styles.padding.y}`);
    if (styles.padding.top) parts.push(`t:${styles.padding.top}`);
    if (styles.padding.right) parts.push(`r:${styles.padding.right}`);
    if (styles.padding.bottom) parts.push(`b:${styles.padding.bottom}`);
    if (styles.padding.left) parts.push(`l:${styles.padding.left}`);
    if (parts.length) summary.push(`Padding: ${parts.join(' ')}`);
  }

  // Margin summary
  if (styles.margin.all) {
    summary.push(`Margin: ${styles.margin.all}`);
  } else if (Object.keys(styles.margin).length > 0) {
    const parts: string[] = [];
    if (styles.margin.x) parts.push(`x:${styles.margin.x}`);
    if (styles.margin.y) parts.push(`y:${styles.margin.y}`);
    if (styles.margin.top) parts.push(`t:${styles.margin.top}`);
    if (styles.margin.right) parts.push(`r:${styles.margin.right}`);
    if (styles.margin.bottom) parts.push(`b:${styles.margin.bottom}`);
    if (styles.margin.left) parts.push(`l:${styles.margin.left}`);
    if (parts.length) summary.push(`Margin: ${parts.join(' ')}`);
  }

  // Other summaries
  if (styles.backgroundColor) summary.push(`BG: ${styles.backgroundColor}`);
  if (styles.textColor) summary.push(`Text: ${styles.textColor}`);
  if (styles.fontSize) summary.push(`Size: ${styles.fontSize}`);
  if (styles.fontWeight) summary.push(`Weight: ${styles.fontWeight}`);
  if (styles.borderRadius !== undefined) summary.push(`Rounded: ${styles.borderRadius || 'default'}`);
  if (styles.shadow !== undefined) summary.push(`Shadow: ${styles.shadow || 'default'}`);

  return summary;
}
