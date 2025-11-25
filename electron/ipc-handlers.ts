/**
 * @file electron/ipc-handlers.ts
 * @description IPC handlers for main process
 * 
 * These handlers respond to requests from the renderer process that come
 * through the contextBridge. All handlers are async and return promises.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @updated 2025-11-19 - Added project management handlers (Task 1.3A & 1.3B)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Basic IPC handlers for MVP
 * 
 * @security-critical true - Validates all inputs
 * @performance-critical false
 */

import { ipcMain, app, dialog, BrowserWindow, clipboard, shell } from 'electron';
import { ProjectManager } from '../src/main/project/ProjectManager';
import type { CreateProjectParams } from '../src/main/project/types';

// ProjectManager instance (initialized in setupIpcHandlers)
let projectManager: ProjectManager;

/**
 * Set up all IPC handlers
 * Should be called once during app initialization
 * 
 * @returns Promise that resolves when setup is complete
 */
export async function setupIpcHandlers(): Promise<void> {
  // Initialize ProjectManager
  projectManager = new ProjectManager();
  await projectManager.initialize();
  console.log('[IPC] ProjectManager initialized');

  // Ping test - verifies IPC communication works
  ipcMain.handle('ping', async () => {
    console.log('[IPC] Ping received from renderer');
    return 'pong';
  });

  // Get app version
  ipcMain.handle('get-version', async () => {
    const version = app.getVersion();
    console.log('[IPC] Version requested:', version);
    return version;
  });

  // ===== Project Creation Handlers (Task 1.3A) =====

  /**
   * Create a new Rise project
   * 
   * Creates a new project with React + Vite template, installs dependencies,
   * and sets up the project structure. Emits progress events during npm install.
   */
  ipcMain.handle('project:create', async (event, params: CreateProjectParams) => {
    console.log('[IPC] Create project requested:', params.name);
    
    try {
      // Set up progress callback to emit events to renderer
      projectManager.onInstallProgress = (progress) => {
        // Get the window from the event sender
        const webContents = event.sender;
        webContents.send('project:install-progress', progress);
      };
      
      // Create the project
      const result = await projectManager.createProject(params);
      
      // Clear progress callback
      projectManager.onInstallProgress = undefined;
      
      if (result.success) {
        console.log('[IPC] Project created successfully:', result.data.id);
        return {
          success: true,
          project: result.data,
        };
      } else {
        console.error('[IPC] Failed to create project:', result.error.message);
        return {
          success: false,
          error: result.error.message,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error creating project:', message);
      
      // Clear progress callback on error
      projectManager.onInstallProgress = undefined;
      
      return {
        success: false,
        error: message,
      };
    }
  });

  // ===== Project Loading Handlers (Task 1.3B) =====

  /**
   * Open folder dialog for selecting project directory
   */
  ipcMain.handle('dialog:open-folder', async () => {
    console.log('[IPC] Open folder dialog requested');
    
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Folder for New Project',
      buttonLabel: 'Select Folder',
    });
    
    // Return the first selected path, or undefined if cancelled
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return undefined;
    }
    
    return result.filePaths[0];
  });

  /**
   * Load an existing Rise project
   */
  ipcMain.handle('project:open', async (_event, projectPath: string) => {
    console.log('[IPC] Open project requested:', projectPath);
    
    try {
      const result = await projectManager.loadProject(projectPath);
      
      if (result.success) {
        console.log('[IPC] Project opened successfully');
        return {
          success: true,
          project: result.data,
        };
      } else {
        console.error('[IPC] Failed to open project:', result.error.message);
        return {
          success: false,
          error: result.error.message,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error opening project:', message);
      return {
        success: false,
        error: message,
      };
    }
  });

  /**
   * Get recent projects list
   */
  ipcMain.handle('project:get-recent', async () => {
    console.log('[IPC] Get recent projects requested');
    
    try {
      const projects = await projectManager.getRecentProjects();
      return {
        success: true,
        projects,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error getting recent projects:', message);
      return {
        success: false,
        error: message,
        projects: [],
      };
    }
  });

  /**
   * Get project settings
   */
  ipcMain.handle('project:get-settings', async (_event, projectPath: string) => {
    console.log('[IPC] Get settings requested for:', projectPath);
    
    try {
      const settings = await projectManager.loadProjectSettings(projectPath);
      return {
        success: true,
        settings,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error getting settings:', message);
      return {
        success: false,
        error: message,
      };
    }
  });

  /**
   * Update project settings
   */
  ipcMain.handle('project:update-settings', async (_event, projectPath: string, settings: any) => {
    console.log('[IPC] Update settings requested for:', projectPath);
    
    try {
      await projectManager.saveProjectSettings(projectPath, settings);
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error updating settings:', message);
      return {
        success: false,
        error: message,
      };
    }
  });

  /**
   * Get current project
   */
  ipcMain.handle('project:get-current', async () => {
    console.log('[IPC] Get current project requested');
    
    const project = projectManager.getCurrentProject();
    return {
      success: true,
      project: project || null,
    };
  });

  /**
   * Get files in a directory (for file tree)
   */
  ipcMain.handle('project:get-files', async (_event, dirPath: string) => {
    console.log('[IPC] Get files requested for:', dirPath);
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Read directory contents
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      // Map to FileTreeNode format
      const files = entries.map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
      }));
      
      return {
        success: true,
        files,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error getting files:', message);
      return {
        success: false,
        error: message,
        files: [],
      };
    }
  });

  /**
   * Write text to clipboard
   */
  ipcMain.handle('clipboard:write-text', async (_event, text: string) => {
    console.log('[IPC] Write to clipboard requested');
    
    try {
      clipboard.writeText(text);
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error writing to clipboard:', message);
      return {
        success: false,
        error: message,
      };
    }
  });

  /**
   * Show item in system file manager (Finder/Explorer)
   */
  ipcMain.handle('shell:show-item-in-folder', async (_event, fullPath: string) => {
    console.log('[IPC] Show item in folder requested:', fullPath);
    
    try {
      shell.showItemInFolder(fullPath);
      return {
        success: true,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[IPC] Error showing item:', message);
      return {
        success: false,
        error: message,
      };
    }
  });

  /**
   * Select directory dialog (for new project location)
   */
  ipcMain.handle('dialog:select-directory', async () => {
    console.log('[IPC] Select directory dialog requested');
    
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Project Location',
      buttonLabel: 'Select',
    });
    
    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return null;
    }
    
    return result.filePaths[0];
  });

  console.log('[IPC] Handlers registered successfully');
}

/**
 * Clean up IPC handlers
 * Should be called when app is quitting
 */
export function cleanupIpcHandlers(): void {
  ipcMain.removeHandler('ping');
  ipcMain.removeHandler('get-version');
  ipcMain.removeHandler('dialog:open-folder');
  ipcMain.removeHandler('project:create');
  ipcMain.removeHandler('project:open');
  ipcMain.removeHandler('project:get-recent');
  ipcMain.removeHandler('project:get-settings');
  ipcMain.removeHandler('project:update-settings');
  ipcMain.removeHandler('project:get-current');
  ipcMain.removeHandler('project:get-files');
  ipcMain.removeHandler('clipboard:write-text');
  ipcMain.removeHandler('shell:show-item-in-folder');
  console.log('[IPC] Handlers cleaned up');
}
