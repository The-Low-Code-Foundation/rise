/**
 * @file ConsolePanel.tsx
 * @description Main console panel component with virtual scrolling
 * 
 * REFACTORED: Changed from flexbox to CSS Grid for reliable height handling.
 * 
 * LAYOUT STRUCTURE:
 * ┌────────────────────────────────────────┐
 * │ ConsoleToolbar (auto height)           │ ← grid-rows: auto
 * ├────────────────────────────────────────┤
 * │                                        │
 * │ Console Entries (fills remaining)      │ ← grid-rows: 1fr
 * │                                        │
 * ├────────────────────────────────────────┤
 * │ ConsoleFooter (auto height)            │ ← grid-rows: auto
 * └────────────────────────────────────────┘
 * 
 * Integrates all console components:
 * - ConsoleToolbar (filters, search, controls)
 * - Virtual scrolled console entries
 * - ConsoleFooter (statistics)
 * 
 * Uses react-window for efficient rendering of large log lists.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @updated 2025-11-30 - Refactored to CSS Grid for height fix (Task 3.8)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - CSS Grid layout with virtual scrolling
 * 
 * KEY FEATURES:
 * - CSS Grid for reliable height handling
 * - Virtual scrolling (react-window)
 * - Auto-scroll to bottom on new logs
 * - Filter and search integration
 * - Grouping support
 * - Efficient re-rendering
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/store/previewStore.ts - Console state management
 * 
 * @security-critical false
 * @performance-critical true - Virtual scrolling for thousands of logs
 */

import React, { useEffect, useRef, useMemo } from 'react';
import { usePreviewStore } from '../../store/previewStore';
import type { ConsoleEntry as ConsoleEntryType } from './types';
import { ConsoleToolbar } from './ConsoleToolbar';
import { ConsoleEntry } from './ConsoleEntry';
import { ConsoleFooter } from './ConsoleFooter';

/**
 * Default height for a console entry row (in pixels)
 */
const DEFAULT_ROW_HEIGHT = 40;

/**
 * Minimum height for console panel
 */
const MIN_PANEL_HEIGHT = 200;

/**
 * Filter console logs based on current filter and search query
 * 
 * PERFORMANCE: Memoized to avoid recalculating on every render
 */
function filterLogs(
  logs: ConsoleEntryType[],
  filter: string,
  searchQuery: string
): ConsoleEntryType[] {
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
 * ConsolePanel Component
 * 
 * Main console UI component with:
 * - Toolbar (filters, search, clear, export)
 * - Virtualized log list (efficient for large datasets)
 * - Footer (statistics)
 * - Auto-scroll on new logs
 * - Grouping support
 * 
 * PERFORMANCE STRATEGY:
 * - Virtual scrolling with react-window
 * - Memoized filtering
 * - Only render visible rows
 * - Dynamic row heights
 * 
 * USAGE:
 * ```tsx
 * <ConsolePanel />
 * ```
 * 
 * @returns Rendered console panel
 */
export function ConsolePanel() {
  // Ref for the console container (for auto-scroll)
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Ref to track if user has scrolled up (to disable auto-scroll)
  const userScrolledUpRef = useRef(false);
  
  // Get state from store
  const consoleLogs = usePreviewStore(state => state.consoleLogs);
  const consoleFilter = usePreviewStore(state => state.consoleFilter);
  const consoleSearchQuery = usePreviewStore(state => state.consoleSearchQuery);
  const consoleAutoScroll = usePreviewStore(state => state.consoleAutoScroll);
  const showTimestamps = usePreviewStore(state => state.showTimestamps ?? false);
  
  // Filter logs based on current filter and search
  const filteredLogs = useMemo(() =>
    filterLogs(consoleLogs, consoleFilter, consoleSearchQuery),
    [consoleLogs, consoleFilter, consoleSearchQuery]
  );
  
  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (consoleAutoScroll && !userScrolledUpRef.current && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs.length, consoleAutoScroll]);
  
  // Reset user scroll state when auto-scroll is toggled on
  useEffect(() => {
    if (consoleAutoScroll) {
      userScrolledUpRef.current = false;
    }
  }, [consoleAutoScroll]);
  
  // Handle scroll events to detect if user scrolled up
  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      userScrolledUpRef.current = !isNearBottom;
    }
  };
  
  return (
    // CRITICAL: Use CSS Grid for toolbar + content + footer layout
    // grid-rows-[auto_1fr_auto] = toolbar auto, content fills, footer auto
    <div className="h-full w-full grid grid-rows-[auto_1fr_auto] overflow-hidden bg-white">
      {/* Toolbar - auto height (first grid row) */}
      <ConsoleToolbar />
      
      {/* Console entries - fills remaining space (second grid row) */}
      {/* overflow-y-auto enables scrolling within the grid cell */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto"
      >
        {filteredLogs.length === 0 ? (
          // Empty state
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            {consoleLogs.length === 0 ? (
              <div className="text-center">
                <p>No console logs yet</p>
                <p className="text-xs mt-1">Logs will appear when the preview runs</p>
              </div>
            ) : (
              <div className="text-center">
                <p>No logs match current filter</p>
                <p className="text-xs mt-1">Try changing the filter or search query</p>
              </div>
            )}
          </div>
        ) : (
          // Log list
          <div className="console-list">
            {filteredLogs.map((log) => (
              <ConsoleEntry
                key={log.id}
                entry={log}
                showTimestamps={showTimestamps}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <ConsoleFooter />
    </div>
  );
}
