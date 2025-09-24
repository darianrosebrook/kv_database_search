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
    if (stryMutAct_9fa48("1362")) {
      {}
    } else {
      stryCov_9fa48("1362");
      return stryMutAct_9fa48("1363") ? content.replace(/^---[\s\S]*?---\n?/m, "").replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, display) => display || target).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/(\*\*|__)(.*?)\1/g, "$1").replace(/(\*|_)(.*?)\1/g, "$1").replace(/`([^`]+)`/g, "$1").replace(/~~(.*?)~~/g, "$1").replace(/^#{1,6}\s+(.*)$/gm, "$1").replace(/\n{3,}/g, "\n\n") : (stryCov_9fa48("1363"), content.replace(stryMutAct_9fa48("1369") ? /^---[\s\S]*?---\n/m : stryMutAct_9fa48("1368") ? /^---[\s\s]*?---\n?/m : stryMutAct_9fa48("1367") ? /^---[\S\S]*?---\n?/m : stryMutAct_9fa48("1366") ? /^---[^\s\S]*?---\n?/m : stryMutAct_9fa48("1365") ? /^---[\s\S]---\n?/m : stryMutAct_9fa48("1364") ? /---[\s\S]*?---\n?/m : (stryCov_9fa48("1364", "1365", "1366", "1367", "1368", "1369"), /^---[\s\S]*?---\n?/m), stryMutAct_9fa48("1370") ? "Stryker was here!" : (stryCov_9fa48("1370"), "")).replace(stryMutAct_9fa48("1375") ? /\[\[([^\]|]+)(?:\|([\]]+))?\]\]/g : stryMutAct_9fa48("1374") ? /\[\[([^\]|]+)(?:\|([^\]]))?\]\]/g : stryMutAct_9fa48("1373") ? /\[\[([^\]|]+)(?:\|([^\]]+))\]\]/g : stryMutAct_9fa48("1372") ? /\[\[([\]|]+)(?:\|([^\]]+))?\]\]/g : stryMutAct_9fa48("1371") ? /\[\[([^\]|])(?:\|([^\]]+))?\]\]/g : (stryCov_9fa48("1371", "1372", "1373", "1374", "1375"), /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g), stryMutAct_9fa48("1376") ? () => undefined : (stryCov_9fa48("1376"), (_, target, display) => stryMutAct_9fa48("1379") ? display && target : stryMutAct_9fa48("1378") ? false : stryMutAct_9fa48("1377") ? true : (stryCov_9fa48("1377", "1378", "1379"), display || target))).replace(stryMutAct_9fa48("1383") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("1382") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("1381") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("1380") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("1380", "1381", "1382", "1383"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("1384") ? "" : (stryCov_9fa48("1384"), "$1")).replace(stryMutAct_9fa48("1385") ? /(\*\*|__)(.)\1/g : (stryCov_9fa48("1385"), /(\*\*|__)(.*?)\1/g), stryMutAct_9fa48("1386") ? "" : (stryCov_9fa48("1386"), "$1")).replace(stryMutAct_9fa48("1387") ? /(\*|_)(.)\1/g : (stryCov_9fa48("1387"), /(\*|_)(.*?)\1/g), stryMutAct_9fa48("1388") ? "" : (stryCov_9fa48("1388"), "$1")).replace(stryMutAct_9fa48("1390") ? /`([`]+)`/g : stryMutAct_9fa48("1389") ? /`([^`])`/g : (stryCov_9fa48("1389", "1390"), /`([^`]+)`/g), stryMutAct_9fa48("1391") ? "" : (stryCov_9fa48("1391"), "$1")).replace(stryMutAct_9fa48("1392") ? /~~(.)~~/g : (stryCov_9fa48("1392"), /~~(.*?)~~/g), stryMutAct_9fa48("1393") ? "" : (stryCov_9fa48("1393"), "$1")).replace(stryMutAct_9fa48("1399") ? /^#{1,6}\s+(.)$/gm : stryMutAct_9fa48("1398") ? /^#{1,6}\S+(.*)$/gm : stryMutAct_9fa48("1397") ? /^#{1,6}\s(.*)$/gm : stryMutAct_9fa48("1396") ? /^#\s+(.*)$/gm : stryMutAct_9fa48("1395") ? /^#{1,6}\s+(.*)/gm : stryMutAct_9fa48("1394") ? /#{1,6}\s+(.*)$/gm : (stryCov_9fa48("1394", "1395", "1396", "1397", "1398", "1399"), /^#{1,6}\s+(.*)$/gm), stryMutAct_9fa48("1400") ? "" : (stryCov_9fa48("1400"), "$1")).replace(stryMutAct_9fa48("1401") ? /\n/g : (stryCov_9fa48("1401"), /\n{3,}/g), stryMutAct_9fa48("1402") ? "" : (stryCov_9fa48("1402"), "\n\n")).trim());
    }
  }
  static extractWikilinks(content: string): string[] {
    if (stryMutAct_9fa48("1403")) {
      {}
    } else {
      stryCov_9fa48("1403");
      const wikilinkRegex = stryMutAct_9fa48("1408") ? /\[\[([^\]|]+)(?:\|([\]]+))?\]\]/g : stryMutAct_9fa48("1407") ? /\[\[([^\]|]+)(?:\|([^\]]))?\]\]/g : stryMutAct_9fa48("1406") ? /\[\[([^\]|]+)(?:\|([^\]]+))\]\]/g : stryMutAct_9fa48("1405") ? /\[\[([\]|]+)(?:\|([^\]]+))?\]\]/g : stryMutAct_9fa48("1404") ? /\[\[([^\]|])(?:\|([^\]]+))?\]\]/g : (stryCov_9fa48("1404", "1405", "1406", "1407", "1408"), /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g);
      const links: string[] = stryMutAct_9fa48("1409") ? ["Stryker was here"] : (stryCov_9fa48("1409"), []);
      let match;
      while (stryMutAct_9fa48("1411") ? (match = wikilinkRegex.exec(content)) === null : stryMutAct_9fa48("1410") ? false : (stryCov_9fa48("1410", "1411"), (match = wikilinkRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("1412")) {
          {}
        } else {
          stryCov_9fa48("1412");
          links.push(stryMutAct_9fa48("1415") ? match[2] && match[1] : stryMutAct_9fa48("1414") ? false : stryMutAct_9fa48("1413") ? true : (stryCov_9fa48("1413", "1414", "1415"), match[2] || match[1]));
        }
      }
      return stryMutAct_9fa48("1416") ? [] : (stryCov_9fa48("1416"), [...new Set(links)]);
    }
  }
  static extractTags(content: string): string[] {
    if (stryMutAct_9fa48("1417")) {
      {}
    } else {
      stryCov_9fa48("1417");
      const tagRegex = stryMutAct_9fa48("1419") ? /#([^a-zA-Z0-9_-]+)/g : stryMutAct_9fa48("1418") ? /#([a-zA-Z0-9_-])/g : (stryCov_9fa48("1418", "1419"), /#([a-zA-Z0-9_-]+)/g);
      const tags: string[] = stryMutAct_9fa48("1420") ? ["Stryker was here"] : (stryCov_9fa48("1420"), []);
      let match;
      while (stryMutAct_9fa48("1422") ? (match = tagRegex.exec(content)) === null : stryMutAct_9fa48("1421") ? false : (stryCov_9fa48("1421", "1422"), (match = tagRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("1423")) {
          {}
        } else {
          stryCov_9fa48("1423");
          tags.push(match[1]);
        }
      }
      return stryMutAct_9fa48("1424") ? [] : (stryCov_9fa48("1424"), [...new Set(tags)]);
    }
  }
  static parseFrontmatter(content: string): Record<string, any> {
    if (stryMutAct_9fa48("1425")) {
      {}
    } else {
      stryCov_9fa48("1425");
      const frontmatterRegex = stryMutAct_9fa48("1430") ? /^---\n([\s\s]*?)\n---/ : stryMutAct_9fa48("1429") ? /^---\n([\S\S]*?)\n---/ : stryMutAct_9fa48("1428") ? /^---\n([^\s\S]*?)\n---/ : stryMutAct_9fa48("1427") ? /^---\n([\s\S])\n---/ : stryMutAct_9fa48("1426") ? /---\n([\s\S]*?)\n---/ : (stryCov_9fa48("1426", "1427", "1428", "1429", "1430"), /^---\n([\s\S]*?)\n---/);
      const match = content.match(frontmatterRegex);
      if (stryMutAct_9fa48("1433") ? false : stryMutAct_9fa48("1432") ? true : stryMutAct_9fa48("1431") ? match : (stryCov_9fa48("1431", "1432", "1433"), !match)) return {};
      try {
        if (stryMutAct_9fa48("1434")) {
          {}
        } else {
          stryCov_9fa48("1434");
          // Simple YAML-like parsing (for now)
          const frontmatter: Record<string, any> = {};
          const lines = match[1].split(stryMutAct_9fa48("1435") ? "" : (stryCov_9fa48("1435"), "\n"));
          for (const line of lines) {
            if (stryMutAct_9fa48("1436")) {
              {}
            } else {
              stryCov_9fa48("1436");
              const [key, ...valueParts] = line.split(stryMutAct_9fa48("1437") ? "" : (stryCov_9fa48("1437"), ":"));
              if (stryMutAct_9fa48("1440") ? key || valueParts.length > 0 : stryMutAct_9fa48("1439") ? false : stryMutAct_9fa48("1438") ? true : (stryCov_9fa48("1438", "1439", "1440"), key && (stryMutAct_9fa48("1443") ? valueParts.length <= 0 : stryMutAct_9fa48("1442") ? valueParts.length >= 0 : stryMutAct_9fa48("1441") ? true : (stryCov_9fa48("1441", "1442", "1443"), valueParts.length > 0)))) {
                if (stryMutAct_9fa48("1444")) {
                  {}
                } else {
                  stryCov_9fa48("1444");
                  const value = stryMutAct_9fa48("1445") ? valueParts.join(":") : (stryCov_9fa48("1445"), valueParts.join(stryMutAct_9fa48("1446") ? "" : (stryCov_9fa48("1446"), ":")).trim());
                  // Remove quotes if present
                  frontmatter[stryMutAct_9fa48("1447") ? key : (stryCov_9fa48("1447"), key.trim())] = value.replace(stryMutAct_9fa48("1451") ? /^["']|[^"']$/g : stryMutAct_9fa48("1450") ? /^["']|["']/g : stryMutAct_9fa48("1449") ? /^[^"']|["']$/g : stryMutAct_9fa48("1448") ? /["']|["']$/g : (stryCov_9fa48("1448", "1449", "1450", "1451"), /^["']|["']$/g), stryMutAct_9fa48("1452") ? "Stryker was here!" : (stryCov_9fa48("1452"), ""));
                }
              }
            }
          }
          return frontmatter;
        }
      } catch {
        if (stryMutAct_9fa48("1453")) {
          {}
        } else {
          stryCov_9fa48("1453");
          return {};
        }
      }
    }
  }
  static generateFileChecksum(content: string): string {
    if (stryMutAct_9fa48("1454")) {
      {}
    } else {
      stryCov_9fa48("1454");
      const crypto = require("crypto");
      return crypto.createHash(stryMutAct_9fa48("1455") ? "" : (stryCov_9fa48("1455"), "sha256")).update(content).digest(stryMutAct_9fa48("1456") ? "" : (stryCov_9fa48("1456"), "hex"));
    }
  }
  static determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
    if (stryMutAct_9fa48("1457")) {
      {}
    } else {
      stryCov_9fa48("1457");
      const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("1458") ? "Stryker was here!" : (stryCov_9fa48("1458"), "")).replace(stryMutAct_9fa48("1460") ? /^\// : stryMutAct_9fa48("1459") ? /\/+/ : (stryCov_9fa48("1459", "1460"), /^\/+/), stryMutAct_9fa48("1461") ? "Stryker was here!" : (stryCov_9fa48("1461"), ""));

      // Path-based classification
      if (stryMutAct_9fa48("1463") ? false : stryMutAct_9fa48("1462") ? true : (stryCov_9fa48("1462", "1463"), relativePath.includes(stryMutAct_9fa48("1464") ? "" : (stryCov_9fa48("1464"), "MOCs/")))) return stryMutAct_9fa48("1465") ? "" : (stryCov_9fa48("1465"), "moc");
      if (stryMutAct_9fa48("1467") ? false : stryMutAct_9fa48("1466") ? true : (stryCov_9fa48("1466", "1467"), relativePath.includes(stryMutAct_9fa48("1468") ? "" : (stryCov_9fa48("1468"), "Articles/")))) return stryMutAct_9fa48("1469") ? "" : (stryCov_9fa48("1469"), "article");
      if (stryMutAct_9fa48("1471") ? false : stryMutAct_9fa48("1470") ? true : (stryCov_9fa48("1470", "1471"), relativePath.includes(stryMutAct_9fa48("1472") ? "" : (stryCov_9fa48("1472"), "AIChats/")))) return stryMutAct_9fa48("1473") ? "" : (stryCov_9fa48("1473"), "conversation");
      if (stryMutAct_9fa48("1475") ? false : stryMutAct_9fa48("1474") ? true : (stryCov_9fa48("1474", "1475"), relativePath.includes(stryMutAct_9fa48("1476") ? "" : (stryCov_9fa48("1476"), "Books/")))) return stryMutAct_9fa48("1477") ? "" : (stryCov_9fa48("1477"), "book-note");
      if (stryMutAct_9fa48("1479") ? false : stryMutAct_9fa48("1478") ? true : (stryCov_9fa48("1478", "1479"), relativePath.includes(stryMutAct_9fa48("1480") ? "" : (stryCov_9fa48("1480"), "templates/")))) return stryMutAct_9fa48("1481") ? "" : (stryCov_9fa48("1481"), "template");

      // Check frontmatter type
      if (stryMutAct_9fa48("1483") ? false : stryMutAct_9fa48("1482") ? true : (stryCov_9fa48("1482", "1483"), frontmatter.type)) {
        if (stryMutAct_9fa48("1484")) {
          {}
        } else {
          stryCov_9fa48("1484");
          return frontmatter.type;
        }
      }
      return stryMutAct_9fa48("1485") ? "" : (stryCov_9fa48("1485"), "note");
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
  highlights?: string[];
  relatedChunks?: SearchResult[];
  graphContext?: {
    connectedConcepts: string[];
    pathsToQuery: number;
    centralityScore: number;
  };
}