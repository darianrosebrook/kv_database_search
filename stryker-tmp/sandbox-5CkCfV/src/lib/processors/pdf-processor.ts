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
import { ContentType, UniversalMetadata, ContentMetadata } from "../multi-modal.js";
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
export class PDFProcessor {
  /**
   * Extract text content from a PDF file
   */
  async extractText(filePath: string): Promise<{
    text: string;
    metadata: PDFContentMetadata;
  }> {
    if (stryMutAct_9fa48("1842")) {
      {}
    } else {
      stryCov_9fa48("1842");
      try {
        if (stryMutAct_9fa48("1843")) {
          {}
        } else {
          stryCov_9fa48("1843");
          // Read the PDF file
          const buffer = fs.readFileSync(filePath);

          // Parse the PDF
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("1844") ? {} : (stryCov_9fa48("1844"), {
            title: stryMutAct_9fa48("1845") ? pdfData.info.Title : (stryCov_9fa48("1845"), pdfData.info?.Title),
            author: stryMutAct_9fa48("1846") ? pdfData.info.Author : (stryCov_9fa48("1846"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("1847") ? pdfData.info.Subject : (stryCov_9fa48("1847"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("1848") ? pdfData.info.Creator : (stryCov_9fa48("1848"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("1849") ? pdfData.info.Producer : (stryCov_9fa48("1849"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("1850") ? pdfData.info.CreationDate : (stryCov_9fa48("1850"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("1851") ? pdfData.info.ModDate : (stryCov_9fa48("1851"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("1852") ? pdfData.text : (stryCov_9fa48("1852"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("1853") ? text.split(/\s+/) : (stryCov_9fa48("1853"), text.split(stryMutAct_9fa48("1855") ? /\S+/ : stryMutAct_9fa48("1854") ? /\s/ : (stryCov_9fa48("1854", "1855"), /\s+/)).filter(stryMutAct_9fa48("1856") ? () => undefined : (stryCov_9fa48("1856"), word => stryMutAct_9fa48("1860") ? word.length <= 0 : stryMutAct_9fa48("1859") ? word.length >= 0 : stryMutAct_9fa48("1858") ? false : stryMutAct_9fa48("1857") ? true : (stryCov_9fa48("1857", "1858", "1859", "1860"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1863") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1862") ? false : stryMutAct_9fa48("1861") ? true : (stryCov_9fa48("1861", "1862", "1863"), (stryMutAct_9fa48("1866") ? text.length <= 0 : stryMutAct_9fa48("1865") ? text.length >= 0 : stryMutAct_9fa48("1864") ? true : (stryCov_9fa48("1864", "1865", "1866"), text.length > 0)) && (stryMutAct_9fa48("1869") ? words.length <= 0 : stryMutAct_9fa48("1868") ? words.length >= 0 : stryMutAct_9fa48("1867") ? true : (stryCov_9fa48("1867", "1868", "1869"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("1870") ? {} : (stryCov_9fa48("1870"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1871") ? "" : (stryCov_9fa48("1871"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("1872") ? {} : (stryCov_9fa48("1872"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1873")) {
          {}
        } else {
          stryCov_9fa48("1873");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("1874") ? {} : (stryCov_9fa48("1874"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("1875") ? "" : (stryCov_9fa48("1875"), "unknown"),
            encoding: stryMutAct_9fa48("1876") ? "" : (stryCov_9fa48("1876"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("1877") ? true : (stryCov_9fa48("1877"), false)
          });
          return stryMutAct_9fa48("1878") ? {} : (stryCov_9fa48("1878"), {
            text: stryMutAct_9fa48("1879") ? `` : (stryCov_9fa48("1879"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1880")) {
      {}
    } else {
      stryCov_9fa48("1880");
      try {
        if (stryMutAct_9fa48("1881")) {
          {}
        } else {
          stryCov_9fa48("1881");
          // Parse the PDF buffer
          const pdfData = await pdfParse(buffer);

          // Extract basic metadata
          const pdfMetadata: PDFMetadata = stryMutAct_9fa48("1882") ? {} : (stryCov_9fa48("1882"), {
            title: stryMutAct_9fa48("1883") ? pdfData.info.Title : (stryCov_9fa48("1883"), pdfData.info?.Title),
            author: stryMutAct_9fa48("1884") ? pdfData.info.Author : (stryCov_9fa48("1884"), pdfData.info?.Author),
            subject: stryMutAct_9fa48("1885") ? pdfData.info.Subject : (stryCov_9fa48("1885"), pdfData.info?.Subject),
            creator: stryMutAct_9fa48("1886") ? pdfData.info.Creator : (stryCov_9fa48("1886"), pdfData.info?.Creator),
            producer: stryMutAct_9fa48("1887") ? pdfData.info.Producer : (stryCov_9fa48("1887"), pdfData.info?.Producer),
            creationDate: (stryMutAct_9fa48("1888") ? pdfData.info.CreationDate : (stryCov_9fa48("1888"), pdfData.info?.CreationDate)) ? new Date(pdfData.info.CreationDate) : undefined,
            modificationDate: (stryMutAct_9fa48("1889") ? pdfData.info.ModDate : (stryCov_9fa48("1889"), pdfData.info?.ModDate)) ? new Date(pdfData.info.ModDate) : undefined
          });

          // Get the extracted text
          const text = stryMutAct_9fa48("1890") ? pdfData.text : (stryCov_9fa48("1890"), pdfData.text.trim());

          // Analyze text content
          const words = stryMutAct_9fa48("1891") ? text.split(/\s+/) : (stryCov_9fa48("1891"), text.split(stryMutAct_9fa48("1893") ? /\S+/ : stryMutAct_9fa48("1892") ? /\s/ : (stryCov_9fa48("1892", "1893"), /\s+/)).filter(stryMutAct_9fa48("1894") ? () => undefined : (stryCov_9fa48("1894"), word => stryMutAct_9fa48("1898") ? word.length <= 0 : stryMutAct_9fa48("1897") ? word.length >= 0 : stryMutAct_9fa48("1896") ? false : stryMutAct_9fa48("1895") ? true : (stryCov_9fa48("1895", "1896", "1897", "1898"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1901") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1900") ? false : stryMutAct_9fa48("1899") ? true : (stryCov_9fa48("1899", "1900", "1901"), (stryMutAct_9fa48("1904") ? text.length <= 0 : stryMutAct_9fa48("1903") ? text.length >= 0 : stryMutAct_9fa48("1902") ? true : (stryCov_9fa48("1902", "1903", "1904"), text.length > 0)) && (stryMutAct_9fa48("1907") ? words.length <= 0 : stryMutAct_9fa48("1906") ? words.length >= 0 : stryMutAct_9fa48("1905") ? true : (stryCov_9fa48("1905", "1906", "1907"), words.length > 0)));

          // Create content metadata
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("1908") ? {} : (stryCov_9fa48("1908"), {
            type: ContentType.PDF,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1909") ? "" : (stryCov_9fa48("1909"), "utf-8"),
            pageCount: pdfData.numpages,
            wordCount: words.length,
            characterCount: text.length,
            hasText,
            pdfMetadata
          });
          return stryMutAct_9fa48("1910") ? {} : (stryCov_9fa48("1910"), {
            text,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1911")) {
          {}
        } else {
          stryCov_9fa48("1911");
          // Return basic metadata for corrupted or unreadable PDFs
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: PDFContentMetadata = stryMutAct_9fa48("1912") ? {} : (stryCov_9fa48("1912"), {
            type: ContentType.PDF,
            language: stryMutAct_9fa48("1913") ? "" : (stryCov_9fa48("1913"), "unknown"),
            encoding: stryMutAct_9fa48("1914") ? "" : (stryCov_9fa48("1914"), "unknown"),
            pageCount: 0,
            wordCount: 0,
            characterCount: 0,
            hasText: stryMutAct_9fa48("1915") ? true : (stryCov_9fa48("1915"), false)
          });
          return stryMutAct_9fa48("1916") ? {} : (stryCov_9fa48("1916"), {
            text: stryMutAct_9fa48("1917") ? `` : (stryCov_9fa48("1917"), `PDF Document: Unable to extract text. Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1918")) {
      {}
    } else {
      stryCov_9fa48("1918");
      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("1921") ? text.match(englishWords) && [] : stryMutAct_9fa48("1920") ? false : stryMutAct_9fa48("1919") ? true : (stryCov_9fa48("1919", "1920", "1921"), text.match(englishWords) || (stryMutAct_9fa48("1922") ? ["Stryker was here"] : (stryCov_9fa48("1922"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("1925") ? text.match(spanishWords) && [] : stryMutAct_9fa48("1924") ? false : stryMutAct_9fa48("1923") ? true : (stryCov_9fa48("1923", "1924", "1925"), text.match(spanishWords) || (stryMutAct_9fa48("1926") ? ["Stryker was here"] : (stryCov_9fa48("1926"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("1929") ? text.match(frenchWords) && [] : stryMutAct_9fa48("1928") ? false : stryMutAct_9fa48("1927") ? true : (stryCov_9fa48("1927", "1928", "1929"), text.match(frenchWords) || (stryMutAct_9fa48("1930") ? ["Stryker was here"] : (stryCov_9fa48("1930"), [])))).length;
      const maxMatches = stryMutAct_9fa48("1931") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("1931"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("1934") ? maxMatches !== 0 : stryMutAct_9fa48("1933") ? false : stryMutAct_9fa48("1932") ? true : (stryCov_9fa48("1932", "1933", "1934"), maxMatches === 0)) return stryMutAct_9fa48("1935") ? "" : (stryCov_9fa48("1935"), "unknown");
      if (stryMutAct_9fa48("1938") ? maxMatches !== englishMatches : stryMutAct_9fa48("1937") ? false : stryMutAct_9fa48("1936") ? true : (stryCov_9fa48("1936", "1937", "1938"), maxMatches === englishMatches)) return stryMutAct_9fa48("1939") ? "" : (stryCov_9fa48("1939"), "en");
      if (stryMutAct_9fa48("1942") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1941") ? false : stryMutAct_9fa48("1940") ? true : (stryCov_9fa48("1940", "1941", "1942"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1943") ? "" : (stryCov_9fa48("1943"), "es");
      if (stryMutAct_9fa48("1946") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1945") ? false : stryMutAct_9fa48("1944") ? true : (stryCov_9fa48("1944", "1945", "1946"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1947") ? "" : (stryCov_9fa48("1947"), "fr");
      return stryMutAct_9fa48("1948") ? "" : (stryCov_9fa48("1948"), "unknown");
    }
  }

  /**
   * Check if a file is likely a readable PDF
   */
  isValidPDF(buffer: Buffer): boolean {
    if (stryMutAct_9fa48("1949")) {
      {}
    } else {
      stryCov_9fa48("1949");
      // Check PDF signature
      const signature = buffer.subarray(0, 8);
      const pdfSignature = Buffer.from(stryMutAct_9fa48("1950") ? "" : (stryCov_9fa48("1950"), "%PDF-"));
      return signature.subarray(0, 5).equals(pdfSignature);
    }
  }
}