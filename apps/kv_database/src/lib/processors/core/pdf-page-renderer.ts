/**
 * PDF Page Renderer - Renders PDF pages to images for OCR on scanned PDFs
 * Uses pdfjs-dist + node-canvas for rendering (no system dependencies required)
 */

import { createCanvas, type Canvas } from "canvas";

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
   * Uses pdfjs-dist to render pages to node-canvas
   */
  async renderPagesToImages(
    pdfBuffer: Buffer,
    options: PageRenderOptions = {}
  ): Promise<RenderedPage[]> {
    const {
      density = 150, // 150 DPI is good balance for OCR
      format = "png",
      maxPages,
    } = options;

    const startTime = Date.now();
    const renderedPages: RenderedPage[] = [];

    try {
      console.log(`📸 Rendering PDF pages at ${density} DPI...`);

      // Import pdfjs-dist dynamically (ESM module)
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

      // Load the PDF document
      const data = new Uint8Array(pdfBuffer);
      const loadingTask = pdfjsLib.getDocument({ data });
      const pdfDoc = await loadingTask.promise;

      const totalPages = pdfDoc.numPages;
      const pagesToRender = maxPages
        ? Math.min(totalPages, maxPages)
        : totalPages;

      console.log(`📄 Rendering ${pagesToRender} of ${totalPages} pages...`);

      // Scale factor: pdfjs-dist uses 72 DPI internally
      const scale = density / 72;

      for (let pageNum = 1; pageNum <= pagesToRender; pageNum++) {
        try {
          const page = await pdfDoc.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const width = Math.floor(viewport.width);
          const height = Math.floor(viewport.height);

          // Create a canvas for this page
          const canvas: Canvas = createCanvas(width, height);
          const context = canvas.getContext("2d");

          // Render the page to canvas
           
          const renderContext = {
            canvasContext: context as any,
            viewport,
          };

          await page.render(renderContext).promise;

          // Export canvas to buffer
          let imageBuffer: Buffer;
          if (format === "jpg") {
            imageBuffer = canvas.toBuffer("image/jpeg");
          } else {
            imageBuffer = canvas.toBuffer("image/png");
          }

          renderedPages.push({
            pageNumber: pageNum,
            buffer: imageBuffer,
            width,
            height,
          });

          console.log(
            `  ✅ Page ${pageNum} rendered: ${width}x${height}, buffer size: ${imageBuffer.length}`
          );
        } catch (pageError) {
          console.error(`  ❌ Failed to render page ${pageNum}:`, pageError);
        }
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
