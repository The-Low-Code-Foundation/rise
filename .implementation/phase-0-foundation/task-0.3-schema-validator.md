# Task 0.3: Schema Level 1 Validator

**Phase:** Phase 0 - Foundation  
**Duration Estimate:** 3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🟡 Ready to Start  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical Foundation  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]  

---

## 🎯 Task Overview

### Objective
Implement comprehensive schema validation for Level 1 (MVP) manifest structure, ensuring only supported features are used and preventing scope creep.

### Problem Statement
Without strict schema validation, users could:
- Use Level 2/3 features not yet implemented (expressions, state, events)
- Create invalid component structures (circular references, invalid props)
- Exceed MVP limits (depth, children count)
- Generate broken code from malformed manifest

The validator must:
- **Reject unsupported features** (expressions, state management, event handlers)
- **Validate component structure** (valid IDs, names, relationships)
- **Enforce MVP limits** (max depth 5, max children 20)
- **Provide clear error messages** for user-friendly debugging

### Why This Matters
The schema validator is the **gatekeeper** that:
1. Prevents invalid data from entering the system
2. Provides early feedback to users about what's supported
3. Makes code generation safer (validated inputs = reliable outputs)
4. Enforces MVP scope boundaries (prevents premature Level 2/3 usage)

**Without validation, we generate broken code or crash the app.**

### Success Criteria
- [ ] SchemaValidator class implemented with Level 1 rules
- [ ] All Level 2/3 features rejected with clear messages
- [ ] Component structure validation (IDs, names, types, hierarchy)
- [ ] Circular reference detection working
- [ ] Depth and children limits enforced
- [ ] User-friendly error messages with context
- [ ] Validation performance <100ms for 100 components
- [ ] Unit test coverage >95%
- [ ] Integration tests passing
- [ ] Human review completed and approved

### References
- **docs/SCHEMA_LEVELS.md** - Level 1 feature boundaries
- **docs/COMPONENT_SCHEMA.md** - Complete schema specification
- **docs/MVP_ROADMAP.md** - Phase 0.2 Schema Level 1 Definition
- **CLINE_IMPLEMENTATION_PLAN.md** - Phase 0, Task 0.3

### Dependencies
- ✅ Can start immediately (independent task)
- ⚠️ **BLOCKS:** Code generation (Task 3.1) - must validate before generating

---

## 🗺️ Implementation Roadmap

### Milestone 1: Design & Architecture
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Ready to Start

#### Objective
Design the validation architecture and define all Level 1 rules.

#### Activities
- [ ] Review SCHEMA_LEVELS.md Level 1 specification
- [ ] List all supported Level 1 features
- [ ] List all blocked Level 2/3 features
- [ ] Design ValidationResult structure
- [ ] Design error message format
- [ ] Create validation rule priority system
- [ ] Document all validation rules

#### Level 1 Features (ALLOWED)

**Component Structure:**
- ✅ Component ID and display name
- ✅ Component type (PrimitiveComponent, CompositeComponent)
- ✅ Component category (basic, layout, input, etc.)
- ✅ Parent-child relationships
- ✅ Maximum depth: 5 levels
- ✅ Maximum children: 20 per component

**Properties:**
- ✅ **Static properties** - Fixed values (string, number, boolean)
- ✅ **Prop properties** - Component inputs with types
- ✅ Property data types: string, number, boolean, object, array
- ✅ Required/optional flags
- ✅ Default values

**Styling:**
- ✅ Base CSS class names
- ✅ Custom CSS (sanitized)
- ✅ Simple conditional classes

**Metadata:**
- ✅ Schema version: "1.0.0"
- ✅ Level: 1
- ✅ Project name, framework
- ✅ Created/modified timestamps

#### Level 2/3 Features (BLOCKED)

**Expressions (Level 2):**
- ❌ Template expressions: `{{ state.value }}`
- ❌ Computed properties
- ❌ Expression property type

**State Management (Level 2):**
- ❌ Local state
- ❌ Global state
- ❌ State nodes

**Events (Level 2):**
- ❌ Event handlers (onClick, onChange, etc.)
- ❌ Custom events
- ❌ Event propagation

**Advanced Features (Level 3):**
- ❌ Data connections (database, API)
- ❌ Real-time features
- ❌ AI integration
- ❌ Performance monitoring
- ❌ Testing integration

#### Validation Rules

