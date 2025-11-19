/**
 * @file src/renderer/App.tsx
 * @description Root React component for the Rise application
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @updated 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple component composition
 * 
 * TASK HISTORY:
 * - Task 1.1: Created basic Electron + React shell with placeholder panels
 * - Task 1.2: Implemented production-ready three-panel layout with tabs
 * 
 * This component now renders the complete application layout including:
 * - Toolbar with action buttons
 * - Three resizable panels (Navigator | Editor | Properties)
 * - Tab system in Editor panel (Preview, Code, Console)
 * - Status bar with system information
 * - Keyboard shortcuts for navigation
 * 
 * @performance O(1) render, delegates to child components
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { Layout } from './components/Layout';

/**
 * Root application component
 * 
 * Renders the main Layout component which contains the complete
 * application UI structure.
 * 
 * FEATURES IMPLEMENTED:
 * - ✅ Three-panel resizable layout
 * - ✅ Tab system (Preview, Code, Console)
 * - ✅ Toolbar and Status bar
 * - ✅ Keyboard shortcuts (Cmd+1/2/3 for panels, Cmd+Shift+P/C/O for tabs)
 * - ✅ State persistence (panel sizes and active tab)
 * - ✅ Professional placeholder content
 * 
 * @returns App component with complete layout
 */
function App() {
  return <Layout />;
}

export default App;
