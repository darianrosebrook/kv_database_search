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
import crypto from "node:crypto";

/**
 * Normalize text for consistent embedding and caching
 * Following the best practices from the instructions
 */
export function normalize(text: string): string {
  if (stryMutAct_9fa48("3886")) {
    {}
  } else {
    stryCov_9fa48("3886");
    return stryMutAct_9fa48("3887") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("3887"), text.normalize(stryMutAct_9fa48("3888") ? "" : (stryCov_9fa48("3888"), "NFC")).replace(stryMutAct_9fa48("3889") ? /\r\n/g : (stryCov_9fa48("3889"), /\r\n?/g), stryMutAct_9fa48("3890") ? "" : (stryCov_9fa48("3890"), "\n")).replace(stryMutAct_9fa48("3892") ? /[^ \t]+/g : stryMutAct_9fa48("3891") ? /[ \t]/g : (stryCov_9fa48("3891", "3892"), /[ \t]+/g), stryMutAct_9fa48("3893") ? "" : (stryCov_9fa48("3893"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("3894") ? "Stryker was here!" : (stryCov_9fa48("3894"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("3895")) {
    {}
  } else {
    stryCov_9fa48("3895");
    const normalized = normalize(text);
    return createHash(stryMutAct_9fa48("3896") ? "" : (stryCov_9fa48("3896"), "sha256"), normalized);
  }
}

/**
 * Create a hash using specified algorithm and input
 */
export function createHash(algorithm: string, input: string | Buffer): string {
  if (stryMutAct_9fa48("3897")) {
    {}
  } else {
    stryCov_9fa48("3897");
    return crypto.createHash(algorithm).update(input).digest(stryMutAct_9fa48("3898") ? "" : (stryCov_9fa48("3898"), "hex"));
  }
}

/**
 * Generate a deterministic ID from multiple components
 */
export function generateDeterministicId(...components: (string | number)[]): string {
  if (stryMutAct_9fa48("3899")) {
    {}
  } else {
    stryCov_9fa48("3899");
    const combined = components.join(stryMutAct_9fa48("3900") ? "" : (stryCov_9fa48("3900"), "_"));
    return stryMutAct_9fa48("3901") ? createHash("md5", combined) : (stryCov_9fa48("3901"), createHash(stryMutAct_9fa48("3902") ? "" : (stryCov_9fa48("3902"), "md5"), combined).slice(0, 8));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("3903")) {
    {}
  } else {
    stryCov_9fa48("3903");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("3904") ? () => undefined : (stryCov_9fa48("3904"), (sum, x) => stryMutAct_9fa48("3905") ? sum - x * x : (stryCov_9fa48("3905"), sum + (stryMutAct_9fa48("3906") ? x / x : (stryCov_9fa48("3906"), x * x)))), 0));
    if (stryMutAct_9fa48("3909") ? norm !== 0 : stryMutAct_9fa48("3908") ? false : stryMutAct_9fa48("3907") ? true : (stryCov_9fa48("3907", "3908", "3909"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("3910") ? () => undefined : (stryCov_9fa48("3910"), x => stryMutAct_9fa48("3911") ? x * norm : (stryCov_9fa48("3911"), x / norm)));
  }
}

/**
 * Determine content type based on file extension
 */
export function determineContentType(filePath: string): string {
  if (stryMutAct_9fa48("3912")) {
    {}
  } else {
    stryCov_9fa48("3912");
    const extension = stryMutAct_9fa48("3914") ? filePath.split(".").pop().toLowerCase() : stryMutAct_9fa48("3913") ? filePath.split(".").pop()?.toUpperCase() : (stryCov_9fa48("3913", "3914"), filePath.split(stryMutAct_9fa48("3915") ? "" : (stryCov_9fa48("3915"), ".")).pop()?.toLowerCase());
    switch (extension) {
      case stryMutAct_9fa48("3917") ? "" : (stryCov_9fa48("3917"), "md"):
        if (stryMutAct_9fa48("3916")) {} else {
          stryCov_9fa48("3916");
          return stryMutAct_9fa48("3918") ? "" : (stryCov_9fa48("3918"), "markdown");
        }
      case stryMutAct_9fa48("3920") ? "" : (stryCov_9fa48("3920"), "txt"):
        if (stryMutAct_9fa48("3919")) {} else {
          stryCov_9fa48("3919");
          return stryMutAct_9fa48("3921") ? "" : (stryCov_9fa48("3921"), "text");
        }
      case stryMutAct_9fa48("3923") ? "" : (stryCov_9fa48("3923"), "json"):
        if (stryMutAct_9fa48("3922")) {} else {
          stryCov_9fa48("3922");
          return stryMutAct_9fa48("3924") ? "" : (stryCov_9fa48("3924"), "json");
        }
      case stryMutAct_9fa48("3926") ? "" : (stryCov_9fa48("3926"), "pdf"):
        if (stryMutAct_9fa48("3925")) {} else {
          stryCov_9fa48("3925");
          return stryMutAct_9fa48("3927") ? "" : (stryCov_9fa48("3927"), "pdf");
        }
      case stryMutAct_9fa48("3928") ? "" : (stryCov_9fa48("3928"), "jpg"):
      case stryMutAct_9fa48("3929") ? "" : (stryCov_9fa48("3929"), "jpeg"):
      case stryMutAct_9fa48("3930") ? "" : (stryCov_9fa48("3930"), "png"):
      case stryMutAct_9fa48("3932") ? "" : (stryCov_9fa48("3932"), "gif"):
        if (stryMutAct_9fa48("3931")) {} else {
          stryCov_9fa48("3931");
          return stryMutAct_9fa48("3933") ? "" : (stryCov_9fa48("3933"), "image");
        }
      default:
        if (stryMutAct_9fa48("3934")) {} else {
          stryCov_9fa48("3934");
          return stryMutAct_9fa48("3935") ? "" : (stryCov_9fa48("3935"), "unknown");
        }
    }
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("3936")) {
    {}
  } else {
    stryCov_9fa48("3936");
    if (stryMutAct_9fa48("3939") ? vecA.length === vecB.length : stryMutAct_9fa48("3938") ? false : stryMutAct_9fa48("3937") ? true : (stryCov_9fa48("3937", "3938", "3939"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("3940")) {
        {}
      } else {
        stryCov_9fa48("3940");
        throw new Error(stryMutAct_9fa48("3941") ? "" : (stryCov_9fa48("3941"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("3944") ? i >= vecA.length : stryMutAct_9fa48("3943") ? i <= vecA.length : stryMutAct_9fa48("3942") ? false : (stryCov_9fa48("3942", "3943", "3944"), i < vecA.length); stryMutAct_9fa48("3945") ? i-- : (stryCov_9fa48("3945"), i++)) {
      if (stryMutAct_9fa48("3946")) {
        {}
      } else {
        stryCov_9fa48("3946");
        stryMutAct_9fa48("3947") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("3947"), dotProduct += stryMutAct_9fa48("3948") ? vecA[i] / vecB[i] : (stryCov_9fa48("3948"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("3949") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("3949"), normA += stryMutAct_9fa48("3950") ? vecA[i] / vecA[i] : (stryCov_9fa48("3950"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("3951") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("3951"), normB += stryMutAct_9fa48("3952") ? vecB[i] / vecB[i] : (stryCov_9fa48("3952"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("3955") ? normA === 0 && normB === 0 : stryMutAct_9fa48("3954") ? false : stryMutAct_9fa48("3953") ? true : (stryCov_9fa48("3953", "3954", "3955"), (stryMutAct_9fa48("3957") ? normA !== 0 : stryMutAct_9fa48("3956") ? false : (stryCov_9fa48("3956", "3957"), normA === 0)) || (stryMutAct_9fa48("3959") ? normB !== 0 : stryMutAct_9fa48("3958") ? false : (stryCov_9fa48("3958", "3959"), normB === 0)))) return 0;
    return stryMutAct_9fa48("3960") ? dotProduct * (normA * normB) : (stryCov_9fa48("3960"), dotProduct / (stryMutAct_9fa48("3961") ? normA / normB : (stryCov_9fa48("3961"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("3962")) {
    {}
  } else {
    stryCov_9fa48("3962");
    return Math.ceil(stryMutAct_9fa48("3963") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("3963"), text.split(stryMutAct_9fa48("3965") ? /\S+/ : stryMutAct_9fa48("3964") ? /\s/ : (stryCov_9fa48("3964", "3965"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("3966")) {
    {}
  } else {
    stryCov_9fa48("3966");
    return new Promise(stryMutAct_9fa48("3967") ? () => undefined : (stryCov_9fa48("3967"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("3968")) {
    {}
  } else {
    stryCov_9fa48("3968");
    const wikilinkRegex = stryMutAct_9fa48("3970") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("3969") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("3969", "3970"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("3971") ? ["Stryker was here"] : (stryCov_9fa48("3971"), []);
    let match;
    while (stryMutAct_9fa48("3973") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("3972") ? false : (stryCov_9fa48("3972", "3973"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("3974")) {
        {}
      } else {
        stryCov_9fa48("3974");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("3975") ? [] : (stryCov_9fa48("3975"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("3976")) {
    {}
  } else {
    stryCov_9fa48("3976");
    const tagRegex = stryMutAct_9fa48("3978") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("3977") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("3977", "3978"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("3979") ? ["Stryker was here"] : (stryCov_9fa48("3979"), []);
    let match;
    while (stryMutAct_9fa48("3981") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("3980") ? false : (stryCov_9fa48("3980", "3981"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("3982")) {
        {}
      } else {
        stryCov_9fa48("3982");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("3983") ? [] : (stryCov_9fa48("3983"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Extract Obsidian-style tags from text (including nested paths)
 */
export function extractObsidianTags(text: string): string[] {
  if (stryMutAct_9fa48("3984")) {
    {}
  } else {
    stryCov_9fa48("3984");
    const tagRegex = stryMutAct_9fa48("3986") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("3985") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("3985", "3986"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("3987") ? ["Stryker was here"] : (stryCov_9fa48("3987"), []);
    let match;
    while (stryMutAct_9fa48("3989") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("3988") ? false : (stryCov_9fa48("3988", "3989"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("3990")) {
        {}
      } else {
        stryCov_9fa48("3990");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("3991") ? [] : (stryCov_9fa48("3991"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("3992")) {
    {}
  } else {
    stryCov_9fa48("3992");
    return stryMutAct_9fa48("3993") ? text
    // Remove frontmatter
    .replace(/^---[\s\S]*?---\n?/, "")
    // Remove wikilinks but keep the text
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    // Remove markdown links but keep the text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    // Remove markdown formatting
    .replace(/[*_`~]/g, "")
    // Remove headers
    .replace(/^#+\s+/gm, "")
    // Clean up extra whitespace
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("3993"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("3999") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("3998") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("3997") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("3996") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("3995") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("3994") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("3994", "3995", "3996", "3997", "3998", "3999"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("4000") ? "Stryker was here!" : (stryCov_9fa48("4000"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("4002") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("4001") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("4001", "4002"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("4003") ? "" : (stryCov_9fa48("4003"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("4007") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("4006") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("4005") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("4004") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("4004", "4005", "4006", "4007"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("4008") ? "" : (stryCov_9fa48("4008"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("4009") ? /[^*_`~]/g : (stryCov_9fa48("4009"), /[*_`~]/g), stryMutAct_9fa48("4010") ? "Stryker was here!" : (stryCov_9fa48("4010"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("4014") ? /^#+\S+/gm : stryMutAct_9fa48("4013") ? /^#+\s/gm : stryMutAct_9fa48("4012") ? /^#\s+/gm : stryMutAct_9fa48("4011") ? /#+\s+/gm : (stryCov_9fa48("4011", "4012", "4013", "4014"), /^#+\s+/gm), stryMutAct_9fa48("4015") ? "Stryker was here!" : (stryCov_9fa48("4015"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("4017") ? /\n\S*\n/g : stryMutAct_9fa48("4016") ? /\n\s\n/g : (stryCov_9fa48("4016", "4017"), /\n\s*\n/g), stryMutAct_9fa48("4018") ? "" : (stryCov_9fa48("4018"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("4019")) {
    {}
  } else {
    stryCov_9fa48("4019");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("4020") ? "Stryker was here!" : (stryCov_9fa48("4020"), "")).replace(stryMutAct_9fa48("4022") ? /^\// : stryMutAct_9fa48("4021") ? /\/+/ : (stryCov_9fa48("4021", "4022"), /^\/+/), stryMutAct_9fa48("4023") ? "Stryker was here!" : (stryCov_9fa48("4023"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("4024") ? "" : (stryCov_9fa48("4024"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("4028") ? pathParts.length <= 0 : stryMutAct_9fa48("4027") ? pathParts.length >= 0 : stryMutAct_9fa48("4026") ? false : stryMutAct_9fa48("4025") ? true : (stryCov_9fa48("4025", "4026", "4027", "4028"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("4029") ? [] : (stryCov_9fa48("4029"), [stryMutAct_9fa48("4030") ? "" : (stryCov_9fa48("4030"), "Root")]);
  }
}

/**
 * Detect language from text using simple heuristics
 */
export function detectLanguage(text: string): string {
  if (stryMutAct_9fa48("4031")) {
    {}
  } else {
    stryCov_9fa48("4031");
    if (stryMutAct_9fa48("4034") ? !text && text.length === 0 : stryMutAct_9fa48("4033") ? false : stryMutAct_9fa48("4032") ? true : (stryCov_9fa48("4032", "4033", "4034"), (stryMutAct_9fa48("4035") ? text : (stryCov_9fa48("4035"), !text)) || (stryMutAct_9fa48("4037") ? text.length !== 0 : stryMutAct_9fa48("4036") ? false : (stryCov_9fa48("4036", "4037"), text.length === 0)))) return stryMutAct_9fa48("4038") ? "" : (stryCov_9fa48("4038"), "unknown");
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
    const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
    const englishMatches = (stryMutAct_9fa48("4041") ? text.match(englishWords) && [] : stryMutAct_9fa48("4040") ? false : stryMutAct_9fa48("4039") ? true : (stryCov_9fa48("4039", "4040", "4041"), text.match(englishWords) || (stryMutAct_9fa48("4042") ? ["Stryker was here"] : (stryCov_9fa48("4042"), [])))).length;
    const spanishMatches = (stryMutAct_9fa48("4045") ? text.match(spanishWords) && [] : stryMutAct_9fa48("4044") ? false : stryMutAct_9fa48("4043") ? true : (stryCov_9fa48("4043", "4044", "4045"), text.match(spanishWords) || (stryMutAct_9fa48("4046") ? ["Stryker was here"] : (stryCov_9fa48("4046"), [])))).length;
    const frenchMatches = (stryMutAct_9fa48("4049") ? text.match(frenchWords) && [] : stryMutAct_9fa48("4048") ? false : stryMutAct_9fa48("4047") ? true : (stryCov_9fa48("4047", "4048", "4049"), text.match(frenchWords) || (stryMutAct_9fa48("4050") ? ["Stryker was here"] : (stryCov_9fa48("4050"), [])))).length;
    const maxMatches = stryMutAct_9fa48("4051") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("4051"), Math.max(englishMatches, spanishMatches, frenchMatches));
    if (stryMutAct_9fa48("4054") ? maxMatches !== 0 : stryMutAct_9fa48("4053") ? false : stryMutAct_9fa48("4052") ? true : (stryCov_9fa48("4052", "4053", "4054"), maxMatches === 0)) return stryMutAct_9fa48("4055") ? "" : (stryCov_9fa48("4055"), "unknown");
    if (stryMutAct_9fa48("4058") ? maxMatches !== englishMatches : stryMutAct_9fa48("4057") ? false : stryMutAct_9fa48("4056") ? true : (stryCov_9fa48("4056", "4057", "4058"), maxMatches === englishMatches)) return stryMutAct_9fa48("4059") ? "" : (stryCov_9fa48("4059"), "en");
    if (stryMutAct_9fa48("4062") ? maxMatches !== spanishMatches : stryMutAct_9fa48("4061") ? false : stryMutAct_9fa48("4060") ? true : (stryCov_9fa48("4060", "4061", "4062"), maxMatches === spanishMatches)) return stryMutAct_9fa48("4063") ? "" : (stryCov_9fa48("4063"), "es");
    if (stryMutAct_9fa48("4066") ? maxMatches !== frenchMatches : stryMutAct_9fa48("4065") ? false : stryMutAct_9fa48("4064") ? true : (stryCov_9fa48("4064", "4065", "4066"), maxMatches === frenchMatches)) return stryMutAct_9fa48("4067") ? "" : (stryCov_9fa48("4067"), "fr");
    return stryMutAct_9fa48("4068") ? "" : (stryCov_9fa48("4068"), "unknown");
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentTypeFromFrontmatter(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("4069")) {
    {}
  } else {
    stryCov_9fa48("4069");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("4070") ? "Stryker was here!" : (stryCov_9fa48("4070"), "")).replace(stryMutAct_9fa48("4072") ? /^\// : stryMutAct_9fa48("4071") ? /\/+/ : (stryCov_9fa48("4071", "4072"), /^\/+/), stryMutAct_9fa48("4073") ? "Stryker was here!" : (stryCov_9fa48("4073"), ""));
    if (stryMutAct_9fa48("4076") ? relativePath.includes("mocs") && relativePath.includes("maps") : stryMutAct_9fa48("4075") ? false : stryMutAct_9fa48("4074") ? true : (stryCov_9fa48("4074", "4075", "4076"), relativePath.includes(stryMutAct_9fa48("4077") ? "" : (stryCov_9fa48("4077"), "mocs")) || relativePath.includes(stryMutAct_9fa48("4078") ? "" : (stryCov_9fa48("4078"), "maps")))) return stryMutAct_9fa48("4079") ? "" : (stryCov_9fa48("4079"), "moc");
    if (stryMutAct_9fa48("4082") ? relativePath.includes("articles") && relativePath.includes("posts") : stryMutAct_9fa48("4081") ? false : stryMutAct_9fa48("4080") ? true : (stryCov_9fa48("4080", "4081", "4082"), relativePath.includes(stryMutAct_9fa48("4083") ? "" : (stryCov_9fa48("4083"), "articles")) || relativePath.includes(stryMutAct_9fa48("4084") ? "" : (stryCov_9fa48("4084"), "posts")))) return stryMutAct_9fa48("4085") ? "" : (stryCov_9fa48("4085"), "article");
    if (stryMutAct_9fa48("4088") ? relativePath.includes("chats") && relativePath.includes("conversations") : stryMutAct_9fa48("4087") ? false : stryMutAct_9fa48("4086") ? true : (stryCov_9fa48("4086", "4087", "4088"), relativePath.includes(stryMutAct_9fa48("4089") ? "" : (stryCov_9fa48("4089"), "chats")) || relativePath.includes(stryMutAct_9fa48("4090") ? "" : (stryCov_9fa48("4090"), "conversations")))) return stryMutAct_9fa48("4091") ? "" : (stryCov_9fa48("4091"), "conversation");
    if (stryMutAct_9fa48("4094") ? relativePath.includes("books") && relativePath.includes("reading") : stryMutAct_9fa48("4093") ? false : stryMutAct_9fa48("4092") ? true : (stryCov_9fa48("4092", "4093", "4094"), relativePath.includes(stryMutAct_9fa48("4095") ? "" : (stryCov_9fa48("4095"), "books")) || relativePath.includes(stryMutAct_9fa48("4096") ? "" : (stryCov_9fa48("4096"), "reading")))) return stryMutAct_9fa48("4097") ? "" : (stryCov_9fa48("4097"), "book");
    if (stryMutAct_9fa48("4099") ? false : stryMutAct_9fa48("4098") ? true : (stryCov_9fa48("4098", "4099"), relativePath.includes(stryMutAct_9fa48("4100") ? "" : (stryCov_9fa48("4100"), "templates")))) return stryMutAct_9fa48("4101") ? "" : (stryCov_9fa48("4101"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("4103") ? false : stryMutAct_9fa48("4102") ? true : (stryCov_9fa48("4102", "4103"), frontmatter.type)) {
      if (stryMutAct_9fa48("4104")) {
        {}
      } else {
        stryCov_9fa48("4104");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("4105") ? "" : (stryCov_9fa48("4105"), "note");
  }
}