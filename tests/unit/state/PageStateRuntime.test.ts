/**
 * @file PageStateRuntime.test.ts
 * @description Unit tests for page state code generation
 * 
 * @architecture Phase 4, Task 4.3 - Page State System
 * @created 2025-11-30
 */

import { describe, it, expect } from 'vitest';
import {
  generateStateCode,
  generateStateUpdate,
  generateStateToggle,
  generateStateIncrement,
  generateStateDecrement,
  generateStateReset,
} from '../../../src/core/state/PageStateRuntime';
import type { PageState } from '../../../src/core/logic/types';

// ============================================================
// generateStateCode TESTS
// ============================================================

describe('generateStateCode', () => {
  describe('empty state', () => {
    it('should return empty results for empty page state', () => {
      const pageState: PageState = {};
      const result = generateStateCode(pageState);
      
      expect(result.imports).toEqual([]);
      expect(result.hooks).toEqual([]);
      expect(result.stateObject).toBe('');
      expect(result.setterMapping).toBe('');
      expect(result.fullCode).toBe('');
    });
  });
  
  describe('single variable', () => {
    it('should generate code for number state', () => {
      const pageState: PageState = {
        clickCount: { type: 'number', initialValue: 0 },
      };
      const result = generateStateCode(pageState);
      
      expect(result.imports).toContain("import { useState } from 'react';");
      expect(result.hooks).toContain(
        'const [clickCount, setClickCount] = useState<number>(0);'
      );
      expect(result.stateObject).toBe('const state = { clickCount };');
      expect(result.setterMapping).toBe('const setters = { setClickCount };');
    });
    
    it('should generate code for string state', () => {
      const pageState: PageState = {
        userName: { type: 'string', initialValue: 'Guest' },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks).toContain(
        'const [userName, setUserName] = useState<string>("Guest");'
      );
    });
    
    it('should generate code for boolean state', () => {
      const pageState: PageState = {
        isActive: { type: 'boolean', initialValue: true },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks).toContain(
        'const [isActive, setIsActive] = useState<boolean>(true);'
      );
    });
  });
  
  describe('multiple variables', () => {
    it('should generate code for multiple state variables', () => {
      const pageState: PageState = {
        clickCount: { type: 'number', initialValue: 0 },
        userName: { type: 'string', initialValue: '' },
        isVisible: { type: 'boolean', initialValue: false },
      };
      const result = generateStateCode(pageState);
      
      // Hooks should be generated for each variable (sorted alphabetically)
      expect(result.hooks).toHaveLength(3);
      expect(result.hooks[0]).toContain('clickCount');
      expect(result.hooks[1]).toContain('isVisible');
      expect(result.hooks[2]).toContain('userName');
      
      // State object should include all variables
      expect(result.stateObject).toBe('const state = { clickCount, isVisible, userName };');
      
      // Setter mapping should include all setters
      expect(result.setterMapping).toBe(
        'const setters = { setClickCount, setIsVisible, setUserName };'
      );
    });
    
    it('should alphabetically sort variables in output', () => {
      const pageState: PageState = {
        zebra: { type: 'string', initialValue: '' },
        apple: { type: 'number', initialValue: 0 },
        mango: { type: 'boolean', initialValue: false },
      };
      const result = generateStateCode(pageState);
      
      // First hook should be for 'apple'
      expect(result.hooks[0]).toContain('apple');
      // Second should be 'mango'
      expect(result.hooks[1]).toContain('mango');
      // Third should be 'zebra'
      expect(result.hooks[2]).toContain('zebra');
    });
  });
  
  describe('special values', () => {
    it('should properly escape string values', () => {
      const pageState: PageState = {
        message: { type: 'string', initialValue: 'Hello "World"' },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks[0]).toContain('"Hello \\"World\\""');
    });
    
    it('should handle empty string initial value', () => {
      const pageState: PageState = {
        text: { type: 'string', initialValue: '' },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks[0]).toContain('useState<string>("")');
    });
    
    it('should handle negative numbers', () => {
      const pageState: PageState = {
        temp: { type: 'number', initialValue: -10 },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks[0]).toContain('useState<number>(-10)');
    });
    
    it('should handle decimal numbers', () => {
      const pageState: PageState = {
        price: { type: 'number', initialValue: 19.99 },
      };
      const result = generateStateCode(pageState);
      
      expect(result.hooks[0]).toContain('useState<number>(19.99)');
    });
  });
  
  describe('full code generation', () => {
    it('should generate properly formatted full code block', () => {
      const pageState: PageState = {
        count: { type: 'number', initialValue: 0 },
      };
      const result = generateStateCode(pageState);
      
      expect(result.fullCode).toContain('// Page State');
      expect(result.fullCode).toContain('// State object for template interpolation');
      expect(result.fullCode).toContain('// Setter mapping for event handlers');
    });
  });
});

