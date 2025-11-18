/**
 * @file SecurityError.ts
 * @description Custom error class for security-related errors in Rise.
 *              Provides structured error information with context for debugging
 *              while ensuring sensitive data is not exposed in error messages.
 * 
 * @architecture Phase 0, Task 0.2 - Security Foundation
 * @created 2025-11-18
 * @author AI (Cline) + Human Review
 * @confidence 10/10 - Simple, proven pattern for custom errors
 * 
 * @see docs/SECURITY_SPEC.md - Security architecture
 * @see docs/ERROR_HANDLING.md - Error handling patterns
 * @see .implementation/phase-0-foundation/task-0.2-security-foundation.md
 * 
 * @security-critical true
 * @performance-critical false
 */

/**
 * Custom error class for security violations and related issues.
 * 
 * PROBLEM SOLVED:
 * - Standard Error class doesn't provide structured context
 * - Need to track security-specific metadata (event type, severity)
 * - Must prevent sensitive data from leaking in error messages
 * - Need consistent error format across all security components
 * 
 * SOLUTION:
 * - Extend Error with security-specific properties
 * - Include sanitized context for debugging
 * - Mark errors with severity levels
 * - Preserve stack traces for troubleshooting
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * throw new SecurityError('Invalid API key format', {
 *   provider: 'claude',
 *   // key itself is NOT included - keep it secure!
 * }, 'WARNING');
 * ```
 * 
 * DESIGN DECISIONS:
 * - Extends Error: Maintains instanceof Error checks and stack traces
 * - Context object: Flexible structure for event-specific data
 * - Auto-sanitization: Prevents accidental sensitive data exposure
 * - Severity defaults to CRITICAL: Fail-secure approach
 * 
 * @class SecurityError
 * @extends Error
 */
export class SecurityError extends Error {
  /**
   * Machine-readable error code for programmatic handling
   * Format: SECURITY_[CATEGORY]_[SPECIFIC]
   */
  public readonly code: string;
  
  /**
   * Sanitized context about the error
   * Never includes sensitive data like API keys or passwords
   */
  public readonly context: Record<string, any>;
  
  /**
   * Severity level of this security error
   * Used for alerting and response prioritization
   */
  public readonly severity: 'INFO' | 'WARNING' | 'CRITICAL';
  
  /**
   * Timestamp when error occurred
   */
  public readonly timestamp: Date;

  /**
   * Create a new SecurityError instance.
   * 
   * IMPORTANT: The context object will be automatically sanitized to prevent
   * sensitive data exposure. Never include API keys, passwords, or tokens
   * in the context object.
   * 
   * @param message - Human-readable error description (shown to user)
   * @param context - Additional context for debugging (will be sanitized)
   * @param severity - Severity level (defaults to CRITICAL for fail-secure)
   * 
   * @example
   * ```typescript
   * // Good - no sensitive data
   * throw new SecurityError('API key format invalid', {
   *   provider: 'claude',
   *   format: 'expected sk-ant-...'
   * }, 'WARNING');
   * 
   * // Bad - includes sensitive key!
   * throw new SecurityError('Invalid key', {
   *   key: apiKey  // DON'T DO THIS!
   * });
   * ```
   */
  constructor(
    message: string,
    context: Record<string, any> = {},
    severity: 'INFO' | 'WARNING' | 'CRITICAL' = 'CRITICAL'
  ) {
    // Call parent Error constructor
    super(message);
    
    // Set the error name for better stack traces
    this.name = 'SecurityError';
    
    // Generate error code from message
    // e.g., "Invalid API key format" -> "SECURITY_INVALID_API_KEY_FORMAT"
    this.code = this.generateErrorCode(message);
    
    // Sanitize context to prevent sensitive data exposure
    this.context = this.sanitizeContext(context);
    
    // Store severity level
    this.severity = severity;
    
    // Record when error occurred
    this.timestamp = new Date();
    
    // Maintain proper stack trace (V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SecurityError);
    }
  }

  /**
   * Generate a machine-readable error code from the error message.
   * Used for programmatic error handling and logging.
   * 
   * @param message - Human-readable error message
   * @returns Error code in format SECURITY_[WORDS]
   * 
   * @example
   * generateErrorCode("Invalid API key format") 
   * // => "SECURITY_INVALID_API_KEY_FORMAT"
   * 
   * @private
   */
  private generateErrorCode(message: string): string {
    // Convert message to uppercase, replace spaces/special chars with underscores
    const normalized = message
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, ''); // Remove leading/trailing underscores
    
    return `SECURITY_${normalized}`;
  }

  /**
   * Sanitize context object to prevent sensitive data exposure.
   * Removes or redacts known sensitive field names.
   * 
   * SECURITY CRITICAL: This prevents accidental logging of API keys,
   * passwords, tokens, and other credentials.
   * 
   * @param context - Raw context object that may contain sensitive data
   * @param seen - Set of already-visited objects (for circular reference detection)
   * @returns Sanitized context safe for logging
   * 
   * @example
   * sanitizeContext({ 
   *   provider: 'claude', 
   *   apiKey: 'sk-ant-xxx' 
   * })
   * // => { provider: 'claude', apiKey: '[REDACTED]' }
   * 
   * @private
   */
  private sanitizeContext(
    context: Record<string, any>,
    seen: WeakSet<object> = new WeakSet()
  ): Record<string, any> {
    // List of field names that should never be logged
    const sensitiveKeys = [
      'apikey', 'api_key', 'key',
      'token', 'accesstoken', 'access_token',
      'password', 'pass', 'pwd',
      'secret', 'secretkey', 'secret_key',
      'privatekey', 'private_key',
      'credential', 'credentials',
      'authorization', 'auth',
    ];
    
    // Create a copy to avoid mutating original
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(context)) {
      // Check if key name indicates sensitive data (case-insensitive)
      const isSensitive = sensitiveKeys.some(
        sensitiveKey => key.toLowerCase().includes(sensitiveKey)
      );
      
      if (isSensitive) {
        // Redact sensitive values
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        // Check for circular reference
        if (seen.has(value)) {
          sanitized[key] = '[Circular]';
        } else {
          // Mark as seen
          seen.add(value);
          // Recursively sanitize nested objects
          sanitized[key] = this.sanitizeContext(value, seen);
        }
      } else {
        // Safe to include as-is
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }

  /**
   * Convert error to plain object for logging or serialization.
   * Useful for sending errors to logging systems or displaying in UI.
   * 
   * @returns Plain object representation of the error
   * 
   * @example
   * ```typescript
   * try {
   *   throw new SecurityError('Test error', { foo: 'bar' });
   * } catch (error) {
   *   console.log(error.toJSON());
   *   // {
   *   //   name: 'SecurityError',
   *   //   message: 'Test error',
   *   //   code: 'SECURITY_TEST_ERROR',
   *   //   severity: 'CRITICAL',
   *   //   context: { foo: 'bar' },
   *   //   timestamp: '2025-11-18T20:09:00.000Z',
   *   //   stack: '...'
   *   // }
   * }
   * ```
   */
  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    };
  }

  /**
   * Check if an error is a SecurityError instance.
   * Useful for error handling logic.
   * 
   * @param error - Error to check
   * @returns true if error is a SecurityError
   * 
   * @example
   * ```typescript
   * try {
   *   // some code
   * } catch (error) {
   *   if (SecurityError.isSecurityError(error)) {
   *     // Handle security-specific error
   *     console.error('Security violation:', error.code);
   *   }
   * }
   * ```
   */
  public static isSecurityError(error: any): error is SecurityError {
    return error instanceof SecurityError;
  }
}
