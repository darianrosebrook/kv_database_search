#!/usr/bin/env tsx
/**
 * bind-timeline — Cross-modal alignment of audio sections + visual segments
 * into a unified semantic timeline.
 *
 * Inputs:
 *   --audio   <audio-sections-dir>     (output of audio-section)
 *   --visual  <structured-dir>          (output of video-extract-structured + build-timeline)
 *   --out     <output-dir>
 *
 * The audio sections (from speech pause analysis) are the PRIMARY structurer.
 * Each audio section gets all visual frames whose timestamps fall inside it,
 * collapsing scroll-state and modality flicker into one semantic unit.
 *
 * Outputs:
 *   bound-timeline.json    machine-readable cross-modal timeline
 *   bound-timeline.md      human-readable per-section transcript + visual evidence
 */

import * as fs from "fs";
import * as path from "path";

interface AudioSection {
  start: number;
  end: number;
  text: string;
  word_count: number;
  segmentation_reason: string;
  pause_before_seconds?: number;
  trigger_phrase?: string;
}

interface VisualSegment {
  start: number;
  end: number;
  modality: string;
  content_kind: string;
  dedup_key: string;
  frame_count: number;
  frames: string[];
  content: string;
  notes?: string;
}

interface BoundSection {
  start: number;
  end: number;
  duration: number;
  speech_text: string;
  speech_word_count: number;
  segmentation_reason: string;
  pause_before_seconds?: number;
  trigger_phrase?: string;
  visual_modalities: string[]; // distinct modalities seen during this section
  visual_segments: VisualSegment[]; // visual segments overlapping this section
  primary_visual_modality?: string; // most-frequent or longest visual modality
}

function loadAudio(dir: string): AudioSection[] {
  const p = path.join(dir, "audio-sections.json");
  const data = JSON.parse(fs.readFileSync(p, "utf-8"));
  return data.sections as AudioSection[];
}

function loadVisual(dir: string): VisualSegment[] {
  const p = path.join(dir, "timeline.json");
  return JSON.parse(fs.readFileSync(p, "utf-8")) as VisualSegment[];
}

function bind(audio: AudioSection[], visual: VisualSegment[]): BoundSection[] {
  const bound: BoundSection[] = [];
  for (const a of audio) {
    // A visual segment overlaps this audio section if [v.start, v.end] intersects [a.start, a.end].
    const overlapping = visual.filter((v) => v.end >= a.start && v.start <= a.end);
    const modalitySet = new Set<string>();
    const modalityDuration: Record<string, number> = {};
    for (const v of overlapping) {
      modalitySet.add(v.modality);
      // Duration credit: time of the visual segment that falls inside the audio section
      const overlapStart = Math.max(v.start, a.start);
      const overlapEnd = Math.min(v.end, a.end);
      const dur = Math.max(0.1, overlapEnd - overlapStart);
      modalityDuration[v.modality] = (modalityDuration[v.modality] || 0) + dur;
    }
    let primary: string | undefined;
    let bestDur = -1;
    for (const [m, d] of Object.entries(modalityDuration)) {
      if (d > bestDur) {
        bestDur = d;
        primary = m;
      }
    }
    bound.push({
      start: a.start,
      end: a.end,
      duration: a.end - a.start,
      speech_text: a.text,
      speech_word_count: a.word_count,
      segmentation_reason: a.segmentation_reason,
      pause_before_seconds: a.pause_before_seconds,
      trigger_phrase: a.trigger_phrase,
      visual_modalities: [...modalitySet],
      visual_segments: overlapping,
      primary_visual_modality: primary,
    });
  }
  return bound;
}

