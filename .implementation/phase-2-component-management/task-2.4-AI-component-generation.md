# Task 2.4: AI Component Generation (Level 1)

**Phase:** Phase 2 - Component Management  
**Duration Estimate:** 4-5 days (split into 5 subtasks)  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Not Started  
**Assigned:** AI (Cline) + Human Review  
**Priority:** P0 - Critical Path  
**Dependencies:** Task 2.1-2.3 ✅, Phase 0 Security ✅  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]

---

## 📋 Task Split Overview

| Subtask | Name | Duration | Status |
|---------|------|----------|--------|
| **2.4A** | AI Generator Service | 1 day | ✅ Complete |
| **2.4B** | Prompt UI & Dialog | 1 day | ✅ Complete |
| **2.4C** | Response Parsing & Validation | 0.5-1 day | ✅ (In 2.4A) |
| **2.4D** | Settings & API Key UI | 0.5-1 day | 🔵 Not Started |
| **2.4E** | Integration & Polish | 0.5 day | 🔵 Not Started |

---

## 🎯 Task Overview

### Objective
Enable users to generate components using natural language prompts sent to Claude API. The AI generates Level 1 compliant component schemas that are validated and added to the manifest.

### Problem Statement
Manually creating components is tedious. Users want to describe what they need in plain English and have the system generate a properly structured component. This is a core differentiator for Rise.

### What Already Exists (from Phase 0)

| Feature | Status | Location |
|---------|--------|----------|
| APIKeyManager | ✅ Complete | `src/core/security/APIKeyManager.ts` |
| APIUsageTracker | ✅ Complete | `src/core/security/APIUsageTracker.ts` |
| InputSanitizer | ✅ Complete | `src/core/security/InputSanitizer.ts` |
| SecurityLogger | ✅ Complete | `src/core/security/SecurityLogger.ts` |
| Level1SchemaValidator | ✅ Complete | `src/core/validation/SchemaValidator.ts` |

### What This Task Adds

| Feature | Description |
|---------|-------------|
| AIComponentGenerator | Service class for Claude API calls |
| AI Prompt Dialog | UI for entering prompts and confirming generation |
| Response Parser | Parse Claude response into manifest format |
| Level 1 Enforcement | Ensure generated components are Level 1 only |
| Cost Display | Show estimated cost before generation |
| API Key Settings | UI for users to add/manage their Claude API key |
| Error Handling | User-friendly errors for API failures |

### Success Criteria
- [ ] User can enter natural language prompt
- [ ] Cost estimate shown before generation
- [ ] User must confirm before API call
- [ ] Claude API called with proper prompt template
- [ ] Response parsed into valid component schema
- [ ] Generated component validated against Level 1
- [ ] Component added to manifest on success
- [ ] Component appears in tree immediately
- [ ] Usage tracked via APIUsageTracker
- [ ] Errors displayed with helpful messages
- [ ] API key settings accessible and working
- [ ] NO Level 2+ features in generated output
- [ ] TypeScript strict mode passing
- [ ] Human review approved

