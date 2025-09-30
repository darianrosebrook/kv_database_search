import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  KnowledgeGraphEntityExtractor,
  EntityType,
  RelationshipType,
  ExtractionMethod,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
} from "../../src/lib/knowledge-graph/entity-extractor.ts";
import { ContentType } from "../../src/types/index.ts";

// Mock the base entity extractor
const mockEntityExtractor = {
  extractEntities: vi.fn(),
  extractEntitiesAsync: vi.fn(),
  extractRelationships: vi.fn(),
  extractRelationshipsAsync: vi.fn(),
};

vi.mock("../../src/lib/entity-extractor.js", () => ({
  EntityExtractor: vi.fn().mockImplementation(() => mockEntityExtractor),
}));

// Helper function to create mock ProcessedEntity objects
function createMockProcessedEntity(
  id: string,
  text: string,
  primaryType: string,
  confidence: number,
  start: number,
  end: number
) {
  return {
    id,
    text,
    type: { primary: primaryType },
    subtype: primaryType,
    confidence,
    position: { start, end },
    metadata: {},
    relationships: [],
    hierarchical: { level: 0, parent: null, children: [] },
    context: { surroundingText: "", documentSection: "", frequency: 1 },
    provenance: { source: "test", timestamp: new Date(), method: "mock" },
  };
}

