/**
 * @file types.test.ts
 * @description Unit tests for manifest type helper functions
 * 
 * @architecture Phase 2, Tasks 2.1 & 2.2 - Automated Testing
 * @created 2025-11-26
 * @author AI (Cline) - Automated Test Suite
 * 
 * Tests helper functions: generateComponentId, createEmptyManifest, createComponentMetadata
 * 
 * Coverage Target: 95%+
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  generateComponentId,
  createEmptyManifest,
  createComponentMetadata,
} from '../../../src/core/manifest/types';

describe('Manifest Type Helpers', () => {
  
  // ========================================
  // SECTION 1: generateComponentId
  // ========================================
  
  describe('generateComponentId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateComponentId('button');
      const id2 = generateComponentId('button');
      
      expect(id1).not.toBe(id2);
    });

    it('should generate IDs with correct format (comp_type_timestamp_random)', () => {
      const id = generateComponentId('button');
      
      expect(id).toMatch(/^comp_[a-z0-9]+_\d+_[a-z0-9]+$/);
    });

    it('should include sanitized type in ID', () => {
      const id = generateComponentId('MyCustomButton');
      
      // Should be lowercased and sanitized
      expect(id).toMatch(/^comp_mycustombutton_/);
    });

    it('should handle special characters in type', () => {
      const id = generateComponentId('My-Custom_Button!@#');
      
      // Should remove special characters
      expect(id).toMatch(/^comp_mycustombutton_/);
    });

    it('should generate IDs with timestamp component', () => {
      const beforeTime = Date.now();
      const id = generateComponentId('button');
      const afterTime = Date.now();
      
      // Extract timestamp from ID (format: comp_type_TIMESTAMP_random)
      const parts = id.split('_');
      const timestamp = parseInt(parts[2]);
      
      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('should generate IDs with sufficient length', () => {
      const id = generateComponentId('div');
      
      // Format: comp_div_timestamp_random (minimum reasonable length)
      expect(id.length).toBeGreaterThan(20);
    });
  });

  // ========================================
  // SECTION 2: createEmptyManifest
  // ========================================
  
  describe('createEmptyManifest', () => {
    it('should create valid manifest structure', () => {
      const manifest = createEmptyManifest();
      
      // Check all required top-level fields exist
      expect(manifest).toHaveProperty('schemaVersion');
      expect(manifest).toHaveProperty('level');
      expect(manifest).toHaveProperty('metadata');
      expect(manifest).toHaveProperty('buildConfig');
      expect(manifest).toHaveProperty('plugins');
      expect(manifest).toHaveProperty('components');
    });

    it('should set correct schema version', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.schemaVersion).toBe('1.0.0');
    });

    it('should set Level 1 for MVP', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.level).toBe(1);
    });

    it('should set default project name', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.metadata.projectName).toBe('New Project');
    });

    it('should set framework to react', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.metadata.framework).toBe('react');
    });

    it('should set creation and update timestamps', () => {
      const before = new Date().toISOString();
      const manifest = createEmptyManifest();
      const after = new Date().toISOString();
      
      expect(manifest.metadata.createdAt).toBeDefined();
      expect(manifest.metadata.updatedAt).toBeDefined();
      
      // Timestamps should be between before and after
      expect(manifest.metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(manifest.metadata.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should initialize with empty components object', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.components).toEqual({});
    });

    it('should set correct build config', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.buildConfig.bundler).toBe('vite');
      expect(manifest.buildConfig.cssFramework).toBe('tailwind');
    });

    it('should set correct plugin config', () => {
      const manifest = createEmptyManifest();
      
      expect(manifest.plugins.framework.name).toBe('@rise/plugin-react');
      expect(manifest.plugins.framework.version).toBe('1.0.0');
    });
  });

  // ========================================
  // SECTION 3: createComponentMetadata
  // ========================================
  
  describe('createComponentMetadata', () => {
    it('should create metadata with user author by default', () => {
      const metadata = createComponentMetadata();
      
      expect(metadata.author).toBe('user');
    });

    it('should allow ai author to be specified', () => {
      const metadata = createComponentMetadata('ai');
      
      expect(metadata.author).toBe('ai');
    });

    it('should set timestamps', () => {
      const metadata = createComponentMetadata();
      
      expect(metadata.createdAt).toBeDefined();
      expect(metadata.updatedAt).toBeDefined();
      expect(metadata.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should set default version', () => {
      const metadata = createComponentMetadata();
      
      expect(metadata.version).toBe('1.0.0');
    });

    it('should have consistent created and updated times', () => {
      const metadata = createComponentMetadata();
      
      // For new metadata, created and updated should be the same
      expect(metadata.createdAt).toBe(metadata.updatedAt);
    });
  });
});