function formatTime(s: number): string {
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function renderMarkdown(bound: BoundSection[]): string {
  const parts: string[] = [
    "# Cross-Modal Semantic Timeline",
    "",
    `${bound.length} audio-anchored sections, each carrying its speech transcript and the visual evidence shown during that span.`,
    "",
  ];
  let i = 0;
  for (const sec of bound) {
    i++;
    const range = `${formatTime(sec.start)} – ${formatTime(sec.end)}`;
    const dur = `${sec.duration.toFixed(0)}s`;
    const reason =
      sec.segmentation_reason === "pause"
        ? `pause (${sec.pause_before_seconds?.toFixed(1)}s silence before)`
        : sec.segmentation_reason === "discourse_marker"
          ? `discourse marker: "${sec.trigger_phrase}"`
          : sec.segmentation_reason;
    parts.push(`## §${i}. ${range} · ${dur} · ${reason}`);
    parts.push("");
    if (sec.visual_modalities.length > 0) {
      const modList = sec.visual_modalities.map((m) =>
        m === sec.primary_visual_modality ? `**${m}**` : m,
      ).join(", ");
      parts.push(`**Visual context** (${sec.visual_segments.length} segments): ${modList}`);
    } else {
      parts.push(`**Visual context**: _(no on-screen content captured — talking-head or off-screen)_`);
    }
    parts.push("");
    parts.push("### Speech");
    parts.push("");
    parts.push("> " + sec.speech_text.replace(/\n/g, "\n> "));
    parts.push("");
    if (sec.visual_segments.length > 0) {
      parts.push("### Visual evidence");
      parts.push("");
      for (const v of sec.visual_segments) {
        const vRange = `${formatTime(v.start)}–${formatTime(v.end)}`;
        const frameLabel = v.frame_count === 1 ? "" : ` _(${v.frame_count} frames merged)_`;
        parts.push(`#### ${vRange} · \`${v.modality}\` · ${v.content_kind}${frameLabel}`);
        parts.push("");
        if (v.content && v.content.trim().length > 0) {
          parts.push("```");
          parts.push(v.content);
          parts.push("```");
        } else {
          parts.push("_(no extractable on-screen content)_");
        }
        parts.push("");
      }
    }
    parts.push("---");
    parts.push("");
  }
  return parts.join("\n");
}

function main(): void {
  const args = process.argv.slice(2);
  let audioDir: string | null = null;
  let visualDir: string | null = null;
  let outDir: string | null = null;
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--audio") audioDir = args[++i];
    else if (a === "--visual") visualDir = args[++i];
    else if (a === "--out") outDir = args[++i];
    else throw new Error("unexpected arg: " + a);
  }
  if (!audioDir || !visualDir || !outDir) {
    console.error("usage: bind-timeline --audio <dir> --visual <dir> --out <dir>");
    process.exit(1);
  }
  audioDir = path.resolve(audioDir);
  visualDir = path.resolve(visualDir);
  outDir = path.resolve(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const audio = loadAudio(audioDir);
  const visual = loadVisual(visualDir);
  const bound = bind(audio, visual);

  const jsonPath = path.join(outDir, "bound-timeline.json");
  const mdPath = path.join(outDir, "bound-timeline.md");
  fs.writeFileSync(jsonPath, JSON.stringify(bound, null, 2), "utf-8");
  fs.writeFileSync(mdPath, renderMarkdown(bound), "utf-8");

  // Quick summary
  const withVisual = bound.filter((b) => b.visual_modalities.length > 0).length;
  const modCounts: Record<string, number> = {};
  for (const b of bound) {
    if (b.primary_visual_modality) {
      modCounts[b.primary_visual_modality] = (modCounts[b.primary_visual_modality] || 0) + 1;
    }
  }
  console.log(`bind-timeline`);
  console.log(`  audio sections:   ${audio.length}`);
  console.log(`  visual segments:  ${visual.length}`);
  console.log(`  bound sections:   ${bound.length}`);
  console.log(`  with visual:      ${withVisual} / ${bound.length}`);
  console.log(`  primary modality distribution:`);
  for (const [m, c] of Object.entries(modCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${c.toString().padStart(3)}  ${m}`);
  }
  console.log(`  json: ${jsonPath}`);
  console.log(`  md:   ${mdPath}`);
}

main();
