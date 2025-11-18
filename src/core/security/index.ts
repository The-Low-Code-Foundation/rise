/**
 * @file index.ts
 * @description Central export point for Rise security infrastructure.
 *              Provides convenient access to all security components.
 * 
 * @architecture Phase 0, Task 0.2 - Security Foundation
 * @created 2025-11-18
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple barrel export
 * 
 * @see docs/SECURITY_SPEC.md - Complete security architecture
 * @see .implementation/phase-0-foundation/task-0.2-security-foundation.md
 * 
 * @security-critical true
 * @performance-critical false
 */

// Core security classes
export { SecurityError } from './SecurityError';
export { APIKeyManager } from './APIKeyManager';
export { InputSanitizer } from './InputSanitizer';
export { APIUsageTracker } from './APIUsageTracker';
export { SecurityLogger } from './SecurityLogger';

// Type definitions
export {
  // Type aliases
  AIProvider,
  
  // Interfaces
  KeyMetadata,
  TokenUsage,
  UsageRecord,
  DailyUsage,
  CostEstimate,
  UsageConfig,
  ValidationResult,
  APIPricing,
  SecurityEvent,
  
  // Enums
  SecurityEventType,
  SecuritySeverity,
} from './types';
