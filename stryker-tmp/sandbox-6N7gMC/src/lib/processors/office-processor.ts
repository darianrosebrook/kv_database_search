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
import { ContentType, ContentMetadata } from "../multi-modal.js";
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
    if (stryMutAct_9fa48("647")) {
      {}
    } else {
      stryCov_9fa48("647");
      try {
        if (stryMutAct_9fa48("648")) {
          {}
        } else {
          stryCov_9fa48("648");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("649")) {} else {
                stryCov_9fa48("649");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("650")) {} else {
                stryCov_9fa48("650");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("651")) {} else {
                stryCov_9fa48("651");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("652")) {} else {
                stryCov_9fa48("652");
                throw new Error(stryMutAct_9fa48("653") ? `` : (stryCov_9fa48("653"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("654")) {
          {}
        } else {
          stryCov_9fa48("654");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("655") ? {} : (stryCov_9fa48("655"), {
            type: contentType,
            language: stryMutAct_9fa48("656") ? "" : (stryCov_9fa48("656"), "unknown"),
            encoding: stryMutAct_9fa48("657") ? "" : (stryCov_9fa48("657"), "unknown"),
            hasText: stryMutAct_9fa48("658") ? true : (stryCov_9fa48("658"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("659") ? {} : (stryCov_9fa48("659"), {
            text: stryMutAct_9fa48("660") ? `` : (stryCov_9fa48("660"), `Office Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("661")) {
      {}
    } else {
      stryCov_9fa48("661");
      try {
        if (stryMutAct_9fa48("662")) {
          {}
        } else {
          stryCov_9fa48("662");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("663")) {
          {}
        } else {
          stryCov_9fa48("663");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("664") ? {} : (stryCov_9fa48("664"), {
            type: contentType,
            language: stryMutAct_9fa48("665") ? "" : (stryCov_9fa48("665"), "unknown"),
            encoding: stryMutAct_9fa48("666") ? "" : (stryCov_9fa48("666"), "unknown"),
            hasText: stryMutAct_9fa48("667") ? true : (stryCov_9fa48("667"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("668") ? {} : (stryCov_9fa48("668"), {
            text: stryMutAct_9fa48("669") ? `` : (stryCov_9fa48("669"), `Office Document Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("670")) {
      {}
    } else {
      stryCov_9fa48("670");
      try {
        if (stryMutAct_9fa48("671")) {
          {}
        } else {
          stryCov_9fa48("671");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("672") ? {} : (stryCov_9fa48("672"), {
            buffer
          }));
          const text = stryMutAct_9fa48("673") ? result.value : (stryCov_9fa48("673"), result.value.trim());
          const words = stryMutAct_9fa48("674") ? text.split(/\s+/) : (stryCov_9fa48("674"), text.split(stryMutAct_9fa48("676") ? /\S+/ : stryMutAct_9fa48("675") ? /\s/ : (stryCov_9fa48("675", "676"), /\s+/)).filter(stryMutAct_9fa48("677") ? () => undefined : (stryCov_9fa48("677"), word => stryMutAct_9fa48("681") ? word.length <= 0 : stryMutAct_9fa48("680") ? word.length >= 0 : stryMutAct_9fa48("679") ? false : stryMutAct_9fa48("678") ? true : (stryCov_9fa48("678", "679", "680", "681"), word.length > 0))));
          const hasText = stryMutAct_9fa48("684") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("683") ? false : stryMutAct_9fa48("682") ? true : (stryCov_9fa48("682", "683", "684"), (stryMutAct_9fa48("687") ? text.length <= 0 : stryMutAct_9fa48("686") ? text.length >= 0 : stryMutAct_9fa48("685") ? true : (stryCov_9fa48("685", "686", "687"), text.length > 0)) && (stryMutAct_9fa48("690") ? words.length <= 0 : stryMutAct_9fa48("689") ? words.length >= 0 : stryMutAct_9fa48("688") ? true : (stryCov_9fa48("688", "689", "690"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("691") ? {} : (stryCov_9fa48("691"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("692") ? {} : (stryCov_9fa48("692"), {
            type: ContentType.OFFICE_DOC,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("693") ? "" : (stryCov_9fa48("693"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("694") ? "" : (stryCov_9fa48("694"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("695") ? {} : (stryCov_9fa48("695"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("696")) {
          {}
        } else {
          stryCov_9fa48("696");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("697") ? {} : (stryCov_9fa48("697"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("698") ? "" : (stryCov_9fa48("698"), "unknown"),
            encoding: stryMutAct_9fa48("699") ? "" : (stryCov_9fa48("699"), "unknown"),
            hasText: stryMutAct_9fa48("700") ? true : (stryCov_9fa48("700"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("701") ? {} : (stryCov_9fa48("701"), {
            text: stryMutAct_9fa48("702") ? `` : (stryCov_9fa48("702"), `Word Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("703")) {
      {}
    } else {
      stryCov_9fa48("703");
      try {
        if (stryMutAct_9fa48("704")) {
          {}
        } else {
          stryCov_9fa48("704");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("705") ? {} : (stryCov_9fa48("705"), {
            type: stryMutAct_9fa48("706") ? "" : (stryCov_9fa48("706"), "buffer")
          }));
          let allText = stryMutAct_9fa48("707") ? "Stryker was here!" : (stryCov_9fa48("707"), "");
          const sheetNames: string[] = stryMutAct_9fa48("708") ? ["Stryker was here"] : (stryCov_9fa48("708"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("709")) {
              {}
            } else {
              stryCov_9fa48("709");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("712") ? csvText : stryMutAct_9fa48("711") ? false : stryMutAct_9fa48("710") ? true : (stryCov_9fa48("710", "711", "712"), csvText.trim())) {
                if (stryMutAct_9fa48("713")) {
                  {}
                } else {
                  stryCov_9fa48("713");
                  allText += stryMutAct_9fa48("714") ? `` : (stryCov_9fa48("714"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("717") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("716") ? false : stryMutAct_9fa48("715") ? true : (stryCov_9fa48("715", "716", "717"), worksheet[stryMutAct_9fa48("718") ? "" : (stryCov_9fa48("718"), "!ref")] || (stryMutAct_9fa48("719") ? "" : (stryCov_9fa48("719"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("722") ? row > range.e.r : stryMutAct_9fa48("721") ? row < range.e.r : stryMutAct_9fa48("720") ? false : (stryCov_9fa48("720", "721", "722"), row <= range.e.r); stryMutAct_9fa48("723") ? row-- : (stryCov_9fa48("723"), row++)) {
                if (stryMutAct_9fa48("724")) {
                  {}
                } else {
                  stryCov_9fa48("724");
                  for (let col = range.s.c; stryMutAct_9fa48("727") ? col > range.e.c : stryMutAct_9fa48("726") ? col < range.e.c : stryMutAct_9fa48("725") ? false : (stryCov_9fa48("725", "726", "727"), col <= range.e.c); stryMutAct_9fa48("728") ? col-- : (stryCov_9fa48("728"), col++)) {
                    if (stryMutAct_9fa48("729")) {
                      {}
                    } else {
                      stryCov_9fa48("729");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("730") ? {} : (stryCov_9fa48("730"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("733") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("732") ? false : stryMutAct_9fa48("731") ? true : (stryCov_9fa48("731", "732", "733"), worksheet[cellAddress] && (stryMutAct_9fa48("735") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("734") ? true : (stryCov_9fa48("734", "735"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("736")) {
                          {}
                        } else {
                          stryCov_9fa48("736");
                          stryMutAct_9fa48("737") ? totalCells-- : (stryCov_9fa48("737"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("738") ? allText : (stryCov_9fa48("738"), allText.trim());
          const words = stryMutAct_9fa48("739") ? text.split(/\s+/) : (stryCov_9fa48("739"), text.split(stryMutAct_9fa48("741") ? /\S+/ : stryMutAct_9fa48("740") ? /\s/ : (stryCov_9fa48("740", "741"), /\s+/)).filter(stryMutAct_9fa48("742") ? () => undefined : (stryCov_9fa48("742"), word => stryMutAct_9fa48("746") ? word.length <= 0 : stryMutAct_9fa48("745") ? word.length >= 0 : stryMutAct_9fa48("744") ? false : stryMutAct_9fa48("743") ? true : (stryCov_9fa48("743", "744", "745", "746"), word.length > 0))));
          const hasText = stryMutAct_9fa48("749") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("748") ? false : stryMutAct_9fa48("747") ? true : (stryCov_9fa48("747", "748", "749"), (stryMutAct_9fa48("752") ? text.length <= 0 : stryMutAct_9fa48("751") ? text.length >= 0 : stryMutAct_9fa48("750") ? true : (stryCov_9fa48("750", "751", "752"), text.length > 0)) && (stryMutAct_9fa48("755") ? words.length <= 0 : stryMutAct_9fa48("754") ? words.length >= 0 : stryMutAct_9fa48("753") ? true : (stryCov_9fa48("753", "754", "755"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("756") ? {} : (stryCov_9fa48("756"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("757") ? "" : (stryCov_9fa48("757"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("758") ? {} : (stryCov_9fa48("758"), {
            type: ContentType.OFFICE_SHEET,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("759") ? "" : (stryCov_9fa48("759"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("760") ? `` : (stryCov_9fa48("760"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("761") ? {} : (stryCov_9fa48("761"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("762")) {
          {}
        } else {
          stryCov_9fa48("762");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("763") ? {} : (stryCov_9fa48("763"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("764") ? "" : (stryCov_9fa48("764"), "unknown"),
            encoding: stryMutAct_9fa48("765") ? "" : (stryCov_9fa48("765"), "unknown"),
            hasText: stryMutAct_9fa48("766") ? true : (stryCov_9fa48("766"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("767") ? {} : (stryCov_9fa48("767"), {
            text: stryMutAct_9fa48("768") ? `` : (stryCov_9fa48("768"), `Excel Document Error: ${errorMessage}`),
            metadata: contentMetadata
          });
        }
      }
    }
  }

  /**
   * Extract text from PPTX files (basic implementation)
   */
  private async extractPptxFromBuffer(buffer: Buffer): Promise<{
    text: string;
    metadata: OfficeContentMetadata;
  }> {
    if (stryMutAct_9fa48("769")) {
      {}
    } else {
      stryCov_9fa48("769");
      try {
        if (stryMutAct_9fa48("770")) {
          {}
        } else {
          stryCov_9fa48("770");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("771") ? {} : (stryCov_9fa48("771"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("772") ? "" : (stryCov_9fa48("772"), "unknown"),
            encoding: stryMutAct_9fa48("773") ? "" : (stryCov_9fa48("773"), "unknown"),
            hasText: stryMutAct_9fa48("774") ? true : (stryCov_9fa48("774"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("775") ? {} : (stryCov_9fa48("775"), {
              application: stryMutAct_9fa48("776") ? "" : (stryCov_9fa48("776"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("777") ? {} : (stryCov_9fa48("777"), {
            text: stryMutAct_9fa48("778") ? "" : (stryCov_9fa48("778"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("779")) {
          {}
        } else {
          stryCov_9fa48("779");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("780") ? {} : (stryCov_9fa48("780"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("781") ? "" : (stryCov_9fa48("781"), "unknown"),
            encoding: stryMutAct_9fa48("782") ? "" : (stryCov_9fa48("782"), "unknown"),
            hasText: stryMutAct_9fa48("783") ? true : (stryCov_9fa48("783"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("784") ? {} : (stryCov_9fa48("784"), {
            text: stryMutAct_9fa48("785") ? `` : (stryCov_9fa48("785"), `PowerPoint Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("786")) {
      {}
    } else {
      stryCov_9fa48("786");
      // Office document signatures
      const signatures = stryMutAct_9fa48("787") ? [] : (stryCov_9fa48("787"), [stryMutAct_9fa48("788") ? {} : (stryCov_9fa48("788"), {
        signature: Buffer.from(stryMutAct_9fa48("789") ? [] : (stryCov_9fa48("789"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("790") ? "" : (stryCov_9fa48("790"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("791") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("791"), signatures.some(stryMutAct_9fa48("792") ? () => undefined : (stryCov_9fa48("792"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("795") ? false : stryMutAct_9fa48("794") ? true : stryMutAct_9fa48("793") ? isZipBased : (stryCov_9fa48("793", "794", "795"), !isZipBased)) {
        if (stryMutAct_9fa48("796")) {
          {}
        } else {
          stryCov_9fa48("796");
          return stryMutAct_9fa48("797") ? {} : (stryCov_9fa48("797"), {
            supported: stryMutAct_9fa48("798") ? true : (stryCov_9fa48("798"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("799") ? "" : (stryCov_9fa48("799"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("800") ? "" : (stryCov_9fa48("800"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("801") ? "" : (stryCov_9fa48("801"), "ppt/")));
      if (stryMutAct_9fa48("803") ? false : stryMutAct_9fa48("802") ? true : (stryCov_9fa48("802", "803"), docxMarker)) {
        if (stryMutAct_9fa48("804")) {
          {}
        } else {
          stryCov_9fa48("804");
          return stryMutAct_9fa48("805") ? {} : (stryCov_9fa48("805"), {
            supported: stryMutAct_9fa48("806") ? false : (stryCov_9fa48("806"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("808") ? false : stryMutAct_9fa48("807") ? true : (stryCov_9fa48("807", "808"), xlsxMarker)) {
        if (stryMutAct_9fa48("809")) {
          {}
        } else {
          stryCov_9fa48("809");
          return stryMutAct_9fa48("810") ? {} : (stryCov_9fa48("810"), {
            supported: stryMutAct_9fa48("811") ? false : (stryCov_9fa48("811"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("813") ? false : stryMutAct_9fa48("812") ? true : (stryCov_9fa48("812", "813"), pptxMarker)) {
        if (stryMutAct_9fa48("814")) {
          {}
        } else {
          stryCov_9fa48("814");
          return stryMutAct_9fa48("815") ? {} : (stryCov_9fa48("815"), {
            supported: stryMutAct_9fa48("816") ? false : (stryCov_9fa48("816"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("817") ? {} : (stryCov_9fa48("817"), {
        supported: stryMutAct_9fa48("818") ? true : (stryCov_9fa48("818"), false)
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("819")) {
      {}
    } else {
      stryCov_9fa48("819");
      if (stryMutAct_9fa48("822") ? !text && text.length === 0 : stryMutAct_9fa48("821") ? false : stryMutAct_9fa48("820") ? true : (stryCov_9fa48("820", "821", "822"), (stryMutAct_9fa48("823") ? text : (stryCov_9fa48("823"), !text)) || (stryMutAct_9fa48("825") ? text.length !== 0 : stryMutAct_9fa48("824") ? false : (stryCov_9fa48("824", "825"), text.length === 0)))) return stryMutAct_9fa48("826") ? "" : (stryCov_9fa48("826"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("829") ? text.match(englishWords) && [] : stryMutAct_9fa48("828") ? false : stryMutAct_9fa48("827") ? true : (stryCov_9fa48("827", "828", "829"), text.match(englishWords) || (stryMutAct_9fa48("830") ? ["Stryker was here"] : (stryCov_9fa48("830"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("833") ? text.match(spanishWords) && [] : stryMutAct_9fa48("832") ? false : stryMutAct_9fa48("831") ? true : (stryCov_9fa48("831", "832", "833"), text.match(spanishWords) || (stryMutAct_9fa48("834") ? ["Stryker was here"] : (stryCov_9fa48("834"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("837") ? text.match(frenchWords) && [] : stryMutAct_9fa48("836") ? false : stryMutAct_9fa48("835") ? true : (stryCov_9fa48("835", "836", "837"), text.match(frenchWords) || (stryMutAct_9fa48("838") ? ["Stryker was here"] : (stryCov_9fa48("838"), [])))).length;
      const maxMatches = stryMutAct_9fa48("839") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("839"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("842") ? maxMatches !== 0 : stryMutAct_9fa48("841") ? false : stryMutAct_9fa48("840") ? true : (stryCov_9fa48("840", "841", "842"), maxMatches === 0)) return stryMutAct_9fa48("843") ? "" : (stryCov_9fa48("843"), "unknown");
      if (stryMutAct_9fa48("846") ? maxMatches !== englishMatches : stryMutAct_9fa48("845") ? false : stryMutAct_9fa48("844") ? true : (stryCov_9fa48("844", "845", "846"), maxMatches === englishMatches)) return stryMutAct_9fa48("847") ? "" : (stryCov_9fa48("847"), "en");
      if (stryMutAct_9fa48("850") ? maxMatches !== spanishMatches : stryMutAct_9fa48("849") ? false : stryMutAct_9fa48("848") ? true : (stryCov_9fa48("848", "849", "850"), maxMatches === spanishMatches)) return stryMutAct_9fa48("851") ? "" : (stryCov_9fa48("851"), "es");
      if (stryMutAct_9fa48("854") ? maxMatches !== frenchMatches : stryMutAct_9fa48("853") ? false : stryMutAct_9fa48("852") ? true : (stryCov_9fa48("852", "853", "854"), maxMatches === frenchMatches)) return stryMutAct_9fa48("855") ? "" : (stryCov_9fa48("855"), "fr");
      return stryMutAct_9fa48("856") ? "" : (stryCov_9fa48("856"), "unknown");
    }
  }
}