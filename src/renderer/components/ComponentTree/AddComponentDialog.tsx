/**
 * @file AddComponentDialog.tsx
 * @description Dialog for adding new components to the manifest
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI (Milestone 4)
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Simple form dialog
 * 
 * PROBLEM SOLVED:
 * - Need UI for adding components to tree
 * - Validation of component names
 * - Type and category selection
 * - Parent component context
 * 
 * SOLUTION:
 * - Modal dialog with form
 * - Common component types (button, div, text, etc.)
 * - Category dropdown
 * - Auto-focus on name input
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback } from 'react';
import { Modal } from '../Modal';

/**
 * Component type options - simplified for MVP
 * 
 * 10 CORE ELEMENTS (matches componentTemplates.ts):
 * - div: Container / layout wrapper
 * - text: Universal text (renders as p, h1-h6, or span via 'as' prop)
 * - button: Clickable button
 * - input: Text input field
 * - checkbox: Checkbox input with label
 * - link: Anchor/link element
 * - image: Image element
 * - textarea: Multi-line text input
 * - icon: Icon placeholder (Heroicons)
 * - custom: Custom component
 * 
 * SPECIAL TYPES:
 * - 'text' renders as p/h1-h6/span based on 'as' property
 * - 'checkbox' is a Rise virtual type that renders as <input type="checkbox" />
 * - 'icon' placeholder for Heroicons integration
 */
const COMPONENT_TYPES = [
  // Layout
  { value: 'div', label: 'Container', description: 'Layout wrapper for grouping elements', category: 'layout' },
  
  // Basic
  { value: 'text', label: 'Text', description: 'Paragraph, heading, or span text', category: 'basic' },
  { value: 'button', label: 'Button', description: 'Clickable button element', category: 'basic' },
  { value: 'link', label: 'Link', description: 'Anchor link to navigate', category: 'basic' },
  { value: 'image', label: 'Image', description: 'Image with src and alt', category: 'basic' },
  { value: 'icon', label: 'Icon', description: 'Heroicon placeholder', category: 'basic' },
  
  // Form
  { value: 'input', label: 'Text Input', description: 'Single-line text input', category: 'form' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text input', category: 'form' },
  { value: 'checkbox', label: 'Checkbox', description: 'Checkbox with label', category: 'form' },
  
  // Custom
  { value: 'custom', label: 'Custom', description: 'Custom component type', category: 'custom' },
];

/**
 * Category options
 */
const CATEGORIES = [
  { value: 'basic', label: 'Basic' },
  { value: 'layout', label: 'Layout' },
  { value: 'form', label: 'Form' },
  { value: 'custom', label: 'Custom' },
];

/**
 * Props for AddComponentDialog
 */
interface AddComponentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { displayName: string; type: string; category: string }) => void;
  parentName?: string; // Name of parent component (for context)
}

/**
 * AddComponentDialog Component
 * 
 * Modal dialog for adding new components.
 * Provides:
 * - Component name input
 * - Type selection
 * - Category selection
 * - Validation
 * 
 * @param isOpen - Whether dialog is visible
 * @param onClose - Callback to close dialog
 * @param onAdd - Callback with component data
 * @param parentName - Optional parent component name for context
 * 
 * @returns Dialog component
 */
export function AddComponentDialog({
  isOpen,
  onClose,
  onAdd,
  parentName,
}: AddComponentDialogProps) {
  const [displayName, setDisplayName] = useState('');
  const [type, setType] = useState('div');
  const [category, setCategory] = useState('basic');
  const [customType, setCustomType] = useState('');
  const [error, setError] = useState('');

  /**
   * Reset form state
   */
  const resetForm = useCallback(() => {
    setDisplayName('');
    setType('div');
    setCategory('basic');
    setCustomType('');
    setError('');
  }, []);

  /**
   * Handle close
   */
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  /**
   * Handle submit
   */
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate
    if (!displayName.trim()) {
      setError('Component name is required');
      return;
    }

    const finalType = type === 'custom' && customType.trim() 
      ? customType.trim() 
      : type;

    if (!finalType) {
      setError('Component type is required');
      return;
    }

    // Call callback
    onAdd({
      displayName: displayName.trim(),
      type: finalType,
      category,
    });

    // Reset and close
    resetForm();
    onClose();
  }, [displayName, type, customType, category, onAdd, onClose, resetForm]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Component">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Parent context */}
        {parentName && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
            <p className="text-blue-900">
              Adding child to: <strong>{parentName}</strong>
            </p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-900">
            {error}
          </div>
        )}

        {/* Component Name */}
        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            Component Name *
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., My Button, Hero Section"
            autoFocus
          />
        </div>

        {/* Component Type */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            Component Type *
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {COMPONENT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Type (if 'custom' selected) */}
        {type === 'custom' && (
          <div>
            <label htmlFor="customType" className="block text-sm font-medium text-gray-700 mb-1">
              Custom Type *
            </label>
            <input
              id="customType"
              type="text"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., UserCard, ProductGrid"
            />
          </div>
        )}

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {CATEGORIES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Add Component
          </button>
        </div>
      </form>
    </Modal>
  );
}
