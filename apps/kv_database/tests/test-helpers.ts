/**
 * Test Helpers and Utilities
 * Consolidated test utilities for consistent mocking and test data
 */

import { vi } from "vitest";
import crypto from "node:crypto";

// =============================================================================
// MOCK DATA GENERATORS
// =============================================================================

/**
 * Generate mock embeddings array
 */
export function createMockEmbeddings(dimensions: number = 768): number[] {
  return Array.from({ length: dimensions }, () => Math.random() - 0.5);
}

/**
 * Generate mock image buffer
 */
export function createMockImageBuffer(): Buffer {
  return Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
}

/**
 * Generate mock PDF data
 */
export function createMockPDFData(overrides: Partial<any> = {}) {
  return {
    text: "This is mock PDF text content",
    numpages: 3,
    info: {
      Title: "Mock PDF Title",
      Author: "Mock Author",
      Subject: "Mock Subject",
      Creator: "Mock Creator",
      Producer: "Mock Producer",
      CreationDate: new Date("2024-01-01"),
      ModDate: new Date("2024-01-02"),
    },
    ...overrides,
  };
}

/**
 * Generate mock OCR result
 */
export function createMockOCRResult(overrides: Partial<any> = {}) {
  return {
    data: {
      text: "Mock OCR text content",
      confidence: 0.85,
    },
    ...overrides,
  };
}

/**
 * Generate mock audio data
 */
export function createMockAudioData(length: number = 1000): Float32Array {
  return new Float32Array(Array.from({ length }, () => Math.random() - 0.5));
}

// =============================================================================
// MOCK FACTORIES
// =============================================================================

/**
 * Create mock search result
 */
export function createMockSearchResult(overrides: Partial<any> = {}) {
  return {
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
  };
}

/**
 * Create mock Obsidian file
 */
