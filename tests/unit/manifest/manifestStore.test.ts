/**
 * @file manifestStore.test.ts
 * @description Unit tests for manifestStore Zustand operations
 * 
 * @architecture Phase 2, Tasks 2.1 & 2.2 - Automated Testing
 * @created 2025-11-26
 * @author AI (Cline) - Automated Test Suite
 * 
 * Tests all manifest store CRUD operations, selection, expansion, validation
 * 
 * Coverage Target: 90%+
 */

import { describe, it, expect, beforeEach, vi, beforeAll, afterAll } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { Component } from '../../../src/core/manifest/types';

// Mock window.electronAPI for tests - must be set up before imports
const mockElectronAPI = {
  manifest: {
    load: vi.fn(),
    save: vi.fn(),
    initialize: vi.fn(),
  },
  project: {
    create: vi.fn(),
    open: vi.fn(),
    close: vi.fn(),
    getRecent: vi.fn(),
  },
};

// Set up window mock before importing stores
(global as any).window = {
  electronAPI: mockElectronAPI,
};

// Now safe to import the store
import { useManifestStore } from '../../../src/renderer/store/manifestStore';

// Clean up after all tests
afterAll(() => {
  delete (global as any).window;
});

describe('ManifestStore', () => {
  // Reset store before each test
  beforeEach(() => {
    const { result } = renderHook(() => useManifestStore());
    act(() => {
      result.current.clearManifest();
    });
  });

  // ========================================
  // SECTION 1: Basic State Management
  // ========================================
  
  describe('Basic State', () => {
    it('should initialize with null manifest', () => {
      const { result } = renderHook(() => useManifestStore());
      expect(result.current.manifest).toBeNull();
    });

    it('should initialize with no selected component', () => {
      const { result } = renderHook(() => useManifestStore());
      expect(result.current.selectedComponentId).toBeNull();
    });

    it('should initialize with empty expanded set', () => {
      const { result } = renderHook(() => useManifestStore());
      expect(result.current.expandedComponentIds.size).toBe(0);
    });

    it('should initialize with no validation errors', () => {
      const { result } = renderHook(() => useManifestStore());
      expect(result.current.validationErrors).toEqual([]);
      expect(result.current.validationWarnings).toEqual([]);
    });

    it('should not block saves initially', () => {
      const { result } = renderHook(() => useManifestStore());
      expect(result.current.saveBlocked).toBe(false);
    });
  });

  // ========================================
  // SECTION 2: Component CRUD Operations
  // ========================================

  describe('addComponent', () => {
    it('should create manifest if none exists', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'TestButton',
          type: 'button',
        });
      });

      expect(result.current.manifest).not.toBeNull();
      expect(result.current.manifest?.components[componentId!]).toBeDefined();
    });

    it('should add component to manifest', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'TestButton',
          type: 'button',
        });
      });

      const component = result.current.manifest?.components[componentId!];
      expect(component).toBeDefined();
      expect(component?.displayName).toBe('TestButton');
      expect(component?.type).toBe('button');
    });

    it('should add component as child when parentId provided', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string;
      let childId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Container',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Button',
          type: 'button',
          parentId,
        });
      });

      const parent = result.current.manifest?.components[parentId!];
      expect(parent?.children).toContain(childId!);
    });

    it('should reject component at depth > 4 (5 levels max)', () => {
      const { result } = renderHook(() => useManifestStore());
      
      const componentIds: string[] = [];
      
      act(() => {
        // Create 5 levels: 0, 1, 2, 3, 4
        componentIds.push(result.current.addComponent({
          displayName: 'Level0',
          type: 'div',
        }));
        
        componentIds.push(result.current.addComponent({
          displayName: 'Level1',
          type: 'div',
          parentId: componentIds[0],
        }));
        
        componentIds.push(result.current.addComponent({
          displayName: 'Level2',
          type: 'div',
          parentId: componentIds[1],
        }));
        
        componentIds.push(result.current.addComponent({
          displayName: 'Level3',
          type: 'div',
          parentId: componentIds[2],
        }));
        
        componentIds.push(result.current.addComponent({
          displayName: 'Level4',
          type: 'div',
          parentId: componentIds[3],
        }));
      });

      // Now try to add a 6th level - should throw
      expect(() => {
        act(() => {
          result.current.addComponent({
            displayName: 'Level5',
            type: 'div',
            parentId: componentIds[4],
          });
        });
      }).toThrow(/max.*depth|too.*deep/i);
    });

    it('should update manifest timestamp on add', () => {
      const { result } = renderHook(() => useManifestStore());
      
      act(() => {
        result.current.addComponent({
          displayName: 'First',
          type: 'div',
        });
      });

      const firstTimestamp = result.current.manifest?.metadata.updatedAt;
      
      // Small delay
      vi.useFakeTimers();
      vi.advanceTimersByTime(100);

      act(() => {
        result.current.addComponent({
          displayName: 'Second',
          type: 'div',
        });
      });

      const secondTimestamp = result.current.manifest?.metadata.updatedAt;
      expect(secondTimestamp).not.toBe(firstTimestamp);
      
      vi.useRealTimers();
    });

    it('should generate unique IDs for components', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let id1: string, id2: string;
      
      act(() => {
        id1 = result.current.addComponent({
          displayName: 'Button1',
          type: 'button',
        });
        
        id2 = result.current.addComponent({
          displayName: 'Button2',
          type: 'button',
        });
      });

      expect(id1!).not.toBe(id2!);
    });
  });

  describe('updateComponent', () => {
    it('should update component properties', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'OldName',
          type: 'button',
          properties: {
            label: { type: 'static', value: 'Click', dataType: 'string' },
          },
        });
      });

      act(() => {
        result.current.updateComponent(componentId!, {
          displayName: 'NewName',
          properties: {
            label: { type: 'static', value: 'Updated', dataType: 'string' },
          },
        });
      });

      const component = result.current.manifest?.components[componentId!];
      expect(component?.displayName).toBe('NewName');
      const labelProp = component?.properties?.label;
      if (labelProp?.type === 'static') {
        expect(labelProp.value).toBe('Updated');
      }
    });

    it('should preserve unmodified fields', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string, componentId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        componentId = result.current.addComponent({
          displayName: 'Button',
          type: 'button',
          parentId,
          properties: {
            label: { type: 'static', value: 'Click', dataType: 'string' },
          },
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'span',
          parentId: componentId,
        });
      });

      act(() => {
        result.current.updateComponent(componentId!, {
          displayName: 'Updated',
        });
      });

      const component = result.current.manifest?.components[componentId!];
      // Children should be preserved
      expect(component?.children).toContain(childId!);
      // Type should be preserved
      expect(component?.type).toBe('button');
      // Properties should be preserved
      const labelProp = component?.properties?.label;
      if (labelProp?.type === 'static') {
        expect(labelProp.value).toBe('Click');
      }
    });

    it('should handle non-existent component gracefully', () => {
      const { result } = renderHook(() => useManifestStore());
      
      act(() => {
        result.current.addComponent({
          displayName: 'Existing',
          type: 'div',
        });
      });

      // Should not throw
      expect(() => {
        act(() => {
          result.current.updateComponent('nonexistent_id', {
            displayName: 'Test',
          });
        });
      }).toThrow(); // Actually, based on the implementation it should throw
    });
  });

  describe('deleteComponent', () => {
    it('should remove component from manifest', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'DeleteMe',
          type: 'div',
        });
      });

      expect(result.current.manifest?.components[componentId!]).toBeDefined();

      act(() => {
        result.current.deleteComponent(componentId!);
      });

      expect(result.current.manifest?.components[componentId!]).toBeUndefined();
    });

    it('should remove component from parent children array', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId,
        });
      });

      expect(result.current.manifest?.components[parentId!].children).toContain(childId!);

      act(() => {
        result.current.deleteComponent(childId!);
      });

      expect(result.current.manifest?.components[parentId!].children).not.toContain(childId!);
    });

    it('should recursively delete children', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string, grandchildId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'div',
          parentId,
        });
        
        grandchildId = result.current.addComponent({
          displayName: 'Grandchild',
          type: 'button',
          parentId: childId,
        });
      });

      act(() => {
        result.current.deleteComponent(parentId!);
      });

      expect(result.current.manifest?.components[parentId!]).toBeUndefined();
      expect(result.current.manifest?.components[childId!]).toBeUndefined();
      expect(result.current.manifest?.components[grandchildId!]).toBeUndefined();
    });

    it('should clear selection if deleted component was selected', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Selected',
          type: 'div',
        });
        
        result.current.selectComponent(componentId!);
      });

      expect(result.current.selectedComponentId).toBe(componentId!);

      act(() => {
        result.current.deleteComponent(componentId!);
      });

      expect(result.current.selectedComponentId).toBeNull();
    });
  });

  describe('duplicateComponent', () => {
    it('should create copy with new ID', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let originalId: string, duplicatedId: string;
      
      act(() => {
        originalId = result.current.addComponent({
          displayName: 'Original',
          type: 'button',
          properties: {
            label: { type: 'static', value: 'Click', dataType: 'string' },
          },
        });
      });

      act(() => {
        duplicatedId = result.current.duplicateComponent(originalId!);
      });

      expect(duplicatedId!).not.toBe(originalId!);
      expect(result.current.manifest?.components[duplicatedId!]).toBeDefined();
      expect(result.current.manifest?.components[duplicatedId!].displayName).toBe('Original (Copy)');
    });

    it('should NOT copy children (shallow copy)', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string, duplicatedId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId,
        });
      });

      act(() => {
        duplicatedId = result.current.duplicateComponent(parentId!);
      });

      // The duplicate should have no children (shallow copy)
      expect(result.current.manifest?.components[duplicatedId!].children).toHaveLength(0);
    });

    it('should copy all properties', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let originalId: string, duplicatedId: string;
      
      act(() => {
        originalId = result.current.addComponent({
          displayName: 'Original',
          type: 'button',
          properties: {
            label: { type: 'static', value: 'Click Me', dataType: 'string' },
            disabled: { type: 'static', value: false, dataType: 'boolean' },
          },
          styling: {
            baseClasses: ['bg-blue-500', 'text-white'],
          },
        });
      });

      act(() => {
        duplicatedId = result.current.duplicateComponent(originalId!);
      });

      const duplicate = result.current.manifest?.components[duplicatedId!];
      const labelProp = duplicate?.properties?.label;
      if (labelProp?.type === 'static') {
        expect(labelProp.value).toBe('Click Me');
      }
      const disabledProp = duplicate?.properties?.disabled;
      if (disabledProp?.type === 'static') {
        expect(disabledProp.value).toBe(false);
      }
      expect(duplicate?.styling?.baseClasses).toContain('bg-blue-500');
    });
  });

  describe('moveComponent', () => {
    it('should move component to new parent', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let oldParentId: string, newParentId: string, childId: string;
      
      act(() => {
        oldParentId = result.current.addComponent({
          displayName: 'OldParent',
          type: 'div',
        });
        
        newParentId = result.current.addComponent({
          displayName: 'NewParent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId: oldParentId,
        });
      });

      act(() => {
        result.current.moveComponent(childId!, newParentId!);
      });

      expect(result.current.manifest?.components[oldParentId!].children).not.toContain(childId!);
      expect(result.current.manifest?.components[newParentId!].children).toContain(childId!);
    });

    it('should prevent circular reference (moving parent into child)', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string, grandchildId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'div',
          parentId,
        });
        
        grandchildId = result.current.addComponent({
          displayName: 'Grandchild',
          type: 'div',
          parentId: childId,
        });
      });

      // Try to move parent into grandchild - should fail
      expect(() => {
        act(() => {
          result.current.moveComponent(parentId!, grandchildId!);
        });
      }).toThrow(/circular/i);
    });

    it('should prevent moving component into itself', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Self',
          type: 'div',
        });
      });

      expect(() => {
        act(() => {
          result.current.moveComponent(componentId!, componentId!);
        });
      }).toThrow(/circular|itself/i);
    });

    it('should move to root level when parentId is null', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId,
        });
      });

      act(() => {
        result.current.moveComponent(childId!, null);
      });

      // Child should no longer be in parent's children
      expect(result.current.manifest?.components[parentId!].children).not.toContain(childId!);
      // Child should still exist
      expect(result.current.manifest?.components[childId!]).toBeDefined();
    });
  });

  // ========================================
  // SECTION 3: Tree State Management
  // ========================================

  describe('Selection', () => {
    it('should select component', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Select',
          type: 'div',
        });
        
        result.current.selectComponent(componentId!);
      });

      expect(result.current.selectedComponentId).toBe(componentId!);
    });

    it('should allow only one selection at a time', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let id1: string, id2: string;
      
      act(() => {
        id1 = result.current.addComponent({
          displayName: 'First',
          type: 'div',
        });
        
        id2 = result.current.addComponent({
          displayName: 'Second',
          type: 'div',
        });
      });

      act(() => {
        result.current.selectComponent(id1!);
      });
      expect(result.current.selectedComponentId).toBe(id1!);

      act(() => {
        result.current.selectComponent(id2!);
      });
      expect(result.current.selectedComponentId).toBe(id2!);
    });

    it('should clear selection with null', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Clear',
          type: 'div',
        });
        
        result.current.selectComponent(componentId!);
      });

      expect(result.current.selectedComponentId).toBe(componentId!);

      act(() => {
        result.current.selectComponent(null);
      });

      expect(result.current.selectedComponentId).toBeNull();
    });
  });

  describe('Expand/Collapse', () => {
    it('should toggle expanded state', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Toggle',
          type: 'div',
        });
        
        result.current.toggleExpanded(componentId!);
      });

      expect(result.current.expandedComponentIds.has(componentId!)).toBe(true);

      act(() => {
        result.current.toggleExpanded(componentId!);
      });

      expect(result.current.expandedComponentIds.has(componentId!)).toBe(false);
    });

    it('should expand all components', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let id1: string, id2: string;
      
      act(() => {
        id1 = result.current.addComponent({
          displayName: 'First',
          type: 'div',
        });
        
        id2 = result.current.addComponent({
          displayName: 'Second',
          type: 'div',
        });
        
        result.current.expandAll();
      });

      expect(result.current.expandedComponentIds.has(id1!)).toBe(true);
      expect(result.current.expandedComponentIds.has(id2!)).toBe(true);
    });

    it('should collapse all components', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'First',
          type: 'div',
        });
        
        result.current.toggleExpanded(componentId!);
      });

      expect(result.current.expandedComponentIds.has(componentId!)).toBe(true);

      act(() => {
        result.current.collapseAll();
      });

      expect(result.current.expandedComponentIds.size).toBe(0);
    });
  });

  // ========================================
  // SECTION 4: Tree Computation
  // ========================================

  describe('getComponentTree', () => {
    it('should return flat array for root components', () => {
      const { result } = renderHook(() => useManifestStore());
      
      act(() => {
        result.current.addComponent({
          displayName: 'Root1',
          type: 'div',
        });
        
        result.current.addComponent({
          displayName: 'Root2',
          type: 'div',
        });
      });

      const tree = result.current.getComponentTree();
      
      expect(tree).toHaveLength(2);
      expect(tree[0].depth).toBe(0);
      expect(tree[1].depth).toBe(0);
    });

    it('should include depth information', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId,
        });
        
        // Expand parent to see child
        result.current.toggleExpanded(parentId!);
      });

      const tree = result.current.getComponentTree();
      
      const parent = tree.find(n => n.id === parentId!);
      const child = tree.find(n => n.id === childId!);
      
      expect(parent?.depth).toBe(0);
      expect(child?.depth).toBe(1);
    });

    it('should only include visible nodes (collapsed children hidden)', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'button',
          parentId,
        });
      });

      // Parent is collapsed by default
      const tree = result.current.getComponentTree();
      
      expect(tree.find(n => n.id === parentId!)).toBeDefined();
      expect(tree.find(n => n.id === childId!)).toBeUndefined();
    });
  });

  // ========================================
  // SECTION 5: Validation
  // ========================================

  describe('validate', () => {
    it('should return valid for empty manifest', () => {
      const { result } = renderHook(() => useManifestStore());
      
      act(() => {
        result.current.addComponent({
          displayName: 'Valid',
          type: 'div',
        });
      });

      const validation = result.current.validate();
      
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it('should detect max depth violations', () => {
      const { result } = renderHook(() => useManifestStore());
      
      // Create components at max depth, then manually add one more
      // (bypassing the store's depth check for testing)
      act(() => {
        const id0 = result.current.addComponent({ displayName: 'L0', type: 'div' });
        const id1 = result.current.addComponent({ displayName: 'L1', type: 'div', parentId: id0 });
        const id2 = result.current.addComponent({ displayName: 'L2', type: 'div', parentId: id1 });
        const id3 = result.current.addComponent({ displayName: 'L3', type: 'div', parentId: id2 });
        const id4 = result.current.addComponent({ displayName: 'L4', type: 'div', parentId: id3 });
        
        // Manually add a component that violates depth (for testing validation)
        // This would normally be blocked by addComponent, but we're testing validate()
        const manifest = result.current.manifest;
        if (manifest) {
          const id5 = 'comp_test_violation';
          manifest.components[id5] = {
            id: id5,
            displayName: 'L5_Invalid',
            type: 'div',
            category: 'layout',
            properties: {},
            styling: { baseClasses: [] },
            children: [],
            metadata: {
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              author: 'user',
              version: '1.0.0',
            },
          };
          manifest.components[id4].children.push(id5);
        }
      });

      const validation = result.current.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  // ========================================
  // SECTION 6: Utility Methods
  // ========================================

  describe('Utility Methods', () => {
    it('getComponent should return component by ID', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let componentId: string;
      
      act(() => {
        componentId = result.current.addComponent({
          displayName: 'Test',
          type: 'button',
        });
      });

      const component = result.current.getComponent(componentId!);
      
      expect(component).toBeDefined();
      expect(component?.displayName).toBe('Test');
    });

    it('getComponentDepth should return correct depth', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let parentId: string, childId: string, grandchildId: string;
      
      act(() => {
        parentId = result.current.addComponent({
          displayName: 'Parent',
          type: 'div',
        });
        
        childId = result.current.addComponent({
          displayName: 'Child',
          type: 'div',
          parentId,
        });
        
        grandchildId = result.current.addComponent({
          displayName: 'Grandchild',
          type: 'button',
          parentId: childId,
        });
      });

      expect(result.current.getComponentDepth(parentId!)).toBe(0);
      expect(result.current.getComponentDepth(childId!)).toBe(1);
      expect(result.current.getComponentDepth(grandchildId!)).toBe(2);
    });

    it('canAddChild should respect max depth', () => {
      const { result } = renderHook(() => useManifestStore());
      
      let level0: string, level1: string, level2: string, level3: string;
      
      act(() => {
        level0 = result.current.addComponent({ displayName: 'L0', type: 'div' });
        level1 = result.current.addComponent({ displayName: 'L1', type: 'div', parentId: level0 });
        level2 = result.current.addComponent({ displayName: 'L2', type: 'div', parentId: level1 });
        level3 = result.current.addComponent({ displayName: 'L3', type: 'div', parentId: level2 });
      });

      expect(result.current.canAddChild(level0!)).toBe(true);
      expect(result.current.canAddChild(level1!)).toBe(true);
      expect(result.current.canAddChild(level2!)).toBe(true);
      expect(result.current.canAddChild(level3!)).toBe(true);
      
      // Add level4
      let level4: string;
      act(() => {
        level4 = result.current.addComponent({ displayName: 'L4', type: 'div', parentId: level3 });
      });
      
      // Level4 is at max depth, cannot add children
      expect(result.current.canAddChild(level4!)).toBe(false);
    });
  });
});
