#!/usr/bin/env tsx
/**
 * video-extract — Extract text, transcription, and keyframes from video files
 *
 * Usage:
 *   video-extract <video-file> [options]
 *
 * Options:
 *   -o, --output <dir>     Output directory (default: ./<basename>-extracted/)
 *   --no-ocr               Skip OCR on frames
 *   --no-audio             Skip audio transcription
 *   --max-frames <n>       Maximum frames to extract (default: 200)
 *   --json                 Output results as JSON to stdout
 *   -q, --quiet            Suppress progress output (implies --json)
 *   -h, --help             Show this help
 *   -V, --version          Show version
 */

import * as fs from "fs";
import * as path from "path";
import { VideoProcessor } from "@kv/processors/video";
import { fetchVideo } from "./yt-dlp-fetch.ts";

interface CLIOptions {
  videoPath: string | null;
  url: string | null;
  outputDir: string | null;
  outputDirExplicit: boolean;
  enableOCR: boolean;
  enableAudio: boolean;
  maxFrames: number;
  sceneThreshold: number;
  minSceneLength: number;
  enableDedup: boolean;
  jsonOutput: boolean;
  quiet: boolean;
  format: string;
}

function printHelp(): void {
  console.log(`
video-extract — Extract text, transcription, and keyframes from video files

Usage:
  video-extract <video-file> [options]
  video-extract --from-url <url> [options]

Options:
  --from-url <url>       Download via yt-dlp, then extract (requires yt-dlp)
  --format <selector>    yt-dlp format selector (default: "best"). Only with --from-url.
  -o, --output <dir>     Output directory (default: ./<basename>-extracted/)
  --no-ocr               Skip OCR on frames
  --no-audio             Skip audio transcription
  --max-frames <n>       Maximum frames to extract (default: 200)
  --scene-threshold <x>  ffmpeg scene sensitivity 0..1 (default 0.1, lower = more scenes)
  --min-scene-length <s> Minimum seconds between ffmpeg-detected scene cuts (default 1.0). Note: this is a frame-level filter, NOT a "semantic dwell" filter — scrolling presenters move scenes every 1-2s while remaining on the same document, and a higher value will drop those genuine-content scenes. Semantic dwell belongs in a later pipeline stage.
  --no-dedup             Disable perceptual-hash frame deduplication
  --json                 Output results as JSON to stdout
  -q, --quiet            Suppress progress output (implies --json)
  -h, --help             Show this help
  -V, --version          Show version

Examples:
  video-extract lecture.mp4
  video-extract talk.mp4 -o ./talk-notes
  video-extract demo.mp4 --no-audio --json
  video-extract presentation.mp4 --max-frames 50
  video-extract --from-url https://youtu.be/dQw4w9WgXcQ -o ./music

Output:
  Creates a directory with:
    manifest.json             Full metadata and frame index
    transcript.md             Unified timeline (keyframes + speech)
    transcript_segments.json  Audio transcription segments
    keyframes/                Extracted keyframe images
`);
}

function printVersion(): void {
  try {
    const pkgPath = path.resolve(
      import.meta.dirname ?? __dirname,
      "..",
      "..",
      "package.json",
    );
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
    console.log(`video-extract ${pkg.version}`);
  } catch {
    console.log("video-extract 0.1.0");
  }
}

