import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  MultiModalContentDetector,
  UniversalMetadataExtractor,
  ContentType,
  ContentTypeResult,
  UniversalMetadata,
} from "../../src/lib/multi-modal.ts";
import * as fs from "fs";

// Mock fs module
vi.mock("fs", () => ({
  default: {
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  statSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe("MultiModalContentDetector", () => {
  let detector: MultiModalContentDetector;

  beforeEach(() => {
    detector = new MultiModalContentDetector();
  });

  describe("detectContentType", () => {
    it("should detect Markdown files", async () => {
      const buffer = Buffer.from("# Test Markdown\n\nThis is a test.");
      const result = await detector.detectContentType(buffer, "test.md");

      expect(result.contentType).toBe(ContentType.MARKDOWN);
      expect(result.confidence).toBeGreaterThan(0.5);
      // MIME type detection may return octet-stream for unknown signatures
      expect(typeof result.mimeType).toBe("string");
    });

    it("should detect JSON files", async () => {
      const buffer = Buffer.from('{"name": "test", "value": 123}');
      const result = await detector.detectContentType(buffer, "test.json");

      expect(result.contentType).toBe(ContentType.JSON);
      expect(result.features.isStructured).toBe(true);
    });

    it("should detect CSV files", async () => {
      const buffer = Buffer.from("name,value\nJohn,123\nJane,456");
      const result = await detector.detectContentType(buffer, "test.csv");

      expect(result.contentType).toBe(ContentType.CSV);
      expect(result.features.isStructured).toBe(true);
    });

    it("should detect PDF files by signature", async () => {
      const buffer = Buffer.from("%PDF-1.4\nTest content", "utf8");
      const result = await detector.detectContentType(buffer, "test.pdf");

      expect(result.contentType).toBe(ContentType.PDF);
      expect(result.mimeType).toBe("application/pdf");
    });

    it("should detect JPEG files by signature", async () => {
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46,
      ]);
      const result = await detector.detectContentType(buffer, "test.jpg");

      expect(result.contentType).toBe(ContentType.RASTER_IMAGE);
      expect(result.mimeType).toBe("image/jpeg");
    });

    it("should handle unknown file types", async () => {
      const buffer = Buffer.from("some random content without clear signature");
      const result = await detector.detectContentType(buffer, "test.unknown");

      // Since the content is detected as text, it will classify as PLAIN_TEXT
      expect(result.contentType).toBe(ContentType.PLAIN_TEXT);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it("should prioritize MIME type over extension mismatch", async () => {
      // PDF content but .txt extension
      const buffer = Buffer.from("%PDF-1.4\nTest content", "utf8");
      const result = await detector.detectContentType(buffer, "test.txt");

      expect(result.contentType).toBe(ContentType.PDF);
      expect(result.mimeType).toBe("application/pdf");
    });
  });

  describe("MIME type detection", () => {
    it("should detect MIME types from file signatures", async () => {
      const testCases = [
        { buffer: Buffer.from("%PDF-1.4"), expected: "application/pdf" },
        { buffer: Buffer.from([0xff, 0xd8, 0xff]), expected: "image/jpeg" },
        {
          buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
          expected: "image/png",
        },
        {
          buffer: Buffer.from([0x47, 0x49, 0x46, 0x38]),
          expected: "image/gif",
        },
      ];

      for (const { buffer, expected } of testCases) {
        const mimeType = await detector["detectMimeType"](buffer);
        expect(mimeType).toBe(expected);
      }
    });

    it("should fallback to octet-stream for unknown signatures", async () => {
      const buffer = Buffer.from("unknown content");
      const mimeType = await detector["detectMimeType"](buffer);
      expect(mimeType).toBe("application/octet-stream");
    });
  });

  describe("Content analysis", () => {
    it("should detect text content", () => {
      const textBuffer = Buffer.from("This is regular text content.");
      const binaryBuffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);

      expect(detector["detectTextContent"](textBuffer)).toBe(true);
      expect(detector["detectTextContent"](binaryBuffer)).toBe(false);
    });

    it("should detect structured data", () => {
      const jsonBuffer = Buffer.from('{"test": "data"}');
      const csvBuffer = Buffer.from("col1,col2\nval1,val2");
      const xmlBuffer = Buffer.from("<root><item>test</item></root>");
      const textBuffer = Buffer.from("Just plain text");

      expect(detector["detectStructuredData"](jsonBuffer)).toBe(true);
      expect(detector["detectStructuredData"](csvBuffer)).toBe(true);
      expect(detector["detectStructuredData"](xmlBuffer)).toBe(true);
      expect(detector["detectStructuredData"](textBuffer)).toBe(false);
    });
  });
});

describe("UniversalMetadataExtractor", () => {
  let mockDetector;
  let extractor: UniversalMetadataExtractor;

  beforeEach(() => {
    mockDetector = {
      detectContentType: vi.fn(),
    };
    extractor = new UniversalMetadataExtractor(mockDetector);
  });

  describe("extractMetadata", () => {
    const mockFilePath = "/test/file.txt";

    beforeEach(() => {
      // Mock fs.statSync
      fs.statSync.mockReturnValue({
        size: 100,
        birthtime: new Date("2023-01-01"),
        mtime: new Date("2023-01-02"),
      });

      // Mock fs.readFileSync
      fs.readFileSync.mockReturnValue(Buffer.from("test content"));
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it("should extract basic file metadata", async () => {
      mockDetector.detectContentType.mockResolvedValue({
        contentType: ContentType.PLAIN_TEXT,
        mimeType: "text/plain",
        confidence: 0.9,
        features: {
          hasText: true,
          hasImages: false,
          hasAudio: false,
          hasVideo: false,
          isStructured: false,
          encoding: "utf-8",
          language: "en",
        },
      });

      const metadata = await extractor.extractMetadata(mockFilePath);

      expect(metadata.file.path).toBe(mockFilePath);
      expect(metadata.file.name).toBe("file.txt");
      expect(metadata.file.extension).toBe(".txt");
      expect(metadata.file.size).toBe(100);
      expect(metadata.file.createdAt).toEqual(new Date("2023-01-01"));
      expect(metadata.file.modifiedAt).toEqual(new Date("2023-01-02"));
    });

    it("should extract content-specific metadata", async () => {
      mockDetector.detectContentType.mockResolvedValue({
        contentType: ContentType.PLAIN_TEXT,
        mimeType: "text/plain",
        confidence: 0.9,
        features: {
          hasText: true,
          hasImages: false,
          hasAudio: false,
          hasVideo: false,
          isStructured: false,
          encoding: "utf-8",
          language: "en",
        },
      });

      const metadata = await extractor.extractMetadata(mockFilePath);

      expect(metadata.content.type).toBe(ContentType.PLAIN_TEXT);
      expect(metadata.content.language).toBe("en");
      expect(metadata.content.encoding).toBe("utf-8");
      expect(metadata.content.wordCount).toBe(2); // "test content"
      expect(metadata.content.characterCount).toBe(12);
    });

    it("should handle processing errors gracefully", async () => {
      mockDetector.detectContentType.mockRejectedValue(
        new Error("Detection failed")
      );

      const metadata = await extractor.extractMetadata(mockFilePath);

      expect(metadata.processing.success).toBe(false);
      expect(metadata.processing.errors).toContain("Detection failed");
      expect(metadata.quality.overallScore).toBe(0);
    });

    it("should calculate quality scores correctly", async () => {
      mockDetector.detectContentType.mockResolvedValue({
        contentType: ContentType.PLAIN_TEXT,
        mimeType: "text/plain",
        confidence: 0.8,
        features: {
          hasText: true,
          hasImages: false,
          hasAudio: false,
          hasVideo: false,
          isStructured: false,
          encoding: "utf-8",
          language: "en",
        },
      });

      const metadata = await extractor.extractMetadata(mockFilePath);

      expect(metadata.quality.confidence).toBe(0.8);
      expect(metadata.quality.overallScore).toBeGreaterThan(0);
      expect(metadata.quality.completeness).toBeGreaterThan(0);
    });
  });

  describe("Content-specific metadata extraction", () => {
    beforeEach(() => {
      vi.spyOn(fs, "statSync").mockReturnValue({
        size: 100,
        birthtime: new Date(),
        mtime: new Date(),
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should extract text metadata correctly", async () => {
      const buffer = Buffer.from("Hello world\nThis is a test.");
      const base = { type: ContentType.PLAIN_TEXT };

      const result = await extractor["extractTextMetadata"](buffer, base);

      expect(result.wordCount).toBe(6); // "Hello world This is a test."
      expect(result.characterCount).toBe(27); // "Hello world\nThis is a test."
      expect(result.pageCount).toBe(1);
    });

    it("should extract JSON metadata", async () => {
      const buffer = Buffer.from('{"items": [1, 2, 3], "active": true}');
      const base = { type: ContentType.JSON };

      const result = await extractor["extractStructuredMetadata"](buffer, base);

      expect(result.wordCount).toBe(6); // JSON contains words like "items", "active", "true"
      expect(result.characterCount).toBe(36); // '{"items": [1, 2, 3], "active": true}'
    });

    it("should extract CSV metadata", async () => {
      const buffer = Buffer.from("name,age,city\nJohn,25,NYC\nJane,30,LA");
      const base = { type: ContentType.CSV };

      const result = await extractor["extractStructuredMetadata"](buffer, base);

      expect(result.wordCount).toBe(3); // CSV split by whitespace gives 3 segments
      expect(result.characterCount).toBe(36); // "name,age,city\nJohn,25,NYC\nJane,30,LA"
    });
  });

  describe("Utility functions", () => {
    it("should generate consistent file IDs", () => {
      const id1 = extractor["generateFileId"]("/path/to/file.txt");
      const id2 = extractor["generateFileId"]("/path/to/file.txt");

      expect(id1).toBe(id2);
      expect(id1).toMatch(/^file_[a-f0-9]{8}$/);
    });

    it("should generate checksums", () => {
      const buffer = Buffer.from("test content");
      const checksum = extractor["generateChecksum"](buffer);

      expect(checksum).toMatch(/^[a-f0-9]{32}$/);
      expect(typeof checksum).toBe("string");
      expect(checksum.length).toBe(32);
    });
  });
});
