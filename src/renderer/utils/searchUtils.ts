/**
 * @file searchUtils.ts
 * @description Search utilities for file tree filtering with wildcard and regex support
 * 
 * @architecture Phase 1, Task 1.3C - Advanced Navigator Features
 * @created 2025-11-24
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard search pattern matching with edge case handling
 * 
 * PROBLEM SOLVED:
 * - Need flexible file search in Navigator
 * - Support plain text, wildcards, and regex patterns
 * - Case-insensitive matching
 * - Filename only (not full path)
 * 
 * SOLUTION:
 * - Detect search type from query syntax
 * - Convert wildcards to regex
 * - Safe regex execution with try/catch
 * - Highlight matching text for visual feedback
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * matchesSearch('Button.tsx', '*.tsx') // true
 * matchesSearch('test1.ts', 'test?.ts') // true
 * matchesSearch('Component.tsx', '/^[A-Z].*\.tsx$/') // true
 * ```
 * 
 * @performance O(1) for type detection, O(n) for regex matching where n = filename length
 * @security-critical false (user-controlled search, sandboxed)
 * @performance-critical true - Called for every file on search
 */

/**
 * Search type detection result
 */
export type SearchType = 'plain' | 'wildcard' | 'regex';

/**
 * Detect the type of search query
 * 
 * RULES:
 * - Regex: Starts with / and ends with / (e.g., /pattern/)
 * - Wildcard: Contains * or ? (e.g., *.tsx, test?.ts)
 * - Plain: Everything else (e.g., button, component)
 * 
 * @param query - Search query string
 * @returns Search type
 * 
 * @example
 * ```typescript
 * detectSearchType('/^test/') // 'regex'
 * detectSearchType('*.tsx') // 'wildcard'
 * detectSearchType('button') // 'plain'
 * ```
 */
export function detectSearchType(query: string): SearchType {
  // Empty query is plain text
  if (!query) return 'plain';
  
  // Regex pattern: starts and ends with /
  if (query.startsWith('/') && query.endsWith('/') && query.length > 2) {
    return 'regex';
  }
  
  // Wildcard: contains * or ?
  if (query.includes('*') || query.includes('?')) {
    return 'wildcard';
  }
  
  // Default: plain text
  return 'plain';
}

/**
 * Convert wildcard pattern to regex
 * 
 * CONVERSIONS:
 * - * → .* (match any characters)
 * - ? → . (match single character)
 * - Escape special regex characters
 * 
 * @param pattern - Wildcard pattern (e.g., *.tsx, test?.ts)
 * @returns RegExp object
 * 
 * @example
 * ```typescript
 * wildcardToRegex('*.tsx') // /^.*\.tsx$/i
 * wildcardToRegex('test?.ts') // /^test.\.ts$/i
 * ```
 */
export function wildcardToRegex(pattern: string): RegExp {
  // Escape special regex characters except * and ?
  let regexStr = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*') // * → .* (any characters)
    .replace(/\?/g, '.'); // ? → . (single character)
  
  // Anchor pattern to start and end
  regexStr = `^${regexStr}$`;
  
  // Case-insensitive matching
  return new RegExp(regexStr, 'i');
}

/**
 * Check if a filename matches the search query
 * 
 * Supports three search modes:
 * 1. Plain text: Case-insensitive substring match
 * 2. Wildcard: * and ? pattern matching
 * 3. Regex: Full regex pattern matching
 * 
 * @param filename - Name of file to test (without path)
 * @param query - Search query
 * @returns true if filename matches query
 * 
 * @throws Never - Invalid regex returns false instead of throwing
 * 
 * @example
 * ```typescript
 * // Plain text
 * matchesSearch('Button.tsx', 'button') // true
 * matchesSearch('Input.tsx', 'button') // false
 * 
 * // Wildcard
 * matchesSearch('Button.tsx', '*.tsx') // true
 * matchesSearch('test1.ts', 'test?.ts') // true
 * 
 * // Regex
 * matchesSearch('Button.tsx', '/^[A-Z].*\.tsx$/') // true
 * matchesSearch('button.tsx', '/^[A-Z].*\.tsx$/') // false
 * ```
 */
