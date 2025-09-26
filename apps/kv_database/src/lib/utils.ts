import * as crypto from "node:crypto";

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
 * Extract wikilinks from text (legacy Obsidian-specific function)
 * @deprecated Use extractLinks with appropriate configuration instead
 */
export function extractWikilinks(text: string): string[] {
  return extractLinks(text, [
    {
      pattern: /\[\[([^\]]+)\]\]/g,
      extractTarget: (match) => match[1].split("|")[0],
    },
  ]);
}

/**
 * Extract links from text using configurable patterns
 */
export function extractLinks(
  text: string,
  linkFormats: Array<{
    pattern: RegExp;
    extractTarget: (match: RegExpMatchArray) => string;
    extractDisplayText?: (match: RegExpMatchArray) => string | undefined;
  }>
): string[] {
  const links: string[] = [];

  for (const format of linkFormats) {
    const regex = new RegExp(format.pattern.source, format.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const target = format.extractTarget(match);
      if (target) {
        links.push(target);
      }
    }
  }

  return Array.from(new Set(links)); // Remove duplicates
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
  return Array.from(new Set(tags)); // Remove duplicates
}

/**
 * Extract Obsidian-style tags from text (legacy function)
 * @deprecated Use extractTags with appropriate configuration instead
 */
export function extractObsidianTags(text: string): string[] {
  return extractTags(text, [
    {
      pattern: /#([a-zA-Z0-9_/-]+)/g,
      extractTag: (match) => match[1],
    },
  ]);
}

/**
 * Extract tags from text using configurable patterns
 */
export function extractTags(
  text: string,
  tagFormats: Array<{
    pattern: RegExp;
    extractTag: (match: RegExpMatchArray) => string;
  }>
): string[] {
  const tags: string[] = [];

  for (const format of tagFormats) {
    const regex = new RegExp(format.pattern.source, format.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = format.extractTag(match);
      if (tag) {
        tags.push(tag);
      }
    }
  }

  return Array.from(new Set(tags)); // Remove duplicates
}

/**
 * Enhanced entity extraction types
 */
export interface ExtractedEntity {
  text: string;
  type: "person" | "organization" | "location" | "concept" | "term" | "other";
  confidence: number;
  position: { start: number; end: number };
  label: string;
  aliases?: string[];

  // Dictionary enhancement fields
  canonicalForm?: string;
  dictionaryDB?: boolean;
  dictionarySource?: string;
  dictionaryConfidence?: number;
  dictionaryReasoning?: string;
}

export interface LegacyExtractedEntity {
  text: string;
  type: "person" | "organization" | "location" | "concept" | "term" | "other";
  confidence: number;
  position: { start: number; end: number };
}

export interface EntityRelationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

export interface EntityCluster {
  id: string;
  name: string;
  entities: ExtractedEntity[];
  centrality: number;
  relationships: EntityRelationship[];
}

/**
 * Basic Entity Extractor for backward compatibility
 */
export class EntityExtractor {
  private stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "this",
    "that",
    "these",
    "those",
    "i",
    "you",
    "he",
    "she",
    "it",
    "we",
    "they",
    "me",
    "him",
    "her",
    "us",
    "them",
    "my",
    "your",
    "his",
    "its",
    "our",
    "their",
    "is",
    "am",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "could",
    "would",
    "should",
    "may",
    "might",
    "must",
    "shall",
  ]);

  extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Simple regex-based extraction for basic entities
    const patterns = [
      {
        regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        type: "person",
        confidence: 0.8,
      },
      {
        regex: /\b[A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company|Ltd)\b/g,
        type: "organization",
        confidence: 0.7,
      },
      {
        regex: /\b[A-Z][a-z]+(?:burg|ton|ville|city|town)\b/g,
        type: "location",
        confidence: 0.6,
      },
    ];

    patterns.forEach(({ regex, type, confidence }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const entityText = match[0];
        if (!this.stopWords.has(entityText.toLowerCase())) {
          entities.push({
            text: entityText,
            type,
            confidence,
            position: {
              start: match.index,
              end: match.index + entityText.length,
            },
            label: entityText,
          });
        }
      }
    });

    return entities;
  }

  extractRelationships(
    text: string,
    _entities: ExtractedEntity[]
  ): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];

    // Simple relationship patterns
    const patterns = [
      {
        regex:
          /([A-Z][a-z]+ [A-Z][a-z]+) works at ([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company))/gi,
        predicate: "works_at",
        confidence: 0.7,
      },
      {
        regex:
          /([A-Z][a-z]+) lives in ([A-Z][a-z]+(?:burg|ton|ville|city|town))/gi,
        predicate: "lives_in",
        confidence: 0.6,
      },
    ];

    patterns.forEach(({ regex, predicate, confidence }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        relationships.push({
          sourceEntity: match[1],
          targetEntity: match[2],
          type: predicate,
          confidence,
        });
      }
    });

    return relationships;
  }

  clusterEntities(
    entities: ExtractedEntity[],
    _relationships: EntityRelationship[]
  ): Record<string, ExtractedEntity[]> {
    const clusters: Record<string, ExtractedEntity[]> = {};

    // Group entities by type
    entities.forEach((entity) => {
      const type = entity.type;
      if (!clusters[type]) {
        clusters[type] = [];
      }
      clusters[type].push(entity);
    });

    return clusters;
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  return (
    text
      // Remove frontmatter
      .replace(/^---[\s\S]*?---\n?/, "")
      // Remove wikilinks but keep the display text or target
      .replace(/\[\[([^\]]+)\]\]/g, (match, content) => {
        // If there's a |, use the display text, otherwise use the target
        return content.includes("|") ? content.split("|")[1] : content;
      })
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
  frontmatter: Record<string, unknown>
): string {
  const relativePath = filePath.replace(vaultPath, "").replace(/^\/+/, "");

  const lowerPath = relativePath.toLowerCase();
  if (lowerPath.includes("mocs") || lowerPath.includes("maps")) return "moc";
  if (lowerPath.includes("articles") || lowerPath.includes("posts"))
    return "article";
  if (
    lowerPath.includes("chats") ||
    lowerPath.includes("conversations") ||
    lowerPath.includes("aichats")
  )
    return "conversation";
  if (lowerPath.includes("books") || lowerPath.includes("reading"))
    return "book-note";
  if (lowerPath.includes("templates")) return "template";

  // Check frontmatter type
  if (frontmatter.type) {
    return frontmatter.type;
  }

  return "note";
}

/**
 * Count words in text
 */
export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Count characters in text
 */
export function countCharacters(text: string): number {
  return text.length;
}
