/**
 * @file GenerationStatus.tsx
 * @description UI component showing code generation status in the status bar
 * 
 * Displays a compact indicator showing whether code generation is idle,
 * generating, complete, or has errors. Positioned in the status bar for
 * non-intrusive but visible feedback.
 * 
 * @architecture Phase 3, Task 3.3 - Live Preview Integration
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React component patterns
 * 
 * @see src/renderer/store/generationStore.ts - State source
 * @see src/renderer/components/StatusBar.tsx - Where this is rendered
 * 
 * @performance O(1) render, minimal re-renders via selector
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { useGenerationStore, selectStatusMessage, formatDuration } from '../store/generationStore';

/**
 * GenerationStatus Component
 * 
 * Compact status indicator for code generation state.
 * Changes color and icon based on current generation status.
 * 
 * STATES:
 * - idle: Gray text, no icon
 * - pending: Yellow dot, "Changes detected..."
 * - generating: Spinner, "Generating..."
 * - complete: Green checkmark, "Generated X files"
 * - error: Red X, error message (truncated)
 * 
 * USAGE:
 * ```tsx
 * <StatusBar>
 *   <GenerationStatus />
 * </StatusBar>
 * ```
 */
export const GenerationStatus: React.FC = () => {
  // Get generation state
  const status = useGenerationStore((state) => state.status);
  const error = useGenerationStore((state) => state.error);
  const lastGeneration = useGenerationStore((state) => state.lastGeneration);
  const isWatching = useGenerationStore((state) => state.isWatching);
  const clearError = useGenerationStore((state) => state.clearError);
  
  // Don't render anything if not watching
  if (!isWatching) {
    return null;
  }
  
  // Determine styles and content based on status
  const getStatusStyles = () => {
    switch (status) {
      case 'idle':
        return 'text-gray-400';
      case 'pending':
        return 'text-yellow-500';
      case 'generating':
        return 'text-blue-500';
      case 'complete':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };
  
  // Get status icon
  const getStatusIcon = () => {
    switch (status) {
      case 'idle':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="4" />
          </svg>
        );
      case 'pending':
        return (
          <svg className="w-3 h-3 mr-1 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
            <circle cx="10" cy="10" r="6" />
          </svg>
        );
      case 'generating':
        return (
          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        );
      case 'complete':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  // Get status text
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready';
      case 'pending':
        return 'Changes detected...';
      case 'generating':
        return 'Generating...';
      case 'complete':
        if (lastGeneration) {
          return `${lastGeneration.filesWritten} files (${formatDuration(lastGeneration.durationMs)})`;
        }
        return 'Complete';
      case 'error':
        // Truncate error message for display
        const truncatedError = error && error.length > 30 
          ? error.substring(0, 30) + '...' 
          : error;
        return truncatedError || 'Error';
      default:
        return '';
    }
  };
  
  return (
    <div 
      className={`flex items-center text-xs ${getStatusStyles()} cursor-default`}
      title={status === 'error' ? error || undefined : selectStatusMessage(useGenerationStore.getState())}
    >
      {getStatusIcon()}
      <span>{getStatusText()}</span>
      
      {/* Error dismiss button */}
      {status === 'error' && (
        <button
          onClick={clearError}
          className="ml-1 hover:text-white"
          title="Dismiss error"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

/**
 * Compact version for tight spaces
 * Shows only icon, full text on hover
 */
export const GenerationStatusCompact: React.FC = () => {
  const status = useGenerationStore((state) => state.status);
  const isWatching = useGenerationStore((state) => state.isWatching);
  
  if (!isWatching) {
    return null;
  }
  
  const getStatusColor = () => {
    switch (status) {
      case 'idle': return 'bg-gray-400';
      case 'pending': return 'bg-yellow-500 animate-pulse';
      case 'generating': return 'bg-blue-500 animate-pulse';
      case 'complete': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };
  
  return (
    <div 
      className={`w-2 h-2 rounded-full ${getStatusColor()}`}
      title={selectStatusMessage(useGenerationStore.getState())}
    />
  );
};

export default GenerationStatus;
