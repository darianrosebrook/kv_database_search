import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
// Types are now defined in types/index.ts
// Content type definitions
export var ContentType;
(function (ContentType) {
    // Text-based
    ContentType["MARKDOWN"] = "markdown";
    ContentType["PLAIN_TEXT"] = "plain_text";
    ContentType["RICH_TEXT"] = "rich_text";
    // Documents
    ContentType["PDF"] = "pdf";
    ContentType["OFFICE_DOC"] = "office_document";
    ContentType["OFFICE_SHEET"] = "office_spreadsheet";
    ContentType["OFFICE_PRESENTATION"] = "office_presentation";
    // Images
    ContentType["RASTER_IMAGE"] = "raster_image";
    ContentType["VECTOR_IMAGE"] = "vector_image";
    ContentType["DOCUMENT_IMAGE"] = "document_image";
    // Audio
    ContentType["AUDIO"] = "audio";
    ContentType["SPEECH"] = "speech";
    // Video
    ContentType["VIDEO"] = "video";
    // Structured Data
    ContentType["JSON"] = "json";
    ContentType["XML"] = "xml";
    ContentType["CSV"] = "csv";
    // Binary/Other
    ContentType["BINARY"] = "binary";
    ContentType["UNKNOWN"] = "unknown";
})(ContentType || (ContentType = {}));
/**
 * Multi-modal content detector and processor
 */
