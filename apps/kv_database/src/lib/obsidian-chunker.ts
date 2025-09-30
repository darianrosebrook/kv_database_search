import {
  DocumentChunk,
  DocumentMetadata,
  ObsidianDocument,
} from "../types/index";
import { LoggerFactory } from "./shared/logger";
import {
  extractWikilinks,
  extractObsidianTags,
  cleanMarkdown,
  generateDeterministicId,
} from "./utils";

/**
 * Text chunking utilities for Obsidian documents
 * @darianrosebrook
 */
export class ObsidianChunker {
  private logger = LoggerFactory.create("ObsidianChunker");

  /**
   * Chunk text content with Obsidian-specific logic
   */
  async chunkDocument(
    obsidianFile: ObsidianDocument,
    options: {
      maxChunkSize?: number;
      chunkOverlap?: number;
      preserveStructure?: boolean;
      includeContext?: boolean;
      cleanContent?: boolean;
    } = {}
  ): Promise<DocumentChunk[]> {
    const {
      maxChunkSize = 1000,
      chunkOverlap = 100,
      _preserveStructure = true,
      _includeContext = true,
      cleanContent = true,
    } = options;

    const chunks: DocumentChunk[] = [];
    let currentChunk = "";
    let currentPosition = 0;

    // Clean content if requested
    let content = obsidianFile.content;
    if (cleanContent) {
      content = cleanMarkdown(content);
    }

    // Split by double newlines for structure preservation
    const sections = content
      .split(/\n\s*\n/)
      .filter((section) => section.trim());

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i];

      // If adding this section would exceed max size, flush current chunk
      if (currentChunk && currentChunk.length + section.length > maxChunkSize) {
        if (currentChunk.trim()) {
          chunks.push(
            this.createChunk(
              obsidianFile,
              currentChunk,
              currentPosition,
              options
            )
          );
          currentPosition += currentChunk.length;

          // Add overlap from previous chunk
          if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
            const overlapStart = Math.max(
              0,
              currentChunk.length - chunkOverlap
            );
            currentChunk = currentChunk.substring(overlapStart);
          } else {
            currentChunk = "";
          }
        }
      }

      // Add section to current chunk
      if (currentChunk) {
        currentChunk += "\n\n" + section;
      } else {
        currentChunk = section;
      }
    }

    // Add final chunk if we have content
    if (currentChunk.trim()) {
      chunks.push(
        this.createChunk(obsidianFile, currentChunk, currentPosition, options)
      );
    }

    this.logger.info(
      `Created ${chunks.length} chunks for file: ${obsidianFile.fileName}`
    );
    return chunks;
  }

  /**
   * Create a single document chunk with metadata
   */
  private createChunk(
    obsidianFile: ObsidianDocument,
    content: string,
    position: number,
    options: {
      maxChunkSize?: number;
      chunkOverlap?: number;
      preserveStructure?: boolean;
      includeContext?: boolean;
      cleanContent?: boolean;
    }
  ): DocumentChunk {
    const chunkIndex = Math.floor(position / (options.maxChunkSize || 1000));
    const chunkId = generateDeterministicId(
      `${obsidianFile.fileName}#chunk${chunkIndex}`
    );

    // Extract tags and wikilinks from this chunk
    const tags = extractObsidianTags(content);
    const wikilinks = extractWikilinks(content);

    // Create metadata
    const metadata: DocumentMetadata = {
      uri: `obsidian://${obsidianFile.fileName}`,
      section: `chunk-${chunkIndex}`,
      breadcrumbs: [obsidianFile.fileName, `chunk-${chunkIndex}`],
      contentType: obsidianFile.contentType,
      language: obsidianFile.language || "en",
      encoding: "utf-8",
      // Obsidian-specific metadata
      obsidianFile: {
        fileName: obsidianFile.fileName,
        filePath: obsidianFile.filePath,
        vaultPath: obsidianFile.vaultPath,
        tags: [...new Set([...(obsidianFile.tags || []), ...tags])],
        wikilinks,
        frontmatter: obsidianFile.frontmatter || {},
        chunkIndex,
        chunkPosition: position,
        chunkSize: content.length,
        totalChunks: 0, // Will be set later
      },
    };

    // Add context if requested
    if (options.includeContext) {
      metadata.context = this.generateContext(obsidianFile, chunkIndex);
    }

    return {
      id: chunkId,
      text: content,
      meta: metadata,
      embedding: undefined, // Will be set by embedding service
    };
  }

  /**
   * Generate context information for a chunk
   */
  private generateContext(
    obsidianFile: ObsidianDocument,
    chunkIndex: number
  ): string {
    const contextParts = [];

    // Add file-level context
    if (obsidianFile.frontmatter?.title) {
      contextParts.push(`Title: ${obsidianFile.frontmatter.title}`);
    }

    if (obsidianFile.tags?.length) {
      contextParts.push(`Tags: ${obsidianFile.tags.join(", ")}`);
    }

    // Add chunk position context
    contextParts.push(`Section: ${chunkIndex + 1} of document`);

    // Add surrounding context if available
    if (obsidianFile.frontmatter?.description) {
      contextParts.push(`Description: ${obsidianFile.frontmatter.description}`);
    }

    return contextParts.join(" | ");
  }

  /**
   * Merge chunks with embeddings
   */
  mergeChunksWithEmbeddings(
    chunks: DocumentChunk[],
    embeddings: number[][]
  ): DocumentChunk[] {
    if (chunks.length !== embeddings.length) {
      throw new Error(
        `Chunk count (${chunks.length}) doesn't match embedding count (${embeddings.length})`
      );
    }

    return chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));
  }
}
