# OCR and Speech-to-Text Processing

## OCR (Optical Character Recognition)

### Image Text Extraction

#### Supported Image Formats
- **Common Formats**: PNG, JPEG, GIF, BMP, TIFF, WebP
- **Document Images**: Scanned PDFs, photos of documents
- **Screenshots**: UI screenshots, diagrams with text
- **Mixed Content**: Images containing both text and graphics

#### OCR Engine

The system uses **Tesseract.js** (WASM-based) for OCR. No system-level Tesseract installation is required.

#### OCR Text Enhancement

Post-processing is intentionally minimal to avoid corrupting valid text:
- Remove pipe characters (`|`) and null bytes — common OCR artifacts
- Normalize excessive whitespace (collapse multiple spaces, limit consecutive newlines)

Notable: aggressive transformations like replacing `0` with `O` or joining single-spaced letters have been deliberately removed — they destroyed numeric data and corrupted acronyms.

#### PDF OCR Pipeline

PDFs are processed through a strategy-based pipeline:

1. **Strategy selection**: Analyze text density and file-size-to-text ratio
2. **Text extraction**: Use `pdf-parse` and `pdf.js-extract`
3. **OCR decision**: Based on strategy and text sufficiency (50+ words required)
4. **Page rendering**: Render pages to PNG via `pdfjs-dist` + `canvas` (no system deps)
5. **OCR**: Run Tesseract.js on rendered page images
6. **Combine**: Merge extracted text with OCR results

| Strategy | Text Extraction | Page OCR | When Used |
|----------|----------------|----------|-----------|
| `text-focused` | Yes | No | High text density, low file-size ratio |
| `hybrid` | Yes | Yes | Moderate text with embedded images |
| `image-heavy` | Yes | Yes | Low text density, large files |
| `ocr-fallback` | Yes | Yes | Near-zero extractable text |

See `docs/PDF_OCR_IMPLEMENTATION.md` for full details.

#### OCR Performance Considerations

##### Accuracy vs Speed Trade-offs
- **Fast Mode**: Lower DPI rendering (~100), fewer pages (~2-3 seconds/page)
- **Accurate Mode**: Higher DPI rendering (~200), all pages (~3-5 seconds/page)
- **Text-focused**: Skip OCR entirely for text-heavy documents

## Speech-to-Text Processing

### Audio Format Support
- **Common Formats**: MP3, WAV, M4A, FLAC, OGG
- **Video Formats**: MP4, AVI, MOV, WMV (audio extraction)
- **Streaming**: Real-time audio processing capabilities
- **Sample Rates**: Support for various sample rates and bit depths

### Speech Recognition Pipeline
```typescript
interface SpeechToTextProcessor {
  transcribe(audioBuffer: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult>;
  detectLanguage(audioBuffer: Buffer): Promise<LanguageDetection>;
  identifySpeakers(audioBuffer: Buffer): Promise<SpeakerIdentification>;
}

class WhisperSTTProcessor implements SpeechToTextProcessor {
  async transcribe(audioBuffer: Buffer, options: TranscriptionOptions): Promise<TranscriptionResult> {
    // 1. Audio preprocessing
    const processedAudio = await this.preprocessAudio(audioBuffer, options);

    // 2. Speech recognition
    const transcription = await this.whisper.transcribe(processedAudio, {
      language: options.language,
      task: 'transcribe',
      temperature: 0,
      no_speech_threshold: 0.6
    });

    // 3. Post-processing
    const cleaned = this.cleanTranscription(transcription.text);

    return {
      text: cleaned,
      confidence: transcription.confidence,
      segments: transcription.segments.map(s => ({
        text: s.text,
        start: s.start,
        end: s.end,
        confidence: s.confidence
      })),
      language: transcription.language,
      duration: transcription.duration
    };
  }

  private async preprocessAudio(buffer: Buffer, options: TranscriptionOptions): Promise<Buffer> {
    // Convert to WAV format for Whisper
    // Normalize audio levels
    // Reduce noise if needed
    return await this.audioProcessor.normalize(buffer);
  }
}
```

