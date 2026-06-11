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

  // Common words that appear capitalized in titles/headings but are not
  // person names. Used to reduce false positives in person entity
  // extraction. The blocklist conflates two ideas — closed-class English
  // words (the, this, with) and domain-generic vocabulary that frequently
  // appears in slide titles (training, prediction, embedding, etc.). Both
  // produce false-positive Title Case bigrams.
  private static readonly NON_PERSON_WORDS = new Set([
    // closed-class English
    "about", "after", "again", "all", "also", "always", "another", "any",
    "back", "been", "before", "being", "best", "better", "between", "both",
    "called", "change", "could", "crisis", "current", "data", "deep",
    "early", "easy", "error", "every", "example", "final", "first", "from",
    "full", "future", "general", "getting", "global", "going", "good",
    "great", "growing", "have", "here", "high", "history", "human",
    "important", "infinite", "into", "just", "large", "last", "late",
    "level", "life", "long", "made", "main", "major", "making", "many",
    "more", "most", "much", "must", "need", "never", "next", "only",
    "open", "original", "other", "over", "part", "parts", "past", "point",
    "problem", "process", "project", "quick", "real", "repeats", "right",
    "same", "second", "should", "show", "simple", "since", "small", "some",
    "source", "start", "still", "story", "summary", "superhuman", "take",
    "term", "text", "that", "their", "then", "there", "these", "think",
    "thinking", "third", "this", "those", "three", "through", "time",
    "today", "total", "under", "using", "very", "want", "well", "were",
    "what", "when", "where", "which", "while", "why", "will", "with",
    "work", "would", "your",
    // domain-generic vocabulary that frequently heads slide titles. These
    // appear as the first or second word of phrases like "Training JEPA",
    // "Joint Embedding Architectures", "Hierarchical Planning",
    // "Collapse Prevention", "Action Conditioned" — none of which are
    // people. Removing any candidate that contains one of these words is
    // safe because actual surnames in these positions are exceedingly
    // rare. Extend cautiously.
    "action", "architectures", "based", "building", "built", "code",
    "collapse", "computer", "conditioned", "content", "contrastive",
    "design", "development", "digital", "driven", "embedding", "energy",
    "engineering", "frame", "framework", "generative", "gaussian",
    "gaussianization", "gradient", "hierarchical", "image", "isotropic",
    "joint", "learning", "machine", "method", "methods", "model", "models",
    "ocr", "pattern", "planning", "prediction", "predictive", "prevention",
    "regularized", "robot", "robots", "seminar", "sketched", "software",
    "system", "training", "video", "vision", "world",
  ]);

  extractEntities(
    text: string,
    options?: {
      /**
       * Require each candidate to appear at least this many times in the
       * source text. Single-mention Title Case bigrams from messy sources
       * (especially OCR'd slide text) are almost always false positives;
       * raising this to 2 or 3 dramatically cuts noise. Defaults to 1
       * (existing behavior).
       */
       minMentions?: number;
      /**
       * When true, deduplicate by canonical (lowercase) form, keeping the
       * highest-confidence occurrence and reporting the position of its
       * first mention. Defaults to false (existing behavior preserves
       * every mention separately).
       */
      dedupe?: boolean;
    }
  ): ExtractedEntity[] {
    const minMentions = options?.minMentions ?? 1;
    const dedupe = options?.dedupe ?? false;

    const raw: ExtractedEntity[] = [];

    const patterns: Array<{
      regex: RegExp;
      type: EntityType;
      confidence: number;
      validate?: (match: string) => boolean;
    }> = [
      {
        // Allow internal capitals to admit names like "LeCun", "McKenzie",
        // "O'Brien", "MacDonald", "DiCaprio" — first letter must be
        // uppercase, remainder is letters (any case). Apostrophes inside
        // words (e.g. "O'Brien") are not currently supported by the
        // bigram regex.
        regex: /\b[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+\b/g,
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
          raw.push({
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

    if (minMentions <= 1 && !dedupe) {
      return raw;
    }

    // Count mentions per (type, canonical) pair.
    const counts = new Map<string, number>();
    for (const e of raw) {
      const key = `${e.type}|${e.text.toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    const filtered = raw.filter((e) => {
      const key = `${e.type}|${e.text.toLowerCase()}`;
      return (counts.get(key) ?? 0) >= minMentions;
    });

    if (!dedupe) return filtered;

    // Dedupe: one entry per (type, canonical), keep highest-confidence
    // occurrence and earliest position.
    const seen = new Map<string, ExtractedEntity>();
    for (const e of filtered) {
      const key = `${e.type}|${e.text.toLowerCase()}`;
      const existing = seen.get(key);
      if (!existing) {
        seen.set(key, e);
      } else if (e.confidence > existing.confidence) {
        seen.set(key, { ...e, position: existing.position });
      }
    }
    return [...seen.values()];
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
