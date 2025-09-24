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
    if (stryMutAct_9fa48("3382")) {
      {}
    } else {
      stryCov_9fa48("3382");
      if (stryMutAct_9fa48("3385") ? false : stryMutAct_9fa48("3384") ? true : stryMutAct_9fa48("3383") ? this.worker : (stryCov_9fa48("3383", "3384", "3385"), !this.worker)) {
        if (stryMutAct_9fa48("3386")) {
          {}
        } else {
          stryCov_9fa48("3386");
          this.worker = await createWorker(stryMutAct_9fa48("3387") ? "" : (stryCov_9fa48("3387"), "eng")); // Default to English
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
    if (stryMutAct_9fa48("3388")) {
      {}
    } else {
      stryCov_9fa48("3388");
      try {
        if (stryMutAct_9fa48("3389")) {
          {}
        } else {
          stryCov_9fa48("3389");
          await this.initialize();
          if (stryMutAct_9fa48("3392") ? false : stryMutAct_9fa48("3391") ? true : stryMutAct_9fa48("3390") ? this.worker : (stryCov_9fa48("3390", "3391", "3392"), !this.worker)) {
            if (stryMutAct_9fa48("3393")) {
              {}
            } else {
              stryCov_9fa48("3393");
              throw new Error(stryMutAct_9fa48("3394") ? "" : (stryCov_9fa48("3394"), "OCR worker not initialized"));
            }
          }

          // Load language if specified
          if (stryMutAct_9fa48("3397") ? options.language || options.language !== "eng" : stryMutAct_9fa48("3396") ? false : stryMutAct_9fa48("3395") ? true : (stryCov_9fa48("3395", "3396", "3397"), options.language && (stryMutAct_9fa48("3399") ? options.language === "eng" : stryMutAct_9fa48("3398") ? true : (stryCov_9fa48("3398", "3399"), options.language !== (stryMutAct_9fa48("3400") ? "" : (stryCov_9fa48("3400"), "eng")))))) {
            if (stryMutAct_9fa48("3401")) {
              {}
            } else {
              stryCov_9fa48("3401");
              await this.worker.setParameters(stryMutAct_9fa48("3402") ? {} : (stryCov_9fa48("3402"), {
                tessedit_ocr_engine_mode: stryMutAct_9fa48("3403") ? "" : (stryCov_9fa48("3403"), "1") // Use LSTM OCR engine
              }));
            }
          }
          const startTime = Date.now();

          // Perform OCR
          const result = await this.worker.recognize(buffer);
          const processingTime = stryMutAct_9fa48("3404") ? Date.now() + startTime : (stryCov_9fa48("3404"), Date.now() - startTime);
          const text = stryMutAct_9fa48("3405") ? result.data.text : (stryCov_9fa48("3405"), result.data.text.trim());
          const confidence = result.data.confidence;

          // Analyze extracted text
          const words = stryMutAct_9fa48("3406") ? text.split(/\s+/) : (stryCov_9fa48("3406"), text.split(stryMutAct_9fa48("3408") ? /\S+/ : stryMutAct_9fa48("3407") ? /\s/ : (stryCov_9fa48("3407", "3408"), /\s+/)).filter(stryMutAct_9fa48("3409") ? () => undefined : (stryCov_9fa48("3409"), word => stryMutAct_9fa48("3413") ? word.length <= 0 : stryMutAct_9fa48("3412") ? word.length >= 0 : stryMutAct_9fa48("3411") ? false : stryMutAct_9fa48("3410") ? true : (stryCov_9fa48("3410", "3411", "3412", "3413"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3416") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3415") ? false : stryMutAct_9fa48("3414") ? true : (stryCov_9fa48("3414", "3415", "3416"), (stryMutAct_9fa48("3419") ? text.length <= 0 : stryMutAct_9fa48("3418") ? text.length >= 0 : stryMutAct_9fa48("3417") ? true : (stryCov_9fa48("3417", "3418", "3419"), text.length > 0)) && (stryMutAct_9fa48("3422") ? words.length <= 0 : stryMutAct_9fa48("3421") ? words.length >= 0 : stryMutAct_9fa48("3420") ? true : (stryCov_9fa48("3420", "3421", "3422"), words.length > 0)));

          // Check if confidence meets minimum threshold
          const minConfidence = stryMutAct_9fa48("3425") ? options.confidence && 30 : stryMutAct_9fa48("3424") ? false : stryMutAct_9fa48("3423") ? true : (stryCov_9fa48("3423", "3424", "3425"), options.confidence || 30); // Default minimum confidence
          const isConfident = stryMutAct_9fa48("3429") ? confidence < minConfidence : stryMutAct_9fa48("3428") ? confidence > minConfidence : stryMutAct_9fa48("3427") ? false : stryMutAct_9fa48("3426") ? true : (stryCov_9fa48("3426", "3427", "3428", "3429"), confidence >= minConfidence);
          const ocrMetadata: OCRMetadata = stryMutAct_9fa48("3430") ? {} : (stryCov_9fa48("3430"), {
            confidence,
            processingTime,
            language: stryMutAct_9fa48("3433") ? options.language && "eng" : stryMutAct_9fa48("3432") ? false : stryMutAct_9fa48("3431") ? true : (stryCov_9fa48("3431", "3432", "3433"), options.language || (stryMutAct_9fa48("3434") ? "" : (stryCov_9fa48("3434"), "eng"))),
            version: stryMutAct_9fa48("3435") ? "" : (stryCov_9fa48("3435"), "tesseract.js")
          });
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3436") ? {} : (stryCov_9fa48("3436"), {
            type: ContentType.RASTER_IMAGE,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3437") ? "" : (stryCov_9fa48("3437"), "utf-8"),
            confidence,
            hasText: stryMutAct_9fa48("3440") ? hasText || isConfident : stryMutAct_9fa48("3439") ? false : stryMutAct_9fa48("3438") ? true : (stryCov_9fa48("3438", "3439", "3440"), hasText && isConfident),
            wordCount: words.length,
            characterCount: text.length,
            ocrMetadata
          });

          // Return appropriate text based on confidence
          const finalText = (stryMutAct_9fa48("3443") ? isConfident || hasText : stryMutAct_9fa48("3442") ? false : stryMutAct_9fa48("3441") ? true : (stryCov_9fa48("3441", "3442", "3443"), isConfident && hasText)) ? text : stryMutAct_9fa48("3444") ? `` : (stryCov_9fa48("3444"), `Image OCR: ${hasText ? stryMutAct_9fa48("3445") ? `` : (stryCov_9fa48("3445"), `Low confidence (${confidence.toFixed(1)}%)`) : stryMutAct_9fa48("3446") ? "" : (stryCov_9fa48("3446"), "No text detected")}`);
          return stryMutAct_9fa48("3447") ? {} : (stryCov_9fa48("3447"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3448")) {
          {}
        } else {
          stryCov_9fa48("3448");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3449") ? {} : (stryCov_9fa48("3449"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("3450") ? "" : (stryCov_9fa48("3450"), "unknown"),
            encoding: stryMutAct_9fa48("3451") ? "" : (stryCov_9fa48("3451"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("3452") ? true : (stryCov_9fa48("3452"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3453") ? {} : (stryCov_9fa48("3453"), {
            text: stryMutAct_9fa48("3454") ? `` : (stryCov_9fa48("3454"), `Image OCR Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3455")) {
      {}
    } else {
      stryCov_9fa48("3455");
      try {
        if (stryMutAct_9fa48("3456")) {
          {}
        } else {
          stryCov_9fa48("3456");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3457")) {
          {}
        } else {
          stryCov_9fa48("3457");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("3458") ? {} : (stryCov_9fa48("3458"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("3459") ? "" : (stryCov_9fa48("3459"), "unknown"),
            encoding: stryMutAct_9fa48("3460") ? "" : (stryCov_9fa48("3460"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("3461") ? true : (stryCov_9fa48("3461"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3462") ? {} : (stryCov_9fa48("3462"), {
            text: stryMutAct_9fa48("3463") ? `` : (stryCov_9fa48("3463"), `Image OCR Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("3464")) {
      {}
    } else {
      stryCov_9fa48("3464");
      // Check common image signatures
      const signatures = stryMutAct_9fa48("3465") ? [] : (stryCov_9fa48("3465"), [Buffer.from(stryMutAct_9fa48("3466") ? [] : (stryCov_9fa48("3466"), [0xff, 0xd8, 0xff])),
      // JPEG
      Buffer.from(stryMutAct_9fa48("3467") ? [] : (stryCov_9fa48("3467"), [0x89, 0x50, 0x4e, 0x47])),
      // PNG
      Buffer.from(stryMutAct_9fa48("3468") ? [] : (stryCov_9fa48("3468"), [0x42, 0x4d])),
      // BMP
      Buffer.from(stryMutAct_9fa48("3469") ? [] : (stryCov_9fa48("3469"), [0x49, 0x49, 0x2a, 0x00])),
      // TIFF (little-endian)
      Buffer.from(stryMutAct_9fa48("3470") ? [] : (stryCov_9fa48("3470"), [0x4d, 0x4d, 0x00, 0x2a])),
      // TIFF (big-endian)
      Buffer.from(stryMutAct_9fa48("3471") ? [] : (stryCov_9fa48("3471"), [0x52, 0x49, 0x46, 0x46])) // WEBP (starts with RIFF)
      ]);
      return stryMutAct_9fa48("3472") ? signatures.every(signature => buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("3472"), signatures.some(stryMutAct_9fa48("3473") ? () => undefined : (stryCov_9fa48("3473"), signature => buffer.subarray(0, signature.length).equals(signature))));
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (stryMutAct_9fa48("3474")) {
      {}
    } else {
      stryCov_9fa48("3474");
      if (stryMutAct_9fa48("3476") ? false : stryMutAct_9fa48("3475") ? true : (stryCov_9fa48("3475", "3476"), this.worker)) {
        if (stryMutAct_9fa48("3477")) {
          {}
        } else {
          stryCov_9fa48("3477");
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
    if (stryMutAct_9fa48("3478")) {
      {}
    } else {
      stryCov_9fa48("3478");
      return stryMutAct_9fa48("3479") ? [] : (stryCov_9fa48("3479"), [stryMutAct_9fa48("3480") ? "" : (stryCov_9fa48("3480"), "eng"), // English
      stryMutAct_9fa48("3481") ? "" : (stryCov_9fa48("3481"), "spa"), // Spanish
      stryMutAct_9fa48("3482") ? "" : (stryCov_9fa48("3482"), "fra"), // French
      stryMutAct_9fa48("3483") ? "" : (stryCov_9fa48("3483"), "deu"), // German
      stryMutAct_9fa48("3484") ? "" : (stryCov_9fa48("3484"), "ita"), // Italian
      stryMutAct_9fa48("3485") ? "" : (stryCov_9fa48("3485"), "por"), // Portuguese
      stryMutAct_9fa48("3486") ? "" : (stryCov_9fa48("3486"), "rus"), // Russian
      stryMutAct_9fa48("3487") ? "" : (stryCov_9fa48("3487"), "ara"), // Arabic
      stryMutAct_9fa48("3488") ? "" : (stryCov_9fa48("3488"), "chi_sim"), // Chinese Simplified
      stryMutAct_9fa48("3489") ? "" : (stryCov_9fa48("3489"), "jpn") // Japanese
      ]);
    }
  }
}