### References
- **docs/API_INTEGRATION.md** - Claude API patterns
- **docs/SECURITY_SPEC.md** - API key security
- **docs/SCHEMA_LEVELS.md** - Level 1 restrictions
- **src/core/security/** - Phase 0 security classes
- **CLINE_IMPLEMENTATION_PLAN.md** - Task 2.4 requirements

### Dependencies
- ✅ Task 2.1-2.3: Component management complete
- ✅ Phase 0: Security infrastructure complete
- ⚠️ **BLOCKS:** Phase 3 (users will want to see AI-generated components)

### Out of Scope (Level 1 Restrictions)
- ❌ Generating expressions → Level 2
- ❌ Generating state management → Level 2
- ❌ Generating event handlers → Level 2
- ❌ Generating computed properties → Level 2
- ❌ Multi-component generation (one at a time for MVP)
- ❌ Component editing via AI (generate only)

---

## 🏗️ Architecture Overview

### Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI Generation Flow                            │
│                                                                  │
│  User enters prompt: "Create a user card with avatar and name"  │
│         │                                                        │
│         ▼                                                        │
│  ┌─────────────────┐                                            │
│  │ AIPromptDialog  │                                            │
│  │ - Shows prompt  │                                            │
│  │ - Cost estimate │                                            │
│  │ - Confirm btn   │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           │ User clicks "Generate"                              │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ AIComponent     │────▶│ APIKeyManager   │                   │
│  │ Generator       │     │ .getKey()       │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ Has key?                                            │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ APIUsageTracker │────▶│ Check budget    │                   │
│  │ .estimateCost() │     │ Can afford?     │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ Yes, proceed                                        │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Build prompt    │                                            │
│  │ with template   │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ fetch() to      │────▶│ Claude API      │                   │
│  │ Claude API      │     │ /v1/messages    │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ Response                                            │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ Parse JSON from │                                            │
│  │ response        │                                            │
│  └────────┬────────┘                                            │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ Level1Schema    │────▶│ Valid Level 1?  │                   │
│  │ Validator       │     │                 │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           │ Yes, valid                                          │
│           ▼                                                      │
│  ┌─────────────────┐     ┌─────────────────┐                   │
│  │ manifestStore   │────▶│ Component added │                   │
│  │ .addComponent() │     │ to tree         │                   │
│  └────────┬────────┘     └─────────────────┘                   │
│           │                                                      │
│           ▼                                                      │
│  ┌─────────────────┐                                            │
│  │ APIUsageTracker │                                            │
│  │ .trackRequest() │                                            │
│  └─────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App
├── Toolbar
│   └── AIGenerateButton → Opens AIPromptDialog
├── NavigatorPanel
│   ├── ComponentTree
│   │   └── Context menu: "Generate with AI..." → Opens AIPromptDialog
│   └── AddComponentDialog (existing)
│       └── "Generate with AI" link → Opens AIPromptDialog
└── Settings (accessible from menu)
    └── APIKeySettings
        ├── Claude API Key input
        ├── Budget settings
        └── Usage display

AIPromptDialog (Modal)
├── Prompt textarea
├── Context display (parent component, if any)
├── Cost estimate
├── Privacy notice
├── Generate button
└── Loading state with cancel
```

---

## 🗺️ Implementation Roadmap

### Task 2.4A: AI Generator Service
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create the core service class that handles Claude API communication.

#### Files to Create

**`src/core/ai/AIComponentGenerator.ts`** (~350 lines)
```typescript
/**
 * @file AIComponentGenerator.ts
 * @description Service for generating components via Claude API
 * 
 * @architecture Phase 2, Task 2.4A - AI Component Generation
 * 
 * PROBLEM SOLVED:
 * - Users want to describe components in natural language
 * - Need to enforce Level 1 schema restrictions
 * - Must track costs and respect budgets
 * 
 * SOLUTION:
 * - Structured prompt template that instructs Claude
 * - Parse and validate response
 * - Integrate with existing security infrastructure
 * 
 * @security-critical true - Handles API keys and external API calls
 */

import { APIKeyManager } from '../security/APIKeyManager';
import { APIUsageTracker } from '../security/APIUsageTracker';
import { SecurityLogger, SecurityEventType } from '../security/SecurityLogger';
import { Level1SchemaValidator } from '../validation/SchemaValidator';
import type { Component, ComponentProperty } from '../manifest/types';

/**
 * Context provided to AI for better generation
 */
interface GenerationContext {
  framework: 'react';
  schemaLevel: 1;
  parentComponentId?: string;
  parentComponentType?: string;
  existingComponentNames: string[];
}

/**
 * Result of a generation attempt
 */
interface GenerationResult {
  success: boolean;
  component?: Component;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    cost: number;
  };
}

/**
 * Claude API request structure
 */
interface ClaudeRequest {
  model: string;
  max_tokens: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
}

/**
 * Claude API response structure
 */
interface ClaudeResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AIComponentGenerator {
  private readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
  private readonly MODEL = 'claude-sonnet-4-20250514';
  private readonly MAX_TOKENS = 4096;
  
  private keyManager: APIKeyManager;
  private usageTracker: APIUsageTracker;
  private logger: SecurityLogger;
  private validator: Level1SchemaValidator;
  
  constructor(projectPath: string) {
    this.keyManager = new APIKeyManager(projectPath);
    this.usageTracker = new APIUsageTracker(projectPath);
    this.logger = new SecurityLogger(projectPath);
    this.validator = new Level1SchemaValidator();
  }
  
  /**
   * Check if AI generation is available (has API key)
   */
  async isAvailable(): Promise<boolean> {
    return this.keyManager.hasKey('claude');
  }
  
  /**
   * Estimate cost for a prompt before generation
   */
  async estimateCost(prompt: string): Promise<{
    canAfford: boolean;
    estimatedCost: number;
    remainingBudget: number;
  }> {
    // Rough estimate: prompt + template ~2000 tokens, response ~1000 tokens
    const estimatedPromptTokens = Math.ceil(prompt.length / 4) + 2000;
    const estimatedCompletionTokens = 1000;
    
    return this.usageTracker.estimateCost('claude', {
      prompt: estimatedPromptTokens,
      completion: estimatedCompletionTokens,
    });
  }
  
