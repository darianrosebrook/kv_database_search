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
    if (stryMutAct_9fa48("1486")) {
      {}
    } else {
      stryCov_9fa48("1486");
      if (stryMutAct_9fa48("1489") ? false : stryMutAct_9fa48("1488") ? true : stryMutAct_9fa48("1487") ? this.worker : (stryCov_9fa48("1487", "1488", "1489"), !this.worker)) {
        if (stryMutAct_9fa48("1490")) {
          {}
        } else {
          stryCov_9fa48("1490");
          this.worker = await createWorker(stryMutAct_9fa48("1491") ? "" : (stryCov_9fa48("1491"), "eng")); // Default to English
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
    if (stryMutAct_9fa48("1492")) {
      {}
    } else {
      stryCov_9fa48("1492");
      try {
        if (stryMutAct_9fa48("1493")) {
          {}
        } else {
          stryCov_9fa48("1493");
          await this.initialize();
          if (stryMutAct_9fa48("1496") ? false : stryMutAct_9fa48("1495") ? true : stryMutAct_9fa48("1494") ? this.worker : (stryCov_9fa48("1494", "1495", "1496"), !this.worker)) {
            if (stryMutAct_9fa48("1497")) {
              {}
            } else {
              stryCov_9fa48("1497");
              throw new Error(stryMutAct_9fa48("1498") ? "" : (stryCov_9fa48("1498"), "OCR worker not initialized"));
            }
          }

          // Load language if specified
          if (stryMutAct_9fa48("1501") ? options.language || options.language !== "eng" : stryMutAct_9fa48("1500") ? false : stryMutAct_9fa48("1499") ? true : (stryCov_9fa48("1499", "1500", "1501"), options.language && (stryMutAct_9fa48("1503") ? options.language === "eng" : stryMutAct_9fa48("1502") ? true : (stryCov_9fa48("1502", "1503"), options.language !== (stryMutAct_9fa48("1504") ? "" : (stryCov_9fa48("1504"), "eng")))))) {
            if (stryMutAct_9fa48("1505")) {
              {}
            } else {
              stryCov_9fa48("1505");
              await this.worker.setParameters(stryMutAct_9fa48("1506") ? {} : (stryCov_9fa48("1506"), {
                tessedit_ocr_engine_mode: stryMutAct_9fa48("1507") ? "" : (stryCov_9fa48("1507"), "1") // Use LSTM OCR engine
              }));
            }
          }
          const startTime = Date.now();

          // Perform OCR
          const result = await this.worker.recognize(buffer);
          const processingTime = stryMutAct_9fa48("1508") ? Date.now() + startTime : (stryCov_9fa48("1508"), Date.now() - startTime);
          const text = stryMutAct_9fa48("1509") ? result.data.text : (stryCov_9fa48("1509"), result.data.text.trim());
          const confidence = result.data.confidence;

          // Analyze extracted text
          const words = stryMutAct_9fa48("1510") ? text.split(/\s+/) : (stryCov_9fa48("1510"), text.split(stryMutAct_9fa48("1512") ? /\S+/ : stryMutAct_9fa48("1511") ? /\s/ : (stryCov_9fa48("1511", "1512"), /\s+/)).filter(stryMutAct_9fa48("1513") ? () => undefined : (stryCov_9fa48("1513"), word => stryMutAct_9fa48("1517") ? word.length <= 0 : stryMutAct_9fa48("1516") ? word.length >= 0 : stryMutAct_9fa48("1515") ? false : stryMutAct_9fa48("1514") ? true : (stryCov_9fa48("1514", "1515", "1516", "1517"), word.length > 0))));
          const hasText = stryMutAct_9fa48("1520") ? text.length > 0 || words.length > 0 : stryMutAct_9fa48("1519") ? false : stryMutAct_9fa48("1518") ? true : (stryCov_9fa48("1518", "1519", "1520"), (stryMutAct_9fa48("1523") ? text.length <= 0 : stryMutAct_9fa48("1522") ? text.length >= 0 : stryMutAct_9fa48("1521") ? true : (stryCov_9fa48("1521", "1522", "1523"), text.length > 0)) && (stryMutAct_9fa48("1526") ? words.length <= 0 : stryMutAct_9fa48("1525") ? words.length >= 0 : stryMutAct_9fa48("1524") ? true : (stryCov_9fa48("1524", "1525", "1526"), words.length > 0)));

          // Check if confidence meets minimum threshold
          const minConfidence = stryMutAct_9fa48("1529") ? options.confidence && 30 : stryMutAct_9fa48("1528") ? false : stryMutAct_9fa48("1527") ? true : (stryCov_9fa48("1527", "1528", "1529"), options.confidence || 30); // Default minimum confidence
          const isConfident = stryMutAct_9fa48("1533") ? confidence < minConfidence : stryMutAct_9fa48("1532") ? confidence > minConfidence : stryMutAct_9fa48("1531") ? false : stryMutAct_9fa48("1530") ? true : (stryCov_9fa48("1530", "1531", "1532", "1533"), confidence >= minConfidence);
          const ocrMetadata: OCRMetadata = stryMutAct_9fa48("1534") ? {} : (stryCov_9fa48("1534"), {
            confidence,
            processingTime,
            language: stryMutAct_9fa48("1537") ? options.language && "eng" : stryMutAct_9fa48("1536") ? false : stryMutAct_9fa48("1535") ? true : (stryCov_9fa48("1535", "1536", "1537"), options.language || (stryMutAct_9fa48("1538") ? "" : (stryCov_9fa48("1538"), "eng"))),
            version: stryMutAct_9fa48("1539") ? "" : (stryCov_9fa48("1539"), "tesseract.js")
          });
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1540") ? {} : (stryCov_9fa48("1540"), {
            type: ContentType.RASTER_IMAGE,
            language: this.detectLanguage(text),
            encoding: stryMutAct_9fa48("1541") ? "" : (stryCov_9fa48("1541"), "utf-8"),
            confidence,
            hasText: stryMutAct_9fa48("1544") ? hasText || isConfident : stryMutAct_9fa48("1543") ? false : stryMutAct_9fa48("1542") ? true : (stryCov_9fa48("1542", "1543", "1544"), hasText && isConfident),
            wordCount: words.length,
            characterCount: text.length,
            ocrMetadata
          });

          // Return appropriate text based on confidence
          const finalText = (stryMutAct_9fa48("1547") ? isConfident || hasText : stryMutAct_9fa48("1546") ? false : stryMutAct_9fa48("1545") ? true : (stryCov_9fa48("1545", "1546", "1547"), isConfident && hasText)) ? text : stryMutAct_9fa48("1548") ? `` : (stryCov_9fa48("1548"), `Image OCR: ${hasText ? stryMutAct_9fa48("1549") ? `` : (stryCov_9fa48("1549"), `Low confidence (${confidence.toFixed(1)}%)`) : stryMutAct_9fa48("1550") ? "" : (stryCov_9fa48("1550"), "No text detected")}`);
          return stryMutAct_9fa48("1551") ? {} : (stryCov_9fa48("1551"), {
            text: finalText,
            metadata: contentMetadata
          });
        }
      } catch (error) {
        if (stryMutAct_9fa48("1552")) {
          {}
        } else {
          stryCov_9fa48("1552");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1553") ? {} : (stryCov_9fa48("1553"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("1554") ? "" : (stryCov_9fa48("1554"), "unknown"),
            encoding: stryMutAct_9fa48("1555") ? "" : (stryCov_9fa48("1555"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("1556") ? true : (stryCov_9fa48("1556"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1557") ? {} : (stryCov_9fa48("1557"), {
            text: stryMutAct_9fa48("1558") ? `` : (stryCov_9fa48("1558"), `Image OCR Error: ${errorMessage}`),
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
    if (stryMutAct_9fa48("1559")) {
      {}
    } else {
      stryCov_9fa48("1559");
      try {
        if (stryMutAct_9fa48("1560")) {
          {}
        } else {
          stryCov_9fa48("1560");
          const buffer = fs.readFileSync(filePath);
          return await this.extractTextFromBuffer(buffer, options);
        }
      } catch (error) {
        if (stryMutAct_9fa48("1561")) {
          {}
        } else {
          stryCov_9fa48("1561");
          const errorMessage = error instanceof Error ? error.message : String(error);
          const contentMetadata: OCRContentMetadata = stryMutAct_9fa48("1562") ? {} : (stryCov_9fa48("1562"), {
            type: ContentType.RASTER_IMAGE,
            language: stryMutAct_9fa48("1563") ? "" : (stryCov_9fa48("1563"), "unknown"),
            encoding: stryMutAct_9fa48("1564") ? "" : (stryCov_9fa48("1564"), "unknown"),
            confidence: 0,
            hasText: stryMutAct_9fa48("1565") ? true : (stryCov_9fa48("1565"), false),
            wordCount: 0,
            characterCount: 0
          });
          return stryMutAct_9fa48("1566") ? {} : (stryCov_9fa48("1566"), {
            text: stryMutAct_9fa48("1567") ? `` : (stryCov_9fa48("1567"), `Image OCR Error: Failed to read file - ${errorMessage}`),
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
    if (stryMutAct_9fa48("1568")) {
      {}
    } else {
      stryCov_9fa48("1568");
      // Check common image signatures
      const signatures = stryMutAct_9fa48("1569") ? [] : (stryCov_9fa48("1569"), [Buffer.from(stryMutAct_9fa48("1570") ? [] : (stryCov_9fa48("1570"), [0xff, 0xd8, 0xff])),
      // JPEG
      Buffer.from(stryMutAct_9fa48("1571") ? [] : (stryCov_9fa48("1571"), [0x89, 0x50, 0x4e, 0x47])),
      // PNG
      Buffer.from(stryMutAct_9fa48("1572") ? [] : (stryCov_9fa48("1572"), [0x42, 0x4d])),
      // BMP
      Buffer.from(stryMutAct_9fa48("1573") ? [] : (stryCov_9fa48("1573"), [0x49, 0x49, 0x2a, 0x00])),
      // TIFF (little-endian)
      Buffer.from(stryMutAct_9fa48("1574") ? [] : (stryCov_9fa48("1574"), [0x4d, 0x4d, 0x00, 0x2a])),
      // TIFF (big-endian)
      Buffer.from(stryMutAct_9fa48("1575") ? [] : (stryCov_9fa48("1575"), [0x52, 0x49, 0x46, 0x46])) // WEBP (starts with RIFF)
      ]);
      return stryMutAct_9fa48("1576") ? signatures.every(signature => buffer.subarray(0, signature.length).equals(signature)) : (stryCov_9fa48("1576"), signatures.some(stryMutAct_9fa48("1577") ? () => undefined : (stryCov_9fa48("1577"), signature => buffer.subarray(0, signature.length).equals(signature))));
    }
  }

  /**
   * Detect language from OCR text (simple heuristic)
   */
  private detectLanguage(text: string): string {
    if (stryMutAct_9fa48("1578")) {
      {}
    } else {
      stryCov_9fa48("1578");
      if (stryMutAct_9fa48("1581") ? !text && text.length === 0 : stryMutAct_9fa48("1580") ? false : stryMutAct_9fa48("1579") ? true : (stryCov_9fa48("1579", "1580", "1581"), (stryMutAct_9fa48("1582") ? text : (stryCov_9fa48("1582"), !text)) || (stryMutAct_9fa48("1584") ? text.length !== 0 : stryMutAct_9fa48("1583") ? false : (stryCov_9fa48("1583", "1584"), text.length === 0)))) return stryMutAct_9fa48("1585") ? "" : (stryCov_9fa48("1585"), "unknown");

      // Simple heuristics for language detection
      const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
      const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
      const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
      const englishMatches = (stryMutAct_9fa48("1588") ? text.match(englishWords) && [] : stryMutAct_9fa48("1587") ? false : stryMutAct_9fa48("1586") ? true : (stryCov_9fa48("1586", "1587", "1588"), text.match(englishWords) || (stryMutAct_9fa48("1589") ? ["Stryker was here"] : (stryCov_9fa48("1589"), [])))).length;
      const spanishMatches = (stryMutAct_9fa48("1592") ? text.match(spanishWords) && [] : stryMutAct_9fa48("1591") ? false : stryMutAct_9fa48("1590") ? true : (stryCov_9fa48("1590", "1591", "1592"), text.match(spanishWords) || (stryMutAct_9fa48("1593") ? ["Stryker was here"] : (stryCov_9fa48("1593"), [])))).length;
      const frenchMatches = (stryMutAct_9fa48("1596") ? text.match(frenchWords) && [] : stryMutAct_9fa48("1595") ? false : stryMutAct_9fa48("1594") ? true : (stryCov_9fa48("1594", "1595", "1596"), text.match(frenchWords) || (stryMutAct_9fa48("1597") ? ["Stryker was here"] : (stryCov_9fa48("1597"), [])))).length;
      const maxMatches = stryMutAct_9fa48("1598") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("1598"), Math.max(englishMatches, spanishMatches, frenchMatches));
      if (stryMutAct_9fa48("1601") ? maxMatches !== 0 : stryMutAct_9fa48("1600") ? false : stryMutAct_9fa48("1599") ? true : (stryCov_9fa48("1599", "1600", "1601"), maxMatches === 0)) return stryMutAct_9fa48("1602") ? "" : (stryCov_9fa48("1602"), "unknown");
      if (stryMutAct_9fa48("1605") ? maxMatches !== englishMatches : stryMutAct_9fa48("1604") ? false : stryMutAct_9fa48("1603") ? true : (stryCov_9fa48("1603", "1604", "1605"), maxMatches === englishMatches)) return stryMutAct_9fa48("1606") ? "" : (stryCov_9fa48("1606"), "en");
      if (stryMutAct_9fa48("1609") ? maxMatches !== spanishMatches : stryMutAct_9fa48("1608") ? false : stryMutAct_9fa48("1607") ? true : (stryCov_9fa48("1607", "1608", "1609"), maxMatches === spanishMatches)) return stryMutAct_9fa48("1610") ? "" : (stryCov_9fa48("1610"), "es");
      if (stryMutAct_9fa48("1613") ? maxMatches !== frenchMatches : stryMutAct_9fa48("1612") ? false : stryMutAct_9fa48("1611") ? true : (stryCov_9fa48("1611", "1612", "1613"), maxMatches === frenchMatches)) return stryMutAct_9fa48("1614") ? "" : (stryCov_9fa48("1614"), "fr");
      return stryMutAct_9fa48("1615") ? "" : (stryCov_9fa48("1615"), "unknown");
    }
  }

  /**
   * Clean up OCR worker
   */
  async terminate(): Promise<void> {
    if (stryMutAct_9fa48("1616")) {
      {}
    } else {
      stryCov_9fa48("1616");
      if (stryMutAct_9fa48("1618") ? false : stryMutAct_9fa48("1617") ? true : (stryCov_9fa48("1617", "1618"), this.worker)) {
        if (stryMutAct_9fa48("1619")) {
          {}
        } else {
          stryCov_9fa48("1619");
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
    if (stryMutAct_9fa48("1620")) {
      {}
    } else {
      stryCov_9fa48("1620");
      return stryMutAct_9fa48("1621") ? [] : (stryCov_9fa48("1621"), [stryMutAct_9fa48("1622") ? "" : (stryCov_9fa48("1622"), "eng"), // English
      stryMutAct_9fa48("1623") ? "" : (stryCov_9fa48("1623"), "spa"), // Spanish
      stryMutAct_9fa48("1624") ? "" : (stryCov_9fa48("1624"), "fra"), // French
      stryMutAct_9fa48("1625") ? "" : (stryCov_9fa48("1625"), "deu"), // German
      stryMutAct_9fa48("1626") ? "" : (stryCov_9fa48("1626"), "ita"), // Italian
      stryMutAct_9fa48("1627") ? "" : (stryCov_9fa48("1627"), "por"), // Portuguese
      stryMutAct_9fa48("1628") ? "" : (stryCov_9fa48("1628"), "rus"), // Russian
      stryMutAct_9fa48("1629") ? "" : (stryCov_9fa48("1629"), "ara"), // Arabic
      stryMutAct_9fa48("1630") ? "" : (stryCov_9fa48("1630"), "chi_sim"), // Chinese Simplified
      stryMutAct_9fa48("1631") ? "" : (stryCov_9fa48("1631"), "jpn") // Japanese
      ]);
    }
  }
}