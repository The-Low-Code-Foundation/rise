/**
 * @file generationStore.ts
 * @description Zustand store for managing code generation status and feedback
 * 
 * @architecture Phase 3, Task 3.3 - Live Preview Integration
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple state management, follows established patterns
 * 
 * @see src/core/filemanager/FileManager.ts - Performs actual generation
 * @see src/renderer/services/GenerationService.ts - Orchestrates generation
 * @see src/renderer/components/GenerationStatus.tsx - Displays status
 * 
 * PROBLEM SOLVED:
 * - Need to track code generation status for UI feedback
 * - Show users when generation is pending, in progress, complete, or failed
 * - Display last generation info (files written, duration)
 * - Handle errors gracefully with clear messages
 * 
 * SOLUTION:
 * - Simple Zustand store with status, error, and lastGeneration state
 * - Status transitions: idle → pending → generating → complete/error → idle
 * - Auto-clear success status after timeout
 * - Error state persists until manually cleared or next generation starts
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * // Read status in component
 * const { status, error, lastGeneration } = useGenerationStore();
 * 
 * // Update status from GenerationService
 * useGenerationStore.getState().setStatus('generating');
 * useGenerationStore.getState().setLastGeneration({ filesWritten: 3, durationMs: 150 });
 * ```
 * 
 * STATE MACHINE:
 * ```
 *   idle ──[manifest change]──→ pending
 *     ↑                            │
 *     │                      [debounce timeout]
 *     │                            ↓
 *   [3s]                      generating
 *     ↑                         │    │
 *     │                    [success] [error]
 *     │                         ↓    ↓
 *  complete ←─────────────────┘   error
 *     │                            │
 *     └────[3s auto-clear]─────────┘ (error persists until next attempt)
 * ```
 * 
 * @performance O(1) for all operations
 * @security-critical false
 * @performance-critical false
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Generation status states
 * 
 * STATE DESCRIPTIONS:
 * - idle: No generation activity (initial state, or after success clears)
 * - pending: Manifest changed, waiting for debounce timeout
 * - generating: Actively generating files via FileManager
 * - complete: Generation finished successfully (auto-clears to idle after 3s)
 * - error: Generation failed (persists until next generation attempt)
 */
export type GenerationStatus = 'idle' | 'pending' | 'generating' | 'complete' | 'error';

/**
 * Information about the last successful generation
 */
export interface LastGeneration {
  /** Unix timestamp when generation completed */
  timestamp: number;
  
  /** Number of files written (components + App.jsx + main.jsx) */
  filesWritten: number;
  
  /** Total generation duration in milliseconds */
  durationMs: number;
  
  /** Optional breakdown of what was generated */
  breakdown?: {
    added: number;
    modified: number;
    removed: number;
    appRegenerated: boolean;
  };
}

/**
 * Generation store state interface
 */
export interface GenerationState {
  // ----- State -----
  
  /** Current generation status */
  status: GenerationStatus;
  
  /** Error message if status is 'error', null otherwise */
  error: string | null;
  
  /** Info about last successful generation (null if none yet) */
  lastGeneration: LastGeneration | null;
  
  /** Whether the generation system is initialized and watching */
  isWatching: boolean;
  
  // ----- Actions -----
  
  /** Set the generation status */
  setStatus: (status: GenerationStatus) => void;
  
  /** Set error message (also sets status to 'error') */
  setError: (error: string | null) => void;
  
  /** Record successful generation */
  setLastGeneration: (info: LastGeneration) => void;
  
  /** Mark generation service as watching for changes */
  setWatching: (watching: boolean) => void;
  
  /** Reset to initial state */
  reset: () => void;
  
  /** Clear error and reset to idle */
  clearError: () => void;
}

// =============================================================================
// INITIAL STATE
// =============================================================================

/**
 * Initial state for the generation store
 */
const initialState: Pick<GenerationState, 'status' | 'error' | 'lastGeneration' | 'isWatching'> = {
  status: 'idle',
  error: null,
  lastGeneration: null,
  isWatching: false,
};

// =============================================================================
// STORE
// =============================================================================