function parseArgs(argv: string[]): CLIOptions | null {
  const args = argv.slice(2);
  let videoPath: string | null = null;
  let url: string | null = null;
  let outputDir: string | null = null;
  let outputDirExplicit = false;
  let enableOCR = true;
  let enableAudio = true;
  let maxFrames = 200;
  let sceneThreshold = 0.1;
  let minSceneLength = 1.0;
  let enableDedup = true;
  let jsonOutput = false;
  let quiet = false;
  let format = "best";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "-h":
      case "--help":
        printHelp();
        process.exit(0);
        break;
      case "-V":
      case "--version":
        printVersion();
        process.exit(0);
        break;
      case "--from-url":
        url = args[++i];
        if (!url) {
          console.error("Error: --from-url requires a URL");
          process.exit(1);
        }
        break;
      case "--format":
        format = args[++i];
        if (!format) {
          console.error("Error: --format requires a yt-dlp format selector");
          process.exit(1);
        }
        break;
      case "-o":
      case "--output":
        outputDir = args[++i];
        outputDirExplicit = true;
        if (!outputDir) {
          console.error("Error: --output requires a directory path");
          process.exit(1);
        }
        break;
      case "--no-ocr":
        enableOCR = false;
        break;
      case "--no-audio":
        enableAudio = false;
        break;
      case "--max-frames":
        maxFrames = parseInt(args[++i], 10);
        if (isNaN(maxFrames) || maxFrames < 1) {
          console.error("Error: --max-frames must be a positive integer");
          process.exit(1);
        }
        break;
      case "--scene-threshold":
        sceneThreshold = parseFloat(args[++i]);
        if (isNaN(sceneThreshold) || sceneThreshold <= 0 || sceneThreshold >= 1) {
          console.error("Error: --scene-threshold must be in (0, 1)");
          process.exit(1);
        }
        break;
      case "--min-scene-length":
        minSceneLength = parseFloat(args[++i]);
        if (isNaN(minSceneLength) || minSceneLength < 0) {
          console.error("Error: --min-scene-length must be >= 0");
          process.exit(1);
        }
        break;
      case "--no-dedup":
        enableDedup = false;
        break;
      case "--json":
        jsonOutput = true;
        break;
      case "-q":
      case "--quiet":
        quiet = true;
        jsonOutput = true;
        break;
      default:
        if (arg.startsWith("-")) {
          console.error(`Unknown option: ${arg}`);
          console.error('Run "video-extract --help" for usage');
          process.exit(1);
        }
        if (!videoPath) {
          videoPath = arg;
        } else {
          console.error(`Unexpected argument: ${arg}`);
          process.exit(1);
        }
    }
  }

  // Mutual exclusion: caller must provide exactly one of <video-file> or --from-url
  if (videoPath && url) {
    console.error("Error: provide either a local file or --from-url, not both");
    process.exit(1);
  }
  if (!videoPath && !url) {
    return null;
  }

  // Resolve local file path early; URL-mode resolution happens after download
  if (videoPath) {
    const resolved = path.resolve(videoPath);
    if (!fs.existsSync(resolved)) {
      console.error(`File not found: ${resolved}`);
      process.exit(1);
    }
    videoPath = resolved;
  }

  if (outputDir) {
    outputDir = path.resolve(outputDir);
  }

  return {
    videoPath,
    url,
    outputDir,
    outputDirExplicit,
    enableOCR,
    enableAudio,
    maxFrames,
    sceneThreshold,
    minSceneLength,
    enableDedup,
    jsonOutput,
    quiet,
    format,
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  if (!opts) {
    printHelp();
    process.exit(1);
  }

  const {
    enableOCR,
    enableAudio,
    maxFrames,
    sceneThreshold,
    minSceneLength,
    enableDedup,
    jsonOutput,
    quiet,
    url,
    format,
    outputDirExplicit,
  } = opts;

  const originalLog = console.log;
  const originalWarn = console.warn;
  if (quiet) {
    console.log = () => {};
    console.warn = () => {};
  }

  // If --from-url was given, download first; the rest of the pipeline runs
  // against the resulting local file. The download temp dir is cleaned up
  // unconditionally in `finally`.
  let resolvedVideoPath: string;
  let downloadTempDir: string | null = null;
  if (url) {
    console.log(`\nFetching ${url} via yt-dlp…`);
    try {
      const fetched = await fetchVideo(url, {
        format,
        onProgress: (line) => {
          if (line.includes("[download]") || line.includes("[ExtractAudio]")) {
            console.log(`  ${line}`);
          }
        },
      });
      resolvedVideoPath = fetched.filePath;
      downloadTempDir = fetched.tempDir;
      console.log(`  ✅ Downloaded: ${path.basename(resolvedVideoPath)}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (quiet) {
        console.log = originalLog;
        console.warn = originalWarn;
      }
      console.error(`\nDownload failed: ${msg}`);
      process.exit(1);
    }
  } else {
    resolvedVideoPath = opts.videoPath!;
  }

  // Default output: ./<basename>-extracted/, derived after we know the file
  let outputDir = opts.outputDir;
  if (!outputDir) {
    const basename = path.basename(
      resolvedVideoPath,
      path.extname(resolvedVideoPath),
    );
    outputDir = path.resolve(`./${basename}-extracted`);
  }

  // If we downloaded into a temp dir and the user didn't specify --output,
  // warn loudly: putting the artifacts inside the temp dir means they'll be
  // deleted with the download. Force a sensible default.
  if (downloadTempDir && !outputDirExplicit) {
    const cwd = process.cwd();
    const basename = path.basename(
      resolvedVideoPath,
      path.extname(resolvedVideoPath),
    );
    outputDir = path.resolve(cwd, `${basename}-extracted`);
  }

  const stats = fs.statSync(resolvedVideoPath);
  console.log(`\nvideo-extract`);
  console.log(`─────────────`);
  console.log(
    `  Input:  ${path.basename(resolvedVideoPath)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`,
  );
  console.log(`  Output: ${outputDir}`);
  console.log(
    `  OCR: ${enableOCR ? "yes" : "skip"}  Audio: ${enableAudio ? "yes" : "skip"}  Max frames: ${maxFrames}`,
  );
  console.log(
    `  Scene threshold: ${sceneThreshold}  Min scene length: ${minSceneLength}s  Dedup: ${enableDedup ? "yes" : "skip"}`,
  );
  console.log("");

  fs.mkdirSync(outputDir, { recursive: true });

  const processor = new VideoProcessor();
  let result;
  try {
    result = await processor.extractText(resolvedVideoPath, {
      outputDir,
      enableOCR,
      enableSpeechTranscription: enableAudio,
      maxFramesToExtract: maxFrames,
      sceneThreshold,
      minSceneLength,
      enableFrameDeduplication: enableDedup,
    });
  } finally {
    if (downloadTempDir) {
      try {
        fs.rmSync(downloadTempDir, { recursive: true, force: true });
      } catch {
        // ignore — we did our best
      }
    }
  }

  if (!result.success) {
    if (quiet) {
      console.log = originalLog;
      console.warn = originalWarn;
    }
    console.error(
      `\nExtraction failed: ${result.errors?.join("; ") || "unknown error"}`
    );
    process.exit(1);
  }

  const textOutputPath = path.join(outputDir, "extracted-text.txt");
  fs.writeFileSync(textOutputPath, result.text, "utf-8");

  const summaryPath = path.join(outputDir, "summary.json");
  const summary = {
    source: path.basename(resolvedVideoPath),
    sourceUrl: url ?? undefined,
    sourceSize: stats.size,
    processingTimeMs: result.processingTime,
    processingTimeSec:
      (result.processingTime ?? 0) > 1000
        ? Number(((result.processingTime ?? 0) / 1000).toFixed(1))
        : result.processingTime,
    success: result.success,
    wordCount: result.metadata.wordCount,
    characterCount: result.metadata.characterCount,
    language: result.metadata.language,
    ...extractSummaryFields(result.metadata as unknown as Record<string, unknown>),
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

  if (quiet) {
    console.log = originalLog;
    console.warn = originalWarn;
  }

  if (jsonOutput) {
    originalLog(JSON.stringify(summary, null, 2));
  } else {
    console.log(`\n${"═".repeat(60)}`);
    console.log("DONE");
    console.log(`${"═".repeat(60)}`);
    console.log(`  Words extracted:  ${result.metadata.wordCount}`);
    const timeSec =
      (result.processingTime ?? 0) > 1000
        ? ((result.processingTime ?? 0) / 1000).toFixed(1)
        : (result.processingTime ?? 0).toFixed(1);
    console.log(`  Processing time:  ${timeSec}s`);
    console.log(`  Output:           ${outputDir}`);
    console.log(`\n  Files:`);
    listDir(outputDir, "    ");
    console.log("");
  }
}

function extractSummaryFields(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  if (metadata.videoMetadata) {
    fields.video = metadata.videoMetadata;
  }
  if (metadata.frameCount !== undefined) {
    fields.framesExtracted = metadata.frameCount;
  }
  if (metadata.audioTranscription) {
    const at = metadata.audioTranscription as Record<string, unknown>;
    const utterances = (at.utterances as unknown[]) ?? [];
    fields.audio = {
      transcribed: at.transcribed ?? false,
      engine: at.engine ?? "fallback",
      wordCount: at.wordCount,
      utteranceCount: utterances.length,
      speechDuration: at.speechDuration,
      qualityScore: at.qualityScore,
    };
  }
  if (metadata.contentClassification) {
    fields.contentClassification = metadata.contentClassification;
  }
  if (metadata.keyframes) {
    fields.keyframes = metadata.keyframes;
  }
  if ((metadata.entities as unknown[])?.length) {
    fields.entityCount = (metadata.entities as unknown[]).length;
  }

  return fields;
}

function listDir(dir: string, prefix = ""): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      console.log(`${prefix}${entry.name}/`);
      listDir(path.join(dir, entry.name), prefix + "  ");
    } else {
      const size = fs.statSync(path.join(dir, entry.name)).size;
      const sizeStr =
        size > 1024 * 1024
          ? `${(size / 1024 / 1024).toFixed(1)}MB`
          : size > 1024
            ? `${(size / 1024).toFixed(1)}KB`
            : `${size}B`;
      console.log(`${prefix}${entry.name} (${sizeStr})`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
