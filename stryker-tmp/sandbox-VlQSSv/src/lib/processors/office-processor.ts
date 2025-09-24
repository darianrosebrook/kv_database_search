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
    if (stryMutAct_9fa48("1636")) {
      {}
    } else {
      stryCov_9fa48("1636");
      try {
        if (stryMutAct_9fa48("1637")) {
          {}
        } else {
          stryCov_9fa48("1637");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("1638")) {} else {
                stryCov_9fa48("1638");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("1639")) {} else {
                stryCov_9fa48("1639");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("1640")) {} else {
                stryCov_9fa48("1640");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("1641")) {} else {
                stryCov_9fa48("1641");
                throw new Error(stryMutAct_9fa48("1642") ? `` : (stryCov_9fa48("1642"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1643")) {
          {}
        } else {
          stryCov_9fa48("1643");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1644") ? {} : (stryCov_9fa48("1644"), {
            type: contentType,
            language: stryMutAct_9fa48("1645") ? "" : (stryCov_9fa48("1645"), "unknown"),
            encoding: stryMutAct_9fa48("1646") ? "" : (stryCov_9fa48("1646"), "unknown"),
            hasText: stryMutAct_9fa48("1647") ? true : (stryCov_9fa48("1647"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1648") ? {} : (stryCov_9fa48("1648"), {
            text: stryMutAct_9fa48("1649") ? `` : (stryCov_9fa48("1649"), `Office Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1650")) {
      {}
    } else {
      stryCov_9fa48("1650");
      try {
        if (stryMutAct_9fa48("1651")) {
          {}
        } else {
          stryCov_9fa48("1651");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1652")) {
          {}
        } else {
          stryCov_9fa48("1652");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1653") ? {} : (stryCov_9fa48("1653"), {
            type: contentType,
            language: stryMutAct_9fa48("1654") ? "" : (stryCov_9fa48("1654"), "unknown"),
            encoding: stryMutAct_9fa48("1655") ? "" : (stryCov_9fa48("1655"), "unknown"),
            hasText: stryMutAct_9fa48("1656") ? true : (stryCov_9fa48("1656"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1657") ? {} : (stryCov_9fa48("1657"), {
            text: stryMutAct_9fa48("1658") ? `` : (stryCov_9fa48("1658"), `Office Document Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("1659")) {
      {}
    } else {
      stryCov_9fa48("1659");
      try {
        if (stryMutAct_9fa48("1660")) {
          {}
        } else {
          stryCov_9fa48("1660");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("1661") ? {} : (stryCov_9fa48("1661"), {
            buffer
          }));
          const text = stryMutAct_9fa48("1662") ? result.value : (stryCov_9fa48("1662"), result.value.trim());
          const words = stryMutAct_9fa48("1663") ? text.split(/\s+/) : (stryCov_9fa48("1663"), text.split(stryMutAct_9fa48("1665") ? /\S+/ : stryMutAct_9fa48("1664") ? /\s/ : (stryCov_9fa48("1664", "1665"), /\s+/)).filter(stryMutAct_9fa48("1666") ? () => undefined : (stryCov_9fa48("1666"), word => stryMutAct_9fa48("1670") ? word.length <= 0 : stryMutAct_9fa48("1669") ? word.length >= 0 : stryMutAct_9fa48("1668") ? false : stryMutAct_9fa48("1667") ? true : (stryCov_9fa48("1667", "1668", "1669", "1670"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1673") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1672") ? false : stryMutAct_9fa48("1671") ? true : (stryCov_9fa48("1671", "1672", "1673"), (stryMutAct_9fa48("1676") ? text.length <= 0 : stryMutAct_9fa48("1675") ? text.length >= 0 : stryMutAct_9fa48("1674") ? true : (stryCov_9fa48("1674", "1675", "1676"), text.length > 0)) && (stryMutAct_9fa48("1679") ? words.length <= 0 : stryMutAct_9fa48("1678") ? words.length >= 0 : stryMutAct_9fa48("1677") ? true : (stryCov_9fa48("1677", "1678", "1679"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("1680") ? {} : (stryCov_9fa48("1680"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1681") ? {} : (stryCov_9fa48("1681"), {
            type: ContentType.OFFICE_DOC,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1682") ? "" : (stryCov_9fa48("1682"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("1683") ? "" : (stryCov_9fa48("1683"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("1684") ? {} : (stryCov_9fa48("1684"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1685")) {
          {}
        } else {
          stryCov_9fa48("1685");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1686") ? {} : (stryCov_9fa48("1686"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("1687") ? "" : (stryCov_9fa48("1687"), "unknown"),
            encoding: stryMutAct_9fa48("1688") ? "" : (stryCov_9fa48("1688"), "unknown"),
            hasText: stryMutAct_9fa48("1689") ? true : (stryCov_9fa48("1689"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1690") ? {} : (stryCov_9fa48("1690"), {
            text: stryMutAct_9fa48("1691") ? `` : (stryCov_9fa48("1691"), `Word Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1692")) {
      {}
    } else {
      stryCov_9fa48("1692");
      try {
        if (stryMutAct_9fa48("1693")) {
          {}
        } else {
          stryCov_9fa48("1693");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("1694") ? {} : (stryCov_9fa48("1694"), {
            type: stryMutAct_9fa48("1695") ? "" : (stryCov_9fa48("1695"), "buffer")
          }));
          let allText = stryMutAct_9fa48("1696") ? "Stryker was here!" : (stryCov_9fa48("1696"), "");
          const sheetNames: string[] = stryMutAct_9fa48("1697") ? ["Stryker was here"] : (stryCov_9fa48("1697"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("1698")) {
              {}
            } else {
              stryCov_9fa48("1698");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("1701") ? csvText : stryMutAct_9fa48("1700") ? false : stryMutAct_9fa48("1699") ? true : (stryCov_9fa48("1699", "1700", "1701"), csvText.trim())) {
                if (stryMutAct_9fa48("1702")) {
                  {}
                } else {
                  stryCov_9fa48("1702");
                  allText += stryMutAct_9fa48("1703") ? `` : (stryCov_9fa48("1703"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("1706") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("1705") ? false : stryMutAct_9fa48("1704") ? true : (stryCov_9fa48("1704", "1705", "1706"), worksheet[stryMutAct_9fa48("1707") ? "" : (stryCov_9fa48("1707"), "!ref")] || (stryMutAct_9fa48("1708") ? "" : (stryCov_9fa48("1708"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("1711") ? row > range.e.r : stryMutAct_9fa48("1710") ? row < range.e.r : stryMutAct_9fa48("1709") ? false : (stryCov_9fa48("1709", "1710", "1711"), row <= range.e.r); stryMutAct_9fa48("1712") ? row-- : (stryCov_9fa48("1712"), row++)) {
                if (stryMutAct_9fa48("1713")) {
                  {}
                } else {
                  stryCov_9fa48("1713");
                  for (let col = range.s.c; stryMutAct_9fa48("1716") ? col > range.e.c : stryMutAct_9fa48("1715") ? col < range.e.c : stryMutAct_9fa48("1714") ? false : (stryCov_9fa48("1714", "1715", "1716"), col <= range.e.c); stryMutAct_9fa48("1717") ? col-- : (stryCov_9fa48("1717"), col++)) {
                    if (stryMutAct_9fa48("1718")) {
                      {}
                    } else {
                      stryCov_9fa48("1718");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("1719") ? {} : (stryCov_9fa48("1719"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("1722") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("1721") ? false : stryMutAct_9fa48("1720") ? true : (stryCov_9fa48("1720", "1721", "1722"), worksheet[cellAddress] && (stryMutAct_9fa48("1724") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("1723") ? true : (stryCov_9fa48("1723", "1724"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("1725")) {
                          {}
                        } else {
                          stryCov_9fa48("1725");
                          stryMutAct_9fa48("1726") ? totalCells-- : (stryCov_9fa48("1726"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("1727") ? allText : (stryCov_9fa48("1727"), allText.trim());
          const words = stryMutAct_9fa48("1728") ? text.split(/\s+/) : (stryCov_9fa48("1728"), text.split(stryMutAct_9fa48("1730") ? /\S+/ : stryMutAct_9fa48("1729") ? /\s/ : (stryCov_9fa48("1729", "1730"), /\s+/)).filter(stryMutAct_9fa48("1731") ? () => undefined : (stryCov_9fa48("1731"), word => stryMutAct_9fa48("1735") ? word.length <= 0 : stryMutAct_9fa48("1734") ? word.length >= 0 : stryMutAct_9fa48("1733") ? false : stryMutAct_9fa48("1732") ? true : (stryCov_9fa48("1732", "1733", "1734", "1735"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1738") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1737") ? false : stryMutAct_9fa48("1736") ? true : (stryCov_9fa48("1736", "1737", "1738"), (stryMutAct_9fa48("1741") ? text.length <= 0 : stryMutAct_9fa48("1740") ? text.length >= 0 : stryMutAct_9fa48("1739") ? true : (stryCov_9fa48("1739", "1740", "1741"), text.length > 0)) && (stryMutAct_9fa48("1744") ? words.length <= 0 : stryMutAct_9fa48("1743") ? words.length >= 0 : stryMutAct_9fa48("1742") ? true : (stryCov_9fa48("1742", "1743", "1744"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("1745") ? {} : (stryCov_9fa48("1745"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("1746") ? "" : (stryCov_9fa48("1746"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1747") ? {} : (stryCov_9fa48("1747"), {
            type: ContentType.OFFICE_SHEET,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1748") ? "" : (stryCov_9fa48("1748"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("1749") ? `` : (stryCov_9fa48("1749"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("1750") ? {} : (stryCov_9fa48("1750"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1751")) {
          {}
        } else {
          stryCov_9fa48("1751");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1752") ? {} : (stryCov_9fa48("1752"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("1753") ? "" : (stryCov_9fa48("1753"), "unknown"),
            encoding: stryMutAct_9fa48("1754") ? "" : (stryCov_9fa48("1754"), "unknown"),
            hasText: stryMutAct_9fa48("1755") ? true : (stryCov_9fa48("1755"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1756") ? {} : (stryCov_9fa48("1756"), {
            text: stryMutAct_9fa48("1757") ? `` : (stryCov_9fa48("1757"), `Excel Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1758")) {
      {}
    } else {
      stryCov_9fa48("1758");
      try {
        if (stryMutAct_9fa48("1759")) {
          {}
        } else {
          stryCov_9fa48("1759");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1760") ? {} : (stryCov_9fa48("1760"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("1761") ? "" : (stryCov_9fa48("1761"), "unknown"),
            encoding: stryMutAct_9fa48("1762") ? "" : (stryCov_9fa48("1762"), "unknown"),
            hasText: stryMutAct_9fa48("1763") ? true : (stryCov_9fa48("1763"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("1764") ? {} : (stryCov_9fa48("1764"), {
              application: stryMutAct_9fa48("1765") ? "" : (stryCov_9fa48("1765"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("1766") ? {} : (stryCov_9fa48("1766"), {
            text: stryMutAct_9fa48("1767") ? "" : (stryCov_9fa48("1767"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1768")) {
          {}
        } else {
          stryCov_9fa48("1768");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1769") ? {} : (stryCov_9fa48("1769"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("1770") ? "" : (stryCov_9fa48("1770"), "unknown"),
            encoding: stryMutAct_9fa48("1771") ? "" : (stryCov_9fa48("1771"), "unknown"),
            hasText: stryMutAct_9fa48("1772") ? true : (stryCov_9fa48("1772"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1773") ? {} : (stryCov_9fa48("1773"), {
            text: stryMutAct_9fa48("1774") ? `` : (stryCov_9fa48("1774"), `PowerPoint Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1775")) {
      {}
    } else {
      stryCov_9fa48("1775");
      // Office document signatures
      const signatures = stryMutAct_9fa48("1776") ? [] : (stryCov_9fa48("1776"), [stryMutAct_9fa48("1777") ? {} : (stryCov_9fa48("1777"), {
        signature: Buffer.from(stryMutAct_9fa48("1778") ? [] : (stryCov_9fa48("1778"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("1779") ? "" : (stryCov_9fa48("1779"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("1780") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("1780"), signatures.some(stryMutAct_9fa48("1781") ? () => undefined : (stryCov_9fa48("1781"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("1784") ? false : stryMutAct_9fa48("1783") ? true : stryMutAct_9fa48("1782") ? isZipBased : (stryCov_9fa48("1782", "1783", "1784"), !isZipBased)) {
        if (stryMutAct_9fa48("1785")) {
          {}
        } else {
          stryCov_9fa48("1785");
          return stryMutAct_9fa48("1786") ? {} : (stryCov_9fa48("1786"), {
            supported: stryMutAct_9fa48("1787") ? true : (stryCov_9fa48("1787"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1788") ? "" : (stryCov_9fa48("1788"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1789") ? "" : (stryCov_9fa48("1789"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1790") ? "" : (stryCov_9fa48("1790"), "ppt/")));
      if (stryMutAct_9fa48("1792") ? false : stryMutAct_9fa48("1791") ? true : (stryCov_9fa48("1791", "1792"), docxMarker)) {
        if (stryMutAct_9fa48("1793")) {
          {}
        } else {
          stryCov_9fa48("1793");
          return stryMutAct_9fa48("1794") ? {} : (stryCov_9fa48("1794"), {
            supported: stryMutAct_9fa48("1795") ? false : (stryCov_9fa48("1795"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("1797") ? false : stryMutAct_9fa48("1796") ? true : (stryCov_9fa48("1796", "1797"), xlsxMarker)) {
        if (stryMutAct_9fa48("1798")) {
          {}
        } else {
          stryCov_9fa48("1798");
          return stryMutAct_9fa48("1799") ? {} : (stryCov_9fa48("1799"), {
            supported: stryMutAct_9fa48("1800") ? false : (stryCov_9fa48("1800"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("1802") ? false : stryMutAct_9fa48("1801") ? true : (stryCov_9fa48("1801", "1802"), pptxMarker)) {
        if (stryMutAct_9fa48("1803")) {
          {}
        } else {
          stryCov_9fa48("1803");
          return stryMutAct_9fa48("1804") ? {} : (stryCov_9fa48("1804"), {
            supported: stryMutAct_9fa48("1805") ? false : (stryCov_9fa48("1805"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("1806") ? {} : (stryCov_9fa48("1806"), {
        supported: stryMutAct_9fa48("1807") ? true : (stryCov_9fa48("1807"), false)
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("1808")) {
      {}
    } else {
      stryCov_9fa48("1808");
      if (stryMutAct_9fa48("1811") ? !text && text.length === 0 : stryMutAct_9fa48("1810") ? false : stryMutAct_9fa48("1809") ? true : (stryCov_9fa48("1809", "1810", "1811"), (stryMutAct_9fa48("1812") ? text : (stryCov_9fa48("1812"), !text)) || (stryMutAct_9fa48("1814") ? text.length !== 0 : stryMutAct_9fa48("1813") ? false : (stryCov_9fa48("1813", "1814"), text.length === 0)))) return stryMutAct_9fa48("1815") ? "" : (stryCov_9fa48("1815"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("1818") ? text.match(englishWords) && [] : stryMutAct_9fa48("1817") ? false : stryMutAct_9fa48("1816") ? true : (stryCov_9fa48("1816", "1817", "1818"), text.match(englishWords) || (stryMutAct_9fa48("1819") ? ["Stryker was here"] : (stryCov_9fa48("1819"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("1822") ? text.match(spanishWords) && [] : stryMutAct_9fa48("1821") ? false : stryMutAct_9fa48("1820") ? true : (stryCov_9fa48("1820", "1821", "1822"), text.match(spanishWords) || (stryMutAct_9fa48("1823") ? ["Stryker was here"] : (stryCov_9fa48("1823"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("1826") ? text.match(frenchWords) && [] : stryMutAct_9fa48("1825") ? false : stryMutAct_9fa48("1824") ? true : (stryCov_9fa48("1824", "1825", "1826"), text.match(frenchWords) || (stryMutAct_9fa48("1827") ? ["Stryker was here"] : (stryCov_9fa48("1827"), [])))).length;
      const maxMatches = stryMutAct_9fa48("1828") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("1828"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("1831") ? maxMatches !== 0 : stryMutAct_9fa48("1830") ? false : stryMutAct_9fa48("1829") ? true : (stryCov_9fa48("1829", "1830", "1831"), maxMatches === 0)) return stryMutAct_9fa48("1832") ? "" : (stryCov_9fa48("1832"), "unknown");
      if (stryMutAct_9fa48("1835") ? maxMatches !== englishMatches : stryMutAct_9fa48("1834") ? false : stryMutAct_9fa48("1833") ? true : (stryCov_9fa48("1833", "1834", "1835"), maxMatches === englishMatches)) return stryMutAct_9fa48("1836") ? "" : (stryCov_9fa48("1836"), "en");
      if (stryMutAct_9fa48("1839") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1838") ? false : stryMutAct_9fa48("1837") ? true : (stryCov_9fa48("1837", "1838", "1839"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1840") ? "" : (stryCov_9fa48("1840"), "es");
      if (stryMutAct_9fa48("1843") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1842") ? false : stryMutAct_9fa48("1841") ? true : (stryCov_9fa48("1841", "1842", "1843"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1844") ? "" : (stryCov_9fa48("1844"), "fr");
      return stryMutAct_9fa48("1845") ? "" : (stryCov_9fa48("1845"), "unknown");
    }
  }
}