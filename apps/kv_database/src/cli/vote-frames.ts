#!/usr/bin/env tsx
/**
 * vote-frames — Apply consensus voting across N consecutive same-scene
 * VLM extractions to suppress per-frame hallucination noise.
 *
 * Hypothesis: when the same content stays on screen across N adjacent
 * frames, the VLM will read it slightly differently each time. The lines
 * that appear in a *majority* of those reads are likely real content;
 * the lines that appear once are likely hallucinations.
 *
 * Input: <structured-dir>/all-frames.json (output of video-extract-structured)
 * Output: <structured-dir>/voted-segments.json
 */

import * as fs from "fs";
import * as path from "path";

interface FrameResult {
  frame: string;
  timestamp: number;
  modality: string;
  content_kind: string;
  content: string;
  dedup_key: string;
}

interface VotedSegment {
  start: number;
  end: number;
  frame_count: number;
  modality_consensus: string;
  modality_distribution: Record<string, number>;
  voted_content: string;
  unanimous_lines: string[];
  majority_lines: string[];
  minority_lines: string[]; // probable hallucinations
  raw_frames: Array<{ timestamp: number; content: string }>;
}

function normalize(line: string): string {
  return line
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitToLines(content: string): string[] {
  return content
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 8); // skip trivially-short lines
}

/**
 * Group frames into "scene windows" by dedup_key prefix (modality:topic).
 * Frames sharing a window are candidates for voting.
 */
function groupBySceneWindow(frames: FrameResult[]): FrameResult[][] {
  const groups: FrameResult[][] = [];
  let current: FrameResult[] = [];
  for (const f of frames.sort((a, b) => a.timestamp - b.timestamp)) {
    if (current.length === 0) {
      current.push(f);
      continue;
    }
    const prev = current[current.length - 1];
    // Same scene if: same modality AND timestamps within 6s AND dedup-key prefix matches
    const sameModality = prev.modality === f.modality;
    const closeInTime = f.timestamp - prev.timestamp <= 6;
    const prefixA = (prev.dedup_key || "").split(/[-:]/).slice(0, 3).join(":");
    const prefixB = (f.dedup_key || "").split(/[-:]/).slice(0, 3).join(":");
    const samePrefix = prefixA === prefixB;
    if (sameModality && closeInTime && samePrefix) {
      current.push(f);
    } else {
      if (current.length > 0) groups.push(current);
      current = [f];
    }
  }
  if (current.length > 0) groups.push(current);
  return groups;
}

function voteWindow(window: FrameResult[]): VotedSegment {
  // Tally modality
  const modCounts: Record<string, number> = {};
  for (const f of window) modCounts[f.modality] = (modCounts[f.modality] || 0) + 1;
  const modalityConsensus = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0][0];

  // Vote on lines: for each frame's content, split into lines, then tally
  // how many frames contain each (normalized) line.
  const lineVotes = new Map<string, { count: number; original: string }>();
  for (const f of window) {
    const lines = splitToLines(f.content);
    // Use a Set so a frame doesn't get extra credit for repeating itself
    const seenInFrame = new Set<string>();
    for (const line of lines) {
      const n = normalize(line);
      if (seenInFrame.has(n)) continue;
      seenInFrame.add(n);
      const existing = lineVotes.get(n);
      if (existing) {
        existing.count++;
        // Keep the longest representative
        if (line.length > existing.original.length) existing.original = line;
      } else {
        lineVotes.set(n, { count: 1, original: line });
      }
    }
  }

  const total = window.length;
  const unanimous: string[] = [];
  const majority: string[] = [];
  const minority: string[] = [];
  // Sorted by first appearance in the earliest frame to preserve reading order
  const earliestPos = new Map<string, number>();
  for (const f of window.sort((a, b) => a.timestamp - b.timestamp)) {
    let pos = 0;
    for (const line of splitToLines(f.content)) {
      const n = normalize(line);
      if (!earliestPos.has(n)) earliestPos.set(n, f.timestamp * 1000 + pos++);
    }
  }
  const orderedLines = [...lineVotes.entries()].sort(
    (a, b) => (earliestPos.get(a[0]) ?? 0) - (earliestPos.get(b[0]) ?? 0),
  );

  for (const [, info] of orderedLines) {
    if (info.count === total) unanimous.push(info.original);
    else if (info.count >= Math.ceil(total / 2)) majority.push(info.original);
    else minority.push(info.original);
  }

  return {
    start: window[0].timestamp,
    end: window[window.length - 1].timestamp,
    frame_count: window.length,
    modality_consensus: modalityConsensus,
    modality_distribution: modCounts,
    voted_content: [...unanimous, ...majority].join("\n"),
    unanimous_lines: unanimous,
    majority_lines: majority,
    minority_lines: minority,
    raw_frames: window.map((f) => ({ timestamp: f.timestamp, content: f.content })),
  };
}

function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: vote-frames <structured-dir>");
    process.exit(1);
  }
  const dir = path.resolve(arg);
  const inPath = path.join(dir, "all-frames.json");
  const frames: FrameResult[] = JSON.parse(fs.readFileSync(inPath, "utf-8"));
  const windows = groupBySceneWindow(frames);
  const voted = windows.map(voteWindow);
  // Only emit windows where we actually had ≥3 frames to vote with
  const eligible = voted.filter((v) => v.frame_count >= 3);
  const outPath = path.join(dir, "voted-segments.json");
  fs.writeFileSync(outPath, JSON.stringify(voted, null, 2), "utf-8");

  console.log("vote-frames");
  console.log(`  input frames:       ${frames.length}`);
  console.log(`  scene windows:      ${windows.length}`);
  console.log(`  windows with ≥3 fr: ${eligible.length}`);
  let totalLines = 0;
  let unanimousLines = 0;
  let majorityLines = 0;
  let minorityLines = 0;
  for (const v of eligible) {
    totalLines += v.unanimous_lines.length + v.majority_lines.length + v.minority_lines.length;
    unanimousLines += v.unanimous_lines.length;
    majorityLines += v.majority_lines.length;
    minorityLines += v.minority_lines.length;
  }
  console.log(`  across eligible windows (≥3 frames):`);
  console.log(`    total distinct lines:    ${totalLines}`);
  console.log(`    unanimous (all frames):  ${unanimousLines} (${Math.round(100 * unanimousLines / Math.max(1, totalLines))}%)`);
  console.log(`    majority (≥50% frames):  ${majorityLines} (${Math.round(100 * majorityLines / Math.max(1, totalLines))}%)`);
  console.log(`    minority (likely halluc):${minorityLines} (${Math.round(100 * minorityLines / Math.max(1, totalLines))}%)`);
  console.log(`  output: ${outPath}`);
}

main();
