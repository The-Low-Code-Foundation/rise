/**
 * @file FileTree.tsx
 * @description Root file tree container with lazy loading
 * 
 * @architecture Phase 1, Task 1.3A - Core Project Creation
 * @created 2025-11-19
 * @author AI (Cline) + Human Review
 * @confidence 8/10 - Functional tree with lazy loading
 * 
 * PROBLEM SOLVED:
 * - Need to display project file structure
 * - Handle potentially large directory trees
 * - Load children on-demand (lazy loading)
 * - Sort directories before files
 * 
 * SOLUTION:
 * - Recursive TreeNode components
 * - useFileTree hook manages expansion state
 * - IPC calls to load directory contents
 * - Sort: folders first, then alphabetically
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * const projectPath = '/Users/me/my-project';
 * <FileTree projectPath={projectPath} />
 * ```
 * 
 * @performance O(n) where n = visible nodes (lazy loading)
 * @security-critical false (paths validated in main process)
 * @performance-critical true - Renders on every project load
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { TreeNode, FileTreeNode } from './TreeNode';
import { matchesSearch } from '../../utils/searchUtils';

/**
 * Props for FileTree component
 */
interface FileTreeProps {
  /** Root path of the project */
  projectPath: string;
  /** Search query for filtering files */
  searchQuery?: string;
  /** Callback when refresh is requested */
  onRefreshComplete?: () => void;
}

// Get electronAPI for IPC
const electronAPI = (window as any).electronAPI;

/**
 * Sort file tree nodes: directories first, then alphabetically
 * 
 * @param nodes - Array of nodes to sort
 * @returns Sorted array
 */
function sortNodes(nodes: FileTreeNode[]): FileTreeNode[] {
  return [...nodes].sort((a, b) => {
    // Directories come before files
    if (a.isDirectory && !b.isDirectory) return -1;
    if (!a.isDirectory && b.isDirectory) return 1;
    
    // Within same type, sort alphabetically
    return a.name.localeCompare(b.name);
  });
}

/**
 * FileTree Component
 * 
 * Displays project file structure as expandable tree.
 * Lazy loads directory contents on expansion.
 * 
 * FEATURES:
 * - Recursive tree structure
 * - Lazy loading (children loaded on expand)
 * - Sorted (folders first, then alphabetically)
 * - Loading indicators
 * - Empty state handling
 * 
 * PERFORMANCE:
 * - Only visible nodes are rendered
 * - Children fetched on-demand
 * - Target: <100ms for 100 files
 * 
 * @param props - Tree configuration
 * @returns FileTree component
 * 
 * @example
 * ```typescript
 * <FileTree projectPath="/Users/me/my-project" />
 * ```
 */
