/**
 * @file ComponentTree.tsx
 * @description Component tree displaying manifest component hierarchy
 * 
 * @architecture Phase 2, Task 2.1 - Component Tree UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Adapted from FileTree patterns
 * 
 * PROBLEM SOLVED:
 * - Display component hierarchy from manifest
 * - Expand/collapse component nodes
 * - Select components for editing
 * - Search/filter by component name
 * - Empty state when no manifest loaded
 * 
 * SOLUTION:
 * - Subscribe to manifestStore
 * - Render flat tree (pre-computed by store)
 * - ComponentNode for each visible component
 * - Search with debouncing
 * - Empty state with helpful message
 * 
 * @performance Virtual scrolling if >50 components (future optimization)
 * @security-critical false
 * @performance-critical true - updates on every manifest change
 */

import React, { useMemo, useState, useCallback } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  XMarkIcon,
  CubeIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useManifestStore } from '../../store/manifestStore';
import { ComponentNode } from './ComponentNode';
import { AddComponentDialog } from './AddComponentDialog';
import { ContextMenu, type ContextMenuItem } from '../ContextMenu';
import type { ComponentTreeNode } from '../../../core/manifest/types';

/**
 * Component tree props
 */
interface ComponentTreeProps {
  searchQuery?: string; // External search query (from NavigatorPanel)
  onAddComponent?: () => void; // Callback to open "Add Component" dialog
}

/**
 * ComponentTree component
 * 
 * Displays the component hierarchy from the manifest store.
 * Supports:
 * - Expand/collapse nodes
 * - Select components
 * - Search/filter by name
 * - Empty state
 * 
 * The tree is computed by manifestStore.getComponentTree() which:
 * - Finds root components
 * - Recursively adds children if expanded
 * - Includes selection and expansion state
 * 
 * @param searchQuery - Optional search filter
 * @param onAddComponent - Optional callback for "Add Component" button
 * 
 * @returns ComponentTree element
 * 
 * @example
 * ```tsx
 * <ComponentTree searchQuery={searchText} />
 * ```
 */
