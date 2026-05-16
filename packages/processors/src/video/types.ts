import { ContentMetadata } from "@kv/types";
import {
  ExtractedEntity,
  EntityRelationship,
} from "@kv/utils";
import { ProcessorOptions } from "../base-processor.ts";

export interface VideoMetadata {
  duration: number; // seconds
  width: number;
  height: number;
  frameRate: number;
  codec: string;
  bitrate?: number;
  format: string;
  size: number; // bytes
  aspectRatio: string;
  audioCodec?: string;
  hasAudio: boolean;
  creationTime?: Date;
}

export interface VideoProcessorOptions extends ProcessorOptions {
  enableSpeechTranscription?: boolean;
  frameExtractionInterval?: number; // seconds between frame extractions
  maxFramesToExtract?: number;
  enableOCR?: boolean;
  /** ffmpeg scene-change sensitivity (0..1). Lower = more scenes detected. Default 0.3. */
  sceneThreshold?: number;
  /** Minimum seconds between detected scene changes. Default 1.0. */
  minSceneLength?: number;
  /** Perceptual-hash deduplication of near-identical frames. Default true. */
  enableFrameDeduplication?: boolean;
  /** If set, export artifacts (keyframes, transcript, manifest) to this directory. */
  outputDir?: string;
}

export interface ExtractedFrame {
  frameNumber: number;
  timestamp: number; // seconds
  imagePath: string;
  ocrText?: string;
  ocrConfidence?: number;
  entities?: ExtractedEntity[];
  textBlocks?: Array<{
    text: string;
    confidence: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
}

export interface VideoContentMetadata extends ContentMetadata {
  videoMetadata: {
    duration: number;
    frameRate: number;
    resolution: string;
    keyframesExtracted: number;
    audioAvailable: boolean;
    subtitlesAvailable: boolean;
    width: number;
    height: number;
    codec: string;
    bitrate?: number;
    format: string;
    size: number;
    aspectRatio: string;
    audioCodec?: string;
    hasAudio: boolean;
    creationTime?: Date;
  };
  hasText: boolean;
  frameCount: number;
  extractedFrames: ExtractedFrame[];
  audioTranscription?: {
    text: string;
    hasAudio: boolean;
    segments?: Array<{
      start: number;
      end: number;
      text: string;
      confidence?: number;
    }>;
    wordCount: number;
    speechDuration: number;
    qualityScore: number;
  };
  entities?: ExtractedEntity[];
  relationships?: EntityRelationship[];
  keyframes?: {
    count: number;
    intervals: number[]; // timestamps of significant frames
  };
  textSummary?: {
    totalTextBlocks: number;
    averageConfidence: number;
    languages: string[];
    dominantLanguage: string;
  };
  contentClassification?: {
    isScreenRecording: boolean;
    hasUI: boolean;
    hasCode: boolean;
    hasPresentation: boolean;
    confidence: number;
  };
}