export class MultiModalContentDetector {
    mimeTypeMap = new Map([
        // Text
        ['text/plain', ContentType.PLAIN_TEXT],
        ['text/markdown', ContentType.MARKDOWN],
        ['text/rtf', ContentType.RICH_TEXT],
        // Documents
        ['application/pdf', ContentType.PDF],
        ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', ContentType.OFFICE_DOC],
        ['application/msword', ContentType.OFFICE_DOC],
        ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ContentType.OFFICE_SHEET],
        ['application/vnd.ms-excel', ContentType.OFFICE_SHEET],
        ['application/vnd.openxmlformats-officedocument.presentationml.presentation', ContentType.OFFICE_PRESENTATION],
        ['application/vnd.ms-powerpoint', ContentType.OFFICE_PRESENTATION],
        // Images
        ['image/jpeg', ContentType.RASTER_IMAGE],
        ['image/png', ContentType.RASTER_IMAGE],
        ['image/gif', ContentType.RASTER_IMAGE],
        ['image/bmp', ContentType.RASTER_IMAGE],
        ['image/tiff', ContentType.RASTER_IMAGE],
        ['image/webp', ContentType.RASTER_IMAGE],
        ['image/svg+xml', ContentType.VECTOR_IMAGE],
        // Audio
        ['audio/mpeg', ContentType.AUDIO],
        ['audio/wav', ContentType.AUDIO],
        ['audio/flac', ContentType.AUDIO],
        ['audio/mp4', ContentType.AUDIO],
        ['audio/ogg', ContentType.AUDIO],
        // Video
        ['video/mp4', ContentType.VIDEO],
        ['video/avi', ContentType.VIDEO],
        ['video/mov', ContentType.VIDEO],
        ['video/wmv', ContentType.VIDEO],
        ['video/mkv', ContentType.VIDEO],
        // Structured Data
        ['application/json', ContentType.JSON],
        ['application/xml', ContentType.XML],
        ['text/xml', ContentType.XML],
        ['text/csv', ContentType.CSV],
    ]);
    extensionMap = new Map([
        // Text
        ['.md', ContentType.MARKDOWN],
        ['.txt', ContentType.PLAIN_TEXT],
        ['.rtf', ContentType.RICH_TEXT],
        // Documents
        ['.pdf', ContentType.PDF],
        ['.docx', ContentType.OFFICE_DOC],
        ['.doc', ContentType.OFFICE_DOC],
        ['.xlsx', ContentType.OFFICE_SHEET],
        ['.xls', ContentType.OFFICE_SHEET],
        ['.pptx', ContentType.OFFICE_PRESENTATION],
        ['.ppt', ContentType.OFFICE_PRESENTATION],
        // Images
        ['.jpg', ContentType.RASTER_IMAGE],
        ['.jpeg', ContentType.RASTER_IMAGE],
        ['.png', ContentType.RASTER_IMAGE],
        ['.gif', ContentType.RASTER_IMAGE],
        ['.bmp', ContentType.RASTER_IMAGE],
        ['.tiff', ContentType.RASTER_IMAGE],
        ['.webp', ContentType.RASTER_IMAGE],
        ['.svg', ContentType.VECTOR_IMAGE],
        // Audio
        ['.mp3', ContentType.AUDIO],
        ['.wav', ContentType.AUDIO],
        ['.flac', ContentType.AUDIO],
        ['.m4a', ContentType.AUDIO],
        ['.ogg', ContentType.AUDIO],
        // Video
        ['.mp4', ContentType.VIDEO],
        ['.avi', ContentType.VIDEO],
        ['.mov', ContentType.VIDEO],
        ['.wmv', ContentType.VIDEO],
        ['.mkv', ContentType.VIDEO],
        // Structured Data
        ['.json', ContentType.JSON],
        ['.xml', ContentType.XML],
        ['.csv', ContentType.CSV],
    ]);
    async detectContentType(fileBuffer, fileName) {
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
    async detectMimeType(buffer) {
        // Simple MIME type detection based on file signatures
        // In production, use a proper library like 'file-type' or 'mmmagic'
        const signatures = [
            { signature: Buffer.from([0x25, 0x50, 0x44, 0x46]), mimeType: 'application/pdf' }, // %PDF
            { signature: Buffer.from([0xFF, 0xD8, 0xFF]), mimeType: 'image/jpeg' }, // JPEG
            { signature: Buffer.from([0x89, 0x50, 0x4E, 0x47]), mimeType: 'image/png' }, // PNG
            { signature: Buffer.from([0x47, 0x49, 0x46, 0x38]), mimeType: 'image/gif' }, // GIF
            { signature: Buffer.from([0x42, 0x4D]), mimeType: 'image/bmp' }, // BMP
            { signature: Buffer.from([0x49, 0x49, 0x2A, 0x00]), mimeType: 'image/tiff' }, // TIFF (little-endian)
            { signature: Buffer.from([0x4D, 0x4D, 0x00, 0x2A]), mimeType: 'image/tiff' }, // TIFF (big-endian)
            { signature: Buffer.from([0x52, 0x49, 0x46, 0x46]), mimeType: 'video/avi' }, // RIFF (AVI)
            { signature: Buffer.from([0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70]), mimeType: 'video/mp4' }, // MP4
            { signature: Buffer.from([0x66, 0x74, 0x79, 0x70]), mimeType: 'video/mp4', offset: 4 }, // MP4 (alternative)
        ];
        for (const { signature, mimeType, offset = 0 } of signatures) {
            if (buffer.length >= signature.length + offset) {
                const bufferSlice = buffer.slice(offset, offset + signature.length);
                if (bufferSlice.equals(signature)) {
                    return mimeType;
                }
            }
        }
        // Fallback to extension-based detection
        return 'application/octet-stream';
    }
    async analyzeContent(buffer) {
        const features = {
            hasText: false,
            hasImages: false,
            hasAudio: false,
            hasVideo: false,
            isStructured: false,
            encoding: 'unknown',
            language: 'unknown'
        };
        // Check for text content (simple heuristic)
        features.hasText = this.detectTextContent(buffer);
        // Check for structured data
        features.isStructured = this.detectStructuredData(buffer);
        // Detect encoding if text
        if (features.hasText) {
            features.encoding = await this.detectEncoding(buffer);
            features.language = await this.detectLanguage(buffer);
        }
        // Note: Binary file analysis for images/audio/video would require
        // more sophisticated libraries in production
        return { features };
    }
    detectTextContent(buffer) {
        // Check if buffer contains mostly printable ASCII characters
        const sampleSize = Math.min(1024, buffer.length);
        let printableChars = 0;
        let totalChars = 0;
        for (let i = 0; i < sampleSize; i++) {
            const byte = buffer[i];
            totalChars++;
            // Count printable ASCII characters (32-126) and common whitespace
            if ((byte >= 32 && byte <= 126) || byte === 9 || byte === 10 || byte === 13) {
                printableChars++;
            }
        }
        // Consider it text if > 70% printable characters
        return totalChars > 0 && (printableChars / totalChars) > 0.7;
    }
    detectStructuredData(buffer) {
        if (!this.detectTextContent(buffer))
            return false;
        const text = buffer.toString('utf8', 0, Math.min(1024, buffer.length));
        // Check for JSON
        try {
            JSON.parse(text);
            return true;
        }
        catch { }
        // Check for XML
        if (/^\s*<\?xml/.test(text) || /^\s*<[^>]+>/.test(text)) {
            return true;
        }
        // Check for CSV (simple heuristic)
        const lines = text.split('\n').slice(0, 5);
        if (lines.length >= 2) {
            const firstLineCommas = (lines[0].match(/,/g) || []).length;
            const hasConsistentCommas = lines.every(line => Math.abs((line.match(/,/g) || []).length - firstLineCommas) <= 1);
            if (hasConsistentCommas && firstLineCommas > 0) {
                return true;
            }
        }
        return false;
    }
    async detectEncoding(buffer) {
        // Simple encoding detection - in production use 'chardet' or similar
        // For now, assume UTF-8
        return 'utf-8';
    }
    async detectLanguage(buffer) {
        // Language detection - in production use 'franc' or similar
        // For now, assume English
        return 'en';
    }
    validateExtension(fileName, mimeType) {
        const extension = path.extname(fileName).toLowerCase();
        const expectedType = this.extensionMap.get(extension);
        if (!expectedType)
            return false;
        const actualType = this.mimeTypeMap.get(mimeType);
        return expectedType === actualType;
    }
    classifyContentType(mimeType, contentAnalysis) {
        // First try MIME type mapping
        const mimeBasedType = this.mimeTypeMap.get(mimeType);
        if (mimeBasedType)
            return mimeBasedType;
        // Fall back to content analysis
        const features = contentAnalysis.features;
        if (features.isStructured) {
            if (features.hasText) {
                const text = ''; // Would need buffer conversion
                if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
                    return ContentType.JSON;
                }
                if (text.includes('<') && text.includes('>')) {
                    return ContentType.XML;
                }
                if (text.includes(',')) {
                    return ContentType.CSV;
                }
            }
        }
        if (features.hasText) {
            return ContentType.PLAIN_TEXT;
        }
        return ContentType.BINARY;
    }
    calculateConfidence(mimeType, contentAnalysis, extensionMatch) {
        let confidence = 0.5; // Base confidence
        // MIME type match increases confidence
        if (this.mimeTypeMap.has(mimeType)) {
            confidence += 0.3;
        }
        // Extension match increases confidence
        if (extensionMatch) {
            confidence += 0.2;
        }
        // Text detection increases confidence
        if (contentAnalysis.features.hasText) {
            confidence += 0.1;
        }
        // Structured data detection increases confidence
        if (contentAnalysis.features.isStructured) {
            confidence += 0.1;
        }
        return Math.min(1.0, confidence);
    }
}
/**
 * Universal metadata extractor
 */
