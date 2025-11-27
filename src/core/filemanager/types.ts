/**
 * @file types.ts
 * @description Type definitions for the file management system (Task 3.2)
 *              Defines interfaces for file writing, change detection, and generation coordination
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clear requirements, straightforward types
 * 
 * @see docs/FILE_STRUCTURE_SPEC.md - Output file structure
 * @see src/core/FileChangeTracker.ts - Hash-based change detection (Task 0.1)
 * @see src/core/codegen/ReactCodeGenerator.ts - Code generation (Task 3.1)
 * 
 * @security-critical false
 * @performance-critical false
 */

import type { FileChangeTracker } from '../FileChangeTracker';

// =============================================================================
// OUTPUT PATHS & CONSTANTS
// =============================================================================

/**
 * Default paths for generated files (relative to project root)
 */
export const FILE_PATHS = {
  /** Directory for generated component files */
  COMPONENTS_DIR: 'src/components',
  
  /** Main application component */
  APP_JSX: 'src/App.jsx',
  
  /** Application entry point */
  MAIN_JSX: 'src/main.jsx',
  
  /** User edit tracking file */
  USER_EDITS_FILE: '.lowcode/user-edits.json',
  
  /** Component hash cache file */
  HASH_CACHE_FILE: '.lowcode/component-hashes.json',
} as const;

/**
 * File extensions for generated code
 */
export const FILE_EXTENSIONS = {
  JSX: '.jsx',
  TSX: '.tsx', // For future TypeScript support
  CSS: '.css',
} as const;

/**
 * Performance configuration
 */
export const PERFORMANCE_CONFIG = {
  /** Maximum concurrent file writes */
  MAX_CONCURRENT_WRITES: 5,
  
  /** Debounce delay for manifest change handling (ms) */
  MANIFEST_CHANGE_DEBOUNCE: 500,
  
  /** Target time for full regeneration of 50 components (ms) */
  FULL_REGEN_TARGET_MS: 2000,
  
  /** Target time for incremental update of 10 components (ms) */
  INCREMENTAL_TARGET_MS: 500,
} as const;

// =============================================================================
// FILE MANAGER OPTIONS
// =============================================================================

/**
 * Configuration options for FileManager
 */
export interface FileManagerOptions {
  /** Absolute path to the project root directory */
  projectPath: string;
  
  /** FileChangeTracker instance for infinite loop prevention */
  fileChangeTracker: FileChangeTracker;
  
  /** Whether to persist user edit tracking to disk (default: true) */
  persistUserEdits?: boolean;
  
  /** Whether to emit events for progress tracking (default: true) */
  emitEvents?: boolean;
  
  /** Maximum concurrent file write operations (default: 5) */
  maxConcurrentWrites?: number;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * Required options after defaults applied
 */
export interface RequiredFileManagerOptions extends Required<FileManagerOptions> {}

// =============================================================================
// CHANGE DETECTION
// =============================================================================

/**
 * Result of detecting changes between manifest versions
 */
export interface ChangeDetectionResult {
  /** Component IDs that were added */
  added: string[];
  
  /** Component IDs that were modified */
  modified: string[];
  
  /** Component IDs that were removed */
  removed: string[];
  
  /** Whether App.jsx needs to be regenerated (root components changed) */
  appNeedsUpdate: boolean;
  
  /** Total number of changes */
  totalChanges: number;
  
  /** Whether any changes were detected */
  hasChanges: boolean;
}

/**
 * Stored component hash for change detection
 */
export interface ComponentHashEntry {
  /** Component ID */
  id: string;
  
  /** Component display name */
  displayName: string;
  
  /** SHA-256 hash of component definition (excluding updatedAt) */
  hash: string;
  
  /** Whether this is a root component (no parent) */
  isRoot: boolean;
  
  /** Timestamp when hash was computed */
  computedAt: string;
}

/**
 * Persisted hash cache structure
 */
export interface ComponentHashCache {
  /** Schema version for cache format */
  schemaVersion: string;
  
  /** Map of component ID to hash entry */
  hashes: Record<string, ComponentHashEntry>;
  
  /** When the cache was last updated */
  updatedAt: string;
}

// =============================================================================
// FILE WRITING
// =============================================================================

/**
 * Result of writing a single file
 */
export interface FileWriteResult {
  /** Whether the write succeeded */
  success: boolean;
  
  /** Absolute path to the file */
  filepath: string;
  
  /** Error message if write failed */
  error?: string;
  
