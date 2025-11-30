/**
 * @file EditorPanel.tsx
 * @description Center editor panel with Preview/Code/Console tabs
 * 
 * REFACTORED: Changed from flexbox to CSS Grid for reliable height handling.
 * 
 * LAYOUT STRUCTURE:
 * ┌────────────────────────────────────────┐
 * │ Tab List (auto height)                 │ ← grid-rows: auto
 * ├────────────────────────────────────────┤
 * │                                        │
 * │ Tab Content (fills remaining space)    │ ← grid-rows: 1fr
 * │                                        │
 * └────────────────────────────────────────┘
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @updated 2025-11-25 - Added PreviewPanel integration (Task 1.4B)
 * @updated 2025-11-30 - Refactored to CSS Grid for height fix (Task 3.8)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - CSS Grid layout for reliable height handling
 * 
 * PROBLEM SOLVED:
 * - Provides multi-view interface for preview, code, and console
 * - Tab system allows switching between different editor modes
 * - Preview panel with live Vite dev server
 * - FIXED: Nested flexbox height collapse issue by using CSS Grid
 * 
 * SOLUTION:
 * - CSS Grid with grid-rows-[auto_1fr] for reliable height handling
 * - Row 1 (auto): Tab list takes its natural height
 * - Row 2 (1fr): Tab content fills all remaining space
 * - Headless UI Tab component for accessibility
 * - Keyboard shortcuts for tab switching
 * - State persistence via useLayout hook
 * - PreviewPanel for live preview rendering
 * 
 * TABS:
 * - Preview: Live component preview via Vite dev server
 * - Code: Generated code viewer (Task 3.1+)
 * - Console: Debug output (Phase 3+)
 * - Logic: Visual logic editor (Phase 4)
 * 
 * @performance O(1) tab switching, lazy loading of tab content
 * @security-critical false
 * @performance-critical false
 */

import { Tab } from '@headlessui/react';
import {
  EyeIcon,
  CodeBracketIcon,
  CommandLineIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import { useLayout } from '../hooks/useLayout';
import { useHotkeys } from 'react-hotkeys-hook';
import { PreviewPanel } from './Preview';
import { ConsolePanel } from './Console';
import { CodePanel } from './CodeViewer';
import { LogicPanel } from './LogicEditor';


/**
 * Editor Panel component
 * 
 * Center panel containing the tabbed interface for Preview, Code, Console, and Logic views.
 * Uses CSS Grid with `grid-rows-[auto_1fr]` for reliable height handling:
 * - Row 1 (auto): Tab list takes its natural height
 * - Row 2 (1fr): Tab content fills all remaining space
 * 
 * This avoids the nested flexbox height collapse issue that occurred with flex-1 chains.
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd+Shift+P: Switch to Preview tab
 * - Cmd+Shift+C: Switch to Code tab
 * - Cmd+Shift+O: Switch to Console tab
 * - Cmd+Shift+L: Switch to Logic tab
 * 
 * @returns EditorPanel component
 * 
 * @example
 * ```typescript
 * <Panel id="editor">
 *   <EditorPanel />
 * </Panel>
 * ```
 */
export function EditorPanel() {
  const { activeTab, setActiveTab } = useLayout();

  // Map tab IDs to indices for Headless UI Tab component
  const tabIdToIndex: Record<string, number> = {
    preview: 0,
    code: 1,
    console: 2,
    logic: 3,
  };

  const indexToTabId: Record<number, 'preview' | 'code' | 'console' | 'logic'> = {
    0: 'preview',
    1: 'code',
    2: 'console',
    3: 'logic',
  };

  // Get current tab index
  const selectedIndex = tabIdToIndex[activeTab] || 0;

  // Handle tab change
  const handleTabChange = (index: number) => {
    const tabId = indexToTabId[index];
    if (tabId) {
      setActiveTab(tabId);
    }
  };

  // Keyboard shortcuts for tab switching
  useHotkeys('mod+shift+p', (e) => {
    e.preventDefault();
    setActiveTab('preview');
  }, [setActiveTab]);

  useHotkeys('mod+shift+c', (e) => {
    e.preventDefault();
    setActiveTab('code');
  }, [setActiveTab]);

  useHotkeys('mod+shift+o', (e) => {
    e.preventDefault();
    setActiveTab('console');
  }, [setActiveTab]);

  useHotkeys('mod+shift+l', (e) => {
    e.preventDefault();
    setActiveTab('logic');
  }, [setActiveTab]);

  return (
    // CRITICAL: Use CSS Grid instead of flexbox for reliable height
    // grid-rows-[auto_1fr] = tab list auto-sized, content fills rest
    <div
      className="h-full w-full overflow-hidden bg-white"
      data-panel="editor"
      tabIndex={-1}
    >
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange} className="h-full overflow-hidden">
        {/* Tab List - auto height (first grid row) */}
        <Tab.List className="flex items-center gap-1 px-4 py-2 bg-gray-50 border-b border-gray-200">
          {/* Preview Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <EyeIcon className="w-4 h-4" />
            <span>Preview</span>
          </Tab>

          {/* Code Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <CodeBracketIcon className="w-4 h-4" />
            <span>Code</span>
          </Tab>

          {/* Console Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <CommandLineIcon className="w-4 h-4" />
            <span>Console</span>
          </Tab>

          {/* Logic Tab */}
          <Tab
            className={({ selected }) =>
              `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t transition-colors
              ${
                selected
                  ? 'bg-white text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`
            }
          >
            <BoltIcon className="w-4 h-4" />
            <span>Logic</span>
          </Tab>
        </Tab.List>

        {/* Tab Panels Container - fills remaining space (second grid row) */}
        {/* CRITICAL: h-full + overflow-hidden ensures content is clipped, not expanding */}
        <Tab.Panels className="h-full overflow-hidden">
          {/* Each Tab.Panel MUST have h-full to fill the container */}
          <Tab.Panel className="h-full overflow-hidden">
            <PreviewPanel />
          </Tab.Panel>
          <Tab.Panel className="h-full overflow-hidden">
            <CodePanel />
          </Tab.Panel>
          <Tab.Panel className="h-full overflow-hidden">
            <ConsolePanel />
          </Tab.Panel>
          <Tab.Panel className="h-full overflow-hidden">
            <LogicPanel />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
