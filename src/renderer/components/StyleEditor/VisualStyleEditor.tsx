/**
 * @file VisualStyleEditor.tsx
 * @description Integrated visual style editor with collapsible sections
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - All controls integrated with proper data flow
 * 
 * PROBLEM SOLVED:
 * Users need a unified interface to edit all Tailwind styles visually.
 * Controls are organized into collapsible sections by category.
 * 
 * SOLUTION:
 * - Parses incoming className into structured data
 * - Routes changes from each control back to caller
 * - Collapsible sections for different style categories
 * - Real-time preview of class string
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback, useMemo } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { parseClasses, generateClasses, type ParsedStyles, type SpacingStyles } from '../../utils/tailwindParser';
import { SpacingControl } from './SpacingControl';
import { TailwindColorPicker } from './TailwindColorPicker';
import { TypographyControl } from './TypographyControl';
import { BorderControl, EffectsControl } from './BorderControl';
import type { StyleCategory } from './types';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Props for VisualStyleEditor
 */
export interface VisualStyleEditorProps {
  /** Current class string (space-separated Tailwind classes) */
  className: string;
  /** Handler called when classes change */
  onChange: (className: string) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
  /** Which sections to show by default expanded */
  defaultExpanded?: StyleCategory[];
}

// ============================================================================
// COLLAPSIBLE SECTION
// ============================================================================

