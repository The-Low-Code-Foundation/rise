/**
 * @file AddStateDialog.tsx
 * @description Modal dialog for creating new state variables
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Follows established Modal and Dialog patterns
 * 
 * @see src/renderer/components/Modal.tsx - Modal component
 * @see src/renderer/components/ComponentTree/AddComponentDialog.tsx - Similar pattern
 * 
 * PROBLEM SOLVED:
 * - User-friendly UI for creating new state variables
 * - Validation of variable names (valid identifier, unique)
 * - Type selection with appropriate default values
 * 
 * SOLUTION:
 * - Modal form with name, type, and initial value fields
 * - Real-time validation feedback
 * - Type-aware initial value input
 * 
 * @performance O(n) for name uniqueness check where n = existing variables
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { StateVariableType } from '../../../core/logic/types';
import { useLogicStore } from '../../store/logicStore';

// ============================================================
// TYPES
// ============================================================

interface AddStateDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Callback when dialog should close */
  onClose: () => void;
}

// ============================================================
// VALIDATION
// ============================================================

/**
 * Regex for valid JavaScript identifier
 * Must start with letter or underscore, followed by letters, numbers, or underscores
 */
const VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Reserved words that cannot be used as variable names
 */
const RESERVED_WORDS = new Set([
  'break', 'case', 'catch', 'continue', 'debugger', 'default', 'delete',
  'do', 'else', 'finally', 'for', 'function', 'if', 'in', 'instanceof',
  'new', 'return', 'switch', 'this', 'throw', 'try', 'typeof', 'var',
  'void', 'while', 'with', 'class', 'const', 'enum', 'export', 'extends',
  'import', 'super', 'implements', 'interface', 'let', 'package', 'private',
  'protected', 'public', 'static', 'yield', 'state', 'props', 'setState',
]);

/**
 * Validate variable name
 * 
 * @param name - Name to validate
 * @param existingNames - Set of existing variable names
 * @returns Error message or null if valid
 */
function validateName(name: string, existingNames: Set<string>): string | null {
  // Check for empty
  if (!name.trim()) {
    return 'Variable name is required';
  }
  
  // Check for valid identifier format
  if (!VALID_IDENTIFIER.test(name)) {
    return 'Must start with a letter or underscore, containing only letters, numbers, and underscores';
  }
  
  // Check for reserved words
  if (RESERVED_WORDS.has(name.toLowerCase())) {
    return 'This name is reserved and cannot be used';
  }
  
  // Check for duplicates
  if (existingNames.has(name)) {
    return 'A variable with this name already exists';
  }
  
  // Check length
  if (name.length > 50) {
    return 'Variable name must be 50 characters or less';
  }
  
  return null;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

/**
 * AddStateDialog - Create new state variable
 * 
 * Modal form for adding a new page state variable.
 * Validates name and provides type-appropriate initial value input.
 * 
 * @param props - Component props
 * @returns AddStateDialog component
 * 
 * @example
 * <AddStateDialog isOpen={true} onClose={() => setOpen(false)} />
 */
export function AddStateDialog({ isOpen, onClose }: AddStateDialogProps) {
  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<StateVariableType>('string');
  const [initialValue, setInitialValue] = useState<string | number | boolean>('');
  const [error, setError] = useState<string | null>(null);
  
  // Get store actions and state
  const addStateVariable = useLogicStore((state) => state.addStateVariable);
  const pageState = useLogicStore((state) => state.pageState);
  
  // Create set of existing names for validation
  const existingNames = new Set(Object.keys(pageState));
  
  // --------------------------------------------------------
  // EFFECTS
  // --------------------------------------------------------
  
  /**
   * Reset form when dialog opens/closes
   */
  useEffect(() => {
    if (isOpen) {
      // Reset all fields when opening
      setName('');
      setType('string');
      setInitialValue('');
      setError(null);
    }
  }, [isOpen]);
  
  /**
   * Update initial value when type changes
   */
  useEffect(() => {
    // Set appropriate default value for type
    switch (type) {
      case 'boolean':
        setInitialValue(false);
        break;
      case 'number':
        setInitialValue(0);
        break;
      default:
        setInitialValue('');
    }
  }, [type]);
  
  // --------------------------------------------------------
  // HANDLERS
  // --------------------------------------------------------
  
  /**
   * Handle name input change
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Clear error on input
    if (error) {
      setError(null);
    }
  };
  
  /**
   * Handle type selection change
   */
  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setType(e.target.value as StateVariableType);
  };
  
  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    const validationError = validateName(name, existingNames);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    // Add the variable
    addStateVariable(name, type, initialValue);
    
    // Close dialog
    onClose();
  };
  
  // --------------------------------------------------------
  // RENDER
  // --------------------------------------------------------
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add State Variable" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Variable Name */}
        <div>
          <label 
            htmlFor="state-name" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Variable Name
          </label>
          <input
            id="state-name"
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="e.g., clickCount, userName"
            className={`
              w-full px-3 py-2 text-sm border rounded-lg font-mono
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              ${error ? 'border-red-300 bg-red-50' : 'border-gray-300'}
            `}
            autoFocus
          />
          {error && (
            <p className="mt-1 text-xs text-red-600">{error}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Access via <code className="bg-gray-100 px-1 rounded">{'{{state.' + (name || 'varName') + '}}'}</code>
          </p>
        </div>
        
        {/* Variable Type */}
        <div>
          <label 
            htmlFor="state-type" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type
          </label>
          <select
            id="state-type"
            value={type}
            onChange={handleTypeChange}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="string">String</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {type === 'string' && 'Text values like names, messages, labels'}
            {type === 'number' && 'Numeric values like counts, amounts, indices'}
            {type === 'boolean' && 'True/false values for toggles, visibility, etc.'}
          </p>
        </div>
        
        {/* Initial Value */}
        <div>
          <label 
            htmlFor="state-initial" 
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Initial Value
          </label>
          
          {type === 'boolean' ? (
            <select
              id="state-initial"
              value={String(initialValue)}
              onChange={(e) => setInitialValue(e.target.value === 'true')}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="false">false</option>
              <option value="true">true</option>
            </select>
          ) : type === 'number' ? (
            <input
              id="state-initial"
              type="number"
              value={initialValue as number}
              onChange={(e) => setInitialValue(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <input
              id="state-initial"
              type="text"
              value={initialValue as string}
              onChange={(e) => setInitialValue(e.target.value)}
              placeholder="Enter initial value..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            The value this variable starts with when the page loads
          </p>
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Add Variable
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default AddStateDialog;
