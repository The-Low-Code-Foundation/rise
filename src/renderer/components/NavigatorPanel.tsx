/**
 * @file NavigatorPanel.tsx
 * @description Left navigator panel with project info and file explorer
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout (updated Task 1.3A)
 * @created 2025-11-19
 * @updated 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Integrated with file tree and project store
 * 
 * PROBLEM SOLVED:
 * - Display current project information
 * - Show project file structure with file tree
 * - Provide empty state when no project is open
 * - Quick action to create new project
 * 
 * SOLUTION:
 * - Project info section (name, path)
 * - File tree with lazy loading
 * - Empty state with CTA button
 * - Integration with projectStore
 * 
 * SECTIONS:
 * - PROJECT INFO: Current project name and path
 * - FILES: Expandable file tree
 * - EMPTY STATE: Shown when no project open
 * 
 * @performance O(1) for panel, O(n) for file tree where n = visible nodes
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback } from 'react';
import { 
  FolderIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { FileTree } from './FileTree/FileTree';

/**
 * Navigator Panel component
 * 
 * Left sidebar that displays:
 * - Current project information (when project is open)
 * - File explorer with expandable tree
 * - Search functionality for filtering files
 * - Refresh button to sync with file system
 * - Empty state with action button (when no project)
 * 
 * @returns NavigatorPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="navigator">
 *   <NavigatorPanel />
 * </Panel>
 * ```
 */
export function NavigatorPanel() {
  // Get current project from store
  const currentProject = useProjectStore((state) => state.currentProject);
  const openDialog = useProjectStore((state) => state.openDialog);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Handle search input change
   * Uses debouncing via React state - the FileTree will handle the filtering
   */
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  /**
   * Clear search query
   */
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  /**
   * Handle refresh button click
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    
    // Trigger refresh via window-stored function (from FileTree)
    const refreshFn = (window as any).__fileTreeRefresh;
    if (refreshFn && typeof refreshFn === 'function') {
      await refreshFn();
    }
    
    // Add small delay for visual feedback
    setTimeout(() => {
      setIsRefreshing(false);
    }, 300);
  }, []);

  /**
   * Callback when FileTree refresh completes
   */
  const handleRefreshComplete = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  // No project open - show empty state
  if (!currentProject) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center bg-gray-50 px-6"
        data-panel-id="navigator"
      >
        {/* Empty State */}
        <div className="max-w-sm text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <FolderIcon className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          {/* Text */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Project Open
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Create a new project or open an existing one to get started with Rise.
          </p>

          {/* Action Button */}
          <button
            onClick={openDialog}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Create New Project
          </button>

          {/* Hint */}
          <p className="mt-4 text-xs text-gray-500">
            Or use <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">Cmd+N</kbd> to create a new project
          </p>
        </div>
      </div>
    );
  }

  // Project is open - show project info and file tree
  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      data-panel-id="navigator"
      tabIndex={-1}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Navigator</h2>
      </div>

      {/* Panel Content - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Project Info Section */}
        <section className="p-4 border-b border-gray-200 bg-white">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Project
          </h3>
          <div>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {currentProject.name}
            </p>
            <p className="text-xs text-gray-500 truncate mt-0.5" title={currentProject.path}>
              {currentProject.path}
            </p>
          </div>
        </section>

        {/* Files Section */}
        <section className="flex-1 flex flex-col">
          {/* Files Header with Search and Refresh */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                Files
              </h3>
              
              {/* Refresh Button */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`
                  p-1 rounded hover:bg-gray-100 transition-colors
                  ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title="Refresh file tree (⌘R)"
              >
                <ArrowPathIcon 
                  className={`
                    w-4 h-4 text-gray-600
                    ${isRefreshing ? 'animate-spin' : ''}
                  `}
                />
              </button>
            </div>
            
            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search files... (*.tsx, /regex/)"
                className="
                  w-full pl-8 pr-8 py-1.5 text-sm
                  border border-gray-300 rounded
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-400
                "
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-2 flex items-center hover:bg-gray-100 rounded-r"
                  title="Clear search"
                >
                  <XMarkIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Search hint */}
            {!searchQuery && (
              <p className="mt-1.5 text-xs text-gray-500">
                Supports wildcards (* ?) and regex (/pattern/)
              </p>
            )}
          </div>
          
          {/* File Tree */}
          <div className="flex-1 overflow-y-auto p-4">
            <FileTree 
              projectPath={currentProject.path}
              searchQuery={searchQuery}
              onRefreshComplete={handleRefreshComplete}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
