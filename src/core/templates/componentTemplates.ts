/**
 * @file componentTemplates.ts
 * @description Simplified component templates for Rise low-code builder
 * 
 * @architecture Phase 3.5 - Component Property Templates (Simplified)
 * @created 2025-11-29
 * @author AI (Cline) + Human Review
 * @confidence 9/10 - Simplified to 10 core elements with real CSS properties
 * 
 * PROBLEM SOLVED:
 * - Previous 25 templates had fake "variant/size" properties that didn't map to CSS
 * - Missing fundamental layout properties (width, height, position)
 * - Too many redundant elements (h1-h6 separately, card/section/header as separate elements)
 * 
 * SOLUTION:
 * - Reduced to 10 essential elements
 * - Use real CSS properties that actually work
 * - Hybrid approach: Tailwind classes for common values, inline styles for arbitrary values
 * - Text element uses `as` prop to switch between p/h1-h6/span
 * 
 * ELEMENT SET (10 elements):
 * - Basic (6): Container, Text, Button, Link, Image, Icon
 * - Form (4): Input, Textarea, Checkbox, Select
 * 
 * @security-critical false
 * @performance-critical false - Templates are static data
 */

import type { ComponentTemplate } from './types';

// ============================================================================
// BASIC COMPONENTS
// ============================================================================

/**
 * Container (div) Component Template
 * 
 * The fundamental building block - a generic container for layout.
 * Defaults to flex column for easy stacking of children.
 */
export const containerTemplate: ComponentTemplate = {
  type: 'div',
  displayName: 'Container',
  icon: 'square-2-stack',
  category: 'layout',
  description: 'A flexible container for grouping and laying out content',
  properties: [],
  defaultStyles: {
    width: 'auto',
    minHeight: '50px',
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    gap: '8px',
  },
  defaultClasses: [],
};

/**
 * Text Component Template
 * 
 * Unified text element that can render as p, h1-h6, or span.
 * The `as` property controls the HTML element.
 */
export const textTemplate: ComponentTemplate = {
  type: 'text',
  displayName: 'Text',
  icon: 'document-text',
  category: 'basic',
  description: 'Text content - can be paragraph, heading, or inline text',
  properties: [
    {
      name: 'content',
      dataType: 'string',
      default: 'Enter text here',
      description: 'The text content to display',
      required: true,
      category: 'basics',
    },
    {
      name: 'as',
      dataType: 'enum',
      default: 'p',
      options: [
        { value: 'p', label: 'Paragraph' },
        { value: 'h1', label: 'Heading 1' },
        { value: 'h2', label: 'Heading 2' },
        { value: 'h3', label: 'Heading 3' },
        { value: 'h4', label: 'Heading 4' },
        { value: 'h5', label: 'Heading 5' },
        { value: 'h6', label: 'Heading 6' },
        { value: 'span', label: 'Inline (span)' },
      ],
      description: 'HTML element to render as',
      required: false,
      category: 'basics',
    },
  ],
  defaultStyles: {
    fontSize: '16px',
    fontWeight: 'normal',
    color: '#374151',
    lineHeight: '1.5',
    margin: '0',
  },
  defaultClasses: [],
};

/**
 * Button Component Template
 * 
 * Standard clickable button element with sensible defaults.
 */
