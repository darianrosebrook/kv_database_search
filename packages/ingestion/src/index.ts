/**
 * @kv/ingestion — tool-neutral document ingestion pipeline.
 *
 * Provides:
 * - DocumentIngestionPipeline: configurable pipeline that discovers, chunks,
 *   and embeds markdown documents. Storage and embedding are passed in via
 *   structural interfaces so the pipeline does not depend on @kv/database.
 * - DocumentProcessingConfig presets (OBSIDIAN_CONFIG, MARKDOWN_CONFIG,
 *   NOTION_CONFIG) for the common knowledge-management systems.
 * - Document model types for parsed files, chunks, and metadata.
 */

export {
  DocumentIngestionPipeline,
  ObsidianIngestionPipeline,
  type DocumentDatabaseLike,
  type DocumentEmbeddingServiceLike,
  type IngestionChunk,
  type IngestionChunkMetadata,
  type IngestionResult,
  type ValidationResult,
  type ObsidianChunkingOptions,
} from "./document-ingest";

export {
  type Document,
  type DocumentFile,
  type DocumentLink,
  type DocumentBacklink,
  type DocumentRelationships,
  type DocumentStats,
  type DocumentProcessingMetadata,
  type DocumentSection,
  type ChunkingOptions,
} from "./types/document-models";

export {
  type LinkFormat,
  type TagFormat,
  type ContentTypePattern,
  type DocumentProcessingConfig,
  OBSIDIAN_CONFIG,
  MARKDOWN_CONFIG,
  NOTION_CONFIG,
} from "./types/document-config";
