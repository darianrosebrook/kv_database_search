// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
import { MultiModalContentDetector, UniversalMetadataExtractor, UniversalMetadata, ContentType } from "./multi-modal.js";
import { PDFProcessor } from "./processors/pdf-processor.js";
import { OCRProcessor } from "./processors/ocr-processor.js";
import { OfficeProcessor } from "./processors/office-processor.js";
import { SpeechProcessor } from "./processors/speech-processor.js";
import { DocumentChunk, DocumentMetadata } from "../types/index.js";
import { cleanMarkdown } from "./utils.js";
import * as fs from "fs";
import * as path from "path";
import { createHash } from "crypto";
export interface MultiModalIngestionConfig {
  batchSize?: number;
  rateLimitMs?: number;
  skipExisting?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  enableOCR?: boolean;
  enableSpeechToText?: boolean;
  maxFileSize?: number; // in bytes
}
export interface MultiModalIngestionResult {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  totalChunks: number;
  processedChunks: number;
  errors: string[];
  contentTypeStats: Record<ContentType, number>;
}

/**
 * Multi-modal content ingestion pipeline
 * Extends the existing ingestion system to handle various file types
 */
export class MultiModalIngestionPipeline {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private contentDetector: MultiModalContentDetector;
  private metadataExtractor: UniversalMetadataExtractor;
  private pdfProcessor: PDFProcessor;
  private ocrProcessor: OCRProcessor;
  private officeProcessor: OfficeProcessor;
  private speechProcessor: SpeechProcessor;
  constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService) {
    if (stryMutAct_9fa48("377")) {
      {}
    } else {
      stryCov_9fa48("377");
      this.db = database;
      this.embeddings = embeddingService;
      this.contentDetector = new MultiModalContentDetector();
      this.pdfProcessor = new PDFProcessor();
      this.ocrProcessor = new OCRProcessor();
      this.officeProcessor = new OfficeProcessor();
      this.speechProcessor = new SpeechProcessor();
      this.metadataExtractor = new UniversalMetadataExtractor(this.contentDetector);
    }
  }
  async ingestFiles(filePaths: string[], config: MultiModalIngestionConfig = {}): Promise<MultiModalIngestionResult> {
    if (stryMutAct_9fa48("378")) {
      {}
    } else {
      stryCov_9fa48("378");
      const {
        batchSize = 5,
        rateLimitMs = 200,
        skipExisting = stryMutAct_9fa48("379") ? false : (stryCov_9fa48("379"), true),
        maxFileSize = stryMutAct_9fa48("380") ? 50 * 1024 / 1024 : (stryCov_9fa48("380"), (stryMutAct_9fa48("381") ? 50 / 1024 : (stryCov_9fa48("381"), 50 * 1024)) * 1024) // 50MB default
      } = config;
      console.log(stryMutAct_9fa48("382") ? `` : (stryCov_9fa48("382"), `🚀 Starting multi-modal ingestion: ${filePaths.length} files`));
      let processedFiles = 0;
      let skippedFiles = 0;
      let failedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      const errors: string[] = stryMutAct_9fa48("383") ? ["Stryker was here"] : (stryCov_9fa48("383"), []);
      const contentTypeStats: Record<ContentType, number> = {} as Record<ContentType, number>;

      // Initialize stats
      Object.values(ContentType).forEach(type => {
        if (stryMutAct_9fa48("384")) {
          {}
        } else {
          stryCov_9fa48("384");
          contentTypeStats[type] = 0;
        }
      });

      // Process files in batches
      for (let i = 0; stryMutAct_9fa48("387") ? i >= filePaths.length : stryMutAct_9fa48("386") ? i <= filePaths.length : stryMutAct_9fa48("385") ? false : (stryCov_9fa48("385", "386", "387"), i < filePaths.length); stryMutAct_9fa48("388") ? i -= batchSize : (stryCov_9fa48("388"), i += batchSize)) {
        if (stryMutAct_9fa48("389")) {
          {}
        } else {
          stryCov_9fa48("389");
          const batch = stryMutAct_9fa48("390") ? filePaths : (stryCov_9fa48("390"), filePaths.slice(i, stryMutAct_9fa48("391") ? i - batchSize : (stryCov_9fa48("391"), i + batchSize)));
          console.log(stryMutAct_9fa48("392") ? `` : (stryCov_9fa48("392"), `⚙️  Processing batch ${stryMutAct_9fa48("393") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("393"), Math.floor(stryMutAct_9fa48("394") ? i * batchSize : (stryCov_9fa48("394"), i / batchSize)) + 1)}/${Math.ceil(stryMutAct_9fa48("395") ? filePaths.length * batchSize : (stryCov_9fa48("395"), filePaths.length / batchSize))}`));
          try {
            if (stryMutAct_9fa48("396")) {
              {}
            } else {
              stryCov_9fa48("396");
              const batchResults = await this.processBatch(batch, stryMutAct_9fa48("397") ? {} : (stryCov_9fa48("397"), {
                skipExisting,
                maxFileSize,
                ...config
              }));
              stryMutAct_9fa48("398") ? processedFiles -= batchResults.processedFiles : (stryCov_9fa48("398"), processedFiles += batchResults.processedFiles);
              stryMutAct_9fa48("399") ? skippedFiles -= batchResults.skippedFiles : (stryCov_9fa48("399"), skippedFiles += batchResults.skippedFiles);
              stryMutAct_9fa48("400") ? failedFiles -= batchResults.failedFiles : (stryCov_9fa48("400"), failedFiles += batchResults.failedFiles);
              stryMutAct_9fa48("401") ? totalChunks -= batchResults.totalChunks : (stryCov_9fa48("401"), totalChunks += batchResults.totalChunks);
              stryMutAct_9fa48("402") ? processedChunks -= batchResults.processedChunks : (stryCov_9fa48("402"), processedChunks += batchResults.processedChunks);
              errors.push(...batchResults.errors);

              // Update content type stats
              Object.entries(batchResults.contentTypeStats).forEach(([type, count]) => {
                if (stryMutAct_9fa48("403")) {
                  {}
                } else {
                  stryCov_9fa48("403");
                  stryMutAct_9fa48("404") ? contentTypeStats[type as ContentType] -= count : (stryCov_9fa48("404"), contentTypeStats[type as ContentType] += count);
                }
              });

              // Rate limiting
              if (stryMutAct_9fa48("408") ? i + batchSize >= filePaths.length : stryMutAct_9fa48("407") ? i + batchSize <= filePaths.length : stryMutAct_9fa48("406") ? false : stryMutAct_9fa48("405") ? true : (stryCov_9fa48("405", "406", "407", "408"), (stryMutAct_9fa48("409") ? i - batchSize : (stryCov_9fa48("409"), i + batchSize)) < filePaths.length)) {
                if (stryMutAct_9fa48("410")) {
                  {}
                } else {
                  stryCov_9fa48("410");
                  await new Promise(stryMutAct_9fa48("411") ? () => undefined : (stryCov_9fa48("411"), resolve => setTimeout(resolve, rateLimitMs)));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("412")) {
              {}
            } else {
              stryCov_9fa48("412");
              const errorMsg = stryMutAct_9fa48("413") ? `` : (stryCov_9fa48("413"), `Batch ${stryMutAct_9fa48("414") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("414"), Math.floor(stryMutAct_9fa48("415") ? i * batchSize : (stryCov_9fa48("415"), i / batchSize)) + 1)} failed: ${error}`);
              console.error(stryMutAct_9fa48("416") ? `` : (stryCov_9fa48("416"), `❌ ${errorMsg}`));
              errors.push(errorMsg);
              stryMutAct_9fa48("417") ? failedFiles -= batch.length : (stryCov_9fa48("417"), failedFiles += batch.length);
            }
          }
        }
      }
      const result: MultiModalIngestionResult = stryMutAct_9fa48("418") ? {} : (stryCov_9fa48("418"), {
        totalFiles: filePaths.length,
        processedFiles,
        skippedFiles,
        failedFiles,
        totalChunks,
        processedChunks,
        errors,
        contentTypeStats
      });
      console.log(stryMutAct_9fa48("419") ? `` : (stryCov_9fa48("419"), `✅ Multi-modal ingestion complete:`), result);
      return result;
    }
  }
  private async processBatch(filePaths: string[], config: MultiModalIngestionConfig): Promise<{
    processedFiles: number;
    skippedFiles: number;
    failedFiles: number;
    totalChunks: number;
    processedChunks: number;
    errors: string[];
    contentTypeStats: Record<ContentType, number>;
  }> {
    if (stryMutAct_9fa48("420")) {
      {}
    } else {
      stryCov_9fa48("420");
      let processedFiles = 0;
      let skippedFiles = 0;
      let failedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      const errors: string[] = stryMutAct_9fa48("421") ? ["Stryker was here"] : (stryCov_9fa48("421"), []);
      const contentTypeStats: Record<ContentType, number> = {} as Record<ContentType, number>;

      // Initialize stats
      Object.values(ContentType).forEach(type => {
        if (stryMutAct_9fa48("422")) {
          {}
        } else {
          stryCov_9fa48("422");
          contentTypeStats[type] = 0;
        }
      });
      for (const filePath of filePaths) {
        if (stryMutAct_9fa48("423")) {
          {}
        } else {
          stryCov_9fa48("423");
          try {
            if (stryMutAct_9fa48("424")) {
              {}
            } else {
              stryCov_9fa48("424");
              console.log(stryMutAct_9fa48("425") ? `` : (stryCov_9fa48("425"), `📖 Processing: ${path.basename(filePath)}`));

              // Check file size
              const stats = fs.statSync(filePath);
              if (stryMutAct_9fa48("429") ? stats.size <= (config.maxFileSize || 50 * 1024 * 1024) : stryMutAct_9fa48("428") ? stats.size >= (config.maxFileSize || 50 * 1024 * 1024) : stryMutAct_9fa48("427") ? false : stryMutAct_9fa48("426") ? true : (stryCov_9fa48("426", "427", "428", "429"), stats.size > (stryMutAct_9fa48("432") ? config.maxFileSize && 50 * 1024 * 1024 : stryMutAct_9fa48("431") ? false : stryMutAct_9fa48("430") ? true : (stryCov_9fa48("430", "431", "432"), config.maxFileSize || (stryMutAct_9fa48("433") ? 50 * 1024 / 1024 : (stryCov_9fa48("433"), (stryMutAct_9fa48("434") ? 50 / 1024 : (stryCov_9fa48("434"), 50 * 1024)) * 1024)))))) {
                if (stryMutAct_9fa48("435")) {
                  {}
                } else {
                  stryCov_9fa48("435");
                  console.log(stryMutAct_9fa48("436") ? `` : (stryCov_9fa48("436"), `⏭️  Skipping large file: ${path.basename(filePath)} (${stats.size} bytes)`));
                  stryMutAct_9fa48("437") ? skippedFiles-- : (stryCov_9fa48("437"), skippedFiles++);
                  continue;
                }
              }

              // Extract universal metadata
              const metadata = await this.metadataExtractor.extractMetadata(filePath);

              // Update content type stats
              stryMutAct_9fa48("438") ? contentTypeStats[metadata.content.type]-- : (stryCov_9fa48("438"), contentTypeStats[metadata.content.type]++);

              // Skip if processing failed
              if (stryMutAct_9fa48("441") ? false : stryMutAct_9fa48("440") ? true : stryMutAct_9fa48("439") ? metadata.processing.success : (stryCov_9fa48("439", "440", "441"), !metadata.processing.success)) {
                if (stryMutAct_9fa48("442")) {
                  {}
                } else {
                  stryCov_9fa48("442");
                  console.log(stryMutAct_9fa48("443") ? `` : (stryCov_9fa48("443"), `⏭️  Skipping failed processing: ${path.basename(filePath)}`));
                  stryMutAct_9fa48("444") ? failedFiles-- : (stryCov_9fa48("444"), failedFiles++);
                  continue;
                }
              }

              // Generate chunks from the file
              const chunks = await this.chunkMultiModalFile(metadata);
              stryMutAct_9fa48("445") ? totalChunks -= chunks.length : (stryCov_9fa48("445"), totalChunks += chunks.length);

              // Process each chunk
              for (const chunk of chunks) {
                if (stryMutAct_9fa48("446")) {
                  {}
                } else {
                  stryCov_9fa48("446");
                  try {
                    if (stryMutAct_9fa48("447")) {
                      {}
                    } else {
                      stryCov_9fa48("447");
                      // Check if chunk already exists
                      if (stryMutAct_9fa48("449") ? false : stryMutAct_9fa48("448") ? true : (stryCov_9fa48("448", "449"), config.skipExisting)) {
                        if (stryMutAct_9fa48("450")) {
                          {}
                        } else {
                          stryCov_9fa48("450");
                          const existing = await this.db.getChunkById(chunk.id);
                          if (stryMutAct_9fa48("452") ? false : stryMutAct_9fa48("451") ? true : (stryCov_9fa48("451", "452"), existing)) {
                            if (stryMutAct_9fa48("453")) {
                              {}
                            } else {
                              stryCov_9fa48("453");
                              console.log(stryMutAct_9fa48("454") ? `` : (stryCov_9fa48("454"), `⏭️  Skipping existing chunk: ${stryMutAct_9fa48("455") ? chunk.id : (stryCov_9fa48("455"), chunk.id.slice(0, 8))}...`));
                              continue;
                            }
                          }
                        }
                      }
                      console.log(stryMutAct_9fa48("456") ? `` : (stryCov_9fa48("456"), `🔮 Embedding chunk: ${stryMutAct_9fa48("457") ? chunk.id : (stryCov_9fa48("457"), chunk.id.slice(0, 8))}... (${chunk.text.length} chars)`));

                      // Generate embedding
                      const embeddingResult = await this.embeddings.embedWithStrategy(chunk.text, this.mapContentTypeToStrategy(metadata.content.type), stryMutAct_9fa48("458") ? "" : (stryCov_9fa48("458"), "knowledge-base"));

                      // Store in database
                      await this.db.upsertChunk(stryMutAct_9fa48("459") ? {} : (stryCov_9fa48("459"), {
                        ...chunk,
                        embedding: embeddingResult.embedding
                      }));
                      stryMutAct_9fa48("460") ? processedChunks-- : (stryCov_9fa48("460"), processedChunks++);
                    }
                  } catch (error) {
                    if (stryMutAct_9fa48("461")) {
                      {}
                    } else {
                      stryCov_9fa48("461");
                      console.error(stryMutAct_9fa48("462") ? `` : (stryCov_9fa48("462"), `❌ Failed to process chunk ${chunk.id}: ${error}`));
                      errors.push(stryMutAct_9fa48("463") ? `` : (stryCov_9fa48("463"), `Chunk ${chunk.id}: ${error}`));
                    }
                  }
                }
              }
              stryMutAct_9fa48("464") ? processedFiles-- : (stryCov_9fa48("464"), processedFiles++);
            }
          } catch (error) {
            if (stryMutAct_9fa48("465")) {
              {}
            } else {
              stryCov_9fa48("465");
              console.error(stryMutAct_9fa48("466") ? `` : (stryCov_9fa48("466"), `❌ Failed to process file ${filePath}: ${error}`));
              errors.push(stryMutAct_9fa48("467") ? `` : (stryCov_9fa48("467"), `File ${filePath}: ${error}`));
              stryMutAct_9fa48("468") ? failedFiles-- : (stryCov_9fa48("468"), failedFiles++);
            }
          }
        }
      }
      return stryMutAct_9fa48("469") ? {} : (stryCov_9fa48("469"), {
        processedFiles,
        skippedFiles,
        failedFiles,
        totalChunks,
        processedChunks,
        errors,
        contentTypeStats
      });
    }
  }
  private async chunkMultiModalFile(metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("470")) {
      {}
    } else {
      stryCov_9fa48("470");
      const filePath = metadata.file.path;
      const buffer = fs.readFileSync(filePath);

      // Base metadata for chunks
      const baseMetadata: DocumentMetadata = stryMutAct_9fa48("471") ? {} : (stryCov_9fa48("471"), {
        uri: stryMutAct_9fa48("472") ? `` : (stryCov_9fa48("472"), `file://${filePath}`),
        section: metadata.file.name,
        breadcrumbs: this.generateBreadcrumbs(filePath),
        contentType: this.mapContentType(metadata.content.type),
        sourceType: stryMutAct_9fa48("473") ? "" : (stryCov_9fa48("473"), "multi-modal"),
        sourceDocumentId: metadata.file.name,
        lang: stryMutAct_9fa48("476") ? metadata.content.language && "en" : stryMutAct_9fa48("475") ? false : stryMutAct_9fa48("474") ? true : (stryCov_9fa48("474", "475", "476"), metadata.content.language || (stryMutAct_9fa48("477") ? "" : (stryCov_9fa48("477"), "en"))),
        acl: stryMutAct_9fa48("478") ? "" : (stryCov_9fa48("478"), "public"),
        updatedAt: metadata.file.modifiedAt,
        createdAt: metadata.file.createdAt,
        chunkIndex: 0,
        chunkCount: 1,
        // Enhanced multi-modal metadata
        multiModalFile: stryMutAct_9fa48("479") ? {} : (stryCov_9fa48("479"), {
          fileId: metadata.file.id,
          contentType: metadata.content.type,
          mimeType: metadata.file.mimeType,
          checksum: metadata.file.checksum,
          quality: metadata.quality,
          processing: metadata.processing
        })
      });

      // Generate chunks based on content type
      switch (metadata.content.type) {
        case ContentType.MARKDOWN:
        case ContentType.PLAIN_TEXT:
          if (stryMutAct_9fa48("480")) {} else {
            stryCov_9fa48("480");
            return await this.chunkTextFile(buffer, baseMetadata, metadata);
          }
        case ContentType.PDF:
          if (stryMutAct_9fa48("481")) {} else {
            stryCov_9fa48("481");
            return await this.chunkPDFFile(buffer, baseMetadata, metadata);
          }
        case ContentType.OFFICE_DOC:
        case ContentType.OFFICE_SHEET:
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("482")) {} else {
            stryCov_9fa48("482");
            return await this.chunkOfficeFile(buffer, baseMetadata, metadata);
          }
        case ContentType.RASTER_IMAGE:
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("483")) {} else {
            stryCov_9fa48("483");
            return await this.chunkImageFile(buffer, baseMetadata, metadata);
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("484")) {} else {
            stryCov_9fa48("484");
            return await this.chunkAudioFile(buffer, baseMetadata, metadata);
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("485")) {} else {
            stryCov_9fa48("485");
            return await this.chunkVideoFile(buffer, baseMetadata, metadata);
          }
        case ContentType.JSON:
        case ContentType.XML:
        case ContentType.CSV:
          if (stryMutAct_9fa48("486")) {} else {
            stryCov_9fa48("486");
            return await this.chunkStructuredFile(buffer, baseMetadata, metadata);
          }
        default:
          if (stryMutAct_9fa48("487")) {} else {
            stryCov_9fa48("487");
            // For unsupported types, create a single chunk with metadata
            return stryMutAct_9fa48("488") ? [] : (stryCov_9fa48("488"), [this.createMetadataOnlyChunk(baseMetadata, metadata)]);
          }
      }
    }
  }
  private async chunkTextFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata, preExtractedText?: string): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("489")) {
      {}
    } else {
      stryCov_9fa48("489");
      const text = stryMutAct_9fa48("492") ? preExtractedText && buffer.toString("utf8") : stryMutAct_9fa48("491") ? false : stryMutAct_9fa48("490") ? true : (stryCov_9fa48("490", "491", "492"), preExtractedText || buffer.toString(stryMutAct_9fa48("493") ? "" : (stryCov_9fa48("493"), "utf8")));
      const cleanedText = cleanMarkdown(text);

      // Simple chunking by paragraphs or size
      const chunks: DocumentChunk[] = stryMutAct_9fa48("494") ? ["Stryker was here"] : (stryCov_9fa48("494"), []);
      const paragraphs = stryMutAct_9fa48("495") ? cleanedText.split("\n\n") : (stryCov_9fa48("495"), cleanedText.split(stryMutAct_9fa48("496") ? "" : (stryCov_9fa48("496"), "\n\n")).filter(stryMutAct_9fa48("497") ? () => undefined : (stryCov_9fa48("497"), p => stryMutAct_9fa48("501") ? p.trim().length <= 0 : stryMutAct_9fa48("500") ? p.trim().length >= 0 : stryMutAct_9fa48("499") ? false : stryMutAct_9fa48("498") ? true : (stryCov_9fa48("498", "499", "500", "501"), (stryMutAct_9fa48("502") ? p.length : (stryCov_9fa48("502"), p.trim().length)) > 0))));
      const maxChunkSize = 800;
      let currentChunk = stryMutAct_9fa48("503") ? "Stryker was here!" : (stryCov_9fa48("503"), "");
      let chunkIndex = 0;
      for (const paragraph of paragraphs) {
        if (stryMutAct_9fa48("504")) {
          {}
        } else {
          stryCov_9fa48("504");
          if (stryMutAct_9fa48("507") ? (currentChunk + paragraph).length > maxChunkSize || currentChunk.length > 0 : stryMutAct_9fa48("506") ? false : stryMutAct_9fa48("505") ? true : (stryCov_9fa48("505", "506", "507"), (stryMutAct_9fa48("510") ? (currentChunk + paragraph).length <= maxChunkSize : stryMutAct_9fa48("509") ? (currentChunk + paragraph).length >= maxChunkSize : stryMutAct_9fa48("508") ? true : (stryCov_9fa48("508", "509", "510"), (stryMutAct_9fa48("511") ? currentChunk - paragraph : (stryCov_9fa48("511"), currentChunk + paragraph)).length > maxChunkSize)) && (stryMutAct_9fa48("514") ? currentChunk.length <= 0 : stryMutAct_9fa48("513") ? currentChunk.length >= 0 : stryMutAct_9fa48("512") ? true : (stryCov_9fa48("512", "513", "514"), currentChunk.length > 0)))) {
            if (stryMutAct_9fa48("515")) {
              {}
            } else {
              stryCov_9fa48("515");
              // Create chunk
              chunks.push(stryMutAct_9fa48("516") ? {} : (stryCov_9fa48("516"), {
                id: this.generateChunkId(metadata.file.id, chunkIndex),
                text: stryMutAct_9fa48("517") ? currentChunk : (stryCov_9fa48("517"), currentChunk.trim()),
                meta: stryMutAct_9fa48("518") ? {} : (stryCov_9fa48("518"), {
                  ...baseMetadata,
                  section: stryMutAct_9fa48("519") ? `` : (stryCov_9fa48("519"), `${baseMetadata.section} (Part ${stryMutAct_9fa48("520") ? chunkIndex - 1 : (stryCov_9fa48("520"), chunkIndex + 1)})`),
                  chunkIndex,
                  chunkCount: Math.ceil(stryMutAct_9fa48("521") ? cleanedText.length * maxChunkSize : (stryCov_9fa48("521"), cleanedText.length / maxChunkSize))
                })
              }));
              currentChunk = paragraph;
              stryMutAct_9fa48("522") ? chunkIndex-- : (stryCov_9fa48("522"), chunkIndex++);
            }
          } else {
            if (stryMutAct_9fa48("523")) {
              {}
            } else {
              stryCov_9fa48("523");
              stryMutAct_9fa48("524") ? currentChunk -= (currentChunk ? "\n\n" : "") + paragraph : (stryCov_9fa48("524"), currentChunk += stryMutAct_9fa48("525") ? (currentChunk ? "\n\n" : "") - paragraph : (stryCov_9fa48("525"), (currentChunk ? stryMutAct_9fa48("526") ? "" : (stryCov_9fa48("526"), "\n\n") : stryMutAct_9fa48("527") ? "Stryker was here!" : (stryCov_9fa48("527"), "")) + paragraph));
            }
          }
        }
      }

      // Add final chunk
      if (stryMutAct_9fa48("530") ? currentChunk : stryMutAct_9fa48("529") ? false : stryMutAct_9fa48("528") ? true : (stryCov_9fa48("528", "529", "530"), currentChunk.trim())) {
        if (stryMutAct_9fa48("531")) {
          {}
        } else {
          stryCov_9fa48("531");
          chunks.push(stryMutAct_9fa48("532") ? {} : (stryCov_9fa48("532"), {
            id: this.generateChunkId(metadata.file.id, chunkIndex),
            text: stryMutAct_9fa48("533") ? currentChunk : (stryCov_9fa48("533"), currentChunk.trim()),
            meta: stryMutAct_9fa48("534") ? {} : (stryCov_9fa48("534"), {
              ...baseMetadata,
              section: stryMutAct_9fa48("535") ? `` : (stryCov_9fa48("535"), `${baseMetadata.section} (Part ${stryMutAct_9fa48("536") ? chunkIndex - 1 : (stryCov_9fa48("536"), chunkIndex + 1)})`),
              chunkIndex,
              chunkCount: stryMutAct_9fa48("537") ? chunkIndex - 1 : (stryCov_9fa48("537"), chunkIndex + 1)
            })
          }));
        }
      }
      return chunks;
    }
  }
  private async chunkPDFFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("538")) {
      {}
    } else {
      stryCov_9fa48("538");
      try {
        if (stryMutAct_9fa48("539")) {
          {}
        } else {
          stryCov_9fa48("539");
          // Extract text content from PDF using the PDF processor
          const pdfResult = await this.pdfProcessor.extractTextFromBuffer(buffer);

          // If PDF has extractable text, chunk it like regular text
          if (stryMutAct_9fa48("542") ? pdfResult.metadata.hasText || pdfResult.text.length > 0 : stryMutAct_9fa48("541") ? false : stryMutAct_9fa48("540") ? true : (stryCov_9fa48("540", "541", "542"), pdfResult.metadata.hasText && (stryMutAct_9fa48("545") ? pdfResult.text.length <= 0 : stryMutAct_9fa48("544") ? pdfResult.text.length >= 0 : stryMutAct_9fa48("543") ? true : (stryCov_9fa48("543", "544", "545"), pdfResult.text.length > 0)))) {
            if (stryMutAct_9fa48("546")) {
              {}
            } else {
              stryCov_9fa48("546");
              return await this.chunkTextFile(buffer, baseMetadata, metadata, pdfResult.text);
            }
          }

          // If no extractable text, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("547") ? {} : (stryCov_9fa48("547"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("548") ? `` : (stryCov_9fa48("548"), `PDF Document: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("549") ? `` : (stryCov_9fa48("549"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("550") ? `` : (stryCov_9fa48("550"), `Pages: ${stryMutAct_9fa48("553") ? pdfResult.metadata.pageCount && "Unknown" : stryMutAct_9fa48("552") ? false : stryMutAct_9fa48("551") ? true : (stryCov_9fa48("551", "552", "553"), pdfResult.metadata.pageCount || (stryMutAct_9fa48("554") ? "" : (stryCov_9fa48("554"), "Unknown")))}\n`)) + (stryMutAct_9fa48("555") ? `` : (stryCov_9fa48("555"), `Has Text: ${pdfResult.metadata.hasText ? stryMutAct_9fa48("556") ? "" : (stryCov_9fa48("556"), "Yes") : stryMutAct_9fa48("557") ? "" : (stryCov_9fa48("557"), "No")}\n`)) + (stryMutAct_9fa48("558") ? `` : (stryCov_9fa48("558"), `Word Count: ${stryMutAct_9fa48("561") ? pdfResult.metadata.wordCount && 0 : stryMutAct_9fa48("560") ? false : stryMutAct_9fa48("559") ? true : (stryCov_9fa48("559", "560", "561"), pdfResult.metadata.wordCount || 0)}\n`)) + (stryMutAct_9fa48("562") ? `` : (stryCov_9fa48("562"), `Author: ${stryMutAct_9fa48("565") ? pdfResult.metadata.pdfMetadata?.author && "Unknown" : stryMutAct_9fa48("564") ? false : stryMutAct_9fa48("563") ? true : (stryCov_9fa48("563", "564", "565"), (stryMutAct_9fa48("566") ? pdfResult.metadata.pdfMetadata.author : (stryCov_9fa48("566"), pdfResult.metadata.pdfMetadata?.author)) || (stryMutAct_9fa48("567") ? "" : (stryCov_9fa48("567"), "Unknown")))}\n`)) + (stryMutAct_9fa48("568") ? `` : (stryCov_9fa48("568"), `Title: ${stryMutAct_9fa48("571") ? pdfResult.metadata.pdfMetadata?.title && "Unknown" : stryMutAct_9fa48("570") ? false : stryMutAct_9fa48("569") ? true : (stryCov_9fa48("569", "570", "571"), (stryMutAct_9fa48("572") ? pdfResult.metadata.pdfMetadata.title : (stryCov_9fa48("572"), pdfResult.metadata.pdfMetadata?.title)) || (stryMutAct_9fa48("573") ? "" : (stryCov_9fa48("573"), "Unknown")))}`)),
            meta: stryMutAct_9fa48("574") ? {} : (stryCov_9fa48("574"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("575") ? [] : (stryCov_9fa48("575"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("576")) {
          {}
        } else {
          stryCov_9fa48("576");
          // Fallback for PDF processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("577") ? {} : (stryCov_9fa48("577"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("578") ? `` : (stryCov_9fa48("578"), `PDF Document: ${metadata.file.name}\nType: ${metadata.content.type}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("579") ? {} : (stryCov_9fa48("579"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("580") ? [] : (stryCov_9fa48("580"), [chunk]);
        }
      }
    }
  }
  private async chunkOfficeFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("581")) {
      {}
    } else {
      stryCov_9fa48("581");
      try {
        if (stryMutAct_9fa48("582")) {
          {}
        } else {
          stryCov_9fa48("582");
          // Extract text content from Office document using the Office processor
          const officeResult = await this.officeProcessor.extractTextFromBuffer(buffer, metadata.content.type);

          // If Office document has extractable text, chunk it like regular text
          if (stryMutAct_9fa48("585") ? officeResult.metadata.hasText || officeResult.text.length > 0 : stryMutAct_9fa48("584") ? false : stryMutAct_9fa48("583") ? true : (stryCov_9fa48("583", "584", "585"), officeResult.metadata.hasText && (stryMutAct_9fa48("588") ? officeResult.text.length <= 0 : stryMutAct_9fa48("587") ? officeResult.text.length >= 0 : stryMutAct_9fa48("586") ? true : (stryCov_9fa48("586", "587", "588"), officeResult.text.length > 0)))) {
            if (stryMutAct_9fa48("589")) {
              {}
            } else {
              stryCov_9fa48("589");
              // For substantial content, use text chunking
              if (stryMutAct_9fa48("593") ? officeResult.text.length <= 500 : stryMutAct_9fa48("592") ? officeResult.text.length >= 500 : stryMutAct_9fa48("591") ? false : stryMutAct_9fa48("590") ? true : (stryCov_9fa48("590", "591", "592", "593"), officeResult.text.length > 500)) {
                if (stryMutAct_9fa48("594")) {
                  {}
                } else {
                  stryCov_9fa48("594");
                  return await this.chunkTextFile(buffer, baseMetadata, metadata, officeResult.text);
                }
              } else {
                if (stryMutAct_9fa48("595")) {
                  {}
                } else {
                  stryCov_9fa48("595");
                  // For shorter content, create a single enriched chunk
                  const chunk: DocumentChunk = stryMutAct_9fa48("596") ? {} : (stryCov_9fa48("596"), {
                    id: this.generateChunkId(metadata.file.id, 0),
                    text: (stryMutAct_9fa48("597") ? `` : (stryCov_9fa48("597"), `${this.getOfficeTypeLabel(metadata.content.type)}: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("598") ? `` : (stryCov_9fa48("598"), `Word Count: ${officeResult.metadata.wordCount}\n`)) + (stryMutAct_9fa48("599") ? `` : (stryCov_9fa48("599"), `Language: ${officeResult.metadata.language}\n`)) + (stryMutAct_9fa48("600") ? `` : (stryCov_9fa48("600"), `${officeResult.text}`)),
                    meta: stryMutAct_9fa48("601") ? {} : (stryCov_9fa48("601"), {
                      ...baseMetadata,
                      chunkIndex: 0,
                      chunkCount: 1
                    })
                  });
                  return stryMutAct_9fa48("602") ? [] : (stryCov_9fa48("602"), [chunk]);
                }
              }
            }
          }

          // If no extractable text, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("603") ? {} : (stryCov_9fa48("603"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("604") ? `` : (stryCov_9fa48("604"), `${this.getOfficeTypeLabel(metadata.content.type)}: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("605") ? `` : (stryCov_9fa48("605"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("606") ? `` : (stryCov_9fa48("606"), `Has Text: ${officeResult.metadata.hasText ? stryMutAct_9fa48("607") ? "" : (stryCov_9fa48("607"), "Yes") : stryMutAct_9fa48("608") ? "" : (stryCov_9fa48("608"), "No")}\n`)) + (stryMutAct_9fa48("609") ? `` : (stryCov_9fa48("609"), `Word Count: ${stryMutAct_9fa48("612") ? officeResult.metadata.wordCount && 0 : stryMutAct_9fa48("611") ? false : stryMutAct_9fa48("610") ? true : (stryCov_9fa48("610", "611", "612"), officeResult.metadata.wordCount || 0)}\n`)) + (stryMutAct_9fa48("613") ? `` : (stryCov_9fa48("613"), `${officeResult.text}`)),
            meta: stryMutAct_9fa48("614") ? {} : (stryCov_9fa48("614"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("615") ? [] : (stryCov_9fa48("615"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("616")) {
          {}
        } else {
          stryCov_9fa48("616");
          // Fallback for Office document processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("617") ? {} : (stryCov_9fa48("617"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("618") ? `` : (stryCov_9fa48("618"), `Office Document Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("619") ? {} : (stryCov_9fa48("619"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("620") ? [] : (stryCov_9fa48("620"), [chunk]);
        }
      }
    }
  }

  /**
   * Get human-readable label for Office document types
   */
  private getOfficeTypeLabel(contentType: ContentType): string {
    if (stryMutAct_9fa48("621")) {
      {}
    } else {
      stryCov_9fa48("621");
      switch (contentType) {
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("622")) {} else {
            stryCov_9fa48("622");
            return stryMutAct_9fa48("623") ? "" : (stryCov_9fa48("623"), "Word Document");
          }
        case ContentType.OFFICE_SHEET:
          if (stryMutAct_9fa48("624")) {} else {
            stryCov_9fa48("624");
            return stryMutAct_9fa48("625") ? "" : (stryCov_9fa48("625"), "Excel Spreadsheet");
          }
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("626")) {} else {
            stryCov_9fa48("626");
            return stryMutAct_9fa48("627") ? "" : (stryCov_9fa48("627"), "PowerPoint Presentation");
          }
        default:
          if (stryMutAct_9fa48("628")) {} else {
            stryCov_9fa48("628");
            return stryMutAct_9fa48("629") ? "" : (stryCov_9fa48("629"), "Office Document");
          }
      }
    }
  }
  private async chunkImageFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("630")) {
      {}
    } else {
      stryCov_9fa48("630");
      try {
        if (stryMutAct_9fa48("631")) {
          {}
        } else {
          stryCov_9fa48("631");
          // For raster images, OCR might have been performed
          if (stryMutAct_9fa48("634") ? metadata.content.type !== ContentType.RASTER_IMAGE : stryMutAct_9fa48("633") ? false : stryMutAct_9fa48("632") ? true : (stryCov_9fa48("632", "633", "634"), metadata.content.type === ContentType.RASTER_IMAGE)) {
            if (stryMutAct_9fa48("635")) {
              {}
            } else {
              stryCov_9fa48("635");
              // Check if OCR extracted text (content has hasText and wordCount > 0)
              if (stryMutAct_9fa48("638") ? (metadata.content as any).hasText || (metadata.content as any).wordCount > 0 : stryMutAct_9fa48("637") ? false : stryMutAct_9fa48("636") ? true : (stryCov_9fa48("636", "637", "638"), (metadata.content as any).hasText && (stryMutAct_9fa48("641") ? (metadata.content as any).wordCount <= 0 : stryMutAct_9fa48("640") ? (metadata.content as any).wordCount >= 0 : stryMutAct_9fa48("639") ? true : (stryCov_9fa48("639", "640", "641"), (metadata.content as any).wordCount > 0)))) {
                if (stryMutAct_9fa48("642")) {
                  {}
                } else {
                  stryCov_9fa48("642");
                  // Perform OCR to get the actual text
                  const ocrResult = await this.ocrProcessor.extractTextFromBuffer(buffer);

                  // If OCR was successful, chunk the text
                  if (stryMutAct_9fa48("645") ? ocrResult.metadata.hasText || ocrResult.text.length > 100 : stryMutAct_9fa48("644") ? false : stryMutAct_9fa48("643") ? true : (stryCov_9fa48("643", "644", "645"), ocrResult.metadata.hasText && (stryMutAct_9fa48("648") ? ocrResult.text.length <= 100 : stryMutAct_9fa48("647") ? ocrResult.text.length >= 100 : stryMutAct_9fa48("646") ? true : (stryCov_9fa48("646", "647", "648"), ocrResult.text.length > 100)))) {
                    if (stryMutAct_9fa48("649")) {
                      {}
                    } else {
                      stryCov_9fa48("649");
                      // Use text chunking for substantial OCR content
                      return await this.chunkTextFile(buffer, baseMetadata, metadata, ocrResult.text);
                    }
                  } else {
                    if (stryMutAct_9fa48("650")) {
                      {}
                    } else {
                      stryCov_9fa48("650");
                      // Create a chunk with OCR results and metadata
                      const chunk: DocumentChunk = stryMutAct_9fa48("651") ? {} : (stryCov_9fa48("651"), {
                        id: this.generateChunkId(metadata.file.id, 0),
                        text: (stryMutAct_9fa48("652") ? `` : (stryCov_9fa48("652"), `Image OCR: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("653") ? `` : (stryCov_9fa48("653"), `OCR Confidence: ${stryMutAct_9fa48("656") ? (metadata.content as any).confidence?.toFixed(1) && "Unknown" : stryMutAct_9fa48("655") ? false : stryMutAct_9fa48("654") ? true : (stryCov_9fa48("654", "655", "656"), (stryMutAct_9fa48("657") ? (metadata.content as any).confidence.toFixed(1) : (stryCov_9fa48("657"), (metadata.content as any).confidence?.toFixed(1))) || (stryMutAct_9fa48("658") ? "" : (stryCov_9fa48("658"), "Unknown")))}%\n`)) + (stryMutAct_9fa48("659") ? `` : (stryCov_9fa48("659"), `Has Text: ${(metadata.content as any).hasText ? stryMutAct_9fa48("660") ? "" : (stryCov_9fa48("660"), "Yes") : stryMutAct_9fa48("661") ? "" : (stryCov_9fa48("661"), "No")}\n`)) + (stryMutAct_9fa48("662") ? `` : (stryCov_9fa48("662"), `Word Count: ${stryMutAct_9fa48("665") ? (metadata.content as any).wordCount && 0 : stryMutAct_9fa48("664") ? false : stryMutAct_9fa48("663") ? true : (stryCov_9fa48("663", "664", "665"), (metadata.content as any).wordCount || 0)}\n`)) + (stryMutAct_9fa48("666") ? `` : (stryCov_9fa48("666"), `${ocrResult.text}`)),
                        meta: stryMutAct_9fa48("667") ? {} : (stryCov_9fa48("667"), {
                          ...baseMetadata,
                          chunkIndex: 0,
                          chunkCount: 1
                        })
                      });
                      return stryMutAct_9fa48("668") ? [] : (stryCov_9fa48("668"), [chunk]);
                    }
                  }
                }
              }
            }
          }

          // Fallback for images without OCR or unsupported image types
          const chunk: DocumentChunk = stryMutAct_9fa48("669") ? {} : (stryCov_9fa48("669"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("670") ? `` : (stryCov_9fa48("670"), `Image: ${metadata.file.name}\nType: ${metadata.content.type}\nFormat: ${metadata.file.extension}`),
            meta: stryMutAct_9fa48("671") ? {} : (stryCov_9fa48("671"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("672") ? [] : (stryCov_9fa48("672"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("673")) {
          {}
        } else {
          stryCov_9fa48("673");
          // Fallback for image processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("674") ? {} : (stryCov_9fa48("674"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("675") ? `` : (stryCov_9fa48("675"), `Image Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("676") ? {} : (stryCov_9fa48("676"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("677") ? [] : (stryCov_9fa48("677"), [chunk]);
        }
      }
    }
  }
  private async chunkAudioFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("678")) {
      {}
    } else {
      stryCov_9fa48("678");
      try {
        if (stryMutAct_9fa48("679")) {
          {}
        } else {
          stryCov_9fa48("679");
          // Attempt speech-to-text transcription
          const speechResult = await this.speechProcessor.transcribeFromBuffer(buffer, stryMutAct_9fa48("680") ? {} : (stryCov_9fa48("680"), {
            language: stryMutAct_9fa48("681") ? "" : (stryCov_9fa48("681"), "en"),
            sampleRate: 16000
          }));

          // If transcription was successful, chunk the text
          if (stryMutAct_9fa48("684") ? speechResult.metadata.hasText || speechResult.text.length > 0 : stryMutAct_9fa48("683") ? false : stryMutAct_9fa48("682") ? true : (stryCov_9fa48("682", "683", "684"), speechResult.metadata.hasText && (stryMutAct_9fa48("687") ? speechResult.text.length <= 0 : stryMutAct_9fa48("686") ? speechResult.text.length >= 0 : stryMutAct_9fa48("685") ? true : (stryCov_9fa48("685", "686", "687"), speechResult.text.length > 0)))) {
            if (stryMutAct_9fa48("688")) {
              {}
            } else {
              stryCov_9fa48("688");
              // For substantial transcriptions, use text chunking
              if (stryMutAct_9fa48("692") ? speechResult.text.length <= 300 : stryMutAct_9fa48("691") ? speechResult.text.length >= 300 : stryMutAct_9fa48("690") ? false : stryMutAct_9fa48("689") ? true : (stryCov_9fa48("689", "690", "691", "692"), speechResult.text.length > 300)) {
                if (stryMutAct_9fa48("693")) {
                  {}
                } else {
                  stryCov_9fa48("693");
                  return await this.chunkTextFile(buffer, baseMetadata, metadata, speechResult.text);
                }
              } else {
                if (stryMutAct_9fa48("694")) {
                  {}
                } else {
                  stryCov_9fa48("694");
                  // For shorter transcriptions, create a single enriched chunk
                  const chunk: DocumentChunk = stryMutAct_9fa48("695") ? {} : (stryCov_9fa48("695"), {
                    id: this.generateChunkId(metadata.file.id, 0),
                    text: (stryMutAct_9fa48("696") ? `` : (stryCov_9fa48("696"), `Audio Transcript: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("697") ? `` : (stryCov_9fa48("697"), `Duration: ${stryMutAct_9fa48("700") ? speechResult.metadata.speechMetadata?.duration?.toFixed(1) && "Unknown" : stryMutAct_9fa48("699") ? false : stryMutAct_9fa48("698") ? true : (stryCov_9fa48("698", "699", "700"), (stryMutAct_9fa48("702") ? speechResult.metadata.speechMetadata.duration?.toFixed(1) : stryMutAct_9fa48("701") ? speechResult.metadata.speechMetadata?.duration.toFixed(1) : (stryCov_9fa48("701", "702"), speechResult.metadata.speechMetadata?.duration?.toFixed(1))) || (stryMutAct_9fa48("703") ? "" : (stryCov_9fa48("703"), "Unknown")))}s\n`)) + (stryMutAct_9fa48("704") ? `` : (stryCov_9fa48("704"), `Language: ${speechResult.metadata.language}\n`)) + (stryMutAct_9fa48("705") ? `` : (stryCov_9fa48("705"), `Confidence: ${stryMutAct_9fa48("708") ? speechResult.metadata.speechMetadata?.confidence?.toFixed(1) && "Unknown" : stryMutAct_9fa48("707") ? false : stryMutAct_9fa48("706") ? true : (stryCov_9fa48("706", "707", "708"), (stryMutAct_9fa48("710") ? speechResult.metadata.speechMetadata.confidence?.toFixed(1) : stryMutAct_9fa48("709") ? speechResult.metadata.speechMetadata?.confidence.toFixed(1) : (stryCov_9fa48("709", "710"), speechResult.metadata.speechMetadata?.confidence?.toFixed(1))) || (stryMutAct_9fa48("711") ? "" : (stryCov_9fa48("711"), "Unknown")))}\n`)) + (stryMutAct_9fa48("712") ? `` : (stryCov_9fa48("712"), `${speechResult.text}`)),
                    meta: stryMutAct_9fa48("713") ? {} : (stryCov_9fa48("713"), {
                      ...baseMetadata,
                      chunkIndex: 0,
                      chunkCount: 1
                    })
                  });
                  return stryMutAct_9fa48("714") ? [] : (stryCov_9fa48("714"), [chunk]);
                }
              }
            }
          }

          // If no transcription, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("715") ? {} : (stryCov_9fa48("715"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("716") ? `` : (stryCov_9fa48("716"), `Audio: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("717") ? `` : (stryCov_9fa48("717"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("718") ? `` : (stryCov_9fa48("718"), `Duration: ${stryMutAct_9fa48("721") ? speechResult.metadata.speechMetadata?.duration?.toFixed(1) && "Unknown" : stryMutAct_9fa48("720") ? false : stryMutAct_9fa48("719") ? true : (stryCov_9fa48("719", "720", "721"), (stryMutAct_9fa48("723") ? speechResult.metadata.speechMetadata.duration?.toFixed(1) : stryMutAct_9fa48("722") ? speechResult.metadata.speechMetadata?.duration.toFixed(1) : (stryCov_9fa48("722", "723"), speechResult.metadata.speechMetadata?.duration?.toFixed(1))) || (stryMutAct_9fa48("724") ? "" : (stryCov_9fa48("724"), "Unknown")))}s\n`)) + (stryMutAct_9fa48("725") ? `` : (stryCov_9fa48("725"), `Processing Time: ${stryMutAct_9fa48("728") ? speechResult.metadata.speechMetadata?.processingTime && 0 : stryMutAct_9fa48("727") ? false : stryMutAct_9fa48("726") ? true : (stryCov_9fa48("726", "727", "728"), (stryMutAct_9fa48("729") ? speechResult.metadata.speechMetadata.processingTime : (stryCov_9fa48("729"), speechResult.metadata.speechMetadata?.processingTime)) || 0)}ms\n`)) + (stryMutAct_9fa48("730") ? `` : (stryCov_9fa48("730"), `${speechResult.text}`)),
            meta: stryMutAct_9fa48("731") ? {} : (stryCov_9fa48("731"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("732") ? [] : (stryCov_9fa48("732"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("733")) {
          {}
        } else {
          stryCov_9fa48("733");
          // Fallback for audio processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("734") ? {} : (stryCov_9fa48("734"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("735") ? `` : (stryCov_9fa48("735"), `Audio Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("736") ? {} : (stryCov_9fa48("736"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("737") ? [] : (stryCov_9fa48("737"), [chunk]);
        }
      }
    }
  }
  private async chunkVideoFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("738")) {
      {}
    } else {
      stryCov_9fa48("738");
      // Placeholder for video processing
      // In production, would extract audio and attempt speech-to-text

      const chunk: DocumentChunk = stryMutAct_9fa48("739") ? {} : (stryCov_9fa48("739"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("740") ? `` : (stryCov_9fa48("740"), `Video: ${metadata.file.name}\nType: ${metadata.content.type}\nDuration: ${stryMutAct_9fa48("743") ? metadata.content.duration && "Unknown" : stryMutAct_9fa48("742") ? false : stryMutAct_9fa48("741") ? true : (stryCov_9fa48("741", "742", "743"), metadata.content.duration || (stryMutAct_9fa48("744") ? "" : (stryCov_9fa48("744"), "Unknown")))} seconds\nDimensions: ${stryMutAct_9fa48("747") ? metadata.content.dimensions?.width && "Unknown" : stryMutAct_9fa48("746") ? false : stryMutAct_9fa48("745") ? true : (stryCov_9fa48("745", "746", "747"), (stryMutAct_9fa48("748") ? metadata.content.dimensions.width : (stryCov_9fa48("748"), metadata.content.dimensions?.width)) || (stryMutAct_9fa48("749") ? "" : (stryCov_9fa48("749"), "Unknown")))}x${stryMutAct_9fa48("752") ? metadata.content.dimensions?.height && "Unknown" : stryMutAct_9fa48("751") ? false : stryMutAct_9fa48("750") ? true : (stryCov_9fa48("750", "751", "752"), (stryMutAct_9fa48("753") ? metadata.content.dimensions.height : (stryCov_9fa48("753"), metadata.content.dimensions?.height)) || (stryMutAct_9fa48("754") ? "" : (stryCov_9fa48("754"), "Unknown")))}`),
        meta: stryMutAct_9fa48("755") ? {} : (stryCov_9fa48("755"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return stryMutAct_9fa48("756") ? [] : (stryCov_9fa48("756"), [chunk]);
    }
  }
  private async chunkStructuredFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("757")) {
      {}
    } else {
      stryCov_9fa48("757");
      const text = buffer.toString(stryMutAct_9fa48("758") ? "" : (stryCov_9fa48("758"), "utf8"));

      // For structured data, create a single chunk with the content
      const chunk: DocumentChunk = stryMutAct_9fa48("759") ? {} : (stryCov_9fa48("759"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("760") ? `` : (stryCov_9fa48("760"), `Structured Data: ${metadata.file.name}\nType: ${metadata.content.type}\nContent:\n${stryMutAct_9fa48("761") ? text : (stryCov_9fa48("761"), text.slice(0, 1000))}${(stryMutAct_9fa48("765") ? text.length <= 1000 : stryMutAct_9fa48("764") ? text.length >= 1000 : stryMutAct_9fa48("763") ? false : stryMutAct_9fa48("762") ? true : (stryCov_9fa48("762", "763", "764", "765"), text.length > 1000)) ? stryMutAct_9fa48("766") ? "" : (stryCov_9fa48("766"), "...") : stryMutAct_9fa48("767") ? "Stryker was here!" : (stryCov_9fa48("767"), "")}`),
        meta: stryMutAct_9fa48("768") ? {} : (stryCov_9fa48("768"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return stryMutAct_9fa48("769") ? [] : (stryCov_9fa48("769"), [chunk]);
    }
  }
  private createMetadataOnlyChunk(baseMetadata: DocumentMetadata, metadata: UniversalMetadata): DocumentChunk {
    if (stryMutAct_9fa48("770")) {
      {}
    } else {
      stryCov_9fa48("770");
      const chunk: DocumentChunk = stryMutAct_9fa48("771") ? {} : (stryCov_9fa48("771"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("772") ? `` : (stryCov_9fa48("772"), `File: ${metadata.file.name}\nType: ${metadata.content.type}\nMIME Type: ${metadata.file.mimeType}\nSize: ${metadata.file.size} bytes\nQuality Score: ${metadata.quality.overallScore.toFixed(2)}`),
        meta: stryMutAct_9fa48("773") ? {} : (stryCov_9fa48("773"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return chunk;
    }
  }
  private mapContentType(contentType: ContentType): string {
    if (stryMutAct_9fa48("774")) {
      {}
    } else {
      stryCov_9fa48("774");
      // Map our ContentType enum to the existing content type strings
      switch (contentType) {
        case ContentType.MARKDOWN:
          if (stryMutAct_9fa48("775")) {} else {
            stryCov_9fa48("775");
            return stryMutAct_9fa48("776") ? "" : (stryCov_9fa48("776"), "markdown");
          }
        case ContentType.PLAIN_TEXT:
          if (stryMutAct_9fa48("777")) {} else {
            stryCov_9fa48("777");
            return stryMutAct_9fa48("778") ? "" : (stryCov_9fa48("778"), "plain_text");
          }
        case ContentType.PDF:
          if (stryMutAct_9fa48("779")) {} else {
            stryCov_9fa48("779");
            return stryMutAct_9fa48("780") ? "" : (stryCov_9fa48("780"), "pdf");
          }
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("781")) {} else {
            stryCov_9fa48("781");
            return stryMutAct_9fa48("782") ? "" : (stryCov_9fa48("782"), "office_document");
          }
        case ContentType.OFFICE_SHEET:
          if (stryMutAct_9fa48("783")) {} else {
            stryCov_9fa48("783");
            return stryMutAct_9fa48("784") ? "" : (stryCov_9fa48("784"), "office_sheet");
          }
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("785")) {} else {
            stryCov_9fa48("785");
            return stryMutAct_9fa48("786") ? "" : (stryCov_9fa48("786"), "office_presentation");
          }
        case ContentType.RASTER_IMAGE:
          if (stryMutAct_9fa48("787")) {} else {
            stryCov_9fa48("787");
            return stryMutAct_9fa48("788") ? "" : (stryCov_9fa48("788"), "image");
          }
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("789")) {} else {
            stryCov_9fa48("789");
            return stryMutAct_9fa48("790") ? "" : (stryCov_9fa48("790"), "vector_image");
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("791")) {} else {
            stryCov_9fa48("791");
            return stryMutAct_9fa48("792") ? "" : (stryCov_9fa48("792"), "audio");
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("793")) {} else {
            stryCov_9fa48("793");
            return stryMutAct_9fa48("794") ? "" : (stryCov_9fa48("794"), "video");
          }
        case ContentType.JSON:
          if (stryMutAct_9fa48("795")) {} else {
            stryCov_9fa48("795");
            return stryMutAct_9fa48("796") ? "" : (stryCov_9fa48("796"), "json");
          }
        case ContentType.XML:
          if (stryMutAct_9fa48("797")) {} else {
            stryCov_9fa48("797");
            return stryMutAct_9fa48("798") ? "" : (stryCov_9fa48("798"), "xml");
          }
        case ContentType.CSV:
          if (stryMutAct_9fa48("799")) {} else {
            stryCov_9fa48("799");
            return stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), "csv");
          }
        default:
          if (stryMutAct_9fa48("801")) {} else {
            stryCov_9fa48("801");
            return stryMutAct_9fa48("802") ? "" : (stryCov_9fa48("802"), "unknown");
          }
      }
    }
  }
  private mapContentTypeToStrategy(contentType: ContentType): string {
    if (stryMutAct_9fa48("803")) {
      {}
    } else {
      stryCov_9fa48("803");
      // Map to embedding strategy
      switch (contentType) {
        case ContentType.MARKDOWN:
        case ContentType.PLAIN_TEXT:
        case ContentType.PDF:
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("804")) {} else {
            stryCov_9fa48("804");
            return stryMutAct_9fa48("805") ? "" : (stryCov_9fa48("805"), "text");
          }
        case ContentType.RASTER_IMAGE:
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("806")) {} else {
            stryCov_9fa48("806");
            return stryMutAct_9fa48("807") ? "" : (stryCov_9fa48("807"), "image");
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("808")) {} else {
            stryCov_9fa48("808");
            return stryMutAct_9fa48("809") ? "" : (stryCov_9fa48("809"), "audio");
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("810")) {} else {
            stryCov_9fa48("810");
            return stryMutAct_9fa48("811") ? "" : (stryCov_9fa48("811"), "video");
          }
        default:
          if (stryMutAct_9fa48("812")) {} else {
            stryCov_9fa48("812");
            return stryMutAct_9fa48("813") ? "" : (stryCov_9fa48("813"), "text");
          }
        // fallback
      }
    }
  }
  private generateChunkId(fileId: string, chunkIndex: number): string {
    if (stryMutAct_9fa48("814")) {
      {}
    } else {
      stryCov_9fa48("814");
      const hash = stryMutAct_9fa48("815") ? createHash("md5").update(`${fileId}_${chunkIndex}`).digest("hex") : (stryCov_9fa48("815"), createHash(stryMutAct_9fa48("816") ? "" : (stryCov_9fa48("816"), "md5")).update(stryMutAct_9fa48("817") ? `` : (stryCov_9fa48("817"), `${fileId}_${chunkIndex}`)).digest(stryMutAct_9fa48("818") ? "" : (stryCov_9fa48("818"), "hex")).slice(0, 8));
      return stryMutAct_9fa48("819") ? `` : (stryCov_9fa48("819"), `multi_${fileId}_${chunkIndex}_${hash}`);
    }
  }
  private generateBreadcrumbs(filePath: string): string[] {
    if (stryMutAct_9fa48("820")) {
      {}
    } else {
      stryCov_9fa48("820");
      const parts = stryMutAct_9fa48("821") ? filePath.split(path.sep) : (stryCov_9fa48("821"), filePath.split(path.sep).filter(stryMutAct_9fa48("822") ? () => undefined : (stryCov_9fa48("822"), part => stryMutAct_9fa48("825") ? part || part !== "." : stryMutAct_9fa48("824") ? false : stryMutAct_9fa48("823") ? true : (stryCov_9fa48("823", "824", "825"), part && (stryMutAct_9fa48("827") ? part === "." : stryMutAct_9fa48("826") ? true : (stryCov_9fa48("826", "827"), part !== (stryMutAct_9fa48("828") ? "" : (stryCov_9fa48("828"), "."))))))));
      const breadcrumbs: string[] = stryMutAct_9fa48("829") ? ["Stryker was here"] : (stryCov_9fa48("829"), []);
      for (let i = 0; stryMutAct_9fa48("832") ? i >= parts.length - 1 : stryMutAct_9fa48("831") ? i <= parts.length - 1 : stryMutAct_9fa48("830") ? false : (stryCov_9fa48("830", "831", "832"), i < (stryMutAct_9fa48("833") ? parts.length + 1 : (stryCov_9fa48("833"), parts.length - 1))); stryMutAct_9fa48("834") ? i-- : (stryCov_9fa48("834"), i++)) {
        if (stryMutAct_9fa48("835")) {
          {}
        } else {
          stryCov_9fa48("835");
          const segment = stryMutAct_9fa48("836") ? parts.join("/") : (stryCov_9fa48("836"), parts.slice(0, stryMutAct_9fa48("837") ? i - 1 : (stryCov_9fa48("837"), i + 1)).join(stryMutAct_9fa48("838") ? "" : (stryCov_9fa48("838"), "/")));
          breadcrumbs.push(segment);
        }
      }
      return breadcrumbs;
    }
  }
}