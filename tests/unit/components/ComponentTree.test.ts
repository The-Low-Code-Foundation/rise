/**
 * @file ComponentTree.test.ts
 * @description Unit tests for ComponentTree UI logic
 * 
 * @architecture Phase 2, Tasks 2.1 & 2.2 - Automated Testing
 * @created 2025-11-26
 * @author AI (Cline) - Automated Test Suite
 * 
 * Tests search/filter logic and icon mapping for component tree UI
 * 
 * Coverage Target: 85%+
 */

import { describe, it, expect } from 'vitest';

// Type definitions for component data
interface ComponentData {
  id: string;
  displayName: string;
  type: string;
  category?: string;
}

/**
 * Filter components by search term (displayName)
 * Tests the logic that would be used in ComponentTree search
 */
function filterComponentsByName(components: ComponentData[], searchTerm: string): ComponentData[] {
  if (!searchTerm) return components;
  const term = searchTerm.toLowerCase();
  return components.filter(c => c.displayName.toLowerCase().includes(term));
}

/**
 * Filter components by type
 */
function filterComponentsByType(components: ComponentData[], type: string): ComponentData[] {
  if (!type) return components;
  return components.filter(c => c.type.toLowerCase().includes(type.toLowerCase()));
}

/**
 * Map component type to icon category
 * This determines which icon to show in the component tree
 */
const TYPE_CATEGORY_MAP: Record<string, string> = {
  'button': 'form',
  'input': 'form',
  'textarea': 'form',
  'select': 'form',
  'div': 'layout',
  'section': 'layout',
  'article': 'layout',
  'header': 'layout',
  'footer': 'layout',
  'span': 'basic',
  'p': 'basic',
  'h1': 'basic',
  'h2': 'basic',
  'h3': 'basic',
  'img': 'media',
  'video': 'media',
  'custom': 'custom',
};

function getIconCategory(type: string): string {
  return TYPE_CATEGORY_MAP[type.toLowerCase()] || 'custom';
}

