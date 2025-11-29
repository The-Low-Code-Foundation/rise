/**
 * @file TemplateRegistry.ts
 * @description Central registry for component property templates
 * 
 * @architecture Phase 3, Task 3.5 - Component Property Templates
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple registry pattern with clear responsibilities
 * 
 * @see .implementation/phase-3-code-generation-and-preview/task-3.5-component-property-templates.md
 * @see src/core/templates/componentTemplates.ts - Template definitions
 * 
 * PROBLEM SOLVED:
 * - Need centralized access to component templates
 * - Need to look up templates by component type
 * - Need to build default properties from templates
 * - Need to support future custom/user templates
 * 
 * SOLUTION:
 * - TemplateRegistry class with Map-based storage
 * - Lookup by type, category, and displayName
 * - Utility methods for building defaults
 * - Singleton instance for global access
 * 
 * USAGE:
 * ```typescript
 * import { templateRegistry } from './TemplateRegistry';
 * 
 * // Get template for a component type
 * const buttonTemplate = templateRegistry.getTemplate('button');
 * 
 * // Build default properties for a new component
 * const defaults = templateRegistry.buildDefaults('button');
 * ```
 * 
 * @security-critical false
 * @performance-critical false - Templates are static, loaded once
 */

import type {
  ComponentTemplate,
  PropertyTemplate,
  ComponentCategory,
  PropertyCategory,
  TemplateDefaults,
  EnumOption,
} from './types';
import { COMPONENT_TEMPLATES } from './componentTemplates';

/**
 * Template Registry Class
 * 
 * Manages component templates and provides:
 * - Template lookup by type
 * - Template grouping by category
 * - Default property/styling building
 * - Property template lookups for UI hints
 * 
 * DESIGN DECISIONS:
 * - Uses Map for O(1) lookup by type
 * - Singleton pattern for global access
 * - Supports future extensibility (custom templates)
 * - Separates template storage from manifest storage
 * 
 * @class TemplateRegistry
 */
export class TemplateRegistry {
  /**
   * Templates indexed by component type
   * Key: component type (e.g., 'button', 'div', 'input')
   * Value: ComponentTemplate
   */
  private templates: Map<string, ComponentTemplate>;

  /**
   * Create a new TemplateRegistry
   * 
   * Initializes with built-in templates from componentTemplates.ts.
   * Can optionally receive additional templates.
   * 
   * @param additionalTemplates - Optional array of custom templates to register
   */
  constructor(additionalTemplates?: ComponentTemplate[]) {
    this.templates = new Map();
    
    // Register all built-in templates
    this.registerBuiltinTemplates();
    
    // Register any additional templates
    if (additionalTemplates) {
      additionalTemplates.forEach((template) => {
        this.registerTemplate(template);
      });
    }
  }

  /**
   * Register all built-in component templates
   * 
   * Called during construction to populate the registry
   * with templates from componentTemplates.ts
   */
  private registerBuiltinTemplates(): void {
    COMPONENT_TEMPLATES.forEach((template) => {
      this.templates.set(template.type, template);
    });
  }

  // ===========================================================================
  // TEMPLATE LOOKUP METHODS
  // ===========================================================================

  /**
   * Get template for a component type
   * 
   * @param type - Component type (e.g., 'button', 'div', 'input')
   * @returns ComponentTemplate if found, undefined otherwise
   * 
   * @example
   * const template = registry.getTemplate('button');
   * // Returns buttonTemplate or undefined
   */
  getTemplate(type: string): ComponentTemplate | undefined {
    return this.templates.get(type);
  }

  /**
   * Check if a template exists for a type
   * 
   * @param type - Component type to check
   * @returns true if template exists, false otherwise
   * 
   * @example
   * if (registry.hasTemplate('button')) {
   *   // Template exists
   * }
   */
  hasTemplate(type: string): boolean {
    return this.templates.has(type);
  }

  /**
   * Get all registered templates
   * 
   * @returns Array of all component templates
   * 
   * @example
   * const allTemplates = registry.getAllTemplates();
   * // Returns array of 25 templates
   */
  getAllTemplates(): ComponentTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   * 
   * @param category - Component category to filter by
   * @returns Array of templates in that category
   * 
   * @example
   * const formTemplates = registry.getTemplatesByCategory('form');
   * // Returns [inputTemplate, textareaTemplate, ...]
   */
  getTemplatesByCategory(category: ComponentCategory): ComponentTemplate[] {
    return this.getAllTemplates().filter((t) => t.category === category);
  }

