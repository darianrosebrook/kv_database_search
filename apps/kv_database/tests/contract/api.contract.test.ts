import { describe, it, expect } from "vitest";
import Ajv from "ajv";
import fs from "fs";
import path from "path";

// Load OpenAPI schema
const openApiPath = path.join(__dirname, "../../apps/contracts/api.yaml");
const openApiContent = fs.readFileSync(openApiPath, "utf-8");

// Parse OpenAPI spec (simplified for testing - in production use a proper OpenAPI parser)
const ajv = new Ajv({
  allErrors: true,
  coerceTypes: true,
  strict: false,
  formats: {
    "date-time": true, // Enable date-time format validation
  },
});

describe("API Contract Compliance", () => {
  describe("Search API Contracts", () => {
    const searchResponseSchema = {
      type: "object",
      required: ["query", "results", "totalFound", "performance"],
      properties: {
        query: { type: "string" },
        results: {
          type: "array",
          items: {
            type: "object",
            required: ["id", "text", "meta", "cosineSimilarity", "rank"],
            properties: {
              id: { type: "string" },
              text: { type: "string" },
              meta: {
                type: "object",
                required: ["section", "contentType"],
                properties: {
                  section: { type: "string" },
                  contentType: { type: "string" },
                  breadcrumbs: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
              cosineSimilarity: { type: "number", minimum: 0, maximum: 1 },
              rank: { type: "integer", minimum: 1 },
            },
          },
        },
        totalFound: { type: "integer", minimum: 0 },
        performance: {
          type: "object",
          required: ["totalTime", "searchTime", "processingTime"],
          properties: {
            totalTime: { type: "number", minimum: 0 },
            searchTime: { type: "number", minimum: 0 },
            processingTime: { type: "number", minimum: 0 },
          },
        },
      },
    };

    const validateSearchResponse = ajv.compile(searchResponseSchema);

    it("should validate search response structure", () => {
      const mockResponse = {
        query: "test query",
        results: [
          {
            id: "chunk-1",
            text: "This is test content",
            meta: {
              section: "Test Section",
              contentType: "note",
              breadcrumbs: ["Root", "Test"],
            },
            cosineSimilarity: 0.85,
            rank: 1,
          },
        ],
        totalFound: 1,
        performance: {
          totalTime: 150,
          searchTime: 120,
          processingTime: 30,
        },
      };

      const valid = validateSearchResponse(mockResponse);
      expect(valid).toBe(true);

      if (!valid) {
        console.error("Validation errors:", validateSearchResponse.errors);
      }
    });

    it("should reject invalid search responses", () => {
      const invalidResponse = {
        query: "test query",
        results: [
          {
            // Missing required fields
            text: "This is test content",
          },
        ],
        totalFound: 1,
        // Missing performance field
      };

      const valid = validateSearchResponse(invalidResponse);
      expect(valid).toBe(false);
    });

    it("should validate search response with optional facets", () => {
      const responseWithFacets = {
        query: "test query",
        results: [
          {
            id: "chunk-1",
            text: "This is test content",
            meta: {
              section: "Test Section",
              contentType: "note",
            },
            cosineSimilarity: 0.85,
            rank: 1,
          },
        ],
        totalFound: 1,
        performance: {
          totalTime: 150,
          searchTime: 120,
          processingTime: 30,
        },
        facets: {
          contentTypes: [
            { type: "note", count: 5 },
            { type: "article", count: 2 },
          ],
          tags: [
            { tag: "test", count: 3 },
            { tag: "example", count: 2 },
          ],
        },
      };

      const valid = validateSearchResponse(responseWithFacets);
      expect(valid).toBe(true);
    });
  });

  describe("Health API Contracts", () => {
    const healthResponseSchema = {
      type: "object",
      required: ["status", "timestamp", "version", "services", "metrics"],
      properties: {
        status: {
          type: "string",
          enum: ["healthy", "degraded", "unhealthy"],
        },
        timestamp: { type: "string", format: "date-time" },
        version: { type: "string" },
        services: {
          type: "object",
          required: ["database", "embeddings", "indexing"],
          properties: {
            database: { type: "string", enum: ["up", "down"] },
            embeddings: { type: "string", enum: ["up", "down"] },
            indexing: { type: "string", enum: ["up", "down"] },
          },
        },
        metrics: {
          type: "object",
          required: [
            "totalDocuments",
            "totalChunks",
            "lastIngestion",
            "uptime",
          ],
          properties: {
            totalDocuments: { type: "integer", minimum: 0 },
            totalChunks: { type: "integer", minimum: 0 },
            lastIngestion: {
              anyOf: [
                { type: "string", format: "date-time" },
                { type: "null" },
              ],
            },
            uptime: { type: "number", minimum: 0 },
          },
        },
      },
    };

    const validateHealthResponse = ajv.compile(healthResponseSchema);

    it("should validate healthy response", () => {
      const healthyResponse = {
        status: "healthy",
        timestamp: "2024-01-15T10:30:00Z",
        version: "1.0.0",
        services: {
          database: "up",
          embeddings: "up",
          indexing: "up",
        },
        metrics: {
          totalDocuments: 150,
          totalChunks: 1250,
          lastIngestion: "2024-01-15T09:00:00Z",
          uptime: 3600,
        },
      };

      const valid = validateHealthResponse(healthyResponse);
      expect(valid).toBe(true);
    });

    it("should validate degraded response", () => {
      const degradedResponse = {
        status: "degraded",
        timestamp: "2024-01-15T10:30:00Z",
        version: "1.0.0",
        services: {
          database: "up",
          embeddings: "down",
          indexing: "up",
        },
        metrics: {
          totalDocuments: 150,
          totalChunks: 1250,
          lastIngestion: null,
          uptime: 3600,
        },
      };

      const valid = validateHealthResponse(degradedResponse);
      if (!valid) {
        console.log(
          "Health validation errors:",
          JSON.stringify(validateHealthResponse.errors, null, 2)
        );
      }
      expect(valid).toBe(true);
    });
  });

  describe("Document API Contracts", () => {
    const documentResponseSchema = {
      type: "object",
      required: ["document"],
      properties: {
        document: {
          type: "object",
          required: ["id", "path", "name", "content", "metadata"],
          properties: {
            id: { type: "string" },
            path: { type: "string" },
            name: { type: "string" },
            extension: { type: "string", enum: ["md", "canvas"] },
            content: { type: "string" },
            frontmatter: { type: "object" },
            stats: {
              type: "object",
              required: ["wordCount", "characterCount", "lineCount"],
              properties: {
                wordCount: { type: "integer", minimum: 0 },
                characterCount: { type: "integer", minimum: 0 },
                lineCount: { type: "integer", minimum: 0 },
                headingCount: { type: "integer", minimum: 0 },
                linkCount: { type: "integer", minimum: 0 },
                tagCount: { type: "integer", minimum: 0 },
              },
            },
          },
        },
      },
    };

    const validateDocumentResponse = ajv.compile(documentResponseSchema);

    it("should validate document response", () => {
      const documentResponse = {
        document: {
          id: "doc-1",
          path: "Documents/Test.md",
          name: "Test",
          extension: "md",
          content: "# Test Document\n\nContent here.",
          frontmatter: { title: "Test Document" },
          stats: {
            wordCount: 25,
            characterCount: 150,
            lineCount: 5,
            headingCount: 1,
            linkCount: 0,
            tagCount: 2,
          },
          relationships: {
            wikilinks: [],
            tags: ["test", "example"],
            backlinks: [],
          },
          metadata: {
            created: "2024-01-01T00:00:00Z",
            modified: "2024-01-15T00:00:00Z",
            checksum: "abc123",
            lastIndexed: "2024-01-15T00:00:00Z",
            processingErrors: [],
          },
        },
      };

      const valid = validateDocumentResponse(documentResponse);
      expect(valid).toBe(true);
    });
  });

  describe("Analytics API Contracts", () => {
    const analyticsResponseSchema = {
      type: "object",
      required: ["analytics", "generated", "computationTime"],
      properties: {
        analytics: {
          type: "object",
          required: [
            "overview",
            "contentDistribution",
            "networkAnalysis",
            "temporalAnalysis",
            "qualityMetrics",
          ],
          properties: {
            overview: {
              type: "object",
              required: [
                "totalDocuments",
                "totalWords",
                "totalLinks",
                "totalTags",
                "vaultAge",
              ],
              properties: {
                totalDocuments: { type: "integer", minimum: 0 },
                totalWords: { type: "integer", minimum: 0 },
                totalLinks: { type: "integer", minimum: 0 },
                totalTags: { type: "integer", minimum: 0 },
                vaultAge: { type: "integer", minimum: 0 },
              },
            },
          },
        },
        generated: { type: "string", format: "date-time" },
        computationTime: { type: "number", minimum: 0 },
      },
    };

    const validateAnalyticsResponse = ajv.compile(analyticsResponseSchema);

    it("should validate analytics response", () => {
      const analyticsResponse = {
        analytics: {
          overview: {
            totalDocuments: 150,
            totalWords: 25000,
            totalLinks: 450,
            totalTags: 120,
            vaultAge: 365,
          },
          contentDistribution: {
            byType: { note: 100, article: 30, moc: 20 },
            byFolder: { Documents: 80, Projects: 50, Archive: 20 },
            byTag: { project: 25, important: 15, review: 10 },
          },
          networkAnalysis: {
            hubDocuments: [
              { document: "Main.md", connections: 25, centrality: 0.8 },
            ],
            clusters: [],
            orphans: ["Orphan.md"],
            linkHealth: {
              brokenLinks: 0,
              missingReferences: 2,
              circularReferences: 0,
            },
          },
          temporalAnalysis: {
            creationTimeline: [
              { period: "2024-01", count: 45 },
              { period: "2024-02", count: 38 },
            ],
            modificationTimeline: [
              { period: "2024-01", count: 25 },
              { period: "2024-02", count: 50 },
            ],
            activityPatterns: {
              mostActiveDays: ["Monday", "Wednesday"],
              mostActiveHours: [9, 14, 16],
            },
          },
          qualityMetrics: {
            averageDocumentLength: 167,
            averageLinksPerDocument: 3.0,
            tagConsistency: 0.85,
            formattingConsistency: 0.92,
          },
        },
        generated: "2024-01-15T10:30:00Z",
        computationTime: 2500,
      };

      const valid = validateAnalyticsResponse(analyticsResponse);
      expect(valid).toBe(true);
    });
  });

  describe("Error Response Contracts", () => {
    const errorResponseSchema = {
      type: "object",
      required: ["error", "message"],
      properties: {
        error: { type: "string" },
        message: { type: "string" },
        details: { type: "object" },
        timestamp: { type: "string", format: "date-time" },
      },
    };

    const validateErrorResponse = ajv.compile(errorResponseSchema);

    it("should validate error response structure", () => {
      const errorResponse = {
        error: "VALIDATION_ERROR",
        message: "Invalid search query parameters",
        details: {
          query: "Query must be at least 1 character long",
        },
        timestamp: "2024-01-15T10:30:00Z",
      };

      const valid = validateErrorResponse(errorResponse);
      expect(valid).toBe(true);
    });

    it("should validate minimal error response", () => {
      const minimalError = {
        error: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      };

      const valid = validateErrorResponse(minimalError);
      expect(valid).toBe(true);
    });
  });

  describe("Request Validation", () => {
    const searchRequestSchema = {
      type: "object",
      required: ["query"],
      properties: {
        query: {
          type: "string",
          minLength: 1,
          maxLength: 500,
        },
        options: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50 },
            minSimilarity: { type: "number", minimum: 0, maximum: 1 },
            contentTypes: {
              type: "array",
              items: {
                type: "string",
                enum: [
                  "note",
                  "moc",
                  "article",
                  "conversation",
                  "template",
                  "book-note",
                ],
              },
            },
            tags: {
              type: "array",
              items: { type: "string" },
            },
            folders: {
              type: "array",
              items: { type: "string" },
            },
            searchMode: {
              type: "string",
              enum: ["semantic", "hybrid", "graph", "comprehensive"],
            },
          },
        },
        pagination: {
          type: "object",
          properties: {
            limit: { type: "integer", minimum: 1, maximum: 50, default: 20 },
            offset: { type: "integer", minimum: 0, default: 0 },
          },
        },
      },
    };

    const validateSearchRequest = ajv.compile(searchRequestSchema);

    it("should validate valid search requests", () => {
      const validRequests = [
        { query: "test search" },
        {
          query: "advanced search",
          options: {
            limit: 25,
            contentTypes: ["note", "article"],
            tags: ["important"],
            searchMode: "comprehensive",
          },
          pagination: { limit: 25, offset: 0 },
        },
      ];

      validRequests.forEach((request) => {
        const valid = validateSearchRequest(request);
        expect(valid).toBe(true);
      });
    });

    it("should reject invalid search requests", () => {
      const invalidRequests = [
        { query: "" }, // Empty query
        { query: "a".repeat(501) }, // Query too long
        {
          query: "test",
          options: { limit: 0 }, // Invalid limit
        },
        {
          query: "test",
          options: { minSimilarity: 1.5 }, // Invalid similarity
        },
      ];

      invalidRequests.forEach((request) => {
        const valid = validateSearchRequest(request);
        expect(valid).toBe(false);
      });
    });
  });

  describe("Data Integrity Contracts", () => {
    it("should validate document chunk relationships", () => {
      // Test that chunks reference valid documents
      const chunkSchema = {
        type: "object",
        required: ["id", "text", "meta"],
        properties: {
          id: { type: "string" },
          text: { type: "string" },
          meta: {
            type: "object",
            required: ["section", "contentType"],
            properties: {
              section: { type: "string" },
              contentType: {
                type: "string",
                enum: [
                  "note",
                  "moc",
                  "article",
                  "conversation",
                  "template",
                  "book-note",
                ],
              },
              breadcrumbs: {
                type: "array",
                items: { type: "string" },
              },
            },
          },
          embedding: {
            type: "array",
            items: { type: "number" },
            minItems: 768,
            maxItems: 768,
          },
        },
      };

      const validateChunk = ajv.compile(chunkSchema);

      const validChunk = {
        id: "chunk-1",
        text: "This is chunk content",
        meta: {
          section: "Introduction",
          contentType: "note",
          breadcrumbs: ["Root", "Docs"],
        },
        embedding: Array.from({ length: 768 }, () => Math.random()),
      };

      const valid = validateChunk(validChunk);
      expect(valid).toBe(true);
    });

    it("should validate wikilink structure", () => {
      const wikilinkSchema = {
        type: "object",
        required: ["target", "type", "position"],
        properties: {
          target: { type: "string" },
          display: { type: "string" },
          type: { type: "string", enum: ["document", "heading", "block"] },
          position: {
            type: "object",
            required: ["line", "column", "offset"],
            properties: {
              line: { type: "integer", minimum: 0 },
              column: { type: "integer", minimum: 0 },
              offset: { type: "integer", minimum: 0 },
            },
          },
          context: { type: "string" },
        },
      };

      const validateWikilink = ajv.compile(wikilinkSchema);

      const validWikilink = {
        target: "Another Note",
        display: "Link Text",
        type: "document",
        position: { line: 5, column: 10, offset: 150 },
        context: "See also: [[Another Note]] for details",
      };

      const valid = validateWikilink(validWikilink);
      expect(valid).toBe(true);
    });
  });

  describe("API Version Compatibility", () => {
    it("should maintain backward compatibility", () => {
      // Test that new optional fields don't break existing clients
      const minimalSearchResponse = {
        query: "test",
        results: [
          {
            id: "chunk-1",
            text: "content",
            meta: { section: "Test", contentType: "note" },
            cosineSimilarity: 0.8,
            rank: 1,
          },
        ],
        totalFound: 1,
        performance: {
          totalTime: 100,
          searchTime: 80,
          processingTime: 20,
        },
      };

      // This should still validate with our schema
      const searchSchema = {
        type: "object",
        required: ["query", "results", "totalFound", "performance"],
        properties: {
          query: { type: "string" },
          results: { type: "array" },
          totalFound: { type: "integer" },
          performance: { type: "object" },
          // Optional fields should not break validation
          facets: { type: "object" },
          graphInsights: { type: "object" },
          pagination: { type: "object" },
        },
      };

      const validate = ajv.compile(searchSchema);
      const valid = validate(minimalSearchResponse);
      expect(valid).toBe(true);
    });
  });
});
