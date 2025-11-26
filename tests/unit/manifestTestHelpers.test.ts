/**
 * @file manifestTestHelpers.test.ts
 * @description Verify test helper utilities work correctly
 * 
 * @architecture Phase 2, Tasks 2.1-2.2 - Automated Testing
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard test patterns
 */

import { describe, it, expect } from 'vitest';
import {
  createTestManifest,
  createTestComponent,
  createNestedComponents,
  createCircularComponents,
  createManifestWithComponents,
  assertValidComponent,
  assertValidManifest,
  wait,
} from '../utils/manifestTestHelpers';

describe('Test Helper Utilities', () => {
  
  describe('createTestManifest', () => {
    it('should create a valid manifest with default values', () => {
      const manifest = createTestManifest();
      
      expect(manifest).toBeDefined();
      expect(manifest.schemaVersion).toBe('1.0.0');
      expect(manifest.level).toBe(1);
      expect(manifest.metadata.projectName).toBe('New Project');
      expect(manifest.metadata.framework).toBe('react');
      expect(manifest.buildConfig.bundler).toBe('vite');
      expect(manifest.buildConfig.cssFramework).toBe('tailwind');
    });

    it('should allow custom project name', () => {
      const manifest = createTestManifest({
        metadata: { 
          projectName: 'Custom Project',
          framework: 'react',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      });
      
      expect(manifest.metadata.projectName).toBe('Custom Project');
    });

    it('should have empty components by default', () => {
      const manifest = createTestManifest();
      expect(Object.keys(manifest.components)).toHaveLength(0);
    });

    it('should preserve provided components', () => {
      const testComponent = createTestComponent({ displayName: 'Test' });
      const manifest = createTestManifest({
        components: {
          [testComponent.id]: testComponent
        }
      });
      
      expect(Object.keys(manifest.components)).toHaveLength(1);
      expect(manifest.components[testComponent.id]).toBeDefined();
    });
  });

  describe('createTestComponent', () => {
    it('should create a valid component with defaults', () => {
      const component = createTestComponent();
      
      expect(component).toBeDefined();
      expect(component.id).toBeDefined();
      expect(component.id).toMatch(/^comp_/);
      expect(component.displayName).toBe('Test Component');
      expect(component.type).toBe('div');
      expect(component.category).toBe('basic');
      expect(component.children).toEqual([]);
      expect(component.metadata.author).toBe('user');
    });

    it('should allow custom properties', () => {
      const component = createTestComponent({
        displayName: 'My Button',
        type: 'button',
        category: 'form',
      });
      
      expect(component.displayName).toBe('My Button');
      expect(component.type).toBe('button');
      expect(component.category).toBe('form');
    });

    it('should generate unique IDs', () => {
      const comp1 = createTestComponent();
      const comp2 = createTestComponent();
      
      expect(comp1.id).not.toBe(comp2.id);
    });

    it('should respect provided ID', () => {
      const customId = 'comp_custom_123';
      const component = createTestComponent({ id: customId });
      
      expect(component.id).toBe(customId);
    });
  });

  describe('createNestedComponents', () => {
    it('should create nested hierarchy at depth 0', () => {
      const { root, components } = createNestedComponents(0);
      
      expect(root).toBeDefined();
      expect(Object.keys(components)).toHaveLength(1);
      expect(root.children).toHaveLength(0);
    });

    it('should create nested hierarchy at depth 2', () => {
      const { root, components } = createNestedComponents(2);
      
      expect(root).toBeDefined();
      expect(Object.keys(components)).toHaveLength(3); // Level 0, 1, 2
      expect(root.children).toHaveLength(1);
      
      const level1 = components[root.children[0]];
      expect(level1.children).toHaveLength(1);
    });

    it('should set custom names', () => {
      const { root, components } = createNestedComponents(2, ['Root', 'Child', 'Grandchild']);
      
      expect(root.displayName).toBe('Root');
      const child = components[root.children[0]];
      expect(child.displayName).toBe('Child');
      const grandchild = components[child.children[0]];
      expect(grandchild.displayName).toBe('Grandchild');
    });

    it('should use default names when not provided', () => {
      const { root, components } = createNestedComponents(1);
      
      expect(root.displayName).toBe('Level 0');
      const child = components[root.children[0]];
      expect(child.displayName).toBe('Level 1');
    });
  });

  describe('createCircularComponents', () => {
    it('should create circular reference A->B->C->A', () => {
      const { components, ids } = createCircularComponents();
      
      expect(Object.keys(components)).toHaveLength(3);
      expect(components[ids.a].children).toContain(ids.b);
      expect(components[ids.b].children).toContain(ids.c);
      expect(components[ids.c].children).toContain(ids.a);
    });

    it('should have distinct component IDs', () => {
      const { ids } = createCircularComponents();
      
      expect(ids.a).not.toBe(ids.b);
      expect(ids.b).not.toBe(ids.c);
      expect(ids.c).not.toBe(ids.a);
    });
  });

  describe('createManifestWithComponents', () => {
    it('should create manifest with specified count', () => {
      const manifest = createManifestWithComponents(5);
      
      expect(Object.keys(manifest.components)).toHaveLength(5);
    });

    it('should create flat structure by default', () => {
      const manifest = createManifestWithComponents(3);
      
      const components = Object.values(manifest.components);
      components.forEach(comp => {
        expect(comp.children).toHaveLength(0);
      });
    });

    it('should create nested structure when requested', () => {
      const manifest = createManifestWithComponents(5, { nested: true, maxDepth: 2 });
      
      expect(Object.keys(manifest.components)).toHaveLength(5);
      
      // At least some components should have children (nested)
      const components = Object.values(manifest.components);
      const hasChildren = components.some(comp => comp.children.length > 0);
      expect(hasChildren).toBe(true);
    });

    it('should assign categories in rotation', () => {
      const manifest = createManifestWithComponents(6, {
        categories: ['basic', 'layout']
      });
      
      const components = Object.values(manifest.components);
      const categories = components.map(c => c.category);
      
      // Should have both categories
      expect(categories).toContain('basic');
      expect(categories).toContain('layout');
    });
  });

  describe('assertValidComponent', () => {
    it('should pass for valid component', () => {
      const component = createTestComponent();
      
      expect(() => assertValidComponent(component)).not.toThrow();
    });

    it('should throw for missing required field', () => {
      const invalid = { id: 'test', displayName: 'Test' }; // Missing many required fields
      
      expect(() => assertValidComponent(invalid)).toThrow(/missing required field/i);
    });

    it('should throw for invalid id type', () => {
      const component = createTestComponent();
      const invalid = { ...component, id: 123 }; // ID should be string
      
      expect(() => assertValidComponent(invalid)).toThrow(/id must be a string/i);
    });

    it('should throw for invalid children type', () => {
      const component = createTestComponent();
      const invalid = { ...component, children: 'not-an-array' };
      
      expect(() => assertValidComponent(invalid)).toThrow(/children must be an array/i);
    });
  });

  describe('assertValidManifest', () => {
    it('should pass for valid manifest', () => {
      const manifest = createTestManifest();
      
      expect(() => assertValidManifest(manifest)).not.toThrow();
    });

    it('should throw for missing required field', () => {
      const invalid = { schemaVersion: '1.0.0', level: 1 }; // Missing metadata, buildConfig, etc.
      
      expect(() => assertValidManifest(invalid)).toThrow(/missing required field/i);
    });

    it('should throw for invalid schemaVersion type', () => {
      const manifest = createTestManifest();
      const invalid = { ...manifest, schemaVersion: 1.0 }; // Should be string
      
      expect(() => assertValidManifest(invalid)).toThrow(/schemaVersion must be a string/i);
    });

    it('should throw for invalid level type', () => {
      const manifest = createTestManifest();
      const invalid = { ...manifest, level: '1' }; // Should be number
      
      expect(() => assertValidManifest(invalid)).toThrow(/level must be a number/i);
    });
  });

  describe('wait utility', () => {
    it('should wait for specified duration', async () => {
      const start = Date.now();
      await wait(100);
      const end = Date.now();
      
      const elapsed = end - start;
      expect(elapsed).toBeGreaterThanOrEqual(95); // Allow small variance
      expect(elapsed).toBeLessThan(150); // Shouldn't be too long
    });

    it('should resolve promise after timeout', async () => {
      let resolved = false;
      
      wait(50).then(() => {
        resolved = true;
      });
      
      expect(resolved).toBe(false);
      
      await wait(60);
      
      expect(resolved).toBe(true);
    });
  });
});
