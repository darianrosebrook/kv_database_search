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
  if (stryMutAct_9fa48("2121")) {
    {}
  } else {
    stryCov_9fa48("2121");
    return stryMutAct_9fa48("2122") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("2122"), text.normalize(stryMutAct_9fa48("2123") ? "" : (stryCov_9fa48("2123"), "NFC")).replace(stryMutAct_9fa48("2124") ? /\r\n/g : (stryCov_9fa48("2124"), /\r\n?/g), stryMutAct_9fa48("2125") ? "" : (stryCov_9fa48("2125"), "\n")).replace(stryMutAct_9fa48("2127") ? /[^ \t]+/g : stryMutAct_9fa48("2126") ? /[ \t]/g : (stryCov_9fa48("2126", "2127"), /[ \t]+/g), stryMutAct_9fa48("2128") ? "" : (stryCov_9fa48("2128"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("2129") ? "Stryker was here!" : (stryCov_9fa48("2129"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("2130")) {
    {}
  } else {
    stryCov_9fa48("2130");
    const normalized = normalize(text);
    return crypto.createHash(stryMutAct_9fa48("2131") ? "" : (stryCov_9fa48("2131"), "sha256")).update(normalized).digest(stryMutAct_9fa48("2132") ? "" : (stryCov_9fa48("2132"), "hex"));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("2133")) {
    {}
  } else {
    stryCov_9fa48("2133");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("2134") ? () => undefined : (stryCov_9fa48("2134"), (sum, x) => stryMutAct_9fa48("2135") ? sum - x * x : (stryCov_9fa48("2135"), sum + (stryMutAct_9fa48("2136") ? x / x : (stryCov_9fa48("2136"), x * x)))), 0));
    if (stryMutAct_9fa48("2139") ? norm !== 0 : stryMutAct_9fa48("2138") ? false : stryMutAct_9fa48("2137") ? true : (stryCov_9fa48("2137", "2138", "2139"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("2140") ? () => undefined : (stryCov_9fa48("2140"), x => stryMutAct_9fa48("2141") ? x * norm : (stryCov_9fa48("2141"), x / norm)));
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("2142")) {
    {}
  } else {
    stryCov_9fa48("2142");
    if (stryMutAct_9fa48("2145") ? vecA.length === vecB.length : stryMutAct_9fa48("2144") ? false : stryMutAct_9fa48("2143") ? true : (stryCov_9fa48("2143", "2144", "2145"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("2146")) {
        {}
      } else {
        stryCov_9fa48("2146");
        throw new Error(stryMutAct_9fa48("2147") ? "" : (stryCov_9fa48("2147"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("2150") ? i >= vecA.length : stryMutAct_9fa48("2149") ? i <= vecA.length : stryMutAct_9fa48("2148") ? false : (stryCov_9fa48("2148", "2149", "2150"), i < vecA.length); stryMutAct_9fa48("2151") ? i-- : (stryCov_9fa48("2151"), i++)) {
      if (stryMutAct_9fa48("2152")) {
        {}
      } else {
        stryCov_9fa48("2152");
        stryMutAct_9fa48("2153") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("2153"), dotProduct += stryMutAct_9fa48("2154") ? vecA[i] / vecB[i] : (stryCov_9fa48("2154"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("2155") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("2155"), normA += stryMutAct_9fa48("2156") ? vecA[i] / vecA[i] : (stryCov_9fa48("2156"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("2157") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("2157"), normB += stryMutAct_9fa48("2158") ? vecB[i] / vecB[i] : (stryCov_9fa48("2158"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("2161") ? normA === 0 && normB === 0 : stryMutAct_9fa48("2160") ? false : stryMutAct_9fa48("2159") ? true : (stryCov_9fa48("2159", "2160", "2161"), (stryMutAct_9fa48("2163") ? normA !== 0 : stryMutAct_9fa48("2162") ? false : (stryCov_9fa48("2162", "2163"), normA === 0)) || (stryMutAct_9fa48("2165") ? normB !== 0 : stryMutAct_9fa48("2164") ? false : (stryCov_9fa48("2164", "2165"), normB === 0)))) return 0;
    return stryMutAct_9fa48("2166") ? dotProduct * (normA * normB) : (stryCov_9fa48("2166"), dotProduct / (stryMutAct_9fa48("2167") ? normA / normB : (stryCov_9fa48("2167"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("2168")) {
    {}
  } else {
    stryCov_9fa48("2168");
    return Math.ceil(stryMutAct_9fa48("2169") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("2169"), text.split(stryMutAct_9fa48("2171") ? /\S+/ : stryMutAct_9fa48("2170") ? /\s/ : (stryCov_9fa48("2170", "2171"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("2172")) {
    {}
  } else {
    stryCov_9fa48("2172");
    return new Promise(stryMutAct_9fa48("2173") ? () => undefined : (stryCov_9fa48("2173"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("2174")) {
    {}
  } else {
    stryCov_9fa48("2174");
    const wikilinkRegex = stryMutAct_9fa48("2176") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("2175") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("2175", "2176"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("2177") ? ["Stryker was here"] : (stryCov_9fa48("2177"), []);
    let match;
    while (stryMutAct_9fa48("2179") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("2178") ? false : (stryCov_9fa48("2178", "2179"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("2180")) {
        {}
      } else {
        stryCov_9fa48("2180");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("2181") ? [] : (stryCov_9fa48("2181"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("2182")) {
    {}
  } else {
    stryCov_9fa48("2182");
    const tagRegex = stryMutAct_9fa48("2184") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("2183") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("2183", "2184"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("2185") ? ["Stryker was here"] : (stryCov_9fa48("2185"), []);
    let match;
    while (stryMutAct_9fa48("2187") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("2186") ? false : (stryCov_9fa48("2186", "2187"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("2188")) {
        {}
      } else {
        stryCov_9fa48("2188");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("2189") ? [] : (stryCov_9fa48("2189"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("2190")) {
    {}
  } else {
    stryCov_9fa48("2190");
    return stryMutAct_9fa48("2191") ? text
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
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("2191"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("2197") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("2196") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("2195") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("2194") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("2193") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("2192") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("2192", "2193", "2194", "2195", "2196", "2197"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("2198") ? "Stryker was here!" : (stryCov_9fa48("2198"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("2200") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("2199") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("2199", "2200"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("2201") ? "" : (stryCov_9fa48("2201"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("2205") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("2204") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("2203") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("2202") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("2202", "2203", "2204", "2205"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("2206") ? "" : (stryCov_9fa48("2206"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("2207") ? /[^*_`~]/g : (stryCov_9fa48("2207"), /[*_`~]/g), stryMutAct_9fa48("2208") ? "Stryker was here!" : (stryCov_9fa48("2208"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("2212") ? /^#+\S+/gm : stryMutAct_9fa48("2211") ? /^#+\s/gm : stryMutAct_9fa48("2210") ? /^#\s+/gm : stryMutAct_9fa48("2209") ? /#+\s+/gm : (stryCov_9fa48("2209", "2210", "2211", "2212"), /^#+\s+/gm), stryMutAct_9fa48("2213") ? "Stryker was here!" : (stryCov_9fa48("2213"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("2215") ? /\n\S*\n/g : stryMutAct_9fa48("2214") ? /\n\s\n/g : (stryCov_9fa48("2214", "2215"), /\n\s*\n/g), stryMutAct_9fa48("2216") ? "" : (stryCov_9fa48("2216"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("2217")) {
    {}
  } else {
    stryCov_9fa48("2217");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("2218") ? "Stryker was here!" : (stryCov_9fa48("2218"), "")).replace(stryMutAct_9fa48("2220") ? /^\// : stryMutAct_9fa48("2219") ? /\/+/ : (stryCov_9fa48("2219", "2220"), /^\/+/), stryMutAct_9fa48("2221") ? "Stryker was here!" : (stryCov_9fa48("2221"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("2222") ? "" : (stryCov_9fa48("2222"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("2226") ? pathParts.length <= 0 : stryMutAct_9fa48("2225") ? pathParts.length >= 0 : stryMutAct_9fa48("2224") ? false : stryMutAct_9fa48("2223") ? true : (stryCov_9fa48("2223", "2224", "2225", "2226"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("2227") ? [] : (stryCov_9fa48("2227"), [stryMutAct_9fa48("2228") ? "" : (stryCov_9fa48("2228"), "Root")]);
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("2229")) {
    {}
  } else {
    stryCov_9fa48("2229");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("2230") ? "Stryker was here!" : (stryCov_9fa48("2230"), "")).replace(stryMutAct_9fa48("2232") ? /^\// : stryMutAct_9fa48("2231") ? /\/+/ : (stryCov_9fa48("2231", "2232"), /^\/+/), stryMutAct_9fa48("2233") ? "Stryker was here!" : (stryCov_9fa48("2233"), ""));
    if (stryMutAct_9fa48("2236") ? relativePath.endsWith("MOCs/") : stryMutAct_9fa48("2235") ? false : stryMutAct_9fa48("2234") ? true : (stryCov_9fa48("2234", "2235", "2236"), relativePath.startsWith(stryMutAct_9fa48("2237") ? "" : (stryCov_9fa48("2237"), "MOCs/")))) return stryMutAct_9fa48("2238") ? "" : (stryCov_9fa48("2238"), "moc");
    if (stryMutAct_9fa48("2241") ? relativePath.endsWith("Articles/") : stryMutAct_9fa48("2240") ? false : stryMutAct_9fa48("2239") ? true : (stryCov_9fa48("2239", "2240", "2241"), relativePath.startsWith(stryMutAct_9fa48("2242") ? "" : (stryCov_9fa48("2242"), "Articles/")))) return stryMutAct_9fa48("2243") ? "" : (stryCov_9fa48("2243"), "article");
    if (stryMutAct_9fa48("2246") ? relativePath.endsWith("AIChats/") : stryMutAct_9fa48("2245") ? false : stryMutAct_9fa48("2244") ? true : (stryCov_9fa48("2244", "2245", "2246"), relativePath.startsWith(stryMutAct_9fa48("2247") ? "" : (stryCov_9fa48("2247"), "AIChats/")))) return stryMutAct_9fa48("2248") ? "" : (stryCov_9fa48("2248"), "conversation");
    if (stryMutAct_9fa48("2251") ? relativePath.endsWith("Books/") : stryMutAct_9fa48("2250") ? false : stryMutAct_9fa48("2249") ? true : (stryCov_9fa48("2249", "2250", "2251"), relativePath.startsWith(stryMutAct_9fa48("2252") ? "" : (stryCov_9fa48("2252"), "Books/")))) return stryMutAct_9fa48("2253") ? "" : (stryCov_9fa48("2253"), "book-note");
    if (stryMutAct_9fa48("2256") ? relativePath.endsWith("templates/") : stryMutAct_9fa48("2255") ? false : stryMutAct_9fa48("2254") ? true : (stryCov_9fa48("2254", "2255", "2256"), relativePath.startsWith(stryMutAct_9fa48("2257") ? "" : (stryCov_9fa48("2257"), "templates/")))) return stryMutAct_9fa48("2258") ? "" : (stryCov_9fa48("2258"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("2260") ? false : stryMutAct_9fa48("2259") ? true : (stryCov_9fa48("2259", "2260"), frontmatter.type)) {
      if (stryMutAct_9fa48("2261")) {
        {}
      } else {
        stryCov_9fa48("2261");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("2262") ? "" : (stryCov_9fa48("2262"), "note");
  }
}