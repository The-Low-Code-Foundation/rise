/**
 * @file previewStore.ts
 * @description Zustand store for preview panel state management
 * 
 * Manages all preview-related state including:
 * - Vite server status and connection
 * - Viewport dimensions and presets
 * - Zoom level
 * - Server output/events
 * - Console logs and filtering (Task 1.4C)
 * 
 * @architecture Phase 1, Task 1.4B/1.4C - Preview Panel UI + Console
 * @created 2025-11-25
 * @updated 2025-11-25 - Added console state (Task 1.4C)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Zustand patterns with IPC integration
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * @see .implementation/phase-1-application-shell/task-1.4C-console-capture.md
 * @see src/main/preview/types.ts - Type definitions
 * 
 * @security-critical false
 * @performance-critical true - Console log appending
 */

import { create } from 'zustand';
import type {
  ConsoleEntry,
  ConsoleFilter,
  ConsoleMessage,
  GroupState,
  TimerState,
  CounterState,
} from '../components/Console/types';

/**
 * Preview server status type
 * Mirrors ViteServerStatus from main process
 */
type PreviewStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

/**
 * Viewport preset interface
 * Defines common device sizes for responsive testing
 */
interface ViewportPreset {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: 'phone' | 'tablet' | 'laptop' | 'desktop' | 'arrows';
}

/**
 * Access the electron API from window
 * Type assertion needed since TypeScript doesn't know about preload injection
 */
const electronAPI = (globalThis as any).electronAPI;

/**
 * Default viewport presets for responsive design testing
 * 
 * Covers common device sizes from mobile to desktop.
 * "Responsive" preset (-1 values) fills available space.
 */
export const VIEWPORT_PRESETS: ViewportPreset[] = [
  { id: 'iphone-se', name: 'iPhone SE', width: 375, height: 667, icon: 'phone' },
  { id: 'iphone-14', name: 'iPhone 14', width: 390, height: 844, icon: 'phone' },
  { id: 'iphone-14-max', name: 'iPhone 14 Pro Max', width: 430, height: 932, icon: 'phone' },
  { id: 'ipad-mini', name: 'iPad Mini', width: 768, height: 1024, icon: 'tablet' },
  { id: 'ipad-pro', name: 'iPad Pro 12.9"', width: 1024, height: 1366, icon: 'tablet' },
  { id: 'laptop', name: 'Laptop', width: 1280, height: 800, icon: 'laptop' },
  { id: 'desktop-hd', name: 'Desktop HD', width: 1920, height: 1080, icon: 'desktop' },
  { id: 'responsive', name: 'Responsive', width: -1, height: -1, icon: 'arrows' },
];

/**
 * Available zoom levels for preview (as percentages displayed to user)
 * Values are decimals (0.25 = 25%, 1 = 100%, etc.)
 */
export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Preview Store State Interface
 * 
 * Complete state for preview panel including server status,
 * viewport configuration, and control actions.
 */
interface PreviewState {
  // ===== Server State =====
  /** Current server status */
  status: PreviewStatus;
  
  /** Full URL to preview (e.g., http://localhost:3001) */
  previewUrl: string | null;
  
  /** Port number server is running on */
  port: number | null;
  
  /** Error message if status is 'error' */
  error: string | null;
  
  /** Path to project currently being previewed */
  projectPath: string | null;
  
  // ===== Viewport State =====
  /** Current viewport width in pixels (-1 for responsive) */
  viewportWidth: number;
  
  /** Current viewport height in pixels (-1 for responsive) */
  viewportHeight: number;
  
  /** Currently active preset ID (null for custom dimensions) */
  activePresetId: string | null;
  
  // ===== Zoom State =====
  /** Current zoom level (0.25 - 2) */
  zoom: number;
  
  // ===== UI State =====
  /** Counter to force iframe refresh */
  refreshKey: number;
  
  // ===== Console State (Task 1.4C) =====
  /** All console log entries */
  consoleLogs: ConsoleEntry[];
  
  /** Maximum number of console entries to store */
  maxConsoleLogs: number;
  
  /** Current console filter */
  consoleFilter: ConsoleFilter;
  
  /** Console search query */
  consoleSearchQuery: string;
  
  /** Auto-scroll console to bottom on new entries */
  consoleAutoScroll: boolean;
  
  /** Show timestamps in console entries */
  consoleShowTimestamps: boolean;
  
  /** Active console groups */
  consoleGroups: Map<string, GroupState>;
  
  /** Active console timers */
  consoleTimers: Map<string, TimerState>;
  
  /** Active console counters */
  consoleCounters: Map<string, CounterState>;
  
