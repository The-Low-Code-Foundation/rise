/**
 * @file FileWriter.ts
 * @description Safe file writing with FileChangeTracker integration to prevent infinite loops
 *              This is the CRITICAL component that bridges code generation and the file system
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Critical integration, extensively documented
 * 
 * @see src/core/FileChangeTracker.ts - Hash-based change detection
 * @see src/core/filemanager/types.ts - Type definitions
 * 
 * PROBLEM SOLVED:
 * - Without proper integration, file writes trigger file watchers
 * - Watchers detect changes and trigger regeneration
 * - This creates an INFINITE LOOP: write → watch → regenerate → write → ...
 * 
 * SOLUTION:
 * - Every write MUST follow the safe write pattern:
 *   1. onBeforeGenerate(filepath, content) - Tell tracker what we're writing
 *   2. fs.writeFile(filepath, content) - Actually write the file
 *   3. onAfterGenerate(filepath) - Tell tracker we're done
 * - If timing is wrong, infinite loops WILL occur
 * - If step 1 or 3 is skipped, infinite loops WILL occur
 * 
 * CRITICAL SAFETY PATTERN:
 * ```typescript
 * await tracker.onBeforeGenerate(filepath, content);
 * try {
 *   await fs.writeFile(filepath, content);
 * } finally {
 *   // ALWAYS call onAfterGenerate, even on error!
 *   await tracker.onAfterGenerate(filepath);
 * }
 * ```
 * 
 * @security-critical false
 * @performance-critical true - File I/O on critical path
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileChangeTracker } from '../FileChangeTracker';
import type {
  IFileWriter,
  FileWriteResult,
  FileToWrite,
  PERFORMANCE_CONFIG,
} from './types';

/**
 * Configuration options for FileWriter
 */
export interface FileWriterOptions {
  /** FileChangeTracker instance for infinite loop prevention */
  fileChangeTracker: FileChangeTracker;
  
  /** Maximum concurrent file writes (default: 5) */
  maxConcurrentWrites?: number;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
}

/**
 * FileWriter safely writes files to disk with FileChangeTracker integration
 * 
 * CRITICAL: This class is the bridge between code generation and the file system.
 * Every file write MUST go through this class to prevent infinite loops.
 * 
 * USAGE:
 * ```typescript
 * const writer = new FileWriter({ fileChangeTracker: tracker });
 * 
 * // Write single file (safe)
 * const result = await writer.writeFile('/path/to/Component.jsx', code);
 * 
 * // Write multiple files (safe, with concurrency control)
 * const files = [
 *   { filepath: '/path/to/Button.jsx', content: buttonCode, type: 'component' },
 *   { filepath: '/path/to/Header.jsx', content: headerCode, type: 'component' },
 * ];
 * const results = await writer.writeFiles(files);
 * ```
 * 
 * THE SAFE WRITE PATTERN:
 * Every single call to fs.writeFile MUST be wrapped like this:
 * 
 * ```typescript
 * // 1. BEFORE: Tell tracker what we're about to write
 * await this.fileChangeTracker.onBeforeGenerate(filepath, content);
 * 
 * try {
 *   // 2. WRITE: Actually write the file
 *   await fs.promises.writeFile(filepath, content, 'utf-8');
 * } finally {
 *   // 3. AFTER: Tell tracker we're done (ALWAYS, even on error!)
 *   await this.fileChangeTracker.onAfterGenerate(filepath);
 * }
 * ```
 * 
 * If you skip step 1 or 3, or call them in the wrong order:
 * - Infinite loops WILL occur
 * - The file watcher will detect our write as a "user edit"
 * - This triggers regeneration, which writes again, which triggers...
 * 
 * ATOMIC WRITES:
 * For additional safety, we write to a temp file first, then rename.
 * This ensures partial writes don't corrupt the target file.
 * 
 * @class FileWriter
 * @implements {IFileWriter}
 */
export class FileWriter implements IFileWriter {
  /**
   * FileChangeTracker instance for infinite loop prevention
   * CRITICAL: Must be the same instance used by the file watcher
   */
  private fileChangeTracker: FileChangeTracker;

  /**
   * Maximum concurrent file writes
   * Prevents overwhelming the file system on large projects
   */
  private maxConcurrentWrites: number;

  /**
   * Enable debug logging
   */
  private debug: boolean;

  /**
   * Create a new FileWriter instance
   * 
   * @param options - Configuration options (fileChangeTracker is REQUIRED)
   * @throws Error if fileChangeTracker is not provided
   * 
   * @example
   * ```typescript
   * const tracker = new FileChangeTracker();
   * const writer = new FileWriter({ fileChangeTracker: tracker });
   * ```
   */
  constructor(options: FileWriterOptions) {
    // Validate required options
    if (!options.fileChangeTracker) {
      throw new Error(
        'FileWriter requires a FileChangeTracker instance. ' +
        'This is CRITICAL for preventing infinite loops.'
      );
    }

    this.fileChangeTracker = options.fileChangeTracker;
    this.maxConcurrentWrites = options.maxConcurrentWrites ?? 5;
    this.debug = options.debug ?? false;

    if (this.debug) {
      console.log(
        '[FileWriter] Initialized with:\n' +
        `  maxConcurrentWrites: ${this.maxConcurrentWrites}\n` +
        `  tracker: ${this.fileChangeTracker ? 'provided' : 'MISSING!'}`
      );
    }
  }

