#!/usr/bin/env tsx
/**
 * audio-section — Local-only semantic section detection from video audio.
 *
 * Pipeline:
 *   1. ffmpeg → 16kHz mono WAV
 *   2. nodejs-whisper (base.en) → word-level timestamps
 *   3. Pause + discourse-marker segmentation
 *
 * Output: <out-dir>/audio-sections.json
 *
 * Usage:
 *   audio-section <video> -o <out-dir>
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";

interface Word {
  word: string;
  start: number; // seconds
  end: number;
}

interface Section {
  start: number;
  end: number;
  text: string;
  word_count: number;
  segmentation_reason: "pause" | "discourse_marker" | "max_length" | "end_of_audio";
  pause_before_seconds?: number;
  trigger_phrase?: string;
}

// Discourse markers presenters use to signal topic shifts. Match at the start
// of a new utterance (after a pause). Case-insensitive.
const DISCOURSE_MARKERS = [
  "alright", "all right", "okay so", "ok so", "so let's", "now let's",
  "let's", "next", "moving on", "moving along", "first", "second", "third",
  "next up", "now", "so basically", "basically", "to recap", "to summarize",
  "in summary", "the next thing", "the next part", "another thing",
  "switching gears", "let me", "let me show", "i want to", "i'm going to",
  "going to", "we're going to", "we will", "now we", "and now",
  "but here's", "but wait", "however", "but actually", "actually,",
  "speaking of", "by the way", "and then", "so then", "so here",
];

interface SegmentOptions {
  pauseTopicThreshold: number; // pause length (s) that signals a topic boundary
  pauseSentenceThreshold: number; // pause length (s) that signals a sentence boundary
  minSectionSeconds: number; // sections shorter than this get merged forward
  maxSectionSeconds: number; // hard cap to prevent monster sections
}

const DEFAULT_OPTS: SegmentOptions = {
  pauseTopicThreshold: 1.5,
  pauseSentenceThreshold: 0.6,
  minSectionSeconds: 8.0,
  maxSectionSeconds: 90.0,
};

/**
 * Derive pause thresholds from this video's own silence distribution.
 * Absolute thresholds (e.g. "1.5s = topic break") don't generalize across
 * speakers — a high-energy presenter may never pause more than 600ms,
 * while a slow-paced lecturer's sentence-ending pauses may be 2s+.
 *
 * The right thresholds are RELATIVE to the speaker's own baseline:
 *   - sentence threshold: ~p70 of all detected silences
 *   - topic    threshold: ~p90 of all detected silences
 */
function deriveThresholdsFromSilences(
  silences: Silence[],
  fallback: SegmentOptions,
): SegmentOptions {
  if (silences.length < 5) return fallback;
  const sorted = [...silences].map((s) => s.duration).sort((a, b) => a - b);
  const pct = (p: number) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  return {
    ...fallback,
    pauseSentenceThreshold: Math.max(0.3, pct(0.7)),
    pauseTopicThreshold: Math.max(0.5, pct(0.9)),
  };
}

