/**
 * @file index.ts
 * @description Module exports for the file management system (Task 3.2)
 *              Provides unified access to file generation and writing utilities
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * 
 * @see src/core/filemanager/FileManager.ts - Main orchestrator
 * @see src/core/filemanager/FileWriter.ts - CRITICAL safe file writing
 * @see src/core/filemanager/ChangeDetector.ts - Change detection
 * @see src/core/filemanager/AppGenerator.ts - App.jsx and main.jsx
 */

// Main orchestrator
export { FileManager, createFileManager } from './FileManager';

// Change detection
export { ChangeDetector, createChangeDetector } from './ChangeDetector';
export type { ChangeDetectorOptions } from './ChangeDetector';

// File writing (CRITICAL for infinite loop prevention)
export { FileWriter, createFileWriter } from './FileWriter';
export type { FileWriterOptions } from './FileWriter';

// App.jsx and main.jsx generation
export {
  AppGenerator,
  createAppGenerator,
  generateAppJsx,
  generateMainJsx,
} from './AppGenerator';
export type { RootComponentInfo, AppGeneratorOptions } from './AppGenerator';

// Type definitions
export {
  // Constants
  FILE_PATHS,
  FILE_EXTENSIONS,
  PERFORMANCE_CONFIG,
  DEFAULT_FILE_MANAGER_OPTIONS,
  EMPTY_CHANGE_RESULT,
  SKIPPED_GENERATION_SUMMARY,
  
  // Helper functions
  getComponentFilePath,
} from './types';

export type {
  // Options
  FileManagerOptions,
  RequiredFileManagerOptions,
  
  // Change detection
  ChangeDetectionResult,
  ComponentHashEntry,
  ComponentHashCache,
  
  // File writing
  FileWriteResult,
  FileToWrite,
  
  // Generation
  GenerationSummary,
  ComponentGenerationResult,
  
  // User edit tracking
  UserEditInfo,
  UserEditsCache,
  UserEditConflict,
  
  // Events
  FileManagerEventType,
  GenerationStartEvent,
  GenerationProgressEvent,
  GenerationCompleteEvent,
  GenerationErrorEvent,
  FileWritingEvent,
  FileWrittenEvent,
  UserEditConflictEvent,
  
  // Interfaces
  IChangeDetector,
  IFileWriter,
  IAppGenerator,
  IFileManager,
  
  // Utilities
  Result,
  GeneratedFilePaths,
} from './types';
