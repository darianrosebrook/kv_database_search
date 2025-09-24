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
    if (stryMutAct_9fa48("3662")) {
      {}
    } else {
      stryCov_9fa48("3662");
      super(stryMutAct_9fa48("3663") ? "" : (stryCov_9fa48("3663"), "PDF Processor"), stryMutAct_9fa48("3664") ? [] : (stryCov_9fa48("3664"), [ContentType.PDF]));
    }
  }

  /**
   * Extract text and metadata from a PDF buffer
   */
  async extractFromBuffer(buffer: Buffer, options?: ProcessorOptions): Promise<ProcessorResult> {
    if (stryMutAct_9fa48("3665")) {
      {}
    } else {
      stryCov_9fa48("3665");
      const {
        time
      } = await this.measureTime(async () => {
        if (stryMutAct_9fa48("3666")) {
          {}
        } else {
          stryCov_9fa48("3666");
          try {
            if (stryMutAct_9fa48("3667")) {
              {}
            } else {
              stryCov_9fa48("3667");
              // Parse the PDF
              const pdfData = await pdfParse(buffer);

              // Extract basic metadata
              const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3668") ? {} : (stryCov_9fa48("3668"), {
                title: stryMutAct_9fa48("3669") ? pdfData.info.Title : (stryCov_9fa48("3669"), pdfData.info?.Title),
                author: stryMutAct_9fa48("3670") ? pdfData.info.Author : (stryCov_9fa48("3670"), pdfData.info?.Author),
                subject: stryMutAct_9fa48("3671") ? pdfData.info.Subject : (stryCov_9fa48("3671"), pdfData.info?.Subject),
                creator: stryMutAct_9fa48("3672") ? pdfData.info.Creator : (stryCov_9fa48("3672"), pdfData.info?.Creator),
                producer: stryMutAct_9fa48("3673") ? pdfData.info.Producer : (stryCov_9fa48("3673"), pdfData.info?.Producer),
                creationDate: (stryMutAct_9fa48("3674") ? pdfData.info.CreationDate : (stryCov_9fa48("3674"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
                modificationDate: (stryMutAct_9fa48("3675") ? pdfData.info.ModDate : (stryCov_9fa48("3675"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
              });

              // Extract text content
              const text = stryMutAct_9fa48("3676") ? pdfData.text : (stryCov_9fa48("3676"), pdfData.text.trim());
              const cleanedText = this.cleanExtractedText(text);
              const hasText = stryMutAct_9fa48("3680") ? cleanedText.length <= 0 : stryMutAct_9fa48("3679") ? cleanedText.length >= 0 : stryMutAct_9fa48("3678") ? false : stryMutAct_9fa48("3677") ? true : (stryCov_9fa48("3677", "3678", "3679", "3680"), cleanedText.length > 0);
              const wordCount = this.countWords(cleanedText);
              const characterCount = this.countCharacters(cleanedText);

              // Get language from options or detect
              const language = stryMutAct_9fa48("3683") ? options?.language && detectLanguage(cleanedText) : stryMutAct_9fa48("3682") ? false : stryMutAct_9fa48("3681") ? true : (stryCov_9fa48("3681", "3682", "3683"), (stryMutAct_9fa48("3684") ? options.language : (stryCov_9fa48("3684"), options?.language)) || detectLanguage(cleanedText));

              // Create content metadata
              const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3685") ? {} : (stryCov_9fa48("3685"), {
                type: ContentType.PDF,
                language,
                encoding: stryMutAct_9fa48("3686") ? "" : (stryCov_9fa48("3686"), "utf-8"),
                pageCount: stryMutAct_9fa48("3689") ? pdfData.numpages && 0 : stryMutAct_9fa48("3688") ? false : stryMutAct_9fa48("3687") ? true : (stryCov_9fa48("3687", "3688", "3689"), pdfData.numpages || 0),
                wordCount,
                characterCount,
                hasText,
                pdfMetadata
              });
              return this.createSuccessResult(hasText ? cleanedText : stryMutAct_9fa48("3690") ? "" : (stryCov_9fa48("3690"), "PDF document contains no extractable text"), contentMetadata, time, language);
            }
          } catch (error) {
            if (stryMutAct_9fa48("3691")) {
              {}
            } else {
              stryCov_9fa48("3691");
              const errorMessage = error instanceof Error ? error.message : String(error);
              return this.createErrorResult(stryMutAct_9fa48("3692") ? `` : (stryCov_9fa48("3692"), `PDF processing failed: ${errorMessage}`), stryMutAct_9fa48("3695") ? options?.language && "unknown" : stryMutAct_9fa48("3694") ? false : stryMutAct_9fa48("3693") ? true : (stryCov_9fa48("3693", "3694", "3695"), (stryMutAct_9fa48("3696") ? options.language : (stryCov_9fa48("3696"), options?.language)) || (stryMutAct_9fa48("3697") ? "" : (stryCov_9fa48("3697"), "unknown"))));
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
    if (stryMutAct_9fa48("3698")) {
      {}
    } else {
      stryCov_9fa48("3698");
      try {
        if (stryMutAct_9fa48("3699")) {
          {}
        } else {
          stryCov_9fa48("3699");
          // Read the PDF file
          const buffer = fs.readFileSync(filePath);

          // Parse the PDF
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3700") ? {} : (stryCov_9fa48("3700"), {
            title: stryMutAct_9fa48("3701") ? pdfData.info.Title : (stryCov_9fa48("3701"), pdfData.info?.Title),
            author: stryMutAct_9fa48("3702") ? pdfData.info.Author : (stryCov_9fa48("3702"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("3703") ? pdfData.info.Subject : (stryCov_9fa48("3703"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("3704") ? pdfData.info.Creator : (stryCov_9fa48("3704"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("3705") ? pdfData.info.Producer : (stryCov_9fa48("3705"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("3706") ? pdfData.info.CreationDate : (stryCov_9fa48("3706"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("3707") ? pdfData.info.ModDate : (stryCov_9fa48("3707"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("3708") ? pdfData.text : (stryCov_9fa48("3708"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("3709") ? text.split(/\s+/) : (stryCov_9fa48("3709"), text.split(stryMutAct_9fa48("3711") ? /\S+/ : stryMutAct_9fa48("3710") ? /\s/ : (stryCov_9fa48("3710", "3711"), /\s+/)).filter(stryMutAct_9fa48("3712") ? () => undefined : (stryCov_9fa48("3712"), word => stryMutAct_9fa48("3716") ? word.length <= 0 : stryMutAct_9fa48("3715") ? word.length >= 0 : stryMutAct_9fa48("3714") ? false : stryMutAct_9fa48("3713") ? true : (stryCov_9fa48("3713", "3714", "3715", "3716"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3719") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3718") ? false : stryMutAct_9fa48("3717") ? true : (stryCov_9fa48("3717", "3718", "3719"), (stryMutAct_9fa48("3722") ? text.length <= 0 : stryMutAct_9fa48("3721") ? text.length >= 0 : stryMutAct_9fa48("3720") ? true : (stryCov_9fa48("3720", "3721", "3722"), text.length > 0)) && (stryMutAct_9fa48("3725") ? words.length <= 0 : stryMutAct_9fa48("3724") ? words.length >= 0 : stryMutAct_9fa48("3723") ? true : (stryCov_9fa48("3723", "3724", "3725"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3726") ? {} : (stryCov_9fa48("3726"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("3727") ? "" : (stryCov_9fa48("3727"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("3728") ? {} : (stryCov_9fa48("3728"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3729")) {
          {}
        } else {
          stryCov_9fa48("3729");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3730") ? {} : (stryCov_9fa48("3730"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("3731") ? "" : (stryCov_9fa48("3731"), "unknown"),
            encoding: stryMutAct_9fa48("3732") ? "" : (stryCov_9fa48("3732"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("3733") ? true : (stryCov_9fa48("3733"), false)
          });
          return stryMutAct_9fa48("3734") ? {} : (stryCov_9fa48("3734"), {
            text: stryMutAct_9fa48("3735") ? `` : (stryCov_9fa48("3735"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3736")) {
      {}
    } else {
      stryCov_9fa48("3736");
      try {
        if (stryMutAct_9fa48("3737")) {
          {}
        } else {
          stryCov_9fa48("3737");
          // Parse the PDF buffer
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("3738") ? {} : (stryCov_9fa48("3738"), {
            title: stryMutAct_9fa48("3739") ? pdfData.info.Title : (stryCov_9fa48("3739"), pdfData.info?.Title),
            author: stryMutAct_9fa48("3740") ? pdfData.info.Author : (stryCov_9fa48("3740"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("3741") ? pdfData.info.Subject : (stryCov_9fa48("3741"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("3742") ? pdfData.info.Creator : (stryCov_9fa48("3742"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("3743") ? pdfData.info.Producer : (stryCov_9fa48("3743"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("3744") ? pdfData.info.CreationDate : (stryCov_9fa48("3744"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("3745") ? pdfData.info.ModDate : (stryCov_9fa48("3745"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("3746") ? pdfData.text : (stryCov_9fa48("3746"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("3747") ? text.split(/\s+/) : (stryCov_9fa48("3747"), text.split(stryMutAct_9fa48("3749") ? /\S+/ : stryMutAct_9fa48("3748") ? /\s/ : (stryCov_9fa48("3748", "3749"), /\s+/)).filter(stryMutAct_9fa48("3750") ? () => undefined : (stryCov_9fa48("3750"), word => stryMutAct_9fa48("3754") ? word.length <= 0 : stryMutAct_9fa48("3753") ? word.length >= 0 : stryMutAct_9fa48("3752") ? false : stryMutAct_9fa48("3751") ? true : (stryCov_9fa48("3751", "3752", "3753", "3754"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3757") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3756") ? false : stryMutAct_9fa48("3755") ? true : (stryCov_9fa48("3755", "3756", "3757"), (stryMutAct_9fa48("3760") ? text.length <= 0 : stryMutAct_9fa48("3759") ? text.length >= 0 : stryMutAct_9fa48("3758") ? true : (stryCov_9fa48("3758", "3759", "3760"), text.length > 0)) && (stryMutAct_9fa48("3763") ? words.length <= 0 : stryMutAct_9fa48("3762") ? words.length >= 0 : stryMutAct_9fa48("3761") ? true : (stryCov_9fa48("3761", "3762", "3763"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3764") ? {} : (stryCov_9fa48("3764"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("3765") ? "" : (stryCov_9fa48("3765"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("3766") ? {} : (stryCov_9fa48("3766"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3767")) {
          {}
        } else {
          stryCov_9fa48("3767");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("3768") ? {} : (stryCov_9fa48("3768"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("3769") ? "" : (stryCov_9fa48("3769"), "unknown"),
            encoding: stryMutAct_9fa48("3770") ? "" : (stryCov_9fa48("3770"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("3771") ? true : (stryCov_9fa48("3771"), false)
          });
          return stryMutAct_9fa48("3772") ? {} : (stryCov_9fa48("3772"), {
            text: stryMutAct_9fa48("3773") ? `` : (stryCov_9fa48("3773"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3774")) {
      {}
    } else {
      stryCov_9fa48("3774");
      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("3777") ? text.match(englishWords) && [] : stryMutAct_9fa48("3776") ? false : stryMutAct_9fa48("3775") ? true : (stryCov_9fa48("3775", "3776", "3777"), text.match(englishWords) || (stryMutAct_9fa48("3778") ? ["Stryker was here"] : (stryCov_9fa48("3778"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("3781") ? text.match(spanishWords) && [] : stryMutAct_9fa48("3780") ? false : stryMutAct_9fa48("3779") ? true : (stryCov_9fa48("3779", "3780", "3781"), text.match(spanishWords) || (stryMutAct_9fa48("3782") ? ["Stryker was here"] : (stryCov_9fa48("3782"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("3785") ? text.match(frenchWords) && [] : stryMutAct_9fa48("3784") ? false : stryMutAct_9fa48("3783") ? true : (stryCov_9fa48("3783", "3784", "3785"), text.match(frenchWords) || (stryMutAct_9fa48("3786") ? ["Stryker was here"] : (stryCov_9fa48("3786"), [])))).length;
      const maxMatches = stryMutAct_9fa48("3787") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("3787"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("3790") ? maxMatches !== 0 : stryMutAct_9fa48("3789") ? false : stryMutAct_9fa48("3788") ? true : (stryCov_9fa48("3788", "3789", "3790"), maxMatches === 0)) return stryMutAct_9fa48("3791") ? "" : (stryCov_9fa48("3791"), "unknown");
      if (stryMutAct_9fa48("3794") ? maxMatches !== englishMatches : stryMutAct_9fa48("3793") ? false : stryMutAct_9fa48("3792") ? true : (stryCov_9fa48("3792", "3793", "3794"), maxMatches === englishMatches)) return stryMutAct_9fa48("3795") ? "" : (stryCov_9fa48("3795"), "en");
      if (stryMutAct_9fa48("3798") ? maxMatches !== spanishMatches : stryMutAct_9fa48("3797") ? false : stryMutAct_9fa48("3796") ? true : (stryCov_9fa48("3796", "3797", "3798"), maxMatches === spanishMatches)) return stryMutAct_9fa48("3799") ? "" : (stryCov_9fa48("3799"), "es");
      if (stryMutAct_9fa48("3802") ? maxMatches !== frenchMatches : stryMutAct_9fa48("3801") ? false : stryMutAct_9fa48("3800") ? true : (stryCov_9fa48("3800", "3801", "3802"), maxMatches === frenchMatches)) return stryMutAct_9fa48("3803") ? "" : (stryCov_9fa48("3803"), "fr");
      return stryMutAct_9fa48("3804") ? "" : (stryCov_9fa48("3804"), "unknown");
    }
  }

  /**
   * Check if a file is likely a readable PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    if (stryMutAct_9fa48("3805")) {
      {}
    } else {
      stryCov_9fa48("3805");
      // Check PDF signature
      const signature = buffer.subarray(0, 8);
      const pdfSignature = Buffer.from(stryMutAct_9fa48("3806") ? "" : (stryCov_9fa48("3806"), "%PDF-"));
      return signature.subarray(0, 5).equals(pdfSignature);
    }
  }
}