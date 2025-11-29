/**
 * @file aiStore.ts
 * @description Zustand store for AI generation state management
 * 
 * @architecture Phase 2, Task 2.4B - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard Zustand patterns
 * 
 * @see electron/ai-handlers.ts - IPC handlers
 * @see src/main/ai/AIComponentGenerator.ts - Main process service
 * 
 * PROBLEM SOLVED:
 * - Track AI availability and key status in renderer
 * - Manage generation state (loading, error, etc.)
 * - Provide cost estimates before generation
 * - Bridge between UI and IPC layer
 * 
 * SOLUTION:
 * - Zustand store with async actions that call IPC
 * - React state for loading/error states
 * - Cost and usage tracking
 * 
 * @security-critical false - API key handling in main process only
 * @performance-critical false
 */

import { create } from 'zustand';
import type { 
  GenerationContext, 
  CostEstimate, 
  UsageStats, 
  BudgetConfig 
} from '../types/electron.d';

/**
 * Access the electron API from globalThis
 * Type assertion needed since TypeScript doesn't know about preload injection
 */
const electronAPI = (globalThis as any).electronAPI;

/**
 * AI generation state
 */
interface GeneratedComponent {
  id: string;
  displayName: string;
  type: string;
  category: string;
  properties: Record<string, any>;
  styling: {
    baseClasses: string[];
    conditionalClasses?: Record<string, string>;
    customCSS?: string;
  };
  children: string[];
  metadata?: {
    createdAt: string;
    updatedAt: string;
    author: string;
    version?: string;
  };
}

/**
 * AI store state interface
 */
interface AIState {
  // Status
  isInitialized: boolean;
  hasApiKey: boolean;
  isCheckingKey: boolean;
  
  // Generation state
  isGenerating: boolean;
  lastGenerated: GeneratedComponent | null;
  lastError: string | null;
  lastUsage: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  } | null;
  
  // Usage stats
  usageStats: UsageStats | null;
  budgetConfig: BudgetConfig | null;
  
  // Actions
  initialize: (projectPath: string) => Promise<void>;
  cleanup: () => Promise<void>;
  checkApiKey: () => Promise<boolean>;
  validateKey: (apiKey: string) => Promise<{ valid: boolean; error?: string }>;
  storeKey: (apiKey: string) => Promise<{ success: boolean; error?: string }>;
  deleteKey: () => Promise<boolean>;
  estimateCost: (prompt: string) => Promise<CostEstimate | null>;
  generate: (prompt: string, context: GenerationContext) => Promise<GeneratedComponent | null>;
  generateEnhanced: (prompt: string, context: GenerationContext) => Promise<{ root: GeneratedComponent; allComponents: Record<string, GeneratedComponent> } | null>;
  refreshUsageStats: () => Promise<void>;
  updateBudgetConfig: (config: Partial<BudgetConfig>) => Promise<void>;
  clearLastError: () => void;
}

/**
 * AI Zustand store
 * 
 * Manages renderer-side AI state and provides actions that
 * communicate with the main process via IPC.
 */