  /**
   * Generate a component from natural language prompt
   */
  async generate(
    prompt: string,
    context: GenerationContext
  ): Promise<GenerationResult> {
    // 1. Check API key
    const hasKey = await this.keyManager.hasKey('claude');
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
        error: 'Failed to retrieve API key.',
      };
    }
    
    try {
      // 4. Build request
      const fullPrompt = this.buildPrompt(prompt, context);
      const request: ClaudeRequest = {
        model: this.MODEL,
        max_tokens: this.MAX_TOKENS,
        messages: [{ role: 'user', content: fullPrompt }],
        temperature: 0.3, // Lower for more consistent output
      };
      
      // 5. Log the attempt (without sensitive data)
      await this.logger.log({
        type: SecurityEventType.API_CALL,
        message: 'AI component generation requested',
        data: { promptLength: prompt.length },
      });
      
      // 6. Make API call
      const response = await this.callClaudeAPI(apiKey, request);
      
      // 7. Parse response
      const component = this.parseResponse(response.content[0].text, context);
      
      // 8. Validate against Level 1
      const validation = this.validator.validateComponent(component);
      if (!validation.isValid) {
        // Try to fix common issues
        const fixed = this.fixLevel1Violations(component, validation.errors);
        const revalidation = this.validator.validateComponent(fixed);
        
        if (!revalidation.isValid) {
          return {
            success: false,
            error: `Generated component has Level 1 violations: ${revalidation.errors[0]?.message}`,
          };
        }
        
        component = fixed;
      }
      
      // 9. Track usage
      const cost = this.calculateCost(response.usage);
      await this.usageTracker.trackRequest({
        provider: 'claude',
        timestamp: new Date(),
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        estimatedCost: cost,
        feature: 'component-generation',
      });
      
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
      
      await this.logger.log({
        type: SecurityEventType.API_ERROR,
        message: 'AI generation failed',
        data: { error: message },
      });
      
      return {
        success: false,
        error: `Generation failed: ${message}`,
      };
    }
  }
  
  /**
   * Build the full prompt with template and context
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

CRITICAL LEVEL 1 RESTRICTIONS:
- Properties can ONLY be "static" or "prop" types
- NO expressions (type: "expression" is FORBIDDEN)
- NO state management (no localState, no globalState)
- NO event handlers (no onClick, onChange, etc.)
- NO computed properties
- Only use: static values, props with defaults, Tailwind classes

REQUIRED RESPONSE FORMAT:
Return ONLY valid JSON matching this exact structure (no markdown, no explanation):

{
  "displayName": "ComponentName",
  "type": "div|button|input|text|img|section|article|header|footer|nav|ul|li|a|custom",
  "category": "basic|layout|form|custom",
  "properties": {
    "propertyName": {
      "type": "static",
      "dataType": "string|number|boolean",
      "value": "the static value"
    }
  },
  "styling": {
    "baseClasses": ["tailwind", "classes", "here"]
  },
  "children": []
}

For props (inputs from parent):
{
  "propertyName": {
    "type": "prop",
    "dataType": "string|number|boolean",
    "required": true|false,
    "default": "default value"
  }
}

Generate the component schema now:`;
  }
  
  /**
   * Call Claude API
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
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error?.message || `API error: ${response.status}`);
    }
    
    return response.json();
  }
  
  /**
   * Parse Claude's response into a Component
   */
  private parseResponse(content: string, context: GenerationContext): Component {
    // Remove any markdown code blocks
    let json = content.trim();
    json = json.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(json);
    
    // Generate proper ID
    const baseName = parsed.displayName
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
   * Attempt to fix common Level 1 violations
   */
  private fixLevel1Violations(
    component: Component,
    errors: Array<{ code: string; path?: string }>
  ): Component {
    const fixed = { ...component };
    
    for (const error of errors) {
      if (error.code === 'BLOCKED_PROPERTY_TYPE' && error.path) {
        // Remove expression/computed properties
        const propName = error.path.split('.').pop();
        if (propName && fixed.properties[propName]) {
          // Convert to static if possible
          const prop = fixed.properties[propName];
          if (prop.value !== undefined) {
            fixed.properties[propName] = {
              type: 'static',
              dataType: typeof prop.value as 'string' | 'number' | 'boolean',
              value: prop.value,
            };
          } else {
            delete fixed.properties[propName];
          }
        }
      }
      
      // Remove event handlers
      if (error.code === 'EVENT_HANDLERS_NOT_ALLOWED') {
        delete (fixed as any).eventHandlers;
      }
      
      // Remove state
      if (error.code === 'STATE_NOT_ALLOWED') {
        delete (fixed as any).localState;
        delete (fixed as any).globalState;
      }
    }
    
    return fixed;
  }
  
  /**
   * Calculate cost from token usage
   */
  private calculateCost(usage: { input_tokens: number; output_tokens: number }): number {
    // Claude Sonnet pricing (as of 2024)
    const INPUT_COST_PER_1M = 3.0;  // $3 per 1M input tokens
    const OUTPUT_COST_PER_1M = 15.0; // $15 per 1M output tokens
    
    return (
      (usage.input_tokens / 1_000_000) * INPUT_COST_PER_1M +
      (usage.output_tokens / 1_000_000) * OUTPUT_COST_PER_1M
    );
  }
}
```

**`src/core/ai/index.ts`** (~10 lines)
```typescript
export { AIComponentGenerator } from './AIComponentGenerator';
export type { GenerationContext, GenerationResult } from './AIComponentGenerator';
```

#### Validation Criteria (2.4A)
- [ ] AIComponentGenerator class created
- [ ] Uses APIKeyManager for key retrieval
- [ ] Uses APIUsageTracker for cost estimation/tracking
- [ ] Prompt template enforces Level 1 restrictions
- [ ] Response parsing handles JSON extraction
- [ ] Level 1 validation on generated output
- [ ] Auto-fix for common violations
- [ ] Proper error handling and logging
- [ ] TypeScript strict mode passes

---

### Task 2.4B: Prompt UI & Dialog
**Duration:** 1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create the user interface for entering prompts and confirming generation.

#### Files to Create

**`src/renderer/components/AIGeneration/AIPromptDialog.tsx`** (~300 lines)
```typescript
/**
 * @file AIPromptDialog.tsx
 * @description Modal dialog for AI component generation
 * 
 * FEATURES:
 * - Prompt textarea with placeholder examples
 * - Cost estimate display
 * - Privacy notice (what gets sent to AI)
 * - Loading state with cancel option
 * - Error display
 * - Success feedback
 */

