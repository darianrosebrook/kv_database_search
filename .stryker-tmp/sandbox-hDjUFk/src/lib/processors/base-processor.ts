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
    if (stryMutAct_9fa48("3073")) {
      {}
    } else {
      stryCov_9fa48("3073");
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
    if (stryMutAct_9fa48("3074")) {
      {}
    } else {
      stryCov_9fa48("3074");
      try {
        if (stryMutAct_9fa48("3075")) {
          {}
        } else {
          stryCov_9fa48("3075");
          const fs = await import(stryMutAct_9fa48("3076") ? "" : (stryCov_9fa48("3076"), "fs"));
          const buffer = fs.readFileSync(filePath);
          return await this.extractFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3077")) {
          {}
        } else {
          stryCov_9fa48("3077");
          const errorMessage = error instanceof Error ? error.message : String(error);
          return this.createErrorResult(stryMutAct_9fa48("3078") ? `` : (stryCov_9fa48("3078"), `Failed to read file: ${errorMessage}`), stryMutAct_9fa48("3081") ? options?.language && "unknown" : stryMutAct_9fa48("3080") ? false : stryMutAct_9fa48("3079") ? true : (stryCov_9fa48("3079", "3080", "3081"), (stryMutAct_9fa48("3082") ? options.language : (stryCov_9fa48("3082"), options?.language)) || (stryMutAct_9fa48("3083") ? "" : (stryCov_9fa48("3083"), "unknown"))));
        }
      }
    }
  }

  /**
   * Check if this processor supports a given content type
   */
  supportsContentType(contentType: ContentType): boolean {
    if (stryMutAct_9fa48("3084")) {
      {}
    } else {
      stryCov_9fa48("3084");
      return this.supportedTypes.includes(contentType);
    }
  }

  /**
   * Get the supported content types for this processor
   */
  getSupportedContentTypes(): ContentType[] {
    if (stryMutAct_9fa48("3085")) {
      {}
    } else {
      stryCov_9fa48("3085");
      return stryMutAct_9fa48("3086") ? [] : (stryCov_9fa48("3086"), [...this.supportedTypes]);
    }
  }

  /**
   * Get the processor name/identifier
   */
  getProcessorName(): string {
    if (stryMutAct_9fa48("3087")) {
      {}
    } else {
      stryCov_9fa48("3087");
      return this.processorName;
    }
  }

  /**
   * Create a successful processor result
   */
  protected createSuccessResult(text: string, metadata: Partial<ContentMetadata>, processingTime: number, language?: string): ProcessorResult {
    if (stryMutAct_9fa48("3088")) {
      {}
    } else {
      stryCov_9fa48("3088");
      const fullMetadata: ContentMetadata = stryMutAct_9fa48("3089") ? {} : (stryCov_9fa48("3089"), {
        type: stryMutAct_9fa48("3092") ? metadata.type && ContentType.UNKNOWN : stryMutAct_9fa48("3091") ? false : stryMutAct_9fa48("3090") ? true : (stryCov_9fa48("3090", "3091", "3092"), metadata.type || ContentType.UNKNOWN),
        language: stryMutAct_9fa48("3095") ? (language || metadata.language) && "unknown" : stryMutAct_9fa48("3094") ? false : stryMutAct_9fa48("3093") ? true : (stryCov_9fa48("3093", "3094", "3095"), (stryMutAct_9fa48("3097") ? language && metadata.language : stryMutAct_9fa48("3096") ? false : (stryCov_9fa48("3096", "3097"), language || metadata.language)) || (stryMutAct_9fa48("3098") ? "" : (stryCov_9fa48("3098"), "unknown"))),
        encoding: stryMutAct_9fa48("3101") ? metadata.encoding && "utf-8" : stryMutAct_9fa48("3100") ? false : stryMutAct_9fa48("3099") ? true : (stryCov_9fa48("3099", "3100", "3101"), metadata.encoding || (stryMutAct_9fa48("3102") ? "" : (stryCov_9fa48("3102"), "utf-8"))),
        ...metadata
      });
      return stryMutAct_9fa48("3103") ? {} : (stryCov_9fa48("3103"), {
        text,
        metadata: fullMetadata,
        success: stryMutAct_9fa48("3104") ? false : (stryCov_9fa48("3104"), true),
        processingTime
      });
    }
  }

  /**
   * Create an error processor result
   */
  protected createErrorResult(errorMessage: string, language: string = stryMutAct_9fa48("3105") ? "" : (stryCov_9fa48("3105"), "unknown")): ProcessorResult {
    if (stryMutAct_9fa48("3106")) {
      {}
    } else {
      stryCov_9fa48("3106");
      const errorMetadata: ContentMetadata = stryMutAct_9fa48("3107") ? {} : (stryCov_9fa48("3107"), {
        type: ContentType.UNKNOWN,
        language,
        encoding: stryMutAct_9fa48("3108") ? "" : (stryCov_9fa48("3108"), "unknown")
      });
      return stryMutAct_9fa48("3109") ? {} : (stryCov_9fa48("3109"), {
        text: errorMessage,
        metadata: errorMetadata,
        success: stryMutAct_9fa48("3110") ? true : (stryCov_9fa48("3110"), false),
        errors: stryMutAct_9fa48("3111") ? [] : (stryCov_9fa48("3111"), [errorMessage]),
        processingTime: 0
      });
    }
  }

  /**
   * Generate a file ID for content metadata
   */
  protected generateFileId(filePath: string): string {
    if (stryMutAct_9fa48("3112")) {
      {}
    } else {
      stryCov_9fa48("3112");
      const hash = createHash(stryMutAct_9fa48("3113") ? "" : (stryCov_9fa48("3113"), "md5"), filePath);
      return stryMutAct_9fa48("3114") ? `` : (stryCov_9fa48("3114"), `file_${hash}`);
    }
  }

  /**
   * Generate a checksum for content
   */
  protected generateChecksum(buffer: Buffer): string {
    if (stryMutAct_9fa48("3115")) {
      {}
    } else {
      stryCov_9fa48("3115");
      return createHash(stryMutAct_9fa48("3116") ? "" : (stryCov_9fa48("3116"), "md5"), buffer);
    }
  }

  /**
   * Common text cleaning for extracted content
   */
  protected cleanExtractedText(text: string): string {
    if (stryMutAct_9fa48("3117")) {
      {}
    } else {
      stryCov_9fa48("3117");
      return stryMutAct_9fa48("3118") ? text.replace(/\0/g, "") // Remove null characters
      .replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\t/g, " ") // Replace tabs with spaces
      .replace(/[ \u00A0]+/g, " ") // Normalize whitespace
      : (stryCov_9fa48("3118"), text.replace(/\0/g, stryMutAct_9fa48("3119") ? "Stryker was here!" : (stryCov_9fa48("3119"), "")) // Remove null characters
      .replace(/\r\n/g, stryMutAct_9fa48("3120") ? "" : (stryCov_9fa48("3120"), "\n")) // Normalize line endings
      .replace(/\t/g, stryMutAct_9fa48("3121") ? "" : (stryCov_9fa48("3121"), " ")) // Replace tabs with spaces
      .replace(stryMutAct_9fa48("3123") ? /[^ \u00A0]+/g : stryMutAct_9fa48("3122") ? /[ \u00A0]/g : (stryCov_9fa48("3122", "3123"), /[ \u00A0]+/g), stryMutAct_9fa48("3124") ? "" : (stryCov_9fa48("3124"), " ")) // Normalize whitespace
      .trim());
    }
  }

  /**
   * Count words in text for metadata
   */
  protected countWords(text: string): number {
    if (stryMutAct_9fa48("3125")) {
      {}
    } else {
      stryCov_9fa48("3125");
      return stryMutAct_9fa48("3126") ? text.split(/\s+/).length : (stryCov_9fa48("3126"), text.split(stryMutAct_9fa48("3128") ? /\S+/ : stryMutAct_9fa48("3127") ? /\s/ : (stryCov_9fa48("3127", "3128"), /\s+/)).filter(stryMutAct_9fa48("3129") ? () => undefined : (stryCov_9fa48("3129"), word => stryMutAct_9fa48("3133") ? word.length <= 0 : stryMutAct_9fa48("3132") ? word.length >= 0 : stryMutAct_9fa48("3131") ? false : stryMutAct_9fa48("3130") ? true : (stryCov_9fa48("3130", "3131", "3132", "3133"), word.length > 0))).length);
    }
  }

  /**
   * Count characters in text for metadata
   */
  protected countCharacters(text: string): number {
    if (stryMutAct_9fa48("3134")) {
      {}
    } else {
      stryCov_9fa48("3134");
      return text.length;
    }
  }

  /**
   * Validate processing options
   */
  protected validateOptions(options?: ProcessorOptions): ProcessorOptions {
    if (stryMutAct_9fa48("3135")) {
      {}
    } else {
      stryCov_9fa48("3135");
      return stryMutAct_9fa48("3136") ? {} : (stryCov_9fa48("3136"), {
        language: stryMutAct_9fa48("3139") ? options?.language && "en" : stryMutAct_9fa48("3138") ? false : stryMutAct_9fa48("3137") ? true : (stryCov_9fa48("3137", "3138", "3139"), (stryMutAct_9fa48("3140") ? options.language : (stryCov_9fa48("3140"), options?.language)) || (stryMutAct_9fa48("3141") ? "" : (stryCov_9fa48("3141"), "en"))),
        confidence: stryMutAct_9fa48("3144") ? options?.confidence && 0.5 : stryMutAct_9fa48("3143") ? false : stryMutAct_9fa48("3142") ? true : (stryCov_9fa48("3142", "3143", "3144"), (stryMutAct_9fa48("3145") ? options.confidence : (stryCov_9fa48("3145"), options?.confidence)) || 0.5),
        extractMetadata: stryMutAct_9fa48("3146") ? options?.extractMetadata && true : (stryCov_9fa48("3146"), (stryMutAct_9fa48("3147") ? options.extractMetadata : (stryCov_9fa48("3147"), options?.extractMetadata)) ?? (stryMutAct_9fa48("3148") ? false : (stryCov_9fa48("3148"), true))),
        skipValidation: stryMutAct_9fa48("3149") ? options?.skipValidation && false : (stryCov_9fa48("3149"), (stryMutAct_9fa48("3150") ? options.skipValidation : (stryCov_9fa48("3150"), options?.skipValidation)) ?? (stryMutAct_9fa48("3151") ? true : (stryCov_9fa48("3151"), false))),
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
    if (stryMutAct_9fa48("3152")) {
      {}
    } else {
      stryCov_9fa48("3152");
      const start = Date.now();
      const result = await fn();
      const time = stryMutAct_9fa48("3153") ? Date.now() + start : (stryCov_9fa48("3153"), Date.now() - start);
      return stryMutAct_9fa48("3154") ? {} : (stryCov_9fa48("3154"), {
        result,
        time
      });
    }
  }
}