```typescript
// Comprehensive Level 1 validation rules
const LEVEL_1_RULES = {
  schema: {
    requiredFields: ['schemaVersion', 'level', 'metadata', 'components'],
    schemaVersion: '1.0.0',
    level: 1,
  },
  
  component: {
    requiredFields: ['id', 'displayName', 'type', 'properties'],
    validTypes: ['PrimitiveComponent', 'CompositeComponent'],
    maxDepth: 5,
    maxChildren: 20,
    idPattern: /^comp_[a-zA-Z0-9_]+$/,
    namePattern: /^[A-Z][a-zA-Z0-9]*$/,
  },
  
  property: {
    allowedTypes: ['static', 'prop'],
    blockedTypes: ['expression', 'computed', 'state'],
    allowedDataTypes: ['string', 'number', 'boolean', 'object', 'array'],
  },
  
  blocked: {
    features: [
      'localState',
      'globalState',
      'eventHandlers',
      'dataConnections',
      'aiIntegration',
      'performance',
      'testing',
    ],
  },
};
```

---

### Milestone 2: Core Validator Implementation
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Pending Milestone 1

#### Objective
Implement the main SchemaValidator class with all Level 1 rules.

#### Implementation Structure

```typescript
// src/core/validation/SchemaValidator.ts

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  level: number;
}

interface ValidationError {
  field: string;
  message: string;
  level: 'ERROR' | 'WARNING';
  path?: string; // e.g., "components.comp_001.properties.label"
  suggestion?: string;
}

export class SchemaValidator {
  private readonly LEVEL_1_RULES = {
    maxDepth: 5,
    maxChildren: 20,
    supportedPropertyTypes: new Set(['static', 'prop']),
    blockedFeatures: new Set([
      'localState',
      'globalState', 
      'eventHandlers',
      'expressions',
    ]),
  };
  
  /**
   * Validate complete manifest against Level 1 schema
   * 
   * @param manifest - The manifest to validate
   * @returns Validation result with errors and warnings
   */
  validate(manifest: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    
    // 1. Validate schema structure
    this.validateSchemaStructure(manifest, errors);
    
    // 2. Validate metadata
    this.validateMetadata(manifest.metadata, errors);
    
    // 3. Validate each component
    for (const [id, component] of Object.entries(manifest.components || {})) {
      this.validateComponent(id, component, manifest, errors, warnings);
    }
    
    // 4. Validate component relationships
    this.validateComponentRelationships(manifest, errors);
    
    // 5. Check for blocked Level 2/3 features
    this.validateNoBlockedFeatures(manifest, errors);
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      level: 1,
    };
  }
  
  /**
   * Validate single component structure
   */
  private validateComponent(
    id: string,
    component: any,
    manifest: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    // Required fields
    if (!component.id) {
      errors.push({
        field: 'id',
        message: 'Component ID is required',
        level: 'ERROR',
        path: `components.${id}`,
      });
    }
    
    if (!component.displayName) {
      errors.push({
        field: 'displayName',
        message: 'Component display name is required',
        level: 'ERROR',
        path: `components.${id}`,
      });
    }
    
    if (!component.type) {
      errors.push({
        field: 'type',
        message: 'Component type is required',
        level: 'ERROR',
        path: `components.${id}`,
      });
    }
    
    // Validate type
    const validTypes = ['PrimitiveComponent', 'CompositeComponent'];
    if (component.type && !validTypes.includes(component.type)) {
      errors.push({
        field: 'type',
        message: `Invalid component type '${component.type}'. Must be one of: ${validTypes.join(', ')}`,
        level: 'ERROR',
        path: `components.${id}`,
      });
    }
    
    // Validate ID format
    if (component.id && !/^comp_[a-zA-Z0-9_]+$/.test(component.id)) {
      errors.push({
        field: 'id',
        message: `Invalid ID format '${component.id}'. Must match pattern: comp_[a-zA-Z0-9_]+`,
        level: 'ERROR',
        path: `components.${id}`,
        suggestion: 'Use format: comp_button_001',
      });
    }
    
    // Validate display name format
    if (component.displayName && !/^[A-Z][a-zA-Z0-9]*$/.test(component.displayName)) {
      warnings.push({
        field: 'displayName',
        message: `Display name '${component.displayName}' should be PascalCase`,
        level: 'WARNING',
        path: `components.${id}`,
        suggestion: 'Use PascalCase: Button, UserCard, NavigationBar',
      });
    }
    
    // Validate properties
    if (component.properties) {
      this.validateProperties(id, component.properties, errors);
    }
    
    // Validate children count
    if (component.children && component.children.length > this.LEVEL_1_RULES.maxChildren) {
      errors.push({
        field: 'children',
        message: `Component has ${component.children.length} children, max allowed is ${this.LEVEL_1_RULES.maxChildren}`,
        level: 'ERROR',
        path: `components.${id}.children`,
        suggestion: 'Split into smaller components',
      });
    }
  }
  
  /**
   * Validate component properties
   */
  private validateProperties(
    componentId: string,
    properties: any,
    errors: ValidationError[]
  ): void {
    for (const [propName, prop] of Object.entries(properties)) {
      // Check property type
      if (!prop.type) {
        errors.push({
          field: 'type',
          message: `Property '${propName}' missing type`,
          level: 'ERROR',
          path: `components.${componentId}.properties.${propName}`,
        });
        continue;
      }
      
      // Block Level 2/3 property types
      if (!this.LEVEL_1_RULES.supportedPropertyTypes.has(prop.type)) {
        errors.push({
          field: 'type',
          message: `Property type '${prop.type}' not supported in Level 1. Use 'static' or 'prop'.`,
          level: 'ERROR',
          path: `components.${componentId}.properties.${propName}`,
          suggestion: prop.type === 'expression' 
            ? 'Expressions are Level 2 feature (Post-MVP)'
            : 'Use static values or props in MVP',
        });
      }
      
      // Validate static property has value
      if (prop.type === 'static' && prop.value === undefined) {
        errors.push({
          field: 'value',
          message: `Static property '${propName}' must have a value`,
          level: 'ERROR',
          path: `components.${componentId}.properties.${propName}`,
        });
      }
      
      // Validate prop property has dataType
      if (prop.type === 'prop' && !prop.dataType) {
        errors.push({
          field: 'dataType',
          message: `Prop '${propName}' must specify dataType`,
          level: 'ERROR',
          path: `components.${componentId}.properties.${propName}`,
          suggestion: 'Use: string, number, boolean, object, or array',
        });
      }
    }
  }
  
  /**
   * Detect circular references in component tree
   */
  private validateComponentRelationships(
    manifest: any,
    errors: ValidationError[]
  ): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const detectCycle = (componentId: string, path: string[]): boolean => {
      if (recursionStack.has(componentId)) {
        errors.push({
          field: 'children',
          message: `Circular reference detected: ${path.join(' → ')} → ${componentId}`,
          level: 'ERROR',
          path: `components.${componentId}`,
          suggestion: 'Remove circular parent-child relationship',
        });
        return true;
      }
      
      if (visited.has(componentId)) {
        return false;
      }
      
      visited.add(componentId);
      recursionStack.add(componentId);
      
      const component = manifest.components[componentId];
      if (component?.children) {
        for (const childId of component.children) {
          if (detectCycle(childId, [...path, componentId])) {
            return true;
          }
        }
      }
      
      recursionStack.delete(componentId);
      return false;
    };
    
    // Check each component as a potential root
    for (const componentId of Object.keys(manifest.components || {})) {
      if (!visited.has(componentId)) {
        detectCycle(componentId, []);
      }
    }
  }
  
  /**
   * Validate tree depth doesn't exceed limit
   */
  private validateDepth(
    componentId: string,
    manifest: any,
    currentDepth: number,
    errors: ValidationError[]
  ): void {
    if (currentDepth > this.LEVEL_1_RULES.maxDepth) {
      errors.push({
        field: 'children',
        message: `Component tree depth ${currentDepth} exceeds max allowed depth ${this.LEVEL_1_RULES.maxDepth}`,
        level: 'ERROR',
        path: `components.${componentId}`,
        suggestion: 'Flatten component hierarchy or split into multiple pages',
      });
      return;
    }
    
    const component = manifest.components[componentId];
    if (component?.children) {
      for (const childId of component.children) {
        this.validateDepth(childId, manifest, currentDepth + 1, errors);
      }
    }
  }
  
  /**
   * Block Level 2/3 features
   */
  private validateNoBlockedFeatures(
    manifest: any,
    errors: ValidationError[]
  ): void {
    // Check for state management
    if (manifest.localState || manifest.globalState) {
      errors.push({
        field: 'state',
        message: 'State management not supported in Level 1 (MVP). Available in Level 2 (Post-MVP).',
        level: 'ERROR',
        path: 'manifest',
        suggestion: 'Use static values or props for now',
      });
    }
    
    // Check for event handlers in any component
    for (const [id, component] of Object.entries(manifest.components || {})) {
      if ((component as any).eventHandlers) {
        errors.push({
          field: 'eventHandlers',
          message: 'Event handlers not supported in Level 1 (MVP). Available in Level 2 (Post-MVP).',
          level: 'ERROR',
          path: `components.${id}`,
          suggestion: 'Static components only for MVP',
        });
      }
      
      // Check for data connections
      if ((component as any).dataConnections) {
        errors.push({
          field: 'dataConnections',
          message: 'Data connections not supported in Level 1 (MVP). Available in Level 3 (Future).',
          level: 'ERROR',
          path: `components.${id}`,
          suggestion: 'Use static data for MVP',
        });
      }
    }
  }
  
  private validateSchemaStructure(manifest: any, errors: ValidationError[]): void;
  private validateMetadata(metadata: any, errors: ValidationError[]): void;
}
```

