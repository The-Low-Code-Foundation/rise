/**
 * @file ai-handlers.ts
 * @description IPC handlers for AI component generation
 * 
 * @architecture Phase 2, Task 2.4A - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - IPC handlers following existing patterns
 * 
 * @see src/main/ai/AIComponentGenerator.ts - Core generator service
 * @see electron/ipc-handlers.ts - Existing handler patterns
 * 
 * PROBLEM SOLVED:
 * - Bridge between renderer and main process for AI operations
 * - Secure API key management via main process only
 * - Claude API calls from main process (Node.js environment)
 * 
 * SOLUTION:
 * - IPC handlers for key management
 * - IPC handlers for generation
 * - IPC handlers for usage/budget stats
 * 
 * @security-critical true - Handles API keys
 * @performance-critical false
 */

import { ipcMain } from 'electron';
import { 
  getAIGenerator, 
  clearAIGenerator,
  AIComponentGenerator 
} from '../src/main/ai/AIComponentGenerator';
import type { 
  GenerationContext,
  BudgetConfig,
} from '../src/main/ai/types';

/**
 * Current generator instance
 * Lazily initialized when project opens
 */
let generator: AIComponentGenerator | null = null;

/**
 * AI IPC Channel names
 */
export const AIChannels = {
  // Key management
  HAS_KEY: 'ai:has-key',
  VALIDATE_KEY: 'ai:validate-key',
  STORE_KEY: 'ai:store-key',
  DELETE_KEY: 'ai:delete-key',
  
  // Generation
  ESTIMATE_COST: 'ai:estimate-cost',
  GENERATE: 'ai:generate',
  
  // Usage & Budget
  GET_USAGE_STATS: 'ai:get-usage-stats',
  GET_BUDGET_CONFIG: 'ai:get-budget-config',
  UPDATE_BUDGET_CONFIG: 'ai:update-budget-config',
  
  // Lifecycle
  INITIALIZE: 'ai:initialize',
  CLEANUP: 'ai:cleanup',
} as const;

/**
 * Register all AI-related IPC handlers
 * 
 * Should be called during app initialization in setupIpcHandlers()
 */