  /** Size of written content in bytes */
  bytesWritten?: number;
  
  /** Time taken to write in milliseconds */
  durationMs?: number;
}

/**
 * File to be written
 */
export interface FileToWrite {
  /** Absolute path to write to */
  filepath: string;
  
  /** Content to write */
  content: string;
  
  /** Component ID (for component files) */
  componentId?: string;
  
  /** File type for logging/events */
  type: 'component' | 'app' | 'main' | 'other';
}

// =============================================================================
// GENERATION RESULTS
// =============================================================================

/**
 * Summary of a generation operation
 */
export interface GenerationSummary {
  /** Type of generation performed */
  type: 'full' | 'incremental';
  
  /** Total number of components in manifest */
  totalComponents: number;
  
  /** Number of files successfully written */
  filesWritten: number;
  
  /** Number of files that failed to write */
  filesFailed: number;
  
  /** List of write errors */
  errors: FileWriteResult[];
  
  /** Total duration in milliseconds */
  durationMs: number;
  
  /** Whether generation was skipped (no changes) */
  skipped?: boolean;
  
  /** Detailed breakdown (if available) */
  breakdown?: {
    added: number;
    modified: number;
    removed: number;
    appRegenerated: boolean;
    mainRegenerated: boolean;
  };
}

/**
 * Result of generating a single component file
 */
export interface ComponentGenerationResult {
  /** Component ID */
  componentId: string;
  
  /** Component display name */
  componentName: string;
  
  /** Whether generation succeeded */
  success: boolean;
  
  /** Generated file path */
  filepath: string;
  
  /** Error message if failed */
  error?: string;
}

// =============================================================================
// USER EDIT TRACKING
// =============================================================================

/**
 * Tracked user edit for a file
 */
export interface UserEditInfo {
  /** Absolute path to the file */
  filepath: string;
  
  /** Component ID (if component file) */
  componentId?: string;
  
  /** When the user edit was first detected */
  detectedAt: string;
  
  /** Hash of content when edit was detected */
  contentHash: string;
  
  /** Whether user has been warned about this file */
  warningShown?: boolean;
}

/**
 * Persisted user edit tracking structure
 */
export interface UserEditsCache {
  /** Schema version for cache format */
  schemaVersion: string;
  
  /** Map of filepath to user edit info */
  edits: Record<string, UserEditInfo>;
  
  /** When the cache was last updated */
  updatedAt: string;
}

/**
 * User edit conflict information
 */
export interface UserEditConflict {
  /** File path with conflict */
  filepath: string;
  
  /** Component ID (if applicable) */
  componentId?: string;
  
  /** Human-readable message */
  message: string;
  
  /** When the conflict was detected */
  detectedAt: string;
}

// =============================================================================
// EVENTS
// =============================================================================

/**
 * Events emitted by FileManager
 */
export type FileManagerEventType =
  | 'generation:start'
  | 'generation:progress'
  | 'generation:complete'
  | 'generation:error'
  | 'file:writing'
  | 'file:written'
  | 'file:error'
  | 'file:deleted'
  | 'user-edit:detected'
  | 'user-edit:conflict'
  | 'user-edit:cleared'
  | 'component:added'
  | 'component:modified'
  | 'component:removed';

/**
 * Event payload for generation:start
 */
export interface GenerationStartEvent {
  type: 'full' | 'incremental';
  totalComponents: number;
  changes?: ChangeDetectionResult;
}

/**
 * Event payload for generation:progress
 */
export interface GenerationProgressEvent {
  current: number;
  total: number;
  componentId: string;
  componentName: string;
}

/**
 * Event payload for generation:complete
 */
export interface GenerationCompleteEvent {
  summary: GenerationSummary;
}

/**
 * Event payload for generation:error
 */
export interface GenerationErrorEvent {
  error: string;
  componentId?: string;
  filepath?: string;
}

/**
 * Event payload for file:writing
 */
export interface FileWritingEvent {
  filepath: string;
  type: FileToWrite['type'];
  componentId?: string;
}

/**
 * Event payload for file:written
 */
export interface FileWrittenEvent {
  filepath: string;
  type: FileToWrite['type'];
  componentId?: string;
  bytesWritten: number;
  durationMs: number;
}

/**
 * Event payload for user-edit:conflict
 */
export interface UserEditConflictEvent {
  conflict: UserEditConflict;
}

// =============================================================================
// INTERFACES
// =============================================================================

/**
 * Interface for change detection
 */
export interface IChangeDetector {
  /**
   * Detect changes between current manifest and cached state
   */
  detectChanges(manifestComponents: Record<string, unknown>): ChangeDetectionResult;
  