import React, { useState, useCallback, useEffect } from 'react';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Modal } from '../Modal';
import { useManifestStore } from '../../store/manifestStore';
import { useAIStore } from '../../store/aiStore';

interface AIPromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  parentComponentId?: string; // If generating as child
}

const EXAMPLE_PROMPTS = [
  'Create a UserCard with avatar image, name, and email',
  'Create a navigation bar with logo and menu items',
  'Create a pricing card with title, price, and feature list',
  'Create a contact form with name, email, and message fields',
];

export function AIPromptDialog({ 
  isOpen, 
  onClose, 
  parentComponentId 
}: AIPromptDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [costEstimate, setCostEstimate] = useState<{
    cost: number;
    remaining: number;
    canAfford: boolean;
  } | null>(null);
  
  const { manifest, addComponent } = useManifestStore();
  const { generator, hasApiKey, checkApiKey } = useAIStore();
  
  // Check API key availability on mount
  useEffect(() => {
    if (isOpen) {
      checkApiKey();
    }
  }, [isOpen, checkApiKey]);
  
  // Update cost estimate when prompt changes
  useEffect(() => {
    if (!prompt.trim() || !generator) {
      setCostEstimate(null);
      return;
    }
    
    const timer = setTimeout(async () => {
      try {
        const estimate = await generator.estimateCost(prompt);
        setCostEstimate({
          cost: estimate.estimatedCost,
          remaining: estimate.remainingBudget,
          canAfford: estimate.canAfford,
        });
      } catch {
        setCostEstimate(null);
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [prompt, generator]);
  
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !generator || !manifest) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const context = {
        framework: 'react' as const,
        schemaLevel: 1 as const,
        parentComponentId,
        parentComponentType: parentComponentId 
          ? manifest.components[parentComponentId]?.type 
          : undefined,
        existingComponentNames: Object.values(manifest.components)
          .map(c => c.displayName),
      };
      
      const result = await generator.generate(prompt, context);
      
      if (!result.success) {
        setError(result.error || 'Generation failed');
        return;
      }
      
      // Add to manifest
      addComponent({
        ...result.component!,
        parentId: parentComponentId,
      });
      
      // Close dialog on success
      onClose();
      setPrompt('');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, generator, manifest, parentComponentId, addComponent, onClose]);
  
  const handleClose = useCallback(() => {
    if (!isGenerating) {
      setPrompt('');
      setError(null);
      onClose();
    }
  }, [isGenerating, onClose]);
  
  const handleExampleClick = useCallback((example: string) => {
    setPrompt(example);
  }, []);
  
  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6 w-[500px] max-w-full">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <SparklesIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Generate with AI</h2>
            <p className="text-sm text-gray-500">
              Describe the component you want to create
            </p>
          </div>
        </div>
        
        {/* No API Key Warning */}
        {!hasApiKey && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  API Key Required
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Please add your Claude API key in Settings to use AI generation.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Prompt Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your component
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a user profile card with avatar, name, and bio..."
            className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg 
                       focus:outline-none focus:ring-2 focus:ring-purple-500
                       resize-none"
            disabled={isGenerating || !hasApiKey}
          />
        </div>
        
        {/* Example Prompts */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Try an example:</p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                disabled={isGenerating || !hasApiKey}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded
                           hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                           truncate max-w-[200px]"
                title={example}
              >
                {example.slice(0, 30)}...
              </button>
            ))}
          </div>
        </div>
        
        {/* Parent Context */}
        {parentComponentId && manifest && (
          <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
            <span className="text-blue-700">
              Adding as child of: {manifest.components[parentComponentId]?.displayName}
            </span>
          </div>
        )}
        
        {/* Cost Estimate */}
        {costEstimate && (
          <div className={`mb-4 p-3 rounded-lg ${
            costEstimate.canAfford 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex justify-between text-sm">
              <span className={costEstimate.canAfford ? 'text-green-700' : 'text-red-700'}>
                Estimated cost:
              </span>
              <span className={`font-mono ${costEstimate.canAfford ? 'text-green-800' : 'text-red-800'}`}>
                ${costEstimate.cost.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1">
              <span className="text-gray-500">Remaining budget:</span>
              <span className="text-gray-600 font-mono">
                ${costEstimate.remaining.toFixed(2)}
              </span>
            </div>
          </div>
        )}
        
        {/* Privacy Notice */}
        <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-2">
            <InformationCircleIcon className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">What gets sent to Claude AI:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Your prompt description</li>
                <li>Existing component names (not code)</li>
                <li>Framework type (React)</li>
              </ul>
              <p className="mt-1 text-gray-500">
                Your API keys and actual code are never sent.
              </p>
            </div>
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        
        {/* Level 1 Notice */}
        <div className="mb-4 p-2 bg-purple-50 border border-purple-200 rounded text-xs text-purple-700">
          <strong>Level 1 MVP:</strong> Generated components use static values only. 
          Event handlers and state coming in Level 2.
        </div>
        
        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isGenerating}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded
                       disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating || !hasApiKey || 
                     (costEstimate && !costEstimate.canAfford)}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                Generate
                {costEstimate && (
                  <span className="text-purple-200 text-xs">
                    (${costEstimate.cost.toFixed(3)})
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

**`src/renderer/store/aiStore.ts`** (~120 lines)
```typescript
/**
 * @file aiStore.ts
 * @description Zustand store for AI generation state
 */

import { create } from 'zustand';
import { AIComponentGenerator } from '../../core/ai/AIComponentGenerator';

interface AIState {
  generator: AIComponentGenerator | null;
  hasApiKey: boolean;
  isChecking: boolean;
  
  // Actions
  initializeGenerator: (projectPath: string) => void;
  checkApiKey: () => Promise<void>;
  clearGenerator: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  generator: null,
  hasApiKey: false,
  isChecking: false,
  
  initializeGenerator: (projectPath: string) => {
    const generator = new AIComponentGenerator(projectPath);
    set({ generator });
    get().checkApiKey();
  },
  
  checkApiKey: async () => {
    const { generator } = get();
    if (!generator) {
      set({ hasApiKey: false });
      return;
    }
    
    set({ isChecking: true });
    try {
      const hasKey = await generator.isAvailable();
      set({ hasApiKey: hasKey });
    } catch {
      set({ hasApiKey: false });
    } finally {
      set({ isChecking: false });
    }
  },
  
  clearGenerator: () => {
    set({ generator: null, hasApiKey: false });
  },
}));
```

**`src/renderer/components/AIGeneration/AIGenerateButton.tsx`** (~60 lines)
```typescript
/**
 * @file AIGenerateButton.tsx
 * @description Toolbar button that opens AI generation dialog
 */

import React, { useState } from 'react';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { AIPromptDialog } from './AIPromptDialog';
import { useAIStore } from '../../store/aiStore';

export function AIGenerateButton() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { hasApiKey } = useAIStore();
  
  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg
          transition-colors
          ${hasApiKey 
            ? 'bg-purple-500 text-white hover:bg-purple-600' 
            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}
        `}
        title={hasApiKey ? 'Generate component with AI' : 'Add API key to enable'}
      >
        <SparklesIcon className="w-4 h-4" />
        <span className="text-sm font-medium">AI Generate</span>
      </button>
      
      <AIPromptDialog 
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
```

**`src/renderer/components/AIGeneration/index.ts`**
```typescript
export { AIPromptDialog } from './AIPromptDialog';
export { AIGenerateButton } from './AIGenerateButton';
```

#### Validation Criteria (2.4B)
- [ ] AIPromptDialog opens from button/menu
- [ ] Prompt textarea works
- [ ] Example prompts populate input
- [ ] Cost estimate updates as user types
- [ ] Privacy notice displays
- [ ] Loading state shows during generation
- [ ] Error messages display clearly
- [ ] Success closes dialog and adds component
- [ ] No API key shows warning
- [ ] Can't generate without API key

---

### Task 2.4C: Response Parsing & Validation
**Duration:** 0.5-1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Ensure robust parsing of Claude responses and Level 1 validation.

This is largely covered in Task 2.4A's AIComponentGenerator, but may need additional:
- More robust JSON extraction (handle various markdown formats)
- Better error messages for parse failures
- Component ID collision detection
- Integration tests with mock responses

#### Additional Files

**`src/core/ai/responseParser.ts`** (~150 lines)
```typescript
/**
 * @file responseParser.ts
 * @description Robust parsing of Claude API responses
 * 
 * Handles:
 * - JSON in markdown code blocks
 * - Raw JSON
 * - Partial/malformed responses
 * - Missing required fields
 */

export function extractJSON(content: string): object {
  // Try various extraction patterns...
}

export function validateComponentStructure(parsed: unknown): ComponentParseResult {
  // Ensure required fields exist...
}
```

#### Validation Criteria (2.4C)
- [ ] Handles ```json blocks
- [ ] Handles raw JSON
- [ ] Handles partial responses gracefully
- [ ] Clear error for unparseable response
- [ ] Default values for missing optional fields
- [ ] Component ID uniqueness checked

---

### Task 2.4D: Settings & API Key UI
**Duration:** 0.5-1 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create settings UI for managing Claude API key and viewing usage.

#### Files to Create

**`src/renderer/components/Settings/APIKeySettings.tsx`** (~250 lines)
```typescript
/**
 * @file APIKeySettings.tsx
 * @description Settings panel for API key management
 * 
 * FEATURES:
 * - Add/update Claude API key
 * - Show key status (stored, rotation warning)
 * - Delete key
 * - View usage statistics
 * - Configure daily budget
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  KeyIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';

interface APIKeySettingsProps {
  projectPath: string;
}

export function APIKeySettings({ projectPath }: APIKeySettingsProps) {
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usage, setUsage] = useState<{
    today: number;
    budget: number;
    remaining: number;
  } | null>(null);
  
  // Load current state
  useEffect(() => {
    // Check if key exists, load usage stats
  }, [projectPath]);
  
  const handleSaveKey = useCallback(async () => {
    // Validate and save key via IPC
  }, [keyInput, projectPath]);
  
  const handleDeleteKey = useCallback(async () => {
    // Delete key with confirmation
  }, [projectPath]);
  
  return (
    <div className="p-6 max-w-lg">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <KeyIcon className="w-5 h-5" />
        Claude API Key
      </h2>
      
      {/* Key Status */}
      <div className={`mb-4 p-3 rounded-lg ${
        hasKey ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
      }`}>
        {hasKey ? (
          <div className="flex items-center gap-2 text-green-700">
            <CheckCircleIcon className="w-5 h-5" />
            <span>API key configured</span>
          </div>
        ) : (
          <div className="text-gray-600">
            No API key configured. Add your Claude API key to enable AI generation.
          </div>
        )}
      </div>
      
      {/* Key Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {hasKey ? 'Update API Key' : 'Add API Key'}
        </label>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder="sk-ant-api03-..."
          className="w-full px-3 py-2 border border-gray-300 rounded
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Get your API key from{' '}
          <a 
            href="https://console.anthropic.com/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>
      
      {/* Save/Delete buttons */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={handleSaveKey}
          disabled={!keyInput.trim() || isSaving}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600
                     disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Key'}
        </button>
        {hasKey && (
          <button
            onClick={handleDeleteKey}
            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded
                       flex items-center gap-1"
          >
            <TrashIcon className="w-4 h-4" />
            Delete Key
          </button>
        )}
      </div>
      
      {/* Usage Stats */}
      {usage && (
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Usage Today</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Spent:</span>
              <span className="font-mono">${usage.today.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Daily Budget:</span>
              <span className="font-mono">${usage.budget.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>Remaining:</span>
              <span className="font-mono">${usage.remaining.toFixed(2)}</span>
            </div>
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  usage.today / usage.budget > 0.8 ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${(usage.today / usage.budget) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Messages */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          {success}
        </div>
      )}
    </div>
  );
}
```

#### IPC Handlers Needed

Add to `electron/ipc-handlers.ts`:
```typescript
// API Key management (calls to main process where keytar runs)
ipcMain.handle('api-key:store', async (_, provider, key) => { ... });
ipcMain.handle('api-key:get', async (_, provider) => { ... });
ipcMain.handle('api-key:delete', async (_, provider) => { ... });
ipcMain.handle('api-key:has', async (_, provider) => { ... });

// Usage tracking
ipcMain.handle('api-usage:get-today', async (_, provider) => { ... });
ipcMain.handle('api-usage:get-remaining', async (_, provider) => { ... });
```

#### Validation Criteria (2.4D)
- [ ] Can add new API key
- [ ] Key stored securely via keytar
- [ ] Can update existing key
- [ ] Can delete key
- [ ] Shows usage statistics
- [ ] Shows remaining budget
- [ ] Progress bar for budget usage
- [ ] Link to Anthropic console

---

### Task 2.4E: Integration & Polish
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Integrate all AI components into the app and polish the UX.

#### Integration Points

1. **Toolbar**: Add AIGenerateButton
2. **Component Tree Context Menu**: Add "Generate with AI..." option
3. **AddComponentDialog**: Add "Or generate with AI" link
4. **Project Open**: Initialize aiStore with project path
5. **Settings Menu**: Add API Key settings page
6. **Keyboard Shortcut**: Cmd/Ctrl+K for AI dialog

#### Validation Criteria (2.4E)
- [ ] AI button in toolbar
- [ ] Context menu option works
- [ ] Keyboard shortcut works
- [ ] Settings accessible
- [ ] aiStore initialized on project open
- [ ] aiStore cleared on project close
- [ ] End-to-end generation works

---

## 📁 Deliverables Summary

### New Files (8+)

1. `src/core/ai/AIComponentGenerator.ts` (~350 lines)
2. `src/core/ai/responseParser.ts` (~150 lines)
3. `src/core/ai/index.ts` (~10 lines)
4. `src/renderer/components/AIGeneration/AIPromptDialog.tsx` (~300 lines)
5. `src/renderer/components/AIGeneration/AIGenerateButton.tsx` (~60 lines)
6. `src/renderer/components/AIGeneration/index.ts` (~5 lines)
7. `src/renderer/components/Settings/APIKeySettings.tsx` (~250 lines)
8. `src/renderer/store/aiStore.ts` (~120 lines)

### Modified Files (4+)

1. `electron/ipc-handlers.ts` - Add API key handlers
2. `electron/preload.ts` - Expose API key methods
3. `src/renderer/components/Toolbar.tsx` - Add AI button
4. `src/renderer/components/NavigatorPanel.tsx` - Add context menu option

### Estimated Total
- **New Code:** ~1,250 lines
- **Modified Code:** ~100 lines
- **Grand Total:** ~1,350 lines

---

## ⚡ Performance Requirements

| Metric | Target | Notes |
|--------|--------|-------|
| Cost estimate | < 100ms | From prompt input to estimate display |
| API call | 5-15s typical | Depends on Claude response time |
| Response parse | < 50ms | JSON extraction and validation |
| Component add | < 50ms | Via manifestStore |

---

## 🔒 Security Requirements

### API Key Security
- ✅ Stored in OS keychain via keytar (Phase 0)
- ✅ Never exposed in logs or UI
- ✅ Key validation before storage
- ✅ 90-day rotation warnings

### Data Privacy
- Only send: prompt, component names, framework
- Never send: actual code, file paths, API keys, user data
- Show privacy notice in dialog

### Budget Protection
- ✅ Cost estimation before calls (Phase 0)
- ✅ Daily budget limits (Phase 0)
- ✅ Warning at 80% budget
- ✅ Block when budget exceeded

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| API key exposed in logs | HIGH | LOW | SecurityLogger redaction, code review |
| Claude returns invalid JSON | MEDIUM | MEDIUM | Robust parsing, fallback error handling |
| Unexpected API costs | MEDIUM | LOW | Budget limits, cost confirmation |
| Level 2 features in output | MEDIUM | MEDIUM | Validation + auto-fix, reject if unfixable |
| API rate limits | LOW | LOW | Respect limits, show user message |

---

## 👨‍💻 Human Checkpoints

### Checkpoint 1: After Task 2.4A (Generator Service)
**Review Focus:**
- [ ] Security: API key handling correct?
- [ ] Prompt template enforces Level 1?
- [ ] Cost tracking integrated?

### Checkpoint 2: After Task 2.4E (Complete)
**Review Focus:**
- [ ] End-to-end flow works
- [ ] Generated components valid
- [ ] No API key leaks
- [ ] Cost tracking accurate
- [ ] Ready for Phase 3

---

## ✅ Definition of Done

Task 2.4 is complete when:

1. [ ] All subtasks (2.4A-E) completed
2. [ ] Can enter natural language prompt
3. [ ] Cost estimate shown before generation
4. [ ] Claude API called successfully
5. [ ] Response parsed into valid component
6. [ ] Level 1 validation enforced
7. [ ] Generated component appears in tree
8. [ ] Usage tracked correctly
9. [ ] API key settings working
10. [ ] NO Level 2+ features generated
11. [ ] Error handling robust
12. [ ] TypeScript strict mode passing
13. [ ] Human review approved
14. [ ] **GATE:** Phase 2 complete, ready for Phase 3

---

## 📝 Cline Prompt for Task 2.4A

```
Implement AI Component Generator service for Rise.

## Context
- Rise is a visual React application builder
- Phase 0 built security infrastructure (APIKeyManager, APIUsageTracker, etc.)
- Task 2.4 adds AI-powered component generation via Claude API
- This is Task 2.4A - creating the core generator service

## Requirements

### Create src/core/ai/AIComponentGenerator.ts

Service class that:

1. **Checks availability**: Uses APIKeyManager.hasKey('claude')

2. **Estimates cost**: Uses APIUsageTracker.estimateCost()
   - Rough estimate: prompt tokens + 2000 template, 1000 completion

3. **Generates components**:
   - Get API key via APIKeyManager.getKey()
   - Build prompt with Level 1 restrictions template
   - Call Claude API (https://api.anthropic.com/v1/messages)
   - Parse JSON response
   - Validate against Level1SchemaValidator
   - Auto-fix common Level 1 violations if possible
   - Track usage via APIUsageTracker.trackRequest()

4. **Prompt template must enforce**:
   - ONLY "static" or "prop" property types
   - NO expressions, state, events
   - Return format: JSON with displayName, type, category, properties, styling, children

### Use existing infrastructure
- @src/core/security/APIKeyManager.ts
- @src/core/security/APIUsageTracker.ts  
- @src/core/security/SecurityLogger.ts
- @src/core/validation/SchemaValidator.ts

### Create src/core/ai/index.ts
Export AIComponentGenerator and types.

## Claude API Details
- URL: https://api.anthropic.com/v1/messages
- Model: claude-sonnet-4-20250514
- Headers: x-api-key, anthropic-version: 2023-06-01
- Response: { content: [{ text }], usage: { input_tokens, output_tokens } }

## Security Requirements
- Never log API keys
- Use SecurityLogger for audit events
- Validate key format before use

## Success Criteria
- [ ] AIComponentGenerator class created
- [ ] Integration with Phase 0 security classes
- [ ] Prompt template enforces Level 1
- [ ] JSON response parsing robust
- [ ] Level 1 validation on output
- [ ] Cost tracking works
- [ ] TypeScript strict mode passes

State your approach and confidence level (1-10) before implementing.
```

---

**Task Status:** 🔵 Not Started  
**Critical Path:** YES - Final task of Phase 2  
**Risk Level:** MEDIUM - External API dependency  
**Next Task:** Phase 3 - Code Generation & Preview

---

**Last Updated:** 2025-11-26  
**Document Version:** 1.0  
**Prepared By:** Claude (Planning Assistant)  
**Requires Sign-off:** Project Lead (Richard)