  /** Current group ID for new entries */
  consoleCurrentGroupId: string | null;
  
  /** Current nesting level */
  consoleCurrentGroupLevel: number;
  
  /** UI: Collapsed group IDs */
  consoleCollapsedGroups: Set<string>;
  
  /** UI: Expanded object paths in console entries */
  consoleExpandedPaths: Set<string>;
  
  // ===== Actions =====
  /** Start preview server for a project */
  startPreview: (projectPath: string) => Promise<void>;
  
  /** Stop the current preview server */
  stopPreview: () => Promise<void>;
  
  /** Restart the preview server */
  restartPreview: () => Promise<void>;
  
  /** Set viewport to a preset */
  setViewportPreset: (presetId: string) => void;
  
  /** Set custom viewport dimensions */
  setCustomViewport: (width: number, height: number) => void;
  
  /** Set zoom level */
  setZoom: (zoom: number) => void;
  
  /** Force refresh the preview iframe */
  refreshPreview: () => void;
  
  /** Reset store to initial state */
  reset: () => void;
  
  /** Initialize event listeners (call once on app mount) */
  initializeListeners: () => () => void;
  
  // ===== Console Actions (Task 1.4C) =====
  /** Add a console log entry */
  addConsoleLog: (message: ConsoleMessage) => void;
  
  /** Clear all console logs */
  clearConsole: () => void;
  
  /** Set console filter */
  setConsoleFilter: (filter: ConsoleFilter) => void;
  
  /** Set console search query */
  setConsoleSearchQuery: (query: string) => void;
  
  /** Toggle console auto-scroll */
  toggleConsoleAutoScroll: () => void;
  
  /** Toggle console timestamps */
  toggleConsoleTimestamps: () => void;
  
  /** Toggle console group collapsed state */
  toggleConsoleGroup: (groupId: string) => void;
  
  /** Toggle console object path expanded state */
  toggleConsoleObjectPath: (path: string) => void;
  
  /** Export console logs */
  exportConsoleLogs: (format: 'json' | 'text') => void;
  
  /** Get error count from console logs */
  getConsoleErrorCount: () => number;
  
  /** Get warning count from console logs */
  getConsoleWarningCount: () => number;
}

/**
 * Initial state values
 * Used for reset functionality
 */
const initialState = {
  status: 'stopped' as PreviewStatus,
  previewUrl: null,
  port: null,
  error: null,
  projectPath: null,
  viewportWidth: -1, // Default to responsive
  viewportHeight: -1,
  activePresetId: 'responsive',
  zoom: 1,
  refreshKey: 0,
  
  // Console state
  consoleLogs: [] as ConsoleEntry[],
  maxConsoleLogs: 10000,
  consoleFilter: 'all' as ConsoleFilter,
  consoleSearchQuery: '',
  consoleAutoScroll: true,
  consoleShowTimestamps: false,
  consoleGroups: new Map<string, GroupState>(),
  consoleTimers: new Map<string, TimerState>(),
  consoleCounters: new Map<string, CounterState>(),
  consoleCurrentGroupId: null,
  consoleCurrentGroupLevel: 0,
  consoleCollapsedGroups: new Set<string>(),
  consoleExpandedPaths: new Set<string>(),
};

/**
 * Preview Store
 * 
 * Central state management for preview panel.
 * Handles server lifecycle, viewport configuration, and IPC communication.
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const { status, startPreview, setViewportPreset } = usePreviewStore();
 * 
 * // Start preview when project opens
 * await startPreview('/path/to/project');
 * 
 * // Change viewport
 * setViewportPreset('iphone-14');
 * ```
 */
