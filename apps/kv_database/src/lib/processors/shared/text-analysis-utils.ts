/**
 * Shared text analysis utilities
 * Extracted from duplicated code across processors
 */

import { detectLanguage } from "../../utils";

export interface DocumentStructure {
  headers: string[];
  paragraphs: number;
  hasTables: boolean;
  hasImages: boolean;
  sections: string[];
}

export interface TextMetrics {
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  language: string;
}

export class TextAnalysisUtils {
  /**
   * Count words in text, handling various edge cases
   */
  static countWords(text: string): number {
    if (!text || text.trim().length === 0) return 0;

    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }

  /**
   * Count characters excluding whitespace
   */
  static countCharacters(text: string): number {
    if (!text) return 0;
    return text.replace(/\s/g, "").length;
  }

  /**
   * Get comprehensive text metrics
   */
  static getTextMetrics(text: string, language?: string): TextMetrics {
    const wordCount = this.countWords(text);
    const characterCount = this.countCharacters(text);
    const hasText = text.trim().length > 0;
    const detectedLanguage = language || detectLanguage(text);

    return {
      wordCount,
      characterCount,
      hasText,
      language: detectedLanguage,
    };
  }

  /**
   * Clean extracted text by removing common artifacts
   */
  static cleanExtractedText(text: string): string {
    if (!text) return "";

    return (
      text
        // Remove excessive whitespace
        .replace(/\s{3,}/g, "  ")
        // Remove null characters
        .replace(/\0/g, "")
        // Remove form feed characters
        .replace(/\f/g, "\n")
        // Remove excessive newlines
        .replace(/\n{4,}/g, "\n\n\n")
        // Trim
        .trim()
    );
  }

  /**
   * Analyze document structure to extract headers and count elements
   */
  static analyzeDocumentStructure(text: string): DocumentStructure {
    const headers: string[] = [];
    const sections: string[] = [];
    let paragraphs = 0;
    let hasTables = false;
    let hasImages = false;

    if (!text) {
      return { headers, sections, paragraphs, hasTables, hasImages };
    }

    // Extract potential headers (lines that look like titles)
    const lines = text.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length > 0 && trimmed.length < 100) {
        // Check if it looks like a header
        const isHeader =
          trimmed.length > 5 &&
          !/[.!?]$/.test(trimmed) &&
          (trimmed === trimmed.toUpperCase() || /^[A-Z][^.!?]*$/.test(trimmed));

        if (isHeader) {
          headers.push(trimmed);
        }
      }
    }

    // Extract sections (numbered or bulleted items)
    const sectionPattern = /^(\d+\.|\*|\-|\•)\s+(.+)$/gm;
    let match;
    while ((match = sectionPattern.exec(text)) !== null) {
      sections.push(match[2].trim());
    }

    // Count paragraphs (blocks of text separated by empty lines)
    paragraphs = text
      .split(/\n\s*\n/)
      .filter((block) => block.trim().length > 0).length;

    // Detect tables (multiple lines with similar structure)
    const tablePattern = /(.+\t.+|.+,.+.+)\n(.+\t.+|.+,.+.+)/;
    hasTables = tablePattern.test(text);

    // Detect image references
    hasImages =
      /\b(image|figure|img|pic|photo)\b/i.test(text) ||
      /\.(jpg|jpeg|png|gif|bmp|tiff|webp)\b/i.test(text);

    return { headers, sections, paragraphs, hasTables, hasImages };
  }

  /**
   * Extract potential titles from text
   */
  static extractTitle(text: string, metadata?: any): string | undefined {
    if (metadata?.title) return metadata.title;

    if (!text) return undefined;

    // Try to find title from first meaningful line
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    for (const line of lines.slice(0, 5)) {
      // Check first 5 non-empty lines
      if (line.length > 10 && line.length < 100 && !line.includes(".")) {
        return line;
      }
    }

    return undefined;
  }

  /**
   * Detect if text is likely machine-generated or low quality
   */
  static assessTextQuality(text: string): {
    score: number; // 0-1, higher is better
    issues: string[];
    isLikelyMachineGenerated: boolean;
  } {
    const issues: string[] = [];
    let score = 1.0;

    if (!text || text.trim().length === 0) {
      return {
        score: 0,
        issues: ["No text content"],
        isLikelyMachineGenerated: false,
      };
    }

    // Check for excessive repetition
    const words = text.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const repetitionRatio = uniqueWords.size / words.length;

    if (repetitionRatio < 0.3) {
      issues.push("High word repetition");
      score -= 0.3;
    }

    // Check for excessive special characters
    const specialCharRatio =
      (text.match(/[^\w\s]/g) || []).length / text.length;
    if (specialCharRatio > 0.2) {
      issues.push("Excessive special characters");
      score -= 0.2;
    }

    // Check for very short sentences (might indicate OCR errors)
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) /
      sentences.length;

    if (avgSentenceLength < 3) {
      issues.push("Very short sentences (possible OCR errors)");
      score -= 0.2;
    }

    // Check for machine-generated patterns
    const machinePatterns = [
      /lorem ipsum/i,
      /\b(test|sample|placeholder|dummy)\b.*\b(text|content|data)\b/i,
      /^(.*)\1{3,}/, // Repeated patterns
    ];

    const isLikelyMachineGenerated = machinePatterns.some((pattern) =>
      pattern.test(text)
    );
    if (isLikelyMachineGenerated) {
      issues.push("Contains machine-generated patterns");
      score -= 0.4;
    }

    return {
      score: Math.max(0, score),
      issues,
      isLikelyMachineGenerated,
    };
  }
}
