/**
 * @file index.ts
 * @description State system exports
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 */

// Template Parser
export {
  parseTemplate,
  generateExpression,
  validateStateRefs,
  hasStateRefs,
  extractStateRefs,
} from './TemplateParser';

export type {
  TemplatePart,
  ParsedTemplate,
  ValidationResult,
} from './TemplateParser';

// Page State Runtime Generator
export {
  generateStateCode,
  generateStateUpdate,
  generateStateToggle,
  generateStateIncrement,
  generateStateDecrement,
  generateStateReset,
} from './PageStateRuntime';

export type { GeneratedStateCode } from './PageStateRuntime';
