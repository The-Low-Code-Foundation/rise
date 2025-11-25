/**
 * @file ContextMenu.tsx
 * @description Reusable context menu component for right-click actions
 * 
 * @architecture Phase 1, Task 1.3C - Advanced Navigator Features
 * @created 2025-11-24
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Standard context menu pattern
 * 
 * PROBLEM SOLVED:
 * - Need right-click context menu for file tree nodes
 * - Platform-specific menu options (Finder/Explorer)
 * - Copy path functionality
 * - Click-outside to close behavior
 * 
 * SOLUTION:
 * - Positioned absolute div at cursor location
 * - Escape key and click-outside to close
 * - Dividers between menu sections
 * - Icons for visual clarity
 * 
 * USAGE EXAMPLE:
 * ```typescript
 * <ContextMenu
 *   visible={true}
 *   x={100}
 *   y={200}
 *   onClose={() => setVisible(false)}
 *   items={[
 *     { label: 'Copy Path', onClick: handleCopy, icon: DocumentDuplicateIcon },
 *     { type: 'divider' },
 *     { label: 'Reveal in Finder', onClick: handleReveal, icon: FolderOpenIcon },
 *   ]}
 * />
 * ```
 * 
 * @performance O(1) render, lightweight component
 * @security-critical false
 * @performance-critical false
 */

import React, { useEffect, useRef } from 'react';

/**
 * Context menu item types
 */
export type ContextMenuItem = 
  | { type: 'item'; label: string; onClick: () => void; icon?: React.ComponentType<{ className?: string }>; disabled?: boolean }
  | { type: 'divider' };

/**
 * Props for ContextMenu component
 */
interface ContextMenuProps {
  /** Whether the menu is visible */
  visible: boolean;
  /** X coordinate (pixels from left) */
  x: number;
  /** Y coordinate (pixels from top) */
  y: number;
  /** Menu items */
  items: ContextMenuItem[];
  /** Callback when menu should close */
  onClose: () => void;
}

/**
 * ContextMenu Component
 * 
 * Displays a positioned context menu with actions.
 * Automatically closes on:
 * - Click outside
 * - Escape key
 * - Item click
 * 
 * FEATURES:
 * - Positioned at cursor
 * - Keyboard navigation (Escape to close)
 * - Click outside to close
 * - Dividers for visual grouping
 * - Icons for better UX
 * - Disabled state support
 * 
 * @param props - Menu configuration
 * @returns ContextMenu component or null if not visible
 * 
 * @example
 * ```typescript
 * const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
 * 
 * <ContextMenu
 *   visible={menu !== null}
 *   x={menu?.x ?? 0}
 *   y={menu?.y ?? 0}
 *   items={menuItems}
 *   onClose={() => setMenu(null)}
 * />
 * ```
 */
export function ContextMenu({ visible, x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  /**
   * Handle click outside menu
   */
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      // Close if click is outside menu
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Add small delay before enabling click-outside detection
    // This prevents immediate closure if menu was opened by click
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, onClose]);

  /**
   * Handle Escape key
   */
  useEffect(() => {
    if (!visible) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  /**
   * Handle item click
   * Closes menu and executes action
   */
  const handleItemClick = (item: ContextMenuItem) => {
    if (item.type !== 'item' || item.disabled) return;

    // Close menu
    onClose();

    // Execute action
    item.onClick();
  };

  // Don't render if not visible
  if (!visible) return null;

  // Adjust position if menu would go off-screen
  const menuWidth = 200; // Approximate width
  const menuHeight = items.length * 40; // Approximate height
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  let adjustedX = x;
  let adjustedY = y;

  // Adjust X if too far right
  if (x + menuWidth > windowWidth) {
    adjustedX = windowWidth - menuWidth - 10;
  }

  // Adjust Y if too far down
  if (y + menuHeight > windowHeight) {
    adjustedY = windowHeight - menuHeight - 10;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
      style={{
        left: `${adjustedX}px`,
        top: `${adjustedY}px`,
      }}
    >
      {items.map((item, index) => {
        if (item.type === 'divider') {
          return (
            <div
              key={`divider-${index}`}
              className="my-1 border-t border-gray-200"
            />
          );
        }

        const Icon = item.icon;

        return (
          <button
            key={index}
            onClick={() => handleItemClick(item)}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-4 py-2 text-sm text-left
              transition-colors
              ${item.disabled
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 hover:bg-blue-50'
              }
            `}
          >
            {Icon && (
              <Icon className={`w-4 h-4 flex-shrink-0 ${item.disabled ? 'text-gray-400' : 'text-gray-500'}`} />
            )}
            <span className="flex-1">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
