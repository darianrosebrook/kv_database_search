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
import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
import { ContentType, ContentMetadata } from "../../types/index";
import { detectLanguage } from "../utils";
import * as fs from "fs";
export interface OfficeMetadata {
  title?: string;
  author?: string;
  created?: Date;
  modified?: Date;
  application?: string;
  wordCount?: number;
  pageCount?: number;
  sheetCount?: number;
  slideCount?: number;
}
export interface OfficeContentMetadata extends ContentMetadata {
  officeMetadata?: OfficeMetadata;
  hasText: boolean;
  wordCount: number;
  characterCount: number;
}
export class OfficeProcessor {
  /**
   * Extract text from Office documents
   */
  async extractTextFromBuffer(buffer: Buffer, contentType: ContentType): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("3386")) {
      {}
    } else {
      stryCov_9fa48("3386");
      try {
        if (stryMutAct_9fa48("3387")) {
          {}
        } else {
          stryCov_9fa48("3387");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("3388")) {} else {
                stryCov_9fa48("3388");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("3389")) {} else {
                stryCov_9fa48("3389");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("3390")) {} else {
                stryCov_9fa48("3390");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("3391")) {} else {
                stryCov_9fa48("3391");
                throw new Error(stryMutAct_9fa48("3392") ? `` : (stryCov_9fa48("3392"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("3393")) {
          {}
        } else {
          stryCov_9fa48("3393");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3394") ? {} : (stryCov_9fa48("3394"), {
            type: contentType,
            language: stryMutAct_9fa48("3395") ? "" : (stryCov_9fa48("3395"), "unknown"),
            encoding: stryMutAct_9fa48("3396") ? "" : (stryCov_9fa48("3396"), "unknown"),
            hasText: stryMutAct_9fa48("3397") ? true : (stryCov_9fa48("3397"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3398") ? {} : (stryCov_9fa48("3398"), {
            text: stryMutAct_9fa48("3399") ? `` : (stryCov_9fa48("3399"), `Office Document Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from Office document files
   */
  async extractTextFromFile(filePath: string, contentType: ContentType): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("3400")) {
      {}
    } else {
      stryCov_9fa48("3400");
      try {
        if (stryMutAct_9fa48("3401")) {
          {}
        } else {
          stryCov_9fa48("3401");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3402")) {
          {}
        } else {
          stryCov_9fa48("3402");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3403") ? {} : (stryCov_9fa48("3403"), {
            type: contentType,
            language: stryMutAct_9fa48("3404") ? "" : (stryCov_9fa48("3404"), "unknown"),
            encoding: stryMutAct_9fa48("3405") ? "" : (stryCov_9fa48("3405"), "unknown"),
            hasText: stryMutAct_9fa48("3406") ? true : (stryCov_9fa48("3406"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3407") ? {} : (stryCov_9fa48("3407"), {
            text: stryMutAct_9fa48("3408") ? `` : (stryCov_9fa48("3408"), `Office Document Error: Failed to read file - ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from DOCX files
   */
  private async extractDocxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("3409")) {
      {}
    } else {
      stryCov_9fa48("3409");
      try {
        if (stryMutAct_9fa48("3410")) {
          {}
        } else {
          stryCov_9fa48("3410");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("3411") ? {} : (stryCov_9fa48("3411"), {
            buffer
          }));
          const text = stryMutAct_9fa48("3412") ? result.value : (stryCov_9fa48("3412"), result.value.trim());
          const words = stryMutAct_9fa48("3413") ? text.split(/\s+/) : (stryCov_9fa48("3413"), text.split(stryMutAct_9fa48("3415") ? /\S+/ : stryMutAct_9fa48("3414") ? /\s/ : (stryCov_9fa48("3414", "3415"), /\s+/)).filter(stryMutAct_9fa48("3416") ? () => undefined : (stryCov_9fa48("3416"), word => stryMutAct_9fa48("3420") ? word.length <= 0 : stryMutAct_9fa48("3419") ? word.length >= 0 : stryMutAct_9fa48("3418") ? false : stryMutAct_9fa48("3417") ? true : (stryCov_9fa48("3417", "3418", "3419", "3420"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3423") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3422") ? false : stryMutAct_9fa48("3421") ? true : (stryCov_9fa48("3421", "3422", "3423"), (stryMutAct_9fa48("3426") ? text.length <= 0 : stryMutAct_9fa48("3425") ? text.length >= 0 : stryMutAct_9fa48("3424") ? true : (stryCov_9fa48("3424", "3425", "3426"), text.length > 0)) && (stryMutAct_9fa48("3429") ? words.length <= 0 : stryMutAct_9fa48("3428") ? words.length >= 0 : stryMutAct_9fa48("3427") ? true : (stryCov_9fa48("3427", "3428", "3429"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("3430") ? {} : (stryCov_9fa48("3430"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3431") ? {} : (stryCov_9fa48("3431"), {
            type: ContentType.OFFICE_DOC,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3432") ? "" : (stryCov_9fa48("3432"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("3433") ? "" : (stryCov_9fa48("3433"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("3434") ? {} : (stryCov_9fa48("3434"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3435")) {
          {}
        } else {
          stryCov_9fa48("3435");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3436") ? {} : (stryCov_9fa48("3436"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("3437") ? "" : (stryCov_9fa48("3437"), "unknown"),
            encoding: stryMutAct_9fa48("3438") ? "" : (stryCov_9fa48("3438"), "unknown"),
            hasText: stryMutAct_9fa48("3439") ? true : (stryCov_9fa48("3439"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3440") ? {} : (stryCov_9fa48("3440"), {
            text: stryMutAct_9fa48("3441") ? `` : (stryCov_9fa48("3441"), `Word Document Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from XLSX files
   */
  private async extractXlsxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("3442")) {
      {}
    } else {
      stryCov_9fa48("3442");
      try {
        if (stryMutAct_9fa48("3443")) {
          {}
        } else {
          stryCov_9fa48("3443");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("3444") ? {} : (stryCov_9fa48("3444"), {
            type: stryMutAct_9fa48("3445") ? "" : (stryCov_9fa48("3445"), "buffer")
          }));
          let allText = stryMutAct_9fa48("3446") ? "Stryker was here!" : (stryCov_9fa48("3446"), "");
          const sheetNames: string[] = stryMutAct_9fa48("3447") ? ["Stryker was here"] : (stryCov_9fa48("3447"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("3448")) {
              {}
            } else {
              stryCov_9fa48("3448");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("3451") ? csvText : stryMutAct_9fa48("3450") ? false : stryMutAct_9fa48("3449") ? true : (stryCov_9fa48("3449", "3450", "3451"), csvText.trim())) {
                if (stryMutAct_9fa48("3452")) {
                  {}
                } else {
                  stryCov_9fa48("3452");
                  allText += stryMutAct_9fa48("3453") ? `` : (stryCov_9fa48("3453"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("3456") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("3455") ? false : stryMutAct_9fa48("3454") ? true : (stryCov_9fa48("3454", "3455", "3456"), worksheet[stryMutAct_9fa48("3457") ? "" : (stryCov_9fa48("3457"), "!ref")] || (stryMutAct_9fa48("3458") ? "" : (stryCov_9fa48("3458"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("3461") ? row > range.e.r : stryMutAct_9fa48("3460") ? row < range.e.r : stryMutAct_9fa48("3459") ? false : (stryCov_9fa48("3459", "3460", "3461"), row <= range.e.r); stryMutAct_9fa48("3462") ? row-- : (stryCov_9fa48("3462"), row++)) {
                if (stryMutAct_9fa48("3463")) {
                  {}
                } else {
                  stryCov_9fa48("3463");
                  for (let col = range.s.c; stryMutAct_9fa48("3466") ? col > range.e.c : stryMutAct_9fa48("3465") ? col < range.e.c : stryMutAct_9fa48("3464") ? false : (stryCov_9fa48("3464", "3465", "3466"), col <= range.e.c); stryMutAct_9fa48("3467") ? col-- : (stryCov_9fa48("3467"), col++)) {
                    if (stryMutAct_9fa48("3468")) {
                      {}
                    } else {
                      stryCov_9fa48("3468");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("3469") ? {} : (stryCov_9fa48("3469"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("3472") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("3471") ? false : stryMutAct_9fa48("3470") ? true : (stryCov_9fa48("3470", "3471", "3472"), worksheet[cellAddress] && (stryMutAct_9fa48("3474") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("3473") ? true : (stryCov_9fa48("3473", "3474"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("3475")) {
                          {}
                        } else {
                          stryCov_9fa48("3475");
                          stryMutAct_9fa48("3476") ? totalCells-- : (stryCov_9fa48("3476"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("3477") ? allText : (stryCov_9fa48("3477"), allText.trim());
          const words = stryMutAct_9fa48("3478") ? text.split(/\s+/) : (stryCov_9fa48("3478"), text.split(stryMutAct_9fa48("3480") ? /\S+/ : stryMutAct_9fa48("3479") ? /\s/ : (stryCov_9fa48("3479", "3480"), /\s+/)).filter(stryMutAct_9fa48("3481") ? () => undefined : (stryCov_9fa48("3481"), word => stryMutAct_9fa48("3485") ? word.length <= 0 : stryMutAct_9fa48("3484") ? word.length >= 0 : stryMutAct_9fa48("3483") ? false : stryMutAct_9fa48("3482") ? true : (stryCov_9fa48("3482", "3483", "3484", "3485"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3488") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3487") ? false : stryMutAct_9fa48("3486") ? true : (stryCov_9fa48("3486", "3487", "3488"), (stryMutAct_9fa48("3491") ? text.length <= 0 : stryMutAct_9fa48("3490") ? text.length >= 0 : stryMutAct_9fa48("3489") ? true : (stryCov_9fa48("3489", "3490", "3491"), text.length > 0)) && (stryMutAct_9fa48("3494") ? words.length <= 0 : stryMutAct_9fa48("3493") ? words.length >= 0 : stryMutAct_9fa48("3492") ? true : (stryCov_9fa48("3492", "3493", "3494"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("3495") ? {} : (stryCov_9fa48("3495"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("3496") ? "" : (stryCov_9fa48("3496"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3497") ? {} : (stryCov_9fa48("3497"), {
            type: ContentType.OFFICE_SHEET,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3498") ? "" : (stryCov_9fa48("3498"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("3499") ? `` : (stryCov_9fa48("3499"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("3500") ? {} : (stryCov_9fa48("3500"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3501")) {
          {}
        } else {
          stryCov_9fa48("3501");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3502") ? {} : (stryCov_9fa48("3502"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("3503") ? "" : (stryCov_9fa48("3503"), "unknown"),
            encoding: stryMutAct_9fa48("3504") ? "" : (stryCov_9fa48("3504"), "unknown"),
            hasText: stryMutAct_9fa48("3505") ? true : (stryCov_9fa48("3505"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3506") ? {} : (stryCov_9fa48("3506"), {
            text: stryMutAct_9fa48("3507") ? `` : (stryCov_9fa48("3507"), `Excel Document Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from PPTX files (basic implementation)
   */
  private async extractPptxFromBuffer(_buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("3508")) {
      {}
    } else {
      stryCov_9fa48("3508");
      try {
        if (stryMutAct_9fa48("3509")) {
          {}
        } else {
          stryCov_9fa48("3509");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3510") ? {} : (stryCov_9fa48("3510"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("3511") ? "" : (stryCov_9fa48("3511"), "unknown"),
            encoding: stryMutAct_9fa48("3512") ? "" : (stryCov_9fa48("3512"), "unknown"),
            hasText: stryMutAct_9fa48("3513") ? true : (stryCov_9fa48("3513"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("3514") ? {} : (stryCov_9fa48("3514"), {
              application: stryMutAct_9fa48("3515") ? "" : (stryCov_9fa48("3515"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("3516") ? {} : (stryCov_9fa48("3516"), {
            text: stryMutAct_9fa48("3517") ? "" : (stryCov_9fa48("3517"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3518")) {
          {}
        } else {
          stryCov_9fa48("3518");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3519") ? {} : (stryCov_9fa48("3519"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("3520") ? "" : (stryCov_9fa48("3520"), "unknown"),
            encoding: stryMutAct_9fa48("3521") ? "" : (stryCov_9fa48("3521"), "unknown"),
            hasText: stryMutAct_9fa48("3522") ? true : (stryCov_9fa48("3522"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3523") ? {} : (stryCov_9fa48("3523"), {
            text: stryMutAct_9fa48("3524") ? `` : (stryCov_9fa48("3524"), `PowerPoint Document Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Check if a file is a supported Office document
   */
  isSupportedOfficeDocument(buffer: Buffer): {
    supported: boolean;
    type?: ContentType;
  } {
    if (stryMutAct_9fa48("3525")) {
      {}
    } else {
      stryCov_9fa48("3525");
      // Office document signatures
      const signatures = stryMutAct_9fa48("3526") ? [] : (stryCov_9fa48("3526"), [stryMutAct_9fa48("3527") ? {} : (stryCov_9fa48("3527"), {
        signature: Buffer.from(stryMutAct_9fa48("3528") ? [] : (stryCov_9fa48("3528"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("3529") ? "" : (stryCov_9fa48("3529"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("3530") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("3530"), signatures.some(stryMutAct_9fa48("3531") ? () => undefined : (stryCov_9fa48("3531"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("3534") ? false : stryMutAct_9fa48("3533") ? true : stryMutAct_9fa48("3532") ? isZipBased : (stryCov_9fa48("3532", "3533", "3534"), !isZipBased)) {
        if (stryMutAct_9fa48("3535")) {
          {}
        } else {
          stryCov_9fa48("3535");
          return stryMutAct_9fa48("3536") ? {} : (stryCov_9fa48("3536"), {
            supported: stryMutAct_9fa48("3537") ? true : (stryCov_9fa48("3537"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3538") ? "" : (stryCov_9fa48("3538"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3539") ? "" : (stryCov_9fa48("3539"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3540") ? "" : (stryCov_9fa48("3540"), "ppt/")));
      if (stryMutAct_9fa48("3542") ? false : stryMutAct_9fa48("3541") ? true : (stryCov_9fa48("3541", "3542"), docxMarker)) {
        if (stryMutAct_9fa48("3543")) {
          {}
        } else {
          stryCov_9fa48("3543");
          return stryMutAct_9fa48("3544") ? {} : (stryCov_9fa48("3544"), {
            supported: stryMutAct_9fa48("3545") ? false : (stryCov_9fa48("3545"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("3547") ? false : stryMutAct_9fa48("3546") ? true : (stryCov_9fa48("3546", "3547"), xlsxMarker)) {
        if (stryMutAct_9fa48("3548")) {
          {}
        } else {
          stryCov_9fa48("3548");
          return stryMutAct_9fa48("3549") ? {} : (stryCov_9fa48("3549"), {
            supported: stryMutAct_9fa48("3550") ? false : (stryCov_9fa48("3550"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("3552") ? false : stryMutAct_9fa48("3551") ? true : (stryCov_9fa48("3551", "3552"), pptxMarker)) {
        if (stryMutAct_9fa48("3553")) {
          {}
        } else {
          stryCov_9fa48("3553");
          return stryMutAct_9fa48("3554") ? {} : (stryCov_9fa48("3554"), {
            supported: stryMutAct_9fa48("3555") ? false : (stryCov_9fa48("3555"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("3556") ? {} : (stryCov_9fa48("3556"), {
        supported: stryMutAct_9fa48("3557") ? true : (stryCov_9fa48("3557"), false)
      });
    }
  }
}