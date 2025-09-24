// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from "vitest";
import { SpeechProcessor } from "../../src/lib/processors/speech-processor.js";
import { ContentType } from "../../src/lib/multi-modal.js";

// Mock sherpa-onnx
vi.mock("sherpa-onnx", () => ({
  createModel: vi.fn(),
  createRecognizer: vi.fn(),
}));

// Mock pdf-parse to prevent initialization issues
vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({
    text: "mock pdf text",
    numpages: 1,
    info: {},
  }),
}));

// Mock fs module
vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}));

import { createModel, createRecognizer } from "sherpa-onnx";

describe("SpeechProcessor", () => {
  let processor: SpeechProcessor;
  let mockModel: any;
  let mockRecognizer: any;
  let mockStream: any;

  beforeEach(() => {
    processor = new SpeechProcessor();

    mockStream = {
      acceptWaveform: vi.fn(),
      inputFinished: vi.fn(),
    };

    mockRecognizer = {
      reset: vi.fn(),
      createStream: vi.fn().mockReturnValue(mockStream),
      getResult: vi.fn(),
      free: vi.fn(),
    };

    mockModel = {
      free: vi.fn(),
    };

    (createModel as any).mockReturnValue(mockModel);
    (createRecognizer as any).mockReturnValue(mockRecognizer);
  });

  describe("transcribeFromBuffer", () => {
    it("should transcribe audio successfully", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "This is a test transcription.",
      });

      // Mock the audio conversion to return valid data
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio data");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.text).toBe("This is a test transcription.");
      expect(result.metadata.type).toBe(ContentType.AUDIO);
      expect(result.metadata.hasText).toBe(true);
      expect(result.metadata.wordCount).toBe(5); // "This is a test transcription."
      expect(result.metadata.speechMetadata?.language).toBe("en");
      expect(result.metadata.speechMetadata?.engine).toBe("sherpa-onnx");
    });

    it("should handle audio with no speech", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "",
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio data");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.text).toContain("No speech detected");
      expect(result.metadata.hasText).toBe(false);
      expect(result.metadata.wordCount).toBe(0);
    });

    it("should handle transcription errors gracefully", async () => {
      mockRecognizer.createStream.mockImplementation(() => {
        throw new Error("Audio processing failed");
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio data");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.text).toContain("Speech processing error");
      expect(result.metadata.hasText).toBe(false);
    });

    it("should accept custom language option", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "Hola mundo",
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio data");
      const result = await processor.transcribeFromBuffer(buffer, { language: "es" });

      expect(result.metadata.speechMetadata?.language).toBe("es");
    });

    it("should handle unsupported audio formats", async () => {
      // Mock the convertBufferToAudioData to return null
      const originalMethod = processor["convertBufferToAudioData"];
      processor["convertBufferToAudioData"] = vi.fn().mockReturnValue(null);

      const buffer = Buffer.from("unsupported format");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.text).toContain("Unsupported audio format");
      expect(result.metadata.hasText).toBe(false);

      // Restore original method
      processor["convertBufferToAudioData"] = originalMethod;
    });
  });

  describe("transcribeFromFile", () => {
    it("should read file and transcribe audio", async () => {
      // Mock fs.readFileSync
      const fs = await import("fs");
      vi.spyOn(fs, "readFileSync").mockReturnValue(Buffer.from("audio file data"));

      mockRecognizer.getResult.mockReturnValue({
        text: "File transcription result",
      });

      const result = await processor.transcribeFromFile("/test/audio.wav");

      expect(result.text).toBe("File transcription result");
      expect(result.metadata.type).toBe(ContentType.AUDIO);
    });

    it("should handle file read errors", async () => {
      const fs = await import("fs");
      vi.spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = await processor.transcribeFromFile("/test/missing.wav");

      expect(result.text).toContain("Failed to read file");
      expect(result.metadata.hasText).toBe(false);
    });
  });

  describe("isSupportedAudioFormat", () => {
    it("should validate WAV files", () => {
      const wavBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]); // RIFF
      expect(processor.isSupportedAudioFormat(wavBuffer)).toBe(true);
    });

    it("should validate MP3 files", () => {
      const mp3Buffer = Buffer.from([0x49, 0x44, 0x33]); // ID3
      expect(processor.isSupportedAudioFormat(mp3Buffer)).toBe(true);
    });

    it("should validate MP4/M4A files", () => {
      const mp4Buffer = Buffer.from([0x66, 0x74, 0x79, 0x70]); // ftyp
      expect(processor.isSupportedAudioFormat(mp4Buffer)).toBe(true);
    });

    it("should reject unsupported formats", () => {
      const textBuffer = Buffer.from("not audio data");
      expect(processor.isSupportedAudioFormat(textBuffer)).toBe(false);
    });
  });

  describe("Language detection", () => {
    it("should detect English in transcription", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "This is a test with the and or but words for language detection.",
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.metadata.language).toBe("en");
    });

    it("should detect Spanish in transcription", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "Este es un test con el la los las y o pero palabras.",
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.metadata.language).toBe("es");
    });

    it("should return unknown for ambiguous text", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "xyz abc def random words",
      });

      // Mock the audio conversion
      const mockAudioData = new Float32Array([0.1, 0.2, 0.3]);
      vi.spyOn(processor as any, "convertBufferToAudioData").mockReturnValue(mockAudioData);

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.metadata.language).toBe("unknown");
    });
  });

  describe("Initialization and cleanup", () => {
    it("should initialize on first use", async () => {
      mockRecognizer.getResult.mockReturnValue({ text: "test" });

      await processor.transcribeFromBuffer(Buffer.from("test"));

      expect(createModel).toHaveBeenCalled();
      expect(createRecognizer).toHaveBeenCalled();
      expect(processor.isReady()).toBe(true);
    });

    it("should reuse initialized processor", async () => {
      mockRecognizer.getResult.mockReturnValue({ text: "test" });

      await processor.transcribeFromBuffer(Buffer.from("test1"));
      await processor.transcribeFromBuffer(Buffer.from("test2"));

      expect(createModel).toHaveBeenCalledTimes(1);
      expect(createRecognizer).toHaveBeenCalledTimes(1);
    });

    it("should cleanup resources", async () => {
      await processor.cleanup();

      expect(mockRecognizer.free).toHaveBeenCalled();
      expect(mockModel.free).toHaveBeenCalled();
      expect(processor.isReady()).toBe(false);
    });
  });

  describe("Processing metadata", () => {
    it("should include processing time in metadata", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "Test transcription",
      });

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.metadata.speechMetadata?.processingTime).toBeGreaterThan(0);
      expect(typeof result.metadata.speechMetadata?.processingTime).toBe("number");
    });

    it("should estimate audio duration", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "Test transcription",
      });

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer, { sampleRate: 16000 });

      expect(result.metadata.speechMetadata?.sampleRate).toBe(16000);
      expect(result.metadata.speechMetadata?.duration).toBeDefined();
    });

    it("should include confidence when text is detected", async () => {
      mockRecognizer.getResult.mockReturnValue({
        text: "Confident transcription result",
      });

      const buffer = Buffer.from("fake audio");
      const result = await processor.transcribeFromBuffer(buffer);

      expect(result.metadata.speechMetadata?.confidence).toBe(0.8);
      expect(result.metadata.speechMetadata?.engine).toBe("sherpa-onnx");
    });
  });
});