export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  isInitialized: false,
  hasApiKey: false,
  isCheckingKey: false,
  isGenerating: false,
  lastGenerated: null,
  lastError: null,
  lastUsage: null,
  usageStats: null,
  budgetConfig: null,
  
  /**
   * Initialize AI generator for a project.
   * Must be called when project opens.
   * 
   * @param projectPath - Absolute path to project
   */
  initialize: async (projectPath: string) => {
    console.log('[AI Store] Initializing for project:', projectPath);
    
    try {
      const result = await electronAPI.ai.initialize(projectPath);
      
      if (result.success) {
        set({ isInitialized: true });
        
        // Check if API key exists
        await get().checkApiKey();
        
        // Load usage stats and budget config
        await get().refreshUsageStats();
        
        console.log('[AI Store] Initialized successfully');
      } else {
        console.error('[AI Store] Initialize failed:', result.error);
        set({ lastError: result.error || 'Failed to initialize AI' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('[AI Store] Initialize error:', message);
      set({ lastError: message });
    }
  },
  
  /**
   * Cleanup AI generator when project closes.
   */
  cleanup: async () => {
    console.log('[AI Store] Cleanup');
    
    try {
      await electronAPI.ai.cleanup();
    } catch (error) {
      console.error('[AI Store] Cleanup error:', error);
    }
    
    // Reset state
    set({
      isInitialized: false,
      hasApiKey: false,
      isGenerating: false,
      lastGenerated: null,
      lastError: null,
      lastUsage: null,
      usageStats: null,
      budgetConfig: null,
    });
  },
  
  /**
   * Check if API key is configured.
   * 
   * @returns Promise resolving to true if key exists
   */
  checkApiKey: async () => {
    set({ isCheckingKey: true });
    
    try {
      const result = await electronAPI.ai.hasKey();
      
      const hasKey = result.success && result.hasKey;
      set({ hasApiKey: hasKey, isCheckingKey: false });
      
      return hasKey;
    } catch (error) {
      console.error('[AI Store] Check key error:', error);
      set({ hasApiKey: false, isCheckingKey: false });
      return false;
    }
  },
  
  /**
   * Validate an API key (makes test API call).
   * 
   * @param apiKey - Key to validate
   * @returns Validation result
   */
  validateKey: async (apiKey: string) => {
    try {
      const result = await electronAPI.ai.validateKey(apiKey);
      
      if (result.success && result.valid) {
        return { valid: true };
      }
      
      return { 
        valid: false, 
        error: result.error || 'Invalid API key' 
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { valid: false, error: message };
    }
  },
  
  /**
   * Store API key securely.
   * 
   * @param apiKey - Key to store
   * @returns Success/error result
   */
  storeKey: async (apiKey: string) => {
    try {
      const result = await electronAPI.ai.storeKey(apiKey);
      
      if (result.success) {
        set({ hasApiKey: true });
        return { success: true };
      }
      
      return { 
        success: false, 
        error: result.error || 'Failed to store key' 
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  },
  
  /**
   * Delete stored API key.
   * 
   * @returns True if deleted
   */
  deleteKey: async () => {
    try {
      const result = await electronAPI.ai.deleteKey();
      
      if (result.success && result.deleted) {
        set({ hasApiKey: false });
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[AI Store] Delete key error:', error);
      return false;
    }
  },
  
  /**
   * Estimate cost for a prompt.
   * 
   * @param prompt - User's prompt text
   * @returns Cost estimate or null on error
   */
  estimateCost: async (prompt: string) => {
    try {
      const result = await electronAPI.ai.estimateCost(prompt);
      
      if (result.success && result.estimate) {
        return result.estimate;
      }
      
      return null;
    } catch (error) {
      console.error('[AI Store] Estimate cost error:', error);
      return null;
    }
  },
  
  /**
   * Generate a component from natural language prompt.
   * 
   * @param prompt - User's description
   * @param context - Generation context
   * @returns Generated component or null on error
   */
  generate: async (prompt: string, context: GenerationContext) => {
    set({ 
      isGenerating: true, 
      lastError: null,
      lastGenerated: null,
    });
    
    try {
      const result = await electronAPI.ai.generate(prompt, context);
      
      if (result.success && result.result?.success && result.result.component) {
        // Success - store result
        set({
          isGenerating: false,
          lastGenerated: result.result.component,
          lastUsage: result.result.usage || null,
        });
        
        // Refresh usage stats
        await get().refreshUsageStats();
        
        return result.result.component;
      }
      
      // Generation failed
      const errorMessage = result.result?.error || result.error || 'Generation failed';
      set({
        isGenerating: false,
        lastError: errorMessage,
      });
      
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({
        isGenerating: false,
        lastError: message,
      });
      return null;
    }
  },

  /**
   * Generate a component hierarchy from natural language prompt (Enhanced).
   * Uses the enhanced AI endpoint that produces nested components.
   * 
   * @param prompt - User's description
   * @param context - Generation context
   * @returns Generated root component and all flattened components, or null on error
   */
  generateEnhanced: async (prompt: string, context: GenerationContext) => {
    set({ 
      isGenerating: true, 
      lastError: null,
      lastGenerated: null,
    });
    
    try {
      const result = await electronAPI.ai.generateEnhanced(prompt, context);
      
      if (result.success && result.result?.success && result.result.component && result.result.allComponents) {
        // Success - store the root component 
        set({
          isGenerating: false,
          lastGenerated: result.result.component,
          lastUsage: result.result.usage || null,
        });
        
        // Refresh usage stats
        await get().refreshUsageStats();
        
        return {
          root: result.result.component,
          allComponents: result.result.allComponents,
        };
      }
      
      // Generation failed
      const errorMessage = result.result?.error || result.error || 'Generation failed';
      set({
        isGenerating: false,
        lastError: errorMessage,
      });
      
      return null;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      set({
        isGenerating: false,
        lastError: message,
      });
      return null;
    }
  },
  
  /**
   * Refresh usage statistics.
   */
  refreshUsageStats: async () => {
    try {
      const [statsResult, configResult] = await Promise.all([
        electronAPI.ai.getUsageStats(),
        electronAPI.ai.getBudgetConfig(),
      ]);
      
      set({
        usageStats: statsResult.success ? statsResult.stats || null : null,
        budgetConfig: configResult.success ? configResult.config || null : null,
      });
    } catch (error) {
      console.error('[AI Store] Refresh stats error:', error);
    }
  },
  
  /**
   * Update budget configuration.
   * 
   * @param config - Partial config to update
   */
  updateBudgetConfig: async (config: Partial<BudgetConfig>) => {
    try {
      const result = await electronAPI.ai.updateBudgetConfig(config);
      
      if (result.success) {
        // Refresh to get updated config
        await get().refreshUsageStats();
      }
    } catch (error) {
      console.error('[AI Store] Update budget error:', error);
    }
  },
  
  /**
   * Clear last error.
   */
  clearLastError: () => {
    set({ lastError: null });
  },
}));
