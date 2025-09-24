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
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      try {
        if (stryMutAct_9fa48("1")) {
          {}
        } else {
          stryCov_9fa48("1");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("2")) {} else {
                stryCov_9fa48("2");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("3")) {} else {
                stryCov_9fa48("3");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("4")) {} else {
                stryCov_9fa48("4");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("5")) {} else {
                stryCov_9fa48("5");
                throw new Error(stryMutAct_9fa48("6") ? `` : (stryCov_9fa48("6"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("7")) {
          {}
        } else {
          stryCov_9fa48("7");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("8") ? {} : (stryCov_9fa48("8"), {
            type: contentType,
            language: stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), "unknown"),
            encoding: stryMutAct_9fa48("10") ? "" : (stryCov_9fa48("10"), "unknown"),
            hasText: stryMutAct_9fa48("11") ? true : (stryCov_9fa48("11"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("12") ? {} : (stryCov_9fa48("12"), {
            text: stryMutAct_9fa48("13") ? `` : (stryCov_9fa48("13"), `Office Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("14")) {
      {}
    } else {
      stryCov_9fa48("14");
      try {
        if (stryMutAct_9fa48("15")) {
          {}
        } else {
          stryCov_9fa48("15");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("16")) {
          {}
        } else {
          stryCov_9fa48("16");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("17") ? {} : (stryCov_9fa48("17"), {
            type: contentType,
            language: stryMutAct_9fa48("18") ? "" : (stryCov_9fa48("18"), "unknown"),
            encoding: stryMutAct_9fa48("19") ? "" : (stryCov_9fa48("19"), "unknown"),
            hasText: stryMutAct_9fa48("20") ? true : (stryCov_9fa48("20"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("21") ? {} : (stryCov_9fa48("21"), {
            text: stryMutAct_9fa48("22") ? `` : (stryCov_9fa48("22"), `Office Document Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("23")) {
      {}
    } else {
      stryCov_9fa48("23");
      try {
        if (stryMutAct_9fa48("24")) {
          {}
        } else {
          stryCov_9fa48("24");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("25") ? {} : (stryCov_9fa48("25"), {
            buffer
          }));
          const text = stryMutAct_9fa48("26") ? result.value : (stryCov_9fa48("26"), result.value.trim());
          const words = stryMutAct_9fa48("27") ? text.split(/\s+/) : (stryCov_9fa48("27"), text.split(stryMutAct_9fa48("29") ? /\S+/ : stryMutAct_9fa48("28") ? /\s/ : (stryCov_9fa48("28", "29"), /\s+/)).filter(stryMutAct_9fa48("30") ? () => undefined : (stryCov_9fa48("30"), word => stryMutAct_9fa48("34") ? word.length <= 0 : stryMutAct_9fa48("33") ? word.length >= 0 : stryMutAct_9fa48("32") ? false : stryMutAct_9fa48("31") ? true : (stryCov_9fa48("31", "32", "33", "34"), word.length > 0))));
          const hasText = stryMutAct_9fa48("37") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("36") ? false : stryMutAct_9fa48("35") ? true : (stryCov_9fa48("35", "36", "37"), (stryMutAct_9fa48("40") ? text.length <= 0 : stryMutAct_9fa48("39") ? text.length >= 0 : stryMutAct_9fa48("38") ? true : (stryCov_9fa48("38", "39", "40"), text.length > 0)) && (stryMutAct_9fa48("43") ? words.length <= 0 : stryMutAct_9fa48("42") ? words.length >= 0 : stryMutAct_9fa48("41") ? true : (stryCov_9fa48("41", "42", "43"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("44") ? {} : (stryCov_9fa48("44"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("45") ? {} : (stryCov_9fa48("45"), {
            type: ContentType.OFFICE_DOC,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("46") ? "" : (stryCov_9fa48("46"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("47") ? "" : (stryCov_9fa48("47"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("48") ? {} : (stryCov_9fa48("48"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("49")) {
          {}
        } else {
          stryCov_9fa48("49");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("50") ? {} : (stryCov_9fa48("50"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("51") ? "" : (stryCov_9fa48("51"), "unknown"),
            encoding: stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), "unknown"),
            hasText: stryMutAct_9fa48("53") ? true : (stryCov_9fa48("53"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("54") ? {} : (stryCov_9fa48("54"), {
            text: stryMutAct_9fa48("55") ? `` : (stryCov_9fa48("55"), `Word Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("56")) {
      {}
    } else {
      stryCov_9fa48("56");
      try {
        if (stryMutAct_9fa48("57")) {
          {}
        } else {
          stryCov_9fa48("57");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("58") ? {} : (stryCov_9fa48("58"), {
            type: stryMutAct_9fa48("59") ? "" : (stryCov_9fa48("59"), "buffer")
          }));
          let allText = stryMutAct_9fa48("60") ? "Stryker was here!" : (stryCov_9fa48("60"), "");
          const sheetNames: string[] = stryMutAct_9fa48("61") ? ["Stryker was here"] : (stryCov_9fa48("61"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("62")) {
              {}
            } else {
              stryCov_9fa48("62");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("65") ? csvText : stryMutAct_9fa48("64") ? false : stryMutAct_9fa48("63") ? true : (stryCov_9fa48("63", "64", "65"), csvText.trim())) {
                if (stryMutAct_9fa48("66")) {
                  {}
                } else {
                  stryCov_9fa48("66");
                  allText += stryMutAct_9fa48("67") ? `` : (stryCov_9fa48("67"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("70") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("69") ? false : stryMutAct_9fa48("68") ? true : (stryCov_9fa48("68", "69", "70"), worksheet[stryMutAct_9fa48("71") ? "" : (stryCov_9fa48("71"), "!ref")] || (stryMutAct_9fa48("72") ? "" : (stryCov_9fa48("72"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("75") ? row > range.e.r : stryMutAct_9fa48("74") ? row < range.e.r : stryMutAct_9fa48("73") ? false : (stryCov_9fa48("73", "74", "75"), row <= range.e.r); stryMutAct_9fa48("76") ? row-- : (stryCov_9fa48("76"), row++)) {
                if (stryMutAct_9fa48("77")) {
                  {}
                } else {
                  stryCov_9fa48("77");
                  for (let col = range.s.c; stryMutAct_9fa48("80") ? col > range.e.c : stryMutAct_9fa48("79") ? col < range.e.c : stryMutAct_9fa48("78") ? false : (stryCov_9fa48("78", "79", "80"), col <= range.e.c); stryMutAct_9fa48("81") ? col-- : (stryCov_9fa48("81"), col++)) {
                    if (stryMutAct_9fa48("82")) {
                      {}
                    } else {
                      stryCov_9fa48("82");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("83") ? {} : (stryCov_9fa48("83"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("86") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("85") ? false : stryMutAct_9fa48("84") ? true : (stryCov_9fa48("84", "85", "86"), worksheet[cellAddress] && (stryMutAct_9fa48("88") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("87") ? true : (stryCov_9fa48("87", "88"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("89")) {
                          {}
                        } else {
                          stryCov_9fa48("89");
                          stryMutAct_9fa48("90") ? totalCells-- : (stryCov_9fa48("90"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("91") ? allText : (stryCov_9fa48("91"), allText.trim());
          const words = stryMutAct_9fa48("92") ? text.split(/\s+/) : (stryCov_9fa48("92"), text.split(stryMutAct_9fa48("94") ? /\S+/ : stryMutAct_9fa48("93") ? /\s/ : (stryCov_9fa48("93", "94"), /\s+/)).filter(stryMutAct_9fa48("95") ? () => undefined : (stryCov_9fa48("95"), word => stryMutAct_9fa48("99") ? word.length <= 0 : stryMutAct_9fa48("98") ? word.length >= 0 : stryMutAct_9fa48("97") ? false : stryMutAct_9fa48("96") ? true : (stryCov_9fa48("96", "97", "98", "99"), word.length > 0))));
          const hasText = stryMutAct_9fa48("102") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("101") ? false : stryMutAct_9fa48("100") ? true : (stryCov_9fa48("100", "101", "102"), (stryMutAct_9fa48("105") ? text.length <= 0 : stryMutAct_9fa48("104") ? text.length >= 0 : stryMutAct_9fa48("103") ? true : (stryCov_9fa48("103", "104", "105"), text.length > 0)) && (stryMutAct_9fa48("108") ? words.length <= 0 : stryMutAct_9fa48("107") ? words.length >= 0 : stryMutAct_9fa48("106") ? true : (stryCov_9fa48("106", "107", "108"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("109") ? {} : (stryCov_9fa48("109"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("110") ? "" : (stryCov_9fa48("110"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("111") ? {} : (stryCov_9fa48("111"), {
            type: ContentType.OFFICE_SHEET,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("112") ? "" : (stryCov_9fa48("112"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("113") ? `` : (stryCov_9fa48("113"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("114") ? {} : (stryCov_9fa48("114"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("115")) {
          {}
        } else {
          stryCov_9fa48("115");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("116") ? {} : (stryCov_9fa48("116"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("117") ? "" : (stryCov_9fa48("117"), "unknown"),
            encoding: stryMutAct_9fa48("118") ? "" : (stryCov_9fa48("118"), "unknown"),
            hasText: stryMutAct_9fa48("119") ? true : (stryCov_9fa48("119"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("120") ? {} : (stryCov_9fa48("120"), {
            text: stryMutAct_9fa48("121") ? `` : (stryCov_9fa48("121"), `Excel Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("122")) {
      {}
    } else {
      stryCov_9fa48("122");
      try {
        if (stryMutAct_9fa48("123")) {
          {}
        } else {
          stryCov_9fa48("123");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("124") ? {} : (stryCov_9fa48("124"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("125") ? "" : (stryCov_9fa48("125"), "unknown"),
            encoding: stryMutAct_9fa48("126") ? "" : (stryCov_9fa48("126"), "unknown"),
            hasText: stryMutAct_9fa48("127") ? true : (stryCov_9fa48("127"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("128") ? {} : (stryCov_9fa48("128"), {
              application: stryMutAct_9fa48("129") ? "" : (stryCov_9fa48("129"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("130") ? {} : (stryCov_9fa48("130"), {
            text: stryMutAct_9fa48("131") ? "" : (stryCov_9fa48("131"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("132")) {
          {}
        } else {
          stryCov_9fa48("132");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("133") ? {} : (stryCov_9fa48("133"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("134") ? "" : (stryCov_9fa48("134"), "unknown"),
            encoding: stryMutAct_9fa48("135") ? "" : (stryCov_9fa48("135"), "unknown"),
            hasText: stryMutAct_9fa48("136") ? true : (stryCov_9fa48("136"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("137") ? {} : (stryCov_9fa48("137"), {
            text: stryMutAct_9fa48("138") ? `` : (stryCov_9fa48("138"), `PowerPoint Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("139")) {
      {}
    } else {
      stryCov_9fa48("139");
      // Office document signatures
      const signatures = stryMutAct_9fa48("140") ? [] : (stryCov_9fa48("140"), [stryMutAct_9fa48("141") ? {} : (stryCov_9fa48("141"), {
        signature: Buffer.from(stryMutAct_9fa48("142") ? [] : (stryCov_9fa48("142"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("143") ? "" : (stryCov_9fa48("143"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("144") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("144"), signatures.some(stryMutAct_9fa48("145") ? () => undefined : (stryCov_9fa48("145"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("148") ? false : stryMutAct_9fa48("147") ? true : stryMutAct_9fa48("146") ? isZipBased : (stryCov_9fa48("146", "147", "148"), !isZipBased)) {
        if (stryMutAct_9fa48("149")) {
          {}
        } else {
          stryCov_9fa48("149");
          return stryMutAct_9fa48("150") ? {} : (stryCov_9fa48("150"), {
            supported: stryMutAct_9fa48("151") ? true : (stryCov_9fa48("151"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("152") ? "" : (stryCov_9fa48("152"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("153") ? "" : (stryCov_9fa48("153"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("154") ? "" : (stryCov_9fa48("154"), "ppt/")));
      if (stryMutAct_9fa48("156") ? false : stryMutAct_9fa48("155") ? true : (stryCov_9fa48("155", "156"), docxMarker)) {
        if (stryMutAct_9fa48("157")) {
          {}
        } else {
          stryCov_9fa48("157");
          return stryMutAct_9fa48("158") ? {} : (stryCov_9fa48("158"), {
            supported: stryMutAct_9fa48("159") ? false : (stryCov_9fa48("159"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("161") ? false : stryMutAct_9fa48("160") ? true : (stryCov_9fa48("160", "161"), xlsxMarker)) {
        if (stryMutAct_9fa48("162")) {
          {}
        } else {
          stryCov_9fa48("162");
          return stryMutAct_9fa48("163") ? {} : (stryCov_9fa48("163"), {
            supported: stryMutAct_9fa48("164") ? false : (stryCov_9fa48("164"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("166") ? false : stryMutAct_9fa48("165") ? true : (stryCov_9fa48("165", "166"), pptxMarker)) {
        if (stryMutAct_9fa48("167")) {
          {}
        } else {
          stryCov_9fa48("167");
          return stryMutAct_9fa48("168") ? {} : (stryCov_9fa48("168"), {
            supported: stryMutAct_9fa48("169") ? false : (stryCov_9fa48("169"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("170") ? {} : (stryCov_9fa48("170"), {
        supported: stryMutAct_9fa48("171") ? true : (stryCov_9fa48("171"), false)
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("172")) {
      {}
    } else {
      stryCov_9fa48("172");
      if (stryMutAct_9fa48("175") ? !text && text.length === 0 : stryMutAct_9fa48("174") ? false : stryMutAct_9fa48("173") ? true : (stryCov_9fa48("173", "174", "175"), (stryMutAct_9fa48("176") ? text : (stryCov_9fa48("176"), !text)) || (stryMutAct_9fa48("178") ? text.length !== 0 : stryMutAct_9fa48("177") ? false : (stryCov_9fa48("177", "178"), text.length === 0)))) return stryMutAct_9fa48("179") ? "" : (stryCov_9fa48("179"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("182") ? text.match(englishWords) && [] : stryMutAct_9fa48("181") ? false : stryMutAct_9fa48("180") ? true : (stryCov_9fa48("180", "181", "182"), text.match(englishWords) || (stryMutAct_9fa48("183") ? ["Stryker was here"] : (stryCov_9fa48("183"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("186") ? text.match(spanishWords) && [] : stryMutAct_9fa48("185") ? false : stryMutAct_9fa48("184") ? true : (stryCov_9fa48("184", "185", "186"), text.match(spanishWords) || (stryMutAct_9fa48("187") ? ["Stryker was here"] : (stryCov_9fa48("187"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("190") ? text.match(frenchWords) && [] : stryMutAct_9fa48("189") ? false : stryMutAct_9fa48("188") ? true : (stryCov_9fa48("188", "189", "190"), text.match(frenchWords) || (stryMutAct_9fa48("191") ? ["Stryker was here"] : (stryCov_9fa48("191"), [])))).length;
      const maxMatches = stryMutAct_9fa48("192") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("192"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("195") ? maxMatches !== 0 : stryMutAct_9fa48("194") ? false : stryMutAct_9fa48("193") ? true : (stryCov_9fa48("193", "194", "195"), maxMatches === 0)) return stryMutAct_9fa48("196") ? "" : (stryCov_9fa48("196"), "unknown");
      if (stryMutAct_9fa48("199") ? maxMatches !== englishMatches : stryMutAct_9fa48("198") ? false : stryMutAct_9fa48("197") ? true : (stryCov_9fa48("197", "198", "199"), maxMatches === englishMatches)) return stryMutAct_9fa48("200") ? "" : (stryCov_9fa48("200"), "en");
      if (stryMutAct_9fa48("203") ? maxMatches !== spanishMatches : stryMutAct_9fa48("202") ? false : stryMutAct_9fa48("201") ? true : (stryCov_9fa48("201", "202", "203"), maxMatches === spanishMatches)) return stryMutAct_9fa48("204") ? "" : (stryCov_9fa48("204"), "es");
      if (stryMutAct_9fa48("207") ? maxMatches !== frenchMatches : stryMutAct_9fa48("206") ? false : stryMutAct_9fa48("205") ? true : (stryCov_9fa48("205", "206", "207"), maxMatches === frenchMatches)) return stryMutAct_9fa48("208") ? "" : (stryCov_9fa48("208"), "fr");
      return stryMutAct_9fa48("209") ? "" : (stryCov_9fa48("209"), "unknown");
    }
  }
}