export function FileTree({ projectPath, searchQuery = '', onRefreshComplete }: FileTreeProps) {
  // Root-level files and folders
  const [rootNodes, setRootNodes] = useState<FileTreeNode[]>([]);
  
  // Track which directories are expanded
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  
  // Track which paths are currently loading
  const [loadingPaths, setLoadingPaths] = useState<Set<string>>(new Set());
  
  // Track children for each expanded directory
  const [childrenMap, setChildrenMap] = useState<Map<string, FileTreeNode[]>>(new Map());
  
  // Loading state for initial load
  const [isLoadingRoot, setIsLoadingRoot] = useState(true);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Track paths that match search (for auto-expand)
  const [matchingPaths, setMatchingPaths] = useState<Set<string>>(new Set());

  /**
   * Load directory contents from main process
   * 
   * @param dirPath - Path to directory
   * @returns Array of child nodes
   */
  const loadDirectory = async (dirPath: string): Promise<FileTreeNode[]> => {
    try {
      if (!electronAPI?.getProjectFiles) {
        console.error('getProjectFiles API not available');
        return [];
      }

      const result = await electronAPI.getProjectFiles(dirPath);
      
      if (result.success && result.files) {
        return sortNodes(result.files);
      } else {
        console.error('Failed to load directory:', result.error);
        return [];
      }
    } catch (err) {
      console.error('Error loading directory:', err);
      return [];
    }
  };

  /**
   * Load root directory on mount
   */
  useEffect(() => {
    const loadRoot = async () => {
      setIsLoadingRoot(true);
      setError(null);
      
      try {
        const nodes = await loadDirectory(projectPath);
        setRootNodes(nodes);
      } catch (err) {
        setError('Failed to load project files');
        console.error(err);
      } finally {
        setIsLoadingRoot(false);
      }
    };

    if (projectPath) {
      loadRoot();
    }
  }, [projectPath]);

  /**
   * Refresh the file tree
   * Preserves expanded state by reloading all expanded directories
   */
  const refreshTree = useCallback(async () => {
    setIsLoadingRoot(true);
    setError(null);
    
    try {
      // Save current expanded paths
      const pathsToReload = new Set(expandedPaths);
      
      // Reload root
      const nodes = await loadDirectory(projectPath);
      setRootNodes(nodes);
      
      // Reload all expanded directories
      const newChildrenMap = new Map<string, FileTreeNode[]>();
      
      for (const path of pathsToReload) {
        const children = await loadDirectory(path);
        newChildrenMap.set(path, children);
      }
      
      setChildrenMap(newChildrenMap);
      
      // Notify parent component
      onRefreshComplete?.();
    } catch (err) {
      setError('Failed to refresh project files');
      console.error(err);
    } finally {
      setIsLoadingRoot(false);
    }
  }, [projectPath, expandedPaths, onRefreshComplete]);

  /**
   * Filter nodes recursively based on search query
   * Auto-expands parent folders containing matches
   * 
   * @param nodes - Nodes to filter
   * @param parentPath - Parent directory path
   * @returns Filtered nodes and paths to expand
   */
  const filterNodesRecursively = useCallback((
    nodes: FileTreeNode[],
    parentPath: string = projectPath
  ): { filteredNodes: FileTreeNode[]; pathsToExpand: Set<string> } => {
    // No search query - return all nodes
    if (!searchQuery.trim()) {
      return { filteredNodes: nodes, pathsToExpand: new Set() };
    }
    
    const pathsToExpand = new Set<string>();
    const filteredNodes: FileTreeNode[] = [];
    
    for (const node of nodes) {
      // Check if filename matches search
      const nodeMatches = matchesSearch(node.name, searchQuery);
      
      // For directories, check children recursively
      let hasMatchingChildren = false;
      if (node.isDirectory) {
        const children = childrenMap.get(node.path) || [];
        if (children.length > 0) {
          const childResult = filterNodesRecursively(children, node.path);
          hasMatchingChildren = childResult.filteredNodes.length > 0;
          
          // Add child expand paths
          childResult.pathsToExpand.forEach(p => pathsToExpand.add(p));
        }
      }
      
      // Include node if it matches or has matching children
      if (nodeMatches || hasMatchingChildren) {
        filteredNodes.push(node);
        
        // If it has matching children, expand this directory
        if (hasMatchingChildren) {
          pathsToExpand.add(node.path);
        }
      }
    }
    
    return { filteredNodes, pathsToExpand };
  }, [searchQuery, childrenMap, projectPath]);

  /**
   * Filtered root nodes based on search query
   * Memoized to prevent excessive re-filtering
   */
  const { filteredRootNodes, matchCount } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { filteredRootNodes: rootNodes, matchCount: 0 };
    }
    
    const { filteredNodes, pathsToExpand } = filterNodesRecursively(rootNodes);
    
    // Update matching paths for auto-expand
    setMatchingPaths(pathsToExpand);
    
    // Auto-expand folders containing matches
    setExpandedPaths(prev => {
      const newExpanded = new Set(prev);
      pathsToExpand.forEach(p => newExpanded.add(p));
      return newExpanded;
    });
    
    // Count matches
    const countMatches = (nodes: FileTreeNode[]): number => {
      let count = 0;
      for (const node of nodes) {
        if (matchesSearch(node.name, searchQuery)) count++;
        if (node.isDirectory && childrenMap.has(node.path)) {
          count += countMatches(childrenMap.get(node.path)!);
        }
      }
      return count;
    };
    
    return {
      filteredRootNodes: filteredNodes,
      matchCount: countMatches(filteredNodes)
    };
  }, [rootNodes, searchQuery, filterNodesRecursively, childrenMap]);

  // Expose refresh method to parent (via ref or callback)
  useEffect(() => {
    // Store refresh function in window for external access
    (window as any).__fileTreeRefresh = refreshTree;
    
    return () => {
      delete (window as any).__fileTreeRefresh;
    };
  }, [refreshTree]);

  /**
   * Handle node toggle (expand/collapse)
   * 
   * @param node - Node being toggled
   */
  const handleToggle = async (node: FileTreeNode) => {
    if (!node.isDirectory) return;

    const isExpanded = expandedPaths.has(node.path);

    if (isExpanded) {
      // Collapse: remove from expanded set
      const newExpanded = new Set(expandedPaths);
      newExpanded.delete(node.path);
      setExpandedPaths(newExpanded);
    } else {
      // Expand: add to expanded set
      const newExpanded = new Set(expandedPaths);
      newExpanded.add(node.path);
      setExpandedPaths(newExpanded);

      // Load children if not already loaded
      if (!childrenMap.has(node.path)) {
        // Mark as loading
        const newLoading = new Set(loadingPaths);
        newLoading.add(node.path);
        setLoadingPaths(newLoading);

        // Load children
        const children = await loadDirectory(node.path);

        // Update children map
        const newChildrenMap = new Map(childrenMap);
        newChildrenMap.set(node.path, children);
        setChildrenMap(newChildrenMap);

        // Remove from loading
        const updatedLoading = new Set(loadingPaths);
        updatedLoading.delete(node.path);
        setLoadingPaths(updatedLoading);
      }
    }
  };

  /**
   * Render a tree node with its children
   * 
   * @param node - Node to render
   * @param depth - Current depth in tree
   * @returns TreeNode element
   */
  const renderNode = (node: FileTreeNode, depth: number = 0) => {
    const isExpanded = expandedPaths.has(node.path);
    const isLoading = loadingPaths.has(node.path);
    const children = childrenMap.get(node.path) || [];

    return (
      <TreeNode
        key={node.path}
        node={node}
        depth={depth}
        isExpanded={isExpanded}
        onToggle={handleToggle}
        children={children}
        isLoading={isLoading}
        searchQuery={searchQuery}
        projectPath={projectPath}
      />
    );
  };

  // Loading state
  if (isLoadingRoot) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          Loading files...
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-4 text-sm text-red-600">
        {error}
      </div>
    );
  }

  // Empty state
  if (rootNodes.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 italic">
        No files found
      </div>
    );
  }

  // No results after filtering
  if (searchQuery.trim() && filteredRootNodes.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500 text-center">
        <p className="font-medium">No results found</p>
        <p className="text-xs mt-1">Try a different search term</p>
      </div>
    );
  }

  // Render tree (with search results count if searching)
  const nodesToRender = searchQuery.trim() ? filteredRootNodes : rootNodes;

  return (
    <div>
      {/* Search results count */}
      {searchQuery.trim() && matchCount > 0 && (
        <div className="px-2 py-1 text-xs text-gray-600 border-b border-gray-200 bg-blue-50">
          {matchCount} {matchCount === 1 ? 'result' : 'results'}
        </div>
      )}
      
      {/* Tree nodes */}
      <div className="space-y-0.5">
        {nodesToRender.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
