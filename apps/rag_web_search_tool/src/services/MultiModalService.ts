// Multi-Modal Processing Service - UI integration for diverse content processing
const MULTIMODAL_API_BASE = "http://localhost:3001/multi-modal";

export interface ContentType {
  PDF = "pdf";
  OFFICE_DOC = "office_document";
  OFFICE_SHEET = "office_spreadsheet";
  OFFICE_PRESENTATION = "office_presentation";
  RASTER_IMAGE = "raster_image";
  VECTOR_IMAGE = "vector_image";
  DOCUMENT_IMAGE = "document_image";
  AUDIO = "audio";
  AUDIO_FILE = "audio_file";
  SPEECH = "speech";
  VIDEO = "video";
  JSON = "json";
  XML = "xml";
  CSV = "csv";
  MARKDOWN = "markdown";
  PLAIN_TEXT = "plain_text";
  RICH_TEXT = "rich_text";
  BINARY = "binary";
  UNKNOWN = "unknown";
}

export interface ProcessorOptions {
  enableOCR?: boolean;
  enableImageClassification?: boolean;
  enableAudioTranscription?: boolean;
  enableVideoProcessing?: boolean;
  enableSpeechRecognition?: boolean;
  extractMetadata?: boolean;
  chunkSize?: number;
  chunkOverlap?: number;
  maxEntities?: number;
  minConfidence?: number;
  language?: string;
  domain?: string;
  customProcessing?: Record<string, any>;
}

export interface ContentMetadata {
  type: string;
  language: string;
  encoding: string;
  size: number;
  mimeType: string;
  fileName: string;
  uploadDate: string;
  checksum: string;
  tags: string[];
  customFields: Record<string, any>;
}

export interface ProcessorResult {
  text: string;
  metadata: ContentMetadata;
  success: boolean;
  errors: string[];
  processingTime: number;
  chunks?: Array<{
    text: string;
    start: number;
    end: number;
    metadata: Record<string, any>;
  }>;
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
    position: {
      start: number;
      end: number;
    };
    metadata: Record<string, any>;
  }>;
  images?: Array<{
    url: string;
    description: string;
    metadata: Record<string, any>;
  }>;
  audio?: {
    transcription: string;
    duration: number;
    language: string;
    confidence: number;
  };
  video?: {
    transcription: string;
    duration: number;
    frames: number;
    metadata: Record<string, any>;
  };
  structured?: {
    format: string;
    schema: Record<string, any>;
    data: Record<string, any>;
  };
}

export interface MultiModalProcessingResult {
  fileId: string;
  fileName: string;
  contentType: string;
  results: ProcessorResult[];
  summary: {
    totalTextLength: number;
    totalChunks: number;
    totalEntities: number;
    totalImages: number;
    processingTime: number;
    success: boolean;
    errors: string[];
  };
  metadata: {
    uploadedAt: string;
    processedAt: string;
    version: string;
    processorVersions: Record<string, string>;
  };
}

export interface BatchProcessingRequest {
  files: File[];
  options: ProcessorOptions;
  workspaceName?: string;
  autoSync?: boolean;
}

export interface BatchProcessingResult {
  requestId: string;
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  results: MultiModalProcessingResult[];
  summary: {
    totalProcessingTime: number;
    averageProcessingTime: number;
    totalTextExtracted: number;
    totalEntitiesFound: number;
    totalErrors: number;
    throughput: number;
  };
  errors: Array<{
    fileName: string;
    error: string;
    timestamp: string;
  }>;
}

export interface ContentTypeInfo {
  type: string;
  name: string;
  description: string;
  supportedFormats: string[];
  processor: string;
  capabilities: string[];
  icon: string;
}

export interface ProcessingStatus {
  fileId: string;
  fileName: string;
  status: "queued" | "processing" | "completed" | "failed";
  progress: number;
  currentStep?: string;
  estimatedTimeRemaining?: number;
  result?: ProcessorResult;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export class MultiModalService {
  private static instance: MultiModalService;
  private baseUrl: string;

  private constructor(baseUrl: string = MULTIMODAL_API_BASE) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): MultiModalService {
    if (!MultiModalService.instance) {
      MultiModalService.instance = new MultiModalService();
    }
    return MultiModalService.instance;
  }

  // ============================================================================
  // CONTENT TYPE DETECTION
  // ============================================================================

  detectContentType(file: File): Promise<ContentTypeInfo> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const buffer = e.target?.result as ArrayBuffer;
        const bytes = new Uint8Array(buffer);

