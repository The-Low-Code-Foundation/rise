/**
 * @file AppGenerator.ts
 * @description Generates App.jsx and main.jsx entry point files for the React application
 *              App.jsx imports and renders all root-level components
 *              main.jsx is the Vite/React entry point
 * 
 * @architecture Phase 3, Task 3.2 - File Management with Hash Watcher
 * @created 2025-11-27
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Straightforward code generation
 * 
 * @see docs/FILE_STRUCTURE_SPEC.md - Generated file structure
 * @see src/core/codegen/ReactCodeGenerator.ts - Component code generation
 * 
 * PROBLEM SOLVED:
 * - Generated components need an App.jsx to import and render them
 * - The React application needs a main.jsx entry point
 * - These files must have @lowcode markers
 * - Content must be formatted with Prettier
 * 
 * SOLUTION:
 * - AppGenerator.generateAppJsx() creates App.jsx with:
 *   - Import statements for all root components
 *   - Render of all root components in order
 *   - @lowcode comment markers
 * - AppGenerator.generateMainJsx() creates main.jsx with:
 *   - React/ReactDOM import
 *   - App import
 *   - ReactDOM.createRoot render call
 * 
 * ROOT COMPONENTS:
 * Root components are those with no parent (not children of any other component).
 * They are the top-level components that App.jsx renders directly.
 * 
 * @security-critical false
 * @performance-critical false
 */

import * as prettier from 'prettier';
import type { IAppGenerator } from './types';

/**
 * Root component info for App.jsx generation
 */
export interface RootComponentInfo {
  /** Component ID */
  id: string;
  
  /** Component display name (used for import and JSX) */
  displayName: string;
}

/**
 * Convert a string to PascalCase for valid React component names
 * 
 * @param str - Input string
 * @returns PascalCase string
 */
