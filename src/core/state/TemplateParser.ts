/**
 * @file TemplateParser.ts
 * @description Parser for state reference template syntax {{state.varName}}
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-defined regex patterns, comprehensive tests planned
 * 
 * @see src/core/logic/types.ts - PageState types
 * @see .implementation/phase-4-logic-editor/task-4.3-page-state-system.md
 * 
 * PROBLEM SOLVED:
 * - Need to detect and parse {{state.varName}} syntax in component properties
 * - Extract state variable references for validation
 * - Generate JavaScript expressions from templates
 * 
 * SOLUTION:
 * - Regex-based parsing of template strings
 * - Extract state references as array
 * - Convert templates to JS template literals
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only supports simple state references: {{state.varName}}
 * - No expressions inside templates (e.g., {{state.count + 1}} NOT allowed)
 * - No nested templates
 * 
 * @performance O(n) where n = template string length
 * @security-critical true - Generates code that gets evaluated
 * @performance-critical false
 */

import type { PageState } from '../logic/types';

// ============================================================
// TYPES
// ============================================================

/**
 * Represents a segment of a parsed template
 * Either plain text or a state variable reference
 */
export type TemplatePart = 
  | { type: 'text'; value: string }
  | { type: 'stateRef'; variable: string };

/**
 * Result of parsing a template string
 */
export interface ParsedTemplate {
  /** Original template string */
  original: string;
  
  /** Whether the template contains any state references */
  hasStateRefs: boolean;
  
  /** List of unique state variable names referenced */
  stateRefs: string[];
  
  /** Template broken into parts for processing */
  parts: TemplatePart[];
}

/**
 * Result of validating state references
 */
export interface ValidationResult {
  /** Whether all references are valid */
  isValid: boolean;
  
  /** List of missing variable names */
  missingVariables: string[];
}

// ============================================================
// CONSTANTS
// ============================================================

/**
 * Regex for matching state references in templates
 * 
 * Matches: {{state.variableName}}
 * - Starts with {{state.
 * - Variable name must be valid JS identifier (start with letter, contain letters/numbers/underscores)
 * - Ends with }}
 * 
 * Captures group 1: the variable name without {{state. and }}
 * 
 * @example
 * "Count: {{state.clickCount}}" 
 * // Match: "{{state.clickCount}}"
 * // Capture group 1: "clickCount"
 */
