import { MultiModalContentDetector, UniversalMetadataExtractor, ContentType } from "./multi-modal.js";
import { cleanMarkdown } from "./utils.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
/**
 * Multi-modal content ingestion pipeline
 * Extends the existing ingestion system to handle various file types
 */
export class MultiModalIngestionPipeline {
    db;
    embeddings;
    contentDetector;
    metadataExtractor;
    constructor(database, embeddingService) {
        this.db = database;
        this.embeddings = embeddingService;
        this.contentDetector = new MultiModalContentDetector();
        this.metadataExtractor = new UniversalMetadataExtractor(this.contentDetector);
    }
    async ingestFiles(filePaths, config = {}) {
        const { batchSize = 5, rateLimitMs = 200, skipExisting = true, maxFileSize = 50 * 1024 * 1024, // 50MB default
         } = config;
        console.log(`🚀 Starting multi-modal ingestion: ${filePaths.length} files`);
        let processedFiles = 0;
        let skippedFiles = 0;
        let failedFiles = 0;
        let totalChunks = 0;
        let processedChunks = 0;
        const errors = [];
        const contentTypeStats = {};
        // Initialize stats
        Object.values(ContentType).forEach(type => {
            contentTypeStats[type] = 0;
        });
        // Process files in batches
        for (let i = 0; i < filePaths.length; i += batchSize) {
            const batch = filePaths.slice(i, i + batchSize);
            console.log(`⚙️  Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(filePaths.length / batchSize)}`);
            try {
                const batchResults = await this.processBatch(batch, {
                    skipExisting,
                    maxFileSize,
                    ...config
                });
                processedFiles += batchResults.processedFiles;
                skippedFiles += batchResults.skippedFiles;
                failedFiles += batchResults.failedFiles;
                totalChunks += batchResults.totalChunks;
                processedChunks += batchResults.processedChunks;
                errors.push(...batchResults.errors);
                // Update content type stats
                Object.entries(batchResults.contentTypeStats).forEach(([type, count]) => {
                    contentTypeStats[type] += count;
                });
                // Rate limiting
                if (i + batchSize < filePaths.length) {
                    await new Promise(resolve => setTimeout(resolve, rateLimitMs));
                }
            }
            catch (error) {
                const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error}`;
                console.error(`❌ ${errorMsg}`);
                errors.push(errorMsg);
                failedFiles += batch.length;
            }
        }
        const result = {
            totalFiles: filePaths.length,
            processedFiles,
            skippedFiles,
            failedFiles,
            totalChunks,
            processedChunks,
            errors,
            contentTypeStats
        };
        console.log(`✅ Multi-modal ingestion complete:`, result);
        return result;
    }
    async processBatch(filePaths, config) {
        let processedFiles = 0;
        let skippedFiles = 0;
        let failedFiles = 0;
        let totalChunks = 0;
        let processedChunks = 0;
        const errors = [];
        const contentTypeStats = {};
        // Initialize stats
        Object.values(ContentType).forEach(type => {
            contentTypeStats[type] = 0;
        });
        for (const filePath of filePaths) {
            try {
                console.log(`📖 Processing: ${path.basename(filePath)}`);
                // Check file size
                const stats = fs.statSync(filePath);
                if (stats.size > (config.maxFileSize || 50 * 1024 * 1024)) {
                    console.log(`⏭️  Skipping large file: ${path.basename(filePath)} (${stats.size} bytes)`);
                    skippedFiles++;
                    continue;
                }
                // Extract universal metadata
                const metadata = await this.metadataExtractor.extractMetadata(filePath);
                // Update content type stats
                contentTypeStats[metadata.content.type]++;
                // Skip if processing failed
                if (!metadata.processing.success) {
                    console.log(`⏭️  Skipping failed processing: ${path.basename(filePath)}`);
                    failedFiles++;
                    continue;
                }
                // Generate chunks from the file
                const chunks = await this.chunkMultiModalFile(metadata);
                totalChunks += chunks.length;
                // Process each chunk
                for (const chunk of chunks) {
                    try {
                        // Check if chunk already exists
                        if (config.skipExisting) {
                            const existing = await this.db.getChunkById(chunk.id);
                            if (existing) {
                                console.log(`⏭️  Skipping existing chunk: ${chunk.id.slice(0, 8)}...`);
                                continue;
                            }
                        }
                        console.log(`🔮 Embedding chunk: ${chunk.id.slice(0, 8)}... (${chunk.text.length} chars)`);
                        // Generate embedding
                        const embeddingResult = await this.embeddings.embedWithStrategy(chunk.text, this.mapContentTypeToStrategy(metadata.content.type), "knowledge-base");
                        // Store in database
                        await this.db.upsertChunk({
                            ...chunk,
                            embedding: embeddingResult.embedding,
                        });
                        processedChunks++;
                    }
                    catch (error) {
                        console.error(`❌ Failed to process chunk ${chunk.id}: ${error}`);
                        errors.push(`Chunk ${chunk.id}: ${error}`);
                    }
                }
                processedFiles++;
            }
            catch (error) {
                console.error(`❌ Failed to process file ${filePath}: ${error}`);
                errors.push(`File ${filePath}: ${error}`);
                failedFiles++;
            }
        }
        return {
            processedFiles,
            skippedFiles,
            failedFiles,
            totalChunks,
            processedChunks,
            errors,
            contentTypeStats
        };
    }
    async chunkMultiModalFile(metadata) {
        const filePath = metadata.file.path;
        const buffer = fs.readFileSync(filePath);
        // Base metadata for chunks
        const baseMetadata = {
            uri: `file://${filePath}`,
            section: metadata.file.name,
            breadcrumbs: this.generateBreadcrumbs(filePath),
            contentType: this.mapContentType(metadata.content.type),
            sourceType: "multi-modal",
            sourceDocumentId: metadata.file.name,
            lang: metadata.content.language || "en",
            acl: "public",
            updatedAt: metadata.file.modifiedAt,
            createdAt: metadata.file.createdAt,
            chunkIndex: 0,
            chunkCount: 1,
            // Enhanced multi-modal metadata
            multiModalFile: {
                fileId: metadata.file.id,
                contentType: metadata.content.type,
                mimeType: metadata.file.mimeType,
                checksum: metadata.file.checksum,
                quality: metadata.quality,
                processing: metadata.processing
            },
        };
        // Generate chunks based on content type
        switch (metadata.content.type) {
            case ContentType.MARKDOWN:
            case ContentType.PLAIN_TEXT:
                return await this.chunkTextFile(buffer, baseMetadata, metadata);
            case ContentType.PDF:
                return await this.chunkPDFFile(buffer, baseMetadata, metadata);
            case ContentType.OFFICE_DOC:
            case ContentType.OFFICE_SHEET:
            case ContentType.OFFICE_PRESENTATION:
                return await this.chunkOfficeFile(buffer, baseMetadata, metadata);
            case ContentType.RASTER_IMAGE:
            case ContentType.VECTOR_IMAGE:
                return await this.chunkImageFile(buffer, baseMetadata, metadata);
            case ContentType.AUDIO:
                return await this.chunkAudioFile(buffer, baseMetadata, metadata);
            case ContentType.VIDEO:
                return await this.chunkVideoFile(buffer, baseMetadata, metadata);
            case ContentType.JSON:
            case ContentType.XML:
            case ContentType.CSV:
                return await this.chunkStructuredFile(buffer, baseMetadata, metadata);
            default:
                // For unsupported types, create a single chunk with metadata
                return [this.createMetadataOnlyChunk(baseMetadata, metadata)];
        }
    }
    async chunkTextFile(buffer, baseMetadata, metadata) {
        const text = buffer.toString('utf8');
        const cleanedText = cleanMarkdown(text);
        // Simple chunking by paragraphs or size
        const chunks = [];
        const paragraphs = cleanedText.split('\n\n').filter(p => p.trim().length > 0);
        const maxChunkSize = 800;
        let currentChunk = "";
        let chunkIndex = 0;
        for (const paragraph of paragraphs) {
            if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
                // Create chunk
                chunks.push({
                    id: this.generateChunkId(metadata.file.id, chunkIndex),
                    text: currentChunk.trim(),
                    meta: {
                        ...baseMetadata,
                        section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
                        chunkIndex,
                        chunkCount: Math.ceil(cleanedText.length / maxChunkSize),
                    },
                });
                currentChunk = paragraph;
                chunkIndex++;
            }
            else {
                currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
            }
        }
        // Add final chunk
        if (currentChunk.trim()) {
            chunks.push({
                id: this.generateChunkId(metadata.file.id, chunkIndex),
                text: currentChunk.trim(),
                meta: {
                    ...baseMetadata,
                    section: `${baseMetadata.section} (Part ${chunkIndex + 1})`,
                    chunkIndex,
                    chunkCount: chunkIndex + 1,
                },
            });
        }
        return chunks;
    }
    async chunkPDFFile(buffer, baseMetadata, metadata) {
        // Placeholder for PDF processing
        // In production, would use pdf-parse or similar library
        // For now, create a single chunk indicating PDF content
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `PDF Document: ${metadata.file.name}\nType: ${metadata.content.type}\nPages: ${metadata.content.pageCount || 'Unknown'}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    async chunkOfficeFile(buffer, baseMetadata, metadata) {
        // Placeholder for Office document processing
        // In production, would use mammoth (DOCX), xlsx (Excel), etc.
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Office Document: ${metadata.file.name}\nType: ${metadata.content.type}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    async chunkImageFile(buffer, baseMetadata, metadata) {
        // Placeholder for image processing
        // In production, would attempt OCR or captioning
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Image: ${metadata.file.name}\nType: ${metadata.content.type}\nDimensions: ${metadata.content.dimensions?.width || 'Unknown'}x${metadata.content.dimensions?.height || 'Unknown'}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    async chunkAudioFile(buffer, baseMetadata, metadata) {
        // Placeholder for audio processing
        // In production, would attempt speech-to-text
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Audio: ${metadata.file.name}\nType: ${metadata.content.type}\nDuration: ${metadata.content.duration || 'Unknown'} seconds`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    async chunkVideoFile(buffer, baseMetadata, metadata) {
        // Placeholder for video processing
        // In production, would extract audio and attempt speech-to-text
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Video: ${metadata.file.name}\nType: ${metadata.content.type}\nDuration: ${metadata.content.duration || 'Unknown'} seconds\nDimensions: ${metadata.content.dimensions?.width || 'Unknown'}x${metadata.content.dimensions?.height || 'Unknown'}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    async chunkStructuredFile(buffer, baseMetadata, metadata) {
        const text = buffer.toString('utf8');
        // For structured data, create a single chunk with the content
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `Structured Data: ${metadata.file.name}\nType: ${metadata.content.type}\nContent:\n${text.slice(0, 1000)}${text.length > 1000 ? '...' : ''}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return [chunk];
    }
    createMetadataOnlyChunk(baseMetadata, metadata) {
        const chunk = {
            id: this.generateChunkId(metadata.file.id, 0),
            text: `File: ${metadata.file.name}\nType: ${metadata.content.type}\nMIME Type: ${metadata.file.mimeType}\nSize: ${metadata.file.size} bytes\nQuality Score: ${metadata.quality.overallScore.toFixed(2)}`,
            meta: {
                ...baseMetadata,
                chunkIndex: 0,
                chunkCount: 1,
            },
        };
        return chunk;
    }
    mapContentType(contentType) {
        // Map our ContentType enum to the existing content type strings
        switch (contentType) {
            case ContentType.MARKDOWN:
                return "markdown";
            case ContentType.PLAIN_TEXT:
                return "plain_text";
            case ContentType.PDF:
                return "pdf";
            case ContentType.OFFICE_DOC:
                return "office_document";
            case ContentType.OFFICE_SHEET:
                return "office_sheet";
            case ContentType.OFFICE_PRESENTATION:
                return "office_presentation";
            case ContentType.RASTER_IMAGE:
                return "image";
            case ContentType.VECTOR_IMAGE:
                return "vector_image";
            case ContentType.AUDIO:
                return "audio";
            case ContentType.VIDEO:
                return "video";
            case ContentType.JSON:
                return "json";
            case ContentType.XML:
                return "xml";
            case ContentType.CSV:
                return "csv";
            default:
                return "unknown";
        }
    }
    mapContentTypeToStrategy(contentType) {
        // Map to embedding strategy
        switch (contentType) {
            case ContentType.MARKDOWN:
            case ContentType.PLAIN_TEXT:
            case ContentType.PDF:
            case ContentType.OFFICE_DOC:
                return "text";
            case ContentType.RASTER_IMAGE:
            case ContentType.VECTOR_IMAGE:
                return "image";
            case ContentType.AUDIO:
                return "audio";
            case ContentType.VIDEO:
                return "video";
            default:
                return "text"; // fallback
        }
    }
    generateChunkId(fileId, chunkIndex) {
        const hash = createHash("md5")
            .update(`${fileId}_${chunkIndex}`)
            .digest("hex")
            .slice(0, 8);
        return `multi_${fileId}_${chunkIndex}_${hash}`;
    }
    generateBreadcrumbs(filePath) {
        const parts = filePath
            .split(path.sep)
            .filter((part) => part && part !== ".");
        const breadcrumbs = [];
        for (let i = 0; i < parts.length - 1; i++) {
            const segment = parts.slice(0, i + 1).join("/");
            breadcrumbs.push(segment);
        }
        return breadcrumbs;
    }
}
