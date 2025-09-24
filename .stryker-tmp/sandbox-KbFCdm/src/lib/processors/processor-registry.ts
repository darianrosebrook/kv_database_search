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
import { ContentProcessor, ProcessorOptions, ProcessorResult } from "./base-processor";
import { PDFProcessor } from "./pdf-processor";
import { OCRProcessor } from "./ocr-processor";
import { OfficeProcessor } from "./office-processor";
import { SpeechProcessor } from "./speech-processor";

/**
 * Registry for managing all content processors
 */
export class ContentProcessorRegistry {
  private processors: Map<ContentType, ContentProcessor> = new Map();
  private initialized = stryMutAct_9fa48("3703") ? true : (stryCov_9fa48("3703"), false);
  constructor() {
    if (stryMutAct_9fa48("3704")) {
      {}
    } else {
      stryCov_9fa48("3704");
      this.registerDefaultProcessors();
    }
  }

  /**
   * Register a processor for one or more content types
   */
  registerProcessor(processor: ContentProcessor): void {
    if (stryMutAct_9fa48("3705")) {
      {}
    } else {
      stryCov_9fa48("3705");
      const supportedTypes = processor.getSupportedContentTypes();
      for (const contentType of supportedTypes) {
        if (stryMutAct_9fa48("3706")) {
          {}
        } else {
          stryCov_9fa48("3706");
          this.processors.set(contentType, processor);
        }
      }
    }
  }

  /**
   * Get a processor for a specific content type
   */
  getProcessor(contentType: ContentType): ContentProcessor | undefined {
    if (stryMutAct_9fa48("3707")) {
      {}
    } else {
      stryCov_9fa48("3707");
      return this.processors.get(contentType);
    }
  }

