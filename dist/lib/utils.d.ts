/**
 * Normalize text for consistent embedding and caching
 * Following the best practices from the instructions
 */
export declare function normalize(text: string): string;
/**
 * Create a stable content hash for deterministic IDs
 */
export declare function createContentHash(text: string): string;
/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export declare function normalizeVector(vector: number[]): number[];
/**
 * Calculate cosine similarity between two normalized vectors
 */
export declare function cosineSimilarity(vecA: number[], vecB: number[]): number;
/**
 * Estimate token count (crude approximation: words/0.75)
 */
export declare function estimateTokens(text: string): number;
/**
 * Sleep utility for rate limiting
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Extract Obsidian wikilinks from text
 */
export declare function extractWikilinks(text: string): string[];
/**
 * Extract hashtags from text
 */
export declare function extractHashtags(text: string): string[];
/**
 * Clean markdown content for better embedding
 */
export declare function cleanMarkdown(text: string): string;
/**
 * Generate breadcrumbs from file path
 */
export declare function generateBreadcrumbs(filePath: string, vaultPath: string): string[];
/**
 * Determine content type from file path and frontmatter
 */
export declare function determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string;
