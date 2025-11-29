/**
 * @file types.ts
 * @description Type definitions for component property templates
 * 
 * @architecture Phase 3, Task 3.5 - Component Property Templates
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-defined interfaces based on task specification
 * 
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5-component-property-templates.md
 * @see docs/COMPONENT_SCHEMA.md - Property structure
 * 
 * PROBLEM SOLVED:
 * - Users need to know what properties are available for each component
 * - Properties need descriptions, valid options, and categories
 * - Templates provide discoverability and sensible defaults
 * 
 * SOLUTION:
 * - PropertyTemplate defines structure for a single property
 * - ComponentTemplate defines a complete component type with all its properties
 * - Templates are static and don't need to be persisted to manifest
 * 
 * @security-critical false
 * @performance-critical false - Templates are static, loaded once
 */

/**
 * Categories for grouping properties in the UI
 * 
 * CATEGORIES:
 * - basics: Core content properties (text, content, label, etc.)
 * - styling: Visual appearance (variant, size, alignment, etc.)
 * - behavior: Interactive behavior (disabled, required, etc.)
 * - advanced: Less common properties (custom attributes, etc.)
 */
export type PropertyCategory = 'basics' | 'styling' | 'behavior' | 'advanced';

/**
 * Supported data types for template properties
 * 
 * Note: 'enum' is a special type that renders as a dropdown
 * with predefined options. The actual stored value is a string.
 */
export type TemplateDataType = 'string' | 'number' | 'boolean' | 'enum';

/**
 * Option definition for enum-type properties
 * 
 * Provides both the stored value and a human-readable label.
 * The label is displayed in dropdown menus while the value is stored.
 * 
 * @example
 * { value: 'primary', label: 'Primary' }
 * { value: 'sm', label: 'Small' }
 */
export interface EnumOption {
  /** Stored value (e.g., 'primary', 'sm', 'left') */
  value: string;
  /** Human-readable label (e.g., 'Primary', 'Small', 'Left aligned') */
  label: string;
}

/**
 * Defines a single property template
 * 
 * Property templates provide metadata for auto-populating
 * the property panel and helping users understand what
 * properties are available and what they do.
 * 
 * USAGE:
 * When a component is created, templates are used to:
 * 1. Create default properties with sensible values
 * 2. Show descriptions in the property panel
 * 3. Render enum properties as dropdowns with labels
 * 4. Group properties by category
 * 
 * @example
 * ```typescript
 * const labelProperty: PropertyTemplate = {
 *   name: 'label',
 *   dataType: 'string',
 *   default: 'Click me',
 *   description: 'Text displayed on the button',
 *   required: true,
 *   category: 'basics',
 * };
 * ```
 */
export interface PropertyTemplate {
  /** 
   * Property name (used as key in component.properties)
   * Must be a valid JavaScript identifier (e.g., 'label', 'onClick')
   */
  name: string;
  
  /**
   * Data type for the property
   * - 'string': Text input
   * - 'number': Number input
   * - 'boolean': Checkbox
   * - 'enum': Dropdown with predefined options
   */
  dataType: TemplateDataType;
  
  /**
   * Default value for the property
   * Type should match dataType:
   * - string: 'Click me'
   * - number: 0
   * - boolean: false
   * - enum: 'primary' (one of the option values)
   */
  default: string | number | boolean;
  
  /**
   * Available options for enum-type properties
   * Required when dataType is 'enum', ignored otherwise
   * 
   * @example
   * [
   *   { value: 'primary', label: 'Primary' },
   *   { value: 'secondary', label: 'Secondary' },
   * ]
   */
  options?: EnumOption[];
  
  /**
   * Human-readable description shown in the property panel
   * Should explain what the property does and how to use it
   * 
   * @example 'Text displayed on the button'
   */
  description: string;
  
  /**
   * Whether this property is required
   * Required properties are marked with an indicator in the UI
   */
  required: boolean;
  
  /**
   * Category for grouping in the property panel
   * Properties are grouped and displayed by category
   */
  category: PropertyCategory;
  
  /**
   * Placeholder text for input fields
   * Shown when the input is empty
   * 
   * @example 'https://example.com/image.jpg'
   */
  placeholder?: string;
}

/**
 * Categories for component grouping in the component palette
 * 
 * CATEGORIES:
 * - basic: Simple elements (button, text, image, link)
 * - layout: Container elements (div, section, card, grid)
 * - form: Form inputs (input, textarea, select, checkbox)
 * - display: Display-only elements (badge, avatar, divider)
 */
export type ComponentCategory = 'basic' | 'layout' | 'form' | 'display';

/**
 * Defines a complete component template
 * 
 * Component templates provide:
 * - Component metadata (name, icon, category)
 * - Default properties with full template information
 * - Default Tailwind classes for styling
 * 
 * Templates are registered in TemplateRegistry and looked up
 * when components are created via manifestStore.addComponent().
 * 
 * @example
 * ```typescript
 * const buttonTemplate: ComponentTemplate = {
 *   type: 'button',
 *   displayName: 'Button',
 *   icon: 'cursor-click',
 *   category: 'basic',
 *   properties: [labelProperty, variantProperty, ...],
 *   defaultClasses: ['px-4', 'py-2', 'rounded'],
 * };
 * ```
 */
export interface ComponentTemplate {
  /**
   * Component type identifier (HTML element name or special type)
   * Must be a valid HTML element, React component name, or special type like 'text' or 'icon'
   * Used as the key in TemplateRegistry
   * 
   * Special types:
   * - 'text': Renders as dynamic element based on `as` prop (p, h1-h6, span)
   * - 'icon': Renders as Heroicons component
   * - 'checkbox': Renders as input[type=checkbox]
   * 
   * @example 'button', 'div', 'input', 'text', 'icon'
   */
  type: string;
  
  /**
   * Human-readable display name
   * Shown in the component palette and add dialog
   * 
   * @example 'Button', 'Container', 'Text'
   */
  displayName: string;
  
  /**
   * Icon identifier for the component
   * Used in the component palette and tree view
   * Should match a Heroicons name (without suffix)
   * 
   * @example 'cursor-click', 'square-2-stack', 'document-text'
   */
  icon: string;
  
  /**
   * Category for grouping in the component palette
   */
  category: ComponentCategory;
  
  /**
   * Property templates for this component
   * Each property will be pre-populated when the component is created
   */
  properties: PropertyTemplate[];
  
  /**
   * Default inline styles as CSS properties
   * These are REAL CSS properties that get applied via style attribute
   * 
   * @example { padding: '8px 16px', backgroundColor: '#3b82f6' }
   */
  defaultStyles?: Record<string, string>;
  
  /**
   * Default Tailwind classes applied to the component
   * Used for interactive states (hover, focus) and other Tailwind utilities
   * 
   * @example ['hover:bg-blue-600', 'focus:ring-2', 'transition-colors']
   */
  defaultClasses: string[];
  
  /**
   * Description of the component (optional)
   * Shown in component palette tooltips
   */
  description?: string;
}

/**
 * Result of building defaults from a template
 * Used by manifestStore.addComponent() to create new components
 */
export interface TemplateDefaults {
  /**
   * Default properties as a record
   * Ready to be used as component.properties
   */
  properties: Record<string, {
    type: 'static';
    dataType: string;
    value: string | number | boolean;
  }>;
  
  /**
   * Default styling configuration
   */
  styling: {
    /** Tailwind classes for interactive states (hover, focus, etc.) */
    baseClasses: string[];
    /** Inline CSS styles as key-value pairs */
    inlineStyles?: Record<string, string>;
  };
}