function extractAudio(videoPath: string, wavPath: string): void {
  const result = spawnSync(
    "ffmpeg",
    [
      "-y",
      "-i", videoPath,
      "-ar", "16000",
      "-ac", "1",
      "-c:a", "pcm_s16le",
      wavPath,
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  if (result.status !== 0) {
    throw new Error("ffmpeg audio extract failed: " + result.stderr?.toString());
  }
}

interface WhisperFullJson {
  transcription: Array<{
    timestamps: { from: string; to: string };
    offsets: { from: number; to: number }; // milliseconds
    text: string;
    tokens?: Array<{
      text: string;
      timestamps: { from: string; to: string };
      offsets: { from: number; to: number };
      id: number;
      p: number;
    }>;
  }>;
}

function findGgmlModel(): string {
  if (process.env.WHISPER_MODEL_PATH && fs.existsSync(process.env.WHISPER_MODEL_PATH)) {
    return process.env.WHISPER_MODEL_PATH;
  }
  const candidates = [
    path.resolve("node_modules/.pnpm/nodejs-whisper@0.2.9/node_modules/nodejs-whisper/cpp/whisper.cpp/models/ggml-base.en.bin"),
    path.join(os.homedir(), ".cache/whisper/ggml-base.en.bin"),
    path.join(os.homedir(), "models/ggml-base.en.bin"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "ggml-base.en.bin not found. Download from https://huggingface.co/ggerganov/whisper.cpp/tree/main and set WHISPER_MODEL_PATH",
  );
}

interface Silence {
  start: number; // seconds
  end: number;
  duration: number;
}

/**
 * Real pause/silence detection via ffmpeg's silencedetect filter.
 *
 * Why not whisper VAD? whisper.cpp's --vad flag filters silence pre-decode
 * but does NOT surface VAD boundaries in the JSON output (transcription is
 * still chunked into fixed 30s windows). ffmpeg silencedetect is the only
 * local primitive that exposes accurate, frame-precise silence regions
 * without bundling a separate VAD runtime.
 */
function detectSilences(wavPath: string, noiseDb: number, minDurationSec: number): Silence[] {
  const result = spawnSync(
    "ffmpeg",
    [
      "-i", wavPath,
      "-af", `silencedetect=noise=${noiseDb}dB:duration=${minDurationSec}`,
      "-f", "null",
      "-",
    ],
    { stdio: ["ignore", "ignore", "pipe"] },
  );
  const stderr = result.stderr?.toString() ?? "";
  const silences: Silence[] = [];
  // ffmpeg emits two lines per silence region:
  //   [silencedetect @ 0xADDR] silence_start: 9.730187
  //   [silencedetect @ 0xADDR] silence_end: 10.182562 | silence_duration: 0.452375
  const startRe = /silence_start:\s*(\d+(?:\.\d+)?)/g;
  const endRe = /silence_end:\s*(\d+(?:\.\d+)?)\s*\|\s*silence_duration:\s*(\d+(?:\.\d+)?)/g;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = startRe.exec(stderr)) !== null) starts.push(parseFloat(m[1]));
  let i = 0;
  while ((m = endRe.exec(stderr)) !== null) {
    if (i < starts.length) {
      silences.push({
        start: starts[i],
        end: parseFloat(m[1]),
        duration: parseFloat(m[2]),
      });
    }
    i++;
  }
  return silences;
}

interface Segment {
  text: string;
  start: number;
  end: number;
  words: Word[];
}

function transcribe(wavPath: string): { words: Word[]; segments: Segment[] } {
  const modelPath = findGgmlModel();
  const outBasename = wavPath.replace(/\.wav$/, "");
  // We need TWO things: real silence/pause data (which only segment-level
  // boundaries expose accurately in whisper.cpp), AND word-level timestamps
  // for fine-grained text. Run with -ml 1 to get per-word entries.
  // --dtw base.en uses DTW for the most accurate timestamps available.
  const result = spawnSync(
    "whisper-cli",
    [
      "-m", modelPath,
      "-f", wavPath,
      "-ojf",
      "-of", outBasename,
      "-ml", "1",
      "--dtw", "base.en",
      "-l", "en",
      "-nt",
    ],
    { stdio: ["ignore", "inherit", "inherit"] },
  );
  if (result.status !== 0) {
    throw new Error("whisper-cli failed with status " + result.status);
  }
  const jsonPath = outBasename + ".json";
  if (!fs.existsSync(jsonPath)) {
    throw new Error("whisper did not produce JSON at " + jsonPath);
  }
  const data: WhisperFullJson = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));

  // Each transcription entry is one word (with leading whitespace) due to
  // -ml 1. Read them directly as words.
  const words: Word[] = [];
  for (const seg of data.transcription) {
    const text = seg.text;
    if (!text || text.startsWith("[_") || text.startsWith("<|")) continue;
    const word = text.trim();
    if (word.length === 0) continue;
    words.push({
      word,
      start: seg.offsets.from / 1000,
      end: seg.offsets.to / 1000,
    });
  }

  // whisper.cpp's -ml 1 produces contiguous timestamps (no silence gaps),
  // which destroys the pause signal we need for segmentation. Re-derive
  // pseudo-segments by grouping words into "natural utterances" based on
  // sentence-final punctuation, then we'll use INTER-utterance positions
  // as the boundary candidates and let an external silence/pause source
  // (or simple heuristics on long-form structure) drive segmentation.
  //
  // Better: run whisper a SECOND time without -ml 1 to get the natural
  // segments with real start/end times that include silence. This is the
  // only way to get accurate pause data from whisper.cpp.
  const segments: Segment[] = [];
  return { words, segments };
}