  /**
   * Get all unique component types
   * 
   * @returns Array of component type strings
   * 
   * @example
   * const types = registry.getAllTypes();
   * // Returns ['button', 'div', 'input', ...]
   */
  getAllTypes(): string[] {
    return Array.from(this.templates.keys());
  }

  /**
   * Get templates grouped by category
   * 
   * @returns Object with categories as keys and template arrays as values
   * 
   * @example
   * const grouped = registry.getTemplatesGroupedByCategory();
   * // Returns { basic: [...], layout: [...], form: [...], display: [...] }
   */
  getTemplatesGroupedByCategory(): Record<ComponentCategory, ComponentTemplate[]> {
    const grouped: Record<ComponentCategory, ComponentTemplate[]> = {
      basic: [],
      layout: [],
      form: [],
      display: [],
    };

    this.getAllTemplates().forEach((template) => {
      grouped[template.category].push(template);
    });

    return grouped;
  }

  // ===========================================================================
  // PROPERTY TEMPLATE LOOKUP
  // ===========================================================================

  /**
   * Get property template for a specific property of a component
   * 
   * Used by UI components to get metadata (description, options, category)
   * for displaying property editors.
   * 
   * @param componentType - Component type (e.g., 'button')
   * @param propertyName - Property name (e.g., 'variant')
   * @returns PropertyTemplate if found, undefined otherwise
   * 
   * @example
   * const propTemplate = registry.getPropertyTemplate('button', 'variant');
   * // Returns { name: 'variant', dataType: 'enum', options: [...], ... }
   */
  getPropertyTemplate(componentType: string, propertyName: string): PropertyTemplate | undefined {
    const template = this.getTemplate(componentType);
    if (!template) return undefined;

    return template.properties.find((p) => p.name === propertyName);
  }

  /**
   * Get all property templates for a component type
   * 
   * @param componentType - Component type
   * @returns Array of property templates, empty array if component not found
   * 
   * @example
   * const props = registry.getPropertyTemplates('button');
   * // Returns [labelProp, variantProp, sizeProp, ...]
   */
  getPropertyTemplates(componentType: string): PropertyTemplate[] {
    const template = this.getTemplate(componentType);
    return template?.properties || [];
  }

  /**
   * Get property templates grouped by category
   * 
   * @param componentType - Component type
   * @returns Object with property categories as keys and property arrays as values
   * 
   * @example
   * const grouped = registry.getPropertyTemplatesGroupedByCategory('button');
   * // Returns { basics: [labelProp], styling: [variantProp, sizeProp], ... }
   */
  getPropertyTemplatesGroupedByCategory(
    componentType: string
  ): Record<PropertyCategory, PropertyTemplate[]> {
    const grouped: Record<PropertyCategory, PropertyTemplate[]> = {
      basics: [],
      styling: [],
      behavior: [],
      advanced: [],
    };

    const properties = this.getPropertyTemplates(componentType);
    properties.forEach((prop) => {
      grouped[prop.category].push(prop);
    });

    return grouped;
  }

  /**
   * Get enum options for a property
   * 
   * @param componentType - Component type
   * @param propertyName - Property name
   * @returns Array of enum options, undefined if not an enum property
   * 
   * @example
   * const options = registry.getEnumOptions('button', 'variant');
   * // Returns [{ value: 'primary', label: 'Primary' }, ...]
   */
  getEnumOptions(componentType: string, propertyName: string): EnumOption[] | undefined {
    const propTemplate = this.getPropertyTemplate(componentType, propertyName);
    if (!propTemplate || propTemplate.dataType !== 'enum') {
      return undefined;
    }
    return propTemplate.options;
  }

  // ===========================================================================
  // DEFAULT BUILDING METHODS
  // ===========================================================================

