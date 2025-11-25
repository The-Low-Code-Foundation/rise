/**
 * @file ConsoleEntry.tsx
 * @description Component for rendering individual console log entries
 * 
 * Displays a single console log entry with appropriate styling based on type
 * (log, info, warn, error, table, group, etc.). Handles timestamps, group
 * indentation, and multiple arguments.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Handles all console types correctly
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/components/Console/types.ts - ConsoleEntry type
 * 
 * @security-critical false
 * @performance-critical true - Rendered for every console log
 */

import React from 'react';
import {
  ChatBubbleLeftIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  TableCellsIcon,
  FolderIcon,
  ClockIcon,
  BugAntIcon,
} from '@heroicons/react/20/solid';
import type { ConsoleEntry as ConsoleEntryType, ConsoleMethod } from './types';
import { ObjectTree } from './ObjectTree';
import { ConsoleTable } from './ConsoleTable';
import { StackTrace } from './StackTrace';

/**
 * Props for ConsoleEntry component
 */
interface ConsoleEntryProps {
  /** Console entry data */
  entry: ConsoleEntryType;
  
  /** Optional style (for react-window virtual scrolling) */
  style?: React.CSSProperties;
  
  /** Whether to show timestamps */
  showTimestamps?: boolean;
}

/**
 * Get icon component for console method
 */
function getMethodIcon(method: ConsoleMethod) {
  switch (method) {
    case 'error':
      return XCircleIcon;
    case 'warn':
      return ExclamationTriangleIcon;
    case 'info':
      return InformationCircleIcon;
    case 'table':
      return TableCellsIcon;
    case 'group':
    case 'groupCollapsed':
      return FolderIcon;
    case 'time':
    case 'timeLog':
    case 'timeEnd':
      return ClockIcon;
    case 'trace':
      return BugAntIcon;
    default:
      return ChatBubbleLeftIcon;
  }
}

/**
 * Get styling classes for console method
 */
function getMethodStyles(method: ConsoleMethod): {
  container: string;
  icon: string;
} {
  switch (method) {
    case 'error':
      return {
        container: 'bg-red-50 border-l-4 border-red-500',
        icon: 'text-red-600',
      };
    case 'warn':
      return {
        container: 'bg-orange-50 border-l-4 border-orange-500',
        icon: 'text-orange-600',
      };
    case 'info':
      return {
        container: 'bg-blue-50 border-l-4 border-blue-500',
        icon: 'text-blue-600',
      };
    case 'table':
      return {
        container: 'bg-purple-50',
        icon: 'text-purple-600',
      };
    case 'group':
    case 'groupCollapsed':
      return {
        container: 'bg-green-50',
        icon: 'text-green-600',
      };
    case 'time':
    case 'timeLog':
    case 'timeEnd':
      return {
        container: 'bg-indigo-50',
        icon: 'text-indigo-600',
      };
    case 'trace':
      return {
        container: 'bg-pink-50',
        icon: 'text-pink-600',
      };
    default:
      return {
        container: 'bg-white',
        icon: 'text-gray-600',
      };
  }
}

/**
 * Format timestamp for display
 */
function formatTimestamp(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * ConsoleEntry Component
 * 
 * Renders a single console log entry with:
 * - Type-specific icon and styling
 * - Optional timestamp
 * - Group indentation
 * - Multiple arguments (primitives or objects)
 * - Special rendering for tables and stack traces
 * 
 * USAGE:
 * ```tsx
 * <ConsoleEntry
 *   entry={logEntry}
 *   showTimestamps={true}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns Rendered console entry
 */
export function ConsoleEntry({
  entry,
  style,
  showTimestamps = false,
}: ConsoleEntryProps) {
  const Icon = getMethodIcon(entry.method);
  const styles = getMethodStyles(entry.method);
  
  // Calculate indentation for nested groups
  const indentPx = entry.groupLevel * 16;
  
  return (
    <div
      style={style}
      className={`px-3 py-2 border-b border-gray-200 font-mono text-xs ${styles.container}`}
    >
      <div className="flex items-start gap-2" style={{ paddingLeft: `${indentPx}px` }}>
        {/* Icon */}
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        
        {/* Timestamp (optional) */}
        {showTimestamps && (
          <span className="text-gray-500 text-[10px] flex-shrink-0">
            {formatTimestamp(entry.timestamp)}
          </span>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Group header */}
          {(entry.method === 'group' || entry.method === 'groupCollapsed') && (
            <div className="font-semibold text-gray-700">
              {entry.groupLabel || 'Group'}
            </div>
          )}
          
          {/* Count */}
          {entry.method === 'count' && entry.countLabel && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{entry.countLabel}:</span>
              <span className="font-semibold text-blue-600">{entry.countValue}</span>
            </div>
          )}
          
          {/* Timer */}
          {(entry.method === 'timeLog' || entry.method === 'timeEnd') && entry.timerId && (
            <div className="flex items-center gap-2">
              <span className="text-gray-700">{entry.timerId}:</span>
              {entry.duration !== undefined && (
                <span className="font-semibold text-indigo-600">
                  {entry.duration.toFixed(2)}ms
                </span>
              )}
            </div>
          )}
          
          {/* Table */}
          {entry.method === 'table' && entry.tableData && (
            <ConsoleTable data={entry.tableData} />
          )}
          
          {/* Regular arguments */}
          {entry.method !== 'table' && 
           entry.method !== 'group' && 
           entry.method !== 'groupCollapsed' &&
           entry.method !== 'count' &&
           entry.method !== 'time' &&
           entry.args.length > 0 && (
            <div className="flex flex-wrap items-start gap-2">
              {entry.args.map((arg, index) => (
                <div key={index} className="inline-block">
                  <ObjectTree value={arg} />
                </div>
              ))}
            </div>
          )}
          
          {/* Stack trace (for error/trace) */}
          {entry.stack && entry.stack.length > 0 && (
            <div className="mt-2">
              <StackTrace frames={entry.stack} />
            </div>
          )}
          
          {/* Empty log message */}
          {entry.args.length === 0 && 
           entry.method !== 'group' && 
           entry.method !== 'groupCollapsed' &&
           entry.method !== 'count' &&
           entry.method !== 'time' &&
           !entry.tableData && (
            <span className="text-gray-400 italic">(empty)</span>
          )}
        </div>
      </div>
    </div>
  );
}
