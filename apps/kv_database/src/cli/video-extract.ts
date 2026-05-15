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
import { VideoProcessor } from "../lib/processors/video-processor.ts";

interface CLIOptions {
  videoPath: string;
  outputDir: string;
  enableOCR: boolean;
  enableAudio: boolean;
  maxFrames: number;
  jsonOutput: boolean;
  quiet: boolean;
}

function printHelp(): void {
  console.log(`
video-extract — Extract text, transcription, and keyframes from video files

Usage:
  video-extract <video-file> [options]

Options:
  -o, --output <dir>     Output directory (default: ./<basename>-extracted/)
  --no-ocr               Skip OCR on frames
  --no-audio             Skip audio transcription
  --max-frames <n>       Maximum frames to extract (default: 200)
  --json                 Output results as JSON to stdout
  -q, --quiet            Suppress progress output (implies --json)
  -h, --help             Show this help
  -V, --version          Show version

Examples:
  video-extract lecture.mp4
  video-extract talk.mp4 -o ./talk-notes
  video-extract demo.mp4 --no-audio --json
  video-extract presentation.mp4 --max-frames 50

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
  let videoPath: string | undefined;
  let outputDir: string | undefined;
  let enableOCR = true;
  let enableAudio = true;
  let maxFrames = 200;
  let jsonOutput = false;
  let quiet = false;

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
      case "-o":
      case "--output":
        outputDir = args[++i];
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

  if (!videoPath) {
    return null;
  }

  const resolvedVideo = path.resolve(videoPath);
  if (!fs.existsSync(resolvedVideo)) {
    console.error(`File not found: ${resolvedVideo}`);
    process.exit(1);
  }

  if (!outputDir) {
    const basename = path.basename(resolvedVideo, path.extname(resolvedVideo));
    outputDir = path.resolve(`./${basename}-extracted`);
  } else {
    outputDir = path.resolve(outputDir);
  }

  return {
    videoPath: resolvedVideo,
    outputDir,
    enableOCR,
    enableAudio,
    maxFrames,
    jsonOutput,
    quiet,
  };
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  if (!opts) {
    printHelp();
    process.exit(1);
  }

  const {
    videoPath,
    outputDir,
    enableOCR,
    enableAudio,
    maxFrames,
    jsonOutput,
    quiet,
  } = opts;

  const originalLog = console.log;
  const originalWarn = console.warn;
  if (quiet) {
    console.log = () => {};
    console.warn = () => {};
  }

  const stats = fs.statSync(videoPath);
  console.log(`\nvideo-extract`);
  console.log(`─────────────`);
  console.log(
    `  Input:  ${path.basename(videoPath)} (${(stats.size / 1024 / 1024).toFixed(1)} MB)`,
  );
  console.log(`  Output: ${outputDir}`);
  console.log(
    `  OCR: ${enableOCR ? "yes" : "skip"}  Audio: ${enableAudio ? "yes" : "skip"}  Max frames: ${maxFrames}`,
  );
  console.log("");

  fs.mkdirSync(outputDir, { recursive: true });

  const processor = new VideoProcessor();
  const result = await processor.extractText(videoPath, {
    outputDir,
    enableOCR,
    enableSpeechTranscription: enableAudio,
    maxFramesToExtract: maxFrames,
  });

  if (!result.success) {
    if (quiet) {
      console.log = originalLog;
      console.warn = originalWarn;
    }
    console.error(`\nExtraction failed: ${result.error || "unknown error"}`);
    process.exit(1);
  }

  const textOutputPath = path.join(outputDir, "extracted-text.txt");
  fs.writeFileSync(textOutputPath, result.text, "utf-8");

  const summaryPath = path.join(outputDir, "summary.json");
  const summary = {
    source: path.basename(videoPath),
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
    fields.audio = {
      wordCount: at.wordCount,
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