  /**
   * Build default properties and styling from a template
   * 
   * Creates a TemplateDefaults object that can be used when
   * creating new components. Properties are created as StaticProperty
   * with default values from the template.
   * 
   * @param type - Component type to build defaults for
   * @returns TemplateDefaults object, or empty defaults if no template found
   * 
   * @example
   * const defaults = registry.buildDefaults('button');
   * // Returns {
   * //   properties: { label: { type: 'static', dataType: 'string', value: 'Click me' }, ... },
   * //   styling: { baseClasses: ['hover:...'], inlineStyles: { padding: '8px 16px', ... } }
   * // }
   */
  buildDefaults(type: string): TemplateDefaults {
    const template = this.getTemplate(type);

    // Return empty defaults if no template found
    if (!template) {
      return {
        properties: {},
        styling: { baseClasses: [] },
      };
    }

    // Build properties from template
    const properties: TemplateDefaults['properties'] = {};

    template.properties.forEach((prop) => {
      // For enum types, store as string
      const dataType = prop.dataType === 'enum' ? 'string' : prop.dataType;

      properties[prop.name] = {
        type: 'static',
        dataType,
        value: prop.default,
      };
    });

    // Build styling with both Tailwind classes and inline styles
    const styling: TemplateDefaults['styling'] = {
      baseClasses: [...template.defaultClasses],
    };

    // Include default inline styles if present
    if (template.defaultStyles && Object.keys(template.defaultStyles).length > 0) {
      styling.inlineStyles = { ...template.defaultStyles };
    }

    return {
      properties,
      styling,
    };
  }

  /**
   * Build only default properties (no styling)
   * 
   * @param type - Component type
   * @returns Properties record, or empty object if no template
   * 
   * @example
   * const props = registry.buildDefaultProperties('button');
   */
  buildDefaultProperties(type: string): TemplateDefaults['properties'] {
    return this.buildDefaults(type).properties;
  }

  /**
   * Build only default styling (no properties)
   * 
   * @param type - Component type
   * @returns Styling object with baseClasses array
   * 
   * @example
   * const styling = registry.buildDefaultStyling('button');
   */
  buildDefaultStyling(type: string): TemplateDefaults['styling'] {
    return this.buildDefaults(type).styling;
  }

  // ===========================================================================
  // REGISTRATION METHODS
  // ===========================================================================

  /**
   * Register a custom template
   * 
   * Allows adding custom templates at runtime.
   * If a template with the same type already exists, it will be overwritten.
   * 
   * @param template - ComponentTemplate to register
   * 
   * @example
   * registry.registerTemplate({
   *   type: 'custom-card',
   *   displayName: 'Custom Card',
   *   ...
   * });
   */
  registerTemplate(template: ComponentTemplate): void {
    this.templates.set(template.type, template);
  }

  /**
   * Unregister a template
   * 
   * Removes a template from the registry.
   * 
   * @param type - Component type to unregister
   * @returns true if template was removed, false if it didn't exist
   * 
   * @example
   * const removed = registry.unregisterTemplate('custom-card');
   */
  unregisterTemplate(type: string): boolean {
    return this.templates.delete(type);
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  /**
   * Get template count
   * 
   * @returns Number of registered templates
   */
  get count(): number {
    return this.templates.size;
  }

  /**
   * Check if registry is empty
   * 
   * @returns true if no templates registered, false otherwise
   */
  isEmpty(): boolean {
    return this.templates.size === 0;
  }

  /**
   * Search templates by display name
   * 
   * Case-insensitive search in displayName field.
   * 
   * @param query - Search query string
   * @returns Array of matching templates
   * 
   * @example
   * const results = registry.searchTemplates('button');
   * // Returns templates with 'button' in displayName
   */
  searchTemplates(query: string): ComponentTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter((template) =>
      template.displayName.toLowerCase().includes(lowerQuery) ||
      template.type.toLowerCase().includes(lowerQuery)
    );
  }
}

// ===========================================================================
// SINGLETON INSTANCE
// ===========================================================================

/**
 * Global template registry instance
 * 
 * Use this instance for all template operations throughout the app.
 * Pre-populated with all built-in templates from componentTemplates.ts.
 * 
 * @example
 * import { templateRegistry } from './TemplateRegistry';
 * 
 * const template = templateRegistry.getTemplate('button');
 * const defaults = templateRegistry.buildDefaults('button');
 */
export const templateRegistry = new TemplateRegistry();