// ============================================================
// generateStateUpdate TESTS
// ============================================================

describe('generateStateUpdate', () => {
  it('should generate setter call with expression', () => {
    const code = generateStateUpdate('clickCount', 'state.clickCount + 1');
    
    expect(code).toBe('setClickCount(state.clickCount + 1);');
  });
  
  it('should capitalize first letter of variable name', () => {
    const code = generateStateUpdate('userName', '"John"');
    
    expect(code).toBe('setUserName("John");');
  });
  
  it('should handle complex expressions', () => {
    const code = generateStateUpdate('total', 'price * quantity');
    
    expect(code).toBe('setTotal(price * quantity);');
  });
});

// ============================================================
// generateStateToggle TESTS
// ============================================================

describe('generateStateToggle', () => {
  it('should generate toggle code for boolean', () => {
    const code = generateStateToggle('isVisible');
    
    expect(code).toBe('setIsVisible(prev => !prev);');
  });
  
  it('should capitalize variable name', () => {
    const code = generateStateToggle('active');
    
    expect(code).toBe('setActive(prev => !prev);');
  });
});

// ============================================================
// generateStateIncrement TESTS
// ============================================================

describe('generateStateIncrement', () => {
  it('should generate increment by 1 code', () => {
    const code = generateStateIncrement('clickCount');
    
    expect(code).toBe('setClickCount(prev => prev + 1);');
  });
  
  it('should generate increment by 1 for explicit amount', () => {
    const code = generateStateIncrement('clickCount', 1);
    
    expect(code).toBe('setClickCount(prev => prev + 1);');
  });
  
  it('should generate increment by custom amount', () => {
    const code = generateStateIncrement('score', 10);
    
    expect(code).toBe('setScore(prev => prev + 10);');
  });
});

// ============================================================
// generateStateDecrement TESTS
// ============================================================

describe('generateStateDecrement', () => {
  it('should generate decrement by 1 code', () => {
    const code = generateStateDecrement('count');
    
    expect(code).toBe('setCount(prev => prev - 1);');
  });
  
  it('should generate decrement by custom amount', () => {
    const code = generateStateDecrement('health', 25);
    
    expect(code).toBe('setHealth(prev => prev - 25);');
  });
});

// ============================================================
// generateStateReset TESTS
// ============================================================

describe('generateStateReset', () => {
  it('should generate reset code for number', () => {
    const code = generateStateReset('count', 0, 'number');
    
    expect(code).toBe('setCount(0);');
  });
  
  it('should generate reset code for string', () => {
    const code = generateStateReset('name', '', 'string');
    
    expect(code).toBe('setName("");');
  });
  
  it('should generate reset code for boolean', () => {
    const code = generateStateReset('active', false, 'boolean');
    
    expect(code).toBe('setActive(false);');
  });
  
  it('should handle non-empty string initial value', () => {
    const code = generateStateReset('status', 'idle', 'string');
    
    expect(code).toBe('setStatus("idle");');
  });
});
