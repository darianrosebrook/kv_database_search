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
import { DocumentChunk, DocumentMetadata, ObsidianFile, ObsidianDocument } from "../types/index";
import * as fs from "fs";
import * as path from "path";
import { createHash, extractWikilinks, extractObsidianTags, cleanMarkdown, detectLanguage, generateDeterministicId, sleep, determineContentType } from "./utils";
export interface ObsidianChunkingOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
  preserveStructure?: boolean;
  includeContext?: boolean;
  cleanContent?: boolean;
}
export class ObsidianIngestionPipeline {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;
  private vaultPath: string;
  constructor(database: ObsidianDatabase, embeddingService: ObsidianEmbeddingService, vaultPath: string) {
    if (stryMutAct_9fa48("1950")) {
      {}
    } else {
      stryCov_9fa48("1950");
      this.db = database;
      this.embeddings = embeddingService;
      this.vaultPath = vaultPath;
    }
  }
  async ingestVault(options: {
    batchSize?: number;
    rateLimitMs?: number;
    skipExisting?: boolean;
    includePatterns?: string[];
    excludePatterns?: string[];
    chunkingOptions?: ObsidianChunkingOptions;
  } = {}): Promise<{
    totalFiles: number;
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
  }> {
    if (stryMutAct_9fa48("1951")) {
      {}
    } else {
      stryCov_9fa48("1951");
      const {
        batchSize = 5,
        // Smaller batches for Obsidian files
        rateLimitMs = 200,
        skipExisting = stryMutAct_9fa48("1952") ? false : (stryCov_9fa48("1952"), true),
        includePatterns = stryMutAct_9fa48("1953") ? [] : (stryCov_9fa48("1953"), [stryMutAct_9fa48("1954") ? "" : (stryCov_9fa48("1954"), "**/*.md")]),
        excludePatterns = stryMutAct_9fa48("1955") ? [] : (stryCov_9fa48("1955"), [stryMutAct_9fa48("1956") ? "" : (stryCov_9fa48("1956"), "**/.obsidian/**"), stryMutAct_9fa48("1957") ? "" : (stryCov_9fa48("1957"), "**/node_modules/**"), stryMutAct_9fa48("1958") ? "" : (stryCov_9fa48("1958"), "**/.git/**"), stryMutAct_9fa48("1959") ? "" : (stryCov_9fa48("1959"), "**/Attachments/**"), stryMutAct_9fa48("1960") ? "" : (stryCov_9fa48("1960"), "**/assets/**")]),
        chunkingOptions = {}
      } = options;
      console.log(stryMutAct_9fa48("1961") ? `` : (stryCov_9fa48("1961"), `🚀 Starting Obsidian vault ingestion: ${this.vaultPath}`));
      try {
        if (stryMutAct_9fa48("1962")) {
          {}
        } else {
          stryCov_9fa48("1962");
          // Discover all markdown files
          const markdownFiles = await this.discoverMarkdownFiles(includePatterns, excludePatterns);
          console.log(stryMutAct_9fa48("1963") ? `` : (stryCov_9fa48("1963"), `📄 Found ${markdownFiles.length} markdown files`));
          let processedFiles = 0;
          let totalChunks = 0;
          let processedChunks = 0;
          let skippedChunks = 0;
          const errors: string[] = stryMutAct_9fa48("1964") ? ["Stryker was here"] : (stryCov_9fa48("1964"), []);

          // Process files in batches
          for (let i = 0; stryMutAct_9fa48("1967") ? i >= markdownFiles.length : stryMutAct_9fa48("1966") ? i <= markdownFiles.length : stryMutAct_9fa48("1965") ? false : (stryCov_9fa48("1965", "1966", "1967"), i < markdownFiles.length); stryMutAct_9fa48("1968") ? i -= batchSize : (stryCov_9fa48("1968"), i += batchSize)) {
            if (stryMutAct_9fa48("1969")) {
              {}
            } else {
              stryCov_9fa48("1969");
              const batch = stryMutAct_9fa48("1970") ? markdownFiles : (stryCov_9fa48("1970"), markdownFiles.slice(i, stryMutAct_9fa48("1971") ? i - batchSize : (stryCov_9fa48("1971"), i + batchSize)));
              console.log(stryMutAct_9fa48("1972") ? `` : (stryCov_9fa48("1972"), `⚙️  Processing batch ${stryMutAct_9fa48("1973") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("1973"), Math.floor(stryMutAct_9fa48("1974") ? i * batchSize : (stryCov_9fa48("1974"), i / batchSize)) + 1)}/${Math.ceil(stryMutAct_9fa48("1975") ? markdownFiles.length * batchSize : (stryCov_9fa48("1975"), markdownFiles.length / batchSize))}`));
              try {
                if (stryMutAct_9fa48("1976")) {
                  {}
                } else {
                  stryCov_9fa48("1976");
                  const batchResults = await this.processBatch(batch, skipExisting, chunkingOptions);
                  stryMutAct_9fa48("1977") ? processedFiles -= batchResults.processedFiles : (stryCov_9fa48("1977"), processedFiles += batchResults.processedFiles);
                  stryMutAct_9fa48("1978") ? totalChunks -= batchResults.totalChunks : (stryCov_9fa48("1978"), totalChunks += batchResults.totalChunks);
                  stryMutAct_9fa48("1979") ? processedChunks -= batchResults.processedChunks : (stryCov_9fa48("1979"), processedChunks += batchResults.processedChunks);
                  stryMutAct_9fa48("1980") ? skippedChunks -= batchResults.skippedChunks : (stryCov_9fa48("1980"), skippedChunks += batchResults.skippedChunks);
                  errors.push(...batchResults.errors);

                  // Rate limiting
                  if (stryMutAct_9fa48("1984") ? i + batchSize >= markdownFiles.length : stryMutAct_9fa48("1983") ? i + batchSize <= markdownFiles.length : stryMutAct_9fa48("1982") ? false : stryMutAct_9fa48("1981") ? true : (stryCov_9fa48("1981", "1982", "1983", "1984"), (stryMutAct_9fa48("1985") ? i - batchSize : (stryCov_9fa48("1985"), i + batchSize)) < markdownFiles.length)) {
                    if (stryMutAct_9fa48("1986")) {
                      {}
                    } else {
                      stryCov_9fa48("1986");
                      await sleep(rateLimitMs);
                    }
                  }
                }
              } catch (error) {
                if (stryMutAct_9fa48("1987")) {
                  {}
                } else {
                  stryCov_9fa48("1987");
                  const errorMsg = stryMutAct_9fa48("1988") ? `` : (stryCov_9fa48("1988"), `Batch ${stryMutAct_9fa48("1989") ? Math.floor(i / batchSize) - 1 : (stryCov_9fa48("1989"), Math.floor(stryMutAct_9fa48("1990") ? i * batchSize : (stryCov_9fa48("1990"), i / batchSize)) + 1)} failed: ${error}`);
                  console.error(stryMutAct_9fa48("1991") ? `` : (stryCov_9fa48("1991"), `❌ ${errorMsg}`));
                  errors.push(errorMsg);
                }
              }
            }
          }
          const result = stryMutAct_9fa48("1992") ? {} : (stryCov_9fa48("1992"), {
            totalFiles: markdownFiles.length,
            processedFiles,
            totalChunks,
            processedChunks,
            skippedChunks,
            errors
          });
          console.log(stryMutAct_9fa48("1993") ? `` : (stryCov_9fa48("1993"), `✅ Obsidian ingestion complete:`), result);
          return result;
        }
      } catch (error) {
        if (stryMutAct_9fa48("1994")) {
          {}
        } else {
          stryCov_9fa48("1994");
          console.error(stryMutAct_9fa48("1995") ? `` : (stryCov_9fa48("1995"), `❌ Obsidian ingestion failed: ${error}`));
          throw new Error(stryMutAct_9fa48("1996") ? `` : (stryCov_9fa48("1996"), `Obsidian ingestion pipeline failed: ${error}`));
        }
      }
    }
  }
  private async discoverMarkdownFiles(includePatterns: string[], excludePatterns: string[]): Promise<string[]> {
    if (stryMutAct_9fa48("1997")) {
      {}
    } else {
      stryCov_9fa48("1997");
      const files: string[] = stryMutAct_9fa48("1998") ? ["Stryker was here"] : (stryCov_9fa48("1998"), []);
      const walkDir = (dir: string) => {
        if (stryMutAct_9fa48("1999")) {
          {}
        } else {
          stryCov_9fa48("1999");
          const entries = fs.readdirSync(dir, stryMutAct_9fa48("2000") ? {} : (stryCov_9fa48("2000"), {
            withFileTypes: stryMutAct_9fa48("2001") ? false : (stryCov_9fa48("2001"), true)
          }));
          for (const entry of entries) {
            if (stryMutAct_9fa48("2002")) {
              {}
            } else {
              stryCov_9fa48("2002");
              const fullPath = path.join(dir, entry.name);
              const relativePath = path.relative(this.vaultPath, fullPath);

              // Check exclude patterns
              if (stryMutAct_9fa48("2005") ? excludePatterns.every(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("2004") ? false : stryMutAct_9fa48("2003") ? true : (stryCov_9fa48("2003", "2004", "2005"), excludePatterns.some(stryMutAct_9fa48("2006") ? () => undefined : (stryCov_9fa48("2006"), pattern => this.matchesPattern(relativePath, pattern))))) {
                if (stryMutAct_9fa48("2007")) {
                  {}
                } else {
                  stryCov_9fa48("2007");
                  continue;
                }
              }
              if (stryMutAct_9fa48("2009") ? false : stryMutAct_9fa48("2008") ? true : (stryCov_9fa48("2008", "2009"), entry.isDirectory())) {
                if (stryMutAct_9fa48("2010")) {
                  {}
                } else {
                  stryCov_9fa48("2010");
                  walkDir(fullPath);
                }
              } else if (stryMutAct_9fa48("2013") ? entry.isFile() || entry.name.endsWith(".md") : stryMutAct_9fa48("2012") ? false : stryMutAct_9fa48("2011") ? true : (stryCov_9fa48("2011", "2012", "2013"), entry.isFile() && (stryMutAct_9fa48("2014") ? entry.name.startsWith(".md") : (stryCov_9fa48("2014"), entry.name.endsWith(stryMutAct_9fa48("2015") ? "" : (stryCov_9fa48("2015"), ".md")))))) {
                if (stryMutAct_9fa48("2016")) {
                  {}
                } else {
                  stryCov_9fa48("2016");
                  // Check include patterns
                  if (stryMutAct_9fa48("2019") ? includePatterns.every(pattern => this.matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("2018") ? false : stryMutAct_9fa48("2017") ? true : (stryCov_9fa48("2017", "2018", "2019"), includePatterns.some(stryMutAct_9fa48("2020") ? () => undefined : (stryCov_9fa48("2020"), pattern => this.matchesPattern(relativePath, pattern))))) {
                    if (stryMutAct_9fa48("2021")) {
                      {}
                    } else {
                      stryCov_9fa48("2021");
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
  private matchesPattern(filePath: string, pattern: string): boolean {
    if (stryMutAct_9fa48("2022")) {
      {}
    } else {
      stryCov_9fa48("2022");
      // Simple glob pattern matching
      const regexPattern = pattern.replace(/\*\*/g, stryMutAct_9fa48("2023") ? "" : (stryCov_9fa48("2023"), ".*")).replace(/\*/g, stryMutAct_9fa48("2024") ? "" : (stryCov_9fa48("2024"), "[^/]*")).replace(/\?/g, stryMutAct_9fa48("2025") ? "" : (stryCov_9fa48("2025"), "."));
      const regex = new RegExp(stryMutAct_9fa48("2026") ? `` : (stryCov_9fa48("2026"), `^${regexPattern}$`));
      return regex.test(filePath);
    }
  }
  private async processBatch(filePaths: string[], skipExisting: boolean, chunkingOptions: ObsidianChunkingOptions): Promise<{
    processedFiles: number;
    totalChunks: number;
    processedChunks: number;
    skippedChunks: number;
    errors: string[];
  }> {
    if (stryMutAct_9fa48("2027")) {
      {}
    } else {
      stryCov_9fa48("2027");
      let processedFiles = 0;
      let totalChunks = 0;
      let processedChunks = 0;
      let skippedChunks = 0;
      const errors: string[] = stryMutAct_9fa48("2028") ? ["Stryker was here"] : (stryCov_9fa48("2028"), []);
      for (const filePath of filePaths) {
        if (stryMutAct_9fa48("2029")) {
          {}
        } else {
          stryCov_9fa48("2029");
          try {
            if (stryMutAct_9fa48("2030")) {
              {}
            } else {
              stryCov_9fa48("2030");
              console.log(stryMutAct_9fa48("2031") ? `` : (stryCov_9fa48("2031"), `📖 Processing: ${path.relative(this.vaultPath, filePath)}`));

              // Parse the Obsidian file
              const obsidianFile = await this.parseObsidianFile(filePath);
              console.log(stryMutAct_9fa48("2032") ? `` : (stryCov_9fa48("2032"), `✅ Successfully parsed file: ${obsidianFile.fileName}`));

              // Skip empty files
              if (stryMutAct_9fa48("2035") ? false : stryMutAct_9fa48("2034") ? true : stryMutAct_9fa48("2033") ? obsidianFile.content.trim() : (stryCov_9fa48("2033", "2034", "2035"), !(stryMutAct_9fa48("2036") ? obsidianFile.content : (stryCov_9fa48("2036"), obsidianFile.content.trim())))) {
                if (stryMutAct_9fa48("2037")) {
                  {}
                } else {
                  stryCov_9fa48("2037");
                  console.log(stryMutAct_9fa48("2038") ? `` : (stryCov_9fa48("2038"), `⏭️  Skipping empty file: ${obsidianFile.fileName}`));
                  continue;
                }
              }

              // Create chunks from the file
              const chunks = await this.chunkObsidianFile(obsidianFile, chunkingOptions);
              stryMutAct_9fa48("2039") ? totalChunks -= chunks.length : (stryCov_9fa48("2039"), totalChunks += chunks.length);

              // Process each chunk
              for (const chunk of chunks) {
                if (stryMutAct_9fa48("2040")) {
                  {}
                } else {
                  stryCov_9fa48("2040");
                  try {
                    if (stryMutAct_9fa48("2041")) {
                      {}
                    } else {
                      stryCov_9fa48("2041");
                      // Check if chunk already exists (if skipExisting is enabled)
                      if (stryMutAct_9fa48("2043") ? false : stryMutAct_9fa48("2042") ? true : (stryCov_9fa48("2042", "2043"), skipExisting)) {
                        if (stryMutAct_9fa48("2044")) {
                          {}
                        } else {
                          stryCov_9fa48("2044");
                          const existing = await this.db.getChunkById(chunk.id);
                          if (stryMutAct_9fa48("2046") ? false : stryMutAct_9fa48("2045") ? true : (stryCov_9fa48("2045", "2046"), existing)) {
                            if (stryMutAct_9fa48("2047")) {
                              {}
                            } else {
                              stryCov_9fa48("2047");
                              console.log(stryMutAct_9fa48("2048") ? `` : (stryCov_9fa48("2048"), `⏭️  Skipping existing chunk: ${stryMutAct_9fa48("2049") ? chunk.id : (stryCov_9fa48("2049"), chunk.id.slice(0, 8))}...`));
                              stryMutAct_9fa48("2050") ? skippedChunks-- : (stryCov_9fa48("2050"), skippedChunks++);
                              continue;
                            }
                          }
                        }
                      }

                      // Generate embedding with strategy
                      console.log(stryMutAct_9fa48("2051") ? `` : (stryCov_9fa48("2051"), `🔮 Embedding chunk: ${stryMutAct_9fa48("2052") ? chunk.id : (stryCov_9fa48("2052"), chunk.id.slice(0, 8))}... (${chunk.text.length} chars)`));
                      const embeddingResult = await this.embeddings.embedWithStrategy(chunk.text, chunk.meta.contentType, stryMutAct_9fa48("2053") ? "" : (stryCov_9fa48("2053"), "knowledge-base"));

                      // Store in database
                      await this.db.upsertChunk(stryMutAct_9fa48("2054") ? {} : (stryCov_9fa48("2054"), {
                        ...chunk,
                        embedding: embeddingResult.embedding
                      }));
                      stryMutAct_9fa48("2055") ? processedChunks-- : (stryCov_9fa48("2055"), processedChunks++);
                    }
                  } catch (error) {
                    if (stryMutAct_9fa48("2056")) {
                      {}
                    } else {
                      stryCov_9fa48("2056");
                      console.error(stryMutAct_9fa48("2057") ? `` : (stryCov_9fa48("2057"), `❌ Failed to process chunk ${chunk.id}: ${error}`));
                      errors.push(stryMutAct_9fa48("2058") ? `` : (stryCov_9fa48("2058"), `Chunk ${chunk.id}: ${error}`));
                    }
                  }
                }
              }
              stryMutAct_9fa48("2059") ? processedFiles-- : (stryCov_9fa48("2059"), processedFiles++);
            }
          } catch (error) {
            if (stryMutAct_9fa48("2060")) {
              {}
            } else {
              stryCov_9fa48("2060");
              console.error(stryMutAct_9fa48("2061") ? `` : (stryCov_9fa48("2061"), `❌ Failed to process file ${filePath}: ${error}`));
              errors.push(stryMutAct_9fa48("2062") ? `` : (stryCov_9fa48("2062"), `File ${filePath}: ${error}`));
            }
          }
        }
      }
      return stryMutAct_9fa48("2063") ? {} : (stryCov_9fa48("2063"), {
        processedFiles,
        totalChunks,
        processedChunks,
        skippedChunks,
        errors
      });
    }
  }
  private async parseObsidianFile(filePath: string): Promise<ObsidianDocument> {
    if (stryMutAct_9fa48("2064")) {
      {}
    } else {
      stryCov_9fa48("2064");
      let content: string;
      try {
        if (stryMutAct_9fa48("2065")) {
          {}
        } else {
          stryCov_9fa48("2065");
          content = fs.readFileSync(filePath, stryMutAct_9fa48("2066") ? "" : (stryCov_9fa48("2066"), "utf-8"));
        }
      } catch (error) {
        if (stryMutAct_9fa48("2067")) {
          {}
        } else {
          stryCov_9fa48("2067");
          throw new Error(stryMutAct_9fa48("2068") ? `` : (stryCov_9fa48("2068"), `Failed to read file ${filePath}: ${error}`));
        }
      }

      // Parse frontmatter and content
      // TODO: Implement frontmatter parsing or use a different approach
      const parseResult = stryMutAct_9fa48("2069") ? {} : (stryCov_9fa48("2069"), {
        frontmatter: {},
        body: content
      });
      const frontmatter = stryMutAct_9fa48("2072") ? parseResult?.frontmatter && {} : stryMutAct_9fa48("2071") ? false : stryMutAct_9fa48("2070") ? true : (stryCov_9fa48("2070", "2071", "2072"), (stryMutAct_9fa48("2073") ? parseResult.frontmatter : (stryCov_9fa48("2073"), parseResult?.frontmatter)) || {});
      const body = stryMutAct_9fa48("2076") ? parseResult?.body && content : stryMutAct_9fa48("2075") ? false : stryMutAct_9fa48("2074") ? true : (stryCov_9fa48("2074", "2075", "2076"), (stryMutAct_9fa48("2077") ? parseResult.body : (stryCov_9fa48("2077"), parseResult?.body)) || content);

      // Extract wikilinks and tags
      const wikilinks = extractWikilinks(body);
      const contentTags = extractObsidianTags(body);

      // Combine frontmatter tags with content tags (defensive programming)
      const frontmatterTags = (stryMutAct_9fa48("2080") ? frontmatter || (frontmatter as any).tags : stryMutAct_9fa48("2079") ? false : stryMutAct_9fa48("2078") ? true : (stryCov_9fa48("2078", "2079", "2080"), frontmatter && (frontmatter as any).tags)) ? Array.isArray((frontmatter as any).tags) ? (frontmatter as any).tags : (stryMutAct_9fa48("2083") ? typeof (frontmatter as any).tags !== "string" : stryMutAct_9fa48("2082") ? false : stryMutAct_9fa48("2081") ? true : (stryCov_9fa48("2081", "2082", "2083"), typeof (frontmatter as any).tags === (stryMutAct_9fa48("2084") ? "" : (stryCov_9fa48("2084"), "string")))) ? stryMutAct_9fa48("2085") ? [] : (stryCov_9fa48("2085"), [(frontmatter as any).tags]) : stryMutAct_9fa48("2086") ? ["Stryker was here"] : (stryCov_9fa48("2086"), []) : stryMutAct_9fa48("2087") ? ["Stryker was here"] : (stryCov_9fa48("2087"), []);
      const allTags = stryMutAct_9fa48("2088") ? [] : (stryCov_9fa48("2088"), [...new Set(stryMutAct_9fa48("2089") ? [] : (stryCov_9fa48("2089"), [...frontmatterTags, ...contentTags]))]);

      // Get file stats
      let stats: fs.Stats;
      try {
        if (stryMutAct_9fa48("2090")) {
          {}
        } else {
          stryCov_9fa48("2090");
          stats = fs.statSync(filePath);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2091")) {
          {}
        } else {
          stryCov_9fa48("2091");
          throw new Error(stryMutAct_9fa48("2092") ? `` : (stryCov_9fa48("2092"), `Failed to get stats for file ${filePath}: ${error}`));
        }
      }

      // Calculate content statistics
      const wordCount = stryMutAct_9fa48("2093") ? body.split(/\s+/).length : (stryCov_9fa48("2093"), body.split(stryMutAct_9fa48("2095") ? /\S+/ : stryMutAct_9fa48("2094") ? /\s/ : (stryCov_9fa48("2094", "2095"), /\s+/)).filter(stryMutAct_9fa48("2096") ? () => undefined : (stryCov_9fa48("2096"), (word: string) => stryMutAct_9fa48("2100") ? word.length <= 0 : stryMutAct_9fa48("2099") ? word.length >= 0 : stryMutAct_9fa48("2098") ? false : stryMutAct_9fa48("2097") ? true : (stryCov_9fa48("2097", "2098", "2099", "2100"), word.length > 0))).length);
      const characterCount = body.length;
      const lineCount = body.split(stryMutAct_9fa48("2101") ? "" : (stryCov_9fa48("2101"), "\n")).length;

      // Parse sections
      const sections = this.parseSections(body);

      // Generate checksum
      const checksum = createHash(stryMutAct_9fa48("2102") ? "" : (stryCov_9fa48("2102"), "sha256"), content);
      const document: ObsidianDocument = stryMutAct_9fa48("2103") ? {} : (stryCov_9fa48("2103"), {
        id: path.relative(this.vaultPath, filePath),
        path: path.relative(this.vaultPath, filePath),
        filePath,
        relativePath: path.relative(this.vaultPath, filePath),
        name: path.basename(filePath, stryMutAct_9fa48("2104") ? "" : (stryCov_9fa48("2104"), ".md")),
        fileName: path.basename(filePath, stryMutAct_9fa48("2105") ? "" : (stryCov_9fa48("2105"), ".md")),
        extension: stryMutAct_9fa48("2106") ? "" : (stryCov_9fa48("2106"), ".md"),
        content: body,
        frontmatter,
        sections,
        stats: stryMutAct_9fa48("2107") ? {} : (stryCov_9fa48("2107"), {
          wordCount,
          characterCount,
          lineCount,
          headingCount: stryMutAct_9fa48("2110") ? sections?.length && 0 : stryMutAct_9fa48("2109") ? false : stryMutAct_9fa48("2108") ? true : (stryCov_9fa48("2108", "2109", "2110"), (stryMutAct_9fa48("2111") ? sections.length : (stryCov_9fa48("2111"), sections?.length)) || 0),
          linkCount: wikilinks.length,
          tagCount: allTags.length,
          size: stats.size,
          createdAt: stats.birthtime,
          updatedAt: stats.mtime
        }),
        relationships: stryMutAct_9fa48("2112") ? {} : (stryCov_9fa48("2112"), {
          wikilinks: stryMutAct_9fa48("2115") ? wikilinks?.map(link => ({
            target: link,
            display: link,
            type: "document" as const,
            position: {
              line: 0,
              column: 0,
              offset: 0
            },
            context: ""
          })) && [] : stryMutAct_9fa48("2114") ? false : stryMutAct_9fa48("2113") ? true : (stryCov_9fa48("2113", "2114", "2115"), (stryMutAct_9fa48("2116") ? wikilinks.map(link => ({
            target: link,
            display: link,
            type: "document" as const,
            position: {
              line: 0,
              column: 0,
              offset: 0
            },
            context: ""
          })) : (stryCov_9fa48("2116"), wikilinks?.map(stryMutAct_9fa48("2117") ? () => undefined : (stryCov_9fa48("2117"), link => stryMutAct_9fa48("2118") ? {} : (stryCov_9fa48("2118"), {
            target: link,
            display: link,
            type: "document" as const,
            position: stryMutAct_9fa48("2119") ? {} : (stryCov_9fa48("2119"), {
              line: 0,
              column: 0,
              offset: 0
            }),
            context: stryMutAct_9fa48("2120") ? "Stryker was here!" : (stryCov_9fa48("2120"), "")
          }))))) || (stryMutAct_9fa48("2121") ? ["Stryker was here"] : (stryCov_9fa48("2121"), []))),
          tags: stryMutAct_9fa48("2124") ? allTags && [] : stryMutAct_9fa48("2123") ? false : stryMutAct_9fa48("2122") ? true : (stryCov_9fa48("2122", "2123", "2124"), allTags || (stryMutAct_9fa48("2125") ? ["Stryker was here"] : (stryCov_9fa48("2125"), []))),
          backlinks: stryMutAct_9fa48("2126") ? ["Stryker was here"] : (stryCov_9fa48("2126"), []) // Will be populated later
        }),
        metadata: stryMutAct_9fa48("2127") ? {} : (stryCov_9fa48("2127"), {
          created: stats.birthtime,
          modified: stats.mtime,
          checksum,
          size: stats.size,
          lastIndexed: new Date(),
          processingErrors: stryMutAct_9fa48("2128") ? ["Stryker was here"] : (stryCov_9fa48("2128"), [])
        })
      });
      return document;
    }
  }
  private parseSections(content: string): ObsidianDocument["sections"] {
    if (stryMutAct_9fa48("2129")) {
      {}
    } else {
      stryCov_9fa48("2129");
      const sections: NonNullable<ObsidianDocument["sections"]> = stryMutAct_9fa48("2130") ? ["Stryker was here"] : (stryCov_9fa48("2130"), []);
      const lines = content.split(stryMutAct_9fa48("2131") ? "" : (stryCov_9fa48("2131"), "\n"));
      type SectionType = NonNullable<ObsidianDocument["sections"]>[0];
      let currentSection: SectionType | null = null;
      for (let i = 0; stryMutAct_9fa48("2134") ? i >= lines.length : stryMutAct_9fa48("2133") ? i <= lines.length : stryMutAct_9fa48("2132") ? false : (stryCov_9fa48("2132", "2133", "2134"), i < lines.length); stryMutAct_9fa48("2135") ? i-- : (stryCov_9fa48("2135"), i++)) {
        if (stryMutAct_9fa48("2136")) {
          {}
        } else {
          stryCov_9fa48("2136");
          const line = lines[i];
          const headerMatch = line.match(stryMutAct_9fa48("2142") ? /^(#{1,6})\s+(.)$/ : stryMutAct_9fa48("2141") ? /^(#{1,6})\S+(.+)$/ : stryMutAct_9fa48("2140") ? /^(#{1,6})\s(.+)$/ : stryMutAct_9fa48("2139") ? /^(#)\s+(.+)$/ : stryMutAct_9fa48("2138") ? /^(#{1,6})\s+(.+)/ : stryMutAct_9fa48("2137") ? /(#{1,6})\s+(.+)$/ : (stryCov_9fa48("2137", "2138", "2139", "2140", "2141", "2142"), /^(#{1,6})\s+(.+)$/));
          if (stryMutAct_9fa48("2144") ? false : stryMutAct_9fa48("2143") ? true : (stryCov_9fa48("2143", "2144"), headerMatch)) {
            if (stryMutAct_9fa48("2145")) {
              {}
            } else {
              stryCov_9fa48("2145");
              // Save previous section if exists
              if (stryMutAct_9fa48("2147") ? false : stryMutAct_9fa48("2146") ? true : (stryCov_9fa48("2146", "2147"), currentSection)) {
                if (stryMutAct_9fa48("2148")) {
                  {}
                } else {
                  stryCov_9fa48("2148");
                  currentSection.endLine = stryMutAct_9fa48("2149") ? i + 1 : (stryCov_9fa48("2149"), i - 1);
                  sections.push(currentSection);
                }
              }

              // Start new section
              const level = parseInt(headerMatch[1].length.toString());
              const title = headerMatch[2];
              currentSection = stryMutAct_9fa48("2150") ? {} : (stryCov_9fa48("2150"), {
                level,
                title,
                content: stryMutAct_9fa48("2151") ? "Stryker was here!" : (stryCov_9fa48("2151"), ""),
                startLine: i,
                endLine: i,
                wikilinks: stryMutAct_9fa48("2152") ? ["Stryker was here"] : (stryCov_9fa48("2152"), []),
                tags: stryMutAct_9fa48("2153") ? ["Stryker was here"] : (stryCov_9fa48("2153"), [])
              });
            }
          } else if (stryMutAct_9fa48("2155") ? false : stryMutAct_9fa48("2154") ? true : (stryCov_9fa48("2154", "2155"), currentSection)) {
            if (stryMutAct_9fa48("2156")) {
              {}
            } else {
              stryCov_9fa48("2156");
              // Add content to current section
              stryMutAct_9fa48("2157") ? currentSection.content -= line + "\n" : (stryCov_9fa48("2157"), currentSection.content += line + (stryMutAct_9fa48("2158") ? "" : (stryCov_9fa48("2158"), "\n")));

              // Extract wikilinks and tags from this line
              currentSection.wikilinks.push(...extractWikilinks(line));
              currentSection.tags.push(...extractObsidianTags(line));
            }
          }
        }
      }

      // Add final section
      if (stryMutAct_9fa48("2160") ? false : stryMutAct_9fa48("2159") ? true : (stryCov_9fa48("2159", "2160"), currentSection)) {
        if (stryMutAct_9fa48("2161")) {
          {}
        } else {
          stryCov_9fa48("2161");
          currentSection.endLine = stryMutAct_9fa48("2162") ? lines.length + 1 : (stryCov_9fa48("2162"), lines.length - 1);
          sections.push(currentSection);
        }
      }

      // Deduplicate wikilinks and tags
      sections.forEach((section: any) => {
        if (stryMutAct_9fa48("2163")) {
          {}
        } else {
          stryCov_9fa48("2163");
          section.wikilinks = stryMutAct_9fa48("2164") ? [] : (stryCov_9fa48("2164"), [...new Set(section.wikilinks)]);
          section.tags = stryMutAct_9fa48("2165") ? [] : (stryCov_9fa48("2165"), [...new Set(section.tags)]);
        }
      });
      return sections;
    }
  }
  private async chunkObsidianFile(document: ObsidianDocument, options: ObsidianChunkingOptions): Promise<DocumentChunk[]> {
    if (stryMutAct_9fa48("2166")) {
      {}
    } else {
      stryCov_9fa48("2166");
      const {
        maxChunkSize = 800,
        // Smaller chunks for better semantic search
        chunkOverlap = 100,
        preserveStructure = stryMutAct_9fa48("2167") ? false : (stryCov_9fa48("2167"), true),
        includeContext = stryMutAct_9fa48("2168") ? false : (stryCov_9fa48("2168"), true),
        cleanContent = stryMutAct_9fa48("2169") ? false : (stryCov_9fa48("2169"), true)
      } = options;
      const chunks: DocumentChunk[] = stryMutAct_9fa48("2170") ? ["Stryker was here"] : (stryCov_9fa48("2170"), []);

      // TODO: Implement proper content type determination
      const contentType = determineContentType(stryMutAct_9fa48("2173") ? document.filePath && document.path : stryMutAct_9fa48("2172") ? false : stryMutAct_9fa48("2171") ? true : (stryCov_9fa48("2171", "2172", "2173"), document.filePath || document.path));

      // Create base metadata
      const docPath = stryMutAct_9fa48("2176") ? (document.relativePath || document.path) && "unknown" : stryMutAct_9fa48("2175") ? false : stryMutAct_9fa48("2174") ? true : (stryCov_9fa48("2174", "2175", "2176"), (stryMutAct_9fa48("2178") ? document.relativePath && document.path : stryMutAct_9fa48("2177") ? false : (stryCov_9fa48("2177", "2178"), document.relativePath || document.path)) || (stryMutAct_9fa48("2179") ? "" : (stryCov_9fa48("2179"), "unknown")));
      const docName = stryMutAct_9fa48("2182") ? (document.fileName || document.name) && "untitled" : stryMutAct_9fa48("2181") ? false : stryMutAct_9fa48("2180") ? true : (stryCov_9fa48("2180", "2181", "2182"), (stryMutAct_9fa48("2184") ? document.fileName && document.name : stryMutAct_9fa48("2183") ? false : (stryCov_9fa48("2183", "2184"), document.fileName || document.name)) || (stryMutAct_9fa48("2185") ? "" : (stryCov_9fa48("2185"), "untitled")));
      const baseMetadata: DocumentMetadata = stryMutAct_9fa48("2186") ? {} : (stryCov_9fa48("2186"), {
        uri: stryMutAct_9fa48("2187") ? `` : (stryCov_9fa48("2187"), `obsidian://${docPath}`),
        section: docName,
        breadcrumbs: this.generateBreadcrumbs(docPath),
        contentType,
        sourceType: stryMutAct_9fa48("2188") ? "" : (stryCov_9fa48("2188"), "obsidian"),
        sourceDocumentId: docName,
        lang: stryMutAct_9fa48("2189") ? "" : (stryCov_9fa48("2189"), "en"),
        acl: stryMutAct_9fa48("2190") ? "" : (stryCov_9fa48("2190"), "public"),
        updatedAt: stryMutAct_9fa48("2193") ? document.stats.updatedAt && new Date() : stryMutAct_9fa48("2192") ? false : stryMutAct_9fa48("2191") ? true : (stryCov_9fa48("2191", "2192", "2193"), document.stats.updatedAt || new Date()),
        createdAt: stryMutAct_9fa48("2196") ? document.stats.createdAt && new Date() : stryMutAct_9fa48("2195") ? false : stryMutAct_9fa48("2194") ? true : (stryCov_9fa48("2194", "2195", "2196"), document.stats.createdAt || new Date()),
        chunkIndex: 0,
        chunkCount: 1,
        // Enhanced Obsidian-specific metadata
        obsidianFile: stryMutAct_9fa48("2197") ? {} : (stryCov_9fa48("2197"), {
          fileName: stryMutAct_9fa48("2200") ? (document.fileName || document.name) && "untitled" : stryMutAct_9fa48("2199") ? false : stryMutAct_9fa48("2198") ? true : (stryCov_9fa48("2198", "2199", "2200"), (stryMutAct_9fa48("2202") ? document.fileName && document.name : stryMutAct_9fa48("2201") ? false : (stryCov_9fa48("2201", "2202"), document.fileName || document.name)) || (stryMutAct_9fa48("2203") ? "" : (stryCov_9fa48("2203"), "untitled"))),
          filePath: stryMutAct_9fa48("2206") ? (document.relativePath || document.path) && "unknown" : stryMutAct_9fa48("2205") ? false : stryMutAct_9fa48("2204") ? true : (stryCov_9fa48("2204", "2205", "2206"), (stryMutAct_9fa48("2208") ? document.relativePath && document.path : stryMutAct_9fa48("2207") ? false : (stryCov_9fa48("2207", "2208"), document.relativePath || document.path)) || (stryMutAct_9fa48("2209") ? "" : (stryCov_9fa48("2209"), "unknown"))),
          frontmatter: document.frontmatter,
          wikilinks: stryMutAct_9fa48("2212") ? document.relationships.wikilinks?.map((w: any) => w.target) && [] : stryMutAct_9fa48("2211") ? false : stryMutAct_9fa48("2210") ? true : (stryCov_9fa48("2210", "2211", "2212"), (stryMutAct_9fa48("2213") ? document.relationships.wikilinks.map((w: any) => w.target) : (stryCov_9fa48("2213"), document.relationships.wikilinks?.map(stryMutAct_9fa48("2214") ? () => undefined : (stryCov_9fa48("2214"), (w: any) => w.target)))) || (stryMutAct_9fa48("2215") ? ["Stryker was here"] : (stryCov_9fa48("2215"), []))),
          tags: stryMutAct_9fa48("2218") ? document.relationships.tags as any[] && [] : stryMutAct_9fa48("2217") ? false : stryMutAct_9fa48("2216") ? true : (stryCov_9fa48("2216", "2217", "2218"), document.relationships.tags as any[] || (stryMutAct_9fa48("2219") ? ["Stryker was here"] : (stryCov_9fa48("2219"), []))),
          checksum: document.metadata.checksum,
          stats: stryMutAct_9fa48("2220") ? {} : (stryCov_9fa48("2220"), {
            wordCount: document.stats.wordCount as any,
            // TODO: Fix type
            characterCount: document.stats.characterCount,
            lineCount: document.stats.lineCount
          })
        })
      });
      if (stryMutAct_9fa48("2222") ? false : stryMutAct_9fa48("2221") ? true : (stryCov_9fa48("2221", "2222"), preserveStructure)) {
        if (stryMutAct_9fa48("2223")) {
          {}
        } else {
          stryCov_9fa48("2223");
          // Structure-aware chunking for Obsidian files
          const obsidianFile: ObsidianFile = stryMutAct_9fa48("2224") ? {} : (stryCov_9fa48("2224"), {
            filePath: stryMutAct_9fa48("2227") ? (document.filePath || document.path) && "unknown" : stryMutAct_9fa48("2226") ? false : stryMutAct_9fa48("2225") ? true : (stryCov_9fa48("2225", "2226", "2227"), (stryMutAct_9fa48("2229") ? document.filePath && document.path : stryMutAct_9fa48("2228") ? false : (stryCov_9fa48("2228", "2229"), document.filePath || document.path)) || (stryMutAct_9fa48("2230") ? "" : (stryCov_9fa48("2230"), "unknown"))),
            fileName: stryMutAct_9fa48("2233") ? (document.fileName || document.name) && "untitled" : stryMutAct_9fa48("2232") ? false : stryMutAct_9fa48("2231") ? true : (stryCov_9fa48("2231", "2232", "2233"), (stryMutAct_9fa48("2235") ? document.fileName && document.name : stryMutAct_9fa48("2234") ? false : (stryCov_9fa48("2234", "2235"), document.fileName || document.name)) || (stryMutAct_9fa48("2236") ? "" : (stryCov_9fa48("2236"), "untitled"))),
            content: document.content,
            frontmatter: document.frontmatter,
            wikilinks: stryMutAct_9fa48("2239") ? document.relationships.wikilinks?.map(w => w.target) && [] : stryMutAct_9fa48("2238") ? false : stryMutAct_9fa48("2237") ? true : (stryCov_9fa48("2237", "2238", "2239"), (stryMutAct_9fa48("2240") ? document.relationships.wikilinks.map(w => w.target) : (stryCov_9fa48("2240"), document.relationships.wikilinks?.map(stryMutAct_9fa48("2241") ? () => undefined : (stryCov_9fa48("2241"), w => w.target)))) || (stryMutAct_9fa48("2242") ? ["Stryker was here"] : (stryCov_9fa48("2242"), []))),
            tags: stryMutAct_9fa48("2245") ? document.relationships.tags && [] : stryMutAct_9fa48("2244") ? false : stryMutAct_9fa48("2243") ? true : (stryCov_9fa48("2243", "2244", "2245"), document.relationships.tags || (stryMutAct_9fa48("2246") ? ["Stryker was here"] : (stryCov_9fa48("2246"), []))),
            createdAt: document.metadata.created,
            updatedAt: document.metadata.modified
          });
          chunks.push(...this.chunkByStructure(obsidianFile, baseMetadata, maxChunkSize, includeContext, cleanContent));
        }
      } else {
        if (stryMutAct_9fa48("2247")) {
          {}
        } else {
          stryCov_9fa48("2247");
          // Simple sliding window chunking
          chunks.push(...this.chunkBySize(document.content, baseMetadata, maxChunkSize, chunkOverlap, cleanContent));
        }
      }
      return chunks;
    }
  }
  private chunkByStructure(file: ObsidianFile, baseMetadata: DocumentMetadata, maxChunkSize: number, includeContext: boolean, cleanContent: boolean): DocumentChunk[] {
    if (stryMutAct_9fa48("2248")) {
      {}
    } else {
      stryCov_9fa48("2248");
      const chunks: DocumentChunk[] = stryMutAct_9fa48("2249") ? ["Stryker was here"] : (stryCov_9fa48("2249"), []);
      const lines = file.content.split(stryMutAct_9fa48("2250") ? "" : (stryCov_9fa48("2250"), "\n"));
      let currentChunk = stryMutAct_9fa48("2251") ? "Stryker was here!" : (stryCov_9fa48("2251"), "");
      let currentSection = file.fileName;
      let chunkIndex = 0;
      for (let i = 0; stryMutAct_9fa48("2254") ? i >= lines.length : stryMutAct_9fa48("2253") ? i <= lines.length : stryMutAct_9fa48("2252") ? false : (stryCov_9fa48("2252", "2253", "2254"), i < lines.length); stryMutAct_9fa48("2255") ? i-- : (stryCov_9fa48("2255"), i++)) {
        if (stryMutAct_9fa48("2256")) {
          {}
        } else {
          stryCov_9fa48("2256");
          const line = lines[i];

          // Check for headers
          const headerMatch = line.match(stryMutAct_9fa48("2262") ? /^(#{1,6})\s+(.)$/ : stryMutAct_9fa48("2261") ? /^(#{1,6})\S+(.+)$/ : stryMutAct_9fa48("2260") ? /^(#{1,6})\s(.+)$/ : stryMutAct_9fa48("2259") ? /^(#)\s+(.+)$/ : stryMutAct_9fa48("2258") ? /^(#{1,6})\s+(.+)/ : stryMutAct_9fa48("2257") ? /(#{1,6})\s+(.+)$/ : (stryCov_9fa48("2257", "2258", "2259", "2260", "2261", "2262"), /^(#{1,6})\s+(.+)$/));
          if (stryMutAct_9fa48("2264") ? false : stryMutAct_9fa48("2263") ? true : (stryCov_9fa48("2263", "2264"), headerMatch)) {
            if (stryMutAct_9fa48("2265")) {
              {}
            } else {
              stryCov_9fa48("2265");
              // Save previous chunk if it exists
              if (stryMutAct_9fa48("2268") ? currentChunk : stryMutAct_9fa48("2267") ? false : stryMutAct_9fa48("2266") ? true : (stryCov_9fa48("2266", "2267", "2268"), currentChunk.trim())) {
                if (stryMutAct_9fa48("2269")) {
                  {}
                } else {
                  stryCov_9fa48("2269");
                  chunks.push(this.createChunk(file, stryMutAct_9fa48("2270") ? currentChunk : (stryCov_9fa48("2270"), currentChunk.trim()), currentSection, baseMetadata, stryMutAct_9fa48("2271") ? chunkIndex-- : (stryCov_9fa48("2271"), chunkIndex++), includeContext, cleanContent));
                }
              }

              // Start new chunk
              currentSection = headerMatch[2];
              currentChunk = line + (stryMutAct_9fa48("2272") ? "" : (stryCov_9fa48("2272"), "\n"));
            }
          } else {
            if (stryMutAct_9fa48("2273")) {
              {}
            } else {
              stryCov_9fa48("2273");
              stryMutAct_9fa48("2274") ? currentChunk -= line + "\n" : (stryCov_9fa48("2274"), currentChunk += line + (stryMutAct_9fa48("2275") ? "" : (stryCov_9fa48("2275"), "\n")));

              // Check if chunk is getting too large
              if (stryMutAct_9fa48("2279") ? currentChunk.length <= maxChunkSize : stryMutAct_9fa48("2278") ? currentChunk.length >= maxChunkSize : stryMutAct_9fa48("2277") ? false : stryMutAct_9fa48("2276") ? true : (stryCov_9fa48("2276", "2277", "2278", "2279"), currentChunk.length > maxChunkSize)) {
                if (stryMutAct_9fa48("2280")) {
                  {}
                } else {
                  stryCov_9fa48("2280");
                  chunks.push(this.createChunk(file, stryMutAct_9fa48("2281") ? currentChunk : (stryCov_9fa48("2281"), currentChunk.trim()), currentSection, baseMetadata, stryMutAct_9fa48("2282") ? chunkIndex-- : (stryCov_9fa48("2282"), chunkIndex++), includeContext, cleanContent));
                  currentChunk = stryMutAct_9fa48("2283") ? "Stryker was here!" : (stryCov_9fa48("2283"), "");
                }
              }
            }
          }
        }
      }

      // Add final chunk
      if (stryMutAct_9fa48("2286") ? currentChunk : stryMutAct_9fa48("2285") ? false : stryMutAct_9fa48("2284") ? true : (stryCov_9fa48("2284", "2285", "2286"), currentChunk.trim())) {
        if (stryMutAct_9fa48("2287")) {
          {}
        } else {
          stryCov_9fa48("2287");
          chunks.push(this.createChunk(file, stryMutAct_9fa48("2288") ? currentChunk : (stryCov_9fa48("2288"), currentChunk.trim()), currentSection, baseMetadata, stryMutAct_9fa48("2289") ? chunkIndex-- : (stryCov_9fa48("2289"), chunkIndex++), includeContext, cleanContent));
        }
      }
      return chunks;
    }
  }
  private chunkBySize(content: string, baseMetadata: DocumentMetadata, maxChunkSize: number, chunkOverlap: number, cleanContent: boolean): DocumentChunk[] {
    if (stryMutAct_9fa48("2290")) {
      {}
    } else {
      stryCov_9fa48("2290");
      const chunks: DocumentChunk[] = stryMutAct_9fa48("2291") ? ["Stryker was here"] : (stryCov_9fa48("2291"), []);
      const processedContent = cleanContent ? cleanMarkdown(content) : content;
      const words = processedContent.split(stryMutAct_9fa48("2293") ? /\S+/ : stryMutAct_9fa48("2292") ? /\s/ : (stryCov_9fa48("2292", "2293"), /\s+/));
      let chunkIndex = 0;
      for (let i = 0; stryMutAct_9fa48("2296") ? i >= words.length : stryMutAct_9fa48("2295") ? i <= words.length : stryMutAct_9fa48("2294") ? false : (stryCov_9fa48("2294", "2295", "2296"), i < words.length); stryMutAct_9fa48("2297") ? i -= maxChunkSize - chunkOverlap : (stryCov_9fa48("2297"), i += stryMutAct_9fa48("2298") ? maxChunkSize + chunkOverlap : (stryCov_9fa48("2298"), maxChunkSize - chunkOverlap))) {
        if (stryMutAct_9fa48("2299")) {
          {}
        } else {
          stryCov_9fa48("2299");
          const chunkWords = stryMutAct_9fa48("2300") ? words : (stryCov_9fa48("2300"), words.slice(i, stryMutAct_9fa48("2301") ? i - maxChunkSize : (stryCov_9fa48("2301"), i + maxChunkSize)));
          const chunkText = chunkWords.join(stryMutAct_9fa48("2302") ? "" : (stryCov_9fa48("2302"), " "));
          if (stryMutAct_9fa48("2305") ? chunkText : stryMutAct_9fa48("2304") ? false : stryMutAct_9fa48("2303") ? true : (stryCov_9fa48("2303", "2304", "2305"), chunkText.trim())) {
            if (stryMutAct_9fa48("2306")) {
              {}
            } else {
              stryCov_9fa48("2306");
              const chunkId = this.generateChunkId(baseMetadata.sourceDocumentId!, chunkIndex);
              chunks.push(stryMutAct_9fa48("2307") ? {} : (stryCov_9fa48("2307"), {
                id: chunkId,
                text: stryMutAct_9fa48("2308") ? chunkText : (stryCov_9fa48("2308"), chunkText.trim()),
                meta: stryMutAct_9fa48("2309") ? {} : (stryCov_9fa48("2309"), {
                  ...baseMetadata,
                  section: stryMutAct_9fa48("2310") ? `` : (stryCov_9fa48("2310"), `${baseMetadata.section} (Part ${stryMutAct_9fa48("2311") ? chunkIndex - 1 : (stryCov_9fa48("2311"), chunkIndex + 1)})`),
                  chunkIndex,
                  chunkCount: Math.ceil(stryMutAct_9fa48("2312") ? words.length * (maxChunkSize - chunkOverlap) : (stryCov_9fa48("2312"), words.length / (stryMutAct_9fa48("2313") ? maxChunkSize + chunkOverlap : (stryCov_9fa48("2313"), maxChunkSize - chunkOverlap))))
                })
              }));
              stryMutAct_9fa48("2314") ? chunkIndex-- : (stryCov_9fa48("2314"), chunkIndex++);
            }
          }
        }
      }
      return chunks;
    }
  }
  private createChunk(file: ObsidianFile, text: string, section: string, baseMetadata: DocumentMetadata, chunkIndex: number, includeContext: boolean, cleanContent: boolean): DocumentChunk {
    if (stryMutAct_9fa48("2315")) {
      {}
    } else {
      stryCov_9fa48("2315");
      const chunkId = this.generateChunkId(file.fileName, chunkIndex);
      let enhancedText = cleanContent ? cleanMarkdown(text) : text;
      if (stryMutAct_9fa48("2317") ? false : stryMutAct_9fa48("2316") ? true : (stryCov_9fa48("2316", "2317"), includeContext)) {
        if (stryMutAct_9fa48("2318")) {
          {}
        } else {
          stryCov_9fa48("2318");
          // Add context from frontmatter and file structure
          const contextParts: string[] = stryMutAct_9fa48("2319") ? ["Stryker was here"] : (stryCov_9fa48("2319"), []);
          if (stryMutAct_9fa48("2322") ? file.frontmatter.title || file.frontmatter.title !== file.fileName : stryMutAct_9fa48("2321") ? false : stryMutAct_9fa48("2320") ? true : (stryCov_9fa48("2320", "2321", "2322"), file.frontmatter.title && (stryMutAct_9fa48("2324") ? file.frontmatter.title === file.fileName : stryMutAct_9fa48("2323") ? true : (stryCov_9fa48("2323", "2324"), file.frontmatter.title !== file.fileName)))) {
            if (stryMutAct_9fa48("2325")) {
              {}
            } else {
              stryCov_9fa48("2325");
              contextParts.push(stryMutAct_9fa48("2326") ? `` : (stryCov_9fa48("2326"), `Title: ${file.frontmatter.title}`));
            }
          }
          if (stryMutAct_9fa48("2330") ? file.tags?.length <= 0 : stryMutAct_9fa48("2329") ? file.tags?.length >= 0 : stryMutAct_9fa48("2328") ? false : stryMutAct_9fa48("2327") ? true : (stryCov_9fa48("2327", "2328", "2329", "2330"), (stryMutAct_9fa48("2331") ? file.tags.length : (stryCov_9fa48("2331"), file.tags?.length)) > 0)) {
            if (stryMutAct_9fa48("2332")) {
              {}
            } else {
              stryCov_9fa48("2332");
              contextParts.push(stryMutAct_9fa48("2333") ? `` : (stryCov_9fa48("2333"), `Tags: ${stryMutAct_9fa48("2334") ? file.tags.join(", ") : (stryCov_9fa48("2334"), file.tags.slice(0, 5).join(stryMutAct_9fa48("2335") ? "" : (stryCov_9fa48("2335"), ", ")))}`));
            }
          }
          if (stryMutAct_9fa48("2339") ? file.wikilinks?.length <= 0 : stryMutAct_9fa48("2338") ? file.wikilinks?.length >= 0 : stryMutAct_9fa48("2337") ? false : stryMutAct_9fa48("2336") ? true : (stryCov_9fa48("2336", "2337", "2338", "2339"), (stryMutAct_9fa48("2340") ? file.wikilinks.length : (stryCov_9fa48("2340"), file.wikilinks?.length)) > 0)) {
            if (stryMutAct_9fa48("2341")) {
              {}
            } else {
              stryCov_9fa48("2341");
              contextParts.push(stryMutAct_9fa48("2342") ? `` : (stryCov_9fa48("2342"), `Related: ${stryMutAct_9fa48("2343") ? file.wikilinks.join(", ") : (stryCov_9fa48("2343"), file.wikilinks.slice(0, 3).join(stryMutAct_9fa48("2344") ? "" : (stryCov_9fa48("2344"), ", ")))}`));
            }
          }
          if (stryMutAct_9fa48("2348") ? contextParts.length <= 0 : stryMutAct_9fa48("2347") ? contextParts.length >= 0 : stryMutAct_9fa48("2346") ? false : stryMutAct_9fa48("2345") ? true : (stryCov_9fa48("2345", "2346", "2347", "2348"), contextParts.length > 0)) {
            if (stryMutAct_9fa48("2349")) {
              {}
            } else {
              stryCov_9fa48("2349");
              enhancedText = stryMutAct_9fa48("2350") ? `` : (stryCov_9fa48("2350"), `${contextParts.join(stryMutAct_9fa48("2351") ? "" : (stryCov_9fa48("2351"), " | "))}\n\n${enhancedText}`);
            }
          }
        }
      }
      return stryMutAct_9fa48("2352") ? {} : (stryCov_9fa48("2352"), {
        id: chunkId,
        text: enhancedText,
        meta: stryMutAct_9fa48("2353") ? {} : (stryCov_9fa48("2353"), {
          ...baseMetadata,
          section,
          chunkIndex
        })
      });
    }
  }
  private generateChunkId(fileName: string, chunkIndex: number): string {
    if (stryMutAct_9fa48("2354")) {
      {}
    } else {
      stryCov_9fa48("2354");
      const hash = generateDeterministicId(fileName, chunkIndex);
      return stryMutAct_9fa48("2355") ? `` : (stryCov_9fa48("2355"), `obsidian_${fileName}_${chunkIndex}_${hash}`);
    }
  }
  async validateIngestion(sampleSize = 5): Promise<{
    isValid: boolean;
    issues: string[];
    sampleResults: Array<{
      id: string;
      textPreview: string;
      hasEmbedding: boolean;
      metadataValid: boolean;
      obsidianMetadata?: any;
    }>;
  }> {
    if (stryMutAct_9fa48("2356")) {
      {}
    } else {
      stryCov_9fa48("2356");
      const issues: string[] = stryMutAct_9fa48("2357") ? ["Stryker was here"] : (stryCov_9fa48("2357"), []);
      const sampleResults: Array<{
        id: string;
        textPreview: string;
        hasEmbedding: boolean;
        metadataValid: boolean;
        obsidianMetadata?: any;
      }> = stryMutAct_9fa48("2358") ? ["Stryker was here"] : (stryCov_9fa48("2358"), []);
      try {
        if (stryMutAct_9fa48("2359")) {
          {}
        } else {
          stryCov_9fa48("2359");
          // Get database stats
          const stats = await this.db.getStats();
          console.log(stryMutAct_9fa48("2360") ? `` : (stryCov_9fa48("2360"), `📊 Database stats:`), stats);
          if (stryMutAct_9fa48("2363") ? stats.totalChunks !== 0 : stryMutAct_9fa48("2362") ? false : stryMutAct_9fa48("2361") ? true : (stryCov_9fa48("2361", "2362", "2363"), stats.totalChunks === 0)) {
            if (stryMutAct_9fa48("2364")) {
              {}
            } else {
              stryCov_9fa48("2364");
              issues.push(stryMutAct_9fa48("2365") ? "" : (stryCov_9fa48("2365"), "No chunks found in database"));
              return stryMutAct_9fa48("2366") ? {} : (stryCov_9fa48("2366"), {
                isValid: stryMutAct_9fa48("2367") ? true : (stryCov_9fa48("2367"), false),
                issues,
                sampleResults
              });
            }
          }

          // Test search functionality with Obsidian-specific queries
          const testQueries = stryMutAct_9fa48("2368") ? [] : (stryCov_9fa48("2368"), [stryMutAct_9fa48("2369") ? "" : (stryCov_9fa48("2369"), "design system"), stryMutAct_9fa48("2370") ? "" : (stryCov_9fa48("2370"), "MOC"), stryMutAct_9fa48("2371") ? "" : (stryCov_9fa48("2371"), "accessibility"), stryMutAct_9fa48("2372") ? "" : (stryCov_9fa48("2372"), "components")]);
          for (const query of testQueries) {
            if (stryMutAct_9fa48("2373")) {
              {}
            } else {
              stryCov_9fa48("2373");
              try {
                if (stryMutAct_9fa48("2374")) {
                  {}
                } else {
                  stryCov_9fa48("2374");
                  const testEmbedding = await this.embeddings.embed(query);
                  const searchResults = await this.db.search(testEmbedding, sampleSize);
                  for (const result of stryMutAct_9fa48("2375") ? searchResults : (stryCov_9fa48("2375"), searchResults.slice(0, 2))) {
                    if (stryMutAct_9fa48("2376")) {
                      {}
                    } else {
                      stryCov_9fa48("2376");
                      const metadataValid = this.validateObsidianMetadata(result.meta);
                      sampleResults.push(stryMutAct_9fa48("2377") ? {} : (stryCov_9fa48("2377"), {
                        id: result.id,
                        textPreview: (stryMutAct_9fa48("2378") ? result.text : (stryCov_9fa48("2378"), result.text.slice(0, 150))) + (stryMutAct_9fa48("2379") ? "" : (stryCov_9fa48("2379"), "...")),
                        hasEmbedding: stryMutAct_9fa48("2380") ? false : (stryCov_9fa48("2380"), true),
                        metadataValid,
                        obsidianMetadata: result.meta.obsidianFile
                      }));
                      if (stryMutAct_9fa48("2383") ? false : stryMutAct_9fa48("2382") ? true : stryMutAct_9fa48("2381") ? metadataValid : (stryCov_9fa48("2381", "2382", "2383"), !metadataValid)) {
                        if (stryMutAct_9fa48("2384")) {
                          {}
                        } else {
                          stryCov_9fa48("2384");
                          issues.push(stryMutAct_9fa48("2385") ? `` : (stryCov_9fa48("2385"), `Invalid Obsidian metadata for chunk ${result.id}`));
                        }
                      }
                    }
                  }
                }
              } catch (error) {
                if (stryMutAct_9fa48("2386")) {
                  {}
                } else {
                  stryCov_9fa48("2386");
                  issues.push(stryMutAct_9fa48("2387") ? `` : (stryCov_9fa48("2387"), `Search test failed for query "${query}": ${error}`));
                }
              }
            }
          }
          return stryMutAct_9fa48("2388") ? {} : (stryCov_9fa48("2388"), {
            isValid: stryMutAct_9fa48("2391") ? issues.length !== 0 : stryMutAct_9fa48("2390") ? false : stryMutAct_9fa48("2389") ? true : (stryCov_9fa48("2389", "2390", "2391"), issues.length === 0),
            issues,
            sampleResults
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("2392")) {
          {}
        } else {
          stryCov_9fa48("2392");
          issues.push(stryMutAct_9fa48("2393") ? `` : (stryCov_9fa48("2393"), `Validation failed: ${error}`));
          return stryMutAct_9fa48("2394") ? {} : (stryCov_9fa48("2394"), {
            isValid: stryMutAct_9fa48("2395") ? true : (stryCov_9fa48("2395"), false),
            issues,
            sampleResults
          });
        }
      }
    }
  }
  private validateObsidianMetadata(meta: any): boolean {
    if (stryMutAct_9fa48("2396")) {
      {}
    } else {
      stryCov_9fa48("2396");
      const required = stryMutAct_9fa48("2397") ? [] : (stryCov_9fa48("2397"), [stryMutAct_9fa48("2398") ? "" : (stryCov_9fa48("2398"), "uri"), stryMutAct_9fa48("2399") ? "" : (stryCov_9fa48("2399"), "section"), stryMutAct_9fa48("2400") ? "" : (stryCov_9fa48("2400"), "sourceType"), stryMutAct_9fa48("2401") ? "" : (stryCov_9fa48("2401"), "sourceDocumentId"), stryMutAct_9fa48("2402") ? "" : (stryCov_9fa48("2402"), "obsidianFile")]);
      const hasRequired = stryMutAct_9fa48("2403") ? required.some(field => Object.prototype.hasOwnProperty.call(meta, field)) : (stryCov_9fa48("2403"), required.every(stryMutAct_9fa48("2404") ? () => undefined : (stryCov_9fa48("2404"), field => Object.prototype.hasOwnProperty.call(meta, field))));
      const hasObsidianFields = stryMutAct_9fa48("2407") ? meta.obsidianFile && meta.obsidianFile.fileName || meta.obsidianFile.filePath : stryMutAct_9fa48("2406") ? false : stryMutAct_9fa48("2405") ? true : (stryCov_9fa48("2405", "2406", "2407"), (stryMutAct_9fa48("2409") ? meta.obsidianFile || meta.obsidianFile.fileName : stryMutAct_9fa48("2408") ? true : (stryCov_9fa48("2408", "2409"), meta.obsidianFile && meta.obsidianFile.fileName)) && meta.obsidianFile.filePath);
      return stryMutAct_9fa48("2412") ? hasRequired || hasObsidianFields : stryMutAct_9fa48("2411") ? false : stryMutAct_9fa48("2410") ? true : (stryCov_9fa48("2410", "2411", "2412"), hasRequired && hasObsidianFields);
    }
  }
  private generateBreadcrumbs(relativePath: string): string[] {
    if (stryMutAct_9fa48("2413")) {
      {}
    } else {
      stryCov_9fa48("2413");
      const parts = stryMutAct_9fa48("2414") ? relativePath.split(path.sep) : (stryCov_9fa48("2414"), relativePath.split(path.sep).filter(stryMutAct_9fa48("2415") ? () => undefined : (stryCov_9fa48("2415"), part => stryMutAct_9fa48("2418") ? part || part !== "." : stryMutAct_9fa48("2417") ? false : stryMutAct_9fa48("2416") ? true : (stryCov_9fa48("2416", "2417", "2418"), part && (stryMutAct_9fa48("2420") ? part === "." : stryMutAct_9fa48("2419") ? true : (stryCov_9fa48("2419", "2420"), part !== (stryMutAct_9fa48("2421") ? "" : (stryCov_9fa48("2421"), "."))))))));
      const breadcrumbs: string[] = stryMutAct_9fa48("2422") ? ["Stryker was here"] : (stryCov_9fa48("2422"), []);
      for (let i = 0; stryMutAct_9fa48("2425") ? i >= parts.length - 1 : stryMutAct_9fa48("2424") ? i <= parts.length - 1 : stryMutAct_9fa48("2423") ? false : (stryCov_9fa48("2423", "2424", "2425"), i < (stryMutAct_9fa48("2426") ? parts.length + 1 : (stryCov_9fa48("2426"), parts.length - 1))); stryMutAct_9fa48("2427") ? i-- : (stryCov_9fa48("2427"), i++)) {
        if (stryMutAct_9fa48("2428")) {
          {}
        } else {
          stryCov_9fa48("2428");
          // Exclude filename
          const segment = stryMutAct_9fa48("2429") ? parts.join("/") : (stryCov_9fa48("2429"), parts.slice(0, stryMutAct_9fa48("2430") ? i - 1 : (stryCov_9fa48("2430"), i + 1)).join(stryMutAct_9fa48("2431") ? "" : (stryCov_9fa48("2431"), "/")));
          breadcrumbs.push(segment);
        }
      }
      return breadcrumbs;
    }
  }
}