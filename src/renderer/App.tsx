/**
 * @file src/renderer/App.tsx
 * @description Root React component for the Rise application
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout (updated Task 1.3A)
 * @created 2025-11-19
 * @updated 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - App with New Project dialog and keyboard shortcuts
 * 
 * TASK HISTORY:
 * - Task 1.1: Created basic Electron + React shell with placeholder panels
 * - Task 1.2: Implemented production-ready three-panel layout with tabs
 * - Task 1.3A: Added New Project dialog with keyboard shortcuts
 * 
 * This component now renders the complete application layout including:
 * - Toolbar with action buttons
 * - Three resizable panels (Navigator | Editor | Properties)
 * - Tab system in Editor panel (Preview, Code, Console)
 * - Status bar with system information
 * - Keyboard shortcuts for navigation
 * - New Project dialog
 * 
 * @performance O(1) render, delegates to child components
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect } from 'react';
import { Layout } from './components/Layout';
import { NewProjectDialog } from './components/NewProjectDialog';
import { OpenProjectDialog } from './components/OpenProjectDialog';
import { useProjectStore } from './store/projectStore';

/**
 * Root application component
 * 
 * Renders the main Layout component and global dialogs.
 * Handles global keyboard shortcuts.
 * 
 * FEATURES IMPLEMENTED:
 * - ✅ Three-panel resizable layout
 * - ✅ Tab system (Preview, Code, Console)
 * - ✅ Toolbar and Status bar
 * - ✅ Keyboard shortcuts (Cmd+1/2/3 for panels, Cmd+Shift+P/C/O for tabs, Cmd+N for new project)
 * - ✅ State persistence (panel sizes and active tab)
 * - ✅ New Project dialog with 4-step wizard
 * - ✅ Professional placeholder content
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd/Ctrl+N: New Project
 * - Cmd/Ctrl+O: Open Project
 * 
 * @returns App component with complete layout and dialogs
 */
function App() {
  // Get dialog actions from project store
  const openDialog = useProjectStore((state) => state.openDialog);
  const openOpenDialog = useProjectStore((state) => state.openOpenDialog);

  /**
   * Handle global keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+N / Ctrl+N - New Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        openDialog();
      }
      
      // Cmd+O / Ctrl+O - Open Project
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault();
        openOpenDialog();
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDialog, openOpenDialog]);

  return (
    <>
      <Layout />
      <NewProjectDialog />
      <OpenProjectDialog />
    </>
  );
}

export default App;
