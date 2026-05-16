/**
 * Basic entity extractor — regex-based, dependency-free.
 *
 * For higher-precision NER, see the @kv/entities package (planned Phase 6a).
 */

export type EntityType =
  | "person"
  | "organization"
  | "location"
  | "concept"
  | "term"
  | "other";

export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  position: { start: number; end: number };
  label: string;
  aliases?: string[];

  canonicalForm?: string;
  dictionaryDB?: boolean;
  dictionarySource?: string;
  dictionaryConfidence?: number;
  dictionaryReasoning?: string;
}

export interface LegacyExtractedEntity {
  text: string;
  type: EntityType;
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

export class EntityExtractor {
  private stopWords = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "this", "that", "these", "those", "i", "you",
    "he", "she", "it", "we", "they", "me", "him", "her", "us", "them",
    "my", "your", "his", "its", "our", "their", "is", "am", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might",
    "must", "shall", "can",
  ]);

  // Common words that appear capitalized in titles/headings but are not person names.
  // Used to reduce false positives in person entity extraction.
  private static readonly NON_PERSON_WORDS = new Set([
    "about", "after", "again", "all", "also", "always", "another", "any",
    "back", "been", "before", "being", "best", "better", "between", "both",
    "building", "built", "called", "change", "code", "complete", "computer",
    "content", "could", "crisis", "current", "data", "deep", "design",
    "development", "digital", "early", "easy", "engineering", "error",
    "every", "example", "final", "first", "framework", "from", "full",
    "future", "general", "getting", "global", "going", "good", "great",
    "growing", "have", "here", "high", "history", "human", "important",
    "infinite", "into", "just", "large", "last", "late", "learning", "life",
    "long", "machine", "made", "main", "major", "making", "many", "model",
    "more", "most", "much", "need", "never", "next", "only", "open",
    "original", "other", "over", "part", "parts", "past", "pattern",
    "point", "problem", "process", "project", "quick", "real", "repeats",
    "right", "same", "second", "should", "show", "simple", "since", "small",
    "software", "some", "source", "start", "still", "story", "summary",
    "system", "take", "text", "that", "their", "then", "there", "these",
    "think", "thinking", "third", "this", "those", "three", "through",
    "time", "today", "total", "under", "using", "very", "video", "want",
    "well", "were", "what", "when", "where", "which", "while", "will",
    "with", "work", "world", "would", "your",
  ]);

  extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    const patterns: Array<{
      regex: RegExp;
      type: EntityType;
      confidence: number;
      validate?: (match: string) => boolean;
    }> = [
      {
        regex: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g,
        type: "person",
        confidence: 0.6,
        validate: (match: string) => {
          const words = match.toLowerCase().split(" ");
          return !words.some((w) => EntityExtractor.NON_PERSON_WORDS.has(w));
        },
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

    patterns.forEach(({ regex, type, confidence, validate }) => {
      let match;
      while ((match = regex.exec(text)) !== null) {
        const entityText = match[0];
        if (
          !this.stopWords.has(entityText.toLowerCase()) &&
          (!validate || validate(entityText))
        ) {
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
          subject: match[1],
          predicate,
          object: match[2],
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
