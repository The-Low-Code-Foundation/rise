/**
 * @file TreeNode.tsx
 * @description Individual node in the file tree (file or folder)
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Recursive tree node with lazy loading
 * 
 * PROBLEM SOLVED:
 * - Need interactive file tree nodes
 * - Folders should expand/collapse on click
 * - Visual hierarchy with indentation
 * - Lazy loading of folder contents
 * 
 * SOLUTION:
 * - Recursive component that renders children when expanded
 * - Click handler for folders to toggle expansion
 * - Indentation based on depth level
 * - Children loaded on-demand via IPC
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <TreeNode
 *   node={{ name: 'src', path: '/project/src', isDirectory: true }}
 *   depth={0}
 *   onToggle={handleToggle}
 *   isExpanded={true}
 *   children={childNodes}
 * />
 * ```
 * 
 * @performance O(n) where n = visible nodes (lazy loading helps)
 * @security-critical false
 * @performance-critical true - Part of frequently rendered tree
 */

import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { FileIcon } from './FileIcon';

/**
 * File tree node type
 * Represents a file or directory in the tree
 */
export interface FileTreeNode {
  /** File or directory name */
  name: string;
  /** Full path to file/directory */
  path: string;
  /** Whether this is a directory */
  isDirectory: boolean;
  /** Child nodes (for directories, loaded on demand) */
  children?: FileTreeNode[];
}

/**
 * Props for TreeNode component
 */
interface TreeNodeProps {
  /** The file or directory node to render */
  node: FileTreeNode;
  /** Depth level in the tree (0 = root) */
  depth: number;
  /** Whether this node is expanded (only relevant for directories) */
  isExpanded: boolean;
  /** Callback when node is toggled (clicked) */
  onToggle: (node: FileTreeNode) => void;
  /** Child nodes to render (only if expanded) */
  children?: FileTreeNode[];
  /** Whether children are currently loading */
  isLoading?: boolean;
}

/**
 * TreeNode Component
 * 
 * Renders a single node in the file tree with:
 * - Appropriate icon based on file type
 * - Indentation based on depth
 * - Expand/collapse behavior for directories
 * - Recursive rendering of children
 * 
 * INTERACTION:
 * - Click folder to expand/collapse
 * - Files are not interactive (for now)
 * - Hover effect for better UX
 * 
 * @param props - Node configuration
 * @returns TreeNode component
 * 
 * @example
 * ```typescript
 * const node = {
 *   name: 'components',
 *   path: '/project/src/components',
 *   isDirectory: true,
 * };
 * 
 * <TreeNode
 *   node={node}
 *   depth={1}
 *   isExpanded={true}
 *   onToggle={handleToggle}
 *   children={childNodes}
 * />
 * ```
 */
export function TreeNode({
  node,
  depth,
  isExpanded,
  onToggle,
  children = [],
  isLoading = false,
}: TreeNodeProps) {
  /**
   * Handle click on node
   * Only directories can be toggled
   */
  const handleClick = () => {
    if (node.isDirectory) {
      onToggle(node);
    }
  };

  // Calculate indentation padding (16px per level)
  const paddingLeft = depth * 16;

  return (
    <div>
      {/* Node Row */}
      <div
        onClick={handleClick}
        className={`
          flex items-center gap-1.5 px-2 py-1 text-sm
          hover:bg-gray-100 rounded
          ${node.isDirectory ? 'cursor-pointer' : 'cursor-default'}
        `}
        style={{ paddingLeft: `${paddingLeft + 8}px` }}
      >
        {/* Chevron (for directories only) */}
        {node.isDirectory && (
          <ChevronRightIcon
            className={`
              w-3.5 h-3.5 text-gray-400 flex-shrink-0
              transition-transform duration-200
              ${isExpanded ? 'rotate-90' : ''}
            `}
          />
        )}

        {/* Spacer for files (no chevron) */}
        {!node.isDirectory && <div className="w-3.5" />}

        {/* File/Folder Icon */}
        <FileIcon
          name={node.name}
          isDirectory={node.isDirectory}
          isExpanded={isExpanded}
        />

        {/* File/Folder Name */}
        <span className="text-gray-700 truncate flex-1">
          {node.name}
        </span>

        {/* Loading indicator */}
        {isLoading && (
          <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        )}
      </div>

      {/* Children (rendered recursively when expanded) */}
      {isExpanded && node.isDirectory && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              depth={depth + 1}
              isExpanded={false} // Children start collapsed
              onToggle={onToggle}
            />
          ))}
        </div>
      )}

      {/* Empty folder message */}
      {isExpanded && node.isDirectory && children.length === 0 && !isLoading && (
        <div
          className="text-xs text-gray-400 italic py-1"
          style={{ paddingLeft: `${paddingLeft + 32}px` }}
        >
          (empty)
        </div>
      )}
    </div>
  );
}
