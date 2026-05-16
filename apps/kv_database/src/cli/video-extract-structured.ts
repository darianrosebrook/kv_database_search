#!/usr/bin/env tsx
/* eslint-disable no-undef -- uses Node 18+ globals (fetch, Response) */
/**
 * video-extract-structured — Bounded experiment: re-process pre-extracted
 * keyframes through OpenAI Vision (gpt-4o-mini) to produce semantically
 * structured output (modality, chrome-stripped content, dedup keys) instead
 * of flat Tesseract OCR.
 *
 * This is NOT the production pipeline — it reads frames that were already
 * extracted by video-extract and re-interprets them. The goal is to prove
 * that structured semantic extraction is achievable, not to replace OCR.
 *
 * Usage:
 *   video-extract-structured <frames-dir> [options]
 *
 * Reads ~/.secrets for OPENAI_API_KEY if not in env.
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

interface CLIOptions {
  framesDir: string;
  outputDir: string;
  limit: number | null;
  only: string[] | null; // specific frame filenames
  model: string;
  dryRun: boolean;
}

interface FrameResult {
  frame: string;
  timestamp: number;
  modality: string;
  content_kind: string;
  content: string;
  dedup_key: string;
  notes?: string;
  raw_response?: unknown;
  cost_estimate_usd: number;
  tokens: { input: number; output: number };
}

function loadOpenAIKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const secretsPath = path.join(os.homedir(), ".secrets");
  if (!fs.existsSync(secretsPath)) {
    throw new Error(
      "OPENAI_API_KEY not in env and ~/.secrets does not exist",
    );
  }
  const content = fs.readFileSync(secretsPath, "utf-8");
  const match = content.match(/^\s*(?:export\s+)?OPENAI_API_KEY\s*=\s*["']?([^"'\s]+)["']?/m);
  if (!match) throw new Error("OPENAI_API_KEY not found in ~/.secrets");
  return match[1];
}

function parseArgs(argv: string[]): CLIOptions {
  const args = argv.slice(2);
  let framesDir: string | null = null;
  let outputDir: string | null = null;
  let limit: number | null = null;
  let only: string[] | null = null;
  let model = "gpt-4o-mini";
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "-o":
      case "--output":
        outputDir = args[++i];
        break;
      case "--limit":
        limit = parseInt(args[++i], 10);
        break;
      case "--only":
        only = args[++i].split(",");
        break;
      case "--model":
        model = args[++i];
        break;
      case "--dry-run":
        dryRun = true;
        break;
      case "-h":
      case "--help":
        console.log(`video-extract-structured <frames-dir> [-o <out>] [--limit N] [--only f1,f2] [--model gpt-4o-mini] [--dry-run]`);
        process.exit(0);
        break;
      default:
        if (!framesDir) framesDir = arg;
        else throw new Error("unexpected arg: " + arg);
    }
  }

  if (!framesDir) {
    console.error("usage: video-extract-structured <frames-dir>");
    process.exit(1);
  }

  framesDir = path.resolve(framesDir);
  if (!fs.existsSync(framesDir)) {
    console.error("frames dir not found: " + framesDir);
    process.exit(1);
  }

  // Default output: sibling "<framesDirParent>-structured/" of the keyframes dir
  if (!outputDir) {
    const parent = path.dirname(framesDir);
    outputDir = path.join(parent, "structured");
  }
  outputDir = path.resolve(outputDir);

  return { framesDir, outputDir, limit, only, model, dryRun };
}

/**
 * The structured-extraction prompt. We want a tight JSON object with a
 * stable shape that downstream code can rely on. The prompt forces the
 * model to do the work we'd otherwise have to do heuristically:
 * modality classification, chrome-stripping, content canonicalization,
 * and dedup-key generation.
 */
