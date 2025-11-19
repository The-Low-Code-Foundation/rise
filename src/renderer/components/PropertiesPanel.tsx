/**
 * @file PropertiesPanel.tsx
 * @description Right properties panel for editing component properties and project settings
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout (updated Task 1.3B)
 * @created 2025-11-19
 * @updated 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Shows settings when project open, placeholder otherwise
 * 
 * PROBLEM SOLVED:
 * - Provides visual structure for future property editor
 * - Shows project settings when no component selected
 * - Professional appearance maintains user confidence
 * 
 * SOLUTION:
 * - Shows ProjectSettings when project is open
 * - Informative placeholder with mockup of future UI
 * - Clear "Coming Soon" indicators for component editing
 * 
 * CURRENT STATE (Task 1.3B):
 * - ✅ Shows project settings when project open, no component selected
 * - 🔵 Component property editing coming in Phase 2 - Task 2.3
 * 
 * @performance O(1) render - delegates to child components
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { 
  CubeIcon,
  PaintBrushIcon,
  BoltIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { ProjectSettings } from './ProjectSettings';

/**
 * Properties Panel component
 * 
 * Right sidebar that shows:
 * - Project settings when project is open and no component selected (Task 1.3B)
 * - Component property editor when component selected (Phase 2)
 * - Placeholder when no project is open
 * 
 * @returns PropertiesPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="properties">
 *   <PropertiesPanel />
 * </Panel>
 * ```
 */
export function PropertiesPanel() {
  // Get current project from store
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // TODO: Get selected component when implementing Phase 2
  const selectedComponent = null;
  
  return (
    <div
      className="h-full flex flex-col bg-gray-50"
      data-panel-id="properties"
      tabIndex={-1}
    >
      {/* Panel Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <h2 className="text-sm font-semibold text-gray-900">Properties</h2>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Show project settings if project is open and no component selected */}
        {currentProject && !selectedComponent ? (
          <ProjectSettings />
        ) : !currentProject ? (
          // No project open - show message
          <div className="p-4">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                No project open
              </p>
              <p className="text-xs text-gray-400">
                Create or open a project to get started
              </p>
            </div>
          </div>
        ) : (
          // Component selected - show placeholder for Phase 2
          <div className="p-4">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-200 mb-4">
                <CubeIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Select a component to edit properties
              </p>
              <p className="text-xs text-gray-400 italic">
                Coming in Phase 2 - Task 2.3
              </p>
            </div>
          </div>
        )}

        {/* Preview of property editor interface (only show when no project) */}
        {!currentProject && (
          <div className="p-4 space-y-6 pointer-events-none opacity-50">
          {/* Component Info Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <InformationCircleIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                Component Info
              </h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Component Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                  placeholder="Button"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Component Type
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled
                >
                  <option>Button</option>
                  <option>Container</option>
                  <option>Text</option>
                </select>
              </div>
            </div>
          </section>

          {/* Properties Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BoltIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                Properties
              </h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Text
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  disabled
                  placeholder="Click me"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Variant
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  disabled
                >
                  <option>Primary</option>
                  <option>Secondary</option>
                  <option>Outline</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Size
                </label>
                <select
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  disabled
                >
                  <option>Small</option>
                  <option>Medium</option>
                  <option>Large</option>
                </select>
              </div>
              
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    disabled
                  />
                  <span>Disabled</span>
                </label>
              </div>
            </div>
          </section>

          {/* Styling Section */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <PaintBrushIcon className="w-4 h-4 text-gray-500" />
              <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                Styling
              </h3>
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Background Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="h-9 w-12 rounded border border-gray-300"
                    disabled
                  />
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded"
                    disabled
                    placeholder="#3B82F6"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Width
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    disabled
                    placeholder="auto"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    disabled
                    placeholder="auto"
                  />
                </div>
              </div>
            </div>
          </section>
          </div>
        )}

        {/* Info box (only show when no project) */}
        {!currentProject && (
          <div className="p-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Properties Panel</strong>
                <br />
                Edit component properties, styles, and event handlers. Full property editor coming in Phase 2 - Task 2.3.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
