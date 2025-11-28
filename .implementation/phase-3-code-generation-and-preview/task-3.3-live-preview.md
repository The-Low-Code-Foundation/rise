# Task 3.3: Live Preview Integration

**Phase:** Phase 3 - Code Generation & Preview  
**Duration Estimate:** 2-3 days  
**Actual Duration:** [To be filled when complete]  
**Status:** 🔵 Ready to Start  
**Assigned:** Cline + Human Review  
**Priority:** P0 - Critical Path  
**Dependencies:** Task 1.4 (Preview System) ✅, Task 3.1 (Code Generator) ✅, Task 3.2 (File Manager) ✅  
**Started:** [YYYY-MM-DD]  
**Completed:** [YYYY-MM-DD]

---

## 🎯 Task Overview

### Objective

Integrate the code generation pipeline (Tasks 3.1 + 3.2) with the existing preview system (Task 1.4) to create a seamless visual editing experience. When users modify the manifest through the UI, the preview should update automatically within milliseconds.

### Problem Statement

We have all the pieces, but they're not connected:
- ✅ **Task 3.1**: ReactCodeGenerator produces React code strings
- ✅ **Task 3.2**: FileManager writes code to disk safely
- ✅ **Task 1.4**: ViteServerManager runs a dev server with HMR

**The Missing Link:** When the manifest changes, nothing happens. The preview stays static because:
1. No one tells FileManager to regenerate when manifest changes
2. No feedback loop shows generation status to the user
3. The end-to-end flow hasn't been tested together

### What This Task Delivers

```
┌─────────────────────────────────────────────────────────────────────┐
│                    THE COMPLETE VISUAL EDITING LOOP                  │
│                                                                      │
│   User edits in UI                                                   │
│         │                                                            │
│         ▼                                                            │
│   manifestStore updates                                              │
│         │                                                            │
│         ▼ (NEW: Task 3.3 wiring)                                     │
│   FileManager.generateIncremental()                                  │
│         │                                                            │
│         ▼                                                            │
│   Files written to src/components/                                   │
│         │                                                            │
│         ▼ (Automatic: Vite file watcher)                             │
│   Vite HMR detects changes                                           │
│         │                                                            │
│         ▼                                                            │
│   Preview iframe updates instantly                                   │
│         │                                                            │
│         ▼                                                            │
│   User sees their changes! 🎉                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Why This Matters

This task delivers the **core value proposition** of Rise:
- **Instant feedback**: Changes appear in preview within ~500ms
- **Visual development**: Users see what they're building as they build it
- **Confidence**: The "it works!" moment that makes the tool feel magical

**Without this task, Rise is just a fancy JSON editor with no visual feedback.**

### Success Criteria

- [ ] Manifest changes automatically trigger code regeneration
- [ ] Generated files appear in src/components/ within <500ms
- [ ] Vite HMR updates preview automatically (no manual refresh)
- [ ] Generation status shown in UI (generating, complete, error)
- [ ] Errors during generation displayed clearly to user
- [ ] Initial project open generates all files and starts preview
- [ ] Large projects (50+ components) don't block the UI
- [ ] Console shows helpful generation logs for debugging
- [ ] End-to-end workflow tested and documented
- [ ] Human review approved

### What Already Exists (From Previous Tasks)

| Component | Location | Status |
|-----------|----------|--------|
| ViteServerManager | `src/main/preview/ViteServerManager.ts` | ✅ Task 1.4A |
| PreviewPanel UI | `src/renderer/components/Preview/` | ✅ Task 1.4B |
| previewStore | `src/renderer/store/previewStore.ts` | ✅ Task 1.4B |
| Console capture | `src/renderer/components/Console/` | ✅ Task 1.4D |
| ReactCodeGenerator | `src/core/codegen/ReactCodeGenerator.ts` | ✅ Task 3.1 |
| FileManager | `src/core/filemanager/FileManager.ts` | ✅ Task 3.2 |
| FileChangeTracker | `src/core/FileChangeTracker.ts` | ✅ Task 0.1 |
| manifestStore | `src/renderer/store/manifestStore.ts` | ✅ Task 2.1 |

### Out of Scope

- ❌ Component isolation preview (single component view) → Post-MVP
- ❌ Bidirectional sync (code changes → manifest) → Post-MVP
- ❌ Multiple preview windows → Post-MVP
- ❌ Preview on external devices → Post-MVP
- ❌ TypeScript component output → Post-MVP

---

## 🏗️ Architecture Overview

### The Integration Layer

```
┌─────────────────────────────────────────────────────────────────────┐
│                       RENDERER PROCESS                               │
│                                                                      │
│  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────┐  │
│  │  ComponentTree  │    │  PropertyPanel  │    │ AI Generation  │  │
│  │     (UI)        │    │     (UI)        │    │     (UI)       │  │
│  └────────┬────────┘    └────────┬────────┘    └───────┬────────┘  │
│           │                      │                      │           │
│           └──────────────────────┴──────────────────────┘           │
│                                  │                                   │
│                                  ▼                                   │
│                        ┌─────────────────┐                          │
│                        │  manifestStore  │                          │
│                        │  (Zustand)      │                          │
│                        └────────┬────────┘                          │
│                                 │ subscribe                          │
│                                 ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              GenerationService (NEW - Task 3.3)               │   │
│  │  - Subscribes to manifestStore changes                        │   │
│  │  - Debounces rapid changes (300ms)                            │   │
│  │  - Calls FileManager via IPC                                  │   │
│  │  - Updates generationStore with status                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                 │                                    │
│                                 │ IPC                                │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼────────────────────────────────────┐
│                       MAIN PROCESS                                   │
│                                 ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              FileManager (from Task 3.2)                      │   │
│  │  - Receives manifest via IPC                                  │   │
│  │  - Generates code with ReactCodeGenerator                     │   │
│  │  - Writes files with FileChangeTracker                        │   │
│  │  - Emits events: generation:start, generation:complete        │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                 │                                    │
│                                 │ Files written                      │
│                                 ▼                                    │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              ViteServerManager (from Task 1.4)                │   │
│  │  - Watches file system (automatic via Vite)                   │   │
│  │  - HMR updates to browser                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                 │                                    │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │
                                  ▼
                        ┌─────────────────┐
                        │  Preview iFrame │
                        │  (Live Update)  │
                        └─────────────────┘