export function createMockObsidianFile(overrides: Partial<any> = {}) {
  return {
    filePath: "/path/to/test.md",
    fileName: "test",
    content: "# Test Content\n\nThis is test content.",
    frontmatter: { title: "Test" },
    wikilinks: ["Another Note"],
    tags: ["test", "example"],
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Create mock database
 */
export function createMockDatabase(overrides: Partial<any> = {}) {
  return {
    initialize: vi.fn().mockResolvedValue(undefined),
    upsertChunk: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue([]),
    getChunkById: vi.fn().mockResolvedValue(null),
    getChunksByFile: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({
      totalChunks: 100,
      byContentType: { note: 80, moc: 20 },
      byFolder: { Root: 50, Notes: 30 },
      tagDistribution: { test: 10, example: 5 },
    }),
    clearAll: vi.fn().mockResolvedValue(undefined),
    deleteChunksByFile: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    getPerformanceMetrics: vi.fn().mockReturnValue({
      totalQueries: 50,
      slowQueries: 2,
      p95Latency: 100,
      averageLatency: 75,
      minLatency: 10,
      maxLatency: 200,
    }),
    ...overrides,
  };
}

/**
 * Create mock embedding service
 */
export function createMockEmbeddingService(overrides: Partial<any> = {}) {
  return {
    embed: vi.fn().mockResolvedValue(createMockEmbeddings()),
    embedBatch: vi.fn().mockResolvedValue([createMockEmbeddings()]),
    embedWithStrategy: vi.fn().mockResolvedValue({
      embedding: createMockEmbeddings(),
      model: { name: "test-model", dimension: 768 },
      confidence: 0.9,
    }),
    testConnection: vi.fn().mockResolvedValue({
      success: true,
      dimension: 768,
      model: "test-model",
    }),
    clearCache: vi.fn(),
    getCacheStats: vi.fn().mockReturnValue({ size: 0, keys: [] }),
    getPerformanceMetrics: vi.fn().mockReturnValue({
      totalRequests: 100,
      cacheHits: 80,
      cacheMisses: 20,
      cacheHitRate: 80,
      slowEmbeds: 2,
      p95Latency: 150,
      averageLatency: 100,
      minLatency: 20,
      maxLatency: 300,
    }),
    ...overrides,
  };
}

// =============================================================================
// MOCK SETUP HELPERS
// =============================================================================

/**
 * Mock crypto module for consistent hashing in tests
 */
export function mockCrypto() {
  const originalCrypto = vi.hoisted(() => crypto);
  return {
    createHash: vi.fn().mockReturnValue({
      update: vi.fn().mockReturnValue({
        digest: vi.fn().mockReturnValue("mock-hash-12345"),
      }),
    }),
    createHmac: originalCrypto.createHmac,
    randomBytes: originalCrypto.randomBytes,
  };
}

/**
 * Mock file system operations
 */
export function mockFileSystem(overrides: Partial<any> = {}) {
  const mockFs = {
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    statSync: vi.fn(),
    existsSync: vi.fn(),
    readdirSync: vi.fn(),
    mkdirSync: vi.fn(),
    unlinkSync: vi.fn(),
    ...overrides,
  };

  // Set default mock implementations
  mockFs.statSync.mockImplementation((path: string) => ({
    isFile: () => true,
    isDirectory: () => false,
    size: 1024,
    birthtime: new Date("2024-01-01"),
    mtime: new Date("2024-01-01"),
  }));

  mockFs.existsSync.mockImplementation(() => true);
  mockFs.readdirSync.mockImplementation(() => []);

  return mockFs;
}

/**
 * Mock external dependencies
 */
export function mockExternalDependencies() {
  const mocks = {
    // PDF parsing
    pdfParse: {
      default: vi.fn().mockResolvedValue(createMockPDFData()),
    },

    // OCR
    tesseract: {
      createWorker: vi.fn().mockResolvedValue({
        recognize: vi.fn().mockResolvedValue(createMockOCRResult()),
        setParameters: vi.fn(),
        terminate: vi.fn(),
      }),
    },

    // Office documents
    mammoth: {
      extractRawText: vi.fn().mockResolvedValue({
        value: "Mock document text content",
      }),
    },

    // Spreadsheets
    xlsx: {
      read: vi.fn().mockReturnValue({
        SheetNames: ["Sheet1"],
        Sheets: { Sheet1: {} },
      }),
      utils: {
        sheet_to_csv: vi.fn().mockReturnValue("col1,col2\nval1,val2"),
      },
    },

    // Speech processing
    sherpaOnnx: {
      createModel: vi.fn().mockReturnValue({
        createStream: vi.fn().mockReturnValue({
          acceptWaveform: vi.fn(),
          inputFinished: vi.fn(),
        }),
      }),
      createRecognizer: vi.fn().mockReturnValue({
        createStream: vi.fn().mockReturnValue({
          acceptWaveform: vi.fn(),
          inputFinished: vi.fn(),
          decode: vi.fn().mockReturnValue({
            text: "Mock speech transcription",
            tokens: ["Mock", "speech", "transcription"],
          }),
        }),
      }),
    },

    // AI/ML services
    ollama: {
      embed: vi.fn().mockResolvedValue({
        embeddings: [createMockEmbeddings()],
      }),
    },

    // Database
    pg: {
      Pool: vi.fn().mockImplementation(() => ({
        connect: vi.fn().mockResolvedValue({
          query: vi.fn().mockResolvedValue({ rows: [] }),
          release: vi.fn(),
        }),
        end: vi.fn(),
      })),
    },
  };

  return mocks;
}

// =============================================================================
// TEST DATA VALIDATORS
// =============================================================================

/**
 * Validate that an object has required properties
 */
export function validateObject(obj: any, requiredProps: string[]): boolean {
  return requiredProps.every((prop) => obj.hasOwnProperty(prop));
}

/**
 * Validate array length
 */
export function validateArrayLength(
  arr: any[],
  expectedLength: number
): boolean {
  return Array.isArray(arr) && arr.length === expectedLength;
}

/**
 * Validate numeric range
 */
export function validateNumericRange(
  value: number,
  min: number,
  max: number
): boolean {
  return typeof value === "number" && value >= min && value <= max;
}

// =============================================================================
// PERFORMANCE TEST HELPERS
// =============================================================================

/**
 * Measure test execution time
 */
export async function measureTestTime<T>(
  testFn: () => Promise<T>
): Promise<{ result: T; duration: number }> {
  const start = performance.now();
  const result = await testFn();
  const duration = performance.now() - start;
  return { result, duration };
}

/**
 * Create performance test suite
 */
export function createPerformanceSuite(
  testName: string,
  testFn: (iterations: number) => Promise<void>
) {
  return {
    [`${testName} - 100 iterations`]: () => testFn(100),
    [`${testName} - 1000 iterations`]: () => testFn(1000),
    [`${testName} - 10000 iterations`]: () => testFn(10000),
  };
}

// =============================================================================
// TYPE GUARDS
// =============================================================================

/**
 * Type guard for search results
 */
export function isSearchResult(obj: any): obj is SearchResult {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.text === "string" &&
    typeof obj.meta === "object" &&
    typeof obj.cosineSimilarity === "number" &&
    typeof obj.rank === "number"
  );
}

/**
 * Type guard for Obsidian documents
 */
export function isObsidianDocument(obj: any): obj is ObsidianDocument {
  return (
    obj &&
    typeof obj.id === "string" &&
    typeof obj.path === "string" &&
    typeof obj.name === "string" &&
    typeof obj.content === "string" &&
    typeof obj.frontmatter === "object"
  );
}

// =============================================================================
// TEST CONSTANTS
// =============================================================================

export const TEST_CONSTANTS = {
  MOCK_DATABASE_URL: "postgresql://test:test@localhost:5432/test_db",
  MOCK_EMBEDDING_DIMENSIONS: 768,
  MOCK_FILE_SIZE: 1024,
  MOCK_CHUNK_SIZE: 800,
  MOCK_BATCH_SIZE: 5,
  MOCK_RATE_LIMIT_MS: 100,
  MOCK_SIMILARITY_THRESHOLD: 0.8,
} as const;

// =============================================================================
// ERROR SIMULATION
// =============================================================================

/**
 * Create simulated errors for testing error handling
 */
export class TestError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "TestError";
  }
}

export function createTestError(message: string, code?: string): TestError {
  return new TestError(message, code);
}

/**
 * Simulate network delays
 */
export async function simulateDelay(ms: number = 50): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Simulate random failures for resilience testing
 */
export function simulateRandomFailure(failureRate: number = 0.1): void {
  if (Math.random() < failureRate) {
    throw new TestError("Simulated random failure", "TEST_FAILURE");
  }
}
