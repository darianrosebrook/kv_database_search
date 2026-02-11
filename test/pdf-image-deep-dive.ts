/**
 * Deep dive into what the PDF pipeline misses on image-heavy PDFs
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function deepDive(pdfPath: string) {
  const filename = path.basename(pdfPath);
  const buffer = fs.readFileSync(pdfPath);

  console.log(`\nAnalyzing: ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
  console.log("=".repeat(70));

  // Render first 5 pages to images and OCR them
  const { fromBuffer } = await import("pdf2pic");
  const { createWorker } = await import("tesseract.js");

  const converter = fromBuffer(buffer, {
    density: 200,
    saveFilename: `deep-dive-${Date.now()}`,
    savePath: "/tmp",
    format: "png",
  });

  const pdfParse = await import("pdf-parse");
  const pdfData = await pdfParse.default(buffer);
  const totalPages = pdfData.numpages;
  const testPages = [1, 2, 3, Math.ceil(totalPages / 3), Math.ceil(totalPages * 2 / 3)];

  const worker = await createWorker("eng");

  let totalOCRWords = 0;
  let totalPdfParseWords = 0;

  for (const pageNum of testPages) {
    if (pageNum > totalPages) continue;

    console.log(`\n--- Page ${pageNum}/${totalPages} ---`);

    try {
      const result = await converter(pageNum);
      let pageBuffer: Buffer | null = null;
      let imgPath: string | null = null;

      if (result.buffer) {
        pageBuffer = result.buffer as Buffer;
      } else if (result.path && fs.existsSync(result.path)) {
        pageBuffer = fs.readFileSync(result.path);
        imgPath = result.path;
      }

      if (pageBuffer) {
        // OCR the rendered page
        const ocrResult = await worker.recognize(pageBuffer);
        const ocrText = ocrResult.data.text.trim();
        const confidence = ocrResult.data.confidence ?? 0;
        const ocrWords = ocrText.split(/\s+/).filter((w: string) => w.length > 0);
        totalOCRWords += ocrWords.length;

        console.log(`  OCR: ${ocrWords.length} words, ${confidence.toFixed(0)}% confidence`);
        if (ocrText.length > 0) {
          const preview = ocrText.replace(/\n/g, " ").substring(0, 200);
          console.log(`  Preview: "${preview}${ocrText.length > 200 ? "..." : ""}"`);
        } else {
          console.log(`  (no text detected - likely a photo or pure graphic)`);
        }

        // Clean up rendered image
        if (imgPath) {
          try { fs.unlinkSync(imgPath); } catch { /* ignore cleanup */ }
        }
      }
    } catch (e) {
      console.log(`  Failed: ${e}`);
    }
  }

  await worker.terminate();

  // What pdf-parse gets from the same pages
  const pdfWords = pdfData.text.split(/\s+/).filter((w: string) => w.length > 0);
  totalPdfParseWords = pdfWords.length;

  console.log(`\n--- Comparison ---`);
  console.log(`  pdf-parse total: ${totalPdfParseWords} words from ${totalPages} pages`);
  console.log(`  OCR sample (${testPages.length} pages): ${totalOCRWords} words`);
  console.log(`  Estimated OCR total: ~${Math.round(totalOCRWords / testPages.length * totalPages)} words from ${totalPages} pages`);

  if (totalOCRWords > totalPdfParseWords && totalPdfParseWords < 100) {
    console.log(`\n  ⚠️  This PDF is essentially INVISIBLE to the current pipeline!`);
    console.log(`     pdf-parse gets ${totalPdfParseWords} words, but OCR finds ~${Math.round(totalOCRWords / testPages.length * totalPages)} words.`);
    console.log(`     All slide/diagram content is being LOST.`);
  }
}

async function main() {
  const testFilesDir = path.resolve(__dirname, "test-files");

  // Test the problematic ones
  const pdfs = [
    "Innovation Summit : Designing for AI: UX Patterns, Practice, and Product Differentiation.pdf",
    "designing-ux.pdf",
    "User_Manual_Template_1662 - ENGLISH.pdf",
  ];

  for (const pdf of pdfs) {
    const fullPath = path.join(testFilesDir, pdf);
    if (fs.existsSync(fullPath)) {
      await deepDive(fullPath);
    }
  }
}

main().catch(console.error);