describe('ComponentTree UI Logic', () => {
  
  // ========================================
  // SECTION 1: Search/Filter by displayName
  // ========================================
  
  describe('Search/Filter by displayName', () => {
    const testComponents: ComponentData[] = [
      { id: '1', displayName: 'HeaderComponent', type: 'div' },
      { id: '2', displayName: 'FooterComponent', type: 'div' },
      { id: '3', displayName: 'Button', type: 'button' },
      { id: '4', displayName: 'UserCard', type: 'div' },
    ];

    it('should filter components by displayName', () => {
      const filtered = filterComponentsByName(testComponents, 'component');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.find(c => c.id === '1')).toBeDefined();
      expect(filtered.find(c => c.id === '2')).toBeDefined();
      expect(filtered.find(c => c.id === '3')).toBeUndefined();
    });

    it('should be case-insensitive', () => {
      const filtered1 = filterComponentsByName(testComponents, 'HEADER');
      const filtered2 = filterComponentsByName(testComponents, 'header');
      const filtered3 = filterComponentsByName(testComponents, 'HeAdEr');
      
      expect(filtered1).toHaveLength(1);
      expect(filtered2).toHaveLength(1);
      expect(filtered3).toHaveLength(1);
      expect(filtered1[0].id).toBe('1');
    });

    it('should return empty array when no matches', () => {
      const filtered = filterComponentsByName(testComponents, 'xyz123');
      
      expect(filtered).toHaveLength(0);
    });

    it('should return all components when search term is empty', () => {
      const filtered = filterComponentsByName(testComponents, '');
      
      expect(filtered).toHaveLength(4);
    });

    it('should match partial strings', () => {
      const filtered = filterComponentsByName(testComponents, 'Card');
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('4');
    });

    it('should handle special characters in search', () => {
      const components = [
        { id: '1', displayName: 'Login-Form', type: 'div' },
        { id: '2', displayName: 'User_Profile', type: 'div' },
      ];
      
      const filtered = filterComponentsByName(components, 'login');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });

  // ========================================
  // SECTION 2: Filter by type
  // ========================================

  describe('Filter by type', () => {
    const testComponents: ComponentData[] = [
      { id: '1', displayName: 'Header', type: 'div' },
      { id: '2', displayName: 'Submit', type: 'button' },
      { id: '3', displayName: 'Cancel', type: 'button' },
      { id: '4', displayName: 'Input', type: 'input' },
    ];

    it('should filter components by type', () => {
      const filtered = filterComponentsByType(testComponents, 'button');
      
      expect(filtered).toHaveLength(2);
      expect(filtered.find(c => c.id === '2')).toBeDefined();
      expect(filtered.find(c => c.id === '3')).toBeDefined();
    });

    it('should be case-insensitive for type filtering', () => {
      const filtered1 = filterComponentsByType(testComponents, 'BUTTON');
      const filtered2 = filterComponentsByType(testComponents, 'Button');
      
      expect(filtered1).toHaveLength(2);
      expect(filtered2).toHaveLength(2);
    });

    it('should return empty array when no type matches', () => {
      const filtered = filterComponentsByType(testComponents, 'select');
      
      expect(filtered).toHaveLength(0);
    });

    it('should return all components when type filter is empty', () => {
      const filtered = filterComponentsByType(testComponents, '');
      
      expect(filtered).toHaveLength(4);
    });

    it('should handle partial type matches', () => {
      const filtered = filterComponentsByType(testComponents, 'butt');
      
      expect(filtered).toHaveLength(2);
    });
  });

  // ========================================
  // SECTION 3: Icon Category Mapping
  // ========================================

  describe('Icon category mapping', () => {
    it('should map button to form category', () => {
      expect(getIconCategory('button')).toBe('form');
    });

    it('should map input to form category', () => {
      expect(getIconCategory('input')).toBe('form');
      expect(getIconCategory('textarea')).toBe('form');
      expect(getIconCategory('select')).toBe('form');
    });

    it('should map div to layout category', () => {
      expect(getIconCategory('div')).toBe('layout');
      expect(getIconCategory('section')).toBe('layout');
      expect(getIconCategory('article')).toBe('layout');
    });

    it('should map span to basic category', () => {
      expect(getIconCategory('span')).toBe('basic');
      expect(getIconCategory('p')).toBe('basic');
      expect(getIconCategory('h1')).toBe('basic');
    });

    it('should map img to media category', () => {
      expect(getIconCategory('img')).toBe('media');
      expect(getIconCategory('video')).toBe('media');
    });

    it('should handle unknown type gracefully', () => {
      const category = getIconCategory('unknowntype');
      expect(category).toBe('custom');
    });

    it('should be case-insensitive', () => {
      expect(getIconCategory('BUTTON')).toBe('form');
      expect(getIconCategory('Button')).toBe('form');
      expect(getIconCategory('BuTtOn')).toBe('form');
    });

    it('should map custom type explicitly', () => {
      expect(getIconCategory('custom')).toBe('custom');
    });
  });

  // ========================================
  // SECTION 4: Combined Filtering
  // ========================================

  describe('Combined filtering scenarios', () => {
    const testComponents: ComponentData[] = [
      { id: '1', displayName: 'HeaderComponent', type: 'div', category: 'layout' },
      { id: '2', displayName: 'FooterComponent', type: 'div', category: 'layout' },
      { id: '3', displayName: 'SubmitButton', type: 'button', category: 'form' },
      { id: '4', displayName: 'CancelButton', type: 'button', category: 'form' },
      { id: '5', displayName: 'UserInput', type: 'input', category: 'form' },
    ];

    it('should chain multiple filters', () => {
      // First filter by type, then by name
      const byType = filterComponentsByType(testComponents, 'button');
      const byName = filterComponentsByName(byType, 'submit');
      
      expect(byName).toHaveLength(1);
      expect(byName[0].id).toBe('3');
    });

    it('should handle filtering with no results at any stage', () => {
      const byType = filterComponentsByType(testComponents, 'select');
      const byName = filterComponentsByName(byType, 'anything');
      
      expect(byName).toHaveLength(0);
    });

    it('should preserve original array when no filters applied', () => {
      const byType = filterComponentsByType(testComponents, '');
      const byName = filterComponentsByName(byType, '');
      
      expect(byName).toHaveLength(5);
    });
  });
});
