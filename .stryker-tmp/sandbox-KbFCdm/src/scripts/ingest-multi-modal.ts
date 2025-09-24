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
import { ObsidianDatabase } from "../lib/database";
import { ObsidianEmbeddingService } from "../lib/embeddings";
import { MultiModalIngestionPipeline } from "../lib/multi-modal-ingest";
import * as fs from "fs";
import * as path from "path";

/**
 * Multi-modal ingestion script
 * Ingests various file types beyond just Markdown
 */
async function main() {
  if (stryMutAct_9fa48("4401")) {
    {}
  } else {
    stryCov_9fa48("4401");
    const args = stryMutAct_9fa48("4402") ? process.argv : (stryCov_9fa48("4402"), process.argv.slice(2));
    if (stryMutAct_9fa48("4405") ? args.length !== 0 : stryMutAct_9fa48("4404") ? false : stryMutAct_9fa48("4403") ? true : (stryCov_9fa48("4403", "4404", "4405"), args.length === 0)) {
      if (stryMutAct_9fa48("4406")) {
        {}
      } else {
        stryCov_9fa48("4406");
        console.log(stryMutAct_9fa48("4407") ? `` : (stryCov_9fa48("4407"), `
Usage: npm run ingest-multi-modal <paths...> [options]

Arguments:
  <paths...>    File paths or directories to ingest

Options:
  --db-url <url>           Database URL (default: from env)
  --embedding-model <model> Embedding model (default: from env)
  --batch-size <number>    Batch size (default: 5)
  --rate-limit <ms>        Rate limit between batches (default: 200)
  --skip-existing          Skip existing chunks (default: true)
  --max-file-size <bytes>  Maximum file size (default: 50MB)
  --include <patterns>     Comma-separated include patterns (default: **/*)
  --exclude <patterns>     Comma-separated exclude patterns (default: node_modules/**,.git/**,**/.*/**)

Examples:
  npm run ingest-multi-modal ./documents/
  npm run ingest-multi-modal file1.pdf file2.docx --batch-size 3
  npm run ingest-multi-modal ./mixed-files/ --include "**/*.{pdf,docx,txt}" --exclude "**/temp/**"
`));
        process.exit(1);
      }
    }

    // Parse arguments
    const filePaths: string[] = stryMutAct_9fa48("4408") ? ["Stryker was here"] : (stryCov_9fa48("4408"), []);
    const options: any = stryMutAct_9fa48("4409") ? {} : (stryCov_9fa48("4409"), {
      batchSize: 5,
      rateLimitMs: 200,
      skipExisting: stryMutAct_9fa48("4410") ? false : (stryCov_9fa48("4410"), true),
      maxFileSize: stryMutAct_9fa48("4411") ? 50 * 1024 / 1024 : (stryCov_9fa48("4411"), (stryMutAct_9fa48("4412") ? 50 / 1024 : (stryCov_9fa48("4412"), 50 * 1024)) * 1024),
      // 50MB
      includePatterns: stryMutAct_9fa48("4413") ? [] : (stryCov_9fa48("4413"), [stryMutAct_9fa48("4414") ? "" : (stryCov_9fa48("4414"), "**/*")]),
      excludePatterns: stryMutAct_9fa48("4415") ? [] : (stryCov_9fa48("4415"), [stryMutAct_9fa48("4416") ? "" : (stryCov_9fa48("4416"), "node_modules/**"), stryMutAct_9fa48("4417") ? "" : (stryCov_9fa48("4417"), ".git/**"), stryMutAct_9fa48("4418") ? "" : (stryCov_9fa48("4418"), "**/.*/**"), stryMutAct_9fa48("4419") ? "" : (stryCov_9fa48("4419"), "**/*.log"), stryMutAct_9fa48("4420") ? "" : (stryCov_9fa48("4420"), "**/*.tmp")])
    });
    let i = 0;
    while (stryMutAct_9fa48("4423") ? i >= args.length : stryMutAct_9fa48("4422") ? i <= args.length : stryMutAct_9fa48("4421") ? false : (stryCov_9fa48("4421", "4422", "4423"), i < args.length)) {
      if (stryMutAct_9fa48("4424")) {
        {}
      } else {
        stryCov_9fa48("4424");
        const arg = args[i];
        if (stryMutAct_9fa48("4427") ? arg.endsWith("--") : stryMutAct_9fa48("4426") ? false : stryMutAct_9fa48("4425") ? true : (stryCov_9fa48("4425", "4426", "4427"), arg.startsWith(stryMutAct_9fa48("4428") ? "" : (stryCov_9fa48("4428"), "--")))) {
          if (stryMutAct_9fa48("4429")) {
            {}
          } else {
            stryCov_9fa48("4429");
            switch (arg) {
              case stryMutAct_9fa48("4431") ? "" : (stryCov_9fa48("4431"), "--db-url"):
                if (stryMutAct_9fa48("4430")) {} else {
                  stryCov_9fa48("4430");
                  options.databaseUrl = args[stryMutAct_9fa48("4432") ? --i : (stryCov_9fa48("4432"), ++i)];
                  break;
                }
              case stryMutAct_9fa48("4434") ? "" : (stryCov_9fa48("4434"), "--embedding-model"):
                if (stryMutAct_9fa48("4433")) {} else {
                  stryCov_9fa48("4433");
                  options.embeddingModel = args[stryMutAct_9fa48("4435") ? --i : (stryCov_9fa48("4435"), ++i)];
                  break;
                }
              case stryMutAct_9fa48("4437") ? "" : (stryCov_9fa48("4437"), "--batch-size"):
                if (stryMutAct_9fa48("4436")) {} else {
                  stryCov_9fa48("4436");
                  options.batchSize = parseInt(args[stryMutAct_9fa48("4438") ? --i : (stryCov_9fa48("4438"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4440") ? "" : (stryCov_9fa48("4440"), "--rate-limit"):
                if (stryMutAct_9fa48("4439")) {} else {
                  stryCov_9fa48("4439");
                  options.rateLimitMs = parseInt(args[stryMutAct_9fa48("4441") ? --i : (stryCov_9fa48("4441"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4443") ? "" : (stryCov_9fa48("4443"), "--max-file-size"):
                if (stryMutAct_9fa48("4442")) {} else {
                  stryCov_9fa48("4442");
                  options.maxFileSize = parseInt(args[stryMutAct_9fa48("4444") ? --i : (stryCov_9fa48("4444"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4446") ? "" : (stryCov_9fa48("4446"), "--include"):
                if (stryMutAct_9fa48("4445")) {} else {
                  stryCov_9fa48("4445");
                  options.includePatterns = args[stryMutAct_9fa48("4447") ? --i : (stryCov_9fa48("4447"), ++i)].split(stryMutAct_9fa48("4448") ? "" : (stryCov_9fa48("4448"), ","));
                  break;
                }
              case stryMutAct_9fa48("4450") ? "" : (stryCov_9fa48("4450"), "--exclude"):
                if (stryMutAct_9fa48("4449")) {} else {
                  stryCov_9fa48("4449");
                  options.excludePatterns = args[stryMutAct_9fa48("4451") ? --i : (stryCov_9fa48("4451"), ++i)].split(stryMutAct_9fa48("4452") ? "" : (stryCov_9fa48("4452"), ","));
                  break;
                }
              case stryMutAct_9fa48("4454") ? "" : (stryCov_9fa48("4454"), "--skip-existing"):
                if (stryMutAct_9fa48("4453")) {} else {
                  stryCov_9fa48("4453");
                  options.skipExisting = stryMutAct_9fa48("4455") ? false : (stryCov_9fa48("4455"), true);
                  break;
                }
              case stryMutAct_9fa48("4457") ? "" : (stryCov_9fa48("4457"), "--no-skip-existing"):
                if (stryMutAct_9fa48("4456")) {} else {
                  stryCov_9fa48("4456");
                  options.skipExisting = stryMutAct_9fa48("4458") ? true : (stryCov_9fa48("4458"), false);
                  break;
                }
              default:
                if (stryMutAct_9fa48("4459")) {} else {
                  stryCov_9fa48("4459");
                  console.error(stryMutAct_9fa48("4460") ? `` : (stryCov_9fa48("4460"), `Unknown option: ${arg}`));
                  process.exit(1);
                }
            }
          }
        } else {
          if (stryMutAct_9fa48("4461")) {
            {}
          } else {
            stryCov_9fa48("4461");
            filePaths.push(arg);
          }
        }
        stryMutAct_9fa48("4462") ? i-- : (stryCov_9fa48("4462"), i++);
      }
    }

    // Environment variables
    const databaseUrl = stryMutAct_9fa48("4465") ? options.databaseUrl && process.env.DATABASE_URL : stryMutAct_9fa48("4464") ? false : stryMutAct_9fa48("4463") ? true : (stryCov_9fa48("4463", "4464", "4465"), options.databaseUrl || process.env.DATABASE_URL);
    const embeddingModel = stryMutAct_9fa48("4468") ? (options.embeddingModel || process.env.EMBEDDING_MODEL) && "embeddinggemma" : stryMutAct_9fa48("4467") ? false : stryMutAct_9fa48("4466") ? true : (stryCov_9fa48("4466", "4467", "4468"), (stryMutAct_9fa48("4470") ? options.embeddingModel && process.env.EMBEDDING_MODEL : stryMutAct_9fa48("4469") ? false : (stryCov_9fa48("4469", "4470"), options.embeddingModel || process.env.EMBEDDING_MODEL)) || (stryMutAct_9fa48("4471") ? "" : (stryCov_9fa48("4471"), "embeddinggemma")));
    const embeddingDimension = parseInt(stryMutAct_9fa48("4474") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4473") ? false : stryMutAct_9fa48("4472") ? true : (stryCov_9fa48("4472", "4473", "4474"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4475") ? "" : (stryCov_9fa48("4475"), "768"))));
    if (stryMutAct_9fa48("4478") ? false : stryMutAct_9fa48("4477") ? true : stryMutAct_9fa48("4476") ? databaseUrl : (stryCov_9fa48("4476", "4477", "4478"), !databaseUrl)) {
      if (stryMutAct_9fa48("4479")) {
        {}
      } else {
        stryCov_9fa48("4479");
        console.error(stryMutAct_9fa48("4480") ? "" : (stryCov_9fa48("4480"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }
    try {
      if (stryMutAct_9fa48("4481")) {
        {}
      } else {
        stryCov_9fa48("4481");
        // Initialize services
        console.log(stryMutAct_9fa48("4482") ? "" : (stryCov_9fa48("4482"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(databaseUrl);
        await database.initialize();
        const embeddings = new ObsidianEmbeddingService(stryMutAct_9fa48("4483") ? {} : (stryCov_9fa48("4483"), {
          model: embeddingModel,
          dimension: embeddingDimension
        }));
        const ingestionPipeline = new MultiModalIngestionPipeline(database, embeddings);

        // Discover all files to process
        console.log(stryMutAct_9fa48("4484") ? "" : (stryCov_9fa48("4484"), "🔍 Discovering files..."));
        const filesToProcess = await discoverFiles(filePaths, stryMutAct_9fa48("4485") ? {} : (stryCov_9fa48("4485"), {
          includePatterns: options.includePatterns,
          excludePatterns: options.excludePatterns
        }));
        if (stryMutAct_9fa48("4488") ? filesToProcess.length !== 0 : stryMutAct_9fa48("4487") ? false : stryMutAct_9fa48("4486") ? true : (stryCov_9fa48("4486", "4487", "4488"), filesToProcess.length === 0)) {
          if (stryMutAct_9fa48("4489")) {
            {}
          } else {
            stryCov_9fa48("4489");
            console.log(stryMutAct_9fa48("4490") ? "" : (stryCov_9fa48("4490"), "ℹ️  No files found to process"));
            return;
          }
        }
        console.log(stryMutAct_9fa48("4491") ? `` : (stryCov_9fa48("4491"), `📄 Found ${filesToProcess.length} files to process`));

        // Show file type breakdown
        const typeBreakdown = getContentTypeBreakdown(filesToProcess);
        console.log(stryMutAct_9fa48("4492") ? "" : (stryCov_9fa48("4492"), "📊 Content type breakdown:"));
        Object.entries(typeBreakdown).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4493")) {
            {}
          } else {
            stryCov_9fa48("4493");
            console.log(stryMutAct_9fa48("4494") ? `` : (stryCov_9fa48("4494"), `  ${type}: ${count} files`));
          }
        });

        // Confirm before processing
        console.log(stryMutAct_9fa48("4495") ? "" : (stryCov_9fa48("4495"), "\n⚠️  This will process files and may take some time."));
        console.log(stryMutAct_9fa48("4496") ? "" : (stryCov_9fa48("4496"), "Press Ctrl+C to cancel..."));

        // Add a small delay to allow cancellation
        await new Promise(stryMutAct_9fa48("4497") ? () => undefined : (stryCov_9fa48("4497"), resolve => setTimeout(resolve, 2000)));

        // Process files
        const result = await ingestionPipeline.ingestFiles(filesToProcess, stryMutAct_9fa48("4498") ? {} : (stryCov_9fa48("4498"), {
          batchSize: options.batchSize,
          rateLimitMs: options.rateLimitMs,
          skipExisting: options.skipExisting,
          maxFileSize: options.maxFileSize
        }));

        // Display results
        console.log(stryMutAct_9fa48("4499") ? "" : (stryCov_9fa48("4499"), "\n🎉 Multi-modal ingestion completed!"));
        console.log(stryMutAct_9fa48("4500") ? `` : (stryCov_9fa48("4500"), `📊 Results:`));
        console.log(stryMutAct_9fa48("4501") ? `` : (stryCov_9fa48("4501"), `  Total files: ${result.totalFiles}`));
        console.log(stryMutAct_9fa48("4502") ? `` : (stryCov_9fa48("4502"), `  Processed: ${result.processedFiles}`));
        console.log(stryMutAct_9fa48("4503") ? `` : (stryCov_9fa48("4503"), `  Skipped: ${result.skippedFiles}`));
        console.log(stryMutAct_9fa48("4504") ? `` : (stryCov_9fa48("4504"), `  Failed: ${result.failedFiles}`));
        console.log(stryMutAct_9fa48("4505") ? `` : (stryCov_9fa48("4505"), `  Total chunks: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("4506") ? `` : (stryCov_9fa48("4506"), `  Processed chunks: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("4507") ? `` : (stryCov_9fa48("4507"), `\n📈 Content type statistics:`));
        Object.entries(result.contentTypeStats).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4508")) {
            {}
          } else {
            stryCov_9fa48("4508");
            if (stryMutAct_9fa48("4512") ? count <= 0 : stryMutAct_9fa48("4511") ? count >= 0 : stryMutAct_9fa48("4510") ? false : stryMutAct_9fa48("4509") ? true : (stryCov_9fa48("4509", "4510", "4511", "4512"), count > 0)) {
              if (stryMutAct_9fa48("4513")) {
                {}
              } else {
                stryCov_9fa48("4513");
                console.log(stryMutAct_9fa48("4514") ? `` : (stryCov_9fa48("4514"), `  ${type}: ${count} files`));
              }
            }
          }
        });
        if (stryMutAct_9fa48("4518") ? result.errors.length <= 0 : stryMutAct_9fa48("4517") ? result.errors.length >= 0 : stryMutAct_9fa48("4516") ? false : stryMutAct_9fa48("4515") ? true : (stryCov_9fa48("4515", "4516", "4517", "4518"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("4519")) {
            {}
          } else {
            stryCov_9fa48("4519");
            console.log(stryMutAct_9fa48("4520") ? `` : (stryCov_9fa48("4520"), `\n❌ Errors encountered (${result.errors.length}):`));
            stryMutAct_9fa48("4521") ? result.errors.forEach((error, index) => {
              console.log(`  ${index + 1}. ${error}`);
            }) : (stryCov_9fa48("4521"), result.errors.slice(0, 10).forEach((error, index) => {
              if (stryMutAct_9fa48("4522")) {
                {}
              } else {
                stryCov_9fa48("4522");
                console.log(stryMutAct_9fa48("4523") ? `` : (stryCov_9fa48("4523"), `  ${stryMutAct_9fa48("4524") ? index - 1 : (stryCov_9fa48("4524"), index + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("4528") ? result.errors.length <= 10 : stryMutAct_9fa48("4527") ? result.errors.length >= 10 : stryMutAct_9fa48("4526") ? false : stryMutAct_9fa48("4525") ? true : (stryCov_9fa48("4525", "4526", "4527", "4528"), result.errors.length > 10)) {
              if (stryMutAct_9fa48("4529")) {
                {}
              } else {
                stryCov_9fa48("4529");
                console.log(stryMutAct_9fa48("4530") ? `` : (stryCov_9fa48("4530"), `  ... and ${stryMutAct_9fa48("4531") ? result.errors.length + 10 : (stryCov_9fa48("4531"), result.errors.length - 10)} more errors`));
              }
            }
          }
        }

        // Validate ingestion
        console.log(stryMutAct_9fa48("4532") ? "" : (stryCov_9fa48("4532"), "\n🔍 Validating ingestion..."));
        const validation = await validateIngestion(database, result.processedChunks);
        console.log(stryMutAct_9fa48("4533") ? `` : (stryCov_9fa48("4533"), `✅ Validation: ${validation.isValid ? stryMutAct_9fa48("4534") ? "" : (stryCov_9fa48("4534"), "PASSED") : stryMutAct_9fa48("4535") ? "" : (stryCov_9fa48("4535"), "FAILED")}`));
        if (stryMutAct_9fa48("4538") ? !validation.isValid || validation.errors.length > 0 : stryMutAct_9fa48("4537") ? false : stryMutAct_9fa48("4536") ? true : (stryCov_9fa48("4536", "4537", "4538"), (stryMutAct_9fa48("4539") ? validation.isValid : (stryCov_9fa48("4539"), !validation.isValid)) && (stryMutAct_9fa48("4542") ? validation.errors.length <= 0 : stryMutAct_9fa48("4541") ? validation.errors.length >= 0 : stryMutAct_9fa48("4540") ? true : (stryCov_9fa48("4540", "4541", "4542"), validation.errors.length > 0)))) {
          if (stryMutAct_9fa48("4543")) {
            {}
          } else {
            stryCov_9fa48("4543");
            console.log(stryMutAct_9fa48("4544") ? "" : (stryCov_9fa48("4544"), "❌ Validation errors:"));
            validation.errors.forEach(stryMutAct_9fa48("4545") ? () => undefined : (stryCov_9fa48("4545"), error => console.log(stryMutAct_9fa48("4546") ? `` : (stryCov_9fa48("4546"), `  - ${error}`))));
          }
        }
      }
    } catch (error) {
      if (stryMutAct_9fa48("4547")) {
        {}
      } else {
        stryCov_9fa48("4547");
        console.error(stryMutAct_9fa48("4548") ? "" : (stryCov_9fa48("4548"), "❌ Multi-modal ingestion failed:"), error);
        process.exit(1);
      }
    }
  }
}

/**
 * Discover files to process from given paths
 */
async function discoverFiles(inputPaths: string[], options: {
  includePatterns: string[];
  excludePatterns: string[];
}): Promise<string[]> {
  if (stryMutAct_9fa48("4549")) {
    {}
  } else {
    stryCov_9fa48("4549");
    const files: string[] = stryMutAct_9fa48("4550") ? ["Stryker was here"] : (stryCov_9fa48("4550"), []);
    for (const inputPath of inputPaths) {
      if (stryMutAct_9fa48("4551")) {
        {}
      } else {
        stryCov_9fa48("4551");
        if (stryMutAct_9fa48("4553") ? false : stryMutAct_9fa48("4552") ? true : (stryCov_9fa48("4552", "4553"), fs.existsSync(inputPath))) {
          if (stryMutAct_9fa48("4554")) {
            {}
          } else {
            stryCov_9fa48("4554");
            const stat = fs.statSync(inputPath);
            if (stryMutAct_9fa48("4556") ? false : stryMutAct_9fa48("4555") ? true : (stryCov_9fa48("4555", "4556"), stat.isDirectory())) {
              if (stryMutAct_9fa48("4557")) {
                {}
              } else {
                stryCov_9fa48("4557");
                // Walk directory
                await walkDirectory(inputPath, files, options);
              }
            } else if (stryMutAct_9fa48("4559") ? false : stryMutAct_9fa48("4558") ? true : (stryCov_9fa48("4558", "4559"), stat.isFile())) {
              if (stryMutAct_9fa48("4560")) {
                {}
              } else {
                stryCov_9fa48("4560");
                // Single file
                if (stryMutAct_9fa48("4562") ? false : stryMutAct_9fa48("4561") ? true : (stryCov_9fa48("4561", "4562"), shouldIncludeFile(inputPath, options))) {
                  if (stryMutAct_9fa48("4563")) {
                    {}
                  } else {
                    stryCov_9fa48("4563");
                    files.push(inputPath);
                  }
                }
              }
            }
          }
        } else {
          if (stryMutAct_9fa48("4564")) {
            {}
          } else {
            stryCov_9fa48("4564");
            console.warn(stryMutAct_9fa48("4565") ? `` : (stryCov_9fa48("4565"), `⚠️  Path does not exist: ${inputPath}`));
          }
        }
      }
    }
    return files;
  }
}

/**
 * Recursively walk directory to find files
 */
async function walkDirectory(dirPath: string, files: string[], options: {
  includePatterns: string[];
  excludePatterns: string[];
}): Promise<void> {
  if (stryMutAct_9fa48("4566")) {
    {}
  } else {
    stryCov_9fa48("4566");
    const entries = fs.readdirSync(dirPath, stryMutAct_9fa48("4567") ? {} : (stryCov_9fa48("4567"), {
      withFileTypes: stryMutAct_9fa48("4568") ? false : (stryCov_9fa48("4568"), true)
    }));
    for (const entry of entries) {
      if (stryMutAct_9fa48("4569")) {
        {}
      } else {
        stryCov_9fa48("4569");
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        // Check exclude patterns
        if (stryMutAct_9fa48("4572") ? options.excludePatterns.every(pattern => matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("4571") ? false : stryMutAct_9fa48("4570") ? true : (stryCov_9fa48("4570", "4571", "4572"), options.excludePatterns.some(stryMutAct_9fa48("4573") ? () => undefined : (stryCov_9fa48("4573"), pattern => matchesPattern(relativePath, pattern))))) {
          if (stryMutAct_9fa48("4574")) {
            {}
          } else {
            stryCov_9fa48("4574");
            continue;
          }
        }
        if (stryMutAct_9fa48("4576") ? false : stryMutAct_9fa48("4575") ? true : (stryCov_9fa48("4575", "4576"), entry.isDirectory())) {
          if (stryMutAct_9fa48("4577")) {
            {}
          } else {
            stryCov_9fa48("4577");
            await walkDirectory(fullPath, files, options);
          }
        } else if (stryMutAct_9fa48("4579") ? false : stryMutAct_9fa48("4578") ? true : (stryCov_9fa48("4578", "4579"), entry.isFile())) {
          if (stryMutAct_9fa48("4580")) {
            {}
          } else {
            stryCov_9fa48("4580");
            if (stryMutAct_9fa48("4582") ? false : stryMutAct_9fa48("4581") ? true : (stryCov_9fa48("4581", "4582"), shouldIncludeFile(relativePath, options))) {
              if (stryMutAct_9fa48("4583")) {
                {}
              } else {
                stryCov_9fa48("4583");
                files.push(fullPath);
              }
            }
          }
        }
      }
    }
  }
}

/**
 * Check if file should be included based on patterns
 */
function shouldIncludeFile(filePath: string, options: {
  includePatterns: string[];
  excludePatterns: string[];
}): boolean {
  if (stryMutAct_9fa48("4584")) {
    {}
  } else {
    stryCov_9fa48("4584");
    // Check exclude patterns first
    if (stryMutAct_9fa48("4587") ? options.excludePatterns.every(pattern => matchesPattern(filePath, pattern)) : stryMutAct_9fa48("4586") ? false : stryMutAct_9fa48("4585") ? true : (stryCov_9fa48("4585", "4586", "4587"), options.excludePatterns.some(stryMutAct_9fa48("4588") ? () => undefined : (stryCov_9fa48("4588"), pattern => matchesPattern(filePath, pattern))))) {
      if (stryMutAct_9fa48("4589")) {
        {}
      } else {
        stryCov_9fa48("4589");
        return stryMutAct_9fa48("4590") ? true : (stryCov_9fa48("4590"), false);
      }
    }

    // Check include patterns
    return stryMutAct_9fa48("4591") ? options.includePatterns.every(pattern => matchesPattern(filePath, pattern)) : (stryCov_9fa48("4591"), options.includePatterns.some(stryMutAct_9fa48("4592") ? () => undefined : (stryCov_9fa48("4592"), pattern => matchesPattern(filePath, pattern))));
  }
}

/**
 * Simple pattern matching (supports ** and *)
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  if (stryMutAct_9fa48("4593")) {
    {}
  } else {
    stryCov_9fa48("4593");
    const regexPattern = pattern.replace(/\*\*/g, stryMutAct_9fa48("4594") ? "" : (stryCov_9fa48("4594"), ".*")).replace(/\*/g, stryMutAct_9fa48("4595") ? "" : (stryCov_9fa48("4595"), "[^/]*")).replace(/\?/g, stryMutAct_9fa48("4596") ? "" : (stryCov_9fa48("4596"), "."));
    const regex = new RegExp(stryMutAct_9fa48("4597") ? `` : (stryCov_9fa48("4597"), `^${regexPattern}$`));
    return regex.test(filePath);
  }
}

/**
 * Get content type breakdown for display
 */
function getContentTypeBreakdown(files: string[]): Record<string, number> {
  if (stryMutAct_9fa48("4598")) {
    {}
  } else {
    stryCov_9fa48("4598");
    const breakdown: Record<string, number> = {};
    files.forEach(file => {
      if (stryMutAct_9fa48("4599")) {
        {}
      } else {
        stryCov_9fa48("4599");
        const ext = stryMutAct_9fa48("4600") ? path.extname(file).toUpperCase() : (stryCov_9fa48("4600"), path.extname(file).toLowerCase());
        const type = getContentTypeFromExtension(ext);
        breakdown[type] = stryMutAct_9fa48("4601") ? (breakdown[type] || 0) - 1 : (stryCov_9fa48("4601"), (stryMutAct_9fa48("4604") ? breakdown[type] && 0 : stryMutAct_9fa48("4603") ? false : stryMutAct_9fa48("4602") ? true : (stryCov_9fa48("4602", "4603", "4604"), breakdown[type] || 0)) + 1);
      }
    });
    return breakdown;
  }
}

/**
 * Map file extension to content type for display
 */
function getContentTypeFromExtension(ext: string): string {
  if (stryMutAct_9fa48("4605")) {
    {}
  } else {
    stryCov_9fa48("4605");
    const extMap: Record<string, string> = stryMutAct_9fa48("4606") ? {} : (stryCov_9fa48("4606"), {
      ".md": stryMutAct_9fa48("4607") ? "" : (stryCov_9fa48("4607"), "Markdown"),
      ".txt": stryMutAct_9fa48("4608") ? "" : (stryCov_9fa48("4608"), "Text"),
      ".pdf": stryMutAct_9fa48("4609") ? "" : (stryCov_9fa48("4609"), "PDF"),
      ".docx": stryMutAct_9fa48("4610") ? "" : (stryCov_9fa48("4610"), "Word Document"),
      ".doc": stryMutAct_9fa48("4611") ? "" : (stryCov_9fa48("4611"), "Word Document"),
      ".xlsx": stryMutAct_9fa48("4612") ? "" : (stryCov_9fa48("4612"), "Excel Spreadsheet"),
      ".xls": stryMutAct_9fa48("4613") ? "" : (stryCov_9fa48("4613"), "Excel Spreadsheet"),
      ".pptx": stryMutAct_9fa48("4614") ? "" : (stryCov_9fa48("4614"), "PowerPoint"),
      ".ppt": stryMutAct_9fa48("4615") ? "" : (stryCov_9fa48("4615"), "PowerPoint"),
      ".jpg": stryMutAct_9fa48("4616") ? "" : (stryCov_9fa48("4616"), "Image"),
      ".jpeg": stryMutAct_9fa48("4617") ? "" : (stryCov_9fa48("4617"), "Image"),
      ".png": stryMutAct_9fa48("4618") ? "" : (stryCov_9fa48("4618"), "Image"),
      ".gif": stryMutAct_9fa48("4619") ? "" : (stryCov_9fa48("4619"), "Image"),
      ".mp3": stryMutAct_9fa48("4620") ? "" : (stryCov_9fa48("4620"), "Audio"),
      ".wav": stryMutAct_9fa48("4621") ? "" : (stryCov_9fa48("4621"), "Audio"),
      ".mp4": stryMutAct_9fa48("4622") ? "" : (stryCov_9fa48("4622"), "Video"),
      ".avi": stryMutAct_9fa48("4623") ? "" : (stryCov_9fa48("4623"), "Video"),
      ".json": stryMutAct_9fa48("4624") ? "" : (stryCov_9fa48("4624"), "JSON"),
      ".xml": stryMutAct_9fa48("4625") ? "" : (stryCov_9fa48("4625"), "XML"),
      ".csv": stryMutAct_9fa48("4626") ? "" : (stryCov_9fa48("4626"), "CSV")
    });
    return stryMutAct_9fa48("4629") ? extMap[ext] && "Other" : stryMutAct_9fa48("4628") ? false : stryMutAct_9fa48("4627") ? true : (stryCov_9fa48("4627", "4628", "4629"), extMap[ext] || (stryMutAct_9fa48("4630") ? "" : (stryCov_9fa48("4630"), "Other")));
  }
}

/**
 * Validate ingestion results
 */
async function validateIngestion(database: ObsidianDatabase, expectedChunks: number): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  if (stryMutAct_9fa48("4631")) {
    {}
  } else {
    stryCov_9fa48("4631");
    try {
      if (stryMutAct_9fa48("4632")) {
        {}
      } else {
        stryCov_9fa48("4632");
        const stats = await database.getStats();
        const errors: string[] = stryMutAct_9fa48("4633") ? ["Stryker was here"] : (stryCov_9fa48("4633"), []);
        if (stryMutAct_9fa48("4636") ? stats.totalChunks !== 0 : stryMutAct_9fa48("4635") ? false : stryMutAct_9fa48("4634") ? true : (stryCov_9fa48("4634", "4635", "4636"), stats.totalChunks === 0)) {
          if (stryMutAct_9fa48("4637")) {
            {}
          } else {
            stryCov_9fa48("4637");
            errors.push(stryMutAct_9fa48("4638") ? "" : (stryCov_9fa48("4638"), "No chunks found in database"));
          }
        }

        // Check that we have some chunks with multi-modal metadata
        const sampleChunks = await database.search((stryMutAct_9fa48("4639") ? new Array() : (stryCov_9fa48("4639"), new Array(768))).fill(0), 5);
        const hasMultiModal = stryMutAct_9fa48("4640") ? sampleChunks.every(chunk => chunk.meta.multiModalFile !== undefined) : (stryCov_9fa48("4640"), sampleChunks.some(stryMutAct_9fa48("4641") ? () => undefined : (stryCov_9fa48("4641"), chunk => stryMutAct_9fa48("4644") ? chunk.meta.multiModalFile === undefined : stryMutAct_9fa48("4643") ? false : stryMutAct_9fa48("4642") ? true : (stryCov_9fa48("4642", "4643", "4644"), chunk.meta.multiModalFile !== undefined))));
        if (stryMutAct_9fa48("4647") ? !hasMultiModal || expectedChunks > 0 : stryMutAct_9fa48("4646") ? false : stryMutAct_9fa48("4645") ? true : (stryCov_9fa48("4645", "4646", "4647"), (stryMutAct_9fa48("4648") ? hasMultiModal : (stryCov_9fa48("4648"), !hasMultiModal)) && (stryMutAct_9fa48("4651") ? expectedChunks <= 0 : stryMutAct_9fa48("4650") ? expectedChunks >= 0 : stryMutAct_9fa48("4649") ? true : (stryCov_9fa48("4649", "4650", "4651"), expectedChunks > 0)))) {
          if (stryMutAct_9fa48("4652")) {
            {}
          } else {
            stryCov_9fa48("4652");
            errors.push(stryMutAct_9fa48("4653") ? "" : (stryCov_9fa48("4653"), "No multi-modal chunks found - ingestion may have failed"));
          }
        }
        return stryMutAct_9fa48("4654") ? {} : (stryCov_9fa48("4654"), {
          isValid: stryMutAct_9fa48("4657") ? errors.length !== 0 : stryMutAct_9fa48("4656") ? false : stryMutAct_9fa48("4655") ? true : (stryCov_9fa48("4655", "4656", "4657"), errors.length === 0),
          errors
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("4658")) {
        {}
      } else {
        stryCov_9fa48("4658");
        return stryMutAct_9fa48("4659") ? {} : (stryCov_9fa48("4659"), {
          isValid: stryMutAct_9fa48("4660") ? true : (stryCov_9fa48("4660"), false),
          errors: stryMutAct_9fa48("4661") ? [] : (stryCov_9fa48("4661"), [stryMutAct_9fa48("4662") ? `` : (stryCov_9fa48("4662"), `Validation failed: ${error}`)])
        });
      }
    }
  }
}

// Run the script
main().catch(console.error);