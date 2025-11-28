/**
 * @file generation-handlers.ts
 * @description IPC handlers for code generation operations
 * 
 * @architecture Phase 3, Task 3.3 - Live Preview Integration
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clean IPC pattern, follows existing handlers
 * 
 * @see src/core/filemanager/FileManager.ts - Performs actual generation
 * @see src/core/FileChangeTracker.ts - Prevents infinite loops
 * @see electron/preload.ts - Exposes API to renderer
 * 
 * PROBLEM SOLVED:
 * - Need to call FileManager from renderer process
 * - FileManager runs in main process (file system access)
 * - Must initialize FileManager per project
 * - Must cleanup properly when project changes
 * 
 * SOLUTION:
 * - IPC handlers bridge renderer → main process
 * - Lazy initialization of FileManager when first used
 * - Cleanup handler for project close/switch
 * - Return structured results with errors
 * 
 * IPC CHANNELS:
 * - generation:generate - Trigger incremental generation
 * - generation:regenerate-all - Force full regeneration
 * - generation:cleanup - Cleanup FileManager instance
 * - generation:status - Get current FileManager state
 * 
 * @security-critical false - operates on local project files
 * @performance-critical true - on critical path for preview updates
 */

import { ipcMain } from 'electron';
import { FileManager } from '../src/core/filemanager/FileManager';
import { FileChangeTracker } from '../src/core/FileChangeTracker';
import type { Manifest } from '../src/core/manifest/types';
import type { GenerationSummary } from '../src/core/filemanager/types';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Request to generate files from manifest
 */
interface GenerateRequest {
  /** Absolute path to project root */
  projectPath: string;
  
  /** Complete manifest object */
  manifest: Manifest;
  
  /** If true, only regenerate changed components (default: true) */
  incremental?: boolean;
}

/**
 * Result of generation operation
 */
interface GenerateResult {
  /** Whether generation succeeded */
  success: boolean;
  
  /** Generation summary on success */
  data?: {
    filesWritten: number;
    filesFailed: number;
    durationMs: number;
    breakdown?: {
      added: number;
      modified: number;
      removed: number;
      appRegenerated: boolean;
    };
  };
  
  /** Error message on failure */
  error?: string;
  
  /** Detailed errors (if any files failed) */
  errors?: Array<{
    filepath: string;
    error: string;
  }>;
}

// =============================================================================
// STATE
// =============================================================================

/**
 * Current FileManager instance (one per project)
 */
let fileManager: FileManager | null = null;

/**
 * Current FileChangeTracker instance
 */
let fileChangeTracker: FileChangeTracker | null = null;

/**
 * Path to current project (used to detect project switches)
 */
let currentProjectPath: string | null = null;

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * Initialize or get FileManager for a project
 * 
 * Creates new FileManager if:
 * - No FileManager exists
 * - Project path changed (project switch)
 * 
 * @param projectPath - Absolute path to project
 * @returns FileManager instance
 */
function getFileManager(projectPath: string): FileManager {
  // Check if we need to create new instance
  // (either first time, or project switched)
  if (!fileManager || currentProjectPath !== projectPath) {
    // Cleanup old instances
    cleanupFileManager();
    
    // Create new tracker and manager
    fileChangeTracker = new FileChangeTracker();
    
    fileManager = new FileManager({
      projectPath,
      fileChangeTracker,
      emitEvents: true,  // Enable events for progress tracking
      debug: process.env.NODE_ENV === 'development',
    });
    
    currentProjectPath = projectPath;
    
    console.log('[GenerationHandlers] FileManager initialized for:', projectPath);
  }
  
  return fileManager;
}

/**
 * Cleanup FileManager and tracker
 * 
 * Called when project closes or switches to new project.
 */
function cleanupFileManager(): void {
  if (fileManager) {
    // FileManager doesn't have destroy, but clear its cache
    fileManager.clearCache();
    fileManager = null;
  }
  
  if (fileChangeTracker) {
    fileChangeTracker = null;
  }
  
  currentProjectPath = null;
  
  console.log('[GenerationHandlers] FileManager cleaned up');
}

/**
 * Convert FileManager result to IPC-safe format
 * 
 * @param summary - FileManager generation summary
 * @returns IPC-safe result object
 */
