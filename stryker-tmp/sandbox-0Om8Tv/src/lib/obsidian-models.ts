/**
 * Obsidian Data Contracts and API Specifications
 * Defines the data structures and contracts for Obsidian vault processing
 */
// @ts-nocheck


// =============================================================================
// CORE DATA STRUCTURES
// =============================================================================

/**
 * Represents a complete Obsidian document with all metadata
 */function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
export interface ObsidianDocument {
  /** Unique identifier (relative path from vault root) */
  id: string;

  /** File system path relative to vault root */
  path: string;

  /** Full file path (for backward compatibility) */
  filePath?: string;

  /** Relative path (alias for path for backward compatibility) */
  relativePath?: string;

  /** Filename without extension */
  name: string;

  /** Filename with extension */
  fileName?: string;

  /** File extension (.md, .canvas, etc.) */
  extension: string;

  /** Raw file content */
  content: string;

  /** Parsed frontmatter YAML */
  frontmatter: Record<string, any>;

  /** Document statistics */
  stats: {
    wordCount: number;
    characterCount: number;
    lineCount: number;
    headingCount: number;
    linkCount: number;
    tagCount: number;
    size?: number;
    createdAt?: Date;
    updatedAt?: Date;
  };

  /** Obsidian-specific relationships */
  relationships: {
    /** Outgoing wikilinks */
    wikilinks: Wikilink[];
    /** Tags used in document */
    tags: string[];
    /** Referenced by these documents */
    backlinks: Backlink[];
  };

  /** Document sections (for chunking) */
  sections?: Array<{
    title: string;
    level: number;
    content: string;
    startLine: number;
    endLine: number;
    wikilinks?: string[];
    tags?: string[];
  }>;

  /** Processing metadata */
  metadata: {
    created: Date;
    modified: Date;
    checksum: string;
    lastIndexed?: Date;
    processingErrors?: string[];
  };
}

/**
 * Utility functions for Obsidian document processing
 */
