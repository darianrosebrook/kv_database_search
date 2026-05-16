/**
 * @kv/types — tool-neutral content type definitions
 *
 * Types extracted from apps/kv_database/src/types/index.ts so that
 * @kv/processors and other workspace packages can depend on them
 * without taking a dependency on @kv/database.
 */

// Content classification used in search/meta
export enum ContentType {
  // Text types
  PLAIN_TEXT = "plain_text",
  MARKDOWN = "markdown",
  RICH_TEXT = "rich_text",
  CODE = "code",
  TEXT = "text",
  WEB = "web",
  CHAT_SESSION = "chat_session",

  // Document types
  PDF = "pdf",
  OFFICE_DOC = "office_doc",
  OFFICE_SHEET = "office_sheet",
  OFFICE_PRESENTATION = "office_presentation",

  // Image types
  RASTER_IMAGE = "raster_image",
  VECTOR_IMAGE = "vector_image",

  // Audio/Video types
  AUDIO = "audio",
  AUDIO_FILE = "audio_file",
  VIDEO = "video",

  // Structured data types
  JSON = "json",
  XML = "xml",
  CSV = "csv",

  // Special types
  BINARY = "binary",
  UNKNOWN = "unknown",
}

// Content type definitions (renamed to avoid conflict with ContentType)
export enum MultiModalContentType {
  // Text-based
  MARKDOWN = "markdown",
  PLAIN_TEXT = "plain_text",
  RICH_TEXT = "rich_text",

  // Documents
  PDF = "pdf",
  OFFICE_DOC = "office_document",
  OFFICE_SHEET = "office_spreadsheet",
  OFFICE_PRESENTATION = "office_presentation",

  // Images
  RASTER_IMAGE = "raster_image",
  VECTOR_IMAGE = "vector_image",
  DOCUMENT_IMAGE = "document_image",

  // Audio
  AUDIO = "audio",
  AUDIO_FILE = "audio_file",
  SPEECH = "speech",

  // Video
  VIDEO = "video",

  // Structured Data
  JSON = "json",
  XML = "xml",
  CSV = "csv",

  // Binary/Other
  BINARY = "binary",
  UNKNOWN = "unknown",
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ContentMetadata {
  type: ContentType;
  language?: string;
  encoding?: string;
  dimensions?: Dimensions;
  duration?: number;
  pageCount?: number;
  wordCount?: number;
  characterCount?: number;

  // Enhanced image classification metadata
  imageClassification?: {
    ocrAvailable: boolean;
    ocrConfidence: number;
    sceneDescriptionAvailable: boolean;
    sceneConfidence: number;
    objectsDetected: number;
    visualFeaturesAnalyzed: boolean;
    processingTime: number;
    modelUsed: string;
    keyFrames?: Array<{
      timestamp: number;
      description: string;
      confidence: number;
    }>;
  };

  // Scene description metadata
  sceneDescription?: {
    description: string;
    confidence: number;
    objects: string[];
    sceneType: string;
    visualFeatures: {
      colors: string[];
      composition: string;
      lighting: string;
      style: string;
    };
    relationships: string[];
    generatedAt: Date;
  };

  // Video processing metadata
  videoMetadata?: {
    duration: number;
    frameRate: number;
    resolution: string;
    keyframesExtracted: number;
    audioAvailable: boolean;
    subtitlesAvailable: boolean;
  };
}