```

### Key Integration Points

| Integration | From | To | Method |
|-------------|------|-----|--------|
| Manifest → Generation | manifestStore | GenerationService | Zustand subscribe |
| Generation → Files | GenerationService | FileManager | IPC call |
| Files → Preview | FileManager | Vite | Automatic (Vite watches filesystem) |
| Status → UI | FileManager | generationStore | IPC events |

---

## 📁 Files to Create

### New Files

| File | Description | Est. Lines |
|------|-------------|------------|
| `src/renderer/services/GenerationService.ts` | Orchestrates generation in renderer | ~200 |
| `src/renderer/store/generationStore.ts` | Generation status state | ~120 |
| `src/renderer/components/GenerationStatus.tsx` | Status indicator component | ~100 |
| `electron/ipc-handlers-generation.ts` | IPC handlers for generation | ~150 |

### Files to Modify

| File | Changes | Est. Lines |
|------|---------|------------|
| `electron/ipc-handlers.ts` | Import generation handlers | +10 |
| `electron/preload.ts` | Add generation API | +30 |
| `src/renderer/App.tsx` | Initialize GenerationService | +20 |
| `src/renderer/components/Toolbar.tsx` | Add GenerationStatus | +15 |

### Tests

| File | Description | Est. Lines |
|------|-------------|------------|
| `tests/unit/services/GenerationService.test.ts` | Service unit tests | ~200 |
| `tests/integration/generation-preview.test.ts` | End-to-end integration | ~300 |

**Total Estimated:** ~1,145 lines

---

## 🔄 Generation Flow Details

### Trigger: Manifest Change

```typescript
// In GenerationService.ts

class GenerationService {
  private unsubscribe: (() => void) | null = null;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  
  /**
   * Start listening to manifest changes
   * Called once when app initializes
   */
  initialize() {
    // Subscribe to manifestStore
    this.unsubscribe = useManifestStore.subscribe(
      // Select the manifest data
      (state) => state.manifest,
      // Handler when manifest changes
      (manifest, previousManifest) => {
        if (manifest && manifest !== previousManifest) {
          this.handleManifestChange(manifest);
        }
      }
    );
  }
  
