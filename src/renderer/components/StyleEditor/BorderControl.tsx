/**
 * @file BorderControl.tsx
 * @description Controls for border width, radius, and style
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Button groups for border options
 * 
 * @security-critical false
 * @performance-critical false
 */

import React from 'react';
import { BORDER_WIDTH_SCALE, BORDER_RADIUS_SCALE, SHADOW_SCALE, OPACITY_SCALE } from '../../utils/tailwindMappings';
import type { BorderControlProps, EffectsControlProps } from './types';

/**
 * BorderControl Component
 * 
 * Controls for border width, radius, and style.
 */
export function BorderControl({
  borderWidth,
  borderRadius,
  borderStyle,
  borderColor,
  onChange,
  disabled = false,
}: BorderControlProps): React.ReactElement {

  return (
    <div className="space-y-3">
      {/* Border Width */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Width</label>
        <div className="flex rounded border border-gray-300 overflow-hidden">
          {BORDER_WIDTH_SCALE.map((option) => (
            <button
              key={option.suffix}
              onClick={() => onChange('borderWidth', borderWidth === option.suffix ? undefined : option.suffix)}
              disabled={disabled}
              title={option.label}
              className={`px-2 py-1 text-[10px] transition-colors min-w-[28px]
                         ${borderWidth === option.suffix 
                           ? 'bg-blue-500 text-white' 
                           : 'bg-white text-gray-600 hover:bg-gray-50'}
                         disabled:opacity-50 disabled:cursor-not-allowed
                         border-r border-gray-300 last:border-r-0`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Border Radius */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Radius</label>
        <select
          value={borderRadius ?? ''}
          onChange={(e) => onChange('borderRadius', e.target.value || undefined)}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">None</option>
          {BORDER_RADIUS_SCALE.map((option) => (
            <option key={option.suffix || 'default'} value={option.suffix}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Border Style */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Style</label>
        <select
          value={borderStyle ?? ''}
          onChange={(e) => onChange('borderStyle', e.target.value || undefined)}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Default (solid)</option>
          <option value="solid">Solid</option>
          <option value="dashed">Dashed</option>
          <option value="dotted">Dotted</option>
          <option value="double">Double</option>
          <option value="none">None</option>
        </select>
      </div>

      {/* Preview */}
      <div className="text-[10px] text-gray-400 font-mono truncate">
        {[
          borderWidth !== undefined ? (borderWidth === '' ? 'border' : `border-${borderWidth}`) : null,
          borderRadius !== undefined ? (borderRadius === '' ? 'rounded' : `rounded-${borderRadius}`) : null,
          borderStyle ? `border-${borderStyle}` : null,
          borderColor ? `border-${borderColor}` : null,
        ].filter(Boolean).join(' ') || '(no border)'}
      </div>
    </div>
  );
}

/**
 * EffectsControl Component
 * 
 * Controls for shadow and opacity.
 */
export function EffectsControl({
  shadow,
  opacity,
  onChange,
  disabled = false,
}: EffectsControlProps): React.ReactElement {

  return (
    <div className="space-y-3">
      {/* Shadow */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Shadow</label>
        <select
          value={shadow ?? 'none'}
          onChange={(e) => {
            const value = e.target.value;
            onChange('shadow', value === 'none' ? undefined : value);
          }}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {SHADOW_SCALE.map((option) => (
            <option key={option.suffix || 'default'} value={option.suffix}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Opacity */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Opacity</label>
        <select
          value={opacity ?? '100'}
          onChange={(e) => {
            const value = e.target.value;
            onChange('opacity', value === '100' ? undefined : value);
          }}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          {OPACITY_SCALE.map((option) => (
            <option key={option.suffix} value={option.suffix}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Preview */}
      <div className="text-[10px] text-gray-400 font-mono truncate">
        {[
          shadow !== undefined ? (shadow === '' ? 'shadow' : `shadow-${shadow}`) : null,
          opacity ? `opacity-${opacity}` : null,
        ].filter(Boolean).join(' ') || '(no effects)'}
      </div>
    </div>
  );
}

export default BorderControl;
