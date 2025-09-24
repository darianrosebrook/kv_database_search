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
    if (stryMutAct_9fa48("1490")) {
      {}
    } else {
      stryCov_9fa48("1490");
      if (stryMutAct_9fa48("1493") ? false : stryMutAct_9fa48("1492") ? true : stryMutAct_9fa48("1491") ? this.worker : (stryCov_9fa48("1491", "1492", "1493"), !this.worker)) {
        if (stryMutAct_9fa48("1494")) {
          {}
        } else {
          stryCov_9fa48("1494");
          this.worker = await createWorker(stryMutAct_9fa48("1495") ? "" : (stryCov_9fa48("1495"), "eng")); // Default to English
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
    if (stryMutAct_9fa48("1496")) {
      {}
    } else {
      stryCov_9fa48("1496");
      try {
        if (stryMutAct_9fa48("1497")) {
          {}
        } else {
          stryCov_9fa48("1497");
          await this.initialize();
          if (stryMutAct_9fa48("1500") ? false : stryMutAct_9fa48("1499") ? true : stryMutAct_9fa48("1498") ? this.worker : (stryCov_9fa48("1498", "1499", "1500"), !this.worker)) {
            if (stryMutAct_9fa48("1501")) {
              {}
            } else {
              stryCov_9fa48("1501");
              throw new Error(stryMutAct_9fa48("1502") ? "" : (stryCov_9fa48("1502"), "OCR worker not initialized"));
            }
          }

          // Load language if specified
          if (stryMutAct_9fa48("1505") ? options.language || options.language !== "eng" : stryMutAct_9fa48("1504") ? false : stryMutAct_9fa48("1503") ? true : (stryCov_9fa48("1503", "1504", "1505"), options.language && (stryMutAct_9fa48("1507") ? options.language === "eng" : stryMutAct_9fa48("1506") ? true : (stryCov_9fa48("1506", "1507"), options.language !== (stryMutAct_9fa48("1508") ? "" : (stryCov_9fa48("1508"), "eng")))))) {
            if (stryMutAct_9fa48("1509")) {
              {}
            } else {
              stryCov_9fa48("1509");
              await this.worker.setParameters(stryMutAct_9fa48("1510") ? {} : (stryCov_9fa48("1510"), {
                tessedit_ocr_engine_mode: stryMutAct_9fa48("1511") ? "" : (stryCov_9fa48("1511"), "1") // Use LSTM OCR engine
              }));
            }
          }
          const startTime = Date.now();

          // Perform OCR
          const result = await this.worker.recognize(buffer);
          const processingTime = stryMutAct_9fa48("1512") ? Date.now() + startTime : (stryCov_9fa48("1512"), Date.now() - startTime);
          const text = stryMutAct_9fa48("1513") ? result.data.text : (stryCov_9fa48("1513"), result.data.text.trim());
          const confidence = result.data.confidence;

          // Analyze extracted text
          const words = stryMutAct_9fa48("1514") ? text.split(/\s+/) : (stryCov_9fa48("1514"), text.split(stryMutAct_9fa48("1516") ? /\S+/ : stryMutAct_9fa48("1515") ? /\s/ : (stryCov_9fa48("1515", "1516"), /\s+/)).filter(stryMutAct_9fa48("1517") ? () => undefined : (stryCov_9fa48("1517"), word => stryMutAct_9fa48("1521") ? word.length <= 0 : stryMutAct_9fa48("1520") ? word.length >= 0 : stryMutAct_9fa48("1519") ? false : stryMutAct_9fa48("1518") ? true : (stryCov_9fa48("1518", "1519", "1520", "1521"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1524") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1523") ? false : stryMutAct_9fa48("1522") ? true : (stryCov_9fa48("1522", "1523", "1524"), (stryMutAct_9fa48("1527") ? text.length <= 0 : stryMutAct_9fa48("1526") ? text.length >= 0 : stryMutAct_9fa48("1525") ? true : (stryCov_9fa48("1525", "1526", "1527"), text.length > 0)) && (stryMutAct_9fa48("1530") ? words.length <= 0 : stryMutAct_9fa48("1529") ? words.length >= 0 : stryMutAct_9fa48("1528") ? true : (stryCov_9fa48("1528", "1529", "1530"), words.length > 0)));

          // Check if confidence meets minimum threshold
          const minConfidence = stryMutAct_9fa48("1533") ? options.confidence && 30 : stryMutAct_9fa48("1532") ? false : stryMutAct_9fa48("1531") ? true : (stryCov_9fa48("1531", "1532", "1533"), options.confidence || 30); // Default minimum confidence
          const isConfident = stryMutAct_9fa48("1537") ? confidence < minConfidence : stryMutAct_9fa48("1536") ? confidence > minConfidence : stryMutAct_9fa48("1535") ? false : stryMutAct_9fa48("1534") ? true : (stryCov_9fa48("1534", "1535", "1536", "1537"), confidence >= minConfidence);
          const ocrMetadata: OCRMetadata = stryMutAct_9fa48("1538") ? {} : (stryCov_9fa48("1538"), {
            confidence,
            processingTime,
            language: stryMutAct_9fa48("1541") ? options.language && "eng" : stryMutAct_9fa48("1540") ? false : stryMutAct_9fa48("1539") ? true : (stryCov_9fa48("1539", "1540", "1541"), options.language || (stryMutAct_9fa48("1542") ? "" : (stryCov_9fa48("1542"), "eng"))),
            version: stryMutAct_9fa48("1543") ? "" : (stryCov_9fa48("1543"), "tesseract.js")
          });
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1544") ? {} : (stryCov_9fa48("1544"), {
            type: ContentType.RASTER_IMAGE,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1545") ? "" : (stryCov_9fa48("1545"), "utf-8"),
            confidence,
            hasText: stryMutAct_9fa48("1548") ? hasText || isConfident : stryMutAct_9fa48("1547") ? false : stryMutAct_9fa48("1546") ? true : (stryCov_9fa48("1546", "1547", "1548"), hasText && isConfident),
            wordCount: words.length,
            characterCount: text.length,
            ocrMetadata
          });

          // Return appropriate text based on confidence
          const finalText = (stryMutAct_9fa48("1551") ? isConfident || hasText : stryMutAct_9fa48("1550") ? false : stryMutAct_9fa48("1549") ? true : (stryCov_9fa48("1549", "1550", "1551"), isConfident && hasText)) ? text : stryMutAct_9fa48("1552") ? `` : (stryCov_9fa48("1552"), `Image OCR: ${hasText ? stryMutAct_9fa48("1553") ? `` : (stryCov_9fa48("1553"), `Low confidence (${confidence.toFixed(1)}%)`) : stryMutAct_9fa48("1554") ? "" : (stryCov_9fa48("1554"), "No text detected")}`);
          return stryMutAct_9fa48("1555") ? {} : (stryCov_9fa48("1555"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1556")) {
          {}
        } else {
          stryCov_9fa48("1556");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1557") ? {} : (stryCov_9fa48("1557"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("1558") ? "" : (stryCov_9fa48("1558"), "unknown"),
            encoding: stryMutAct_9fa48("1559") ? "" : (stryCov_9fa48("1559"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("1560") ? true : (stryCov_9fa48("1560"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1561") ? {} : (stryCov_9fa48("1561"), {
            text: stryMutAct_9fa48("1562") ? `` : (stryCov_9fa48("1562"), `Image OCR Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1563")) {
      {}
    } else {
      stryCov_9fa48("1563");
      try {
        if (stryMutAct_9fa48("1564")) {
          {}
        } else {
          stryCov_9fa48("1564");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1565")) {
          {}
        } else {
          stryCov_9fa48("1565");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1566") ? {} : (stryCov_9fa48("1566"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("1567") ? "" : (stryCov_9fa48("1567"), "unknown"),
            encoding: stryMutAct_9fa48("1568") ? "" : (stryCov_9fa48("1568"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("1569") ? true : (stryCov_9fa48("1569"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1570") ? {} : (stryCov_9fa48("1570"), {
            text: stryMutAct_9fa48("1571") ? `` : (stryCov_9fa48("1571"), `Image OCR Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("1572")) {
      {}
    } else {
      stryCov_9fa48("1572");
      // Check common image signatures
      const signatures = stryMutAct_9fa48("1573") ? [] : (stryCov_9fa48("1573"), [Buffer.from(stryMutAct_9fa48("1574") ? [] : (stryCov_9fa48("1574"), [0xff, 0xd8, 0xff])),
      // JPEG
      Buffer.from(stryMutAct_9fa48("1575") ? [] : (stryCov_9fa48("1575"), [0x89, 0x50, 0x4e, 0x47])),
      // PNG
      Buffer.from(stryMutAct_9fa48("1576") ? [] : (stryCov_9fa48("1576"), [0x42, 0x4d])),
      // BMP
      Buffer.from(stryMutAct_9fa48("1577") ? [] : (stryCov_9fa48("1577"), [0x49, 0x49, 0x2a, 0x00])),
      // TIFF (little-endian)
      Buffer.from(stryMutAct_9fa48("1578") ? [] : (stryCov_9fa48("1578"), [0x4d, 0x4d, 0x00, 0x2a])),
      // TIFF (big-endian)
      Buffer.from(stryMutAct_9fa48("1579") ? [] : (stryCov_9fa48("1579"), [0x52, 0x49, 0x46, 0x46])) // WEBP (starts with RIFF)
      ]);
      return stryMutAct_9fa48("1580") ? signatures.every(signature => buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("1580"), signatures.some(stryMutAct_9fa48("1581") ? () => undefined : (stryCov_9fa48("1581"), signature => buffer.subarray(0, signature.length).equals(signature))));
    }
  }

  /**
   * Detect language from OCR text (simple heuristic)
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("1582")) {
      {}
    } else {
      stryCov_9fa48("1582");
      if (stryMutAct_9fa48("1585") ? !text && text.length === 0 : stryMutAct_9fa48("1584") ? false : stryMutAct_9fa48("1583") ? true : (stryCov_9fa48("1583", "1584", "1585"), (stryMutAct_9fa48("1586") ? text : (stryCov_9fa48("1586"), !text)) || (stryMutAct_9fa48("1588") ? text.length !== 0 : stryMutAct_9fa48("1587") ? false : (stryCov_9fa48("1587", "1588"), text.length === 0)))) return stryMutAct_9fa48("1589") ? "" : (stryCov_9fa48("1589"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("1592") ? text.match(englishWords) && [] : stryMutAct_9fa48("1591") ? false : stryMutAct_9fa48("1590") ? true : (stryCov_9fa48("1590", "1591", "1592"), text.match(englishWords) || (stryMutAct_9fa48("1593") ? ["Stryker was here"] : (stryCov_9fa48("1593"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("1596") ? text.match(spanishWords) && [] : stryMutAct_9fa48("1595") ? false : stryMutAct_9fa48("1594") ? true : (stryCov_9fa48("1594", "1595", "1596"), text.match(spanishWords) || (stryMutAct_9fa48("1597") ? ["Stryker was here"] : (stryCov_9fa48("1597"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("1600") ? text.match(frenchWords) && [] : stryMutAct_9fa48("1599") ? false : stryMutAct_9fa48("1598") ? true : (stryCov_9fa48("1598", "1599", "1600"), text.match(frenchWords) || (stryMutAct_9fa48("1601") ? ["Stryker was here"] : (stryCov_9fa48("1601"), [])))).length;
      const maxMatches = stryMutAct_9fa48("1602") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("1602"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("1605") ? maxMatches !== 0 : stryMutAct_9fa48("1604") ? false : stryMutAct_9fa48("1603") ? true : (stryCov_9fa48("1603", "1604", "1605"), maxMatches === 0)) return stryMutAct_9fa48("1606") ? "" : (stryCov_9fa48("1606"), "unknown");
      if (stryMutAct_9fa48("1609") ? maxMatches !== englishMatches : stryMutAct_9fa48("1608") ? false : stryMutAct_9fa48("1607") ? true : (stryCov_9fa48("1607", "1608", "1609"), maxMatches === englishMatches)) return stryMutAct_9fa48("1610") ? "" : (stryCov_9fa48("1610"), "en");
      if (stryMutAct_9fa48("1613") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1612") ? false : stryMutAct_9fa48("1611") ? true : (stryCov_9fa48("1611", "1612", "1613"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1614") ? "" : (stryCov_9fa48("1614"), "es");
      if (stryMutAct_9fa48("1617") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1616") ? false : stryMutAct_9fa48("1615") ? true : (stryCov_9fa48("1615", "1616", "1617"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1618") ? "" : (stryCov_9fa48("1618"), "fr");
      return stryMutAct_9fa48("1619") ? "" : (stryCov_9fa48("1619"), "unknown");
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (stryMutAct_9fa48("1620")) {
      {}
    } else {
      stryCov_9fa48("1620");
      if (stryMutAct_9fa48("1622") ? false : stryMutAct_9fa48("1621") ? true : (stryCov_9fa48("1621", "1622"), this.worker)) {
        if (stryMutAct_9fa48("1623")) {
          {}
        } else {
          stryCov_9fa48("1623");
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
    if (stryMutAct_9fa48("1624")) {
      {}
    } else {
      stryCov_9fa48("1624");
      return stryMutAct_9fa48("1625") ? [] : (stryCov_9fa48("1625"), [stryMutAct_9fa48("1626") ? "" : (stryCov_9fa48("1626"), "eng"), // English
      stryMutAct_9fa48("1627") ? "" : (stryCov_9fa48("1627"), "spa"), // Spanish
      stryMutAct_9fa48("1628") ? "" : (stryCov_9fa48("1628"), "fra"), // French
      stryMutAct_9fa48("1629") ? "" : (stryCov_9fa48("1629"), "deu"), // German
      stryMutAct_9fa48("1630") ? "" : (stryCov_9fa48("1630"), "ita"), // Italian
      stryMutAct_9fa48("1631") ? "" : (stryCov_9fa48("1631"), "por"), // Portuguese
      stryMutAct_9fa48("1632") ? "" : (stryCov_9fa48("1632"), "rus"), // Russian
      stryMutAct_9fa48("1633") ? "" : (stryCov_9fa48("1633"), "ara"), // Arabic
      stryMutAct_9fa48("1634") ? "" : (stryCov_9fa48("1634"), "chi_sim"), // Chinese Simplified
      stryMutAct_9fa48("1635") ? "" : (stryCov_9fa48("1635"), "jpn") // Japanese
      ]);
    }
  }
}