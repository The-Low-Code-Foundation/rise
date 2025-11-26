/**
 * @file types.ts
 * @description Type definitions for AI component generation
 * 
 * @architecture Phase 2, Task 2.4A - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Well-defined types based on Claude API structure
 * 
 * @see docs/API_INTEGRATION.md - Claude API patterns
 * @see src/core/manifest/types.ts - Component types
 * 
 * @security-critical true - Handles API key validation
 * @performance-critical false
 */

import type { Component } from '../../core/manifest/types';

/**
 * Supported AI providers
 */
export type AIProvider = 'claude' | 'openai';

/**
 * Context provided to AI for better generation
 * 
 * This context helps the AI understand:
 * - What framework we're targeting
 * - What schema level restrictions apply
 * - Where in the tree this component will be placed
 * - What component names already exist (to avoid conflicts)
 */
export interface GenerationContext {
  /** Target framework - always 'react' for Level 1 */
  framework: 'react';
  
  /** Schema level - always 1 for MVP */
  schemaLevel: 1;
  
  /** Parent component ID if adding as child */
  parentComponentId?: string;
  
  /** Parent component type for context */
  parentComponentType?: string;
  
  /** Existing component display names to avoid duplicates */
  existingComponentNames: string[];
}

/**
 * Result of a generation attempt
 */
export interface GenerationResult {
  /** Whether generation succeeded */
  success: boolean;
  
  /** Generated component (if successful) */
  component?: Component;
  
  /** Error message (if failed) */
  error?: string;
  
  /** Token usage and cost info (if successful) */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

/**
 * Claude API request structure
 * @see https://docs.anthropic.com/claude/reference/messages_post
 */
export interface ClaudeRequest {
  /** Model to use */
  model: string;
  
  /** Maximum tokens in response */
  max_tokens: number;
  
  /** Messages to send */
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  
  /** Temperature for randomness (0-1) */
  temperature?: number;
}

/**
 * Claude API response structure
 */
export interface ClaudeResponse {
  /** Response content */
  content: Array<{
    type: 'text';
    text: string;
  }>;
  
  /** Token usage */
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
  
  /** Model used */
  model: string;
  
  /** Stop reason */
  stop_reason: 'end_turn' | 'max_tokens' | 'stop_sequence';
}

/**
 * Claude API error response
 */
export interface ClaudeError {
  type: 'error';
  error: {
    type: string;
    message: string;
  };
}

/**
 * Result of API key validation
 */
export interface KeyValidationResult {
  /** Whether key is valid */
  valid: boolean;
  
  /** Error message if invalid */
  error?: string;
  
  /** Error code for specific handling */
  errorCode?: 'invalid_key' | 'network_error' | 'rate_limited' | 'unknown';
}

/**
 * Cost estimate before generation
 */
export interface CostEstimate {
  /** Estimated cost in USD */
  estimatedCost: number;
  
  /** Remaining daily budget */
  remainingBudget: number;
  
  /** Whether user can afford this request */
  canAfford: boolean;
  
  /** Warning message if near budget limit */
  warning?: string;
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
  /** Daily budget in USD */
  dailyBudgetUSD: number;
  
  /** Warning threshold (0-1, e.g., 0.8 = 80%) */
  warningThreshold: number;
  
  /** Whether to strictly enforce budget (block vs warn) */
  strictMode: boolean;
}

/**
 * Usage statistics for display
 */
export interface UsageStats {
  /** Amount spent today */
  todaySpent: number;
  
  /** Daily budget */
  dailyBudget: number;
  
  /** Remaining budget */
  remaining: number;
  
  /** Number of requests today */
  requestCount: number;
  
  /** Percentage of budget used (0-100) */
  percentUsed: number;
}