/**
 * Build "natural speech segments" by splitting the word stream at silences.
 * Each segment is a contiguous run of words bracketed by silence regions.
 */
function buildSegmentsFromWordsAndSilences(
  words: Word[],
  silences: Silence[],
): Segment[] {
  if (words.length === 0) return [];
  // Sort silences by start time (they should already be)
  const sortedSil = [...silences].sort((a, b) => a.start - b.start);

  const segments: Segment[] = [];
  let bucket: Word[] = [];
  let silenceIdx = 0;

  for (const w of words) {
    // Has the current word crossed past one or more silences? If so, flush.
    while (silenceIdx < sortedSil.length && w.start >= sortedSil[silenceIdx].end) {
      if (bucket.length > 0) {
        // Trim segment end to the start of the silence we're advancing past
        const silStart = sortedSil[silenceIdx].start;
        const segEnd = Math.min(bucket[bucket.length - 1].end, silStart);
        segments.push({
          text: bucket.map((x) => x.word).join(" ").trim(),
          start: bucket[0].start,
          end: segEnd,
          words: bucket,
        });
        bucket = [];
      }
      silenceIdx++;
    }
    bucket.push(w);
  }
  if (bucket.length > 0) {
    segments.push({
      text: bucket.map((x) => x.word).join(" ").trim(),
      start: bucket[0].start,
      end: bucket[bucket.length - 1].end,
      words: bucket,
    });
  }
  return segments;
}

function startsWithDiscourseMarker(text: string): string | null {
  const lower = text.toLowerCase().trim();
  for (const marker of DISCOURSE_MARKERS) {
    // Anchor at the very start. Marker must be followed by a non-letter
    // boundary so "letters" doesn't match the marker "let".
    if (lower.startsWith(marker)) {
      const after = lower.charAt(marker.length);
      if (after === "" || /[^a-z]/.test(after)) {
        return marker;
      }
    }
  }
  return null;
}

