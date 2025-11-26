/**
 * @file electron.d.ts
 * @description TypeScript definitions for Electron API exposed to renderer
 * 
 * @architecture Phase 2, Task 2.2A - Manifest IPC Handlers
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard TypeScript declaration patterns
 * 
 * @see electron/preload.ts - API implementation
 * 
 * PROBLEM SOLVED:
 * - Type-safe access to Electron APIs from renderer
 * - IntelliSense support in VS Code
 * - Compile-time checking of API calls
 * 
 * SOLUTION:
 * - Declare global Window interface extension
 * - Mirror types from preload.ts
 * - Keep in sync with preload.ts API
 * 
 * @security-critical false
 * @performance-critical false
 */

/**
 * Validation error from manifest validation
 */
export interface ValidationError {
  field: string;
  componentId?: string;
  componentName?: string;
  message: string;
  severity: 'ERROR' | 'WARNING';
  path?: string;
  code?: string;
  suggestion?: string;
  documentation?: string;
  hint?: string;
  level?: 'ERROR' | 'WARNING';
}

/**
 * Manifest operation result types
 */
export interface ManifestLoadResult {
  success: boolean;
  manifest?: any;
  validationErrors?: ValidationError[];
  validationWarnings?: ValidationError[];
  error?: string;
  errorCode?: 'NOT_FOUND' | 'PARSE_ERROR' | 'READ_ERROR';
}

export interface ManifestSaveResult {
  success: boolean;
  error?: string;
  errorCode?: 'VALIDATION_FAILED' | 'WRITE_ERROR';
}

export interface ManifestExistsResult {
  exists: boolean;
  hasLowcodeFolder: boolean;
}

/**
 * Manifest API interface
 */
export interface ManifestAPI {
  load: (projectPath: string) => Promise<ManifestLoadResult>;
  save: (projectPath: string, manifest: any) => Promise<ManifestSaveResult>;
  exists: (projectPath: string) => Promise<ManifestExistsResult>;
  initialize: (projectPath: string, projectName: string) => Promise<ManifestSaveResult>;
}

/**
 * AI generation context passed to Claude
 */
export interface GenerationContext {
  framework: 'react';
  schemaLevel: 1;
  parentComponentId?: string;
  parentComponentType?: string;
  existingComponentNames: string[];
}

/**
 * Result of AI component generation
 */
export interface GenerationResult {
  success: boolean;
  component?: any; // Component type from manifest
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

/**
 * Cost estimate before making API call
 */
export interface CostEstimate {
  estimatedCost: number;
  remainingBudget: number;
  canAfford: boolean;
  warning?: string;
}

/**
 * Current usage statistics
 */
export interface UsageStats {
  todaySpent: number;
  dailyBudget: number;
  remaining: number;
  requestCount: number;
  percentUsed: number;
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
  dailyBudgetUSD: number;
  warningThreshold: number;
  strictMode: boolean;
}

/**
 * AI API interface for component generation
 */
export interface AIAPI {
  /** Initialize AI generator for a project */
  initialize: (projectPath: string) => Promise<{ success: boolean; error?: string }>;
  
  /** Cleanup AI generator when project closes */
  cleanup: () => Promise<{ success: boolean }>;
  
  /** Check if API key is configured */
  hasKey: () => Promise<{ success: boolean; hasKey: boolean; error?: string }>;
  
  /** Validate an API key (makes test API call) */
  validateKey: (apiKey: string) => Promise<{ success: boolean; valid: boolean; error?: string; errorCode?: string }>;
  
  /** Store API key (validates first) */
  storeKey: (apiKey: string) => Promise<{ success: boolean; error?: string; errorCode?: string }>;
  
  /** Delete stored API key */
  deleteKey: () => Promise<{ success: boolean; deleted: boolean; error?: string }>;
  
  /** Estimate cost for a prompt */
  estimateCost: (prompt: string) => Promise<{ success: boolean; estimate?: CostEstimate; error?: string }>;
  
  /** Generate a component from natural language */
  generate: (prompt: string, context: GenerationContext) => Promise<{ success: boolean; result?: GenerationResult; error?: string }>;
  
  /** Get current usage statistics */
  getUsageStats: () => Promise<{ success: boolean; stats?: UsageStats; error?: string }>;
  
  /** Get budget configuration */
  getBudgetConfig: () => Promise<{ success: boolean; config?: BudgetConfig; error?: string }>;
  
  /** Update budget configuration */
  updateBudgetConfig: (config: Partial<BudgetConfig>) => Promise<{ success: boolean; error?: string }>;
}

/**
 * Preview server state
 */
export interface PreviewServerState {
  status: 'stopped' | 'starting' | 'running' | 'stopping' | 'error';
  port: number | null;
  url: string | null;
  error: string | null;
  projectPath: string | null;
  pid: number | null;
  startedAt: Date | null;
}

/**
 * Preview API interface
 */
export interface PreviewAPI {
  start: (projectPath: string) => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  stop: () => Promise<{ success: boolean; error?: string }>;
  restart: () => Promise<{ success: boolean; data?: { port: number; url: string }; error?: string }>;
  status: () => Promise<{ success: boolean; data?: PreviewServerState; error?: string }>;
  onReady: (callback: (data: { port: number; url: string }) => void) => () => void;
  onError: (callback: (data: { message: string; code?: string }) => void) => () => void;
  onOutput: (callback: (data: { line: string; type: 'stdout' | 'stderr' }) => void) => () => void;
  onStateChange: (callback: (state: PreviewServerState) => void) => () => void;
}

/**
 * Project creation parameters
 */
export interface CreateProjectParams {
  name: string;
  location: string;
  framework: 'react';
  template: 'basic';
  initGit?: boolean;
}

/**
 * Install progress tracking
 */
export interface InstallProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Complete Electron API exposed to renderer
 */
export interface ElectronAPI {
  // System information
  platform: NodeJS.Platform;
  
  // Basic communication
  ping: () => Promise<string>;
  getVersion: () => Promise<string>;
  
  // Project creation
  createProject: (params: CreateProjectParams) => Promise<{ success: boolean; project?: any; error?: string }>;
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  
  // Project management
  openFolderDialog: () => Promise<string | undefined>;
  openProject: (path: string) => Promise<{ success: boolean; project?: any; error?: string }>;
  getRecentProjects: () => Promise<{ success: boolean; projects?: any[]; error?: string }>;
  getCurrentProject: () => Promise<{ success: boolean; project?: any }>;
  getProjectSettings: (path: string) => Promise<{ success: boolean; settings?: any; error?: string }>;
  updateProjectSettings: (path: string, settings: any) => Promise<{ success: boolean; error?: string }>;
  
  // File tree operations
  getProjectFiles: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  
  // Clipboard operations
  writeClipboardText: (text: string) => Promise<{ success: boolean; error?: string }>;
  
  // Shell operations
  showItemInFolder: (fullPath: string) => Promise<{ success: boolean; error?: string }>;
  
  // Preview system
  preview: PreviewAPI;
  
  // Manifest system
  manifest: ManifestAPI;
  
  // AI system (Task 2.4A)
  ai: AIAPI;
}

/**
 * Extend Window interface to include electronAPI
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
