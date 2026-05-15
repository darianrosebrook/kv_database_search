/**
 * Extract a PDF into a Sterling-compatible evidence bundle.
 * Usage: npx tsx apps/kv_database/src/cli/extract-pdf-bundle.ts --export <output-dir> <path-to-pdf>
 */
import { PDFProcessingPipeline } from "../lib/processors/pipelines/pdf-processing-pipeline";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

async function main() {
  const args = process.argv.slice(2);
  let exportDir: string | null = null;
  let pdfPath: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--export" && i + 1 < args.length) { exportDir = args[++i]; }
    else { pdfPath = args[i]; }
  }
  if (!pdfPath || !exportDir) {
    console.error("Usage: npx tsx scripts/extract-pdf-bundle.ts --export <output-dir> <path-to-pdf>");
    process.exit(1);
  }
  if (!fs.existsSync(pdfPath)) { console.error(`File not found: ${pdfPath}`); process.exit(1); }

  const buffer = fs.readFileSync(pdfPath);
  const sourceHash = "sha256:" + crypto.createHash("sha256").update(buffer).digest("hex");
  console.log(`Processing: ${path.basename(pdfPath)} (${(buffer.length / 1024 / 1024).toFixed(2)} MB)`);

  const pipeline = new PDFProcessingPipeline();
  const result = await pipeline.process(buffer, { enableOCR: false, filename: path.basename(pdfPath) });
  if (!result.success) { console.error("PDF processing failed"); process.exit(1); }

  const pages = result.text.split(/\f/).filter((p: string) => p.trim().length > 0);
  const segments = pages.map((text: string, i: number) => ({
    start: i, end: i,
    text: text.trim().substring(0, 2000),
    confidence: result.metadata.processingStrategy?.confidence ?? 0.8,
  }));

  const manifest = {
    schema_id: "sterling.evidence_bundle.v1",
    source_hash: sourceHash,
    extractor_id: `obsidian-rag/pdf-processing@${result.metadata.processingStrategy?.textExtractionMethod ?? "unknown"}`,
    exported_at: new Date().toISOString(),
    language: "en",
    source: path.basename(pdfPath),
    content_classification: { isScreenRecording: false, hasUI: false, hasCode: false, hasPresentation: false },
    summary: {
      page_count: result.metadata.pageCount, word_count: result.metadata.wordCount,
      character_count: result.metadata.characterCount, segment_count: segments.length,
    },
    transcript_segments: segments,
    frames: [],
  };

  fs.mkdirSync(exportDir, { recursive: true });
  fs.writeFileSync(path.join(exportDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(`\nExported to: ${exportDir}`);
  console.log(`  ${segments.length} text segments, ${result.metadata.pageCount} pages, ${result.metadata.wordCount} words`);
}
main().catch(err => { console.error(err); process.exit(1); });
