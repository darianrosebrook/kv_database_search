/**
 * Image Link Extraction from Markdown Content
 * Extracts embedded images from markdown files for processing
 */

export interface ImageLink {
  /** Original markdown syntax (e.g., "![alt](image.png)" or "[[image.png]]") */
  original: string;

  /** Alt text for the image */
  alt: string;

  /** Source path/URL of the image */
  src: string;

  /** Line number where the link appears */
  line: number;

  /** Column position in the line */
  column: number;

  /** Whether this is an Obsidian wikilink (double brackets) */
  isWikilink: boolean;

  /** Whether this is a reference-style link */
  isReference: boolean;

  /** Reference label if it's a reference-style link */
  referenceLabel?: string;
}

export interface ImageLinkExtractionResult {
  /** All extracted image links */
  links: ImageLink[];

  /** Lines that contain images */
  linesWithImages: number[];

  /** Summary statistics */
  stats: {
    totalLinks: number;
    wikilinks: number;
    markdownLinks: number;
    referenceLinks: number;
    uniquePaths: number;
  };
}

/**
 * Extracts image links from markdown content
 */
export class ImageLinkExtractor {
  private readonly wikilinkRegex = /!\[\[([^\]]+)\]\]/g;
  private readonly markdownImageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  private readonly referenceImageRegex = /!\[([^\]]*)\]\[([^\]]+)\]/g;

  /**
   * Extract all image links from markdown content
   */
  extractImageLinks(content: string): ImageLinkExtractionResult {
    const links: ImageLink[] = [];
    const linesWithImages = new Set<number>();

    // Track positions for accurate line/column reporting
    const lines = content.split("\n");

    // Extract wikilinks (Obsidian-style)
    this.extractWikilinks(content, lines, links, linesWithImages);

    // Extract markdown-style image links
    this.extractMarkdownImages(content, lines, links, linesWithImages);

    // Extract reference-style image links
    this.extractReferenceImages(content, lines, links, linesWithImages);

    // Calculate statistics
    const stats = this.calculateStats(links);

    return {
      links,
      linesWithImages: Array.from(linesWithImages).sort((a, b) => a - b),
      stats,
    };
  }

  private extractWikilinks(
    content: string,
    lines: string[],
    links: ImageLink[],
    linesWithImages: Set<number>
  ): void {
    let match;
    this.wikilinkRegex.lastIndex = 0; // Reset regex state

    while ((match = this.wikilinkRegex.exec(content)) !== null) {
      const original = match[0];
      const src = match[1];
      const startPos = match.index;

      // Find line and column
      const { line, column } = this.findPosition(lines, startPos);

      links.push({
        original,
        alt: src, // Wikilinks don't have separate alt text
        src,
        line,
        column,
        isWikilink: true,
        isReference: false,
      });

      linesWithImages.add(line);
    }
  }

  private extractMarkdownImages(
    content: string,
    lines: string[],
    links: ImageLink[],
    linesWithImages: Set<number>
  ): void {
    let match;
    this.markdownImageRegex.lastIndex = 0;

    while ((match = this.markdownImageRegex.exec(content)) !== null) {
      const original = match[0];
      const alt = match[1];
      const src = match[2];
      const startPos = match.index;

      // Find line and column
      const { line, column } = this.findPosition(lines, startPos);

      links.push({
        original,
        alt,
        src,
        line,
        column,
        isWikilink: false,
        isReference: false,
      });

      linesWithImages.add(line);
    }
  }

  private extractReferenceImages(
    content: string,
    lines: string[],
    links: ImageLink[],
    linesWithImages: Set<number>
  ): void {
    let match;
    this.referenceImageRegex.lastIndex = 0;

    while ((match = this.referenceImageRegex.exec(content)) !== null) {
      const original = match[0];
      const alt = match[1];
      const referenceLabel = match[2];
      const startPos = match.index;

      // Find line and column
      const { line, column } = this.findPosition(lines, startPos);

      links.push({
        original,
        alt,
        src: "", // Will be resolved from reference definitions
        line,
        column,
        isWikilink: false,
        isReference: true,
        referenceLabel,
      });

      linesWithImages.add(line);
    }
  }

  private findPosition(
    lines: string[],
    charIndex: number
  ): { line: number; column: number } {
    let currentIndex = 0;
    let line = 0;
    let column = 0;

    for (let i = 0; i < lines.length && currentIndex <= charIndex; i++) {
      line = i;
      const lineLength = lines[i].length;

      if (currentIndex + lineLength >= charIndex) {
        column = charIndex - currentIndex;
        break;
      }

      currentIndex += lineLength + 1; // +1 for newline character
    }

    return { line: line + 1, column }; // Convert to 1-based line numbers
  }

  private calculateStats(
    links: ImageLink[]
  ): ImageLinkExtractionResult["stats"] {
    const uniquePaths = new Set(
      links.map((link) => link.src).filter((src) => src)
    ).size;

    return {
      totalLinks: links.length,
      wikilinks: links.filter((link) => link.isWikilink).length,
      markdownLinks: links.filter(
        (link) => !link.isWikilink && !link.isReference
      ).length,
      referenceLinks: links.filter((link) => link.isReference).length,
      uniquePaths,
    };
  }

  /**
   * Validate that a path could potentially be an image
   */
  isImagePath(path: string): boolean {
    if (!path) return false;

    const imageExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".bmp",
      ".tiff",
      ".webp",
      ".svg",
    ];
    const lowerPath = path.toLowerCase();

    return imageExtensions.some((ext) => lowerPath.endsWith(ext));
  }

  /**
   * Filter image links to only include valid image paths
   */
  filterValidImageLinks(links: ImageLink[]): ImageLink[] {
    return links.filter((link) => this.isImagePath(link.src));
  }

  /**
   * Group images by source path for deduplication
   */
  groupBySource(links: ImageLink[]): Map<string, ImageLink[]> {
    const grouped = new Map<string, ImageLink[]>();

    links.forEach((link) => {
      const src = link.src;
      if (!grouped.has(src)) {
        grouped.set(src, []);
      }
      grouped.get(src)!.push(link);
    });

    return grouped;
  }
}
