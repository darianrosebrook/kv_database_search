/**
 * Back-compat re-exports.
 *
 * The neutral utilities have moved to @kv/utils. This file keeps the
 * Obsidian-specific link/tag helpers that depend on Obsidian-shaped types
 * still living in this app. Once markdown-chunker is freed of Obsidian
 * coupling (Phase 6+), this file can disappear and call sites can import
 * from @kv/utils directly.
 */

export {
  // hashing
  createHash,
  createContentHash,
  generateDeterministicId,
  // vectors
  normalizeVector,
  cosineSimilarity,
  // text
  normalize,
  estimateTokens,
  countWords,
  countCharacters,
  detectLanguage,
  determineContentType,
  determineContentTypeFromFrontmatter,
  generateBreadcrumbs,
  cleanMarkdown,
  // links
  extractLinks,
  extractHashtags,
  extractTags,
  // sleep
  sleep,
  // entity extractor
  EntityExtractor,
} from "@kv/utils";

export type {
  ExtractedEntity,
  LegacyExtractedEntity,
  EntityRelationship,
  EntityCluster,
  EntityType,
} from "@kv/utils";

import { extractLinks, extractTags } from "@kv/utils";

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
