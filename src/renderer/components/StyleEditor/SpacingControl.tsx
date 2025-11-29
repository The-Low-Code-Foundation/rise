/**
 * @file SpacingControl.tsx
 * @description Visual spacing control with box model representation for padding/margin
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Clean implementation with mode switching
 * 
 * PROBLEM SOLVED:
 * Users need to set padding and margin values without knowing Tailwind class names.
 * A visual box model representation makes it intuitive to understand spacing.
 * 
 * SOLUTION:
 * - Visual box model diagram showing all four sides
 * - Three modes: All (uniform), Axis (x/y), Individual (per-side)
 * - Dropdown with common Tailwind spacing values
 * - Real-time preview of spacing values
 * 
 * LAYOUT:
 * ┌─────────────────────────────────────────────────────┐
 * │ Padding                     [All ▼] [Axis] [Each]  │
 * ├─────────────────────────────────────────────────────┤
 * │ ALL MODE:                                           │
 * │   ┌─────────────────────────────────────┐          │
 * │   │          [  4  ▼]                   │          │
 * │   └─────────────────────────────────────┘          │
 * │                                                     │
 * │ INDIVIDUAL MODE:                                    │
 * │              ┌─────┐                                │
 * │              │  4  │ Top                            │
 * │        ┌─────┴─────┴─────┐                          │
 * │        │ 2 │ BOX │ 2 │   Left/Right                 │
 * │        └─────┬─────┬─────┘                          │
 * │              │  4  │ Bottom                         │
 * │              └─────┘                                │
 * └─────────────────────────────────────────────────────┘
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useCallback, useMemo } from 'react';
import { SPACING_SCALE_COMPACT, type SpacingValue } from '../../utils/tailwindMappings';
import type { SpacingControlProps, SpacingMode } from './types';
import type { SpacingStyles } from '../../utils/tailwindParser';

/**
 * Determine the current mode based on which spacing values are set
 * 
 * @param value - Current spacing values
 * @returns The detected mode
 */
function detectMode(value: SpacingStyles): SpacingMode {
  // Check for individual sides first
  if (value.top !== undefined || value.right !== undefined || 
      value.bottom !== undefined || value.left !== undefined) {
    return 'individual';
  }
  
  // Check for axis values (x/y)
  if (value.x !== undefined || value.y !== undefined) {
    return 'axis';
  }
  
  // Default to all
  return 'all';
}

/**
 * Get effective value for a side, considering hierarchy
 * Priority: individual > axis > all
 */
function getEffectiveValue(
  value: SpacingStyles,
  side: 'top' | 'right' | 'bottom' | 'left'
): string {
  // Check individual first
  if (value[side] !== undefined) return value[side]!;
  
  // Check axis
  if (side === 'top' || side === 'bottom') {
    if (value.y !== undefined) return value.y;
  } else {
    if (value.x !== undefined) return value.x;
  }
  
  // Fall back to all
  return value.all ?? '';
}

/**
 * SpacingSelect - Dropdown for selecting spacing values
 */
interface SpacingSelectProps {
  value: string;
  onChange: (value: string) => void;
  allowAuto?: boolean;
  disabled?: boolean;
  className?: string;
  label: string;
}

function SpacingSelect({
  value,
  onChange,
  allowAuto = false,
  disabled = false,
  className = '',
  label,
}: SpacingSelectProps): React.ReactElement {
  // Build options list
  const options = useMemo(() => {
    const opts: Array<{ value: string; label: string }> = [
      { value: '', label: '-' },  // Empty/unset option
      ...SPACING_SCALE_COMPACT.map((s: SpacingValue) => ({
        value: s.suffix,
        label: s.label,
      })),
    ];
    
    if (allowAuto) {
      opts.push({ value: 'auto', label: 'auto' });
    }
    
    return opts;
  }, [allowAuto]);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`px-2 py-1 text-xs border border-gray-300 rounded 
                 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                 disabled:bg-gray-100 disabled:cursor-not-allowed
                 ${className}`}
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

/**
 * Mode toggle buttons component
 */
interface ModeToggleProps {
  mode: SpacingMode;
  onChange: (mode: SpacingMode) => void;
  disabled?: boolean;
}

