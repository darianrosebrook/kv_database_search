export class ObsidianSearchService {
    db;
    embeddings;
    constructor(database, embeddingService) {
        this.db = database;
        this.embeddings = embeddingService;
    }
    async search(query, options = {}) {
        const { searchMode = "comprehensive", includeRelated = true, maxRelated = 3, limit = 20, minSimilarity = 0.0, ...filterOptions } = options;
        console.log(`🔍 Obsidian search: "${query}" (mode: ${searchMode})`);
        const startTime = Date.now();
        try {
            // Generate query embedding with strategy
            const embeddingResult = await this.embeddings.embedWithStrategy(query, undefined, "knowledge-base");
            console.log(`🎯 Using model: ${embeddingResult.model.name} (confidence: ${(embeddingResult.confidence * 100).toFixed(1)}%)`);
            // Perform vector search with Obsidian-specific filters
            const searchResults = await this.db.search(embeddingResult.embedding, limit * 2, // Get more results for post-processing
            {
                ...filterOptions,
                minSimilarity,
            });
            // Enhance results with Obsidian-specific data
            const enhancedResults = await this.enhanceResults(searchResults.slice(0, limit), query, { includeRelated, maxRelated });
            // Generate facets for filtering
            const facets = await this.generateFacets(enhancedResults);
            // Generate graph insights
            const graphInsights = await this.generateGraphInsights(query, enhancedResults);
            const latencyMs = Date.now() - startTime;
            console.log(`✅ Obsidian search completed: ${enhancedResults.length} results in ${latencyMs}ms`);
            return {
                query,
                results: enhancedResults,
                totalFound: searchResults.length,
                latencyMs,
                facets,
                graphInsights,
            };
        }
        catch (error) {
            console.error(`❌ Obsidian search failed: ${error}`);
            throw new Error(`Obsidian search failed: ${error}`);
        }
    }
    async enhanceResults(results, query, options) {
        const enhanced = [];
        for (const result of results) {
            const obsidianMeta = result.meta.obsidianFile;
            if (!obsidianMeta)
                continue;
            // Generate highlights
            const highlights = this.generateHighlights(result.text, query);
            // Find related chunks if requested
            let relatedChunks = [];
            if (options.includeRelated && obsidianMeta.wikilinks) {
                relatedChunks = await this.findRelatedChunks(obsidianMeta.wikilinks, options.maxRelated);
            }
            // Generate graph context
            const graphContext = await this.generateChunkGraphContext(result, query);
            enhanced.push({
                ...result,
                obsidianMeta: {
                    fileName: obsidianMeta.fileName,
                    filePath: obsidianMeta.filePath,
                    tags: obsidianMeta.tags || [],
                    wikilinks: obsidianMeta.wikilinks || [],
                    frontmatter: obsidianMeta.frontmatter || {},
                    relatedFiles: obsidianMeta.wikilinks || [],
                    backlinks: [], // TODO: Implement backlinks discovery
                },
                highlights,
                relatedChunks,
                graphContext,
            });
        }
        return enhanced;
    }
    generateHighlights(text, query) {
        const queryTerms = query
            .toLowerCase()
            .split(/\s+/)
            .filter((term) => term.length > 2);
        const highlights = [];
        for (const term of queryTerms) {
            const regex = new RegExp(`(.{0,50}${term}.{0,50})`, "gi");
            const matches = text.match(regex);
            if (matches) {
                highlights.push(...matches.slice(0, 2)); // Limit to 2 highlights per term
            }
        }
        return [...new Set(highlights)].slice(0, 5); // Dedupe and limit total highlights
    }
    async findRelatedChunks(wikilinks, maxRelated) {
        if (!wikilinks || wikilinks.length === 0)
            return [];
        try {
            // Search for chunks from files mentioned in wikilinks
            const relatedQuery = wikilinks.slice(0, 3).join(" "); // Use first 3 wikilinks
            const embedding = await this.embeddings.embed(relatedQuery);
            const results = await this.db.search(embedding, maxRelated * 2);
            // Filter to only include chunks from wikilinked files
            return results
                .filter((result) => {
                const fileName = result.meta.obsidianFile?.fileName;
                return (fileName &&
                    wikilinks.some((link) => link.toLowerCase().includes(fileName.toLowerCase()) ||
                        fileName.toLowerCase().includes(link.toLowerCase())));
            })
                .slice(0, maxRelated);
        }
        catch (error) {
            console.warn("Failed to find related chunks:", error);
            return [];
        }
    }
    async generateChunkGraphContext(result, query) {
        // Extract concepts from tags and content
        const tags = result.meta.obsidianFile?.tags || [];
        const wikilinks = result.meta.obsidianFile?.wikilinks || [];
        // Simple concept extraction from query
        const queryTerms = query
            .toLowerCase()
            .split(/\s+/)
            .filter((term) => term.length > 3);
        // Find connected concepts (tags that relate to query terms)
        const connectedConcepts = tags.filter((tag) => queryTerms.some((term) => tag.toLowerCase().includes(term) || term.includes(tag.toLowerCase())));
        // Calculate centrality based on number of wikilinks and tags
        const centralityScore = Math.min(1.0, wikilinks.length * 0.1 + tags.length * 0.05);
        return {
            connectedConcepts: connectedConcepts.slice(0, 5),
            pathsToQuery: connectedConcepts.length,
            centralityScore,
        };
    }
    async generateFacets(results) {
        const fileTypeCounts = new Map();
        const tagCounts = new Map();
        const folderCounts = new Map();
        const dateCounts = new Map();
        for (const result of results) {
            // File type facets
            const contentType = result.meta.contentType;
            fileTypeCounts.set(contentType, (fileTypeCounts.get(contentType) || 0) + 1);
            // Tag facets
            if (result.obsidianMeta?.tags) {
                for (const tag of result.obsidianMeta.tags) {
                    tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
                }
            }
            // Folder facets
            if (result.obsidianMeta?.filePath) {
                const folder = result.obsidianMeta.filePath.split("/")[0] || "Root";
                folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1);
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
        };
    }
    async generateGraphInsights(query, results) {
        // Extract concepts from query and results
        const queryConcepts = this.extractConcepts(query);
        const allTags = results.flatMap((r) => r.obsidianMeta?.tags || []);
        const relatedConcepts = [...new Set(allTags)]
            .filter((tag) => !queryConcepts.includes(tag))
            .slice(0, 10);
        // Group results by common tags to find knowledge clusters
        const tagGroups = new Map();
        for (const result of results) {
            if (result.obsidianMeta?.tags) {
                for (const tag of result.obsidianMeta.tags) {
                    if (!tagGroups.has(tag)) {
                        tagGroups.set(tag, []);
                    }
                    tagGroups.get(tag).push(result.obsidianMeta.fileName);
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
    extractConcepts(text) {
        // Simple concept extraction - could be enhanced with NLP
        const words = text.toLowerCase().split(/\s+/);
        const concepts = words.filter((word) => word.length > 3 &&
            ![
                "this",
                "that",
                "with",
                "from",
                "they",
                "have",
                "been",
                "were",
            ].includes(word));
        return [...new Set(concepts)].slice(0, 5);
    }
    // Specialized search methods for common Obsidian use cases
    async searchByTag(tag, options = {}) {
        return this.search(`tag:${tag}`, {
            ...options,
            tags: [tag],
            searchMode: "hybrid",
        });
    }
    async searchMOCs(query, options = {}) {
        const searchQuery = query ? `MOC ${query}` : "MOC map of content";
        return this.search(searchQuery, {
            ...options,
            fileTypes: ["moc"],
            folders: ["MOCs"],
            searchMode: "comprehensive",
        });
    }
    async searchConversations(query, options = {}) {
        return this.search(query, {
            ...options,
            fileTypes: ["conversation"],
            folders: ["AIChats"],
            searchMode: "semantic",
        });
    }
    async findRelatedNotes(fileName, options = {}) {
        // Search for notes that reference this file or share similar content
        return this.search(fileName, {
            ...options,
            includeRelated: true,
            maxRelated: 10,
            searchMode: "graph",
        });
    }
    async exploreKnowledgeCluster(concept, options = {}) {
        return this.search(concept, {
            ...options,
            searchMode: "comprehensive",
            includeRelated: true,
            limit: 20,
        });
    }
    // Utility methods
    async getFileChunks(fileName) {
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
