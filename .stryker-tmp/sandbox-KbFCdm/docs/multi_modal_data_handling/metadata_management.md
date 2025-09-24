# Metadata Management for Multi-Modal Content

## Universal Metadata Framework

### Standardized Metadata Schema
```typescript
interface UniversalMetadata {
  // Core file information
  file: FileMetadata;

  // Content-specific metadata
  content: ContentMetadata;

  // Processing metadata
  processing: ProcessingMetadata;

  // Quality and confidence metrics
  quality: QualityMetadata;

  // Relationships and context
  relationships: RelationshipMetadata;
}

interface FileMetadata {
  id: string;
  path: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  checksum: string;
}

interface ContentMetadata {
  type: ContentType;
  language?: string;
  encoding?: string;
  dimensions?: Dimensions; // for images/videos
  duration?: number; // for audio/video
  pageCount?: number; // for documents
  wordCount?: number;
  characterCount?: number;
}

interface ProcessingMetadata {
  processedAt: Date;
  processor: string;
  version: string;
  parameters: Record<string, any>;
  processingTime: number;
  success: boolean;
  errors?: string[];
}

interface QualityMetadata {
  overallScore: number; // 0-1
  confidence: number;
  completeness: number; // percentage of content extracted
  accuracy: number; // validation against known content
  issues: QualityIssue[];
}

interface RelationshipMetadata {
  parentFile?: string; // for extracted content
  relatedFiles: string[]; // cross-references
  tags: string[];
  categories: string[];
  topics: string[];
}
```

## Content Type Detection & Classification

### Automatic Content Type Detection
```typescript
class ContentTypeDetector {
  async detectContentType(fileBuffer: Buffer, fileName: string): Promise<ContentTypeResult> {
    // 1. MIME type detection
    const mimeType = await this.detectMimeType(fileBuffer);

    // 2. Content analysis
    const contentAnalysis = await this.analyzeContent(fileBuffer);

    // 3. Extension validation
    const extensionMatch = this.validateExtension(fileName, mimeType);

    // 4. Final classification
    const contentType = this.classifyContentType(mimeType, contentAnalysis);

    return {
      mimeType,
      contentType,
      confidence: this.calculateConfidence(mimeType, contentAnalysis, extensionMatch),
      features: contentAnalysis.features
    };
  }

  private async analyzeContent(buffer: Buffer): Promise<ContentAnalysis> {
    const features = {
      hasText: false,
      hasImages: false,
      hasAudio: false,
      hasVideo: false,
      isStructured: false,
      encoding: 'unknown',
      language: 'unknown'
    };

    // Check for text content
    features.hasText = this.detectTextContent(buffer);

    // Check for binary signatures
    features.hasImages = this.detectImageSignatures(buffer);
    features.hasAudio = this.detectAudioSignatures(buffer);
    features.hasVideo = this.detectVideoSignatures(buffer);

    // Check for structured data
    features.isStructured = this.detectStructuredData(buffer);

    // Detect encoding and language
    if (features.hasText) {
      features.encoding = await this.detectEncoding(buffer);
      features.language = await this.detectLanguage(buffer);
    }

    return { features };
  }
}
```

### Content Type Hierarchy
```typescript
enum ContentType {
  // Text-based
  MARKDOWN = 'markdown',
  PLAIN_TEXT = 'plain_text',
  RICH_TEXT = 'rich_text',

  // Documents
  PDF = 'pdf',
  OFFICE_DOC = 'office_document',
  OFFICE_SHEET = 'office_spreadsheet',
  OFFICE_PRESENTATION = 'office_presentation',

  // Images
  RASTER_IMAGE = 'raster_image',
  VECTOR_IMAGE = 'vector_image',
  DOCUMENT_IMAGE = 'document_image',

  // Audio
  AUDIO = 'audio',
  SPEECH = 'speech',

  // Video
  VIDEO = 'video',

  // Structured Data
  JSON = 'json',
  XML = 'xml',
  CSV = 'csv',

  // Binary/Other
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}
```

## Metadata Extraction Strategies

### Text-Based Content
```typescript
class TextMetadataExtractor {
  async extractMetadata(content: string, fileName: string): Promise<ContentMetadata> {
    const metadata: ContentMetadata = {
      type: ContentType.PLAIN_TEXT,
      language: await this.detectLanguage(content),
      encoding: 'utf-8',
      wordCount: this.countWords(content),
      characterCount: content.length
    };

    // Extract additional text features
    metadata.readabilityScore = this.calculateReadability(content);
    metadata.sentiment = await this.analyzeSentiment(content);
    metadata.topics = await this.extractTopics(content);
    metadata.keywords = await this.extractKeywords(content);

    return metadata;
  }

  private countWords(text: string): number {
    return text.trim().split(/\s+/).length;
  }

  private async detectLanguage(text: string): Promise<string> {
    // Use language detection library
    const detection = await this.languageDetector.detect(text);
    return detection.language;
  }
}
```

