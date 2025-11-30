/**
 * @file TemplateParser.test.ts
 * @description Unit tests for template syntax parsing
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 */

import { describe, it, expect } from 'vitest';
import {
  parseTemplate,
  generateExpression,
  validateStateRefs,
  hasStateRefs,
  extractStateRefs,
} from '../../../src/core/state/TemplateParser';
import type { PageState } from '../../../src/core/logic/types';

// ============================================================
// parseTemplate TESTS
// ============================================================

describe('parseTemplate', () => {
  describe('simple templates', () => {
    it('should parse plain text without state refs', () => {
      const result = parseTemplate('Hello World');
      
      expect(result.original).toBe('Hello World');
      expect(result.hasStateRefs).toBe(false);
      expect(result.stateRefs).toEqual([]);
      expect(result.parts).toEqual([
        { type: 'text', value: 'Hello World' },
      ]);
    });
    
    it('should parse template with single state ref', () => {
      const result = parseTemplate('Count: {{state.clickCount}}');
      
      expect(result.original).toBe('Count: {{state.clickCount}}');
      expect(result.hasStateRefs).toBe(true);
      expect(result.stateRefs).toEqual(['clickCount']);
      expect(result.parts).toEqual([
        { type: 'text', value: 'Count: ' },
        { type: 'stateRef', variable: 'clickCount' },
      ]);
    });
    
    it('should parse template with state ref only', () => {
      const result = parseTemplate('{{state.userName}}');
      
      expect(result.hasStateRefs).toBe(true);
      expect(result.stateRefs).toEqual(['userName']);
      expect(result.parts).toEqual([
        { type: 'stateRef', variable: 'userName' },
      ]);
    });
  });
  
  describe('multiple state refs', () => {
    it('should parse template with multiple different refs', () => {
      const result = parseTemplate('{{state.firstName}} {{state.lastName}}');
      
      expect(result.stateRefs).toEqual(['firstName', 'lastName']);
      expect(result.parts).toEqual([
        { type: 'stateRef', variable: 'firstName' },
        { type: 'text', value: ' ' },
        { type: 'stateRef', variable: 'lastName' },
      ]);
    });
    
    it('should deduplicate repeated refs', () => {
      const result = parseTemplate('{{state.name}} is {{state.name}}');
      
      expect(result.stateRefs).toEqual(['name']);
      // Parts: stateRef(name), text(" is "), stateRef(name)
      expect(result.parts).toHaveLength(3);
      expect(result.parts[0]).toEqual({ type: 'stateRef', variable: 'name' });
      expect(result.parts[1]).toEqual({ type: 'text', value: ' is ' });
      expect(result.parts[2]).toEqual({ type: 'stateRef', variable: 'name' });
    });
    
    it('should handle refs at start, middle, and end', () => {
      const result = parseTemplate('{{state.a}} middle {{state.b}} end');
      
      expect(result.stateRefs).toEqual(['a', 'b']);
      expect(result.parts).toEqual([
        { type: 'stateRef', variable: 'a' },
        { type: 'text', value: ' middle ' },
        { type: 'stateRef', variable: 'b' },
        { type: 'text', value: ' end' },
      ]);
    });
  });
  
  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = parseTemplate('');
      
      expect(result.hasStateRefs).toBe(false);
      expect(result.stateRefs).toEqual([]);
      expect(result.parts).toEqual([{ type: 'text', value: '' }]);
    });
    
    it('should handle underscore-prefixed variable names', () => {
      const result = parseTemplate('{{state._private}}');
      
      expect(result.stateRefs).toEqual(['_private']);
    });
    
    it('should handle variable names with numbers', () => {
      const result = parseTemplate('{{state.item1}}');
      
      expect(result.stateRefs).toEqual(['item1']);
    });
    
    it('should NOT match invalid patterns', () => {
      // Missing state prefix
      const r1 = parseTemplate('{{clickCount}}');
      expect(r1.hasStateRefs).toBe(false);
      
      // Missing closing braces
      const r2 = parseTemplate('{{state.count');
      expect(r2.hasStateRefs).toBe(false);
      
      // Space in variable name
      const r3 = parseTemplate('{{state.invalid name}}');
      expect(r3.hasStateRefs).toBe(false);
      
      // Starts with number
      const r4 = parseTemplate('{{state.1invalid}}');
      expect(r4.hasStateRefs).toBe(false);
    });
  });
});