---

### Milestone 3: Error Message System
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Pending Milestone 2

#### Objective
Create user-friendly error messages with context and suggestions.

#### Error Message Format

```typescript
interface VerboseValidationError {
  // Core error info
  field: string;
  message: string;
  severity: 'ERROR' | 'WARNING' | 'INFO';
  
  // Context
  path: string;                    // "components.comp_001.properties.label"
  componentId?: string;
  componentName?: string;
  
  // User guidance
  suggestion?: string;
  documentation?: string;          // Link to docs
  
  // Visual helpers
  codeContext?: string;            // Show problematic JSON
  expectedFormat?: string;         // Show what it should look like
}

// Example usage:
{
  field: 'properties.displayText.type',
  message: 'Expression properties not supported in Level 1',
  severity: 'ERROR',
  path: 'components.comp_button_001.properties.displayText',
  componentId: 'comp_button_001',
  componentName: 'Button',
  suggestion: 'Use "static" or "prop" type instead. Expressions available in Level 2 (Post-MVP).',
  documentation: 'https://docs.rise.com/schema-levels#level-1',
  codeContext: `
    "displayText": {
      "type": "expression",  ❌
      "expression": "{{ state.value }}"
    }
  `,
  expectedFormat: `
    "displayText": {
      "type": "static",  ✅
      "value": "Click me"
    }
  `,
}
```