function toPascalCase(str: string): string {
  if (!str) return str;
  // Capitalize first letter, keep rest as-is
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Configuration options for AppGenerator
 */
export interface AppGeneratorOptions {
  /** Whether to format output with Prettier (default: true) */
  usePrettier?: boolean;
  
  /** Enable debug logging (default: false) */
  debug?: boolean;
  
  /** Prettier configuration */
  prettierConfig?: prettier.Options;
}

/**
 * Default prettier configuration for generated files
 */
const DEFAULT_PRETTIER_CONFIG: prettier.Options = {
  parser: 'babel',
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  printWidth: 80,
  tabWidth: 2,
};

/**
 * AppGenerator creates App.jsx and main.jsx for the React application
 * 
 * USAGE:
 * ```typescript
 * const generator = new AppGenerator();
 * 
 * // Generate App.jsx
 * const rootComponents = [
 *   { id: 'comp_1', displayName: 'Header' },
 *   { id: 'comp_2', displayName: 'MainContent' },
 *   { id: 'comp_3', displayName: 'Footer' },
 * ];
 * const appCode = await generator.generateAppJsx(rootComponents);
 * 
 * // Generate main.jsx
 * const mainCode = await generator.generateMainJsx();
 * ```
 * 
 * GENERATED App.jsx STRUCTURE:
 * ```jsx
 * import React from 'react';
 * 
 * // @lowcode comment header
 * 
 * import { Header } from './components/Header';
 * import { MainContent } from './components/MainContent';
 * import { Footer } from './components/Footer';
 * 
 * export default function App() {
 *   return (
 *     <div className="app">
 *       <Header />
 *       <MainContent />
 *       <Footer />
 *     </div>
 *   );
 * }
 * ```
 * 
 * @class AppGenerator
 * @implements {IAppGenerator}
 */
export class AppGenerator implements IAppGenerator {
  /**
   * Configuration options
   */
  private options: Required<AppGeneratorOptions>;

  /**
   * Create a new AppGenerator instance
   * 
   * @param options - Configuration options
   */
  constructor(options: AppGeneratorOptions = {}) {
    this.options = {
      usePrettier: options.usePrettier ?? true,
      debug: options.debug ?? false,
      prettierConfig: {
        ...DEFAULT_PRETTIER_CONFIG,
        ...options.prettierConfig,
      },
    };

    if (this.options.debug) {
      console.log('[AppGenerator] Initialized');
    }
  }

  /**
   * Generate App.jsx with root component imports
   * 
   * @param rootComponents - Array of root component info
   * @returns Promise<string> - Formatted App.jsx code
   * 
   * @example
   * ```typescript
   * const code = await generator.generateAppJsx([
   *   { id: 'comp_1', displayName: 'Header' },
   *   { id: 'comp_2', displayName: 'Footer' },
   * ]);
   * ```
   */
  async generateAppJsx(rootComponents: RootComponentInfo[]): Promise<string> {
    const startTime = performance.now();

    // Sort components alphabetically by display name for consistent output
    const sortedComponents = [...rootComponents].sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );

    // Build imports section
    const imports = this.buildImports(sortedComponents);

    // Build JSX section
    const jsx = this.buildJsx(sortedComponents);

    // Build comment header
    const header = this.buildCommentHeader();

    // Assemble complete file
    // Use "RootApp" wrapper name to avoid conflicts with user components named "App"
    const code = `import React from 'react';

${header}
${imports}

function RootApp() {
  return (
    <div className="app">
${jsx}
    </div>
  );
}

export default RootApp;
`;

    // Format with Prettier if enabled
    let formattedCode = code;
    if (this.options.usePrettier) {
      try {
        formattedCode = await prettier.format(code, this.options.prettierConfig);
      } catch (error) {
        console.warn(
          '[AppGenerator] Prettier formatting failed, using unformatted code:',
          error
        );
      }
    }

    if (this.options.debug) {
      const duration = performance.now() - startTime;
      console.log(
        `[AppGenerator] generateAppJsx completed in ${duration.toFixed(2)}ms\n` +
        `  Root components: ${rootComponents.length}`
      );
    }

    return formattedCode;
  }

  /**
   * Generate main.jsx entry point
   * 
   * @returns Promise<string> - Formatted main.jsx code
   * 
   * @example
   * ```typescript
   * const code = await generator.generateMainJsx();
   * ```
   */
  async generateMainJsx(): Promise<string> {
    const startTime = performance.now();

    // Build comment header
    const header = this.buildMainCommentHeader();

    // main.jsx is fairly standard
    const code = `import React from 'react';
import ReactDOM from 'react-dom/client';

${header}
import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

    // Format with Prettier if enabled
    let formattedCode = code;
    if (this.options.usePrettier) {
      try {
        formattedCode = await prettier.format(code, this.options.prettierConfig);
      } catch (error) {
        console.warn(
          '[AppGenerator] Prettier formatting failed for main.jsx, using unformatted code:',
          error
        );
      }
    }

    if (this.options.debug) {
      const duration = performance.now() - startTime;
      console.log(`[AppGenerator] generateMainJsx completed in ${duration.toFixed(2)}ms`);
    }

    return formattedCode;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Build import statements for root components
   * 
   * Uses PascalCase for component names to ensure valid React components.
   * 
   * @param components - Sorted root components
   * @returns Import statements as string
   */
  private buildImports(components: RootComponentInfo[]): string {
    if (components.length === 0) {
      return '// No root components yet';
    }

    const imports = components.map((comp) => {
      // Convert to PascalCase for valid React component name
      const componentName = toPascalCase(comp.displayName);
      // Import from ./components/{displayName} (file uses original name)
      return `import { ${componentName} } from './components/${comp.displayName}';`;
    });

    return imports.join('\n');
  }

  /**
   * Build JSX for rendering root components
   * 
   * Uses PascalCase for JSX tags to ensure they're interpreted as React components
   * (not as HTML elements like <div>).
   * 
   * @param components - Sorted root components
   * @returns JSX elements as string (with indentation)
   */
  private buildJsx(components: RootComponentInfo[]): string {
    if (components.length === 0) {
      return '      {/* No components yet - add components in Rise */}';
    }

    const jsx = components.map((comp) => {
      // Convert to PascalCase for valid React JSX tag
      const componentName = toPascalCase(comp.displayName);
      // Render each component as self-closing JSX
      return `      <${componentName} />`;
    });

    return jsx.join('\n');
  }

  /**
   * Build @lowcode comment header for App.jsx
   * 
   * @returns Comment header string
   */
  private buildCommentHeader(): string {
    const timestamp = new Date().toISOString();

    return `/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: ${timestamp}
 * Main application component - imports all root-level components
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */`;
  }

  /**
   * Build @lowcode comment header for main.jsx
   * 
   * @returns Comment header string
   */
  private buildMainCommentHeader(): string {
    const timestamp = new Date().toISOString();

    return `/**
 * @lowcode:generated
 * @lowcode:level: 1
 * @lowcode:last-generated: ${timestamp}
 * Application entry point
 * DO NOT EDIT: This file is auto-generated. Changes will be overwritten.
 */`;
  }

  /**
   * Update Prettier configuration
   * 
   * @param config - New Prettier configuration
   */
  setPrettierConfig(config: prettier.Options): void {
    this.options.prettierConfig = {
      ...DEFAULT_PRETTIER_CONFIG,
      ...config,
    };
  }

  /**
   * Enable or disable Prettier formatting
   * 
   * @param enabled - Whether to use Prettier
   */
  setUsePrettier(enabled: boolean): void {
    this.options.usePrettier = enabled;
  }
}

/**
 * Factory function to create AppGenerator instance
 */
export function createAppGenerator(options?: AppGeneratorOptions): AppGenerator {
  return new AppGenerator(options);
}

/**
 * Quick helper to generate App.jsx
 * 
 * @param rootComponents - Array of root component info
 * @param options - Optional configuration
 * @returns Promise<string> - Formatted App.jsx code
 */
export async function generateAppJsx(
  rootComponents: RootComponentInfo[],
  options?: AppGeneratorOptions
): Promise<string> {
  const generator = new AppGenerator(options);
  return generator.generateAppJsx(rootComponents);
}

/**
 * Quick helper to generate main.jsx
 * 
 * @param options - Optional configuration
 * @returns Promise<string> - Formatted main.jsx code
 */
export async function generateMainJsx(options?: AppGeneratorOptions): Promise<string> {
  const generator = new AppGenerator(options);
  return generator.generateMainJsx();
}