export class ObsidianUtils {
  static cleanMarkdown(content: string): string {
    if (stryMutAct_9fa48("377")) {
      {}
    } else {
      stryCov_9fa48("377");
      return stryMutAct_9fa48("378") ? content.replace(/^---[\s\S]*?---\n?/m, "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, display) => display || target).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/(\*\*|__)(.*?)\1/g, "$1").replace(/(\*|_)(.*?)\1/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/~~(.*?)~~/g, "$1").replace(/^#{1,6}\s+(.*)$/gm, "$1").replace(/\n{3,}/g, "\n\n") : (stryCov_9fa48("378"), content.replace(stryMutAct_9fa48("384") ? /^---[\s\S]*?---\n/m : stryMutAct_9fa48("383") ? /^---[\s\s]*?---\n?/m : stryMutAct_9fa48("382") ? /^---[\S\S]*?---\n?/m : stryMutAct_9fa48("381") ? /^---[^\s\S]*?---\n?/m : stryMutAct_9fa48("380") ? /^---[\s\S]---\n?/m : stryMutAct_9fa48("379") ? /---[\s\S]*?---\n?/m : (stryCov_9fa48("379", "380", "381", "382", "383", "384"), /^---[\s\S]*?---\n?/m), stryMutAct_9fa48("385") ? "Stryker was here!" : (stryCov_9fa48("385"), "")).replace(stryMutAct_9fa48("390") ? /\[\[([^\]|]+)(?:\|([\]]+))?\]\]/g : stryMutAct_9fa48("389") ? /\[\[([^\]|]+)(?:\|([^\]]))?\]\]/g : stryMutAct_9fa48("388") ? /\[\[([^\]|]+)(?:\|([^\]]+))\]\]/g : stryMutAct_9fa48("387") ? /\[\[([\]|]+)(?:\|([^\]]+))?\]\]/g : stryMutAct_9fa48("386") ? /\[\[([^\]|])(?:\|([^\]]+))?\]\]/g : (stryCov_9fa48("386", "387", "388", "389", "390"), /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g), stryMutAct_9fa48("391") ? () => undefined : (stryCov_9fa48("391"), (_, target, display) => stryMutAct_9fa48("394") ? display && target : stryMutAct_9fa48("393") ? false : stryMutAct_9fa48("392") ? true : (stryCov_9fa48("392", "393", "394"), display || target))).replace(stryMutAct_9fa48("398") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("397") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("396") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("395") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("395", "396", "397", "398"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("399") ? "" : (stryCov_9fa48("399"), "$1")).replace(stryMutAct_9fa48("400") ? /(\*\*|__)(.)\1/g : (stryCov_9fa48("400"), /(\*\*|__)(.*?)\1/g), stryMutAct_9fa48("401") ? "" : (stryCov_9fa48("401"), "$1")).replace(stryMutAct_9fa48("402") ? /(\*|_)(.)\1/g : (stryCov_9fa48("402"), /(\*|_)(.*?)\1/g), stryMutAct_9fa48("403") ? "" : (stryCov_9fa48("403"), "$1")).replace(stryMutAct_9fa48("405") ? /`([`]+)`/g : stryMutAct_9fa48("404") ? /`([^`])`/g : (stryCov_9fa48("404", "405"), /`([^`]+)`/g), stryMutAct_9fa48("406") ? "" : (stryCov_9fa48("406"), "$1")).replace(stryMutAct_9fa48("407") ? /~~(.)~~/g : (stryCov_9fa48("407"), /~~(.*?)~~/g), stryMutAct_9fa48("408") ? "" : (stryCov_9fa48("408"), "$1")).replace(stryMutAct_9fa48("414") ? /^#{1,6}\s+(.)$/gm : stryMutAct_9fa48("413") ? /^#{1,6}\S+(.*)$/gm : stryMutAct_9fa48("412") ? /^#{1,6}\s(.*)$/gm : stryMutAct_9fa48("411") ? /^#\s+(.*)$/gm : stryMutAct_9fa48("410") ? /^#{1,6}\s+(.*)/gm : stryMutAct_9fa48("409") ? /#{1,6}\s+(.*)$/gm : (stryCov_9fa48("409", "410", "411", "412", "413", "414"), /^#{1,6}\s+(.*)$/gm), stryMutAct_9fa48("415") ? "" : (stryCov_9fa48("415"), "$1")).replace(stryMutAct_9fa48("416") ? /\n/g : (stryCov_9fa48("416"), /\n{3,}/g), stryMutAct_9fa48("417") ? "" : (stryCov_9fa48("417"), "\n\n")).trim());
    }
  }
  static extractWikilinks(content: string): string[] {
    if (stryMutAct_9fa48("418")) {
      {}
    } else {
      stryCov_9fa48("418");
      const wikilinkRegex = stryMutAct_9fa48("423") ? /\[\[([^\]|]+)(?:\|([\]]+))?\]\]/g : stryMutAct_9fa48("422") ? /\[\[([^\]|]+)(?:\|([^\]]))?\]\]/g : stryMutAct_9fa48("421") ? /\[\[([^\]|]+)(?:\|([^\]]+))\]\]/g : stryMutAct_9fa48("420") ? /\[\[([\]|]+)(?:\|([^\]]+))?\]\]/g : stryMutAct_9fa48("419") ? /\[\[([^\]|])(?:\|([^\]]+))?\]\]/g : (stryCov_9fa48("419", "420", "421", "422", "423"), /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g);
      const links: string[] = stryMutAct_9fa48("424") ? ["Stryker was here"] : (stryCov_9fa48("424"), []);
      let match;
      while (stryMutAct_9fa48("426") ? (match = wikilinkRegex.exec(content)) === null : stryMutAct_9fa48("425") ? false : (stryCov_9fa48("425", "426"), (match = wikilinkRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("427")) {
          {}
        } else {
          stryCov_9fa48("427");
          links.push(stryMutAct_9fa48("430") ? match[2] && match[1] : stryMutAct_9fa48("429") ? false : stryMutAct_9fa48("428") ? true : (stryCov_9fa48("428", "429", "430"), match[2] || match[1]));
        }
      }
      return stryMutAct_9fa48("431") ? [] : (stryCov_9fa48("431"), [...new Set(links)]);
    }
  }
  static extractTags(content: string): string[] {
    if (stryMutAct_9fa48("432")) {
      {}
    } else {
      stryCov_9fa48("432");
      const tagRegex = stryMutAct_9fa48("434") ? /#([^a-zA-Z0-9_-]+)/g : stryMutAct_9fa48("433") ? /#([a-zA-Z0-9_-])/g : (stryCov_9fa48("433", "434"), /#([a-zA-Z0-9_-]+)/g);
      const tags: string[] = stryMutAct_9fa48("435") ? ["Stryker was here"] : (stryCov_9fa48("435"), []);
      let match;
      while (stryMutAct_9fa48("437") ? (match = tagRegex.exec(content)) === null : stryMutAct_9fa48("436") ? false : (stryCov_9fa48("436", "437"), (match = tagRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("438")) {
          {}
        } else {
          stryCov_9fa48("438");
          tags.push(match[1]);
        }
      }
      return stryMutAct_9fa48("439") ? [] : (stryCov_9fa48("439"), [...new Set(tags)]);
    }
  }
  static parseFrontmatter(content: string): Record<string, any> {
    if (stryMutAct_9fa48("440")) {
      {}
    } else {
      stryCov_9fa48("440");
      const frontmatterRegex = stryMutAct_9fa48("445") ? /^---\n([\s\s]*?)\n---/ : stryMutAct_9fa48("444") ? /^---\n([\S\S]*?)\n---/ : stryMutAct_9fa48("443") ? /^---\n([^\s\S]*?)\n---/ : stryMutAct_9fa48("442") ? /^---\n([\s\S])\n---/ : stryMutAct_9fa48("441") ? /---\n([\s\S]*?)\n---/ : (stryCov_9fa48("441", "442", "443", "444", "445"), /^---\n([\s\S]*?)\n---/);
      const match = content.match(frontmatterRegex);
      if (stryMutAct_9fa48("448") ? false : stryMutAct_9fa48("447") ? true : stryMutAct_9fa48("446") ? match : (stryCov_9fa48("446", "447", "448"), !match)) return {};
      try {
        if (stryMutAct_9fa48("449")) {
          {}
        } else {
          stryCov_9fa48("449");
          // Simple YAML-like parsing (for now)
          const frontmatter: Record<string, any> = {};
          const lines = match[1].split(stryMutAct_9fa48("450") ? "" : (stryCov_9fa48("450"), "\n"));
          for (const line of lines) {
            if (stryMutAct_9fa48("451")) {
              {}
            } else {
              stryCov_9fa48("451");
              const [key, ...valueParts] = line.split(stryMutAct_9fa48("452") ? "" : (stryCov_9fa48("452"), ":"));
              if (stryMutAct_9fa48("455") ? key || valueParts.length > 0 : stryMutAct_9fa48("454") ? false : stryMutAct_9fa48("453") ? true : (stryCov_9fa48("453", "454", "455"), key && (stryMutAct_9fa48("458") ? valueParts.length <= 0 : stryMutAct_9fa48("457") ? valueParts.length >= 0 : stryMutAct_9fa48("456") ? true : (stryCov_9fa48("456", "457", "458"), valueParts.length > 0)))) {
                if (stryMutAct_9fa48("459")) {
                  {}
                } else {
                  stryCov_9fa48("459");
                  const value = stryMutAct_9fa48("460") ? valueParts.join(":") : (stryCov_9fa48("460"), valueParts.join(stryMutAct_9fa48("461") ? "" : (stryCov_9fa48("461"), ":")).trim());
                  // Remove quotes if present
                  frontmatter[stryMutAct_9fa48("462") ? key : (stryCov_9fa48("462"), key.trim())] = value.replace(stryMutAct_9fa48("466") ? /^["']|[^"']$/g : stryMutAct_9fa48("465") ? /^["']|["']/g : stryMutAct_9fa48("464") ? /^[^"']|["']$/g : stryMutAct_9fa48("463") ? /["']|["']$/g : (stryCov_9fa48("463", "464", "465", "466"), /^["']|["']$/g), stryMutAct_9fa48("467") ? "Stryker was here!" : (stryCov_9fa48("467"), ""));
                }
              }
            }
          }
          return frontmatter;
        }
      } catch {
        if (stryMutAct_9fa48("468")) {
          {}
        } else {
          stryCov_9fa48("468");
          return {};
        }
      }
    }
  }
  static generateFileChecksum(content: string): string {
    if (stryMutAct_9fa48("469")) {
      {}
    } else {
      stryCov_9fa48("469");
      const crypto = require("crypto");
      return crypto.createHash(stryMutAct_9fa48("470") ? "" : (stryCov_9fa48("470"), "sha256")).update(content).digest(stryMutAct_9fa48("471") ? "" : (stryCov_9fa48("471"), "hex"));
    }
  }
  static determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
    if (stryMutAct_9fa48("472")) {
      {}
    } else {
      stryCov_9fa48("472");
      const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("473") ? "Stryker was here!" : (stryCov_9fa48("473"), "")).replace(stryMutAct_9fa48("475") ? /^\// : stryMutAct_9fa48("474") ? /\/+/ : (stryCov_9fa48("474", "475"), /^\/+/), stryMutAct_9fa48("476") ? "Stryker was here!" : (stryCov_9fa48("476"), ""));

      // Path-based classification
      if (stryMutAct_9fa48("478") ? false : stryMutAct_9fa48("477") ? true : (stryCov_9fa48("477", "478"), relativePath.includes(stryMutAct_9fa48("479") ? "" : (stryCov_9fa48("479"), "MOCs/")))) return stryMutAct_9fa48("480") ? "" : (stryCov_9fa48("480"), "moc");
      if (stryMutAct_9fa48("482") ? false : stryMutAct_9fa48("481") ? true : (stryCov_9fa48("481", "482"), relativePath.includes(stryMutAct_9fa48("483") ? "" : (stryCov_9fa48("483"), "Articles/")))) return stryMutAct_9fa48("484") ? "" : (stryCov_9fa48("484"), "article");
      if (stryMutAct_9fa48("486") ? false : stryMutAct_9fa48("485") ? true : (stryCov_9fa48("485", "486"), relativePath.includes(stryMutAct_9fa48("487") ? "" : (stryCov_9fa48("487"), "AIChats/")))) return stryMutAct_9fa48("488") ? "" : (stryCov_9fa48("488"), "conversation");
      if (stryMutAct_9fa48("490") ? false : stryMutAct_9fa48("489") ? true : (stryCov_9fa48("489", "490"), relativePath.includes(stryMutAct_9fa48("491") ? "" : (stryCov_9fa48("491"), "Books/")))) return stryMutAct_9fa48("492") ? "" : (stryCov_9fa48("492"), "book-note");
      if (stryMutAct_9fa48("494") ? false : stryMutAct_9fa48("493") ? true : (stryCov_9fa48("493", "494"), relativePath.includes(stryMutAct_9fa48("495") ? "" : (stryCov_9fa48("495"), "templates/")))) return stryMutAct_9fa48("496") ? "" : (stryCov_9fa48("496"), "template");

      // Check frontmatter type
      if (stryMutAct_9fa48("498") ? false : stryMutAct_9fa48("497") ? true : (stryCov_9fa48("497", "498"), frontmatter.type)) {
        if (stryMutAct_9fa48("499")) {
          {}
        } else {
          stryCov_9fa48("499");
          return frontmatter.type;
        }
      }
      return stryMutAct_9fa48("500") ? "" : (stryCov_9fa48("500"), "note");
    }
  }
}

/**
 * Represents a wikilink in Obsidian format
 */
export interface Wikilink {
  /** Target document path */
  target: string;

  /** Display text (if different from target) */
  display?: string;

  /** Link type */
  type: "document" | "heading" | "block";

  /** Position in source document */
  position: {
    line: number;
    column: number;
    offset: number;
  };

  /** Context around the link */
  context: string;
}

/**
 * Represents a backlink reference
 */
export interface Backlink {
  /** Source document that references this document */
  source: string;

  /** Context of the reference */
  context: string;

  /** Position in source document */
  position: {
    line: number;
    column: number;
    offset: number;
  };
}

/**
 * Processing context for embeddings
 */
export interface ObsidianEmbeddingContext {
  /** Document identifier */
  documentId: string;

  /** Section or heading being embedded */
  section: string;

  /** Hierarchical breadcrumbs */
  breadcrumbs: string[];

  /** Related concepts and tags */
  relatedConcepts: string[];

  /** Importance score (0-1) */
  importance: number;
}

// =============================================================================
// SEARCH AND QUERY STRUCTURES
// =============================================================================

/**
 * Comprehensive search query for Obsidian content
 */
export interface ObsidianSearchQuery {
  /** Search text */
  text: string;

  /** Search mode */
  mode: "semantic" | "lexical" | "hybrid" | "graph";

  /** Content type filters */
  contentTypes?: ("note" | "moc" | "article" | "conversation" | "template" | "book-note")[];

  /** Tag filters */
  tags?: string[];

  /** Folder/path filters */
  folders?: string[];

  /** Date range filters */
  dateRange?: {
    start?: Date;
    end?: Date;
  };

  /** Wikilink relationship filters */
  linkedFrom?: string[];
  linkedTo?: string[];

  /** Result limits */
  limit?: number;
  offset?: number;

  /** Sorting preferences */
  sortBy?: "relevance" | "date" | "title" | "importance";
  sortOrder?: "asc" | "desc";
}

/**
 * Search options with advanced filtering
 */
export interface ObsidianSearchOptions {
  /** Maximum results to return */
  limit?: number;

  /** Minimum similarity score (0-1) */
  minSimilarity?: number;

  /** Content type filters */
  contentTypes?: string[];

  /** Tag filters */
  tags?: string[];

  /** Folder filters */
  folders?: string[];

  /** File type filters (alias for contentTypes) */
  fileTypes?: string[];

  /** Has wikilinks filter */
  hasWikilinks?: boolean;

  /** Date range filters */
  dateRange?: {
    start?: Date;
    end?: Date;
  };

  /** Search mode */
  searchMode?: "semantic" | "hybrid" | "graph" | "comprehensive";

  /** Include related documents */
  includeRelated?: boolean;

  /** Maximum related documents */
  maxRelated?: number;

  /** Enable graph augmentation */
  graphAugmentation?: boolean;

  /** Maximum graph hops */
  maxGraphHops?: number;

  // Multi-modal specific filters
  /** Multi-modal content types to include */
  multiModalTypes?: string[];

  /** Minimum OCR/audio quality score (0-1) */
  minQuality?: number;

  /** Language filters for multi-modal content */
  languages?: string[];

  /** Include only content with text extraction */
  hasText?: boolean;

  /** File size range filters (in bytes) */
  fileSizeRange?: {
    min?: number;
    max?: number;
  };
}

// =============================================================================
// INGESTION AND PROCESSING
// =============================================================================

/**
 * Configuration for vault ingestion
 */
export interface ObsidianIngestionConfig {
  /** Vault root directory */
  vaultPath: string;

  /** File patterns to include */
  includePatterns: string[];

  /** File patterns to exclude */
  excludePatterns: string[];

  /** Chunking configuration */
  chunking: {
    /** Maximum chunk size in characters */
    maxChunkSize: number;

    /** Overlap between chunks */
    chunkOverlap: number;

    /** Respect heading boundaries */
    preserveStructure: boolean;

    /** Include frontmatter context */
    includeContext: boolean;

    /** Clean markdown formatting */
    cleanContent: boolean;
  };

  /** Processing options */
  processing: {
    /** Extract wikilinks */
    extractLinks: boolean;

    /** Extract tags */
    extractTags: boolean;

    /** Calculate statistics */
    calculateStats: boolean;

    /** Generate checksums */
    generateChecksums: boolean;
  };

  /** Performance settings */
  performance: {
    /** Batch size for processing */
    batchSize: number;

    /** Rate limiting delay */
    rateLimitMs: number;

    /** Skip existing files */
    skipExisting: boolean;

    /** Maximum concurrent operations */
    maxConcurrency: number;
  };
}

// =============================================================================
// VALIDATION AND RESULTS
// =============================================================================

/**
 * Validation result for Obsidian documents
 */
export interface ObsidianValidationResult {
  /** Document identifier */
  documentId: string;

  /** Overall validation status */
  valid: boolean;

  /** Validation errors */
  errors: ValidationError[];

  /** Validation warnings */
  warnings: ValidationWarning[];

  /** Processing statistics */
  stats: {
    processingTime: number;
    chunksGenerated: number;
    embeddingsGenerated: number;
  };
}

/**
 * Validation error details
 */
export interface ValidationError {
  /** Error code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Location in document */
  location?: {
    line?: number;
    column?: number;
    offset?: number;
  };

  /** Severity level */
  severity: "error" | "warning" | "info";
}

/**
 * Validation warning details
 */
export interface ValidationWarning {
  /** Warning code */
  code: string;

  /** Human-readable message */
  message: string;

  /** Location in document */
  location?: {
    line?: number;
    column?: number;
    offset?: number;
  };
}

// =============================================================================
// ANALYTICS AND INSIGHTS
// =============================================================================

/**
 * Analytics for an Obsidian vault
 */
export interface ObsidianVaultAnalytics {
  /** Basic vault statistics */
  overview: {
    totalDocuments: number;
    totalWords: number;
    totalLinks: number;
    totalTags: number;
    vaultAge: number; // days
  };

  /** Content type distribution */
  contentDistribution: {
    byType: Record<string, number>;
    byFolder: Record<string, number>;
    byTag: Record<string, number>;
  };

  /** Network analysis */
  networkAnalysis: {
    /** Most connected documents */
    hubDocuments: Array<{
      document: string;
      connections: number;
      centrality: number;
    }>;

    /** Knowledge clusters */
    clusters: Array<{
      name: string;
      documents: string[];
      theme: string;
      density: number;
    }>;

    /** Orphaned documents */
    orphans: string[];

    /** Link health metrics */
    linkHealth: {
      brokenLinks: number;
      missingReferences: number;
      circularReferences: number;
    };
  };

  /** Temporal analysis */
  temporalAnalysis: {
    creationTimeline: Array<{
      period: string;
      count: number;
    }>;
    modificationTimeline: Array<{
      period: string;
      count: number;
    }>;
    activityPatterns: {
      mostActiveDays: string[];
      mostActiveHours: number[];
    };
  };

  /** Quality metrics */
  qualityMetrics: {
    averageDocumentLength: number;
    averageLinksPerDocument: number;
    tagConsistency: number;
    formattingConsistency: number;
  };
}

// =============================================================================
// API CONTRACTS
// =============================================================================

/**
 * Search API request contract
 */
export interface SearchAPIRequest {
  query: string;
  options?: Partial<ObsidianSearchOptions>;
  pagination?: {
    limit: number;
    offset: number;
  };
}

/**
 * Search API response contract
 */
export interface SearchAPIResponse {
  query: string;
  results: ObsidianSearchResult[];
  totalFound: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  facets?: {
    contentTypes: Array<{
      type: string;
      count: number;
    }>;
    tags: Array<{
      tag: string;
      count: number;
    }>;
    folders: Array<{
      folder: string;
      count: number;
    }>;
    temporal: Array<{
      period: string;
      count: number;
    }>;
  };
  performance: {
    totalTime: number;
    searchTime: number;
    processingTime: number;
  };
  graphInsights?: {
    queryConcepts: string[];
    relatedConcepts: string[];
    knowledgeClusters: Array<{
      name: string;
      documents: string[];
      centrality: number;
    }>;
  };
}

/**
 * Ingestion API request contract
 */
export interface IngestionAPIRequest {
  vaultPath: string;
  config?: Partial<ObsidianIngestionConfig>;
  options?: {
    force?: boolean; // Reprocess all files
    incremental?: boolean; // Only process changed files
    validateOnly?: boolean; // Just validate without storing
  };
}

/**
 * Ingestion API response contract
 */
export interface IngestionAPIResponse {
  success: boolean;
  processed: number;
  skipped: number;
  errors: number;
  details: {
    documentsProcessed: string[];
    documentsSkipped: string[];
    errors: Array<{
      document: string;
      error: string;
    }>;
  };
  performance: {
    totalTime: number;
    documentsPerSecond: number;
    chunksPerSecond: number;
  };
  validationResults?: ObsidianValidationResult[];
}

/**
 * Analytics API response contract
 */
export interface AnalyticsAPIResponse {
  analytics: ObsidianVaultAnalytics;
  generated: Date;
  computationTime: number;
}

/**
 * Health check API response contract
 */
export interface HealthAPIResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  version: string;
  services: {
    database: "up" | "down";
    embeddings: "up" | "down";
    indexing: "up" | "down";
  };
  metrics: {
    totalDocuments: number;
    totalChunks: number;
    lastIngestion: Date | null;
    uptime: number;
  };
}

