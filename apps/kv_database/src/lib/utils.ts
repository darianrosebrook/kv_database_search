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
  return createHash("sha256", normalized);
}

/**
 * Create a hash using specified algorithm and input
 */
export function createHash(algorithm: string, input: string | Buffer): string {
  return crypto.createHash(algorithm).update(input).digest("hex");
}

/**
 * Generate a deterministic ID from multiple components
 */
export function generateDeterministicId(
  ...components: (string | number)[]
): string {
  const combined = components.join("_");
  return createHash("md5", combined).slice(0, 8);
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
 * Determine content type based on file extension
 */
export function determineContentType(filePath: string): string {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "md":
      return "markdown";
    case "txt":
      return "text";
    case "json":
      return "json";
    case "pdf":
      return "pdf";
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
      return "image";
    default:
      return "unknown";
  }
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
  return Array.from(new Set(wikilinks)); // Remove duplicates
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
 * Extract Obsidian-style tags from text (including nested paths)
 */
export function extractObsidianTags(text: string): string[] {
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
 * Detect language from text using simple heuristics
 */
export function detectLanguage(text: string): string {
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

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentTypeFromFrontmatter(
  filePath: string,
  vaultPath: string,
  frontmatter: Record<string, any>
): string {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");

  if (relativePath.includes("mocs") || relativePath.includes("maps"))
    return "moc";
  if (relativePath.includes("articles") || relativePath.includes("posts"))
    return "article";
  if (relativePath.includes("chats") || relativePath.includes("conversations"))
    return "conversation";
  if (relativePath.includes("books") || relativePath.includes("reading"))
    return "book";
  if (relativePath.includes("templates")) return "template";

  // Check frontmatter type
  if (frontmatter.type) {
    return frontmatter.type;
  }

  return "note";
}
