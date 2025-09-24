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
  if (stryMutAct_9fa48("3990")) {
    {}
  } else {
    stryCov_9fa48("3990");
    return stryMutAct_9fa48("3991") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("3991"), text.normalize(stryMutAct_9fa48("3992") ? "" : (stryCov_9fa48("3992"), "NFC")).replace(stryMutAct_9fa48("3993") ? /\r\n/g : (stryCov_9fa48("3993"), /\r\n?/g), stryMutAct_9fa48("3994") ? "" : (stryCov_9fa48("3994"), "\n")).replace(stryMutAct_9fa48("3996") ? /[^ \t]+/g : stryMutAct_9fa48("3995") ? /[ \t]/g : (stryCov_9fa48("3995", "3996"), /[ \t]+/g), stryMutAct_9fa48("3997") ? "" : (stryCov_9fa48("3997"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("3998") ? "Stryker was here!" : (stryCov_9fa48("3998"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("3999")) {
    {}
  } else {
    stryCov_9fa48("3999");
    const normalized = normalize(text);
    return createHash(stryMutAct_9fa48("4000") ? "" : (stryCov_9fa48("4000"), "sha256"), normalized);
  }
}

/**
 * Create a hash using specified algorithm and input
 */
export function createHash(algorithm: string, input: string | Buffer): string {
  if (stryMutAct_9fa48("4001")) {
    {}
  } else {
    stryCov_9fa48("4001");
    return crypto.createHash(algorithm).update(input).digest(stryMutAct_9fa48("4002") ? "" : (stryCov_9fa48("4002"), "hex"));
  }
}

/**
 * Generate a deterministic ID from multiple components
 */
export function generateDeterministicId(...components: (string | number)[]): string {
  if (stryMutAct_9fa48("4003")) {
    {}
  } else {
    stryCov_9fa48("4003");
    const combined = components.join(stryMutAct_9fa48("4004") ? "" : (stryCov_9fa48("4004"), "_"));
    return stryMutAct_9fa48("4005") ? createHash("md5", combined) : (stryCov_9fa48("4005"), createHash(stryMutAct_9fa48("4006") ? "" : (stryCov_9fa48("4006"), "md5"), combined).slice(0, 8));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("4007")) {
    {}
  } else {
    stryCov_9fa48("4007");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("4008") ? () => undefined : (stryCov_9fa48("4008"), (sum, x) => stryMutAct_9fa48("4009") ? sum - x * x : (stryCov_9fa48("4009"), sum + (stryMutAct_9fa48("4010") ? x / x : (stryCov_9fa48("4010"), x * x)))), 0));
    if (stryMutAct_9fa48("4013") ? norm !== 0 : stryMutAct_9fa48("4012") ? false : stryMutAct_9fa48("4011") ? true : (stryCov_9fa48("4011", "4012", "4013"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("4014") ? () => undefined : (stryCov_9fa48("4014"), x => stryMutAct_9fa48("4015") ? x * norm : (stryCov_9fa48("4015"), x / norm)));
  }
}

/**
 * Determine content type based on file extension
 */
export function determineContentType(filePath: string): string {
  if (stryMutAct_9fa48("4016")) {
    {}
  } else {
    stryCov_9fa48("4016");
    const extension = stryMutAct_9fa48("4018") ? filePath.split(".").pop().toLowerCase() : stryMutAct_9fa48("4017") ? filePath.split(".").pop()?.toUpperCase() : (stryCov_9fa48("4017", "4018"), filePath.split(stryMutAct_9fa48("4019") ? "" : (stryCov_9fa48("4019"), ".")).pop()?.toLowerCase());
    switch (extension) {
      case stryMutAct_9fa48("4021") ? "" : (stryCov_9fa48("4021"), "md"):
        if (stryMutAct_9fa48("4020")) {} else {
          stryCov_9fa48("4020");
          return stryMutAct_9fa48("4022") ? "" : (stryCov_9fa48("4022"), "markdown");
        }
      case stryMutAct_9fa48("4024") ? "" : (stryCov_9fa48("4024"), "txt"):
        if (stryMutAct_9fa48("4023")) {} else {
          stryCov_9fa48("4023");
          return stryMutAct_9fa48("4025") ? "" : (stryCov_9fa48("4025"), "text");
        }
      case stryMutAct_9fa48("4027") ? "" : (stryCov_9fa48("4027"), "json"):
        if (stryMutAct_9fa48("4026")) {} else {
          stryCov_9fa48("4026");
          return stryMutAct_9fa48("4028") ? "" : (stryCov_9fa48("4028"), "json");
        }
      case stryMutAct_9fa48("4030") ? "" : (stryCov_9fa48("4030"), "pdf"):
        if (stryMutAct_9fa48("4029")) {} else {
          stryCov_9fa48("4029");
          return stryMutAct_9fa48("4031") ? "" : (stryCov_9fa48("4031"), "pdf");
        }
      case stryMutAct_9fa48("4032") ? "" : (stryCov_9fa48("4032"), "jpg"):
      case stryMutAct_9fa48("4033") ? "" : (stryCov_9fa48("4033"), "jpeg"):
      case stryMutAct_9fa48("4034") ? "" : (stryCov_9fa48("4034"), "png"):
      case stryMutAct_9fa48("4036") ? "" : (stryCov_9fa48("4036"), "gif"):
        if (stryMutAct_9fa48("4035")) {} else {
          stryCov_9fa48("4035");
          return stryMutAct_9fa48("4037") ? "" : (stryCov_9fa48("4037"), "image");
        }
      default:
        if (stryMutAct_9fa48("4038")) {} else {
          stryCov_9fa48("4038");
          return stryMutAct_9fa48("4039") ? "" : (stryCov_9fa48("4039"), "unknown");
        }
    }
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("4040")) {
    {}
  } else {
    stryCov_9fa48("4040");
    if (stryMutAct_9fa48("4043") ? vecA.length === vecB.length : stryMutAct_9fa48("4042") ? false : stryMutAct_9fa48("4041") ? true : (stryCov_9fa48("4041", "4042", "4043"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("4044")) {
        {}
      } else {
        stryCov_9fa48("4044");
        throw new Error(stryMutAct_9fa48("4045") ? "" : (stryCov_9fa48("4045"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("4048") ? i >= vecA.length : stryMutAct_9fa48("4047") ? i <= vecA.length : stryMutAct_9fa48("4046") ? false : (stryCov_9fa48("4046", "4047", "4048"), i < vecA.length); stryMutAct_9fa48("4049") ? i-- : (stryCov_9fa48("4049"), i++)) {
      if (stryMutAct_9fa48("4050")) {
        {}
      } else {
        stryCov_9fa48("4050");
        stryMutAct_9fa48("4051") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("4051"), dotProduct += stryMutAct_9fa48("4052") ? vecA[i] / vecB[i] : (stryCov_9fa48("4052"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("4053") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("4053"), normA += stryMutAct_9fa48("4054") ? vecA[i] / vecA[i] : (stryCov_9fa48("4054"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("4055") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("4055"), normB += stryMutAct_9fa48("4056") ? vecB[i] / vecB[i] : (stryCov_9fa48("4056"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("4059") ? normA === 0 && normB === 0 : stryMutAct_9fa48("4058") ? false : stryMutAct_9fa48("4057") ? true : (stryCov_9fa48("4057", "4058", "4059"), (stryMutAct_9fa48("4061") ? normA !== 0 : stryMutAct_9fa48("4060") ? false : (stryCov_9fa48("4060", "4061"), normA === 0)) || (stryMutAct_9fa48("4063") ? normB !== 0 : stryMutAct_9fa48("4062") ? false : (stryCov_9fa48("4062", "4063"), normB === 0)))) return 0;
    return stryMutAct_9fa48("4064") ? dotProduct * (normA * normB) : (stryCov_9fa48("4064"), dotProduct / (stryMutAct_9fa48("4065") ? normA / normB : (stryCov_9fa48("4065"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("4066")) {
    {}
  } else {
    stryCov_9fa48("4066");
    return Math.ceil(stryMutAct_9fa48("4067") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("4067"), text.split(stryMutAct_9fa48("4069") ? /\S+/ : stryMutAct_9fa48("4068") ? /\s/ : (stryCov_9fa48("4068", "4069"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("4070")) {
    {}
  } else {
    stryCov_9fa48("4070");
    return new Promise(stryMutAct_9fa48("4071") ? () => undefined : (stryCov_9fa48("4071"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("4072")) {
    {}
  } else {
    stryCov_9fa48("4072");
    const wikilinkRegex = stryMutAct_9fa48("4074") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("4073") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("4073", "4074"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("4075") ? ["Stryker was here"] : (stryCov_9fa48("4075"), []);
    let match;
    while (stryMutAct_9fa48("4077") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("4076") ? false : (stryCov_9fa48("4076", "4077"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("4078")) {
        {}
      } else {
        stryCov_9fa48("4078");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("4079") ? [] : (stryCov_9fa48("4079"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("4080")) {
    {}
  } else {
    stryCov_9fa48("4080");
    const tagRegex = stryMutAct_9fa48("4082") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("4081") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("4081", "4082"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("4083") ? ["Stryker was here"] : (stryCov_9fa48("4083"), []);
    let match;
    while (stryMutAct_9fa48("4085") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("4084") ? false : (stryCov_9fa48("4084", "4085"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("4086")) {
        {}
      } else {
        stryCov_9fa48("4086");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("4087") ? [] : (stryCov_9fa48("4087"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Extract Obsidian-style tags from text (including nested paths)
 */
export function extractObsidianTags(text: string): string[] {
  if (stryMutAct_9fa48("4088")) {
    {}
  } else {
    stryCov_9fa48("4088");
    const tagRegex = stryMutAct_9fa48("4090") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("4089") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("4089", "4090"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("4091") ? ["Stryker was here"] : (stryCov_9fa48("4091"), []);
    let match;
    while (stryMutAct_9fa48("4093") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("4092") ? false : (stryCov_9fa48("4092", "4093"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("4094")) {
        {}
      } else {
        stryCov_9fa48("4094");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("4095") ? [] : (stryCov_9fa48("4095"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("4096")) {
    {}
  } else {
    stryCov_9fa48("4096");
    return stryMutAct_9fa48("4097") ? text
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
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("4097"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("4103") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("4102") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("4101") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("4100") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("4099") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("4098") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("4098", "4099", "4100", "4101", "4102", "4103"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("4104") ? "Stryker was here!" : (stryCov_9fa48("4104"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("4106") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("4105") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("4105", "4106"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("4107") ? "" : (stryCov_9fa48("4107"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("4111") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("4110") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("4109") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("4108") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("4108", "4109", "4110", "4111"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("4112") ? "" : (stryCov_9fa48("4112"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("4113") ? /[^*_`~]/g : (stryCov_9fa48("4113"), /[*_`~]/g), stryMutAct_9fa48("4114") ? "Stryker was here!" : (stryCov_9fa48("4114"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("4118") ? /^#+\S+/gm : stryMutAct_9fa48("4117") ? /^#+\s/gm : stryMutAct_9fa48("4116") ? /^#\s+/gm : stryMutAct_9fa48("4115") ? /#+\s+/gm : (stryCov_9fa48("4115", "4116", "4117", "4118"), /^#+\s+/gm), stryMutAct_9fa48("4119") ? "Stryker was here!" : (stryCov_9fa48("4119"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("4121") ? /\n\S*\n/g : stryMutAct_9fa48("4120") ? /\n\s\n/g : (stryCov_9fa48("4120", "4121"), /\n\s*\n/g), stryMutAct_9fa48("4122") ? "" : (stryCov_9fa48("4122"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("4123")) {
    {}
  } else {
    stryCov_9fa48("4123");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("4124") ? "Stryker was here!" : (stryCov_9fa48("4124"), "")).replace(stryMutAct_9fa48("4126") ? /^\// : stryMutAct_9fa48("4125") ? /\/+/ : (stryCov_9fa48("4125", "4126"), /^\/+/), stryMutAct_9fa48("4127") ? "Stryker was here!" : (stryCov_9fa48("4127"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("4128") ? "" : (stryCov_9fa48("4128"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("4132") ? pathParts.length <= 0 : stryMutAct_9fa48("4131") ? pathParts.length >= 0 : stryMutAct_9fa48("4130") ? false : stryMutAct_9fa48("4129") ? true : (stryCov_9fa48("4129", "4130", "4131", "4132"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("4133") ? [] : (stryCov_9fa48("4133"), [stryMutAct_9fa48("4134") ? "" : (stryCov_9fa48("4134"), "Root")]);
  }
}

/**
 * Detect language from text using simple heuristics
 */
export function detectLanguage(text: string): string {
  if (stryMutAct_9fa48("4135")) {
    {}
  } else {
    stryCov_9fa48("4135");
    if (stryMutAct_9fa48("4138") ? !text && text.length === 0 : stryMutAct_9fa48("4137") ? false : stryMutAct_9fa48("4136") ? true : (stryCov_9fa48("4136", "4137", "4138"), (stryMutAct_9fa48("4139") ? text : (stryCov_9fa48("4139"), !text)) || (stryMutAct_9fa48("4141") ? text.length !== 0 : stryMutAct_9fa48("4140") ? false : (stryCov_9fa48("4140", "4141"), text.length === 0)))) return stryMutAct_9fa48("4142") ? "" : (stryCov_9fa48("4142"), "unknown");
    const englishWords = /\b(the|and|or|but|in|on|at|to|for|of|with|by)\b/gi;
    const spanishWords = /\b(el|la|los|las|y|o|pero|en|sobre|a|para|de|con|por)\b/gi;
    const frenchWords = /\b(le|la|les|et|ou|mais|dans|sur|à|pour|de|avec|par)\b/gi;
    const englishMatches = (stryMutAct_9fa48("4145") ? text.match(englishWords) && [] : stryMutAct_9fa48("4144") ? false : stryMutAct_9fa48("4143") ? true : (stryCov_9fa48("4143", "4144", "4145"), text.match(englishWords) || (stryMutAct_9fa48("4146") ? ["Stryker was here"] : (stryCov_9fa48("4146"), [])))).length;
    const spanishMatches = (stryMutAct_9fa48("4149") ? text.match(spanishWords) && [] : stryMutAct_9fa48("4148") ? false : stryMutAct_9fa48("4147") ? true : (stryCov_9fa48("4147", "4148", "4149"), text.match(spanishWords) || (stryMutAct_9fa48("4150") ? ["Stryker was here"] : (stryCov_9fa48("4150"), [])))).length;
    const frenchMatches = (stryMutAct_9fa48("4153") ? text.match(frenchWords) && [] : stryMutAct_9fa48("4152") ? false : stryMutAct_9fa48("4151") ? true : (stryCov_9fa48("4151", "4152", "4153"), text.match(frenchWords) || (stryMutAct_9fa48("4154") ? ["Stryker was here"] : (stryCov_9fa48("4154"), [])))).length;
    const maxMatches = stryMutAct_9fa48("4155") ? Math.min(englishMatches, spanishMatches, frenchMatches) : (stryCov_9fa48("4155"), Math.max(englishMatches, spanishMatches, frenchMatches));
    if (stryMutAct_9fa48("4158") ? maxMatches !== 0 : stryMutAct_9fa48("4157") ? false : stryMutAct_9fa48("4156") ? true : (stryCov_9fa48("4156", "4157", "4158"), maxMatches === 0)) return stryMutAct_9fa48("4159") ? "" : (stryCov_9fa48("4159"), "unknown");
    if (stryMutAct_9fa48("4162") ? maxMatches !== englishMatches : stryMutAct_9fa48("4161") ? false : stryMutAct_9fa48("4160") ? true : (stryCov_9fa48("4160", "4161", "4162"), maxMatches === englishMatches)) return stryMutAct_9fa48("4163") ? "" : (stryCov_9fa48("4163"), "en");
    if (stryMutAct_9fa48("4166") ? maxMatches !== spanishMatches : stryMutAct_9fa48("4165") ? false : stryMutAct_9fa48("4164") ? true : (stryCov_9fa48("4164", "4165", "4166"), maxMatches === spanishMatches)) return stryMutAct_9fa48("4167") ? "" : (stryCov_9fa48("4167"), "es");
    if (stryMutAct_9fa48("4170") ? maxMatches !== frenchMatches : stryMutAct_9fa48("4169") ? false : stryMutAct_9fa48("4168") ? true : (stryCov_9fa48("4168", "4169", "4170"), maxMatches === frenchMatches)) return stryMutAct_9fa48("4171") ? "" : (stryCov_9fa48("4171"), "fr");
    return stryMutAct_9fa48("4172") ? "" : (stryCov_9fa48("4172"), "unknown");
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentTypeFromFrontmatter(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("4173")) {
    {}
  } else {
    stryCov_9fa48("4173");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("4174") ? "Stryker was here!" : (stryCov_9fa48("4174"), "")).replace(stryMutAct_9fa48("4176") ? /^\// : stryMutAct_9fa48("4175") ? /\/+/ : (stryCov_9fa48("4175", "4176"), /^\/+/), stryMutAct_9fa48("4177") ? "Stryker was here!" : (stryCov_9fa48("4177"), ""));
    if (stryMutAct_9fa48("4180") ? relativePath.includes("mocs") && relativePath.includes("maps") : stryMutAct_9fa48("4179") ? false : stryMutAct_9fa48("4178") ? true : (stryCov_9fa48("4178", "4179", "4180"), relativePath.includes(stryMutAct_9fa48("4181") ? "" : (stryCov_9fa48("4181"), "mocs")) || relativePath.includes(stryMutAct_9fa48("4182") ? "" : (stryCov_9fa48("4182"), "maps")))) return stryMutAct_9fa48("4183") ? "" : (stryCov_9fa48("4183"), "moc");
    if (stryMutAct_9fa48("4186") ? relativePath.includes("articles") && relativePath.includes("posts") : stryMutAct_9fa48("4185") ? false : stryMutAct_9fa48("4184") ? true : (stryCov_9fa48("4184", "4185", "4186"), relativePath.includes(stryMutAct_9fa48("4187") ? "" : (stryCov_9fa48("4187"), "articles")) || relativePath.includes(stryMutAct_9fa48("4188") ? "" : (stryCov_9fa48("4188"), "posts")))) return stryMutAct_9fa48("4189") ? "" : (stryCov_9fa48("4189"), "article");
    if (stryMutAct_9fa48("4192") ? relativePath.includes("chats") && relativePath.includes("conversations") : stryMutAct_9fa48("4191") ? false : stryMutAct_9fa48("4190") ? true : (stryCov_9fa48("4190", "4191", "4192"), relativePath.includes(stryMutAct_9fa48("4193") ? "" : (stryCov_9fa48("4193"), "chats")) || relativePath.includes(stryMutAct_9fa48("4194") ? "" : (stryCov_9fa48("4194"), "conversations")))) return stryMutAct_9fa48("4195") ? "" : (stryCov_9fa48("4195"), "conversation");
    if (stryMutAct_9fa48("4198") ? relativePath.includes("books") && relativePath.includes("reading") : stryMutAct_9fa48("4197") ? false : stryMutAct_9fa48("4196") ? true : (stryCov_9fa48("4196", "4197", "4198"), relativePath.includes(stryMutAct_9fa48("4199") ? "" : (stryCov_9fa48("4199"), "books")) || relativePath.includes(stryMutAct_9fa48("4200") ? "" : (stryCov_9fa48("4200"), "reading")))) return stryMutAct_9fa48("4201") ? "" : (stryCov_9fa48("4201"), "book");
    if (stryMutAct_9fa48("4203") ? false : stryMutAct_9fa48("4202") ? true : (stryCov_9fa48("4202", "4203"), relativePath.includes(stryMutAct_9fa48("4204") ? "" : (stryCov_9fa48("4204"), "templates")))) return stryMutAct_9fa48("4205") ? "" : (stryCov_9fa48("4205"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("4207") ? false : stryMutAct_9fa48("4206") ? true : (stryCov_9fa48("4206", "4207"), frontmatter.type)) {
      if (stryMutAct_9fa48("4208")) {
        {}
      } else {
        stryCov_9fa48("4208");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("4209") ? "" : (stryCov_9fa48("4209"), "note");
  }
}