// Segment-level pause + discourse-marker segmentation. Operates on the
// natural whisper segments (which have real silence between them) rather
// than on words (which whisper.cpp emits with contiguous timestamps).
function segmentByPauseAndMarker(
  segments: Segment[],
  opts: SegmentOptions,
): Section[] {
  if (segments.length === 0) return [];
  const sections: Section[] = [];
  let currentSegs: Segment[] = [segments[0]];

  const flush = (
    reason: Section["segmentation_reason"],
    pauseBefore?: number,
    triggerPhrase?: string,
  ) => {
    if (currentSegs.length === 0) return;
    const text = currentSegs.map((s) => s.text).join(" ").trim();
    const wordCount = text.split(/\s+/).length;
    sections.push({
      start: currentSegs[0].start,
      end: currentSegs[currentSegs.length - 1].end,
      text,
      word_count: wordCount,
      segmentation_reason: reason,
      pause_before_seconds: pauseBefore,
      trigger_phrase: triggerPhrase,
    });
  };

  for (let i = 1; i < segments.length; i++) {
    const s = segments[i];
    const prev = segments[i - 1];
    const pause = s.start - prev.end;
    const sectionSpan = prev.end - currentSegs[0].start;

    if (sectionSpan >= opts.maxSectionSeconds && pause >= opts.pauseSentenceThreshold) {
      flush("max_length");
      currentSegs = [s];
      continue;
    }

    if (pause >= opts.pauseTopicThreshold && sectionSpan >= opts.minSectionSeconds) {
      flush("pause", pause);
      currentSegs = [s];
      continue;
    }

    if (pause >= opts.pauseSentenceThreshold && sectionSpan >= opts.minSectionSeconds) {
      const marker = startsWithDiscourseMarker(s.text);
      if (marker) {
        flush("discourse_marker", pause, marker);
        currentSegs = [s];
        continue;
      }
    }

    currentSegs.push(s);
  }
  flush("end_of_audio");
  return sections;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let videoPath: string | null = null;
  let outDir: string | null = null;
  let keepAudio = false;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-o" || a === "--output") outDir = args[++i];
    else if (a === "--keep-audio") keepAudio = true;
    else if (!videoPath) videoPath = a;
    else throw new Error("unexpected arg: " + a);
  }
  if (!videoPath || !outDir) {
    console.error("usage: audio-section <video> -o <out-dir> [--keep-audio]");
    process.exit(1);
  }
  videoPath = path.resolve(videoPath);
  outDir = path.resolve(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  console.log("audio-section");
  console.log("  input:  " + videoPath);
  console.log("  output: " + outDir);

  // Use a workspace dir we control (instead of /tmp) so the WAV survives the
  // whisper transcribe step and we can find its sibling .json reliably.
  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), "audio-section-"));
  const wavPath = path.join(workDir, "audio.wav");

  console.log("  [1/3] extracting audio…");
  const t0 = Date.now();
  extractAudio(videoPath, wavPath);
  console.log(`        done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  console.log("  [2/5] detecting silences with ffmpeg (noise=-30dB, min 0.4s)…");
  const t1 = Date.now();
  const silences = detectSilences(wavPath, -30, 0.4);
  console.log(`         done in ${((Date.now() - t1) / 1000).toFixed(1)}s — ${silences.length} silences`);

  console.log("  [3/5] transcribing word-level (whisper -ml 1)…");
  const t2 = Date.now();
  const { words } = transcribe(wavPath);
  console.log(`         done in ${((Date.now() - t2) / 1000).toFixed(1)}s — ${words.length} words`);

  console.log("  [4/5] building speech segments from words + silences…");
  const segments = buildSegmentsFromWordsAndSilences(words, silences);
  console.log(`         ${segments.length} segments`);

  console.log("  [5/5] segmenting by pause + discourse markers…");
  const opts = deriveThresholdsFromSilences(silences, DEFAULT_OPTS);
  console.log(`        derived thresholds: sentence=${opts.pauseSentenceThreshold.toFixed(2)}s topic=${opts.pauseTopicThreshold.toFixed(2)}s`);
  const sections = segmentByPauseAndMarker(segments, opts);
  console.log(`        ${sections.length} sections`);

  const outPath = path.join(outDir, "audio-sections.json");
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        source: videoPath,
        word_count: words.length,
        silence_count: silences.length,
        segment_count: segments.length,
        section_count: sections.length,
        segment_options: opts,
        sections,
        segments,
        silences,
        words,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log("");
  console.log(`output: ${outPath}`);
  console.log(`section count: ${sections.length}`);
  console.log(`avg section length: ${(sections.reduce((s, x) => s + (x.end - x.start), 0) / sections.length).toFixed(1)}s`);
  // Always copy the whisper JSON to the output dir for debugging.
  const whisperJsonSrc = wavPath.replace(/\.wav$/, "") + ".json";
  if (fs.existsSync(whisperJsonSrc)) {
    fs.copyFileSync(whisperJsonSrc, path.join(outDir, "whisper.json"));
  }
  if (keepAudio) {
    const keptWav = path.join(outDir, "audio.wav");
    fs.copyFileSync(wavPath, keptWav);
    console.log(`audio kept at: ${keptWav}`);
  }
  fs.rmSync(workDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
