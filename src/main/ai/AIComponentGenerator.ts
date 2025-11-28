/**
 * @file AIComponentGenerator.ts
 * @description Service for generating React components via Claude API
 * 
 * @architecture Phase 2, Task 2.4A - AI Component Generation
 * @created 2025-11-26
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Core service with Claude API integration
 * 
 * @see docs/API_INTEGRATION.md - Claude API patterns
 * @see docs/SECURITY_SPEC.md - API key security
 * @see docs/SCHEMA_LEVELS.md - Level 1 restrictions
 * 
 * PROBLEM SOLVED:
 * - Users want to describe components in natural language
 * - Generated components must comply with Level 1 schema
 * - API costs must be tracked and budgets enforced
 * 
 * SOLUTION:
 * - Structured prompt template that instructs Claude
 * - Parse and validate response against Level 1 schema
 * - Integrate with existing security infrastructure
 * - Track costs and respect daily budgets
 * 
 * @security-critical true - Handles API keys and external API calls
 * @performance-critical false - API calls are inherently slow
 */

import { APIKeyManager } from '../../core/security/APIKeyManager';
import { APIUsageTracker } from '../../core/security/APIUsageTracker';
import { SecurityLogger } from '../../core/security/SecurityLogger';
import { SecurityEventType, SecuritySeverity } from '../../core/security/types';
import type { Component } from '../../core/manifest/types';
import type {
  GenerationContext,
  GenerationResult,
  ClaudeRequest,
  ClaudeResponse,
  ClaudeError,
  KeyValidationResult,
  CostEstimate,
  UsageStats,
  BudgetConfig,
} from './types';

/**
 * Generates React components via Claude API with Level 1 schema compliance.
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const generator = new AIComponentGenerator('/path/to/project');
 * 
 * // Check if ready
 * const hasKey = await generator.isAvailable();
 * if (!hasKey) {
 *   console.log('Please configure API key');
 *   return;
 * }
 * 
 * // Generate component
 * const result = await generator.generate('Create a user card with avatar and name', {
 *   framework: 'react',
 *   schemaLevel: 1,
 *   existingComponentNames: ['App', 'Header'],
 * });
 * 
 * if (result.success) {
 *   console.log('Generated:', result.component);
 * }
 * ```
 * 
 * DESIGN DECISIONS:
 * - Uses Claude Sonnet for balance of quality/cost
 * - Low temperature (0.3) for consistent output
 * - Structured JSON output for reliable parsing
 * - Auto-fix common Level 1 violations
 * 
 * @class AIComponentGenerator
 */
export class AIComponentGenerator {
  /** Claude API endpoint */
  private readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  
  /** Model to use - Claude Sonnet for balance of quality and cost */
  private readonly MODEL = 'claude-sonnet-4-20250514';
  
  /** Maximum tokens for response */
  private readonly MAX_TOKENS = 4096;
  
  /** API version header */
  private readonly API_VERSION = '2023-06-01';
  
  /** Pricing per million tokens (Claude Sonnet as of 2024) */
  private readonly PRICING = {
    inputPerMillion: 3.0,   // $3 per 1M input tokens
    outputPerMillion: 15.0, // $15 per 1M output tokens
  };
  
  /** Security services */
  private keyManager: APIKeyManager;
  private usageTracker: APIUsageTracker;
  private logger: SecurityLogger;
  
  /** Project path for services */
  private projectPath: string;
  
  /**
   * Create a new AIComponentGenerator instance.
   * 
   * @param projectPath - Absolute path to project directory
   */
  constructor(projectPath: string) {
    this.projectPath = projectPath;
    this.keyManager = new APIKeyManager(projectPath);
    this.usageTracker = new APIUsageTracker(projectPath);
    this.logger = new SecurityLogger(projectPath);
  }
  
  /**
   * Check if AI generation is available (has valid API key).
   * 
   * @returns Promise resolving to true if API key is configured
   */
  async isAvailable(): Promise<boolean> {
    return this.keyManager.hasKey('claude');
  }
  
