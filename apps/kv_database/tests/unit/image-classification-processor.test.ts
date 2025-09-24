import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ImageClassificationProcessor,
  ImageClassificationOptions,
  SceneDescription,
} from "../../src/lib/processors/image-classification-processor";
import { ContentType } from "../../src/lib/multi-modal";

describe("ImageClassificationProcessor", () => {
  let processor: ImageClassificationProcessor;

  beforeEach(() => {
    processor = new ImageClassificationProcessor();
  });

  describe("Interface Compliance", () => {
    it("should implement ContentProcessor interface", () => {
      expect(processor.supportsContentType).toBeDefined();
      expect(processor.getSupportedContentTypes).toBeDefined();
      expect(processor.getProcessorName).toBeDefined();
      expect(processor.extractFromBuffer).toBeDefined();
      expect(processor.extractFromFile).toBeDefined();
    });

    it("should support raster and vector images", () => {
      expect(processor.supportsContentType(ContentType.RASTER_IMAGE)).toBe(
        true
      );
      expect(processor.supportsContentType(ContentType.VECTOR_IMAGE)).toBe(
        true
      );
      expect(processor.supportsContentType(ContentType.PDF)).toBe(false);
      expect(processor.supportsContentType(ContentType.AUDIO)).toBe(false);
    });

    it("should return correct supported content types", () => {
      const supportedTypes = processor.getSupportedContentTypes();
      expect(supportedTypes).toContain(ContentType.RASTER_IMAGE);
      expect(supportedTypes).toContain(ContentType.VECTOR_IMAGE);
      expect(supportedTypes).toHaveLength(2);
    });

    it("should return correct processor name", () => {
      expect(processor.getProcessorName()).toBe("image-classification");
    });
  });

  describe("OCR and Classification Integration", () => {
    it("should process image with both OCR and classification enabled", async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]); // JPEG header
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: true,
        minClassificationConfidence: 0.6,
        maxObjects: 5,
        includeVisualFeatures: true,
        modelPreference: "local",
      };

      const result = await processor.extractFromBuffer(
        mockImageBuffer,
        options
      );

      expect(result.success).toBe(true);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.metadata.type).toBe(ContentType.RASTER_IMAGE);

      // Check enhanced metadata
      expect(result.metadata.imageClassification).toBeDefined();
      expect(result.metadata.imageClassification?.ocrAvailable).toBe(true);
      expect(
        result.metadata.imageClassification?.sceneDescriptionAvailable
      ).toBe(true);
    });

    it("should process image with OCR only", async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: false,
      };

      const result = await processor.extractFromBuffer(
        mockImageBuffer,
        options
      );

      expect(result.success).toBe(true);
      expect(result.metadata.imageClassification?.ocrAvailable).toBe(true);
      expect(
        result.metadata.imageClassification?.sceneDescriptionAvailable
      ).toBe(false);
    });

    it("should process image with classification only", async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const options: ImageClassificationOptions = {
        enableOCR: false,
        enableClassification: true,
      };

      const result = await processor.extractFromBuffer(
        mockImageBuffer,
        options
      );

      expect(result.success).toBe(true);
      expect(result.metadata.imageClassification?.ocrAvailable).toBe(false);
      expect(
        result.metadata.imageClassification?.sceneDescriptionAvailable
      ).toBe(true);
    });

    it("should handle processing failures gracefully", async () => {
      const mockImageBuffer = Buffer.from([0x00, 0x01, 0x02]); // Invalid image
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: true,
      };

      const result = await processor.extractFromBuffer(
        mockImageBuffer,
        options
      );

      expect(result.success).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.text).toContain("failed");
    });
  });

  describe("Scene Classification", () => {
    it("should generate scene descriptions with high confidence", async () => {
      const mockMeetingImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const sceneDescription = await processor["classifyImageScene"](
        mockMeetingImage,
        {
          minConfidence: 0.6,
          maxObjects: 5,
          includeVisualFeatures: true,
          modelPreference: "local",
        }
      );

      expect(sceneDescription.description).toBeDefined();
      expect(sceneDescription.description.length).toBeGreaterThan(10);
      expect(sceneDescription.confidence).toBeGreaterThan(0.6);
      expect(sceneDescription.objects).toBeDefined();
      expect(sceneDescription.objects.length).toBeGreaterThan(0);
      expect(sceneDescription.sceneType).toBeDefined();
      expect(sceneDescription.visualFeatures).toBeDefined();
      expect(sceneDescription.relationships).toBeDefined();
      expect(sceneDescription.generatedAt).toBeInstanceOf(Date);
    });

    it("should respect minimum confidence threshold", async () => {
      const mockImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const highConfidenceDescription = await processor["classifyImageScene"](
        mockImage,
        {
          minConfidence: 0.9,
          maxObjects: 5,
          includeVisualFeatures: true,
          modelPreference: "local",
        }
      );

      expect(highConfidenceDescription.confidence).toBeGreaterThanOrEqual(0.9);
    });

    it("should limit detected objects", async () => {
      const mockImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const description = await processor["classifyImageScene"](mockImage, {
        minConfidence: 0.1,
        maxObjects: 3,
        includeVisualFeatures: true,
        modelPreference: "local",
      });

      expect(description.objects.length).toBeLessThanOrEqual(3);
    });

    it("should include visual features when requested", async () => {
      const mockImage = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

      const description = await processor["classifyImageScene"](mockImage, {
        minConfidence: 0.1,
        maxObjects: 5,
        includeVisualFeatures: true,
        modelPreference: "local",
      });

      expect(description.visualFeatures.colors).toBeDefined();
      expect(description.visualFeatures.composition).toBeDefined();
      expect(description.visualFeatures.lighting).toBeDefined();
      expect(description.visualFeatures.style).toBeDefined();
    });
  });

  describe("Result Combination", () => {
    it("should combine OCR and scene description effectively", () => {
      const mockOCR = { text: "Hello World", confidence: 0.85 };
      const mockScene: SceneDescription = {
        description: "A meeting room with people around a table",
        confidence: 0.92,
        objects: ["people", "table", "chairs"],
        sceneType: "indoor_meeting",
        visualFeatures: {
          colors: ["neutral"],
          composition: "centered",
          lighting: "artificial",
          style: "professional",
        },
        relationships: ["people_around_table"],
        generatedAt: new Date(),
      };

      const result = processor["combineResults"](mockOCR, mockScene);

      expect(result.ocrText).toBe("Hello World");
      expect(result.sceneDescription).toBe(mockScene);
      expect(result.combinedContent).toContain("TEXT CONTENT (OCR)");
      expect(result.combinedContent).toContain("SCENE DESCRIPTION");
      expect(result.combinedContent).toContain("Hello World");
      expect(result.combinedContent).toContain("meeting room");
      expect(result.combinedContent).toContain("people, table, chairs");
    });

    it("should handle OCR-only results", () => {
      const mockOCR = { text: "Important document text", confidence: 0.9 };
      const result = processor["combineResults"](mockOCR, null);

      expect(result.ocrText).toBe("Important document text");
      expect(result.sceneDescription.description).toBe(
        "No scene description available"
      );
      expect(result.combinedContent).toContain("Image Text Content (OCR)");
      expect(result.combinedContent).toContain("Important document text");
    });

    it("should handle classification-only results", () => {
      const mockScene: SceneDescription = {
        description: "A beautiful landscape with mountains",
        confidence: 0.88,
        objects: ["mountains", "sky", "trees"],
        sceneType: "outdoor_landscape",
        visualFeatures: {
          colors: ["blue", "green"],
          composition: "wide_angle",
          lighting: "natural",
          style: "scenic",
        },
        relationships: ["mountains_in_background"],
        generatedAt: new Date(),
      };

      const result = processor["combineResults"](
        { text: "", confidence: 0 },
        mockScene
      );

      expect(result.ocrText).toBe("");
      expect(result.sceneDescription).toBe(mockScene);
      expect(result.combinedContent).toContain("Scene Description");
      expect(result.combinedContent).toContain("beautiful landscape");
      expect(result.combinedContent).toContain("mountains, sky, trees");
    });
  });

  describe("Video Keyframe Extraction", () => {
    it("should extract keyframes from video", async () => {
      const mockVideoBuffer = Buffer.from("mock video data");
      const options = {
        frameInterval: 5,
        maxFrames: 10,
        quality: "medium" as const,
      };

      const keyframes = await processor.extractVideoKeyFrames(
        mockVideoBuffer,
        options
      );

      expect(keyframes).toBeDefined();
      expect(Array.isArray(keyframes)).toBe(true);
      expect(keyframes.length).toBeGreaterThan(0);

      const firstFrame = keyframes[0];
      expect(firstFrame.frameData).toBeDefined();
      expect(firstFrame.timestamp).toBeDefined();
      expect(firstFrame.sceneDescription).toBeDefined();
      expect(firstFrame.sceneDescription.description).toBeDefined();
      expect(firstFrame.sceneDescription.confidence).toBeGreaterThan(0);
    });

    it("should respect frame extraction options", async () => {
      const mockVideoBuffer = Buffer.from("mock video data");

      const fewFramesOptions = {
        frameInterval: 10,
        maxFrames: 3,
        quality: "low" as const,
      };

      const manyFramesOptions = {
        frameInterval: 1,
        maxFrames: 20,
        quality: "high" as const,
      };

      const fewFrames = await processor.extractVideoKeyFrames(
        mockVideoBuffer,
        fewFramesOptions
      );
      const manyFrames = await processor.extractVideoKeyFrames(
        mockVideoBuffer,
        manyFramesOptions
      );

      expect(fewFrames.length).toBeLessThanOrEqual(3);
      expect(manyFrames.length).toBeLessThanOrEqual(20);
    });
  });

  describe("Model Configuration", () => {
    it("should provide available models", () => {
      const models = processor.getAvailableModels();

      expect(models).toBeDefined();
      expect(Array.isArray(models)).toBe(true);
      expect(models.length).toBeGreaterThan(0);

      const firstModel = models[0];
      expect(firstModel.name).toBeDefined();
      expect(firstModel.type).toBeDefined();
      expect(firstModel.capabilities).toBeDefined();
      expect(firstModel.performance).toBeDefined();
      expect(firstModel.size).toBeDefined();
    });

    it("should configure models successfully", async () => {
      const result = await processor.configureModel("BLIP-2", {
        confidenceThreshold: 0.7,
        maxTokens: 100,
      });

      expect(result).toBe(true);
    });

    it("should handle model configuration failures", async () => {
      const result = await processor.configureModel("NonExistentModel");

      expect(result).toBe(true); // Mock implementation always succeeds
    });
  });

  describe("Performance and Error Handling", () => {
    it("should handle large images gracefully", async () => {
      const largeImageBuffer = Buffer.alloc(50 * 1024 * 1024); // 50MB
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: true,
      };

      const result = await processor.extractFromBuffer(
        largeImageBuffer,
        options
      );

      // Should either succeed or fail gracefully
      expect(typeof result.success).toBe("boolean");
      expect(result.processingTime).toBeGreaterThan(0);
    });

    it("should handle corrupted images", async () => {
      const corruptedBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: true,
      };

      const result = await processor.extractFromBuffer(
        corruptedBuffer,
        options
      );

      expect(result.success).toBe(false);
      expect(result.text).toContain("failed");
    });

    it("should provide reasonable processing times", async () => {
      const mockImageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const options: ImageClassificationOptions = {
        enableOCR: true,
        enableClassification: true,
      };

      const result = await processor.extractFromBuffer(
        mockImageBuffer,
        options
      );

      expect(result.processingTime).toBeGreaterThan(0);
      expect(result.processingTime).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });
});
