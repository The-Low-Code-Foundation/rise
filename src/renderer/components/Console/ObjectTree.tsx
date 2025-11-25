/**
 * @file ObjectTree.tsx
 * @description Recursive tree component for inspecting JavaScript objects
 * 
 * Renders JavaScript values (objects, arrays, primitives, functions, etc.)
 * in an expandable tree structure similar to Chrome DevTools console.
 * Handles circular references, deep nesting, and large data structures.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Complex recursive logic, thoroughly tested
 * 
 * KEY FEATURES:
 * - Recursive rendering with expand/collapse
 * - Syntax highlighting by type
 * - Circular reference detection
 * - Max depth limiting (prevents stack overflow)
 * - Lazy rendering (only expanded nodes)
 * - Large array/object truncation
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/components/Console/types.ts - SerializedValue types
 * 
 * @security-critical false
 * @performance-critical true - Used for every object in console
 */

import React, { useState, useCallback } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import type { SerializedValue } from './types';

/**
 * Props for ObjectTree component
 */
interface ObjectTreeProps {
  /** Serialized value to render */
  value: SerializedValue;
  
  /** Current depth in tree (for limiting recursion) */
  depth?: number;
  
  /** Maximum depth to render (stop recursion after this) */
  maxDepth?: number;
  
  /** Path to this value (for expand/collapse state tracking) */
  path?: string;
  
  /** Property name (for object properties) */
  name?: string;
  
  /** Whether to show as inline (no expand/collapse) */
  inline?: boolean;
}

/**
 * Maximum number of properties to show before truncating
 */
const MAX_PROPERTIES = 100;

/**
 * Maximum array length to show before truncating
 */
const MAX_ARRAY_LENGTH = 100;

/**
 * Maximum string length before truncating
 */
const MAX_STRING_LENGTH = 10000;

/**
 * ObjectTree Component
 * 
 * Recursively renders JavaScript values with expand/collapse functionality.
 * Handles all JavaScript types with appropriate syntax highlighting.
 * 
 * RENDERING STRATEGY:
 * - Primitives: Render inline with syntax highlighting
 * - Objects/Arrays: Show preview, expand to show properties
 * - Circular refs: Show [[Circular]] marker
 * - Large data: Truncate with "... X more" indicator
 * 
 * PERFORMANCE:
 * - Lazy rendering: Only render expanded nodes
 * - Max depth limiting: Stop at depth 50
 * - Truncation: Limit properties/items shown
 * 
 * @param props - Component props
 * @returns Rendered tree node
 */
