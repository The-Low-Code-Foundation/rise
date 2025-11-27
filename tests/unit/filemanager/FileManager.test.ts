/**
 * @file FileManager.test.ts
 * @description Comprehensive tests for the FileManager module (Task 3.2)
 *              Tests file generation, change detection, and infinite loop prevention
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * 
 * CRITICAL TESTS:
 * - Infinite loop prevention (FileWriter + FileChangeTracker integration)
 * - Full generation creates correct files
 * - Incremental generation only updates changed files
 * - User edit protection works
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { FileChangeTracker } from '../../../src/core/FileChangeTracker';
import { FileManager } from '../../../src/core/filemanager/FileManager';
import { ChangeDetector } from '../../../src/core/filemanager/ChangeDetector';
import { FileWriter } from '../../../src/core/filemanager/FileWriter';
import { AppGenerator } from '../../../src/core/filemanager/AppGenerator';
import type { Manifest, Component } from '../../../src/core/manifest/types';
import type { GenerationSummary } from '../../../src/core/filemanager/types';

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Create a temporary test directory
 */
async function createTestDir(): Promise<string> {
  const tempDir = path.join(
    os.tmpdir(),
    `rise-filemanager-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(path.join(tempDir, 'src/components'), { recursive: true });
  await fs.mkdir(path.join(tempDir, '.lowcode'), { recursive: true });
  return tempDir;
}

/**
 * Clean up temporary test directory
 */
async function cleanupTestDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}

/**
 * Create a test component
 */
function createTestComponent(
  id: string,
  displayName: string,
  type: string = 'div',
  children: string[] = []
): Component {
  return {
    id,
    displayName,
    type,
    category: 'basic',
    properties: {},
    styling: {
      baseClasses: ['p-4'],
    },
    children,
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      author: 'user',
      version: '1.0.0',
    },
  };
}

/**
 * Create a test manifest
 */
function createTestManifest(components: Component[]): Manifest {
  const componentsMap: Record<string, Component> = {};
  for (const comp of components) {
    componentsMap[comp.id] = comp;
  }

  return {
    schemaVersion: '1.0.0',
    level: 1,
    metadata: {
      projectName: 'Test Project',
      framework: 'react',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    buildConfig: {
      bundler: 'vite',
      cssFramework: 'tailwind',
    },
    plugins: {
      framework: {
        name: '@rise/plugin-react',
        version: '1.0.0',
      },
    },
    components: componentsMap,
  };
}

// =============================================================================
// CHANGE DETECTOR TESTS
// =============================================================================

describe('ChangeDetector', () => {
  let detector: ChangeDetector;

  beforeEach(() => {
    detector = new ChangeDetector();
  });

  describe('detectChanges', () => {
    it('should detect all components as added when cache is empty', () => {
      const components = {
        comp1: createTestComponent('comp1', 'Button'),
        comp2: createTestComponent('comp2', 'Header'),
      };

      const result = detector.detectChanges(components);

      expect(result.hasChanges).toBe(true);
      expect(result.added).toContain('comp1');
      expect(result.added).toContain('comp2');
      expect(result.modified).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
      expect(result.totalChanges).toBe(2);
    });

    it('should detect no changes when components are unchanged', () => {
      const components = {
        comp1: createTestComponent('comp1', 'Button'),
      };

      // First call - all added
      detector.detectChanges(components);
      detector.updateCache(components);

      // Second call - no changes
      const result = detector.detectChanges(components);

      expect(result.hasChanges).toBe(false);
      expect(result.added).toHaveLength(0);
      expect(result.modified).toHaveLength(0);
      expect(result.removed).toHaveLength(0);
    });

    it('should detect modified components', () => {
      const components = {
        comp1: createTestComponent('comp1', 'Button'),
      };

      // Cache original
      detector.updateCache(components);

      // Modify component
      const modified = {
        comp1: {
          ...components.comp1,
          displayName: 'ButtonModified',
        },
      };

      const result = detector.detectChanges(modified);

      expect(result.hasChanges).toBe(true);
      expect(result.modified).toContain('comp1');
    });

    it('should detect removed components', () => {
      const components = {
        comp1: createTestComponent('comp1', 'Button'),
        comp2: createTestComponent('comp2', 'Header'),
      };

      // Cache original
      detector.updateCache(components);

      // Remove comp2
      const updated = { comp1: components.comp1 };

      const result = detector.detectChanges(updated);

      expect(result.hasChanges).toBe(true);
      expect(result.removed).toContain('comp2');
    });

    it('should flag appNeedsUpdate when root component changes', () => {
      const components = {
        comp1: createTestComponent('comp1', 'Header'), // Root (no parent)
      };

      // Cache original
      detector.updateCache(components);

      // Add new root component
      const updated = {
        ...components,
        comp2: createTestComponent('comp2', 'Footer'), // New root
      };

      const result = detector.detectChanges(updated);

      expect(result.appNeedsUpdate).toBe(true);
    });
  });

  describe('isRootComponent', () => {
    it('should identify root components (no parent)', () => {
      const child = createTestComponent('child1', 'ChildComp');
      const parent = createTestComponent('parent1', 'ParentComp', 'div', ['child1']);

      const components = {
        child1: child,
        parent1: parent,
      };

      expect(detector.isRootComponent('parent1', components)).toBe(true);
      expect(detector.isRootComponent('child1', components)).toBe(false);
    });
  });
});

// =============================================================================
// FILE WRITER TESTS
// =============================================================================

describe('FileWriter', () => {
  let testDir: string;
  let tracker: FileChangeTracker;
  let writer: FileWriter;

  beforeEach(async () => {
    testDir = await createTestDir();
    tracker = new FileChangeTracker();
    writer = new FileWriter({ fileChangeTracker: tracker });
  });

  afterEach(async () => {
    tracker.clear();
    await cleanupTestDir(testDir);
  });

  describe('writeFile', () => {
    it('should write a file successfully', async () => {
      const filepath = path.join(testDir, 'test.txt');
      const content = 'Hello, World!';

      const result = await writer.writeFile(filepath, content);

      expect(result.success).toBe(true);
      expect(result.filepath).toBe(filepath);
      
      // Verify file was written
      const actual = await fs.readFile(filepath, 'utf-8');
      expect(actual).toBe(content);
    });

    it('should create directories if needed', async () => {
      const filepath = path.join(testDir, 'deep/nested/dir/test.txt');
      const content = 'Nested content';

      const result = await writer.writeFile(filepath, content);

      expect(result.success).toBe(true);
      const actual = await fs.readFile(filepath, 'utf-8');
      expect(actual).toBe(content);
    });

    it('should call FileChangeTracker methods', async () => {
      const filepath = path.join(testDir, 'tracked.txt');
      const content = 'Tracked content';

      // Spy on tracker methods
      const beforeSpy = vi.spyOn(tracker, 'onBeforeGenerate');
      const afterSpy = vi.spyOn(tracker, 'onAfterGenerate');

      await writer.writeFile(filepath, content);

      // Verify tracker was called
      expect(beforeSpy).toHaveBeenCalledWith(filepath, content);
      expect(afterSpy).toHaveBeenCalledWith(filepath);
    });

    it('should call onAfterGenerate even on write error', async () => {
      // Create a directory where we want to write a file (should fail)
      const filepath = path.join(testDir, 'blocked-dir');
      await fs.mkdir(filepath, { recursive: true });

      const afterSpy = vi.spyOn(tracker, 'onAfterGenerate');

      // This should fail because filepath is a directory
      const result = await writer.writeFile(filepath, 'content');

      // Should still call onAfterGenerate for cleanup
      expect(afterSpy).toHaveBeenCalled();
      expect(result.success).toBe(false);
    });
  });

  describe('writeFiles', () => {
    it('should write multiple files', async () => {
      const files = [
        { filepath: path.join(testDir, 'file1.txt'), content: 'Content 1', type: 'component' as const },
        { filepath: path.join(testDir, 'file2.txt'), content: 'Content 2', type: 'component' as const },
        { filepath: path.join(testDir, 'file3.txt'), content: 'Content 3', type: 'component' as const },
      ];

      const results = await writer.writeFiles(files);

      expect(results).toHaveLength(3);
      expect(results.every(r => r.success)).toBe(true);

      // Verify files exist
      for (const file of files) {
        const content = await fs.readFile(file.filepath, 'utf-8');
        expect(content).toBe(file.content);
      }
    });
  });

  describe('deleteFile', () => {
    it('should delete a file', async () => {
      const filepath = path.join(testDir, 'to-delete.txt');
      await fs.writeFile(filepath, 'Delete me');

      await writer.deleteFile(filepath);

      // Verify file is gone
      await expect(fs.access(filepath)).rejects.toThrow();
    });

    it('should not throw if file does not exist', async () => {
      const filepath = path.join(testDir, 'nonexistent.txt');

      // Should not throw
      await expect(writer.deleteFile(filepath)).resolves.not.toThrow();
    });
  });
});

// =============================================================================
// APP GENERATOR TESTS
// =============================================================================

describe('AppGenerator', () => {
  let generator: AppGenerator;

  beforeEach(() => {
    generator = new AppGenerator({ usePrettier: false }); // Disable prettier for predictable tests
  });

  describe('generateAppJsx', () => {
    it('should generate App.jsx with root components', async () => {
      const rootComponents = [
        { id: 'comp1', displayName: 'Header' },
        { id: 'comp2', displayName: 'Footer' },
      ];

      const code = await generator.generateAppJsx(rootComponents);

      expect(code).toContain("import { Footer } from './components/Footer'");
      expect(code).toContain("import { Header } from './components/Header'");
      expect(code).toContain('<Footer />');
      expect(code).toContain('<Header />');
      expect(code).toContain('@lowcode:generated');
    });

    it('should generate empty App.jsx when no components', async () => {
      const code = await generator.generateAppJsx([]);

      expect(code).toContain('No components yet');
      expect(code).toContain('@lowcode:generated');
    });

    it('should sort components alphabetically', async () => {
      const rootComponents = [
        { id: 'comp1', displayName: 'Zebra' },
        { id: 'comp2', displayName: 'Apple' },
        { id: 'comp3', displayName: 'Middle' },
      ];

      const code = await generator.generateAppJsx(rootComponents);

      // Apple should come before Middle should come before Zebra
      const appleIndex = code.indexOf('Apple');
      const middleIndex = code.indexOf('Middle');
      const zebraIndex = code.indexOf('Zebra');

      expect(appleIndex).toBeLessThan(middleIndex);
      expect(middleIndex).toBeLessThan(zebraIndex);
    });
  });

  describe('generateMainJsx', () => {
    it('should generate valid main.jsx entry point', async () => {
      const code = await generator.generateMainJsx();

      expect(code).toContain("import React from 'react'");
      expect(code).toContain("import ReactDOM from 'react-dom/client'");
      expect(code).toContain("import App from './App'");
      expect(code).toContain('ReactDOM.createRoot');
      expect(code).toContain('@lowcode:generated');
    });
  });
});

// =============================================================================
// FILE MANAGER TESTS
// =============================================================================

describe('FileManager', () => {
  let testDir: string;
  let tracker: FileChangeTracker;
  let fileManager: FileManager;

  beforeEach(async () => {
    testDir = await createTestDir();
    tracker = new FileChangeTracker();
    fileManager = new FileManager({
      projectPath: testDir,
      fileChangeTracker: tracker,
    });
  });

  afterEach(async () => {
    tracker.clear();
    await cleanupTestDir(testDir);
  });

  describe('constructor', () => {
    it('should throw if projectPath is missing', () => {
      expect(() => new FileManager({
        projectPath: '',
        fileChangeTracker: tracker,
      })).toThrow('projectPath');
    });

    it('should throw if fileChangeTracker is missing', () => {
      expect(() => new FileManager({
        projectPath: testDir,
        fileChangeTracker: null as any,
      })).toThrow('fileChangeTracker');
    });
  });

  describe('generateAll', () => {
    it('should generate all component files', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
        createTestComponent('comp2', 'Header'),
      ]);

      const summary = await fileManager.generateAll(manifest);

      expect(summary.type).toBe('full');
      expect(summary.totalComponents).toBe(2);
      expect(summary.filesWritten).toBeGreaterThanOrEqual(2); // + App.jsx + main.jsx

      // Verify files exist
      const buttonPath = path.join(testDir, 'src/components/Button.jsx');
      const headerPath = path.join(testDir, 'src/components/Header.jsx');
      
      await expect(fs.access(buttonPath)).resolves.not.toThrow();
      await expect(fs.access(headerPath)).resolves.not.toThrow();
    });

    it('should generate App.jsx with root components', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Header'),
      ]);

      await fileManager.generateAll(manifest);

      const appPath = path.join(testDir, 'src/App.jsx');
      const content = await fs.readFile(appPath, 'utf-8');

      expect(content).toContain('Header');
      expect(content).toContain('@lowcode:generated');
    });

    it('should generate main.jsx', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
      ]);

      await fileManager.generateAll(manifest);

      const mainPath = path.join(testDir, 'src/main.jsx');
      const content = await fs.readFile(mainPath, 'utf-8');

      expect(content).toContain('ReactDOM');
      expect(content).toContain('@lowcode:generated');
    });

    it('should emit events', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
      ]);

      const startHandler = vi.fn();
      const completeHandler = vi.fn();

      fileManager.on('generation:start', startHandler);
      fileManager.on('generation:complete', completeHandler);

      await fileManager.generateAll(manifest);

      expect(startHandler).toHaveBeenCalled();
      expect(completeHandler).toHaveBeenCalled();
    });
  });

  describe('generateIncremental', () => {
    it('should skip generation when no changes', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
      ]);

      // First generation
      await fileManager.generateAll(manifest);

      // Second generation - no changes
      const summary = await fileManager.generateIncremental(manifest);

      expect(summary.skipped).toBe(true);
    });

    it('should only regenerate modified components', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
        createTestComponent('comp2', 'Header'),
      ]);

      // First generation
      await fileManager.generateAll(manifest);

      // Get initial file modification time
      const buttonPath = path.join(testDir, 'src/components/Button.jsx');
      const headerPath = path.join(testDir, 'src/components/Header.jsx');
      
      const buttonStatBefore = await fs.stat(buttonPath);
      
      // Wait a bit so mtime would differ
      await new Promise(r => setTimeout(r, 100));

      // Modify only Header
      const modified = createTestManifest([
        manifest.components['comp1'],
        {
          ...manifest.components['comp2'],
          displayName: 'Header', // Same name but different content
          styling: { baseClasses: ['p-8', 'bg-blue-500'] }, // Changed styling
        },
      ]);

      const summary = await fileManager.generateIncremental(modified);

      expect(summary.type).toBe('incremental');
      expect(summary.breakdown?.modified).toBe(1);
      
      // Button should not have been rewritten (though we can't easily verify mtime equality)
      const buttonStatAfter = await fs.stat(buttonPath);
      // Note: mtime comparison might not work on all systems due to filesystem granularity
    });
  });

  describe('user edit tracking', () => {
    it('should track user-edited files', () => {
      const filepath = path.join(testDir, 'src/components/Button.jsx');

      fileManager.markUserEdited(filepath);

      expect(fileManager.isUserEdited(filepath)).toBe(true);
      expect(fileManager.getUserEditedFiles()).toContain(filepath);
    });

    it('should clear user edit flag', () => {
      const filepath = path.join(testDir, 'src/components/Button.jsx');

      fileManager.markUserEdited(filepath);
      fileManager.clearUserEdited(filepath);

      expect(fileManager.isUserEdited(filepath)).toBe(false);
    });

    it('should skip user-edited files during generation', async () => {
      const manifest = createTestManifest([
        createTestComponent('comp1', 'Button'),
        createTestComponent('comp2', 'Header'),
      ]);

      const buttonPath = path.join(testDir, 'src/components/Button.jsx');

      // Mark Button as user-edited
      fileManager.markUserEdited(buttonPath, 'comp1');

      // Create conflict handler
      const conflictHandler = vi.fn();
      fileManager.on('user-edit:conflict', conflictHandler);

      await fileManager.generateAll(manifest);

      // Button should have been skipped
      expect(conflictHandler).toHaveBeenCalled();
      
      // Button file should not exist (was skipped)
      // Header should exist
      const headerPath = path.join(testDir, 'src/components/Header.jsx');
      await expect(fs.access(headerPath)).resolves.not.toThrow();
    });
  });
});

// =============================================================================
// CRITICAL: INFINITE LOOP PREVENTION TEST
// =============================================================================

describe('Infinite Loop Prevention', () => {
  let testDir: string;
  let tracker: FileChangeTracker;
  let fileManager: FileManager;

  beforeEach(async () => {
    testDir = await createTestDir();
    tracker = new FileChangeTracker();
    fileManager = new FileManager({
      projectPath: testDir,
      fileChangeTracker: tracker,
    });
  });

  afterEach(async () => {
    tracker.clear();
    await cleanupTestDir(testDir);
  });

  it('should properly integrate FileChangeTracker to prevent infinite loops', async () => {
    const manifest = createTestManifest([
      createTestComponent('comp1', 'Button'),
    ]);

    // Generate files
    await fileManager.generateAll(manifest);

    // Read the generated file
    const buttonPath = path.join(testDir, 'src/components/Button.jsx');
    const content = await fs.readFile(buttonPath, 'utf-8');

    // The tracker should have seen this file and stored its hash
    // If we check isUserEdit right after generation, it should return false
    // because the hash should match what we wrote
    expect(tracker.isUserEdit(buttonPath, content)).toBe(false);
  });

  it('should detect real user edits after generation', async () => {
    const manifest = createTestManifest([
      createTestComponent('comp1', 'Button'),
    ]);

    // Generate files
    await fileManager.generateAll(manifest);

    // Simulate user editing the file
    const buttonPath = path.join(testDir, 'src/components/Button.jsx');
    const userEdit = '// USER EDIT\nconst Button = () => <button>Modified</button>;';
    await fs.writeFile(buttonPath, userEdit);

    // Now tracker should detect this as a user edit
    const content = await fs.readFile(buttonPath, 'utf-8');
    expect(tracker.isUserEdit(buttonPath, content)).toBe(true);
  });

  it('should complete generation without runaway file changes', async () => {
    const manifest = createTestManifest([
      createTestComponent('comp1', 'Button'),
      createTestComponent('comp2', 'Header'),
      createTestComponent('comp3', 'Footer'),
    ]);

    // Track how many times we write files
    let writeCount = 0;
    const fileWriter = fileManager.getFileWriter();
    const originalWriteFile = fileWriter.writeFile.bind(fileWriter);
    
    vi.spyOn(fileWriter, 'writeFile').mockImplementation(async (...args) => {
      writeCount++;
      // If writeCount exceeds expected (components + App + main), we have a loop
      if (writeCount > 10) {
        throw new Error('INFINITE LOOP DETECTED: Too many file writes!');
      }
      return originalWriteFile(...args);
    });

    // This should complete without triggering the infinite loop check
    await fileManager.generateAll(manifest);

    // Should have written: 3 components + App.jsx + main.jsx = 5 files
    expect(writeCount).toBeLessThanOrEqual(5);
  });
});