        // Simple content type detection based on magic numbers and file extension
        const type = this.detectContentTypeFromBytes(bytes, file.name);
        resolve(type);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file.slice(0, 1024)); // Read first 1KB for detection
    });
  }

  private detectContentTypeFromBytes(bytes: Uint8Array, fileName: string): ContentTypeInfo {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';

    // PDF detection
    if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
      return this.getContentTypeInfo('pdf');
    }

    // Office documents
    if ((bytes[0] === 0x50 && bytes[1] === 0x4B) || extension === 'docx' || extension === 'xlsx' || extension === 'pptx') {
      if (extension === 'xlsx') return this.getContentTypeInfo('office_spreadsheet');
      if (extension === 'pptx') return this.getContentTypeInfo('office_presentation');
      return this.getContentTypeInfo('office_document');
    }

    // Images
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
      return this.getContentTypeInfo('raster_image'); // JPEG
    }
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      return this.getContentTypeInfo('raster_image'); // PNG
    }
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return this.getContentTypeInfo('raster_image'); // GIF
    }
    if (bytes[0] === 0x42 && bytes[1] === 0x4D) {
      return this.getContentTypeInfo('raster_image'); // BMP
    }
    if (bytes[0] === 0x49 && bytes[1] === 0x49 && bytes[2] === 0x2A && bytes[3] === 0x00) {
      return this.getContentTypeInfo('raster_image'); // TIFF
    }
    if (extension === 'jpg' || extension === 'jpeg' || extension === 'png' || extension === 'gif' || extension === 'bmp' || extension === 'tiff') {
      return this.getContentTypeInfo('raster_image');
    }

    // Audio
    if ((bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0) || extension === 'mp3') {
      return this.getContentTypeInfo('audio'); // MP3
    }
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
      return this.getContentTypeInfo('audio'); // WAV/RIFF
    }
    if (extension === 'wav' || extension === 'm4a' || extension === 'ogg') {
      return this.getContentTypeInfo('audio');
    }

    // Video
    if (bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x00 && bytes[3] === 0x20) {
      return this.getContentTypeInfo('video'); // MP4
    }
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x41 && bytes[9] === 0x56 && bytes[10] === 0x49) {
      return this.getContentTypeInfo('video'); // AVI
    }
    if (extension === 'mp4' || extension === 'avi' || extension === 'mov' || extension === 'mkv') {
      return this.getContentTypeInfo('video');
    }

    // Text formats
    if (extension === 'json') return this.getContentTypeInfo('json');
    if (extension === 'xml') return this.getContentTypeInfo('xml');
    if (extension === 'csv') return this.getContentTypeInfo('csv');
    if (extension === 'md') return this.getContentTypeInfo('markdown');
    if (extension === 'txt') return this.getContentTypeInfo('plain_text');

    return this.getContentTypeInfo('unknown');
  }

  private getContentTypeInfo(type: string): ContentTypeInfo {
    const contentTypes: Record<string, ContentTypeInfo> = {
      pdf: {
        type: 'pdf',
        name: 'PDF Document',
        description: 'Portable Document Format files',
        supportedFormats: ['.pdf'],
        processor: 'PDFProcessorAdapter',
        capabilities: ['text_extraction', 'layout_analysis', 'metadata_extraction'],
        icon: '📄'
      },
      office_document: {
        type: 'office_document',
        name: 'Office Document',
        description: 'Microsoft Word documents',
        supportedFormats: ['.docx', '.doc'],
        processor: 'OfficeProcessor',
        capabilities: ['text_extraction', 'formatting_preservation', 'metadata_extraction'],
        icon: '📝'
      },
      office_spreadsheet: {
        type: 'office_spreadsheet',
        name: 'Spreadsheet',
        description: 'Microsoft Excel spreadsheets',
        supportedFormats: ['.xlsx', '.xls'],
        processor: 'OfficeProcessor',
        capabilities: ['data_extraction', 'formula_analysis', 'chart_detection'],
        icon: '📊'
      },
      office_presentation: {
        type: 'office_presentation',
        name: 'Presentation',
        description: 'Microsoft PowerPoint presentations',
        supportedFormats: ['.pptx', '.ppt'],
        processor: 'OfficeProcessor',
        capabilities: ['text_extraction', 'slide_analysis', 'image_extraction'],
        icon: '📋'
      },
      raster_image: {
        type: 'raster_image',
        name: 'Image',
        description: 'Raster images (JPEG, PNG, GIF, etc.)',
        supportedFormats: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'],
        processor: 'OCRProcessor',
        capabilities: ['ocr', 'image_classification', 'scene_description'],
        icon: '🖼️'
      },
      audio: {
        type: 'audio',
        name: 'Audio',
        description: 'Audio files (MP3, WAV, etc.)',
        supportedFormats: ['.mp3', '.wav', '.m4a', '.ogg'],
        processor: 'AudioTranscriptionProcessor',
        capabilities: ['transcription', 'speech_recognition', 'audio_analysis'],
        icon: '🎵'
      },
      video: {
        type: 'video',
        name: 'Video',
        description: 'Video files (MP4, AVI, etc.)',
        supportedFormats: ['.mp4', '.avi', '.mov', '.mkv'],
        processor: 'VideoProcessor',
        capabilities: ['transcription', 'frame_extraction', 'audio_extraction'],
        icon: '🎬'
      },
      json: {
        type: 'json',
        name: 'JSON Data',
        description: 'JavaScript Object Notation files',
        supportedFormats: ['.json'],
        processor: 'StructuredDataProcessor',
        capabilities: ['data_parsing', 'schema_extraction', 'validation'],
        icon: '📋'
      },
      xml: {
        type: 'xml',
        name: 'XML Document',
        description: 'Extensible Markup Language files',
        supportedFormats: ['.xml'],
        processor: 'StructuredDataProcessor',
        capabilities: ['data_parsing', 'schema_extraction', 'xpath_queries'],
        icon: '🔖'
      },
      csv: {
        type: 'csv',
        name: 'CSV Data',
        description: 'Comma-Separated Values files',
        supportedFormats: ['.csv'],
        processor: 'StructuredDataProcessor',
        capabilities: ['data_parsing', 'column_detection', 'data_analysis'],
        icon: '📊'
      },
      markdown: {
        type: 'markdown',
        name: 'Markdown',
        description: 'Markdown formatted text',
        supportedFormats: ['.md'],
        processor: 'TextProcessor',
        capabilities: ['formatting_preservation', 'link_extraction', 'metadata_extraction'],
        icon: '📝'
      },
      plain_text: {
        type: 'plain_text',
        name: 'Plain Text',
        description: 'Plain text files',
        supportedFormats: ['.txt', '.rtf'],
        processor: 'TextProcessor',
        capabilities: ['text_extraction', 'encoding_detection'],
        icon: '📄'
      },
      unknown: {
        type: 'unknown',
        name: 'Unknown Type',
        description: 'File type could not be determined',
        supportedFormats: [],
        processor: 'GenericProcessor',
        capabilities: ['basic_processing'],
        icon: '❓'
      }
    };

    return contentTypes[type] || contentTypes.unknown;
  }

  // ============================================================================
  // FILE PROCESSING
  // ============================================================================

  async processFile(
    file: File,
    options: ProcessorOptions = {}
  ): Promise<MultiModalProcessingResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await fetch(`${this.baseUrl}/process`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('File processing failed:', error);
      throw new Error(`Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async processBatch(
    request: BatchProcessingRequest
  ): Promise<BatchProcessingResult> {
    const formData = new FormData();
    request.files.forEach((file, index) => {
      formData.append(`file_${index}`, file);
    });
    formData.append('options', JSON.stringify(request.options));
    if (request.workspaceName) {
      formData.append('workspaceName', request.workspaceName);
    }
    formData.append('autoSync', String(request.autoSync || false));

    try {
      const response = await fetch(`${this.baseUrl}/batch`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Batch processing failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('Batch processing failed:', error);
      throw new Error(`Failed to process batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProcessingStatus(
    fileId: string
  ): Promise<ProcessingStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status/${fileId}`);

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.status;
    } catch (error) {
      console.error('Status check failed:', error);
      throw new Error(`Failed to check status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  async getSupportedContentTypes(): Promise<ContentTypeInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/content-types`);

      if (!response.ok) {
        throw new Error(`Content types request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.contentTypes;
    } catch (error) {
      console.error('Content types request failed:', error);
      // Return fallback list
      return Object.values(this.getContentTypeInfo('pdf')).slice(0, 12);
    }
  }

  async getProcessorInfo(): Promise<{
    processorName: string;
    supported: boolean;
    contentType: string;
  }[]> {
    try {
      const response = await fetch(`${this.baseUrl}/processors`);

      if (!response.ok) {
        throw new Error(`Processor info request failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data.processors;
    } catch (error) {
      console.error('Processor info request failed:', error);
      return [];
    }
  }

  async getHealthStatus(): Promise<{
    status: string;
    message: string;
    timestamp: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        status: 'error',
        message: 'Multi-modal service unavailable',
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Export singleton instance
export const multiModalService = MultiModalService.getInstance();