  /**
   * Write a single file with FileChangeTracker integration
   * 
   * THIS IS THE CRITICAL METHOD - handles the safe write pattern
   * 
   * SEQUENCE:
   * 1. Ensure parent directory exists
   * 2. Call onBeforeGenerate (CRITICAL - before any file I/O)
   * 3. Write to temp file
   * 4. Rename temp to actual file (atomic)
   * 5. Call onAfterGenerate (CRITICAL - in finally block)
   * 
   * @param filepath - Absolute path to write to
   * @param content - Content to write
   * @returns Promise<FileWriteResult> with success status
   * 
   * @example
   * ```typescript
   * const result = await writer.writeFile('/project/src/Button.jsx', code);
   * if (!result.success) {
   *   console.error('Write failed:', result.error);
   * }
   * ```
   */
  async writeFile(filepath: string, content: string): Promise<FileWriteResult> {
    const startTime = performance.now();

    // Debug log start
    if (this.debug) {
      console.log(`[FileWriter] writeFile: ${filepath} (${content.length} bytes)`);
    }

    // Ensure parent directory exists
    const dir = path.dirname(filepath);
    try {
      await this.ensureDirectory(dir);
    } catch (error) {
      // Directory creation failed
      return {
        success: false,
        filepath,
        error: `Failed to create directory ${dir}: ${error instanceof Error ? error.message : String(error)}`,
        durationMs: performance.now() - startTime,
      };
    }

    // =========================================================================
    // CRITICAL SECTION: Safe Write Pattern
    // This is where infinite loop prevention happens
    // =========================================================================

    // STEP 1: Tell tracker we're about to write this file
    // This computes the hash and pauses file watching for this path
    // MUST happen BEFORE any file I/O
    try {
      await this.fileChangeTracker.onBeforeGenerate(filepath, content);
    } catch (error) {
      // If tracker setup fails, we must NOT proceed with the write
      // because the file watcher would see it as a user edit
      return {
        success: false,
        filepath,
        error: `Tracker setup failed (CRITICAL): ${error instanceof Error ? error.message : String(error)}`,
        durationMs: performance.now() - startTime,
      };
    }

    // STEP 2 & 3: Write file and notify tracker
    // onAfterGenerate MUST be called even if write fails
    let writeError: string | undefined;
    let bytesWritten: number | undefined;

    try {
      // Write to temp file first (atomic write pattern)
      const tempPath = `${filepath}.tmp.${Date.now()}`;

      try {
        // Write content to temp file
        await fs.writeFile(tempPath, content, 'utf-8');
        
        // Rename temp to actual file (atomic on most systems)
        await fs.rename(tempPath, filepath);
        
        // Success!
        bytesWritten = Buffer.byteLength(content, 'utf-8');

        if (this.debug) {
          console.log(`[FileWriter] Successfully wrote: ${filepath}`);
        }
      } catch (ioError) {
        // File I/O failed
        writeError = `File write failed: ${ioError instanceof Error ? ioError.message : String(ioError)}`;

        // Try to clean up temp file
        try {
          await fs.unlink(tempPath);
        } catch {
          // Ignore cleanup errors
        }
      }
    } finally {
      // STEP 3: Tell tracker we're done (ALWAYS)
      // This clears the pause and allows file watching to resume
      // CRITICAL: Must happen even if write failed!
      try {
        await this.fileChangeTracker.onAfterGenerate(filepath);
      } catch (trackerError) {
        // Log but don't override the write error
        console.error(
          `[FileWriter] onAfterGenerate failed for ${filepath}: ` +
          `${trackerError instanceof Error ? trackerError.message : String(trackerError)}\n` +
          `This may leave the file in a paused state.`
        );
      }
    }

    // =========================================================================
    // End Critical Section
    // =========================================================================

    const durationMs = performance.now() - startTime;

    // Return result
    if (writeError) {
      return {
        success: false,
        filepath,
        error: writeError,
        durationMs,
      };
    }

    return {
      success: true,
      filepath,
      bytesWritten,
      durationMs,
    };
  }

