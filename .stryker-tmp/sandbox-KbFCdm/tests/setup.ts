// @ts-nocheck
import { beforeAll, afterAll, vi } from "vitest";

// Import consolidated test utilities
import {
  createMockEmbeddings,
  createMockSearchResult,
  createMockObsidianFile,
  TEST_CONSTANTS,
} from "./test-helpers";

// Mock environment variables for testing
process.env.NODE_ENV = "test";

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test utilities using consolidated helpers
global.testUtils = {
  // Helper to create mock database URLs
  mockDatabaseUrl: () => TEST_CONSTANTS.MOCK_DATABASE_URL,

  // Helper to create mock embeddings
  mockEmbeddings: createMockEmbeddings,

  // Helper to create mock search results
  mockSearchResult: createMockSearchResult,

  // Helper to create mock Obsidian file
  mockObsidianFile: createMockObsidianFile,

  // Access to test constants
  constants: TEST_CONSTANTS,
};
