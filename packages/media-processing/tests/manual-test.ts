import {
  AdaptiveFrameExtractor,
  SceneDetector,
  FrameExtractor,
  FrameDeduplicator,
  PerceptualHasher,
  VideoMetadataExtractor,
  createTempDir,
} from "../src/index.js";

const videoPath = "/Users/darianrosebrook/Desktop/Projects/obsidian-rag/test/test-files/test-video.mp4";

async function main() {
  console.log("=== Adaptive Frame Extraction Test ===\n");

  // 1. Extract metadata first
  const metadataExtractor = new VideoMetadataExtractor();
  console.log("Extracting metadata...");
  const metadata = await metadataExtractor.extract(videoPath);
  console.log(`  Duration: ${(metadata.duration / 60).toFixed(1)} minutes (${metadata.duration.toFixed(1)}s)`);
  console.log(`  Resolution: ${metadata.width}x${metadata.height}`);
  console.log(`  Frame rate: ${metadata.frameRate.toFixed(2)} fps`);
  console.log(`  Codec: ${metadata.codec}`);
  console.log(`  Has audio: ${metadata.hasAudio}`);
  console.log(`  File size: ${(metadata.size / 1024 / 1024).toFixed(1)} MB`);
  console.log();

  // 2. Run scene detection alone to see what it finds
  const sceneDetector = new SceneDetector();
  console.log("Running scene detection (threshold: 0.3)...");
  const startScene = Date.now();
  const scenes = await sceneDetector.detectScenes(videoPath, {
    threshold: 0.3,
    minSceneLength: 1.0,
  });
  const sceneTime = Date.now() - startScene;
  console.log(`  Found ${scenes.length} scene changes in ${(sceneTime / 1000).toFixed(1)}s`);
  if (scenes.length > 0) {
    console.log(`  First 20 scene timestamps:`);
    scenes.slice(0, 20).forEach((s, i) => {
      const mins = Math.floor(s.timestamp / 60);
      const secs = (s.timestamp % 60).toFixed(1);
      console.log(`    ${i + 1}. ${mins}:${secs.padStart(4, '0')} (score: ${s.sceneScore.toFixed(3)})`);
    });
    if (scenes.length > 20) {
      console.log(`    ... and ${scenes.length - 20} more`);
    }
  }
  console.log();

  // 3. Run full adaptive extraction
  const outputDir = createTempDir("llm-test");
  console.log(`Running full adaptive extraction (output: ${outputDir})...`);

  const sceneDetector2 = new SceneDetector();
  const frameExtractor = new FrameExtractor();
  const hasher = new PerceptualHasher();
  const deduplicator = new FrameDeduplicator(hasher);
  const adaptiveExtractor = new AdaptiveFrameExtractor(
    sceneDetector2,
    frameExtractor,
    deduplicator,
    metadataExtractor,
  );

  const startExtract = Date.now();
  const result = await adaptiveExtractor.extract(videoPath, {
    sceneThreshold: 0.3,
    minSceneLength: 1.0,
    enableDeduplication: true,
    hammingThreshold: 5,
    maxFrames: 200,
    fallbackInterval: 30,
    outputDir,
    outputFormat: "png",
  });
  const extractTime = Date.now() - startExtract;

  console.log(`\n=== Results ===`);
  console.log(`  Strategy: ${result.stats.strategy}`);
  console.log(`  Duration: ${(result.stats.totalDuration / 60).toFixed(1)} minutes`);
  console.log(`  Scenes detected: ${result.stats.scenesDetected}`);
  console.log(`  Frames extracted: ${result.stats.framesExtracted}`);
  console.log(`  Duplicates removed: ${result.stats.duplicatesRemoved}`);
  console.log(`  Total time: ${(extractTime / 1000).toFixed(1)}s`);
  console.log();

  // Show frame timestamps
  console.log(`  Frame timestamps:`);
  result.frames.forEach((f, i) => {
    const mins = Math.floor(f.timestamp / 60);
    const secs = (f.timestamp % 60).toFixed(1);
    console.log(`    ${(i + 1).toString().padStart(3)}. ${mins}:${secs.padStart(4, '0')} -> ${f.imagePath.split('/').pop()}`);
  });

  // Compare: what would fixed-20 have done?
  const fixedInterval = metadata.duration / 20;
  console.log(`\n=== Comparison ===`);
  console.log(`  Old approach: 20 fixed frames, one every ${fixedInterval.toFixed(1)}s`);
  console.log(`  New approach: ${result.frames.length} adaptive frames based on ${result.stats.scenesDetected} scene changes`);
  console.log(`  Coverage improvement: ${result.frames.length > 20 ? `${result.frames.length - 20} more frames at actual content changes` : `${result.frames.length} frames (fewer but targeted)`}`);

  console.log(`\nOutput directory: ${outputDir}`);
  console.log("Done!");
}

main().catch(console.error);