export const buttonTemplate: ComponentTemplate = {
  type: 'button',
  displayName: 'Button',
  icon: 'cursor-click',
  category: 'basic',
  description: 'A clickable button for user actions',
  properties: [
    {
      name: 'label',
      dataType: 'string',
      default: 'Click me',
      description: 'Text displayed on the button',
      required: true,
      category: 'basics',
    },
    {
      name: 'type',
      dataType: 'enum',
      default: 'button',
      options: [
        { value: 'button', label: 'Button' },
        { value: 'submit', label: 'Submit' },
        { value: 'reset', label: 'Reset' },
      ],
      description: 'Button type attribute',
      required: false,
      category: 'basics',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the button is disabled',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#ffffff',
    backgroundColor: '#3b82f6',
    borderWidth: '0',
    borderRadius: '6px',
  },
  defaultClasses: ['cursor-pointer', 'hover:bg-blue-600', 'transition-colors'],
};

/**
 * Link Component Template
 * 
 * Anchor element for navigation.
 */
export const linkTemplate: ComponentTemplate = {
  type: 'a',
  displayName: 'Link',
  icon: 'link',
  category: 'basic',
  description: 'A hyperlink to another page or section',
  properties: [
    {
      name: 'text',
      dataType: 'string',
      default: 'Click here',
      description: 'Link text',
      required: true,
      category: 'basics',
    },
    {
      name: 'href',
      dataType: 'string',
      default: '#',
      description: 'Link destination URL',
      required: true,
      category: 'basics',
      placeholder: 'https://example.com',
    },
    {
      name: 'target',
      dataType: 'enum',
      default: '_self',
      options: [
        { value: '_self', label: 'Same Tab' },
        { value: '_blank', label: 'New Tab' },
      ],
      description: 'Where to open the link',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    color: '#2563eb',
    fontSize: '16px',
  },
  defaultClasses: ['hover:underline'],
};

/**
 * Image Component Template
 * 
 * Displays an image with configurable sizing.
 */
export const imageTemplate: ComponentTemplate = {
  type: 'img',
  displayName: 'Image',
  icon: 'photo',
  category: 'basic',
  description: 'An image element',
  properties: [
    {
      name: 'src',
      dataType: 'string',
      default: 'https://via.placeholder.com/300x200',
      description: 'Image URL or path',
      required: true,
      category: 'basics',
      placeholder: 'https://example.com/image.jpg',
    },
    {
      name: 'alt',
      dataType: 'string',
      default: 'Image description',
      description: 'Alt text for accessibility',
      required: true,
      category: 'basics',
    },
  ],
  defaultStyles: {
    width: 'auto',
    height: 'auto',
    maxWidth: '100%',
    objectFit: 'cover',
    borderRadius: '0',
  },
  defaultClasses: [],
};

/**
 * Icon Component Template
 * 
 * Heroicons icon element. Uses name string to reference icon.
 * Code generation will import from @heroicons/react.
 */
export const iconTemplate: ComponentTemplate = {
  type: 'icon',
  displayName: 'Icon',
  icon: 'star',
  category: 'basic',
  description: 'A Heroicon icon',
  properties: [
    {
      name: 'name',
      dataType: 'string',
      default: 'star',
      description: 'Heroicon name (e.g., star, heart, check)',
      required: true,
      category: 'basics',
      placeholder: 'star, heart, home, check',
    },
    {
      name: 'variant',
      dataType: 'enum',
      default: 'outline',
      options: [
        { value: 'outline', label: 'Outline' },
        { value: 'solid', label: 'Solid' },
      ],
      description: 'Icon style variant',
      required: false,
      category: 'basics',
    },
  ],
  defaultStyles: {
    width: '24px',
    height: '24px',
    color: '#374151',
  },
  defaultClasses: [],
};

// ============================================================================
// FORM COMPONENTS
// ============================================================================

/**
 * Input Component Template
 * 
 * Single-line text input field.
 */
export const inputTemplate: ComponentTemplate = {
  type: 'input',
  displayName: 'Input',
  icon: 'pencil-square',
  category: 'form',
  description: 'A single-line text input field',
  properties: [
    {
      name: 'placeholder',
      dataType: 'string',
      default: 'Enter text...',
      description: 'Placeholder text when empty',
      required: false,
      category: 'basics',
    },
    {
      name: 'type',
      dataType: 'enum',
      default: 'text',
      options: [
        { value: 'text', label: 'Text' },
        { value: 'email', label: 'Email' },
        { value: 'password', label: 'Password' },
        { value: 'number', label: 'Number' },
        { value: 'tel', label: 'Phone' },
        { value: 'url', label: 'URL' },
        { value: 'date', label: 'Date' },
      ],
      description: 'Input type',
      required: false,
      category: 'basics',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the input is disabled',
      required: false,
      category: 'behavior',
    },
    {
      name: 'required',
      dataType: 'boolean',
      default: false,
      description: 'Whether the input is required',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    borderWidth: '1px',
    borderColor: '#d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
  },
  defaultClasses: ['focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-transparent'],
};

/**
 * Textarea Component Template
 * 
 * Multi-line text input field.
 */
export const textareaTemplate: ComponentTemplate = {
  type: 'textarea',
  displayName: 'Textarea',
  icon: 'bars-3-bottom-left',
  category: 'form',
  description: 'A multi-line text input field',
  properties: [
    {
      name: 'placeholder',
      dataType: 'string',
      default: 'Enter text...',
      description: 'Placeholder text when empty',
      required: false,
      category: 'basics',
    },
    {
      name: 'rows',
      dataType: 'number',
      default: 4,
      description: 'Number of visible text rows',
      required: false,
      category: 'basics',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the textarea is disabled',
      required: false,
      category: 'behavior',
    },
    {
      name: 'required',
      dataType: 'boolean',
      default: false,
      description: 'Whether the textarea is required',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    borderWidth: '1px',
    borderColor: '#d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    resize: 'vertical',
  },
  defaultClasses: ['focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-transparent'],
};

/**
 * Checkbox Component Template
 * 
 * Boolean input with label.
 */
export const checkboxTemplate: ComponentTemplate = {
  type: 'checkbox',
  displayName: 'Checkbox',
  icon: 'check-circle',
  category: 'form',
  description: 'A checkbox input for boolean values',
  properties: [
    {
      name: 'label',
      dataType: 'string',
      default: 'Checkbox label',
      description: 'Label text next to the checkbox',
      required: true,
      category: 'basics',
    },
    {
      name: 'checked',
      dataType: 'boolean',
      default: false,
      description: 'Default checked state',
      required: false,
      category: 'basics',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the checkbox is disabled',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    width: '16px',
    height: '16px',
    accentColor: '#3b82f6',
  },
  defaultClasses: [],
};

/**
 * Select Component Template
 * 
 * Dropdown selection field.
 */
export const selectTemplate: ComponentTemplate = {
  type: 'select',
  displayName: 'Select',
  icon: 'chevron-down',
  category: 'form',
  description: 'A dropdown select field',
  properties: [
    {
      name: 'placeholder',
      dataType: 'string',
      default: 'Select an option...',
      description: 'Placeholder text when nothing selected',
      required: false,
      category: 'basics',
    },
    {
      name: 'disabled',
      dataType: 'boolean',
      default: false,
      description: 'Whether the select is disabled',
      required: false,
      category: 'behavior',
    },
    {
      name: 'required',
      dataType: 'boolean',
      default: false,
      description: 'Whether a selection is required',
      required: false,
      category: 'behavior',
    },
  ],
  defaultStyles: {
    width: '100%',
    padding: '8px 12px',
    fontSize: '14px',
    borderWidth: '1px',
    borderColor: '#d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
  },
  defaultClasses: ['focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500'],
};

// ============================================================================
// COMPONENT TEMPLATES ARRAY
// ============================================================================

/**
 * All component templates
 * 
 * Simplified to 10 essential elements:
 * - Basic (6): Container, Text, Button, Link, Image, Icon
 * - Form (4): Input, Textarea, Checkbox, Select
 */
export const COMPONENT_TEMPLATES: ComponentTemplate[] = [
  containerTemplate,
  textTemplate,
  buttonTemplate,
  linkTemplate,
  imageTemplate,
  iconTemplate,
  inputTemplate,
  textareaTemplate,
  checkboxTemplate,
  selectTemplate,
];

/**
 * Template count for documentation
 * Total: 10 templates (down from 25)
 */
export const TEMPLATE_COUNT = COMPONENT_TEMPLATES.length;

// ============================================================================
// STYLE PROPERTY DEFINITIONS (for autocomplete)
// ============================================================================

/**
 * Style property definition for autocomplete
 */
export interface StylePropertyDef {
  name: string;
  type: 'string' | 'enum';
  default: string;
  options?: string[];
  presets?: string[];
  description?: string;
}

/**
 * Style property category definition
 */
export interface StyleCategoryDef {
  label: string;
  properties: StylePropertyDef[];
}

/**
 * All available style properties, organized by category
 * Used by the StylingEditor to show available options with autocomplete
 */
export const STYLE_PROPERTY_CATEGORIES: Record<string, StyleCategoryDef> = {
  layout: {
    label: 'Layout',
    properties: [
      { name: 'width', type: 'string', default: 'auto', presets: ['auto', '100%', '50%', 'fit-content', '100px', '200px', '300px'] },
      { name: 'height', type: 'string', default: 'auto', presets: ['auto', '100%', 'fit-content', '100px', '200px'] },
      { name: 'minWidth', type: 'string', default: '0', presets: ['0', '100px', '200px', '300px'] },
      { name: 'maxWidth', type: 'string', default: 'none', presets: ['none', '100%', '400px', '600px', '800px', '1200px'] },
      { name: 'minHeight', type: 'string', default: '0', presets: ['0', '50px', '100px', '200px'] },
      { name: 'maxHeight', type: 'string', default: 'none', presets: ['none', '100%', '200px', '400px', '600px'] },
    ],
  },
  display: {
    label: 'Display & Position',
    properties: [
      { name: 'display', type: 'enum', default: 'block', options: ['block', 'flex', 'grid', 'inline', 'inline-flex', 'inline-block', 'none'] },
      { name: 'position', type: 'enum', default: 'static', options: ['static', 'relative', 'absolute', 'fixed', 'sticky'] },
      { name: 'top', type: 'string', default: 'auto', presets: ['auto', '0', '50%', '100%'] },
      { name: 'right', type: 'string', default: 'auto', presets: ['auto', '0', '50%', '100%'] },
      { name: 'bottom', type: 'string', default: 'auto', presets: ['auto', '0', '50%', '100%'] },
      { name: 'left', type: 'string', default: 'auto', presets: ['auto', '0', '50%', '100%'] },
      { name: 'zIndex', type: 'string', default: 'auto', presets: ['auto', '0', '1', '10', '50', '100'] },
    ],
  },
  flexbox: {
    label: 'Flexbox',
    properties: [
      { name: 'flexDirection', type: 'enum', default: 'row', options: ['row', 'column', 'row-reverse', 'column-reverse'] },
      { name: 'flexWrap', type: 'enum', default: 'nowrap', options: ['nowrap', 'wrap', 'wrap-reverse'] },
      { name: 'justifyContent', type: 'enum', default: 'flex-start', options: ['flex-start', 'center', 'flex-end', 'space-between', 'space-around', 'space-evenly'] },
      { name: 'alignItems', type: 'enum', default: 'stretch', options: ['flex-start', 'center', 'flex-end', 'stretch', 'baseline'] },
      { name: 'alignContent', type: 'enum', default: 'stretch', options: ['flex-start', 'center', 'flex-end', 'stretch', 'space-between', 'space-around'] },
      { name: 'gap', type: 'string', default: '0', presets: ['0', '4px', '8px', '12px', '16px', '24px', '32px'] },
      { name: 'flex', type: 'string', default: '0 1 auto', presets: ['0 1 auto', '1', '1 1 0%', 'none'] },
      { name: 'flexGrow', type: 'string', default: '0', presets: ['0', '1'] },
      { name: 'flexShrink', type: 'string', default: '1', presets: ['0', '1'] },
    ],
  },
  spacing: {
    label: 'Spacing',
    properties: [
      { name: 'padding', type: 'string', default: '0', presets: ['0', '4px', '8px', '12px', '16px', '24px', '32px'] },
      { name: 'paddingTop', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', '24px'] },
      { name: 'paddingRight', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', '24px'] },
      { name: 'paddingBottom', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', '24px'] },
      { name: 'paddingLeft', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', '24px'] },
      { name: 'margin', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', '24px', 'auto'] },
      { name: 'marginTop', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', 'auto'] },
      { name: 'marginRight', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', 'auto'] },
      { name: 'marginBottom', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', 'auto'] },
      { name: 'marginLeft', type: 'string', default: '0', presets: ['0', '4px', '8px', '16px', 'auto'] },
    ],
  },
  typography: {
    label: 'Typography',
    properties: [
      { name: 'fontSize', type: 'string', default: '16px', presets: ['12px', '14px', '16px', '18px', '20px', '24px', '32px', '48px', '64px'] },
      { name: 'fontWeight', type: 'enum', default: 'normal', options: ['100', '200', '300', 'normal', '500', '600', 'bold', '800', '900'] },
      { name: 'fontStyle', type: 'enum', default: 'normal', options: ['normal', 'italic'] },
      { name: 'textAlign', type: 'enum', default: 'left', options: ['left', 'center', 'right', 'justify'] },
      { name: 'textDecoration', type: 'enum', default: 'none', options: ['none', 'underline', 'line-through', 'overline'] },
      { name: 'textTransform', type: 'enum', default: 'none', options: ['none', 'uppercase', 'lowercase', 'capitalize'] },
      { name: 'lineHeight', type: 'string', default: '1.5', presets: ['1', '1.25', '1.5', '1.75', '2', '24px', '32px'] },
      { name: 'letterSpacing', type: 'string', default: 'normal', presets: ['normal', '-0.05em', '0.05em', '0.1em'] },
      { name: 'color', type: 'string', default: '#374151', presets: ['#000000', '#374151', '#6b7280', '#9ca3af', '#ffffff'] },
    ],
  },
  background: {
    label: 'Background',
    properties: [
      { name: 'backgroundColor', type: 'string', default: 'transparent', presets: ['transparent', '#ffffff', '#f3f4f6', '#e5e7eb', '#3b82f6', '#ef4444', '#10b981'] },
      { name: 'backgroundImage', type: 'string', default: 'none', presets: ['none'] },
      { name: 'backgroundSize', type: 'enum', default: 'auto', options: ['auto', 'cover', 'contain'] },
      { name: 'backgroundPosition', type: 'enum', default: 'center', options: ['center', 'top', 'bottom', 'left', 'right'] },
      { name: 'backgroundRepeat', type: 'enum', default: 'repeat', options: ['repeat', 'no-repeat', 'repeat-x', 'repeat-y'] },
    ],
  },
  border: {
    label: 'Border',
    properties: [
      { name: 'borderWidth', type: 'string', default: '0', presets: ['0', '1px', '2px', '4px'] },
      { name: 'borderStyle', type: 'enum', default: 'solid', options: ['none', 'solid', 'dashed', 'dotted', 'double'] },
      { name: 'borderColor', type: 'string', default: '#e5e7eb', presets: ['#e5e7eb', '#d1d5db', '#9ca3af', '#3b82f6', '#000000'] },
      { name: 'borderRadius', type: 'string', default: '0', presets: ['0', '2px', '4px', '6px', '8px', '12px', '16px', '9999px'] },
      { name: 'borderTopWidth', type: 'string', default: '0', presets: ['0', '1px', '2px'] },
      { name: 'borderRightWidth', type: 'string', default: '0', presets: ['0', '1px', '2px'] },
      { name: 'borderBottomWidth', type: 'string', default: '0', presets: ['0', '1px', '2px'] },
      { name: 'borderLeftWidth', type: 'string', default: '0', presets: ['0', '1px', '2px'] },
    ],
  },
  effects: {
    label: 'Effects',
    properties: [
      { name: 'opacity', type: 'string', default: '1', presets: ['1', '0.9', '0.75', '0.5', '0.25', '0'] },
      { name: 'boxShadow', type: 'string', default: 'none', presets: ['none', '0 1px 2px rgba(0,0,0,0.05)', '0 4px 6px rgba(0,0,0,0.1)', '0 10px 15px rgba(0,0,0,0.1)', '0 25px 50px rgba(0,0,0,0.25)'] },
      { name: 'overflow', type: 'enum', default: 'visible', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'overflowX', type: 'enum', default: 'visible', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'overflowY', type: 'enum', default: 'visible', options: ['visible', 'hidden', 'scroll', 'auto'] },
      { name: 'cursor', type: 'enum', default: 'auto', options: ['auto', 'default', 'pointer', 'text', 'move', 'not-allowed', 'grab'] },
    ],
  },
};

/**
 * Common Tailwind classes for autocomplete
 * Organized by category for easy lookup
 */
export const TAILWIND_CLASS_SUGGESTIONS: Record<string, string[]> = {
  // Layout
  display: ['block', 'inline-block', 'inline', 'flex', 'inline-flex', 'grid', 'hidden'],
  position: ['static', 'fixed', 'absolute', 'relative', 'sticky'],
  
  // Flexbox
  flexDirection: ['flex-row', 'flex-row-reverse', 'flex-col', 'flex-col-reverse'],
  flexWrap: ['flex-wrap', 'flex-wrap-reverse', 'flex-nowrap'],
  justifyContent: ['justify-start', 'justify-center', 'justify-end', 'justify-between', 'justify-around', 'justify-evenly'],
  alignItems: ['items-start', 'items-center', 'items-end', 'items-baseline', 'items-stretch'],
  gap: ['gap-0', 'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8'],
  
  // Width & Height
  width: ['w-auto', 'w-full', 'w-screen', 'w-1/2', 'w-1/3', 'w-2/3', 'w-1/4', 'w-3/4'],
  height: ['h-auto', 'h-full', 'h-screen', 'h-1/2'],
  
  // Spacing
  padding: ['p-0', 'p-1', 'p-2', 'p-4', 'p-6', 'p-8', 'px-4', 'py-2', 'pt-4', 'pr-4', 'pb-4', 'pl-4'],
  margin: ['m-0', 'm-1', 'm-2', 'm-4', 'm-auto', 'mx-auto', 'my-4', 'mt-4', 'mr-4', 'mb-4', 'ml-4'],
  
  // Typography
  fontSize: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'],
  fontWeight: ['font-thin', 'font-light', 'font-normal', 'font-medium', 'font-semibold', 'font-bold'],
  textAlign: ['text-left', 'text-center', 'text-right', 'text-justify'],
  textColor: ['text-black', 'text-white', 'text-gray-500', 'text-gray-700', 'text-gray-900', 'text-blue-500', 'text-red-500', 'text-green-500'],
  
  // Background
  backgroundColor: ['bg-transparent', 'bg-white', 'bg-black', 'bg-gray-50', 'bg-gray-100', 'bg-gray-200', 'bg-blue-500', 'bg-red-500', 'bg-green-500'],
  
  // Border
  borderWidth: ['border-0', 'border', 'border-2', 'border-4'],
  borderRadius: ['rounded-none', 'rounded-sm', 'rounded', 'rounded-md', 'rounded-lg', 'rounded-xl', 'rounded-full'],
  borderColor: ['border-transparent', 'border-gray-200', 'border-gray-300', 'border-gray-400', 'border-blue-500'],
  
  // Effects
  shadow: ['shadow-none', 'shadow-sm', 'shadow', 'shadow-md', 'shadow-lg', 'shadow-xl', 'shadow-2xl'],
  opacity: ['opacity-0', 'opacity-25', 'opacity-50', 'opacity-75', 'opacity-100'],
  
  // Interactive
  hover: ['hover:bg-gray-100', 'hover:bg-blue-600', 'hover:text-blue-500', 'hover:underline', 'hover:opacity-75'],
  focus: ['focus:outline-none', 'focus:ring-2', 'focus:ring-blue-500', 'focus:border-blue-500'],
  transition: ['transition', 'transition-colors', 'transition-all', 'transition-transform', 'duration-150', 'duration-300'],
  cursor: ['cursor-pointer', 'cursor-default', 'cursor-not-allowed', 'cursor-grab'],
};
