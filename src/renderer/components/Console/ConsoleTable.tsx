/**
 * @file ConsoleTable.tsx
 * @description Component for rendering console.table() output
 * 
 * Displays tabular data from console.table() calls in an HTML table format.
 * Supports sorting columns and handles nested objects.
 * 
 * @architecture Phase 1, Task 1.4D - Console UI
 * @created 2025-11-25
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard table rendering with sorting
 * 
 * @see .implementation/phase-1-application-shell/task-1.4D-console-ui.md
 * @see src/renderer/components/Console/types.ts - TableData type
 * 
 * @security-critical false
 * @performance-critical false
 */

import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/20/solid';
import type { TableData, SerializedValue } from './types';
import { ObjectTree } from './ObjectTree';

/**
 * Props for ConsoleTable component
 */
interface ConsoleTableProps {
  /** Table data from console.table() */
  data: TableData;
}

/**
 * Maximum number of rows to display
 */
const MAX_ROWS = 1000;

/**
 * Sort direction for table columns
 */
type SortDirection = 'asc' | 'desc' | null;

/**
 * Renders a cell value using ObjectTree for complex types
 */
function renderCellValue(value: SerializedValue | string | number): React.ReactNode {
  // Handle primitive values from row data
  if (typeof value === 'string' || typeof value === 'number') {
    return <span className="text-gray-700">{String(value)}</span>;
  }
  
  // Handle SerializedValue
  return <ObjectTree value={value} inline />;
}

/**
 * ConsoleTable Component
 * 
 * Renders data from console.table() as an HTML table with:
 * - Sortable columns (click header to sort)
 * - Index column (array indices or object keys)  
 * - Property columns
 * - Nested object display
 * - Row truncation for large datasets
 * 
 * USAGE:
 * ```tsx
 * <ConsoleTable data={tableData} />
 * ```
 * 
 * @param props - Component props
 * @returns Rendered table
 */
export function ConsoleTable({ data }: ConsoleTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  
  // Handle column header click for sorting
  const handleHeaderClick = (column: string) => {
    if (sortColumn === column) {
      // Cycle through: asc -> desc -> none
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection('asc');
      }
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Sort rows based on current sort state
  const sortedRows = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return data.rows;
    }
    
    const sorted = [...data.rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      // Handle undefined/null
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      
      // Convert to comparable values
      let aComp: any = aVal;
      let bComp: any = bVal;
      
      // For SerializedValue, get primitive value
      if (typeof aVal === 'object' && 'type' in aVal) {
        if (aVal.type === 'string' || aVal.type === 'number') {
          aComp = aVal.value;
        } else {
          aComp = JSON.stringify(aVal);
        }
      }
      
      if (typeof bVal === 'object' && 'type' in bVal) {
        if (bVal.type === 'string' || bVal.type === 'number') {
          bComp = bVal.value;
        } else {
          bComp = JSON.stringify(bVal);
        }
      }
      
      // Compare
      if (aComp < bComp) return sortDirection === 'asc' ? -1 : 1;
      if (aComp > bComp) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  }, [data.rows, sortColumn, sortDirection]);
  
  // Limit rows displayed
  const displayRows = sortedRows.slice(0, MAX_ROWS);
  const truncated = sortedRows.length > MAX_ROWS;
  
  return (
    <div className="mt-2 overflow-x-auto">
      <table className="min-w-full border border-gray-300 text-xs">
        <thead>
          <tr className="bg-gray-100">
            {/* Index column */}
            <th
              className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-r border-gray-300 cursor-pointer hover:bg-gray-200"
              onClick={() => handleHeaderClick('_index')}
            >
              <div className="flex items-center gap-1">
                <span>Index</span>
                {sortColumn === '_index' && (
                  sortDirection === 'asc' ? (
                    <ChevronUpIcon className="w-3 h-3" />
                  ) : (
                    <ChevronDownIcon className="w-3 h-3" />
                  )
                )}
              </div>
            </th>
            
            {/* Property columns */}
            {data.columns.map((column) => (
              <th
                key={column}
                className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-r border-gray-300 cursor-pointer hover:bg-gray-200"
                onClick={() => handleHeaderClick(column)}
              >
                <div className="flex items-center gap-1">
                  <span>{column}</span>
                  {sortColumn === column && (
                    sortDirection === 'asc' ? (
                      <ChevronUpIcon className="w-3 h-3" />
                    ) : (
                      <ChevronDownIcon className="w-3 h-3" />
                    )
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {displayRows.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
            >
              {/* Index cell */}
              <td className="px-3 py-2 border-b border-r border-gray-300 font-medium text-gray-600">
                {row._index}
              </td>
              
              {/* Property cells */}
              {data.columns.map((column) => (
                <td
                  key={column}
                  className="px-3 py-2 border-b border-r border-gray-300"
                >
                  {renderCellValue(row[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Truncation warning */}
      {truncated && (
        <div className="mt-2 text-xs text-orange-600 italic">
          Showing first {MAX_ROWS} of {sortedRows.length} rows
        </div>
      )}
    </div>
  );
}
