/**
 * PDF Pipeline Review - Tests what the current pipeline captures vs misses
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function reviewPDF(pdfPath: string) {
  const filename = path.basename(pdfPath);
  const stat = fs.statSync(pdfPath);
  console.log(`\n${"=".repeat(70)}`);
  console.log(`PDF: ${filename}`);
  console.log(`Size: ${(stat.size / 1024).toFixed(0)} KB`);
  console.log("=".repeat(70));

  const buffer = fs.readFileSync(pdfPath);

  // Step 1: Basic text extraction with pdf-parse
  console.log("\n--- Step 1: pdf-parse text extraction ---");
  const pdfParse = await import("pdf-parse");
  const pdfData = await pdfParse.default(buffer);
  console.log(`  Pages: ${pdfData.numpages}`);
  console.log(`  Text length: ${pdfData.text.length} chars`);
  console.log(`  Text density: ${(pdfData.text.length / pdfData.numpages).toFixed(0)} chars/page`);
  console.log(`  Words: ${pdfData.text.split(/\s+/).filter((w: string) => w.length > 0).length}`);
  console.log(`  First 300 chars: "${pdfData.text.substring(0, 300).replace(/\n/g, "\\n")}"`);

  // Step 2: pdf.js-extract - check for embedded images
  console.log("\n--- Step 2: pdf.js-extract (image detection) ---");
  const PDFExtract = (await import("pdf.js-extract")).PDFExtract;
  const pdfExtract = new PDFExtract();
  const extractResult = await pdfExtract.extractBuffer(buffer);

  let totalImages = 0;
  let totalTextItems = 0;
  const pagesWithImages: number[] = [];
  const pagesWithText: number[] = [];

  for (let i = 0; i < extractResult.pages.length; i++) {
    const page = extractResult.pages[i];
    let pageImages = 0;
    let pageTextItems = 0;

    for (const item of page.content) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((item as any).type === "image") {
        pageImages++;
      } else {
        pageTextItems++;
      }
    }

    if (pageImages > 0) {
      pagesWithImages.push(i + 1);
      totalImages += pageImages;
    }
    if (pageTextItems > 0) {
      pagesWithText.push(i + 1);
      totalTextItems += pageTextItems;
    }
  }

  console.log(`  Total pages: ${extractResult.pages.length}`);
  console.log(`  Pages with text items: ${pagesWithText.length}`);
  console.log(`  Pages with images: ${pagesWithImages.length}`);
  console.log(`  Total embedded images: ${totalImages}`);
  console.log(`  Total text items: ${totalTextItems}`);

  if (pagesWithImages.length > 0) {
    console.log(`  Image pages: ${pagesWithImages.slice(0, 20).join(", ")}${pagesWithImages.length > 20 ? "..." : ""}`);
  }

  // Step 3: Strategy determination
  console.log("\n--- Step 3: Strategy determination ---");
  const textDensity = pdfData.text.length / pdfData.numpages;
  const fileSizeToTextRatio = pdfData.text.length > 0 ? buffer.length / pdfData.text.length : buffer.length;
  const isLowTextDensity = textDensity < 50;
  const isHighFileSizeRatio = fileSizeToTextRatio > 10 * 1024;
  const isLargeFileMinimalText = buffer.length > 5 * 1024 * 1024 && pdfData.text.length < 2000;

  let strategy: string;
  if (isLowTextDensity && (isHighFileSizeRatio || isLargeFileMinimalText)) {
    strategy = "image-heavy";
  } else if (pdfData.text.length < 100) {
    strategy = "ocr-fallback";
  } else if (textDensity > 200 && fileSizeToTextRatio < 5 * 1024) {
    strategy = "text-focused";
  } else {
    strategy = "hybrid";
  }

  console.log(`  Text density: ${textDensity.toFixed(0)} chars/page`);
  console.log(`  File size to text ratio: ${(fileSizeToTextRatio / 1024).toFixed(1)} KB/char`);
  console.log(`  Strategy would be: ${strategy}`);

  // Step 4: The critical check - would OCR be triggered?
  console.log("\n--- Step 4: OCR trigger analysis ---");
  const hasSufficientTextContent = pdfData.text.length > 100 && true; // confidence assumed
  const wouldSkipOCR = hasSufficientTextContent;

  console.log(`  Has sufficient text (>100 chars): ${pdfData.text.length > 100}`);
  console.log(`  Would skip OCR: ${wouldSkipOCR}`);

  if (wouldSkipOCR && totalImages > 0) {
    console.log(`  ⚠️  PROBLEM: ${totalImages} embedded images exist but OCR would be SKIPPED`);
    console.log(`     because text extraction appears "sufficient" (${pdfData.text.length} chars)`);
    console.log(`     Any text in figures, diagrams, charts, or screenshots will be LOST`);
  }

  // Step 5: Render a sample page and try OCR to see what we're missing
  if (totalImages > 0 || pagesWithImages.length > 0) {
    console.log("\n--- Step 5: Sample image OCR test ---");
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");

    // Render a couple pages to images and OCR them
    try {
      const { fromBuffer } = await import("pdf2pic");
      const converter = fromBuffer(buffer, {
        density: 200,
        saveFilename: "test-page",
        savePath: "/tmp",
        format: "png",
      });

      // Pick pages that have images
      const testPages = pagesWithImages.length > 0
        ? pagesWithImages.slice(0, 3)
        : [1, Math.ceil(extractResult.pages.length / 2)];

      for (const pageNum of testPages) {
        try {
          const result = await converter(pageNum);
          let pageBuffer: Buffer | null = null;

          if (result.buffer) {
            pageBuffer = result.buffer as Buffer;
          } else if (result.path && fs.existsSync(result.path)) {
            pageBuffer = fs.readFileSync(result.path);
            fs.unlinkSync(result.path); // cleanup
          }

          if (pageBuffer) {
            const ocrResult = await worker.recognize(pageBuffer);
            const ocrText = ocrResult.data.text.trim();
            const confidence = ocrResult.data.confidence ?? 0;

            // Compare what pdf-parse got for this page vs what OCR gets
            console.log(`\n  Page ${pageNum} OCR:`);
            console.log(`    Confidence: ${confidence.toFixed(0)}%`);
            console.log(`    Words: ${ocrText.split(/\s+/).filter((w: string) => w.length > 0).length}`);
            console.log(`    Text preview: "${ocrText.replace(/\n/g, " ").substring(0, 200)}${ocrText.length > 200 ? "..." : ""}"`);
          }
        } catch (e) {
          console.log(`  Failed to render page ${pageNum}: ${e}`);
        }
      }
    } catch (e) {
      console.log(`  pdf2pic not available or failed: ${e}`);
    }

    await worker.terminate();
  }

  return {
    filename,
    pages: pdfData.numpages,
    textLength: pdfData.text.length,
    textDensity,
    totalImages,
    strategy,
    wouldSkipOCR,
  };
}

async function main() {
  console.log("PDF Pipeline Review");
  console.log("===================\n");

  const testFilesDir = path.resolve(__dirname, "test-files");
  const pdfs = fs.readdirSync(testFilesDir)
    .filter((f) => f.endsWith(".pdf"))
    .map((f) => path.join(testFilesDir, f));

  console.log(`Found ${pdfs.length} test PDFs\n`);

  const results = [];
  for (const pdf of pdfs) {
    try {
      const result = await reviewPDF(pdf);
      results.push(result);
    } catch (e) {
      console.error(`Failed to review ${path.basename(pdf)}: ${e}`);
    }
  }

  // Summary
  console.log("\n\n" + "=".repeat(70));
  console.log("SUMMARY");
  console.log("=".repeat(70));
  for (const r of results) {
    const status = r.wouldSkipOCR && r.totalImages > 0 ? "⚠️  IMAGES IGNORED" : "✅";
    console.log(`  ${status} ${r.filename.substring(0, 50).padEnd(52)} strategy=${r.strategy.padEnd(12)} images=${r.totalImages} text=${r.textLength}`);
  }
}

main().catch(console.error);
