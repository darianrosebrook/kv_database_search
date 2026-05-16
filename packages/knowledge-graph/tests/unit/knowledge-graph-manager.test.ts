import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Pool, PoolClient } from "pg";
import {
  KnowledgeGraph,
  type EntitySimilarity,
  type GraphStatistics,
  EntityType,
  RelationshipType,
  ExtractionMethod,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
  type EntityExtractionResult,
} from "@kv/knowledge-graph";
import { ContentType } from "@kv/types";

// Mock the embedding service
const mockEmbeddingService = {
  embedWithStrategy: vi.fn().mockResolvedValue({
    embedding: new Array(768).fill(0.1),
  }),
};

// Mock pool and client
const mockClient = {
  query: vi.fn().mockResolvedValue({ rows: [] }),
  release: vi.fn(),
};

const mockPool = {
  connect: vi.fn().mockResolvedValue(mockClient),
} as unknown as Pool;

describe("KnowledgeGraph", () => {
  let manager: KnowledgeGraph;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock to default empty responses
    mockClient.query.mockResolvedValue({ rows: [] });

    manager = new KnowledgeGraph(mockPool, mockEmbeddingService, {
      similarityThreshold: 0.8,
      enableAutoMerge: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Entity Processing", () => {
    it("should create new entities when no duplicates found [INV: Entity uniqueness]", async () => {
      // Arrange
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            name: "John Smith",
            canonicalName: "john smith",
            type: EntityType.PERSON,
            aliases: ["J. Smith"],
            confidence: 0.9,
            extractionConfidence: 0.9,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [
              {
                chunkId: "chunk-123",
                mentionText: "John Smith",
                mentionContext: "John Smith works at...",
                extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
                extractionConfidence: 0.9,
              },
            ],
          },
        ],
        relationships: [],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "test.txt",
          chunkId: "chunk-123",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.9,
        },
      };

      // Mock no duplicates found
      mockClient.query
        .mockResolvedValueOnce({ command: "BEGIN" }) // BEGIN transaction
        .mockResolvedValueOnce({ rows: [] }) // findExactNameMatches
        .mockResolvedValueOnce({ rows: [] }) // findCanonicalNameMatches
        .mockResolvedValueOnce({ rows: [] }) // findAliasMatches
        .mockResolvedValueOnce({ rows: [] }) // findFuzzyMatches
        .mockResolvedValueOnce({ rows: [] }) // findVectorSimilarMatches
        .mockResolvedValueOnce({
          // createEntity
          rows: [
            {
              id: "entity-123",
              canonical_name: "john smith",
              first_seen: new Date(),
              last_updated: new Date(),
              last_occurrence: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ command: "INSERT" }) // createEntityChunkMappings
        .mockResolvedValueOnce({ command: "COMMIT" }); // COMMIT transaction

      // Act
      const result = await manager.processExtractionResult(extractionResult);

      // Assert
      expect(result.entitiesCreated).toBe(1);
      expect(result.entitiesUpdated).toBe(0);
      expect(result.duplicatesFound).toBe(0);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
    });

    it("should update existing entities when duplicates found", async () => {
      // Arrange
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            name: "John Smith",
            canonicalName: "john smith",
            type: EntityType.PERSON,
            aliases: ["Johnny"],
            confidence: 0.85,
            extractionConfidence: 0.85,
            validationStatus: "unvalidated",
            occurrenceCount: 2,
            documentFrequency: 1,
            sourceFiles: ["test2.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
        ],
        relationships: [],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "test2.txt",
          chunkId: "chunk-456",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.85,
        },
      };

      const existingEntity = {
        id: "entity-123",
        name: "John Smith",
        canonicalName: "john smith",
        type: EntityType.PERSON,
        aliases: ["J. Smith"],
        confidence: 0.9,
        extractionConfidence: 0.9,
        validationStatus: "unvalidated",
        occurrenceCount: 3,
        documentFrequency: 1,
        sourceFiles: ["test1.txt"],
        extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
        firstSeen: new Date(),
        lastUpdated: new Date(),
        lastOccurrence: new Date(),
        metadata: {},
      };

      // Mock duplicate found - set up all database queries that will be called
      mockClient.query.mockImplementation((sql: string) => {
        console.log("Mock called with SQL:", sql.trim().substring(0, 120));
        if (sql.includes("BEGIN")) {
          return Promise.resolve({ command: "BEGIN" });
        }
        if (sql.includes("WHERE name ILIKE $1 OR $1 = ANY(aliases)")) {
          // findExactNameMatches - return empty for this test (to test canonical matching)
          return Promise.resolve({ rows: [] });
        }
        if (
          sql.trim().startsWith("SELECT * FROM knowledge_graph_entities") &&
          sql.includes("canonical_name")
        ) {
          // findCanonicalNameMatches
          console.log("Returning canonical match for:", sql.trim());
          return Promise.resolve({
            rows: [
              {
                id: "entity-123",
                name: "John Smith",
                canonical_name: "john smith",
                type: "PERSON",
                aliases: ["J. Smith"],
                confidence: 0.9,
                extraction_confidence: 0.9,
                validation_status: "unvalidated",
                occurrence_count: 3,
                document_frequency: 1,
                source_files: ["test1.txt"],
                extraction_methods: ["text_extraction"],
                first_seen: new Date(),
                last_updated: new Date(),
                last_occurrence: new Date(),
                metadata: {},
              },
            ],
          });
        }
        if (sql.includes("WHERE $1 = ANY(aliases)")) {
          // findAliasMatches - return empty for this test
          return Promise.resolve({ rows: [] });
        }
        if (sql.trim().startsWith("UPDATE knowledge_graph_entities")) {
          // updateExistingEntity - return the updated row
          return Promise.resolve({
            rows: [
              {
                id: existingEntity.id,
                name: existingEntity.name,
                canonical_name: existingEntity.canonicalName,
                type: existingEntity.type,
                aliases: existingEntity.aliases,
                confidence: existingEntity.confidence,
                extraction_confidence: existingEntity.extractionConfidence,
                validation_status: existingEntity.validationStatus,
                occurrence_count: existingEntity.occurrenceCount,
                document_frequency: existingEntity.documentFrequency,
                source_files: existingEntity.sourceFiles,
                extraction_methods: existingEntity.extractionMethods,
                first_seen: existingEntity.firstSeen,
                last_updated: existingEntity.lastUpdated,
                last_occurrence: existingEntity.lastOccurrence,
                metadata: existingEntity.metadata,
              },
            ],
          });
        }
        if (sql.includes("INSERT INTO knowledge_graph_entities")) {
          console.log("INSERT INTO knowledge_graph_entities called");
          // createEntity - return the created entity
          return Promise.resolve({
            rows: [
              {
                id: "new-entity-" + Math.random().toString(36).substr(2, 9),
                canonical_name: "test",
                first_seen: new Date(),
                last_updated: new Date(),
                last_occurrence: new Date(),
              },
            ],
          });
        }
        if (sql.includes("INSERT INTO entity_chunk_mappings")) {
          return Promise.resolve({ command: "INSERT" });
        }
        if (sql.includes("COMMIT")) {
          return Promise.resolve({ command: "COMMIT" });
        }
        // Default empty response
        return Promise.resolve({ rows: [] });
      });

      // Act
      const result = await manager.processExtractionResult(extractionResult);

      // Debug logging
      console.log("Test result:", {
        entitiesCreated: result.entitiesCreated,
        entitiesUpdated: result.entitiesUpdated,
        duplicatesFound: result.duplicatesFound,
      });

      // Check what duplicates were found
      const testEntity = extractionResult.entities[0];
      const duplicates = await manager.findDuplicateEntities(
        testEntity,
        mockClient
      );
      console.log(
        "Duplicates found:",
        duplicates.length,
        duplicates.map((d) => ({
          name: d.entity.name,
          similarity: d.similarity,
        }))
      );

      // Assert
      expect(result.entitiesCreated).toBe(0);
      expect(result.entitiesUpdated).toBe(1);
      expect(result.duplicatesFound).toBe(1);
    });

    it("should handle entity embedding generation", async () => {
      // Arrange
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            name: "AI Technology",
            canonicalName: "ai technology",
            type: EntityType.TECHNOLOGY,
            aliases: ["Artificial Intelligence"],
            confidence: 0.8,
            extractionConfidence: 0.8,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["tech.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
            embedding: undefined, // No embedding provided
          },
        ],
        relationships: [],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "tech.txt",
          chunkId: "chunk-789",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.8,
        },
      };

      // Mock no duplicates and successful creation
      mockClient.query
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [] }) // No duplicates
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          // createEntity
          rows: [
            {
              id: "entity-456",
              canonical_name: "ai technology",
              first_seen: new Date(),
              last_updated: new Date(),
              last_occurrence: new Date(),
            },
          ],
        })
        .mockResolvedValueOnce({ command: "INSERT" })
        .mockResolvedValueOnce({ command: "COMMIT" });

      // Act
      const result = await manager.processExtractionResult(extractionResult);

      // Assert
      expect(mockEmbeddingService.embedWithStrategy).toHaveBeenCalledWith(
        "AI Technology Artificial Intelligence technology"
      );
      expect(result.entitiesCreated).toBe(1);
    });
  });

  describe("Relationship Processing", () => {
    it("should create new relationships when none exist", async () => {
      // Arrange
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            id: "entity-1",
            name: "John Smith",
            canonicalName: "john smith",
            type: EntityType.PERSON,
            aliases: [],
            confidence: 0.9,
            extractionConfidence: 0.9,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
          {
            id: "entity-2",
            name: "Microsoft",
            canonicalName: "microsoft",
            type: EntityType.ORGANIZATION,
            aliases: [],
            confidence: 0.85,
            extractionConfidence: 0.85,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
        ],
        relationships: [
          {
            sourceEntityId: "John Smith",
            targetEntityId: "Microsoft",
            type: RelationshipType.WORKS_FOR,
            isDirectional: true,
            confidence: 0.8,
            strength: 0.9,
            cooccurrenceCount: 1,
            sourceChunkIds: ["chunk-123"],
            extractionContext: "John Smith works for Microsoft",
            supportingText: ["John Smith works for Microsoft"],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastObserved: new Date(),
            metadata: {},
          },
        ],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "test.txt",
          chunkId: "chunk-123",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.85,
        },
      };

      // Mock entity processing and relationship creation
      mockClient.query.mockReset();
      mockClient.query.mockImplementation((sql: string) => {
        if (sql.includes("BEGIN")) {
          return Promise.resolve({ command: "BEGIN" });
        }
        if (sql.includes("COMMIT")) {
          return Promise.resolve({ command: "COMMIT" });
        }
        if (sql.includes("INSERT INTO knowledge_graph_entities")) {
          return Promise.resolve({
            rows: [
              {
                id: "entity-" + Math.random().toString(36).substr(2, 9),
                canonical_name: "test",
                first_seen: new Date(),
                last_updated: new Date(),
                last_occurrence: new Date(),
              },
            ],
          });
        }
        if (sql.includes("INSERT INTO knowledge_graph_relationships")) {
          return Promise.resolve({
            rows: [
              {
                id: "rel-123",
                created_at: new Date(),
                updated_at: new Date(),
                last_observed: new Date(),
              },
            ],
          });
        }
        if (sql.includes("INSERT INTO entity_chunk_mappings")) {
          return Promise.resolve({ command: "INSERT" });
        }

        // Default: return empty rows for SELECT queries
        return Promise.resolve({ rows: [] });
      });

      // Act
      const result = await manager.processExtractionResult(extractionResult);

      // Assert
      expect(result.relationshipsCreated).toBe(1);
      expect(result.relationshipsUpdated).toBe(0);
    });

    it("should update existing relationships when found", async () => {
      // Arrange - similar setup but with existing relationship
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            id: "entity-1",
            name: "John Smith",
            canonicalName: "john smith",
            type: EntityType.PERSON,
            aliases: [],
            confidence: 0.9,
            extractionConfidence: 0.9,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
          {
            id: "entity-2",
            name: "Microsoft",
            canonicalName: "microsoft",
            type: EntityType.ORGANIZATION,
            aliases: [],
            confidence: 0.85,
            extractionConfidence: 0.85,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
        ],
        relationships: [
          {
            sourceEntityId: "John Smith",
            targetEntityId: "Microsoft",
            type: RelationshipType.WORKS_FOR,
            isDirectional: true,
            confidence: 0.85,
            strength: 0.95,
            cooccurrenceCount: 2,
            sourceChunkIds: ["chunk-456"],
            extractionContext: "John Smith is employed by Microsoft",
            supportingText: ["John Smith is employed by Microsoft"],
            createdAt: new Date(),
            updatedAt: new Date(),
            lastObserved: new Date(),
            metadata: {},
          },
        ],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "test.txt",
          chunkId: "chunk-456",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.85,
        },
      };

      // Mock existing entities and existing relationship
      mockClient.query.mockReset();
      let entityQueryCount = 0;
      mockClient.query.mockImplementation((sql: string) => {
        if (sql.includes("BEGIN")) {
          return Promise.resolve({ command: "BEGIN" });
        }
        if (sql.includes("COMMIT")) {
          return Promise.resolve({ command: "COMMIT" });
        }
        // Return existing entities for duplicate detection
        if (
          sql.includes("knowledge_graph_entities") &&
          (sql.includes("WHERE") || sql.includes("canonical_name"))
        ) {
          entityQueryCount++;
          if (entityQueryCount % 2 === 1) {
            // First entity
            return Promise.resolve({
              rows: [
                {
                  id: "entity-1",
                  name: "John Smith",
                  canonical_name: "john smith",
                  type: "PERSON",
                  aliases: [],
                  confidence: 0.9,
                  extraction_confidence: 0.9,
                  validation_status: "unvalidated",
                  occurrence_count: 1,
                  document_frequency: 1,
                  source_files: ["test.txt"],
                  extraction_methods: ["text_extraction"],
                  first_seen: new Date(),
                  last_updated: new Date(),
                  last_occurrence: new Date(),
                  metadata: {},
                },
              ],
            });
          } else {
            // Second entity
            return Promise.resolve({
              rows: [
                {
                  id: "entity-2",
                  name: "Microsoft",
                  canonical_name: "microsoft",
                  type: "ORGANIZATION",
                  aliases: [],
                  confidence: 0.85,
                  extraction_confidence: 0.85,
                  validation_status: "unvalidated",
                  occurrence_count: 1,
                  document_frequency: 1,
                  source_files: ["test.txt"],
                  extraction_methods: ["text_extraction"],
                  first_seen: new Date(),
                  last_updated: new Date(),
                  last_occurrence: new Date(),
                  metadata: {},
                },
              ],
            });
          }
        }
        // Return existing relationship
        if (sql.includes("knowledge_graph_relationships")) {
          return Promise.resolve({
            rows: [
              {
                id: "rel-123",
                source_entity_id: "entity-1",
                target_entity_id: "entity-2",
                type: "WORKS_FOR",
                is_directional: true,
                confidence: 0.8,
                strength: 0.9,
                cooccurrence_count: 1,
                source_chunk_ids: ["chunk-123"],
                extraction_context: "previous context",
                supporting_text: ["previous text"],
                created_at: new Date(),
                updated_at: new Date(),
                last_observed: new Date(),
                metadata: {},
              },
            ],
          });
        }
        // Handle updates
        if (sql.includes("UPDATE knowledge_graph_entities")) {
          return Promise.resolve({ rows: [{ id: "entity-updated" }] });
        }
        if (sql.includes("UPDATE knowledge_graph_relationships")) {
          return Promise.resolve({ rows: [{ id: "rel-updated" }] });
        }
        if (sql.includes("INSERT INTO entity_chunk_mappings")) {
          return Promise.resolve({ command: "INSERT" });
        }

        // Default: return empty rows
        return Promise.resolve({ rows: [] });
      });

      // Act
      const result = await manager.processExtractionResult(extractionResult);

      // Assert
      expect(result.relationshipsCreated).toBe(0);
      expect(result.relationshipsUpdated).toBe(1);
    });
  });

  describe("Duplicate Detection", () => {
    it("should find exact name matches", async () => {
      // Arrange
      const entity: KnowledgeGraphEntity = {
        name: "Microsoft Corporation",
        canonicalName: "microsoft corporation",
        type: EntityType.ORGANIZATION,
        aliases: [],
        confidence: 0.9,
        extractionConfidence: 0.9,
        validationStatus: "unvalidated",
        occurrenceCount: 1,
        documentFrequency: 1,
        sourceFiles: ["test.txt"],
        extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
        firstSeen: new Date(),
        lastUpdated: new Date(),
        lastOccurrence: new Date(),
        metadata: {},
        mentionContexts: [],
      };

      mockClient.query
        .mockResolvedValueOnce({
          // findExactNameMatches
          rows: [
            {
              id: "existing-entity",
              name: "Microsoft Corporation",
              canonical_name: "microsoft corporation",
              type: "ORGANIZATION",
              aliases: ["MSFT"],
              confidence: 0.95,
              extraction_confidence: 0.95,
              validation_status: "validated",
              occurrence_count: 5,
              document_frequency: 3,
              source_files: ["doc1.txt", "doc2.txt"],
              extraction_methods: ["text_extraction"],
              first_seen: new Date(),
              last_updated: new Date(),
              last_occurrence: new Date(),
              metadata: {},
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] }) // findCanonicalNameMatches
        .mockResolvedValueOnce({ rows: [] }) // findAliasMatches
        .mockResolvedValueOnce({ rows: [] }) // findFuzzyMatches
        .mockResolvedValueOnce({ rows: [] }); // findVectorSimilarMatches

      // Act
      const duplicates = await manager.findDuplicateEntities(
        entity,
        mockClient
      );

      // Assert
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].similarity).toBe(1.0);
      expect(duplicates[0].method).toBe("fuzzy");
      expect(duplicates[0].entity.name).toBe("Microsoft Corporation");
    });

    it("should find fuzzy matches with similarity scores", async () => {
      // Arrange
      const entity: KnowledgeGraphEntity = {
        name: "Microsft Corp",
        canonicalName: "microsft corp",
        type: EntityType.ORGANIZATION,
        aliases: [],
        confidence: 0.8,
        extractionConfidence: 0.8,
        validationStatus: "unvalidated",
        occurrenceCount: 1,
        documentFrequency: 1,
        sourceFiles: ["test.txt"],
        extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
        firstSeen: new Date(),
        lastUpdated: new Date(),
        lastOccurrence: new Date(),
        metadata: {},
        mentionContexts: [],
      };

      mockClient.query.mockReset();
      mockClient.query.mockImplementation((sql: string) => {
        // findFuzzyMatches - return fuzzy match
        if (sql.includes("similarity(name")) {
          return Promise.resolve({
            rows: [
              {
                id: "similar-entity",
                name: "Microsoft Corporation",
                canonical_name: "microsoft corporation",
                type: "ORGANIZATION",
                sim_score: 0.85,
                aliases: [],
                confidence: 0.9,
                extraction_confidence: 0.9,
                validation_status: "validated",
                occurrence_count: 3,
                document_frequency: 2,
                source_files: ["doc1.txt"],
                extraction_methods: ["text_extraction"],
                first_seen: new Date(),
                last_updated: new Date(),
                last_occurrence: new Date(),
                metadata: {},
              },
            ],
          });
        }

        // Default: return empty rows for other queries
        return Promise.resolve({ rows: [] });
      });

      // Act
      const duplicates = await manager.findDuplicateEntities(
        entity,
        mockClient
      );

      // Assert
      expect(duplicates).toHaveLength(1);
      expect(duplicates[0].similarity).toBe(0.85);
      expect(duplicates[0].method).toBe("fuzzy");
    });

    it("should filter duplicates by similarity threshold [INV: Similarity threshold]", async () => {
      // Arrange
      const strictManager = new KnowledgeGraph(mockPool, mockEmbeddingService, {
        similarityThreshold: 0.9,
      });

      const entity: KnowledgeGraphEntity = {
        name: "Test Entity",
        canonicalName: "test entity",
        type: EntityType.CONCEPT,
        aliases: [],
        confidence: 0.8,
        extractionConfidence: 0.8,
        validationStatus: "unvalidated",
        occurrenceCount: 1,
        documentFrequency: 1,
        sourceFiles: ["test.txt"],
        extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
        firstSeen: new Date(),
        lastUpdated: new Date(),
        lastOccurrence: new Date(),
        metadata: {},
        mentionContexts: [],
      };

      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({
          // Low similarity match
          rows: [
            {
              id: "low-sim-entity",
              name: "Different Entity",
              sim_score: 0.7, // Below threshold
              type: "CONCEPT",
              canonical_name: "different entity",
              aliases: [],
              confidence: 0.8,
              extraction_confidence: 0.8,
              validation_status: "unvalidated",
              occurrence_count: 1,
              document_frequency: 1,
              source_files: ["test.txt"],
              extraction_methods: ["text_extraction"],
              first_seen: new Date(),
              last_updated: new Date(),
              last_occurrence: new Date(),
              metadata: {},
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [] });

      // Act
      const duplicates = await strictManager.findDuplicateEntities(
        entity,
        mockClient
      );

      // Assert
      expect(duplicates).toHaveLength(0); // Filtered out due to low similarity
    });
  });

  describe("Graph Statistics", () => {
    it("should calculate comprehensive graph statistics", async () => {
      // Arrange
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({
          // Entity statistics
          rows: [
            { total_entities: 100, type: null },
            { total_entities: null, type: "PERSON", type_count: 40 },
            { total_entities: null, type: "ORGANIZATION", type_count: 30 },
            { total_entities: null, type: "CONCEPT", type_count: 30 },
          ],
        })
        .mockResolvedValueOnce({
          // Relationship statistics
          rows: [
            { total_relationships: 150, type: null },
            { total_relationships: null, type: "WORKS_FOR", type_count: 50 },
            { total_relationships: null, type: "RELATED_TO", type_count: 60 },
            { total_relationships: null, type: "PART_OF", type_count: 40 },
          ],
        })
        .mockResolvedValueOnce({
          // Average connectivity
          rows: [{ avg_connectivity: 3.2 }],
        });

      // Act
      const stats = await manager.getGraphStatistics();

      // Assert
      expect(stats.entityCount).toBe(100);
      expect(stats.relationshipCount).toBe(150);
      expect(stats.entityTypeDistribution).toEqual({
        PERSON: 40,
        ORGANIZATION: 30,
        CONCEPT: 30,
      });
      expect(stats.relationshipTypeDistribution).toEqual({
        WORKS_FOR: 50,
        RELATED_TO: 60,
        PART_OF: 40,
      });
      expect(stats.averageConnectivity).toBe(3.2);
      expect(stats.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe("Error Handling and Transactions", () => {
    it("should rollback transaction on error [INV: Atomic updates]", async () => {
      // Arrange
      const extractionResult: EntityExtractionResult = {
        entities: [
          {
            name: "Test Entity",
            canonicalName: "test entity",
            type: EntityType.CONCEPT,
            aliases: [],
            confidence: 0.8,
            extractionConfidence: 0.8,
            validationStatus: "unvalidated",
            occurrenceCount: 1,
            documentFrequency: 1,
            sourceFiles: ["test.txt"],
            extractionMethods: [ExtractionMethod.TEXT_EXTRACTION],
            firstSeen: new Date(),
            lastUpdated: new Date(),
            lastOccurrence: new Date(),
            metadata: {},
            mentionContexts: [],
          },
        ],
        relationships: [],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "test.txt",
          chunkId: "chunk-123",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 100,
          confidence: 0.8,
        },
      };

      // Mock transaction failure
      mockClient.query.mockReset();
      mockClient.query
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ rows: [] }) // No duplicates
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockRejectedValueOnce(new Error("Database error")) // Entity creation fails
        .mockResolvedValueOnce({ command: "ROLLBACK" });

      // Act & Assert
      await expect(
        manager.processExtractionResult(extractionResult)
      ).rejects.toThrow("Database error");
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
    });

    it("should handle empty extraction results gracefully", async () => {
      // Arrange
      const emptyResult: EntityExtractionResult = {
        entities: [],
        relationships: [],
        extractionMetadata: {
          contentType: ContentType.PLAIN_TEXT,
          sourceFile: "empty.txt",
          chunkId: "chunk-empty",
          extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
          processingTime: 50,
          confidence: 0,
        },
      };

      mockClient.query
        .mockResolvedValueOnce({ command: "BEGIN" })
        .mockResolvedValueOnce({ command: "COMMIT" });

      // Act
      const result = await manager.processExtractionResult(emptyResult);

      // Assert
      expect(result.entitiesCreated).toBe(0);
      expect(result.entitiesUpdated).toBe(0);
      expect(result.relationshipsCreated).toBe(0);
      expect(result.relationshipsUpdated).toBe(0);
      expect(result.duplicatesFound).toBe(0);
    });
  });
});
