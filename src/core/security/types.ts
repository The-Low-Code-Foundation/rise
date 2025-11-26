/**
 * @file types.ts
 * @description Type definitions for Rise security infrastructure including
 *              API key management, usage tracking, and security monitoring.
 * 
 * @architecture Phase 0, Task 0.2 - Security Foundation
 * @created 2025-11-18
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Types are clear and comprehensive
 * 
 * @see docs/SECURITY_SPEC.md - Complete security architecture
 * @see .implementation/phase-0-foundation/task-0.2-security-foundation.md
 * 
 * @security-critical true
 * @performance-critical false
 */

/**
 * Supported AI providers for API key management
 */
export type AIProvider = 'claude' | 'openai';

/**
 * Metadata about stored API keys (does NOT include the key itself)
 * Stored separately from the actual key for security
 */
export interface KeyMetadata {
  /** AI provider this key is for */
  provider: AIProvider;
  
  /** When the key was first stored */
  storedAt: Date;
  
  /** When user should rotate this key (default: 90 days) */
  rotateAt: Date;
  
  /** Last time this key was retrieved and used (optional) */
  lastUsed?: Date;
}

/**
 * Token usage for a single API request
 * Used for cost calculation
 */
export interface TokenUsage {
  /** Tokens used in the prompt/input */
  prompt: number;
  
  /** Tokens used in the completion/output */
  completion: number;
}

/**
 * Record of a single API usage event
 * Stored for history and budget tracking
 */
export interface UsageRecord {
  /** When the API call was made */
  timestamp: Date;
  
  /** Which AI provider was used */
  provider: AIProvider;
  
  /** Token counts for this request */
  tokens: TokenUsage;
  
  /** Calculated cost in USD */
  cost: number;
  
  /** What feature triggered this API call */
  feature: string; // e.g., 'component-generation', 'code-review', 'ai-suggestion'
}

/**
 * Aggregated usage data for a single day
 * Used for daily budget enforcement
 */
export interface DailyUsage {
  /** Date in YYYY-MM-DD format */
  date: string;
  
  /** Total cost for this day in USD */
  totalCost: number;
  
  /** Number of API requests made */
  requestCount: number;
  
  /** Individual request records */
  requests: UsageRecord[];
}

/**
 * Cost estimate for a planned API call
 * Helps prevent budget overruns
 */
export interface CostEstimate {
  /** Estimated cost in USD */
  estimatedCost: number;
  
  /** Remaining budget for today in USD */
  remainingBudget: number;
  
  /** Whether the request is within budget */
  canAfford: boolean;
  
  /** Optional warning message if close to budget */
  warning?: string;
}

/**
 * Security event types for audit logging
 * Each represents a significant security-related action
 */
export enum SecurityEventType {
  // API Key Events
  API_KEY_STORED = 'api_key_stored',
  API_KEY_RETRIEVED = 'api_key_retrieved',
  API_KEY_DELETED = 'api_key_deleted',
  API_KEY_ROTATION_WARNING = 'api_key_rotation_warning',
  
  // API Call Events
  API_CALL = 'api_call',
  API_ERROR = 'api_error',
  
  // Input Validation Events
  INVALID_INPUT = 'invalid_input',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal_attempt',
  RESERVED_WORD_BLOCKED = 'reserved_word_blocked',
  
  // Budget Events
  BUDGET_WARNING = 'budget_warning',
  BUDGET_EXCEEDED = 'budget_exceeded',
  
  // Expression Security (future)
  EXPRESSION_BLOCKED = 'expression_blocked',
  EXPRESSION_TIMEOUT = 'expression_timeout',
  
  // General Security
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
}

/**
 * Severity levels for security events
 * Determines alerting and response behavior
 */
export enum SecuritySeverity {
  /** Informational - normal operation */
  INFO = 'INFO',
  
  /** Warning - potential issue, needs attention */
  WARNING = 'WARNING',
  
  /** Critical - security violation, immediate action required */
  CRITICAL = 'CRITICAL',
}

/**
 * Complete security event record for audit trail
 * Stored in security logs
 */
export interface SecurityEvent {
  /** Type of security event */
  type: SecurityEventType;
  
  /** Severity level */
  severity: SecuritySeverity;
  
  /** When the event occurred */
  timestamp: Date;
  
  /** User ID if available (future multi-user support) */
  userId?: string;
  
  /** Project ID if available */
  projectId?: string;
  
  /** Event-specific details (sensitive data must be sanitized) */
  details: Record<string, any>;
  
  /** Optional error stack trace for debugging */
  stack?: string;
}

/**
 * Configuration for API usage tracking and budget enforcement
 */
export interface UsageConfig {
  /** Daily budget limit in USD */
  dailyBudgetUSD: number;
  
  /** Warning threshold as percentage of budget (e.g., 0.8 for 80%) */
  warningThreshold: number;
  
  /** Whether to strictly enforce budget (true) or just warn (false) */
  strictMode: boolean;
}

/**
 * Security validation result
 * Returned by validation functions
 */
export interface ValidationResult {
  /** Whether the validation passed */
  isValid: boolean;
  
  /** Error message if validation failed */
  error?: string;
  
  /** Sanitized/corrected value if applicable */
  sanitized?: string;
}

/**
 * API pricing data structure
 * Prices in USD per million tokens
 */
export interface APIPricing {
  /** Cost per million prompt tokens */
  promptPerMillion: number;
  
  /** Cost per million completion tokens */
  completionPerMillion: number;
}
