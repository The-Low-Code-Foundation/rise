/**
 * @file electron/ipc-handlers.ts
 * @description IPC handlers for main process
 * 
 * These handlers respond to requests from the renderer process that come
 * through the contextBridge. All handlers are async and return promises.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Basic IPC handlers for MVP
 * 
 * @security-critical true - Validates all inputs
 * @performance-critical false
 */

import { ipcMain, app } from 'electron';

/**
 * Set up all IPC handlers
 * Should be called once during app initialization
 */
export function setupIpcHandlers(): void {
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

  // Additional handlers will be added in Task 1.3+
  // Example structure for future file operations:
  /*
  ipcMain.handle('read-file', async (event, filepath: string) => {
    try {
      // Validate path is within project directory
      // Read file
      // Return content
    } catch (error) {
      console.error('[IPC] Error reading file:', error);
      throw error;
    }
  });
  */

  console.log('[IPC] Handlers registered successfully');
}

/**
 * Clean up IPC handlers
 * Should be called when app is quitting
 */
export function cleanupIpcHandlers(): void {
  ipcMain.removeHandler('ping');
  ipcMain.removeHandler('get-version');
  console.log('[IPC] Handlers cleaned up');
}
