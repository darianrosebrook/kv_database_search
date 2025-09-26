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
  dictionaryEnhanced?: boolean;
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
 * Enhanced entity extraction with NLP-based approaches
 */
export class EnhancedEntityExtractor {
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
    "can",
    "shall",
    "ought",
    "about",
    "above",
    "across",
    "after",
    "against",
    "along",
    "among",
    "around",
    "as",
    "before",
    "behind",
    "below",
    "beneath",
    "beside",
    "between",
    "beyond",
    "down",
    "during",
    "except",
    "from",
    "inside",
    "into",
    "like",
    "near",
    "of",
    "off",
    "on",
    "onto",
    "out",
    "outside",
    "over",
    "past",
    "since",
    "through",
    "throughout",
    "till",
    "to",
    "toward",
    "towards",
    "under",
    "underneath",
    "until",
    "up",
    "upon",
    "with",
    "within",
    "without",
  ]);

  /**
   * Extract named entities using pattern-based approach
   */
  extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Person names (Capitalized words in sequence)
    const personRegex = /\b([A-Z][a-z]+ [A-Z][a-z]+)\b/g;
    let match;
    while ((match = personRegex.exec(text)) !== null) {
      entities.push({
        text: match[1],
        type: "person",
        confidence: 0.7,
        position: { start: match.index, end: match.index + match[1].length },
        label: match[1], // Use text as label for person entities
      });
    }

    // Organization patterns (Company, Inc., Corp., Ltd., etc.)
    const orgRegex =
      /\b([A-Z][A-Za-z\s&.,]+(?:Inc|Corp|LLC|LLP|Ltd|Company|Corporation|Association|Foundation|Institute|University|College|School|Hospital|Clinic|Bank))\b/g;
    while ((match = orgRegex.exec(text)) !== null) {
      entities.push({
        text: match[1],
        type: "organization",
        confidence: 0.8,
        position: { start: match.index, end: match.index + match[1].length },
        label: match[1], // Use text as label for organization entities
      });
    }

    // Technical terms and concepts (CamelCase, acronyms, etc.)
    const conceptRegex = /\b([A-Z][a-z]+[A-Z][a-zA-Z]*|[A-Z]{2,})\b/g;
    while ((match = conceptRegex.exec(text)) !== null) {
      const term = match[1];
      if (!this.stopWords.has(term.toLowerCase()) && term.length > 2) {
        entities.push({
          text: term,
          type: "concept",
          confidence: 0.6,
          position: { start: match.index, end: match.index + term.length },
          label: term, // Use text as label for concept entities
        });
      }
    }

    // Key terms (frequent meaningful words)
    const keyTerms = this.extractKeyTerms(text);
    for (const term of keyTerms) {
      entities.push({
        text: term,
        type: "term",
        confidence: 0.5,
        position: {
          start: text.indexOf(term),
          end: text.indexOf(term) + term.length,
        },
        label: term, // Use text as label for term entities
      });
    }

    return entities;
  }

  /**
   * Extract relationships between entities
   */
  extractRelationships(
    text: string,
    entities: ExtractedEntity[]
  ): EntityRelationship[] {
    const relationships: EntityRelationship[] = [];

    // Simple relationship patterns
    const patterns = [
      {
        regex:
          /([A-Z][a-z]+) works at ([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company))/gi,
        predicate: "works_at",
      },
      {
        regex:
          /([A-Z][a-z]+) is ([a-z\s]+) of ([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company))/gi,
        predicate: "is_role_of",
      },
      {
        regex:
          /([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company)) (?:is located in|headquartered in) ([A-Z][a-z\s]+)/gi,
        predicate: "located_in",
      },
      {
        regex:
          /([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company)) develops ([A-Z][a-zA-Z\s]+)/gi,
        predicate: "develops",
      },
      {
        regex:
          /([A-Z][a-zA-Z\s&.,]+(?:Inc|Corp|LLC|Company)) provides ([A-Z][a-zA-Z\s]+)/gi,
        predicate: "provides",
      },
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        relationships.push({
          subject: match[1],
          predicate: pattern.predicate,
          object: match[2],
          confidence: 0.7,
        });
      }
    }

    return relationships;
  }

  /**
   * Cluster entities based on relationships and context
   */
  clusterEntities(
    entities: ExtractedEntity[],
    relationships: EntityRelationship[]
  ): EntityCluster[] {
    const clusters = new Map<string, EntityCluster>();

    // Group by entity type first
    const typeGroups = new Map<string, ExtractedEntity[]>();
    for (const entity of entities) {
      if (!typeGroups.has(entity.type)) {
        typeGroups.set(entity.type, []);
      }
      typeGroups.get(entity.type)!.push(entity);
    }

    // Create clusters for each type
    for (const [type, typeEntities] of Array.from(typeGroups.entries())) {
      const clusterId = `cluster_${type}`;
      const clusterName = `${type.charAt(0).toUpperCase() + type.slice(1)}s`;

      clusters.set(clusterId, {
        id: clusterId,
        name: clusterName,
        entities: typeEntities,
        centrality: typeEntities.length / entities.length,
        relationships: relationships.filter((r) =>
          typeEntities.some((e) => e.text === r.subject || e.text === r.object)
        ),
      });
    }

    return Array.from(clusters.values());
  }

  /**
   * Extract key terms using frequency analysis
   */
  private extractKeyTerms(text: string): string[] {
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3 && !this.stopWords.has(word));

    const frequency = new Map<string, number>();
    for (const word of words) {
      frequency.set(word, (frequency.get(word) || 0) + 1);
    }

    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
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
  frontmatter: Record<string, any>
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
