/**
 * @file TypographyControl.tsx
 * @description Typography controls for font size, weight, and alignment
 * 
 * @architecture Phase 3, Task 3.6 - Visual Style Controls
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simple dropdowns for typography options
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useCallback } from 'react';
import { FONT_SIZE_SCALE, FONT_WEIGHT_SCALE, TEXT_ALIGN_OPTIONS } from '../../utils/tailwindMappings';
import type { TypographyControlProps } from './types';

/**
 * TypographyControl Component
 * 
 * Controls for font size, weight, and text alignment.
 * Uses Tailwind scale for consistent options.
 */
export function TypographyControl({
  fontSize,
  fontWeight,
  textAlign,
  onChange,
  disabled = false,
}: TypographyControlProps): React.ReactElement {
  
  const handleFontSizeChange = useCallback((value: string) => {
    onChange('fontSize', value || undefined);
  }, [onChange]);

  const handleFontWeightChange = useCallback((value: string) => {
    onChange('fontWeight', value || undefined);
  }, [onChange]);

  const handleTextAlignChange = useCallback((value: string) => {
    onChange('textAlign', value || undefined);
  }, [onChange]);

  return (
    <div className="space-y-3">
      {/* Font Size */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Size</label>
        <select
          value={fontSize || ''}
          onChange={(e) => handleFontSizeChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Default</option>
          {FONT_SIZE_SCALE.map((size) => (
            <option key={size.suffix} value={size.suffix}>
              {size.label}
            </option>
          ))}
        </select>
      </div>

      {/* Font Weight */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Weight</label>
        <select
          value={fontWeight || ''}
          onChange={(e) => handleFontWeightChange(e.target.value)}
          disabled={disabled}
          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded 
                     bg-white focus:outline-none focus:ring-1 focus:ring-blue-500
                     disabled:bg-gray-100 disabled:cursor-not-allowed"
        >
          <option value="">Default</option>
          {FONT_WEIGHT_SCALE.map((weight) => (
            <option key={weight.suffix} value={weight.suffix}>
              {weight.label}
            </option>
          ))}
        </select>
      </div>

      {/* Text Alignment */}
      <div className="flex items-center gap-2">
        <label className="w-16 text-xs text-gray-600 flex-shrink-0">Align</label>
        <div className="flex rounded border border-gray-300 overflow-hidden">
          {TEXT_ALIGN_OPTIONS.map((option) => (
            <button
              key={option.suffix}
              onClick={() => handleTextAlignChange(textAlign === option.suffix ? '' : option.suffix)}
              disabled={disabled}
              title={option.label}
              className={`px-3 py-1.5 text-xs transition-colors
                         ${textAlign === option.suffix 
                           ? 'bg-blue-500 text-white' 
                           : 'bg-white text-gray-600 hover:bg-gray-50'}
                         disabled:opacity-50 disabled:cursor-not-allowed
                         border-r border-gray-300 last:border-r-0`}
            >
              {option.suffix === 'left' && '◀'}
              {option.suffix === 'center' && '≡'}
              {option.suffix === 'right' && '▶'}
              {option.suffix === 'justify' && '⊞'}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div className="text-[10px] text-gray-400 font-mono truncate">
        {[
          fontSize ? `text-${fontSize}` : null,
          fontWeight ? `font-${fontWeight}` : null,
          textAlign ? `text-${textAlign}` : null,
        ].filter(Boolean).join(' ') || '(no typography)'}
      </div>
    </div>
  );
}

export default TypographyControl;
