/**
 * @file types.ts
 * @description Type definitions for console system
 * 
 * Defines all types for console entries, serialized values, and console state.
 * Used throughout the console capture and display system.
 * 
 * @architecture Phase 1, Task 1.4C - Console Capture
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive type system for console
 * 
 * TYPE CATEGORIES:
 * - SerializedValue: Represents any JavaScript value in serializable form
 * - ConsoleEntry: A single console log entry with metadata
 * - ConsoleFilter: Filter types for console panel
 * - ConsoleState: Overall console state in previewStore
 * 
 * DESIGN DECISIONS:
 * - Use discriminated unions for type-safe serialized values
 * - Track group nesting with groupId/groupLevel
 * - Store timers separately for console.time() tracking
 * - Support up to 10,000 log entries with LRU eviction
 * 
 * @see .implementation/phase-1-application-shell/task-1.4C-console-capture.md
 * 
 * @security-critical false
 * @performance-critical true - Efficient serialization is key
 */

/**
 * Type of console method that was called
 */
export type ConsoleMethod =
  | 'log'
  | 'info'
  | 'warn'
  | 'error'
  | 'debug'
  | 'trace'
  | 'table'
  | 'group'
  | 'groupCollapsed'
  | 'groupEnd'
  | 'time'
  | 'timeLog'
  | 'timeEnd'
  | 'assert'
  | 'count'
  | 'countReset'
  | 'clear'
  | 'dir'
  | 'dirxml';

/**
 * Serialized representation of JavaScript values
 * 
 * Uses discriminated union for type safety and efficient rendering.
 * Handles all JavaScript types including edge cases.
 */
export type SerializedValue =
  | { type: 'string'; value: string }
  | { type: 'number'; value: number }
  | { type: 'boolean'; value: boolean }
  | { type: 'null' }
  | { type: 'undefined' }
  | { type: 'bigint'; value: string } // Stored as string to avoid precision loss
  | { type: 'symbol'; value: string } // Symbol description
  | { type: 'function'; value: string } // Function signature
  | { type: 'array'; value: SerializedValue[]; length: number }
  | { type: 'object'; value: Record<string, SerializedValue>; constructor: string }
  | { type: 'error'; message: string; stack?: string; name: string }
  | { type: 'date'; value: string } // ISO string
  | { type: 'regexp'; value: string } // Regex source and flags
  | { type: 'map'; entries: Array<[SerializedValue, SerializedValue]> }
  | { type: 'set'; values: SerializedValue[] }
  | { type: 'weakmap' } // Cannot inspect
  | { type: 'weakset' } // Cannot inspect
  | { type: 'promise'; state: 'pending' | 'fulfilled' | 'rejected' }
  | { type: 'arraybuffer'; byteLength: number }
  | { type: 'typedarray'; typeName: string; length: number }
  | { type: 'dom'; tagName: string; id?: string; className?: string }
  | { type: 'circular'; path: string } // Reference to circular object
  | { type: 'truncated'; reason: string }; // For huge objects/arrays

/**
 * Table data for console.table()
 * 
 * Represents tabular data with column headers and row data.
 */
export interface TableData {
  /** Column headers (property names) */
  columns: string[];
  
  /** Row data - each row is an object with column values */
  rows: Array<{
    /** Row index or key */
    _index: string | number;
    
    /** Column values */
    [column: string]: SerializedValue | string | number;
  }>;
}

/**
 * Stack trace frame
 * 
 * Represents one frame in a call stack (from Error.stack or console.trace)
 */
export interface StackFrame {
  /** Function or method name (if available) */
  functionName?: string;
  
  /** File path */
  fileName?: string;
  
  /** Line number */
  lineNumber?: number;
  
  /** Column number */
  columnNumber?: number;
  
  /** Raw stack line (if parsing failed) */
  raw?: string;
}

/**
 * Console entry representing a single console call
 * 
 * Stores all information needed to render the log entry,
 * including arguments, timing, grouping, and metadata.
 */
export interface ConsoleEntry {
  /** Unique ID for this entry */
  id: string;
  
  /** Timestamp when logged */
  timestamp: Date;
  
  /** Console method that was called */
  method: ConsoleMethod;
  
  /** Serialized arguments passed to console method */
  args: SerializedValue[];
  
  /** Stack trace (for error, trace, or when captureStackTrace enabled) */
  stack?: StackFrame[];
  
  /** Group ID this entry belongs to (for nested groups) */
  groupId?: string;
  
  /** Nesting level (0 = top level, 1+ = inside group(s)) */
  groupLevel: number;
  
  /** Group label (for group/groupCollapsed entries) */
  groupLabel?: string;
  
  /** Whether group is collapsed by default (groupCollapsed vs group) */
  groupCollapsed?: boolean;
  
  /** Timer ID (for time/timeLog/timeEnd entries) */
  timerId?: string;
  
  /** Duration in milliseconds (for timeEnd entries) */
  duration?: number;
  
  /** Counter label (for count/countReset entries) */
  countLabel?: string;
  
  /** Count value (for count entries) */
  countValue?: number;
  
  /** Table data (for table entries) */
  tableData?: TableData;
}

/**
 * Filter type for console panel
 */
export type ConsoleFilter = 'all' | ConsoleMethod;