const SYSTEM_PROMPT = `You analyze single frames extracted from screen recordings and videos.

Your job is to return a strict JSON object describing the *semantic* content of the frame, with UI chrome (tab strips, sidebars, breadcrumbs, gutters, status bars, browser navigation) stripped from the content.

Output schema (return ONLY this JSON, no prose):
{
  "modality": "talking_head" | "ide_terminal" | "ide_editor" | "github_source" | "twitter_post" | "slide" | "browser_other" | "title_card" | "transition" | "unknown",
  "content_kind": short string describing the substantive content type (e.g. "claude_code_conversation", "markdown_glossary_file", "skill_definition", "user_testimonial", "code_diff", "diagram", "title_slide", "presenter_speaking"),
  "content": the substantive on-screen content, verbatim where possible, WITH chrome removed. For conversations, format as "Speaker: text" turns. For code, preserve indentation. For markdown, preserve structure. If there is no meaningful content (talking head, transition, blank), use an empty string.
  "dedup_key": a stable short string (under 80 chars) that identifies the "scene" — same dedup_key across consecutive frames means the user is still looking at the same content (e.g. scrolling the same document). Use the form "<modality>:<short-identifier>" e.g. "ide_terminal:claude-code-pitch-cardinality-discussion" or "github_source:grill-me-SKILL.md". Different content = different dedup_key.
  "notes": optional one-line note about anything unusual (low confidence, partial occlusion, mixed modality).
}

Rules:
- Strip ALL chrome: tab strips, file tabs, breadcrumbs, sidebars, scrollbars, status bars, line numbers in editor gutters, browser URL bar, OS chrome.
- Preserve the substantive text verbatim. Do not paraphrase, summarize, or "clean up" the speaker's words.
- For Claude Code / terminal conversations, format clearly as turns: "User: ..." and "Assistant: ..." (or "Claude: ...").
- If the frame is mostly a person's face with no on-screen content, modality is "talking_head" and content is "".
- If the same document is scrolled across frames, the dedup_key should remain identical so the timeline can collapse them.`;

interface OpenAIResponse {
  choices: Array<{ message: { content: string } }>;
  usage: { prompt_tokens: number; completion_tokens: number };
}