  /**
   * Process content with the appropriate processor
   */
  async processContent(buffer: Buffer, contentType: ContentType, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("3708")) {
      {}
    } else {
      stryCov_9fa48("3708");
      const processor = this.getProcessor(contentType);
      if (stryMutAct_9fa48("3711") ? false : stryMutAct_9fa48("3710") ? true : stryMutAct_9fa48("3709") ? processor : (stryCov_9fa48("3709", "3710", "3711"), !processor)) {
        if (stryMutAct_9fa48("3712")) {
          {}
        } else {
          stryCov_9fa48("3712");
          return this.createUnsupportedResult(contentType);
        }
      }
      return await processor.extractFromBuffer(buffer, options);
    }
  }

  /**
   * Process a file with the appropriate processor
   */
  async processFile(filePath: string, contentType: ContentType, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("3713")) {
      {}
    } else {
      stryCov_9fa48("3713");
      const processor = this.getProcessor(contentType);
      if (stryMutAct_9fa48("3716") ? false : stryMutAct_9fa48("3715") ? true : stryMutAct_9fa48("3714") ? processor : (stryCov_9fa48("3714", "3715", "3716"), !processor)) {
        if (stryMutAct_9fa48("3717")) {
          {}
        } else {
          stryCov_9fa48("3717");
          return this.createUnsupportedResult(contentType);
        }
      }
      return await processor.extractFromFile(filePath, options);
    }
  }

  /**
   * Get all supported content types
   */
  getSupportedContentTypes(): ContentType[] {
    if (stryMutAct_9fa48("3718")) {
      {}
    } else {
      stryCov_9fa48("3718");
      return Array.from(this.processors.keys());
    }
  }

  /**
   * Check if a content type is supported
   */
  isContentTypeSupported(contentType: ContentType): boolean {
    if (stryMutAct_9fa48("3719")) {
      {}
    } else {
      stryCov_9fa48("3719");
      return this.processors.has(contentType);
    }
  }

  /**
   * Get processor information
   */
  getProcessorInfo(): Array<{
    contentType: ContentType;
    processorName: string;
    supported: boolean;
  }> {
    if (stryMutAct_9fa48("3720")) {
      {}
    } else {
      stryCov_9fa48("3720");
      const info: Array<{
        contentType: ContentType;
        processorName: string;
        supported: boolean;
      }> = stryMutAct_9fa48("3721") ? ["Stryker was here"] : (stryCov_9fa48("3721"), []);

      // Check all known content types
      for (const contentType of Object.values(ContentType)) {
        if (stryMutAct_9fa48("3722")) {
          {}
        } else {
          stryCov_9fa48("3722");
          const processor = this.processors.get(contentType);
          info.push(stryMutAct_9fa48("3723") ? {} : (stryCov_9fa48("3723"), {
            contentType,
            processorName: stryMutAct_9fa48("3726") ? processor?.getProcessorName() && "None" : stryMutAct_9fa48("3725") ? false : stryMutAct_9fa48("3724") ? true : (stryCov_9fa48("3724", "3725", "3726"), (stryMutAct_9fa48("3727") ? processor.getProcessorName() : (stryCov_9fa48("3727"), processor?.getProcessorName())) || (stryMutAct_9fa48("3728") ? "" : (stryCov_9fa48("3728"), "None"))),
            supported: stryMutAct_9fa48("3731") ? processor === undefined : stryMutAct_9fa48("3730") ? false : stryMutAct_9fa48("3729") ? true : (stryCov_9fa48("3729", "3730", "3731"), processor !== undefined)
          }));
        }
      }
      return info;
    }
  }

  /**
   * Initialize all processors that require initialization
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("3732")) {
      {}
    } else {
      stryCov_9fa48("3732");
      if (stryMutAct_9fa48("3734") ? false : stryMutAct_9fa48("3733") ? true : (stryCov_9fa48("3733", "3734"), this.initialized)) return;
      const initPromises: Promise<void>[] = stryMutAct_9fa48("3735") ? ["Stryker was here"] : (stryCov_9fa48("3735"), []);
      for (const processor of this.processors.values()) {
        if (stryMutAct_9fa48("3736")) {
          {}
        } else {
          stryCov_9fa48("3736");
          // Check if processor has an initialize method
          if (stryMutAct_9fa48("3739") ? typeof (processor as any).initialize !== "function" : stryMutAct_9fa48("3738") ? false : stryMutAct_9fa48("3737") ? true : (stryCov_9fa48("3737", "3738", "3739"), typeof (processor as any).initialize === (stryMutAct_9fa48("3740") ? "" : (stryCov_9fa48("3740"), "function")))) {
            if (stryMutAct_9fa48("3741")) {
              {}
            } else {
              stryCov_9fa48("3741");
              initPromises.push((processor as any).initialize());
            }
          }
        }
      }
      await Promise.all(initPromises);
      this.initialized = stryMutAct_9fa48("3742") ? false : (stryCov_9fa48("3742"), true);
    }
  }

  /**
   * Cleanup all processors that require cleanup
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("3743")) {
      {}
    } else {
      stryCov_9fa48("3743");
      const cleanupPromises: Promise<void>[] = stryMutAct_9fa48("3744") ? ["Stryker was here"] : (stryCov_9fa48("3744"), []);
      for (const processor of this.processors.values()) {
        if (stryMutAct_9fa48("3745")) {
          {}
        } else {
          stryCov_9fa48("3745");
          // Check if processor has a cleanup method
          if (stryMutAct_9fa48("3748") ? typeof (processor as any).cleanup !== "function" : stryMutAct_9fa48("3747") ? false : stryMutAct_9fa48("3746") ? true : (stryCov_9fa48("3746", "3747", "3748"), typeof (processor as any).cleanup === (stryMutAct_9fa48("3749") ? "" : (stryCov_9fa48("3749"), "function")))) {
            if (stryMutAct_9fa48("3750")) {
              {}
            } else {
              stryCov_9fa48("3750");
              cleanupPromises.push((processor as any).cleanup());
            }
          }
        }
      }
      await Promise.all(cleanupPromises);
    }
  }

  /**
   * Register all default processors
   */
  private registerDefaultProcessors(): void {
    if (stryMutAct_9fa48("3751")) {
      {}
    } else {
      stryCov_9fa48("3751");
      this.registerProcessor(new PDFProcessor());
      this.registerProcessor(new OCRProcessor());
      this.registerProcessor(new OfficeProcessor());
      this.registerProcessor(new SpeechProcessor());
    }
  }

  /**
   * Create a result for unsupported content types
   */
  private createUnsupportedResult(contentType: ContentType): ProcessorResult {
    if (stryMutAct_9fa48("3752")) {
      {}
    } else {
      stryCov_9fa48("3752");
      const errorMessage = stryMutAct_9fa48("3753") ? `` : (stryCov_9fa48("3753"), `${contentType} content type is not supported`);
      const errorMetadata: ContentMetadata = stryMutAct_9fa48("3754") ? {} : (stryCov_9fa48("3754"), {
        type: contentType,
        language: stryMutAct_9fa48("3755") ? "" : (stryCov_9fa48("3755"), "unknown"),
        encoding: stryMutAct_9fa48("3756") ? "" : (stryCov_9fa48("3756"), "unknown")
      });
      return stryMutAct_9fa48("3757") ? {} : (stryCov_9fa48("3757"), {
        text: errorMessage,
        metadata: errorMetadata,
        success: stryMutAct_9fa48("3758") ? true : (stryCov_9fa48("3758"), false),
        errors: stryMutAct_9fa48("3759") ? [] : (stryCov_9fa48("3759"), [errorMessage]),
        processingTime: 0
      });
    }
  }
}

/**
 * Singleton instance of the processor registry
 */
export const contentProcessorRegistry = new ContentProcessorRegistry();