/**
 * Group state for tracking nested console.group()
 * 
 * Maintains group hierarchy and collapse state.
 */
export interface GroupState {
  /** Unique group ID */
  id: string;
  
  /** Group label */
  label: string;
  
  /** Parent group ID (null for top-level) */
  parentId: string | null;
  
  /** Nesting level */
  level: number;
  
  /** Whether group is collapsed in UI */
  collapsed: boolean;
  
  /** Is this a groupCollapsed (starts collapsed) */
  startCollapsed: boolean;
}

/**
 * Timer state for console.time() tracking
 */
export interface TimerState {
  /** Timer label */
  label: string;
  
  /** Start timestamp */
  startTime: number;
}

/**
 * Counter state for console.count() tracking
 */
export interface CounterState {
  /** Counter label */
  label: string;
  
  /** Current count value */
  count: number;
}

/**
 * Console state in previewStore
 * 
 * Manages all console logs, filters, groups, timers, and UI state.
 */
export interface ConsoleState {
  /** All log entries (max 10,000, oldest dropped) */
  logs: ConsoleEntry[];
  
  /** Maximum number of log entries to store */
  maxLogs: number;
  
  /** Current filter selection */
  filter: ConsoleFilter;
  
  /** Search query string */
  searchQuery: string;
  
  /** Whether to auto-scroll to bottom on new logs */
  autoScroll: boolean;
  
  /** Whether to show timestamps in UI */
  showTimestamps: boolean;
  
  /** Active groups (for nesting) */
  groups: Map<string, GroupState>;
  
  /** Active timers (for console.time) */
  timers: Map<string, TimerState>;
  
  /** Active counters (for console.count) */
  counters: Map<string, CounterState>;
  
  /** Current group ID (for new entries) */
  currentGroupId: string | null;
  
  /** Current nesting level */
  currentGroupLevel: number;
  
  /** UI: which groups are collapsed */
  collapsedGroups: Set<string>;
  
  /** UI: which object paths are expanded */
  expandedPaths: Set<string>;
}

/**
 * Message from iframe console to parent
 * 
 * Sent via postMessage from injected console script.
 */
export interface ConsoleMessage {
  /** Message type identifier */
  type: 'console';
  
  /** Console method that was called */
  method: ConsoleMethod;
  
  /** Serialized arguments */
  args: SerializedValue[];
  
  /** Stack trace (if available) */
  stack?: StackFrame[];
  
  /** Timestamp when logged */
  timestamp: number;
  
  /** Additional metadata */
  metadata?: {
    /** Timer ID */
    timerId?: string;
    
    /** Duration (for timeEnd) */
    duration?: number;
    
    /** Group label */
    groupLabel?: string;
    
    /** Group collapsed state */
    groupCollapsed?: boolean;
    
    /** Counter label */
    countLabel?: string;
    
    /** Count value */
    countValue?: number;
    
    /** Table data */
    tableData?: TableData;
  };
}

/**
 * Serialization options
 * 
 * Controls how values are serialized to prevent performance issues.
 */
export interface SerializationOptions {
  /** Maximum depth for nested objects */
  maxDepth: number;
  
  /** Maximum number of properties per object */
  maxProperties: number;
  
  /** Maximum array length before truncation */
  maxArrayLength: number;
  
  /** Maximum string length before truncation */
  maxStringLength: number;
  
  /** Set of already-seen objects (for circular reference detection) */
  seen?: WeakSet<object>;
  
  /** Current depth in recursion */
  currentDepth?: number;
  
  /** Path to current value (for circular reference messages) */
  currentPath?: string;
}

/**
 * Default serialization options
 * 
 * Balanced for performance and usability.
 */
export const DEFAULT_SERIALIZATION_OPTIONS: SerializationOptions = {
  maxDepth: 10,
  maxProperties: 100,
  maxArrayLength: 1000,
  maxStringLength: 10000,
};

/**
 * Get type-specific icon name for console method
 * 
 * Used by ConsoleEntry to show appropriate icon.
 */
export function getConsoleIcon(method: ConsoleMethod): string {
  switch (method) {
    case 'error':
      return 'XCircleIcon';
    case 'warn':
      return 'ExclamationTriangleIcon';
    case 'info':
      return 'InformationCircleIcon';
    case 'table':
      return 'TableCellsIcon';
    case 'group':
    case 'groupCollapsed':
      return 'FolderIcon';
    case 'time':
    case 'timeLog':
    case 'timeEnd':
      return 'ClockIcon';
    case 'trace':
      return 'BugAntIcon';
    default:
      return 'ChatBubbleLeftIcon';
  }
}

/**
 * Get color class for console method
 * 
 * Used for type-specific styling.
 */
export function getConsoleColor(method: ConsoleMethod): string {
  switch (method) {
    case 'error':
      return 'text-red-600';
    case 'warn':
      return 'text-orange-600';
    case 'info':
      return 'text-blue-600';
    case 'table':
      return 'text-purple-600';
    case 'group':
    case 'groupCollapsed':
      return 'text-green-600';
    case 'time':
    case 'timeLog':
    case 'timeEnd':
      return 'text-indigo-600';
    case 'trace':
    return 'text-pink-600';
    default:
      return 'text-gray-600';
  }
}
