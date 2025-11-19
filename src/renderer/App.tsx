/**
 * @file src/renderer/App.tsx
 * @description Root React component for the Rise application
 * 
 * This is a placeholder that demonstrates the three-panel layout concept
 * for the MVP. The actual panels will be implemented in Task 1.2.
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 */

import React, { useEffect, useState } from 'react';

/**
 * Root application component
 * 
 * This placeholder shows:
 * - That Electron + React + Vite is working
 * - That IPC communication works (via ping test)
 * - The three-panel layout concept for Task 1.2
 */
function App() {
  const [ipcResult, setIpcResult] = useState<string>('Testing...');
  const [platform, setPlatform] = useState<string>('Unknown');

  useEffect(() => {
    // Test IPC communication on mount
    const testIPC = async () => {
      try {
        // Check if we're in Electron
        if (window.electronAPI) {
          // Test ping
          const result = await window.electronAPI.ping();
          setIpcResult(`IPC Working! Response: ${result}`);
          
          // Get platform
          setPlatform(window.electronAPI.platform);
        } else {
          setIpcResult('Not running in Electron (web mode)');
          setPlatform('web');
        }
      } catch (error) {
        setIpcResult(`IPC Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    testIPC();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🚀 Rise - Visual Low-Code Builder</h1>
        <p className="subtitle">Electron + React + Vite + TypeScript</p>
      </header>

      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Platform:</span>
          <span className="status-value">{platform}</span>
        </div>
        <div className="status-item">
          <span className="status-label">IPC Status:</span>
          <span className="status-value">{ipcResult}</span>
        </div>
      </div>

      <main className="app-main">
        <div className="placeholder-panel panel-1">
          <h2>📁 Component Tree</h2>
          <p>Panel 1 - Left Sidebar</p>
          <ul className="feature-list">
            <li>File tree navigation</li>
            <li>Component hierarchy</li>
            <li>Search & filter</li>
          </ul>
          <p className="coming-soon">Coming in Task 1.2</p>
        </div>

        <div className="placeholder-panel panel-2">
          <h2>🎨 Preview Canvas</h2>
          <p>Panel 2 - Center Area</p>
          <ul className="feature-list">
            <li>Live component preview</li>
            <li>Full app preview</li>
            <li>Responsive testing</li>
          </ul>
          <p className="coming-soon">Coming in Task 1.2</p>
        </div>

        <div className="placeholder-panel panel-3">
          <h2>⚙️ Properties</h2>
          <p>Panel 3 - Right Sidebar</p>
          <ul className="feature-list">
            <li>Component properties</li>
            <li>Styling options</li>
            <li>Event handlers</li>
          </ul>
          <p className="coming-soon">Coming in Task 1.2</p>
        </div>
      </main>

      <footer className="app-footer">
        <p>✅ Task 1.1 Complete: Electron Application Shell</p>
      </footer>
    </div>
  );
}

export default App;
