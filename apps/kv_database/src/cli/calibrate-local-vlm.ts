#!/usr/bin/env tsx
/* eslint-disable no-undef -- uses Node 18+ global fetch */
/**
 * calibrate-local-vlm — Measure local VLM quality vs cloud (gpt-4o-mini)
 * on the same frames we already extracted in past experiments.
 *
 * Closes the [UNMEASURED] cells in Sterling's video-ingestion-
 * recommendation §4 and §5.5.
 *
 * Reads existing per-frame gpt-4o-mini outputs from a structured-dir,
 * runs each frame through one or more local Ollama vision models with
 * the SAME system prompt, and emits:
 *   - per-frame side-by-side comparisons
 *   - aggregate quality + latency stats per model
 *
 * Usage:
 *   calibrate-local-vlm <structured-dir> --models qwen2.5vl:7b,minicpm-v:8b
 *
 * Assumes Ollama is running at localhost:11434.
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
  tokens?: { input: number; output: number };
}

interface LocalRead {
  model: string;
  modality: string;
  content_kind: string;
  content: string;
  dedup_key: string;
  raw: string;
  latency_ms: number;
  parse_ok: boolean;
}

interface FrameCalibration {
  frame: string;
  timestamp: number;
  reference_gpt4o: FrameResult;
  local_reads: LocalRead[];
  modality_agreement: Record<string, boolean>; // model -> agrees with gpt-4o
  content_coverage_5gram: Record<string, number>; // model -> 0..1 fraction of gpt-4o 5-grams present in local content
}

const SYSTEM_PROMPT = `You analyze single frames extracted from screen recordings and videos.

Your job is to return a strict JSON object describing the *semantic* content of the frame, with UI chrome (tab strips, sidebars, breadcrumbs, gutters, status bars, browser navigation) stripped from the content.

Output schema (return ONLY this JSON, no prose):
{
  "modality": "talking_head" | "ide_terminal" | "ide_editor" | "github_source" | "twitter_post" | "slide" | "browser_other" | "title_card" | "transition" | "unknown",
  "content_kind": short string describing the substantive content type,
  "content": substantive on-screen content VERBATIM with chrome removed. Preserve code identifiers, numeric literals, and operators exactly as shown. Do not infer, complete, or correct them.
  "dedup_key": stable short identifier "<modality>:<short-content-handle>"
}`;

function normalize(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

function ngrams(text: string, n: number): Set<string> {
  const words = normalize(text).split(" ").filter(Boolean);
  const set = new Set<string>();
  for (let i = 0; i + n <= words.length; i++) {
    set.add(words.slice(i, i + n).join(" "));
  }
  return set;
}

function coverage(reference: string, candidate: string, n = 5): number {
  const refGrams = ngrams(reference, n);
  if (refGrams.size === 0) return 1; // nothing to cover
  const candGrams = ngrams(candidate, n);
  let hits = 0;
  for (const g of refGrams) if (candGrams.has(g)) hits++;
  return hits / refGrams.size;
}

async function callOllama(model: string, framePath: string): Promise<LocalRead> {
  const base64 = fs.readFileSync(framePath).toString("base64");
  const body = {
    model,
    prompt: "Analyze this frame and return the JSON object only. No prose, no markdown fences.",
    system: SYSTEM_PROMPT,
    images: [base64],
    format: "json",
    stream: false,
    options: { temperature: 0 },
  };
  const t0 = Date.now();
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const latency_ms = Date.now() - t0;
  if (!res.ok) {
    return {
      model,
      modality: "",
      content_kind: "",
      content: "",
      dedup_key: "",
      raw: `[Ollama ${res.status}: ${await res.text()}]`,
      latency_ms,
      parse_ok: false,
    };
  }
  const data = await res.json() as { response: string };
  let parsed: Record<string, string> = {};
  let parse_ok = false;
  try {
    parsed = JSON.parse(data.response);
    parse_ok = true;
  } catch {
    // Try to extract a JSON object substring
    const m = data.response.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
        parse_ok = true;
      } catch { /* leave parse_ok false */ }
    }
  }
  return {
    model,
    modality: String(parsed.modality ?? ""),
    content_kind: String(parsed.content_kind ?? ""),
    content: String(parsed.content ?? ""),
    dedup_key: String(parsed.dedup_key ?? ""),
    raw: data.response,
    latency_ms,
    parse_ok,
  };
}

