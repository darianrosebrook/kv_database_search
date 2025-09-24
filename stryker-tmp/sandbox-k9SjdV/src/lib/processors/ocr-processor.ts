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
import { ContentType, ContentMetadata } from "../multi-modal.js";
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
    if (stryMutAct_9fa48("501")) {
      {}
    } else {
      stryCov_9fa48("501");
      if (stryMutAct_9fa48("504") ? false : stryMutAct_9fa48("503") ? true : stryMutAct_9fa48("502") ? this.worker : (stryCov_9fa48("502", "503", "504"), !this.worker)) {
        if (stryMutAct_9fa48("505")) {
          {}
        } else {
          stryCov_9fa48("505");
          this.worker = await createWorker(stryMutAct_9fa48("506") ? "" : (stryCov_9fa48("506"), "eng")); // Default to English
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
    if (stryMutAct_9fa48("507")) {
      {}
    } else {
      stryCov_9fa48("507");
      try {
        if (stryMutAct_9fa48("508")) {
          {}
        } else {
          stryCov_9fa48("508");
          await this.initialize();
          if (stryMutAct_9fa48("511") ? false : stryMutAct_9fa48("510") ? true : stryMutAct_9fa48("509") ? this.worker : (stryCov_9fa48("509", "510", "511"), !this.worker)) {
            if (stryMutAct_9fa48("512")) {
              {}
            } else {
              stryCov_9fa48("512");
              throw new Error(stryMutAct_9fa48("513") ? "" : (stryCov_9fa48("513"), "OCR worker not initialized"));
            }
          }

          // Load language if specified
          if (stryMutAct_9fa48("516") ? options.language || options.language !== "eng" : stryMutAct_9fa48("515") ? false : stryMutAct_9fa48("514") ? true : (stryCov_9fa48("514", "515", "516"), options.language && (stryMutAct_9fa48("518") ? options.language === "eng" : stryMutAct_9fa48("517") ? true : (stryCov_9fa48("517", "518"), options.language !== (stryMutAct_9fa48("519") ? "" : (stryCov_9fa48("519"), "eng")))))) {
            if (stryMutAct_9fa48("520")) {
              {}
            } else {
              stryCov_9fa48("520");
              await this.worker.setParameters(stryMutAct_9fa48("521") ? {} : (stryCov_9fa48("521"), {
                tessedit_ocr_engine_mode: stryMutAct_9fa48("522") ? "" : (stryCov_9fa48("522"), "1") // Use LSTM OCR engine
              }));
            }
          }
          const startTime = Date.now();

          // Perform OCR
          const result = await this.worker.recognize(buffer);
          const processingTime = stryMutAct_9fa48("523") ? Date.now() + startTime : (stryCov_9fa48("523"), Date.now() - startTime);
          const text = stryMutAct_9fa48("524") ? result.data.text : (stryCov_9fa48("524"), result.data.text.trim());
          const confidence = result.data.confidence;

          // Analyze extracted text
          const words = stryMutAct_9fa48("525") ? text.split(/\s+/) : (stryCov_9fa48("525"), text.split(stryMutAct_9fa48("527") ? /\S+/ : stryMutAct_9fa48("526") ? /\s/ : (stryCov_9fa48("526", "527"), /\s+/)).filter(stryMutAct_9fa48("528") ? () => undefined : (stryCov_9fa48("528"), word => stryMutAct_9fa48("532") ? word.length <= 0 : stryMutAct_9fa48("531") ? word.length >= 0 : stryMutAct_9fa48("530") ? false : stryMutAct_9fa48("529") ? true : (stryCov_9fa48("529", "530", "531", "532"), word.length > 0))));
          const hasText = stryMutAct_9fa48("535") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("534") ? false : stryMutAct_9fa48("533") ? true : (stryCov_9fa48("533", "534", "535"), (stryMutAct_9fa48("538") ? text.length <= 0 : stryMutAct_9fa48("537") ? text.length >= 0 : stryMutAct_9fa48("536") ? true : (stryCov_9fa48("536", "537", "538"), text.length > 0)) && (stryMutAct_9fa48("541") ? words.length <= 0 : stryMutAct_9fa48("540") ? words.length >= 0 : stryMutAct_9fa48("539") ? true : (stryCov_9fa48("539", "540", "541"), words.length > 0)));

          // Check if confidence meets minimum threshold
          const minConfidence = stryMutAct_9fa48("544") ? options.confidence && 30 : stryMutAct_9fa48("543") ? false : stryMutAct_9fa48("542") ? true : (stryCov_9fa48("542", "543", "544"), options.confidence || 30); // Default minimum confidence
          const isConfident = stryMutAct_9fa48("548") ? confidence < minConfidence : stryMutAct_9fa48("547") ? confidence > minConfidence : stryMutAct_9fa48("546") ? false : stryMutAct_9fa48("545") ? true : (stryCov_9fa48("545", "546", "547", "548"), confidence >= minConfidence);
          const ocrMetadata: OCRMetadata = stryMutAct_9fa48("549") ? {} : (stryCov_9fa48("549"), {
            confidence,
            processingTime,
            language: stryMutAct_9fa48("552") ? options.language && "eng" : stryMutAct_9fa48("551") ? false : stryMutAct_9fa48("550") ? true : (stryCov_9fa48("550", "551", "552"), options.language || (stryMutAct_9fa48("553") ? "" : (stryCov_9fa48("553"), "eng"))),
            version: stryMutAct_9fa48("554") ? "" : (stryCov_9fa48("554"), "tesseract.js")
          });
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("555") ? {} : (stryCov_9fa48("555"), {
            type: ContentType.RASTER_IMAGE,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("556") ? "" : (stryCov_9fa48("556"), "utf-8"),
            confidence,
            hasText: stryMutAct_9fa48("559") ? hasText || isConfident : stryMutAct_9fa48("558") ? false : stryMutAct_9fa48("557") ? true : (stryCov_9fa48("557", "558", "559"), hasText && isConfident),
            wordCount: words.length,
            characterCount: text.length,
            ocrMetadata
          });

          // Return appropriate text based on confidence
          const finalText = (stryMutAct_9fa48("562") ? isConfident || hasText : stryMutAct_9fa48("561") ? false : stryMutAct_9fa48("560") ? true : (stryCov_9fa48("560", "561", "562"), isConfident && hasText)) ? text : stryMutAct_9fa48("563") ? `` : (stryCov_9fa48("563"), `Image OCR: ${hasText ? stryMutAct_9fa48("564") ? `` : (stryCov_9fa48("564"), `Low confidence (${confidence.toFixed(1)}%)`) : stryMutAct_9fa48("565") ? "" : (stryCov_9fa48("565"), "No text detected")}`);
          return stryMutAct_9fa48("566") ? {} : (stryCov_9fa48("566"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("567")) {
          {}
        } else {
          stryCov_9fa48("567");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("568") ? {} : (stryCov_9fa48("568"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("569") ? "" : (stryCov_9fa48("569"), "unknown"),
            encoding: stryMutAct_9fa48("570") ? "" : (stryCov_9fa48("570"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("571") ? true : (stryCov_9fa48("571"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("572") ? {} : (stryCov_9fa48("572"), {
            text: stryMutAct_9fa48("573") ? `` : (stryCov_9fa48("573"), `Image OCR Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("574")) {
      {}
    } else {
      stryCov_9fa48("574");
      try {
        if (stryMutAct_9fa48("575")) {
          {}
        } else {
          stryCov_9fa48("575");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("576")) {
          {}
        } else {
          stryCov_9fa48("576");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("577") ? {} : (stryCov_9fa48("577"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("578") ? "" : (stryCov_9fa48("578"), "unknown"),
            encoding: stryMutAct_9fa48("579") ? "" : (stryCov_9fa48("579"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("580") ? true : (stryCov_9fa48("580"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("581") ? {} : (stryCov_9fa48("581"), {
            text: stryMutAct_9fa48("582") ? `` : (stryCov_9fa48("582"), `Image OCR Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("583")) {
      {}
    } else {
      stryCov_9fa48("583");
      // Check common image signatures
      const signatures = stryMutAct_9fa48("584") ? [] : (stryCov_9fa48("584"), [Buffer.from(stryMutAct_9fa48("585") ? [] : (stryCov_9fa48("585"), [0xff, 0xd8, 0xff])),
      // JPEG
      Buffer.from(stryMutAct_9fa48("586") ? [] : (stryCov_9fa48("586"), [0x89, 0x50, 0x4e, 0x47])),
      // PNG
      Buffer.from(stryMutAct_9fa48("587") ? [] : (stryCov_9fa48("587"), [0x42, 0x4d])),
      // BMP
      Buffer.from(stryMutAct_9fa48("588") ? [] : (stryCov_9fa48("588"), [0x49, 0x49, 0x2a, 0x00])),
      // TIFF (little-endian)
      Buffer.from(stryMutAct_9fa48("589") ? [] : (stryCov_9fa48("589"), [0x4d, 0x4d, 0x00, 0x2a])),
      // TIFF (big-endian)
      Buffer.from(stryMutAct_9fa48("590") ? [] : (stryCov_9fa48("590"), [0x52, 0x49, 0x46, 0x46])) // WEBP (starts with RIFF)
      ]);
      return stryMutAct_9fa48("591") ? signatures.every(signature => buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("591"), signatures.some(stryMutAct_9fa48("592") ? () => undefined : (stryCov_9fa48("592"), signature => buffer.subarray(0, signature.length).equals(signature))));
    }
  }

  /**
   * Detect language from OCR text (simple heuristic)
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("593")) {
      {}
    } else {
      stryCov_9fa48("593");
      if (stryMutAct_9fa48("596") ? !text && text.length === 0 : stryMutAct_9fa48("595") ? false : stryMutAct_9fa48("594") ? true : (stryCov_9fa48("594", "595", "596"), (stryMutAct_9fa48("597") ? text : (stryCov_9fa48("597"), !text)) || (stryMutAct_9fa48("599") ? text.length !== 0 : stryMutAct_9fa48("598") ? false : (stryCov_9fa48("598", "599"), text.length === 0)))) return stryMutAct_9fa48("600") ? "" : (stryCov_9fa48("600"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("603") ? text.match(englishWords) && [] : stryMutAct_9fa48("602") ? false : stryMutAct_9fa48("601") ? true : (stryCov_9fa48("601", "602", "603"), text.match(englishWords) || (stryMutAct_9fa48("604") ? ["Stryker was here"] : (stryCov_9fa48("604"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("607") ? text.match(spanishWords) && [] : stryMutAct_9fa48("606") ? false : stryMutAct_9fa48("605") ? true : (stryCov_9fa48("605", "606", "607"), text.match(spanishWords) || (stryMutAct_9fa48("608") ? ["Stryker was here"] : (stryCov_9fa48("608"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("611") ? text.match(frenchWords) && [] : stryMutAct_9fa48("610") ? false : stryMutAct_9fa48("609") ? true : (stryCov_9fa48("609", "610", "611"), text.match(frenchWords) || (stryMutAct_9fa48("612") ? ["Stryker was here"] : (stryCov_9fa48("612"), [])))).length;
      const maxMatches = stryMutAct_9fa48("613") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("613"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("616") ? maxMatches !== 0 : stryMutAct_9fa48("615") ? false : stryMutAct_9fa48("614") ? true : (stryCov_9fa48("614", "615", "616"), maxMatches === 0)) return stryMutAct_9fa48("617") ? "" : (stryCov_9fa48("617"), "unknown");
      if (stryMutAct_9fa48("620") ? maxMatches !== englishMatches : stryMutAct_9fa48("619") ? false : stryMutAct_9fa48("618") ? true : (stryCov_9fa48("618", "619", "620"), maxMatches === englishMatches)) return stryMutAct_9fa48("621") ? "" : (stryCov_9fa48("621"), "en");
      if (stryMutAct_9fa48("624") ? maxMatches !== spanishMatches : stryMutAct_9fa48("623") ? false : stryMutAct_9fa48("622") ? true : (stryCov_9fa48("622", "623", "624"), maxMatches === spanishMatches)) return stryMutAct_9fa48("625") ? "" : (stryCov_9fa48("625"), "es");
      if (stryMutAct_9fa48("628") ? maxMatches !== frenchMatches : stryMutAct_9fa48("627") ? false : stryMutAct_9fa48("626") ? true : (stryCov_9fa48("626", "627", "628"), maxMatches === frenchMatches)) return stryMutAct_9fa48("629") ? "" : (stryCov_9fa48("629"), "fr");
      return stryMutAct_9fa48("630") ? "" : (stryCov_9fa48("630"), "unknown");
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (stryMutAct_9fa48("631")) {
      {}
    } else {
      stryCov_9fa48("631");
      if (stryMutAct_9fa48("633") ? false : stryMutAct_9fa48("632") ? true : (stryCov_9fa48("632", "633"), this.worker)) {
        if (stryMutAct_9fa48("634")) {
          {}
        } else {
          stryCov_9fa48("634");
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
    if (stryMutAct_9fa48("635")) {
      {}
    } else {
      stryCov_9fa48("635");
      return stryMutAct_9fa48("636") ? [] : (stryCov_9fa48("636"), [stryMutAct_9fa48("637") ? "" : (stryCov_9fa48("637"), "eng"), // English
      stryMutAct_9fa48("638") ? "" : (stryCov_9fa48("638"), "spa"), // Spanish
      stryMutAct_9fa48("639") ? "" : (stryCov_9fa48("639"), "fra"), // French
      stryMutAct_9fa48("640") ? "" : (stryCov_9fa48("640"), "deu"), // German
      stryMutAct_9fa48("641") ? "" : (stryCov_9fa48("641"), "ita"), // Italian
      stryMutAct_9fa48("642") ? "" : (stryCov_9fa48("642"), "por"), // Portuguese
      stryMutAct_9fa48("643") ? "" : (stryCov_9fa48("643"), "rus"), // Russian
      stryMutAct_9fa48("644") ? "" : (stryCov_9fa48("644"), "ara"), // Arabic
      stryMutAct_9fa48("645") ? "" : (stryCov_9fa48("645"), "chi_sim"), // Chinese Simplified
      stryMutAct_9fa48("646") ? "" : (stryCov_9fa48("646"), "jpn") // Japanese
      ]);
    }
  }
}