### Document Content
```typescript
class DocumentMetadataExtractor {
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<ContentMetadata> {
    const metadata: ContentMetadata = {
      type: this.classifyDocumentType(fileName),
      pageCount: await this.extractPageCount(fileBuffer),
      wordCount: await this.extractWordCount(fileBuffer),
      characterCount: await this.extractCharacterCount(fileBuffer)
    };

    // Extract document-specific metadata
    metadata.title = await this.extractTitle(fileBuffer);
    metadata.author = await this.extractAuthor(fileBuffer);
    metadata.createdDate = await this.extractCreationDate(fileBuffer);
    metadata.modifiedDate = await this.extractModifiedDate(fileBuffer);

    // Extract table information
    metadata.tableCount = await this.countTables(fileBuffer);
    metadata.hasFormulas = await this.detectFormulas(fileBuffer);

    return metadata;
  }

  private async extractPageCount(buffer: Buffer): Promise<number> {
    // Use document parsing library to count pages
    const document = await this.documentParser.parse(buffer);
    return document.pageCount;
  }
}
```

### Media Content
```typescript
class MediaMetadataExtractor {
  async extractMetadata(fileBuffer: Buffer, fileName: string): Promise<ContentMetadata> {
    const metadata: ContentMetadata = {
      type: this.classifyMediaType(fileName)
    };

    // Extract media-specific metadata
    const mediaInfo = await this.mediaAnalyzer.analyze(fileBuffer);

    metadata.duration = mediaInfo.duration;
    metadata.dimensions = mediaInfo.dimensions;
    metadata.bitrate = mediaInfo.bitrate;
    metadata.codec = mediaInfo.codec;
    metadata.sampleRate = mediaInfo.sampleRate;

    // Extract content features
    if (metadata.type === ContentType.AUDIO || metadata.type === ContentType.VIDEO) {
      metadata.hasSpeech = await this.detectSpeech(fileBuffer);
      metadata.language = await this.detectAudioLanguage(fileBuffer);
    }

    if (metadata.type === ContentType.VIDEO) {
      metadata.frameRate = mediaInfo.frameRate;
      metadata.hasSubtitles = await this.detectSubtitles(fileBuffer);
    }

    return metadata;
  }
}
```

## Metadata Storage & Indexing

### Metadata Storage Strategy
```typescript
class MetadataStorageManager {
  async storeMetadata(fileId: string, metadata: UniversalMetadata): Promise<void> {
    // 1. Validate metadata completeness
    await this.validateMetadata(metadata);

    // 2. Store in primary metadata table
    await this.storePrimaryMetadata(fileId, metadata);

    // 3. Store content-specific metadata
    await this.storeContentMetadata(fileId, metadata.content);

    // 4. Store processing metadata
    await this.storeProcessingMetadata(fileId, metadata.processing);

    // 5. Update search indexes
    await this.updateSearchIndexes(fileId, metadata);

    // 6. Update relationship indexes
    await this.updateRelationshipIndexes(fileId, metadata.relationships);
  }

  private async validateMetadata(metadata: UniversalMetadata): Promise<void> {
    // Ensure required fields are present
    if (!metadata.file.id || !metadata.content.type) {
      throw new Error('Invalid metadata: missing required fields');
    }

    // Validate data types and ranges
    this.validateDataTypes(metadata);

    // Check for data consistency
    this.validateConsistency(metadata);
  }
}
```

### Search Index Integration
```typescript
class MetadataSearchIndexer {
  async indexMetadata(fileId: string, metadata: UniversalMetadata): Promise<void> {
    // Index core file metadata
    await this.indexFileMetadata(fileId, metadata.file);

    // Index content metadata
    await this.indexContentMetadata(fileId, metadata.content);

    // Index quality metadata
    await this.indexQualityMetadata(fileId, metadata.quality);

    // Index relationship metadata
    await this.indexRelationshipMetadata(fileId, metadata.relationships);
  }

  private async indexContentMetadata(fileId: string, content: ContentMetadata): Promise<void> {
    const indexableFields = {
      content_type: content.type,
      language: content.language,
      word_count: content.wordCount,
      duration: content.duration,
      dimensions: content.dimensions ? `${content.dimensions.width}x${content.dimensions.height}` : null,
      page_count: content.pageCount
    };

    await this.searchIndex.addDocument(fileId, indexableFields);
  }

  private async indexRelationshipMetadata(fileId: string, relationships: RelationshipMetadata): Promise<void> {
    // Index tags
    for (const tag of relationships.tags) {
      await this.tagIndex.add(fileId, tag);
    }

    // Index categories
    for (const category of relationships.categories) {
      await this.categoryIndex.add(fileId, category);
    }

    // Index topics
    for (const topic of relationships.topics) {
      await this.topicIndex.add(fileId, topic);
    }
  }
}
```

