/**
 * Image Link Extraction from Markdown Content
 * Extracts embedded images from markdown files for processing
 */
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
export interface ImageLink {
  /** Original markdown syntax (e.g., "![alt](image.png)" or "[[image.png]]") */
  original: string;

  /** Alt text for the image */
  alt: string;

  /** Source path/URL of the image */
  src: string;

  /** Line number where the link appears */
  line: number;

  /** Column position in the line */
  column: number;

  /** Whether this is an Obsidian wikilink (double brackets) */
  isWikilink: boolean;

  /** Whether this is a reference-style link */
  isReference: boolean;

  /** Reference label if it's a reference-style link */
  referenceLabel?: string;
}
export interface ImageLinkExtractionResult {
  /** All extracted image links */
  links: ImageLink[];

  /** Lines that contain images */
  linesWithImages: number[];

  /** Summary statistics */
  stats: {
    totalLinks: number;
    wikilinks: number;
    markdownLinks: number;
    referenceLinks: number;
    uniquePaths: number;
  };
}

/**
 * Extracts image links from markdown content
 */
export class ImageLinkExtractor {
  private readonly wikilinkRegex = stryMutAct_9fa48("791") ? /!\[\[([\]]+)\]\]/g : stryMutAct_9fa48("790") ? /!\[\[([^\]])\]\]/g : (stryCov_9fa48("790", "791"), /!\[\[([^\]]+)\]\]/g);
  private readonly markdownImageRegex = stryMutAct_9fa48("795") ? /!\[([^\]]*)\]\(([)]+)\)/g : stryMutAct_9fa48("794") ? /!\[([^\]]*)\]\(([^)])\)/g : stryMutAct_9fa48("793") ? /!\[([\]]*)\]\(([^)]+)\)/g : stryMutAct_9fa48("792") ? /!\[([^\]])\]\(([^)]+)\)/g : (stryCov_9fa48("792", "793", "794", "795"), /!\[([^\]]*)\]\(([^)]+)\)/g);
  private readonly referenceImageRegex = stryMutAct_9fa48("799") ? /!\[([^\]]*)\]\[([\]]+)\]/g : stryMutAct_9fa48("798") ? /!\[([^\]]*)\]\[([^\]])\]/g : stryMutAct_9fa48("797") ? /!\[([\]]*)\]\[([^\]]+)\]/g : stryMutAct_9fa48("796") ? /!\[([^\]])\]\[([^\]]+)\]/g : (stryCov_9fa48("796", "797", "798", "799"), /!\[([^\]]*)\]\[([^\]]+)\]/g);

  /**
   * Extract all image links from markdown content
   */
  extractImageLinks(content: string): ImageLinkExtractionResult {
    if (stryMutAct_9fa48("800")) {
      {}
    } else {
      stryCov_9fa48("800");
      const links: ImageLink[] = stryMutAct_9fa48("801") ? ["Stryker was here"] : (stryCov_9fa48("801"), []);
      const linesWithImages = new Set<number>();

      // Track positions for accurate line/column reporting
      const lines = content.split(stryMutAct_9fa48("802") ? "" : (stryCov_9fa48("802"), "\n"));

      // Extract wikilinks (Obsidian-style)
      this.extractWikilinks(content, lines, links, linesWithImages);

      // Extract markdown-style image links
      this.extractMarkdownImages(content, lines, links, linesWithImages);

      // Extract reference-style image links
      this.extractReferenceImages(content, lines, links, linesWithImages);

      // Calculate statistics
      const stats = this.calculateStats(links);
      return stryMutAct_9fa48("803") ? {} : (stryCov_9fa48("803"), {
        links,
        linesWithImages: stryMutAct_9fa48("804") ? Array.from(linesWithImages) : (stryCov_9fa48("804"), Array.from(linesWithImages).sort(stryMutAct_9fa48("805") ? () => undefined : (stryCov_9fa48("805"), (a, b) => stryMutAct_9fa48("806") ? a + b : (stryCov_9fa48("806"), a - b)))),
        stats
      });
    }
  }
  private extractWikilinks(content: string, lines: string[], links: ImageLink[], linesWithImages: Set<number>): void {
    if (stryMutAct_9fa48("807")) {
      {}
    } else {
      stryCov_9fa48("807");
      let match;
      this.wikilinkRegex.lastIndex = 0; // Reset regex state

      while (stryMutAct_9fa48("809") ? (match = this.wikilinkRegex.exec(content)) === null : stryMutAct_9fa48("808") ? false : (stryCov_9fa48("808", "809"), (match = this.wikilinkRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("810")) {
          {}
        } else {
          stryCov_9fa48("810");
          const original = match[0];
          const src = match[1];
          const startPos = match.index;

          // Find line and column
          const {
            line,
            column
          } = this.findPosition(lines, startPos);
          links.push(stryMutAct_9fa48("811") ? {} : (stryCov_9fa48("811"), {
            original,
            alt: src,
            // Wikilinks don't have separate alt text
            src,
            line,
            column,
            isWikilink: stryMutAct_9fa48("812") ? false : (stryCov_9fa48("812"), true),
            isReference: stryMutAct_9fa48("813") ? true : (stryCov_9fa48("813"), false)
          }));
          linesWithImages.add(line);
        }
      }
    }
  }
  private extractMarkdownImages(content: string, lines: string[], links: ImageLink[], linesWithImages: Set<number>): void {
    if (stryMutAct_9fa48("814")) {
      {}
    } else {
      stryCov_9fa48("814");
      let match;
      this.markdownImageRegex.lastIndex = 0;
      while (stryMutAct_9fa48("816") ? (match = this.markdownImageRegex.exec(content)) === null : stryMutAct_9fa48("815") ? false : (stryCov_9fa48("815", "816"), (match = this.markdownImageRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("817")) {
          {}
        } else {
          stryCov_9fa48("817");
          const original = match[0];
          const alt = match[1];
          const src = match[2];
          const startPos = match.index;

          // Find line and column
          const {
            line,
            column
          } = this.findPosition(lines, startPos);
          links.push(stryMutAct_9fa48("818") ? {} : (stryCov_9fa48("818"), {
            original,
            alt,
            src,
            line,
            column,
            isWikilink: stryMutAct_9fa48("819") ? true : (stryCov_9fa48("819"), false),
            isReference: stryMutAct_9fa48("820") ? true : (stryCov_9fa48("820"), false)
          }));
          linesWithImages.add(line);
        }
      }
    }
  }
  private extractReferenceImages(content: string, lines: string[], links: ImageLink[], linesWithImages: Set<number>): void {
    if (stryMutAct_9fa48("821")) {
      {}
    } else {
      stryCov_9fa48("821");
      let match;
      this.referenceImageRegex.lastIndex = 0;
      while (stryMutAct_9fa48("823") ? (match = this.referenceImageRegex.exec(content)) === null : stryMutAct_9fa48("822") ? false : (stryCov_9fa48("822", "823"), (match = this.referenceImageRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("824")) {
          {}
        } else {
          stryCov_9fa48("824");
          const original = match[0];
          const alt = match[1];
          const referenceLabel = match[2];
          const startPos = match.index;

          // Find line and column
          const {
            line,
            column
          } = this.findPosition(lines, startPos);
          links.push(stryMutAct_9fa48("825") ? {} : (stryCov_9fa48("825"), {
            original,
            alt,
            src: stryMutAct_9fa48("826") ? "Stryker was here!" : (stryCov_9fa48("826"), ""),
            // Will be resolved from reference definitions
            line,
            column,
            isWikilink: stryMutAct_9fa48("827") ? true : (stryCov_9fa48("827"), false),
            isReference: stryMutAct_9fa48("828") ? false : (stryCov_9fa48("828"), true),
            referenceLabel
          }));
          linesWithImages.add(line);
        }
      }
    }
  }
  private findPosition(lines: string[], charIndex: number): {
    line: number;
    column: number;
  } {
    if (stryMutAct_9fa48("829")) {
      {}
    } else {
      stryCov_9fa48("829");
      let currentIndex = 0;
      let line = 0;
      let column = 0;
      for (let i = 0; stryMutAct_9fa48("831") ? i < lines.length || currentIndex <= charIndex : stryMutAct_9fa48("830") ? false : (stryCov_9fa48("830", "831"), (stryMutAct_9fa48("834") ? i >= lines.length : stryMutAct_9fa48("833") ? i <= lines.length : stryMutAct_9fa48("832") ? true : (stryCov_9fa48("832", "833", "834"), i < lines.length)) && (stryMutAct_9fa48("837") ? currentIndex > charIndex : stryMutAct_9fa48("836") ? currentIndex < charIndex : stryMutAct_9fa48("835") ? true : (stryCov_9fa48("835", "836", "837"), currentIndex <= charIndex))); stryMutAct_9fa48("838") ? i-- : (stryCov_9fa48("838"), i++)) {
        if (stryMutAct_9fa48("839")) {
          {}
        } else {
          stryCov_9fa48("839");
          line = i;
          const lineLength = lines[i].length;
          if (stryMutAct_9fa48("843") ? currentIndex + lineLength < charIndex : stryMutAct_9fa48("842") ? currentIndex + lineLength > charIndex : stryMutAct_9fa48("841") ? false : stryMutAct_9fa48("840") ? true : (stryCov_9fa48("840", "841", "842", "843"), (stryMutAct_9fa48("844") ? currentIndex - lineLength : (stryCov_9fa48("844"), currentIndex + lineLength)) >= charIndex)) {
            if (stryMutAct_9fa48("845")) {
              {}
            } else {
              stryCov_9fa48("845");
              column = stryMutAct_9fa48("846") ? charIndex + currentIndex : (stryCov_9fa48("846"), charIndex - currentIndex);
              break;
            }
          }
          stryMutAct_9fa48("847") ? currentIndex -= lineLength + 1 : (stryCov_9fa48("847"), currentIndex += stryMutAct_9fa48("848") ? lineLength - 1 : (stryCov_9fa48("848"), lineLength + 1)); // +1 for newline character
        }
      }
      return stryMutAct_9fa48("849") ? {} : (stryCov_9fa48("849"), {
        line: stryMutAct_9fa48("850") ? line - 1 : (stryCov_9fa48("850"), line + 1),
        column
      }); // Convert to 1-based line numbers
    }
  }
  private calculateStats(links: ImageLink[]): ImageLinkExtractionResult["stats"] {
    if (stryMutAct_9fa48("851")) {
      {}
    } else {
      stryCov_9fa48("851");
      const uniquePaths = new Set(stryMutAct_9fa48("852") ? links.map(link => link.src) : (stryCov_9fa48("852"), links.map(stryMutAct_9fa48("853") ? () => undefined : (stryCov_9fa48("853"), link => link.src)).filter(stryMutAct_9fa48("854") ? () => undefined : (stryCov_9fa48("854"), src => src)))).size;
      return stryMutAct_9fa48("855") ? {} : (stryCov_9fa48("855"), {
        totalLinks: links.length,
        wikilinks: stryMutAct_9fa48("856") ? links.length : (stryCov_9fa48("856"), links.filter(stryMutAct_9fa48("857") ? () => undefined : (stryCov_9fa48("857"), link => link.isWikilink)).length),
        markdownLinks: stryMutAct_9fa48("858") ? links.length : (stryCov_9fa48("858"), links.filter(stryMutAct_9fa48("859") ? () => undefined : (stryCov_9fa48("859"), link => stryMutAct_9fa48("862") ? !link.isWikilink || !link.isReference : stryMutAct_9fa48("861") ? false : stryMutAct_9fa48("860") ? true : (stryCov_9fa48("860", "861", "862"), (stryMutAct_9fa48("863") ? link.isWikilink : (stryCov_9fa48("863"), !link.isWikilink)) && (stryMutAct_9fa48("864") ? link.isReference : (stryCov_9fa48("864"), !link.isReference))))).length),
        referenceLinks: stryMutAct_9fa48("865") ? links.length : (stryCov_9fa48("865"), links.filter(stryMutAct_9fa48("866") ? () => undefined : (stryCov_9fa48("866"), link => link.isReference)).length),
        uniquePaths
      });
    }
  }

  /**
   * Validate that a path could potentially be an image
   */
  isImagePath(path: string): boolean {
    if (stryMutAct_9fa48("867")) {
      {}
    } else {
      stryCov_9fa48("867");
      if (stryMutAct_9fa48("870") ? false : stryMutAct_9fa48("869") ? true : stryMutAct_9fa48("868") ? path : (stryCov_9fa48("868", "869", "870"), !path)) return stryMutAct_9fa48("871") ? true : (stryCov_9fa48("871"), false);
      const imageExtensions = stryMutAct_9fa48("872") ? [] : (stryCov_9fa48("872"), [stryMutAct_9fa48("873") ? "" : (stryCov_9fa48("873"), ".png"), stryMutAct_9fa48("874") ? "" : (stryCov_9fa48("874"), ".jpg"), stryMutAct_9fa48("875") ? "" : (stryCov_9fa48("875"), ".jpeg"), stryMutAct_9fa48("876") ? "" : (stryCov_9fa48("876"), ".gif"), stryMutAct_9fa48("877") ? "" : (stryCov_9fa48("877"), ".bmp"), stryMutAct_9fa48("878") ? "" : (stryCov_9fa48("878"), ".tiff"), stryMutAct_9fa48("879") ? "" : (stryCov_9fa48("879"), ".webp"), stryMutAct_9fa48("880") ? "" : (stryCov_9fa48("880"), ".svg")]);
      const lowerPath = stryMutAct_9fa48("881") ? path.toUpperCase() : (stryCov_9fa48("881"), path.toLowerCase());
      return stryMutAct_9fa48("882") ? imageExtensions.every(ext => lowerPath.endsWith(ext)) : (stryCov_9fa48("882"), imageExtensions.some(stryMutAct_9fa48("883") ? () => undefined : (stryCov_9fa48("883"), ext => stryMutAct_9fa48("884") ? lowerPath.startsWith(ext) : (stryCov_9fa48("884"), lowerPath.endsWith(ext)))));
    }
  }

  /**
   * Filter image links to only include valid image paths
   */
  filterValidImageLinks(links: ImageLink[]): ImageLink[] {
    if (stryMutAct_9fa48("885")) {
      {}
    } else {
      stryCov_9fa48("885");
      return stryMutAct_9fa48("886") ? links : (stryCov_9fa48("886"), links.filter(stryMutAct_9fa48("887") ? () => undefined : (stryCov_9fa48("887"), link => this.isImagePath(link.src))));
    }
  }

  /**
   * Group images by source path for deduplication
   */
  groupBySource(links: ImageLink[]): Map<string, ImageLink[]> {
    if (stryMutAct_9fa48("888")) {
      {}
    } else {
      stryCov_9fa48("888");
      const grouped = new Map<string, ImageLink[]>();
      links.forEach(link => {
        if (stryMutAct_9fa48("889")) {
          {}
        } else {
          stryCov_9fa48("889");
          const src = link.src;
          if (stryMutAct_9fa48("892") ? false : stryMutAct_9fa48("891") ? true : stryMutAct_9fa48("890") ? grouped.has(src) : (stryCov_9fa48("890", "891", "892"), !grouped.has(src))) {
            if (stryMutAct_9fa48("893")) {
              {}
            } else {
              stryCov_9fa48("893");
              grouped.set(src, stryMutAct_9fa48("894") ? ["Stryker was here"] : (stryCov_9fa48("894"), []));
            }
          }
          grouped.get(src)!.push(link);
        }
      });
      return grouped;
    }
  }
}