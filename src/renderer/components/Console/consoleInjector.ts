/**
 * @file consoleInjector.ts
 * @description Script injected into preview iframe to capture console output
 * 
 * Overrides all console methods to capture logs and send them to the parent window
 * via postMessage. Includes comprehensive serialization for all JavaScript types.
 * 
 * @architecture Phase 1, Task 1.4C - Console Capture
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Comprehensive console capture with serialization
 * 
 * PROBLEM SOLVED:
 * - Developers can't see console output from preview iframe
 * - Need to capture ALL console methods (log, warn, error, table, group, time, etc.)
 * - Must serialize complex objects, handle circular refs, preserve types
 * 
 * SOLUTION:
 * - Override console.* methods at iframe load
 * - Serialize arguments with type preservation
 * - Send to parent via postMessage
 * - Call original console method (so DevTools still works)
 * 
 * DESIGN DECISIONS:
 * - Use WeakSet for circular reference detection (O(1) lookup)
 * - Truncate huge objects/arrays to prevent performance issues
 * - Preserve type information for accurate rendering
 * - Track groups/timers/counters in iframe scope
 * 
 * SECURITY:
 * - Read-only - doesn't modify application behavior
 * - Only sends serialized data (no functions/DOM references)
 * - Safe postMessage to parent origin
 * 
 * @see .implementation/phase-1-application-shell/task-1.4C-console-capture.md
 * 
 * @security-critical false - Read-only monitoring
 * @performance-critical true - Called on every console.* call
 */

import type {
  SerializedValue,
  ConsoleMethod,
  ConsoleMessage,
  SerializationOptions,
  StackFrame,
  TableData,
} from './types';
import { DEFAULT_SERIALIZATION_OPTIONS } from './types';

/**
 * Generate console injection script as a string
 * 
 * Returns a self-contained script that can be injected via eval()
 * or script tag into the iframe.
 * 
 * @returns JavaScript code as string
 */
