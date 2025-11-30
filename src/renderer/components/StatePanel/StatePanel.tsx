/**
 * @file StatePanel.tsx
 * @description Page state variable management panel for the Navigator
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows established patterns from ComponentTree and PropertyEditor
 * 
 * @see src/renderer/store/logicStore.ts - State management
 * @see src/core/logic/types.ts - Type definitions
 * @see .implementation/phase-4-logic-editor/task-4.3-page-state-system.md
 * 
 * PROBLEM SOLVED:
 * - UI for managing page-level reactive state variables
 * - Shows in Navigator panel as third tab (Files | Components | State)
 * - Enables users to define state that flows/components can use
 * 
 * SOLUTION:
 * - List of state variables with type indicators
 * - Add/Edit/Delete functionality with validation
 * - Helpful hint about template syntax {{state.varName}}
 * 
 * LEVEL 1.5 CONSTRAINTS:
 * - Only page-level state (no global/app state)
 * - Only string, number, boolean types
 * - Only static initial values
 * 
 * @performance O(n) where n = number of state variables
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import { PlusIcon, VariableIcon } from '@heroicons/react/24/outline';
import { useLogicStore } from '../../store/logicStore';
import { StateVariableRow } from './StateVariableRow';
import { AddStateDialog } from './AddStateDialog';

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * StatePanel - Manages page state variables
 * 
 * Displays a list of all state variables with type indicators
 * and allows users to add, edit, and delete them.
 * 
 * @returns StatePanel component
 * 
 * @example
 * <StatePanel />
 */
export function StatePanel() {
  // Dialog state for adding new variables
  const [showAddDialog, setShowAddDialog] = useState(false);
  
  // Get page state from the logic store
  const pageState = useLogicStore((state) => state.pageState);
  
  // Convert pageState object to array for rendering
  // Sort alphabetically by variable name for consistent display
  const stateVariables = Object.entries(pageState).sort((a, b) => 
    a[0].localeCompare(b[0])
  );
  
  // Count for the tab badge
  const variableCount = stateVariables.length;
  
  return (
    <div className="flex flex-col h-full">
      {/* Header with Add button */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Page State
          </h3>
          
          {/* Add Variable Button */}
          <button
            onClick={() => setShowAddDialog(true)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Add state variable"
          >
            <PlusIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Helpful hint about template syntax */}
        <p className="text-xs text-gray-500">
          Use <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-600 font-mono">
            {'{{state.varName}}'}
          </code> in component text
        </p>
      </div>
      
      {/* State Variables List */}
      <div className="flex-1 overflow-y-auto">
        {variableCount === 0 ? (
          // Empty state
          <EmptyState onAdd={() => setShowAddDialog(true)} />
        ) : (
          // Variable list
          <div className="divide-y divide-gray-100">
            {stateVariables.map(([name, variable]) => (
              <StateVariableRow
                key={name}
                name={name}
                variable={variable}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Footer with count */}
      {variableCount > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-500">
            {variableCount} variable{variableCount !== 1 ? 's' : ''} defined
          </p>
        </div>
      )}
      
      {/* Add State Dialog */}
      <AddStateDialog
        isOpen={showAddDialog}
        onClose={() => setShowAddDialog(false)}
      />
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================

interface EmptyStateProps {
  onAdd: () => void;
}

/**
 * EmptyState - Shown when no state variables exist
 * 
 * Provides a friendly message and CTA to create first variable.
 */
function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Icon */}
      <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <VariableIcon className="w-6 h-6 text-blue-500" />
      </div>
      
      {/* Message */}
      <h4 className="text-sm font-medium text-gray-900 mb-1">
        No State Variables
      </h4>
      <p className="text-xs text-gray-500 mb-4 max-w-xs">
        Create state variables to store data that your components and logic flows can use.
      </p>
      
      {/* Add button */}
      <button
        onClick={onAdd}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded hover:bg-blue-600 transition-colors"
      >
        <PlusIcon className="w-4 h-4" />
        Add Variable
      </button>
    </div>
  );
}

export default StatePanel;