interface ModelStats {
  model: string;
  frames_attempted: number;
  frames_parsed_ok: number;
  modality_agreement_rate: number;
  mean_content_coverage_5gram: number;
  median_latency_ms: number;
  mean_latency_ms: number;
  total_latency_sec: number;
}

function summarize(model: string, frames: FrameCalibration[]): ModelStats {
  const reads = frames
    .map((f) => f.local_reads.find((r) => r.model === model))
    .filter((r): r is LocalRead => !!r);
  const okReads = reads.filter((r) => r.parse_ok);
  const modAgreements = frames
    .map((f) => f.modality_agreement[model])
    .filter((v) => v !== undefined);
  const modAgreementRate = modAgreements.length
    ? modAgreements.filter(Boolean).length / modAgreements.length
    : 0;
  const coverages = frames
    .map((f) => f.content_coverage_5gram[model])
    .filter((v) => v !== undefined);
  const meanCoverage = coverages.length
    ? coverages.reduce((s, x) => s + x, 0) / coverages.length
    : 0;
  const latencies = reads.map((r) => r.latency_ms).sort((a, b) => a - b);
  return {
    model,
    frames_attempted: reads.length,
    frames_parsed_ok: okReads.length,
    modality_agreement_rate: modAgreementRate,
    mean_content_coverage_5gram: meanCoverage,
    median_latency_ms: latencies[Math.floor(latencies.length / 2)] ?? 0,
    mean_latency_ms: latencies.length
      ? latencies.reduce((s, x) => s + x, 0) / latencies.length
      : 0,
    total_latency_sec:
      latencies.reduce((s, x) => s + x, 0) / 1000,
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  let structuredDir: string | null = null;
  let models: string[] = [];
  let limit: number | null = null;
  let outDir: string | null = null;
  let explicitKeyframesDir: string | null = null;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--models") models = args[++i].split(",");
    else if (a === "--limit") limit = parseInt(args[++i], 10);
    else if (a === "-o" || a === "--output") outDir = args[++i];
    else if (a === "--keyframes") explicitKeyframesDir = args[++i];
    else if (!structuredDir) structuredDir = a;
    else throw new Error("unexpected arg: " + a);
  }

  if (!structuredDir || models.length === 0) {
    console.error(
      "usage: calibrate-local-vlm <structured-dir> --models m1,m2 [--limit N] [-o <out>]\n" +
      "  <structured-dir> must contain a per-frame/ subdir of gpt-4o-mini outputs\n" +
      "  the matching keyframes/ dir is resolved from <structured-dir>/../*/keyframes\n",
    );
    process.exit(1);
  }
  structuredDir = path.resolve(structuredDir);
  const perFrameDir = path.join(structuredDir, "per-frame");
  if (!fs.existsSync(perFrameDir)) {
    console.error("no per-frame/ subdir in " + structuredDir);
    process.exit(1);
  }

  // Find the keyframes directory. The structured-dir was produced from a
  // sibling frames directory; honor the common pattern used in this repo
  // (e.g. mystery-structured ← mystery-frames-finer/keyframes).
  const allFramesJson = path.join(structuredDir, "all-frames.json");
  const allFrames: FrameResult[] = fs.existsSync(allFramesJson)
    ? JSON.parse(fs.readFileSync(allFramesJson, "utf-8"))
    : fs
        .readdirSync(perFrameDir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => JSON.parse(fs.readFileSync(path.join(perFrameDir, f), "utf-8")));

  // Resolve keyframes dir. Prefer explicit --keyframes; else a "keyframes"
  // subdir of the structured-dir itself; else look for sibling dirs whose
  // name-stem matches (e.g. mystery-structured → mystery-frames*).
  let keyframesDir: string;
  if (explicitKeyframesDir) {
    keyframesDir = path.resolve(explicitKeyframesDir);
  } else if (fs.existsSync(path.join(structuredDir, "keyframes"))) {
    keyframesDir = path.join(structuredDir, "keyframes");
  } else {
    const parent = path.dirname(structuredDir);
    const stem = path.basename(structuredDir).replace(/-structured$/, "");
    const siblings = fs
      .readdirSync(parent, { withFileTypes: true })
      .filter(
        (d) =>
          d.isDirectory() &&
          d.name !== path.basename(structuredDir) &&
          d.name.startsWith(stem),
      )
      .map((d) => path.join(parent, d.name, "keyframes"))
      .filter((p) => fs.existsSync(p));
    if (siblings.length === 0) {
      console.error(
        "could not find keyframes dir. Pass --keyframes <dir> explicitly.",
      );
      process.exit(1);
    }
    keyframesDir = siblings[0];
  }
  console.log(`calibrate-local-vlm`);
  console.log(`  reference (gpt-4o):  ${structuredDir}`);
  console.log(`  keyframes:           ${keyframesDir}`);
  console.log(`  models:              ${models.join(", ")}`);

  let selected = allFrames.slice();
  if (limit) selected = selected.slice(0, limit);
  console.log(`  frames:              ${selected.length} (of ${allFrames.length})`);
  console.log("");

  // Resume support: per-model cache of per-frame outputs
  outDir = path.resolve(outDir ?? path.join(structuredDir, "calibration"));
  fs.mkdirSync(outDir, { recursive: true });
  const cacheDir = path.join(outDir, "local-reads");
  fs.mkdirSync(cacheDir, { recursive: true });

  const calibrations: FrameCalibration[] = [];

  for (let i = 0; i < selected.length; i++) {
    const ref = selected[i];
    const framePath = path.join(keyframesDir, ref.frame);
    if (!fs.existsSync(framePath)) {
      console.log(`  [${i + 1}/${selected.length}] ${ref.frame} — MISSING IMAGE, skipping`);
      continue;
    }
    const localReads: LocalRead[] = [];
    process.stdout.write(`  [${i + 1}/${selected.length}] ${ref.frame}: `);
    for (const model of models) {
      const cachePath = path.join(cacheDir, `${model.replace(/[:/]/g, "_")}__${ref.frame}.json`);
      let read: LocalRead;
      if (fs.existsSync(cachePath)) {
        read = JSON.parse(fs.readFileSync(cachePath, "utf-8"));
        process.stdout.write(`${model.split(":")[0]}=cached `);
      } else {
        try {
          read = await callOllama(model, framePath);
          fs.writeFileSync(cachePath, JSON.stringify(read, null, 2), "utf-8");
        } catch (err) {
          read = {
            model,
            modality: "",
            content_kind: "",
            content: "",
            dedup_key: "",
            raw: `[ERROR: ${err instanceof Error ? err.message : String(err)}]`,
            latency_ms: 0,
            parse_ok: false,
          };
        }
        const status = read.parse_ok ? "ok" : "PARSE_FAIL";
        process.stdout.write(`${model.split(":")[0]}=${(read.latency_ms / 1000).toFixed(1)}s/${status} `);
      }
      localReads.push(read);
    }
    console.log("");

    const modAgree: Record<string, boolean> = {};
    const coverages: Record<string, number> = {};
    for (const r of localReads) {
      modAgree[r.model] = r.modality === ref.modality;
      coverages[r.model] = coverage(ref.content, r.content);
    }
    calibrations.push({
      frame: ref.frame,
      timestamp: ref.timestamp,
      reference_gpt4o: ref,
      local_reads: localReads,
      modality_agreement: modAgree,
      content_coverage_5gram: coverages,
    });
  }

  // Summarize
  const stats = models.map((m) => summarize(m, calibrations));
  const summary = {
    reference_source: structuredDir,
    keyframes_source: keyframesDir,
    models_tested: models,
    frames_calibrated: calibrations.length,
    per_model_stats: stats,
    per_frame: calibrations,
  };

  const summaryPath = path.join(outDir, "calibration-summary.json");
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

  console.log("\n=== Per-model stats ===");
  for (const s of stats) {
    console.log(`\n  ${s.model}`);
    console.log(`    frames:                    ${s.frames_attempted}`);
    console.log(`    parsed ok:                 ${s.frames_parsed_ok} (${Math.round(100 * s.frames_parsed_ok / Math.max(1, s.frames_attempted))}%)`);
    console.log(`    modality agreement:        ${(s.modality_agreement_rate * 100).toFixed(0)}%`);
    console.log(`    content coverage (5-gram): ${(s.mean_content_coverage_5gram * 100).toFixed(0)}%`);
    console.log(`    median latency:            ${(s.median_latency_ms / 1000).toFixed(1)}s`);
    console.log(`    mean latency:              ${(s.mean_latency_ms / 1000).toFixed(1)}s`);
    console.log(`    total latency:             ${s.total_latency_sec.toFixed(1)}s`);
  }
  console.log(`\n  summary: ${summaryPath}`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
