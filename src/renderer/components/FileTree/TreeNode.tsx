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

import React, { useState } from 'react';
import { 
  ChevronRightIcon,
  DocumentDuplicateIcon,
  FolderOpenIcon,
} from '@heroicons/react/24/outline';
import { FileIcon } from './FileIcon';
import { findMatchRanges } from '../../utils/searchUtils';
import { ContextMenu, type ContextMenuItem } from '../ContextMenu';

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
  /** Search query for highlighting matches */
  searchQuery?: string;
  /** Root project path for calculating relative paths */
  projectPath?: string;
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
  searchQuery = '',
  projectPath = '',
}: TreeNodeProps) {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // Get electronAPI for IPC calls
  const electronAPI = (window as any).electronAPI;

  /**
   * Handle click on node
   * Only directories can be toggled
   */
  const handleClick = () => {
    if (node.isDirectory) {
      onToggle(node);
    }
  };

  /**
   * Handle right-click to show context menu
   */
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
    });
  };

  /**
   * Copy absolute path to clipboard
   */
  const handleCopyPath = async () => {
    if (electronAPI?.writeClipboardText) {
      await electronAPI.writeClipboardText(node.path);
    }
  };

  /**
   * Copy relative path to clipboard
   */
  const handleCopyRelativePath = async () => {
    if (!projectPath || !electronAPI?.writeClipboardText) return;
    
    // Calculate relative path
    const relativePath = node.path.startsWith(projectPath)
      ? node.path.substring(projectPath.length + 1)
      : node.path;
    
    await electronAPI.writeClipboardText(relativePath);
  };

  /**
   * Reveal file in system file manager
   */
  const handleReveal = async () => {
    if (electronAPI?.showItemInFolder) {
      await electronAPI.showItemInFolder(node.path);
    }
  };

  /**
   * Get platform-specific menu item label for reveal
   */
  const getRevealLabel = (): string => {
    const platform = (window as any).navigator?.platform || '';
    
    if (platform.includes('Mac')) {
      return 'Reveal in Finder';
    } else if (platform.includes('Win')) {
      return 'Show in Explorer';
    } else {
      return 'Show in File Manager';
    }
  };

  // Calculate indentation padding (16px per level)
  const paddingLeft = depth * 16;

  // Get highlighted text segments if searching
  const textSegments = searchQuery.trim() 
    ? findMatchRanges(node.name, searchQuery)
    : [{ text: node.name, isMatch: false }];

  // Context menu items
  const contextMenuItems: ContextMenuItem[] = [
    {
      type: 'item',
      label: 'Copy Path',
      onClick: handleCopyPath,
      icon: DocumentDuplicateIcon,
    },
    {
      type: 'item',
      label: 'Copy Relative Path',
      onClick: handleCopyRelativePath,
      icon: DocumentDuplicateIcon,
      disabled: !projectPath,
    },
    {
      type: 'divider',
    },
    {
      type: 'item',
      label: getRevealLabel(),
      onClick: handleReveal,
      icon: FolderOpenIcon,
    },
  ];

  return (
    <div>
      {/* Node Row */}
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
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

        {/* File/Folder Name with highlighting */}
        <span className="text-gray-700 truncate flex-1">
          {textSegments.map((segment, index) => (
            segment.isMatch ? (
              <mark key={index} className="bg-yellow-200 text-gray-900 font-medium">
                {segment.text}
              </mark>
            ) : (
              <span key={index}>{segment.text}</span>
            )
          ))}
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
              searchQuery={searchQuery}
              projectPath={projectPath}
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

      {/* Context Menu */}
      <ContextMenu
        visible={contextMenu !== null}
        x={contextMenu?.x ?? 0}
        y={contextMenu?.y ?? 0}
        items={contextMenuItems}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
