/**
 * Core Obsidian Data Structures
 * Fundamental interfaces and types for Obsidian document processing
 */

/**
 * Represents a complete Obsidian document with all metadata
 */
export interface ObsidianDocument {
  /** Unique identifier (relative path from vault root) */
  id: string;

  /** File system path relative to vault root */
  path: string;

  /** Full file path (for backward compatibility) */
  filePath?: string;

  /** Relative path (alias for path for backward compatibility) */
  relativePath?: string;

  /** Filename without extension */
  name: string;

  /** Filename with extension */
  fileName?: string;

  /** File extension (.md, .canvas, etc.) */
  extension: string;

  /** Raw file content */
  content: string;

  /** Parsed frontmatter YAML */
  frontmatter: Record<string, any>;

  /** Document statistics */
  stats: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    headingCount: number;
    linkCount: number;
    tagCount: number;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };

  /** Obsidian-specific relationships */
  relationships: {
    /** Outgoing wikilinks */
    wikilinks: Wikilink[];
    /** Tags used in document */
    tags: string[];
    /** Referenced by these documents */
    backlinks: Backlink[];
  };

  /** Document sections (for chunking) */
  sections?: Array<{
    title: string;
    level: number;
    content: string;
    startLine: number;
    endLine: number;
    wikilinks: string[];
    tags: string[];
  }>;

  /** Processing metadata */
  metadata: {
    created: Date;
    modified: Date;
    checksum: string;
    lastIndexed?: Date;
    processingErrors?: string[];
  };
}

/**
 * Represents a wikilink in Obsidian format
 */
export interface Wikilink {
  /** Target document path */
  target: string;

  /** Display text (if different from target) */
  display?: string;

  /** Link type */
  type: "document" | "heading" | "block";

  /** Position in source document */
  position: {
    line: number;
    column: number;
    offset: number;
  };

  /** Context around the link */
  context: string;
}

/**
 * Represents a backlink reference
 */
export interface Backlink {
  /** Source document that references this document */
  source: string;

  /** Context of the reference */
  context: string;

  /** Position in source document */
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

/**
 * Processing context for embeddings
 */
export interface ObsidianEmbeddingContext {
  /** Document identifier */
  documentId: string;

  /** Section or heading being embedded */
  section: string;

  /** Hierarchical breadcrumbs */
  breadcrumbs: string[];

  /** Related concepts and tags */
  relatedConcepts: string[];

  /** Importance score (0-1) */
  importance: number;
}
