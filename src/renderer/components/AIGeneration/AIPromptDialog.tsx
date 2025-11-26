/**
 * @file AIPromptDialog.tsx
 * @description Modal dialog for AI component generation
 * 
 * @architecture Phase 2, Task 2.4B - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard React patterns with Tailwind
 * 
 * @see src/renderer/store/aiStore.ts - AI state management
 * @see src/main/ai/AIComponentGenerator.ts - Main process service
 * 
 * FEATURES:
 * - Prompt textarea with placeholder examples
 * - Cost estimate display (updates as user types)
 * - Privacy notice (what gets sent to AI)
 * - Loading state during generation
 * - Error display
 * - Level 1 restriction notice
 * 
 * @security-critical false - API keys stay in main process
 * @performance-critical false
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Modal } from '../Modal';
import { useManifestStore } from '../../store/manifestStore';
import { useAIStore } from '../../store/aiStore';
import type { GenerationContext, CostEstimate } from '../../types/electron.d';

/**
 * Props for AIPromptDialog
 */
interface AIPromptDialogProps {
  /** Whether dialog is open */
  isOpen: boolean;
  
  /** Callback when dialog closes */
  onClose: () => void;
  
  /** Parent component ID if adding as child */
  parentComponentId?: string;
}

/**
 * Example prompts to help users get started
 */
const EXAMPLE_PROMPTS = [
  'Create a UserCard with avatar, name, and email',
  'Create a navigation bar with logo and menu items',
  'Create a pricing card with title, price, and features',
  'Create a testimonial card with quote, author, and rating',
];

/**
 * AI Component Generation Dialog
 * 
 * Allows users to describe components in natural language and
 * generates Level 1 compliant component schemas.
 */
export function AIPromptDialog({ 
  isOpen, 
  onClose, 
  parentComponentId 
}: AIPromptDialogProps) {
  // Local state
  const [prompt, setPrompt] = useState('');
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  
  // Store state
  const { manifest, addComponent } = useManifestStore();
  const { 
    hasApiKey, 
    isGenerating, 
    lastError,
    estimateCost,
    generate,
    checkApiKey,
    clearLastError,
  } = useAIStore();
  
  // Check API key availability when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkApiKey();
      clearLastError();
      setPrompt('');
      setCostEstimate(null);
    }
  }, [isOpen, checkApiKey, clearLastError]);
  
  // Update cost estimate when prompt changes (debounced)
  useEffect(() => {
    if (!prompt.trim() || !hasApiKey) {
      setCostEstimate(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      setIsEstimating(true);
      const estimate = await estimateCost(prompt);
      setCostEstimate(estimate);
      setIsEstimating(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [prompt, hasApiKey, estimateCost]);
  
  /**
   * Handle generate button click
   */
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !manifest) return;
    
    // Build generation context
    const context: GenerationContext = {
      framework: 'react',
      schemaLevel: 1,
      parentComponentId,
      parentComponentType: parentComponentId 
        ? manifest.components[parentComponentId]?.type 
        : undefined,
      existingComponentNames: Object.values(manifest.components)
        .map(c => c.displayName),
    };
    
    // Call generate
    const component = await generate(prompt, context);
    
    if (component) {
      // Add to manifest with parent relationship
      // Transform AI result into CreateComponentOptions format
      addComponent({
        displayName: component.displayName,
        type: component.type,
        category: (component.category as 'basic' | 'layout' | 'form' | 'custom') || 'custom',
        properties: component.properties,
        styling: component.styling,
        parentId: parentComponentId,
      });
      
      // Close dialog on success
      onClose();
      setPrompt('');
      setCostEstimate(null);
    }
    // If failed, lastError will be set in store
  }, [prompt, manifest, parentComponentId, generate, addComponent, onClose]);
  
  /**
   * Handle dialog close
   */
  const handleClose = useCallback(() => {
    if (!isGenerating) {
      setPrompt('');
      setCostEstimate(null);
      clearLastError();
      onClose();
    }
  }, [isGenerating, onClose, clearLastError]);
  
  /**
   * Handle example prompt click
   */
  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
  }, []);
  
  // Get parent component info for display
  const parentComponent = parentComponentId && manifest
    ? manifest.components[parentComponentId]
    : null;
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 w-[520px] max-w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate with AI</h2>
            <p className="text-sm text-gray-500">
              Describe the component you want to create
            </p>
          </div>
        </div>
        
        {/* No API Key Warning */}
        {!hasApiKey && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <WarningIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  API Key Required
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Add your Claude API key in Settings to use AI generation.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your component
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a user profile card with avatar, name, and bio..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                       resize-none text-gray-900 placeholder-gray-400"
            disabled={isGenerating || !hasApiKey}
          />
        </div>
        
        {/* Example Prompts */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                disabled={isGenerating || !hasApiKey}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded
                           hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                           truncate max-w-[200px] transition-colors"
                title={example}
              >
                {example.slice(0, 35)}...
              </button>
            ))}
          </div>
        </div>
        
        {/* Parent Context */}
        {parentComponent && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <span className="text-blue-700">
              Adding as child of: <strong>{parentComponent.displayName}</strong>
            </span>
          </div>
        )}
        
        {/* Cost Estimate */}
        {costEstimate && (
          <div className={`mb-4 p-3 rounded-lg ${
            costEstimate.canAfford 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex justify-between text-sm">
              <span className={costEstimate.canAfford ? 'text-green-700' : 'text-red-700'}>
                Estimated cost:
              </span>
              <span className={`font-mono ${costEstimate.canAfford ? 'text-green-800' : 'text-red-800'}`}>
                ${costEstimate.estimatedCost.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Remaining budget:</span>
              <span className="text-gray-600 font-mono">
                ${costEstimate.remainingBudget.toFixed(2)}
              </span>
            </div>
            {costEstimate.warning && (
              <p className="mt-2 text-xs text-orange-600">{costEstimate.warning}</p>
            )}
          </div>
        )}
        
        {isEstimating && prompt.trim() && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <LoadingSpinner className="w-4 h-4" />
              Estimating cost...
            </p>
          </div>
        )}
        
        {/* Privacy Notice */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <InfoIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">What gets sent to Claude AI:</p>
              <ul className="list-disc list-inside space-y-0.5 text-gray-500">
                <li>Your prompt description</li>
                <li>Existing component names (not code)</li>
                <li>Framework type (React)</li>
              </ul>
              <p className="mt-1 text-gray-400">
                Your API keys and actual code are never sent.
              </p>
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {lastError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{lastError}</p>
          </div>
        )}
        
        {/* Level 1 Notice */}
        <div className="mb-4 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
          <strong>Level 1 MVP:</strong> Generated components use static values only. 
          Event handlers and state management coming in Level 2.
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded
                       disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !hasApiKey || 
                     (costEstimate !== null && !costEstimate.canAfford)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2 transition-colors"
          >
            {isGenerating ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate
                {costEstimate && costEstimate.canAfford && (
                  <span className="text-purple-200 text-xs">
                    (${costEstimate.estimatedCost.toFixed(3)})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ===== Icons =====

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

/**
 * Warning triangle icon
 */
function WarningIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

/**
 * Info circle icon
 */
function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
  );
}

/**
 * Loading spinner animation
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