#### Speaker Identification and Diarization
```typescript
class SpeakerDiarizationProcessor {
  async identifySpeakers(audioBuffer: Buffer): Promise<SpeakerResult[]> {
    // 1. Voice activity detection
    const speechSegments = await this.detectSpeechSegments(audioBuffer);

    // 2. Speaker embedding extraction
    const embeddings = await Promise.all(
      speechSegments.map(segment =>
        this.extractSpeakerEmbedding(audioBuffer, segment)
      )
    );

    // 3. Speaker clustering
    const speakers = await this.clusterSpeakers(embeddings);

    // 4. Speaker labeling
    return this.labelSpeakers(speakers, speechSegments);
  }

  async clusterSpeakers(embeddings: number[][]): Promise<SpeakerCluster[]> {
    // Use clustering algorithm (e.g., agglomerative clustering)
    // Group similar voice embeddings
    // Determine optimal number of speakers
    return this.agglomerativeClustering(embeddings);
  }
}
```

#### Audio Quality Enhancement
```typescript
class AudioPreprocessor {
  async enhanceAudio(audioBuffer: Buffer): Promise<Buffer> {
    // 1. Noise reduction
    const denoised = await this.reduceNoise(audioBuffer);

    // 2. Volume normalization
    const normalized = await this.normalizeVolume(denoised);

    // 3. Echo removal (if applicable)
    const echoRemoved = await this.removeEcho(normalized);

    // 4. Format conversion (to 16kHz mono WAV)
    const converted = await this.convertFormat(echoRemoved, {
      sampleRate: 16000,
      channels: 1,
      format: 'wav'
    });

    return converted;
  }

  async reduceNoise(audioBuffer: Buffer): Promise<Buffer> {
    // Use noise reduction algorithms
    // Remove background noise, hiss, hum
    return this.noiseReducer.process(audioBuffer);
  }
}
```

## Multi-Modal Integration

### Content Fusion Strategy
```typescript
class MultiModalContentFuser {
  async fuseContent(
    visualContent: OCRResult,
    audioContent: TranscriptionResult,
    metadata: FileMetadata
  ): Promise<FusedContent> {
    // 1. Temporal alignment (for video content)
    const aligned = await this.alignTemporalContent(visualContent, audioContent);

    // 2. Content correlation
    const correlated = await this.correlateVisualAudio(aligned);

    // 3. Quality assessment
    const quality = this.assessFusionQuality(correlated);

    // 4. Metadata enrichment
    const enriched = await this.enrichMetadata(correlated, metadata);

    return {
      content: enriched,
      quality,
      confidence: this.calculateOverallConfidence(visualContent, audioContent),
      modalities: ['visual', 'audio']
    };
  }

  private async alignTemporalContent(
    visual: OCRResult,
    audio: TranscriptionResult
  ): Promise<AlignedContent> {
    // Align OCR text segments with speech segments
    // Handle timing differences between visual and audio
    return this.temporalAligner.align(visual, audio);
  }
}
```

### Search Integration
```typescript
class MultiModalSearchEnhancer {
  async enhanceSearchResults(
    query: string,
    baseResults: SearchResult[],
    multiModalContent: FusedContent[]
  ): Promise<EnhancedSearchResults> {
    // 1. Cross-modal relevance scoring
    const scored = await this.scoreCrossModalRelevance(query, multiModalContent);

    // 2. Result fusion
    const fused = this.fuseWithBaseResults(baseResults, scored);

    // 3. Multi-modal highlighting
    const highlighted = await this.addMultiModalHighlights(fused, query);

    return {
      results: highlighted,
      multiModalInsights: this.generateMultiModalInsights(multiModalContent),
      searchMetadata: {
        modalitiesSearched: ['text', 'visual', 'audio'],
        processingTime: this.calculateProcessingTime()
      }
    };
  }
}
```

## Performance Optimization

### Processing Efficiency
- **Batch Processing**: Process multiple files simultaneously
- **GPU Acceleration**: Use GPU for intensive image/audio processing
- **Caching**: Cache processed results for repeated content
- **Progressive Processing**: Extract basic content first, enhance later

### Resource Management
```typescript
class ResourceManager {
  private activeProcessors = new Set<string>();

  async allocateProcessor(type: 'ocr' | 'stt', priority: number): Promise<Processor> {
    // Check resource availability
    const available = await this.checkAvailability(type);

    if (!available) {
      // Queue request or return cached result
      return this.handleResourceContention(type, priority);
    }

    // Allocate processor
    const processor = await this.createProcessor(type);
    this.activeProcessors.add(processor.id);

    return processor;
  }

  async releaseProcessor(processor: Processor): Promise<void> {
    this.activeProcessors.delete(processor.id);
    await this.cleanupProcessor(processor);
  }
}
```

