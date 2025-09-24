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
import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import { MultiModalContentDetector, UniversalMetadataExtractor, UniversalMetadata, ContentType } from "./multi-modal";
import { PDFProcessor } from "./processors/pdf-processor";
import { OCRProcessor } from "./processors/ocr-processor";
import { OfficeProcessor } from "./processors/office-processor";
import { SpeechProcessor } from "./processors/speech-processor";
import { DocumentChunk, DocumentMetadata } from "../types/index";
import { cleanMarkdown } from "./utils";
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
    if (stryMutAct_9fa48("1020")) {
      {}
    } else {
      stryCov_9fa48("1020");
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
    if (stryMutAct_9fa48("1021")) {
      {}
    } else {
      stryCov_9fa48("1021");
      const {
        batchSize = 5,
        rateLimitMs = 200,
        skipExisting = stryMutAct_9fa48("1022") ? false : (stryCov_9fa48("1022"), true),
        maxFileSize = stryMutAct_9fa48("1023") ? 50 * 1024 / 1024 : (stryCov_9fa48("1023"), (stryMutAct_9fa48("1024") ? 50 / 1024 : (stryCov_9fa48("1024"), 50 * 1024)) * 1024) // 50MB default
      } = config;
      console.log(stryMutAct_9fa48("1025") ? `` : (stryCov_9fa48("1025"), `🚀 Starting multi-modal ingestion: ${filePaths.length} files`));
      let processedFiles = 0;
      let skippedFiles = 0;
      let failedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      const errors: string[] = stryMutAct_9fa48("1026") ? ["Stryker was here"] : (stryCov_9fa48("1026"), []);
      const contentTypeStats: Record<ContentType, number> = {} as Record<ContentType, number>;

      // Initialize stats
      Object.values(ContentType).forEach(type => {
        if (stryMutAct_9fa48("1027")) {
          {}
        } else {
          stryCov_9fa48("1027");
          contentTypeStats[type] = 0;
        }
      });

      // Process files in batches
      for (let i = 0; stryMutAct_9fa48("1030") ? i >= filePaths.length : stryMutAct_9fa48("1029") ? i <= filePaths.length : stryMutAct_9fa48("1028") ? false : (stryCov_9fa48("1028", "1029", "1030"), i < filePaths.length); stryMutAct_9fa48("1031") ? i -= batchSize : (stryCov_9fa48("1031"), i += batchSize)) {
        if (stryMutAct_9fa48("1032")) {
          {}
        } else {
          stryCov_9fa48("1032");
          const batch = stryMutAct_9fa48("1033") ? filePaths : (stryCov_9fa48("1033"), filePaths.slice(i, stryMutAct_9fa48("1034") ? i - batchSize : (stryCov_9fa48("1034"), i + batchSize)));
          console.log(stryMutAct_9fa48("1035") ? `` : (stryCov_9fa48("1035"), `⚙️  Processing batch ${stryMutAct_9fa48("1036") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("1036"), Math.floor(stryMutAct_9fa48("1037") ? i * batchSize : (stryCov_9fa48("1037"), i / batchSize)) + 1)}/${Math.ceil(stryMutAct_9fa48("1038") ? filePaths.length * batchSize : (stryCov_9fa48("1038"), filePaths.length / batchSize))}`));
          try {
            if (stryMutAct_9fa48("1039")) {
              {}
            } else {
              stryCov_9fa48("1039");
              const batchResults = await this.processBatch(batch, stryMutAct_9fa48("1040") ? {} : (stryCov_9fa48("1040"), {
                skipExisting,
                maxFileSize,
                ...config
              }));
              stryMutAct_9fa48("1041") ? processedFiles -= batchResults.processedFiles : (stryCov_9fa48("1041"), processedFiles += batchResults.processedFiles);
              stryMutAct_9fa48("1042") ? skippedFiles -= batchResults.skippedFiles : (stryCov_9fa48("1042"), skippedFiles += batchResults.skippedFiles);
              stryMutAct_9fa48("1043") ? failedFiles -= batchResults.failedFiles : (stryCov_9fa48("1043"), failedFiles += batchResults.failedFiles);
              stryMutAct_9fa48("1044") ? totalChunks -= batchResults.totalChunks : (stryCov_9fa48("1044"), totalChunks += batchResults.totalChunks);
              stryMutAct_9fa48("1045") ? processedChunks -= batchResults.processedChunks : (stryCov_9fa48("1045"), processedChunks += batchResults.processedChunks);
              errors.push(...batchResults.errors);

              // Update content type stats
              Object.entries(batchResults.contentTypeStats).forEach(([type, count]) => {
                if (stryMutAct_9fa48("1046")) {
                  {}
                } else {
                  stryCov_9fa48("1046");
                  stryMutAct_9fa48("1047") ? contentTypeStats[type as ContentType] -= count : (stryCov_9fa48("1047"), contentTypeStats[type as ContentType] += count);
                }
              });

              // Rate limiting
              if (stryMutAct_9fa48("1051") ? i + batchSize >= filePaths.length : stryMutAct_9fa48("1050") ? i + batchSize <= filePaths.length : stryMutAct_9fa48("1049") ? false : stryMutAct_9fa48("1048") ? true : (stryCov_9fa48("1048", "1049", "1050", "1051"), (stryMutAct_9fa48("1052") ? i - batchSize : (stryCov_9fa48("1052"), i + batchSize)) < filePaths.length)) {
                if (stryMutAct_9fa48("1053")) {
                  {}
                } else {
                  stryCov_9fa48("1053");
                  await new Promise(stryMutAct_9fa48("1054") ? () => undefined : (stryCov_9fa48("1054"), resolve => setTimeout(resolve, rateLimitMs)));
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("1055")) {
              {}
            } else {
              stryCov_9fa48("1055");
              const errorMsg = stryMutAct_9fa48("1056") ? `` : (stryCov_9fa48("1056"), `Batch ${stryMutAct_9fa48("1057") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("1057"), Math.floor(stryMutAct_9fa48("1058") ? i * batchSize : (stryCov_9fa48("1058"), i / batchSize)) + 1)} failed: ${error}`);
              console.error(stryMutAct_9fa48("1059") ? `` : (stryCov_9fa48("1059"), `❌ ${errorMsg}`));
              errors.push(errorMsg);
              stryMutAct_9fa48("1060") ? failedFiles -= batch.length : (stryCov_9fa48("1060"), failedFiles += batch.length);
            }
          }
        }
      }
      const result: MultiModalIngestionResult = stryMutAct_9fa48("1061") ? {} : (stryCov_9fa48("1061"), {
        totalFiles: filePaths.length,
        processedFiles,
        skippedFiles,
        failedFiles,
        totalChunks,
        processedChunks,
        errors,
        contentTypeStats
      });
      console.log(stryMutAct_9fa48("1062") ? `` : (stryCov_9fa48("1062"), `✅ Multi-modal ingestion complete:`), result);
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
    if (stryMutAct_9fa48("1063")) {
      {}
    } else {
      stryCov_9fa48("1063");
      let processedFiles = 0;
      let skippedFiles = 0;
      let failedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      const errors: string[] = stryMutAct_9fa48("1064") ? ["Stryker was here"] : (stryCov_9fa48("1064"), []);
      const contentTypeStats: Record<ContentType, number> = {} as Record<ContentType, number>;

      // Initialize stats
      Object.values(ContentType).forEach(type => {
        if (stryMutAct_9fa48("1065")) {
          {}
        } else {
          stryCov_9fa48("1065");
          contentTypeStats[type] = 0;
        }
      });
      for (const filePath of filePaths) {
        if (stryMutAct_9fa48("1066")) {
          {}
        } else {
          stryCov_9fa48("1066");
          try {
            if (stryMutAct_9fa48("1067")) {
              {}
            } else {
              stryCov_9fa48("1067");
              console.log(stryMutAct_9fa48("1068") ? `` : (stryCov_9fa48("1068"), `📖 Processing: ${path.basename(filePath)}`));

              // Check file size
              const stats = fs.statSync(filePath);
              if (stryMutAct_9fa48("1072") ? stats.size <= (config.maxFileSize || 50 * 1024 * 1024) : stryMutAct_9fa48("1071") ? stats.size >= (config.maxFileSize || 50 * 1024 * 1024) : stryMutAct_9fa48("1070") ? false : stryMutAct_9fa48("1069") ? true : (stryCov_9fa48("1069", "1070", "1071", "1072"), stats.size > (stryMutAct_9fa48("1075") ? config.maxFileSize && 50 * 1024 * 1024 : stryMutAct_9fa48("1074") ? false : stryMutAct_9fa48("1073") ? true : (stryCov_9fa48("1073", "1074", "1075"), config.maxFileSize || (stryMutAct_9fa48("1076") ? 50 * 1024 / 1024 : (stryCov_9fa48("1076"), (stryMutAct_9fa48("1077") ? 50 / 1024 : (stryCov_9fa48("1077"), 50 * 1024)) * 1024)))))) {
                if (stryMutAct_9fa48("1078")) {
                  {}
                } else {
                  stryCov_9fa48("1078");
                  console.log(stryMutAct_9fa48("1079") ? `` : (stryCov_9fa48("1079"), `⏭️  Skipping large file: ${path.basename(filePath)} (${stats.size} bytes)`));
                  stryMutAct_9fa48("1080") ? skippedFiles-- : (stryCov_9fa48("1080"), skippedFiles++);
                  continue;
                }
              }

              // Extract universal metadata
              const metadata = await this.metadataExtractor.extractMetadata(filePath);

              // Update content type stats
              stryMutAct_9fa48("1081") ? contentTypeStats[metadata.content.type]-- : (stryCov_9fa48("1081"), contentTypeStats[metadata.content.type]++);

              // Skip if processing failed
              if (stryMutAct_9fa48("1084") ? false : stryMutAct_9fa48("1083") ? true : stryMutAct_9fa48("1082") ? metadata.processing.success : (stryCov_9fa48("1082", "1083", "1084"), !metadata.processing.success)) {
                if (stryMutAct_9fa48("1085")) {
                  {}
                } else {
                  stryCov_9fa48("1085");
                  console.log(stryMutAct_9fa48("1086") ? `` : (stryCov_9fa48("1086"), `⏭️  Skipping failed processing: ${path.basename(filePath)}`));
                  stryMutAct_9fa48("1087") ? failedFiles-- : (stryCov_9fa48("1087"), failedFiles++);
                  continue;
                }
              }

              // Generate chunks from the file
              const chunks = await this.chunkMultiModalFile(metadata);
              stryMutAct_9fa48("1088") ? totalChunks -= chunks.length : (stryCov_9fa48("1088"), totalChunks += chunks.length);

              // Process each chunk
              for (const chunk of chunks) {
                if (stryMutAct_9fa48("1089")) {
                  {}
                } else {
                  stryCov_9fa48("1089");
                  try {
                    if (stryMutAct_9fa48("1090")) {
                      {}
                    } else {
                      stryCov_9fa48("1090");
                      // Check if chunk already exists
                      if (stryMutAct_9fa48("1092") ? false : stryMutAct_9fa48("1091") ? true : (stryCov_9fa48("1091", "1092"), config.skipExisting)) {
                        if (stryMutAct_9fa48("1093")) {
                          {}
                        } else {
                          stryCov_9fa48("1093");
                          const existing = await this.db.getChunkById(chunk.id);
                          if (stryMutAct_9fa48("1095") ? false : stryMutAct_9fa48("1094") ? true : (stryCov_9fa48("1094", "1095"), existing)) {
                            if (stryMutAct_9fa48("1096")) {
                              {}
                            } else {
                              stryCov_9fa48("1096");
                              console.log(stryMutAct_9fa48("1097") ? `` : (stryCov_9fa48("1097"), `⏭️  Skipping existing chunk: ${stryMutAct_9fa48("1098") ? chunk.id : (stryCov_9fa48("1098"), chunk.id.slice(0, 8))}...`));
                              continue;
                            }
                          }
                        }
                      }
                      console.log(stryMutAct_9fa48("1099") ? `` : (stryCov_9fa48("1099"), `🔮 Embedding chunk: ${stryMutAct_9fa48("1100") ? chunk.id : (stryCov_9fa48("1100"), chunk.id.slice(0, 8))}... (${chunk.text.length} chars)`));

                      // Generate embedding
                      const embeddingResult = await this.embeddings.embedWithStrategy(chunk.text, this.mapContentTypeToStrategy(metadata.content.type), stryMutAct_9fa48("1101") ? "" : (stryCov_9fa48("1101"), "knowledge-base"));

                      // Store in database
                      await this.db.upsertChunk(stryMutAct_9fa48("1102") ? {} : (stryCov_9fa48("1102"), {
                        ...chunk,
                        embedding: embeddingResult.embedding
                      }));
                      stryMutAct_9fa48("1103") ? processedChunks-- : (stryCov_9fa48("1103"), processedChunks++);
                    }
                  } catch (error) {
                    if (stryMutAct_9fa48("1104")) {
                      {}
                    } else {
                      stryCov_9fa48("1104");
                      console.error(stryMutAct_9fa48("1105") ? `` : (stryCov_9fa48("1105"), `❌ Failed to process chunk ${chunk.id}: ${error}`));
                      errors.push(stryMutAct_9fa48("1106") ? `` : (stryCov_9fa48("1106"), `Chunk ${chunk.id}: ${error}`));
                    }
                  }
                }
              }
              stryMutAct_9fa48("1107") ? processedFiles-- : (stryCov_9fa48("1107"), processedFiles++);
            }
          } catch (error) {
            if (stryMutAct_9fa48("1108")) {
              {}
            } else {
              stryCov_9fa48("1108");
              console.error(stryMutAct_9fa48("1109") ? `` : (stryCov_9fa48("1109"), `❌ Failed to process file ${filePath}: ${error}`));
              errors.push(stryMutAct_9fa48("1110") ? `` : (stryCov_9fa48("1110"), `File ${filePath}: ${error}`));
              stryMutAct_9fa48("1111") ? failedFiles-- : (stryCov_9fa48("1111"), failedFiles++);
            }
          }
        }
      }
      return stryMutAct_9fa48("1112") ? {} : (stryCov_9fa48("1112"), {
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
    if (stryMutAct_9fa48("1113")) {
      {}
    } else {
      stryCov_9fa48("1113");
      const filePath = metadata.file.path;
      const buffer = fs.readFileSync(filePath);

      // Base metadata for chunks
      const baseMetadata: DocumentMetadata = stryMutAct_9fa48("1114") ? {} : (stryCov_9fa48("1114"), {
        uri: stryMutAct_9fa48("1115") ? `` : (stryCov_9fa48("1115"), `file://${filePath}`),
        section: metadata.file.name,
        breadcrumbs: this.generateBreadcrumbs(filePath),
        contentType: this.mapContentType(metadata.content.type),
        sourceType: stryMutAct_9fa48("1116") ? "" : (stryCov_9fa48("1116"), "multi-modal"),
        sourceDocumentId: metadata.file.name,
        lang: stryMutAct_9fa48("1119") ? metadata.content.language && "en" : stryMutAct_9fa48("1118") ? false : stryMutAct_9fa48("1117") ? true : (stryCov_9fa48("1117", "1118", "1119"), metadata.content.language || (stryMutAct_9fa48("1120") ? "" : (stryCov_9fa48("1120"), "en"))),
        acl: stryMutAct_9fa48("1121") ? "" : (stryCov_9fa48("1121"), "public"),
        updatedAt: metadata.file.modifiedAt,
        createdAt: metadata.file.createdAt,
        chunkIndex: 0,
        chunkCount: 1,
        // Enhanced multi-modal metadata
        multiModalFile: stryMutAct_9fa48("1122") ? {} : (stryCov_9fa48("1122"), {
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
          if (stryMutAct_9fa48("1123")) {} else {
            stryCov_9fa48("1123");
            return await this.chunkTextFile(buffer, baseMetadata, metadata);
          }
        case ContentType.PDF:
          if (stryMutAct_9fa48("1124")) {} else {
            stryCov_9fa48("1124");
            return await this.chunkPDFFile(buffer, baseMetadata, metadata);
          }
        case ContentType.OFFICE_DOC:
        case ContentType.OFFICE_SHEET:
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("1125")) {} else {
            stryCov_9fa48("1125");
            return await this.chunkOfficeFile(buffer, baseMetadata, metadata);
          }
        case ContentType.RASTER_IMAGE:
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("1126")) {} else {
            stryCov_9fa48("1126");
            return await this.chunkImageFile(buffer, baseMetadata, metadata);
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("1127")) {} else {
            stryCov_9fa48("1127");
            return await this.chunkAudioFile(buffer, baseMetadata, metadata);
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("1128")) {} else {
            stryCov_9fa48("1128");
            return await this.chunkVideoFile(buffer, baseMetadata, metadata);
          }
        case ContentType.JSON:
        case ContentType.XML:
        case ContentType.CSV:
          if (stryMutAct_9fa48("1129")) {} else {
            stryCov_9fa48("1129");
            return await this.chunkStructuredFile(buffer, baseMetadata, metadata);
          }
        default:
          if (stryMutAct_9fa48("1130")) {} else {
            stryCov_9fa48("1130");
            // For unsupported types, create a single chunk with metadata
            return stryMutAct_9fa48("1131") ? [] : (stryCov_9fa48("1131"), [this.createMetadataOnlyChunk(baseMetadata, metadata)]);
          }
      }
    }
  }
  private async chunkTextFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata, preExtractedText?: string): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1132")) {
      {}
    } else {
      stryCov_9fa48("1132");
      const text = stryMutAct_9fa48("1135") ? preExtractedText && buffer.toString("utf8") : stryMutAct_9fa48("1134") ? false : stryMutAct_9fa48("1133") ? true : (stryCov_9fa48("1133", "1134", "1135"), preExtractedText || buffer.toString(stryMutAct_9fa48("1136") ? "" : (stryCov_9fa48("1136"), "utf8")));
      const cleanedText = cleanMarkdown(text);

      // Simple chunking by paragraphs or size
      const chunks: DocumentChunk[] = stryMutAct_9fa48("1137") ? ["Stryker was here"] : (stryCov_9fa48("1137"), []);
      const paragraphs = stryMutAct_9fa48("1138") ? cleanedText.split("\n\n") : (stryCov_9fa48("1138"), cleanedText.split(stryMutAct_9fa48("1139") ? "" : (stryCov_9fa48("1139"), "\n\n")).filter(stryMutAct_9fa48("1140") ? () => undefined : (stryCov_9fa48("1140"), p => stryMutAct_9fa48("1144") ? p.trim().length <= 0 : stryMutAct_9fa48("1143") ? p.trim().length >= 0 : stryMutAct_9fa48("1142") ? false : stryMutAct_9fa48("1141") ? true : (stryCov_9fa48("1141", "1142", "1143", "1144"), (stryMutAct_9fa48("1145") ? p.length : (stryCov_9fa48("1145"), p.trim().length)) > 0))));
      const maxChunkSize = 800;
      let currentChunk = stryMutAct_9fa48("1146") ? "Stryker was here!" : (stryCov_9fa48("1146"), "");
      let chunkIndex = 0;
      for (const paragraph of paragraphs) {
        if (stryMutAct_9fa48("1147")) {
          {}
        } else {
          stryCov_9fa48("1147");
          if (stryMutAct_9fa48("1150") ? (currentChunk + paragraph).length > maxChunkSize || currentChunk.length > 0 : stryMutAct_9fa48("1149") ? false : stryMutAct_9fa48("1148") ? true : (stryCov_9fa48("1148", "1149", "1150"), (stryMutAct_9fa48("1153") ? (currentChunk + paragraph).length <= maxChunkSize : stryMutAct_9fa48("1152") ? (currentChunk + paragraph).length >= maxChunkSize : stryMutAct_9fa48("1151") ? true : (stryCov_9fa48("1151", "1152", "1153"), (stryMutAct_9fa48("1154") ? currentChunk - paragraph : (stryCov_9fa48("1154"), currentChunk + paragraph)).length > maxChunkSize)) && (stryMutAct_9fa48("1157") ? currentChunk.length <= 0 : stryMutAct_9fa48("1156") ? currentChunk.length >= 0 : stryMutAct_9fa48("1155") ? true : (stryCov_9fa48("1155", "1156", "1157"), currentChunk.length > 0)))) {
            if (stryMutAct_9fa48("1158")) {
              {}
            } else {
              stryCov_9fa48("1158");
              // Create chunk
              chunks.push(stryMutAct_9fa48("1159") ? {} : (stryCov_9fa48("1159"), {
                id: this.generateChunkId(metadata.file.id, chunkIndex),
                text: stryMutAct_9fa48("1160") ? currentChunk : (stryCov_9fa48("1160"), currentChunk.trim()),
                meta: stryMutAct_9fa48("1161") ? {} : (stryCov_9fa48("1161"), {
                  ...baseMetadata,
                  section: stryMutAct_9fa48("1162") ? `` : (stryCov_9fa48("1162"), `${baseMetadata.section} (Part ${stryMutAct_9fa48("1163") ? chunkIndex - 1 : (stryCov_9fa48("1163"), chunkIndex + 1)})`),
                  chunkIndex,
                  chunkCount: Math.ceil(stryMutAct_9fa48("1164") ? cleanedText.length * maxChunkSize : (stryCov_9fa48("1164"), cleanedText.length / maxChunkSize))
                })
              }));
              currentChunk = paragraph;
              stryMutAct_9fa48("1165") ? chunkIndex-- : (stryCov_9fa48("1165"), chunkIndex++);
            }
          } else {
            if (stryMutAct_9fa48("1166")) {
              {}
            } else {
              stryCov_9fa48("1166");
              stryMutAct_9fa48("1167") ? currentChunk -= (currentChunk ? "\n\n" : "") + paragraph : (stryCov_9fa48("1167"), currentChunk += stryMutAct_9fa48("1168") ? (currentChunk ? "\n\n" : "") - paragraph : (stryCov_9fa48("1168"), (currentChunk ? stryMutAct_9fa48("1169") ? "" : (stryCov_9fa48("1169"), "\n\n") : stryMutAct_9fa48("1170") ? "Stryker was here!" : (stryCov_9fa48("1170"), "")) + paragraph));
            }
          }
        }
      }

      // Add final chunk
      if (stryMutAct_9fa48("1173") ? currentChunk : stryMutAct_9fa48("1172") ? false : stryMutAct_9fa48("1171") ? true : (stryCov_9fa48("1171", "1172", "1173"), currentChunk.trim())) {
        if (stryMutAct_9fa48("1174")) {
          {}
        } else {
          stryCov_9fa48("1174");
          chunks.push(stryMutAct_9fa48("1175") ? {} : (stryCov_9fa48("1175"), {
            id: this.generateChunkId(metadata.file.id, chunkIndex),
            text: stryMutAct_9fa48("1176") ? currentChunk : (stryCov_9fa48("1176"), currentChunk.trim()),
            meta: stryMutAct_9fa48("1177") ? {} : (stryCov_9fa48("1177"), {
              ...baseMetadata,
              section: stryMutAct_9fa48("1178") ? `` : (stryCov_9fa48("1178"), `${baseMetadata.section} (Part ${stryMutAct_9fa48("1179") ? chunkIndex - 1 : (stryCov_9fa48("1179"), chunkIndex + 1)})`),
              chunkIndex,
              chunkCount: stryMutAct_9fa48("1180") ? chunkIndex - 1 : (stryCov_9fa48("1180"), chunkIndex + 1)
            })
          }));
        }
      }
      return chunks;
    }
  }
  private async chunkPDFFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1181")) {
      {}
    } else {
      stryCov_9fa48("1181");
      try {
        if (stryMutAct_9fa48("1182")) {
          {}
        } else {
          stryCov_9fa48("1182");
          // Extract text content from PDF using the PDF processor
          const pdfResult = await this.pdfProcessor.extractTextFromBuffer(buffer);

          // If PDF has extractable text, chunk it like regular text
          if (stryMutAct_9fa48("1185") ? pdfResult.metadata.hasText || pdfResult.text.length > 0 : stryMutAct_9fa48("1184") ? false : stryMutAct_9fa48("1183") ? true : (stryCov_9fa48("1183", "1184", "1185"), pdfResult.metadata.hasText && (stryMutAct_9fa48("1188") ? pdfResult.text.length <= 0 : stryMutAct_9fa48("1187") ? pdfResult.text.length >= 0 : stryMutAct_9fa48("1186") ? true : (stryCov_9fa48("1186", "1187", "1188"), pdfResult.text.length > 0)))) {
            if (stryMutAct_9fa48("1189")) {
              {}
            } else {
              stryCov_9fa48("1189");
              return await this.chunkTextFile(buffer, baseMetadata, metadata, pdfResult.text);
            }
          }

          // If no extractable text, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("1190") ? {} : (stryCov_9fa48("1190"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("1191") ? `` : (stryCov_9fa48("1191"), `PDF Document: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1192") ? `` : (stryCov_9fa48("1192"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("1193") ? `` : (stryCov_9fa48("1193"), `Pages: ${stryMutAct_9fa48("1196") ? pdfResult.metadata.pageCount && "Unknown" : stryMutAct_9fa48("1195") ? false : stryMutAct_9fa48("1194") ? true : (stryCov_9fa48("1194", "1195", "1196"), pdfResult.metadata.pageCount || (stryMutAct_9fa48("1197") ? "" : (stryCov_9fa48("1197"), "Unknown")))}\n`)) + (stryMutAct_9fa48("1198") ? `` : (stryCov_9fa48("1198"), `Has Text: ${pdfResult.metadata.hasText ? stryMutAct_9fa48("1199") ? "" : (stryCov_9fa48("1199"), "Yes") : stryMutAct_9fa48("1200") ? "" : (stryCov_9fa48("1200"), "No")}\n`)) + (stryMutAct_9fa48("1201") ? `` : (stryCov_9fa48("1201"), `Word Count: ${stryMutAct_9fa48("1204") ? pdfResult.metadata.wordCount && 0 : stryMutAct_9fa48("1203") ? false : stryMutAct_9fa48("1202") ? true : (stryCov_9fa48("1202", "1203", "1204"), pdfResult.metadata.wordCount || 0)}\n`)) + (stryMutAct_9fa48("1205") ? `` : (stryCov_9fa48("1205"), `Author: ${stryMutAct_9fa48("1208") ? pdfResult.metadata.pdfMetadata?.author && "Unknown" : stryMutAct_9fa48("1207") ? false : stryMutAct_9fa48("1206") ? true : (stryCov_9fa48("1206", "1207", "1208"), (stryMutAct_9fa48("1209") ? pdfResult.metadata.pdfMetadata.author : (stryCov_9fa48("1209"), pdfResult.metadata.pdfMetadata?.author)) || (stryMutAct_9fa48("1210") ? "" : (stryCov_9fa48("1210"), "Unknown")))}\n`)) + (stryMutAct_9fa48("1211") ? `` : (stryCov_9fa48("1211"), `Title: ${stryMutAct_9fa48("1214") ? pdfResult.metadata.pdfMetadata?.title && "Unknown" : stryMutAct_9fa48("1213") ? false : stryMutAct_9fa48("1212") ? true : (stryCov_9fa48("1212", "1213", "1214"), (stryMutAct_9fa48("1215") ? pdfResult.metadata.pdfMetadata.title : (stryCov_9fa48("1215"), pdfResult.metadata.pdfMetadata?.title)) || (stryMutAct_9fa48("1216") ? "" : (stryCov_9fa48("1216"), "Unknown")))}`)),
            meta: stryMutAct_9fa48("1217") ? {} : (stryCov_9fa48("1217"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1218") ? [] : (stryCov_9fa48("1218"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1219")) {
          {}
        } else {
          stryCov_9fa48("1219");
          // Fallback for PDF processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("1220") ? {} : (stryCov_9fa48("1220"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("1221") ? `` : (stryCov_9fa48("1221"), `PDF Document: ${metadata.file.name}\nType: ${metadata.content.type}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("1222") ? {} : (stryCov_9fa48("1222"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1223") ? [] : (stryCov_9fa48("1223"), [chunk]);
        }
      }
    }
  }
  private async chunkOfficeFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1224")) {
      {}
    } else {
      stryCov_9fa48("1224");
      try {
        if (stryMutAct_9fa48("1225")) {
          {}
        } else {
          stryCov_9fa48("1225");
          // Extract text content from Office document using the Office processor
          const officeResult = await this.officeProcessor.extractTextFromBuffer(buffer, metadata.content.type);

          // If Office document has extractable text, chunk it like regular text
          if (stryMutAct_9fa48("1228") ? officeResult.metadata.hasText || officeResult.text.length > 0 : stryMutAct_9fa48("1227") ? false : stryMutAct_9fa48("1226") ? true : (stryCov_9fa48("1226", "1227", "1228"), officeResult.metadata.hasText && (stryMutAct_9fa48("1231") ? officeResult.text.length <= 0 : stryMutAct_9fa48("1230") ? officeResult.text.length >= 0 : stryMutAct_9fa48("1229") ? true : (stryCov_9fa48("1229", "1230", "1231"), officeResult.text.length > 0)))) {
            if (stryMutAct_9fa48("1232")) {
              {}
            } else {
              stryCov_9fa48("1232");
              // For substantial content, use text chunking
              if (stryMutAct_9fa48("1236") ? officeResult.text.length <= 500 : stryMutAct_9fa48("1235") ? officeResult.text.length >= 500 : stryMutAct_9fa48("1234") ? false : stryMutAct_9fa48("1233") ? true : (stryCov_9fa48("1233", "1234", "1235", "1236"), officeResult.text.length > 500)) {
                if (stryMutAct_9fa48("1237")) {
                  {}
                } else {
                  stryCov_9fa48("1237");
                  return await this.chunkTextFile(buffer, baseMetadata, metadata, officeResult.text);
                }
              } else {
                if (stryMutAct_9fa48("1238")) {
                  {}
                } else {
                  stryCov_9fa48("1238");
                  // For shorter content, create a single enriched chunk
                  const chunk: DocumentChunk = stryMutAct_9fa48("1239") ? {} : (stryCov_9fa48("1239"), {
                    id: this.generateChunkId(metadata.file.id, 0),
                    text: (stryMutAct_9fa48("1240") ? `` : (stryCov_9fa48("1240"), `${this.getOfficeTypeLabel(metadata.content.type)}: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1241") ? `` : (stryCov_9fa48("1241"), `Word Count: ${officeResult.metadata.wordCount}\n`)) + (stryMutAct_9fa48("1242") ? `` : (stryCov_9fa48("1242"), `Language: ${officeResult.metadata.language}\n`)) + (stryMutAct_9fa48("1243") ? `` : (stryCov_9fa48("1243"), `${officeResult.text}`)),
                    meta: stryMutAct_9fa48("1244") ? {} : (stryCov_9fa48("1244"), {
                      ...baseMetadata,
                      chunkIndex: 0,
                      chunkCount: 1
                    })
                  });
                  return stryMutAct_9fa48("1245") ? [] : (stryCov_9fa48("1245"), [chunk]);
                }
              }
            }
          }

          // If no extractable text, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("1246") ? {} : (stryCov_9fa48("1246"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("1247") ? `` : (stryCov_9fa48("1247"), `${this.getOfficeTypeLabel(metadata.content.type)}: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1248") ? `` : (stryCov_9fa48("1248"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("1249") ? `` : (stryCov_9fa48("1249"), `Has Text: ${officeResult.metadata.hasText ? stryMutAct_9fa48("1250") ? "" : (stryCov_9fa48("1250"), "Yes") : stryMutAct_9fa48("1251") ? "" : (stryCov_9fa48("1251"), "No")}\n`)) + (stryMutAct_9fa48("1252") ? `` : (stryCov_9fa48("1252"), `Word Count: ${stryMutAct_9fa48("1255") ? officeResult.metadata.wordCount && 0 : stryMutAct_9fa48("1254") ? false : stryMutAct_9fa48("1253") ? true : (stryCov_9fa48("1253", "1254", "1255"), officeResult.metadata.wordCount || 0)}\n`)) + (stryMutAct_9fa48("1256") ? `` : (stryCov_9fa48("1256"), `${officeResult.text}`)),
            meta: stryMutAct_9fa48("1257") ? {} : (stryCov_9fa48("1257"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1258") ? [] : (stryCov_9fa48("1258"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1259")) {
          {}
        } else {
          stryCov_9fa48("1259");
          // Fallback for Office document processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("1260") ? {} : (stryCov_9fa48("1260"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("1261") ? `` : (stryCov_9fa48("1261"), `Office Document Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("1262") ? {} : (stryCov_9fa48("1262"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1263") ? [] : (stryCov_9fa48("1263"), [chunk]);
        }
      }
    }
  }

  /**
   * Get human-readable label for Office document types
   */
  private getOfficeTypeLabel(contentType: ContentType): string {
    if (stryMutAct_9fa48("1264")) {
      {}
    } else {
      stryCov_9fa48("1264");
      switch (contentType) {
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("1265")) {} else {
            stryCov_9fa48("1265");
            return stryMutAct_9fa48("1266") ? "" : (stryCov_9fa48("1266"), "Word Document");
          }
        case ContentType.OFFICE_SHEET:
          if (stryMutAct_9fa48("1267")) {} else {
            stryCov_9fa48("1267");
            return stryMutAct_9fa48("1268") ? "" : (stryCov_9fa48("1268"), "Excel Spreadsheet");
          }
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("1269")) {} else {
            stryCov_9fa48("1269");
            return stryMutAct_9fa48("1270") ? "" : (stryCov_9fa48("1270"), "PowerPoint Presentation");
          }
        default:
          if (stryMutAct_9fa48("1271")) {} else {
            stryCov_9fa48("1271");
            return stryMutAct_9fa48("1272") ? "" : (stryCov_9fa48("1272"), "Office Document");
          }
      }
    }
  }
  private async chunkImageFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1273")) {
      {}
    } else {
      stryCov_9fa48("1273");
      try {
        if (stryMutAct_9fa48("1274")) {
          {}
        } else {
          stryCov_9fa48("1274");
          // For raster images, OCR might have been performed
          if (stryMutAct_9fa48("1277") ? metadata.content.type !== ContentType.RASTER_IMAGE : stryMutAct_9fa48("1276") ? false : stryMutAct_9fa48("1275") ? true : (stryCov_9fa48("1275", "1276", "1277"), metadata.content.type === ContentType.RASTER_IMAGE)) {
            if (stryMutAct_9fa48("1278")) {
              {}
            } else {
              stryCov_9fa48("1278");
              // Check if OCR extracted text (content has hasText and wordCount > 0)
              if (stryMutAct_9fa48("1281") ? (metadata.content as any).hasText || (metadata.content as any).wordCount > 0 : stryMutAct_9fa48("1280") ? false : stryMutAct_9fa48("1279") ? true : (stryCov_9fa48("1279", "1280", "1281"), (metadata.content as any).hasText && (stryMutAct_9fa48("1284") ? (metadata.content as any).wordCount <= 0 : stryMutAct_9fa48("1283") ? (metadata.content as any).wordCount >= 0 : stryMutAct_9fa48("1282") ? true : (stryCov_9fa48("1282", "1283", "1284"), (metadata.content as any).wordCount > 0)))) {
                if (stryMutAct_9fa48("1285")) {
                  {}
                } else {
                  stryCov_9fa48("1285");
                  // Perform OCR to get the actual text
                  const ocrResult = await this.ocrProcessor.extractTextFromBuffer(buffer);

                  // If OCR was successful, chunk the text
                  if (stryMutAct_9fa48("1288") ? ocrResult.metadata.hasText || ocrResult.text.length > 100 : stryMutAct_9fa48("1287") ? false : stryMutAct_9fa48("1286") ? true : (stryCov_9fa48("1286", "1287", "1288"), ocrResult.metadata.hasText && (stryMutAct_9fa48("1291") ? ocrResult.text.length <= 100 : stryMutAct_9fa48("1290") ? ocrResult.text.length >= 100 : stryMutAct_9fa48("1289") ? true : (stryCov_9fa48("1289", "1290", "1291"), ocrResult.text.length > 100)))) {
                    if (stryMutAct_9fa48("1292")) {
                      {}
                    } else {
                      stryCov_9fa48("1292");
                      // Use text chunking for substantial OCR content
                      return await this.chunkTextFile(buffer, baseMetadata, metadata, ocrResult.text);
                    }
                  } else {
                    if (stryMutAct_9fa48("1293")) {
                      {}
                    } else {
                      stryCov_9fa48("1293");
                      // Create a chunk with OCR results and metadata
                      const chunk: DocumentChunk = stryMutAct_9fa48("1294") ? {} : (stryCov_9fa48("1294"), {
                        id: this.generateChunkId(metadata.file.id, 0),
                        text: (stryMutAct_9fa48("1295") ? `` : (stryCov_9fa48("1295"), `Image OCR: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1296") ? `` : (stryCov_9fa48("1296"), `OCR Confidence: ${stryMutAct_9fa48("1299") ? (metadata.content as any).confidence?.toFixed(1) && "Unknown" : stryMutAct_9fa48("1298") ? false : stryMutAct_9fa48("1297") ? true : (stryCov_9fa48("1297", "1298", "1299"), (stryMutAct_9fa48("1300") ? (metadata.content as any).confidence.toFixed(1) : (stryCov_9fa48("1300"), (metadata.content as any).confidence?.toFixed(1))) || (stryMutAct_9fa48("1301") ? "" : (stryCov_9fa48("1301"), "Unknown")))}%\n`)) + (stryMutAct_9fa48("1302") ? `` : (stryCov_9fa48("1302"), `Has Text: ${(metadata.content as any).hasText ? stryMutAct_9fa48("1303") ? "" : (stryCov_9fa48("1303"), "Yes") : stryMutAct_9fa48("1304") ? "" : (stryCov_9fa48("1304"), "No")}\n`)) + (stryMutAct_9fa48("1305") ? `` : (stryCov_9fa48("1305"), `Word Count: ${stryMutAct_9fa48("1308") ? (metadata.content as any).wordCount && 0 : stryMutAct_9fa48("1307") ? false : stryMutAct_9fa48("1306") ? true : (stryCov_9fa48("1306", "1307", "1308"), (metadata.content as any).wordCount || 0)}\n`)) + (stryMutAct_9fa48("1309") ? `` : (stryCov_9fa48("1309"), `${ocrResult.text}`)),
                        meta: stryMutAct_9fa48("1310") ? {} : (stryCov_9fa48("1310"), {
                          ...baseMetadata,
                          chunkIndex: 0,
                          chunkCount: 1
                        })
                      });
                      return stryMutAct_9fa48("1311") ? [] : (stryCov_9fa48("1311"), [chunk]);
                    }
                  }
                }
              }
            }
          }

          // Fallback for images without OCR or unsupported image types
          const chunk: DocumentChunk = stryMutAct_9fa48("1312") ? {} : (stryCov_9fa48("1312"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("1313") ? `` : (stryCov_9fa48("1313"), `Image: ${metadata.file.name}\nType: ${metadata.content.type}\nFormat: ${metadata.file.extension}`),
            meta: stryMutAct_9fa48("1314") ? {} : (stryCov_9fa48("1314"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1315") ? [] : (stryCov_9fa48("1315"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1316")) {
          {}
        } else {
          stryCov_9fa48("1316");
          // Fallback for image processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("1317") ? {} : (stryCov_9fa48("1317"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("1318") ? `` : (stryCov_9fa48("1318"), `Image Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("1319") ? {} : (stryCov_9fa48("1319"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1320") ? [] : (stryCov_9fa48("1320"), [chunk]);
        }
      }
    }
  }
  private async chunkAudioFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1321")) {
      {}
    } else {
      stryCov_9fa48("1321");
      try {
        if (stryMutAct_9fa48("1322")) {
          {}
        } else {
          stryCov_9fa48("1322");
          // Attempt speech-to-text transcription
          const speechResult = await this.speechProcessor.transcribeFromBuffer(buffer, stryMutAct_9fa48("1323") ? {} : (stryCov_9fa48("1323"), {
            language: stryMutAct_9fa48("1324") ? "" : (stryCov_9fa48("1324"), "en"),
            sampleRate: 16000
          }));

          // If transcription was successful, chunk the text
          if (stryMutAct_9fa48("1327") ? speechResult.metadata.hasText || speechResult.text.length > 0 : stryMutAct_9fa48("1326") ? false : stryMutAct_9fa48("1325") ? true : (stryCov_9fa48("1325", "1326", "1327"), speechResult.metadata.hasText && (stryMutAct_9fa48("1330") ? speechResult.text.length <= 0 : stryMutAct_9fa48("1329") ? speechResult.text.length >= 0 : stryMutAct_9fa48("1328") ? true : (stryCov_9fa48("1328", "1329", "1330"), speechResult.text.length > 0)))) {
            if (stryMutAct_9fa48("1331")) {
              {}
            } else {
              stryCov_9fa48("1331");
              // For substantial transcriptions, use text chunking
              if (stryMutAct_9fa48("1335") ? speechResult.text.length <= 300 : stryMutAct_9fa48("1334") ? speechResult.text.length >= 300 : stryMutAct_9fa48("1333") ? false : stryMutAct_9fa48("1332") ? true : (stryCov_9fa48("1332", "1333", "1334", "1335"), speechResult.text.length > 300)) {
                if (stryMutAct_9fa48("1336")) {
                  {}
                } else {
                  stryCov_9fa48("1336");
                  return await this.chunkTextFile(buffer, baseMetadata, metadata, speechResult.text);
                }
              } else {
                if (stryMutAct_9fa48("1337")) {
                  {}
                } else {
                  stryCov_9fa48("1337");
                  // For shorter transcriptions, create a single enriched chunk
                  const chunk: DocumentChunk = stryMutAct_9fa48("1338") ? {} : (stryCov_9fa48("1338"), {
                    id: this.generateChunkId(metadata.file.id, 0),
                    text: (stryMutAct_9fa48("1339") ? `` : (stryCov_9fa48("1339"), `Audio Transcript: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1340") ? `` : (stryCov_9fa48("1340"), `Duration: ${stryMutAct_9fa48("1343") ? speechResult.metadata.speechMetadata?.duration?.toFixed(1) && "Unknown" : stryMutAct_9fa48("1342") ? false : stryMutAct_9fa48("1341") ? true : (stryCov_9fa48("1341", "1342", "1343"), (stryMutAct_9fa48("1345") ? speechResult.metadata.speechMetadata.duration?.toFixed(1) : stryMutAct_9fa48("1344") ? speechResult.metadata.speechMetadata?.duration.toFixed(1) : (stryCov_9fa48("1344", "1345"), speechResult.metadata.speechMetadata?.duration?.toFixed(1))) || (stryMutAct_9fa48("1346") ? "" : (stryCov_9fa48("1346"), "Unknown")))}s\n`)) + (stryMutAct_9fa48("1347") ? `` : (stryCov_9fa48("1347"), `Language: ${speechResult.metadata.language}\n`)) + (stryMutAct_9fa48("1348") ? `` : (stryCov_9fa48("1348"), `Confidence: ${stryMutAct_9fa48("1351") ? speechResult.metadata.speechMetadata?.confidence?.toFixed(1) && "Unknown" : stryMutAct_9fa48("1350") ? false : stryMutAct_9fa48("1349") ? true : (stryCov_9fa48("1349", "1350", "1351"), (stryMutAct_9fa48("1353") ? speechResult.metadata.speechMetadata.confidence?.toFixed(1) : stryMutAct_9fa48("1352") ? speechResult.metadata.speechMetadata?.confidence.toFixed(1) : (stryCov_9fa48("1352", "1353"), speechResult.metadata.speechMetadata?.confidence?.toFixed(1))) || (stryMutAct_9fa48("1354") ? "" : (stryCov_9fa48("1354"), "Unknown")))}\n`)) + (stryMutAct_9fa48("1355") ? `` : (stryCov_9fa48("1355"), `${speechResult.text}`)),
                    meta: stryMutAct_9fa48("1356") ? {} : (stryCov_9fa48("1356"), {
                      ...baseMetadata,
                      chunkIndex: 0,
                      chunkCount: 1
                    })
                  });
                  return stryMutAct_9fa48("1357") ? [] : (stryCov_9fa48("1357"), [chunk]);
                }
              }
            }
          }

          // If no transcription, create a metadata-only chunk
          const chunk: DocumentChunk = stryMutAct_9fa48("1358") ? {} : (stryCov_9fa48("1358"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: (stryMutAct_9fa48("1359") ? `` : (stryCov_9fa48("1359"), `Audio: ${metadata.file.name}\n`)) + (stryMutAct_9fa48("1360") ? `` : (stryCov_9fa48("1360"), `Type: ${metadata.content.type}\n`)) + (stryMutAct_9fa48("1361") ? `` : (stryCov_9fa48("1361"), `Duration: ${stryMutAct_9fa48("1364") ? speechResult.metadata.speechMetadata?.duration?.toFixed(1) && "Unknown" : stryMutAct_9fa48("1363") ? false : stryMutAct_9fa48("1362") ? true : (stryCov_9fa48("1362", "1363", "1364"), (stryMutAct_9fa48("1366") ? speechResult.metadata.speechMetadata.duration?.toFixed(1) : stryMutAct_9fa48("1365") ? speechResult.metadata.speechMetadata?.duration.toFixed(1) : (stryCov_9fa48("1365", "1366"), speechResult.metadata.speechMetadata?.duration?.toFixed(1))) || (stryMutAct_9fa48("1367") ? "" : (stryCov_9fa48("1367"), "Unknown")))}s\n`)) + (stryMutAct_9fa48("1368") ? `` : (stryCov_9fa48("1368"), `Processing Time: ${stryMutAct_9fa48("1371") ? speechResult.metadata.speechMetadata?.processingTime && 0 : stryMutAct_9fa48("1370") ? false : stryMutAct_9fa48("1369") ? true : (stryCov_9fa48("1369", "1370", "1371"), (stryMutAct_9fa48("1372") ? speechResult.metadata.speechMetadata.processingTime : (stryCov_9fa48("1372"), speechResult.metadata.speechMetadata?.processingTime)) || 0)}ms\n`)) + (stryMutAct_9fa48("1373") ? `` : (stryCov_9fa48("1373"), `${speechResult.text}`)),
            meta: stryMutAct_9fa48("1374") ? {} : (stryCov_9fa48("1374"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1375") ? [] : (stryCov_9fa48("1375"), [chunk]);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1376")) {
          {}
        } else {
          stryCov_9fa48("1376");
          // Fallback for audio processing errors
          const errorMessage = error instanceof Error ? error.message : String(error);
          const chunk: DocumentChunk = stryMutAct_9fa48("1377") ? {} : (stryCov_9fa48("1377"), {
            id: this.generateChunkId(metadata.file.id, 0),
            text: stryMutAct_9fa48("1378") ? `` : (stryCov_9fa48("1378"), `Audio Processing Error: ${metadata.file.name}\nError: ${errorMessage}`),
            meta: stryMutAct_9fa48("1379") ? {} : (stryCov_9fa48("1379"), {
              ...baseMetadata,
              chunkIndex: 0,
              chunkCount: 1
            })
          });
          return stryMutAct_9fa48("1380") ? [] : (stryCov_9fa48("1380"), [chunk]);
        }
      }
    }
  }
  private async chunkVideoFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1381")) {
      {}
    } else {
      stryCov_9fa48("1381");
      // Placeholder for video processing
      // In production, would extract audio and attempt speech-to-text

      const chunk: DocumentChunk = stryMutAct_9fa48("1382") ? {} : (stryCov_9fa48("1382"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("1383") ? `` : (stryCov_9fa48("1383"), `Video: ${metadata.file.name}\nType: ${metadata.content.type}\nDuration: ${stryMutAct_9fa48("1386") ? metadata.content.duration && "Unknown" : stryMutAct_9fa48("1385") ? false : stryMutAct_9fa48("1384") ? true : (stryCov_9fa48("1384", "1385", "1386"), metadata.content.duration || (stryMutAct_9fa48("1387") ? "" : (stryCov_9fa48("1387"), "Unknown")))} seconds\nDimensions: ${stryMutAct_9fa48("1390") ? metadata.content.dimensions?.width && "Unknown" : stryMutAct_9fa48("1389") ? false : stryMutAct_9fa48("1388") ? true : (stryCov_9fa48("1388", "1389", "1390"), (stryMutAct_9fa48("1391") ? metadata.content.dimensions.width : (stryCov_9fa48("1391"), metadata.content.dimensions?.width)) || (stryMutAct_9fa48("1392") ? "" : (stryCov_9fa48("1392"), "Unknown")))}x${stryMutAct_9fa48("1395") ? metadata.content.dimensions?.height && "Unknown" : stryMutAct_9fa48("1394") ? false : stryMutAct_9fa48("1393") ? true : (stryCov_9fa48("1393", "1394", "1395"), (stryMutAct_9fa48("1396") ? metadata.content.dimensions.height : (stryCov_9fa48("1396"), metadata.content.dimensions?.height)) || (stryMutAct_9fa48("1397") ? "" : (stryCov_9fa48("1397"), "Unknown")))}`),
        meta: stryMutAct_9fa48("1398") ? {} : (stryCov_9fa48("1398"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return stryMutAct_9fa48("1399") ? [] : (stryCov_9fa48("1399"), [chunk]);
    }
  }
  private async chunkStructuredFile(buffer: Buffer, baseMetadata: DocumentMetadata, metadata: UniversalMetadata): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("1400")) {
      {}
    } else {
      stryCov_9fa48("1400");
      const text = buffer.toString(stryMutAct_9fa48("1401") ? "" : (stryCov_9fa48("1401"), "utf8"));

      // For structured data, create a single chunk with the content
      const chunk: DocumentChunk = stryMutAct_9fa48("1402") ? {} : (stryCov_9fa48("1402"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("1403") ? `` : (stryCov_9fa48("1403"), `Structured Data: ${metadata.file.name}\nType: ${metadata.content.type}\nContent:\n${stryMutAct_9fa48("1404") ? text : (stryCov_9fa48("1404"), text.slice(0, 1000))}${(stryMutAct_9fa48("1408") ? text.length <= 1000 : stryMutAct_9fa48("1407") ? text.length >= 1000 : stryMutAct_9fa48("1406") ? false : stryMutAct_9fa48("1405") ? true : (stryCov_9fa48("1405", "1406", "1407", "1408"), text.length > 1000)) ? stryMutAct_9fa48("1409") ? "" : (stryCov_9fa48("1409"), "...") : stryMutAct_9fa48("1410") ? "Stryker was here!" : (stryCov_9fa48("1410"), "")}`),
        meta: stryMutAct_9fa48("1411") ? {} : (stryCov_9fa48("1411"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return stryMutAct_9fa48("1412") ? [] : (stryCov_9fa48("1412"), [chunk]);
    }
  }
  private createMetadataOnlyChunk(baseMetadata: DocumentMetadata, metadata: UniversalMetadata): DocumentChunk {
    if (stryMutAct_9fa48("1413")) {
      {}
    } else {
      stryCov_9fa48("1413");
      const chunk: DocumentChunk = stryMutAct_9fa48("1414") ? {} : (stryCov_9fa48("1414"), {
        id: this.generateChunkId(metadata.file.id, 0),
        text: stryMutAct_9fa48("1415") ? `` : (stryCov_9fa48("1415"), `File: ${metadata.file.name}\nType: ${metadata.content.type}\nMIME Type: ${metadata.file.mimeType}\nSize: ${metadata.file.size} bytes\nQuality Score: ${metadata.quality.overallScore.toFixed(2)}`),
        meta: stryMutAct_9fa48("1416") ? {} : (stryCov_9fa48("1416"), {
          ...baseMetadata,
          chunkIndex: 0,
          chunkCount: 1
        })
      });
      return chunk;
    }
  }
  private mapContentType(contentType: ContentType): string {
    if (stryMutAct_9fa48("1417")) {
      {}
    } else {
      stryCov_9fa48("1417");
      // Map our ContentType enum to the existing content type strings
      switch (contentType) {
        case ContentType.MARKDOWN:
          if (stryMutAct_9fa48("1418")) {} else {
            stryCov_9fa48("1418");
            return stryMutAct_9fa48("1419") ? "" : (stryCov_9fa48("1419"), "markdown");
          }
        case ContentType.PLAIN_TEXT:
          if (stryMutAct_9fa48("1420")) {} else {
            stryCov_9fa48("1420");
            return stryMutAct_9fa48("1421") ? "" : (stryCov_9fa48("1421"), "plain_text");
          }
        case ContentType.PDF:
          if (stryMutAct_9fa48("1422")) {} else {
            stryCov_9fa48("1422");
            return stryMutAct_9fa48("1423") ? "" : (stryCov_9fa48("1423"), "pdf");
          }
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("1424")) {} else {
            stryCov_9fa48("1424");
            return stryMutAct_9fa48("1425") ? "" : (stryCov_9fa48("1425"), "office_document");
          }
        case ContentType.OFFICE_SHEET:
          if (stryMutAct_9fa48("1426")) {} else {
            stryCov_9fa48("1426");
            return stryMutAct_9fa48("1427") ? "" : (stryCov_9fa48("1427"), "office_sheet");
          }
        case ContentType.OFFICE_PRESENTATION:
          if (stryMutAct_9fa48("1428")) {} else {
            stryCov_9fa48("1428");
            return stryMutAct_9fa48("1429") ? "" : (stryCov_9fa48("1429"), "office_presentation");
          }
        case ContentType.RASTER_IMAGE:
          if (stryMutAct_9fa48("1430")) {} else {
            stryCov_9fa48("1430");
            return stryMutAct_9fa48("1431") ? "" : (stryCov_9fa48("1431"), "image");
          }
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("1432")) {} else {
            stryCov_9fa48("1432");
            return stryMutAct_9fa48("1433") ? "" : (stryCov_9fa48("1433"), "vector_image");
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("1434")) {} else {
            stryCov_9fa48("1434");
            return stryMutAct_9fa48("1435") ? "" : (stryCov_9fa48("1435"), "audio");
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("1436")) {} else {
            stryCov_9fa48("1436");
            return stryMutAct_9fa48("1437") ? "" : (stryCov_9fa48("1437"), "video");
          }
        case ContentType.JSON:
          if (stryMutAct_9fa48("1438")) {} else {
            stryCov_9fa48("1438");
            return stryMutAct_9fa48("1439") ? "" : (stryCov_9fa48("1439"), "json");
          }
        case ContentType.XML:
          if (stryMutAct_9fa48("1440")) {} else {
            stryCov_9fa48("1440");
            return stryMutAct_9fa48("1441") ? "" : (stryCov_9fa48("1441"), "xml");
          }
        case ContentType.CSV:
          if (stryMutAct_9fa48("1442")) {} else {
            stryCov_9fa48("1442");
            return stryMutAct_9fa48("1443") ? "" : (stryCov_9fa48("1443"), "csv");
          }
        default:
          if (stryMutAct_9fa48("1444")) {} else {
            stryCov_9fa48("1444");
            return stryMutAct_9fa48("1445") ? "" : (stryCov_9fa48("1445"), "unknown");
          }
      }
    }
  }
  private mapContentTypeToStrategy(contentType: ContentType): string {
    if (stryMutAct_9fa48("1446")) {
      {}
    } else {
      stryCov_9fa48("1446");
      // Map to embedding strategy
      switch (contentType) {
        case ContentType.MARKDOWN:
        case ContentType.PLAIN_TEXT:
        case ContentType.PDF:
        case ContentType.OFFICE_DOC:
          if (stryMutAct_9fa48("1447")) {} else {
            stryCov_9fa48("1447");
            return stryMutAct_9fa48("1448") ? "" : (stryCov_9fa48("1448"), "text");
          }
        case ContentType.RASTER_IMAGE:
        case ContentType.VECTOR_IMAGE:
          if (stryMutAct_9fa48("1449")) {} else {
            stryCov_9fa48("1449");
            return stryMutAct_9fa48("1450") ? "" : (stryCov_9fa48("1450"), "image");
          }
        case ContentType.AUDIO:
          if (stryMutAct_9fa48("1451")) {} else {
            stryCov_9fa48("1451");
            return stryMutAct_9fa48("1452") ? "" : (stryCov_9fa48("1452"), "audio");
          }
        case ContentType.VIDEO:
          if (stryMutAct_9fa48("1453")) {} else {
            stryCov_9fa48("1453");
            return stryMutAct_9fa48("1454") ? "" : (stryCov_9fa48("1454"), "video");
          }
        default:
          if (stryMutAct_9fa48("1455")) {} else {
            stryCov_9fa48("1455");
            return stryMutAct_9fa48("1456") ? "" : (stryCov_9fa48("1456"), "text");
          }
        // fallback
      }
    }
  }
  private generateChunkId(fileId: string, chunkIndex: number): string {
    if (stryMutAct_9fa48("1457")) {
      {}
    } else {
      stryCov_9fa48("1457");
      const hash = stryMutAct_9fa48("1458") ? createHash("md5").update(`${fileId}_${chunkIndex}`).digest("hex") : (stryCov_9fa48("1458"), createHash(stryMutAct_9fa48("1459") ? "" : (stryCov_9fa48("1459"), "md5")).update(stryMutAct_9fa48("1460") ? `` : (stryCov_9fa48("1460"), `${fileId}_${chunkIndex}`)).digest(stryMutAct_9fa48("1461") ? "" : (stryCov_9fa48("1461"), "hex")).slice(0, 8));
      return stryMutAct_9fa48("1462") ? `` : (stryCov_9fa48("1462"), `multi_${fileId}_${chunkIndex}_${hash}`);
    }
  }
  private generateBreadcrumbs(filePath: string): string[] {
    if (stryMutAct_9fa48("1463")) {
      {}
    } else {
      stryCov_9fa48("1463");
      const parts = stryMutAct_9fa48("1464") ? filePath.split(path.sep) : (stryCov_9fa48("1464"), filePath.split(path.sep).filter(stryMutAct_9fa48("1465") ? () => undefined : (stryCov_9fa48("1465"), part => stryMutAct_9fa48("1468") ? part || part !== "." : stryMutAct_9fa48("1467") ? false : stryMutAct_9fa48("1466") ? true : (stryCov_9fa48("1466", "1467", "1468"), part && (stryMutAct_9fa48("1470") ? part === "." : stryMutAct_9fa48("1469") ? true : (stryCov_9fa48("1469", "1470"), part !== (stryMutAct_9fa48("1471") ? "" : (stryCov_9fa48("1471"), "."))))))));
      const breadcrumbs: string[] = stryMutAct_9fa48("1472") ? ["Stryker was here"] : (stryCov_9fa48("1472"), []);
      for (let i = 0; stryMutAct_9fa48("1475") ? i >= parts.length - 1 : stryMutAct_9fa48("1474") ? i <= parts.length - 1 : stryMutAct_9fa48("1473") ? false : (stryCov_9fa48("1473", "1474", "1475"), i < (stryMutAct_9fa48("1476") ? parts.length + 1 : (stryCov_9fa48("1476"), parts.length - 1))); stryMutAct_9fa48("1477") ? i-- : (stryCov_9fa48("1477"), i++)) {
        if (stryMutAct_9fa48("1478")) {
          {}
        } else {
          stryCov_9fa48("1478");
          const segment = stryMutAct_9fa48("1479") ? parts.join("/") : (stryCov_9fa48("1479"), parts.slice(0, stryMutAct_9fa48("1480") ? i - 1 : (stryCov_9fa48("1480"), i + 1)).join(stryMutAct_9fa48("1481") ? "" : (stryCov_9fa48("1481"), "/")));
          breadcrumbs.push(segment);
        }
      }
      return breadcrumbs;
    }
  }
}