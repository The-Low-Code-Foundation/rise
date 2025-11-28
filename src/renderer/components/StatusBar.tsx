/**
 * @file StatusBar.tsx
 * @description Bottom status bar displaying project and system information
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard status bar component
 * 
 * PROBLEM SOLVED:
 * - Provides contextual information about current project
 * - Shows system information (platform, Electron version)
 * - Status indicators for application state
 * 
 * SOLUTION:
 * - Responsive status bar with left and right sections
 * - Uses IPC to get system information
 * - Updates when project is loaded (Task 1.3+)
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <StatusBar />
 * ```
 * 
 * DISPLAYED INFORMATION:
 * - Project name (or "No Project Open")
 * - Platform (macOS, Windows, Linux)
 * - Electron version
 * - Status indicator (Ready, Loading, Error)
 * 
 * @performance O(1) render, minimal re-renders
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect, useState } from 'react';
import { GenerationStatus } from './GenerationStatus';

/**
 * Status bar component
 * 
 * Displays project information and system status at the bottom of the application.
 * Information updates via IPC communication with the main process.
 * 
 * LAYOUT:
 * - Left: Project information
 * - Right: System information and status indicator
 * 
 * @returns StatusBar component
 * 
 * @example
 * ```typescript
 * <div className="app">
 *   <Toolbar />
 *   <main>{/* content *\/}</main>
 *   <StatusBar />
 * </div>
 * ```
 */
export function StatusBar() {
  // Project state - will be populated in Task 1.3
  const [projectName, setProjectName] = useState<string | null>(null);
  
  // System information from Electron
  const [platform, setPlatform] = useState<string>('Unknown');
  const [electronVersion, setElectronVersion] = useState<string>('');
  
  // Application status
  const [status] = useState<'ready' | 'loading' | 'error'>('ready');

  useEffect(() => {
    // Get platform information
    // Uses optional chaining since window.electronAPI might not exist in web mode
    const platformInfo = window.electronAPI?.platform || 'web';
    setPlatform(formatPlatform(platformInfo));

    // Get Electron version via IPC
    // This will be undefined in web mode, which is fine
    window.electronAPI?.getVersion?.().then((version) => {
      if (version) {
        setElectronVersion(version);
      }
    }).catch((error) => {
      console.warn('Could not get Electron version:', error);
    });
  }, []);

  /**
   * Formats platform string for display
   * 
   * @param platform - Raw platform string from Electron
   * @returns Formatted platform name
   */
  function formatPlatform(platform: string): string {
    switch (platform) {
      case 'darwin':
        return 'macOS';
      case 'win32':
        return 'Windows';
      case 'linux':
        return 'Linux';
      default:
        return platform;
    }
  }

  /**
   * Gets status indicator color and text based on current status
   * 
   * @returns Object with color class and text
   */
  function getStatusInfo() {
    switch (status) {
      case 'ready':
        return { color: 'bg-green-500', text: 'Ready' };
      case 'loading':
        return { color: 'bg-yellow-500', text: 'Loading' };
      case 'error':
        return { color: 'bg-red-500', text: 'Error' };
      default:
        return { color: 'bg-gray-500', text: 'Unknown' };
    }
  }

  const statusInfo = getStatusInfo();

  return (
    <div
      className="
        flex items-center justify-between px-4 py-1
        bg-gray-100 border-t border-gray-300
        text-xs text-gray-600
      "
      role="status"
      aria-label="Application status bar"
    >
      {/* Left section: Project information */}
      <div className="flex items-center gap-4">
        <span className="font-medium">
          {projectName ? `Project: ${projectName}` : 'No Project Open'}
        </span>
      </div>

      {/* Center section: Generation status (Task 3.3) */}
      <div className="flex items-center">
        <GenerationStatus />
      </div>

      {/* Right section: System information and status */}
      <div className="flex items-center gap-4">
        {/* Platform */}
        <span className="hidden sm:inline">
          Platform: <span className="font-medium">{platform}</span>
        </span>

        {/* Electron version */}
        {electronVersion && (
          <span className="hidden md:inline">
            Electron: <span className="font-medium">{electronVersion}</span>
          </span>
        )}

        {/* Status indicator */}
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${statusInfo.color}`}
            aria-hidden="true"
          />
          <span className="font-medium">{statusInfo.text}</span>
        </div>
      </div>
    </div>
  );
}
