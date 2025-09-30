/**
 * PDF Page Renderer - Renders PDF pages to images for OCR on scanned PDFs
 * Handles PDFs where pages are rasterized images rather than embedded vector content
 */

import { fromBuffer } from "pdf2pic";
import * as fs from "fs";
import * as path from "path";

export interface RenderedPage {
  pageNumber: number;
  buffer: Buffer;
  width: number;
  height: number;
}

export interface PageRenderOptions {
  density?: number; // DPI for rendering (default: 150)
  format?: "png" | "jpg";
  quality?: number; // For JPG (1-100)
  maxPages?: number; // Limit number of pages to render
}

export class PDFPageRenderer {
  /**
   * Render PDF pages to images for OCR processing
   * Used for scanned/rasterized PDFs where each page is an image
   */
  async renderPagesToImages(
    pdfBuffer: Buffer,
    options: PageRenderOptions = {}
  ): Promise<RenderedPage[]> {
    const {
      density = 150, // 150 DPI is good balance for OCR
      format = "png",
      quality = 90,
      maxPages,
    } = options;

    const startTime = Date.now();
    const renderedPages: RenderedPage[] = [];

    try {
      // Create temporary file for pdf2pic
      const tempPdfPath = `/tmp/pdf_render_${Date.now()}.pdf`;
      const tempOutputDir = `/tmp/pdf_render_output_${Date.now()}`;

      fs.writeFileSync(tempPdfPath, pdfBuffer);
      fs.mkdirSync(tempOutputDir, { recursive: true });

      console.log(`📸 Rendering PDF pages at ${density} DPI...`);

      // Configure pdf2pic
      const converter = fromBuffer(pdfBuffer, {
        density,
        saveFilename: "page",
        savePath: tempOutputDir,
        format,
        width: undefined, // Let it use density
        height: undefined,
        quality,
      });

      // Get page count first
      const pdfParse = await import("pdf-parse");
      const pdfData = await pdfParse.default(pdfBuffer);
      const totalPages = pdfData.numpages;
      const pagesToRender = maxPages
        ? Math.min(totalPages, maxPages)
        : totalPages;

      console.log(`📄 Rendering ${pagesToRender} of ${totalPages} pages...`);

      // Render pages
      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        try {
          const result = await converter(pageNum);

          console.log(
            `  📋 Page ${pageNum} result type:`,
            typeof result,
            "keys:",
            Object.keys(result || {})
          );

          if (result) {
            // pdf2pic might save to file, need to read it
            let imageBuffer: Buffer;

            if (result.buffer) {
              imageBuffer = result.buffer as Buffer;
            } else if (result.path && fs.existsSync(result.path)) {
              // Read from saved file
              imageBuffer = fs.readFileSync(result.path);
            } else {
              console.warn(`  ⚠️ No buffer or path for page ${pageNum}`);
              continue;
            }

            // Get image dimensions (approximate from DPI)
            // At 150 DPI, standard letter: 1275x1650 pixels
            const estimatedWidth = Math.round(8.5 * density);
            const estimatedHeight = Math.round(11 * density);

            renderedPages.push({
              pageNumber: pageNum,
              buffer: imageBuffer,
              width: estimatedWidth,
              height: estimatedHeight,
            });

            console.log(
              `  ✅ Page ${pageNum} rendered, buffer size: ${imageBuffer.length}`
            );
          }
        } catch (pageError) {
          console.error(`  ❌ Failed to render page ${pageNum}:`, pageError);
        }
      }

      // Cleanup temp files
      try {
        fs.unlinkSync(tempPdfPath);
        fs.rmSync(tempOutputDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.warn("Failed to cleanup temp files:", cleanupError);
      }

      const processingTime = Date.now() - startTime;
      console.log(
        `✅ Rendered ${renderedPages.length} pages in ${processingTime}ms`
      );

      return renderedPages;
    } catch (error) {
      console.error("❌ PDF page rendering failed:", error);
      throw error;
    }
  }

  /**
   * Check if PDF is likely a scanned/rasterized document
   */
  async isScannedPDF(pdfBuffer: Buffer): Promise<{
    isScanned: boolean;
    textDensity: number;
    pageCount: number;
  }> {
    try {
      const pdfParse = await import("pdf-parse");
      const pdfData = await pdfParse.default(pdfBuffer);

      const textLength = pdfData.text?.length || 0;
      const pageCount = pdfData.numpages;
      const textDensity = textLength / pageCount;

      // Consider it scanned if less than 50 chars per page on average
      const isScanned = textDensity < 50;

      return {
        isScanned,
        textDensity,
        pageCount,
      };
    } catch (error) {
      console.error("Error checking if PDF is scanned:", error);
      return {
        isScanned: false,
        textDensity: 0,
        pageCount: 0,
      };
    }
  }
}
