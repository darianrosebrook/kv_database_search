/**
 * Image OCR Extractor - Single purpose OCR processing
 * Extracted from OCR logic scattered across processors
 */

import { OCRProcessor } from "../ocr-processor";

export interface OCRExtractionResult {
  text: string;
  confidence: number;
  processingTime: number;
  metadata: {
    imageWidth?: number;
    imageHeight?: number;
    detectedLanguage?: string;
    wordCount: number;
    characterCount: number;
  };
}

export interface ImageInfo {
  pageNumber?: number;
  width: number;
  height: number;
  data?: string; // base64 data
}

export interface OCRExtractionOptions {
  language?: string;
  minConfidence?: number;
  enableLanguageDetection?: boolean;
}

export class ImageOCRExtractor {
  private ocrProcessor: OCRProcessor;

  constructor() {
    this.ocrProcessor = new OCRProcessor();
  }

  /**
   * Extract text from a single image buffer
   */
  async extractFromBuffer(
    imageBuffer: Buffer,
    options: OCRExtractionOptions = {}
  ): Promise<OCRExtractionResult> {
    const startTime = Date.now();
    const { minConfidence = 0.5 } = options;

    try {
      console.log("🔍 Starting OCR extraction...");

      const ocrResult = await this.ocrProcessor.extractTextFromBuffer(
        imageBuffer
      );

      const processingTime = Date.now() - startTime;

      // Filter out low-confidence results if threshold is set
      let finalText = ocrResult.text;
      let finalConfidence = ocrResult.metadata.confidence;

      if (finalConfidence < minConfidence) {
        console.log(
          `⚠️ OCR confidence ${finalConfidence.toFixed(
            2
          )} below threshold ${minConfidence}`
        );
        finalText = "";
        finalConfidence = 0;
      }

      console.log(
        `✅ OCR complete: ${
          finalText.length
        } characters extracted (confidence: ${finalConfidence.toFixed(2)})`
      );

      return {
        text: finalText,
        confidence: finalConfidence,
        processingTime,
        metadata: {
          detectedLanguage: ocrResult.metadata.language,
          wordCount: this.countWords(finalText),
          characterCount: finalText.length,
        },
      };
    } catch (error) {
      console.error("❌ OCR extraction failed:", (error as Error).message);

      return {
        text: "",
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: {
          wordCount: 0,
          characterCount: 0,
        },
      };
    }
  }

  /**
   * Extract text from multiple images (e.g., from PDF pages)
   */
  async extractFromImages(
    images: ImageInfo[],
    options: OCRExtractionOptions = {}
  ): Promise<{
    results: Array<OCRExtractionResult & { pageNumber?: number }>;
    combinedText: string;
    totalConfidence: number;
    totalProcessingTime: number;
  }> {
    const results: Array<OCRExtractionResult & { pageNumber?: number }> = [];
    const textParts: string[] = [];
    let totalProcessingTime = 0;
    let totalConfidence = 0;

    console.log(`🖼️ Processing ${images.length} images for OCR...`);

    for (let i = 0; i < images.length; i++) {
      const image = images[i];

      try {
        if (!image.data) {
          console.warn(`⚠️ No image data for image ${i + 1}, skipping`);
          continue;
        }

        console.log(
          `🔍 Processing image ${i + 1}/${images.length} (page ${
            image.pageNumber || "unknown"
          })...`
        );

        // Convert base64 image data to buffer
        const imageBuffer = Buffer.from(image.data, "base64");

        // Perform OCR on the image
        const ocrResult = await this.extractFromBuffer(imageBuffer, options);

        // Add page information
        const resultWithPage = {
          ...ocrResult,
          pageNumber: image.pageNumber,
        };

        results.push(resultWithPage);
        totalProcessingTime += ocrResult.processingTime;

        // Add to combined text if we got meaningful results
        if (ocrResult.text && ocrResult.text.length > 10) {
          const pageLabel = image.pageNumber
            ? `[Image OCR from page ${image.pageNumber}]`
            : `[Image OCR ${i + 1}]`;
          textParts.push(`${pageLabel}: ${ocrResult.text}`);
          totalConfidence += ocrResult.confidence;
        }

        console.log(
          `✅ Image ${i + 1} complete: ${ocrResult.text.length} characters`
        );
      } catch (error) {
        console.warn(
          `⚠️ OCR failed for image ${i + 1}:`,
          (error as Error).message
        );

        results.push({
          text: "",
          confidence: 0,
          processingTime: 0,
          metadata: { wordCount: 0, characterCount: 0 },
          pageNumber: image.pageNumber,
        });
      }
    }

    const combinedText = textParts.join("\n\n");
    const avgConfidence =
      results.length > 0
        ? totalConfidence / results.filter((r) => r.confidence > 0).length
        : 0;

    console.log(
      `🎯 OCR batch complete: ${results.length} images processed, ${combinedText.length} total characters`
    );

    return {
      results,
      combinedText,
      totalConfidence: avgConfidence || 0,
      totalProcessingTime,
    };
  }

