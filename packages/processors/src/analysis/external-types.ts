/**
 * Stub interfaces for collaborators that this package does not directly depend on.
 *
 * EntityExtractor and its related types (ExtractionContext, ExtractionResult)
 * are now imported from @kv/entities (Phase 6a).
 *
 * DictionaryService still lives in @kv/database — entity-analyzer.ts only
 * touches two methods, so its shape stays here as a structural stub. When
 * dictionary handling moves into a dedicated package, swap this for a real
 * import the same way.
 */

// DictionaryService stub — class shape with the two methods entity-analyzer.ts calls.
export class DictionaryService {
  async canonicalizeEntities(
    _request: { entities: Array<{ name: string; type: unknown; context?: string; aliases?: string[] }> }
  ): Promise<Array<{
    confidence: number;
    canonicalName: string;
    source: string;
    reasoning: string;
  }>> {
    throw new Error("DictionaryService stub — implementation lives in @kv/database");
  }
  async expandSearchTerms(
    _request: { queryTerms: string[]; expansionTypes?: string[]; maxExpansionsPerTerm?: number }
  ): Promise<Array<{
    expandedTerms: Array<{ term: string; expansionType: string }>;
  }>> {
    throw new Error("DictionaryService stub — implementation lives in @kv/database");
  }
}