export class UniversalMetadataExtractor {
    contentDetector;
    constructor(contentDetector) {
        this.contentDetector = contentDetector;
    }
    async extractMetadata(filePath) {
        const startTime = Date.now();
        try {
            // Read file
            const buffer = fs.readFileSync(filePath);
            const stats = fs.statSync(filePath);
            // Detect content type
            const typeResult = await this.contentDetector.detectContentType(buffer, path.basename(filePath));
            // Generate checksum
            const checksum = this.generateChecksum(buffer);
            // Extract file metadata
            const fileMetadata = {
                id: this.generateFileId(filePath),
                path: filePath,
                name: path.basename(filePath),
                extension: path.extname(filePath),
                mimeType: typeResult.mimeType,
                size: stats.size,
                createdAt: stats.birthtime,
                modifiedAt: stats.mtime,
                checksum
            };
            // Extract content-specific metadata
            const contentMetadata = await this.extractContentMetadata(buffer, typeResult);
            // Create processing metadata
            const processingMetadata = {
                processedAt: new Date(),
                processor: 'universal-metadata-extractor',
                version: '1.0.0',
                parameters: {},
                processingTime: Date.now() - startTime,
                success: true
            };
            // Create quality metadata
            const qualityMetadata = {
                overallScore: typeResult.confidence,
                confidence: typeResult.confidence,
                completeness: this.calculateCompleteness(contentMetadata),
                accuracy: typeResult.confidence,
                issues: []
            };
            // Create relationship metadata (placeholder for now)
            const relationshipMetadata = {
                relatedFiles: [],
                tags: [],
                categories: [],
                topics: []
            };
            return {
                file: fileMetadata,
                content: contentMetadata,
                processing: processingMetadata,
                quality: qualityMetadata,
                relationships: relationshipMetadata
            };
        }
        catch (error) {
            // Create error metadata
            const processingMetadata = {
                processedAt: new Date(),
                processor: 'universal-metadata-extractor',
                version: '1.0.0',
                parameters: {},
                processingTime: Date.now() - startTime,
                success: false,
                errors: [error instanceof Error ? error.message : String(error)]
            };
            return {
                file: {
                    id: this.generateFileId(filePath),
                    path: filePath,
                    name: path.basename(filePath),
                    extension: path.extname(filePath),
                    mimeType: 'application/octet-stream',
                    size: 0,
                    createdAt: new Date(),
                    modifiedAt: new Date(),
                    checksum: ''
                },
                content: {
                    type: ContentType.UNKNOWN
                },
                processing: processingMetadata,
                quality: {
                    overallScore: 0,
                    confidence: 0,
                    completeness: 0,
                    accuracy: 0,
                    issues: [{
                            type: 'completeness',
                            field: 'processing',
                            severity: 'high',
                            description: `Failed to process file: ${error instanceof Error ? error.message : String(error)}`
                        }]
                },
                relationships: {
                    relatedFiles: [],
                    tags: [],
                    categories: [],
                    topics: []
                }
            };
        }
    }
    async extractContentMetadata(buffer, typeResult) {
        const baseMetadata = {
            type: typeResult.contentType,
            language: typeResult.features.language,
            encoding: typeResult.features.encoding
        };
        // Extract type-specific metadata
        switch (typeResult.contentType) {
            case ContentType.MARKDOWN:
            case ContentType.PLAIN_TEXT:
                return await this.extractTextMetadata(buffer, baseMetadata);
            case ContentType.PDF:
                return await this.extractPDFMetadata(buffer, baseMetadata);
            case ContentType.RASTER_IMAGE:
            case ContentType.VECTOR_IMAGE:
                return await this.extractImageMetadata(buffer, baseMetadata);
            case ContentType.AUDIO:
                return await this.extractAudioMetadata(buffer, baseMetadata);
            case ContentType.VIDEO:
                return await this.extractVideoMetadata(buffer, baseMetadata);
            case ContentType.JSON:
            case ContentType.XML:
            case ContentType.CSV:
                return await this.extractStructuredMetadata(buffer, baseMetadata);
            default:
                return baseMetadata;
        }
    }
    async extractTextMetadata(buffer, base) {
        const text = buffer.toString('utf8');
        const lines = text.split('\n');
        const words = text.split(/\s+/).filter(word => word.length > 0);
        return {
            ...base,
            wordCount: words.length,
            characterCount: text.length,
            pageCount: 1 // Text files are typically single page
        };
    }
    async extractPDFMetadata(buffer, base) {
        // Placeholder - would need pdf-parse library
        // For now, return basic metadata
        return {
            ...base,
            pageCount: 1, // Placeholder
            wordCount: 0, // Placeholder
            characterCount: buffer.length
        };
    }
    async extractImageMetadata(buffer, base) {
        // Placeholder - would need sharp or similar library
        // For now, return basic metadata
        return {
            ...base,
            dimensions: { width: 0, height: 0 } // Placeholder
        };
    }
    async extractAudioMetadata(buffer, base) {
        // Placeholder - would need music-metadata library
        // For now, return basic metadata
        return {
            ...base,
            duration: 0 // Placeholder
        };
    }
    async extractVideoMetadata(buffer, base) {
        // Placeholder - would need ffprobe or similar
        // For now, return basic metadata
        return {
            ...base,
            duration: 0, // Placeholder
            dimensions: { width: 0, height: 0 } // Placeholder
        };
    }
    async extractStructuredMetadata(buffer, base) {
        const text = buffer.toString('utf8');
        return {
            ...base,
            wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
            characterCount: text.length
        };
    }
    calculateCompleteness(contentMetadata) {
        let score = 0;
        let maxScore = 0;
        // Type is always present
        score += 1;
        maxScore += 1;
        // Language detection
        if (contentMetadata.language && contentMetadata.language !== 'unknown') {
            score += 1;
        }
        maxScore += 1;
        // Encoding detection
        if (contentMetadata.encoding && contentMetadata.encoding !== 'unknown') {
            score += 1;
        }
        maxScore += 1;
        // Content-specific metrics
        switch (contentMetadata.type) {
            case ContentType.MARKDOWN:
            case ContentType.PLAIN_TEXT:
                if (contentMetadata.wordCount !== undefined)
                    score += 1;
                if (contentMetadata.characterCount !== undefined)
                    score += 1;
                maxScore += 2;
                break;
            case ContentType.PDF:
                if (contentMetadata.pageCount !== undefined)
                    score += 1;
                maxScore += 1;
                break;
            case ContentType.RASTER_IMAGE:
            case ContentType.VECTOR_IMAGE:
                if (contentMetadata.dimensions !== undefined)
                    score += 1;
                maxScore += 1;
                break;
            case ContentType.AUDIO:
            case ContentType.VIDEO:
                if (contentMetadata.duration !== undefined)
                    score += 1;
                maxScore += 1;
                break;
        }
        return maxScore > 0 ? score / maxScore : 0;
    }
    generateFileId(filePath) {
        const hash = createHash('md5')
            .update(filePath)
            .digest('hex')
            .slice(0, 8);
        return `file_${hash}`;
    }
    generateChecksum(buffer) {
        return createHash('md5')
            .update(buffer)
            .digest('hex');
    }
}