## Metadata Quality Management

### Quality Assessment Framework
```typescript
class MetadataQualityAssessor {
  async assessQuality(metadata: UniversalMetadata): Promise<QualityAssessment> {
    const scores = {
      completeness: this.assessCompleteness(metadata),
      accuracy: await this.assessAccuracy(metadata),
      consistency: this.assessConsistency(metadata),
      timeliness: this.assessTimeliness(metadata)
    };

    const overallScore = this.calculateOverallScore(scores);

    return {
      overallScore,
      componentScores: scores,
      issues: this.identifyIssues(scores),
      recommendations: this.generateRecommendations(scores)
    };
  }

  private assessCompleteness(metadata: UniversalMetadata): number {
    let completeFields = 0;
    let totalFields = 0;

    // Count required fields
    const requiredFields = ['file.id', 'file.path', 'content.type', 'processing.processedAt'];
    totalFields += requiredFields.length;

    for (const field of requiredFields) {
      if (this.hasField(metadata, field)) {
        completeFields++;
      }
    }

    // Count optional fields for bonus points
    const optionalFields = ['content.language', 'quality.confidence', 'relationships.tags'];
    totalFields += optionalFields.length * 0.5; // Optional fields worth half

    for (const field of optionalFields) {
      if (this.hasField(metadata, field)) {
        completeFields += 0.5;
      }
    }

    return completeFields / totalFields;
  }

  private async assessAccuracy(metadata: UniversalMetadata): Promise<number> {
    let accuracyScore = 1.0;

    // Validate file checksum
    if (metadata.file.checksum) {
      const isValidChecksum = await this.validateChecksum(metadata.file);
      if (!isValidChecksum) {
        accuracyScore -= 0.3;
      }
    }

    // Validate content type detection
    const typeConfidence = await this.validateContentType(metadata);
    accuracyScore = Math.min(accuracyScore, typeConfidence);

    // Validate extracted values
    const extractionAccuracy = await this.validateExtractions(metadata);
    accuracyScore = Math.min(accuracyScore, extractionAccuracy);

    return Math.max(0, accuracyScore);
  }
}
```

### Quality Improvement Strategies
```typescript
class MetadataQualityImprover {
  async improveQuality(metadata: UniversalMetadata, assessment: QualityAssessment): Promise<UniversalMetadata> {
    let improved = { ...metadata };

    // Fix completeness issues
    improved = await this.improveCompleteness(improved, assessment.issues);

    // Fix accuracy issues
    improved = await this.improveAccuracy(improved, assessment.issues);

    // Fix consistency issues
    improved = await this.improveConsistency(improved, assessment.issues);

    // Recalculate quality scores
    improved.quality = await this.qualityAssessor.assessQuality(improved);

    return improved;
  }

  private async improveCompleteness(metadata: UniversalMetadata, issues: QualityIssue[]): Promise<UniversalMetadata> {
    const improved = { ...metadata };

    for (const issue of issues.filter(i => i.type === 'completeness')) {
      switch (issue.field) {
        case 'content.language':
          improved.content.language = await this.detectLanguage(metadata.file.path);
          break;
        case 'quality.confidence':
          improved.quality.confidence = this.estimateConfidence(improved);
          break;
        case 'relationships.tags':
          improved.relationships.tags = await this.extractTags(improved);
          break;
      }
    }

    return improved;
  }
}
```

## Metadata Synchronization & Updates

