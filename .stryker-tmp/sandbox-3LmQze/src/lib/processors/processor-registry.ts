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
  private initialized = stryMutAct_9fa48("3807") ? true : (stryCov_9fa48("3807"), false);
  constructor() {
    if (stryMutAct_9fa48("3808")) {
      {}
    } else {
      stryCov_9fa48("3808");
      this.registerDefaultProcessors();
    }
  }

  /**
   * Register a processor for one or more content types
   */
  registerProcessor(processor: ContentProcessor): void {
    if (stryMutAct_9fa48("3809")) {
      {}
    } else {
      stryCov_9fa48("3809");
      const supportedTypes = processor.getSupportedContentTypes();
      for (const contentType of supportedTypes) {
        if (stryMutAct_9fa48("3810")) {
          {}
        } else {
          stryCov_9fa48("3810");
          this.processors.set(contentType, processor);
        }
      }
    }
  }

  /**
   * Get a processor for a specific content type
   */
  getProcessor(contentType: ContentType): ContentProcessor | undefined {
    if (stryMutAct_9fa48("3811")) {
      {}
    } else {
      stryCov_9fa48("3811");
      return this.processors.get(contentType);
    }
  }

  /**
   * Process content with the appropriate processor
   */
  async processContent(buffer: Buffer, contentType: ContentType, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("3812")) {
      {}
    } else {
      stryCov_9fa48("3812");
      const processor = this.getProcessor(contentType);
      if (stryMutAct_9fa48("3815") ? false : stryMutAct_9fa48("3814") ? true : stryMutAct_9fa48("3813") ? processor : (stryCov_9fa48("3813", "3814", "3815"), !processor)) {
        if (stryMutAct_9fa48("3816")) {
          {}
        } else {
          stryCov_9fa48("3816");
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
    if (stryMutAct_9fa48("3817")) {
      {}
    } else {
      stryCov_9fa48("3817");
      const processor = this.getProcessor(contentType);
      if (stryMutAct_9fa48("3820") ? false : stryMutAct_9fa48("3819") ? true : stryMutAct_9fa48("3818") ? processor : (stryCov_9fa48("3818", "3819", "3820"), !processor)) {
        if (stryMutAct_9fa48("3821")) {
          {}
        } else {
          stryCov_9fa48("3821");
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
    if (stryMutAct_9fa48("3822")) {
      {}
    } else {
      stryCov_9fa48("3822");
      return Array.from(this.processors.keys());
    }
  }

  /**
   * Check if a content type is supported
   */
  isContentTypeSupported(contentType: ContentType): boolean {
    if (stryMutAct_9fa48("3823")) {
      {}
    } else {
      stryCov_9fa48("3823");
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
    if (stryMutAct_9fa48("3824")) {
      {}
    } else {
      stryCov_9fa48("3824");
      const info: Array<{
        contentType: ContentType;
        processorName: string;
        supported: boolean;
      }> = stryMutAct_9fa48("3825") ? ["Stryker was here"] : (stryCov_9fa48("3825"), []);

      // Check all known content types
      for (const contentType of Object.values(ContentType)) {
        if (stryMutAct_9fa48("3826")) {
          {}
        } else {
          stryCov_9fa48("3826");
          const processor = this.processors.get(contentType);
          info.push(stryMutAct_9fa48("3827") ? {} : (stryCov_9fa48("3827"), {
            contentType,
            processorName: stryMutAct_9fa48("3830") ? processor?.getProcessorName() && "None" : stryMutAct_9fa48("3829") ? false : stryMutAct_9fa48("3828") ? true : (stryCov_9fa48("3828", "3829", "3830"), (stryMutAct_9fa48("3831") ? processor.getProcessorName() : (stryCov_9fa48("3831"), processor?.getProcessorName())) || (stryMutAct_9fa48("3832") ? "" : (stryCov_9fa48("3832"), "None"))),
            supported: stryMutAct_9fa48("3835") ? processor === undefined : stryMutAct_9fa48("3834") ? false : stryMutAct_9fa48("3833") ? true : (stryCov_9fa48("3833", "3834", "3835"), processor !== undefined)
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
    if (stryMutAct_9fa48("3836")) {
      {}
    } else {
      stryCov_9fa48("3836");
      if (stryMutAct_9fa48("3838") ? false : stryMutAct_9fa48("3837") ? true : (stryCov_9fa48("3837", "3838"), this.initialized)) return;
      const initPromises: Promise<void>[] = stryMutAct_9fa48("3839") ? ["Stryker was here"] : (stryCov_9fa48("3839"), []);
      for (const processor of this.processors.values()) {
        if (stryMutAct_9fa48("3840")) {
          {}
        } else {
          stryCov_9fa48("3840");
          // Check if processor has an initialize method
          if (stryMutAct_9fa48("3843") ? typeof (processor as any).initialize !== "function" : stryMutAct_9fa48("3842") ? false : stryMutAct_9fa48("3841") ? true : (stryCov_9fa48("3841", "3842", "3843"), typeof (processor as any).initialize === (stryMutAct_9fa48("3844") ? "" : (stryCov_9fa48("3844"), "function")))) {
            if (stryMutAct_9fa48("3845")) {
              {}
            } else {
              stryCov_9fa48("3845");
              initPromises.push((processor as any).initialize());
            }
          }
        }
      }
      await Promise.all(initPromises);
      this.initialized = stryMutAct_9fa48("3846") ? false : (stryCov_9fa48("3846"), true);
    }
  }

  /**
   * Cleanup all processors that require cleanup
   */
  async cleanup(): Promise<void> {
    if (stryMutAct_9fa48("3847")) {
      {}
    } else {
      stryCov_9fa48("3847");
      const cleanupPromises: Promise<void>[] = stryMutAct_9fa48("3848") ? ["Stryker was here"] : (stryCov_9fa48("3848"), []);
      for (const processor of this.processors.values()) {
        if (stryMutAct_9fa48("3849")) {
          {}
        } else {
          stryCov_9fa48("3849");
          // Check if processor has a cleanup method
          if (stryMutAct_9fa48("3852") ? typeof (processor as any).cleanup !== "function" : stryMutAct_9fa48("3851") ? false : stryMutAct_9fa48("3850") ? true : (stryCov_9fa48("3850", "3851", "3852"), typeof (processor as any).cleanup === (stryMutAct_9fa48("3853") ? "" : (stryCov_9fa48("3853"), "function")))) {
            if (stryMutAct_9fa48("3854")) {
              {}
            } else {
              stryCov_9fa48("3854");
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
    if (stryMutAct_9fa48("3855")) {
      {}
    } else {
      stryCov_9fa48("3855");
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
    if (stryMutAct_9fa48("3856")) {
      {}
    } else {
      stryCov_9fa48("3856");
      const errorMessage = stryMutAct_9fa48("3857") ? `` : (stryCov_9fa48("3857"), `${contentType} content type is not supported`);
      const errorMetadata: ContentMetadata = stryMutAct_9fa48("3858") ? {} : (stryCov_9fa48("3858"), {
        type: contentType,
        language: stryMutAct_9fa48("3859") ? "" : (stryCov_9fa48("3859"), "unknown"),
        encoding: stryMutAct_9fa48("3860") ? "" : (stryCov_9fa48("3860"), "unknown")
      });
      return stryMutAct_9fa48("3861") ? {} : (stryCov_9fa48("3861"), {
        text: errorMessage,
        metadata: errorMetadata,
        success: stryMutAct_9fa48("3862") ? true : (stryCov_9fa48("3862"), false),
        errors: stryMutAct_9fa48("3863") ? [] : (stryCov_9fa48("3863"), [errorMessage]),
        processingTime: 0
      });
    }
  }
}

/**
 * Singleton instance of the processor registry
 */
export const contentProcessorRegistry = new ContentProcessorRegistry();