interface SectionProps {
  title: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function Section({ title, isExpanded, onToggle, children }: SectionProps): React.ReactElement {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 
                   transition-colors"
      >
        {isExpanded ? (
          <ChevronDownIcon className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm font-medium text-gray-700">{title}</span>
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * VisualStyleEditor Component
 * 
 * Unified visual editor for Tailwind CSS styles with collapsible sections.
 * Parses incoming className, provides visual controls, and emits updated className.
 * 
 * @param props - VisualStyleEditor props
 * @returns Visual style editor element
 * 
 * @example
 * ```tsx
 * <VisualStyleEditor
 *   className="p-4 bg-blue-500 text-white rounded-lg"
 *   onChange={(newClassName) => updateComponent({ className: newClassName })}
 * />
 * ```
 */
export function VisualStyleEditor({
  className,
  onChange,
  disabled = false,
  defaultExpanded = ['spacing', 'colors'],
}: VisualStyleEditorProps): React.ReactElement {
  // Track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<Set<StyleCategory>>(
    new Set(defaultExpanded)
  );

  // Parse the current className into structured data
  const parsedStyles = useMemo(() => parseClasses(className), [className]);

  /**
   * Toggle section expansion
   */
  const toggleSection = useCallback((section: StyleCategory) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  }, []);

  /**
   * Update a specific style property and regenerate classes
   */
  const updateStyles = useCallback((updates: Partial<ParsedStyles>) => {
    const newStyles: ParsedStyles = {
      ...parsedStyles,
      ...updates,
      padding: updates.padding ?? parsedStyles.padding,
      margin: updates.margin ?? parsedStyles.margin,
      unknownClasses: updates.unknownClasses ?? parsedStyles.unknownClasses,
    };
    const newClassName = generateClasses(newStyles);
    onChange(newClassName);
  }, [parsedStyles, onChange]);

  /**
   * Handle padding change
   */
  const handlePaddingChange = useCallback((padding: SpacingStyles) => {
    updateStyles({ padding });
  }, [updateStyles]);

  /**
   * Handle margin change
   */
  const handleMarginChange = useCallback((margin: SpacingStyles) => {
    updateStyles({ margin });
  }, [updateStyles]);

  /**
   * Handle color change
   */
  const handleColorChange = useCallback((
    type: 'backgroundColor' | 'textColor' | 'borderColor',
    value: string | undefined
  ) => {
    updateStyles({ [type]: value });
  }, [updateStyles]);

  /**
   * Handle typography change
   */
  const handleTypographyChange = useCallback((
    property: 'fontSize' | 'fontWeight' | 'textAlign',
    value: string | undefined
  ) => {
    updateStyles({ [property]: value });
  }, [updateStyles]);

  /**
   * Handle border change
   */
  const handleBorderChange = useCallback((
    property: 'borderWidth' | 'borderRadius' | 'borderStyle' | 'borderColor',
    value: string | undefined
  ) => {
    updateStyles({ [property]: value });
  }, [updateStyles]);

  /**
   * Handle effects change
   */
  const handleEffectsChange = useCallback((
    property: 'shadow' | 'opacity',
    value: string | undefined
  ) => {
    updateStyles({ [property]: value });
  }, [updateStyles]);

  return (
    <div className="border border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Spacing Section */}
      <Section
        title="Spacing"
        isExpanded={expandedSections.has('spacing')}
        onToggle={() => toggleSection('spacing')}
      >
        <div className="space-y-4">
          <SpacingControl
            type="padding"
            value={parsedStyles.padding}
            onChange={handlePaddingChange}
            disabled={disabled}
          />
          <SpacingControl
            type="margin"
            value={parsedStyles.margin}
            onChange={handleMarginChange}
            disabled={disabled}
          />
        </div>
      </Section>

      {/* Colors Section */}
      <Section
        title="Colors"
        isExpanded={expandedSections.has('colors')}
        onToggle={() => toggleSection('colors')}
      >
        <div className="space-y-4">
          <TailwindColorPicker
            type="backgroundColor"
            value={parsedStyles.backgroundColor}
            onChange={(v) => handleColorChange('backgroundColor', v)}
            disabled={disabled}
            label="Background"
          />
          <TailwindColorPicker
            type="textColor"
            value={parsedStyles.textColor}
            onChange={(v) => handleColorChange('textColor', v)}
            disabled={disabled}
            label="Text"
          />
          <TailwindColorPicker
            type="borderColor"
            value={parsedStyles.borderColor}
            onChange={(v) => handleColorChange('borderColor', v)}
            disabled={disabled}
            label="Border"
          />
        </div>
      </Section>

      {/* Typography Section */}
      <Section
        title="Typography"
        isExpanded={expandedSections.has('typography')}
        onToggle={() => toggleSection('typography')}
      >
        <TypographyControl
          fontSize={parsedStyles.fontSize}
          fontWeight={parsedStyles.fontWeight}
          textAlign={parsedStyles.textAlign}
          onChange={handleTypographyChange}
          disabled={disabled}
        />
      </Section>

      {/* Borders Section */}
      <Section
        title="Borders"
        isExpanded={expandedSections.has('borders')}
        onToggle={() => toggleSection('borders')}
      >
        <BorderControl
          borderWidth={parsedStyles.borderWidth}
          borderRadius={parsedStyles.borderRadius}
          borderStyle={parsedStyles.borderStyle}
          borderColor={parsedStyles.borderColor}
          onChange={handleBorderChange}
          disabled={disabled}
        />
      </Section>

      {/* Effects Section */}
      <Section
        title="Effects"
        isExpanded={expandedSections.has('effects')}
        onToggle={() => toggleSection('effects')}
      >
        <EffectsControl
          shadow={parsedStyles.shadow}
          opacity={parsedStyles.opacity}
          onChange={handleEffectsChange}
          disabled={disabled}
        />
      </Section>

      {/* Unknown Classes (if any) */}
      {parsedStyles.unknownClasses.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-200">
          <span className="text-[10px] text-gray-500 font-medium">
            Other classes:
          </span>
          <div className="text-[10px] text-gray-600 font-mono mt-1">
            {parsedStyles.unknownClasses.join(' ')}
          </div>
        </div>
      )}

      {/* Preview */}
      <div className="px-3 py-2 bg-blue-50 border-t border-blue-100">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-blue-600 font-medium">Generated:</span>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(className)}
            className="text-[10px] text-blue-500 hover:text-blue-700"
            title="Copy to clipboard"
          >
            Copy
          </button>
        </div>
        <div className="text-[10px] text-blue-700 font-mono mt-1 break-all">
          {className || '(no classes)'}
        </div>
      </div>
    </div>
  );
}

export default VisualStyleEditor;