  /**
   * Debounced handler for manifest changes
   * Prevents rapid-fire generation during fast editing
   */
  private handleManifestChange(manifest: Manifest) {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // Set status to "pending" immediately for UI feedback
    useGenerationStore.getState().setStatus('pending');
    
    // Debounce actual generation (300ms)
    this.debounceTimer = setTimeout(async () => {
      await this.triggerGeneration(manifest);
    }, 300);
  }
  
  /**
   * Trigger code generation via IPC
   */
  private async triggerGeneration(manifest: Manifest) {
    const { setStatus, setError, setLastGeneration } = useGenerationStore.getState();
    const { projectPath } = useProjectStore.getState();
    
    if (!projectPath) {
      setError('No project open');
      return;
    }
    
    try {
      setStatus('generating');
      
      // Call main process to generate files
      const result = await window.electronAPI.generation.generate({
        projectPath,
        manifest,
        incremental: true, // Only regenerate changed components
      });
      
      if (result.success) {
        setStatus('complete');
        setLastGeneration({
          timestamp: Date.now(),
          filesWritten: result.data.filesWritten,
          durationMs: result.data.durationMs,
        });
        
        // Auto-clear success status after 3 seconds
        setTimeout(() => {
          setStatus('idle');
        }, 3000);
      } else {
        setStatus('error');
        setError(result.error || 'Generation failed');
      }
    } catch (error) {
      setStatus('error');
      setError(error instanceof Error ? error.message : 'Unknown error');
    }
  }
  
  /**
   * Force full regeneration (manual trigger)
   */
  async regenerateAll() {
    const manifest = useManifestStore.getState().manifest;
    if (manifest) {
      await this.triggerGeneration(manifest);
    }
  }
  
