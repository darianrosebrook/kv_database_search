import * as fs from "fs";
import * as path from "path";
import { formatTimestamp } from "./format-timestamp.ts";
import { VideoContentMetadata } from "./types.ts";

/**
 * Export processing artifacts to a structured output directory.
 *
 * Writes:
 *   - keyframes/<frame_NNN_<ts>.png>   — selected keyframe images
 *   - manifest.json                     — full metadata + frame index
 *   - transcript_segments.json          — raw word-level audio segments
 *                                         (lossless source of truth)
 *   - transcript_utterances.json        — sentence-bounded utterances
 *                                         with keyframeRef for alignment
 *   - transcript.md                     — slide-grouped narrative
 *
 * The exporter is pure with respect to the metadata it's given — it does
 * not run OCR or transcription itself. Frame image paths in metadata must
 * still exist on disk at the time of the call (the processor preserves
 * them via its preserveFrames flag).
 */
export function exportArtifacts(
  outputDir: string,
  metadata: VideoContentMetadata,
  sourceFileName: string,
): void {
  const keyframesDir = path.join(outputDir, "keyframes");
  fs.mkdirSync(keyframesDir, { recursive: true });

  const keyframeTimestamps = new Set(
    metadata.keyframes?.intervals ??
      metadata.extractedFrames.map((f) => f.timestamp),
  );

  const keyframeFiles = new Map<number, string>();
  const frameIndex: Array<{
    frameNumber: number;
    timestamp: number;
    filename: string | null;
    ocrText: string | null;
    ocrConfidence: number;
    isKeyframe: boolean;
  }> = [];

  for (const frame of metadata.extractedFrames) {
    const isKeyframe = keyframeTimestamps.has(frame.timestamp);
    let filename: string | null = null;

    if (isKeyframe && frame.imagePath && fs.existsSync(frame.imagePath)) {
      filename = `frame_${String(frame.frameNumber).padStart(3, "0")}_${frame.timestamp.toFixed(1)}s.png`;
      fs.copyFileSync(frame.imagePath, path.join(keyframesDir, filename));
      keyframeFiles.set(frame.timestamp, filename);
    }

    frameIndex.push({
      frameNumber: frame.frameNumber,
      timestamp: frame.timestamp,
      filename,
      ocrText: frame.ocrText?.trim() || null,
      ocrConfidence: frame.ocrConfidence ?? 0,
      isKeyframe,
    });
  }

  // Sorted keyframe timestamps (ascending) for binary-searching utterance
  // → containing keyframe.
  const sortedKeyframes = [...keyframeFiles.entries()].sort(
    (a, b) => a[0] - b[0],
  );

  /**
   * Find the keyframe filename in scope at time `t`: the keyframe with
   * the largest timestamp <= t. Returns undefined if no keyframe has been
   * shown yet at time t.
   */
  const keyframeAt = (t: number): string | undefined => {
    let lo = 0;
    let hi = sortedKeyframes.length - 1;
    let result: string | undefined = undefined;
    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      if (sortedKeyframes[mid][0] <= t) {
        result = sortedKeyframes[mid][1];
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    return result;
  };

  // Enrich utterances with keyframeRef without mutating the source array.
  const rawUtterances = metadata.audioTranscription?.utterances ?? [];
  const utterances = rawUtterances.map((u) => ({
    ...u,
    keyframeRef: keyframeAt(u.start),
  }));

  const audioWordCount =
    metadata.audioTranscription?.wordCount ??
    utterances.reduce((sum, u) => sum + u.wordCount, 0);
  const visualWordCount = metadata.extractedFrames.reduce(
    (sum, f) => sum + countWords(f.ocrText ?? ""),
    0,
  );

  const manifest = {
    source: sourceFileName,
    exportedAt: new Date().toISOString(),
    video: metadata.videoMetadata,
    contentClassification: metadata.contentClassification,
    summary: {
      duration: metadata.duration,
      wordCount: {
        total: audioWordCount + visualWordCount,
        audio: audioWordCount,
        visual: visualWordCount,
      },
      frameCount: metadata.frameCount,
      keyframeCount: keyframeFiles.size,
      language: metadata.language,
      utteranceCount: utterances.length,
      segmentCount: metadata.audioTranscription?.segments?.length ?? 0,
    },
    frames: frameIndex,
    entities: metadata.entities,
    relationships: metadata.relationships,
  };
  fs.writeFileSync(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );

  // Lossless source of truth: raw word-level segments.
  const segments = metadata.audioTranscription?.segments ?? [];
  fs.writeFileSync(
    path.join(outputDir, "transcript_segments.json"),
    JSON.stringify(segments, null, 2),
  );

  // Readable rendering surface: utterances + keyframe refs.
  fs.writeFileSync(
    path.join(outputDir, "transcript_utterances.json"),
    JSON.stringify(utterances, null, 2),
  );

  const transcript = generateCanonicalTranscript(
    metadata,
    keyframeFiles,
    sourceFileName,
    utterances,
    { audioWordCount, visualWordCount },
  );
  fs.writeFileSync(path.join(outputDir, "transcript.md"), transcript);

  console.log(
    `  📄 Exported: manifest.json, transcript.md, transcript_segments.json, transcript_utterances.json, ${keyframeFiles.size} keyframes`,
  );
}

function countWords(text: string): number {
  if (!text) return 0;
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

interface EnrichedUtterance {
  start: number;
  end: number;
  text: string;
  wordCount: number;
  confidence?: number;
  keyframeRef?: string;
}

/**
 * Generate a slide-grouped markdown transcript. Each keyframe becomes a
 * section that contains the slide image, OCR'd slide content, and the
 * utterances spoken while that slide was on screen. Utterances that occur
 * before any keyframe (intro) get a synthetic leading section.
 */
export function generateCanonicalTranscript(
  metadata: VideoContentMetadata,
  keyframeFiles: Map<number, string>,
  sourceFileName: string,
  utterances: EnrichedUtterance[],
  counts: { audioWordCount: number; visualWordCount: number },
): string {
  const lines: string[] = [];

  lines.push(`# Video Transcript: ${sourceFileName}`);
  lines.push("");
  lines.push("## Video Info");
  const vm = metadata.videoMetadata;
  const durationStr = `${vm.duration.toFixed(1)}s (${formatTimestamp(vm.duration)})`;
  lines.push(`- **Duration:** ${durationStr}`);
  lines.push(`- **Resolution:** ${vm.resolution}`);
  lines.push(`- **Codec:** ${vm.codec}`);
  lines.push(`- **Frame rate:** ${vm.frameRate.toFixed(2)} fps`);
  lines.push(`- **Has audio:** ${vm.hasAudio}`);
  if (metadata.contentClassification) {
    const cc = metadata.contentClassification;
    const tags: string[] = [];
    if (cc.hasPresentation) tags.push("presentation");
    if (cc.hasCode) tags.push("code");
    if (cc.isScreenRecording) tags.push("screen recording");
    if (cc.hasUI) tags.push("UI");
    if (tags.length > 0) lines.push(`- **Content type:** ${tags.join(", ")}`);
  }
  const at = metadata.audioTranscription;
  if (at) {
    lines.push(
      `- **Audio transcription:** ${at.engine}${at.transcribed ? "" : " (no engine ran)"}`,
    );
  }
  lines.push(
    `- **Words extracted:** ${counts.audioWordCount + counts.visualWordCount} (${counts.audioWordCount} audio, ${counts.visualWordCount} visual)`,
  );
  lines.push(`- **Utterances:** ${utterances.length}`);
  lines.push(`- **Frames extracted:** ${metadata.frameCount}`);
  lines.push(`- **Keyframes:** ${keyframeFiles.size}`);
  lines.push("");

  // Group utterances by keyframeRef. The order follows the keyframe
  // timeline; utterances before the first keyframe go into a synthetic
  // "intro" group keyed by undefined.
  const grouped = new Map<string | undefined, EnrichedUtterance[]>();
  for (const u of utterances) {
    const arr = grouped.get(u.keyframeRef) ?? [];
    arr.push(u);
    grouped.set(u.keyframeRef, arr);
  }

  lines.push("## Timeline");
  lines.push("");

  // Intro: utterances spoken before any keyframe was on screen.
  const intro = grouped.get(undefined);
  if (intro && intro.length > 0) {
    lines.push("### Intro (before first keyframe)");
    lines.push("");
    for (const u of intro) {
      lines.push(`**[${formatTimestamp(u.start)}]** ${u.text}`);
      lines.push("");
    }
  }

  // Walk keyframes in time order.
  const sortedKeyframes = [...keyframeFiles.entries()].sort(
    (a, b) => a[0] - b[0],
  );

  // Build a lookup from timestamp to ExtractedFrame for OCR text retrieval.
  const frameByTimestamp = new Map(
    metadata.extractedFrames.map((f) => [f.timestamp, f]),
  );

  for (const [ts, filename] of sortedKeyframes) {
    const frame = frameByTimestamp.get(ts);
    lines.push(`### [${formatTimestamp(ts)}] Keyframe: ${filename}`);
    lines.push("");
    lines.push(`![${filename}](keyframes/${filename})`);
    lines.push("");

    const ocrText = frame?.ocrText?.trim();
    if (ocrText && !ocrText.startsWith("Image OCR:")) {
      lines.push("**Slide content (OCR):**");
      lines.push("");
      const ocrLines = ocrText.split("\n").filter((l) => l.trim());
      for (const ocrLine of ocrLines) {
        lines.push(`> ${ocrLine}`);
      }
      lines.push("");
    }

    const us = grouped.get(filename);
    if (us && us.length > 0) {
      lines.push("**Spoken:**");
      lines.push("");
      for (const u of us) {
        lines.push(`**[${formatTimestamp(u.start)}]** ${u.text}`);
        lines.push("");
      }
    }
  }

  return lines.join("\n");
}
