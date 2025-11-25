/**
 * @file index.ts
 * @description Console component exports
 * 
 * Central export point for all console-related components.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 */

// Main panel (primary export)
export { ConsolePanel } from './ConsolePanel';

// Sub-components (for custom layouts if needed)
export { ConsoleToolbar } from './ConsoleToolbar';
export { ConsoleEntry } from './ConsoleEntry';
export { ConsoleFooter } from './ConsoleFooter';

// Utility components
export { ObjectTree } from './ObjectTree';
export { ConsoleTable } from './ConsoleTable';
export { StackTrace } from './StackTrace';

// Types
export type {
  ConsoleEntry as ConsoleEntryType,
  ConsoleMethod,
  ConsoleFilter,
  SerializedValue,
  StackFrame,
  TableData,
} from './types';

// Console injector (for PreviewFrame)
export { generateConsoleInjector } from './consoleInjector';