function ModeToggle({ mode, onChange, disabled }: ModeToggleProps): React.ReactElement {
  const modes: Array<{ value: SpacingMode; label: string; title: string }> = [
    { value: 'all', label: 'All', title: 'Same value for all sides' },
    { value: 'axis', label: 'X/Y', title: 'Separate horizontal and vertical' },
    { value: 'individual', label: 'Each', title: 'Control each side individually' },
  ];

  return (
    <div className="flex rounded border border-gray-300 overflow-hidden">
      {modes.map(({ value, label, title }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          disabled={disabled}
          title={title}
          className={`px-2 py-0.5 text-[10px] font-medium transition-colors
                     ${mode === value 
                       ? 'bg-blue-500 text-white' 
                       : 'bg-white text-gray-600 hover:bg-gray-50'}
                     disabled:opacity-50 disabled:cursor-not-allowed
                     border-r border-gray-300 last:border-r-0`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

/**
 * Visual box model for individual mode
 */
interface BoxModelProps {
  value: SpacingStyles;
  onChange: (side: keyof SpacingStyles, val: string) => void;
  allowAuto?: boolean;
  disabled?: boolean;
}

function BoxModel({
  value,
  onChange,
  allowAuto = false,
  disabled = false,
}: BoxModelProps): React.ReactElement {
  const top = getEffectiveValue(value, 'top');
  const right = getEffectiveValue(value, 'right');
  const bottom = getEffectiveValue(value, 'bottom');
  const left = getEffectiveValue(value, 'left');

  return (
    <div className="flex flex-col items-center gap-1 py-2">
      {/* Top */}
      <SpacingSelect
        value={top}
        onChange={(v) => onChange('top', v)}
        allowAuto={allowAuto}
        disabled={disabled}
        className="w-16"
        label="Top spacing"
      />
      
      {/* Middle row: Left + Box + Right */}
      <div className="flex items-center gap-1">
        <SpacingSelect
          value={left}
          onChange={(v) => onChange('left', v)}
          allowAuto={allowAuto}
          disabled={disabled}
          className="w-16"
          label="Left spacing"
        />
        
        {/* Visual box representation */}
        <div 
          className="w-12 h-8 bg-gray-100 border border-gray-300 rounded flex items-center justify-center"
          title="Content area"
        >
          <span className="text-[8px] text-gray-400">BOX</span>
        </div>
        
        <SpacingSelect
          value={right}
          onChange={(v) => onChange('right', v)}
          allowAuto={allowAuto}
          disabled={disabled}
          className="w-16"
          label="Right spacing"
        />
      </div>
      
      {/* Bottom */}
      <SpacingSelect
        value={bottom}
        onChange={(v) => onChange('bottom', v)}
        allowAuto={allowAuto}
        disabled={disabled}
        className="w-16"
        label="Bottom spacing"
      />
    </div>
  );
}

/**
 * Axis mode view (X/Y)
 */
interface AxisModeProps {
  value: SpacingStyles;
  onChange: (axis: 'x' | 'y' | 'all', val: string) => void;
  allowAuto?: boolean;
  disabled?: boolean;
}

function AxisMode({
  value,
  onChange,
  allowAuto = false,
  disabled = false,
}: AxisModeProps): React.ReactElement {
  const xValue = value.x ?? value.all ?? '';
  const yValue = value.y ?? value.all ?? '';

  return (
    <div className="grid grid-cols-2 gap-3 py-2">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 font-medium">
          Horizontal (X)
        </label>
        <SpacingSelect
          value={xValue}
          onChange={(v) => onChange('x', v)}
          allowAuto={allowAuto}
          disabled={disabled}
          className="w-full"
          label="Horizontal spacing"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] text-gray-500 font-medium">
          Vertical (Y)
        </label>
        <SpacingSelect
          value={yValue}
          onChange={(v) => onChange('y', v)}
          allowAuto={allowAuto}
          disabled={disabled}
          className="w-full"
          label="Vertical spacing"
        />
      </div>
    </div>
  );
}

/**
 * SpacingControl Component
 * 
 * Visual control for editing padding or margin with mode switching.
 * Supports three modes: all (uniform), axis (x/y), individual (per-side).
 * 
 * @param props - SpacingControl props
 * @returns Spacing control element
 * 
 * @example
 * ```tsx
 * <SpacingControl
 *   type="padding"
 *   value={{ all: '4' }}
 *   onChange={(newValue) => updateStyles(newValue)}
 * />
 * ```
 */
export function SpacingControl({
  type,
  value,
  onChange,
  disabled = false,
}: SpacingControlProps): React.ReactElement {
  // Track the user's selected mode (may differ from auto-detected mode)
  const detectedMode = detectMode(value);
  const [mode, setMode] = useState<SpacingMode>(detectedMode);

  // Allow auto for margin only
  const allowAuto = type === 'margin';
  
  // Label for the control
  const label = type === 'padding' ? 'Padding' : 'Margin';

  /**
   * Handle mode change - convert values appropriately
   */
  const handleModeChange = useCallback((newMode: SpacingMode) => {
    setMode(newMode);

    // When switching modes, we need to convert the values
    if (newMode === 'all') {
      // Take any existing value as the "all" value
      const firstValue = value.all ?? value.x ?? value.y ?? 
                        value.top ?? value.right ?? value.bottom ?? value.left ?? '';
      onChange({ all: firstValue || undefined });
    } else if (newMode === 'axis') {
      // Convert to x/y
      const xVal = value.x ?? value.left ?? value.right ?? value.all ?? '';
      const yVal = value.y ?? value.top ?? value.bottom ?? value.all ?? '';
      onChange({
        x: xVal || undefined,
        y: yVal || undefined,
      });
    } else {
      // Individual - expand all/axis to individual sides
      onChange({
        top: getEffectiveValue(value, 'top') || undefined,
        right: getEffectiveValue(value, 'right') || undefined,
        bottom: getEffectiveValue(value, 'bottom') || undefined,
        left: getEffectiveValue(value, 'left') || undefined,
      });
    }
  }, [value, onChange]);

  /**
   * Handle "all" value change
   */
  const handleAllChange = useCallback((newValue: string) => {
    onChange({ all: newValue || undefined });
  }, [onChange]);

  /**
   * Handle axis value change
   */
  const handleAxisChange = useCallback((axis: 'x' | 'y' | 'all', newValue: string) => {
    const updated: SpacingStyles = { ...value };
    
    // Clear individual values when setting axis
    delete updated.top;
    delete updated.right;
    delete updated.bottom;
    delete updated.left;
    delete updated.all;
    
    if (axis === 'x') {
      updated.x = newValue || undefined;
      updated.y = value.y;
    } else if (axis === 'y') {
      updated.y = newValue || undefined;
      updated.x = value.x;
    }
    
    onChange(updated);
  }, [value, onChange]);

  /**
   * Handle individual side change
   */
  const handleSideChange = useCallback((side: keyof SpacingStyles, newValue: string) => {
    const updated: SpacingStyles = {
      top: getEffectiveValue(value, 'top'),
      right: getEffectiveValue(value, 'right'),
      bottom: getEffectiveValue(value, 'bottom'),
      left: getEffectiveValue(value, 'left'),
    };
    
    // Update the specific side
    updated[side] = newValue || undefined;
    
    // Remove empty values
    if (!updated.top) delete updated.top;
    if (!updated.right) delete updated.right;
    if (!updated.bottom) delete updated.bottom;
    if (!updated.left) delete updated.left;
    
    onChange(updated);
  }, [value, onChange]);

  // Get the "all" value for single input mode
  const allValue = value.all ?? '';

  return (
    <div className="space-y-2">
      {/* Header with label and mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-700">{label}</span>
        <ModeToggle
          mode={mode}
          onChange={handleModeChange}
          disabled={disabled}
        />
      </div>

      {/* Content based on mode */}
      <div className="border border-gray-200 rounded-lg bg-gray-50 p-2">
        {mode === 'all' && (
          <div className="flex items-center justify-center py-2">
            <SpacingSelect
              value={allValue}
              onChange={handleAllChange}
              allowAuto={allowAuto}
              disabled={disabled}
              className="w-24"
              label={`${label} - all sides`}
            />
          </div>
        )}

        {mode === 'axis' && (
          <AxisMode
            value={value}
            onChange={handleAxisChange}
            allowAuto={allowAuto}
            disabled={disabled}
          />
        )}

        {mode === 'individual' && (
          <BoxModel
            value={value}
            onChange={handleSideChange}
            allowAuto={allowAuto}
            disabled={disabled}
          />
        )}
      </div>

      {/* Preview of generated classes */}
      <div className="text-[10px] text-gray-400 font-mono truncate">
        {generatePreview(type, value, mode)}
      </div>
    </div>
  );
}

/**
 * Generate preview text showing the Tailwind classes that will be generated
 */
function generatePreview(
  type: 'padding' | 'margin',
  value: SpacingStyles,
  mode: SpacingMode
): string {
  const prefix = type === 'padding' ? 'p' : 'm';
  const classes: string[] = [];

  if (mode === 'all' && value.all) {
    classes.push(`${prefix}-${value.all}`);
  } else if (mode === 'axis') {
    if (value.x) classes.push(`${prefix}x-${value.x}`);
    if (value.y) classes.push(`${prefix}y-${value.y}`);
  } else if (mode === 'individual') {
    if (value.top) classes.push(`${prefix}t-${value.top}`);
    if (value.right) classes.push(`${prefix}r-${value.right}`);
    if (value.bottom) classes.push(`${prefix}b-${value.bottom}`);
    if (value.left) classes.push(`${prefix}l-${value.left}`);
  }

  return classes.length > 0 ? classes.join(' ') : '(no spacing)';
}

export default SpacingControl;
