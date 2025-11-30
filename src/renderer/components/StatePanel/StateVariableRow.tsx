/**
 * @file StateVariableRow.tsx
 * @description Individual state variable row with edit/delete actions
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows patterns from PropertyRow
 * 
 * @see src/renderer/components/StatePanel/StatePanel.tsx - Parent component
 * @see src/core/logic/types.ts - StateVariable type
 * 
 * PROBLEM SOLVED:
 * - Display individual state variable with type indicator
 * - Inline edit capability for initial value
 * - Delete action with confirmation
 * 
 * SOLUTION:
 * - Compact row design with type badge (S/N/B)
 * - Hover-reveal edit/delete actions
 * - Inline editing for quick changes
 * 
 * @performance O(1) render
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { StateVariable, StateVariableType } from '../../../core/logic/types';
import { useLogicStore } from '../../store/logicStore';

// ============================================================
// TYPES
// ============================================================

interface StateVariableRowProps {
  /** Variable name (key in pageState) */
  name: string;
  /** Variable definition */
  variable: StateVariable;
}

// ============================================================
// TYPE BADGE CONFIG
// ============================================================

/**
 * Type badge configuration
 * Shows S (String), N (Number), B (Boolean) with appropriate colors
 */
const TYPE_BADGE_CONFIG: Record<StateVariableType, { 
  label: string; 
  bg: string; 
  text: string; 
}> = {
  string: { label: 'S', bg: 'bg-green-100', text: 'text-green-700' },
  number: { label: 'N', bg: 'bg-blue-100', text: 'text-blue-700' },
  boolean: { label: 'B', bg: 'bg-purple-100', text: 'text-purple-700' },
};

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * StateVariableRow - Displays a single state variable
 * 
 * Shows variable name, type badge, initial value.
 * Edit/delete actions appear on hover.
 * 
 * @param props - Component props
 * @returns StateVariableRow component
 * 
 * @example
 * <StateVariableRow name="clickCount" variable={{ type: 'number', initialValue: 0 }} />
 */
export function StateVariableRow({ name, variable }: StateVariableRowProps) {
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string | number | boolean>(variable.initialValue);
  
  // Store actions
  const updateStateVariable = useLogicStore((state) => state.updateStateVariable);
  const deleteStateVariable = useLogicStore((state) => state.deleteStateVariable);
  
  // Get type badge configuration
  const typeBadge = TYPE_BADGE_CONFIG[variable.type];
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle starting edit mode
   */
  const handleStartEdit = () => {
    setEditValue(variable.initialValue);
    setIsEditing(true);
  };
  
  /**
   * Handle canceling edit
   */
  const handleCancelEdit = () => {
    setEditValue(variable.initialValue);
    setIsEditing(false);
  };
  
  /**
   * Handle saving edited value
   */
  const handleSaveEdit = () => {
    // Convert value based on type
    let finalValue: string | number | boolean = editValue;
    
    if (variable.type === 'number') {
      finalValue = parseFloat(String(editValue)) || 0;
    } else if (variable.type === 'boolean') {
      finalValue = editValue === 'true' || editValue === true;
    }
    
    updateStateVariable(name, { initialValue: finalValue });
    setIsEditing(false);
  };
  
  /**
   * Handle delete with confirmation
   */
  const handleDelete = () => {
    if (window.confirm(`Delete state variable "${name}"?\n\nThis may break any logic flows or components that reference this variable.`)) {
      deleteStateVariable(name);
    }
  };
  
  /**
   * Handle key press in edit mode
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <div className="px-4 py-3 hover:bg-gray-50 group transition-colors">
      {/* Top row: Type badge + Name */}
      <div className="flex items-center gap-2 mb-1">
        {/* Type Badge */}
        <span 
          className={`
            text-xs font-bold px-1.5 py-0.5 rounded 
            ${typeBadge.bg} ${typeBadge.text}
          `}
          title={`Type: ${variable.type}`}
        >
          {typeBadge.label}
        </span>
        
        {/* Variable Name */}
        <span className="text-sm font-medium text-gray-900 font-mono">
          {name}
        </span>
        
        {/* Actions (visible on hover) */}
        {!isEditing && (
          <div className="flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={handleStartEdit}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-blue-500 transition-colors"
              title="Edit initial value"
            >
              <PencilIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-red-500 transition-colors"
              title="Delete variable"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
      
      {/* Bottom row: Value display or edit */}
      {isEditing ? (
        // Edit mode
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-500">Initial:</span>
          
          {variable.type === 'boolean' ? (
            // Boolean select
            <select
              value={String(editValue)}
              onChange={(e) => setEditValue(e.target.value === 'true')}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          ) : variable.type === 'number' ? (
            // Number input
            <input
              type="number"
              value={editValue as number}
              onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          ) : (
            // String input
            <input
              type="text"
              value={editValue as string}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              autoFocus
            />
          )}
          
          {/* Save/Cancel buttons */}
          <button
            onClick={handleSaveEdit}
            className="p-1 rounded hover:bg-green-100 text-green-600 transition-colors"
            title="Save"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancelEdit}
            className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors"
            title="Cancel"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        // Display mode
        <div className="text-xs text-gray-500 pl-6">
          Initial: {formatValue(variable.initialValue, variable.type)}
        </div>
      )}
    </div>
  );
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Format value for display
 * 
 * @param value - The value to format
 * @param type - The variable type
 * @returns Formatted string representation
 */
function formatValue(value: string | number | boolean, type: StateVariableType): string {
  if (type === 'string') {
    // Show strings in quotes, truncate if too long
    const str = String(value);
    if (str.length > 30) {
      return `"${str.substring(0, 30)}..."`;
    }
    return `"${str}"`;
  }
  
  if (type === 'boolean') {
    return String(value);
  }
  
  // Number
  return String(value);
}

export default StateVariableRow;
