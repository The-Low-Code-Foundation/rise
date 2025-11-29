/**
 * @file TemplateRegistry.test.ts
 * @description Unit tests for TemplateRegistry
 * 
 * @architecture Phase 3, Task 3.5 - Component Property Templates
 * @created 2025-11-29
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TemplateRegistry, templateRegistry, COMPONENT_TEMPLATES, TEMPLATE_COUNT } from '../../../src/core/templates';

describe('TemplateRegistry', () => {
  describe('singleton instance', () => {
    it('should export a pre-populated templateRegistry instance', () => {
      expect(templateRegistry).toBeInstanceOf(TemplateRegistry);
      expect(templateRegistry.count).toBeGreaterThan(0);
    });

    it('should have 21 unique type templates (some share same HTML element)', () => {
      // TEMPLATE_COUNT is 25 templates total, but only 21 unique types
      // because some templates share the same type (e.g., Container and Card both use 'div')
      expect(TEMPLATE_COUNT).toBe(25);
      expect(templateRegistry.count).toBe(21); // Unique types
    });
  });

  describe('getTemplate()', () => {
    it('should return template for known types', () => {
      const button = templateRegistry.getTemplate('button');
      expect(button).toBeDefined();
      expect(button?.type).toBe('button');
      expect(button?.displayName).toBe('Button');
    });

    it('should return undefined for unknown types', () => {
      const unknown = templateRegistry.getTemplate('nonexistent');
      expect(unknown).toBeUndefined();
    });
  });

  describe('hasTemplate()', () => {
    it('should return true for known types', () => {
      expect(templateRegistry.hasTemplate('button')).toBe(true);
      expect(templateRegistry.hasTemplate('div')).toBe(true);
      expect(templateRegistry.hasTemplate('input')).toBe(true);
    });

    it('should return false for unknown types', () => {
      expect(templateRegistry.hasTemplate('nonexistent')).toBe(false);
    });
  });

  describe('getAllTemplates()', () => {
    it('should return all registered templates (unique types only)', () => {
      const templates = templateRegistry.getAllTemplates();
      // Returns 21 unique templates (some share same HTML element type)
      expect(templates.length).toBe(21);
      expect(templates[0]).toHaveProperty('type');
      expect(templates[0]).toHaveProperty('displayName');
    });
  });

  describe('getTemplatesByCategory()', () => {
    it('should return only templates in specified category', () => {
      const basic = templateRegistry.getTemplatesByCategory('basic');
      expect(basic.length).toBeGreaterThan(0);
      basic.forEach(t => expect(t.category).toBe('basic'));

      const form = templateRegistry.getTemplatesByCategory('form');
      expect(form.length).toBeGreaterThan(0);
      form.forEach(t => expect(t.category).toBe('form'));
    });

    it('should return empty array for category with no templates', () => {
      // All categories should have templates, but test the mechanism
      const display = templateRegistry.getTemplatesByCategory('display');
      expect(Array.isArray(display)).toBe(true);
    });
  });

  describe('getTemplatesGroupedByCategory()', () => {
    it('should return templates grouped by category', () => {
      const grouped = templateRegistry.getTemplatesGroupedByCategory();
      
      expect(grouped).toHaveProperty('basic');
      expect(grouped).toHaveProperty('layout');
      expect(grouped).toHaveProperty('form');
      expect(grouped).toHaveProperty('display');
      
      expect(Array.isArray(grouped.basic)).toBe(true);
      expect(Array.isArray(grouped.layout)).toBe(true);
    });
  });

  describe('getPropertyTemplate()', () => {
    it('should return property template for known component and property', () => {
      const labelProp = templateRegistry.getPropertyTemplate('button', 'label');
      expect(labelProp).toBeDefined();
      expect(labelProp?.name).toBe('label');
      expect(labelProp?.dataType).toBe('string');
    });

    it('should return undefined for unknown property', () => {
      const unknown = templateRegistry.getPropertyTemplate('button', 'nonexistent');
      expect(unknown).toBeUndefined();
    });

    it('should return undefined for unknown component', () => {
      const unknown = templateRegistry.getPropertyTemplate('nonexistent', 'label');
      expect(unknown).toBeUndefined();
    });
  });

  describe('getPropertyTemplates()', () => {
    it('should return all properties for a component', () => {
      const props = templateRegistry.getPropertyTemplates('button');
      expect(props.length).toBeGreaterThan(0);
      expect(props.some(p => p.name === 'label')).toBe(true);
      expect(props.some(p => p.name === 'variant')).toBe(true);
    });

    it('should return empty array for unknown component', () => {
      const props = templateRegistry.getPropertyTemplates('nonexistent');
      expect(props).toEqual([]);
    });
  });

  describe('getPropertyTemplatesGroupedByCategory()', () => {
    it('should return properties grouped by category', () => {
      const grouped = templateRegistry.getPropertyTemplatesGroupedByCategory('button');
      
      expect(grouped).toHaveProperty('basics');
      expect(grouped).toHaveProperty('styling');
      expect(grouped).toHaveProperty('behavior');
      expect(grouped).toHaveProperty('advanced');
      
      // Button should have label in basics
      expect(grouped.basics.some(p => p.name === 'label')).toBe(true);
      // Button should have variant in styling
      expect(grouped.styling.some(p => p.name === 'variant')).toBe(true);
    });
  });

  describe('getEnumOptions()', () => {
    it('should return options for enum properties', () => {
      const options = templateRegistry.getEnumOptions('button', 'variant');
      expect(options).toBeDefined();
      expect(options?.length).toBeGreaterThan(0);
      expect(options?.some(o => o.value === 'primary')).toBe(true);
    });

    it('should return undefined for non-enum properties', () => {
      const options = templateRegistry.getEnumOptions('button', 'label');
      expect(options).toBeUndefined();
    });

    it('should return undefined for unknown properties', () => {
      const options = templateRegistry.getEnumOptions('button', 'nonexistent');
      expect(options).toBeUndefined();
    });
  });

  describe('buildDefaults()', () => {
    it('should build default properties and styling for known type', () => {
      const defaults = templateRegistry.buildDefaults('button');
      
      expect(defaults.properties).toBeDefined();
      expect(defaults.styling).toBeDefined();
      expect(defaults.styling.baseClasses.length).toBeGreaterThan(0);
      
      // Check label property
      expect(defaults.properties.label).toBeDefined();
      expect(defaults.properties.label.type).toBe('static');
      expect(defaults.properties.label.value).toBe('Click me');
    });

    it('should return empty defaults for unknown type', () => {
      const defaults = templateRegistry.buildDefaults('nonexistent');
      
      expect(defaults.properties).toEqual({});
      expect(defaults.styling.baseClasses).toEqual([]);
    });

    it('should convert enum dataType to string in properties', () => {
      const defaults = templateRegistry.buildDefaults('button');
      
      // variant is enum but stored as string
      expect(defaults.properties.variant).toBeDefined();
      expect(defaults.properties.variant.dataType).toBe('string');
    });
  });

  describe('custom template registration', () => {
    let registry: TemplateRegistry;

    beforeEach(() => {
      registry = new TemplateRegistry();
    });

    it('should allow registering custom templates', () => {
      registry.registerTemplate({
        type: 'custom-widget',
        displayName: 'Custom Widget',
        icon: 'cube',
        category: 'basic',
        properties: [],
        defaultClasses: ['custom-class'],
      });

      expect(registry.hasTemplate('custom-widget')).toBe(true);
      expect(registry.getTemplate('custom-widget')?.displayName).toBe('Custom Widget');
    });

    it('should allow unregistering templates', () => {
      const removed = registry.unregisterTemplate('button');
      expect(removed).toBe(true);
      expect(registry.hasTemplate('button')).toBe(false);
    });

    it('should return false when unregistering non-existent template', () => {
      const removed = registry.unregisterTemplate('nonexistent');
      expect(removed).toBe(false);
    });
  });

  describe('searchTemplates()', () => {
    it('should find templates by display name', () => {
      const results = templateRegistry.searchTemplates('button');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(t => t.type === 'button')).toBe(true);
    });

    it('should find templates by type', () => {
      const results = templateRegistry.searchTemplates('div');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', () => {
      const results = templateRegistry.searchTemplates('BUTTON');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', () => {
      const results = templateRegistry.searchTemplates('zzzznonexistent');
      expect(results).toEqual([]);
    });
  });

  describe('template content validation', () => {
    it('should have valid templates with required fields', () => {
      const templates = templateRegistry.getAllTemplates();
      
      templates.forEach((template) => {
        expect(template.type).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.icon).toBeDefined();
        expect(template.category).toBeDefined();
        expect(Array.isArray(template.properties)).toBe(true);
        expect(Array.isArray(template.defaultClasses)).toBe(true);
      });
    });

    it('should have valid property templates', () => {
      const templates = templateRegistry.getAllTemplates();
      
      templates.forEach((template) => {
        template.properties.forEach((prop) => {
          expect(prop.name).toBeDefined();
          expect(prop.dataType).toBeDefined();
          expect(prop.description).toBeDefined();
          expect(typeof prop.required).toBe('boolean');
          expect(prop.category).toBeDefined();
          
          // Enum properties should have options
          if (prop.dataType === 'enum') {
            expect(prop.options).toBeDefined();
            expect(prop.options?.length).toBeGreaterThan(0);
          }
        });
      });
    });
  });
});
