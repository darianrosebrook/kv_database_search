// @ts-nocheck
function stryNS_9fa48() {
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
import { ContentType, ContentMetadata } from "../../types/index";
import { createHash } from "../utils";

/**
 * Base interface for all content processors
 */
export interface ContentProcessor {
  /**
   * Extract text and metadata from a file buffer
   */
  extractFromBuffer(buffer: Buffer, options?: ProcessorOptions): Promise<ProcessorResult>;

  /**
   * Extract text and metadata from a file path
   */
  extractFromFile(filePath: string, options?: ProcessorOptions): Promise<ProcessorResult>;

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean;

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[];

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string;
}

/**
 * Common processor options
 */
export interface ProcessorOptions {
  language?: string;
  confidence?: number;
  extractMetadata?: boolean;
  skipValidation?: boolean;
}

/**
 * Standard processor result structure
 */
export interface ProcessorResult {
  text: string;
  metadata: ContentMetadata;
  success: boolean;
  errors?: string[];
  processingTime: number;
}

/**
 * Base class for content processors with common functionality
 */
export abstract class BaseContentProcessor implements ContentProcessor {
  protected readonly processorName: string;
  protected readonly supportedTypes: ContentType[];
  constructor(processorName: string, supportedTypes: ContentType[]) {
    if (stryMutAct_9fa48("2969")) {
      {}
    } else {
      stryCov_9fa48("2969");
      this.processorName = processorName;
      this.supportedTypes = supportedTypes;
    }
  }

  /**
   * Extract text and metadata from a file buffer
   */
  abstract extractFromBuffer(buffer: Buffer, options?: ProcessorOptions): Promise<ProcessorResult>;

  /**
   * Extract text and metadata from a file path
   */
  async extractFromFile(filePath: string, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("2970")) {
      {}
    } else {
      stryCov_9fa48("2970");
      try {
        if (stryMutAct_9fa48("2971")) {
          {}
        } else {
          stryCov_9fa48("2971");
          const fs = await import(stryMutAct_9fa48("2972") ? "" : (stryCov_9fa48("2972"), "fs"));
          const buffer = fs.readFileSync(filePath);
          return await this.extractFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("2973")) {
          {}
        } else {
          stryCov_9fa48("2973");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createErrorResult(stryMutAct_9fa48("2974") ? `` : (stryCov_9fa48("2974"), `Failed to read file: ${errorMessage}`), stryMutAct_9fa48("2977") ? options?.language && "unknown" : stryMutAct_9fa48("2976") ? false : stryMutAct_9fa48("2975") ? true : (stryCov_9fa48("2975", "2976", "2977"), (stryMutAct_9fa48("2978") ? options.language : (stryCov_9fa48("2978"), options?.language)) || (stryMutAct_9fa48("2979") ? "" : (stryCov_9fa48("2979"), "unknown"))));
        }
      }
    }
  }

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean {
    if (stryMutAct_9fa48("2980")) {
      {}
    } else {
      stryCov_9fa48("2980");
      return this.supportedTypes.includes(contentType);
    }
  }

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[] {
    if (stryMutAct_9fa48("2981")) {
      {}
    } else {
      stryCov_9fa48("2981");
      return stryMutAct_9fa48("2982") ? [] : (stryCov_9fa48("2982"), [...this.supportedTypes]);
    }
  }

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string {
    if (stryMutAct_9fa48("2983")) {
      {}
    } else {
      stryCov_9fa48("2983");
      return this.processorName;
    }
  }

  /**
   * Create a successful processor result
   */
  protected createSuccessResult(text: string, metadata: Partial<ContentMetadata>, processingTime: number, language?: string): ProcessorResult {
    if (stryMutAct_9fa48("2984")) {
      {}
    } else {
      stryCov_9fa48("2984");
      const fullMetadata: ContentMetadata = stryMutAct_9fa48("2985") ? {} : (stryCov_9fa48("2985"), {
        type: stryMutAct_9fa48("2988") ? metadata.type && ContentType.UNKNOWN : stryMutAct_9fa48("2987") ? false : stryMutAct_9fa48("2986") ? true : (stryCov_9fa48("2986", "2987", "2988"), metadata.type || ContentType.UNKNOWN),
        language: stryMutAct_9fa48("2991") ? (language || metadata.language) && "unknown" : stryMutAct_9fa48("2990") ? false : stryMutAct_9fa48("2989") ? true : (stryCov_9fa48("2989", "2990", "2991"), (stryMutAct_9fa48("2993") ? language && metadata.language : stryMutAct_9fa48("2992") ? false : (stryCov_9fa48("2992", "2993"), language || metadata.language)) || (stryMutAct_9fa48("2994") ? "" : (stryCov_9fa48("2994"), "unknown"))),
        encoding: stryMutAct_9fa48("2997") ? metadata.encoding && "utf-8" : stryMutAct_9fa48("2996") ? false : stryMutAct_9fa48("2995") ? true : (stryCov_9fa48("2995", "2996", "2997"), metadata.encoding || (stryMutAct_9fa48("2998") ? "" : (stryCov_9fa48("2998"), "utf-8"))),
        ...metadata
      });
      return stryMutAct_9fa48("2999") ? {} : (stryCov_9fa48("2999"), {
        text,
        metadata: fullMetadata,
        success: stryMutAct_9fa48("3000") ? false : (stryCov_9fa48("3000"), true),
        processingTime
      });
    }
  }

  /**
   * Create an error processor result
   */
  protected createErrorResult(errorMessage: string, language: string = stryMutAct_9fa48("3001") ? "" : (stryCov_9fa48("3001"), "unknown")): ProcessorResult {
    if (stryMutAct_9fa48("3002")) {
      {}
    } else {
      stryCov_9fa48("3002");
      const errorMetadata: ContentMetadata = stryMutAct_9fa48("3003") ? {} : (stryCov_9fa48("3003"), {
        type: ContentType.UNKNOWN,
        language,
        encoding: stryMutAct_9fa48("3004") ? "" : (stryCov_9fa48("3004"), "unknown")
      });
      return stryMutAct_9fa48("3005") ? {} : (stryCov_9fa48("3005"), {
        text: errorMessage,
        metadata: errorMetadata,
        success: stryMutAct_9fa48("3006") ? true : (stryCov_9fa48("3006"), false),
        errors: stryMutAct_9fa48("3007") ? [] : (stryCov_9fa48("3007"), [errorMessage]),
        processingTime: 0
      });
    }
  }

  /**
   * Generate a file ID for content metadata
   */
  protected generateFileId(filePath: string): string {
    if (stryMutAct_9fa48("3008")) {
      {}
    } else {
      stryCov_9fa48("3008");
      const hash = createHash(stryMutAct_9fa48("3009") ? "" : (stryCov_9fa48("3009"), "md5"), filePath);
      return stryMutAct_9fa48("3010") ? `` : (stryCov_9fa48("3010"), `file_${hash}`);
    }
  }

  /**
   * Generate a checksum for content
   */
  protected generateChecksum(buffer: Buffer): string {
    if (stryMutAct_9fa48("3011")) {
      {}
    } else {
      stryCov_9fa48("3011");
      return createHash(stryMutAct_9fa48("3012") ? "" : (stryCov_9fa48("3012"), "md5"), buffer);
    }
  }

  /**
   * Common text cleaning for extracted content
   */
  protected cleanExtractedText(text: string): string {
    if (stryMutAct_9fa48("3013")) {
      {}
    } else {
      stryCov_9fa48("3013");
      return stryMutAct_9fa48("3014") ? text.replace(/\0/g, "") // Remove null characters
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/[ \u00A0]+/g, " ") // Normalize whitespace
      : (stryCov_9fa48("3014"), text.replace(/\0/g, stryMutAct_9fa48("3015") ? "Stryker was here!" : (stryCov_9fa48("3015"), "")) // Remove null characters
      .replace(/\r\n/g, stryMutAct_9fa48("3016") ? "" : (stryCov_9fa48("3016"), "\n")) // Normalize line endings
      .replace(/\t/g, stryMutAct_9fa48("3017") ? "" : (stryCov_9fa48("3017"), " ")) // Replace tabs with spaces
      .replace(stryMutAct_9fa48("3019") ? /[^ \u00A0]+/g : stryMutAct_9fa48("3018") ? /[ \u00A0]/g : (stryCov_9fa48("3018", "3019"), /[ \u00A0]+/g), stryMutAct_9fa48("3020") ? "" : (stryCov_9fa48("3020"), " ")) // Normalize whitespace
      .trim());
    }
  }

  /**
   * Count words in text for metadata
   */
  protected countWords(text: string): number {
    if (stryMutAct_9fa48("3021")) {
      {}
    } else {
      stryCov_9fa48("3021");
      return stryMutAct_9fa48("3022") ? text.split(/\s+/).length : (stryCov_9fa48("3022"), text.split(stryMutAct_9fa48("3024") ? /\S+/ : stryMutAct_9fa48("3023") ? /\s/ : (stryCov_9fa48("3023", "3024"), /\s+/)).filter(stryMutAct_9fa48("3025") ? () => undefined : (stryCov_9fa48("3025"), word => stryMutAct_9fa48("3029") ? word.length <= 0 : stryMutAct_9fa48("3028") ? word.length >= 0 : stryMutAct_9fa48("3027") ? false : stryMutAct_9fa48("3026") ? true : (stryCov_9fa48("3026", "3027", "3028", "3029"), word.length > 0))).length);
    }
  }

  /**
   * Count characters in text for metadata
   */
  protected countCharacters(text: string): number {
    if (stryMutAct_9fa48("3030")) {
      {}
    } else {
      stryCov_9fa48("3030");
      return text.length;
    }
  }

  /**
   * Validate processing options
   */
  protected validateOptions(options?: ProcessorOptions): ProcessorOptions {
    if (stryMutAct_9fa48("3031")) {
      {}
    } else {
      stryCov_9fa48("3031");
      return stryMutAct_9fa48("3032") ? {} : (stryCov_9fa48("3032"), {
        language: stryMutAct_9fa48("3035") ? options?.language && "en" : stryMutAct_9fa48("3034") ? false : stryMutAct_9fa48("3033") ? true : (stryCov_9fa48("3033", "3034", "3035"), (stryMutAct_9fa48("3036") ? options.language : (stryCov_9fa48("3036"), options?.language)) || (stryMutAct_9fa48("3037") ? "" : (stryCov_9fa48("3037"), "en"))),
        confidence: stryMutAct_9fa48("3040") ? options?.confidence && 0.5 : stryMutAct_9fa48("3039") ? false : stryMutAct_9fa48("3038") ? true : (stryCov_9fa48("3038", "3039", "3040"), (stryMutAct_9fa48("3041") ? options.confidence : (stryCov_9fa48("3041"), options?.confidence)) || 0.5),
        extractMetadata: stryMutAct_9fa48("3042") ? options?.extractMetadata && true : (stryCov_9fa48("3042"), (stryMutAct_9fa48("3043") ? options.extractMetadata : (stryCov_9fa48("3043"), options?.extractMetadata)) ?? (stryMutAct_9fa48("3044") ? false : (stryCov_9fa48("3044"), true))),
        skipValidation: stryMutAct_9fa48("3045") ? options?.skipValidation && false : (stryCov_9fa48("3045"), (stryMutAct_9fa48("3046") ? options.skipValidation : (stryCov_9fa48("3046"), options?.skipValidation)) ?? (stryMutAct_9fa48("3047") ? true : (stryCov_9fa48("3047"), false))),
        ...options
      });
    }
  }

  /**
   * Measure processing time for a function
   */
  protected async measureTime<T>(fn: () => Promise<T>): Promise<{
    result: T;
    time: number;
  }> {
    if (stryMutAct_9fa48("3048")) {
      {}
    } else {
      stryCov_9fa48("3048");
      const start = Date.now();
      const result = await fn();
      const time = stryMutAct_9fa48("3049") ? Date.now() + start : (stryCov_9fa48("3049"), Date.now() - start);
      return stryMutAct_9fa48("3050") ? {} : (stryCov_9fa48("3050"), {
        result,
        time
      });
    }
  }
}