export function registerAIHandlers(): void {
  console.log('[AI-IPC] Registering AI handlers...');
  
  /**
   * Initialize AI generator for a project
   * 
   * Must be called when a project is opened before any AI operations
   * 
   * @param projectPath - Absolute path to project directory
   * @returns Promise with { success, error? }
   */
  ipcMain.handle(AIChannels.INITIALIZE, async (_event, projectPath: string) => {
    console.log('[AI-IPC] Initialize requested for:', projectPath);
    
    try {
      if (!projectPath || typeof projectPath !== 'string') {
        return {
          success: false,
          error: 'Invalid project path',
        };
      }
      
      // Create or reinitialize generator
      generator = getAIGenerator(projectPath);
      
      console.log('[AI-IPC] Generator initialized');
      return { success: true };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Initialize failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  /**
   * Cleanup AI generator when project closes
   * 
   * @returns Promise with { success }
   */
  ipcMain.handle(AIChannels.CLEANUP, async () => {
    console.log('[AI-IPC] Cleanup requested');
    
    clearAIGenerator();
    generator = null;
    
    return { success: true };
  });
  
  /**
   * Check if API key is configured
   * 
   * @returns Promise with { success, hasKey: boolean }
   */
  ipcMain.handle(AIChannels.HAS_KEY, async () => {
    console.log('[AI-IPC] Has key check requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
          hasKey: false,
        };
      }
      
      const hasKey = await generator.isAvailable();
      
      return {
        success: true,
        hasKey,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Has key check failed:', message);
      return {
        success: false,
        error: message,
        hasKey: false,
      };
    }
  });
  
  /**
   * Validate an API key by making a test API call
   * 
   * @param apiKey - API key to validate
   * @returns Promise with { success, valid: boolean, error? }
   */
  ipcMain.handle(AIChannels.VALIDATE_KEY, async (_event, apiKey: string) => {
    console.log('[AI-IPC] Validate key requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
          valid: false,
        };
      }
      
      const result = await generator.validateKey(apiKey);
      
      return {
        success: true,
        valid: result.valid,
        error: result.error,
        errorCode: result.errorCode,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Validate key failed:', message);
      return {
        success: false,
        error: message,
        valid: false,
      };
    }
  });
  
  /**
   * Store an API key (validates first)
   * 
   * @param apiKey - API key to store
   * @returns Promise with { success, error? }
   */
  ipcMain.handle(AIChannels.STORE_KEY, async (_event, apiKey: string) => {
    console.log('[AI-IPC] Store key requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
        };
      }
      
      const result = await generator.storeKey(apiKey);
      
      if (!result.valid) {
        return {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        };
      }
      
      console.log('[AI-IPC] Key stored successfully');
      return { success: true };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Store key failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  /**
   * Delete stored API key
   * 
   * @returns Promise with { success, deleted: boolean }
   */
  ipcMain.handle(AIChannels.DELETE_KEY, async () => {
    console.log('[AI-IPC] Delete key requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
          deleted: false,
        };
      }
      
      const deleted = await generator.deleteKey();
      
      console.log('[AI-IPC] Key deleted:', deleted);
      return {
        success: true,
        deleted,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Delete key failed:', message);
      return {
        success: false,
        error: message,
        deleted: false,
      };
    }
  });
  
  /**
   * Estimate cost for a prompt
   * 
   * @param prompt - User's prompt text
   * @returns Promise with { success, estimate: CostEstimate }
   */
  ipcMain.handle(AIChannels.ESTIMATE_COST, async (_event, prompt: string) => {
    console.log('[AI-IPC] Estimate cost requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
        };
      }
      
      const estimate = await generator.estimateCost(prompt);
      
      return {
        success: true,
        estimate,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Estimate cost failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  /**
   * Generate a component from natural language prompt
   * 
   * @param prompt - User's description
   * @param context - Generation context
   * @returns Promise with { success, result: GenerationResult }
   */
  ipcMain.handle(
    AIChannels.GENERATE,
    async (_event, prompt: string, context: GenerationContext) => {
      console.log('[AI-IPC] Generate requested');
      
      try {
        if (!generator) {
          return {
            success: false,
            error: 'AI generator not initialized. Open a project first.',
          };
        }
        
        const result = await generator.generate(prompt, context);
        
        if (result.success) {
          console.log('[AI-IPC] Generated component:', result.component?.displayName);
        } else {
          console.log('[AI-IPC] Generation failed:', result.error);
        }
        
        return {
          success: true,
          result,
        };
        
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[AI-IPC] Generate failed:', message);
        return {
          success: false,
          error: message,
        };
      }
    }
  );
  
  /**
   * Get current usage statistics
   * 
   * @returns Promise with { success, stats: UsageStats }
   */
  ipcMain.handle(AIChannels.GET_USAGE_STATS, async () => {
    console.log('[AI-IPC] Get usage stats requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
        };
      }
      
      const stats = await generator.getUsageStats();
      
      return {
        success: true,
        stats,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Get usage stats failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  /**
   * Get budget configuration
   * 
   * @returns Promise with { success, config: BudgetConfig }
   */
  ipcMain.handle(AIChannels.GET_BUDGET_CONFIG, async () => {
    console.log('[AI-IPC] Get budget config requested');
    
    try {
      if (!generator) {
        return {
          success: false,
          error: 'AI generator not initialized. Open a project first.',
        };
      }
      
      const config = await generator.getBudgetConfig();
      
      return {
        success: true,
        config,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('[AI-IPC] Get budget config failed:', message);
      return {
        success: false,
        error: message,
      };
    }
  });
  
  /**
   * Update budget configuration
   * 
   * @param config - Partial budget config to update
   * @returns Promise with { success }
   */
  ipcMain.handle(
    AIChannels.UPDATE_BUDGET_CONFIG,
    async (_event, config: Partial<BudgetConfig>) => {
      console.log('[AI-IPC] Update budget config requested');
      
      try {
        if (!generator) {
          return {
            success: false,
            error: 'AI generator not initialized. Open a project first.',
          };
        }
        
        await generator.updateBudgetConfig(config);
        
        return { success: true };
        
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('[AI-IPC] Update budget config failed:', message);
        return {
          success: false,
          error: message,
        };
      }
    }
  );
  
  console.log('[AI-IPC] AI handlers registered successfully');
}

/**
 * Clean up AI IPC handlers
 * 
 * Should be called when app is quitting
 */
export function cleanupAIHandlers(): void {
  ipcMain.removeHandler(AIChannels.INITIALIZE);
  ipcMain.removeHandler(AIChannels.CLEANUP);
  ipcMain.removeHandler(AIChannels.HAS_KEY);
  ipcMain.removeHandler(AIChannels.VALIDATE_KEY);
  ipcMain.removeHandler(AIChannels.STORE_KEY);
  ipcMain.removeHandler(AIChannels.DELETE_KEY);
  ipcMain.removeHandler(AIChannels.ESTIMATE_COST);
  ipcMain.removeHandler(AIChannels.GENERATE);
  ipcMain.removeHandler(AIChannels.GET_USAGE_STATS);
  ipcMain.removeHandler(AIChannels.GET_BUDGET_CONFIG);
  ipcMain.removeHandler(AIChannels.UPDATE_BUDGET_CONFIG);
  
  // Clear generator
  clearAIGenerator();
  generator = null;
  
  console.log('[AI-IPC] AI handlers cleaned up');
}