const STATE_REF_REGEX = /\{\{state\.([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g;

// ============================================================
// PARSING FUNCTIONS
// ============================================================

/**
 * Parse a template string and extract state references
 * 
 * Takes a string that may contain {{state.varName}} references
 * and returns structured information about the template.
 * 
 * @param template - String that may contain state references
 * @returns ParsedTemplate with extracted information
 * 
 * @example Simple reference
 * ```typescript
 * parseTemplate("Count: {{state.clickCount}}")
 * // Returns:
 * // {
 * //   original: "Count: {{state.clickCount}}",
 * //   hasStateRefs: true,
 * //   stateRefs: ["clickCount"],
 * //   parts: [
 * //     { type: 'text', value: 'Count: ' },
 * //     { type: 'stateRef', variable: 'clickCount' }
 * //   ]
 * // }
 * ```
 * 
 * @example Multiple references
 * ```typescript
 * parseTemplate("{{state.firstName}} {{state.lastName}}")
 * // Returns stateRefs: ["firstName", "lastName"]
 * // parts: [
 * //   { type: 'stateRef', variable: 'firstName' },
 * //   { type: 'text', value: ' ' },
 * //   { type: 'stateRef', variable: 'lastName' }
 * // ]
 * ```
 * 
 * @example No references
 * ```typescript
 * parseTemplate("Hello World")
 * // Returns: { hasStateRefs: false, stateRefs: [], parts: [{ type: 'text', value: 'Hello World' }] }
 * ```
 */
export function parseTemplate(template: string): ParsedTemplate {
  // Track unique state references
  const stateRefs: string[] = [];
  
  // Build parts array
  const parts: TemplatePart[] = [];
  
  // Track position in string
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  // Reset regex state (important for global regex)
  STATE_REF_REGEX.lastIndex = 0;
  
  // Process all matches
  while ((match = STATE_REF_REGEX.exec(template)) !== null) {
    // Add text before this match (if any)
    if (match.index > lastIndex) {
      parts.push({
        type: 'text',
        value: template.slice(lastIndex, match.index),
      });
    }
    
    // Extract variable name from capture group
    const varName = match[1];
    
    // Add the state reference
    parts.push({
      type: 'stateRef',
      variable: varName,
    });
    
    // Track unique references
    if (!stateRefs.includes(varName)) {
      stateRefs.push(varName);
    }
    
    // Update position
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text after last match (if any)
  if (lastIndex < template.length) {
    parts.push({
      type: 'text',
      value: template.slice(lastIndex),
    });
  }
  
  // Handle case where template has no matches (pure text)
  if (parts.length === 0) {
    parts.push({ type: 'text', value: template });
  }
  
  return {
    original: template,
    hasStateRefs: stateRefs.length > 0,
    stateRefs,
    parts,
  };
}

// ============================================================
// CODE GENERATION
// ============================================================

/**
 * Generate a JavaScript expression from a parsed template
 * 
 * Converts the template into a JS template literal that can be
 * used in generated code.
 * 
 * @param parsed - Parsed template from parseTemplate()
 * @param stateAccessor - Variable name to access state (default: 'state')
 * @returns JavaScript expression string
 * 
 * @example
 * ```typescript
 * const parsed = parseTemplate("Count: {{state.clickCount}}");
 * generateExpression(parsed, 'pageState')
 * // Returns: `Count: ${pageState.clickCount}`
 * ```
 * 
 * @example No state refs
 * ```typescript
 * const parsed = parseTemplate("Hello World");
 * generateExpression(parsed)
 * // Returns: "Hello World" (quoted string, not template literal)
 * ```
 */
export function generateExpression(
  parsed: ParsedTemplate,
  stateAccessor: string = 'state'
): string {
  // If no state refs, return as simple quoted string
  if (!parsed.hasStateRefs) {
    return JSON.stringify(parsed.original);
  }
  
  // Build template literal
  const segments = parsed.parts.map((part) => {
    if (part.type === 'text') {
      // Escape special characters for template literals
      return escapeTemplateText(part.value);
    } else {
      // State reference becomes template interpolation
      return `\${${stateAccessor}.${part.variable}}`;
    }
  });
  
  // Wrap in backticks
  return '`' + segments.join('') + '`';
}

/**
 * Escape text for safe inclusion in a JavaScript template literal
 * 
 * @param text - Text to escape
 * @returns Escaped text safe for template literal
 */
function escapeTemplateText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')  // Escape backslashes first
    .replace(/`/g, '\\`')    // Escape backticks
    .replace(/\$\{/g, '\\${'); // Escape template interpolation
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Validate that all state references in a template exist in page state
 * 
 * @param parsed - Parsed template to validate
 * @param pageState - Available page state variables
 * @returns Validation result with any missing variables
 * 
 * @example Valid references
 * ```typescript
 * const parsed = parseTemplate("Count: {{state.clickCount}}");
 * validateStateRefs(parsed, { clickCount: { type: 'number', initialValue: 0 } })
 * // Returns: { isValid: true, missingVariables: [] }
 * ```
 * 
 * @example Missing reference
 * ```typescript
 * const parsed = parseTemplate("Count: {{state.unknownVar}}");
 * validateStateRefs(parsed, {})
 * // Returns: { isValid: false, missingVariables: ['unknownVar'] }
 * ```
 */
export function validateStateRefs(
  parsed: ParsedTemplate,
  pageState: PageState
): ValidationResult {
  const missingVariables = parsed.stateRefs.filter(
    (ref) => !(ref in pageState)
  );
  
  return {
    isValid: missingVariables.length === 0,
    missingVariables,
  };
}

/**
 * Check if a string contains any state references
 * 
 * Quick check without full parsing - useful for filtering.
 * 
 * @param text - String to check
 * @returns true if contains {{state.xxx}} pattern
 * 
 * @example
 * ```typescript
 * hasStateRefs("Click me") // false
 * hasStateRefs("Count: {{state.count}}") // true
 * ```
 */
export function hasStateRefs(text: string): boolean {
  // Reset regex state
  STATE_REF_REGEX.lastIndex = 0;
  return STATE_REF_REGEX.test(text);
}

/**
 * Extract just the state variable names from a template
 * 
 * Convenience function when you only need the variable names.
 * 
 * @param template - Template string to extract from
 * @returns Array of unique state variable names
 * 
 * @example
 * ```typescript
 * extractStateRefs("{{state.a}} and {{state.b}} and {{state.a}}")
 * // Returns: ["a", "b"]
 * ```
 */
export function extractStateRefs(template: string): string[] {
  const parsed = parseTemplate(template);
  return parsed.stateRefs;
}

// ============================================================
// EXPORTS
// ============================================================

export default {
  parseTemplate,
  generateExpression,
  validateStateRefs,
  hasStateRefs,
  extractStateRefs,
};