  /**
   * Update the cache with current manifest state
   */
  updateCache(manifestComponents: Record<string, unknown>): void;
  
  /**
   * Clear the cache
   */
  clearCache(): void;
  
  /**
   * Check if a component ID is a root component (no parent)
   */
  isRootComponent(componentId: string, manifestComponents: Record<string, unknown>): boolean;
}

/**
 * Interface for file writing
 */
export interface IFileWriter {
  /**
   * Write a single file with FileChangeTracker integration
   */
  writeFile(filepath: string, content: string): Promise<FileWriteResult>;
  
  /**
   * Write multiple files with concurrency control
   */
  writeFiles(files: FileToWrite[]): Promise<FileWriteResult[]>;
  
  /**
   * Delete a file
   */
  deleteFile(filepath: string): Promise<void>;
  
  /**
   * Ensure directory exists
   */
  ensureDirectory(dirPath: string): Promise<void>;
}

/**
 * Interface for App.jsx and main.jsx generation
 */
export interface IAppGenerator {
  /**
   * Generate App.jsx with root component imports
   */
  generateAppJsx(rootComponents: Array<{ id: string; displayName: string }>): Promise<string>;
  
  /**
   * Generate main.jsx entry point
   */
  generateMainJsx(): Promise<string>;
}

/**
 * Interface for the main FileManager orchestrator
 */
export interface IFileManager {
  /**
   * Generate all files from manifest (full regeneration)
   */
  generateAll(manifest: unknown): Promise<GenerationSummary>;
  
  /**
   * Generate only changed files (incremental update)
   */
  generateIncremental(manifest: unknown): Promise<GenerationSummary>;
  
  /**
   * Mark a file as user-edited (won't be overwritten)
   */
  markUserEdited(filepath: string, componentId?: string): void;
  
  /**
   * Clear user edit flag for a file
   */
  clearUserEdited(filepath: string): void;
  
  /**
   * Get list of user-edited files
   */
  getUserEditedFiles(): string[];
  
  /**
   * Check if a file is marked as user-edited
   */
  isUserEdited(filepath: string): boolean;
  
  /**
   * Add event listener
   */
  on(event: FileManagerEventType, handler: (data: unknown) => void): void;
  
  /**
   * Remove event listener
   */
  off(event: FileManagerEventType, handler: (data: unknown) => void): void;
}

// =============================================================================
// HELPER TYPES
// =============================================================================

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * Path info for generated files
 */
export interface GeneratedFilePaths {
  /** Resolved absolute path to components directory */
  componentsDir: string;
  
  /** Resolved absolute path to App.jsx */
  appJsx: string;
  
  /** Resolved absolute path to main.jsx */
  mainJsx: string;
  
  /** Resolved absolute path to user edits cache */
  userEditsFile: string;
  
  /** Resolved absolute path to hash cache */
  hashCacheFile: string;
}

/**
 * Get component file path from display name
 */
export function getComponentFilePath(
  projectPath: string,
  displayName: string,
  extension: string = FILE_EXTENSIONS.JSX
): string {
  // Dynamic import path for Node.js path module
  // This will be handled by the actual implementation
  return `${projectPath}/${FILE_PATHS.COMPONENTS_DIR}/${displayName}${extension}`;
}

/**
 * Default options for FileManager
 */
export const DEFAULT_FILE_MANAGER_OPTIONS: Omit<RequiredFileManagerOptions, 'projectPath' | 'fileChangeTracker'> = {
  persistUserEdits: true,
  emitEvents: true,
  maxConcurrentWrites: PERFORMANCE_CONFIG.MAX_CONCURRENT_WRITES,
  debug: false,
};

/**
 * Empty change detection result
 */
export const EMPTY_CHANGE_RESULT: ChangeDetectionResult = {
  added: [],
  modified: [],
  removed: [],
  appNeedsUpdate: false,
  totalChanges: 0,
  hasChanges: false,
};

/**
 * Empty generation summary for skipped generations
 */
export const SKIPPED_GENERATION_SUMMARY: GenerationSummary = {
  type: 'incremental',
  totalComponents: 0,
  filesWritten: 0,
  filesFailed: 0,
  errors: [],
  durationMs: 0,
  skipped: true,
};
