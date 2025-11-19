/**
 * @file electron/preload.ts
 * @description Preload script for secure IPC communication via contextBridge
 * 
 * SECURITY CRITICAL: This is the ONLY bridge between the renderer process and
 * the main process. It uses Electron's contextBridge API to safely expose a
 * limited set of APIs to the renderer without giving it full Node.js access.
 * 
 * ALL IPC communication must go through this file. Never expose the entire
 * ipcRenderer or any Node.js APIs directly.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Following Electron security best practices
 * 
 * @see docs/SECURITY_SPEC.md - IPC security requirements
 * @see .clinerules/project-rules.md - Security rules
 * 
 * @security-critical true - This is the security boundary
 * @performance-critical false
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Exposed API interface for renderer process
 * 
 * This defines what the React app can call via window.electronAPI
 * Keep this minimal and only expose what's necessary for the app to function
 */
export interface ElectronAPI {
  // System information
  platform: NodeJS.Platform;
  
  // Basic communication test
  ping: () => Promise<string>;
  
  // Application info
  getVersion: () => Promise<string>;
  
  // Project creation (Task 1.3A)
  createProject: (params: CreateProjectParams) => Promise<{ success: boolean; project?: any; error?: string }>;
  onInstallProgress: (callback: (progress: InstallProgress) => void) => () => void;
  
  // Project management (Task 1.3B)
  openFolderDialog: () => Promise<string | undefined>;
  openProject: (path: string) => Promise<{ success: boolean; project?: any; error?: string }>;
  getRecentProjects: () => Promise<{ success: boolean; projects?: any[]; error?: string }>;
  getCurrentProject: () => Promise<{ success: boolean; project?: any }>;
  getProjectSettings: (path: string) => Promise<{ success: boolean; settings?: any; error?: string }>;
  updateProjectSettings: (path: string, settings: any) => Promise<{ success: boolean; error?: string }>;
  
  // File tree operations (Task 1.3A)
  getProjectFiles: (dirPath: string) => Promise<{ success: boolean; files?: any[]; error?: string }>;
  selectDirectory: () => Promise<string | null>;
  
  // File operations (to be implemented in future tasks)
  // readFile: (filepath: string) => Promise<string>;
  // writeFile: (filepath: string, content: string) => Promise<void>;
  // onFileChanged: (callback: (filepath: string) => void) => void;
  // onProjectError: (callback: (error: string) => void) => void;
}

/**
 * Type imports for API signatures
 */
interface CreateProjectParams {
  name: string;
  location: string;
  framework: 'react';
  template: 'basic';
  initGit?: boolean;
}

interface InstallProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Expose safe APIs to the renderer process
 * 
 * SECURITY: Only these specific APIs are available to the renderer.
 * The renderer CANNOT access Node.js, file system, or any other native APIs
 * except through these explicitly defined methods.
 */
const electronAPI: ElectronAPI = {
  // Platform information (safe to expose)
  platform: process.platform,
  
  // Test IPC communication
  ping: () => ipcRenderer.invoke('ping'),
  
  // Get app version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Project creation (Task 1.3A)
  createProject: (params: CreateProjectParams) => 
    ipcRenderer.invoke('project:create', params),
  
  onInstallProgress: (callback: (progress: InstallProgress) => void) => {
    // Set up listener for progress events
    const listener = (_event: any, progress: InstallProgress) => callback(progress);
    ipcRenderer.on('project:install-progress', listener);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener('project:install-progress', listener);
    };
  },
  
  // Project management (Task 1.3B)
  openFolderDialog: () => ipcRenderer.invoke('dialog:open-folder'),
  openProject: (path: string) => ipcRenderer.invoke('project:open', path),
  getRecentProjects: () => ipcRenderer.invoke('project:get-recent'),
  getCurrentProject: () => ipcRenderer.invoke('project:get-current'),
  getProjectSettings: (path: string) => ipcRenderer.invoke('project:get-settings', path),
  updateProjectSettings: (path: string, settings: any) => 
    ipcRenderer.invoke('project:update-settings', path, settings),
  
  // File tree operations (Task 1.3A)
  getProjectFiles: (dirPath: string) => ipcRenderer.invoke('project:get-files', dirPath),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  
  // File operations will be added in future tasks
  // readFile: (filepath: string) => ipcRenderer.invoke('read-file', filepath),
  // writeFile: (filepath: string, content: string) => 
  //   ipcRenderer.invoke('write-file', filepath, content),
  
  // Event listeners will be added as needed
  // onFileChanged: (callback: (filepath: string) => void) => {
  //   ipcRenderer.on('file-changed', (_, filepath) => callback(filepath));
  // },
  // onProjectError: (callback: (error: string) => void) => {
  //   ipcRenderer.on('project-error', (_, error) => callback(error));
  // },
};

/**
 * Expose the API to the renderer process
 * 
 * This makes the API available as window.electronAPI in the renderer
 * The renderer can then call: window.electronAPI.ping()
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * TypeScript declaration for window.electronAPI
 * This will be available in the renderer process
 */
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

/**
 * Log that preload script loaded successfully
 * This helps with debugging during development
 */
console.log('[PRELOAD] Preload script loaded successfully');
console.log('[PRELOAD] Platform:', process.platform);