// ============================================================
// generateExpression TESTS
// ============================================================

describe('generateExpression', () => {
  it('should return quoted string for plain text', () => {
    const parsed = parseTemplate('Hello World');
    const expr = generateExpression(parsed);
    
    expect(expr).toBe('"Hello World"');
  });
  
  it('should generate template literal for single ref', () => {
    const parsed = parseTemplate('Count: {{state.clickCount}}');
    const expr = generateExpression(parsed);
    
    expect(expr).toBe('`Count: ${state.clickCount}`');
  });
  
  it('should use custom state accessor', () => {
    const parsed = parseTemplate('Count: {{state.clickCount}}');
    const expr = generateExpression(parsed, 'pageState');
    
    expect(expr).toBe('`Count: ${pageState.clickCount}`');
  });
  
  it('should handle multiple refs', () => {
    const parsed = parseTemplate('{{state.a}} + {{state.b}}');
    const expr = generateExpression(parsed);
    
    expect(expr).toBe('`${state.a} + ${state.b}`');
  });
  
  it('should escape backticks in text', () => {
    const parsed = parseTemplate('Value: `test` {{state.val}}');
    const expr = generateExpression(parsed);
    
    expect(expr).toBe('`Value: \\`test\\` ${state.val}`');
  });
  
  it('should escape dollar-brace in text', () => {
    const parsed = parseTemplate('Price: ${100} {{state.price}}');
    const expr = generateExpression(parsed);
    
    expect(expr).toBe('`Price: \\${100} ${state.price}`');
  });
});

// ============================================================
// validateStateRefs TESTS
// ============================================================

describe('validateStateRefs', () => {
  const pageState: PageState = {
    clickCount: { type: 'number', initialValue: 0 },
    userName: { type: 'string', initialValue: '' },
    isActive: { type: 'boolean', initialValue: false },
  };
  
  it('should validate existing refs', () => {
    const parsed = parseTemplate('Count: {{state.clickCount}}');
    const result = validateStateRefs(parsed, pageState);
    
    expect(result.isValid).toBe(true);
    expect(result.missingVariables).toEqual([]);
  });
  
  it('should detect missing refs', () => {
    const parsed = parseTemplate('{{state.unknownVar}}');
    const result = validateStateRefs(parsed, pageState);
    
    expect(result.isValid).toBe(false);
    expect(result.missingVariables).toEqual(['unknownVar']);
  });
  
  it('should detect multiple missing refs', () => {
    const parsed = parseTemplate('{{state.a}} {{state.b}}');
    const result = validateStateRefs(parsed, pageState);
    
    expect(result.isValid).toBe(false);
    expect(result.missingVariables).toEqual(['a', 'b']);
  });
  
  it('should validate templates without refs', () => {
    const parsed = parseTemplate('Hello World');
    const result = validateStateRefs(parsed, pageState);
    
    expect(result.isValid).toBe(true);
    expect(result.missingVariables).toEqual([]);
  });
  
  it('should validate mixed valid and invalid refs', () => {
    const parsed = parseTemplate('{{state.clickCount}} {{state.invalid}}');
    const result = validateStateRefs(parsed, pageState);
    
    expect(result.isValid).toBe(false);
    expect(result.missingVariables).toEqual(['invalid']);
  });
});

// ============================================================
// hasStateRefs TESTS
// ============================================================

describe('hasStateRefs', () => {
  it('should return true for templates with refs', () => {
    expect(hasStateRefs('Count: {{state.clickCount}}')).toBe(true);
    expect(hasStateRefs('{{state.a}} {{state.b}}')).toBe(true);
  });
  
  it('should return false for templates without refs', () => {
    expect(hasStateRefs('Hello World')).toBe(false);
    expect(hasStateRefs('{{notState.var}}')).toBe(false);
    expect(hasStateRefs('')).toBe(false);
  });
});

// ============================================================
// extractStateRefs TESTS
// ============================================================

describe('extractStateRefs', () => {
  it('should extract unique state refs', () => {
    const refs = extractStateRefs('{{state.a}} {{state.b}} {{state.a}}');
    
    expect(refs).toEqual(['a', 'b']);
  });
  
  it('should return empty array for no refs', () => {
    const refs = extractStateRefs('No refs here');
    
    expect(refs).toEqual([]);
  });
});
