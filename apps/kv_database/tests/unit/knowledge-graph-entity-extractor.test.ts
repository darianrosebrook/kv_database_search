import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  KnowledgeGraphEntityExtractor,
  EntityType,
  RelationshipType,
  ExtractionMethod,
  type KnowledgeGraphEntity,
  type KnowledgeGraphRelationship,
} from "../../src/lib/knowledge-graph/entity-extractor.js";
import { ContentType } from "../../src/lib/types/index.js";

// Mock the base entity extractor
vi.mock("../../src/lib/utils.js", () => ({
  EnhancedEntityExtractor: vi.fn().mockImplementation(() => ({
    extractEntities: vi.fn(),
    extractRelationships: vi.fn(),
  })),
}));

describe("KnowledgeGraphEntityExtractor", () => {
  let extractor: KnowledgeGraphEntityExtractor;
  let mockBaseExtractor: any;

  beforeEach(() => {
    extractor = new KnowledgeGraphEntityExtractor({
      minEntityConfidence: 0.7,
      minRelationshipConfidence: 0.5,
      enableCooccurrenceAnalysis: true,
    });

    // Get the mocked base extractor
    mockBaseExtractor = (extractor as any).baseExtractor;
  });

  describe("Entity Extraction", () => {
    it("should extract entities with confidence above threshold [INV: Entity confidence threshold]", async () => {
      // Arrange
      const sampleText =
        "John Smith works at Microsoft Corporation developing artificial intelligence systems.";
      const mockEntities = [
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
        {
          text: "Microsoft Corporation",
          type: "ORG",
          confidence: 0.85,
          label: "ORG",
          startPosition: 20,
          endPosition: 40,
        },
        {
          text: "artificial intelligence",
          type: "CONCEPT",
          confidence: 0.75,
          label: "CONCEPT",
          startPosition: 50,
          endPosition: 72,
        },
        {
          text: "low confidence entity",
          type: "OTHER",
          confidence: 0.3,
          label: "OTHER",
          startPosition: 80,
          endPosition: 100,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
        {
          text: "Microsoft Corporation",
          type: "ORG",
          confidence: 0.9,
          label: "ORG",
          startPosition: 0,
          endPosition: 20,
        },
        {
          text: "AI/ML Systems",
          type: "CONCEPT",
          confidence: 0.8,
          label: "CONCEPT",
          startPosition: 25,
          endPosition: 38,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
        {
          text: "Microsoft Corporation",
          type: "ORG",
          confidence: 0.9,
          label: "ORG",
          startPosition: 0,
          endPosition: 20,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
        {
          text: "Microsoft",
          type: "ORG",
          confidence: 0.85,
          label: "ORG",
          startPosition: 20,
          endPosition: 29,
        },
      ];

      const mockRelationships = [
        {
          source: "John Smith",
          target: "Microsoft",
          type: "WORKS_FOR",
          confidence: 0.8,
          context: "John Smith works at Microsoft",
        },
        {
          source: "John Smith",
          target: "Microsoft",
          type: "RELATED_TO",
          confidence: 0.3,
          context: "weak relationship",
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue(mockRelationships);

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
        "John Smith and Jane Doe collaborated on the AI project. John and Jane worked together on machine learning algorithms.";
      const mockEntities = [
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
        {
          text: "Jane Doe",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 15,
          endPosition: 23,
        },
        {
          text: "AI project",
          type: "CONCEPT",
          confidence: 0.8,
          label: "CONCEPT",
          startPosition: 45,
          endPosition: 55,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
          (r.sourceEntityId === "John Smith" &&
            r.targetEntityId === "Jane Doe") ||
          (r.sourceEntityId === "Jane Doe" && r.targetEntityId === "John Smith")
      );
      expect(johnJaneRel).toBeDefined();
      expect(johnJaneRel?.cooccurrenceCount).toBeGreaterThanOrEqual(2);
    });

    it("should determine relationship directionality correctly", async () => {
      // Arrange
      const mockEntities = [
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
        {
          text: "Microsoft",
          type: "ORG",
          confidence: 0.85,
          label: "ORG",
          startPosition: 20,
          endPosition: 29,
        },
      ];

      const mockRelationships = [
        {
          source: "John Smith",
          target: "Microsoft",
          type: "WORKS_FOR",
          confidence: 0.8,
          context: "works for",
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue(mockRelationships);

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
        {
          text: "John Smith",
          type: "PERSON",
          confidence: 0.9,
          label: "PERSON",
          startPosition: 0,
          endPosition: 10,
        },
        {
          text: "Microsoft",
          type: "ORG",
          confidence: 0.85,
          label: "ORG",
          startPosition: 20,
          endPosition: 29,
        },
        {
          text: "Seattle",
          type: "GPE",
          confidence: 0.8,
          label: "GPE",
          startPosition: 30,
          endPosition: 37,
        },
        {
          text: "Unknown Entity",
          type: "UNKNOWN",
          confidence: 0.75,
          label: "UNKNOWN",
          startPosition: 40,
          endPosition: 54,
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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

      const mockBaseExtractor = (strictExtractor as any).baseExtractor;

      const mockEntities = [
        {
          text: "High Confidence",
          type: "CONCEPT",
          confidence: 0.95,
          label: "CONCEPT",
          startPosition: 0,
          endPosition: 15,
        },
        {
          text: "Medium Confidence",
          type: "CONCEPT",
          confidence: 0.75,
          label: "CONCEPT",
          startPosition: 20,
          endPosition: 37,
        },
      ];

      const mockRelationships = [
        {
          source: "High Confidence",
          target: "Medium Confidence",
          type: "RELATED_TO",
          confidence: 0.85,
          context: "high conf rel",
        },
        {
          source: "High Confidence",
          target: "Medium Confidence",
          type: "SIMILAR_TO",
          confidence: 0.6,
          context: "medium conf rel",
        },
      ];

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue(mockRelationships);

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
      mockBaseExtractor.extractEntities.mockReturnValue([]);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
      mockBaseExtractor.extractEntities.mockImplementation(() => {
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
      const mockEntities = Array.from({ length: 50 }, (_, i) => ({
        text: `Entity ${i}`,
        type: "CONCEPT",
        confidence: 0.8,
        label: "CONCEPT",
        startPosition: i * 20,
        endPosition: i * 20 + 10,
      }));

      mockBaseExtractor.extractEntities.mockReturnValue(mockEntities);
      mockBaseExtractor.extractRelationships.mockReturnValue([]);

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
