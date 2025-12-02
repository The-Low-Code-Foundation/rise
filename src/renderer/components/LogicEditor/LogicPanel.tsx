/**
 * @file LogicPanel.tsx
 * @description Container component for the Logic tab in the editor panel
 * 
 * REFACTORED: Changed from flexbox to CSS Grid for reliable height handling.
 * 
 * LAYOUT STRUCTURE (when canvas shown):
 * ┌────────────────────────────────────────┐
 * │ Flow Selector (auto, optional)         │ ← grid-rows: auto
 * ├────────────────────────────────────────┤
 * │                                        │
 * │ Logic Canvas (fills remaining)         │ ← grid-rows: 1fr
 * │                                        │
 * └────────────────────────────────────────┘
 * 
 * @architecture Phase 4, Task 4.1 - React Flow Integration
 * @created 2025-11-29
 * @updated 2025-11-30 - Refactored to CSS Grid for height fix (Task 3.8)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - CSS Grid layout for reliable height handling
 * 
 * @see src/renderer/components/EditorPanel.tsx - Parent
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Child
 * @see .implementation/phase-4-logic-editor/task-4.1-react-flow-integration.md
 * 
 * PROBLEM SOLVED:
 * - Provides entry point for logic editing in the editor panel
 * - Handles flow selection and creation
 * - Shows appropriate empty states
 * - FIXED: Proper height propagation with CSS Grid
 * 
 * SOLUTION:
 * - CSS Grid with grid-rows-[auto_1fr] for flow selector + canvas
 * - Container that manages flow selection
 * - Renders LogicCanvas when a flow is active
 * - Shows empty states for no component or no flows
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect } from 'react';
import { LogicCanvas } from './LogicCanvas';
import { useLogicStore } from '../../store/logicStore';
import { useManifestStore } from '../../store/manifestStore';
import { PlusIcon } from '@heroicons/react/24/outline';

// ============================================================
// COMPONENT
// ============================================================

/**
 * LogicPanel - Container for the logic editing experience
 * 
 * This component handles:
 * 1. Checking if a component is selected
 * 2. Finding flows for the selected component
 * 3. Selecting/creating flows
 * 4. Rendering the appropriate view (canvas or empty state)
 * 
 * STATES:
 * - No component selected: prompt to select
 * - Component selected, no flows: prompt to create
 * - Component selected, has flows: show canvas
 * 
 * USAGE:
 * ```tsx
 * <Tab.Panel>
 *   <LogicPanel />
 * </Tab.Panel>
 * ```
 */
export function LogicPanel() {
  // Get selected component from manifest store
  const selectedComponentId = useManifestStore((state) => state.selectedComponentId);
  const selectedComponent = useManifestStore((state) => 
    selectedComponentId ? state.manifest?.components[selectedComponentId] : null
  );

  // Get logic store state
  const activeFlowId = useLogicStore((state) => state.activeFlowId);
  const flows = useLogicStore((state) => state.flows);
  const createFlow = useLogicStore((state) => state.createFlow);
  const setActiveFlow = useLogicStore((state) => state.setActiveFlow);
  const getFlowsForComponent = useLogicStore((state) => state.getFlowsForComponent);

  // Get flows for selected component
  const componentFlows = selectedComponentId 
    ? getFlowsForComponent(selectedComponentId) 
    : [];

  // Auto-select first flow when component changes (must be before any returns!)
  const firstFlowId = componentFlows[0]?.id || null;
  useEffect(() => {
    // Check if we need to switch flows:
    // 1. There's a first flow available
    // 2. AND either:
    //    - No active flow is set, OR
    //    - Active flow doesn't exist anymore, OR
    //    - Active flow belongs to a different component (not in componentFlows)
    const activeFlowBelongsToComponent = activeFlowId && componentFlows.some(f => f.id === activeFlowId);

    if (firstFlowId && (!activeFlowId || !flows[activeFlowId] || !activeFlowBelongsToComponent)) {
      setActiveFlow(firstFlowId);
    }
  }, [firstFlowId, activeFlowId, flows, setActiveFlow, componentFlows]);

  // If no component selected, show selection prompt
  if (!selectedComponentId || !selectedComponent) {
    return <NoComponentSelectedState />;
  }

  // If component has no flows, show create prompt
  if (componentFlows.length === 0) {
    return (
      <NoFlowsState 
        componentName={selectedComponent.displayName}
        onCreateFlow={() => createFlow(selectedComponentId)}
      />
    );
  }

  // Show loading while auto-selecting
  if (!activeFlowId || !flows[activeFlowId]) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <p className="text-sm text-gray-500">Loading flow...</p>
      </div>
    );
  }

  // Render canvas with flow selector if multiple flows
  // Use CSS Grid for reliable height handling
  // - When selector shown: grid-rows-[auto_1fr] (selector auto, canvas fills)
  // - When selector hidden: grid-rows-[1fr] (canvas fills all)
  const hasSelector = componentFlows.length > 1;
  
  return (
    <div 
      className={`h-full w-full grid overflow-hidden ${
        hasSelector ? 'grid-rows-[auto_1fr]' : 'grid-rows-[1fr]'
      }`}
    >
      {/* Flow selector (if multiple flows) - auto height */}
      {hasSelector && (
        <FlowSelector 
          flows={componentFlows}
          activeFlowId={activeFlowId}
          onSelectFlow={setActiveFlow}
        />
      )}

      {/* Canvas - fills remaining space */}
      {/* h-full w-full ensures canvas fills grid cell */}
      {activeFlowId && (
        <div className="h-full w-full overflow-hidden">
          <LogicCanvas flowId={activeFlowId} />
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

/**
 * Empty state when no component is selected
 */
function NoComponentSelectedState() {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">🎯</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          Select a Component
        </h3>
        <p className="text-sm text-gray-500">
          Select a component from the tree to add or edit its logic flows.
        </p>
      </div>
    </div>
  );
}

/**
 * Empty state when component has no flows
 */
interface NoFlowsStateProps {
  componentName: string;
  onCreateFlow: () => void;
}

function NoFlowsState({ componentName, onCreateFlow }: NoFlowsStateProps) {
  return (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-3">⚡</div>
        <h3 className="text-lg font-medium text-gray-700 mb-2">
          No Logic for "{componentName}"
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Add an onClick handler to make this component interactive.
        </p>
        <button
          onClick={onCreateFlow}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          Add onClick Handler
        </button>
      </div>
    </div>
  );
}

/**
 * Flow selector dropdown for components with multiple flows
 */
interface FlowSelectorProps {
  flows: Array<{ id: string; name: string }>;
  activeFlowId: string | null;
  onSelectFlow: (flowId: string) => void;
}

function FlowSelector({ flows, activeFlowId, onSelectFlow }: FlowSelectorProps) {
  return (
    <div className="px-4 py-2 bg-white border-b border-gray-200 flex items-center gap-2">
      <label className="text-sm text-gray-600">Flow:</label>
      <select
        value={activeFlowId || ''}
        onChange={(e) => onSelectFlow(e.target.value)}
        className="text-sm border border-gray-300 rounded px-2 py-1 bg-white"
      >
        {flows.map((flow) => (
          <option key={flow.id} value={flow.id}>
            {flow.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LogicPanel;
