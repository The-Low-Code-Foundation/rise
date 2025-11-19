/**
 * @file src/renderer/main.tsx
 * @description React entry point for the Electron renderer process
 * 
 * This is where React gets bootstrapped and mounted to the DOM.
 * Runs in the Electron renderer process (Chromium).
 * 
 * @architecture Phase 1, Task 1.1 - Electron Application Shell
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find root element');
}

// Create React root and render app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Log successful mount in development
if (import.meta.env.DEV) {
  console.log('[RENDERER] React app mounted successfully');
}
