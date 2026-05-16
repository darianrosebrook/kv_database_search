#!/usr/bin/env tsx
/* eslint-disable no-undef -- uses Node 18+ global fetch */
/**
 * vote-single-frame — Send the same frame to gpt-4o-mini N times and see
 * whether consensus-voting across reads suppresses hallucination.
 *
 * Hypothesis: VLM hallucination of code constants is variable across reads.
 * A line that appears in 5/5 reads is high-confidence; a line that appears
 * in 1/5 is likely a hallucination.
 */

import * as fs from "fs";
import * as os from "os";
import * as path from "path";

interface Read {
  attempt: number;
  content: string;
  modality: string;
  content_kind: string;
  cost: number;
}

function loadKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const m = fs.readFileSync(path.join(os.homedir(), ".secrets"), "utf-8")
    .match(/^\s*(?:export\s+)?OPENAI_API_KEY\s*=\s*["']?([^"'\s]+)/m);
  if (!m) throw new Error("no key");
  return m[1];
}

const SYSTEM_PROMPT = `You analyze single frames from screen recordings. Return strict JSON:
{
  "modality": "ide_editor" | "slide" | "talking_head" | ...,
  "content_kind": short string,
  "content": substantive on-screen content VERBATIM with chrome removed. Preserve code identifiers, numeric literals, and operators exactly as shown — do not infer, complete, or correct them.
  "dedup_key": short stable identifier
}`;

async function readOnce(apiKey: string, framePath: string, seed: number): Promise<Read> {
  const base64 = fs.readFileSync(framePath).toString("base64");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Read the frame and return the JSON object." },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base64}`, detail: "high" } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.4, // some variance so we actually get different reads
      seed,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json() as { choices: Array<{ message: { content: string } }>, usage: { prompt_tokens: number, completion_tokens: number } };
  const parsed = JSON.parse(data.choices[0].message.content) as Record<string, string>;
  const cost = (data.usage.prompt_tokens / 1_000_000) * 0.15 + (data.usage.completion_tokens / 1_000_000) * 0.6;
  return {
    attempt: seed,
    content: parsed.content ?? "",
    modality: parsed.modality ?? "",
    content_kind: parsed.content_kind ?? "",
    cost,
  };
}

function normalize(line: string): string {
  return line.toLowerCase().replace(/\s+/g, " ").trim();
}

async function main(): Promise<void> {
  const framePath = process.argv[2];
  const n = parseInt(process.argv[3] ?? "5", 10);
  if (!framePath) {
    console.error("usage: vote-single-frame <frame.png> [N=5]");
    process.exit(1);
  }
  const apiKey = loadKey();
  console.log(`vote-single-frame: ${path.basename(framePath)} × ${n} reads at temp=0.4`);
  const reads: Read[] = [];
  for (let i = 0; i < n; i++) {
    process.stdout.write(`  read ${i + 1}/${n} ... `);
    const r = await readOnce(apiKey, framePath, i + 1);
    reads.push(r);
    console.log(`$${r.cost.toFixed(4)} (${r.modality}/${r.content_kind})`);
  }
  const totalCost = reads.reduce((s, r) => s + r.cost, 0);
  console.log(`\ntotal cost: $${totalCost.toFixed(4)}`);

  // Tally lines across reads
  const lineVotes = new Map<string, { count: number; original: string }>();
  for (const r of reads) {
    const seen = new Set<string>();
    for (const raw of r.content.split(/\n+/)) {
      const line = raw.trim();
      if (line.length < 4) continue;
      const n = normalize(line);
      if (seen.has(n)) continue;
      seen.add(n);
      const existing = lineVotes.get(n);
      if (existing) {
        existing.count++;
        if (line.length > existing.original.length) existing.original = line;
      } else {
        lineVotes.set(n, { count: 1, original: line });
      }
    }
  }
  const total = reads.length;
  const all = [...lineVotes.entries()].sort((a, b) => b[1].count - a[1].count);
  console.log("\n=== Line-level consensus ===");
  for (const [, info] of all) {
    const badge = info.count === total ? "[✓ unanimous]" : info.count >= Math.ceil(total / 2) ? "[~ majority ]" : "[✗ minority ]";
    console.log(`  ${info.count}/${total} ${badge} ${info.original.slice(0, 100)}`);
  }
  console.log("\n=== Per-read content ===");
  reads.forEach((r, i) => {
    console.log(`\n--- read ${i + 1} (${r.modality}/${r.content_kind}) ---`);
    console.log(r.content);
  });
}

main().catch((err) => { console.error("fatal:", err); process.exit(1); });