### Change Detection & Incremental Updates
```typescript
class MetadataSynchronizer {
  async synchronizeMetadata(filePath: string): Promise<SyncResult> {
    // 1. Check if file has changed
    const hasChanged = await this.detectFileChanges(filePath);

    if (!hasChanged) {
      return { status: 'unchanged' };
    }

    // 2. Re-extract metadata
    const newMetadata = await this.extractMetadata(filePath);

    // 3. Compare with existing metadata
    const existingMetadata = await this.getExistingMetadata(filePath);
    const changes = this.compareMetadata(existingMetadata, newMetadata);

    // 4. Update indexes selectively
    await this.updateIndexes(filePath, changes);

    // 5. Update search indexes
    await this.updateSearchIndexes(filePath, changes);

    return {
      status: 'updated',
      changes,
      newMetadata
    };
  }

  private async detectFileChanges(filePath: string): Promise<boolean> {
    const currentStats = await fs.promises.stat(filePath);
    const existingMetadata = await this.getExistingMetadata(filePath);

    if (!existingMetadata) {
      return true; // New file
    }

    // Check modification time
    if (currentStats.mtime > new Date(existingMetadata.file.modifiedAt)) {
      return true;
    }

    // Check file size
    if (currentStats.size !== existingMetadata.file.size) {
      return true;
    }

    // Check checksum if available
    if (existingMetadata.file.checksum) {
      const currentChecksum = await this.calculateChecksum(filePath);
      if (currentChecksum !== existingMetadata.file.checksum) {
        return true;
      }
    }

    return false;
  }
}
```

### Metadata Archival & Cleanup
```typescript
class MetadataArchivalManager {
  async archiveOldMetadata(thresholdDays: number = 90): Promise<ArchivalResult> {
    // 1. Find old metadata
    const oldMetadata = await this.findOldMetadata(thresholdDays);

    // 2. Archive to compressed storage
    const archived = await this.archiveToStorage(oldMetadata);

    // 3. Update indexes to point to archived location
    await this.updateArchivedIndexes(archived);

    // 4. Remove from active storage
    await this.removeFromActiveStorage(oldMetadata);

    return {
      archivedCount: archived.length,
      freedSpace: this.calculateFreedSpace(oldMetadata),
      archiveLocation: archived[0]?.archivePath
    };
  }

  async cleanupOrphanedMetadata(): Promise<CleanupResult> {
    // 1. Find metadata for deleted files
    const orphaned = await this.findOrphanedMetadata();

    // 2. Remove from all indexes
    await this.removeFromIndexes(orphaned);

    // 3. Delete metadata records
    await this.deleteMetadataRecords(orphaned);

    return {
      cleanedCount: orphaned.length,
      freedSpace: this.calculateFreedSpace(orphaned)
    };
  }
}
```

## Monitoring & Analytics

### Metadata Health Dashboard
```typescript
class MetadataHealthMonitor {
  async generateHealthReport(): Promise<HealthReport> {
    const metrics = await this.collectHealthMetrics();

    return {
      overallHealth: this.calculateOverallHealth(metrics),
      componentHealth: {
        completeness: metrics.completeness,
        accuracy: metrics.accuracy,
        timeliness: metrics.timeliness,
        coverage: metrics.coverage
      },
      issues: await this.identifyHealthIssues(metrics),
      recommendations: this.generateHealthRecommendations(metrics),
      trends: await this.analyzeHealthTrends(metrics)
    };
  }

  private async collectHealthMetrics(): Promise<HealthMetrics> {
    return {
      completeness: await this.calculateAverageCompleteness(),
      accuracy: await this.calculateAverageAccuracy(),
      timeliness: await this.calculateTimelinessScore(),
      coverage: await this.calculateTypeCoverage()
    };
  }

  private async calculateAverageCompleteness(): Promise<number> {
    const allMetadata = await this.getAllMetadata();
    const completenessScores = await Promise.all(
      allMetadata.map(m => this.qualityAssessor.assessQuality(m).then(a => a.overallScore))
    );

    return completenessScores.reduce((sum, score) => sum + score, 0) / completenessScores.length;
  }
}
```

### Performance Monitoring
```typescript
class MetadataPerformanceMonitor {
  recordExtractionTime(fileType: string, duration: number): void {
    this.metrics.record('metadata_extraction_duration', duration, {
      file_type: fileType
    });
  }

  recordStorageOperation(operation: string, duration: number, success: boolean): void {
    this.metrics.record('metadata_storage_operation', duration, {
      operation,
      success
    });
  }

  recordIndexUpdate(indexType: string, duration: number, itemCount: number): void {
    this.metrics.record('metadata_index_update', duration, {
      index_type: indexType,
      item_count: itemCount
    });
  }

  async generatePerformanceReport(): Promise<PerformanceReport> {
    const metrics = await this.getPerformanceMetrics();

    return {
      averageExtractionTime: this.calculateAverage(metrics.extractionTimes),
      storageThroughput: this.calculateThroughput(metrics.storageOperations),
      indexUpdateEfficiency: this.calculateEfficiency(metrics.indexUpdates),
      bottlenecks: this.identifyBottlenecks(metrics),
      recommendations: this.generatePerformanceRecommendations(metrics)
    };
  }
}
```

This metadata management framework provides a comprehensive approach to handling multi-modal content metadata, ensuring consistent extraction, storage, quality assessment, and maintenance across all supported file types.
