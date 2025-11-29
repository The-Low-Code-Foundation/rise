/**
 * @file index.ts
 * @description Central exports for the templates module
 * 
 * @architecture Phase 3, Task 3.5 - Component Property Templates (Simplified)
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard module exports
 * 
 * EXPORTS:
 * - Types: PropertyTemplate, ComponentTemplate, EnumOption, etc.
 * - Templates: 10 essential component templates
 * - Style definitions: STYLE_PROPERTY_CATEGORIES, TAILWIND_CLASS_SUGGESTIONS
 * - Registry: TemplateRegistry class, templateRegistry singleton
 */

// Type exports
export type {
  PropertyCategory,
  TemplateDataType,
  EnumOption,
  PropertyTemplate,
  ComponentCategory,
  ComponentTemplate,
  TemplateDefaults,
} from './types';

// Template definitions - 10 essential elements
export {
  // Basic components (6)
  containerTemplate,
  textTemplate,
  buttonTemplate,
  linkTemplate,
  imageTemplate,
  iconTemplate,
  
  // Form components (4)
  inputTemplate,
  textareaTemplate,
  checkboxTemplate,
  selectTemplate,
  
  // Full template array
  COMPONENT_TEMPLATES,
  TEMPLATE_COUNT,
  
  // Style autocomplete data
  STYLE_PROPERTY_CATEGORIES,
  TAILWIND_CLASS_SUGGESTIONS,
} from './componentTemplates';

// Type exports from componentTemplates
export type {
  StylePropertyDef,
  StyleCategoryDef,
} from './componentTemplates';

// Registry exports
export { TemplateRegistry, templateRegistry } from './TemplateRegistry';
