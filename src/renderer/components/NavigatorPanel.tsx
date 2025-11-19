/**
 * @file NavigatorPanel.tsx
 * @description Left navigator panel with component tree and file explorer
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Professional placeholder, implementation in Phase 2
 * 
 * PROBLEM SOLVED:
 * - Provides visual structure for future navigator functionality
 * - Shows users what will be available in this panel
 * - Professional appearance maintains user confidence
 * 
 * SOLUTION:
 * - Informative placeholder with mockup of future UI
 * - Clear "Coming Soon" indicators
 * - Visual hierarchy matching final design
 * 
 * PLACEHOLDER for Task 2.1 - Component Tree UI
 * 
 * WILL CONTAIN:
 * - Component tree view (react-arborist)
 * - File explorer
 * - Search and filter functionality
 * - Drag and drop support
 * 
 * @performance O(1) render - static content only
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { 
  FolderIcon, 
  DocumentIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

/**
 * Navigator Panel component (placeholder)
 * 
 * Left sidebar that will contain the component tree and file explorer.
 * Currently shows a professional placeholder indicating future functionality.
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
  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      data-panel-id="navigator"
      tabIndex={-1}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900">Navigator</h2>
        {/* Search icon - placeholder */}
        <button
          className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-50"
          disabled
          title="Search (Coming Soon)"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="space-y-6">
          {/* Component Tree Section */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Component Tree
            </h3>
            
            {/* Mock tree structure to show what's coming */}
            <div className="space-y-0.5">
              {/* Root node */}
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100 cursor-pointer">
                <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                <FolderIcon className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-700">App Root</span>
              </div>
              
              {/* Child nodes - indented */}
              <div className="ml-5 space-y-0.5 opacity-75">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                  <DocumentIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Header</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                  <FolderIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-600">Main Content</span>
                </div>
                <div className="ml-5 space-y-0.5 opacity-75">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                    <DocumentIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Hero Section</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                    <DocumentIcon className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-600">Features Grid</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded hover:bg-gray-100">
                  <DocumentIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Footer</span>
                </div>
              </div>
            </div>

            {/* "Coming Soon" badge */}
            <div className="mt-3 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 italic">
              🚧 Interactive tree coming in Phase 2 - Task 2.1
            </div>
          </section>

          {/* File Explorer Section */}
          <section>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
              Files
            </h3>
            
            {/* Mock file structure */}
            <div className="space-y-0.5 opacity-50">
              <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded">
                <FolderIcon className="w-4 h-4 text-yellow-500" />
                <span className="text-gray-600">src/</span>
              </div>
              <div className="ml-5">
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-sm rounded">
                  <FolderIcon className="w-4 h-4 text-yellow-500" />
                  <span className="text-gray-600">components/</span>
                </div>
              </div>
            </div>

            {/* "Coming Soon" badge */}
            <div className="mt-3 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700 italic">
              🚧 File explorer coming in Task 1.3
            </div>
          </section>

          {/* Info box */}
          <div className="p-3 bg-gray-100 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600 leading-relaxed">
              <strong className="text-gray-900">Navigator Panel</strong>
              <br />
              Browse your component hierarchy, search for elements, and manage your project structure.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
