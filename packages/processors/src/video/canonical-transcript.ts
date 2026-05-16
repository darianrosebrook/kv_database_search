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
 *   - transcript_segments.json          — raw audio transcription segments
 *   - transcript.md                     — canonical interleaved timeline
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

  const manifest = {
    source: sourceFileName,
    exportedAt: new Date().toISOString(),
    video: metadata.videoMetadata,
    contentClassification: metadata.contentClassification,
    summary: {
      duration: metadata.duration,
      wordCount: metadata.wordCount,
      frameCount: metadata.frameCount,
      keyframeCount: keyframeFiles.size,
      language: metadata.language,
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

  const segments = metadata.audioTranscription?.segments ?? [];
  fs.writeFileSync(
    path.join(outputDir, "transcript_segments.json"),
    JSON.stringify(segments, null, 2),
  );

  const transcript = generateCanonicalTranscript(
    metadata,
    keyframeFiles,
    sourceFileName,
  );
  fs.writeFileSync(path.join(outputDir, "transcript.md"), transcript);

  console.log(
    `  📄 Exported: manifest.json, transcript.md, transcript_segments.json, ${keyframeFiles.size} keyframes`,
  );
}

/**
 * Generate a canonical markdown transcript that interleaves keyframe
 * references (with OCR text) and speech transcript segments on a unified
 * timeline. Pure function — does no I/O.
 *
 * Exported separately so it can be used by callers that want the markdown
 * without the on-disk artifact bundle (e.g. piping to stdout, or rendering
 * in a UI).
 */
export function generateCanonicalTranscript(
  metadata: VideoContentMetadata,
  keyframeFiles: Map<number, string>,
  sourceFileName: string,
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
  lines.push(`- **Words extracted:** ${metadata.wordCount}`);
  lines.push(`- **Frames extracted:** ${metadata.frameCount}`);
  lines.push(`- **Keyframes:** ${keyframeFiles.size}`);
  lines.push("");

  type TimelineEvent =
    | {
        type: "keyframe";
        timestamp: number;
        filename: string;
        ocrText: string | null;
        frameNumber: number;
      }
    | {
        type: "speech";
        start: number;
        end: number;
        text: string;
        confidence?: number;
      };

  const events: TimelineEvent[] = [];

  for (const frame of metadata.extractedFrames) {
    const filename = keyframeFiles.get(frame.timestamp);
    if (filename) {
      events.push({
        type: "keyframe",
        timestamp: frame.timestamp,
        filename,
        ocrText: frame.ocrText?.trim() || null,
        frameNumber: frame.frameNumber,
      });
    }
  }

  const segments = metadata.audioTranscription?.segments ?? [];
  for (const seg of segments) {
    events.push({
      type: "speech",
      start: seg.start,
      end: seg.end,
      text: seg.text,
      confidence: seg.confidence,
    });
  }

  events.sort((a, b) => {
    const tA = a.type === "keyframe" ? a.timestamp : a.start;
    const tB = b.type === "keyframe" ? b.timestamp : b.start;
    if (tA !== tB) return tA - tB;
    // Keyframes appear before speech at the same timestamp
    return a.type === "keyframe" ? -1 : 1;
  });

  lines.push("## Timeline");
  lines.push("");

  for (const event of events) {
    if (event.type === "keyframe") {
      const ts = formatTimestamp(event.timestamp);
      lines.push(`### [${ts}] Keyframe: ${event.filename}`);
      lines.push("");
      lines.push(`![${event.filename}](keyframes/${event.filename})`);
      lines.push("");
      if (event.ocrText && !event.ocrText.startsWith("Image OCR:")) {
        const ocrLines = event.ocrText.split("\n").filter((l) => l.trim());
        for (const ocrLine of ocrLines) {
          lines.push(`> ${ocrLine}`);
        }
        lines.push("");
      }
    } else {
      const startTs = formatTimestamp(event.start);
      const endTs = formatTimestamp(event.end);
      lines.push(`**[${startTs} - ${endTs}]** ${event.text}`);
      lines.push("");
    }
  }

  return lines.join("\n");
}
