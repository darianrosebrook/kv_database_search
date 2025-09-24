// @ts-nocheck
import { beforeAll, afterAll, vi } from "vitest";

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

// Global test utilities
global.testUtils = {
  // Helper to create mock database URLs
  mockDatabaseUrl: () => "postgresql://test:test@localhost:5432/test_db",

  // Helper to create mock embeddings
  mockEmbeddings: (dimensions: number = 768) =>
    Array.from({ length: dimensions }, () => Math.random() - 0.5),

  // Helper to create mock search results
  mockSearchResult: (overrides = {}) => ({
    id: "test-chunk-1",
    text: "This is a test chunk of content",
    meta: {
      uri: "obsidian://test/file.md",
      section: "Test Section",
      breadcrumbs: ["Root", "Test"],
      contentType: "note",
      sourceType: "obsidian",
      sourceDocumentId: "test-file",
      lang: "en",
      acl: "public",
      updatedAt: new Date("2024-01-01"),
      createdAt: new Date("2024-01-01"),
    },
    cosineSimilarity: 0.85,
    rank: 1,
    ...overrides,
  }),

  // Helper to create mock Obsidian file
  mockObsidianFile: (overrides = {}) => ({
    filePath: "/path/to/test.md",
    fileName: "test",
    content: "# Test Content\n\nThis is test content.",
    frontmatter: { title: "Test" },
    wikilinks: [["Another Note"]],
    tags: ["test", "example"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  }),
};