function toGenerateResult(summary: GenerationSummary): GenerateResult {
  // If generation was skipped (no changes), still success
  if (summary.skipped) {
    return {
      success: true,
      data: {
        filesWritten: 0,
        filesFailed: 0,
        durationMs: summary.durationMs || 0,
      },
    };
  }
  
  return {
    success: summary.filesFailed === 0,
    data: {
      filesWritten: summary.filesWritten,
      filesFailed: summary.filesFailed,
      durationMs: summary.durationMs || 0,
      breakdown: summary.breakdown,
    },
    errors: summary.errors?.map(err => ({
      filepath: err.filepath,
      error: err.error || 'Unknown error',
    })),
  };
}

// =============================================================================
// SETUP
// =============================================================================

/**
 * Setup IPC handlers for generation operations
 * 
 * Call this once during app initialization (in main.ts).
 */
export function setupGenerationHandlers(): void {
  console.log('[GenerationHandlers] Setting up IPC handlers');
  
  /**
   * generation:generate
   * 
   * Generate files from manifest. Uses incremental generation by default
   * (only regenerates changed components).
   * 
   * @param request - Generation request with projectPath and manifest
   * @returns GenerateResult with success status and file counts
   */
  ipcMain.handle('generation:generate', async (_event, request: GenerateRequest): Promise<GenerateResult> => {
    try {
      const { projectPath, manifest, incremental = true } = request;
      
      // Validate request
      if (!projectPath) {
        return {
          success: false,
          error: 'Missing projectPath in generation request',
        };
      }
      
      if (!manifest) {
        return {
          success: false,
          error: 'Missing manifest in generation request',
        };
      }
      
      // Get or create FileManager
      const manager = getFileManager(projectPath);
      
      // Generate files
      const summary = incremental
        ? await manager.generateIncremental(manifest)
        : await manager.generateAll(manifest);
      
      // Convert to result
      return toGenerateResult(summary);
      
    } catch (error) {
      console.error('[GenerationHandlers] generation:generate error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      };
    }
  });
  
  /**
   * generation:regenerate-all
   * 
   * Force full regeneration of all components.
   * Clears FileManager cache and regenerates everything.
   * 
   * @param request - Generation request with projectPath and manifest
   * @returns GenerateResult with success status and file counts
   */
  ipcMain.handle('generation:regenerate-all', async (_event, request: GenerateRequest): Promise<GenerateResult> => {
    try {
      const { projectPath, manifest } = request;
      
      // Validate request
      if (!projectPath || !manifest) {
        return {
          success: false,
          error: 'Missing projectPath or manifest',
        };
      }
      
      // Get FileManager and clear cache
      const manager = getFileManager(projectPath);
      manager.clearCache();
      
      // Generate all files
      const summary = await manager.generateAll(manifest);
      
      return toGenerateResult(summary);
      
    } catch (error) {
      console.error('[GenerationHandlers] generation:regenerate-all error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Regeneration failed',
      };
    }
  });
  
  /**
   * generation:cleanup
   * 
   * Cleanup FileManager when project closes.
   * Should be called when closing a project to free resources.
   */
  ipcMain.handle('generation:cleanup', async (): Promise<{ success: boolean }> => {
    try {
      cleanupFileManager();
      return { success: true };
    } catch (error) {
      console.error('[GenerationHandlers] generation:cleanup error:', error);
      return { success: false };
    }
  });
  
  /**
   * generation:status
   * 
   * Get current FileManager status (for debugging).
   * Returns info about whether FileManager is initialized.
   */
  ipcMain.handle('generation:status', async (): Promise<{
    initialized: boolean;
    projectPath: string | null;
  }> => {
    return {
      initialized: fileManager !== null,
      projectPath: currentProjectPath,
    };
  });
}

/**
 * Cleanup all handlers and resources
 * 
 * Call this during app shutdown.
 */
export function cleanupGenerationHandlers(): void {
  console.log('[GenerationHandlers] Cleaning up');
  
  // Cleanup FileManager
  cleanupFileManager();
  
  // Remove IPC handlers
  ipcMain.removeHandler('generation:generate');
  ipcMain.removeHandler('generation:regenerate-all');
  ipcMain.removeHandler('generation:cleanup');
  ipcMain.removeHandler('generation:status');
}
