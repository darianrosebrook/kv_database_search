#!/usr/bin/env tsx
/**
 * build-timeline — Collapse per-frame structured extractions into a
 * time-range timeline. Consecutive frames with the same modality AND
 * sufficient content-shingle overlap become one segment with a [start, end]
 * range and the longest representative content kept.
 *
 * Input: <structured-dir>/all-frames.json (output of video-extract-structured)
 * Output: <structured-dir>/timeline.json and <structured-dir>/timeline.md
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
  notes?: string;
}

interface Segment {
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

function shingles(text: string, n = 5): Set<string> {
  const words = text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim()
    .split(" ")
    .filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) {
    set.add(words.slice(i, i + n).join(" "));
  }
  return set;
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// Two adjacent IDE/screencast frames are part of the same "viewing session"
// (continuing to look at the same document, even while scrolling) if they
// share at least one substantive sentence or dedup_key prefix.
function shouldMerge(a: FrameResult, b: FrameResult, maxGapSec = 90): boolean {
  if (b.timestamp - a.timestamp > maxGapSec) return false;
  // Treat ide_terminal and ide_editor as the same modality group — they're
  // both "user is interacting with their IDE / Claude Code" and the model
  // sometimes flips between them on adjacent frames of the same scene.
  const groupA = a.modality === "ide_editor" ? "ide_terminal" : a.modality;
  const groupB = b.modality === "ide_editor" ? "ide_terminal" : b.modality;
  if (groupA !== groupB) return false;
  if (
    a.modality === "talking_head" ||
    a.modality === "transition" ||
    a.modality === "unknown"
  ) {
    return true;
  }
  if (a.dedup_key === b.dedup_key) return true;
  if (a.content.length < 30 || b.content.length < 30) return false;
  const sim = jaccard(shingles(a.content), shingles(b.content));
  // 0.15 catches scroll-continuation (each frame shows new content but
  // overlaps the previous by a few sentences). Pure-new content stays
  // separate.
  return sim >= 0.15;
}

function collapseSegments(frames: FrameResult[]): Segment[] {
  if (frames.length === 0) return [];
  const segments: Segment[] = [];
  let current: FrameResult[] = [frames[0]];

  for (let i = 1; i < frames.length; i++) {
    const prev = current[current.length - 1];
    const cur = frames[i];
    if (shouldMerge(prev, cur)) {
      current.push(cur);
    } else {
      segments.push(buildSegment(current));
      current = [cur];
    }
  }
  segments.push(buildSegment(current));
  return segments;
}

function buildSegment(frames: FrameResult[]): Segment {
  // For multi-frame segments, concatenate the distinct content. Each frame
  // may show a different scroll position of the same document, so we walk
  // through them in order and append sentences/lines from each frame that
  // aren't already in the running output. This is "scroll-aware merging":
  // the merged content reads as one continuous view of the document.
  const sentenceRe = /[^.!?\n]+(?:[.!?]+|\n+|$)/g;
  let merged = frames[0].content;
  const seenLines = new Set<string>();
  const normalize = (s: string) =>
    s.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, " ").toLowerCase().trim();
  for (const line of (merged.match(sentenceRe) || [])) {
    const n = normalize(line);
    if (n.length >= 20) seenLines.add(n);
  }
  for (let i = 1; i < frames.length; i++) {
    const additions: string[] = [];
    for (const line of (frames[i].content.match(sentenceRe) || [])) {
      const n = normalize(line);
      if (n.length < 20) continue;
      // Skip if seen verbatim, OR if it's a near-duplicate of any seen line
      let isDup = seenLines.has(n);
      if (!isDup) {
        for (const seen of seenLines) {
          if (seen.includes(n) || n.includes(seen)) {
            // Substring match — likely the same sentence reflowed
            if (Math.min(seen.length, n.length) / Math.max(seen.length, n.length) > 0.7) {
              isDup = true;
              break;
            }
          }
        }
      }
      if (!isDup) {
        additions.push(line.trim());
        seenLines.add(n);
      }
    }
    if (additions.length > 0) {
      merged += "\n\n" + additions.join("\n");
    }
  }
  // Use the longest frame's metadata for the segment as the "canonical" view.
  const longest = frames.reduce((best, f) =>
    f.content.length > best.content.length ? f : best,
  );
  return {
    start: frames[0].timestamp,
    end: frames[frames.length - 1].timestamp,
    modality: longest.modality,
    content_kind: longest.content_kind,
    dedup_key: longest.dedup_key,
    frame_count: frames.length,
    frames: frames.map((f) => f.frame),
    content: merged,
    notes: longest.notes,
  };
}

function formatTime(s: number): string {
  const min = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function main(): void {
  const arg = process.argv[2];
  if (!arg) {
    console.error("usage: build-timeline <structured-dir>");
    process.exit(1);
  }
  const dir = path.resolve(arg);
  const allPath = path.join(dir, "all-frames.json");
  if (!fs.existsSync(allPath)) {
    console.error("not found: " + allPath);
    process.exit(1);
  }

  const frames: FrameResult[] = JSON.parse(fs.readFileSync(allPath, "utf-8"));
  const segments = collapseSegments(frames);

  // Filter out empty talking_head/transition segments from the timeline output
  // (they have no content to surface, but keep them in JSON for completeness)
  const timelinePath = path.join(dir, "timeline.json");
  fs.writeFileSync(timelinePath, JSON.stringify(segments, null, 2), "utf-8");

  // Build markdown timeline — content-bearing segments only
  const mdParts: string[] = [
    "# Structured Video Timeline",
    "",
    `Collapsed ${frames.length} frames into ${segments.length} segments.`,
    "",
  ];
  let segIdx = 0;
  for (const seg of segments) {
    segIdx++;
    const range =
      seg.start === seg.end
        ? formatTime(seg.start)
        : `${formatTime(seg.start)} – ${formatTime(seg.end)}`;
    const frameCountLabel =
      seg.frame_count === 1 ? "" : ` _(${seg.frame_count} frames merged)_`;
    mdParts.push(`## Segment ${segIdx} — ${range} · \`${seg.modality}\`${frameCountLabel}`);
    mdParts.push(`**Kind:** ${seg.content_kind || "—"}  `);
    mdParts.push(`**Dedup key:** \`${seg.dedup_key}\`  `);
    if (seg.notes) mdParts.push(`**Notes:** ${seg.notes}  `);
    mdParts.push("");
    if (seg.content && seg.content.trim().length > 0) {
      mdParts.push("```");
      mdParts.push(seg.content);
      mdParts.push("```");
    } else {
      mdParts.push("_(no on-screen content — talking head or transition)_");
    }
    mdParts.push("");
  }
  const mdPath = path.join(dir, "timeline.md");
  fs.writeFileSync(mdPath, mdParts.join("\n"), "utf-8");

  // Summary stats
  const byMod: Record<string, number> = {};
  for (const s of segments) byMod[s.modality] = (byMod[s.modality] || 0) + 1;
  const contentBearing = segments.filter((s) => s.content.length > 0).length;
  console.log(`build-timeline`);
  console.log(`  frames → segments: ${frames.length} → ${segments.length}`);
  console.log(`  content-bearing segments: ${contentBearing}`);
  console.log(`  segment count by modality:`);
  for (const [m, c] of Object.entries(byMod).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${c.toString().padStart(3)}  ${m}`);
  }
  console.log(`  timeline.json: ${timelinePath}`);
  console.log(`  timeline.md:   ${mdPath}`);
}

main();
