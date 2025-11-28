/**
 * @file EditorPanel.tsx
 * @description Center editor panel with Preview/Code/Console tabs
 * 
 * @architecture Phase 1, Task 1.2 - Three-Panel Layout
 * @created 2025-11-19
 * @updated 2025-11-25 - Added PreviewPanel integration (Task 1.4B)
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Tab system with preview integration
 * 
 * PROBLEM SOLVED:
 * - Provides multi-view interface for preview, code, and console
 * - Tab system allows switching between different editor modes
 * - Preview panel with live Vite dev server
 * 
 * SOLUTION:
 * - Headless UI Tab component for accessibility
 * - Keyboard shortcuts for tab switching
 * - State persistence via useLayout hook
 * - PreviewPanel for live preview rendering
 * 
 * TABS:
 * - Preview: Live component preview via Vite dev server
 * - Code: Generated code viewer (Task 3.1+)
 * - Console: Debug output (Phase 3+)
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
} from '@heroicons/react/24/outline';
import { useLayout } from '../hooks/useLayout';
import { useHotkeys } from 'react-hotkeys-hook';
import { PreviewPanel } from './Preview';
import { ConsolePanel } from './Console';
import { CodePanel } from './CodeViewer';


/**
 * Editor Panel component
 * 
 * Center panel containing the tabbed interface for Preview, Code, and Console views.
 * Uses Headless UI for accessible tabs and react-hotkeys-hook for keyboard shortcuts.
 * 
 * KEYBOARD SHORTCUTS:
 * - Cmd+Shift+P: Switch to Preview tab
 * - Cmd+Shift+C: Switch to Code tab
 * - Cmd+Shift+O: Switch to Console tab
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
  };

  const indexToTabId: Record<number, 'preview' | 'code' | 'console'> = {
    0: 'preview',
    1: 'code',
    2: 'console',
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

  return (
    <div
      className="h-full flex flex-col bg-white"
      data-panel-id="editor"
      tabIndex={-1}
    >
      <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
        {/* Tab List */}
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
        </Tab.List>

        {/* Tab Panels - flex-1 with min-h-0 to allow proper shrinking in flex container */}
        <Tab.Panels className="flex-1 min-h-0 flex flex-col">
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <PreviewPanel />
          </Tab.Panel>
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <CodePanel />
          </Tab.Panel>
          <Tab.Panel className="flex-1 min-h-0 flex flex-col">
            <ConsolePanel />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