  /**
   * Write multiple files with concurrency control
   * 
   * Files are written in batches to avoid overwhelming the file system.
   * Each file goes through the safe write pattern individually.
   * 
   * @param files - Array of files to write
   * @returns Promise<FileWriteResult[]> with result for each file
   * 
   * @example
   * ```typescript
   * const files = [
   *   { filepath: '/path/to/Button.jsx', content: code1, type: 'component' },
   *   { filepath: '/path/to/Header.jsx', content: code2, type: 'component' },
   * ];
   * const results = await writer.writeFiles(files);
   * const failures = results.filter(r => !r.success);
   * ```
   */
  async writeFiles(files: FileToWrite[]): Promise<FileWriteResult[]> {
    const startTime = performance.now();
    const results: FileWriteResult[] = [];

    if (this.debug) {
      console.log(`[FileWriter] writeFiles: ${files.length} files, batch size: ${this.maxConcurrentWrites}`);
    }

    // Process files in batches to control concurrency
    for (let i = 0; i < files.length; i += this.maxConcurrentWrites) {
      // Get batch of files
      const batch = files.slice(i, i + this.maxConcurrentWrites);

      // Process batch concurrently
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          return this.writeFile(file.filepath, file.content);
        })
      );

      // Collect results
      results.push(...batchResults);
    }

    // Log summary
    if (this.debug) {
      const totalDuration = performance.now() - startTime;
      const successCount = results.filter((r) => r.success).length;
      console.log(
        `[FileWriter] writeFiles completed in ${totalDuration.toFixed(2)}ms\n` +
        `  Success: ${successCount}/${files.length}`
      );
    }

    return results;
  }

  /**
   * Delete a file from disk
   * 
   * Note: Deletes do NOT go through FileChangeTracker because
   * we're not generating content. The file watcher will see the
   * deletion, but that's expected behavior.
   * 
   * @param filepath - Absolute path to delete
   * @throws Error if deletion fails (unless file doesn't exist)
   * 
   * @example
   * ```typescript
   * await writer.deleteFile('/project/src/OldComponent.jsx');
   * ```
   */
  async deleteFile(filepath: string): Promise<void> {
    if (this.debug) {
      console.log(`[FileWriter] deleteFile: ${filepath}`);
    }

    try {
      await fs.unlink(filepath);
    } catch (error) {
      // Ignore if file doesn't exist
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        if (this.debug) {
          console.log(`[FileWriter] File already deleted: ${filepath}`);
        }
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Delete multiple files
   * 
   * @param filepaths - Array of absolute paths to delete
   */
  async deleteFiles(filepaths: string[]): Promise<void> {
    if (this.debug) {
      console.log(`[FileWriter] deleteFiles: ${filepaths.length} files`);
    }

    // Delete in parallel (deletes are fast and don't need batching)
    await Promise.all(filepaths.map((fp) => this.deleteFile(fp)));
  }

  /**
   * Ensure a directory exists, creating it if needed
   * 
   * @param dirPath - Absolute path to directory
   */
  async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // Ignore if directory already exists
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        return;
      }
      throw error;
    }
  }

  /**
   * Check if a file exists
   * 
   * @param filepath - Absolute path to check
   * @returns Promise<boolean> true if file exists
   */
  async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read file content (for comparison or debugging)
   * 
   * @param filepath - Absolute path to read
   * @returns Promise<string | null> file content or null if doesn't exist
   */
  async readFile(filepath: string): Promise<string | null> {
    try {
      return await fs.readFile(filepath, 'utf-8');
    } catch {
      return null;
    }
  }

  /**
   * Get the FileChangeTracker instance (for testing/debugging)
   */
  getTracker(): FileChangeTracker {
    return this.fileChangeTracker;
  }
}

/**
 * Factory function to create FileWriter instance
 */
export function createFileWriter(options: FileWriterOptions): FileWriter {
  return new FileWriter(options);
}

// =============================================================================
// SAFETY DOCUMENTATION
// =============================================================================

/**
 * WHY THE SAFE WRITE PATTERN MATTERS
 * ==================================
 * 
 * Without FileChangeTracker integration, this happens:
 * 
 * 1. User modifies component in UI
 * 2. Manifest updates
 * 3. Code generator creates new component code
 * 4. FileWriter writes code to disk
 * 5. File watcher (chokidar) detects the change
 * 6. Watcher thinks "user edited the file!"
 * 7. System triggers regeneration
 * 8. Code generator creates component code (same as step 3)
 * 9. FileWriter writes code to disk (same as step 4)
 * 10. GOTO step 5... INFINITE LOOP!
 * 
 * With FileChangeTracker:
 * 
 * 1. User modifies component in UI
 * 2. Manifest updates
 * 3. Code generator creates new component code
 * 4. onBeforeGenerate(filepath, content) - stores hash of what we'll write
 * 5. FileWriter writes code to disk
 * 6. File watcher (chokidar) detects the change
 * 7. isUserEdit(filepath, content) returns FALSE (hash matches!)
 * 8. System says "oh, that's just my own write, ignore it"
 * 9. DONE - no infinite loop!
 * 
 * THE TIMING IS CRITICAL:
 * - onBeforeGenerate MUST be called BEFORE the file write
 * - onAfterGenerate MUST be called AFTER the file write completes
 * - If the order is wrong, the hash won't be stored in time
 * - If onAfterGenerate is skipped (e.g., exception), the file stays paused
 * 
 * ALWAYS USE FINALLY:
 * ```typescript
 * await tracker.onBeforeGenerate(filepath, content);
 * try {
 *   await fs.writeFile(filepath, content);
 * } finally {
 *   await tracker.onAfterGenerate(filepath);  // ALWAYS!
 * }
 * ```
 */
