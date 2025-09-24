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
    if (stryMutAct_9fa48("1632")) {
      {}
    } else {
      stryCov_9fa48("1632");
      try {
        if (stryMutAct_9fa48("1633")) {
          {}
        } else {
          stryCov_9fa48("1633");
          switch (contentType) {
            case ContentType.OFFICE_DOC:
              if (stryMutAct_9fa48("1634")) {} else {
                stryCov_9fa48("1634");
                return await this.extractDocxFromBuffer(buffer);
              }
            case ContentType.OFFICE_SHEET:
              if (stryMutAct_9fa48("1635")) {} else {
                stryCov_9fa48("1635");
                return await this.extractXlsxFromBuffer(buffer);
              }
            case ContentType.OFFICE_PRESENTATION:
              if (stryMutAct_9fa48("1636")) {} else {
                stryCov_9fa48("1636");
                return await this.extractPptxFromBuffer(buffer);
              }
            default:
              if (stryMutAct_9fa48("1637")) {} else {
                stryCov_9fa48("1637");
                throw new Error(stryMutAct_9fa48("1638") ? `` : (stryCov_9fa48("1638"), `Unsupported Office document type: ${contentType}`));
              }
          }
        }
      } catch (error) {
        if (stryMutAct_9fa48("1639")) {
          {}
        } else {
          stryCov_9fa48("1639");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1640") ? {} : (stryCov_9fa48("1640"), {
            type: contentType,
            language: stryMutAct_9fa48("1641") ? "" : (stryCov_9fa48("1641"), "unknown"),
            encoding: stryMutAct_9fa48("1642") ? "" : (stryCov_9fa48("1642"), "unknown"),
            hasText: stryMutAct_9fa48("1643") ? true : (stryCov_9fa48("1643"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1644") ? {} : (stryCov_9fa48("1644"), {
            text: stryMutAct_9fa48("1645") ? `` : (stryCov_9fa48("1645"), `Office Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1646")) {
      {}
    } else {
      stryCov_9fa48("1646");
      try {
        if (stryMutAct_9fa48("1647")) {
          {}
        } else {
          stryCov_9fa48("1647");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, contentType);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1648")) {
          {}
        } else {
          stryCov_9fa48("1648");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1649") ? {} : (stryCov_9fa48("1649"), {
            type: contentType,
            language: stryMutAct_9fa48("1650") ? "" : (stryCov_9fa48("1650"), "unknown"),
            encoding: stryMutAct_9fa48("1651") ? "" : (stryCov_9fa48("1651"), "unknown"),
            hasText: stryMutAct_9fa48("1652") ? true : (stryCov_9fa48("1652"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1653") ? {} : (stryCov_9fa48("1653"), {
            text: stryMutAct_9fa48("1654") ? `` : (stryCov_9fa48("1654"), `Office Document Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("1655")) {
      {}
    } else {
      stryCov_9fa48("1655");
      try {
        if (stryMutAct_9fa48("1656")) {
          {}
        } else {
          stryCov_9fa48("1656");
          const result = await mammoth.extractRawText(stryMutAct_9fa48("1657") ? {} : (stryCov_9fa48("1657"), {
            buffer
          }));
          const text = stryMutAct_9fa48("1658") ? result.value : (stryCov_9fa48("1658"), result.value.trim());
          const words = stryMutAct_9fa48("1659") ? text.split(/\s+/) : (stryCov_9fa48("1659"), text.split(stryMutAct_9fa48("1661") ? /\S+/ : stryMutAct_9fa48("1660") ? /\s/ : (stryCov_9fa48("1660", "1661"), /\s+/)).filter(stryMutAct_9fa48("1662") ? () => undefined : (stryCov_9fa48("1662"), word => stryMutAct_9fa48("1666") ? word.length <= 0 : stryMutAct_9fa48("1665") ? word.length >= 0 : stryMutAct_9fa48("1664") ? false : stryMutAct_9fa48("1663") ? true : (stryCov_9fa48("1663", "1664", "1665", "1666"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1669") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1668") ? false : stryMutAct_9fa48("1667") ? true : (stryCov_9fa48("1667", "1668", "1669"), (stryMutAct_9fa48("1672") ? text.length <= 0 : stryMutAct_9fa48("1671") ? text.length >= 0 : stryMutAct_9fa48("1670") ? true : (stryCov_9fa48("1670", "1671", "1672"), text.length > 0)) && (stryMutAct_9fa48("1675") ? words.length <= 0 : stryMutAct_9fa48("1674") ? words.length >= 0 : stryMutAct_9fa48("1673") ? true : (stryCov_9fa48("1673", "1674", "1675"), words.length > 0)));

          // Try to extract some basic metadata from the XML structure
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("1676") ? {} : (stryCov_9fa48("1676"), {
            wordCount: words.length
            // Additional metadata extraction could be added here
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1677") ? {} : (stryCov_9fa48("1677"), {
            type: ContentType.OFFICE_DOC,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1678") ? "" : (stryCov_9fa48("1678"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("1679") ? "" : (stryCov_9fa48("1679"), "Word Document: No readable text content found");
          return stryMutAct_9fa48("1680") ? {} : (stryCov_9fa48("1680"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1681")) {
          {}
        } else {
          stryCov_9fa48("1681");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1682") ? {} : (stryCov_9fa48("1682"), {
            type: ContentType.OFFICE_DOC,
            language: stryMutAct_9fa48("1683") ? "" : (stryCov_9fa48("1683"), "unknown"),
            encoding: stryMutAct_9fa48("1684") ? "" : (stryCov_9fa48("1684"), "unknown"),
            hasText: stryMutAct_9fa48("1685") ? true : (stryCov_9fa48("1685"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1686") ? {} : (stryCov_9fa48("1686"), {
            text: stryMutAct_9fa48("1687") ? `` : (stryCov_9fa48("1687"), `Word Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1688")) {
      {}
    } else {
      stryCov_9fa48("1688");
      try {
        if (stryMutAct_9fa48("1689")) {
          {}
        } else {
          stryCov_9fa48("1689");
          const workbook = XLSX.read(buffer, stryMutAct_9fa48("1690") ? {} : (stryCov_9fa48("1690"), {
            type: stryMutAct_9fa48("1691") ? "" : (stryCov_9fa48("1691"), "buffer")
          }));
          let allText = stryMutAct_9fa48("1692") ? "Stryker was here!" : (stryCov_9fa48("1692"), "");
          const sheetNames: string[] = stryMutAct_9fa48("1693") ? ["Stryker was here"] : (stryCov_9fa48("1693"), []);
          let totalCells = 0;

          // Extract text from all worksheets
          workbook.SheetNames.forEach(sheetName => {
            if (stryMutAct_9fa48("1694")) {
              {}
            } else {
              stryCov_9fa48("1694");
              sheetNames.push(sheetName);
              const worksheet = workbook.Sheets[sheetName];

              // Convert sheet to CSV-like text
              const csvText = XLSX.utils.sheet_to_csv(worksheet);
              if (stryMutAct_9fa48("1697") ? csvText : stryMutAct_9fa48("1696") ? false : stryMutAct_9fa48("1695") ? true : (stryCov_9fa48("1695", "1696", "1697"), csvText.trim())) {
                if (stryMutAct_9fa48("1698")) {
                  {}
                } else {
                  stryCov_9fa48("1698");
                  allText += stryMutAct_9fa48("1699") ? `` : (stryCov_9fa48("1699"), `\n=== ${sheetName} ===\n${csvText}\n`);
                }
              }

              // Count cells with content
              const range = XLSX.utils.decode_range(stryMutAct_9fa48("1702") ? worksheet["!ref"] && "A1:A1" : stryMutAct_9fa48("1701") ? false : stryMutAct_9fa48("1700") ? true : (stryCov_9fa48("1700", "1701", "1702"), worksheet[stryMutAct_9fa48("1703") ? "" : (stryCov_9fa48("1703"), "!ref")] || (stryMutAct_9fa48("1704") ? "" : (stryCov_9fa48("1704"), "A1:A1"))));
              for (let row = range.s.r; stryMutAct_9fa48("1707") ? row > range.e.r : stryMutAct_9fa48("1706") ? row < range.e.r : stryMutAct_9fa48("1705") ? false : (stryCov_9fa48("1705", "1706", "1707"), row <= range.e.r); stryMutAct_9fa48("1708") ? row-- : (stryCov_9fa48("1708"), row++)) {
                if (stryMutAct_9fa48("1709")) {
                  {}
                } else {
                  stryCov_9fa48("1709");
                  for (let col = range.s.c; stryMutAct_9fa48("1712") ? col > range.e.c : stryMutAct_9fa48("1711") ? col < range.e.c : stryMutAct_9fa48("1710") ? false : (stryCov_9fa48("1710", "1711", "1712"), col <= range.e.c); stryMutAct_9fa48("1713") ? col-- : (stryCov_9fa48("1713"), col++)) {
                    if (stryMutAct_9fa48("1714")) {
                      {}
                    } else {
                      stryCov_9fa48("1714");
                      const cellAddress = XLSX.utils.encode_cell(stryMutAct_9fa48("1715") ? {} : (stryCov_9fa48("1715"), {
                        r: row,
                        c: col
                      }));
                      if (stryMutAct_9fa48("1718") ? worksheet[cellAddress] || worksheet[cellAddress].v !== undefined : stryMutAct_9fa48("1717") ? false : stryMutAct_9fa48("1716") ? true : (stryCov_9fa48("1716", "1717", "1718"), worksheet[cellAddress] && (stryMutAct_9fa48("1720") ? worksheet[cellAddress].v === undefined : stryMutAct_9fa48("1719") ? true : (stryCov_9fa48("1719", "1720"), worksheet[cellAddress].v !== undefined)))) {
                        if (stryMutAct_9fa48("1721")) {
                          {}
                        } else {
                          stryCov_9fa48("1721");
                          stryMutAct_9fa48("1722") ? totalCells-- : (stryCov_9fa48("1722"), totalCells++);
                        }
                      }
                    }
                  }
                }
              }
            }
          });
          const text = stryMutAct_9fa48("1723") ? allText : (stryCov_9fa48("1723"), allText.trim());
          const words = stryMutAct_9fa48("1724") ? text.split(/\s+/) : (stryCov_9fa48("1724"), text.split(stryMutAct_9fa48("1726") ? /\S+/ : stryMutAct_9fa48("1725") ? /\s/ : (stryCov_9fa48("1725", "1726"), /\s+/)).filter(stryMutAct_9fa48("1727") ? () => undefined : (stryCov_9fa48("1727"), word => stryMutAct_9fa48("1731") ? word.length <= 0 : stryMutAct_9fa48("1730") ? word.length >= 0 : stryMutAct_9fa48("1729") ? false : stryMutAct_9fa48("1728") ? true : (stryCov_9fa48("1728", "1729", "1730", "1731"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1734") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1733") ? false : stryMutAct_9fa48("1732") ? true : (stryCov_9fa48("1732", "1733", "1734"), (stryMutAct_9fa48("1737") ? text.length <= 0 : stryMutAct_9fa48("1736") ? text.length >= 0 : stryMutAct_9fa48("1735") ? true : (stryCov_9fa48("1735", "1736", "1737"), text.length > 0)) && (stryMutAct_9fa48("1740") ? words.length <= 0 : stryMutAct_9fa48("1739") ? words.length >= 0 : stryMutAct_9fa48("1738") ? true : (stryCov_9fa48("1738", "1739", "1740"), words.length > 0)));
          const officeMetadata: OfficeMetadata = stryMutAct_9fa48("1741") ? {} : (stryCov_9fa48("1741"), {
            sheetCount: sheetNames.length,
            wordCount: words.length,
            application: stryMutAct_9fa48("1742") ? "" : (stryCov_9fa48("1742"), "Microsoft Excel")
          });
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1743") ? {} : (stryCov_9fa48("1743"), {
            type: ContentType.OFFICE_SHEET,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1744") ? "" : (stryCov_9fa48("1744"), "utf-8"),
            hasText,
            wordCount: words.length,
            characterCount: text.length,
            officeMetadata
          });
          const finalText = hasText ? text : stryMutAct_9fa48("1745") ? `` : (stryCov_9fa48("1745"), `Excel Spreadsheet: ${sheetNames.length} sheet(s), ${totalCells} cells with content`);
          return stryMutAct_9fa48("1746") ? {} : (stryCov_9fa48("1746"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1747")) {
          {}
        } else {
          stryCov_9fa48("1747");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1748") ? {} : (stryCov_9fa48("1748"), {
            type: ContentType.OFFICE_SHEET,
            language: stryMutAct_9fa48("1749") ? "" : (stryCov_9fa48("1749"), "unknown"),
            encoding: stryMutAct_9fa48("1750") ? "" : (stryCov_9fa48("1750"), "unknown"),
            hasText: stryMutAct_9fa48("1751") ? true : (stryCov_9fa48("1751"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1752") ? {} : (stryCov_9fa48("1752"), {
            text: stryMutAct_9fa48("1753") ? `` : (stryCov_9fa48("1753"), `Excel Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1754")) {
      {}
    } else {
      stryCov_9fa48("1754");
      try {
        if (stryMutAct_9fa48("1755")) {
          {}
        } else {
          stryCov_9fa48("1755");
          // For now, provide basic PPTX handling
          // A full implementation would require extracting text from slide XML files
          // This is a placeholder that could be enhanced with additional libraries

          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1756") ? {} : (stryCov_9fa48("1756"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("1757") ? "" : (stryCov_9fa48("1757"), "unknown"),
            encoding: stryMutAct_9fa48("1758") ? "" : (stryCov_9fa48("1758"), "unknown"),
            hasText: stryMutAct_9fa48("1759") ? true : (stryCov_9fa48("1759"), false),
            wordCount: 0,
            characterCount: 0,
            officeMetadata: stryMutAct_9fa48("1760") ? {} : (stryCov_9fa48("1760"), {
              application: stryMutAct_9fa48("1761") ? "" : (stryCov_9fa48("1761"), "Microsoft PowerPoint")
            })
          });
          return stryMutAct_9fa48("1762") ? {} : (stryCov_9fa48("1762"), {
            text: stryMutAct_9fa48("1763") ? "" : (stryCov_9fa48("1763"), "PowerPoint Presentation: Text extraction not yet implemented for PPTX files"),
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1764")) {
          {}
        } else {
          stryCov_9fa48("1764");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OfficeContentMetadata = stryMutAct_9fa48("1765") ? {} : (stryCov_9fa48("1765"), {
            type: ContentType.OFFICE_PRESENTATION,
            language: stryMutAct_9fa48("1766") ? "" : (stryCov_9fa48("1766"), "unknown"),
            encoding: stryMutAct_9fa48("1767") ? "" : (stryCov_9fa48("1767"), "unknown"),
            hasText: stryMutAct_9fa48("1768") ? true : (stryCov_9fa48("1768"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1769") ? {} : (stryCov_9fa48("1769"), {
            text: stryMutAct_9fa48("1770") ? `` : (stryCov_9fa48("1770"), `PowerPoint Document Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1771")) {
      {}
    } else {
      stryCov_9fa48("1771");
      // Office document signatures
      const signatures = stryMutAct_9fa48("1772") ? [] : (stryCov_9fa48("1772"), [stryMutAct_9fa48("1773") ? {} : (stryCov_9fa48("1773"), {
        signature: Buffer.from(stryMutAct_9fa48("1774") ? [] : (stryCov_9fa48("1774"), [0x50, 0x4b, 0x03, 0x04])),
        type: stryMutAct_9fa48("1775") ? "" : (stryCov_9fa48("1775"), "zip-based")
      }) // PK.. (ZIP/OFFICE)
      ]);
      const isZipBased = stryMutAct_9fa48("1776") ? signatures.every(sig => buffer.subarray(0, 4).equals(sig.signature)) : (stryCov_9fa48("1776"), signatures.some(stryMutAct_9fa48("1777") ? () => undefined : (stryCov_9fa48("1777"), sig => buffer.subarray(0, 4).equals(sig.signature))));
      if (stryMutAct_9fa48("1780") ? false : stryMutAct_9fa48("1779") ? true : stryMutAct_9fa48("1778") ? isZipBased : (stryCov_9fa48("1778", "1779", "1780"), !isZipBased)) {
        if (stryMutAct_9fa48("1781")) {
          {}
        } else {
          stryCov_9fa48("1781");
          return stryMutAct_9fa48("1782") ? {} : (stryCov_9fa48("1782"), {
            supported: stryMutAct_9fa48("1783") ? true : (stryCov_9fa48("1783"), false)
          });
        }
      }

      // Check for Office document content types by examining ZIP structure
      // This is a simplified check - in production, you'd parse the ZIP and check [Content_Types].xml
      const docxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1784") ? "" : (stryCov_9fa48("1784"), "word/")));
      const xlsxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1785") ? "" : (stryCov_9fa48("1785"), "xl/")));
      const pptxMarker = buffer.includes(Buffer.from(stryMutAct_9fa48("1786") ? "" : (stryCov_9fa48("1786"), "ppt/")));
      if (stryMutAct_9fa48("1788") ? false : stryMutAct_9fa48("1787") ? true : (stryCov_9fa48("1787", "1788"), docxMarker)) {
        if (stryMutAct_9fa48("1789")) {
          {}
        } else {
          stryCov_9fa48("1789");
          return stryMutAct_9fa48("1790") ? {} : (stryCov_9fa48("1790"), {
            supported: stryMutAct_9fa48("1791") ? false : (stryCov_9fa48("1791"), true),
            type: ContentType.OFFICE_DOC
          });
        }
      } else if (stryMutAct_9fa48("1793") ? false : stryMutAct_9fa48("1792") ? true : (stryCov_9fa48("1792", "1793"), xlsxMarker)) {
        if (stryMutAct_9fa48("1794")) {
          {}
        } else {
          stryCov_9fa48("1794");
          return stryMutAct_9fa48("1795") ? {} : (stryCov_9fa48("1795"), {
            supported: stryMutAct_9fa48("1796") ? false : (stryCov_9fa48("1796"), true),
            type: ContentType.OFFICE_SHEET
          });
        }
      } else if (stryMutAct_9fa48("1798") ? false : stryMutAct_9fa48("1797") ? true : (stryCov_9fa48("1797", "1798"), pptxMarker)) {
        if (stryMutAct_9fa48("1799")) {
          {}
        } else {
          stryCov_9fa48("1799");
          return stryMutAct_9fa48("1800") ? {} : (stryCov_9fa48("1800"), {
            supported: stryMutAct_9fa48("1801") ? false : (stryCov_9fa48("1801"), true),
            type: ContentType.OFFICE_PRESENTATION
          });
        }
      }
      return stryMutAct_9fa48("1802") ? {} : (stryCov_9fa48("1802"), {
        supported: stryMutAct_9fa48("1803") ? true : (stryCov_9fa48("1803"), false)
      });
    }
  }

  /**
   * Simple language detection based on common patterns
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("1804")) {
      {}
    } else {
      stryCov_9fa48("1804");
      if (stryMutAct_9fa48("1807") ? !text && text.length === 0 : stryMutAct_9fa48("1806") ? false : stryMutAct_9fa48("1805") ? true : (stryCov_9fa48("1805", "1806", "1807"), (stryMutAct_9fa48("1808") ? text : (stryCov_9fa48("1808"), !text)) || (stryMutAct_9fa48("1810") ? text.length !== 0 : stryMutAct_9fa48("1809") ? false : (stryCov_9fa48("1809", "1810"), text.length === 0)))) return stryMutAct_9fa48("1811") ? "" : (stryCov_9fa48("1811"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("1814") ? text.match(englishWords) && [] : stryMutAct_9fa48("1813") ? false : stryMutAct_9fa48("1812") ? true : (stryCov_9fa48("1812", "1813", "1814"), text.match(englishWords) || (stryMutAct_9fa48("1815") ? ["Stryker was here"] : (stryCov_9fa48("1815"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("1818") ? text.match(spanishWords) && [] : stryMutAct_9fa48("1817") ? false : stryMutAct_9fa48("1816") ? true : (stryCov_9fa48("1816", "1817", "1818"), text.match(spanishWords) || (stryMutAct_9fa48("1819") ? ["Stryker was here"] : (stryCov_9fa48("1819"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("1822") ? text.match(frenchWords) && [] : stryMutAct_9fa48("1821") ? false : stryMutAct_9fa48("1820") ? true : (stryCov_9fa48("1820", "1821", "1822"), text.match(frenchWords) || (stryMutAct_9fa48("1823") ? ["Stryker was here"] : (stryCov_9fa48("1823"), [])))).length;
      const maxMatches = stryMutAct_9fa48("1824") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("1824"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("1827") ? maxMatches !== 0 : stryMutAct_9fa48("1826") ? false : stryMutAct_9fa48("1825") ? true : (stryCov_9fa48("1825", "1826", "1827"), maxMatches === 0)) return stryMutAct_9fa48("1828") ? "" : (stryCov_9fa48("1828"), "unknown");
      if (stryMutAct_9fa48("1831") ? maxMatches !== englishMatches : stryMutAct_9fa48("1830") ? false : stryMutAct_9fa48("1829") ? true : (stryCov_9fa48("1829", "1830", "1831"), maxMatches === englishMatches)) return stryMutAct_9fa48("1832") ? "" : (stryCov_9fa48("1832"), "en");
      if (stryMutAct_9fa48("1835") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1834") ? false : stryMutAct_9fa48("1833") ? true : (stryCov_9fa48("1833", "1834", "1835"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1836") ? "" : (stryCov_9fa48("1836"), "es");
      if (stryMutAct_9fa48("1839") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1838") ? false : stryMutAct_9fa48("1837") ? true : (stryCov_9fa48("1837", "1838", "1839"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1840") ? "" : (stryCov_9fa48("1840"), "fr");
      return stryMutAct_9fa48("1841") ? "" : (stryCov_9fa48("1841"), "unknown");
    }
  }
}