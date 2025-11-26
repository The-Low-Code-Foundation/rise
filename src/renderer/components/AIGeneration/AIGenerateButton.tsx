/**
 * @file AIGenerateButton.tsx
 * @description Toolbar button that opens AI generation dialog
 * 
 * @architecture Phase 2, Task 2.4B - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple button with dialog trigger
 * 
 * @see src/renderer/components/AIGeneration/AIPromptDialog.tsx - Dialog component
 * @see src/renderer/store/aiStore.ts - AI state
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState } from 'react';
import { AIPromptDialog } from './AIPromptDialog';
import { useAIStore } from '../../store/aiStore';

/**
 * AI Generate button for toolbar
 * 
 * Shows purple when API key is configured,
 * gray with tooltip when not configured.
 */
export function AIGenerateButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasApiKey, isInitialized } = useAIStore();
  
  // Button state based on API key availability
  const isEnabled = isInitialized;
  
  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        disabled={!isEnabled}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          transition-colors font-medium text-sm
          ${hasApiKey 
            ? 'bg-purple-500 text-white hover:bg-purple-600' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={
          !isInitialized 
            ? 'Open a project to enable AI generation'
            : hasApiKey 
              ? 'Generate component with AI' 
              : 'Add API key in Settings to enable AI'
        }
      >
        <SparklesIcon className="w-4 h-4" />
        AI Generate
      </button>
      
      <AIPromptDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}

/**
 * Compact AI button for use in tighter spaces (e.g., tree toolbar)
 */
export function AIGenerateButtonCompact() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasApiKey, isInitialized } = useAIStore();
  
  const isEnabled = isInitialized;
  
  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        disabled={!isEnabled}
        className={`
          p-1.5 rounded transition-colors
          ${hasApiKey 
            ? 'text-purple-500 hover:bg-purple-50' 
            : 'text-gray-400 hover:bg-gray-100'}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={
          !isInitialized 
            ? 'Open a project to enable AI generation'
            : hasApiKey 
              ? 'Generate component with AI' 
              : 'Add API key in Settings to enable AI'
        }
      >
        <SparklesIcon className="w-4 h-4" />
      </button>
      
      <AIPromptDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}

/**
 * Sparkles icon for AI features
 */
function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
    </svg>
  );
}