describe("KnowledgeGraphEntityExtractor", () => {
  let extractor: KnowledgeGraphEntityExtractor;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    mockEntityExtractor.extractEntities.mockReset();
    mockEntityExtractor.extractEntitiesAsync.mockReset();
    mockEntityExtractor.extractRelationships.mockReset();
    mockEntityExtractor.extractRelationshipsAsync.mockReset();

    // Set up default mock returns
    mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
      entities: [],
      relationships: [],
    });
    mockEntityExtractor.extractRelationshipsAsync.mockResolvedValue([]);

    extractor = new KnowledgeGraphEntityExtractor({
      minEntityConfidence: 0.7,
      minRelationshipConfidence: 0.5,
      enableCooccurrenceAnalysis: true,
    });
  });

  describe("Entity Extraction", () => {
    it("should extract entities with confidence above threshold [INV: Entity confidence threshold]", async () => {
      // Arrange
      const sampleText =
        "John Smith works at Microsoft Corporation developing artificial intelligence systems.";
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
        createMockProcessedEntity(
          "entity-2",
          "Microsoft Corporation",
          "ORGANIZATION",
          0.85,
          20,
          40
        ),
        createMockProcessedEntity(
          "entity-3",
          "artificial intelligence",
          "CONCEPT",
          0.75,
          50,
          72
        ),
        createMockProcessedEntity(
          "entity-4",
          "low confidence entity",
          "OTHER",
          0.3,
          80,
          100
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText(sampleText, metadata);

      // Assert
      expect(result.entities).toHaveLength(3); // Only entities with confidence >= 0.7
      expect(result.entities.every((e) => e.confidence >= 0.7)).toBe(true);

      const johnSmith = result.entities.find((e) => e.name === "John Smith");
      expect(johnSmith).toBeDefined();
      expect(johnSmith?.type).toBe(EntityType.PERSON);
      expect(johnSmith?.canonicalName).toBe("john smith");
    });

    it("should generate canonical names correctly", async () => {
      // Arrange
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "Microsoft Corporation",
          "ORGANIZATION",
          0.9,
          0,
          20
        ),
        createMockProcessedEntity(
          "entity-2",
          "AI/ML Systems",
          "CONCEPT",
          0.8,
          25,
          38
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("Test text", metadata);

      // Assert
      const microsoft = result.entities.find(
        (e) => e.name === "Microsoft Corporation"
      );
      expect(microsoft?.canonicalName).toBe("microsoft corporation");

      const aiml = result.entities.find((e) => e.name === "AI/ML Systems");
      expect(aiml?.canonicalName).toBe("aiml systems");
    });

    it("should extract aliases from text patterns", async () => {
      // Arrange
      const sampleText =
        "Microsoft Corporation (MSFT) is a technology company. Microsoft is also known as MS.";
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "Microsoft Corporation",
          "ORGANIZATION",
          0.9,
          0,
          20
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText(sampleText, metadata);

      // Assert
      const microsoft = result.entities.find(
        (e) => e.name === "Microsoft Corporation"
      );
      expect(microsoft?.aliases).toContain("MSFT");
      expect(microsoft?.aliases).toContain("MS");
    });

    it("should create mention contexts with proper positioning", async () => {
      // Arrange
      const sampleText =
        "John Smith works at Microsoft. John is a software engineer.";
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText(sampleText, metadata);

      // Assert
      const johnSmith = result.entities.find((e) => e.name === "John Smith");
      expect(johnSmith?.mentionContexts).toHaveLength(1);
      expect(johnSmith?.mentionContexts[0].mentionText).toBe("John Smith");
      expect(johnSmith?.mentionContexts[0].chunkId).toBe("chunk-123");
      expect(johnSmith?.mentionContexts[0].startPosition).toBe(0);
      expect(johnSmith?.mentionContexts[0].endPosition).toBe(10);
    });
  });

  describe("Relationship Extraction", () => {
    it("should extract relationships with confidence above threshold [INV: Relationship confidence threshold]", async () => {
      // Arrange
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
        createMockProcessedEntity(
          "entity-2",
          "Microsoft",
          "ORGANIZATION",
          0.85,
          20,
          29
        ),
      ];

      const mockRelationships = [
        {
          id: "rel-1",
          sourceEntity: "John Smith",
          targetEntity: "Microsoft",
          type: "WORKS_FOR",
          strength: 0.8,
          confidence: 0.8,
          context: "John Smith works at Microsoft",
          evidence: [],
        },
        {
          id: "rel-2",
          sourceEntity: "John Smith",
          targetEntity: "Microsoft",
          type: "RELATED_TO",
          strength: 0.3,
          confidence: 0.3,
          context: "weak relationship",
          evidence: [],
        },
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: mockRelationships,
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("Test text", metadata);

      // Assert
      expect(result.relationships).toHaveLength(1); // Only relationships with confidence >= 0.5
      expect(result.relationships[0].type).toBe(RelationshipType.WORKS_FOR);
      expect(result.relationships[0].confidence).toBe(0.8);
    });

    it("should infer co-occurrence relationships when enabled", async () => {
      // Arrange
      const sampleText =
        "John Smith and Jane Doe collaborated on the AI project. John Smith and Jane Doe worked together on machine learning algorithms. John Smith partnered with Jane Doe on the research.";
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
        createMockProcessedEntity(
          "entity-2",
          "Jane Doe",
          "PERSON",
          0.9,
          15,
          23
        ),
        createMockProcessedEntity(
          "entity-3",
          "AI project",
          "CONCEPT",
          0.8,
          45,
          55
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText(sampleText, metadata);

      // Assert
      // Should infer relationships from co-occurrence
      const cooccurrenceRels = result.relationships.filter(
        (r) => r.metadata.inferenceMethod === "cooccurrence"
      );
      expect(cooccurrenceRels.length).toBeGreaterThan(0);

      // Should find John-Jane relationship
      const johnJaneRel = result.relationships.find(
        (r) =>
          (r.sourceEntityId === "john smith" &&
            r.targetEntityId === "jane doe") ||
          (r.sourceEntityId === "jane doe" && r.targetEntityId === "john smith")
      );
      expect(johnJaneRel).toBeDefined();
      expect(johnJaneRel?.cooccurrenceCount).toBeGreaterThanOrEqual(2);
    });

    it("should determine relationship directionality correctly", async () => {
      // Arrange
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
        createMockProcessedEntity(
          "entity-2",
          "Microsoft",
          "ORGANIZATION",
          0.85,
          20,
          29
        ),
      ];

      const mockRelationships = [
        {
          id: "rel-1",
          sourceEntity: "John Smith",
          targetEntity: "Microsoft",
          type: "WORKS_FOR",
          strength: 0.8,
          confidence: 0.8,
          context: "works for",
          evidence: [],
        },
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: mockRelationships,
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("Test text", metadata);

      // Assert
      const worksForRel = result.relationships.find(
        (r) => r.type === RelationshipType.WORKS_FOR
      );
      expect(worksForRel?.isDirectional).toBe(true);

      // Test bidirectional relationship
      const relatedToRel = result.relationships.find(
        (r) => r.type === RelationshipType.RELATED_TO
      );
      if (relatedToRel) {
        expect(relatedToRel.isDirectional).toBe(false);
      }
    });
  });

  describe("Entity Type Mapping", () => {
    it("should map entity types correctly", async () => {
      // Arrange
      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "John Smith",
          "PERSON",
          0.9,
          0,
          10
        ),
        createMockProcessedEntity(
          "entity-2",
          "Microsoft",
          "ORGANIZATION",
          0.85,
          20,
          29
        ),
        createMockProcessedEntity(
          "entity-3",
          "Seattle",
          "LOCATION",
          0.8,
          30,
          37
        ),
        createMockProcessedEntity(
          "entity-4",
          "Unknown Entity",
          "OTHER",
          0.75,
          40,
          54
        ),
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("Test text", metadata);

      // Assert
      const entities = result.entities;
      expect(entities.find((e) => e.name === "John Smith")?.type).toBe(
        EntityType.PERSON
      );
      expect(entities.find((e) => e.name === "Microsoft")?.type).toBe(
        EntityType.ORGANIZATION
      );
      expect(entities.find((e) => e.name === "Seattle")?.type).toBe(
        EntityType.LOCATION
      );
      expect(entities.find((e) => e.name === "Unknown Entity")?.type).toBe(
        EntityType.OTHER
      );
    });
  });

  describe("Configuration Validation", () => {
    it("should respect minimum confidence thresholds", async () => {
      // Arrange
      const strictExtractor = new KnowledgeGraphEntityExtractor({
        minEntityConfidence: 0.9,
        minRelationshipConfidence: 0.8,
      });

      const mockEntities = [
        createMockProcessedEntity(
          "entity-1",
          "High Confidence",
          "CONCEPT",
          0.95,
          0,
          15
        ),
        createMockProcessedEntity(
          "entity-2",
          "Medium Confidence",
          "CONCEPT",
          0.75,
          20,
          37
        ),
      ];

      const mockRelationships = [
        {
          id: "rel-1",
          sourceEntity: "High Confidence",
          targetEntity: "Medium Confidence",
          type: "RELATED_TO",
          strength: 0.85,
          confidence: 0.85,
          context: "high conf rel",
          evidence: [],
        },
        {
          id: "rel-2",
          sourceEntity: "High Confidence",
          targetEntity: "Medium Confidence",
          type: "SIMILAR_TO",
          strength: 0.6,
          confidence: 0.6,
          context: "medium conf rel",
          evidence: [],
        },
      ];

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: mockRelationships,
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await strictExtractor.extractFromText(
        "Test text",
        metadata
      );

      // Assert
      expect(result.entities).toHaveLength(1); // Only high confidence entity
      expect(result.relationships).toHaveLength(1); // Only high confidence relationship
      expect(result.entities[0].name).toBe("High Confidence");
      expect(result.relationships[0].type).toBe(RelationshipType.RELATED_TO);
    });

    it("should handle empty text gracefully", async () => {
      // Arrange
      mockEntityExtractor.extractEntities.mockReturnValue([]);
      mockEntityExtractor.extractRelationships.mockReturnValue([]);

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("", metadata);

      // Assert
      expect(result.entities).toHaveLength(0);
      expect(result.relationships).toHaveLength(0);
      expect(result.extractionMetadata.confidence).toBe(0);
    });
  });

  describe("Performance and Error Handling", () => {
    it("should handle extraction errors gracefully", async () => {
      // Arrange
      mockEntityExtractor.extractEntities.mockImplementation(() => {
        throw new Error("Extraction failed");
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const result = await extractor.extractFromText("Test text", metadata);

      // Assert
      expect(result.entities).toHaveLength(0);
      expect(result.relationships).toHaveLength(0);
      expect(result.extractionMetadata.confidence).toBe(0);
      expect(result.extractionMetadata.processingTime).toBeGreaterThan(0);
    });

    it("should complete extraction within reasonable time", async () => {
      // Arrange
      const largeText = "Large text content. ".repeat(1000);
      const mockEntities = Array.from({ length: 50 }, (_, i) =>
        createMockProcessedEntity(
          `entity-${i}`,
          `Entity ${i}`,
          "CONCEPT",
          0.8,
          i * 20,
          i * 20 + 10
        )
      );

      mockEntityExtractor.extractEntitiesAsync.mockResolvedValue({
        entities: mockEntities,
        relationships: [],
      });

      const metadata = {
        contentType: ContentType.PLAIN_TEXT,
        sourceFile: "test.txt",
        chunkId: "chunk-123",
        extractionMethod: ExtractionMethod.TEXT_EXTRACTION,
      };

      // Act
      const startTime = performance.now();
      const result = await extractor.extractFromText(largeText, metadata);
      const processingTime = performance.now() - startTime;

      // Assert
      expect(processingTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(result.entities.length).toBeGreaterThan(0);
      expect(result.extractionMetadata.processingTime).toBeGreaterThan(0);
    });
  });
});
