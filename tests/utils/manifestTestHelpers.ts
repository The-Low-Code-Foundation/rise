/**
 * @file manifestTestHelpers.ts
 * @description Test utilities for manifest and component testing
 * 
 * @architecture Phase 2, Tasks 2.1-2.2 - Automated Testing
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard test utility patterns
 * 
 * @see tests/unit/manifestStore.test.ts
 * @see tests/integration/manifestPersistence.test.ts
 */

import type { Manifest, Component } from '../../src/core/manifest/types';
import { createEmptyManifest, generateComponentId } from '../../src/core/manifest/types';

// Re-export component category type
type ComponentCategory = 'basic' | 'layout' | 'form' | 'custom';

/**
 * Create a test manifest with custom options
 * 
 * Provides sensible defaults for all required fields while allowing
 * customization for specific test scenarios.
 * 
 * @param options - Optional overrides for manifest properties
 * @returns A complete valid manifest
 * 
 * @example
 * const manifest = createTestManifest({
 *   metadata: { projectName: 'My Test Project' }
 * });
 */
export function createTestManifest(options: Partial<Manifest> = {}): Manifest {
  const baseManifest = createEmptyManifest();
  
  return {
    ...baseManifest,
    ...options,
    metadata: {
      ...baseManifest.metadata,
      ...options.metadata,
    },
    buildConfig: {
      ...baseManifest.buildConfig,
      ...options.buildConfig,
    },
    plugins: {
      ...baseManifest.plugins,
      ...options.plugins,
    },
    components: {
      ...baseManifest.components,
      ...options.components,
    },
  };
}

/**
 * Create a test component with custom options
 * 
 * Provides sensible defaults for all required component fields while
 * allowing customization for specific test scenarios.
 * 
 * @param options - Optional overrides for component properties
 * @returns A complete valid component
 * 
 * @example
 * const button = createTestComponent({
 *   displayName: 'Submit Button',
 *   type: 'button'
 * });
 */
export function createTestComponent(options: Partial<Component> = {}): Component {
  const id = options.id || generateComponentId(options.type || 'div');
  const now = new Date().toISOString();
  
  return {
    id,
    displayName: options.displayName || 'Test Component',
    type: options.type || 'div',
    category: options.category || 'basic',
    properties: options.properties || {},
    styling: options.styling || { baseClasses: [] },
    children: options.children || [],
    metadata: {
      createdAt: now,
      updatedAt: now,
      author: 'user',
      version: '1.0.0',
      ...options.metadata,
    },
  };
}

/**
 * Create a hierarchy of nested test components
 * 
 * Useful for testing tree rendering, depth validation, and parent-child relationships.
 * 
 * @param depth - Number of nesting levels to create (0-indexed)
 * @param componentNames - Optional array of names for each level
 * @returns Object with root component and all nested components
 * 
 * @example
 * const { root, components } = createNestedComponents(3, ['Root', 'Level1', 'Level2', 'Level3']);
 * // Creates: Root -> Level1 -> Level2 -> Level3
 */
export function createNestedComponents(
  depth: number,
  componentNames?: string[]
): { root: Component; components: Record<string, Component> } {
  const components: Record<string, Component> = {};
  let previousId: string | null = null;
  let rootId: string | null = null;
  
  for (let i = 0; i <= depth; i++) {
    const name = componentNames?.[i] || `Level ${i}`;
    const component = createTestComponent({
      displayName: name,
      type: 'div',
      category: 'layout',
    });
    
    if (i === 0) {
      rootId = component.id;
    }
    
    if (previousId) {
      components[previousId].children = [component.id];
    }
    
    components[component.id] = component;
    previousId = component.id;
  }
  
  return {
    root: components[rootId!],
    components,
  };
}

/**
 * Create components with circular reference
 * 
 * Useful for testing circular reference detection and validation.
 * 
 * @returns Object with components that reference each other in a cycle
 * 
 * @example
 * const { components } = createCircularComponents();
 * // Creates: A -> B -> C -> A (circular)
 */
export function createCircularComponents(): {
  components: Record<string, Component>;
  ids: { a: string; b: string; c: string };
} {
  const compA = createTestComponent({ displayName: 'Component A' });
  const compB = createTestComponent({ displayName: 'Component B' });
  const compC = createTestComponent({ displayName: 'Component C' });
  
  // Create circular reference: A -> B -> C -> A
  compA.children = [compB.id];
  compB.children = [compC.id];
  compC.children = [compA.id];
  
  return {
    components: {
      [compA.id]: compA,
      [compB.id]: compB,
      [compC.id]: compC,
    },
    ids: {
      a: compA.id,
      b: compB.id,
      c: compC.id,
    },
  };
}

/**
 * Load a test fixture manifest from JSON file
 * 
 * Reads fixture files from tests/fixtures/manifests/ directory.
 * 
 * @param filename - Name of the fixture file (e.g., 'simple-button.json')
 * @param category - Subfolder: 'valid' or 'invalid'
 * @returns Parsed manifest object
 * 
 * @example
 * const manifest = await loadTestFixture('simple-button.json', 'valid');
 */
