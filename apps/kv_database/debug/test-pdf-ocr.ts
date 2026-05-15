/**
 * Test script for PDF OCR extraction
 * Tests if images embedded in PDFs are extracted and OCR'd
 */

import { PDFProcessingPipeline } from "../src/lib/processors/pipelines/pdf-processing-pipeline";
import * as fs from "fs";
import * as path from "path";

async function testPdfOcr() {
  console.log("🧪 Testing PDF OCR Extraction\n");

  const pdfPath = process.argv[2];

  if (!pdfPath) {
    console.error("❌ Please provide a PDF file path as argument");
    console.log("Usage: tsx test-pdf-ocr.ts <path-to-pdf>");
    console.log(
      "Example: tsx test-pdf-ocr.ts ~/Downloads/ai-first-product-design.pdf"
    );
    process.exit(1);
  }

  if (!fs.existsSync(pdfPath)) {
    console.error(`❌ File not found: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`📄 Testing PDF: ${path.basename(pdfPath)}`);
  console.log(`📍 Full path: ${pdfPath}\n`);

  try {
    // Read the PDF file
    const buffer = fs.readFileSync(pdfPath);
    console.log(
      `📦 File size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB\n`
    );

    // Create PDF processing pipeline
    const pipeline = new PDFProcessingPipeline();

    // Process with OCR enabled
    console.log("🔄 Processing PDF with OCR enabled...\n");
    const result = await pipeline.process(buffer, {
      enableOCR: true,
      enableEntityAnalysis: true,
      enableQualityAnalysis: true,
    });

    // Display results
    console.log("\n📊 === RESULTS ===\n");
    console.log(`✅ Success: ${result.success}`);
    console.log(`⏱️  Processing time: ${result.processingTime}ms`);
    console.log(`📝 Strategy: ${result.metadata.processingStrategy.approach}`);
    console.log(
      `🔧 Text extraction method: ${result.metadata.textExtractionResult.method}`
    );
    console.log(`📄 Page count: ${result.metadata.pageCount}`);
    console.log(`📏 Character count: ${result.metadata.characterCount}`);
    console.log(`📖 Word count: ${result.metadata.wordCount}`);
    console.log(`🖼️  Has images: ${result.metadata.hasImages}`);
    console.log(`🖼️  Image count: ${result.metadata.imageCount}`);

    if (result.metadata.ocrResults) {
      console.log(`\n🔍 OCR Results:`);
      console.log(
        `   - Images processed: ${result.metadata.ocrResults.imageCount}`
      );
      console.log(
        `   - OCR text length: ${result.metadata.ocrResults.combinedText.length} characters`
      );
      console.log(
        `   - OCR confidence: ${(
          result.metadata.ocrResults.totalConfidence * 100
        ).toFixed(1)}%`
      );

      if (result.metadata.ocrResults.combinedText.length > 0) {
        console.log(`\n📝 Sample OCR Text (first 500 chars):`);
        console.log(`---`);
        console.log(result.metadata.ocrResults.combinedText.substring(0, 500));
        console.log(`---`);
      }
    } else {
      console.log(`\n⚠️  No OCR results available`);
    }

    console.log(
      `\n📝 Total combined text length: ${result.text.length} characters`
    );

    if (result.text.length > 0) {
      console.log(`\n📄 Sample combined text (first 500 chars):`);
      console.log(`---`);
      console.log(result.text.substring(0, 500));
      console.log(`---`);
    }

    if (result.metadata.qualityScore) {
      console.log(
        `\n📊 Quality Score: ${(
          result.metadata.qualityScore.overall * 100
        ).toFixed(1)}%`
      );
      console.log(
        `   - Completeness: ${(
          result.metadata.qualityScore.completeness * 100
        ).toFixed(1)}%`
      );
      console.log(
        `   - Coherence: ${(
          result.metadata.qualityScore.coherence * 100
        ).toFixed(1)}%`
      );
      console.log(
        `   - Confidence: ${(
          result.metadata.qualityScore.confidence * 100
        ).toFixed(1)}%`
      );
    }

    if (result.metadata.entityAnalysis) {
      console.log(`\n🏷️  Entity Analysis:`);
      console.log(
        `   - Entities found: ${result.metadata.entityAnalysis.entities.length}`
      );
      console.log(
        `   - Relationships: ${result.metadata.entityAnalysis.relationships.length}`
      );
      console.log(
        `   - Confidence: ${(
          result.metadata.entityAnalysis.confidence * 100
        ).toFixed(1)}%`
      );
    }

    console.log("\n✅ Test completed successfully!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    if (error instanceof Error) {
      console.error("Error details:", error.message);
      console.error("Stack:", error.stack);
    }
    process.exit(1);
  }
}

testPdfOcr();