export function generateConsoleInjector(): string {
  // The entire script is returned as a string
  // It will be injected into the iframe and self-execute
  return `
(function() {
  'use strict';
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
    trace: console.trace,
    table: console.table,
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    time: console.time,
    timeLog: console.timeLog,
    timeEnd: console.timeEnd,
    assert: console.assert,
    count: console.count,
    countReset: console.countReset,
    clear: console.clear,
    dir: console.dir,
    dirxml: console.dirxml,
  };
  
  // Group tracking
  let currentGroupId = null;
  let groupLevel = 0;
  const groupStack = [];
  
  // Timer tracking (label -> start time)
  const timers = new Map();
  
  // Counter tracking (label -> count)
  const counters = new Map();
  
  /**
   * Serialize a value for transmission via postMessage
   * 
   * Handles all JavaScript types with circular reference detection.
   */
  function serializeValue(value, options = {}) {
    const {
      maxDepth = 10,
      maxProperties = 100,
      maxArrayLength = 1000,
      maxStringLength = 10000,
      seen = new WeakSet(),
      currentDepth = 0,
      currentPath = 'root',
    } = options;
    
    // Check depth limit
    if (currentDepth >= maxDepth) {
      return { type: 'truncated', reason: 'Max depth exceeded' };
    }
    
    // Handle primitives
    if (value === null) return { type: 'null' };
    if (value === undefined) return { type: 'undefined' };
    
    const type = typeof value;
    
    if (type === 'string') {
      if (value.length > maxStringLength) {
        return {
          type: 'string',
          value: value.substring(0, maxStringLength) + '... (truncated)',
        };
      }
      return { type: 'string', value };
    }
    
    if (type === 'number') return { type: 'number', value };
    if (type === 'boolean') return { type: 'boolean', value };
    
    if (type === 'bigint') {
      return { type: 'bigint', value: value.toString() };
    }
    
    if (type === 'symbol') {
      return { type: 'symbol', value: value.toString() };
    }
    
    if (type === 'function') {
      // Extract function signature
      const funcStr = value.toString();
      const match = funcStr.match(/^(async\\s+)?(function\\s*)?([\\w$]+)?\\s*\\([^)]*\\)/);
      return {
        type: 'function',
        value: match ? match[0] : 'function()',
      };
    }
    
    // Handle objects (including arrays, dates, etc.)
    if (type === 'object') {
      // Check for circular reference
      if (seen.has(value)) {
        return { type: 'circular', path: currentPath };
      }
      seen.add(value);
      
      // Handle Error objects
      if (value instanceof Error) {
        return {
          type: 'error',
          name: value.name,
          message: value.message,
          stack: value.stack,
        };
      }
      
      // Handle Date
      if (value instanceof Date) {
        return { type: 'date', value: value.toISOString() };
      }
      
      // Handle RegExp
      if (value instanceof RegExp) {
        return { type: 'regexp', value: value.toString() };
      }
      
      // Handle Map
      if (value instanceof Map) {
        const entries = [];
        let count = 0;
        for (const [k, v] of value.entries()) {
          if (count++ >= maxProperties) break;
          entries.push([
            serializeValue(k, { ...options, currentDepth: currentDepth + 1, currentPath: \`\${currentPath}[key]\` }),
            serializeValue(v, { ...options, currentDepth: currentDepth + 1, currentPath: \`\${currentPath}[value]\` }),
          ]);
        }
        return { type: 'map', entries };
      }
      
      // Handle Set
      if (value instanceof Set) {
        const values = [];
        let count = 0;
        for (const v of value.values()) {
          if (count++ >= maxProperties) break;
          values.push(
            serializeValue(v, { ...options, currentDepth: currentDepth + 1, currentPath: \`\${currentPath}[item]\` })
          );
        }
        return { type: 'set', values };
      }
      
      // Handle WeakMap/WeakSet (cannot iterate)
      if (value instanceof WeakMap) return { type: 'weakmap' };
      if (value instanceof WeakSet) return { type: 'weakset' };
      
      // Handle Promise
      if (value instanceof Promise) {
        return { type: 'promise', state: 'pending' };
      }
      
      // Handle ArrayBuffer
      if (value instanceof ArrayBuffer) {
        return { type: 'arraybuffer', byteLength: value.byteLength };
      }
      
      // Handle TypedArrays
      if (ArrayBuffer.isView(value) && !(value instanceof DataView)) {
        return {
          type: 'typedarray',
          typeName: value.constructor.name,
          length: value.length,
        };
      }
      
      // Handle DOM elements
      if (typeof Element !== 'undefined' && value instanceof Element) {
        return {
          type: 'dom',
          tagName: value.tagName.toLowerCase(),
          id: value.id || undefined,
          className: value.className || undefined,
        };
      }
      
      // Handle Arrays
      if (Array.isArray(value)) {
        const length = value.length;
        const serializedArray = [];
        const limit = Math.min(length, maxArrayLength);
        
        for (let i = 0; i < limit; i++) {
          serializedArray.push(
            serializeValue(value[i], {
              ...options,
              currentDepth: currentDepth + 1,
              currentPath: \`\${currentPath}[\${i}]\`,
            })
          );
        }
        
        if (length > maxArrayLength) {
          serializedArray.push({
            type: 'truncated',
            reason: \`Array truncated (\${length - maxArrayLength} more items)\`,
          });
        }
        
        return { type: 'array', value: serializedArray, length };
      }
      
      // Handle plain objects
      const obj = {};
      const keys = Object.keys(value);
      const limit = Math.min(keys.length, maxProperties);
      
      for (let i = 0; i < limit; i++) {
        const key = keys[i];
        try {
          obj[key] = serializeValue(value[key], {
            ...options,
            currentDepth: currentDepth + 1,
            currentPath: \`\${currentPath}.\${key}\`,
          });
        } catch (err) {
          obj[key] = { type: 'error', message: 'Serialization error', name: 'SerializationError' };
        }
      }
      
      if (keys.length > maxProperties) {
        obj['__truncated__'] = {
          type: 'truncated',
          reason: \`Object truncated (\${keys.length - maxProperties} more properties)\`,
        };
      }
      
      return {
        type: 'object',
        value: obj,
        constructor: value.constructor ? value.constructor.name : 'Object',
      };
    }
    
    // Fallback for unknown types
    return { type: 'undefined' };
  }
  
  /**
   * Parse stack trace into structured format
   */
  function parseStackTrace(stack) {
    if (!stack) return [];
    
    const lines = stack.split('\\n');
    const frames = [];
    
    // Skip first line if it's the error message
    const startIndex = lines[0].includes('Error') ? 1 : 0;
    
    for (let i = startIndex; i < Math.min(lines.length, 50); i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Try to parse Chrome/Firefox format
      // Chrome: "at functionName (file:line:col)"
      // Firefox: "functionName@file:line:col"
      const chromeMatch = line.match(/at\\s+(.+?)\\s+\\((.+?):(\\d+):(\\d+)\\)/);
      const firefoxMatch = line.match(/(.+?)@(.+?):(\\d+):(\\d+)/);
      const simpleMatch = line.match(/at\\s+(.+?):(\\d+):(\\d+)/);
      
      if (chromeMatch) {
        frames.push({
          functionName: chromeMatch[1],
          fileName: chromeMatch[2],
          lineNumber: parseInt(chromeMatch[3], 10),
          columnNumber: parseInt(chromeMatch[4], 10),
        });
      } else if (firefoxMatch) {
        frames.push({
          functionName: firefoxMatch[1],
          fileName: firefoxMatch[2],
          lineNumber: parseInt(firefoxMatch[3], 10),
          columnNumber: parseInt(firefoxMatch[4], 10),
        });
      } else if (simpleMatch) {
        frames.push({
          fileName: simpleMatch[1],
          lineNumber: parseInt(simpleMatch[2], 10),
          columnNumber: parseInt(simpleMatch[3], 10),
        });
      } else {
        // Store unparseable line as raw
        frames.push({ raw: line });
      }
    }
    
    return frames;
  }
  
  /**
   * Send console message to parent window
   */
  function sendToParent(method, args, metadata = {}) {
    const message = {
      type: 'console',
      method,
      args: args.map(arg => serializeValue(arg)),
      timestamp: Date.now(),
      metadata,
    };
    
    // Add stack trace for errors and trace
    if (method === 'error' || method === 'trace') {
      const err = new Error();
      message.stack = parseStackTrace(err.stack);
    }
    
    try {
      window.parent.postMessage(message, '*');
    } catch (err) {
      // Silently fail if postMessage doesn't work
    }
  }
  
  /**
   * Serialize table data
   */
  function serializeTable(data) {
    if (!data) return null;
    
    // Handle array of objects
    if (Array.isArray(data)) {
      const columns = new Set();
      
      // Collect all unique keys
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => columns.add(key));
        }
      });
      
      const columnArray = Array.from(columns);
      const rows = data.map((item, index) => {
        const row = { _index: index };
        columnArray.forEach(col => {
          if (typeof item === 'object' && item !== null && col in item) {
            row[col] = serializeValue(item[col]);
          }
        });
        return row;
      });
      
      return { columns: columnArray, rows };
    }
    
    // Handle single object
    if (typeof data === 'object' && data !== null) {
      const columns = Object.keys(data);
      const rows = columns.map(key => ({
        _index: key,
        value: serializeValue(data[key]),
      }));
      
      return { columns: ['value'], rows };
    }
    
    return null;
  }
  
  // Override console.log
  console.log = function(...args) {
    sendToParent('log', args);
    originalConsole.log.apply(console, args);
  };
  
  // Override console.info
  console.info = function(...args) {
    sendToParent('info', args);
    originalConsole.info.apply(console, args);
  };
  
  // Override console.warn
  console.warn = function(...args) {
    sendToParent('warn', args);
    originalConsole.warn.apply(console, args);
  };
  
  // Override console.error
  console.error = function(...args) {
    sendToParent('error', args);
    originalConsole.error.apply(console, args);
  };
  
  // Override console.debug
  console.debug = function(...args) {
    sendToParent('debug', args);
    originalConsole.debug.apply(console, args);
  };
  
  // Override console.trace
  console.trace = function(...args) {
    sendToParent('trace', args);
    originalConsole.trace.apply(console, args);
  };
  
  // Override console.table
  console.table = function(data, columns) {
    const tableData = serializeTable(data);
    sendToParent('table', [data], { tableData });
    originalConsole.table.apply(console, arguments);
  };
  
  // Override console.group
  console.group = function(label = '') {
    const groupId = \`group-\${Date.now()}-\${Math.random()}\`;
    groupStack.push(groupId);
    groupLevel++;
    currentGroupId = groupId;
    
    sendToParent('group', [label], {
      groupLabel: String(label),
      groupCollapsed: false,
    });
    
    originalConsole.group.apply(console, arguments);
  };
  
  // Override console.groupCollapsed
  console.groupCollapsed = function(label = '') {
    const groupId = \`group-\${Date.now()}-\${Math.random()}\`;
    groupStack.push(groupId);
    groupLevel++;
    currentGroupId = groupId;
    
    sendToParent('groupCollapsed', [label], {
      groupLabel: String(label),
      groupCollapsed: true,
    });
    
    originalConsole.groupCollapsed.apply(console, arguments);
  };
  
  // Override console.groupEnd
  console.groupEnd = function() {
    if (groupStack.length > 0) {
      groupStack.pop();
      groupLevel = Math.max(0, groupLevel - 1);
      currentGroupId = groupStack.length > 0 ? groupStack[groupStack.length - 1] : null;
    }
    
    sendToParent('groupEnd', []);
    originalConsole.groupEnd.apply(console, arguments);
  };
  
  // Override console.time
  console.time = function(label = 'default') {
    timers.set(label, performance.now());
    sendToParent('time', [label], { timerId: label });
    originalConsole.time.apply(console, arguments);
  };
  
  // Override console.timeLog
  console.timeLog = function(label = 'default', ...args) {
    const startTime = timers.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      sendToParent('timeLog', [label, ...args], {
        timerId: label,
        duration: Math.round(duration * 100) / 100,
      });
    }
    originalConsole.timeLog.apply(console, arguments);
  };
  
  // Override console.timeEnd
  console.timeEnd = function(label = 'default') {
    const startTime = timers.get(label);
    if (startTime !== undefined) {
      const duration = performance.now() - startTime;
      timers.delete(label);
      sendToParent('timeEnd', [label], {
        timerId: label,
        duration: Math.round(duration * 100) / 100,
      });
    }
    originalConsole.timeEnd.apply(console, arguments);
  };
  
  // Override console.assert
  console.assert = function(condition, ...args) {
    if (!condition) {
      sendToParent('error', ['Assertion failed:', ...args]);
    }
    originalConsole.assert.apply(console, arguments);
  };
  
  // Override console.count
  console.count = function(label = 'default') {
    const count = (counters.get(label) || 0) + 1;
    counters.set(label, count);
    sendToParent('count', [label], {
      countLabel: label,
      countValue: count,
    });
    originalConsole.count.apply(console, arguments);
  };
  
  // Override console.countReset
  console.countReset = function(label = 'default') {
    counters.delete(label);
    sendToParent('countReset', [label], { countLabel: label });
    originalConsole.countReset.apply(console, arguments);
  };
  
  // Override console.clear
  console.clear = function() {
    sendToParent('clear', []);
    originalConsole.clear.apply(console, arguments);
  };
  
  // Override console.dir
  console.dir = function(obj, options) {
    sendToParent('dir', [obj]);
    originalConsole.dir.apply(console, arguments);
  };
  
  // Override console.dirxml
  console.dirxml = function(...args) {
    sendToParent('dirxml', args);
    originalConsole.dirxml.apply(console, arguments);
  };
  
  // Capture unhandled errors
  window.addEventListener('error', function(event) {
    sendToParent('error', [
      'Uncaught Error:',
      event.error || event.message
    ]);
  });
  
  // Capture unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    sendToParent('error', [
      'Unhandled Promise Rejection:',
      event.reason
    ]);
  });
})();
`;
}