### Quality-Speed Trade-offs
```typescript
interface ProcessingOptions {
  mode: 'fast' | 'balanced' | 'accurate';
  timeout: number;
  maxRetries: number;
  fallbackEnabled: boolean;
}

class AdaptiveProcessor {
  async process(
    content: Buffer,
    type: 'image' | 'audio',
    options: ProcessingOptions
  ): Promise<ProcessingResult> {
    const strategy = this.selectStrategy(options.mode);

    try {
      return await Promise.race([
        strategy.process(content),
        this.createTimeout(options.timeout)
      ]);
    } catch (error) {
      if (options.fallbackEnabled && options.maxRetries > 0) {
        return this.processWithFallback(content, type, {
          ...options,
          maxRetries: options.maxRetries - 1
        });
      }
      throw error;
    }
  }

  private selectStrategy(mode: string): ProcessingStrategy {
    switch (mode) {
      case 'fast':
        return new FastProcessingStrategy();
      case 'accurate':
        return new AccurateProcessingStrategy();
      default:
        return new BalancedProcessingStrategy();
    }
  }
}
```

## Error Handling & Quality Assurance

### Validation & Correction
```typescript
class ContentValidator {
  async validateExtraction(
    originalContent: Buffer,
    extractedContent: string,
    type: 'ocr' | 'stt'
  ): Promise<ValidationResult> {
    // 1. Basic validation
    const basicChecks = this.performBasicValidation(extractedContent);

    // 2. Content-aware validation
    const contentChecks = await this.performContentValidation(
      originalContent,
      extractedContent,
      type
    );

    // 3. Quality scoring
    const qualityScore = this.calculateQualityScore(basicChecks, contentChecks);

    return {
      isValid: qualityScore > this.qualityThreshold,
      issues: [...basicChecks.issues, ...contentChecks.issues],
      qualityScore,
      suggestions: this.generateImprovementSuggestions(qualityScore, type)
    };
  }
}
```

### Monitoring & Analytics
```typescript
class MultiModalMonitor {
  recordProcessingMetrics(
    fileType: string,
    processingType: 'ocr' | 'stt',
    duration: number,
    quality: number,
    success: boolean
  ): void {
    this.metrics.record('multi_modal_processing', {
      file_type: fileType,
      processing_type: processingType,
      duration_ms: duration,
      quality_score: quality,
      success
    });
  }

  recordError(
    fileType: string,
    processingType: string,
    error: Error,
    context
  ): void {
    this.logger.error('Multi-modal processing error', {
      fileType,
      processingType,
      error: error.message,
      context
    });

    this.metrics.increment('multi_modal_error', {
      file_type: fileType,
      processing_type: processingType,
      error_type: error.constructor.name
    });
  }
}
```

## Implementation Status

### Phase 1: Core OCR — Complete
- [x] Tesseract.js integration (WASM-based, no system deps)
- [x] PDF page rendering via pdfjs-dist + canvas
- [x] Strategy-based OCR decisions (text-focused, hybrid, image-heavy, ocr-fallback)
- [x] OCR text enhancement with safe post-processing

### Phase 2: Enhanced OCR — Partial
- [x] PDF strategy engine with hybrid detection
- [x] Eliminated system dependencies (GraphicsMagick, Ghostscript)
- [ ] Multi-engine OCR support (cloud fallback)
- [ ] Advanced image preprocessing (deskewing, contrast)

### Phase 3: Speech-to-Text — Complete
- [x] Sherpa-ONNX integration for offline speech recognition
- [x] Audio extraction from video via FFmpeg
- [x] Whisper.cpp integration via nodejs-whisper
- [ ] Speaker diarization

### Phase 4: Multi-Modal Integration — Complete
- [x] Content fusion pipeline (OCR + transcription + text)
- [x] Multi-modal search across text, images, audio, video
- [x] Adaptive frame extraction for video (scene-based)
- [x] `@obsidian-rag/media-processing` package for video processing

### Phase 5: Optimization — In Progress
- [x] Strategy-based processing (skip unnecessary OCR)
- [x] Word-count-based text sufficiency checks
- [ ] Performance benchmarking and budgets
- [ ] Processing queue for large documents