  /**
   * Validate an API key by making a minimal API call.
   * 
   * Uses a tiny request ("Hi" with max_tokens: 1) to verify the key
   * is valid without incurring significant cost (~$0.000003).
   * 
   * @param apiKey - API key to validate
   * @returns Promise resolving to validation result
   */
  async validateKey(apiKey: string): Promise<KeyValidationResult> {
    // Basic format check first
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      return {
        valid: false,
        error: 'Invalid key format. Claude API keys start with "sk-ant-"',
        errorCode: 'invalid_key',
      };
    }
    
    try {
      // Make minimal API call to validate
      const response = await fetch(this.CLAUDE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': this.API_VERSION,
        },
        body: JSON.stringify({
          model: this.MODEL,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });
      
      if (response.ok) {
        return { valid: true };
      }
      
      // Parse error response
      const errorData = await response.json() as ClaudeError;
      
      if (response.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your key and try again.',
          errorCode: 'invalid_key',
        };
      }
      
      if (response.status === 429) {
        return {
          valid: false,
          error: 'Rate limited. Please wait a moment and try again.',
          errorCode: 'rate_limited',
        };
      }
      
      return {
        valid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
        errorCode: 'unknown',
      };
      
    } catch (error) {
      // Network error
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Network error: ${message}`,
        errorCode: 'network_error',
      };
    }
  }
  
  /**
   * Store API key after validation.
   * 
   * @param apiKey - API key to store
   * @returns Promise resolving to validation result
   */
  async storeKey(apiKey: string): Promise<KeyValidationResult> {
    // Validate first
    const validation = await this.validateKey(apiKey);
    
    if (!validation.valid) {
      return validation;
    }
    
    try {
      // Store in keychain
      await this.keyManager.storeKey('claude', apiKey);
      
      // Log the event (without the key)
      await this.logger.logEvent({
        type: SecurityEventType.API_KEY_STORED,
        severity: SecuritySeverity.INFO,
        timestamp: new Date(),
        details: { provider: 'claude' },
      });
      
      return { valid: true };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      return {
        valid: false,
        error: `Failed to store key: ${message}`,
        errorCode: 'unknown',
      };
    }
  }
  
  /**
   * Delete stored API key.
   * 
   * @returns Promise resolving to true if deleted
   */
  async deleteKey(): Promise<boolean> {
    try {
      const deleted = await this.keyManager.deleteKey('claude');
      
      if (deleted) {
        await this.logger.logEvent({
          type: SecurityEventType.API_KEY_DELETED,
          severity: SecuritySeverity.INFO,
          timestamp: new Date(),
          details: { provider: 'claude' },
        });
      }
      
      return deleted;
      
    } catch (error) {
      console.error('[AIGenerator] Error deleting key:', error);
      return false;
    }
  }
  
  /**
   * Estimate cost for a prompt before generation.
   * 
   * @param prompt - User's prompt text
   * @returns Promise resolving to cost estimate
   */
  async estimateCost(prompt: string): Promise<CostEstimate> {
    // Approximate token count (≈4 characters per token)
    // Add ~2000 tokens for system prompt template
    const promptTokens = Math.ceil(prompt.length / 4) + 2000;
    
    // Assume completion is roughly equal to prompt (conservative)
    const completionTokens = Math.max(1000, promptTokens);
    
    // Calculate estimated cost
    const cost = this.calculateCost(promptTokens, completionTokens);
    
    // Get remaining budget
    const remaining = await this.usageTracker.getRemainingBudget();
    
    // Check if affordable
    const canAfford = cost <= remaining;
    
    // Generate warning if needed
    let warning: string | undefined;
    if (!canAfford) {
      warning = `Estimated cost ($${cost.toFixed(4)}) exceeds remaining budget ($${remaining.toFixed(2)})`;
    } else if (cost > remaining * 0.5) {
      warning = `This request will use ${((cost / remaining) * 100).toFixed(0)}% of remaining budget`;
    }
    
    return {
      estimatedCost: cost,
      remainingBudget: remaining,
      canAfford,
      warning,
    };
  }
  
  /**
   * Get current usage statistics.
   * 
   * @returns Promise resolving to usage stats
   */
  async getUsageStats(): Promise<UsageStats> {
    const history = await this.usageTracker.getUsageHistory(1);
    const config = await this.getBudgetConfig();
    
    const today = history[0];
    const todaySpent = today?.totalCost || 0;
    const requestCount = today?.requestCount || 0;
    
    const percentUsed = (todaySpent / config.dailyBudgetUSD) * 100;
    
    return {
      todaySpent,
      dailyBudget: config.dailyBudgetUSD,
      remaining: Math.max(0, config.dailyBudgetUSD - todaySpent),
      requestCount,
      percentUsed: Math.min(100, percentUsed),
    };
  }
  
  /**
   * Get budget configuration.
   * 
   * @returns Promise resolving to budget config
   */
  async getBudgetConfig(): Promise<BudgetConfig> {
    // For now, use defaults - will add config file support in Task 2.4D
    return {
      dailyBudgetUSD: 10,
      warningThreshold: 0.8,
      strictMode: true,
    };
  }
  
  /**
   * Update budget configuration.
   * 
   * @param config - New budget configuration
   * @returns Promise that resolves when saved
   */
  async updateBudgetConfig(config: Partial<BudgetConfig>): Promise<void> {
    // Will implement in Task 2.4D with settings persistence
    console.log('[AIGenerator] Budget config update:', config);
  }
  
  /**
   * Generate a component from natural language prompt.
   * 
   * @param prompt - User's description of desired component
   * @param context - Generation context (parent, existing names, etc.)
   * @returns Promise resolving to generation result
   */
  async generate(
    prompt: string,
    context: GenerationContext
  ): Promise<GenerationResult> {
    // 1. Check API key availability
    const hasKey = await this.isAvailable();
    if (!hasKey) {
      return {
        success: false,
        error: 'No Claude API key configured. Please add your API key in Settings.',
      };
    }
    
    // 2. Check budget
    const estimate = await this.estimateCost(prompt);
    if (!estimate.canAfford) {
      return {
        success: false,
        error: `Insufficient budget. Estimated cost: $${estimate.estimatedCost.toFixed(4)}, Remaining: $${estimate.remainingBudget.toFixed(2)}`,
      };
    }
    
    // 3. Get API key
    const apiKey = await this.keyManager.getKey('claude');
    if (!apiKey) {
      return {
        success: false,
        error: 'Failed to retrieve API key. Please re-enter your key in Settings.',
      };
    }
    
    try {
      // 4. Log the attempt (without sensitive data)
      await this.logger.logEvent({
        type: SecurityEventType.API_CALL,
        severity: SecuritySeverity.INFO,
        timestamp: new Date(),
        details: { promptLength: prompt.length, hasParent: !!context.parentComponentId },
      });
      
      // 5. Build and send request
      const fullPrompt = this.buildPrompt(prompt, context);
      const request: ClaudeRequest = {
        model: this.MODEL,
        max_tokens: this.MAX_TOKENS,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3, // Lower for more consistent output
      };
      
      const response = await this.callClaudeAPI(apiKey, request);
      
      // 6. Parse response
      const component = this.parseResponse(response.content[0].text, context);
      
      // 7. Validate Level 1 compliance
      const validationErrors = this.validateLevel1(component);
      if (validationErrors.length > 0) {
        // Try to fix common issues
        const fixed = this.fixLevel1Violations(component, validationErrors);
        const revalidation = this.validateLevel1(fixed);
        
        if (revalidation.length > 0) {
          return {
            success: false,
            error: `Generated component has Level 1 violations: ${revalidation[0]}`,
          };
        }
        
        // Use fixed version
        Object.assign(component, fixed);
      }
      
      // 8. Track usage
      const cost = this.calculateCost(
        response.usage.input_tokens,
        response.usage.output_tokens
      );
      
      await this.usageTracker.trackRequest('claude', {
        prompt: response.usage.input_tokens,
        completion: response.usage.output_tokens,
      }, 'component-generation');
      
      return {
        success: true,
        component,
        usage: {
          promptTokens: response.usage.input_tokens,
          completionTokens: response.usage.output_tokens,
          cost,
        },
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      
      await this.logger.logEvent({
        type: SecurityEventType.API_ERROR,
        severity: SecuritySeverity.WARNING,
        timestamp: new Date(),
        details: { error: message },
      });
      
      return {
        success: false,
        error: `Generation failed: ${message}`,
      };
    }
  }
  
  /**
   * Build the full prompt with template and context.
   * 
   * @param userPrompt - User's description
   * @param context - Generation context
   * @returns Complete prompt for Claude
   */
  private buildPrompt(userPrompt: string, context: GenerationContext): string {
    return `You are a React component architect for Rise, a visual low-code builder.
Generate a component schema based on the user's request.

USER REQUEST:
${userPrompt}

CONTEXT:
- Framework: React
- Schema Level: 1 (MVP - static properties only)
- ${context.parentComponentId ? `Parent Component: ${context.parentComponentType} (${context.parentComponentId})` : 'This will be a root component'}
- Existing components: ${context.existingComponentNames.join(', ') || 'None'}

CRITICAL LEVEL 1 RESTRICTIONS (MUST FOLLOW):
- Properties can ONLY be "static" or "prop" types
- NO expressions (type: "expression" is FORBIDDEN)
- NO state management (no localState, no globalState)
- NO event handlers (no onClick, onChange, etc.)
- NO computed properties
- Only use: static values, props with defaults, Tailwind CSS classes

IMPORTANT - VISIBLE CONTENT REQUIREMENT:
For ANY component that should display text, you MUST include a "text" property.
The "text" property will be rendered inside the component. Without it, the component will appear EMPTY.
Example - if creating a user card, add:
  "text": {
    "type": "prop",
    "dataType": "string",
    "default": "John Doe"
  }
Other properties like "userName", "avatarUrl" can exist as additional data, but "text" is what gets displayed.

REQUIRED RESPONSE FORMAT:
Return ONLY valid JSON matching this exact structure (no markdown, no explanation, no code blocks):

{
  "displayName": "ComponentName",
  "type": "div",
  "category": "custom",
  "properties": {
    "text": {
      "type": "static",
      "dataType": "string",
      "value": "Hello World"
    }
  },
  "styling": {
    "baseClasses": ["p-4", "bg-white", "rounded-lg", "shadow"]
  },
  "children": []
}

PROPERTY FORMATS:

Static property (fixed value):
{
  "propertyName": {
    "type": "static",
    "dataType": "string|number|boolean",
    "value": "the value"
  }
}

Prop (input from parent):
{
  "propertyName": {
    "type": "prop",
    "dataType": "string|number|boolean",
    "required": true|false,
    "default": "default value"
  }
}

REQUIRED "text" property (for visible content):
{
  "text": {
    "type": "prop",
    "dataType": "string",
    "default": "Your visible text here"
  }
}

VALID COMPONENT TYPES:
div, span, button, input, img, section, article, header, footer, nav, ul, li, a, p, h1, h2, h3, form, label

STYLING:
Use Tailwind CSS classes only in baseClasses array.

Generate the component schema now:`;
  }
  
  /**
   * Call Claude API.
   * 
   * @param apiKey - API key
   * @param request - Request body
   * @returns Promise resolving to response
   * @throws Error if API call fails
   */
  private async callClaudeAPI(
    apiKey: string,
    request: ClaudeRequest
  ): Promise<ClaudeResponse> {
    const response = await fetch(this.CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': this.API_VERSION,
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({})) as ClaudeError;
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    return response.json() as Promise<ClaudeResponse>;
  }
  
  /**
   * Parse Claude's response into a Component.
   * 
   * @param content - Raw response text
   * @param context - Generation context
   * @returns Parsed component
   * @throws Error if parsing fails
   */
  private parseResponse(content: string, context: GenerationContext): Component {
    // Remove any markdown code blocks if present
    let json = content.trim();
    json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try to find JSON object in response
    const jsonMatch = json.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      json = jsonMatch[0];
    }
    
    let parsed: any;
    try {
      parsed = JSON.parse(json);
    } catch (e) {
      throw new Error('Failed to parse AI response as JSON. The AI may have returned invalid output.');
    }
    
    // Generate proper ID
    const baseName = (parsed.displayName || 'Component')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .slice(0, 20);
    const id = `comp_${baseName}_${Date.now().toString(36)}`;
    
    // Build full component structure
    const component: Component = {
      id,
      displayName: parsed.displayName || 'Generated Component',
      type: parsed.type || 'div',
      category: parsed.category || 'custom',
      properties: parsed.properties || {},
      styling: {
        baseClasses: parsed.styling?.baseClasses || [],
        conditionalClasses: parsed.styling?.conditionalClasses,
        customCSS: parsed.styling?.customCSS,
      },
      children: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'ai',
        version: '1.0.0',
      },
    };
    
    return component;
  }
  
  /**
   * Validate component against Level 1 restrictions.
   * 
   * @param component - Component to validate
   * @returns Array of error messages (empty if valid)
   */
  private validateLevel1(component: Component): string[] {
    const errors: string[] = [];
    
    // Check for blocked property types
    // Use 'any' because we're validating potentially invalid AI-generated content
    for (const [propName, prop] of Object.entries(component.properties)) {
      const propType = (prop as any).type;
      
      if (propType !== 'static' && propType !== 'prop') {
        errors.push(`Property "${propName}" has type "${propType}" which is not allowed in Level 1`);
      }
    }
    
    // Check for event handlers
    if ((component as any).eventHandlers) {
      errors.push('Event handlers are not allowed in Level 1');
    }
    
    // Check for state
    if ((component as any).localState) {
      errors.push('Local state is not allowed in Level 1');
    }
    
    if ((component as any).globalState) {
      errors.push('Global state is not allowed in Level 1');
    }
    
    return errors;
  }
  
  /**
   * Attempt to fix common Level 1 violations.
   * 
   * @param component - Component to fix
   * @param errors - Validation errors
   * @returns Fixed component
   */
  private fixLevel1Violations(component: Component, errors: string[]): Component {
    const fixed = { ...component, properties: { ...component.properties } };
    
    // Remove blocked property types by converting to static
    // Use 'any' because we're fixing potentially invalid AI-generated content
    for (const [propName, prop] of Object.entries(fixed.properties)) {
      const propAny = prop as any;
      
      if (propAny.type !== 'static' && propAny.type !== 'prop') {
        // Convert to static if has value, otherwise remove
        if (propAny.value !== undefined) {
          fixed.properties[propName] = {
            type: 'static',
            dataType: typeof propAny.value as 'string' | 'number' | 'boolean',
            value: propAny.value,
          };
        } else {
          delete fixed.properties[propName];
        }
      }
    }
    
    // Remove event handlers
    delete (fixed as any).eventHandlers;
    
    // Remove state
    delete (fixed as any).localState;
    delete (fixed as any).globalState;
    
    return fixed;
  }
  
  /**
   * Calculate cost from token usage.
   * 
   * @param inputTokens - Number of input tokens
   * @param outputTokens - Number of output tokens
   * @returns Cost in USD
   */
  private calculateCost(inputTokens: number, outputTokens: number): number {
    return (
      (inputTokens / 1_000_000) * this.PRICING.inputPerMillion +
      (outputTokens / 1_000_000) * this.PRICING.outputPerMillion
    );
  }
}

/**
 * Singleton instance for main process
 */
let generatorInstance: AIComponentGenerator | null = null;

/**
 * Get or create AIComponentGenerator instance.
 * 
 * @param projectPath - Project path (required for first call)
 * @returns AIComponentGenerator instance
 */
export function getAIGenerator(projectPath?: string): AIComponentGenerator {
  if (!generatorInstance && projectPath) {
    generatorInstance = new AIComponentGenerator(projectPath);
  }
  
  if (!generatorInstance) {
    throw new Error('AIComponentGenerator not initialized. Provide projectPath on first call.');
  }
  
  return generatorInstance;
}

/**
 * Clear the generator instance (e.g., when project closes).
 */
export function clearAIGenerator(): void {
  generatorInstance = null;
}