---

### Milestone 4: Comprehensive Testing
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Pending Milestone 3

#### Test Categories

**1. Valid Level 1 Manifests (Should Pass):**
```typescript
describe('Valid Level 1 Schemas', () => {
  it('validates simple button component', () => {
    const manifest = {
      schemaVersion: '1.0.0',
      level: 1,
      metadata: { projectName: 'Test', framework: 'react' },
      components: {
        comp_button_001: {
          id: 'comp_button_001',
          displayName: 'Button',
          type: 'PrimitiveComponent',
          properties: {
            label: { type: 'static', value: 'Click me' },
            disabled: { type: 'prop', dataType: 'boolean', default: false },
          },
        },
      },
    };
    
    const result = validator.validate(manifest);
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual([]);
  });
  
  it('validates component with children', () => {
    // Test hierarchy
  });
  
  it('validates component at max depth (5 levels)', () => {
    // Create 5-level deep tree
  });
  
  it('validates component with max children (20)', () => {
    // Create component with 20 children
  });
});
```

**2. Invalid Manifests (Should Fail):**
```typescript
describe('Invalid Schemas', () => {
  it('rejects expression properties', () => {
    const manifest = {
      // ... with expression property
    };
    
    const result = validator.validate(manifest);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({
        message: expect.stringContaining('Expression'),
      })
    );
  });
  
  it('rejects state management', () => {});
  it('rejects event handlers', () => {});
  it('rejects circular references', () => {});
  it('rejects excessive depth (>5)', () => {});
  it('rejects too many children (>20)', () => {});
  it('rejects invalid component IDs', () => {});
  it('rejects invalid property types', () => {});
});
```

**3. Edge Cases:**
```typescript
describe('Edge Cases', () => {
  it('handles empty manifest', () => {});
  it('handles manifest with no components', () => {});
  it('handles component with no properties', () => {});
  it('handles deeply nested but valid tree', () => {});
  it('handles large manifest (100+ components)', () => {});
});
```

