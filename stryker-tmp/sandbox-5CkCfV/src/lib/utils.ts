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
  if (stryMutAct_9fa48("2117")) {
    {}
  } else {
    stryCov_9fa48("2117");
    return stryMutAct_9fa48("2118") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("2118"), text.normalize(stryMutAct_9fa48("2119") ? "" : (stryCov_9fa48("2119"), "NFC")).replace(stryMutAct_9fa48("2120") ? /\r\n/g : (stryCov_9fa48("2120"), /\r\n?/g), stryMutAct_9fa48("2121") ? "" : (stryCov_9fa48("2121"), "\n")).replace(stryMutAct_9fa48("2123") ? /[^ \t]+/g : stryMutAct_9fa48("2122") ? /[ \t]/g : (stryCov_9fa48("2122", "2123"), /[ \t]+/g), stryMutAct_9fa48("2124") ? "" : (stryCov_9fa48("2124"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("2125") ? "Stryker was here!" : (stryCov_9fa48("2125"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("2126")) {
    {}
  } else {
    stryCov_9fa48("2126");
    const normalized = normalize(text);
    return crypto.createHash(stryMutAct_9fa48("2127") ? "" : (stryCov_9fa48("2127"), "sha256")).update(normalized).digest(stryMutAct_9fa48("2128") ? "" : (stryCov_9fa48("2128"), "hex"));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("2129")) {
    {}
  } else {
    stryCov_9fa48("2129");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("2130") ? () => undefined : (stryCov_9fa48("2130"), (sum, x) => stryMutAct_9fa48("2131") ? sum - x * x : (stryCov_9fa48("2131"), sum + (stryMutAct_9fa48("2132") ? x / x : (stryCov_9fa48("2132"), x * x)))), 0));
    if (stryMutAct_9fa48("2135") ? norm !== 0 : stryMutAct_9fa48("2134") ? false : stryMutAct_9fa48("2133") ? true : (stryCov_9fa48("2133", "2134", "2135"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("2136") ? () => undefined : (stryCov_9fa48("2136"), x => stryMutAct_9fa48("2137") ? x * norm : (stryCov_9fa48("2137"), x / norm)));
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("2138")) {
    {}
  } else {
    stryCov_9fa48("2138");
    if (stryMutAct_9fa48("2141") ? vecA.length === vecB.length : stryMutAct_9fa48("2140") ? false : stryMutAct_9fa48("2139") ? true : (stryCov_9fa48("2139", "2140", "2141"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("2142")) {
        {}
      } else {
        stryCov_9fa48("2142");
        throw new Error(stryMutAct_9fa48("2143") ? "" : (stryCov_9fa48("2143"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("2146") ? i >= vecA.length : stryMutAct_9fa48("2145") ? i <= vecA.length : stryMutAct_9fa48("2144") ? false : (stryCov_9fa48("2144", "2145", "2146"), i < vecA.length); stryMutAct_9fa48("2147") ? i-- : (stryCov_9fa48("2147"), i++)) {
      if (stryMutAct_9fa48("2148")) {
        {}
      } else {
        stryCov_9fa48("2148");
        stryMutAct_9fa48("2149") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("2149"), dotProduct += stryMutAct_9fa48("2150") ? vecA[i] / vecB[i] : (stryCov_9fa48("2150"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("2151") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("2151"), normA += stryMutAct_9fa48("2152") ? vecA[i] / vecA[i] : (stryCov_9fa48("2152"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("2153") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("2153"), normB += stryMutAct_9fa48("2154") ? vecB[i] / vecB[i] : (stryCov_9fa48("2154"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("2157") ? normA === 0 && normB === 0 : stryMutAct_9fa48("2156") ? false : stryMutAct_9fa48("2155") ? true : (stryCov_9fa48("2155", "2156", "2157"), (stryMutAct_9fa48("2159") ? normA !== 0 : stryMutAct_9fa48("2158") ? false : (stryCov_9fa48("2158", "2159"), normA === 0)) || (stryMutAct_9fa48("2161") ? normB !== 0 : stryMutAct_9fa48("2160") ? false : (stryCov_9fa48("2160", "2161"), normB === 0)))) return 0;
    return stryMutAct_9fa48("2162") ? dotProduct * (normA * normB) : (stryCov_9fa48("2162"), dotProduct / (stryMutAct_9fa48("2163") ? normA / normB : (stryCov_9fa48("2163"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("2164")) {
    {}
  } else {
    stryCov_9fa48("2164");
    return Math.ceil(stryMutAct_9fa48("2165") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("2165"), text.split(stryMutAct_9fa48("2167") ? /\S+/ : stryMutAct_9fa48("2166") ? /\s/ : (stryCov_9fa48("2166", "2167"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("2168")) {
    {}
  } else {
    stryCov_9fa48("2168");
    return new Promise(stryMutAct_9fa48("2169") ? () => undefined : (stryCov_9fa48("2169"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("2170")) {
    {}
  } else {
    stryCov_9fa48("2170");
    const wikilinkRegex = stryMutAct_9fa48("2172") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("2171") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("2171", "2172"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("2173") ? ["Stryker was here"] : (stryCov_9fa48("2173"), []);
    let match;
    while (stryMutAct_9fa48("2175") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("2174") ? false : (stryCov_9fa48("2174", "2175"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("2176")) {
        {}
      } else {
        stryCov_9fa48("2176");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("2177") ? [] : (stryCov_9fa48("2177"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("2178")) {
    {}
  } else {
    stryCov_9fa48("2178");
    const tagRegex = stryMutAct_9fa48("2180") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("2179") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("2179", "2180"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("2181") ? ["Stryker was here"] : (stryCov_9fa48("2181"), []);
    let match;
    while (stryMutAct_9fa48("2183") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("2182") ? false : (stryCov_9fa48("2182", "2183"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("2184")) {
        {}
      } else {
        stryCov_9fa48("2184");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("2185") ? [] : (stryCov_9fa48("2185"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("2186")) {
    {}
  } else {
    stryCov_9fa48("2186");
    return stryMutAct_9fa48("2187") ? text
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
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("2187"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("2193") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("2192") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("2191") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("2190") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("2189") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("2188") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("2188", "2189", "2190", "2191", "2192", "2193"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("2194") ? "Stryker was here!" : (stryCov_9fa48("2194"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("2196") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("2195") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("2195", "2196"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("2197") ? "" : (stryCov_9fa48("2197"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("2201") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("2200") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("2199") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("2198") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("2198", "2199", "2200", "2201"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("2202") ? "" : (stryCov_9fa48("2202"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("2203") ? /[^*_`~]/g : (stryCov_9fa48("2203"), /[*_`~]/g), stryMutAct_9fa48("2204") ? "Stryker was here!" : (stryCov_9fa48("2204"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("2208") ? /^#+\S+/gm : stryMutAct_9fa48("2207") ? /^#+\s/gm : stryMutAct_9fa48("2206") ? /^#\s+/gm : stryMutAct_9fa48("2205") ? /#+\s+/gm : (stryCov_9fa48("2205", "2206", "2207", "2208"), /^#+\s+/gm), stryMutAct_9fa48("2209") ? "Stryker was here!" : (stryCov_9fa48("2209"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("2211") ? /\n\S*\n/g : stryMutAct_9fa48("2210") ? /\n\s\n/g : (stryCov_9fa48("2210", "2211"), /\n\s*\n/g), stryMutAct_9fa48("2212") ? "" : (stryCov_9fa48("2212"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("2213")) {
    {}
  } else {
    stryCov_9fa48("2213");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("2214") ? "Stryker was here!" : (stryCov_9fa48("2214"), "")).replace(stryMutAct_9fa48("2216") ? /^\// : stryMutAct_9fa48("2215") ? /\/+/ : (stryCov_9fa48("2215", "2216"), /^\/+/), stryMutAct_9fa48("2217") ? "Stryker was here!" : (stryCov_9fa48("2217"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("2218") ? "" : (stryCov_9fa48("2218"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("2222") ? pathParts.length <= 0 : stryMutAct_9fa48("2221") ? pathParts.length >= 0 : stryMutAct_9fa48("2220") ? false : stryMutAct_9fa48("2219") ? true : (stryCov_9fa48("2219", "2220", "2221", "2222"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("2223") ? [] : (stryCov_9fa48("2223"), [stryMutAct_9fa48("2224") ? "" : (stryCov_9fa48("2224"), "Root")]);
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("2225")) {
    {}
  } else {
    stryCov_9fa48("2225");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("2226") ? "Stryker was here!" : (stryCov_9fa48("2226"), "")).replace(stryMutAct_9fa48("2228") ? /^\// : stryMutAct_9fa48("2227") ? /\/+/ : (stryCov_9fa48("2227", "2228"), /^\/+/), stryMutAct_9fa48("2229") ? "Stryker was here!" : (stryCov_9fa48("2229"), ""));
    if (stryMutAct_9fa48("2232") ? relativePath.endsWith("MOCs/") : stryMutAct_9fa48("2231") ? false : stryMutAct_9fa48("2230") ? true : (stryCov_9fa48("2230", "2231", "2232"), relativePath.startsWith(stryMutAct_9fa48("2233") ? "" : (stryCov_9fa48("2233"), "MOCs/")))) return stryMutAct_9fa48("2234") ? "" : (stryCov_9fa48("2234"), "moc");
    if (stryMutAct_9fa48("2237") ? relativePath.endsWith("Articles/") : stryMutAct_9fa48("2236") ? false : stryMutAct_9fa48("2235") ? true : (stryCov_9fa48("2235", "2236", "2237"), relativePath.startsWith(stryMutAct_9fa48("2238") ? "" : (stryCov_9fa48("2238"), "Articles/")))) return stryMutAct_9fa48("2239") ? "" : (stryCov_9fa48("2239"), "article");
    if (stryMutAct_9fa48("2242") ? relativePath.endsWith("AIChats/") : stryMutAct_9fa48("2241") ? false : stryMutAct_9fa48("2240") ? true : (stryCov_9fa48("2240", "2241", "2242"), relativePath.startsWith(stryMutAct_9fa48("2243") ? "" : (stryCov_9fa48("2243"), "AIChats/")))) return stryMutAct_9fa48("2244") ? "" : (stryCov_9fa48("2244"), "conversation");
    if (stryMutAct_9fa48("2247") ? relativePath.endsWith("Books/") : stryMutAct_9fa48("2246") ? false : stryMutAct_9fa48("2245") ? true : (stryCov_9fa48("2245", "2246", "2247"), relativePath.startsWith(stryMutAct_9fa48("2248") ? "" : (stryCov_9fa48("2248"), "Books/")))) return stryMutAct_9fa48("2249") ? "" : (stryCov_9fa48("2249"), "book-note");
    if (stryMutAct_9fa48("2252") ? relativePath.endsWith("templates/") : stryMutAct_9fa48("2251") ? false : stryMutAct_9fa48("2250") ? true : (stryCov_9fa48("2250", "2251", "2252"), relativePath.startsWith(stryMutAct_9fa48("2253") ? "" : (stryCov_9fa48("2253"), "templates/")))) return stryMutAct_9fa48("2254") ? "" : (stryCov_9fa48("2254"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("2256") ? false : stryMutAct_9fa48("2255") ? true : (stryCov_9fa48("2255", "2256"), frontmatter.type)) {
      if (stryMutAct_9fa48("2257")) {
        {}
      } else {
        stryCov_9fa48("2257");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("2258") ? "" : (stryCov_9fa48("2258"), "note");
  }
}