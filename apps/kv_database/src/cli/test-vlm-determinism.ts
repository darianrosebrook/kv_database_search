#!/usr/bin/env tsx
/* eslint-disable no-undef -- uses Node 18+ global fetch */
/**
 * test-vlm-determinism — Send the same frame to a local Ollama VLM N times
 * in a row, with temperature=0 and explicit seed, and measure whether the
 * output is byte-identical, semantically-equivalent, or actually divergent.
 *
 * Relevant for the Sterling triangulation primitive: voting across N
 * models is only useful if each model is itself deterministic. If a
 * single model produces varying output across runs at temp=0, then the
 * "single-model-disagrees-with-itself" rate is a confounder on the
 * cross-model-disagreement signal.
 */

import * as fs from "fs";

interface Read {
  attempt: number;
  raw: string;
  parsed_content: string;
  latency_ms: number;
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

async function callOllama(model: string, framePath: string, seed: number | null): Promise<Read> {
  const base64 = fs.readFileSync(framePath).toString("base64");
  const options: Record<string, unknown> = { temperature: 0 };
  if (seed !== null) options.seed = seed;
  const body = {
    model,
    prompt: "Analyze this frame and return the JSON object only. No prose, no markdown fences.",
    system: SYSTEM_PROMPT,
    images: [base64],
    format: "json",
    stream: false,
    options,
  };
  const t0 = Date.now();
  const res = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const latency_ms = Date.now() - t0;
  if (!res.ok) throw new Error(`Ollama ${res.status}: ${await res.text()}`);
  const data = await res.json() as { response: string };
  let parsedContent = "";
  try {
    const parsed = JSON.parse(data.response);
    parsedContent = String(parsed.content ?? "");
  } catch {
    parsedContent = "[PARSE FAIL]";
  }
  return { attempt: 0, raw: data.response, parsed_content: parsedContent, latency_ms };
}

function diffStats(a: string, b: string): { identical: boolean; char_diff: number; line_diff: number } {
  if (a === b) return { identical: true, char_diff: 0, line_diff: 0 };
  let char_diff = Math.abs(a.length - b.length);
  const minLen = Math.min(a.length, b.length);
  for (let i = 0; i < minLen; i++) if (a[i] !== b[i]) char_diff++;
  const aLines = new Set(a.split(/\n+/).map((l) => l.trim()).filter(Boolean));
  const bLines = new Set(b.split(/\n+/).map((l) => l.trim()).filter(Boolean));
  let line_diff = 0;
  for (const l of aLines) if (!bLines.has(l)) line_diff++;
  for (const l of bLines) if (!aLines.has(l)) line_diff++;
  return { identical: false, char_diff, line_diff };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const model = args[0];
  const framePath = args[1];
  const n = parseInt(args[2] ?? "3", 10);
  const useSeed = args.includes("--seed");
  if (!model || !framePath) {
    console.error("usage: test-vlm-determinism <model> <frame.png> [N=3] [--seed]");
    process.exit(1);
  }
  console.log(`Determinism test: ${model} × ${n} reads of ${framePath}`);
  console.log(`Seed: ${useSeed ? "fixed=42" : "default (none)"}`);
  console.log("");

  const reads: Read[] = [];
  for (let i = 0; i < n; i++) {
    process.stdout.write(`  read ${i + 1}/${n} ... `);
    const r = await callOllama(model, framePath, useSeed ? 42 : null);
    r.attempt = i + 1;
    reads.push(r);
    console.log(`${(r.latency_ms / 1000).toFixed(1)}s, ${r.parsed_content.length} chars`);
  }

  console.log("\n=== Pairwise comparison ===");
  let allIdentical = true;
  for (let i = 0; i < reads.length; i++) {
    for (let j = i + 1; j < reads.length; j++) {
      const d = diffStats(reads[i].parsed_content, reads[j].parsed_content);
      const status = d.identical ? "IDENTICAL" : `differs: ${d.char_diff} chars, ${d.line_diff} lines`;
      console.log(`  read ${i + 1} vs read ${j + 1}: ${status}`);
      if (!d.identical) allIdentical = false;
    }
  }

  console.log(`\nOverall: ${allIdentical ? "FULLY DETERMINISTIC ✓" : "NON-DETERMINISTIC ✗"}`);

  if (!allIdentical) {
    console.log("\n=== Per-read content ===");
    reads.forEach((r) => {
      console.log(`\n--- read ${r.attempt} (${r.latency_ms}ms) ---`);
      console.log(r.parsed_content.slice(0, 600));
    });
  } else {
    console.log("\n=== Identical content ===");
    console.log(reads[0].parsed_content.slice(0, 600));
  }
}

main().catch((err) => { console.error("fatal:", err); process.exit(1); });