**4. Performance Tests:**
```typescript
describe('Performance', () => {
  it('validates 100 components in <100ms', () => {
    const manifest = createLargeManifest(100);
    
    const start = Date.now();
    validator.validate(manifest);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(100);
  });
});
```

---

### Milestone 5: Integration & Human Review
**Duration:** 0.5 day  
**Confidence Target:** 10/10  
**Status:** 🔵 Pending Milestone 4

#### Integration Tests

Test validator with real-world manifests:
```typescript
// tests/integration/validation.test.ts
describe('Validator Integration', () => {
  it('validates sample project manifests', async () => {
    const sampleManifests = [
      'samples/button-component.json',
      'samples/card-component.json',
      'samples/form-component.json',
    ];
    
    for (const path of sampleManifests) {
      const manifest = await loadManifest(path);
      const result = validator.validate(manifest);
      
      expect(result.isValid).toBe(true);
    }
  });
});
```

#### Human Review Checklist

- [ ] All Level 1 features correctly allowed
- [ ] All Level 2/3 features correctly blocked
- [ ] Error messages are clear and helpful
- [ ] Suggestions point users in right direction
- [ ] No false positives (valid schemas rejected)
- [ ] No false negatives (invalid schemas accepted)
- [ ] Performance acceptable for large manifests
- [ ] Code is well-documented

---

## 📋 Implementation Checklist

### Files to Create
- [ ] `src/core/validation/SchemaValidator.ts` - Main validator
- [ ] `src/core/validation/ValidationRules.ts` - Rule definitions
- [ ] `src/core/validation/ErrorFormatter.ts` - Error message formatting
- [ ] `src/core/validation/types.ts` - Type definitions
- [ ] `tests/unit/validation/schema-validator.test.ts` - Unit tests
- [ ] `tests/unit/validation/level1-rules.test.ts` - Rule tests
- [ ] `tests/integration/validation.test.ts` - Integration tests
- [ ] `tests/fixtures/manifests/` - Sample valid/invalid manifests

### Sample Manifests for Testing
```
tests/fixtures/manifests/
├── valid/
│   ├── simple-button.json
│   ├── card-with-children.json
│   ├── max-depth.json
│   └── max-children.json
└── invalid/
    ├── with-expressions.json
    ├── with-state.json
    ├── circular-reference.json
    ├── excessive-depth.json
    └── too-many-children.json
```

---

## 🎯 Success Metrics

### Functionality
- ✅ All Level 1 features validated correctly
- ✅ All Level 2/3 features rejected with clear messages
- ✅ Circular references detected
- ✅ Depth and children limits enforced
- ✅ No false positives or false negatives

### Code Quality
- ✅ >95% test coverage
- ✅ All edge cases tested
- ✅ Clear, maintainable code
- ✅ Comprehensive documentation

### User Experience
- ✅ Error messages are helpful
- ✅ Suggestions guide users to solutions
- ✅ Validation fast (<100ms for 100 components)

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Missing validation rule | HIGH | MEDIUM | Comprehensive test suite, review SCHEMA_LEVELS.md |
| False positive (valid rejected) | HIGH | MEDIUM | Test with many valid manifests, user feedback |
| False negative (invalid accepted) | HIGH | MEDIUM | Test all blocked features, penetration testing |
| Poor performance | MEDIUM | LOW | Optimize validation logic, cache results |
| Confusing error messages | MEDIUM | MEDIUM | User testing, clear documentation |

---

## 📚 Resources

### Documentation to Reference
- **SCHEMA_LEVELS.md** - Level 1 specification
- **COMPONENT_SCHEMA.md** - Complete schema reference
- **Task 0.2** - Input sanitization patterns

### External Resources
- [JSON Schema](https://json-schema.org/)
- [Ajv JSON validator](https://ajv.js.org/)

---

## ✅ Definition of Done

Task 0.3 is complete when:
1. All milestones (1-5) completed
2. >95% test coverage
3. All tests passing
4. Human review approved
5. Documentation updated
6. **GATE:** Ready for code generation integration

---

**Task Status:** 🟡 Ready to Start  
**Can Start:** Immediately (independent)  
**Risk Level:** MEDIUM - Logic complexity, edge cases  
**Next Task:** Can work in parallel with 0.2 and 0.4

---

**Last Updated:** 2025-11-18  
**Document Version:** 1.0  
**Prepared By:** Cline (Planning Assistant)  
**Requires Approval:** Lead Developer & Architect