export const usePreviewStore = create<PreviewState>((set, get) => ({
  // ===== Initial State =====
  ...initialState,
  
  // ===== Actions =====
  
  /**
   * Start the Vite dev server for a project
   * 
   * WORKFLOW:
   * 1. Set status to 'starting'
   * 2. Call IPC to start server
   * 3. Update state with result (running/error)
   * 
   * @param projectPath - Absolute path to project directory
   */
  startPreview: async (projectPath: string) => {
    // Don't start if already starting or running for same project
    const currentState = get();
    if (currentState.status === 'starting') {
      return;
    }
    if (currentState.status === 'running' && currentState.projectPath === projectPath) {
      return;
    }
    
    // Stop existing server if running different project
    if (currentState.status === 'running' && currentState.projectPath !== projectPath) {
      await get().stopPreview();
    }
    
    // Update state to starting
    set({
      status: 'starting',
      error: null,
      projectPath,
    });
    
    try {
      // Call IPC to start server
      const result = await electronAPI.preview.start(projectPath);
      
      if (result.success && result.data) {
        // Server started successfully
        set({
          status: 'running',
          previewUrl: result.data.url,
          port: result.data.port,
          error: null,
        });
      } else {
        // Server failed to start
        set({
          status: 'error',
          error: result.error || 'Failed to start preview server',
          previewUrl: null,
          port: null,
        });
      }
    } catch (error) {
      // IPC call failed
      const message = error instanceof Error ? error.message : String(error);
      set({
        status: 'error',
        error: `Preview start failed: ${message}`,
        previewUrl: null,
        port: null,
      });
    }
  },
  
  /**
   * Stop the currently running preview server
   * 
   * Gracefully shuts down the Vite process.
   */
  stopPreview: async () => {
    const { status } = get();
    
    // Only stop if running
    if (status !== 'running' && status !== 'starting') {
      return;
    }
    
    set({ status: 'stopping' });
    
    try {
      await electronAPI.preview.stop();
      set({
        status: 'stopped',
        previewUrl: null,
        port: null,
        projectPath: null,
        error: null,
      });
    } catch (error) {
      // Even if stop fails, mark as stopped
      const message = error instanceof Error ? error.message : String(error);
      console.error('[PreviewStore] Stop failed:', message);
      set({
        status: 'stopped',
        previewUrl: null,
        port: null,
        error: null,
      });
    }
  },
  
  /**
   * Restart the preview server
   * 
   * Useful after npm install or config changes.
   */
  restartPreview: async () => {
    const { projectPath, status } = get();
    
    // Need a project path to restart
    if (!projectPath) {
      return;
    }
    
    // Set to starting state
    set({ status: 'starting', error: null });
    
    try {
      const result = await electronAPI.preview.restart();
      
      if (result.success && result.data) {
        set({
          status: 'running',
          previewUrl: result.data.url,
          port: result.data.port,
          error: null,
        });
      } else {
        set({
          status: 'error',
          error: result.error || 'Failed to restart preview server',
          previewUrl: null,
          port: null,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      set({
        status: 'error',
        error: `Preview restart failed: ${message}`,
        previewUrl: null,
        port: null,
      });
    }
  },
  
  /**
   * Set viewport to a predefined preset
   * 
   * @param presetId - ID of the preset to apply
   */
  setViewportPreset: (presetId: string) => {
    const preset = VIEWPORT_PRESETS.find(p => p.id === presetId);
    if (preset) {
      set({
        viewportWidth: preset.width,
        viewportHeight: preset.height,
        activePresetId: presetId,
      });
    }
  },
  
  /**
   * Set custom viewport dimensions
   * 
   * Clears the active preset since dimensions are custom.
   * 
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   */
  setCustomViewport: (width: number, height: number) => {
    set({
      viewportWidth: width,
      viewportHeight: height,
      activePresetId: null, // Custom dimensions, no preset
    });
  },
  
  /**
   * Set the zoom level
   * 
   * @param zoom - Zoom level (0.25 - 2)
   */
  setZoom: (zoom: number) => {
    // Clamp to valid range
    const clampedZoom = Math.max(0.25, Math.min(2, zoom));
    set({ zoom: clampedZoom });
  },
  
  /**
   * Force refresh the preview iframe
   * 
   * Increments refreshKey to force iframe remount.
   */
  refreshPreview: () => {
    set(state => ({ refreshKey: state.refreshKey + 1 }));
  },
  
  /**
   * Reset store to initial state
   * 
   * Called when closing project or cleaning up.
   */
  reset: () => {
    set(initialState);
  },
  
  /**
   * Initialize IPC event listeners
   * 
   * Sets up listeners for server events from main process.
   * Returns cleanup function to remove listeners.
   * 
   * @returns Cleanup function
   */
  initializeListeners: () => {
    // Listen for server ready events
    const cleanupReady = electronAPI.preview.onReady((data: { port: number; url: string }) => {
      set({
        status: 'running',
        previewUrl: data.url,
        port: data.port,
        error: null,
      });
    });
    
    // Listen for server error events
    const cleanupError = electronAPI.preview.onError((data: { message: string; code?: string }) => {
      set({
        status: 'error',
        error: data.message,
      });
    });
    
    // Listen for state changes
    const cleanupStateChange = electronAPI.preview.onStateChange((state: any) => {
      set({
        status: state.status,
        previewUrl: state.url,
        port: state.port,
        error: state.error,
        projectPath: state.projectPath,
      });
    });
    
    // Return cleanup function
    return () => {
      cleanupReady();
      cleanupError();
      cleanupStateChange();
    };
  },
  
  // ===== Console Actions (Task 1.4C) =====
  
  /**
   * Add a console log entry from iframe
   * 
   * Processes console messages from the injected script,
   * handles groups/timers/counters, and adds to log list.
   * 
   * @param message - Console message from iframe
   */
  addConsoleLog: (message: ConsoleMessage) => {
    const state = get();
    
    // Handle console.clear() - clear all logs
    if (message.method === 'clear') {
      set({ consoleLogs: [] });
      return;
    }
    
    // Handle console.groupEnd() - just pop the group stack
    if (message.method === 'groupEnd') {
      const newGroups = new Map(state.consoleGroups);
      const currentGroup = state.consoleCurrentGroupId
        ? newGroups.get(state.consoleCurrentGroupId)
        : null;
      
      const parentId = currentGroup?.parentId || null;
      const newLevel = Math.max(0, state.consoleCurrentGroupLevel - 1);
      
      set({
        consoleCurrentGroupId: parentId,
        consoleCurrentGroupLevel: newLevel,
      });
      return;
    }
    
    // Handle console.group() or console.groupCollapsed()
    if (message.method === 'group' || message.method === 'groupCollapsed') {
      const groupId = `group-${Date.now()}-${Math.random()}`;
      const groupLabel = message.metadata?.groupLabel || 'Group';
      const collapsed = message.metadata?.groupCollapsed || false;
      
      const newGroups = new Map(state.consoleGroups);
      newGroups.set(groupId, {
        id: groupId,
        label: groupLabel,
        parentId: state.consoleCurrentGroupId,
        level: state.consoleCurrentGroupLevel,
        collapsed: false, // UI collapsed state
        startCollapsed: collapsed,
      });
      
      // Add to collapsed groups if groupCollapsed
      const newCollapsed = new Set(state.consoleCollapsedGroups);
      if (collapsed) {
        newCollapsed.add(groupId);
      }
      
      // Create log entry for the group header
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(message.timestamp),
        method: message.method,
        args: message.args,
        groupId: state.consoleCurrentGroupId || undefined,
        groupLevel: state.consoleCurrentGroupLevel,
        groupLabel,
        groupCollapsed: collapsed,
      };
      
      // Add entry and update group state
      const newLogs = [...state.consoleLogs, entry];
      
      // Enforce max logs limit (drop oldest)
      if (newLogs.length > state.maxConsoleLogs) {
        newLogs.splice(0, newLogs.length - state.maxConsoleLogs);
      }
      
      set({
        consoleLogs: newLogs,
        consoleGroups: newGroups,
        consoleCollapsedGroups: newCollapsed,
        consoleCurrentGroupId: groupId,
        consoleCurrentGroupLevel: state.consoleCurrentGroupLevel + 1,
      });
      return;
    }
    
    // Handle console.time() - start a timer
    if (message.method === 'time') {
      const timerId = message.metadata?.timerId || 'default';
      const newTimers = new Map(state.consoleTimers);
      newTimers.set(timerId, {
        label: timerId,
        startTime: message.timestamp,
      });
      set({ consoleTimers: newTimers });
      // Don't create a log entry for console.time()
      return;
    }
    
    // Handle console.timeLog() or console.timeEnd()
    if (message.method === 'timeLog' || message.method === 'timeEnd') {
      const timerId = message.metadata?.timerId || 'default';
      const duration = message.metadata?.duration;
      
      // If timeEnd, remove from timers
      if (message.method === 'timeEnd') {
        const newTimers = new Map(state.consoleTimers);
        newTimers.delete(timerId);
        set({ consoleTimers: newTimers });
      }
      
      // Create log entry with duration
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(message.timestamp),
        method: message.method,
        args: message.args,
        groupId: state.consoleCurrentGroupId || undefined,
        groupLevel: state.consoleCurrentGroupLevel,
        timerId,
        duration,
      };
      
      const newLogs = [...state.consoleLogs, entry];
      if (newLogs.length > state.maxConsoleLogs) {
        newLogs.splice(0, newLogs.length - state.maxConsoleLogs);
      }
      
      set({ consoleLogs: newLogs });
      return;
    }
    
    // Handle console.count()
    if (message.method === 'count') {
      const label = message.metadata?.countLabel || 'default';
      const value = message.metadata?.countValue || 1;
      
      const newCounters = new Map(state.consoleCounters);
      newCounters.set(label, { label, count: value });
      
      const entry: ConsoleEntry = {
        id: `${Date.now()}-${Math.random()}`,
        timestamp: new Date(message.timestamp),
        method: message.method,
        args: message.args,
        groupId: state.consoleCurrentGroupId || undefined,
        groupLevel: state.consoleCurrentGroupLevel,
        countLabel: label,
        countValue: value,
      };
      
      const newLogs = [...state.consoleLogs, entry];
      if (newLogs.length > state.maxConsoleLogs) {
        newLogs.splice(0, newLogs.length - state.maxConsoleLogs);
      }
      
      set({
        consoleLogs: newLogs,
        consoleCounters: newCounters,
      });
      return;
    }
    
    // Handle console.countReset()
    if (message.method === 'countReset') {
      const label = message.metadata?.countLabel || 'default';
      const newCounters = new Map(state.consoleCounters);
      newCounters.delete(label);
      set({ consoleCounters: newCounters });
      // Don't create a log entry
      return;
    }
    
    // Handle regular console methods (log, info, warn, error, debug, trace, table, dir, dirxml)
    const entry: ConsoleEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(message.timestamp),
      method: message.method,
      args: message.args,
      stack: message.stack,
      groupId: state.consoleCurrentGroupId || undefined,
      groupLevel: state.consoleCurrentGroupLevel,
      tableData: message.metadata?.tableData,
    };
    
    const newLogs = [...state.consoleLogs, entry];
    
    // Enforce max logs limit
    if (newLogs.length > state.maxConsoleLogs) {
      newLogs.splice(0, newLogs.length - state.maxConsoleLogs);
    }
    
    set({ consoleLogs: newLogs });
  },
  
  /**
   * Clear all console logs
   */
  clearConsole: () => {
    set({
      consoleLogs: [],
      consoleGroups: new Map(),
      consoleTimers: new Map(),
      consoleCounters: new Map(),
      consoleCurrentGroupId: null,
      consoleCurrentGroupLevel: 0,
      consoleCollapsedGroups: new Set(),
      consoleExpandedPaths: new Set(),
    });
  },
  
  /**
   * Set console filter
   */
  setConsoleFilter: (filter: ConsoleFilter) => {
    set({ consoleFilter: filter });
  },
  
  /**
   * Set console search query
   */
  setConsoleSearchQuery: (query: string) => {
    set({ consoleSearchQuery: query });
  },
  
  /**
   * Toggle auto-scroll
   */
  toggleConsoleAutoScroll: () => {
    set(state => ({ consoleAutoScroll: !state.consoleAutoScroll }));
  },
  
  /**
   * Toggle timestamps
   */
  toggleConsoleTimestamps: () => {
    set(state => ({ consoleShowTimestamps: !state.consoleShowTimestamps }));
  },
  
  /**
   * Toggle group collapsed state
   */
  toggleConsoleGroup: (groupId: string) => {
    set(state => {
      const newCollapsed = new Set(state.consoleCollapsedGroups);
      if (newCollapsed.has(groupId)) {
        newCollapsed.delete(groupId);
      } else {
        newCollapsed.add(groupId);
      }
      return { consoleCollapsedGroups: newCollapsed };
    });
  },
  
  /**
   * Toggle object path expanded state
   */
  toggleConsoleObjectPath: (path: string) => {
    set(state => {
      const newExpanded = new Set(state.consoleExpandedPaths);
      if (newExpanded.has(path)) {
        newExpanded.delete(path);
      } else {
        newExpanded.add(path);
      }
      return { consoleExpandedPaths: newExpanded };
    });
  },
  
  /**
   * Export console logs to file
   */
  exportConsoleLogs: (format: 'json' | 'text') => {
    const { consoleLogs } = get();
    
    // Check if we're in a browser environment
    if (typeof globalThis !== 'undefined' && (globalThis as any).document) {
      const doc = (globalThis as any).document;
      
      if (format === 'json') {
        // Export as JSON
        const json = JSON.stringify(consoleLogs, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = doc.createElement('a');
        a.href = url;
        a.download = `console-logs-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Export as plain text
        const text = consoleLogs
          .map(entry => {
            const time = entry.timestamp.toISOString();
            const method = entry.method.toUpperCase();
            const args = entry.args.map(arg => JSON.stringify(arg)).join(' ');
            return `[${time}] ${method}: ${args}`;
          })
          .join('\n');
        
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = doc.createElement('a');
        a.href = url;
        a.download = `console-logs-${Date.now()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }
  },
  
  /**
   * Get error count
   */
  getConsoleErrorCount: () => {
    const { consoleLogs } = get();
    return consoleLogs.filter(log => log.method === 'error').length;
  },
  
  /**
   * Get warning count
   */
  getConsoleWarningCount: () => {
    const { consoleLogs } = get();
    return consoleLogs.filter(log => log.method === 'warn').length;
  },
}));

/**
 * Export types for external use
 */
export type { PreviewStatus, ViewportPreset };
