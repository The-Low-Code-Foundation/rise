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
  InformationCircleIcon,
  CalendarIcon,
  UserIcon,
  TagIcon,
} from '@heroicons/react/24/outline';
import { useProjectStore } from '../store/projectStore';
import { useManifestStore } from '../store/manifestStore';
import { ProjectSettings } from './ProjectSettings';
import { ComponentIcon } from './ComponentTree';

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
  
  // Get selected component from manifest store (Phase 2, Task 2.1 - Milestone 3)
  const selectedComponentId = useManifestStore((state) => state.selectedComponentId);
  const getComponent = useManifestStore((state) => state.getComponent);
  const selectedComponent = selectedComponentId ? getComponent(selectedComponentId) : null;
  
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
        ) : selectedComponent ? (
          // Component selected - show component details (Phase 2, Task 2.1 - Milestone 3)
          <div className="p-4 space-y-6">
            {/* Component Info Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <InformationCircleIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Component Info
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* Component Icon and Name */}
                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
                  <ComponentIcon component={selectedComponent} className="w-6 h-6 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {selectedComponent.displayName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {selectedComponent.type}
                    </p>
                  </div>
                </div>

                {/* Component ID */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Component ID
                  </label>
                  <div className="px-3 py-2 text-xs font-mono text-gray-600 bg-gray-50 border border-gray-200 rounded">
                    {selectedComponent.id}
                  </div>
                </div>

                {/* Category */}
                {selectedComponent.category && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      <TagIcon className="w-3 h-3 inline mr-1" />
                      Category
                    </label>
                    <div className="px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded">
                      {selectedComponent.category}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Metadata Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CalendarIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Metadata
                </h3>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">
                    {new Date(selectedComponent.metadata.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Updated</span>
                  <span className="text-gray-900">
                    {new Date(selectedComponent.metadata.updatedAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-200">
                  <span className="text-gray-600">Author</span>
                  <span className="flex items-center gap-1 text-gray-900">
                    <UserIcon className="w-3 h-3" />
                    {selectedComponent.metadata.author === 'ai' ? 'AI Generated' : 'User'}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-600">Version</span>
                  <span className="text-gray-900">{selectedComponent.metadata.version}</span>
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
              
              {Object.keys(selectedComponent.properties).length > 0 ? (
                <div className="space-y-2">
                  {Object.entries(selectedComponent.properties).map(([key, prop]) => (
                    <div key={key} className="p-3 bg-white border border-gray-200 rounded">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-gray-700">{key}</span>
                        <span className="text-xs text-gray-500 uppercase">{prop.type}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        {prop.type === 'static' && (
                          <div className="font-mono bg-gray-50 px-2 py-1 rounded">
                            {typeof prop.value === 'string' 
                              ? `"${prop.value}"` 
                              : String(prop.value)}
                          </div>
                        )}
                        {prop.type === 'prop' && (
                          <div className="space-y-1">
                            <div>Type: <span className="font-mono">{prop.dataType}</span></div>
                            <div>Required: {prop.required ? 'Yes' : 'No'}</div>
                            {prop.default !== undefined && (
                              <div>Default: <span className="font-mono">{String(prop.default)}</span></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic py-2">No properties defined</p>
              )}
            </section>

            {/* Styling Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <PaintBrushIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Styling
                </h3>
              </div>
              
              <div className="space-y-3">
                {/* Base Classes */}
                {selectedComponent.styling.baseClasses.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Base Classes
                    </label>
                    <div className="flex flex-wrap gap-1">
                      {selectedComponent.styling.baseClasses.map((className, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 border border-blue-200 rounded"
                        >
                          {className}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditional Classes */}
                {selectedComponent.styling.conditionalClasses?.container && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Conditional Classes
                    </label>
                    <div className="space-y-1">
                      {selectedComponent.styling.conditionalClasses.container.map((expr, index) => (
                        <div
                          key={index}
                          className="px-2 py-1 text-xs font-mono bg-purple-50 text-purple-700 border border-purple-200 rounded"
                        >
                          {expr}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Custom CSS */}
                {selectedComponent.styling.customCSS && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-2">
                      Custom CSS
                    </label>
                    <pre className="px-3 py-2 text-xs font-mono bg-gray-50 border border-gray-200 rounded overflow-x-auto">
                      {selectedComponent.styling.customCSS}
                    </pre>
                  </div>
                )}

                {selectedComponent.styling.baseClasses.length === 0 && 
                 !selectedComponent.styling.conditionalClasses &&
                 !selectedComponent.styling.customCSS && (
                  <p className="text-xs text-gray-500 italic py-2">No styling defined</p>
                )}
              </div>
            </section>

            {/* Children Section */}
            <section>
              <div className="flex items-center gap-2 mb-3">
                <CubeIcon className="w-4 h-4 text-gray-500" />
                <h3 className="text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Children
                </h3>
              </div>
              
              {selectedComponent.children.length > 0 ? (
                <div className="text-xs text-gray-900">
                  {selectedComponent.children.length} child component{selectedComponent.children.length !== 1 ? 's' : ''}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic">No children</p>
              )}
            </section>

            {/* Info Box */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-900 leading-relaxed">
                <strong>Property Editing</strong>
                <br />
                Full property editor with inline editing coming in Task 2.3. Currently showing read-only component details.
              </p>
            </div>
          </div>
        ) : null}

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