  /**
   * Extract images from PDF pages and perform OCR
   */
  async extractFromPDFPages(pages): Promise<{
    images: Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }>;
    combinedText: string;
    totalConfidence: number;
  }> {
    const processedImages: Array<{
      pageNumber: number;
      width: number;
      height: number;
      ocrText?: string;
      ocrConfidence?: number;
    }> = [];

    const imageInfos: ImageInfo[] = [];

    // Extract image information from PDF pages
    for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
      const page = pages[pageIndex];

      if (page.content && page.content.length > 0) {
        for (const item of page.content) {
          if (item.type === "image" && item.data) {
            imageInfos.push({
              pageNumber: pageIndex + 1,
              width: item.width || 0,
              height: item.height || 0,
              data: item.data,
            });
          }
        }
      }
    }

    if (imageInfos.length === 0) {
      return {
        images: [],
        combinedText: "",
        totalConfidence: 0,
      };
    }

    // Perform OCR on all images
    const ocrResults = await this.extractFromImages(imageInfos);

    // Convert results to the expected format
    for (let i = 0; i < imageInfos.length; i++) {
      const imageInfo = imageInfos[i];
      const ocrResult = ocrResults.results[i];

      processedImages.push({
        pageNumber: imageInfo.pageNumber || i + 1,
        width: imageInfo.width,
        height: imageInfo.height,
        ocrText: ocrResult?.text,
        ocrConfidence: ocrResult?.confidence,
      });
    }

    return {
      images: processedImages,
      combinedText: ocrResults.combinedText,
      totalConfidence: ocrResults.totalConfidence,
    };
  }

  /**
   * Assess whether OCR is likely to be beneficial for given images
   */
  assessOCRViability(images: ImageInfo[]): {
    viable: boolean;
    confidence: number;
    reasons: string[];
  } {
    const reasons: string[] = [];
    let confidence = 0.5; // Base confidence

    if (images.length === 0) {
      return {
        viable: false,
        confidence: 0,
        reasons: ["No images to process"],
      };
    }

    // Check image count
    if (images.length > 10) {
      reasons.push("Many images detected - OCR likely beneficial");
      confidence += 0.2;
    } else if (images.length > 3) {
      reasons.push("Several images detected");
      confidence += 0.1;
    }

    // Check image sizes (larger images more likely to contain readable text)
    const avgArea =
      images.reduce((sum, img) => sum + img.width * img.height, 0) /
      images.length;
    if (avgArea > 500000) {
      // ~700x700 pixels
      reasons.push("Large images detected - likely to contain text");
      confidence += 0.2;
    } else if (avgArea > 100000) {
      // ~300x300 pixels
      reasons.push("Medium-sized images detected");
      confidence += 0.1;
    } else {
      reasons.push("Small images detected - OCR may be less effective");
      confidence -= 0.1;
    }

    const viable = confidence > 0.4;

    return {
      viable,
      confidence: Math.max(0, Math.min(1, confidence)),
      reasons,
    };
  }

  /**
   * Simple word counting utility
   */
  private countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }
}
