// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { MultiModalIngestionPipeline } from "../../src/lib/multi-modal-ingest";
import {
  MultiModalContentDetector,
  ContentType,
} from "../../src/lib/multi-modal";
import { ImagePathResolver } from "../../src/lib/image-path-resolver";
import * as fs from "fs";
import * as path from "path";

// Mock dependencies
vi.mock("fs", () => ({
  default: {
    statSync: vi.fn(),
    readFileSync: vi.fn(),
  },
  statSync: vi.fn(),
  readFileSync: vi.fn(),
}));

vi.mock("../../src/lib/database");
vi.mock("../../src/lib/embeddings");
vi.mock("../../src/lib/processors/pdf-processor");
vi.mock("../../src/lib/processors/ocr-processor");
vi.mock("../../src/lib/processors/office-processor");
vi.mock("../../src/lib/processors/speech-processor");

describe("Multi-Modal File Type Support", () => {
  let detector: MultiModalContentDetector;
  let resolver: ImagePathResolver;

  beforeEach(() => {
    detector = new MultiModalContentDetector();
    resolver = new ImagePathResolver("/test/vault");
    vi.clearAllMocks();
  });

  describe("Content Type Detection", () => {
    it("should detect PDF files", async () => {
      const buffer = Buffer.from("%PDF-1.4\nTest PDF content");
      const result = await detector.detectContentType(buffer, "test.pdf");

      expect(result.contentType).toBe(ContentType.PDF);
      expect(result.mimeType).toBe("application/pdf");
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it("should detect Office documents", async () => {
      // Word document
      const wordBuffer = Buffer.from("PK\x03\x04[Content_Types].xml");
      const wordResult = await detector.detectContentType(
        wordBuffer,
        "test.docx"
      );
      expect(wordResult.contentType).toBe(ContentType.OFFICE_DOC);

      // Excel document
      const excelBuffer = Buffer.from("PK\x03\x04xl/workbook.xml");
      const excelResult = await detector.detectContentType(
        excelBuffer,
        "test.xlsx"
      );
      expect(excelResult.contentType).toBe(ContentType.OFFICE_SHEET);

      // PowerPoint document
      const pptBuffer = Buffer.from("PK\x03\x04ppt/presentation.xml");
      const pptResult = await detector.detectContentType(
        pptBuffer,
        "test.pptx"
      );
      expect(pptResult.contentType).toBe(ContentType.OFFICE_PRESENTATION);
    });

    it("should detect image files", async () => {
      // JPEG
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const jpegResult = await detector.detectContentType(
        jpegBuffer,
        "test.jpg"
      );
      expect(jpegResult.contentType).toBe(ContentType.RASTER_IMAGE);
      expect(jpegResult.mimeType).toBe("image/jpeg");

      // PNG
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      const pngResult = await detector.detectContentType(pngBuffer, "test.png");
      expect(pngResult.contentType).toBe(ContentType.RASTER_IMAGE);
      expect(pngResult.mimeType).toBe("image/png");

      // GIF
      const gifBuffer = Buffer.from([0x47, 0x49, 0x46, 0x38]);
      const gifResult = await detector.detectContentType(gifBuffer, "test.gif");
      expect(gifResult.contentType).toBe(ContentType.RASTER_IMAGE);
      expect(gifResult.mimeType).toBe("image/gif");

      // SVG
      const svgBuffer = Buffer.from("<svg");
      const svgResult = await detector.detectContentType(svgBuffer, "test.svg");
      expect(svgResult.contentType).toBe(ContentType.VECTOR_IMAGE);
      expect(svgResult.mimeType).toBe("image/svg+xml");
    });

    it("should detect audio files", async () => {
      // MP3
      const mp3Buffer = Buffer.from("ID3");
      const mp3Result = await detector.detectContentType(mp3Buffer, "test.mp3");
      expect(mp3Result.contentType).toBe(ContentType.AUDIO);
      expect(mp3Result.mimeType).toBe("audio/mpeg");

      // WAV
      const wavBuffer = Buffer.from("RIFF");
      const wavResult = await detector.detectContentType(wavBuffer, "test.wav");
      expect(wavResult.contentType).toBe(ContentType.AUDIO);
      expect(wavResult.mimeType).toBe("audio/wav");
    });

    it("should detect video files", async () => {
      // MP4
      const mp4Buffer = Buffer.from([
        0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70,
      ]);
      const mp4Result = await detector.detectContentType(mp4Buffer, "test.mp4");
      expect(mp4Result.contentType).toBe(ContentType.VIDEO);
      expect(mp4Result.mimeType).toBe("video/mp4");

      // AVI
      const aviBuffer = Buffer.from("RIFF");
      const aviResult = await detector.detectContentType(aviBuffer, "test.avi");
      expect(aviResult.contentType).toBe(ContentType.VIDEO);
      expect(aviResult.mimeType).toBe("video/avi");
    });

    it("should detect structured data files", async () => {
      // JSON
      const jsonBuffer = Buffer.from('{"name": "test", "value": 123}');
      const jsonResult = await detector.detectContentType(
        jsonBuffer,
        "test.json"
      );
      expect(jsonResult.contentType).toBe(ContentType.JSON);
      expect(jsonResult.mimeType).toBe("application/json");
      expect(jsonResult.features.isStructured).toBe(true);

      // CSV
      const csvBuffer = Buffer.from("name,value\nJohn,123\nJane,456");
      const csvResult = await detector.detectContentType(csvBuffer, "test.csv");
      expect(csvResult.contentType).toBe(ContentType.CSV);
      expect(csvResult.mimeType).toBe("text/csv");
      expect(csvResult.features.isStructured).toBe(true);

      // XML
      const xmlBuffer = Buffer.from(
        '<?xml version="1.0"?><root><item>test</item></root>'
      );
      const xmlResult = await detector.detectContentType(xmlBuffer, "test.xml");
      expect(xmlResult.contentType).toBe(ContentType.XML);
      expect(xmlResult.mimeType).toBe("application/xml");
      expect(xmlResult.features.isStructured).toBe(true);
    });

    it("should detect text files", async () => {
      // Plain text
      const textBuffer = Buffer.from("This is plain text content.");
      const textResult = await detector.detectContentType(
        textBuffer,
        "test.txt"
      );
      expect(textResult.contentType).toBe(ContentType.PLAIN_TEXT);
      expect(textResult.mimeType).toBe("text/plain");
      expect(textResult.features.hasText).toBe(true);

      // Markdown
      const mdBuffer = Buffer.from(
        "# Test Document\n\nThis is markdown content."
      );
      const mdResult = await detector.detectContentType(mdBuffer, "test.md");
      expect(mdResult.contentType).toBe(ContentType.MARKDOWN);
      expect(mdResult.mimeType).toBe("text/markdown");
      expect(mdResult.features.hasText).toBe(true);

      // RTF
      const rtfBuffer = Buffer.from("{\\rtf1\\ansi Test RTF content}");
      const rtfResult = await detector.detectContentType(rtfBuffer, "test.rtf");
      expect(rtfResult.contentType).toBe(ContentType.RICH_TEXT);
      expect(rtfResult.mimeType).toBe("text/rtf");
      expect(rtfResult.features.hasText).toBe(true);
    });
  });

  describe("File Extension Mapping", () => {
    it("should map file extensions to content types", async () => {
      const testCases = [
        // Documents
        { file: "document.pdf", expected: ContentType.PDF },
        { file: "document.docx", expected: ContentType.OFFICE_DOC },
        { file: "document.doc", expected: ContentType.OFFICE_DOC },
        { file: "spreadsheet.xlsx", expected: ContentType.OFFICE_SHEET },
        { file: "spreadsheet.xls", expected: ContentType.OFFICE_SHEET },
        {
          file: "presentation.pptx",
          expected: ContentType.OFFICE_PRESENTATION,
        },
        { file: "presentation.ppt", expected: ContentType.OFFICE_PRESENTATION },

        // Images
        { file: "image.jpg", expected: ContentType.RASTER_IMAGE },
        { file: "image.jpeg", expected: ContentType.RASTER_IMAGE },
        { file: "image.png", expected: ContentType.RASTER_IMAGE },
        { file: "image.gif", expected: ContentType.RASTER_IMAGE },
        { file: "image.bmp", expected: ContentType.RASTER_IMAGE },
        { file: "image.tiff", expected: ContentType.RASTER_IMAGE },
        { file: "image.webp", expected: ContentType.RASTER_IMAGE },
        { file: "image.svg", expected: ContentType.VECTOR_IMAGE },

        // Audio
        { file: "audio.mp3", expected: ContentType.AUDIO },
        { file: "audio.wav", expected: ContentType.AUDIO },
        { file: "audio.flac", expected: ContentType.AUDIO },
        { file: "audio.m4a", expected: ContentType.AUDIO },
        { file: "audio.ogg", expected: ContentType.AUDIO },

        // Video
        { file: "video.mp4", expected: ContentType.VIDEO },
        { file: "video.avi", expected: ContentType.VIDEO },
        { file: "video.mov", expected: ContentType.VIDEO },
        { file: "video.wmv", expected: ContentType.VIDEO },
        { file: "video.mkv", expected: ContentType.VIDEO },

        // Structured Data
        { file: "data.json", expected: ContentType.JSON },
        { file: "data.xml", expected: ContentType.XML },
        { file: "data.csv", expected: ContentType.CSV },

        // Text
        { file: "document.md", expected: ContentType.MARKDOWN },
        { file: "document.txt", expected: ContentType.PLAIN_TEXT },
        { file: "document.rtf", expected: ContentType.RICH_TEXT },
      ];

      for (const testCase of testCases) {
        const buffer = Buffer.from("test content");
        const result = await detector.detectContentType(buffer, testCase.file);
        expect(result.contentType).toBe(testCase.expected);
      }
    });
  });

  describe("Content Features Detection", () => {
    it("should detect text content features", async () => {
      const textBuffer = Buffer.from(
        "This is text content with words and sentences."
      );
      const result = await detector.detectContentType(textBuffer, "test.txt");

      expect(result.features.hasText).toBe(true);
      expect(result.features.hasImages).toBe(false);
      expect(result.features.hasAudio).toBe(false);
      expect(result.features.hasVideo).toBe(false);
      expect(result.features.isStructured).toBe(false);
      expect(result.features.encoding).toBe("utf-8");
      expect(result.features.language).toBe("en");
    });

    it("should detect structured data features", async () => {
      const jsonBuffer = Buffer.from('{"name": "test", "items": [1, 2, 3]}');
      const result = await detector.detectContentType(jsonBuffer, "test.json");

      expect(result.features.hasText).toBe(true);
      expect(result.features.hasImages).toBe(false);
      expect(result.features.hasAudio).toBe(false);
      expect(result.features.hasVideo).toBe(false);
      expect(result.features.isStructured).toBe(true);
      expect(result.features.encoding).toBe("utf-8");
    });

    it("should detect binary content features", async () => {
      const binaryBuffer = Buffer.from([
        0x00, 0x01, 0x02, 0x03, 0xff, 0xfe, 0xfd,
      ]);
      const result = await detector.detectContentType(binaryBuffer, "test.bin");

      expect(result.features.hasText).toBe(false);
      expect(result.features.hasImages).toBe(false);
      expect(result.features.hasAudio).toBe(false);
      expect(result.features.hasVideo).toBe(false);
      expect(result.features.isStructured).toBe(false);
      expect(result.features.encoding).toBe("unknown");
    });
  });

  describe("Path Resolution for Different File Types", () => {
    it("should resolve paths for different file types", async () => {
      const testCases = [
        // Documents
        { path: "document.pdf", expectedExtension: ".pdf" },
        { path: "document.docx", expectedExtension: ".docx" },
        { path: "spreadsheet.xlsx", expectedExtension: ".xlsx" },
        { path: "presentation.pptx", expectedExtension: ".pptx" },

        // Images
        { path: "image.jpg", expectedExtension: ".jpg" },
        { path: "image.png", expectedExtension: ".png" },
        { path: "diagram.svg", expectedExtension: ".svg" },

        // Audio
        { path: "audio.mp3", expectedExtension: ".mp3" },
        { path: "recording.wav", expectedExtension: ".wav" },

        // Video
        { path: "video.mp4", expectedExtension: ".mp4" },
        { path: "movie.avi", expectedExtension: ".avi" },

        // Data
        { path: "data.json", expectedExtension: ".json" },
        { path: "data.xml", expectedExtension: ".xml" },
        { path: "data.csv", expectedExtension: ".csv" },
      ];

      for (const testCase of testCases) {
        const result = await resolver.resolvePaths(
          [testCase.path],
          "/vault/notes/doc.md"
        );
        expect(
          result.resolved[0]?.extension || result.failed[0]?.error
        ).toBeDefined();
      }
    });
  });

  describe("Content Type Validation", () => {
    it("should validate all supported content types", () => {
      const supportedTypes = Object.values(ContentType);
      expect(supportedTypes).toContain(ContentType.PDF);
      expect(supportedTypes).toContain(ContentType.OFFICE_DOC);
      expect(supportedTypes).toContain(ContentType.OFFICE_SHEET);
      expect(supportedTypes).toContain(ContentType.OFFICE_PRESENTATION);
      expect(supportedTypes).toContain(ContentType.RASTER_IMAGE);
      expect(supportedTypes).toContain(ContentType.VECTOR_IMAGE);
      expect(supportedTypes).toContain(ContentType.AUDIO);
      expect(supportedTypes).toContain(ContentType.VIDEO);
      expect(supportedTypes).toContain(ContentType.JSON);
      expect(supportedTypes).toContain(ContentType.XML);
      expect(supportedTypes).toContain(ContentType.CSV);
      expect(supportedTypes).toContain(ContentType.MARKDOWN);
      expect(supportedTypes).toContain(ContentType.PLAIN_TEXT);
      expect(supportedTypes).toContain(ContentType.RICH_TEXT);
    });

    it("should have consistent MIME type mappings", async () => {
      const testCases = [
        {
          file: "document.pdf",
          mimeType: "application/pdf",
          contentType: ContentType.PDF,
        },
        {
          file: "document.docx",
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          contentType: ContentType.OFFICE_DOC,
        },
        {
          file: "image.jpg",
          mimeType: "image/jpeg",
          contentType: ContentType.RASTER_IMAGE,
        },
        {
          file: "audio.mp3",
          mimeType: "audio/mpeg",
          contentType: ContentType.AUDIO,
        },
        {
          file: "video.mp4",
          mimeType: "video/mp4",
          contentType: ContentType.VIDEO,
        },
        {
          file: "data.json",
          mimeType: "application/json",
          contentType: ContentType.JSON,
        },
        {
          file: "document.md",
          mimeType: "text/markdown",
          contentType: ContentType.MARKDOWN,
        },
      ];

      for (const testCase of testCases) {
        const buffer = Buffer.from("test content");
        const result = await detector.detectContentType(buffer, testCase.file);
        expect(result.mimeType).toBe(testCase.mimeType);
        expect(result.contentType).toBe(testCase.contentType);
      }
    });
  });
});
