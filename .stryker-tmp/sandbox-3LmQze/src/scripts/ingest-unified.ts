#!/usr/bin/env tsx
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
import dotenv from "dotenv";
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { ObsidianIngestionPipeline } from "../lib/obsidian-ingest";
import { MultiModalIngestionPipeline } from "../lib/multi-modal-ingest";
import { ImageLinkExtractor } from "../lib/image-link-extractor";
import { ImagePathResolver } from "../lib/image-path-resolver";
import * as fs from "fs";
import * as path from "path";

// Load environment variables
dotenv.config();
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("4951") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("4950") ? false : stryMutAct_9fa48("4949") ? true : (stryCov_9fa48("4949", "4950", "4951"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("4952") ? "" : (stryCov_9fa48("4952"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("4955") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("4954") ? false : stryMutAct_9fa48("4953") ? true : (stryCov_9fa48("4953", "4954", "4955"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("4956") ? "" : (stryCov_9fa48("4956"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("4959") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4958") ? false : stryMutAct_9fa48("4957") ? true : (stryCov_9fa48("4957", "4958", "4959"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4960") ? "" : (stryCov_9fa48("4960"), "768"))));
interface IngestionOptions {
  batchSize?: number;
  rateLimitMs?: number;
  skipExisting?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  chunkingOptions?: any;
  enableImageProcessing?: boolean;
  maxFileSize?: number;
  maxImagesPerFile?: number;
}
class UnifiedIngestionPipeline {
  private obsidianPipeline: ObsidianIngestionPipeline;
  private multiModalPipeline: MultiModalIngestionPipeline;
  private imageLinkExtractor: ImageLinkExtractor;
  private imagePathResolver: ImagePathResolver;
  private vaultPath: string;
  constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService, vaultPath: string) {
    if (stryMutAct_9fa48("4961")) {
      {}
    } else {
      stryCov_9fa48("4961");
      this.vaultPath = vaultPath;
      this.obsidianPipeline = new ObsidianIngestionPipeline(database, embeddingService, vaultPath);
      this.multiModalPipeline = new MultiModalIngestionPipeline(database, embeddingService);
      this.imageLinkExtractor = new ImageLinkExtractor();
      this.imagePathResolver = new ImagePathResolver(vaultPath);
    }
  }
  async ingestVault(options: IngestionOptions = {}): Promise<{
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
    imageStats: {
      filesWithImages: number;
      totalImages: number;
      processedImages: number;
      failedImages: number;
    };
  }> {
    if (stryMutAct_9fa48("4962")) {
      {}
    } else {
      stryCov_9fa48("4962");
      const {
        batchSize = 5,
        rateLimitMs = 200,
        skipExisting = stryMutAct_9fa48("4963") ? false : (stryCov_9fa48("4963"), true),
        enableImageProcessing = stryMutAct_9fa48("4964") ? false : (stryCov_9fa48("4964"), true),
        maxImagesPerFile = 10,
        ...restOptions
      } = options;
      console.log(stryMutAct_9fa48("4965") ? "" : (stryCov_9fa48("4965"), "🚀 Starting unified multi-modal ingestion..."));
      console.log(stryMutAct_9fa48("4966") ? `` : (stryCov_9fa48("4966"), `📁 Vault path: ${this.vaultPath}`));
      console.log(stryMutAct_9fa48("4967") ? `` : (stryCov_9fa48("4967"), `🔍 Image processing: ${enableImageProcessing ? stryMutAct_9fa48("4968") ? "" : (stryCov_9fa48("4968"), "ENABLED") : stryMutAct_9fa48("4969") ? "" : (stryCov_9fa48("4969"), "DISABLED")}`));
      try {
        if (stryMutAct_9fa48("4970")) {
          {}
        } else {
          stryCov_9fa48("4970");
          // Discover all files to process
          const allFiles = await this.discoverFiles(options);
          if (stryMutAct_9fa48("4973") ? allFiles.length !== 0 : stryMutAct_9fa48("4972") ? false : stryMutAct_9fa48("4971") ? true : (stryCov_9fa48("4971", "4972", "4973"), allFiles.length === 0)) {
            if (stryMutAct_9fa48("4974")) {
              {}
            } else {
              stryCov_9fa48("4974");
              console.log(stryMutAct_9fa48("4975") ? "" : (stryCov_9fa48("4975"), "ℹ️  No files found to process"));
              return stryMutAct_9fa48("4976") ? {} : (stryCov_9fa48("4976"), {
                totalFiles: 0,
                processedFiles: 0,
                totalChunks: 0,
                processedChunks: 0,
                skippedChunks: 0,
                errors: stryMutAct_9fa48("4977") ? ["Stryker was here"] : (stryCov_9fa48("4977"), []),
                imageStats: stryMutAct_9fa48("4978") ? {} : (stryCov_9fa48("4978"), {
                  filesWithImages: 0,
                  totalImages: 0,
                  processedImages: 0,
                  failedImages: 0
                })
              });
            }
          }
          console.log(stryMutAct_9fa48("4979") ? `` : (stryCov_9fa48("4979"), `📄 Found ${allFiles.length} files to process`));

          // Separate markdown and non-markdown files
          const {
            markdownFiles,
            otherFiles
          } = this.categorizeFiles(allFiles);
          console.log(stryMutAct_9fa48("4980") ? `` : (stryCov_9fa48("4980"), `📝 Markdown files: ${markdownFiles.length}`));
          console.log(stryMutAct_9fa48("4981") ? `` : (stryCov_9fa48("4981"), `🖼️  Other files: ${otherFiles.length}`));
          let totalFiles = 0;
          let processedFiles = 0;
          let totalChunks = 0;
          let processedChunks = 0;
          let skippedChunks = 0;
          const errors: string[] = stryMutAct_9fa48("4982") ? ["Stryker was here"] : (stryCov_9fa48("4982"), []);
          let filesWithImages = 0;
          let totalImages = 0;
          let processedImages = 0;
          let failedImages = 0;

          // Process markdown files with image extraction
          if (stryMutAct_9fa48("4986") ? markdownFiles.length <= 0 : stryMutAct_9fa48("4985") ? markdownFiles.length >= 0 : stryMutAct_9fa48("4984") ? false : stryMutAct_9fa48("4983") ? true : (stryCov_9fa48("4983", "4984", "4985", "4986"), markdownFiles.length > 0)) {
            if (stryMutAct_9fa48("4987")) {
              {}
            } else {
              stryCov_9fa48("4987");
              const markdownResult = await this.processMarkdownFiles(markdownFiles, stryMutAct_9fa48("4988") ? {} : (stryCov_9fa48("4988"), {
                ...restOptions,
                batchSize,
                rateLimitMs,
                skipExisting,
                enableImageProcessing,
                maxImagesPerFile
              }));
              stryMutAct_9fa48("4989") ? totalFiles -= markdownResult.totalFiles : (stryCov_9fa48("4989"), totalFiles += markdownResult.totalFiles);
              stryMutAct_9fa48("4990") ? processedFiles -= markdownResult.processedFiles : (stryCov_9fa48("4990"), processedFiles += markdownResult.processedFiles);
              stryMutAct_9fa48("4991") ? totalChunks -= markdownResult.totalChunks : (stryCov_9fa48("4991"), totalChunks += markdownResult.totalChunks);
              stryMutAct_9fa48("4992") ? processedChunks -= markdownResult.processedChunks : (stryCov_9fa48("4992"), processedChunks += markdownResult.processedChunks);
              stryMutAct_9fa48("4993") ? skippedChunks -= markdownResult.skippedChunks : (stryCov_9fa48("4993"), skippedChunks += markdownResult.skippedChunks);
              errors.push(...markdownResult.errors);
              stryMutAct_9fa48("4994") ? filesWithImages -= markdownResult.imageStats.filesWithImages : (stryCov_9fa48("4994"), filesWithImages += markdownResult.imageStats.filesWithImages);
              stryMutAct_9fa48("4995") ? totalImages -= markdownResult.imageStats.totalImages : (stryCov_9fa48("4995"), totalImages += markdownResult.imageStats.totalImages);
              stryMutAct_9fa48("4996") ? processedImages -= markdownResult.imageStats.processedImages : (stryCov_9fa48("4996"), processedImages += markdownResult.imageStats.processedImages);
              stryMutAct_9fa48("4997") ? failedImages -= markdownResult.imageStats.failedImages : (stryCov_9fa48("4997"), failedImages += markdownResult.imageStats.failedImages);
            }
          }

          // Process other files (images, PDFs, etc.)
          if (stryMutAct_9fa48("5001") ? otherFiles.length <= 0 : stryMutAct_9fa48("5000") ? otherFiles.length >= 0 : stryMutAct_9fa48("4999") ? false : stryMutAct_9fa48("4998") ? true : (stryCov_9fa48("4998", "4999", "5000", "5001"), otherFiles.length > 0)) {
            if (stryMutAct_9fa48("5002")) {
              {}
            } else {
              stryCov_9fa48("5002");
              const otherResult = await this.processOtherFiles(otherFiles, stryMutAct_9fa48("5003") ? {} : (stryCov_9fa48("5003"), {
                ...restOptions,
                batchSize,
                rateLimitMs,
                skipExisting
              }));
              stryMutAct_9fa48("5004") ? totalFiles -= otherResult.totalFiles : (stryCov_9fa48("5004"), totalFiles += otherResult.totalFiles);
              stryMutAct_9fa48("5005") ? processedFiles -= otherResult.processedFiles : (stryCov_9fa48("5005"), processedFiles += otherResult.processedFiles);
              stryMutAct_9fa48("5006") ? totalChunks -= otherResult.totalChunks : (stryCov_9fa48("5006"), totalChunks += otherResult.totalChunks);
              stryMutAct_9fa48("5007") ? processedChunks -= otherResult.processedChunks : (stryCov_9fa48("5007"), processedChunks += otherResult.processedChunks);
              stryMutAct_9fa48("5008") ? skippedChunks -= otherResult.skippedChunks : (stryCov_9fa48("5008"), skippedChunks += otherResult.skippedChunks);
              errors.push(...otherResult.errors);
            }
          }
          const result = stryMutAct_9fa48("5009") ? {} : (stryCov_9fa48("5009"), {
            totalFiles,
            processedFiles,
            totalChunks,
            processedChunks,
            skippedChunks,
            errors,
            imageStats: stryMutAct_9fa48("5010") ? {} : (stryCov_9fa48("5010"), {
              filesWithImages,
              totalImages,
              processedImages,
              failedImages
            })
          });
          console.log((stryMutAct_9fa48("5011") ? "" : (stryCov_9fa48("5011"), "\n")) + (stryMutAct_9fa48("5012") ? "" : (stryCov_9fa48("5012"), "=")).repeat(60));
          console.log(stryMutAct_9fa48("5013") ? "" : (stryCov_9fa48("5013"), "📈 UNIFIED INGESTION RESULTS"));
          console.log((stryMutAct_9fa48("5014") ? "" : (stryCov_9fa48("5014"), "=")).repeat(60));
          console.log(stryMutAct_9fa48("5015") ? `` : (stryCov_9fa48("5015"), `⏱️  Total files: ${totalFiles}`));
          console.log(stryMutAct_9fa48("5016") ? `` : (stryCov_9fa48("5016"), `✅ Files processed: ${processedFiles}`));
          console.log(stryMutAct_9fa48("5017") ? `` : (stryCov_9fa48("5017"), `📦 Total chunks: ${totalChunks}`));
          console.log(stryMutAct_9fa48("5018") ? `` : (stryCov_9fa48("5018"), `🔮 Chunks processed: ${processedChunks}`));
          console.log(stryMutAct_9fa48("5019") ? `` : (stryCov_9fa48("5019"), `⏭️  Chunks skipped: ${skippedChunks}`));
          console.log(stryMutAct_9fa48("5020") ? `` : (stryCov_9fa48("5020"), `❌ Errors: ${errors.length}`));
          if (stryMutAct_9fa48("5022") ? false : stryMutAct_9fa48("5021") ? true : (stryCov_9fa48("5021", "5022"), enableImageProcessing)) {
            if (stryMutAct_9fa48("5023")) {
              {}
            } else {
              stryCov_9fa48("5023");
              console.log(stryMutAct_9fa48("5024") ? "" : (stryCov_9fa48("5024"), "\n🖼️  IMAGE PROCESSING RESULTS:"));
              console.log(stryMutAct_9fa48("5025") ? `` : (stryCov_9fa48("5025"), `📄 Files with images: ${filesWithImages}`));
              console.log(stryMutAct_9fa48("5026") ? `` : (stryCov_9fa48("5026"), `🖼️  Total images: ${totalImages}`));
              console.log(stryMutAct_9fa48("5027") ? `` : (stryCov_9fa48("5027"), `✅ Images processed: ${processedImages}`));
              console.log(stryMutAct_9fa48("5028") ? `` : (stryCov_9fa48("5028"), `❌ Images failed: ${failedImages}`));
            }
          }
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("5029")) {
          {}
        } else {
          stryCov_9fa48("5029");
          console.error(stryMutAct_9fa48("5030") ? "" : (stryCov_9fa48("5030"), "❌ Unified ingestion failed:"), error);
          throw new Error(stryMutAct_9fa48("5031") ? `` : (stryCov_9fa48("5031"), `Unified ingestion pipeline failed: ${error}`));
        }
      }
    }
  }
  private async discoverFiles(options: IngestionOptions): Promise<string[]> {
    if (stryMutAct_9fa48("5032")) {
      {}
    } else {
      stryCov_9fa48("5032");
      const files: string[] = stryMutAct_9fa48("5033") ? ["Stryker was here"] : (stryCov_9fa48("5033"), []);
      const walkDir = (dir: string): void => {
        if (stryMutAct_9fa48("5034")) {
          {}
        } else {
          stryCov_9fa48("5034");
          if (stryMutAct_9fa48("5037") ? false : stryMutAct_9fa48("5036") ? true : stryMutAct_9fa48("5035") ? fs.existsSync(dir) : (stryCov_9fa48("5035", "5036", "5037"), !fs.existsSync(dir))) return;
          const entries = fs.readdirSync(dir, stryMutAct_9fa48("5038") ? {} : (stryCov_9fa48("5038"), {
            withFileTypes: stryMutAct_9fa48("5039") ? false : (stryCov_9fa48("5039"), true)
          }));
          for (const entry of entries) {
            if (stryMutAct_9fa48("5040")) {
              {}
            } else {
              stryCov_9fa48("5040");
              const fullPath = path.join(dir, entry.name);
              const relativePath = path.relative(this.vaultPath, fullPath);

              // Check exclude patterns
              if (stryMutAct_9fa48("5044") ? options.excludePatterns.some(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("5043") ? options.excludePatterns?.every(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("5042") ? false : stryMutAct_9fa48("5041") ? true : (stryCov_9fa48("5041", "5042", "5043", "5044"), options.excludePatterns?.some(stryMutAct_9fa48("5045") ? () => undefined : (stryCov_9fa48("5045"), pattern => this.matchesPattern(relativePath, pattern))))) {
                if (stryMutAct_9fa48("5046")) {
                  {}
                } else {
                  stryCov_9fa48("5046");
                  continue;
                }
              }
              if (stryMutAct_9fa48("5048") ? false : stryMutAct_9fa48("5047") ? true : (stryCov_9fa48("5047", "5048"), entry.isDirectory())) {
                if (stryMutAct_9fa48("5049")) {
                  {}
                } else {
                  stryCov_9fa48("5049");
                  walkDir(fullPath);
                }
              } else if (stryMutAct_9fa48("5051") ? false : stryMutAct_9fa48("5050") ? true : (stryCov_9fa48("5050", "5051"), entry.isFile())) {
                if (stryMutAct_9fa48("5052")) {
                  {}
                } else {
                  stryCov_9fa48("5052");
                  // Include all files by default for unified processing
                  if (stryMutAct_9fa48("5055") ? options.includePatterns?.some(pattern => this.matchesPattern(relativePath, pattern)) && true : stryMutAct_9fa48("5054") ? false : stryMutAct_9fa48("5053") ? true : (stryCov_9fa48("5053", "5054", "5055"), (stryMutAct_9fa48("5057") ? options.includePatterns.some(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("5056") ? options.includePatterns?.every(pattern => this.matchesPattern(relativePath, pattern)) : (stryCov_9fa48("5056", "5057"), options.includePatterns?.some(stryMutAct_9fa48("5058") ? () => undefined : (stryCov_9fa48("5058"), pattern => this.matchesPattern(relativePath, pattern))))) ?? (stryMutAct_9fa48("5059") ? false : (stryCov_9fa48("5059"), true)))) {
                    if (stryMutAct_9fa48("5060")) {
                      {}
                    } else {
                      stryCov_9fa48("5060");
                      files.push(fullPath);
                    }
                  }
                }
              }
            }
          }
        }
      };
      walkDir(this.vaultPath);
      return files;
    }
  }
  private categorizeFiles(files: string[]): {
    markdownFiles: string[];
    otherFiles: string[];
  } {
    if (stryMutAct_9fa48("5061")) {
      {}
    } else {
      stryCov_9fa48("5061");
      const markdownFiles: string[] = stryMutAct_9fa48("5062") ? ["Stryker was here"] : (stryCov_9fa48("5062"), []);
      const otherFiles: string[] = stryMutAct_9fa48("5063") ? ["Stryker was here"] : (stryCov_9fa48("5063"), []);
      files.forEach(file => {
        if (stryMutAct_9fa48("5064")) {
          {}
        } else {
          stryCov_9fa48("5064");
          if (stryMutAct_9fa48("5068") ? file.toUpperCase().endsWith(".md") : stryMutAct_9fa48("5067") ? file.toLowerCase().startsWith(".md") : stryMutAct_9fa48("5066") ? false : stryMutAct_9fa48("5065") ? true : (stryCov_9fa48("5065", "5066", "5067", "5068"), file.toLowerCase().endsWith(stryMutAct_9fa48("5069") ? "" : (stryCov_9fa48("5069"), ".md")))) {
            if (stryMutAct_9fa48("5070")) {
              {}
            } else {
              stryCov_9fa48("5070");
              markdownFiles.push(file);
            }
          } else {
            if (stryMutAct_9fa48("5071")) {
              {}
            } else {
              stryCov_9fa48("5071");
              otherFiles.push(file);
            }
          }
        }
      });
      return stryMutAct_9fa48("5072") ? {} : (stryCov_9fa48("5072"), {
        markdownFiles,
        otherFiles
      });
    }
  }
  private async processMarkdownFiles(files: string[], options: IngestionOptions): Promise<any> {
    if (stryMutAct_9fa48("5073")) {
      {}
    } else {
      stryCov_9fa48("5073");
      // Use the existing Obsidian pipeline for markdown files
      // This would need to be enhanced to include image processing
      return await this.obsidianPipeline.ingestVault(options);
    }
  }
  private async processOtherFiles(files: string[], options: IngestionOptions): Promise<any> {
    if (stryMutAct_9fa48("5074")) {
      {}
    } else {
      stryCov_9fa48("5074");
      // Use the multi-modal pipeline for other files
      return await this.multiModalPipeline.ingestFiles(files, options);
    }
  }
  private matchesPattern(filePath: string, pattern: string): boolean {
    if (stryMutAct_9fa48("5075")) {
      {}
    } else {
      stryCov_9fa48("5075");
      const regexPattern = pattern.replace(/\*\*/g, stryMutAct_9fa48("5076") ? "" : (stryCov_9fa48("5076"), ".*")).replace(/\*/g, stryMutAct_9fa48("5077") ? "" : (stryCov_9fa48("5077"), "[^/]*")).replace(/\?/g, stryMutAct_9fa48("5078") ? "" : (stryCov_9fa48("5078"), "."));
      const regex = new RegExp(stryMutAct_9fa48("5079") ? `` : (stryCov_9fa48("5079"), `^${regexPattern}$`));
      return regex.test(filePath);
    }
  }
  async validateIngestion(): Promise<{
    isValid: boolean;
    issues: string[];
    imageValidation: {
      imagesProcessed: number;
      imagesWithText: number;
      averageConfidence: number;
    };
  }> {
    if (stryMutAct_9fa48("5080")) {
      {}
    } else {
      stryCov_9fa48("5080");
      // Run validation on the obsidian pipeline
      const obsidianValidation = await this.obsidianPipeline.validateIngestion();

      // Add image-specific validation
      const imageValidation = await this.validateImageProcessing();
      const allIssues = stryMutAct_9fa48("5081") ? [] : (stryCov_9fa48("5081"), [...obsidianValidation.issues, ...imageValidation.issues]);
      return stryMutAct_9fa48("5082") ? {} : (stryCov_9fa48("5082"), {
        isValid: stryMutAct_9fa48("5085") ? obsidianValidation.isValid || imageValidation.isValid : stryMutAct_9fa48("5084") ? false : stryMutAct_9fa48("5083") ? true : (stryCov_9fa48("5083", "5084", "5085"), obsidianValidation.isValid && imageValidation.isValid),
        issues: allIssues,
        imageValidation: stryMutAct_9fa48("5086") ? {} : (stryCov_9fa48("5086"), {
          imagesProcessed: imageValidation.imagesProcessed,
          imagesWithText: imageValidation.imagesWithText,
          averageConfidence: imageValidation.averageConfidence
        })
      });
    }
  }
  private async validateImageProcessing(): Promise<any> {
    if (stryMutAct_9fa48("5087")) {
      {}
    } else {
      stryCov_9fa48("5087");
      // Placeholder for image validation logic
      return stryMutAct_9fa48("5088") ? {} : (stryCov_9fa48("5088"), {
        isValid: stryMutAct_9fa48("5089") ? false : (stryCov_9fa48("5089"), true),
        issues: stryMutAct_9fa48("5090") ? ["Stryker was here"] : (stryCov_9fa48("5090"), []),
        imagesProcessed: 0,
        imagesWithText: 0,
        averageConfidence: 0
      });
    }
  }
}
async function main() {
  if (stryMutAct_9fa48("5091")) {
    {}
  } else {
    stryCov_9fa48("5091");
    if (stryMutAct_9fa48("5094") ? false : stryMutAct_9fa48("5093") ? true : stryMutAct_9fa48("5092") ? DATABASE_URL : (stryCov_9fa48("5092", "5093", "5094"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("5095")) {
        {}
      } else {
        stryCov_9fa48("5095");
        console.error(stryMutAct_9fa48("5096") ? "" : (stryCov_9fa48("5096"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Parse command line arguments
    const args = stryMutAct_9fa48("5097") ? process.argv : (stryCov_9fa48("5097"), process.argv.slice(2));
    const options: IngestionOptions = stryMutAct_9fa48("5098") ? {} : (stryCov_9fa48("5098"), {
      batchSize: 5,
      rateLimitMs: 200,
      skipExisting: stryMutAct_9fa48("5099") ? false : (stryCov_9fa48("5099"), true),
      enableImageProcessing: stryMutAct_9fa48("5100") ? false : (stryCov_9fa48("5100"), true),
      maxFileSize: stryMutAct_9fa48("5101") ? 50 * 1024 / 1024 : (stryCov_9fa48("5101"), (stryMutAct_9fa48("5102") ? 50 / 1024 : (stryCov_9fa48("5102"), 50 * 1024)) * 1024),
      // 50MB
      includePatterns: stryMutAct_9fa48("5103") ? [] : (stryCov_9fa48("5103"), [stryMutAct_9fa48("5104") ? "" : (stryCov_9fa48("5104"), "**/*")]),
      excludePatterns: stryMutAct_9fa48("5105") ? [] : (stryCov_9fa48("5105"), [stryMutAct_9fa48("5106") ? "" : (stryCov_9fa48("5106"), "node_modules/**"), stryMutAct_9fa48("5107") ? "" : (stryCov_9fa48("5107"), ".git/**"), stryMutAct_9fa48("5108") ? "" : (stryCov_9fa48("5108"), "**/.*/**"), stryMutAct_9fa48("5109") ? "" : (stryCov_9fa48("5109"), "**/*.log"), stryMutAct_9fa48("5110") ? "" : (stryCov_9fa48("5110"), "**/*.tmp")])
    });

    // Parse arguments
    let i = 0;
    while (stryMutAct_9fa48("5113") ? i >= args.length : stryMutAct_9fa48("5112") ? i <= args.length : stryMutAct_9fa48("5111") ? false : (stryCov_9fa48("5111", "5112", "5113"), i < args.length)) {
      if (stryMutAct_9fa48("5114")) {
        {}
      } else {
        stryCov_9fa48("5114");
        const arg = args[i];
        if (stryMutAct_9fa48("5117") ? arg.endsWith("--") : stryMutAct_9fa48("5116") ? false : stryMutAct_9fa48("5115") ? true : (stryCov_9fa48("5115", "5116", "5117"), arg.startsWith(stryMutAct_9fa48("5118") ? "" : (stryCov_9fa48("5118"), "--")))) {
          if (stryMutAct_9fa48("5119")) {
            {}
          } else {
            stryCov_9fa48("5119");
            switch (arg) {
              case stryMutAct_9fa48("5121") ? "" : (stryCov_9fa48("5121"), "--batch-size"):
                if (stryMutAct_9fa48("5120")) {} else {
                  stryCov_9fa48("5120");
                  options.batchSize = parseInt(args[stryMutAct_9fa48("5122") ? --i : (stryCov_9fa48("5122"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5124") ? "" : (stryCov_9fa48("5124"), "--rate-limit"):
                if (stryMutAct_9fa48("5123")) {} else {
                  stryCov_9fa48("5123");
                  options.rateLimitMs = parseInt(args[stryMutAct_9fa48("5125") ? --i : (stryCov_9fa48("5125"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5127") ? "" : (stryCov_9fa48("5127"), "--max-file-size"):
                if (stryMutAct_9fa48("5126")) {} else {
                  stryCov_9fa48("5126");
                  options.maxFileSize = parseInt(args[stryMutAct_9fa48("5128") ? --i : (stryCov_9fa48("5128"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5130") ? "" : (stryCov_9fa48("5130"), "--max-images-per-file"):
                if (stryMutAct_9fa48("5129")) {} else {
                  stryCov_9fa48("5129");
                  options.maxImagesPerFile = parseInt(args[stryMutAct_9fa48("5131") ? --i : (stryCov_9fa48("5131"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5133") ? "" : (stryCov_9fa48("5133"), "--include"):
                if (stryMutAct_9fa48("5132")) {} else {
                  stryCov_9fa48("5132");
                  options.includePatterns = args[stryMutAct_9fa48("5134") ? --i : (stryCov_9fa48("5134"), ++i)].split(stryMutAct_9fa48("5135") ? "" : (stryCov_9fa48("5135"), ","));
                  break;
                }
              case stryMutAct_9fa48("5137") ? "" : (stryCov_9fa48("5137"), "--exclude"):
                if (stryMutAct_9fa48("5136")) {} else {
                  stryCov_9fa48("5136");
                  options.excludePatterns = args[stryMutAct_9fa48("5138") ? --i : (stryCov_9fa48("5138"), ++i)].split(stryMutAct_9fa48("5139") ? "" : (stryCov_9fa48("5139"), ","));
                  break;
                }
              case stryMutAct_9fa48("5141") ? "" : (stryCov_9fa48("5141"), "--skip-existing"):
                if (stryMutAct_9fa48("5140")) {} else {
                  stryCov_9fa48("5140");
                  options.skipExisting = stryMutAct_9fa48("5142") ? false : (stryCov_9fa48("5142"), true);
                  break;
                }
              case stryMutAct_9fa48("5144") ? "" : (stryCov_9fa48("5144"), "--no-skip-existing"):
                if (stryMutAct_9fa48("5143")) {} else {
                  stryCov_9fa48("5143");
                  options.skipExisting = stryMutAct_9fa48("5145") ? true : (stryCov_9fa48("5145"), false);
                  break;
                }
              case stryMutAct_9fa48("5147") ? "" : (stryCov_9fa48("5147"), "--no-image-processing"):
                if (stryMutAct_9fa48("5146")) {} else {
                  stryCov_9fa48("5146");
                  options.enableImageProcessing = stryMutAct_9fa48("5148") ? true : (stryCov_9fa48("5148"), false);
                  break;
                }
              case stryMutAct_9fa48("5149") ? "" : (stryCov_9fa48("5149"), "--help"):
              case stryMutAct_9fa48("5151") ? "" : (stryCov_9fa48("5151"), "-h"):
                if (stryMutAct_9fa48("5150")) {} else {
                  stryCov_9fa48("5150");
                  showHelp();
                  process.exit(0);
                }
              default:
                if (stryMutAct_9fa48("5152")) {} else {
                  stryCov_9fa48("5152");
                  console.error(stryMutAct_9fa48("5153") ? `` : (stryCov_9fa48("5153"), `Unknown option: ${arg}`));
                  process.exit(1);
                }
            }
          }
        }
        stryMutAct_9fa48("5154") ? i-- : (stryCov_9fa48("5154"), i++);
      }
    }
    console.log(stryMutAct_9fa48("5155") ? "" : (stryCov_9fa48("5155"), "🚀 Starting unified Obsidian vault ingestion..."));
    console.log(stryMutAct_9fa48("5156") ? `` : (stryCov_9fa48("5156"), `📁 Vault path: ${OBSIDIAN_VAULT_PATH}`));
    console.log(stryMutAct_9fa48("5157") ? `` : (stryCov_9fa48("5157"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("5158") ? /\/\/.@/ : (stryCov_9fa48("5158"), /\/\/.*@/), stryMutAct_9fa48("5159") ? "" : (stryCov_9fa48("5159"), "//***@"))}`));
    console.log(stryMutAct_9fa48("5160") ? `` : (stryCov_9fa48("5160"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("5161")) {
        {}
      } else {
        stryCov_9fa48("5161");
        // Initialize services
        console.log(stryMutAct_9fa48("5162") ? "" : (stryCov_9fa48("5162"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5163") ? {} : (stryCov_9fa48("5163"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5166") ? false : stryMutAct_9fa48("5165") ? true : stryMutAct_9fa48("5164") ? embeddingTest.success : (stryCov_9fa48("5164", "5165", "5166"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5167")) {
            {}
          } else {
            stryCov_9fa48("5167");
            throw new Error(stryMutAct_9fa48("5168") ? "" : (stryCov_9fa48("5168"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("5169") ? `` : (stryCov_9fa48("5169"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));

        // Initialize unified ingestion pipeline
        const unifiedPipeline = new UnifiedIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);

        // Start ingestion
        const startTime = Date.now();
        const result = await unifiedPipeline.ingestVault(options);
        const duration = stryMutAct_9fa48("5170") ? Date.now() + startTime : (stryCov_9fa48("5170"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("5171") ? "" : (stryCov_9fa48("5171"), "\n")) + (stryMutAct_9fa48("5172") ? "" : (stryCov_9fa48("5172"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("5173") ? "" : (stryCov_9fa48("5173"), "📈 UNIFIED INGESTION RESULTS"));
        console.log((stryMutAct_9fa48("5174") ? "" : (stryCov_9fa48("5174"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("5175") ? `` : (stryCov_9fa48("5175"), `⏱️  Duration: ${Math.round(stryMutAct_9fa48("5176") ? duration * 1000 : (stryCov_9fa48("5176"), duration / 1000))}s`));
        console.log(stryMutAct_9fa48("5177") ? `` : (stryCov_9fa48("5177"), `📄 Files processed: ${result.processedFiles}/${result.totalFiles}`));
        console.log(stryMutAct_9fa48("5178") ? `` : (stryCov_9fa48("5178"), `📦 Chunks created: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("5179") ? `` : (stryCov_9fa48("5179"), `✅ Chunks processed: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("5180") ? `` : (stryCov_9fa48("5180"), `⏭️  Chunks skipped: ${result.skippedChunks}`));
        console.log(stryMutAct_9fa48("5181") ? `` : (stryCov_9fa48("5181"), `❌ Errors: ${result.errors.length}`));
        if (stryMutAct_9fa48("5183") ? false : stryMutAct_9fa48("5182") ? true : (stryCov_9fa48("5182", "5183"), options.enableImageProcessing)) {
          if (stryMutAct_9fa48("5184")) {
            {}
          } else {
            stryCov_9fa48("5184");
            console.log(stryMutAct_9fa48("5185") ? "" : (stryCov_9fa48("5185"), "\n🖼️  IMAGE PROCESSING RESULTS:"));
            console.log(stryMutAct_9fa48("5186") ? `` : (stryCov_9fa48("5186"), `📄 Files with images: ${result.imageStats.filesWithImages}`));
            console.log(stryMutAct_9fa48("5187") ? `` : (stryCov_9fa48("5187"), `🖼️  Total images: ${result.imageStats.totalImages}`));
            console.log(stryMutAct_9fa48("5188") ? `` : (stryCov_9fa48("5188"), `✅ Images processed: ${result.imageStats.processedImages}`));
            console.log(stryMutAct_9fa48("5189") ? `` : (stryCov_9fa48("5189"), `❌ Images failed: ${result.imageStats.failedImages}`));
          }
        }
        if (stryMutAct_9fa48("5193") ? result.errors.length <= 0 : stryMutAct_9fa48("5192") ? result.errors.length >= 0 : stryMutAct_9fa48("5191") ? false : stryMutAct_9fa48("5190") ? true : (stryCov_9fa48("5190", "5191", "5192", "5193"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("5194")) {
            {}
          } else {
            stryCov_9fa48("5194");
            console.log(stryMutAct_9fa48("5195") ? "" : (stryCov_9fa48("5195"), "\n🚨 ERRORS:"));
            stryMutAct_9fa48("5196") ? result.errors.forEach((error, i) => {
              console.log(`  ${i + 1}. ${error}`);
            }) : (stryCov_9fa48("5196"), result.errors.slice(0, 5).forEach((error, i) => {
              if (stryMutAct_9fa48("5197")) {
                {}
              } else {
                stryCov_9fa48("5197");
                console.log(stryMutAct_9fa48("5198") ? `` : (stryCov_9fa48("5198"), `  ${stryMutAct_9fa48("5199") ? i - 1 : (stryCov_9fa48("5199"), i + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("5203") ? result.errors.length <= 5 : stryMutAct_9fa48("5202") ? result.errors.length >= 5 : stryMutAct_9fa48("5201") ? false : stryMutAct_9fa48("5200") ? true : (stryCov_9fa48("5200", "5201", "5202", "5203"), result.errors.length > 5)) {
              if (stryMutAct_9fa48("5204")) {
                {}
              } else {
                stryCov_9fa48("5204");
                console.log(stryMutAct_9fa48("5205") ? `` : (stryCov_9fa48("5205"), `  ... and ${stryMutAct_9fa48("5206") ? result.errors.length + 5 : (stryCov_9fa48("5206"), result.errors.length - 5)} more errors`));
              }
            }
          }
        }

        // Validation
        console.log(stryMutAct_9fa48("5207") ? "" : (stryCov_9fa48("5207"), "\n🔍 Validating ingestion..."));
        const validation = await unifiedPipeline.validateIngestion();
        if (stryMutAct_9fa48("5209") ? false : stryMutAct_9fa48("5208") ? true : (stryCov_9fa48("5208", "5209"), validation.isValid)) {
          if (stryMutAct_9fa48("5210")) {
            {}
          } else {
            stryCov_9fa48("5210");
            console.log(stryMutAct_9fa48("5211") ? "" : (stryCov_9fa48("5211"), "✅ Validation passed!"));
          }
        } else {
          if (stryMutAct_9fa48("5212")) {
            {}
          } else {
            stryCov_9fa48("5212");
            console.log(stryMutAct_9fa48("5213") ? "" : (stryCov_9fa48("5213"), "⚠️  Validation issues found:"));
            validation.issues.forEach((issue, i) => {
              if (stryMutAct_9fa48("5214")) {
                {}
              } else {
                stryCov_9fa48("5214");
                console.log(stryMutAct_9fa48("5215") ? `` : (stryCov_9fa48("5215"), `  ${stryMutAct_9fa48("5216") ? i - 1 : (stryCov_9fa48("5216"), i + 1)}. ${issue}`));
              }
            });
          }
        }
        if (stryMutAct_9fa48("5219") ? options.enableImageProcessing || validation.imageValidation : stryMutAct_9fa48("5218") ? false : stryMutAct_9fa48("5217") ? true : (stryCov_9fa48("5217", "5218", "5219"), options.enableImageProcessing && validation.imageValidation)) {
          if (stryMutAct_9fa48("5220")) {
            {}
          } else {
            stryCov_9fa48("5220");
            console.log(stryMutAct_9fa48("5221") ? "" : (stryCov_9fa48("5221"), "\n🖼️  Image validation:"));
            console.log(stryMutAct_9fa48("5222") ? `` : (stryCov_9fa48("5222"), `  Images processed: ${validation.imageValidation.imagesProcessed}`));
            console.log(stryMutAct_9fa48("5223") ? `` : (stryCov_9fa48("5223"), `  Images with text: ${validation.imageValidation.imagesWithText}`));
            console.log(stryMutAct_9fa48("5224") ? `` : (stryCov_9fa48("5224"), `  Average confidence: ${validation.imageValidation.averageConfidence.toFixed(1)}%`));
          }
        }
        console.log(stryMutAct_9fa48("5225") ? "" : (stryCov_9fa48("5225"), "\n🎉 Unified ingestion completed successfully!"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("5226")) {
        {}
      } else {
        stryCov_9fa48("5226");
        console.error(stryMutAct_9fa48("5227") ? "" : (stryCov_9fa48("5227"), "❌ Ingestion failed:"), error);
        process.exit(1);
      }
    }
  }
}
function showHelp() {
  if (stryMutAct_9fa48("5228")) {
    {}
  } else {
    stryCov_9fa48("5228");
    console.log(stryMutAct_9fa48("5229") ? `` : (stryCov_9fa48("5229"), `
Unified Multi-Modal Obsidian Ingestion Tool

Usage: tsx src/scripts/ingest-unified.ts [options]

Environment Variables:
  OBSIDIAN_VAULT_PATH    Path to your Obsidian vault (default: iCloud path)
  DATABASE_URL           PostgreSQL connection string (required)
  EMBEDDING_MODEL        Ollama model name (default: embeddinggemma)
  EMBEDDING_DIMENSION    Embedding dimension (default: 768)

Options:
  --batch-size <number>         Batch size for processing (default: 5)
  --rate-limit <ms>             Rate limit between batches (default: 200)
  --max-file-size <bytes>       Maximum file size to process (default: 50MB)
  --max-images-per-file <num>   Maximum images to process per file (default: 10)
  --include <patterns>          Comma-separated include patterns (default: **/*)
  --exclude <patterns>          Comma-separated exclude patterns (default: node_modules/**,.git/**,**/.*/**)
  --skip-existing               Skip existing chunks (default: true)
  --no-skip-existing            Process all chunks even if they exist
  --no-image-processing         Disable automatic image processing
  --help, -h                    Show this help message

Examples:
  tsx src/scripts/ingest-unified.ts
  tsx src/scripts/ingest-unified.ts --batch-size 3 --max-images-per-file 5
  tsx src/scripts/ingest-unified.ts --no-image-processing
  tsx src/scripts/ingest-unified.ts --include "**/*.{md,png,jpg}" --exclude "**/temp/**"
`));
  }
}

// Run the main function
main().catch(error => {
  if (stryMutAct_9fa48("5230")) {
    {}
  } else {
    stryCov_9fa48("5230");
    console.error(stryMutAct_9fa48("5231") ? "" : (stryCov_9fa48("5231"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});