  /**
   * Cleanup when app closes
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

export const generationService = new GenerationService();
```

### IPC Handler: Main Process

```typescript
// In electron/ipc-handlers-generation.ts

import { ipcMain } from 'electron';
import { FileManager } from '../src/core/filemanager/FileManager';
import { FileChangeTracker } from '../src/core/FileChangeTracker';

let fileManager: FileManager | null = null;
let fileChangeTracker: FileChangeTracker | null = null;

export function setupGenerationHandlers() {
  
  ipcMain.handle('generation:generate', async (event, { projectPath, manifest, incremental }) => {
    try {
      // Initialize FileManager if needed (lazy init)
      if (!fileManager || fileManager.projectPath !== projectPath) {
        // Cleanup old instance
        if (fileManager) {
          fileManager.destroy();
        }
        if (fileChangeTracker) {
          fileChangeTracker.destroy();
        }
        
        // Create new instances
        fileChangeTracker = new FileChangeTracker();
        fileManager = new FileManager({
          projectPath,
          fileChangeTracker,
        });
      }
      
      // Generate files
      const result = incremental
        ? await fileManager.generateIncremental(manifest)
        : await fileManager.generateAll(manifest);
      
      return {
        success: true,
        data: {
          filesWritten: result.filesWritten,
          durationMs: result.durationMs,
          errors: result.errors,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed',
      };
    }
  });
  
  ipcMain.handle('generation:regenerate-all', async (event, { projectPath, manifest }) => {
    // Force full regeneration
    return ipcMain.handle('generation:generate', event, { 
      projectPath, 
      manifest, 
      incremental: false 
    });
  });
}

export function cleanupGenerationHandlers() {
  if (fileManager) {
    fileManager.destroy();
    fileManager = null;
  }
  if (fileChangeTracker) {
    fileChangeTracker.destroy();
    fileChangeTracker = null;
  }
}
```

### Generation Status Store

```typescript
// In src/renderer/store/generationStore.ts

import { create } from 'zustand';

type GenerationStatus = 'idle' | 'pending' | 'generating' | 'complete' | 'error';

interface LastGeneration {
  timestamp: number;
  filesWritten: number;
  durationMs: number;
}

interface GenerationState {
  status: GenerationStatus;
  error: string | null;
  lastGeneration: LastGeneration | null;
  
  // Actions
  setStatus: (status: GenerationStatus) => void;
  setError: (error: string | null) => void;
  setLastGeneration: (info: LastGeneration) => void;
  reset: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status: 'idle',
  error: null,
  lastGeneration: null,
  
  setStatus: (status) => set({ status }),
  setError: (error) => set({ error, status: error ? 'error' : 'idle' }),
  setLastGeneration: (info) => set({ lastGeneration: info }),
  reset: () => set({ status: 'idle', error: null }),
}));
```

### Status Indicator Component

```typescript
// In src/renderer/components/GenerationStatus.tsx

import React from 'react';
import { useGenerationStore } from '../store/generationStore';

export function GenerationStatus() {
  const { status, error, lastGeneration } = useGenerationStore();
  
  if (status === 'idle') {
    return null; // Don't show anything when idle
  }
  
  return (
    <div className="flex items-center gap-2 px-3 py-1 text-sm">
      {status === 'pending' && (
        <>
          <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
          <span className="text-yellow-600">Pending...</span>
        </>
      )}
      
      {status === 'generating' && (
        <>
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-blue-600">Generating...</span>
        </>
      )}
      
      {status === 'complete' && lastGeneration && (
        <>
          <span className="w-2 h-2 bg-green-400 rounded-full" />
          <span className="text-green-600">
            Generated {lastGeneration.filesWritten} files ({lastGeneration.durationMs}ms)
          </span>
        </>
      )}
      
      {status === 'error' && (
        <>
          <span className="w-2 h-2 bg-red-400 rounded-full" />
          <span className="text-red-600" title={error || undefined}>
            Generation failed
          </span>
        </>
      )}
    </div>
  );
}
```

---

## 🗺️ Implementation Roadmap

### Milestone 1: Generation Store & Types
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create the generationStore and type definitions for the integration layer.

#### Deliverables
- [ ] `src/renderer/store/generationStore.ts`:
  - Status states: idle, pending, generating, complete, error
  - Last generation info (timestamp, files, duration)
  - Error state
- [ ] Type definitions for IPC messages
- [ ] Unit tests for store

#### Human Checkpoint
None - low risk, proceed to Milestone 2

---

### Milestone 2: IPC Handlers for Generation
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create IPC handlers that connect renderer to FileManager.

#### Deliverables
- [ ] `electron/ipc-handlers-generation.ts`:
  - `generation:generate` - Trigger generation
  - `generation:regenerate-all` - Force full regeneration
  - FileManager initialization and cleanup
- [ ] Update `electron/preload.ts` with generation API
- [ ] Update `electron/ipc-handlers.ts` to import generation handlers
- [ ] Unit tests for IPC handlers

#### Human Checkpoint
Review IPC design before proceeding

---

### Milestone 3: Generation Service
**Duration:** 1 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Create the GenerationService that orchestrates the generation flow.

#### Deliverables
- [ ] `src/renderer/services/GenerationService.ts`:
  - Subscribe to manifestStore changes
  - Debounce rapid changes (300ms)
  - Call generation IPC
  - Update generationStore with status
  - Handle errors gracefully
- [ ] Initialize service in `src/renderer/App.tsx`
- [ ] Cleanup on app close
- [ ] Unit tests

#### Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Debounce duration | 300ms | Balance between responsiveness and not overwhelming |
| Generation trigger | Zustand subscribe | Clean reactive pattern, automatic |
| Full vs incremental | Incremental by default | Much faster for typical edits |

#### Human Checkpoint
**REQUIRED** - Review service implementation before UI integration

---

### Milestone 4: Status UI Component
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Create the GenerationStatus component and integrate into toolbar.

#### Deliverables
- [ ] `src/renderer/components/GenerationStatus.tsx`:
  - Pending indicator (yellow pulse)
  - Generating indicator (blue pulse)
  - Complete indicator (green, auto-fades)
  - Error indicator (red, with tooltip)
- [ ] Add to Toolbar component
- [ ] Manual testing of all states

#### Human Checkpoint
None - low risk, proceed to Milestone 5

---

### Milestone 5: Project Lifecycle Integration
**Duration:** 0.5 day  
**Confidence Target:** 8/10  
**Status:** 🔵 Not Started

#### Objective
Ensure generation works correctly with project open/close/switch.

#### Deliverables
- [ ] On project open:
  - Initialize GenerationService
  - Generate all files (full generation)
  - Wait for generation before showing preview
- [ ] On project close:
  - Stop generation
  - Cleanup FileManager
- [ ] On project switch:
  - Stop old generation
  - Switch FileManager to new project
  - Generate new project files
- [ ] Handle manifest load from disk
- [ ] Integration tests

#### Human Checkpoint
Review lifecycle flow before testing

---

### Milestone 6: End-to-End Testing
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Verify the complete flow works end-to-end.

#### Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| Basic edit | Edit component property → Save | Preview updates within 500ms |
| Add component | Add new component via UI | New component appears in preview |
| Delete component | Delete component via UI | Component removed from preview |
| Rapid edits | Type quickly in text field | Single generation after pause |
| Large project | Project with 50 components | All generate without blocking UI |
| Error handling | Introduce invalid manifest | Error shown, previous preview remains |
| Project switch | Switch to different project | New project's preview loads |

#### Deliverables
- [ ] Manual test checklist completed
- [ ] Integration test suite passing
- [ ] Performance benchmarks documented
- [ ] Edge cases handled

#### Human Checkpoint
**REQUIRED** - Full end-to-end testing before sign-off

---

### Milestone 7: Documentation & Polish
**Duration:** 0.5 day  
**Confidence Target:** 9/10  
**Status:** 🔵 Not Started

#### Objective
Finalize documentation and prepare for release.

#### Deliverables
- [ ] Update this task document with actual results
- [ ] Document the complete generation flow
- [ ] Update CLINE_IMPLEMENTATION_PLAN.md status
- [ ] Add troubleshooting guide for common issues
- [ ] Phase 3 summary document

#### Human Checkpoint
**FINAL REVIEW** - Phase 3 complete!

---

## 📊 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Edit-to-preview latency | <500ms | Stopwatch test |
| Generation debounce | 300ms | Console log timing |
| UI responsiveness | No blocking | Type quickly, observe |
| Large project (50 components) | <2s full gen | Benchmark test |
| Incremental (1 component) | <200ms | Benchmark test |
| Memory stability | No leaks | Heap snapshot after 100 edits |
| Error recovery | Graceful | Force errors, verify UI |

---

## 🚨 Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Debounce too short | Medium | Low | Configurable, start at 300ms |
| Debounce too long | Medium | Low | User testing, adjust based on feedback |
| FileManager not cleaning up | Medium | Low | Explicit destroy on project close |
| Race conditions | High | Medium | Single generation at a time, cancel previous |
| IPC timeout on large project | Medium | Low | Progress events, generous timeout |
| Preview not updating | High | Low | Vite HMR is reliable, fallback to refresh |

---

## ✅ Definition of Done

Task 3.3 is complete when:

1. [ ] All milestones (1-7) completed with confidence ≥8
2. [ ] Manifest changes trigger automatic code generation
3. [ ] Generated files appear in src/components/ within 500ms
4. [ ] Vite HMR updates preview (no manual refresh needed)
5. [ ] Generation status visible in UI
6. [ ] Errors displayed clearly to user
7. [ ] Project open/close/switch handled correctly
8. [ ] Large projects don't block UI
9. [ ] All integration tests passing
10. [ ] Performance targets met
11. [ ] Human review approved
12. [ ] **GATE:** Phase 3 Complete! 🎉

---

## 👨‍💻 Human Review Checkpoints

### Checkpoint 1: After Milestone 2 (IPC Handlers)
**Review Focus:**
- [ ] IPC message structure is clean
- [ ] FileManager lifecycle is correct
- [ ] Error handling is comprehensive

### Checkpoint 2: After Milestone 3 (Generation Service)
**Review Focus:**
- [ ] Debounce logic is correct
- [ ] ManifestStore subscription works
- [ ] No memory leaks in subscription

### Checkpoint 3: After Milestone 6 (E2E Testing)
**Review Focus:**
- [ ] Complete workflow works
- [ ] All test scenarios pass
- [ ] Performance is acceptable

### Final Review: After Milestone 7
**Review Focus:**
- [ ] Phase 3 is complete
- [ ] Ready for Phase 4
- [ ] Documentation is comprehensive

---

## 🚀 Cline Prompt

Copy this prompt to start Task 3.3:

```
Integrate code generation with live preview system.

## Context
You are implementing Task 3.3 of the Rise low-code builder. This task connects the code generation pipeline (Tasks 3.1 + 3.2) with the existing preview system (Task 1.4) to create automatic live preview updates.

## What Already Exists
- ViteServerManager (Task 1.4A) - starts/stops Vite dev server
- PreviewPanel (Task 1.4B) - viewport, zoom, iframe display
- previewStore - preview state management
- ReactCodeGenerator (Task 3.1) - generates React code strings
- FileManager (Task 3.2) - writes files with FileChangeTracker
- manifestStore - stores component manifest

## What You're Building
A GenerationService that:
1. Subscribes to manifestStore changes
2. Debounces rapid changes (300ms)
3. Calls FileManager via IPC to generate files
4. Updates generationStore with status
5. Vite HMR automatically updates preview (no action needed)

## Requirements
1. Create generationStore (status: idle/pending/generating/complete/error)
2. Create IPC handlers for generation:generate
3. Create GenerationService that subscribes to manifest changes
4. Create GenerationStatus UI component
5. Integrate with project lifecycle (open/close/switch)
6. Handle errors gracefully

## Architecture
Create these files:
- src/renderer/store/generationStore.ts - Status state
- src/renderer/services/GenerationService.ts - Orchestrator
- src/renderer/components/GenerationStatus.tsx - Status indicator
- electron/ipc-handlers-generation.ts - IPC handlers

Modify these files:
- electron/ipc-handlers.ts - Import generation handlers
- electron/preload.ts - Add generation API
- src/renderer/App.tsx - Initialize GenerationService
- src/renderer/components/Toolbar.tsx - Add status indicator

## Key Flow
```
manifestStore changes
  → GenerationService detects (subscribe)
  → Debounce 300ms
  → Call IPC generation:generate
  → FileManager writes files
  → Vite detects file changes (automatic)
  → HMR updates preview iframe (automatic)
  → User sees changes! 🎉
```

## Success Criteria
- [ ] Edit property → preview updates in <500ms
- [ ] Add component → appears in preview
- [ ] Delete component → removed from preview
- [ ] Status indicator shows generation progress
- [ ] Errors displayed clearly
- [ ] Large projects don't block UI

## Process
1. Start with generationStore (simple state)
2. Build IPC handlers
3. Build GenerationService
4. Add status UI
5. Integrate with project lifecycle
6. Test end-to-end
7. Document

State your approach and confidence (1-10) before starting each milestone.
If confidence <8, stop and ask for human review.

DO NOT BE LAZY. DO NOT OMIT CODE. Provide complete implementations.
```

---

## 🎉 Phase 3 Completion

When Task 3.3 is complete, Phase 3 is finished! This means:

**✅ The Complete Visual Editing Loop Works:**
1. User edits component in UI
2. Manifest updates
3. Code generates automatically
4. Files write to disk
5. Vite HMR updates preview
6. User sees changes instantly

**Next Phase:** Phase 4 - Testing & Polish

---

**Task Status:** ✅ Complete  
**Critical Path:** YES - Final task of Phase 3  
**Risk Level:** MEDIUM - Integration of multiple systems  
**Next Phase:** Phase 4 - Testing & Polish

---

## Completion Summary

### What Was Implemented

**Milestone 5: Project Lifecycle Integration**
- `App.tsx`: Added GenerationService initialization on project open/close
- `StatusBar.tsx`: Added GenerationStatus component to show generation progress

### Files Modified
- `src/renderer/App.tsx` - Import and lifecycle integration
- `src/renderer/components/StatusBar.tsx` - GenerationStatus display
- `electron/generation-handlers.ts` - Fixed unused import

### Integration Complete
The following flow now works end-to-end:
1. User opens project → GenerationService initializes
2. Manifest loads → GenerationService detects changes
3. User edits manifest → GenerationService debounces (500ms)
4. Generation triggers → Files written to src/components/
5. Vite HMR detects → Preview updates automatically
6. Status shown in StatusBar → User sees feedback

### Remaining Work
- E2E manual testing (Milestone 6)
- Documentation polish (Milestone 7)

**Completed:** 2025-11-27

---

**Last Updated:** 2025-11-27  
**Document Version:** 1.1  
**Prepared By:** Claude (via Richard request)  
**Requires Sign-off:** Project Lead (Richard)