async function classifyFrame(
  apiKey: string,
  framePath: string,
  model: string,
): Promise<{ parsed: Record<string, unknown>; raw: OpenAIResponse; cost: number }> {
  const imageBytes = fs.readFileSync(framePath);
  const base64 = imageBytes.toString("base64");
  const dataUrl = `data:image/png;base64,${base64}`;

  const body = {
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: "Analyze this frame and return the JSON object." },
          { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
        ],
      },
    ],
    response_format: { type: "json_object" },
    max_tokens: 2000,
    temperature: 0,
  };

  // Retry on 429 (TPM throttling), 5xx, and bare network errors with
  // exponential backoff. The OpenAI response includes a "try again in Xms"
  // hint we honor when present.
  const maxAttempts = 12;
  let lastErr: Error | null = null;
  let res: Response | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (networkErr) {
      // Network-layer failure (DNS, TCP reset, TLS, etc.). Always retry.
      lastErr = networkErr instanceof Error ? networkErr : new Error(String(networkErr));
      const waitMs = Math.min(60_000, 1000 * Math.pow(2, attempt - 1)) + Math.random() * 500;
      process.stdout.write(`[net-retry ${attempt}/${maxAttempts} after ${Math.round(waitMs)}ms] `);
      await new Promise((r) => setTimeout(r, waitMs));
      continue;
    }
    if (res.ok) break;
    if (res.status !== 429 && res.status < 500) {
      const errBody = await res.text();
      throw new Error(`OpenAI ${res.status}: ${errBody}`);
    }
    const errBody = await res.text();
    lastErr = new Error(`OpenAI ${res.status}: ${errBody}`);
    const retryMatch = errBody.match(/try again in (\d+(?:\.\d+)?)(ms|s)/);
    let waitMs: number;
    if (retryMatch) {
      waitMs = parseFloat(retryMatch[1]) * (retryMatch[2] === "s" ? 1000 : 1);
      // 429s on TPM need real wait — the bucket refills at limit/60 per second.
      // If we're hammering it, "try again in 396ms" still won't be enough.
      // Floor at 2s on later attempts.
      waitMs = Math.max(waitMs, attempt > 3 ? 2000 : 500);
    } else {
      waitMs = Math.min(60_000, 1000 * Math.pow(2, attempt - 1));
    }
    waitMs += Math.random() * 500;
    process.stdout.write(`[retry ${attempt}/${maxAttempts} after ${Math.round(waitMs)}ms] `);
    await new Promise((r) => setTimeout(r, waitMs));
  }
  if (!res || !res.ok) {
    throw lastErr ?? new Error("OpenAI request failed after retries");
  }

  const data = (await res.json()) as OpenAIResponse;
  const content = data.choices[0].message.content;
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Model returned non-JSON: ${content.slice(0, 200)}`);
  }

  // gpt-4o-mini pricing (2025-Q4 standard rates):
  // input: $0.150 / 1M tokens, output: $0.600 / 1M tokens.
  // Image tokens are folded into prompt_tokens by the API.
  const cost =
    (data.usage.prompt_tokens / 1_000_000) * 0.15 +
    (data.usage.completion_tokens / 1_000_000) * 0.6;

  return { parsed, raw: data, cost };
}

function timestampFromFilename(name: string): number {
  // frame_000_0.0s.png -> 0.0
  const m = name.match(/_(\d+(?:\.\d+)?)s\.png$/);
  return m ? parseFloat(m[1]) : -1;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv);
  const apiKey = opts.dryRun ? "<dry-run>" : loadOpenAIKey();

  const frames = fs
    .readdirSync(opts.framesDir)
    .filter((f) => f.endsWith(".png"))
    .sort();
  let selected = frames;
  if (opts.only) {
    selected = frames.filter((f) => opts.only!.includes(f));
  }
  if (opts.limit) {
    selected = selected.slice(0, opts.limit);
  }

  fs.mkdirSync(opts.outputDir, { recursive: true });
  const perFrameDir = path.join(opts.outputDir, "per-frame");
  fs.mkdirSync(perFrameDir, { recursive: true });

  console.log(`video-extract-structured`);
  console.log(`  frames dir: ${opts.framesDir}`);
  console.log(`  output dir: ${opts.outputDir}`);
  console.log(`  model:      ${opts.model}`);
  console.log(`  frames:     ${selected.length} (of ${frames.length} in dir)`);
  if (opts.dryRun) {
    console.log(`  DRY RUN — would process: ${selected.join(", ")}`);
    return;
  }
  console.log("");

  const results: FrameResult[] = [];
  let totalCost = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < selected.length; i++) {
    const frame = selected[i];
    const framePath = path.join(opts.framesDir, frame);
    const outPath = path.join(perFrameDir, frame.replace(/\.png$/, ".json"));

    // Resume support: skip frames we've already processed
    if (fs.existsSync(outPath)) {
      const cached = JSON.parse(fs.readFileSync(outPath, "utf-8")) as FrameResult;
      results.push(cached);
      totalCost += cached.cost_estimate_usd;
      totalInputTokens += cached.tokens.input;
      totalOutputTokens += cached.tokens.output;
      console.log(
        `  [${i + 1}/${selected.length}] ${frame} — cached (${cached.modality})`,
      );
      continue;
    }

    const ts = timestampFromFilename(frame);
    process.stdout.write(`  [${i + 1}/${selected.length}] ${frame} (${ts}s) ... `);
    try {
      const { parsed, raw, cost } = await classifyFrame(apiKey, framePath, opts.model);
      const result: FrameResult = {
        frame,
        timestamp: ts,
        modality: String(parsed.modality ?? "unknown"),
        content_kind: String(parsed.content_kind ?? ""),
        content: String(parsed.content ?? ""),
        dedup_key: String(parsed.dedup_key ?? ""),
        notes: parsed.notes ? String(parsed.notes) : undefined,
        raw_response: raw,
        cost_estimate_usd: cost,
        tokens: {
          input: raw.usage.prompt_tokens,
          output: raw.usage.completion_tokens,
        },
      };
      fs.writeFileSync(outPath, JSON.stringify(result, null, 2), "utf-8");
      results.push(result);
      totalCost += cost;
      totalInputTokens += raw.usage.prompt_tokens;
      totalOutputTokens += raw.usage.completion_tokens;
      console.log(
        `${result.modality} / ${result.content_kind} — $${cost.toFixed(4)} (running: $${totalCost.toFixed(3)})`,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`ERROR: ${msg}`);
      // Surface the error but keep going — partial results are fine.
    }
  }

  // Write the combined results file (no dedup yet — that's the next step).
  const allPath = path.join(opts.outputDir, "all-frames.json");
  fs.writeFileSync(allPath, JSON.stringify(results, null, 2), "utf-8");

  console.log("");
  console.log(`done.`);
  console.log(`  frames processed: ${results.length}`);
  console.log(`  total tokens:     in=${totalInputTokens} out=${totalOutputTokens}`);
  console.log(`  total cost:       $${totalCost.toFixed(4)}`);
  console.log(`  output:           ${allPath}`);
  console.log(`  per-frame JSONs:  ${perFrameDir}`);
}

main().catch((err) => {
  console.error("fatal:", err);
  process.exit(1);
});
