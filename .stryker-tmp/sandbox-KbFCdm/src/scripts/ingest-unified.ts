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
const OBSIDIAN_VAULT_PATH = stryMutAct_9fa48("4847") ? process.env.OBSIDIAN_VAULT_PATH && "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault" : stryMutAct_9fa48("4846") ? false : stryMutAct_9fa48("4845") ? true : (stryCov_9fa48("4845", "4846", "4847"), process.env.OBSIDIAN_VAULT_PATH || (stryMutAct_9fa48("4848") ? "" : (stryCov_9fa48("4848"), "/Users/darianrosebrook/Library/Mobile Documents/iCloud~md~obsidian/Documents/Obsidian Vault")));
const DATABASE_URL = process.env.DATABASE_URL;
const EMBEDDING_MODEL = stryMutAct_9fa48("4851") ? process.env.EMBEDDING_MODEL && "embeddinggemma" : stryMutAct_9fa48("4850") ? false : stryMutAct_9fa48("4849") ? true : (stryCov_9fa48("4849", "4850", "4851"), process.env.EMBEDDING_MODEL || (stryMutAct_9fa48("4852") ? "" : (stryCov_9fa48("4852"), "embeddinggemma")));
const EMBEDDING_DIMENSION = parseInt(stryMutAct_9fa48("4855") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4854") ? false : stryMutAct_9fa48("4853") ? true : (stryCov_9fa48("4853", "4854", "4855"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4856") ? "" : (stryCov_9fa48("4856"), "768"))));
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
    if (stryMutAct_9fa48("4857")) {
      {}
    } else {
      stryCov_9fa48("4857");
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
    if (stryMutAct_9fa48("4858")) {
      {}
    } else {
      stryCov_9fa48("4858");
      const {
        batchSize = 5,
        rateLimitMs = 200,
        skipExisting = stryMutAct_9fa48("4859") ? false : (stryCov_9fa48("4859"), true),
        enableImageProcessing = stryMutAct_9fa48("4860") ? false : (stryCov_9fa48("4860"), true),
        maxImagesPerFile = 10,
        ...restOptions
      } = options;
      console.log(stryMutAct_9fa48("4861") ? "" : (stryCov_9fa48("4861"), "🚀 Starting unified multi-modal ingestion..."));
      console.log(stryMutAct_9fa48("4862") ? `` : (stryCov_9fa48("4862"), `📁 Vault path: ${this.vaultPath}`));
      console.log(stryMutAct_9fa48("4863") ? `` : (stryCov_9fa48("4863"), `🔍 Image processing: ${enableImageProcessing ? stryMutAct_9fa48("4864") ? "" : (stryCov_9fa48("4864"), "ENABLED") : stryMutAct_9fa48("4865") ? "" : (stryCov_9fa48("4865"), "DISABLED")}`));
      try {
        if (stryMutAct_9fa48("4866")) {
          {}
        } else {
          stryCov_9fa48("4866");
          // Discover all files to process
          const allFiles = await this.discoverFiles(options);
          if (stryMutAct_9fa48("4869") ? allFiles.length !== 0 : stryMutAct_9fa48("4868") ? false : stryMutAct_9fa48("4867") ? true : (stryCov_9fa48("4867", "4868", "4869"), allFiles.length === 0)) {
            if (stryMutAct_9fa48("4870")) {
              {}
            } else {
              stryCov_9fa48("4870");
              console.log(stryMutAct_9fa48("4871") ? "" : (stryCov_9fa48("4871"), "ℹ️  No files found to process"));
              return stryMutAct_9fa48("4872") ? {} : (stryCov_9fa48("4872"), {
                totalFiles: 0,
                processedFiles: 0,
                totalChunks: 0,
                processedChunks: 0,
                skippedChunks: 0,
                errors: stryMutAct_9fa48("4873") ? ["Stryker was here"] : (stryCov_9fa48("4873"), []),
                imageStats: stryMutAct_9fa48("4874") ? {} : (stryCov_9fa48("4874"), {
                  filesWithImages: 0,
                  totalImages: 0,
                  processedImages: 0,
                  failedImages: 0
                })
              });
            }
          }
          console.log(stryMutAct_9fa48("4875") ? `` : (stryCov_9fa48("4875"), `📄 Found ${allFiles.length} files to process`));

          // Separate markdown and non-markdown files
          const {
            markdownFiles,
            otherFiles
          } = this.categorizeFiles(allFiles);
          console.log(stryMutAct_9fa48("4876") ? `` : (stryCov_9fa48("4876"), `📝 Markdown files: ${markdownFiles.length}`));
          console.log(stryMutAct_9fa48("4877") ? `` : (stryCov_9fa48("4877"), `🖼️  Other files: ${otherFiles.length}`));
          let totalFiles = 0;
          let processedFiles = 0;
          let totalChunks = 0;
          let processedChunks = 0;
          let skippedChunks = 0;
          const errors: string[] = stryMutAct_9fa48("4878") ? ["Stryker was here"] : (stryCov_9fa48("4878"), []);
          let filesWithImages = 0;
          let totalImages = 0;
          let processedImages = 0;
          let failedImages = 0;

          // Process markdown files with image extraction
          if (stryMutAct_9fa48("4882") ? markdownFiles.length <= 0 : stryMutAct_9fa48("4881") ? markdownFiles.length >= 0 : stryMutAct_9fa48("4880") ? false : stryMutAct_9fa48("4879") ? true : (stryCov_9fa48("4879", "4880", "4881", "4882"), markdownFiles.length > 0)) {
            if (stryMutAct_9fa48("4883")) {
              {}
            } else {
              stryCov_9fa48("4883");
              const markdownResult = await this.processMarkdownFiles(markdownFiles, stryMutAct_9fa48("4884") ? {} : (stryCov_9fa48("4884"), {
                ...restOptions,
                batchSize,
                rateLimitMs,
                skipExisting,
                enableImageProcessing,
                maxImagesPerFile
              }));
              stryMutAct_9fa48("4885") ? totalFiles -= markdownResult.totalFiles : (stryCov_9fa48("4885"), totalFiles += markdownResult.totalFiles);
              stryMutAct_9fa48("4886") ? processedFiles -= markdownResult.processedFiles : (stryCov_9fa48("4886"), processedFiles += markdownResult.processedFiles);
              stryMutAct_9fa48("4887") ? totalChunks -= markdownResult.totalChunks : (stryCov_9fa48("4887"), totalChunks += markdownResult.totalChunks);
              stryMutAct_9fa48("4888") ? processedChunks -= markdownResult.processedChunks : (stryCov_9fa48("4888"), processedChunks += markdownResult.processedChunks);
              stryMutAct_9fa48("4889") ? skippedChunks -= markdownResult.skippedChunks : (stryCov_9fa48("4889"), skippedChunks += markdownResult.skippedChunks);
              errors.push(...markdownResult.errors);
              stryMutAct_9fa48("4890") ? filesWithImages -= markdownResult.imageStats.filesWithImages : (stryCov_9fa48("4890"), filesWithImages += markdownResult.imageStats.filesWithImages);
              stryMutAct_9fa48("4891") ? totalImages -= markdownResult.imageStats.totalImages : (stryCov_9fa48("4891"), totalImages += markdownResult.imageStats.totalImages);
              stryMutAct_9fa48("4892") ? processedImages -= markdownResult.imageStats.processedImages : (stryCov_9fa48("4892"), processedImages += markdownResult.imageStats.processedImages);
              stryMutAct_9fa48("4893") ? failedImages -= markdownResult.imageStats.failedImages : (stryCov_9fa48("4893"), failedImages += markdownResult.imageStats.failedImages);
            }
          }

          // Process other files (images, PDFs, etc.)
          if (stryMutAct_9fa48("4897") ? otherFiles.length <= 0 : stryMutAct_9fa48("4896") ? otherFiles.length >= 0 : stryMutAct_9fa48("4895") ? false : stryMutAct_9fa48("4894") ? true : (stryCov_9fa48("4894", "4895", "4896", "4897"), otherFiles.length > 0)) {
            if (stryMutAct_9fa48("4898")) {
              {}
            } else {
              stryCov_9fa48("4898");
              const otherResult = await this.processOtherFiles(otherFiles, stryMutAct_9fa48("4899") ? {} : (stryCov_9fa48("4899"), {
                ...restOptions,
                batchSize,
                rateLimitMs,
                skipExisting
              }));
              stryMutAct_9fa48("4900") ? totalFiles -= otherResult.totalFiles : (stryCov_9fa48("4900"), totalFiles += otherResult.totalFiles);
              stryMutAct_9fa48("4901") ? processedFiles -= otherResult.processedFiles : (stryCov_9fa48("4901"), processedFiles += otherResult.processedFiles);
              stryMutAct_9fa48("4902") ? totalChunks -= otherResult.totalChunks : (stryCov_9fa48("4902"), totalChunks += otherResult.totalChunks);
              stryMutAct_9fa48("4903") ? processedChunks -= otherResult.processedChunks : (stryCov_9fa48("4903"), processedChunks += otherResult.processedChunks);
              stryMutAct_9fa48("4904") ? skippedChunks -= otherResult.skippedChunks : (stryCov_9fa48("4904"), skippedChunks += otherResult.skippedChunks);
              errors.push(...otherResult.errors);
            }
          }
          const result = stryMutAct_9fa48("4905") ? {} : (stryCov_9fa48("4905"), {
            totalFiles,
            processedFiles,
            totalChunks,
            processedChunks,
            skippedChunks,
            errors,
            imageStats: stryMutAct_9fa48("4906") ? {} : (stryCov_9fa48("4906"), {
              filesWithImages,
              totalImages,
              processedImages,
              failedImages
            })
          });
          console.log((stryMutAct_9fa48("4907") ? "" : (stryCov_9fa48("4907"), "\n")) + (stryMutAct_9fa48("4908") ? "" : (stryCov_9fa48("4908"), "=")).repeat(60));
          console.log(stryMutAct_9fa48("4909") ? "" : (stryCov_9fa48("4909"), "📈 UNIFIED INGESTION RESULTS"));
          console.log((stryMutAct_9fa48("4910") ? "" : (stryCov_9fa48("4910"), "=")).repeat(60));
          console.log(stryMutAct_9fa48("4911") ? `` : (stryCov_9fa48("4911"), `⏱️  Total files: ${totalFiles}`));
          console.log(stryMutAct_9fa48("4912") ? `` : (stryCov_9fa48("4912"), `✅ Files processed: ${processedFiles}`));
          console.log(stryMutAct_9fa48("4913") ? `` : (stryCov_9fa48("4913"), `📦 Total chunks: ${totalChunks}`));
          console.log(stryMutAct_9fa48("4914") ? `` : (stryCov_9fa48("4914"), `🔮 Chunks processed: ${processedChunks}`));
          console.log(stryMutAct_9fa48("4915") ? `` : (stryCov_9fa48("4915"), `⏭️  Chunks skipped: ${skippedChunks}`));
          console.log(stryMutAct_9fa48("4916") ? `` : (stryCov_9fa48("4916"), `❌ Errors: ${errors.length}`));
          if (stryMutAct_9fa48("4918") ? false : stryMutAct_9fa48("4917") ? true : (stryCov_9fa48("4917", "4918"), enableImageProcessing)) {
            if (stryMutAct_9fa48("4919")) {
              {}
            } else {
              stryCov_9fa48("4919");
              console.log(stryMutAct_9fa48("4920") ? "" : (stryCov_9fa48("4920"), "\n🖼️  IMAGE PROCESSING RESULTS:"));
              console.log(stryMutAct_9fa48("4921") ? `` : (stryCov_9fa48("4921"), `📄 Files with images: ${filesWithImages}`));
              console.log(stryMutAct_9fa48("4922") ? `` : (stryCov_9fa48("4922"), `🖼️  Total images: ${totalImages}`));
              console.log(stryMutAct_9fa48("4923") ? `` : (stryCov_9fa48("4923"), `✅ Images processed: ${processedImages}`));
              console.log(stryMutAct_9fa48("4924") ? `` : (stryCov_9fa48("4924"), `❌ Images failed: ${failedImages}`));
            }
          }
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("4925")) {
          {}
        } else {
          stryCov_9fa48("4925");
          console.error(stryMutAct_9fa48("4926") ? "" : (stryCov_9fa48("4926"), "❌ Unified ingestion failed:"), error);
          throw new Error(stryMutAct_9fa48("4927") ? `` : (stryCov_9fa48("4927"), `Unified ingestion pipeline failed: ${error}`));
        }
      }
    }
  }
  private async discoverFiles(options: IngestionOptions): Promise<string[]> {
    if (stryMutAct_9fa48("4928")) {
      {}
    } else {
      stryCov_9fa48("4928");
      const files: string[] = stryMutAct_9fa48("4929") ? ["Stryker was here"] : (stryCov_9fa48("4929"), []);
      const walkDir = (dir: string): void => {
        if (stryMutAct_9fa48("4930")) {
          {}
        } else {
          stryCov_9fa48("4930");
          if (stryMutAct_9fa48("4933") ? false : stryMutAct_9fa48("4932") ? true : stryMutAct_9fa48("4931") ? fs.existsSync(dir) : (stryCov_9fa48("4931", "4932", "4933"), !fs.existsSync(dir))) return;
          const entries = fs.readdirSync(dir, stryMutAct_9fa48("4934") ? {} : (stryCov_9fa48("4934"), {
            withFileTypes: stryMutAct_9fa48("4935") ? false : (stryCov_9fa48("4935"), true)
          }));
          for (const entry of entries) {
            if (stryMutAct_9fa48("4936")) {
              {}
            } else {
              stryCov_9fa48("4936");
              const fullPath = path.join(dir, entry.name);
              const relativePath = path.relative(this.vaultPath, fullPath);

              // Check exclude patterns
              if (stryMutAct_9fa48("4940") ? options.excludePatterns.some(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("4939") ? options.excludePatterns?.every(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("4938") ? false : stryMutAct_9fa48("4937") ? true : (stryCov_9fa48("4937", "4938", "4939", "4940"), options.excludePatterns?.some(stryMutAct_9fa48("4941") ? () => undefined : (stryCov_9fa48("4941"), pattern => this.matchesPattern(relativePath, pattern))))) {
                if (stryMutAct_9fa48("4942")) {
                  {}
                } else {
                  stryCov_9fa48("4942");
                  continue;
                }
              }
              if (stryMutAct_9fa48("4944") ? false : stryMutAct_9fa48("4943") ? true : (stryCov_9fa48("4943", "4944"), entry.isDirectory())) {
                if (stryMutAct_9fa48("4945")) {
                  {}
                } else {
                  stryCov_9fa48("4945");
                  walkDir(fullPath);
                }
              } else if (stryMutAct_9fa48("4947") ? false : stryMutAct_9fa48("4946") ? true : (stryCov_9fa48("4946", "4947"), entry.isFile())) {
                if (stryMutAct_9fa48("4948")) {
                  {}
                } else {
                  stryCov_9fa48("4948");
                  // Include all files by default for unified processing
                  if (stryMutAct_9fa48("4951") ? options.includePatterns?.some(pattern => this.matchesPattern(relativePath, pattern)) && true : stryMutAct_9fa48("4950") ? false : stryMutAct_9fa48("4949") ? true : (stryCov_9fa48("4949", "4950", "4951"), (stryMutAct_9fa48("4953") ? options.includePatterns.some(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("4952") ? options.includePatterns?.every(pattern => this.matchesPattern(relativePath, pattern)) : (stryCov_9fa48("4952", "4953"), options.includePatterns?.some(stryMutAct_9fa48("4954") ? () => undefined : (stryCov_9fa48("4954"), pattern => this.matchesPattern(relativePath, pattern))))) ?? (stryMutAct_9fa48("4955") ? false : (stryCov_9fa48("4955"), true)))) {
                    if (stryMutAct_9fa48("4956")) {
                      {}
                    } else {
                      stryCov_9fa48("4956");
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
    if (stryMutAct_9fa48("4957")) {
      {}
    } else {
      stryCov_9fa48("4957");
      const markdownFiles: string[] = stryMutAct_9fa48("4958") ? ["Stryker was here"] : (stryCov_9fa48("4958"), []);
      const otherFiles: string[] = stryMutAct_9fa48("4959") ? ["Stryker was here"] : (stryCov_9fa48("4959"), []);
      files.forEach(file => {
        if (stryMutAct_9fa48("4960")) {
          {}
        } else {
          stryCov_9fa48("4960");
          if (stryMutAct_9fa48("4964") ? file.toUpperCase().endsWith(".md") : stryMutAct_9fa48("4963") ? file.toLowerCase().startsWith(".md") : stryMutAct_9fa48("4962") ? false : stryMutAct_9fa48("4961") ? true : (stryCov_9fa48("4961", "4962", "4963", "4964"), file.toLowerCase().endsWith(stryMutAct_9fa48("4965") ? "" : (stryCov_9fa48("4965"), ".md")))) {
            if (stryMutAct_9fa48("4966")) {
              {}
            } else {
              stryCov_9fa48("4966");
              markdownFiles.push(file);
            }
          } else {
            if (stryMutAct_9fa48("4967")) {
              {}
            } else {
              stryCov_9fa48("4967");
              otherFiles.push(file);
            }
          }
        }
      });
      return stryMutAct_9fa48("4968") ? {} : (stryCov_9fa48("4968"), {
        markdownFiles,
        otherFiles
      });
    }
  }
  private async processMarkdownFiles(files: string[], options: IngestionOptions): Promise<any> {
    if (stryMutAct_9fa48("4969")) {
      {}
    } else {
      stryCov_9fa48("4969");
      // Use the existing Obsidian pipeline for markdown files
      // This would need to be enhanced to include image processing
      return await this.obsidianPipeline.ingestVault(options);
    }
  }
  private async processOtherFiles(files: string[], options: IngestionOptions): Promise<any> {
    if (stryMutAct_9fa48("4970")) {
      {}
    } else {
      stryCov_9fa48("4970");
      // Use the multi-modal pipeline for other files
      return await this.multiModalPipeline.ingestFiles(files, options);
    }
  }
  private matchesPattern(filePath: string, pattern: string): boolean {
    if (stryMutAct_9fa48("4971")) {
      {}
    } else {
      stryCov_9fa48("4971");
      const regexPattern = pattern.replace(/\*\*/g, stryMutAct_9fa48("4972") ? "" : (stryCov_9fa48("4972"), ".*")).replace(/\*/g, stryMutAct_9fa48("4973") ? "" : (stryCov_9fa48("4973"), "[^/]*")).replace(/\?/g, stryMutAct_9fa48("4974") ? "" : (stryCov_9fa48("4974"), "."));
      const regex = new RegExp(stryMutAct_9fa48("4975") ? `` : (stryCov_9fa48("4975"), `^${regexPattern}$`));
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
    if (stryMutAct_9fa48("4976")) {
      {}
    } else {
      stryCov_9fa48("4976");
      // Run validation on the obsidian pipeline
      const obsidianValidation = await this.obsidianPipeline.validateIngestion();

      // Add image-specific validation
      const imageValidation = await this.validateImageProcessing();
      const allIssues = stryMutAct_9fa48("4977") ? [] : (stryCov_9fa48("4977"), [...obsidianValidation.issues, ...imageValidation.issues]);
      return stryMutAct_9fa48("4978") ? {} : (stryCov_9fa48("4978"), {
        isValid: stryMutAct_9fa48("4981") ? obsidianValidation.isValid || imageValidation.isValid : stryMutAct_9fa48("4980") ? false : stryMutAct_9fa48("4979") ? true : (stryCov_9fa48("4979", "4980", "4981"), obsidianValidation.isValid && imageValidation.isValid),
        issues: allIssues,
        imageValidation: stryMutAct_9fa48("4982") ? {} : (stryCov_9fa48("4982"), {
          imagesProcessed: imageValidation.imagesProcessed,
          imagesWithText: imageValidation.imagesWithText,
          averageConfidence: imageValidation.averageConfidence
        })
      });
    }
  }
  private async validateImageProcessing(): Promise<any> {
    if (stryMutAct_9fa48("4983")) {
      {}
    } else {
      stryCov_9fa48("4983");
      // Placeholder for image validation logic
      return stryMutAct_9fa48("4984") ? {} : (stryCov_9fa48("4984"), {
        isValid: stryMutAct_9fa48("4985") ? false : (stryCov_9fa48("4985"), true),
        issues: stryMutAct_9fa48("4986") ? ["Stryker was here"] : (stryCov_9fa48("4986"), []),
        imagesProcessed: 0,
        imagesWithText: 0,
        averageConfidence: 0
      });
    }
  }
}
async function main() {
  if (stryMutAct_9fa48("4987")) {
    {}
  } else {
    stryCov_9fa48("4987");
    if (stryMutAct_9fa48("4990") ? false : stryMutAct_9fa48("4989") ? true : stryMutAct_9fa48("4988") ? DATABASE_URL : (stryCov_9fa48("4988", "4989", "4990"), !DATABASE_URL)) {
      if (stryMutAct_9fa48("4991")) {
        {}
      } else {
        stryCov_9fa48("4991");
        console.error(stryMutAct_9fa48("4992") ? "" : (stryCov_9fa48("4992"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }

    // Parse command line arguments
    const args = stryMutAct_9fa48("4993") ? process.argv : (stryCov_9fa48("4993"), process.argv.slice(2));
    const options: IngestionOptions = stryMutAct_9fa48("4994") ? {} : (stryCov_9fa48("4994"), {
      batchSize: 5,
      rateLimitMs: 200,
      skipExisting: stryMutAct_9fa48("4995") ? false : (stryCov_9fa48("4995"), true),
      enableImageProcessing: stryMutAct_9fa48("4996") ? false : (stryCov_9fa48("4996"), true),
      maxFileSize: stryMutAct_9fa48("4997") ? 50 * 1024 / 1024 : (stryCov_9fa48("4997"), (stryMutAct_9fa48("4998") ? 50 / 1024 : (stryCov_9fa48("4998"), 50 * 1024)) * 1024),
      // 50MB
      includePatterns: stryMutAct_9fa48("4999") ? [] : (stryCov_9fa48("4999"), [stryMutAct_9fa48("5000") ? "" : (stryCov_9fa48("5000"), "**/*")]),
      excludePatterns: stryMutAct_9fa48("5001") ? [] : (stryCov_9fa48("5001"), [stryMutAct_9fa48("5002") ? "" : (stryCov_9fa48("5002"), "node_modules/**"), stryMutAct_9fa48("5003") ? "" : (stryCov_9fa48("5003"), ".git/**"), stryMutAct_9fa48("5004") ? "" : (stryCov_9fa48("5004"), "**/.*/**"), stryMutAct_9fa48("5005") ? "" : (stryCov_9fa48("5005"), "**/*.log"), stryMutAct_9fa48("5006") ? "" : (stryCov_9fa48("5006"), "**/*.tmp")])
    });

    // Parse arguments
    let i = 0;
    while (stryMutAct_9fa48("5009") ? i >= args.length : stryMutAct_9fa48("5008") ? i <= args.length : stryMutAct_9fa48("5007") ? false : (stryCov_9fa48("5007", "5008", "5009"), i < args.length)) {
      if (stryMutAct_9fa48("5010")) {
        {}
      } else {
        stryCov_9fa48("5010");
        const arg = args[i];
        if (stryMutAct_9fa48("5013") ? arg.endsWith("--") : stryMutAct_9fa48("5012") ? false : stryMutAct_9fa48("5011") ? true : (stryCov_9fa48("5011", "5012", "5013"), arg.startsWith(stryMutAct_9fa48("5014") ? "" : (stryCov_9fa48("5014"), "--")))) {
          if (stryMutAct_9fa48("5015")) {
            {}
          } else {
            stryCov_9fa48("5015");
            switch (arg) {
              case stryMutAct_9fa48("5017") ? "" : (stryCov_9fa48("5017"), "--batch-size"):
                if (stryMutAct_9fa48("5016")) {} else {
                  stryCov_9fa48("5016");
                  options.batchSize = parseInt(args[stryMutAct_9fa48("5018") ? --i : (stryCov_9fa48("5018"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5020") ? "" : (stryCov_9fa48("5020"), "--rate-limit"):
                if (stryMutAct_9fa48("5019")) {} else {
                  stryCov_9fa48("5019");
                  options.rateLimitMs = parseInt(args[stryMutAct_9fa48("5021") ? --i : (stryCov_9fa48("5021"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5023") ? "" : (stryCov_9fa48("5023"), "--max-file-size"):
                if (stryMutAct_9fa48("5022")) {} else {
                  stryCov_9fa48("5022");
                  options.maxFileSize = parseInt(args[stryMutAct_9fa48("5024") ? --i : (stryCov_9fa48("5024"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5026") ? "" : (stryCov_9fa48("5026"), "--max-images-per-file"):
                if (stryMutAct_9fa48("5025")) {} else {
                  stryCov_9fa48("5025");
                  options.maxImagesPerFile = parseInt(args[stryMutAct_9fa48("5027") ? --i : (stryCov_9fa48("5027"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("5029") ? "" : (stryCov_9fa48("5029"), "--include"):
                if (stryMutAct_9fa48("5028")) {} else {
                  stryCov_9fa48("5028");
                  options.includePatterns = args[stryMutAct_9fa48("5030") ? --i : (stryCov_9fa48("5030"), ++i)].split(stryMutAct_9fa48("5031") ? "" : (stryCov_9fa48("5031"), ","));
                  break;
                }
              case stryMutAct_9fa48("5033") ? "" : (stryCov_9fa48("5033"), "--exclude"):
                if (stryMutAct_9fa48("5032")) {} else {
                  stryCov_9fa48("5032");
                  options.excludePatterns = args[stryMutAct_9fa48("5034") ? --i : (stryCov_9fa48("5034"), ++i)].split(stryMutAct_9fa48("5035") ? "" : (stryCov_9fa48("5035"), ","));
                  break;
                }
              case stryMutAct_9fa48("5037") ? "" : (stryCov_9fa48("5037"), "--skip-existing"):
                if (stryMutAct_9fa48("5036")) {} else {
                  stryCov_9fa48("5036");
                  options.skipExisting = stryMutAct_9fa48("5038") ? false : (stryCov_9fa48("5038"), true);
                  break;
                }
              case stryMutAct_9fa48("5040") ? "" : (stryCov_9fa48("5040"), "--no-skip-existing"):
                if (stryMutAct_9fa48("5039")) {} else {
                  stryCov_9fa48("5039");
                  options.skipExisting = stryMutAct_9fa48("5041") ? true : (stryCov_9fa48("5041"), false);
                  break;
                }
              case stryMutAct_9fa48("5043") ? "" : (stryCov_9fa48("5043"), "--no-image-processing"):
                if (stryMutAct_9fa48("5042")) {} else {
                  stryCov_9fa48("5042");
                  options.enableImageProcessing = stryMutAct_9fa48("5044") ? true : (stryCov_9fa48("5044"), false);
                  break;
                }
              case stryMutAct_9fa48("5045") ? "" : (stryCov_9fa48("5045"), "--help"):
              case stryMutAct_9fa48("5047") ? "" : (stryCov_9fa48("5047"), "-h"):
                if (stryMutAct_9fa48("5046")) {} else {
                  stryCov_9fa48("5046");
                  showHelp();
                  process.exit(0);
                }
              default:
                if (stryMutAct_9fa48("5048")) {} else {
                  stryCov_9fa48("5048");
                  console.error(stryMutAct_9fa48("5049") ? `` : (stryCov_9fa48("5049"), `Unknown option: ${arg}`));
                  process.exit(1);
                }
            }
          }
        }
        stryMutAct_9fa48("5050") ? i-- : (stryCov_9fa48("5050"), i++);
      }
    }
    console.log(stryMutAct_9fa48("5051") ? "" : (stryCov_9fa48("5051"), "🚀 Starting unified Obsidian vault ingestion..."));
    console.log(stryMutAct_9fa48("5052") ? `` : (stryCov_9fa48("5052"), `📁 Vault path: ${OBSIDIAN_VAULT_PATH}`));
    console.log(stryMutAct_9fa48("5053") ? `` : (stryCov_9fa48("5053"), `🔗 Database: ${DATABASE_URL.replace(stryMutAct_9fa48("5054") ? /\/\/.@/ : (stryCov_9fa48("5054"), /\/\/.*@/), stryMutAct_9fa48("5055") ? "" : (stryCov_9fa48("5055"), "//***@"))}`));
    console.log(stryMutAct_9fa48("5056") ? `` : (stryCov_9fa48("5056"), `🧠 Embedding model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSION}d)`));
    try {
      if (stryMutAct_9fa48("5057")) {
        {}
      } else {
        stryCov_9fa48("5057");
        // Initialize services
        console.log(stryMutAct_9fa48("5058") ? "" : (stryCov_9fa48("5058"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(DATABASE_URL);
        await database.initialize();
        const embeddingService = new ObsidianEmbeddingService(stryMutAct_9fa48("5059") ? {} : (stryCov_9fa48("5059"), {
          model: EMBEDDING_MODEL,
          dimension: EMBEDDING_DIMENSION
        }));

        // Test embedding service
        const embeddingTest = await embeddingService.testConnection();
        if (stryMutAct_9fa48("5062") ? false : stryMutAct_9fa48("5061") ? true : stryMutAct_9fa48("5060") ? embeddingTest.success : (stryCov_9fa48("5060", "5061", "5062"), !embeddingTest.success)) {
          if (stryMutAct_9fa48("5063")) {
            {}
          } else {
            stryCov_9fa48("5063");
            throw new Error(stryMutAct_9fa48("5064") ? "" : (stryCov_9fa48("5064"), "Embedding service connection failed"));
          }
        }
        console.log(stryMutAct_9fa48("5065") ? `` : (stryCov_9fa48("5065"), `✅ Embedding service ready (${embeddingTest.dimension}d)`));

        // Initialize unified ingestion pipeline
        const unifiedPipeline = new UnifiedIngestionPipeline(database, embeddingService, OBSIDIAN_VAULT_PATH);

        // Start ingestion
        const startTime = Date.now();
        const result = await unifiedPipeline.ingestVault(options);
        const duration = stryMutAct_9fa48("5066") ? Date.now() + startTime : (stryCov_9fa48("5066"), Date.now() - startTime);

        // Display results
        console.log((stryMutAct_9fa48("5067") ? "" : (stryCov_9fa48("5067"), "\n")) + (stryMutAct_9fa48("5068") ? "" : (stryCov_9fa48("5068"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("5069") ? "" : (stryCov_9fa48("5069"), "📈 UNIFIED INGESTION RESULTS"));
        console.log((stryMutAct_9fa48("5070") ? "" : (stryCov_9fa48("5070"), "=")).repeat(60));
        console.log(stryMutAct_9fa48("5071") ? `` : (stryCov_9fa48("5071"), `⏱️  Duration: ${Math.round(stryMutAct_9fa48("5072") ? duration * 1000 : (stryCov_9fa48("5072"), duration / 1000))}s`));
        console.log(stryMutAct_9fa48("5073") ? `` : (stryCov_9fa48("5073"), `📄 Files processed: ${result.processedFiles}/${result.totalFiles}`));
        console.log(stryMutAct_9fa48("5074") ? `` : (stryCov_9fa48("5074"), `📦 Chunks created: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("5075") ? `` : (stryCov_9fa48("5075"), `✅ Chunks processed: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("5076") ? `` : (stryCov_9fa48("5076"), `⏭️  Chunks skipped: ${result.skippedChunks}`));
        console.log(stryMutAct_9fa48("5077") ? `` : (stryCov_9fa48("5077"), `❌ Errors: ${result.errors.length}`));
        if (stryMutAct_9fa48("5079") ? false : stryMutAct_9fa48("5078") ? true : (stryCov_9fa48("5078", "5079"), options.enableImageProcessing)) {
          if (stryMutAct_9fa48("5080")) {
            {}
          } else {
            stryCov_9fa48("5080");
            console.log(stryMutAct_9fa48("5081") ? "" : (stryCov_9fa48("5081"), "\n🖼️  IMAGE PROCESSING RESULTS:"));
            console.log(stryMutAct_9fa48("5082") ? `` : (stryCov_9fa48("5082"), `📄 Files with images: ${result.imageStats.filesWithImages}`));
            console.log(stryMutAct_9fa48("5083") ? `` : (stryCov_9fa48("5083"), `🖼️  Total images: ${result.imageStats.totalImages}`));
            console.log(stryMutAct_9fa48("5084") ? `` : (stryCov_9fa48("5084"), `✅ Images processed: ${result.imageStats.processedImages}`));
            console.log(stryMutAct_9fa48("5085") ? `` : (stryCov_9fa48("5085"), `❌ Images failed: ${result.imageStats.failedImages}`));
          }
        }
        if (stryMutAct_9fa48("5089") ? result.errors.length <= 0 : stryMutAct_9fa48("5088") ? result.errors.length >= 0 : stryMutAct_9fa48("5087") ? false : stryMutAct_9fa48("5086") ? true : (stryCov_9fa48("5086", "5087", "5088", "5089"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("5090")) {
            {}
          } else {
            stryCov_9fa48("5090");
            console.log(stryMutAct_9fa48("5091") ? "" : (stryCov_9fa48("5091"), "\n🚨 ERRORS:"));
            stryMutAct_9fa48("5092") ? result.errors.forEach((error, i) => {
              console.log(`  ${i + 1}. ${error}`);
            }) : (stryCov_9fa48("5092"), result.errors.slice(0, 5).forEach((error, i) => {
              if (stryMutAct_9fa48("5093")) {
                {}
              } else {
                stryCov_9fa48("5093");
                console.log(stryMutAct_9fa48("5094") ? `` : (stryCov_9fa48("5094"), `  ${stryMutAct_9fa48("5095") ? i - 1 : (stryCov_9fa48("5095"), i + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("5099") ? result.errors.length <= 5 : stryMutAct_9fa48("5098") ? result.errors.length >= 5 : stryMutAct_9fa48("5097") ? false : stryMutAct_9fa48("5096") ? true : (stryCov_9fa48("5096", "5097", "5098", "5099"), result.errors.length > 5)) {
              if (stryMutAct_9fa48("5100")) {
                {}
              } else {
                stryCov_9fa48("5100");
                console.log(stryMutAct_9fa48("5101") ? `` : (stryCov_9fa48("5101"), `  ... and ${stryMutAct_9fa48("5102") ? result.errors.length + 5 : (stryCov_9fa48("5102"), result.errors.length - 5)} more errors`));
              }
            }
          }
        }

        // Validation
        console.log(stryMutAct_9fa48("5103") ? "" : (stryCov_9fa48("5103"), "\n🔍 Validating ingestion..."));
        const validation = await unifiedPipeline.validateIngestion();
        if (stryMutAct_9fa48("5105") ? false : stryMutAct_9fa48("5104") ? true : (stryCov_9fa48("5104", "5105"), validation.isValid)) {
          if (stryMutAct_9fa48("5106")) {
            {}
          } else {
            stryCov_9fa48("5106");
            console.log(stryMutAct_9fa48("5107") ? "" : (stryCov_9fa48("5107"), "✅ Validation passed!"));
          }
        } else {
          if (stryMutAct_9fa48("5108")) {
            {}
          } else {
            stryCov_9fa48("5108");
            console.log(stryMutAct_9fa48("5109") ? "" : (stryCov_9fa48("5109"), "⚠️  Validation issues found:"));
            validation.issues.forEach((issue, i) => {
              if (stryMutAct_9fa48("5110")) {
                {}
              } else {
                stryCov_9fa48("5110");
                console.log(stryMutAct_9fa48("5111") ? `` : (stryCov_9fa48("5111"), `  ${stryMutAct_9fa48("5112") ? i - 1 : (stryCov_9fa48("5112"), i + 1)}. ${issue}`));
              }
            });
          }
        }
        if (stryMutAct_9fa48("5115") ? options.enableImageProcessing || validation.imageValidation : stryMutAct_9fa48("5114") ? false : stryMutAct_9fa48("5113") ? true : (stryCov_9fa48("5113", "5114", "5115"), options.enableImageProcessing && validation.imageValidation)) {
          if (stryMutAct_9fa48("5116")) {
            {}
          } else {
            stryCov_9fa48("5116");
            console.log(stryMutAct_9fa48("5117") ? "" : (stryCov_9fa48("5117"), "\n🖼️  Image validation:"));
            console.log(stryMutAct_9fa48("5118") ? `` : (stryCov_9fa48("5118"), `  Images processed: ${validation.imageValidation.imagesProcessed}`));
            console.log(stryMutAct_9fa48("5119") ? `` : (stryCov_9fa48("5119"), `  Images with text: ${validation.imageValidation.imagesWithText}`));
            console.log(stryMutAct_9fa48("5120") ? `` : (stryCov_9fa48("5120"), `  Average confidence: ${validation.imageValidation.averageConfidence.toFixed(1)}%`));
          }
        }
        console.log(stryMutAct_9fa48("5121") ? "" : (stryCov_9fa48("5121"), "\n🎉 Unified ingestion completed successfully!"));
        await database.close();
      }
    } catch (error) {
      if (stryMutAct_9fa48("5122")) {
        {}
      } else {
        stryCov_9fa48("5122");
        console.error(stryMutAct_9fa48("5123") ? "" : (stryCov_9fa48("5123"), "❌ Ingestion failed:"), error);
        process.exit(1);
      }
    }
  }
}
function showHelp() {
  if (stryMutAct_9fa48("5124")) {
    {}
  } else {
    stryCov_9fa48("5124");
    console.log(stryMutAct_9fa48("5125") ? `` : (stryCov_9fa48("5125"), `
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
  if (stryMutAct_9fa48("5126")) {
    {}
  } else {
    stryCov_9fa48("5126");
    console.error(stryMutAct_9fa48("5127") ? "" : (stryCov_9fa48("5127"), "❌ Unhandled error:"), error);
    process.exit(1);
  }
});