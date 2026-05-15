import { ContentType } from "../types/index";
import { ObsidianDocument } from "../types/index";
import { LoggerFactory } from "./shared/logger";

/**
 * File processing utilities for Obsidian documents
 * @darianrosebrook
 */
export class ObsidianFileProcessor {
  private logger = LoggerFactory.create("ObsidianFileProcessor");

  /**
   * Parse an Obsidian markdown file and extract metadata
   */
  async parseObsidianFile(filePath: string): Promise<ObsidianDocument> {
    const fs = await import("fs");
    const path = await import("path");

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf-8");
    const fileName = path.basename(filePath);
    const filePathRelative = path.relative(process.cwd(), filePath);

    // Extract frontmatter and content
    const { frontmatter, body } = this.extractFrontmatter(content);

    // Determine content type
    const contentType = this.determineContentType(filePath, frontmatter);

    // Extract basic metadata
    const metadata = {
      fileName,
      filePath: filePathRelative,
      vaultPath: path.dirname(filePathRelative),
      contentType,
      language: this.detectLanguage(content),
      tags: this.extractTagsFromFrontmatter(frontmatter),
      frontmatter,
      content: body,
      fileSize: content.length,
      lastModified: new Date(),
    };

    this.logger.info(`Parsed Obsidian file: ${fileName} (${contentType})`);
    return metadata;
  }

  /**
   * Extract frontmatter from markdown content
   */
  private extractFrontmatter(content: string): {
    frontmatter: Record<string, unknown>;
    body: string;
  } {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);

    if (match) {
      try {
        const frontmatter = this.parseFrontmatter(match[1]);
        const body = match[2];
        return { frontmatter, body };
      } catch (error) {
        this.logger.warn(
          `Failed to parse frontmatter, treating as body: ${error}`
        );
      }
    }

    return { frontmatter: {}, body: content };
  }

  /**
   * Parse YAML frontmatter into object
   */
  private parseFrontmatter(
    frontmatterContent: string
  ): Record<string, unknown> {
    const lines = frontmatterContent.split("\n").filter((line) => line.trim());
    const result: Record<string, unknown> = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(":");
      if (colonIndex === -1) continue;

      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();

      // Simple parsing - could be enhanced with proper YAML parser
      if (value === "true" || value === "false") {
        result[key] = value === "true";
      } else if (!isNaN(Number(value))) {
        result[key] = Number(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Determine content type from file extension and frontmatter
   */
  private determineContentType(
    filePath: string,
    frontmatter: Record<string, unknown>
  ): ContentType {
    // Check frontmatter first
    if (frontmatter.contentType) {
      const ct = String(frontmatter.contentType).toLowerCase();
      if (ct in ContentType) {
        return ContentType[ct as keyof typeof ContentType];
      }
    }

    // Check file extension
    const ext = filePath.toLowerCase().split(".").pop();

    switch (ext) {
      case "md":
        return ContentType.MARKDOWN;
      case "txt":
        return ContentType.PLAIN_TEXT;
      case "pdf":
        return ContentType.PDF;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return ContentType.RASTER_IMAGE;
      default:
        return ContentType.UNKNOWN;
    }
  }

  /**
   * Extract tags from frontmatter
   */
  private extractTagsFromFrontmatter(
    frontmatter: Record<string, unknown>
  ): string[] {
    const tags = frontmatter.tags;

    if (Array.isArray(tags)) {
      return tags.map((tag) => String(tag));
    }

    if (typeof tags === "string") {
      return tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);
    }

    return [];
  }

  /**
   * Simple language detection based on content analysis
   */
  private detectLanguage(content: string): string {
    // Simple heuristic - look for common words in different languages
    // This is a basic implementation - could be enhanced with proper language detection
    const englishWords =
      /\b(the|and|or|but|in|on|at|to|for|of|with|by|an|a)\b/gi;
    const matches = content.match(englishWords);

    if (matches && matches.length > 5) {
      return "en";
    }

    return "unknown";
  }

  /**
   * Validate that a file can be processed
   */
  async validateFile(filePath: string): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      const fs = await import("fs");
      const path = await import("path");

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        errors.push(`File not found: ${filePath}`);
        return { isValid: false, errors, warnings };
      }

      // Check file size (warn for very large files)
      const stats = fs.statSync(filePath);
      if (stats.size > 10 * 1024 * 1024) {
        // 10MB
        warnings.push(
          `Large file detected (${Math.round(stats.size / 1024 / 1024)}MB)`
        );
      }

      // Check file extension
      const ext = path.extname(filePath).toLowerCase();
      const supportedExtensions = [".md", ".txt", ".pdf"];

      if (!supportedExtensions.includes(ext)) {
        warnings.push(`Unusual file extension: ${ext}`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Validation error: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      return { isValid: false, errors, warnings };
    }
  }
}