export function ComponentTree({ 
  searchQuery = '',
  onAddComponent 
}: ComponentTreeProps) {
  // Get tree state and actions from store
  const manifest = useManifestStore((state) => state.manifest);
  const componentTree = useManifestStore((state) => state.getComponentTree());
  const toggleExpanded = useManifestStore((state) => state.toggleExpanded);
  const selectComponent = useManifestStore((state) => state.selectComponent);
  const addComponent = useManifestStore((state) => state.addComponent);
  const deleteComponent = useManifestStore((state) => state.deleteComponent);
  const duplicateComponent = useManifestStore((state) => state.duplicateComponent);
  const getComponent = useManifestStore((state) => state.getComponent);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    node: ComponentTreeNode;
  } | null>(null);

  // Add component dialog state
  const [addDialog, setAddDialog] = useState<{
    isOpen: boolean;
    parentId?: string;
    parentName?: string;
  }>({
    isOpen: false,
  });

  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  /**
   * Filter tree based on search query
   * 
   * Filters components by display name (case-insensitive).
   * Returns all components if no search query.
   */
  const filteredTree = useMemo(() => {
    if (!searchQuery.trim()) {
      return componentTree;
    }

    const query = searchQuery.toLowerCase();
    return componentTree.filter(node =>
      node.displayName.toLowerCase().includes(query) ||
      node.type.toLowerCase().includes(query)
    );
  }, [componentTree, searchQuery]);

  /**
   * Handle component selection
   * Wrapper to ensure type safety
   */
  const handleSelect = useCallback((id: string) => {
    selectComponent(id);
  }, [selectComponent]);

  /**
   * Handle expand/collapse toggle
   * Wrapper to ensure type safety
   */
  const handleToggleExpand = useCallback((id: string) => {
    toggleExpanded(id);
  }, [toggleExpanded]);

  /**
   * Handle context menu
   */
  const handleContextMenu = useCallback((node: ComponentTreeNode, event: React.MouseEvent) => {
    event.preventDefault();
    setContextMenu({
      x: event.clientX,
      y: event.clientY,
      node,
    });
  }, []);

  /**
   * Build context menu items based on selected node
   */
  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return [];

    const node = contextMenu.node;
    const component = getComponent(node.id);
    if (!component) return [];

    const items: ContextMenuItem[] = [];

    // Add child (if not at max depth)
    if (node.depth < 4) {
      items.push({
        type: 'item',
        label: 'Add Child Component',
        icon: PlusIcon,
        onClick: () => {
          setAddDialog({
            isOpen: true,
            parentId: node.id,
            parentName: node.displayName,
          });
          setContextMenu(null);
        },
      });
    } else {
      items.push({
        type: 'item',
        label: 'Add Child Component',
        icon: PlusIcon,
        onClick: () => {},
        disabled: true,
      });
    }

    // Duplicate
    items.push({
      type: 'item',
      label: 'Duplicate Component',
      icon: DocumentDuplicateIcon,
      onClick: () => {
        duplicateComponent(node.id);
        setContextMenu(null);
      },
    });

    items.push({ type: 'divider' });

    // Delete
    items.push({
      type: 'item',
      label: 'Delete Component',
      icon: TrashIcon,
      onClick: () => {
        setDeleteConfirm(node.id);
        setContextMenu(null);
      },
    });

    return items;
  }, [contextMenu, getComponent, duplicateComponent]);

  /**
   * Handle add component from dialog
   */
  const handleAddComponent = useCallback((data: {
    displayName: string;
    type: string;
    category: string;
  }) => {
    addComponent({
      displayName: data.displayName,
      type: data.type,
      category: data.category as 'basic' | 'layout' | 'form' | 'custom',
      parentId: addDialog.parentId,
    });
    setAddDialog({ isOpen: false });
  }, [addDialog.parentId, addComponent]);

  /**
   * Handle delete confirmation
   */
  const handleConfirmDelete = useCallback(() => {
    if (deleteConfirm) {
      deleteComponent(deleteConfirm);
      setDeleteConfirm(null);
    }
  }, [deleteConfirm, deleteComponent]);

  // No manifest loaded - show empty state
  if (!manifest) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CubeIcon className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          No Manifest Loaded
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Create or load a project to see components
        </p>
        {onAddComponent && (
          <button
            onClick={onAddComponent}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
            disabled
            title="Load a project first"
          >
            <PlusIcon className="w-4 h-4" />
            Add Component
          </button>
        )}
      </div>
    );
  }

  // Manifest loaded but no components - show empty state
  if (componentTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <CubeIcon className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          No Components Yet
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Start building by adding your first component
        </p>
        {onAddComponent && (
          <button
            onClick={onAddComponent}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-4 h-4" />
            Add Component
          </button>
        )}
      </div>
    );
  }

  // Search returned no results
  if (searchQuery && filteredTree.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <MagnifyingGlassIcon className="w-12 h-12 text-gray-300 mb-4" />
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          No Components Found
        </h3>
        <p className="text-xs text-gray-600">
          No components match "{searchQuery}"
        </p>
      </div>
    );
  }

  // Render component tree
  return (
    <>
      <div className="flex flex-col h-full">
      {/* Tree Header (optional - for future actions) */}
      {onAddComponent && filteredTree.length > 0 && (
        <div className="px-2 py-2 border-b border-gray-200 bg-white flex items-center justify-between">
          <span className="text-xs text-gray-500">
            {filteredTree.length} component{filteredTree.length !== 1 ? 's' : ''}
          </span>
          <button
            onClick={onAddComponent}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="Add component"
          >
            <PlusIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Component Tree List */}
      <div className="flex-1 overflow-y-auto">
        {filteredTree.map(node => (
          <ComponentNode
            key={node.id}
            node={node}
            onToggleExpand={handleToggleExpand}
            onSelect={handleSelect}
            onContextMenu={handleContextMenu}
          />
        ))}
      </div>

      {/* Footer with component count */}
      {filteredTree.length > 0 && (
        <div className="px-3 py-1.5 border-t border-gray-200 bg-gray-50">
          <span className="text-xs text-gray-500">
            {searchQuery 
              ? `Showing ${filteredTree.length} of ${componentTree.length}`
              : `${filteredTree.length} component${filteredTree.length !== 1 ? 's' : ''}`
            }
          </span>
        </div>
      )}
      </div>

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
      />

      {/* Add Component Dialog */}
      <AddComponentDialog
        isOpen={addDialog.isOpen}
        onClose={() => setAddDialog({ isOpen: false })}
        onAdd={handleAddComponent}
        parentName={addDialog.parentName}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Delete Component?
                </h3>
                <p className="text-sm text-gray-600">
                  This will delete the component and all its children. This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
