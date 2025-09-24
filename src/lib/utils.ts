import crypto from "node:crypto";

/**
 * Normalize text for consistent embedding and caching
 * Following the best practices from the instructions
 */
export function normalize(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    .trim();
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  const normalized = normalize(text);
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, x) => sum + x * x, 0));
  if (norm === 0) return vector; // Avoid division by zero for zero vectors
  return vector.map((x) => x / norm);
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) return 0;

  return dotProduct / (normA * normB);
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.split(/\s+/).length / 0.75);
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  const wikilinkRegex = /\[\[([^\]]+)\]\]/g;
  const wikilinks: string[] = [];
  let match;
  while ((match = wikilinkRegex.exec(text)) !== null) {
    wikilinks.push(match[1]);
  }
  return [...new Set(wikilinks)]; // Remove duplicates
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }
  return [...new Set(tags)]; // Remove duplicates
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  return (
    text
      // Remove frontmatter
      .replace(/^---[\s\S]*?---\n?/, "")
      // Remove wikilinks but keep the text
      .replace(/\[\[([^\]]+)\]\]/g, "$1")
      // Remove markdown links but keep the text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove markdown formatting
      .replace(/[*_`~]/g, "")
      // Remove headers
      .replace(/^#+\s+/gm, "")
      // Clean up extra whitespace
      .replace(/\n\s*\n/g, "\n\n")
      .trim()
  );
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(
  filePath: string,
  vaultPath: string
): string[] {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");
  const pathParts = relativePath.split("/");
  pathParts.pop(); // Remove filename
  return pathParts.length > 0 ? pathParts : ["Root"];
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentType(
  filePath: string,
  vaultPath: string,
  frontmatter: Record<string, any>
): string {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");

  if (relativePath.startsWith("MOCs/")) return "moc";
  if (relativePath.startsWith("Articles/")) return "article";
  if (relativePath.startsWith("AIChats/")) return "conversation";
  if (relativePath.startsWith("Books/")) return "book-note";
  if (relativePath.startsWith("templates/")) return "template";

  // Check frontmatter type
  if (frontmatter.type) {
    return frontmatter.type;
  }

  return "note";
}