/**
 * Generation store for managing code generation status
 * 
 * This store tracks the status of file generation from manifest changes.
 * It's used by GenerationService to report progress and by GenerationStatus
 * component to display feedback to the user.
 * 
 * STATUS FLOW:
 * 1. User edits manifest → status becomes 'pending'
 * 2. After debounce delay → status becomes 'generating'
 * 3. FileManager completes → status becomes 'complete' or 'error'
 * 4. After 3 seconds → status returns to 'idle' (success) or stays 'error'
 * 
 * THREADING NOTE:
 * All state updates happen in the renderer process. The actual file
 * generation happens in the main process via IPC, but status updates
 * are sent back to renderer and applied here.
 * 
 * @example
 * ```typescript
 * // In GenerationService
 * const store = useGenerationStore.getState();
 * 
 * // Start generation
 * store.setStatus('pending');
 * 
 * // After debounce
 * store.setStatus('generating');
 * 
 * // On success
 * store.setStatus('complete');
 * store.setLastGeneration({ timestamp: Date.now(), filesWritten: 3, durationMs: 150 });
 * 
 * // On error
 * store.setError('Failed to write file: permission denied');
 * ```
 */
export const useGenerationStore = create<GenerationState>((set, get) => ({
  // Initial state
  ...initialState,

  /**
   * Set the generation status
   * 
   * Clears error when transitioning away from error state.
   * 
   * @param status - New status value
   */
  setStatus: (status: GenerationStatus) => {
    set((state) => ({
      status,
      // Clear error when starting new generation cycle
      error: status === 'pending' || status === 'generating' ? null : state.error,
    }));
  },

  /**
   * Set error message and status
   * 
   * Setting an error also sets status to 'error'.
   * Setting error to null clears the error but keeps status.
   * 
   * @param error - Error message or null to clear
   */
  setError: (error: string | null) => {
    set({
      error,
      status: error ? 'error' : get().status,
    });
  },

  /**
   * Record last successful generation info
   * 
   * Called after FileManager successfully generates files.
   * Also updates status to 'complete'.
   * 
   * @param info - Generation result info
   */
  setLastGeneration: (info: LastGeneration) => {
    set({
      lastGeneration: info,
      status: 'complete',
      error: null,
    });
  },

  /**
   * Set whether generation service is watching for changes
   * 
   * @param watching - true if watching, false otherwise
   */
  setWatching: (watching: boolean) => {
    set({ isWatching: watching });
  },

  /**
   * Reset store to initial state
   * 
   * Called when project closes or on initialization.
   */
  reset: () => {
    set(initialState);
  },

  /**
   * Clear error and reset to idle status
   * 
   * Used for manual error dismissal in UI.
   */
  clearError: () => {
    set({
      error: null,
      status: 'idle',
    });
  },
}));

// =============================================================================
// SELECTORS
// =============================================================================

/**
 * Selector to check if generation is active (pending or generating)
 */
export const selectIsGenerating = (state: GenerationState): boolean => 
  state.status === 'pending' || state.status === 'generating';

/**
 * Selector to check if there's an error
 */
export const selectHasError = (state: GenerationState): boolean =>
  state.status === 'error' && state.error !== null;

/**
 * Selector to get a human-readable status message
 */
export const selectStatusMessage = (state: GenerationState): string => {
  switch (state.status) {
    case 'idle':
      return 'Ready';
    case 'pending':
      return 'Changes detected...';
    case 'generating':
      return 'Generating files...';
    case 'complete':
      if (state.lastGeneration) {
        return `Generated ${state.lastGeneration.filesWritten} files (${state.lastGeneration.durationMs}ms)`;
      }
      return 'Generation complete';
    case 'error':
      return state.error || 'Generation failed';
    default:
      return 'Unknown';
  }
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Format duration for display
 * 
 * @param ms - Duration in milliseconds
 * @returns Formatted string (e.g., "150ms" or "1.5s")
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Format timestamp as relative time
 * 
 * @param timestamp - Unix timestamp
 * @returns Relative time string (e.g., "just now", "5s ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}
