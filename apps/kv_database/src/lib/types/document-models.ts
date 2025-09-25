/**
 * Generic Document Processing Models
 * Universal interfaces for document processing across different knowledge management systems
 */

/**
 * Represents a link in a document
 */
export interface DocumentLink {
  /** Target document/resource path */
  target: string;
  /** Display text (if different from target) */
  displayText?: string;
  /** Link type (for different link formats) */
  type?: string;
}

/**
 * Represents a backlink relationship
 */
export interface DocumentBacklink {
  /** Source document that links to this document */
  source: string;
  /** Context around the link */
  context?: string;
  /** Link display text */
  displayText?: string;
}

/**
 * Document relationship information
 */
export interface DocumentRelationships {
  /** Outgoing links from this document */
  links: DocumentLink[];
  /** Tags used in this document */
  tags: string[];
  /** Documents that link to this document */
  backlinks: DocumentBacklink[];
}

/**
 * Document statistics
 */
export interface DocumentStats {
  wordCount: number;
  characterCount: number;
  lineCount: number;
  headingCount?: number;
  linkCount?: number;
  tagCount?: number;
  size?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Document processing metadata
 */
export interface DocumentProcessingMetadata {
  created: Date;
  modified: Date;
  checksum: string;
  lastIndexed?: Date;
  processingErrors?: string[];
  contentType?: string;
  sourceSystem?: string;
}

/**
 * Document section (for structured chunking)
 */
export interface DocumentSection {
  title: string;
  level: number;
  content: string;
  startLine: number;
  endLine: number;
  links: string[];
  tags: string[];
}

/**
 * Generic document representation
 */
export interface Document {
  /** Unique identifier (relative path from root) */
  id: string;

  /** File system path relative to root */
  path: string;

  /** Full file path (for backward compatibility) */
  filePath?: string;

  /** Relative path (alias for path for backward compatibility) */
  relativePath?: string;

  /** Filename without extension */
  name: string;

  /** Filename with extension */
  fileName?: string;

  /** File extension (.md, .txt, etc.) */
  extension: string;

  /** Raw file content */
  content: string;

  /** Parsed frontmatter */
  frontmatter: Record<string, any>;

  /** Document statistics */
  stats: DocumentStats;

  /** Document relationships */
  relationships: DocumentRelationships;

  /** Document sections (for chunking) */
  sections?: DocumentSection[];

  /** Processing metadata */
  metadata: DocumentProcessingMetadata;
}

/**
 * Chunking options for document processing
 */
export interface ChunkingOptions {
  maxChunkSize?: number;
  chunkOverlap?: number;
  preserveStructure?: boolean;
  includeContext?: boolean;
  cleanContent?: boolean;
}

/**
 * Document file representation (simplified for processing)
 */
export interface DocumentFile {
  fileName: string;
  filePath: string;
  content: string;
  frontmatter: Record<string, any>;
  stats: DocumentStats;
}

// Backward compatibility - alias the old interfaces to the new ones
export interface ObsidianDocument extends Document {}
export interface ObsidianFile extends DocumentFile {}
export interface Wikilink extends DocumentLink {}
export interface Backlink extends DocumentBacklink {}
export interface ObsidianChunkingOptions extends ChunkingOptions {}
