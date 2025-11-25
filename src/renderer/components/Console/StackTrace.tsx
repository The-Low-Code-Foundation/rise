/**
 * @file StackTrace.tsx
 * @description Component for rendering stack traces
 * 
 * Displays stack traces from errors and console.trace() calls.
 * Parses and formats stack frames with file paths, line numbers, and function names.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Stack trace parsing and display
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/components/Console/types.ts - StackFrame type
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import type { StackFrame } from './types';

/**
 * Props for StackTrace component
 */
interface StackTraceProps {
  /** Array of stack frames */
  frames: StackFrame[];
  
  /** Whether to start collapsed (default: true) */
  defaultCollapsed?: boolean;
}

/**
 * Maximum number of frames to display
 */
const MAX_FRAMES = 50;

/**
 * Format a stack frame for display
 */
function formatStackFrame(frame: StackFrame): string {
  const parts: string[] = [];
  
  // Add function name if available
  if (frame.functionName) {
    parts.push(`at ${frame.functionName}`);
  } else {
    parts.push('at <anonymous>');
  }
  
  // Add file location
  if (frame.fileName) {
    let location = frame.fileName;
    if (frame.lineNumber !== undefined) {
      location += `:${frame.lineNumber}`;
      if (frame.columnNumber !== undefined) {
        location += `:${frame.columnNumber}`;
      }
    }
    parts.push(`(${location})`);
  }
  
  // Fallback to raw if parsing failed
  if (parts.length === 1 && parts[0] === 'at <anonymous>' && frame.raw) {
    return frame.raw;
  }
  
  return parts.join(' ');
}

/**
 * StackTrace Component
 * 
 * Renders a collapsible stack trace with syntax highlighting:
 * - Function names in bold
 * - File paths as clickable links (blue)
 * - Line/column numbers in gray
 * - Expandable/collapsible
 * 
 * USAGE:
 * ```tsx
 * <StackTrace
 *   frames={stackFrames}
 *   defaultCollapsed={true}
 * />
 * ```
 * 
 * @param props - Component props
 * @returns Rendered stack trace
 */
export function StackTrace({
  frames,
  defaultCollapsed = true,
}: StackTraceProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Limit frames displayed
  const displayFrames = frames.slice(0, MAX_FRAMES);
  const truncated = frames.length > MAX_FRAMES;
  
  if (frames.length === 0) {
    return null;
  }
  
  return (
    <div className="mt-2 text-xs">
      {/* Header with expand/collapse */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex items-center gap-1 text-gray-600 hover:text-gray-800 font-semibold"
      >
        {isCollapsed ? (
          <ChevronRightIcon className="w-3 h-3" />
        ) : (
          <ChevronDownIcon className="w-3 h-3" />
        )}
        <span>Stack Trace ({frames.length} frames)</span>
      </button>
      
      {/* Stack frames */}
      {!isCollapsed && (
        <div className="mt-1 ml-4 space-y-0.5 font-mono text-gray-700">
          {displayFrames.map((frame, index) => {
            const formatted = formatStackFrame(frame);
            
            return (
              <div key={index} className="flex items-start gap-2">
                {/* Frame number */}
                <span className="text-gray-400 w-6 text-right flex-shrink-0">
                  {index}
                </span>
                
                {/* Frame content */}
                <div className="flex-1">
                  {frame.functionName ? (
                    <>
                      <span className="text-gray-600">at </span>
                      <span className="font-semibold text-gray-800">
                        {frame.functionName}
                      </span>
                      {frame.fileName && (
                        <>
                          <span className="text-gray-600"> (</span>
                          <span className="text-blue-600 underline">
                            {frame.fileName}
                          </span>
                          {frame.lineNumber !== undefined && (
                            <span className="text-gray-500">
                              :{frame.lineNumber}
                              {frame.columnNumber !== undefined && `:${frame.columnNumber}`}
                            </span>
                          )}
                          <span className="text-gray-600">)</span>
                        </>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-600">{formatted}</span>
                  )}
                </div>
              </div>
            );
          })}
          
          {/* Truncation warning */}
          {truncated && (
            <div className="text-orange-600 italic ml-8">
              ... {frames.length - MAX_FRAMES} more frames
            </div>
          )}
        </div>
      )}
    </div>
  );
}
