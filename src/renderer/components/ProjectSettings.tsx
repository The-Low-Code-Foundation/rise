/**
 * @file ProjectSettings.tsx
 * @description Component for viewing and editing project settings
 * 
 * @architecture Phase 1, Task 1.3B - Project Loading & Settings
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard form patterns with IPC integration
 * 
 * PROBLEM SOLVED:
 * - Users need to configure project settings after creation
 * - Settings must persist to .lowcode/settings.json
 * - Provide clear UI for common settings (port, auto-save, theme)
 * 
 * SOLUTION:
 * - Clean settings form with validation
 * - Real-time feedback on changes
 * - Save button to persist settings
 * - Load settings from IPC on mount
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <ProjectSettings />
 * ```
 * 
 * SETTINGS MANAGED:
 * - Development server port (1024-65535)
 * - Auto-save toggle
 * - Theme preference (light/dark/system)
 * 
 * @see .implementation/phase-1-application-shell/task-1.3B-project-loading.md
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../store/projectStore';
import {
  Cog6ToothIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

/**
 * electronAPI helper for IPC calls
 */
const electronAPI = (window as any).electronAPI;

/**
 * Project settings interface
 */
interface ProjectSettingsData {
  defaultPort: number;
  autoSave: boolean;
  theme: 'light' | 'dark' | 'system';
}

/**
 * Project Settings Component
 * 
 * Displays and allows editing of project configuration settings.
 * Settings are saved to .lowcode/settings.json in the project directory.
 * 
 * FEATURES:
 * - Port configuration with validation (1024-65535)
 * - Auto-save toggle
 * - Theme selection
 * - Save/cancel actions
 * - Loading and error states
 * 
 * @returns ProjectSettings component
 */
export function ProjectSettings() {
  // Get current project from store
  const currentProject = useProjectStore((state) => state.currentProject);
  
  // Local state for form
  const [settings, setSettings] = useState<ProjectSettingsData>({
    defaultPort: 5173,
    autoSave: true,
    theme: 'system',
  });
  
  // State for save/load operations
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Port validation error
  const [portError, setPortError] = useState<string | null>(null);

  /**
   * Load settings when component mounts or project changes
   */
  useEffect(() => {
    if (currentProject) {
      loadSettings();
    }
  }, [currentProject]);

  /**
   * Load settings from project
   */
  const loadSettings = async () => {
    if (!currentProject) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await electronAPI.getProjectSettings(currentProject.path);
      
      if (result.success && result.settings) {
        setSettings(result.settings);
        setHasChanges(false);
      } else {
        setError('Failed to load settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Error loading settings: ${message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Validate port number
   * 
   * @param port - Port number to validate
   * @returns Error message or null if valid
   */
  const validatePort = (port: number): string | null => {
    if (isNaN(port)) {
      return 'Port must be a number';
    }
    
    if (port < 1024 || port > 65535) {
      return 'Port must be between 1024 and 65535';
    }
    
    return null;
  };

  /**
   * Handle port change with validation
   * 
   * @param value - New port value as string
   */
  const handlePortChange = (value: string) => {
    const port = parseInt(value, 10);
    
    // Validate port
    const error = validatePort(port);
    setPortError(error);
    
    // Update settings even if invalid (to show the value)
    setSettings((prev) => ({ ...prev, defaultPort: port }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  /**
   * Handle auto-save toggle
   */
  const handleAutoSaveChange = (checked: boolean) => {
    setSettings((prev) => ({ ...prev, autoSave: checked }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  /**
   * Handle theme change
   * 
   * @param theme - New theme value
   */
  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings((prev) => ({ ...prev, theme }));
    setHasChanges(true);
    setSaveStatus('idle');
  };

  /**
   * Save settings to project
   */
  const handleSave = async () => {
    if (!currentProject) return;
    
    // Validate before saving
    if (portError) {
      return;
    }
    
    setIsSaving(true);
    setError(null);
    setSaveStatus('idle');
    
    try {
      const result = await electronAPI.updateProjectSettings(
        currentProject.path,
        settings
      );
      
      if (result.success) {
        setSaveStatus('success');
        setHasChanges(false);
        
        // Reset success message after 2 seconds
        setTimeout(() => {
          setSaveStatus('idle');
        }, 2000);
      } else {
        setSaveStatus('error');
        setError(result.error || 'Failed to save settings');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setSaveStatus('error');
      setError(`Error saving settings: ${message}`);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cancel changes and reload settings
   */
  const handleCancel = () => {
    loadSettings();
    setSaveStatus('idle');
  };

  // Show message if no project is open
  if (!currentProject) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-gray-500">
          Open a project to view settings
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Cog6ToothIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-sm font-semibold text-gray-900">
            Project Settings
          </h3>
        </div>
        <p className="text-xs text-gray-500">
          {currentProject.name}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <ArrowPathIcon className="w-6 h-6 text-gray-400 animate-spin" />
          <span className="ml-2 text-sm text-gray-600">Loading settings...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Settings Form */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Port Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Development Server Port
            </label>
            <input
              type="number"
              min="1024"
              max="65535"
              value={settings.defaultPort}
              onChange={(e) => handlePortChange(e.target.value)}
              className={`
                w-full px-3 py-2 text-sm border rounded
                focus:outline-none focus:ring-2
                ${
                  portError
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }
              `}
            />
            {portError && (
              <p className="mt-1 text-xs text-red-600">{portError}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Port for the development server (1024-65535)
            </p>
          </div>

          {/* Auto-Save Toggle */}
          <div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={settings.autoSave}
                onChange={(e) => handleAutoSaveChange(e.target.checked)}
                className="mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <span className="block text-sm font-medium text-gray-700">
                  Auto-save changes
                </span>
                <span className="block text-xs text-gray-500 mt-1">
                  Automatically save manifest changes to disk
                </span>
              </div>
            </label>
          </div>

          {/* Theme Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Theme
            </label>
            <select
              value={settings.theme}
              onChange={(e) =>
                handleThemeChange(e.target.value as 'light' | 'dark' | 'system')
              }
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="system">System Default</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Choose your preferred theme for the editor
            </p>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isLoading && hasChanges && (
        <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={isSaving || !!portError}
            className={`
              flex-1 px-4 py-2 text-sm font-medium rounded
              transition-colors
              ${
                isSaving || portError
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isSaving ? (
              <>
                <ArrowPathIcon className="inline w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className={`
              px-4 py-2 text-sm font-medium rounded
              transition-colors
              ${
                isSaving
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
              }
            `}
          >
            Cancel
          </button>
        </div>
      )}

      {/* Save Status */}
      {saveStatus === 'success' && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Settings saved successfully!</p>
        </div>
      )}
    </div>
  );
}