export function ObjectTree({
  value,
  depth = 0,
  maxDepth = 50,
  path = 'root',
  name,
  inline = false,
}: ObjectTreeProps) {
  // Track expanded state for this node
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Toggle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);
  
  // Check if we've hit max depth
  if (depth > maxDepth) {
    return (
      <span className="text-red-600 italic text-xs">
        [Max depth {maxDepth} reached]
      </span>
    );
  }
  
  // Render property name if provided
  const renderName = () => {
    if (!name) return null;
    return (
      <span className="text-gray-700 mr-1">
        {name}:
      </span>
    );
  };
  
  // Handle null
  if (value.type === 'null') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-500">null</span>
      </span>
    );
  }
  
  // Handle undefined
  if (value.type === 'undefined') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-500">undefined</span>
      </span>
    );
  }
  
  // Handle boolean
  if (value.type === 'boolean') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-purple-600">{String(value.value)}</span>
      </span>
    );
  }
  
  // Handle number
  if (value.type === 'number') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-blue-600">{String(value.value)}</span>
      </span>
    );
  }
  
  // Handle bigint
  if (value.type === 'bigint') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-blue-600">{value.value}n</span>
      </span>
    );
  }
  
  // Handle string
  if (value.type === 'string') {
    const displayValue = value.value.length > MAX_STRING_LENGTH
      ? value.value.slice(0, MAX_STRING_LENGTH) + '...'
      : value.value;
    
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-green-600">"{displayValue}"</span>
        {value.value.length > MAX_STRING_LENGTH && (
          <span className="text-gray-500 text-xs ml-1">
            (truncated, {value.value.length} chars)
          </span>
        )}
      </span>
    );
  }
  
  // Handle symbol
  if (value.type === 'symbol') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-orange-600">Symbol({value.value})</span>
      </span>
    );
  }
  
  // Handle function
  if (value.type === 'function') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-600 italic">{value.value}</span>
      </span>
    );
  }
  
  // Handle Date
  if (value.type === 'date') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-purple-600">Date({value.value})</span>
      </span>
    );
  }
  
  // Handle RegExp
  if (value.type === 'regexp') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-red-600">{value.value}</span>
      </span>
    );
  }
  
  // Handle Error
  if (value.type === 'error') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-red-600">
          {value.name}: {value.message}
        </span>
      </span>
    );
  }
  
  // Handle Promise
  if (value.type === 'promise') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-600 italic">
          Promise {'{'} &lt;{value.state}&gt; {'}'}
        </span>
      </span>
    );
  }
  
  // Handle ArrayBuffer
  if (value.type === 'arraybuffer') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-600">
          ArrayBuffer({value.byteLength} bytes)
        </span>
      </span>
    );
  }
  
  // Handle TypedArray
  if (value.type === 'typedarray') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-600">
          {value.typeName}[{value.length}]
        </span>
      </span>
    );
  }
  
  // Handle WeakMap/WeakSet
  if (value.type === 'weakmap' || value.type === 'weakset') {
    const typeName = value.type === 'weakmap' ? 'WeakMap' : 'WeakSet';
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-600 italic">
          {typeName} {'{'} [not inspectable] {'}'}
        </span>
      </span>
    );
  }
  
  // Handle DOM elements
  if (value.type === 'dom') {
    const attrs = [
      value.id && `id="${value.id}"`,
      value.className && `class="${value.className}"`,
    ].filter(Boolean).join(' ');
    
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-purple-600">
          &lt;{value.tagName}{attrs ? ' ' + attrs : ''}&gt;
        </span>
      </span>
    );
  }
  
  // Handle circular reference
  if (value.type === 'circular') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-red-600 italic">[[Circular: {value.path}]]</span>
      </span>
    );
  }
  
  // Handle truncated
  if (value.type === 'truncated') {
    return (
      <span className="inline-flex items-center">
        {renderName()}
        <span className="text-gray-500 italic">[{value.reason}]</span>
      </span>
    );
  }
  
  // Handle Map
  if (value.type === 'map') {
    const entries = value.entries;
    const size = entries.length;
    
    // If inline or empty, show compact
    if (inline || size === 0) {
      return (
        <span className="inline-flex items-center">
          {renderName()}
          <span className="text-gray-700">
            Map({size}) {'{'}...{'}'}
          </span>
        </span>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <button
            onClick={toggleExpanded}
            className="p-0 mr-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {renderName()}
          <span className="text-gray-700">
            Map({size})
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2">
            {entries.slice(0, MAX_PROPERTIES).map((entry, i) => (
              <div key={i} className="flex items-start py-0.5">
                <ObjectTree
                  value={entry[0]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={`${path}[${i}].key`}
                  inline
                />
                <span className="mx-2 text-gray-500">=&gt;</span>
                <ObjectTree
                  value={entry[1]}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={`${path}[${i}].value`}
                />
              </div>
            ))}
            {entries.length > MAX_PROPERTIES && (
              <div className="text-gray-500 text-sm italic">
                ... {entries.length - MAX_PROPERTIES} more entries
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Handle Set
  if (value.type === 'set') {
    const values = value.values;
    const size = values.length;
    
    // If inline or empty, show compact
    if (inline || size === 0) {
      return (
        <span className="inline-flex items-center">
          {renderName()}
          <span className="text-gray-700">
            Set({size}) {'{'}...{'}'}
          </span>
        </span>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <button
            onClick={toggleExpanded}
            className="p-0 mr-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {renderName()}
          <span className="text-gray-700">
            Set({size})
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2">
            {values.slice(0, MAX_PROPERTIES).map((val, i) => (
              <div key={i} className="py-0.5">
                <ObjectTree
                  value={val}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={`${path}[${i}]`}
                  name={String(i)}
                />
              </div>
            ))}
            {values.length > MAX_PROPERTIES && (
              <div className="text-gray-500 text-sm italic">
                ... {values.length - MAX_PROPERTIES} more values
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Handle Array
  if (value.type === 'array') {
    const items = value.value;
    const length = value.length;
    
    // If inline or empty, show compact
    if (inline || length === 0) {
      return (
        <span className="inline-flex items-center">
          {renderName()}
          <span className="text-gray-700">
            [{length === 0 ? '' : '...'}]
          </span>
        </span>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <button
            onClick={toggleExpanded}
            className="p-0 mr-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {renderName()}
          <span className="text-gray-700">
            Array({length})
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2">
            {items.slice(0, MAX_ARRAY_LENGTH).map((item, i) => (
              <div key={i} className="py-0.5">
                <ObjectTree
                  value={item}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={`${path}[${i}]`}
                  name={String(i)}
                />
              </div>
            ))}
            {length > MAX_ARRAY_LENGTH && (
              <div className="text-gray-500 text-sm italic">
                ... {length - MAX_ARRAY_LENGTH} more items
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Handle Object
  if (value.type === 'object') {
    const props = Object.entries(value.value);
    const propCount = props.length;
    const constructorName = value.constructor !== 'Object' ? value.constructor : null;
    
    // If inline or empty, show compact
    if (inline || propCount === 0) {
      const label = constructorName || 'Object';
      return (
        <span className="inline-flex items-center">
          {renderName()}
          <span className="text-gray-700">
            {label} {'{'}
            {propCount === 0 ? '' : '...'}
            {'}'}
          </span>
        </span>
      );
    }
    
    return (
      <div className="flex flex-col">
        <div className="flex items-center">
          <button
            onClick={toggleExpanded}
            className="p-0 mr-1 hover:bg-gray-100 rounded"
          >
            {isExpanded ? (
              <ChevronDownIcon className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          {renderName()}
          <span className="text-gray-700">
            {constructorName && <span className="mr-1">{constructorName}</span>}
            {'{'}
            {propCount > 0 && !isExpanded && '...'}
            {'}'}
          </span>
        </div>
        
        {isExpanded && (
          <div className="ml-6 border-l border-gray-200 pl-2">
            {props.slice(0, MAX_PROPERTIES).map(([key, val]) => (
              <div key={key} className="py-0.5">
                <ObjectTree
                  value={val}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  path={`${path}.${key}`}
                  name={key}
                />
              </div>
            ))}
            {propCount > MAX_PROPERTIES && (
              <div className="text-gray-500 text-sm italic">
                ... {propCount - MAX_PROPERTIES} more properties
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  
  // Fallback for unknown types
  return (
    <span className="inline-flex items-center">
      {renderName()}
      <span className="text-gray-500 italic">[Unknown type]</span>
    </span>
  );
}
