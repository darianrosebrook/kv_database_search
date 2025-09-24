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
import { createWorker, Worker } from "tesseract.js";
import { ContentType, ContentMetadata } from "../../types/index";
import { detectLanguage } from "../utils";
import * as fs from "fs";
export interface OCRMetadata {
  confidence: number;
  processingTime: number;
  language: string;
  version: string;
}
export interface OCRContentMetadata extends ContentMetadata {
  confidence: number;
  ocrMetadata?: OCRMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}
export class OCRProcessor {
  private worker: Worker | null = null;

  /**
   * Initialize the OCR worker
   */
  async initialize(): Promise<void> {
    if (stryMutAct_9fa48("3278")) {
      {}
    } else {
      stryCov_9fa48("3278");
      if (stryMutAct_9fa48("3281") ? false : stryMutAct_9fa48("3280") ? true : stryMutAct_9fa48("3279") ? this.worker : (stryCov_9fa48("3279", "3280", "3281"), !this.worker)) {
        if (stryMutAct_9fa48("3282")) {
          {}
        } else {
          stryCov_9fa48("3282");
          this.worker = await createWorker(stryMutAct_9fa48("3283") ? "" : (stryCov_9fa48("3283"), "eng")); // Default to English
        }
      }
    }
  }

  /**
   * Extract text from an image buffer
   */
  async extractTextFromBuffer(buffer: Buffer, options: {
    language?: string;
    confidence?: number;
  } = {}): Promise<{
    text: string;
    metadata: OCRContentMetadata;
  }> {
    if (stryMutAct_9fa48("3284")) {
      {}
    } else {
      stryCov_9fa48("3284");
      try {
        if (stryMutAct_9fa48("3285")) {
          {}
        } else {
          stryCov_9fa48("3285");
          await this.initialize();
          if (stryMutAct_9fa48("3288") ? false : stryMutAct_9fa48("3287") ? true : stryMutAct_9fa48("3286") ? this.worker : (stryCov_9fa48("3286", "3287", "3288"), !this.worker)) {
            if (stryMutAct_9fa48("3289")) {
              {}
            } else {
              stryCov_9fa48("3289");
              throw new Error(stryMutAct_9fa48("3290") ? "" : (stryCov_9fa48("3290"), "OCR worker not initialized"));
            }
          }

          // Load language if specified
          if (stryMutAct_9fa48("3293") ? options.language || options.language !== "eng" : stryMutAct_9fa48("3292") ? false : stryMutAct_9fa48("3291") ? true : (stryCov_9fa48("3291", "3292", "3293"), options.language && (stryMutAct_9fa48("3295") ? options.language === "eng" : stryMutAct_9fa48("3294") ? true : (stryCov_9fa48("3294", "3295"), options.language !== (stryMutAct_9fa48("3296") ? "" : (stryCov_9fa48("3296"), "eng")))))) {
            if (stryMutAct_9fa48("3297")) {
              {}
            } else {
              stryCov_9fa48("3297");
              await this.worker.setParameters(stryMutAct_9fa48("3298") ? {} : (stryCov_9fa48("3298"), {
                tessedit_ocr_engine_mode: stryMutAct_9fa48("3299") ? "" : (stryCov_9fa48("3299"), "1") // Use LSTM OCR engine
              }));
            }
          }
          const startTime = Date.now();

          // Perform OCR
          const result = await this.worker.recognize(buffer);
          const processingTime = stryMutAct_9fa48("3300") ? Date.now() + startTime : (stryCov_9fa48("3300"), Date.now() - startTime);
          const text = stryMutAct_9fa48("3301") ? result.data.text : (stryCov_9fa48("3301"), result.data.text.trim());
          const confidence = result.data.confidence;

          // Analyze extracted text
          const words = stryMutAct_9fa48("3302") ? text.split(/\s+/) : (stryCov_9fa48("3302"), text.split(stryMutAct_9fa48("3304") ? /\S+/ : stryMutAct_9fa48("3303") ? /\s/ : (stryCov_9fa48("3303", "3304"), /\s+/)).filter(stryMutAct_9fa48("3305") ? () => undefined : (stryCov_9fa48("3305"), word => stryMutAct_9fa48("3309") ? word.length <= 0 : stryMutAct_9fa48("3308") ? word.length >= 0 : stryMutAct_9fa48("3307") ? false : stryMutAct_9fa48("3306") ? true : (stryCov_9fa48("3306", "3307", "3308", "3309"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3312") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3311") ? false : stryMutAct_9fa48("3310") ? true : (stryCov_9fa48("3310", "3311", "3312"), (stryMutAct_9fa48("3315") ? text.length <= 0 : stryMutAct_9fa48("3314") ? text.length >= 0 : stryMutAct_9fa48("3313") ? true : (stryCov_9fa48("3313", "3314", "3315"), text.length > 0)) && (stryMutAct_9fa48("3318") ? words.length <= 0 : stryMutAct_9fa48("3317") ? words.length >= 0 : stryMutAct_9fa48("3316") ? true : (stryCov_9fa48("3316", "3317", "3318"), words.length > 0)));

          // Check if confidence meets minimum threshold
          const minConfidence = stryMutAct_9fa48("3321") ? options.confidence && 30 : stryMutAct_9fa48("3320") ? false : stryMutAct_9fa48("3319") ? true : (stryCov_9fa48("3319", "3320", "3321"), options.confidence || 30); // Default minimum confidence
          const isConfident = stryMutAct_9fa48("3325") ? confidence < minConfidence : stryMutAct_9fa48("3324") ? confidence > minConfidence : stryMutAct_9fa48("3323") ? false : stryMutAct_9fa48("3322") ? true : (stryCov_9fa48("3322", "3323", "3324", "3325"), confidence >= minConfidence);
          const ocrMetadata: OCRMetadata = stryMutAct_9fa48("3326") ? {} : (stryCov_9fa48("3326"), {
            confidence,
            processingTime,
            language: stryMutAct_9fa48("3329") ? options.language && "eng" : stryMutAct_9fa48("3328") ? false : stryMutAct_9fa48("3327") ? true : (stryCov_9fa48("3327", "3328", "3329"), options.language || (stryMutAct_9fa48("3330") ? "" : (stryCov_9fa48("3330"), "eng"))),
            version: stryMutAct_9fa48("3331") ? "" : (stryCov_9fa48("3331"), "tesseract.js")
          });
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3332") ? {} : (stryCov_9fa48("3332"), {
            type: ContentType.RASTER_IMAGE,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3333") ? "" : (stryCov_9fa48("3333"), "utf-8"),
            confidence,
            hasText: stryMutAct_9fa48("3336") ? hasText || isConfident : stryMutAct_9fa48("3335") ? false : stryMutAct_9fa48("3334") ? true : (stryCov_9fa48("3334", "3335", "3336"), hasText && isConfident),
            wordCount: words.length,
            characterCount: text.length,
            ocrMetadata
          });

          // Return appropriate text based on confidence
          const finalText = (stryMutAct_9fa48("3339") ? isConfident || hasText : stryMutAct_9fa48("3338") ? false : stryMutAct_9fa48("3337") ? true : (stryCov_9fa48("3337", "3338", "3339"), isConfident && hasText)) ? text : stryMutAct_9fa48("3340") ? `` : (stryCov_9fa48("3340"), `Image OCR: ${hasText ? stryMutAct_9fa48("3341") ? `` : (stryCov_9fa48("3341"), `Low confidence (${confidence.toFixed(1)}%)`) : stryMutAct_9fa48("3342") ? "" : (stryCov_9fa48("3342"), "No text detected")}`);
          return stryMutAct_9fa48("3343") ? {} : (stryCov_9fa48("3343"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3344")) {
          {}
        } else {
          stryCov_9fa48("3344");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3345") ? {} : (stryCov_9fa48("3345"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("3346") ? "" : (stryCov_9fa48("3346"), "unknown"),
            encoding: stryMutAct_9fa48("3347") ? "" : (stryCov_9fa48("3347"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("3348") ? true : (stryCov_9fa48("3348"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3349") ? {} : (stryCov_9fa48("3349"), {
            text: stryMutAct_9fa48("3350") ? `` : (stryCov_9fa48("3350"), `Image OCR Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from an image file
   */
  async extractTextFromFile(filePath: string, options: {
    language?: string;
    confidence?: number;
  } = {}): Promise<{
    text: string;
    metadata: OCRContentMetadata;
  }> {
    if (stryMutAct_9fa48("3351")) {
      {}
    } else {
      stryCov_9fa48("3351");
      try {
        if (stryMutAct_9fa48("3352")) {
          {}
        } else {
          stryCov_9fa48("3352");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3353")) {
          {}
        } else {
          stryCov_9fa48("3353");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3354") ? {} : (stryCov_9fa48("3354"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("3355") ? "" : (stryCov_9fa48("3355"), "unknown"),
            encoding: stryMutAct_9fa48("3356") ? "" : (stryCov_9fa48("3356"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("3357") ? true : (stryCov_9fa48("3357"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3358") ? {} : (stryCov_9fa48("3358"), {
            text: stryMutAct_9fa48("3359") ? `` : (stryCov_9fa48("3359"), `Image OCR Error: Failed to read file - ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Check if an image format is supported for OCR
   */
  isSupportedImage(buffer: Buffer): boolean {
    if (stryMutAct_9fa48("3360")) {
      {}
    } else {
      stryCov_9fa48("3360");
      // Check common image signatures
      const signatures = stryMutAct_9fa48("3361") ? [] : (stryCov_9fa48("3361"), [Buffer.from(stryMutAct_9fa48("3362") ? [] : (stryCov_9fa48("3362"), [0xff, 0xd8, 0xff])),
      // JPEG
      Buffer.from(stryMutAct_9fa48("3363") ? [] : (stryCov_9fa48("3363"), [0x89, 0x50, 0x4e, 0x47])),
      // PNG
      Buffer.from(stryMutAct_9fa48("3364") ? [] : (stryCov_9fa48("3364"), [0x42, 0x4d])),
      // BMP
      Buffer.from(stryMutAct_9fa48("3365") ? [] : (stryCov_9fa48("3365"), [0x49, 0x49, 0x2a, 0x00])),
      // TIFF (little-endian)
      Buffer.from(stryMutAct_9fa48("3366") ? [] : (stryCov_9fa48("3366"), [0x4d, 0x4d, 0x00, 0x2a])),
      // TIFF (big-endian)
      Buffer.from(stryMutAct_9fa48("3367") ? [] : (stryCov_9fa48("3367"), [0x52, 0x49, 0x46, 0x46])) // WEBP (starts with RIFF)
      ]);
      return stryMutAct_9fa48("3368") ? signatures.every(signature => buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("3368"), signatures.some(stryMutAct_9fa48("3369") ? () => undefined : (stryCov_9fa48("3369"), signature => buffer.subarray(0, signature.length).equals(signature))));
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (stryMutAct_9fa48("3370")) {
      {}
    } else {
      stryCov_9fa48("3370");
      if (stryMutAct_9fa48("3372") ? false : stryMutAct_9fa48("3371") ? true : (stryCov_9fa48("3371", "3372"), this.worker)) {
        if (stryMutAct_9fa48("3373")) {
          {}
        } else {
          stryCov_9fa48("3373");
          await this.worker.terminate();
          this.worker = null;
        }
      }
    }
  }

  /**
   * Get supported languages (basic list)
   */
  getSupportedLanguages(): string[] {
    if (stryMutAct_9fa48("3374")) {
      {}
    } else {
      stryCov_9fa48("3374");
      return stryMutAct_9fa48("3375") ? [] : (stryCov_9fa48("3375"), [stryMutAct_9fa48("3376") ? "" : (stryCov_9fa48("3376"), "eng"), // English
      stryMutAct_9fa48("3377") ? "" : (stryCov_9fa48("3377"), "spa"), // Spanish
      stryMutAct_9fa48("3378") ? "" : (stryCov_9fa48("3378"), "fra"), // French
      stryMutAct_9fa48("3379") ? "" : (stryCov_9fa48("3379"), "deu"), // German
      stryMutAct_9fa48("3380") ? "" : (stryCov_9fa48("3380"), "ita"), // Italian
      stryMutAct_9fa48("3381") ? "" : (stryCov_9fa48("3381"), "por"), // Portuguese
      stryMutAct_9fa48("3382") ? "" : (stryCov_9fa48("3382"), "rus"), // Russian
      stryMutAct_9fa48("3383") ? "" : (stryCov_9fa48("3383"), "ara"), // Arabic
      stryMutAct_9fa48("3384") ? "" : (stryCov_9fa48("3384"), "chi_sim"), // Chinese Simplified
      stryMutAct_9fa48("3385") ? "" : (stryCov_9fa48("3385"), "jpn") // Japanese
      ]);
    }
  }
}