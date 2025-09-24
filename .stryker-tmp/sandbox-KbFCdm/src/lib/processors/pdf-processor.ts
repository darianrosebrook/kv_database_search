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
import * as pdfParse from "pdf-parse";
import { ContentType, ContentMetadata } from "../../types/index";
import { BaseContentProcessor, ProcessorOptions, ProcessorResult } from "./base-processor";
import { detectLanguage } from "../utils";
import * as fs from "fs";
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}
export interface PDFContentMetadata extends ContentMetadata {
  pageCount: number;
  wordCount: number;
  characterCount: number;
  hasText: boolean;
  pdfMetadata?: PDFMetadata;
}
export class PDFProcessor extends BaseContentProcessor {
  constructor() {
    if (stryMutAct_9fa48("3558")) {
      {}
    } else {
      stryCov_9fa48("3558");
      super(stryMutAct_9fa48("3559") ? "" : (stryCov_9fa48("3559"), "PDF Processor"), stryMutAct_9fa48("3560") ? [] : (stryCov_9fa48("3560"), [ContentType.PDF]));
    }
  }

  /**
   * Extract text and metadata from a PDF buffer
   */
  async extractFromBuffer(buffer: Buffer, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("3561")) {
      {}
    } else {
      stryCov_9fa48("3561");
      const {
        time
      } = await this.measureTime(async () => {
        if (stryMutAct_9fa48("3562")) {
          {}
        } else {
          stryCov_9fa48("3562");
          try {
            if (stryMutAct_9fa48("3563")) {
              {}
            } else {
              stryCov_9fa48("3563");
              // Parse the PDF
              const pdfData = await pdfParse(buffer);

              // Extract basic metadata
              const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3564") ? {} : (stryCov_9fa48("3564"), {
                title: stryMutAct_9fa48("3565") ? pdfData.info.Title : (stryCov_9fa48("3565"), pdfData.info?.Title),
                author: stryMutAct_9fa48("3566") ? pdfData.info.Author : (stryCov_9fa48("3566"), pdfData.info?.Author),
                subject: stryMutAct_9fa48("3567") ? pdfData.info.Subject : (stryCov_9fa48("3567"), pdfData.info?.Subject),
                creator: stryMutAct_9fa48("3568") ? pdfData.info.Creator : (stryCov_9fa48("3568"), pdfData.info?.Creator),
                producer: stryMutAct_9fa48("3569") ? pdfData.info.Producer : (stryCov_9fa48("3569"), pdfData.info?.Producer),
                creationDate: (stryMutAct_9fa48("3570") ? pdfData.info.CreationDate : (stryCov_9fa48("3570"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
                modificationDate: (stryMutAct_9fa48("3571") ? pdfData.info.ModDate : (stryCov_9fa48("3571"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
              });

              // Extract text content
              const text = stryMutAct_9fa48("3572") ? pdfData.text : (stryCov_9fa48("3572"), pdfData.text.trim());
              const cleanedText = this.cleanExtractedText(text);
              const hasText = stryMutAct_9fa48("3576") ? cleanedText.length <= 0 : stryMutAct_9fa48("3575") ? cleanedText.length >= 0 : stryMutAct_9fa48("3574") ? false : stryMutAct_9fa48("3573") ? true : (stryCov_9fa48("3573", "3574", "3575", "3576"), cleanedText.length > 0);
              const wordCount = this.countWords(cleanedText);
              const characterCount = this.countCharacters(cleanedText);

              // Get language from options or detect
              const language = stryMutAct_9fa48("3579") ? options?.language && detectLanguage(cleanedText) : stryMutAct_9fa48("3578") ? false : stryMutAct_9fa48("3577") ? true : (stryCov_9fa48("3577", "3578", "3579"), (stryMutAct_9fa48("3580") ? options.language : (stryCov_9fa48("3580"), options?.language)) || detectLanguage(cleanedText));

              // Create content metadata
              const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3581") ? {} : (stryCov_9fa48("3581"), {
                type: ContentType.PDF,
                language,
                encoding: stryMutAct_9fa48("3582") ? "" : (stryCov_9fa48("3582"), "utf-8"),
                pageCount: stryMutAct_9fa48("3585") ? pdfData.numpages && 0 : stryMutAct_9fa48("3584") ? false : stryMutAct_9fa48("3583") ? true : (stryCov_9fa48("3583", "3584", "3585"), pdfData.numpages || 0),
                wordCount,
                characterCount,
                hasText,
                pdfMetadata
              });
              return this.createSuccessResult(hasText ? cleanedText : stryMutAct_9fa48("3586") ? "" : (stryCov_9fa48("3586"), "PDF document contains no extractable text"), contentMetadata, time, language);
            }
          } catch (error) {
            if (stryMutAct_9fa48("3587")) {
              {}
            } else {
              stryCov_9fa48("3587");
              const errorMessage = error instanceof Error ? error.message : String(error);
              return this.createErrorResult(stryMutAct_9fa48("3588") ? `` : (stryCov_9fa48("3588"), `PDF processing failed: ${errorMessage}`), stryMutAct_9fa48("3591") ? options?.language && "unknown" : stryMutAct_9fa48("3590") ? false : stryMutAct_9fa48("3589") ? true : (stryCov_9fa48("3589", "3590", "3591"), (stryMutAct_9fa48("3592") ? options.language : (stryCov_9fa48("3592"), options?.language)) || (stryMutAct_9fa48("3593") ? "" : (stryCov_9fa48("3593"), "unknown"))));
            }
          }
        }
      });
      return time.result;
    }
  }

  /**
   * Extract text content from a PDF file
   */
  async extractText(filePath: string): Promise<{
    text: string;
    metadata: PDFContentMetadata;
  }> {
    if (stryMutAct_9fa48("3594")) {
      {}
    } else {
      stryCov_9fa48("3594");
      try {
        if (stryMutAct_9fa48("3595")) {
          {}
        } else {
          stryCov_9fa48("3595");
          // Read the PDF file
          const buffer = fs.readFileSync(filePath);

          // Parse the PDF
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3596") ? {} : (stryCov_9fa48("3596"), {
            title: stryMutAct_9fa48("3597") ? pdfData.info.Title : (stryCov_9fa48("3597"), pdfData.info?.Title),
            author: stryMutAct_9fa48("3598") ? pdfData.info.Author : (stryCov_9fa48("3598"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("3599") ? pdfData.info.Subject : (stryCov_9fa48("3599"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("3600") ? pdfData.info.Creator : (stryCov_9fa48("3600"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("3601") ? pdfData.info.Producer : (stryCov_9fa48("3601"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("3602") ? pdfData.info.CreationDate : (stryCov_9fa48("3602"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("3603") ? pdfData.info.ModDate : (stryCov_9fa48("3603"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("3604") ? pdfData.text : (stryCov_9fa48("3604"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("3605") ? text.split(/\s+/) : (stryCov_9fa48("3605"), text.split(stryMutAct_9fa48("3607") ? /\S+/ : stryMutAct_9fa48("3606") ? /\s/ : (stryCov_9fa48("3606", "3607"), /\s+/)).filter(stryMutAct_9fa48("3608") ? () => undefined : (stryCov_9fa48("3608"), word => stryMutAct_9fa48("3612") ? word.length <= 0 : stryMutAct_9fa48("3611") ? word.length >= 0 : stryMutAct_9fa48("3610") ? false : stryMutAct_9fa48("3609") ? true : (stryCov_9fa48("3609", "3610", "3611", "3612"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3615") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3614") ? false : stryMutAct_9fa48("3613") ? true : (stryCov_9fa48("3613", "3614", "3615"), (stryMutAct_9fa48("3618") ? text.length <= 0 : stryMutAct_9fa48("3617") ? text.length >= 0 : stryMutAct_9fa48("3616") ? true : (stryCov_9fa48("3616", "3617", "3618"), text.length > 0)) && (stryMutAct_9fa48("3621") ? words.length <= 0 : stryMutAct_9fa48("3620") ? words.length >= 0 : stryMutAct_9fa48("3619") ? true : (stryCov_9fa48("3619", "3620", "3621"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3622") ? {} : (stryCov_9fa48("3622"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("3623") ? "" : (stryCov_9fa48("3623"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("3624") ? {} : (stryCov_9fa48("3624"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3625")) {
          {}
        } else {
          stryCov_9fa48("3625");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3626") ? {} : (stryCov_9fa48("3626"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("3627") ? "" : (stryCov_9fa48("3627"), "unknown"),
            encoding: stryMutAct_9fa48("3628") ? "" : (stryCov_9fa48("3628"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("3629") ? true : (stryCov_9fa48("3629"), false)
          });
          return stryMutAct_9fa48("3630") ? {} : (stryCov_9fa48("3630"), {
            text: stryMutAct_9fa48("3631") ? `` : (stryCov_9fa48("3631"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from a PDF buffer (useful for testing)
   */
  async extractTextFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: PDFContentMetadata;
  }> {
    if (stryMutAct_9fa48("3632")) {
      {}
    } else {
      stryCov_9fa48("3632");
      try {
        if (stryMutAct_9fa48("3633")) {
          {}
        } else {
          stryCov_9fa48("3633");
          // Parse the PDF buffer
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3634") ? {} : (stryCov_9fa48("3634"), {
            title: stryMutAct_9fa48("3635") ? pdfData.info.Title : (stryCov_9fa48("3635"), pdfData.info?.Title),
            author: stryMutAct_9fa48("3636") ? pdfData.info.Author : (stryCov_9fa48("3636"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("3637") ? pdfData.info.Subject : (stryCov_9fa48("3637"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("3638") ? pdfData.info.Creator : (stryCov_9fa48("3638"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("3639") ? pdfData.info.Producer : (stryCov_9fa48("3639"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("3640") ? pdfData.info.CreationDate : (stryCov_9fa48("3640"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("3641") ? pdfData.info.ModDate : (stryCov_9fa48("3641"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("3642") ? pdfData.text : (stryCov_9fa48("3642"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("3643") ? text.split(/\s+/) : (stryCov_9fa48("3643"), text.split(stryMutAct_9fa48("3645") ? /\S+/ : stryMutAct_9fa48("3644") ? /\s/ : (stryCov_9fa48("3644", "3645"), /\s+/)).filter(stryMutAct_9fa48("3646") ? () => undefined : (stryCov_9fa48("3646"), word => stryMutAct_9fa48("3650") ? word.length <= 0 : stryMutAct_9fa48("3649") ? word.length >= 0 : stryMutAct_9fa48("3648") ? false : stryMutAct_9fa48("3647") ? true : (stryCov_9fa48("3647", "3648", "3649", "3650"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3653") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3652") ? false : stryMutAct_9fa48("3651") ? true : (stryCov_9fa48("3651", "3652", "3653"), (stryMutAct_9fa48("3656") ? text.length <= 0 : stryMutAct_9fa48("3655") ? text.length >= 0 : stryMutAct_9fa48("3654") ? true : (stryCov_9fa48("3654", "3655", "3656"), text.length > 0)) && (stryMutAct_9fa48("3659") ? words.length <= 0 : stryMutAct_9fa48("3658") ? words.length >= 0 : stryMutAct_9fa48("3657") ? true : (stryCov_9fa48("3657", "3658", "3659"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3660") ? {} : (stryCov_9fa48("3660"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("3661") ? "" : (stryCov_9fa48("3661"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("3662") ? {} : (stryCov_9fa48("3662"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3663")) {
          {}
        } else {
          stryCov_9fa48("3663");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3664") ? {} : (stryCov_9fa48("3664"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("3665") ? "" : (stryCov_9fa48("3665"), "unknown"),
            encoding: stryMutAct_9fa48("3666") ? "" : (stryCov_9fa48("3666"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("3667") ? true : (stryCov_9fa48("3667"), false)
          });
          return stryMutAct_9fa48("3668") ? {} : (stryCov_9fa48("3668"), {
            text: stryMutAct_9fa48("3669") ? `` : (stryCov_9fa48("3669"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Simple language detection based on common patterns
   * In production, use a proper language detection library
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("3670")) {
      {}
    } else {
      stryCov_9fa48("3670");
      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("3673") ? text.match(englishWords) && [] : stryMutAct_9fa48("3672") ? false : stryMutAct_9fa48("3671") ? true : (stryCov_9fa48("3671", "3672", "3673"), text.match(englishWords) || (stryMutAct_9fa48("3674") ? ["Stryker was here"] : (stryCov_9fa48("3674"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("3677") ? text.match(spanishWords) && [] : stryMutAct_9fa48("3676") ? false : stryMutAct_9fa48("3675") ? true : (stryCov_9fa48("3675", "3676", "3677"), text.match(spanishWords) || (stryMutAct_9fa48("3678") ? ["Stryker was here"] : (stryCov_9fa48("3678"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("3681") ? text.match(frenchWords) && [] : stryMutAct_9fa48("3680") ? false : stryMutAct_9fa48("3679") ? true : (stryCov_9fa48("3679", "3680", "3681"), text.match(frenchWords) || (stryMutAct_9fa48("3682") ? ["Stryker was here"] : (stryCov_9fa48("3682"), [])))).length;
      const maxMatches = stryMutAct_9fa48("3683") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("3683"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("3686") ? maxMatches !== 0 : stryMutAct_9fa48("3685") ? false : stryMutAct_9fa48("3684") ? true : (stryCov_9fa48("3684", "3685", "3686"), maxMatches === 0)) return stryMutAct_9fa48("3687") ? "" : (stryCov_9fa48("3687"), "unknown");
      if (stryMutAct_9fa48("3690") ? maxMatches !== englishMatches : stryMutAct_9fa48("3689") ? false : stryMutAct_9fa48("3688") ? true : (stryCov_9fa48("3688", "3689", "3690"), maxMatches === englishMatches)) return stryMutAct_9fa48("3691") ? "" : (stryCov_9fa48("3691"), "en");
      if (stryMutAct_9fa48("3694") ? maxMatches !== spanishMatches : stryMutAct_9fa48("3693") ? false : stryMutAct_9fa48("3692") ? true : (stryCov_9fa48("3692", "3693", "3694"), maxMatches === spanishMatches)) return stryMutAct_9fa48("3695") ? "" : (stryCov_9fa48("3695"), "es");
      if (stryMutAct_9fa48("3698") ? maxMatches !== frenchMatches : stryMutAct_9fa48("3697") ? false : stryMutAct_9fa48("3696") ? true : (stryCov_9fa48("3696", "3697", "3698"), maxMatches === frenchMatches)) return stryMutAct_9fa48("3699") ? "" : (stryCov_9fa48("3699"), "fr");
      return stryMutAct_9fa48("3700") ? "" : (stryCov_9fa48("3700"), "unknown");
    }
  }

  /**
   * Check if a file is likely a readable PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    if (stryMutAct_9fa48("3701")) {
      {}
    } else {
      stryCov_9fa48("3701");
      // Check PDF signature
      const signature = buffer.subarray(0, 8);
      const pdfSignature = Buffer.from(stryMutAct_9fa48("3702") ? "" : (stryCov_9fa48("3702"), "%PDF-"));
      return signature.subarray(0, 5).equals(pdfSignature);
    }
  }
}