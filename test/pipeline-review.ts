/**
 * End-to-end pipeline review script.
 * Tests each stage of the video processing pipeline independently
 * and reports on quality of each component.
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  AdaptiveFrameExtractor,
  SceneDetector,
  FrameExtractor,
  FrameDeduplicator,
  PerceptualHasher,
  VideoMetadataExtractor,
  createTempDir,
} from "@obsidian-rag/media-processing";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_PATH = path.resolve(__dirname, "test-files/test-video.mp4");
const OUTPUT_DIR = createTempDir("pipeline-review");

async function stage1_metadata() {
  console.log("\n" + "=".repeat(60));
  console.log("STAGE 1: Video Metadata Extraction");
  console.log("=".repeat(60));

  const extractor = new VideoMetadataExtractor();
  const metadata = await extractor.extract(VIDEO_PATH);

  console.log(`  Duration: ${(metadata.duration / 60).toFixed(1)} min (${metadata.duration.toFixed(1)}s)`);
  console.log(`  Resolution: ${metadata.width}x${metadata.height}`);
  console.log(`  Frame rate: ${metadata.frameRate.toFixed(2)} fps`);
  console.log(`  Codec: ${metadata.codec}`);
  console.log(`  Has audio: ${metadata.hasAudio}`);
  console.log(`  Size: ${(metadata.size / 1024 / 1024).toFixed(1)} MB`);

  return metadata;
}

async function stage2_frameExtraction(duration: number) {
  console.log("\n" + "=".repeat(60));
  console.log("STAGE 2: Adaptive Frame Extraction");
  console.log("=".repeat(60));

  const sceneDetector = new SceneDetector();
  const frameExtractor = new FrameExtractor();
  const hasher = new PerceptualHasher();
  const deduplicator = new FrameDeduplicator(hasher);
  const metadataExtractor = new VideoMetadataExtractor();
  const adaptiveExtractor = new AdaptiveFrameExtractor(
    sceneDetector,
    frameExtractor,
    deduplicator,
    metadataExtractor,
  );

  const start = Date.now();
  const result = await adaptiveExtractor.extract(VIDEO_PATH, {
    sceneThreshold: 0.3,
    minSceneLength: 1.0,
    enableDeduplication: true,
    maxFrames: 200,
    fallbackInterval: 30,
    outputDir: OUTPUT_DIR,
    outputFormat: "png",
  });
  const elapsed = (Date.now() - start) / 1000;

  console.log(`  Strategy: ${result.stats.strategy}`);
  console.log(`  Scenes detected: ${result.stats.scenesDetected}`);
  console.log(`  Frames extracted: ${result.stats.framesExtracted}`);
  console.log(`  Duplicates removed: ${result.stats.duplicatesRemoved}`);
  console.log(`  Time: ${elapsed.toFixed(1)}s`);
  console.log(`  Output: ${OUTPUT_DIR}`);

  // Show frame distribution - are they spread across the video?
  if (result.frames.length > 0) {
    const first = result.frames[0].timestamp;
    const last = result.frames[result.frames.length - 1].timestamp;
    const gaps: number[] = [];
    for (let i = 1; i < result.frames.length; i++) {
      gaps.push(result.frames[i].timestamp - result.frames[i - 1].timestamp);
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const maxGap = Math.max(...gaps);
    const minGap = Math.min(...gaps);

    console.log(`\n  Frame distribution:`);
    console.log(`    First frame: ${first.toFixed(1)}s`);
    console.log(`    Last frame: ${last.toFixed(1)}s`);
    console.log(`    Coverage: ${((last / duration) * 100).toFixed(0)}% of video`);
    console.log(`    Avg gap: ${avgGap.toFixed(1)}s`);
    console.log(`    Min gap: ${minGap.toFixed(1)}s`);
    console.log(`    Max gap: ${maxGap.toFixed(1)}s`);

    // Compare with old fixed-20 approach
    const fixedInterval = duration / 20;
    console.log(`\n  vs Fixed 20 frames:`);
    console.log(`    Fixed interval would be: ${fixedInterval.toFixed(1)}s`);
    console.log(`    Adaptive frames: ${result.frames.length} (${(result.frames.length / 20).toFixed(1)}x more)`);
  }

  return result;
}

async function stage3_ocr(framePaths: string[]) {
  console.log("\n" + "=".repeat(60));
  console.log("STAGE 3: OCR on Extracted Frames");
  console.log("=".repeat(60));

  // Dynamically import OCR processor from kv_database
  // We'll use tesseract.js directly to avoid bootstrapping the whole app
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");

  // Sample frames evenly - test 10 frames spread across the video
  const sampleSize = Math.min(10, framePaths.length);
  const step = Math.floor(framePaths.length / sampleSize);
  const sampleIndices = Array.from({ length: sampleSize }, (_, i) => i * step);

  const results: Array<{
    index: number;
    path: string;
    text: string;
    confidence: number;
    wordCount: number;
  }> = [];

  console.log(`  Testing OCR on ${sampleSize} sample frames (of ${framePaths.length} total)...\n`);

  for (const idx of sampleIndices) {
    const framePath = framePaths[idx];
    const buffer = fs.readFileSync(framePath);
    const start = Date.now();
    const ocrResult = await worker.recognize(buffer);
    const elapsed = Date.now() - start;

    const text = ocrResult.data.text.trim();
    const confidence = ocrResult.data.confidence ?? 0;
    const words = text.split(/\s+/).filter((w: string) => w.length > 0);

    results.push({
      index: idx,
      path: framePath,
      text,
      confidence,
      wordCount: words.length,
    });

    const preview = text.replace(/\n/g, " ").substring(0, 80);
    console.log(`  Frame ${idx.toString().padStart(3)}:  conf=${confidence.toFixed(0)}%  words=${words.length.toString().padStart(3)}  (${elapsed}ms)`);
    if (text.length > 0) {
      console.log(`           "${preview}${text.length > 80 ? "..." : ""}"`);
    } else {
      console.log(`           (no text detected)`);
    }
  }

  await worker.terminate();

  // Summary
  const withText = results.filter((r) => r.wordCount > 0);
  const avgConf = results.reduce((s, r) => s + r.confidence, 0) / results.length;
  const avgWords = withText.length > 0 ? withText.reduce((s, r) => s + r.wordCount, 0) / withText.length : 0;

  console.log(`\n  OCR Summary:`);
  console.log(`    Frames with text: ${withText.length}/${sampleSize} (${((withText.length / sampleSize) * 100).toFixed(0)}%)`);
  console.log(`    Average confidence: ${avgConf.toFixed(1)}%`);
  console.log(`    Avg words per frame (with text): ${avgWords.toFixed(0)}`);
  console.log(`    Total unique words across sample: ${new Set(withText.flatMap((r) => r.text.toLowerCase().split(/\s+/))).size}`);

  return results;
}

async function stage4_transcription() {
  console.log("\n" + "=".repeat(60));
  console.log("STAGE 4: Audio Transcription");
  console.log("=".repeat(60));

  // Check if nodejs-whisper is available
  let whisperAvailable = false;
  try {
    await import("nodejs-whisper");
    whisperAvailable = true;
  } catch {
    console.log("  nodejs-whisper not available, checking other options...");
  }

  // Use ffmpeg to extract audio first
  const { spawn } = await import("child_process");
  const audioPath = path.join(OUTPUT_DIR, "audio.wav");

  console.log("  Extracting audio from video...");
  await new Promise<void>((resolve, reject) => {
    const proc = spawn("ffmpeg", [
      "-i", VIDEO_PATH,
      "-vn",
      "-acodec", "pcm_s16le",
      "-ar", "16000",
      "-ac", "1",
      "-y",
      audioPath,
    ], { stdio: ["ignore", "ignore", "pipe"] });

    let stderr = "";
    proc.stderr.on("data", (d: Buffer) => { stderr += d.toString(); });
    proc.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg audio extraction failed: ${stderr.slice(-200)}`));
    });
    proc.on("error", reject);
  });

  const audioStat = fs.statSync(audioPath);
  console.log(`  Audio extracted: ${(audioStat.size / 1024 / 1024).toFixed(1)} MB`);

  if (whisperAvailable) {
    console.log("  Running Whisper.cpp transcription...");
    try {
      const { nodewhisper } = await import("nodejs-whisper");
      const start = Date.now();
      const transcript = await nodewhisper(audioPath, {
        modelName: "base",
        whisperOptions: {
          language: "en",
          word_timestamps: true,
          no_speech_threshold: 0.6,
          temperature: 0.0,
        },
      });
      const elapsed = (Date.now() - start) / 1000;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = typeof transcript === "string" ? transcript : (transcript as any).text || JSON.stringify(transcript);
      const words = text.split(/\s+/).filter((w: string) => w.length > 0);

      console.log(`\n  Transcription Results:`);
      console.log(`    Engine: whisper-cpp`);
      console.log(`    Time: ${elapsed.toFixed(1)}s`);
      console.log(`    Words: ${words.length}`);
      console.log(`    Characters: ${text.length}`);
      console.log(`\n  First 500 characters:`);
      console.log(`    "${text.substring(0, 500)}..."`);

      return { text, engine: "whisper-cpp" as const, available: true };
    } catch (err) {
      console.log(`  Whisper.cpp failed: ${err}`);
    }
  }

  console.log("  No transcription engine available.");
  console.log("  To enable: install nodejs-whisper or set OPENAI_API_KEY");
  return { text: "", engine: "none" as const, available: false };
}

async function stage5_combinedOutput(
  ocrResults: Array<{ index: number; text: string; confidence: number; wordCount: number }>,
  transcription: { text: string; engine: string; available: boolean },
) {
  console.log("\n" + "=".repeat(60));
  console.log("STAGE 5: Combined Output & Metadata Assembly");
  console.log("=".repeat(60));

  // Simulate what video-processor.ts does
  const ocrTextSegments = ocrResults
    .filter((r) => r.text.trim() && r.wordCount > 0)
    .map((r, _i) => `[Frame ${r.index} @ sample]: ${r.text.trim()}`);

  const ocrText = ocrTextSegments.join("\n\n");
  const audioText = transcription.text;
  const allText = [ocrText, audioText].filter((t) => t.trim()).join("\n\n");

  const allWords = allText.split(/\s+/).filter((w) => w.length > 0);

  console.log(`  OCR text segments: ${ocrTextSegments.length}`);
  console.log(`  OCR total words: ${ocrText.split(/\s+/).filter((w) => w.length > 0).length}`);
  console.log(`  Audio transcript words: ${audioText.split(/\s+/).filter((w) => w.length > 0).length}`);
  console.log(`  Combined total words: ${allWords.length}`);
  console.log(`  Combined total characters: ${allText.length}`);

  // Check for text overlap between OCR and audio
  if (ocrText && audioText) {
    const ocrWords = new Set(ocrText.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const audioWords = new Set(audioText.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    const overlap = new Set([...ocrWords].filter((w) => audioWords.has(w)));
    console.log(`\n  Text overlap analysis (words > 3 chars):`);
    console.log(`    OCR unique words: ${ocrWords.size}`);
    console.log(`    Audio unique words: ${audioWords.size}`);
    console.log(`    Overlapping words: ${overlap.size}`);
    console.log(`    Overlap rate: ${ocrWords.size > 0 ? ((overlap.size / ocrWords.size) * 100).toFixed(0) : 0}% of OCR words appear in audio`);
    console.log(`    This indicates the OCR captures content ${overlap.size > ocrWords.size * 0.5 ? "already spoken (redundant)" : "NOT spoken (complementary)"}`);
  }

  // Show quality assessment
  console.log(`\n  Quality Assessment:`);
  console.log(`    Frame extraction: ${ocrResults.length > 0 ? "OK" : "MISSING"}`);
  console.log(`    OCR working: ${ocrResults.some((r) => r.wordCount > 5) ? "YES - extracting meaningful text" : "POOR - minimal text detected"}`);
  console.log(`    Transcription: ${transcription.available ? `YES (${transcription.engine})` : "NOT AVAILABLE"}`);
  console.log(`    Combined richness: ${allWords.length > 100 ? "GOOD" : allWords.length > 20 ? "MODERATE" : "LOW"} (${allWords.length} words total)`);

  return allText;
}

async function main() {
  console.log("Video Processing Pipeline Review");
  console.log("================================");
  console.log(`Video: ${VIDEO_PATH}`);
  console.log(`Output: ${OUTPUT_DIR}`);

  if (!fs.existsSync(VIDEO_PATH)) {
    console.error(`\nERROR: Video file not found at ${VIDEO_PATH}`);
    console.error("Place a test video at test/test-files/test-video.mp4");
    process.exit(1);
  }

  // Stage 1: Metadata
  const metadata = await stage1_metadata();

  // Stage 2: Frame extraction
  const extractionResult = await stage2_frameExtraction(metadata.duration);
  const framePaths = extractionResult.frames.map((f) => f.imagePath);

  // Stage 3: OCR on sample frames
  const ocrResults = await stage3_ocr(framePaths);

  // Stage 4: Audio transcription
  const transcription = await stage4_transcription();

  // Stage 5: Combined output
  await stage5_combinedOutput(ocrResults, transcription);

  console.log("\n" + "=".repeat(60));
  console.log("REVIEW COMPLETE");
  console.log("=".repeat(60));
  console.log(`\nExtracted frames are at: ${OUTPUT_DIR}`);
  console.log("You can inspect them visually to verify quality.");
}

main().catch((err) => {
  console.error("Pipeline review failed:", err);
  process.exit(1);
});
