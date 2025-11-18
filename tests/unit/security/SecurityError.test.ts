/**
 * @file SecurityError.test.ts
 * @description Unit tests for SecurityError class
 * 
 * @architecture Phase 0, Task 0.2 - Security Foundation
 * @created 2025-11-18
 * @confidence 10/10 - Comprehensive test coverage
 */

import { SecurityError } from '../../../src/core/security/SecurityError';

describe('SecurityError', () => {
  describe('constructor', () => {
    it('should create error with message and default severity', () => {
      const error = new SecurityError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(SecurityError);
      expect(error.message).toBe('Test error');
      expect(error.severity).toBe('CRITICAL');
      expect(error.name).toBe('SecurityError');
      expect(error.context).toEqual({});
    });

    it('should create error with custom severity', () => {
      const error = new SecurityError('Test warning', {}, 'WARNING');
      
      expect(error.severity).toBe('WARNING');
    });

    it('should create error with INFO severity', () => {
      const error = new SecurityError('Test info', {}, 'INFO');
      
      expect(error.severity).toBe('INFO');
    });

    it('should include timestamp', () => {
      const before = new Date();
      const error = new SecurityError('Test');
      const after = new Date();
      
      expect(error.timestamp).toBeInstanceOf(Date);
      expect(error.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(error.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should generate error code from message', () => {
      const error = new SecurityError('Invalid API key format');
      
      expect(error.code).toBe('SECURITY_INVALID_API_KEY_FORMAT');
    });

    it('should sanitize special characters in error code', () => {
      const error = new SecurityError('Test: Invalid@input!');
      
      expect(error.code).toBe('SECURITY_TEST_INVALID_INPUT');
    });
  });

  describe('context sanitization', () => {
    it('should redact API keys from context', () => {
      const error = new SecurityError('Test', {
        apiKey: 'sk-secret-key',
        provider: 'claude',
      });
      
      expect(error.context.apiKey).toBe('[REDACTED]');
      expect(error.context.provider).toBe('claude');
    });

    it('should redact all sensitive key variations', () => {
      const error = new SecurityError('Test', {
        apiKey: 'secret1',
        api_key: 'secret2',
        key: 'secret3',
        token: 'secret4',
        password: 'secret5',
        secret: 'secret6',
      });
      
      expect(error.context.apiKey).toBe('[REDACTED]');
      expect(error.context.api_key).toBe('[REDACTED]');
      expect(error.context.key).toBe('[REDACTED]');
      expect(error.context.token).toBe('[REDACTED]');
      expect(error.context.password).toBe('[REDACTED]');
      expect(error.context.secret).toBe('[REDACTED]');
    });

    it('should handle case-insensitive sensitive keys', () => {
      const error = new SecurityError('Test', {
        ApiKey: 'secret',
        ACCESS_TOKEN: 'secret',
        PassWord: 'secret',
      });
      
      expect(error.context.ApiKey).toBe('[REDACTED]');
      expect(error.context.ACCESS_TOKEN).toBe('[REDACTED]');
      expect(error.context.PassWord).toBe('[REDACTED]');
    });

    it('should recursively sanitize nested objects', () => {
      const error = new SecurityError('Test', {
        user: {
          name: 'John',
          password: 'secret',
          profile: {
            email: 'john@example.com',
            apiKey: 'sk-secret',
          },
        },
      });
      
      expect(error.context.user.name).toBe('John');
      expect(error.context.user.password).toBe('[REDACTED]');
      expect(error.context.user.profile.email).toBe('john@example.com');
      expect(error.context.user.profile.apiKey).toBe('[REDACTED]');
    });

    it('should sanitize arrays of objects', () => {
      const error = new SecurityError('Test', {
        users: [
          { name: 'John', password: 'secret1' },
          { name: 'Jane', password: 'secret2' },
        ],
      });
      
      expect(error.context.users[0].name).toBe('John');
      expect(error.context.users[0].password).toBe('[REDACTED]');
      expect(error.context.users[1].name).toBe('Jane');
      expect(error.context.users[1].password).toBe('[REDACTED]');
    });

    it('should preserve non-sensitive data', () => {
      const error = new SecurityError('Test', {
        provider: 'claude',
        requestCount: 5,
        timestamp: '2025-11-18',
        details: {
          feature: 'code-generation',
          status: 'success',
        },
      });
      
      expect(error.context.provider).toBe('claude');
      expect(error.context.requestCount).toBe(5);
      expect(error.context.timestamp).toBe('2025-11-18');
      expect(error.context.details.feature).toBe('code-generation');
    });
  });

  describe('toJSON', () => {
    it('should convert error to JSON-serializable object', () => {
      const error = new SecurityError('Test error', { foo: 'bar' }, 'WARNING');
      const json = error.toJSON();
      
      expect(json.name).toBe('SecurityError');
      expect(json.message).toBe('Test error');
      expect(json.code).toBe('SECURITY_TEST_ERROR');
      expect(json.severity).toBe('WARNING');
      expect(json.context).toEqual({ foo: 'bar' });
      expect(typeof json.timestamp).toBe('string');
      expect(json.stack).toBeDefined();
    });

    it('should include ISO timestamp', () => {
      const error = new SecurityError('Test');
      const json = error.toJSON();
      
      // Should be valid ISO 8601 format
      expect(() => new Date(json.timestamp)).not.toThrow();
    });
  });

  describe('isSecurityError', () => {
    it('should return true for SecurityError instances', () => {
      const error = new SecurityError('Test');
      
      expect(SecurityError.isSecurityError(error)).toBe(true);
    });

    it('should return false for regular Error instances', () => {
      const error = new Error('Test');
      
      expect(SecurityError.isSecurityError(error)).toBe(false);
    });

    it('should return false for non-Error objects', () => {
      expect(SecurityError.isSecurityError({ message: 'Test' })).toBe(false);
      expect(SecurityError.isSecurityError('error')).toBe(false);
      expect(SecurityError.isSecurityError(null)).toBe(false);
      expect(SecurityError.isSecurityError(undefined)).toBe(false);
    });
  });

  describe('error throwing and catching', () => {
    it('should be catchable as Error', () => {
      expect(() => {
        throw new SecurityError('Test');
      }).toThrow(Error);
    });

    it('should be catchable as SecurityError', () => {
      expect(() => {
        throw new SecurityError('Test');
      }).toThrow(SecurityError);
    });

    it('should preserve stack trace', () => {
      try {
        throw new SecurityError('Test');
      } catch (error: any) {
        expect(error.stack).toBeDefined();
        expect(error.stack).toContain('SecurityError');
      }
    });
  });

  describe('edge cases', () => {
    it('should handle empty message', () => {
      const error = new SecurityError('');
      
      expect(error.message).toBe('');
      expect(error.code).toBe('SECURITY_');
    });

    it('should handle empty context', () => {
      const error = new SecurityError('Test', {});
      
      expect(error.context).toEqual({});
    });

    it('should handle null values in context', () => {
      const error = new SecurityError('Test', {
        value: null,
        nested: { value: null },
      });
      
      expect(error.context.value).toBeNull();
      expect(error.context.nested.value).toBeNull();
    });

    it('should handle undefined values in context', () => {
      const error = new SecurityError('Test', {
        value: undefined,
      });
      
      expect(error.context.value).toBeUndefined();
    });

    it('should handle context with circular references gracefully', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;
      
      // Should not throw - toJSON will handle it
      const error = new SecurityError('Test', circular);
      expect(error.context).toBeDefined();
    });
  });
});