// =============================================================================
// UTILITY TYPES AND CONSTANTS
// =============================================================================

/**
 * Supported Obsidian content types
 */
export const OBSIDIAN_CONTENT_TYPES = ["note", "moc", "article", "conversation", "template", "book-note", "canvas", "dataview"] as const;
export type ObsidianContentType = (typeof OBSIDIAN_CONTENT_TYPES)[number];

/**
 * Obsidian frontmatter field definitions
 */
export interface ObsidianFrontmatterSchema {
  title?: string;
  created?: string | Date;
  updated?: string | Date;
  tags?: string[];
  aliases?: string[];
  category?: string;
  status?: "draft" | "published" | "archived";
  priority?: "low" | "medium" | "high";
  project?: string;
  related?: string[];
  [key: string]: any; // Allow custom fields
}

/**
 * Chunk generation strategies
 */
export type ChunkStrategy = "fixed-size" | "structure-aware" | "semantic";

/**
 * Link types in Obsidian
 */
export type ObsidianLinkType = "document" | "heading" | "block" | "embed";

/**
 * Document processing status
 */
export type ProcessingStatus = "pending" | "processing" | "completed" | "failed";

/**
 * Validation rule definitions
 */
export interface ValidationRule {
  name: string;
  description: string;
  check: (document: ObsidianDocument) => ValidationError | null;
  severity: "error" | "warning" | "info";
}

// Import the search result type for API responses
import { SearchResult } from "../types/index.js";
export interface ObsidianSearchResult extends SearchResult {
  obsidianMeta?: {
    fileName: string;
    filePath: string;
    tags: string[];
    wikilinks: string[];
    frontmatter: Record<string, any>;
    relatedFiles?: string[];
    backlinks?: string[];
  };
  multiModalMeta?: {
    fileId: string;
    contentType: string;
    contentTypeLabel: string;
    mimeType: string;
    checksum: string;
    quality?: any;
    processing?: any;
    // Content-specific metadata
    duration?: number;
    sampleRate?: number;
    channels?: number;
    confidence?: number;
    language?: string;
    pageCount?: number;
    hasText?: boolean;
    wordCount?: number;
  };
  highlights?: string[];
  relatedChunks?: SearchResult[];
  graphContext?: {
    connectedConcepts: string[];
    pathsToQuery: number;
    centralityScore: number;
  };
}