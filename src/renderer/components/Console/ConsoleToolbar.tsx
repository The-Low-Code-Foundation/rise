/**
 * @file ConsoleToolbar.tsx
 * @description Toolbar component for console filtering and controls
 * 
 * Provides filter buttons, search input, clear, export, and auto-scroll controls.
 * Updates console state through previewStore actions.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard toolbar with filters and controls
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/store/previewStore.ts - Console actions
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback } from 'react';
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  ArrowsUpDownIcon,
} from '@heroicons/react/20/solid';
import type { ConsoleFilter } from './types';
import { usePreviewStore } from '../../store/previewStore';

/**
 * Filter button configuration
 */
interface FilterButton {
  id: ConsoleFilter;
  label: string;
  color: string;
  hoverColor: string;
}

/**
 * Available filter buttons
 */
const FILTER_BUTTONS: FilterButton[] = [
  { id: 'all', label: 'All', color: 'text-gray-700', hoverColor: 'hover:bg-gray-200' },
  { id: 'log', label: 'Log', color: 'text-gray-600', hoverColor: 'hover:bg-gray-100' },
  { id: 'info', label: 'Info', color: 'text-blue-600', hoverColor: 'hover:bg-blue-50' },
  { id: 'warn', label: 'Warn', color: 'text-orange-600', hoverColor: 'hover:bg-orange-50' },
  { id: 'error', label: 'Error', color: 'text-red-600', hoverColor: 'hover:bg-red-50' },
  { id: 'table', label: 'Table', color: 'text-purple-600', hoverColor: 'hover:bg-purple-50' },
];

/**
 * ConsoleToolbar Component
 * 
 * Toolbar providing console controls:
 * - Filter buttons with counts
 * - Search input (text/regex)
 * - Clear console button
 * - Export logs button
 * - Auto-scroll toggle
 * 
 * USAGE:
 * ```tsx
 * <ConsoleToolbar />
 * ```
 * 
 * @returns Rendered toolbar
 */
export function ConsoleToolbar() {
  const [searchText, setSearchText] = useState('');
  
  // Get state from store
  const consoleLogs = usePreviewStore(state => state.consoleLogs);
  const consoleFilter = usePreviewStore(state => state.consoleFilter);
  const consoleAutoScroll = usePreviewStore(state => state.consoleAutoScroll);
  
  // Get actions from store
  const setConsoleFilter = usePreviewStore(state => state.setConsoleFilter);
  const setConsoleSearchQuery = usePreviewStore(state => state.setConsoleSearchQuery);
  const clearConsole = usePreviewStore(state => state.clearConsole);
  const exportConsoleLogs = usePreviewStore(state => state.exportConsoleLogs);
  const toggleConsoleAutoScroll = usePreviewStore(state => state.toggleConsoleAutoScroll);
  
  // Calculate counts for each filter type
  const getCounts = useCallback(() => {
    const counts: Record<ConsoleFilter, number> = {
      all: consoleLogs.length,
      log: 0,
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
      trace: 0,
      table: 0,
      group: 0,
      groupCollapsed: 0,
      groupEnd: 0,
      time: 0,
      timeLog: 0,
      timeEnd: 0,
      assert: 0,
      count: 0,
      countReset: 0,
      clear: 0,
      dir: 0,
      dirxml: 0,
    };
    
    consoleLogs.forEach(log => {
      counts[log.method]++;
    });
    
    return counts;
  }, [consoleLogs]);
  
  const counts = getCounts();
  
  // Handle search input change (debounced via onChange)
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    // Simple immediate update - could add debouncing if needed
    setConsoleSearchQuery(value);
  }, [setConsoleSearchQuery]);
  
  // Handle clear button
  const handleClear = useCallback(() => {
    if (consoleLogs.length > 0) {
      if (confirm(`Clear all ${consoleLogs.length} console log(s)?`)) {
        clearConsole();
      }
    }
  }, [consoleLogs.length, clearConsole]);
  
  // Handle export
  const handleExport = useCallback((format: 'json' | 'text') => {
    exportConsoleLogs(format);
  }, [exportConsoleLogs]);
  
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-300">
      {/* Filter buttons */}
      <div className="flex items-center gap-1">
        {FILTER_BUTTONS.map(button => {
          const count = counts[button.id];
          const isActive = consoleFilter === button.id;
          
          return (
            <button
              key={button.id}
              onClick={() => setConsoleFilter(button.id)}
              className={`
                px-2 py-1 text-xs font-medium rounded transition-colors
                ${button.color}
                ${button.hoverColor}
                ${isActive ? 'bg-white shadow' : 'bg-transparent'}
              `}
              title={`Filter by ${button.label}`}
            >
              {button.label}
              {count > 0 && (
                <span className="ml-1 text-[10px] opacity-70">
                  ({count})
                </span>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Divider */}
      <div className="w-px h-6 bg-gray-300" />
      
      {/* Search */}
      <div className="flex-1 max-w-xs">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search logs..."
            className="w-full pl-8 pr-3 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* Clear */}
        <button
          onClick={handleClear}
          disabled={consoleLogs.length === 0}
          className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          title="Clear console"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
        
        {/* Export */}
        <div className="relative group">
          <button
            disabled={consoleLogs.length === 0}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            title="Export logs"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
          </button>
          
          {/* Export dropdown */}
          {consoleLogs.length > 0 && (
            <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-10">
              <button
                onClick={() => handleExport('json')}
                className="block w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100"
              >
                Export as JSON
              </button>
              <button
                onClick={() => handleExport('text')}
                className="block w-full px-3 py-1.5 text-xs text-left hover:bg-gray-100"
              >
                Export as Text
              </button>
            </div>
          )}
        </div>
        
        {/* Auto-scroll */}
        <button
          onClick={toggleConsoleAutoScroll}
          className={`
            p-1.5 rounded transition-colors
            ${consoleAutoScroll 
              ? 'text-blue-600 bg-blue-50' 
              : 'text-gray-600 hover:bg-gray-100'
            }
          `}
          title={consoleAutoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
        >
          <ArrowsUpDownIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
