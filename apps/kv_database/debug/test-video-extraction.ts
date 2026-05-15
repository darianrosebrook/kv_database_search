/**
 * Test script for video extraction pipeline
 * Usage: npx tsx apps/kv_database/debug/test-video-extraction.ts [--export <dir>] <path-to-video>
 */
import * as fs from "fs";
import * as path from "path";
import { VideoProcessor } from "../src/lib/processors/video-processor.ts";

// Parse args
const args = process.argv.slice(2);
let exportDir: string | undefined;
let videoPath: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--export" && i + 1 < args.length) {
    exportDir = args[++i];
  } else if (!videoPath) {
    videoPath = args[i];
  }
}

if (!videoPath) {
  console.error(
    "Usage: npx tsx scripts/test-video-extraction.ts [--export <dir>] <path-to-video>"
  );
  process.exit(1);
}

const resolvedPath = path.resolve(videoPath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`File not found: ${resolvedPath}`);
  process.exit(1);
}

const resolvedExportDir = exportDir ? path.resolve(exportDir) : undefined;

const stats = fs.statSync(resolvedPath);
console.log(`\n📹 Video file: ${path.basename(resolvedPath)}`);
console.log(`   Size: ${(stats.size / 1024 / 1024).toFixed(1)} MB`);
if (resolvedExportDir) {
  console.log(`   Export to: ${resolvedExportDir}`);
}
console.log("");

async function main() {
  const startTime = Date.now();

  const processor = new VideoProcessor();

  console.log("Starting video extraction pipeline...\n");
  const result = await processor.extractText(
    resolvedPath,
    resolvedExportDir ? { outputDir: resolvedExportDir } : undefined
  );

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log("\n" + "=".repeat(60));
  console.log("RESULTS");
  console.log("=".repeat(60));
  console.log(`Success: ${result.success}`);
  console.log(`Processing time: ${elapsed}s`);
  console.log(`Word count: ${result.metadata.wordCount}`);
  console.log(`Character count: ${result.metadata.characterCount}`);
  console.log(`Language: ${result.metadata.language}`);

  const meta = result.metadata as any;

  if (meta.videoMetadata) {
    const vm = meta.videoMetadata;
    console.log(`\nVideo metadata:`);
    console.log(`  Duration: ${vm.duration?.toFixed(1)}s`);
    console.log(`  Resolution: ${vm.resolution}`);
    console.log(`  Codec: ${vm.codec}`);
    console.log(`  Frame rate: ${vm.frameRate}`);
    console.log(`  Has audio: ${vm.hasAudio}`);
    console.log(`  Format: ${vm.format}`);
  }

  if (meta.frameCount !== undefined) {
    console.log(`\nFrames extracted: ${meta.frameCount}`);
  }

  if (meta.audioTranscription) {
    const at = meta.audioTranscription;
    console.log(`\nAudio transcription:`);
    console.log(`  Words: ${at.wordCount}`);
    console.log(`  Speech duration: ${at.speechDuration}s`);
    console.log(`  Quality score: ${at.qualityScore}`);
    console.log(`  Preview: ${at.text?.substring(0, 300)}...`);
  }

  if (meta.contentClassification) {
    console.log(`\nContent classification:`, meta.contentClassification);
  }

  if (meta.entities?.length) {
    console.log(`\nEntities found: ${meta.entities.length}`);
    const topEntities = meta.entities.slice(0, 10);
    for (const e of topEntities) {
      console.log(
        `  [${e.type}] ${e.text} (confidence: ${e.confidence?.toFixed(2)})`
      );
    }
  }

  if (meta.keyframes) {
    console.log(`\nKeyframes: ${meta.keyframes.count}`);
  }

  // Print first 500 chars of extracted text
  console.log(`\nExtracted text preview:`);
  console.log("-".repeat(60));
  console.log(result.text.substring(0, 500));
  console.log("-".repeat(60));

  if (resolvedExportDir) {
    console.log(`\n📦 Artifacts exported to: ${resolvedExportDir}`);
    // List exported files
    const listDir = (dir: string, prefix = "") => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          console.log(`   ${prefix}${entry.name}/`);
          listDir(path.join(dir, entry.name), prefix + "  ");
        } else {
          const size = fs.statSync(path.join(dir, entry.name)).size;
          const sizeStr =
            size > 1024 * 1024
              ? `${(size / 1024 / 1024).toFixed(1)}MB`
              : size > 1024
                ? `${(size / 1024).toFixed(1)}KB`
                : `${size}B`;
          console.log(`   ${prefix}${entry.name} (${sizeStr})`);
        }
      }
    };
    listDir(resolvedExportDir);
  }

  if (result.error) {
    console.error(`\nError: ${result.error}`);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
