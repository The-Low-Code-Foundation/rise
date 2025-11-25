/**
 * @file ConsoleFooter.tsx
 * @description Footer component showing console statistics
 * 
 * Displays total log count, filtered count, and selected log details.
 * Updates automatically based on console state.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple status bar display
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/store/previewStore.ts - Console state
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useMemo } from 'react';
import { usePreviewStore } from '../../store/previewStore';
import type { ConsoleEntry } from './types';

/**
 * Filter console logs based on current filter and search query
 */
function filterLogs(
  logs: ConsoleEntry[],
  filter: string,
  searchQuery: string
): ConsoleEntry[] {
  let filtered = logs;
  
  // Apply type filter
  if (filter !== 'all') {
    filtered = filtered.filter(log => log.method === filter);
  }
  
  // Apply search filter
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(log => {
      // Search in arguments
      const argsMatch = log.args.some(arg => {
        if (typeof arg === 'object' && arg !== null && 'value' in arg) {
          return String(arg.value).toLowerCase().includes(query);
        }
        return String(arg).toLowerCase().includes(query);
      });
      
      // Search in stack trace
      const stackMatch = log.stack?.some(frame =>
        frame.functionName?.toLowerCase().includes(query) ||
        frame.fileName?.toLowerCase().includes(query)
      );
      
      return argsMatch || stackMatch;
    });
  }
  
  return filtered;
}

/**
 * ConsoleFooter Component
 * 
 * Status bar showing:
 * - Total log count
 * - Filtered log count (if filter active)
 * - Type breakdown (errors, warnings, etc.)
 * 
 * USAGE:
 * ```tsx
 * <ConsoleFooter />
 * ```
 * 
 * @returns Rendered footer
 */
export function ConsoleFooter() {
  // Get state from store
  const consoleLogs = usePreviewStore(state => state.consoleLogs);
  const consoleFilter = usePreviewStore(state => state.consoleFilter);
  const consoleSearchQuery = usePreviewStore(state => state.consoleSearchQuery);
  
  // Calculate filtered logs
  const filteredLogs = useMemo(() =>
    filterLogs(consoleLogs, consoleFilter, consoleSearchQuery),
    [consoleLogs, consoleFilter, consoleSearchQuery]
  );
  
  // Calculate type counts
  const counts = useMemo(() => {
    const result = {
      errors: 0,
      warnings: 0,
      info: 0,
      other: 0,
    };
    
    consoleLogs.forEach(log => {
      if (log.method === 'error') {
        result.errors++;
      } else if (log.method === 'warn') {
        result.warnings++;
      } else if (log.method === 'info') {
        result.info++;
      } else {
        result.other++;
      }
    });
    
    return result;
  }, [consoleLogs]);
  
  // Format status text
  const statusText = useMemo(() => {
    const total = consoleLogs.length;
    const filtered = filteredLogs.length;
    
    if (consoleFilter !== 'all' || consoleSearchQuery) {
      return `${filtered} of ${total} logs`;
    }
    
    return `${total} logs`;
  }, [consoleLogs.length, filteredLogs.length, consoleFilter, consoleSearchQuery]);
  
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-gray-50 border-t border-gray-300 text-xs text-gray-600">
      {/* Left: Stats */}
      <div className="flex items-center gap-4">
        <span className="font-medium">{statusText}</span>
        
        {counts.errors > 0 && (
          <span className="text-red-600">
            {counts.errors} error{counts.errors !== 1 ? 's' : ''}
          </span>
        )}
        
        {counts.warnings > 0 && (
          <span className="text-orange-600">
            {counts.warnings} warning{counts.warnings !== 1 ? 's' : ''}
          </span>
        )}
        
        {counts.info > 0 && (
          <span className="text-blue-600">
            {counts.info} info
          </span>
        )}
      </div>
      
      {/* Right: Additional info */}
      <div className="text-gray-500">
        {consoleFilter !== 'all' && (
          <span>Filter: {consoleFilter}</span>
        )}
      </div>
    </div>
  );
}
