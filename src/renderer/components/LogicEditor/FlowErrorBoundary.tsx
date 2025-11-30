/**
 * @file FlowErrorBoundary.tsx
 * @description Error boundary for catching and displaying errors in the logic editor
 * 
 * @architecture Phase 4, Task 4.5 - Integration & Polish
 * @created 2025-11-30
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React error boundary pattern
 * 
 * @see src/renderer/components/LogicEditor/LogicCanvas.tsx - Main consumer
 * @see .implementation/phase-4-logic-editor/task-4.5-integration-polish.md
 * 
 * PROBLEM SOLVED:
 * - Catches runtime errors in the logic editor (React Flow, node rendering, etc.)
 * - Displays user-friendly error messages instead of crashing
 * - Provides retry mechanism to recover from temporary errors
 * 
 * SOLUTION:
 * - React Error Boundary pattern (componentDidCatch + getDerivedStateFromError)
 * - Clean error UI with retry button
 * - Optional error callback for logging/telemetry
 * 
 * @performance No performance impact - only activates on error
 * @security-critical false
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// ============================================================
// TYPES
// ============================================================

/**
 * Props for FlowErrorBoundary
 */
interface FlowErrorBoundaryProps {
  /** Child components to wrap */
  children: ReactNode;
  
  /** Optional flow ID for context in error messages */
  flowId?: string;
  
  /** Optional callback when error is caught */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  
  /** Optional callback when user clicks retry */
  onRetry?: () => void;
}

/**
 * State for FlowErrorBoundary
 */
interface FlowErrorBoundaryState {
  /** Whether an error has been caught */
  hasError: boolean;
  
  /** The caught error object */
  error: Error | null;
  
  /** Error info from React (component stack) */
  errorInfo: ErrorInfo | null;
}

// ============================================================
// COMPONENT
// ============================================================

/**
 * FlowErrorBoundary - Catches errors in the logic editor and displays fallback UI
 * 
 * USAGE:
 * ```tsx
 * <FlowErrorBoundary flowId={activeFlowId} onError={logError}>
 *   <LogicCanvas />
 * </FlowErrorBoundary>
 * ```
 * 
 * ERROR TYPES HANDLED:
 * - React Flow rendering errors
 * - Node component errors
 * - State update errors
 * - Invalid flow data errors
 * 
 * RECOVERY:
 * - User can click "Try Again" to reset the error state
 * - Parent component can provide onRetry callback for additional cleanup
 */
export class FlowErrorBoundary extends Component<FlowErrorBoundaryProps, FlowErrorBoundaryState> {
  state: FlowErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  /**
   * Static lifecycle method to derive state from caught error
   * Called during render phase - must be pure (no side effects)
   * 
   * @param error - The error that was thrown
   * @returns New state with error information
   */
  static getDerivedStateFromError(error: Error): Partial<FlowErrorBoundaryState> {
    // Update state to trigger fallback UI on next render
    return {
      hasError: true,
      error,
    };
  }

  /**
   * Lifecycle method called after error is caught
   * Used for logging/reporting - can have side effects
   * 
   * @param error - The error that was thrown
   * @param errorInfo - React error info including component stack
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Store error info for display
    this.setState({ errorInfo });
    
    // Log error to console for debugging
    console.error('[FlowErrorBoundary] Caught error:', error);
    console.error('[FlowErrorBoundary] Component stack:', errorInfo.componentStack);
    
    // Call optional error callback for external logging/telemetry
    this.props.onError?.(error, errorInfo);
  }

  /**
   * Handle retry button click
   * Resets error state to re-render children
   */
  handleRetry = (): void => {
    // Call optional retry callback first (for cleanup)
    this.props.onRetry?.();
    
    // Reset error state to re-render children
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  /**
   * Get user-friendly error message from error object
   * 
   * @param error - The caught error
   * @returns Human-readable error message
   */
  getErrorMessage(error: Error | null): string {
    if (!error) {
      return 'An unexpected error occurred in the logic editor.';
    }
    
    // Handle common React Flow errors with user-friendly messages
    const message = error.message.toLowerCase();
    
    if (message.includes('invalid node') || message.includes('node not found')) {
      return 'There was a problem with a node in the flow. The node may have been deleted or corrupted.';
    }
    
    if (message.includes('invalid edge') || message.includes('edge not found')) {
      return 'There was a problem with a connection in the flow. The connection may be broken.';
    }
    
    if (message.includes('circular') || message.includes('infinite loop')) {
      return 'The flow contains a circular reference that could cause an infinite loop.';
    }
    
    if (message.includes('undefined') || message.includes('null')) {
      return 'Some required data is missing. Try refreshing the flow.';
    }
    
    // Default: use original message if it's not too technical
    if (error.message.length < 100 && !error.message.includes('TypeError')) {
      return error.message;
    }
    
    return 'An error occurred while rendering the logic editor.';
  }

  /**
   * Render error UI or children
   */
  render(): ReactNode {
    const { hasError, error, errorInfo } = this.state;
    const { children, flowId } = this.props;

    // If no error, render children normally
    if (!hasError) {
      return children;
    }

    // Render error fallback UI
    return (
      <div className="flex flex-col items-center justify-center h-full bg-red-50 dark:bg-red-900/20 p-8">
        {/* Error icon */}
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/40 rounded-full mb-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
        </div>

        {/* Error title */}
        <h2 className="text-lg font-semibold text-red-700 dark:text-red-400 mb-2">
          Logic Editor Error
        </h2>

        {/* Flow context if available */}
        {flowId && (
          <p className="text-xs text-red-500 dark:text-red-400 mb-2">
            Flow ID: {flowId}
          </p>
        )}

        {/* Error message */}
        <p className="text-sm text-red-600 dark:text-red-300 mb-4 text-center max-w-md">
          {this.getErrorMessage(error)}
        </p>

        {/* Action buttons */}
        <div className="flex gap-3">
          {/* Retry button */}
          <button
            onClick={this.handleRetry}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            Try Again
          </button>
        </div>

        {/* Technical details (collapsible for developers) */}
        <details className="mt-6 max-w-lg w-full">
          <summary className="text-xs text-red-500 dark:text-red-400 cursor-pointer hover:underline">
            Technical Details
          </summary>
          <div className="mt-2 p-3 bg-red-100 dark:bg-red-900/30 rounded text-xs font-mono text-red-700 dark:text-red-300 overflow-auto max-h-32">
            <p className="font-bold mb-1">{error?.name}: {error?.message}</p>
            {errorInfo?.componentStack && (
              <pre className="whitespace-pre-wrap text-[10px] opacity-75">
                {errorInfo.componentStack.slice(0, 500)}
                {errorInfo.componentStack.length > 500 && '...'}
              </pre>
            )}
          </div>
        </details>
      </div>
    );
  }
}

export default FlowErrorBoundary;
