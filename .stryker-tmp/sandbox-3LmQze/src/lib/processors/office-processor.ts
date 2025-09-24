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
    if (stryMutAct_9fa48("3490")) {
      {}
    } else {
      stryCov_9fa48("3490");
      try {
        if (stryMutAct_9fa48("3491")) {
          {}
        } else {
          stryCov_9fa48("3491");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("3492")) {} else {
                stryCov_9fa48("3492");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("3493")) {} else {
                stryCov_9fa48("3493");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("3494")) {} else {
                stryCov_9fa48("3494");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("3495")) {} else {
                stryCov_9fa48("3495");
                throw new Error(stryMutAct_9fa48("3496") ? `` : (stryCov_9fa48("3496"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("3497")) {
          {}
        } else {
          stryCov_9fa48("3497");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3498") ? {} : (stryCov_9fa48("3498"), {
            type: contentType,
            language: stryMutAct_9fa48("3499") ? "" : (stryCov_9fa48("3499"), "unknown"),
            encoding: stryMutAct_9fa48("3500") ? "" : (stryCov_9fa48("3500"), "unknown"),
            hasText: stryMutAct_9fa48("3501") ? true : (stryCov_9fa48("3501"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3502") ? {} : (stryCov_9fa48("3502"), {
            text: stryMutAct_9fa48("3503") ? `` : (stryCov_9fa48("3503"), `Office Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3504")) {
      {}
    } else {
      stryCov_9fa48("3504");
      try {
        if (stryMutAct_9fa48("3505")) {
          {}
        } else {
          stryCov_9fa48("3505");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("3506")) {
          {}
        } else {
          stryCov_9fa48("3506");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3507") ? {} : (stryCov_9fa48("3507"), {
            type: contentType,
            language: stryMutAct_9fa48("3508") ? "" : (stryCov_9fa48("3508"), "unknown"),
            encoding: stryMutAct_9fa48("3509") ? "" : (stryCov_9fa48("3509"), "unknown"),
            hasText: stryMutAct_9fa48("3510") ? true : (stryCov_9fa48("3510"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3511") ? {} : (stryCov_9fa48("3511"), {
            text: stryMutAct_9fa48("3512") ? `` : (stryCov_9fa48("3512"), `Office Document Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("3513")) {
      {}
    } else {
      stryCov_9fa48("3513");
      try {
        if (stryMutAct_9fa48("3514")) {
          {}
        } else {
          stryCov_9fa48("3514");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("3515") ? {} : (stryCov_9fa48("3515"), {
            buffer
          }));
          const text = stryMutAct_9fa48("3516") ? result.value : (stryCov_9fa48("3516"), result.value.trim());
          const words = stryMutAct_9fa48("3517") ? text.split(/\s+/) : (stryCov_9fa48("3517"), text.split(stryMutAct_9fa48("3519") ? /\S+/ : stryMutAct_9fa48("3518") ? /\s/ : (stryCov_9fa48("3518", "3519"), /\s+/)).filter(stryMutAct_9fa48("3520") ? () => undefined : (stryCov_9fa48("3520"), word => stryMutAct_9fa48("3524") ? word.length <= 0 : stryMutAct_9fa48("3523") ? word.length >= 0 : stryMutAct_9fa48("3522") ? false : stryMutAct_9fa48("3521") ? true : (stryCov_9fa48("3521", "3522", "3523", "3524"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3527") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3526") ? false : stryMutAct_9fa48("3525") ? true : (stryCov_9fa48("3525", "3526", "3527"), (stryMutAct_9fa48("3530") ? text.length <= 0 : stryMutAct_9fa48("3529") ? text.length >= 0 : stryMutAct_9fa48("3528") ? true : (stryCov_9fa48("3528", "3529", "3530"), text.length > 0)) && (stryMutAct_9fa48("3533") ? words.length <= 0 : stryMutAct_9fa48("3532") ? words.length >= 0 : stryMutAct_9fa48("3531") ? true : (stryCov_9fa48("3531", "3532", "3533"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("3534") ? {} : (stryCov_9fa48("3534"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3535") ? {} : (stryCov_9fa48("3535"), {
            type: ContentType.OFFICE_DOC,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3536") ? "" : (stryCov_9fa48("3536"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("3537") ? "" : (stryCov_9fa48("3537"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("3538") ? {} : (stryCov_9fa48("3538"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3539")) {
          {}
        } else {
          stryCov_9fa48("3539");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3540") ? {} : (stryCov_9fa48("3540"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("3541") ? "" : (stryCov_9fa48("3541"), "unknown"),
            encoding: stryMutAct_9fa48("3542") ? "" : (stryCov_9fa48("3542"), "unknown"),
            hasText: stryMutAct_9fa48("3543") ? true : (stryCov_9fa48("3543"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3544") ? {} : (stryCov_9fa48("3544"), {
            text: stryMutAct_9fa48("3545") ? `` : (stryCov_9fa48("3545"), `Word Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3546")) {
      {}
    } else {
      stryCov_9fa48("3546");
      try {
        if (stryMutAct_9fa48("3547")) {
          {}
        } else {
          stryCov_9fa48("3547");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("3548") ? {} : (stryCov_9fa48("3548"), {
            type: stryMutAct_9fa48("3549") ? "" : (stryCov_9fa48("3549"), "buffer")
          }));
          let allText = stryMutAct_9fa48("3550") ? "Stryker was here!" : (stryCov_9fa48("3550"), "");
          const sheetNames: string[] = stryMutAct_9fa48("3551") ? ["Stryker was here"] : (stryCov_9fa48("3551"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("3552")) {
              {}
            } else {
              stryCov_9fa48("3552");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("3555") ? csvText : stryMutAct_9fa48("3554") ? false : stryMutAct_9fa48("3553") ? true : (stryCov_9fa48("3553", "3554", "3555"), csvText.trim())) {
                if (stryMutAct_9fa48("3556")) {
                  {}
                } else {
                  stryCov_9fa48("3556");
                  allText += stryMutAct_9fa48("3557") ? `` : (stryCov_9fa48("3557"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("3560") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("3559") ? false : stryMutAct_9fa48("3558") ? true : (stryCov_9fa48("3558", "3559", "3560"), worksheet[stryMutAct_9fa48("3561") ? "" : (stryCov_9fa48("3561"), "!ref")] || (stryMutAct_9fa48("3562") ? "" : (stryCov_9fa48("3562"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("3565") ? row > range.e.r : stryMutAct_9fa48("3564") ? row < range.e.r : stryMutAct_9fa48("3563") ? false : (stryCov_9fa48("3563", "3564", "3565"), row <= range.e.r); stryMutAct_9fa48("3566") ? row-- : (stryCov_9fa48("3566"), row++)) {
                if (stryMutAct_9fa48("3567")) {
                  {}
                } else {
                  stryCov_9fa48("3567");
                  for (let col = range.s.c; stryMutAct_9fa48("3570") ? col > range.e.c : stryMutAct_9fa48("3569") ? col < range.e.c : stryMutAct_9fa48("3568") ? false : (stryCov_9fa48("3568", "3569", "3570"), col <= range.e.c); stryMutAct_9fa48("3571") ? col-- : (stryCov_9fa48("3571"), col++)) {
                    if (stryMutAct_9fa48("3572")) {
                      {}
                    } else {
                      stryCov_9fa48("3572");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("3573") ? {} : (stryCov_9fa48("3573"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("3576") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("3575") ? false : stryMutAct_9fa48("3574") ? true : (stryCov_9fa48("3574", "3575", "3576"), worksheet[cellAddress] && (stryMutAct_9fa48("3578") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("3577") ? true : (stryCov_9fa48("3577", "3578"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("3579")) {
                          {}
                        } else {
                          stryCov_9fa48("3579");
                          stryMutAct_9fa48("3580") ? totalCells-- : (stryCov_9fa48("3580"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("3581") ? allText : (stryCov_9fa48("3581"), allText.trim());
          const words = stryMutAct_9fa48("3582") ? text.split(/\s+/) : (stryCov_9fa48("3582"), text.split(stryMutAct_9fa48("3584") ? /\S+/ : stryMutAct_9fa48("3583") ? /\s/ : (stryCov_9fa48("3583", "3584"), /\s+/)).filter(stryMutAct_9fa48("3585") ? () => undefined : (stryCov_9fa48("3585"), word => stryMutAct_9fa48("3589") ? word.length <= 0 : stryMutAct_9fa48("3588") ? word.length >= 0 : stryMutAct_9fa48("3587") ? false : stryMutAct_9fa48("3586") ? true : (stryCov_9fa48("3586", "3587", "3588", "3589"), word.length > 0))));
          const hasText = stryMutAct_9fa48("3592") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("3591") ? false : stryMutAct_9fa48("3590") ? true : (stryCov_9fa48("3590", "3591", "3592"), (stryMutAct_9fa48("3595") ? text.length <= 0 : stryMutAct_9fa48("3594") ? text.length >= 0 : stryMutAct_9fa48("3593") ? true : (stryCov_9fa48("3593", "3594", "3595"), text.length > 0)) && (stryMutAct_9fa48("3598") ? words.length <= 0 : stryMutAct_9fa48("3597") ? words.length >= 0 : stryMutAct_9fa48("3596") ? true : (stryCov_9fa48("3596", "3597", "3598"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("3599") ? {} : (stryCov_9fa48("3599"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("3600") ? "" : (stryCov_9fa48("3600"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3601") ? {} : (stryCov_9fa48("3601"), {
            type: ContentType.OFFICE_SHEET,
            language: detectLanguage(text),
            encoding: stryMutAct_9fa48("3602") ? "" : (stryCov_9fa48("3602"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("3603") ? `` : (stryCov_9fa48("3603"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("3604") ? {} : (stryCov_9fa48("3604"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3605")) {
          {}
        } else {
          stryCov_9fa48("3605");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3606") ? {} : (stryCov_9fa48("3606"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("3607") ? "" : (stryCov_9fa48("3607"), "unknown"),
            encoding: stryMutAct_9fa48("3608") ? "" : (stryCov_9fa48("3608"), "unknown"),
            hasText: stryMutAct_9fa48("3609") ? true : (stryCov_9fa48("3609"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3610") ? {} : (stryCov_9fa48("3610"), {
            text: stryMutAct_9fa48("3611") ? `` : (stryCov_9fa48("3611"), `Excel Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3612")) {
      {}
    } else {
      stryCov_9fa48("3612");
      try {
        if (stryMutAct_9fa48("3613")) {
          {}
        } else {
          stryCov_9fa48("3613");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3614") ? {} : (stryCov_9fa48("3614"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("3615") ? "" : (stryCov_9fa48("3615"), "unknown"),
            encoding: stryMutAct_9fa48("3616") ? "" : (stryCov_9fa48("3616"), "unknown"),
            hasText: stryMutAct_9fa48("3617") ? true : (stryCov_9fa48("3617"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("3618") ? {} : (stryCov_9fa48("3618"), {
              application: stryMutAct_9fa48("3619") ? "" : (stryCov_9fa48("3619"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("3620") ? {} : (stryCov_9fa48("3620"), {
            text: stryMutAct_9fa48("3621") ? "" : (stryCov_9fa48("3621"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("3622")) {
          {}
        } else {
          stryCov_9fa48("3622");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("3623") ? {} : (stryCov_9fa48("3623"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("3624") ? "" : (stryCov_9fa48("3624"), "unknown"),
            encoding: stryMutAct_9fa48("3625") ? "" : (stryCov_9fa48("3625"), "unknown"),
            hasText: stryMutAct_9fa48("3626") ? true : (stryCov_9fa48("3626"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("3627") ? {} : (stryCov_9fa48("3627"), {
            text: stryMutAct_9fa48("3628") ? `` : (stryCov_9fa48("3628"), `PowerPoint Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("3629")) {
      {}
    } else {
      stryCov_9fa48("3629");
      // Office document signatures
      const signatures = stryMutAct_9fa48("3630") ? [] : (stryCov_9fa48("3630"), [stryMutAct_9fa48("3631") ? {} : (stryCov_9fa48("3631"), {
        signature: Buffer.from(stryMutAct_9fa48("3632") ? [] : (stryCov_9fa48("3632"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("3633") ? "" : (stryCov_9fa48("3633"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("3634") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("3634"), signatures.some(stryMutAct_9fa48("3635") ? () => undefined : (stryCov_9fa48("3635"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("3638") ? false : stryMutAct_9fa48("3637") ? true : stryMutAct_9fa48("3636") ? isZipBased : (stryCov_9fa48("3636", "3637", "3638"), !isZipBased)) {
        if (stryMutAct_9fa48("3639")) {
          {}
        } else {
          stryCov_9fa48("3639");
          return stryMutAct_9fa48("3640") ? {} : (stryCov_9fa48("3640"), {
            supported: stryMutAct_9fa48("3641") ? true : (stryCov_9fa48("3641"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3642") ? "" : (stryCov_9fa48("3642"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3643") ? "" : (stryCov_9fa48("3643"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("3644") ? "" : (stryCov_9fa48("3644"), "ppt/")));
      if (stryMutAct_9fa48("3646") ? false : stryMutAct_9fa48("3645") ? true : (stryCov_9fa48("3645", "3646"), docxMarker)) {
        if (stryMutAct_9fa48("3647")) {
          {}
        } else {
          stryCov_9fa48("3647");
          return stryMutAct_9fa48("3648") ? {} : (stryCov_9fa48("3648"), {
            supported: stryMutAct_9fa48("3649") ? false : (stryCov_9fa48("3649"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("3651") ? false : stryMutAct_9fa48("3650") ? true : (stryCov_9fa48("3650", "3651"), xlsxMarker)) {
        if (stryMutAct_9fa48("3652")) {
          {}
        } else {
          stryCov_9fa48("3652");
          return stryMutAct_9fa48("3653") ? {} : (stryCov_9fa48("3653"), {
            supported: stryMutAct_9fa48("3654") ? false : (stryCov_9fa48("3654"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("3656") ? false : stryMutAct_9fa48("3655") ? true : (stryCov_9fa48("3655", "3656"), pptxMarker)) {
        if (stryMutAct_9fa48("3657")) {
          {}
        } else {
          stryCov_9fa48("3657");
          return stryMutAct_9fa48("3658") ? {} : (stryCov_9fa48("3658"), {
            supported: stryMutAct_9fa48("3659") ? false : (stryCov_9fa48("3659"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("3660") ? {} : (stryCov_9fa48("3660"), {
        supported: stryMutAct_9fa48("3661") ? true : (stryCov_9fa48("3661"), false)
      });
    }
  }
}