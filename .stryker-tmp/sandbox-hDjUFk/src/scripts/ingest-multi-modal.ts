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
  if (stryMutAct_9fa48("4505")) {
    {}
  } else {
    stryCov_9fa48("4505");
    const args = stryMutAct_9fa48("4506") ? process.argv : (stryCov_9fa48("4506"), process.argv.slice(2));
    if (stryMutAct_9fa48("4509") ? args.length !== 0 : stryMutAct_9fa48("4508") ? false : stryMutAct_9fa48("4507") ? true : (stryCov_9fa48("4507", "4508", "4509"), args.length === 0)) {
      if (stryMutAct_9fa48("4510")) {
        {}
      } else {
        stryCov_9fa48("4510");
        console.log(stryMutAct_9fa48("4511") ? `` : (stryCov_9fa48("4511"), `
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
    const filePaths: string[] = stryMutAct_9fa48("4512") ? ["Stryker was here"] : (stryCov_9fa48("4512"), []);
    const options: any = stryMutAct_9fa48("4513") ? {} : (stryCov_9fa48("4513"), {
      batchSize: 5,
      rateLimitMs: 200,
      skipExisting: stryMutAct_9fa48("4514") ? false : (stryCov_9fa48("4514"), true),
      maxFileSize: stryMutAct_9fa48("4515") ? 50 * 1024 / 1024 : (stryCov_9fa48("4515"), (stryMutAct_9fa48("4516") ? 50 / 1024 : (stryCov_9fa48("4516"), 50 * 1024)) * 1024),
      // 50MB
      includePatterns: stryMutAct_9fa48("4517") ? [] : (stryCov_9fa48("4517"), [stryMutAct_9fa48("4518") ? "" : (stryCov_9fa48("4518"), "**/*")]),
      excludePatterns: stryMutAct_9fa48("4519") ? [] : (stryCov_9fa48("4519"), [stryMutAct_9fa48("4520") ? "" : (stryCov_9fa48("4520"), "node_modules/**"), stryMutAct_9fa48("4521") ? "" : (stryCov_9fa48("4521"), ".git/**"), stryMutAct_9fa48("4522") ? "" : (stryCov_9fa48("4522"), "**/.*/**"), stryMutAct_9fa48("4523") ? "" : (stryCov_9fa48("4523"), "**/*.log"), stryMutAct_9fa48("4524") ? "" : (stryCov_9fa48("4524"), "**/*.tmp")])
    });
    let i = 0;
    while (stryMutAct_9fa48("4527") ? i >= args.length : stryMutAct_9fa48("4526") ? i <= args.length : stryMutAct_9fa48("4525") ? false : (stryCov_9fa48("4525", "4526", "4527"), i < args.length)) {
      if (stryMutAct_9fa48("4528")) {
        {}
      } else {
        stryCov_9fa48("4528");
        const arg = args[i];
        if (stryMutAct_9fa48("4531") ? arg.endsWith("--") : stryMutAct_9fa48("4530") ? false : stryMutAct_9fa48("4529") ? true : (stryCov_9fa48("4529", "4530", "4531"), arg.startsWith(stryMutAct_9fa48("4532") ? "" : (stryCov_9fa48("4532"), "--")))) {
          if (stryMutAct_9fa48("4533")) {
            {}
          } else {
            stryCov_9fa48("4533");
            switch (arg) {
              case stryMutAct_9fa48("4535") ? "" : (stryCov_9fa48("4535"), "--db-url"):
                if (stryMutAct_9fa48("4534")) {} else {
                  stryCov_9fa48("4534");
                  options.databaseUrl = args[stryMutAct_9fa48("4536") ? --i : (stryCov_9fa48("4536"), ++i)];
                  break;
                }
              case stryMutAct_9fa48("4538") ? "" : (stryCov_9fa48("4538"), "--embedding-model"):
                if (stryMutAct_9fa48("4537")) {} else {
                  stryCov_9fa48("4537");
                  options.embeddingModel = args[stryMutAct_9fa48("4539") ? --i : (stryCov_9fa48("4539"), ++i)];
                  break;
                }
              case stryMutAct_9fa48("4541") ? "" : (stryCov_9fa48("4541"), "--batch-size"):
                if (stryMutAct_9fa48("4540")) {} else {
                  stryCov_9fa48("4540");
                  options.batchSize = parseInt(args[stryMutAct_9fa48("4542") ? --i : (stryCov_9fa48("4542"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4544") ? "" : (stryCov_9fa48("4544"), "--rate-limit"):
                if (stryMutAct_9fa48("4543")) {} else {
                  stryCov_9fa48("4543");
                  options.rateLimitMs = parseInt(args[stryMutAct_9fa48("4545") ? --i : (stryCov_9fa48("4545"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4547") ? "" : (stryCov_9fa48("4547"), "--max-file-size"):
                if (stryMutAct_9fa48("4546")) {} else {
                  stryCov_9fa48("4546");
                  options.maxFileSize = parseInt(args[stryMutAct_9fa48("4548") ? --i : (stryCov_9fa48("4548"), ++i)]);
                  break;
                }
              case stryMutAct_9fa48("4550") ? "" : (stryCov_9fa48("4550"), "--include"):
                if (stryMutAct_9fa48("4549")) {} else {
                  stryCov_9fa48("4549");
                  options.includePatterns = args[stryMutAct_9fa48("4551") ? --i : (stryCov_9fa48("4551"), ++i)].split(stryMutAct_9fa48("4552") ? "" : (stryCov_9fa48("4552"), ","));
                  break;
                }
              case stryMutAct_9fa48("4554") ? "" : (stryCov_9fa48("4554"), "--exclude"):
                if (stryMutAct_9fa48("4553")) {} else {
                  stryCov_9fa48("4553");
                  options.excludePatterns = args[stryMutAct_9fa48("4555") ? --i : (stryCov_9fa48("4555"), ++i)].split(stryMutAct_9fa48("4556") ? "" : (stryCov_9fa48("4556"), ","));
                  break;
                }
              case stryMutAct_9fa48("4558") ? "" : (stryCov_9fa48("4558"), "--skip-existing"):
                if (stryMutAct_9fa48("4557")) {} else {
                  stryCov_9fa48("4557");
                  options.skipExisting = stryMutAct_9fa48("4559") ? false : (stryCov_9fa48("4559"), true);
                  break;
                }
              case stryMutAct_9fa48("4561") ? "" : (stryCov_9fa48("4561"), "--no-skip-existing"):
                if (stryMutAct_9fa48("4560")) {} else {
                  stryCov_9fa48("4560");
                  options.skipExisting = stryMutAct_9fa48("4562") ? true : (stryCov_9fa48("4562"), false);
                  break;
                }
              default:
                if (stryMutAct_9fa48("4563")) {} else {
                  stryCov_9fa48("4563");
                  console.error(stryMutAct_9fa48("4564") ? `` : (stryCov_9fa48("4564"), `Unknown option: ${arg}`));
                  process.exit(1);
                }
            }
          }
        } else {
          if (stryMutAct_9fa48("4565")) {
            {}
          } else {
            stryCov_9fa48("4565");
            filePaths.push(arg);
          }
        }
        stryMutAct_9fa48("4566") ? i-- : (stryCov_9fa48("4566"), i++);
      }
    }

    // Environment variables
    const databaseUrl = stryMutAct_9fa48("4569") ? options.databaseUrl && process.env.DATABASE_URL : stryMutAct_9fa48("4568") ? false : stryMutAct_9fa48("4567") ? true : (stryCov_9fa48("4567", "4568", "4569"), options.databaseUrl || process.env.DATABASE_URL);
    const embeddingModel = stryMutAct_9fa48("4572") ? (options.embeddingModel || process.env.EMBEDDING_MODEL) && "embeddinggemma" : stryMutAct_9fa48("4571") ? false : stryMutAct_9fa48("4570") ? true : (stryCov_9fa48("4570", "4571", "4572"), (stryMutAct_9fa48("4574") ? options.embeddingModel && process.env.EMBEDDING_MODEL : stryMutAct_9fa48("4573") ? false : (stryCov_9fa48("4573", "4574"), options.embeddingModel || process.env.EMBEDDING_MODEL)) || (stryMutAct_9fa48("4575") ? "" : (stryCov_9fa48("4575"), "embeddinggemma")));
    const embeddingDimension = parseInt(stryMutAct_9fa48("4578") ? process.env.EMBEDDING_DIMENSION && "768" : stryMutAct_9fa48("4577") ? false : stryMutAct_9fa48("4576") ? true : (stryCov_9fa48("4576", "4577", "4578"), process.env.EMBEDDING_DIMENSION || (stryMutAct_9fa48("4579") ? "" : (stryCov_9fa48("4579"), "768"))));
    if (stryMutAct_9fa48("4582") ? false : stryMutAct_9fa48("4581") ? true : stryMutAct_9fa48("4580") ? databaseUrl : (stryCov_9fa48("4580", "4581", "4582"), !databaseUrl)) {
      if (stryMutAct_9fa48("4583")) {
        {}
      } else {
        stryCov_9fa48("4583");
        console.error(stryMutAct_9fa48("4584") ? "" : (stryCov_9fa48("4584"), "❌ DATABASE_URL environment variable is required"));
        process.exit(1);
      }
    }
    try {
      if (stryMutAct_9fa48("4585")) {
        {}
      } else {
        stryCov_9fa48("4585");
        // Initialize services
        console.log(stryMutAct_9fa48("4586") ? "" : (stryCov_9fa48("4586"), "🔧 Initializing services..."));
        const database = new ObsidianDatabase(databaseUrl);
        await database.initialize();
        const embeddings = new ObsidianEmbeddingService(stryMutAct_9fa48("4587") ? {} : (stryCov_9fa48("4587"), {
          model: embeddingModel,
          dimension: embeddingDimension
        }));
        const ingestionPipeline = new MultiModalIngestionPipeline(database, embeddings);

        // Discover all files to process
        console.log(stryMutAct_9fa48("4588") ? "" : (stryCov_9fa48("4588"), "🔍 Discovering files..."));
        const filesToProcess = await discoverFiles(filePaths, stryMutAct_9fa48("4589") ? {} : (stryCov_9fa48("4589"), {
          includePatterns: options.includePatterns,
          excludePatterns: options.excludePatterns
        }));
        if (stryMutAct_9fa48("4592") ? filesToProcess.length !== 0 : stryMutAct_9fa48("4591") ? false : stryMutAct_9fa48("4590") ? true : (stryCov_9fa48("4590", "4591", "4592"), filesToProcess.length === 0)) {
          if (stryMutAct_9fa48("4593")) {
            {}
          } else {
            stryCov_9fa48("4593");
            console.log(stryMutAct_9fa48("4594") ? "" : (stryCov_9fa48("4594"), "ℹ️  No files found to process"));
            return;
          }
        }
        console.log(stryMutAct_9fa48("4595") ? `` : (stryCov_9fa48("4595"), `📄 Found ${filesToProcess.length} files to process`));

        // Show file type breakdown
        const typeBreakdown = getContentTypeBreakdown(filesToProcess);
        console.log(stryMutAct_9fa48("4596") ? "" : (stryCov_9fa48("4596"), "📊 Content type breakdown:"));
        Object.entries(typeBreakdown).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4597")) {
            {}
          } else {
            stryCov_9fa48("4597");
            console.log(stryMutAct_9fa48("4598") ? `` : (stryCov_9fa48("4598"), `  ${type}: ${count} files`));
          }
        });

        // Confirm before processing
        console.log(stryMutAct_9fa48("4599") ? "" : (stryCov_9fa48("4599"), "\n⚠️  This will process files and may take some time."));
        console.log(stryMutAct_9fa48("4600") ? "" : (stryCov_9fa48("4600"), "Press Ctrl+C to cancel..."));

        // Add a small delay to allow cancellation
        await new Promise(stryMutAct_9fa48("4601") ? () => undefined : (stryCov_9fa48("4601"), resolve => setTimeout(resolve, 2000)));

        // Process files
        const result = await ingestionPipeline.ingestFiles(filesToProcess, stryMutAct_9fa48("4602") ? {} : (stryCov_9fa48("4602"), {
          batchSize: options.batchSize,
          rateLimitMs: options.rateLimitMs,
          skipExisting: options.skipExisting,
          maxFileSize: options.maxFileSize
        }));

        // Display results
        console.log(stryMutAct_9fa48("4603") ? "" : (stryCov_9fa48("4603"), "\n🎉 Multi-modal ingestion completed!"));
        console.log(stryMutAct_9fa48("4604") ? `` : (stryCov_9fa48("4604"), `📊 Results:`));
        console.log(stryMutAct_9fa48("4605") ? `` : (stryCov_9fa48("4605"), `  Total files: ${result.totalFiles}`));
        console.log(stryMutAct_9fa48("4606") ? `` : (stryCov_9fa48("4606"), `  Processed: ${result.processedFiles}`));
        console.log(stryMutAct_9fa48("4607") ? `` : (stryCov_9fa48("4607"), `  Skipped: ${result.skippedFiles}`));
        console.log(stryMutAct_9fa48("4608") ? `` : (stryCov_9fa48("4608"), `  Failed: ${result.failedFiles}`));
        console.log(stryMutAct_9fa48("4609") ? `` : (stryCov_9fa48("4609"), `  Total chunks: ${result.totalChunks}`));
        console.log(stryMutAct_9fa48("4610") ? `` : (stryCov_9fa48("4610"), `  Processed chunks: ${result.processedChunks}`));
        console.log(stryMutAct_9fa48("4611") ? `` : (stryCov_9fa48("4611"), `\n📈 Content type statistics:`));
        Object.entries(result.contentTypeStats).forEach(([type, count]) => {
          if (stryMutAct_9fa48("4612")) {
            {}
          } else {
            stryCov_9fa48("4612");
            if (stryMutAct_9fa48("4616") ? count <= 0 : stryMutAct_9fa48("4615") ? count >= 0 : stryMutAct_9fa48("4614") ? false : stryMutAct_9fa48("4613") ? true : (stryCov_9fa48("4613", "4614", "4615", "4616"), count > 0)) {
              if (stryMutAct_9fa48("4617")) {
                {}
              } else {
                stryCov_9fa48("4617");
                console.log(stryMutAct_9fa48("4618") ? `` : (stryCov_9fa48("4618"), `  ${type}: ${count} files`));
              }
            }
          }
        });
        if (stryMutAct_9fa48("4622") ? result.errors.length <= 0 : stryMutAct_9fa48("4621") ? result.errors.length >= 0 : stryMutAct_9fa48("4620") ? false : stryMutAct_9fa48("4619") ? true : (stryCov_9fa48("4619", "4620", "4621", "4622"), result.errors.length > 0)) {
          if (stryMutAct_9fa48("4623")) {
            {}
          } else {
            stryCov_9fa48("4623");
            console.log(stryMutAct_9fa48("4624") ? `` : (stryCov_9fa48("4624"), `\n❌ Errors encountered (${result.errors.length}):`));
            stryMutAct_9fa48("4625") ? result.errors.forEach((error, index) => {
              console.log(`  ${index + 1}. ${error}`);
            }) : (stryCov_9fa48("4625"), result.errors.slice(0, 10).forEach((error, index) => {
              if (stryMutAct_9fa48("4626")) {
                {}
              } else {
                stryCov_9fa48("4626");
                console.log(stryMutAct_9fa48("4627") ? `` : (stryCov_9fa48("4627"), `  ${stryMutAct_9fa48("4628") ? index - 1 : (stryCov_9fa48("4628"), index + 1)}. ${error}`));
              }
            }));
            if (stryMutAct_9fa48("4632") ? result.errors.length <= 10 : stryMutAct_9fa48("4631") ? result.errors.length >= 10 : stryMutAct_9fa48("4630") ? false : stryMutAct_9fa48("4629") ? true : (stryCov_9fa48("4629", "4630", "4631", "4632"), result.errors.length > 10)) {
              if (stryMutAct_9fa48("4633")) {
                {}
              } else {
                stryCov_9fa48("4633");
                console.log(stryMutAct_9fa48("4634") ? `` : (stryCov_9fa48("4634"), `  ... and ${stryMutAct_9fa48("4635") ? result.errors.length + 10 : (stryCov_9fa48("4635"), result.errors.length - 10)} more errors`));
              }
            }
          }
        }

        // Validate ingestion
        console.log(stryMutAct_9fa48("4636") ? "" : (stryCov_9fa48("4636"), "\n🔍 Validating ingestion..."));
        const validation = await validateIngestion(database, result.processedChunks);
        console.log(stryMutAct_9fa48("4637") ? `` : (stryCov_9fa48("4637"), `✅ Validation: ${validation.isValid ? stryMutAct_9fa48("4638") ? "" : (stryCov_9fa48("4638"), "PASSED") : stryMutAct_9fa48("4639") ? "" : (stryCov_9fa48("4639"), "FAILED")}`));
        if (stryMutAct_9fa48("4642") ? !validation.isValid || validation.errors.length > 0 : stryMutAct_9fa48("4641") ? false : stryMutAct_9fa48("4640") ? true : (stryCov_9fa48("4640", "4641", "4642"), (stryMutAct_9fa48("4643") ? validation.isValid : (stryCov_9fa48("4643"), !validation.isValid)) && (stryMutAct_9fa48("4646") ? validation.errors.length <= 0 : stryMutAct_9fa48("4645") ? validation.errors.length >= 0 : stryMutAct_9fa48("4644") ? true : (stryCov_9fa48("4644", "4645", "4646"), validation.errors.length > 0)))) {
          if (stryMutAct_9fa48("4647")) {
            {}
          } else {
            stryCov_9fa48("4647");
            console.log(stryMutAct_9fa48("4648") ? "" : (stryCov_9fa48("4648"), "❌ Validation errors:"));
            validation.errors.forEach(stryMutAct_9fa48("4649") ? () => undefined : (stryCov_9fa48("4649"), error => console.log(stryMutAct_9fa48("4650") ? `` : (stryCov_9fa48("4650"), `  - ${error}`))));
          }
        }
      }
    } catch (error) {
      if (stryMutAct_9fa48("4651")) {
        {}
      } else {
        stryCov_9fa48("4651");
        console.error(stryMutAct_9fa48("4652") ? "" : (stryCov_9fa48("4652"), "❌ Multi-modal ingestion failed:"), error);
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
  if (stryMutAct_9fa48("4653")) {
    {}
  } else {
    stryCov_9fa48("4653");
    const files: string[] = stryMutAct_9fa48("4654") ? ["Stryker was here"] : (stryCov_9fa48("4654"), []);
    for (const inputPath of inputPaths) {
      if (stryMutAct_9fa48("4655")) {
        {}
      } else {
        stryCov_9fa48("4655");
        if (stryMutAct_9fa48("4657") ? false : stryMutAct_9fa48("4656") ? true : (stryCov_9fa48("4656", "4657"), fs.existsSync(inputPath))) {
          if (stryMutAct_9fa48("4658")) {
            {}
          } else {
            stryCov_9fa48("4658");
            const stat = fs.statSync(inputPath);
            if (stryMutAct_9fa48("4660") ? false : stryMutAct_9fa48("4659") ? true : (stryCov_9fa48("4659", "4660"), stat.isDirectory())) {
              if (stryMutAct_9fa48("4661")) {
                {}
              } else {
                stryCov_9fa48("4661");
                // Walk directory
                await walkDirectory(inputPath, files, options);
              }
            } else if (stryMutAct_9fa48("4663") ? false : stryMutAct_9fa48("4662") ? true : (stryCov_9fa48("4662", "4663"), stat.isFile())) {
              if (stryMutAct_9fa48("4664")) {
                {}
              } else {
                stryCov_9fa48("4664");
                // Single file
                if (stryMutAct_9fa48("4666") ? false : stryMutAct_9fa48("4665") ? true : (stryCov_9fa48("4665", "4666"), shouldIncludeFile(inputPath, options))) {
                  if (stryMutAct_9fa48("4667")) {
                    {}
                  } else {
                    stryCov_9fa48("4667");
                    files.push(inputPath);
                  }
                }
              }
            }
          }
        } else {
          if (stryMutAct_9fa48("4668")) {
            {}
          } else {
            stryCov_9fa48("4668");
            console.warn(stryMutAct_9fa48("4669") ? `` : (stryCov_9fa48("4669"), `⚠️  Path does not exist: ${inputPath}`));
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
  if (stryMutAct_9fa48("4670")) {
    {}
  } else {
    stryCov_9fa48("4670");
    const entries = fs.readdirSync(dirPath, stryMutAct_9fa48("4671") ? {} : (stryCov_9fa48("4671"), {
      withFileTypes: stryMutAct_9fa48("4672") ? false : (stryCov_9fa48("4672"), true)
    }));
    for (const entry of entries) {
      if (stryMutAct_9fa48("4673")) {
        {}
      } else {
        stryCov_9fa48("4673");
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(process.cwd(), fullPath);

        // Check exclude patterns
        if (stryMutAct_9fa48("4676") ? options.excludePatterns.every(pattern => matchesPattern(relativePath, pattern)) : stryMutAct_9fa48("4675") ? false : stryMutAct_9fa48("4674") ? true : (stryCov_9fa48("4674", "4675", "4676"), options.excludePatterns.some(stryMutAct_9fa48("4677") ? () => undefined : (stryCov_9fa48("4677"), pattern => matchesPattern(relativePath, pattern))))) {
          if (stryMutAct_9fa48("4678")) {
            {}
          } else {
            stryCov_9fa48("4678");
            continue;
          }
        }
        if (stryMutAct_9fa48("4680") ? false : stryMutAct_9fa48("4679") ? true : (stryCov_9fa48("4679", "4680"), entry.isDirectory())) {
          if (stryMutAct_9fa48("4681")) {
            {}
          } else {
            stryCov_9fa48("4681");
            await walkDirectory(fullPath, files, options);
          }
        } else if (stryMutAct_9fa48("4683") ? false : stryMutAct_9fa48("4682") ? true : (stryCov_9fa48("4682", "4683"), entry.isFile())) {
          if (stryMutAct_9fa48("4684")) {
            {}
          } else {
            stryCov_9fa48("4684");
            if (stryMutAct_9fa48("4686") ? false : stryMutAct_9fa48("4685") ? true : (stryCov_9fa48("4685", "4686"), shouldIncludeFile(relativePath, options))) {
              if (stryMutAct_9fa48("4687")) {
                {}
              } else {
                stryCov_9fa48("4687");
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
  if (stryMutAct_9fa48("4688")) {
    {}
  } else {
    stryCov_9fa48("4688");
    // Check exclude patterns first
    if (stryMutAct_9fa48("4691") ? options.excludePatterns.every(pattern => matchesPattern(filePath, pattern)) : stryMutAct_9fa48("4690") ? false : stryMutAct_9fa48("4689") ? true : (stryCov_9fa48("4689", "4690", "4691"), options.excludePatterns.some(stryMutAct_9fa48("4692") ? () => undefined : (stryCov_9fa48("4692"), pattern => matchesPattern(filePath, pattern))))) {
      if (stryMutAct_9fa48("4693")) {
        {}
      } else {
        stryCov_9fa48("4693");
        return stryMutAct_9fa48("4694") ? true : (stryCov_9fa48("4694"), false);
      }
    }

    // Check include patterns
    return stryMutAct_9fa48("4695") ? options.includePatterns.every(pattern => matchesPattern(filePath, pattern)) : (stryCov_9fa48("4695"), options.includePatterns.some(stryMutAct_9fa48("4696") ? () => undefined : (stryCov_9fa48("4696"), pattern => matchesPattern(filePath, pattern))));
  }
}

/**
 * Simple pattern matching (supports ** and *)
 */
function matchesPattern(filePath: string, pattern: string): boolean {
  if (stryMutAct_9fa48("4697")) {
    {}
  } else {
    stryCov_9fa48("4697");
    const regexPattern = pattern.replace(/\*\*/g, stryMutAct_9fa48("4698") ? "" : (stryCov_9fa48("4698"), ".*")).replace(/\*/g, stryMutAct_9fa48("4699") ? "" : (stryCov_9fa48("4699"), "[^/]*")).replace(/\?/g, stryMutAct_9fa48("4700") ? "" : (stryCov_9fa48("4700"), "."));
    const regex = new RegExp(stryMutAct_9fa48("4701") ? `` : (stryCov_9fa48("4701"), `^${regexPattern}$`));
    return regex.test(filePath);
  }
}

/**
 * Get content type breakdown for display
 */
function getContentTypeBreakdown(files: string[]): Record<string, number> {
  if (stryMutAct_9fa48("4702")) {
    {}
  } else {
    stryCov_9fa48("4702");
    const breakdown: Record<string, number> = {};
    files.forEach(file => {
      if (stryMutAct_9fa48("4703")) {
        {}
      } else {
        stryCov_9fa48("4703");
        const ext = stryMutAct_9fa48("4704") ? path.extname(file).toUpperCase() : (stryCov_9fa48("4704"), path.extname(file).toLowerCase());
        const type = getContentTypeFromExtension(ext);
        breakdown[type] = stryMutAct_9fa48("4705") ? (breakdown[type] || 0) - 1 : (stryCov_9fa48("4705"), (stryMutAct_9fa48("4708") ? breakdown[type] && 0 : stryMutAct_9fa48("4707") ? false : stryMutAct_9fa48("4706") ? true : (stryCov_9fa48("4706", "4707", "4708"), breakdown[type] || 0)) + 1);
      }
    });
    return breakdown;
  }
}

/**
 * Map file extension to content type for display
 */
function getContentTypeFromExtension(ext: string): string {
  if (stryMutAct_9fa48("4709")) {
    {}
  } else {
    stryCov_9fa48("4709");
    const extMap: Record<string, string> = stryMutAct_9fa48("4710") ? {} : (stryCov_9fa48("4710"), {
      ".md": stryMutAct_9fa48("4711") ? "" : (stryCov_9fa48("4711"), "Markdown"),
      ".txt": stryMutAct_9fa48("4712") ? "" : (stryCov_9fa48("4712"), "Text"),
      ".pdf": stryMutAct_9fa48("4713") ? "" : (stryCov_9fa48("4713"), "PDF"),
      ".docx": stryMutAct_9fa48("4714") ? "" : (stryCov_9fa48("4714"), "Word Document"),
      ".doc": stryMutAct_9fa48("4715") ? "" : (stryCov_9fa48("4715"), "Word Document"),
      ".xlsx": stryMutAct_9fa48("4716") ? "" : (stryCov_9fa48("4716"), "Excel Spreadsheet"),
      ".xls": stryMutAct_9fa48("4717") ? "" : (stryCov_9fa48("4717"), "Excel Spreadsheet"),
      ".pptx": stryMutAct_9fa48("4718") ? "" : (stryCov_9fa48("4718"), "PowerPoint"),
      ".ppt": stryMutAct_9fa48("4719") ? "" : (stryCov_9fa48("4719"), "PowerPoint"),
      ".jpg": stryMutAct_9fa48("4720") ? "" : (stryCov_9fa48("4720"), "Image"),
      ".jpeg": stryMutAct_9fa48("4721") ? "" : (stryCov_9fa48("4721"), "Image"),
      ".png": stryMutAct_9fa48("4722") ? "" : (stryCov_9fa48("4722"), "Image"),
      ".gif": stryMutAct_9fa48("4723") ? "" : (stryCov_9fa48("4723"), "Image"),
      ".mp3": stryMutAct_9fa48("4724") ? "" : (stryCov_9fa48("4724"), "Audio"),
      ".wav": stryMutAct_9fa48("4725") ? "" : (stryCov_9fa48("4725"), "Audio"),
      ".mp4": stryMutAct_9fa48("4726") ? "" : (stryCov_9fa48("4726"), "Video"),
      ".avi": stryMutAct_9fa48("4727") ? "" : (stryCov_9fa48("4727"), "Video"),
      ".json": stryMutAct_9fa48("4728") ? "" : (stryCov_9fa48("4728"), "JSON"),
      ".xml": stryMutAct_9fa48("4729") ? "" : (stryCov_9fa48("4729"), "XML"),
      ".csv": stryMutAct_9fa48("4730") ? "" : (stryCov_9fa48("4730"), "CSV")
    });
    return stryMutAct_9fa48("4733") ? extMap[ext] && "Other" : stryMutAct_9fa48("4732") ? false : stryMutAct_9fa48("4731") ? true : (stryCov_9fa48("4731", "4732", "4733"), extMap[ext] || (stryMutAct_9fa48("4734") ? "" : (stryCov_9fa48("4734"), "Other")));
  }
}

/**
 * Validate ingestion results
 */
async function validateIngestion(database: ObsidianDatabase, expectedChunks: number): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  if (stryMutAct_9fa48("4735")) {
    {}
  } else {
    stryCov_9fa48("4735");
    try {
      if (stryMutAct_9fa48("4736")) {
        {}
      } else {
        stryCov_9fa48("4736");
        const stats = await database.getStats();
        const errors: string[] = stryMutAct_9fa48("4737") ? ["Stryker was here"] : (stryCov_9fa48("4737"), []);
        if (stryMutAct_9fa48("4740") ? stats.totalChunks !== 0 : stryMutAct_9fa48("4739") ? false : stryMutAct_9fa48("4738") ? true : (stryCov_9fa48("4738", "4739", "4740"), stats.totalChunks === 0)) {
          if (stryMutAct_9fa48("4741")) {
            {}
          } else {
            stryCov_9fa48("4741");
            errors.push(stryMutAct_9fa48("4742") ? "" : (stryCov_9fa48("4742"), "No chunks found in database"));
          }
        }

        // Check that we have some chunks with multi-modal metadata
        const sampleChunks = await database.search((stryMutAct_9fa48("4743") ? new Array() : (stryCov_9fa48("4743"), new Array(768))).fill(0), 5);
        const hasMultiModal = stryMutAct_9fa48("4744") ? sampleChunks.every(chunk => chunk.meta.multiModalFile !== undefined) : (stryCov_9fa48("4744"), sampleChunks.some(stryMutAct_9fa48("4745") ? () => undefined : (stryCov_9fa48("4745"), chunk => stryMutAct_9fa48("4748") ? chunk.meta.multiModalFile === undefined : stryMutAct_9fa48("4747") ? false : stryMutAct_9fa48("4746") ? true : (stryCov_9fa48("4746", "4747", "4748"), chunk.meta.multiModalFile !== undefined))));
        if (stryMutAct_9fa48("4751") ? !hasMultiModal || expectedChunks > 0 : stryMutAct_9fa48("4750") ? false : stryMutAct_9fa48("4749") ? true : (stryCov_9fa48("4749", "4750", "4751"), (stryMutAct_9fa48("4752") ? hasMultiModal : (stryCov_9fa48("4752"), !hasMultiModal)) && (stryMutAct_9fa48("4755") ? expectedChunks <= 0 : stryMutAct_9fa48("4754") ? expectedChunks >= 0 : stryMutAct_9fa48("4753") ? true : (stryCov_9fa48("4753", "4754", "4755"), expectedChunks > 0)))) {
          if (stryMutAct_9fa48("4756")) {
            {}
          } else {
            stryCov_9fa48("4756");
            errors.push(stryMutAct_9fa48("4757") ? "" : (stryCov_9fa48("4757"), "No multi-modal chunks found - ingestion may have failed"));
          }
        }
        return stryMutAct_9fa48("4758") ? {} : (stryCov_9fa48("4758"), {
          isValid: stryMutAct_9fa48("4761") ? errors.length !== 0 : stryMutAct_9fa48("4760") ? false : stryMutAct_9fa48("4759") ? true : (stryCov_9fa48("4759", "4760", "4761"), errors.length === 0),
          errors
        });
      }
    } catch (error) {
      if (stryMutAct_9fa48("4762")) {
        {}
      } else {
        stryCov_9fa48("4762");
        return stryMutAct_9fa48("4763") ? {} : (stryCov_9fa48("4763"), {
          isValid: stryMutAct_9fa48("4764") ? true : (stryCov_9fa48("4764"), false),
          errors: stryMutAct_9fa48("4765") ? [] : (stryCov_9fa48("4765"), [stryMutAct_9fa48("4766") ? `` : (stryCov_9fa48("4766"), `Validation failed: ${error}`)])
        });
      }
    }
  }
}

// Run the script
main().catch(console.error);