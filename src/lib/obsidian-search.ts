import { ObsidianDatabase } from "./database.js";
import { ObsidianEmbeddingService } from "./embeddings.js";
import {
  SearchResult,
  ObsidianSearchOptions,
  ObsidianSearchResult,
  ObsidianSearchResponse,
  ContentType,
} from "../types/index.js";

export class ObsidianSearchService {
  private db: ObsidianDatabase;
  private embeddings: ObsidianEmbeddingService;

  constructor(
    database: ObsidianDatabase,
    embeddingService: ObsidianEmbeddingService
  ) {
    this.db = database;
    this.embeddings = embeddingService;
  }

  async search(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    const {
      searchMode = "comprehensive",
      includeRelated = true,
      maxRelated = 3,
      limit = 20,
      minSimilarity = 0.0,
      multiModalTypes,
      minQuality,
      languages,
      hasText,
      fileSizeRange,
      ...filterOptions
    } = options;

    console.log(`🔍 Obsidian search: "${query}" (mode: ${searchMode})`);
    const startTime = Date.now();

    try {
      // Generate query embedding with strategy
      const embeddingResult = await this.embeddings.embedWithStrategy(
        query,
        undefined,
        "knowledge-base"
      );

      console.log(
        `🎯 Using model: ${embeddingResult.model.name} (confidence: ${(
          embeddingResult.confidence * 100
        ).toFixed(1)}%)`
      );

      // Perform vector search with Obsidian-specific filters
      const searchResults = await this.db.search(
        embeddingResult.embedding,
        limit * 2, // Get more results for post-processing
        {
          ...filterOptions,
          minSimilarity,
        }
      );

      // Apply multi-modal specific filters
      let filteredResults = searchResults;
      if (
        multiModalTypes ||
        minQuality ||
        languages ||
        hasText !== undefined ||
        fileSizeRange
      ) {
        filteredResults = this.applyMultiModalFilters(searchResults, {
          multiModalTypes,
          minQuality,
          languages,
          hasText,
          fileSizeRange,
        });
      }

      // Enhance results with Obsidian-specific data
      const enhancedResults = await this.enhanceResults(
        filteredResults.slice(0, limit),
        query,
        { includeRelated, maxRelated }
      );

      // Generate facets for filtering
      const facets = await this.generateFacets(enhancedResults);

      // Generate graph insights
      const graphInsights = await this.generateGraphInsights(
        query,
        enhancedResults
      );

      const latencyMs = Date.now() - startTime;

      console.log(
        `✅ Obsidian search completed: ${enhancedResults.length} results in ${latencyMs}ms`
      );

      return {
        query,
        results: enhancedResults,
        totalFound: searchResults.length,
        latencyMs,
        facets,
        graphInsights,
      };
    } catch (error) {
      console.error(`❌ Obsidian search failed: ${error}`);
      throw new Error(`Obsidian search failed: ${error}`);
    }
  }

  private async enhanceResults(
    results: SearchResult[],
    query: string,
    options: { includeRelated: boolean; maxRelated: number }
  ): Promise<ObsidianSearchResult[]> {
    const enhanced: ObsidianSearchResult[] = [];

    for (const result of results) {
      // Handle both Obsidian files and multi-modal files
      const obsidianMeta = result.meta.obsidianFile;
      const multiModalMeta = result.meta.multiModalFile;

      if (!obsidianMeta && !multiModalMeta) continue;

      // Generate highlights
      const highlights = this.generateHighlights(result.text, query);

      // Find related chunks if requested
      let relatedChunks: SearchResult[] = [];
      if (options.includeRelated && obsidianMeta?.wikilinks) {
        relatedChunks = await this.findRelatedChunks(
          obsidianMeta.wikilinks,
          options.maxRelated
        );
      }

      // Generate graph context
      const graphContext = await this.generateChunkGraphContext(result, query);

      // Generate multi-modal metadata for enhanced results
      const multiModalInfo = this.generateMultiModalInfo(multiModalMeta);

      enhanced.push({
        ...result,
        obsidianMeta: obsidianMeta
          ? {
              fileName: obsidianMeta.fileName,
              filePath: obsidianMeta.filePath,
              tags: obsidianMeta.tags || [],
              wikilinks: obsidianMeta.wikilinks || [],
              frontmatter: obsidianMeta.frontmatter || {},
              relatedFiles: obsidianMeta.wikilinks || [],
              backlinks: [], // TODO: Implement backlinks discovery
            }
          : undefined,
        multiModalMeta: multiModalInfo,
        highlights,
        relatedChunks,
        graphContext,
      });
    }

    return enhanced;
  }