export function matchesSearch(filename: string, query: string): boolean {
  // Empty query matches everything
  if (!query.trim()) return true;
  
  // Detect search type
  const type = detectSearchType(query);
  
  // Apply appropriate matching logic
  switch (type) {
    case 'plain':
      // Case-insensitive substring match
      return filename.toLowerCase().includes(query.toLowerCase());
    
    case 'wildcard':
      // Convert wildcard to regex and test
      try {
        const regex = wildcardToRegex(query);
        return regex.test(filename);
      } catch (error) {
        console.warn('Invalid wildcard pattern:', query, error);
        // Fallback to plain text on error
        return filename.toLowerCase().includes(query.toLowerCase());
      }
    
    case 'regex':
      // Extract pattern from /pattern/ syntax
      const pattern = query.slice(1, -1);
      
      try {
        // Case-insensitive regex matching
        const regex = new RegExp(pattern, 'i');
        return regex.test(filename);
      } catch (error) {
        console.warn('Invalid regex pattern:', pattern, error);
        // Return false for invalid regex (don't crash)
        return false;
      }
    
    default:
      return true;
  }
}

/**
 * Find matching portions of text for highlighting
 * 
 * Returns array of text segments with match flags for rendering.
 * Only works for plain text and wildcard searches (regex is too complex to highlight).
 * 
 * @param text - Text to search in
 * @param query - Search query
 * @returns Array of text segments with match flag
 * 
 * @example
 * ```typescript
 * findMatchRanges('Button.tsx', 'button')
 * // [{ text: 'Button', isMatch: true }, { text: '.tsx', isMatch: false }]
 * 
 * findMatchRanges('test.ts', '*.ts')
 * // [{ text: 'test.ts', isMatch: true }] // Full match for wildcard
 * ```
 */
export function findMatchRanges(
  text: string,
  query: string
): Array<{ text: string; isMatch: boolean }> {
  // No query or no text - return as-is
  if (!query.trim() || !text) {
    return [{ text, isMatch: false }];
  }
  
  const type = detectSearchType(query);
  
  // Only highlight plain text matches (regex/wildcard too complex)
  if (type !== 'plain') {
    // For wildcard/regex, just check if it matches
    const matches = matchesSearch(text, query);
    return [{ text, isMatch: matches }];
  }
  
  // Plain text: find all occurrences (case-insensitive)
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  
  const segments: Array<{ text: string; isMatch: boolean }> = [];
  let currentPos = 0;
  
  // Find all matches
  while (currentPos < text.length) {
    const matchIndex = lowerText.indexOf(lowerQuery, currentPos);
    
    if (matchIndex === -1) {
      // No more matches - add remaining text
      if (currentPos < text.length) {
        segments.push({
          text: text.substring(currentPos),
          isMatch: false,
        });
      }
      break;
    }
    
    // Add non-matching text before match
    if (matchIndex > currentPos) {
      segments.push({
        text: text.substring(currentPos, matchIndex),
        isMatch: false,
      });
    }
    
    // Add matching text
    segments.push({
      text: text.substring(matchIndex, matchIndex + query.length),
      isMatch: true,
    });
    
    currentPos = matchIndex + query.length;
  }
  
  return segments;
}

/**
 * Get search type icon for UI feedback
 * 
 * @param query - Search query
 * @returns Emoji icon representing search type
 */
export function getSearchTypeIcon(query: string): string {
  const type = detectSearchType(query);
  
  switch (type) {
    case 'regex':
      return '🔍'; // Regex
    case 'wildcard':
      return '✨'; // Wildcard
    case 'plain':
    default:
      return '📝'; // Plain text
  }
}
