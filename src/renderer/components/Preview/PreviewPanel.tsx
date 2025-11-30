/**
 * @file PreviewPanel.tsx
 * @description Main preview panel container component
 * 
 * REFACTORED: Changed from flexbox to CSS Grid for reliable height handling.
 * 
 * LAYOUT STRUCTURE (when running):
 * ┌────────────────────────────────────────┐
 * │ PreviewToolbar (auto height)           │ ← grid-rows: auto
 * ├────────────────────────────────────────┤
 * │                                        │
 * │ Preview Content (fills remaining)      │ ← grid-rows: 1fr
 * │                                        │
 * └────────────────────────────────────────┘
 * 
 * Orchestrates the preview experience by combining:
 * - PreviewToolbar for controls
 * - PreviewFrame for the actual preview
 * - PreviewLoading/PreviewError for states
 * 
 * @architecture Phase 1, Task 1.4B - Preview Panel UI
 * @created 2025-11-25
 * @updated 2025-11-30 - Refactored to CSS Grid for height fix (Task 3.8)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - CSS Grid layout for reliable height handling
 * 
 * @see .implementation/phase-1-application-shell/task-1.4-preview-renderer.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { EyeIcon } from '@heroicons/react/24/outline';
import { usePreviewStore } from '../../store/previewStore';
import { useProjectStore } from '../../store/projectStore';
import { PreviewToolbar } from './PreviewToolbar';
import { PreviewFrame } from './PreviewFrame';
import { PreviewLoading } from './PreviewLoading';
import { PreviewError } from './PreviewError';

/**
 * PreviewEmptyState Component
 * 
 * Displayed when no project is open. Guides user to create or open a project.
 */
function PreviewEmptyState() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-6">
          <EyeIcon className="w-10 h-10 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Preview
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Live preview of your project will appear here.
          Create or open a project to get started.
        </p>
        <div className="text-xs text-gray-500">
          Use <kbd className="px-1.5 py-0.5 bg-gray-200 rounded text-gray-700">⌘N</kbd> to create a new project
        </div>
      </div>
    </div>
  );
}

/**
 * PreviewStoppedState Component
 * 
 * Displayed when a project is open but preview server is stopped.
 */
function PreviewStoppedState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-6">
          <EyeIcon className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Preview Stopped
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          The development server is not running.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Start Preview
        </button>
      </div>
    </div>
  );
}

/**
 * PreviewPanel Component
 * 
 * Main container for the preview functionality. Manages state-based rendering
 * to show appropriate UI for each preview status:
 * - No project: Empty state with guidance
 * - Stopped: Option to start preview
 * - Starting: Loading indicator
 * - Running: Toolbar + iframe
 * - Error: Error message with recovery options
 * 
 * USAGE:
 * ```tsx
 * // In EditorPanel's Preview tab
 * <PreviewPanel />
 * ```
 * 
 * @returns Preview panel component
 */
export function PreviewPanel() {
  // Get preview store state
  const {
    status,
    previewUrl,
    error,
    viewportWidth,
    viewportHeight,
    zoom,
    refreshKey,
    startPreview,
    restartPreview,
  } = usePreviewStore();
  
  // Get project store state
  const { currentProject } = useProjectStore();
  
  // Handler to start preview for current project
  const handleStartPreview = React.useCallback(() => {
    if (currentProject?.path) {
      startPreview(currentProject.path);
    }
  }, [currentProject?.path, startPreview]);
  
  // Handler to retry after error
  const handleRetry = React.useCallback(() => {
    if (currentProject?.path) {
      startPreview(currentProject.path);
    }
  }, [currentProject?.path, startPreview]);
  
  // Handler to restart server
  const handleRestart = React.useCallback(() => {
    restartPreview();
  }, [restartPreview]);
  
  // No project open - show empty state
  if (!currentProject) {
    return <PreviewEmptyState />;
  }
  
  // Render based on status
  switch (status) {
    case 'stopped':
      return <PreviewStoppedState onStart={handleStartPreview} />;
    
    case 'starting':
    case 'stopping':
      return <PreviewLoading message={status === 'stopping' ? 'Stopping server...' : 'Starting development server...'} />;
    
    case 'error':
      return (
        <PreviewError
          message={error || 'An unknown error occurred'}
          onRetry={handleRetry}
          onRestart={handleRestart}
        />
      );
    
    case 'running':
      // Server is running - show toolbar and preview frame
      if (!previewUrl) {
        return <PreviewLoading message="Waiting for server..." />;
      }
      
      return (
        // CRITICAL: Use CSS Grid for toolbar + content layout
        // grid-rows-[auto_1fr] = toolbar auto-sized, content fills rest
        <div className="h-full w-full grid grid-rows-[auto_1fr] overflow-hidden">
          {/* Toolbar - auto height (first grid row) */}
          <PreviewToolbar />
          
          {/* Preview content - fills remaining space (second grid row) */}
          {/* h-full w-full ensures the content area fills the grid cell */}
          {/* relative positioning allows absolute children like loading overlays */}
          <div className="h-full w-full overflow-hidden relative">
            <PreviewFrame
              url={previewUrl}
              viewportWidth={viewportWidth}
              viewportHeight={viewportHeight}
              zoom={zoom}
              refreshKey={refreshKey}
            />
          </div>
        </div>
      );
    
    default:
      return <PreviewEmptyState />;
  }
}
