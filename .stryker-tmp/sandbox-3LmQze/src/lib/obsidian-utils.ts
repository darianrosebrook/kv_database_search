/**
 * Obsidian Utility Functions
 * Collection of utility functions for processing Obsidian markdown files
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
export class ObsidianUtils {
  /**
   * Clean markdown content by removing or normalizing common markdown elements
   */
  static cleanMarkdown(content: string): string {
    if (stryMutAct_9fa48("2969")) {
      {}
    } else {
      stryCov_9fa48("2969");
      return stryMutAct_9fa48("2970") ? content.replace(/\r\n/g, "\n") // Normalize line endings
      .replace(/\r/g, "\n").replace(/\t/g, "  ") // Normalize tabs to spaces
      : (stryCov_9fa48("2970"), content.replace(/\r\n/g, stryMutAct_9fa48("2971") ? "" : (stryCov_9fa48("2971"), "\n")) // Normalize line endings
      .replace(/\r/g, stryMutAct_9fa48("2972") ? "" : (stryCov_9fa48("2972"), "\n")).replace(/\t/g, stryMutAct_9fa48("2973") ? "" : (stryCov_9fa48("2973"), "  ")) // Normalize tabs to spaces
      .trim());
    }
  }

  /**
   * Extract wikilinks from markdown content
   */
  static extractWikilinks(content: string): Array<{
    link: string;
    displayText?: string;
    position: number;
  }> {
    if (stryMutAct_9fa48("2974")) {
      {}
    } else {
      stryCov_9fa48("2974");
      const wikilinkRegex = stryMutAct_9fa48("2979") ? /\[\[([^\]|]+)(\|[\]]+)?\]\]/g : stryMutAct_9fa48("2978") ? /\[\[([^\]|]+)(\|[^\]])?\]\]/g : stryMutAct_9fa48("2977") ? /\[\[([^\]|]+)(\|[^\]]+)\]\]/g : stryMutAct_9fa48("2976") ? /\[\[([\]|]+)(\|[^\]]+)?\]\]/g : stryMutAct_9fa48("2975") ? /\[\[([^\]|])(\|[^\]]+)?\]\]/g : (stryCov_9fa48("2975", "2976", "2977", "2978", "2979"), /\[\[([^\]|]+)(\|[^\]]+)?\]\]/g);
      const links: Array<{
        link: string;
        displayText?: string;
        position: number;
      }> = stryMutAct_9fa48("2980") ? ["Stryker was here"] : (stryCov_9fa48("2980"), []);
      let match;
      while (stryMutAct_9fa48("2982") ? (match = wikilinkRegex.exec(content)) === null : stryMutAct_9fa48("2981") ? false : (stryCov_9fa48("2981", "2982"), (match = wikilinkRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("2983")) {
          {}
        } else {
          stryCov_9fa48("2983");
          const [, link, displayPart] = match;
          links.push(stryMutAct_9fa48("2984") ? {} : (stryCov_9fa48("2984"), {
            link: stryMutAct_9fa48("2985") ? link : (stryCov_9fa48("2985"), link.trim()),
            displayText: displayPart ? stryMutAct_9fa48("2987") ? displayPart.trim() : stryMutAct_9fa48("2986") ? displayPart.substring(1) : (stryCov_9fa48("2986", "2987"), displayPart.substring(1).trim()) : undefined,
            position: match.index
          }));
        }
      }
      return links;
    }
  }

  /**
   * Extract tags from markdown content
   */
  static extractTags(content: string): string[] {
    if (stryMutAct_9fa48("2988")) {
      {}
    } else {
      stryCov_9fa48("2988");
      const tagRegex = stryMutAct_9fa48("2991") ? /#[\W/-]+/g : stryMutAct_9fa48("2990") ? /#[^\w/-]+/g : stryMutAct_9fa48("2989") ? /#[\w/-]/g : (stryCov_9fa48("2989", "2990", "2991"), /#[\w/-]+/g);
      const tags: string[] = stryMutAct_9fa48("2992") ? ["Stryker was here"] : (stryCov_9fa48("2992"), []);
      let match;
      while (stryMutAct_9fa48("2994") ? (match = tagRegex.exec(content)) === null : stryMutAct_9fa48("2993") ? false : (stryCov_9fa48("2993", "2994"), (match = tagRegex.exec(content)) !== null)) {
        if (stryMutAct_9fa48("2995")) {
          {}
        } else {
          stryCov_9fa48("2995");
          tags.push(match[0]);
        }
      }
      return stryMutAct_9fa48("2996") ? [] : (stryCov_9fa48("2996"), [...new Set(tags)]); // Remove duplicates
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  static parseFrontmatter(content: string): {
    frontmatter: Record<string, any>;
    body: string;
  } {
    if (stryMutAct_9fa48("2997")) {
      {}
    } else {
      stryCov_9fa48("2997");
      const frontmatterRegex = stryMutAct_9fa48("3002") ? /^---\n([\s\s]*?)\n---\n/ : stryMutAct_9fa48("3001") ? /^---\n([\S\S]*?)\n---\n/ : stryMutAct_9fa48("3000") ? /^---\n([^\s\S]*?)\n---\n/ : stryMutAct_9fa48("2999") ? /^---\n([\s\S])\n---\n/ : stryMutAct_9fa48("2998") ? /---\n([\s\S]*?)\n---\n/ : (stryCov_9fa48("2998", "2999", "3000", "3001", "3002"), /^---\n([\s\S]*?)\n---\n/);
      const match = content.match(frontmatterRegex);
      if (stryMutAct_9fa48("3005") ? false : stryMutAct_9fa48("3004") ? true : stryMutAct_9fa48("3003") ? match : (stryCov_9fa48("3003", "3004", "3005"), !match)) {
        if (stryMutAct_9fa48("3006")) {
          {}
        } else {
          stryCov_9fa48("3006");
          return stryMutAct_9fa48("3007") ? {} : (stryCov_9fa48("3007"), {
            frontmatter: {},
            body: content
          });
        }
      }
      const frontmatterContent = match[1];
      const body = stryMutAct_9fa48("3008") ? content : (stryCov_9fa48("3008"), content.substring(match[0].length));
      try {
        if (stryMutAct_9fa48("3009")) {
          {}
        } else {
          stryCov_9fa48("3009");
          // Simple YAML-like parsing (basic implementation)
          const frontmatter: Record<string, any> = {};
          const lines = frontmatterContent.split(stryMutAct_9fa48("3010") ? "" : (stryCov_9fa48("3010"), "\n"));
          for (const line of lines) {
            if (stryMutAct_9fa48("3011")) {
              {}
            } else {
              stryCov_9fa48("3011");
              const colonIndex = line.indexOf(stryMutAct_9fa48("3012") ? "" : (stryCov_9fa48("3012"), ":"));
              if (stryMutAct_9fa48("3016") ? colonIndex <= 0 : stryMutAct_9fa48("3015") ? colonIndex >= 0 : stryMutAct_9fa48("3014") ? false : stryMutAct_9fa48("3013") ? true : (stryCov_9fa48("3013", "3014", "3015", "3016"), colonIndex > 0)) {
                if (stryMutAct_9fa48("3017")) {
                  {}
                } else {
                  stryCov_9fa48("3017");
                  const key = stryMutAct_9fa48("3019") ? line.trim() : stryMutAct_9fa48("3018") ? line.substring(0, colonIndex) : (stryCov_9fa48("3018", "3019"), line.substring(0, colonIndex).trim());
                  const value = stryMutAct_9fa48("3021") ? line.trim() : stryMutAct_9fa48("3020") ? line.substring(colonIndex + 1) : (stryCov_9fa48("3020", "3021"), line.substring(stryMutAct_9fa48("3022") ? colonIndex - 1 : (stryCov_9fa48("3022"), colonIndex + 1)).trim());
                  frontmatter[key] = value;
                }
              }
            }
          }
          return stryMutAct_9fa48("3023") ? {} : (stryCov_9fa48("3023"), {
            frontmatter,
            body
          });
        }
      } catch {
        if (stryMutAct_9fa48("3024")) {
          {}
        } else {
          stryCov_9fa48("3024");
          return stryMutAct_9fa48("3025") ? {} : (stryCov_9fa48("3025"), {
            frontmatter: {},
            body: content
          });
        }
      }
    }
  }

  /**
   * Generate a deterministic checksum for file content
   */
  static generateFileChecksum(content: string): string {
    if (stryMutAct_9fa48("3026")) {
      {}
    } else {
      stryCov_9fa48("3026");
      const crypto = require("crypto");
      return crypto.createHash(stryMutAct_9fa48("3027") ? "" : (stryCov_9fa48("3027"), "sha256")).update(content).digest(stryMutAct_9fa48("3028") ? "" : (stryCov_9fa48("3028"), "hex"));
    }
  }

  /**
   * Determine content type based on file extension or content analysis
   */
  static determineContentType(filePath: string, content?: string): string {
    if (stryMutAct_9fa48("3029")) {
      {}
    } else {
      stryCov_9fa48("3029");
      const extension = stryMutAct_9fa48("3031") ? filePath.split(".").pop().toLowerCase() : stryMutAct_9fa48("3030") ? filePath.split(".").pop()?.toUpperCase() : (stryCov_9fa48("3030", "3031"), filePath.split(stryMutAct_9fa48("3032") ? "" : (stryCov_9fa48("3032"), ".")).pop()?.toLowerCase());
      switch (extension) {
        case stryMutAct_9fa48("3034") ? "" : (stryCov_9fa48("3034"), "md"):
          if (stryMutAct_9fa48("3033")) {} else {
            stryCov_9fa48("3033");
            return stryMutAct_9fa48("3035") ? "" : (stryCov_9fa48("3035"), "markdown");
          }
        case stryMutAct_9fa48("3037") ? "" : (stryCov_9fa48("3037"), "txt"):
          if (stryMutAct_9fa48("3036")) {} else {
            stryCov_9fa48("3036");
            return stryMutAct_9fa48("3038") ? "" : (stryCov_9fa48("3038"), "text");
          }
        case stryMutAct_9fa48("3040") ? "" : (stryCov_9fa48("3040"), "json"):
          if (stryMutAct_9fa48("3039")) {} else {
            stryCov_9fa48("3039");
            return stryMutAct_9fa48("3041") ? "" : (stryCov_9fa48("3041"), "json");
          }
        case stryMutAct_9fa48("3043") ? "" : (stryCov_9fa48("3043"), "pdf"):
          if (stryMutAct_9fa48("3042")) {} else {
            stryCov_9fa48("3042");
            return stryMutAct_9fa48("3044") ? "" : (stryCov_9fa48("3044"), "pdf");
          }
        case stryMutAct_9fa48("3045") ? "" : (stryCov_9fa48("3045"), "jpg"):
        case stryMutAct_9fa48("3046") ? "" : (stryCov_9fa48("3046"), "jpeg"):
        case stryMutAct_9fa48("3047") ? "" : (stryCov_9fa48("3047"), "png"):
        case stryMutAct_9fa48("3049") ? "" : (stryCov_9fa48("3049"), "gif"):
          if (stryMutAct_9fa48("3048")) {} else {
            stryCov_9fa48("3048");
            return stryMutAct_9fa48("3050") ? "" : (stryCov_9fa48("3050"), "image");
          }
        default:
          if (stryMutAct_9fa48("3051")) {} else {
            stryCov_9fa48("3051");
            return stryMutAct_9fa48("3052") ? "" : (stryCov_9fa48("3052"), "unknown");
          }
      }
    }
  }

  /**
   * Generate a deterministic ID from content
   */
  static generateDeterministicId(content: string): string {
    if (stryMutAct_9fa48("3053")) {
      {}
    } else {
      stryCov_9fa48("3053");
      const crypto = require("crypto");
      return crypto.createHash(stryMutAct_9fa48("3054") ? "" : (stryCov_9fa48("3054"), "md5")).update(content).digest(stryMutAct_9fa48("3055") ? "" : (stryCov_9fa48("3055"), "hex"));
    }
  }

  /**
   * Sleep utility function
   */
  static sleep(ms: number): Promise<void> {
    if (stryMutAct_9fa48("3056")) {
      {}
    } else {
      stryCov_9fa48("3056");
      return new Promise(stryMutAct_9fa48("3057") ? () => undefined : (stryCov_9fa48("3057"), resolve => setTimeout(resolve, ms)));
    }
  }

  /**
   * Create a hash from string content
   */
  static createHash(content: string): string {
    if (stryMutAct_9fa48("3058")) {
      {}
    } else {
      stryCov_9fa48("3058");
      const crypto = require("crypto");
      return crypto.createHash(stryMutAct_9fa48("3059") ? "" : (stryCov_9fa48("3059"), "sha256")).update(content).digest(stryMutAct_9fa48("3060") ? "" : (stryCov_9fa48("3060"), "hex"));
    }
  }

  /**
   * Detect language from text content
   */
  static detectLanguage(text: string): string {
    if (stryMutAct_9fa48("3061")) {
      {}
    } else {
      stryCov_9fa48("3061");
      // Simple language detection based on common patterns
      // This is a basic implementation - in a real app you'd use a proper library
      const patterns = stryMutAct_9fa48("3062") ? {} : (stryCov_9fa48("3062"), {
        chinese: stryMutAct_9fa48("3063") ? /[^\u4e00-\u9fa5]/ : (stryCov_9fa48("3063"), /[\u4e00-\u9fa5]/),
        japanese: stryMutAct_9fa48("3064") ? /[^\u3040-\u309f\u30a0-\u30ff]/ : (stryCov_9fa48("3064"), /[\u3040-\u309f\u30a0-\u30ff]/),
        korean: stryMutAct_9fa48("3065") ? /[^\uac00-\ud7af]/ : (stryCov_9fa48("3065"), /[\uac00-\ud7af]/),
        arabic: stryMutAct_9fa48("3066") ? /[^\u0600-\u06ff]/ : (stryCov_9fa48("3066"), /[\u0600-\u06ff]/),
        cyrillic: stryMutAct_9fa48("3067") ? /[^\u0400-\u04ff]/ : (stryCov_9fa48("3067"), /[\u0400-\u04ff]/)
      });
      for (const [lang, pattern] of Object.entries(patterns)) {
        if (stryMutAct_9fa48("3068")) {
          {}
        } else {
          stryCov_9fa48("3068");
          if (stryMutAct_9fa48("3070") ? false : stryMutAct_9fa48("3069") ? true : (stryCov_9fa48("3069", "3070"), pattern.test(text))) {
            if (stryMutAct_9fa48("3071")) {
              {}
            } else {
              stryCov_9fa48("3071");
              return lang;
            }
          }
        }
      }
      return stryMutAct_9fa48("3072") ? "" : (stryCov_9fa48("3072"), "english"); // Default
    }
  }
}