  private generateHighlights(text: string, query: string): string[] {
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 2);
    const highlights: string[] = [];

    for (const term of queryTerms) {
      const regex = new RegExp(`(.{0,50}${term}.{0,50})`, "gi");
      const matches = text.match(regex);
      if (matches) {
        highlights.push(...matches.slice(0, 2)); // Limit to 2 highlights per term
      }
    }

    return [...new Set(highlights)].slice(0, 5); // Dedupe and limit total highlights
  }

  private generateMultiModalInfo(multiModalMeta?: any) {
    if (!multiModalMeta) return undefined;

    // Generate human-readable content type labels and metadata
    const contentTypeLabels: Record<string, string> = {
      [ContentType.PDF]: "PDF Document",
      [ContentType.OFFICE_DOC]: "Word Document",
      [ContentType.OFFICE_SHEET]: "Excel Spreadsheet",
      [ContentType.OFFICE_PRESENTATION]: "PowerPoint Presentation",
      [ContentType.AUDIO]: "Audio File",
      [ContentType.VIDEO]: "Video File",
      [ContentType.RASTER_IMAGE]: "Image",
      [ContentType.VECTOR_IMAGE]: "Vector Image",
    };

    return {
      fileId: multiModalMeta.fileId,
      contentType: multiModalMeta.contentType,
      contentTypeLabel:
        contentTypeLabels[multiModalMeta.contentType] ||
        multiModalMeta.contentType,
      mimeType: multiModalMeta.mimeType,
      checksum: multiModalMeta.checksum,
      quality: multiModalMeta.quality,
      processing: multiModalMeta.processing,
      // Add specific metadata based on content type
      ...(multiModalMeta.contentType === ContentType.AUDIO && {
        duration: multiModalMeta.duration,
        sampleRate: multiModalMeta.sampleRate,
        channels: multiModalMeta.channels,
        confidence: multiModalMeta.confidence,
        language: multiModalMeta.language,
      }),
      ...(multiModalMeta.contentType === ContentType.PDF && {
        pageCount: multiModalMeta.pageCount,
        hasText: multiModalMeta.hasText,
        wordCount: multiModalMeta.wordCount,
      }),
      ...(multiModalMeta.contentType?.startsWith("OFFICE_") && {
        wordCount: multiModalMeta.wordCount,
        hasText: multiModalMeta.hasText,
        language: multiModalMeta.language,
      }),
    };
  }

  private applyMultiModalFilters(
    results: SearchResult[],
    filters: {
      multiModalTypes?: string[];
      minQuality?: number;
      languages?: string[];
      hasText?: boolean;
      fileSizeRange?: { min?: number; max?: number };
    }
  ): SearchResult[] {
    return results.filter((result) => {
      const multiModalMeta = result.meta.multiModalFile;

      // If no multi-modal metadata and we have multi-modal filters, skip
      if (
        !multiModalMeta &&
        (filters.multiModalTypes ||
          filters.minQuality ||
          filters.languages ||
          filters.hasText !== undefined)
      ) {
        return true; // Keep Obsidian files if no multi-modal filters
      }

      if (!multiModalMeta) return true;

      // Filter by multi-modal content type
      if (filters.multiModalTypes && filters.multiModalTypes.length > 0) {
        const contentTypeLabel = this.getContentTypeLabel(
          multiModalMeta.contentType
        );
        if (
          !filters.multiModalTypes.some(
            (type) =>
              type.toLowerCase() === multiModalMeta.contentType.toLowerCase() ||
              type.toLowerCase() === contentTypeLabel.toLowerCase()
          )
        ) {
          return false;
        }
      }

      // Filter by quality score
      if (filters.minQuality !== undefined && multiModalMeta.quality) {
        const qualityScore = this.extractQualityScore(multiModalMeta.quality);
        if (qualityScore < filters.minQuality) {
          return false;
        }
      }

      // Filter by language
      if (filters.languages && filters.languages.length > 0) {
        const contentLanguage =
          multiModalMeta.language || this.detectLanguage(result.text);
        if (
          !filters.languages.some(
            (lang) => lang.toLowerCase() === contentLanguage.toLowerCase()
          )
        ) {
          return false;
        }
      }

      // Filter by text extraction availability
      if (filters.hasText !== undefined) {
        const hasExtractedText =
          result.text &&
          result.text.length > 10 &&
          !result.text.includes("No speech detected") &&
          !result.text.includes("Error:");
        if (filters.hasText && !hasExtractedText) {
          return false;
        }
        if (!filters.hasText && hasExtractedText) {
          return false;
        }
      }

      // Filter by file size
      if (filters.fileSizeRange) {
        // Note: File size information might not be available in metadata
        // This would need to be added to the ingestion process
        // For now, skip this filter
      }

      return true;
    });
  }

  private getContentTypeLabel(contentType: string): string {
    const labels: Record<string, string> = {
      [ContentType.PDF]: "PDF Document",
      [ContentType.OFFICE_DOC]: "Word Document",
      [ContentType.OFFICE_SHEET]: "Excel Spreadsheet",
      [ContentType.OFFICE_PRESENTATION]: "PowerPoint Presentation",
      [ContentType.AUDIO]: "Audio File",
      [ContentType.VIDEO]: "Video File",
      [ContentType.RASTER_IMAGE]: "Image",
      [ContentType.VECTOR_IMAGE]: "Vector Image",
    };
    return labels[contentType] || contentType;
  }

  private extractQualityScore(quality: any): number {
    if (typeof quality === "number") return quality;
    if (quality && typeof quality.score === "number") return quality.score;
    if (quality && typeof quality.confidence === "number")
      return quality.confidence;
    return 0.5; // Default neutral score
  }

  private detectLanguage(text: string): string {
    if (!text || text.length === 0) return "unknown";

    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishWords =
      /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
    const frenchWords =
      /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;

    const englishMatches = (text.match(englishWords) || []).length;
    const spanishMatches = (text.match(spanishWords) || []).length;
    const frenchMatches = (text.match(frenchWords) || []).length;

    const maxMatches = Math.max(englishMatches, spanishMatches, frenchMatches);

    if (maxMatches === 0) return "unknown";
    if (maxMatches === englishMatches) return "en";
    if (maxMatches === spanishMatches) return "es";
    if (maxMatches === frenchMatches) return "fr";

    return "unknown";
  }

  private async findRelatedChunks(
    wikilinks: string[],
    maxRelated: number
  ): Promise<SearchResult[]> {
    if (!wikilinks || wikilinks.length === 0) return [];

    try {
      // Search for chunks from files mentioned in wikilinks
      const relatedQuery = wikilinks.slice(0, 3).join(" "); // Use first 3 wikilinks
      const embedding = await this.embeddings.embed(relatedQuery);

      const results = await this.db.search(embedding, maxRelated * 2);

      // Filter to only include chunks from wikilinked files
      return results
        .filter((result) => {
          const fileName = result.meta.obsidianFile?.fileName;
          return (
            fileName &&
            wikilinks.some(
              (link) =>
                link.toLowerCase().includes(fileName.toLowerCase()) ||
                fileName.toLowerCase().includes(link.toLowerCase())
            )
          );
        })
        .slice(0, maxRelated);
    } catch (error) {
      console.warn("Failed to find related chunks:", error);
      return [];
    }
  }

  private async generateChunkGraphContext(
    result: SearchResult,
    query: string
  ): Promise<{
    connectedConcepts: string[];
    pathsToQuery: number;
    centralityScore: number;
  }> {
    // Extract concepts from tags and content
    const tags = result.meta.obsidianFile?.tags || [];
    const wikilinks = result.meta.obsidianFile?.wikilinks || [];

    // Simple concept extraction from query
    const queryTerms = query
      .toLowerCase()
      .split(/\s+/)
      .filter((term) => term.length > 3);

    // Find connected concepts (tags that relate to query terms)
    const connectedConcepts = tags.filter((tag) =>
      queryTerms.some(
        (term) =>
          tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())
      )
    );

    // Calculate centrality based on number of wikilinks and tags
    const centralityScore = Math.min(
      1.0,
      wikilinks.length * 0.1 + tags.length * 0.05
    );

    return {
      connectedConcepts: connectedConcepts.slice(0, 5),
      pathsToQuery: connectedConcepts.length,
      centralityScore,
    };
  }

  private async generateFacets(results: ObsidianSearchResult[]): Promise<{
    fileTypes: Array<{ type: string; count: number }>;
    tags: Array<{ tag: string; count: number }>;
    folders: Array<{ folder: string; count: number }>;
    dateDistribution: Array<{ period: string; count: number }>;
    contentTypes: Array<{ type: string; count: number }>;
    multiModalTypes: Array<{ type: string; count: number }>;
  }> {
    const fileTypeCounts = new Map<string, number>();
    const tagCounts = new Map<string, number>();
    const folderCounts = new Map<string, number>();
    const dateCounts = new Map<string, number>();
    const contentTypeCounts = new Map<string, number>();
    const multiModalTypeCounts = new Map<string, number>();

    for (const result of results) {
      // File type facets (legacy)
      const contentType = result.meta.contentType;
      fileTypeCounts.set(
        contentType,
        (fileTypeCounts.get(contentType) || 0) + 1
      );

      // Enhanced content type facets (including multi-modal)
      if (result.multiModalMeta) {
        const multiModalType =
          result.multiModalMeta.contentTypeLabel ||
          result.multiModalMeta.contentType;
        multiModalTypeCounts.set(
          multiModalType,
          (multiModalTypeCounts.get(multiModalType) || 0) + 1
        );
        contentTypeCounts.set(
          "Multi-modal",
          (contentTypeCounts.get("Multi-modal") || 0) + 1
        );
      } else {
        contentTypeCounts.set(
          "Obsidian",
          (contentTypeCounts.get("Obsidian") || 0) + 1
        );
      }

      // Tag facets (only for Obsidian files)
      if (result.obsidianMeta?.tags) {
        for (const tag of result.obsidianMeta.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        }
      }

      // Folder facets
      if (result.obsidianMeta?.filePath) {
        const folder = result.obsidianMeta.filePath.split("/")[0] || "Root";
        folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
      } else if (result.multiModalMeta) {
        // For multi-modal files, use a generic folder or extract from URI
        const uri = result.meta.uri;
        if (uri) {
          const pathParts = uri.split("/");
          const folder =
            pathParts.length > 1
              ? pathParts[pathParts.length - 2]
              : "Multi-modal";
          folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
        }
      }

      // Date distribution facets
      const date = result.meta.updatedAt || result.meta.createdAt;
      if (date) {
        const period = new Date(date).getFullYear().toString();
        dateCounts.set(period, (dateCounts.get(period) || 0) + 1);
      }
    }

    return {
      fileTypes: Array.from(fileTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      tags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15),
      folders: Array.from(folderCounts.entries())
        .map(([folder, count]) => ({ folder, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      dateDistribution: Array.from(dateCounts.entries())
        .map(([period, count]) => ({ period, count }))
        .sort((a, b) => b.period.localeCompare(a.period))
        .slice(0, 5),
      contentTypes: Array.from(contentTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count),
      multiModalTypes: Array.from(multiModalTypeCounts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
    };
  }

  private async generateGraphInsights(
    query: string,
    results: ObsidianSearchResult[]
  ): Promise<{
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: Array<{
      name: string;
      files: string[];
      centrality: number;
    }>;
  }> {
    // Extract concepts from query and results
    const queryConcepts = this.extractConcepts(query);
    const allTags = results.flatMap((r) => r.obsidianMeta?.tags || []);
    const relatedConcepts = [...new Set(allTags)]
      .filter((tag) => !queryConcepts.includes(tag))
      .slice(0, 10);

    // Group results by common tags to find knowledge clusters
    const tagGroups = new Map<string, string[]>();
    for (const result of results) {
      if (result.obsidianMeta?.tags) {
        for (const tag of result.obsidianMeta.tags) {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, []);
          }
          tagGroups.get(tag)!.push(result.obsidianMeta.fileName);
        }
      }
    }

    const knowledgeClusters = Array.from(tagGroups.entries())
      .filter(([_, files]) => files.length >= 2) // Only clusters with 2+ files
      .map(([tag, files]) => ({
        name: tag,
        files: [...new Set(files)], // Dedupe files
        centrality: files.length / results.length, // Simple centrality measure
      }))
      .sort((a, b) => b.centrality - a.centrality)
      .slice(0, 5);

    return {
      queryConcepts,
      relatedConcepts,
      knowledgeClusters,
    };
  }

  private extractConcepts(text: string): string[] {
    // Simple concept extraction - could be enhanced with NLP
    const words = text.toLowerCase().split(/\s+/);
    const concepts = words.filter(
      (word) =>
        word.length > 3 &&
        ![
          "this",
          "that",
          "with",
          "from",
          "they",
          "have",
          "been",
          "were",
        ].includes(word)
    );
    return [...new Set(concepts)].slice(0, 5);
  }

  // Specialized search methods for common Obsidian use cases
  async searchByTag(
    tag: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.search(`tag:${tag}`, {
      ...options,
      tags: [tag],
      searchMode: "hybrid",
    });
  }

  async searchMOCs(
    query?: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    const searchQuery = query ? `MOC ${query}` : "MOC map of content";
    return this.search(searchQuery, {
      ...options,
      fileTypes: ["moc"],
      folders: ["MOCs"],
      searchMode: "comprehensive",
    });
  }

  async searchConversations(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.search(query, {
      ...options,
      fileTypes: ["conversation"],
      folders: ["AIChats"],
      searchMode: "semantic",
    });
  }

  async findRelatedNotes(
    fileName: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    // Search for notes that reference this file or share similar content
    return this.search(fileName, {
      ...options,
      includeRelated: true,
      maxRelated: 10,
      searchMode: "graph",
    });
  }

  async exploreKnowledgeCluster(
    concept: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.search(concept, {
      ...options,
      searchMode: "comprehensive",
      includeRelated: true,
      limit: 20,
    });
  }

  // Multi-modal specialized search methods
  async searchMultiModal(
    query: string,
    contentTypes: ContentType[],
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.search(query, {
      ...options,
      contentTypes: contentTypes.map((type) => type.toString()),
      searchMode: "semantic",
    });
  }

  async searchPDFs(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.searchMultiModal(query, [ContentType.PDF], {
      ...options,
      searchMode: "semantic",
    });
  }

  async searchOfficeDocuments(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.searchMultiModal(
      query,
      [
        ContentType.OFFICE_DOC,
        ContentType.OFFICE_SHEET,
        ContentType.OFFICE_PRESENTATION,
      ],
      {
        ...options,
        searchMode: "semantic",
      }
    );
  }

  async searchAudioTranscripts(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.searchMultiModal(query, [ContentType.AUDIO], {
      ...options,
      searchMode: "semantic",
    });
  }

  async searchImages(
    query: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    return this.searchMultiModal(
      query,
      [ContentType.RASTER_IMAGE, ContentType.VECTOR_IMAGE],
      {
        ...options,
        searchMode: "semantic",
      }
    );
  }

  async searchByMultiModalType(
    contentType: ContentType,
    query?: string,
    options: ObsidianSearchOptions = {}
  ): Promise<ObsidianSearchResponse> {
    const searchQuery = query || `${contentType} content`;
    return this.search(searchQuery, {
      ...options,
      contentTypes: [contentType.toString()],
      searchMode: "semantic",
      limit: 50, // More results for browsing by type
    });
  }

  // Utility methods
  async getFileChunks(fileName: string): Promise<SearchResult[]> {
    const chunks = await this.db.getChunksByFile(fileName);
    return chunks.map((chunk, index) => ({
      id: chunk.id,
      text: chunk.text,
      meta: chunk.meta,
      cosineSimilarity: 1.0, // Perfect match since it's the same file
      rank: index + 1,
    }));
  }

  async getStats() {
    return this.db.getStats();
  }
}
