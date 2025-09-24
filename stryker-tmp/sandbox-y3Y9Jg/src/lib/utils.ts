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
  if (stryMutAct_9fa48("1023")) {
    {}
  } else {
    stryCov_9fa48("1023");
    return stryMutAct_9fa48("1024") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("1024"), text.normalize(stryMutAct_9fa48("1025") ? "" : (stryCov_9fa48("1025"), "NFC")).replace(stryMutAct_9fa48("1026") ? /\r\n/g : (stryCov_9fa48("1026"), /\r\n?/g), stryMutAct_9fa48("1027") ? "" : (stryCov_9fa48("1027"), "\n")).replace(stryMutAct_9fa48("1029") ? /[^ \t]+/g : stryMutAct_9fa48("1028") ? /[ \t]/g : (stryCov_9fa48("1028", "1029"), /[ \t]+/g), stryMutAct_9fa48("1030") ? "" : (stryCov_9fa48("1030"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("1031") ? "Stryker was here!" : (stryCov_9fa48("1031"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("1032")) {
    {}
  } else {
    stryCov_9fa48("1032");
    const normalized = normalize(text);
    return crypto.createHash(stryMutAct_9fa48("1033") ? "" : (stryCov_9fa48("1033"), "sha256")).update(normalized).digest(stryMutAct_9fa48("1034") ? "" : (stryCov_9fa48("1034"), "hex"));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("1035")) {
    {}
  } else {
    stryCov_9fa48("1035");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("1036") ? () => undefined : (stryCov_9fa48("1036"), (sum, x) => stryMutAct_9fa48("1037") ? sum - x * x : (stryCov_9fa48("1037"), sum + (stryMutAct_9fa48("1038") ? x / x : (stryCov_9fa48("1038"), x * x)))), 0));
    if (stryMutAct_9fa48("1041") ? norm !== 0 : stryMutAct_9fa48("1040") ? false : stryMutAct_9fa48("1039") ? true : (stryCov_9fa48("1039", "1040", "1041"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("1042") ? () => undefined : (stryCov_9fa48("1042"), x => stryMutAct_9fa48("1043") ? x * norm : (stryCov_9fa48("1043"), x / norm)));
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("1044")) {
    {}
  } else {
    stryCov_9fa48("1044");
    if (stryMutAct_9fa48("1047") ? vecA.length === vecB.length : stryMutAct_9fa48("1046") ? false : stryMutAct_9fa48("1045") ? true : (stryCov_9fa48("1045", "1046", "1047"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("1048")) {
        {}
      } else {
        stryCov_9fa48("1048");
        throw new Error(stryMutAct_9fa48("1049") ? "" : (stryCov_9fa48("1049"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("1052") ? i >= vecA.length : stryMutAct_9fa48("1051") ? i <= vecA.length : stryMutAct_9fa48("1050") ? false : (stryCov_9fa48("1050", "1051", "1052"), i < vecA.length); stryMutAct_9fa48("1053") ? i-- : (stryCov_9fa48("1053"), i++)) {
      if (stryMutAct_9fa48("1054")) {
        {}
      } else {
        stryCov_9fa48("1054");
        stryMutAct_9fa48("1055") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("1055"), dotProduct += stryMutAct_9fa48("1056") ? vecA[i] / vecB[i] : (stryCov_9fa48("1056"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("1057") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("1057"), normA += stryMutAct_9fa48("1058") ? vecA[i] / vecA[i] : (stryCov_9fa48("1058"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("1059") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("1059"), normB += stryMutAct_9fa48("1060") ? vecB[i] / vecB[i] : (stryCov_9fa48("1060"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("1063") ? normA === 0 && normB === 0 : stryMutAct_9fa48("1062") ? false : stryMutAct_9fa48("1061") ? true : (stryCov_9fa48("1061", "1062", "1063"), (stryMutAct_9fa48("1065") ? normA !== 0 : stryMutAct_9fa48("1064") ? false : (stryCov_9fa48("1064", "1065"), normA === 0)) || (stryMutAct_9fa48("1067") ? normB !== 0 : stryMutAct_9fa48("1066") ? false : (stryCov_9fa48("1066", "1067"), normB === 0)))) return 0;
    return stryMutAct_9fa48("1068") ? dotProduct * (normA * normB) : (stryCov_9fa48("1068"), dotProduct / (stryMutAct_9fa48("1069") ? normA / normB : (stryCov_9fa48("1069"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("1070")) {
    {}
  } else {
    stryCov_9fa48("1070");
    return Math.ceil(stryMutAct_9fa48("1071") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("1071"), text.split(stryMutAct_9fa48("1073") ? /\S+/ : stryMutAct_9fa48("1072") ? /\s/ : (stryCov_9fa48("1072", "1073"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("1074")) {
    {}
  } else {
    stryCov_9fa48("1074");
    return new Promise(stryMutAct_9fa48("1075") ? () => undefined : (stryCov_9fa48("1075"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("1076")) {
    {}
  } else {
    stryCov_9fa48("1076");
    const wikilinkRegex = stryMutAct_9fa48("1078") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("1077") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("1077", "1078"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("1079") ? ["Stryker was here"] : (stryCov_9fa48("1079"), []);
    let match;
    while (stryMutAct_9fa48("1081") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("1080") ? false : (stryCov_9fa48("1080", "1081"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("1082")) {
        {}
      } else {
        stryCov_9fa48("1082");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("1083") ? [] : (stryCov_9fa48("1083"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("1084")) {
    {}
  } else {
    stryCov_9fa48("1084");
    const tagRegex = stryMutAct_9fa48("1086") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("1085") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("1085", "1086"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("1087") ? ["Stryker was here"] : (stryCov_9fa48("1087"), []);
    let match;
    while (stryMutAct_9fa48("1089") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("1088") ? false : (stryCov_9fa48("1088", "1089"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("1090")) {
        {}
      } else {
        stryCov_9fa48("1090");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("1091") ? [] : (stryCov_9fa48("1091"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("1092")) {
    {}
  } else {
    stryCov_9fa48("1092");
    return stryMutAct_9fa48("1093") ? text
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
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("1093"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("1099") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("1098") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("1097") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("1096") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("1095") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("1094") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("1094", "1095", "1096", "1097", "1098", "1099"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("1100") ? "Stryker was here!" : (stryCov_9fa48("1100"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("1102") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("1101") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("1101", "1102"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("1103") ? "" : (stryCov_9fa48("1103"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("1107") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("1106") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("1105") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("1104") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("1104", "1105", "1106", "1107"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("1108") ? "" : (stryCov_9fa48("1108"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("1109") ? /[^*_`~]/g : (stryCov_9fa48("1109"), /[*_`~]/g), stryMutAct_9fa48("1110") ? "Stryker was here!" : (stryCov_9fa48("1110"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("1114") ? /^#+\S+/gm : stryMutAct_9fa48("1113") ? /^#+\s/gm : stryMutAct_9fa48("1112") ? /^#\s+/gm : stryMutAct_9fa48("1111") ? /#+\s+/gm : (stryCov_9fa48("1111", "1112", "1113", "1114"), /^#+\s+/gm), stryMutAct_9fa48("1115") ? "Stryker was here!" : (stryCov_9fa48("1115"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("1117") ? /\n\S*\n/g : stryMutAct_9fa48("1116") ? /\n\s\n/g : (stryCov_9fa48("1116", "1117"), /\n\s*\n/g), stryMutAct_9fa48("1118") ? "" : (stryCov_9fa48("1118"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("1119")) {
    {}
  } else {
    stryCov_9fa48("1119");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("1120") ? "Stryker was here!" : (stryCov_9fa48("1120"), "")).replace(stryMutAct_9fa48("1122") ? /^\// : stryMutAct_9fa48("1121") ? /\/+/ : (stryCov_9fa48("1121", "1122"), /^\/+/), stryMutAct_9fa48("1123") ? "Stryker was here!" : (stryCov_9fa48("1123"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("1124") ? "" : (stryCov_9fa48("1124"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("1128") ? pathParts.length <= 0 : stryMutAct_9fa48("1127") ? pathParts.length >= 0 : stryMutAct_9fa48("1126") ? false : stryMutAct_9fa48("1125") ? true : (stryCov_9fa48("1125", "1126", "1127", "1128"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("1129") ? [] : (stryCov_9fa48("1129"), [stryMutAct_9fa48("1130") ? "" : (stryCov_9fa48("1130"), "Root")]);
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("1131")) {
    {}
  } else {
    stryCov_9fa48("1131");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("1132") ? "Stryker was here!" : (stryCov_9fa48("1132"), "")).replace(stryMutAct_9fa48("1134") ? /^\// : stryMutAct_9fa48("1133") ? /\/+/ : (stryCov_9fa48("1133", "1134"), /^\/+/), stryMutAct_9fa48("1135") ? "Stryker was here!" : (stryCov_9fa48("1135"), ""));
    if (stryMutAct_9fa48("1138") ? relativePath.endsWith("MOCs/") : stryMutAct_9fa48("1137") ? false : stryMutAct_9fa48("1136") ? true : (stryCov_9fa48("1136", "1137", "1138"), relativePath.startsWith(stryMutAct_9fa48("1139") ? "" : (stryCov_9fa48("1139"), "MOCs/")))) return stryMutAct_9fa48("1140") ? "" : (stryCov_9fa48("1140"), "moc");
    if (stryMutAct_9fa48("1143") ? relativePath.endsWith("Articles/") : stryMutAct_9fa48("1142") ? false : stryMutAct_9fa48("1141") ? true : (stryCov_9fa48("1141", "1142", "1143"), relativePath.startsWith(stryMutAct_9fa48("1144") ? "" : (stryCov_9fa48("1144"), "Articles/")))) return stryMutAct_9fa48("1145") ? "" : (stryCov_9fa48("1145"), "article");
    if (stryMutAct_9fa48("1148") ? relativePath.endsWith("AIChats/") : stryMutAct_9fa48("1147") ? false : stryMutAct_9fa48("1146") ? true : (stryCov_9fa48("1146", "1147", "1148"), relativePath.startsWith(stryMutAct_9fa48("1149") ? "" : (stryCov_9fa48("1149"), "AIChats/")))) return stryMutAct_9fa48("1150") ? "" : (stryCov_9fa48("1150"), "conversation");
    if (stryMutAct_9fa48("1153") ? relativePath.endsWith("Books/") : stryMutAct_9fa48("1152") ? false : stryMutAct_9fa48("1151") ? true : (stryCov_9fa48("1151", "1152", "1153"), relativePath.startsWith(stryMutAct_9fa48("1154") ? "" : (stryCov_9fa48("1154"), "Books/")))) return stryMutAct_9fa48("1155") ? "" : (stryCov_9fa48("1155"), "book-note");
    if (stryMutAct_9fa48("1158") ? relativePath.endsWith("templates/") : stryMutAct_9fa48("1157") ? false : stryMutAct_9fa48("1156") ? true : (stryCov_9fa48("1156", "1157", "1158"), relativePath.startsWith(stryMutAct_9fa48("1159") ? "" : (stryCov_9fa48("1159"), "templates/")))) return stryMutAct_9fa48("1160") ? "" : (stryCov_9fa48("1160"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("1162") ? false : stryMutAct_9fa48("1161") ? true : (stryCov_9fa48("1161", "1162"), frontmatter.type)) {
      if (stryMutAct_9fa48("1163")) {
        {}
      } else {
        stryCov_9fa48("1163");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("1164") ? "" : (stryCov_9fa48("1164"), "note");
  }
}