export async function loadTestFixture(
  filename: string,
  category: 'valid' | 'invalid' = 'valid'
): Promise<Manifest> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const fixturePath = path.join(
    process.cwd(),
    'tests',
    'fixtures',
    'manifests',
    category,
    filename
  );
  
  const content = await fs.readFile(fixturePath, 'utf-8');
  return JSON.parse(content);
}

/**
 * Create a manifest with specified number of components
 * 
 * Useful for performance testing and testing with large datasets.
 * 
 * @param count - Number of components to create
 * @param options - Optional configuration for generated components
 * @returns Manifest with generated components
 * 
 * @example
 * const largeManifest = createManifestWithComponents(100);
 */
export function createManifestWithComponents(
  count: number,
  options: {
    nested?: boolean;
    maxDepth?: number;
    categories?: ComponentCategory[];
  } = {}
): Manifest {
  const manifest = createTestManifest();
  const components: Record<string, Component> = {};
  
  const { nested = false, maxDepth = 2, categories = ['basic', 'layout', 'form'] } = options;
  
  if (nested) {
    // Create nested hierarchy
    let currentParent: string | null = null;
    let currentDepth = 0;
    
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const component = createTestComponent({
        displayName: `Component ${i + 1}`,
        category,
      });
      
      components[component.id] = component;
      
      if (currentParent && currentDepth < maxDepth) {
        components[currentParent].children = [component.id];
        currentDepth++;
      } else {
        // Start new tree
        currentDepth = 0;
      }
      
      currentParent = component.id;
    }
  } else {
    // Create flat structure (all root components)
    for (let i = 0; i < count; i++) {
      const category = categories[i % categories.length];
      const component = createTestComponent({
        displayName: `Component ${i + 1}`,
        category,
      });
      
      components[component.id] = component;
    }
  }
  
  manifest.components = components;
  return manifest;
}

/**
 * Assert that a component has all required fields
 * 
 * Throws descriptive error if component is invalid.
 * 
 * @param component - Component to validate
 * @throws Error if component is missing required fields
 */
export function assertValidComponent(component: any): asserts component is Component {
  const required = ['id', 'displayName', 'type', 'category', 'properties', 'styling', 'children', 'metadata'];
  
  for (const field of required) {
    if (!(field in component)) {
      throw new Error(`Component missing required field: ${field}`);
    }
  }
  
  if (typeof component.id !== 'string') {
    throw new Error('Component id must be a string');
  }
  
  if (typeof component.displayName !== 'string') {
    throw new Error('Component displayName must be a string');
  }
  
  if (!Array.isArray(component.children)) {
    throw new Error('Component children must be an array');
  }
}

/**
 * Assert that a manifest has all required fields
 * 
 * Throws descriptive error if manifest is invalid.
 * 
 * @param manifest - Manifest to validate
 * @throws Error if manifest is missing required fields
 */
export function assertValidManifest(manifest: any): asserts manifest is Manifest {
  const required = ['schemaVersion', 'level', 'metadata', 'buildConfig', 'plugins', 'components'];
  
  for (const field of required) {
    if (!(field in manifest)) {
      throw new Error(`Manifest missing required field: ${field}`);
    }
  }
  
  if (typeof manifest.schemaVersion !== 'string') {
    throw new Error('Manifest schemaVersion must be a string');
  }
  
  if (typeof manifest.level !== 'number') {
    throw new Error('Manifest level must be a number');
  }
  
  if (typeof manifest.components !== 'object') {
    throw new Error('Manifest components must be an object');
  }
}

/**
 * Wait for a specified duration
 * 
 * Useful for testing debounced operations
 * 
 * @param ms - Milliseconds to wait
 * @returns Promise that resolves after the specified time
 * 
 * @example
 * await wait(600); // Wait for debounce period
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mock IPC response for manifest operations
 * 
 * Provides consistent mock responses for testing IPC interactions
 * without requiring actual file system operations.
 */
export const mockIPCResponses = {
  load: {
    success: (manifest: Manifest) => ({
      success: true,
      manifest,
    }),
    notFound: () => ({
      success: false,
      error: 'Manifest file not found',
      errorCode: 'NOT_FOUND' as const,
    }),
    parseError: () => ({
      success: false,
      error: 'Manifest file is corrupted (invalid JSON)',
      errorCode: 'PARSE_ERROR' as const,
    }),
    withValidationErrors: (manifest: Manifest, errors: any[]) => ({
      success: true,
      manifest,
      validationErrors: errors,
    }),
  },
  save: {
    success: () => ({
      success: true,
    }),
    validationFailed: () => ({
      success: false,
      error: 'Cannot save: validation errors exist',
      errorCode: 'VALIDATION_FAILED' as const,
    }),
    writeError: () => ({
      success: false,
      error: 'Failed to save manifest: permission denied',
      errorCode: 'WRITE_ERROR' as const,
    }),
  },
  exists: {
    yes: () => ({
      exists: true,
      hasLowcodeFolder: true,
    }),
    no: () => ({
      exists: false,
      hasLowcodeFolder: false,
    }),
    folderOnly: () => ({
      exists: false,
      hasLowcodeFolder: true,
    }),
  },
};
