/**
 * Structural stubs for external services that this package collaborates with
 * but does not depend on directly. Real implementations live in @kv/database.
 *
 * EntityExtractor was previously stubbed here but is now imported from
 * @kv/entities directly (Phase 6a).
 */

export interface DocumentEmbeddingServiceLike {
  embed(text: string): Promise<number[]>;
  embedBatch?(texts: string[], batchSize?: number): Promise<number[][]>;
  embedWithStrategy(
    text: string,
    contentType?: string,
    domainHint?: string
  ): Promise<{ embedding: number[]; [key: string]: unknown }>;
}
