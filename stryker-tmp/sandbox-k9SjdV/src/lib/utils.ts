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
    console.log(stryMutAct_9fa48("1024") ? "" : (stryCov_9fa48("1024"), "normalize called with:"), text);
    return stryMutAct_9fa48("1025") ? text.normalize("NFC").replace(/\r\n?/g, "\n").replace(/[ \t]+/g, " ").replace(/\u200B|\u200C|\u200D|\uFEFF/g, "") // zero-widths
    : (stryCov_9fa48("1025"), text.normalize(stryMutAct_9fa48("1026") ? "" : (stryCov_9fa48("1026"), "NFC")).replace(stryMutAct_9fa48("1027") ? /\r\n/g : (stryCov_9fa48("1027"), /\r\n?/g), stryMutAct_9fa48("1028") ? "" : (stryCov_9fa48("1028"), "\n")).replace(stryMutAct_9fa48("1030") ? /[^ \t]+/g : stryMutAct_9fa48("1029") ? /[ \t]/g : (stryCov_9fa48("1029", "1030"), /[ \t]+/g), stryMutAct_9fa48("1031") ? "" : (stryCov_9fa48("1031"), " ")).replace(/\u200B|\u200C|\u200D|\uFEFF/g, stryMutAct_9fa48("1032") ? "Stryker was here!" : (stryCov_9fa48("1032"), "")) // zero-widths
    .trim());
  }
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  if (stryMutAct_9fa48("1033")) {
    {}
  } else {
    stryCov_9fa48("1033");
    const normalized = normalize(text);
    return crypto.createHash(stryMutAct_9fa48("1034") ? "" : (stryCov_9fa48("1034"), "sha256")).update(normalized).digest(stryMutAct_9fa48("1035") ? "" : (stryCov_9fa48("1035"), "hex"));
  }
}

/**
 * L2 normalize a vector (ensures cosine similarity is in [-1, 1] range)
 */
export function normalizeVector(vector: number[]): number[] {
  if (stryMutAct_9fa48("1036")) {
    {}
  } else {
    stryCov_9fa48("1036");
    const norm = Math.sqrt(vector.reduce(stryMutAct_9fa48("1037") ? () => undefined : (stryCov_9fa48("1037"), (sum, x) => stryMutAct_9fa48("1038") ? sum - x * x : (stryCov_9fa48("1038"), sum + (stryMutAct_9fa48("1039") ? x / x : (stryCov_9fa48("1039"), x * x)))), 0));
    if (stryMutAct_9fa48("1042") ? norm !== 0 : stryMutAct_9fa48("1041") ? false : stryMutAct_9fa48("1040") ? true : (stryCov_9fa48("1040", "1041", "1042"), norm === 0)) return vector; // Avoid division by zero for zero vectors
    return vector.map(stryMutAct_9fa48("1043") ? () => undefined : (stryCov_9fa48("1043"), x => stryMutAct_9fa48("1044") ? x * norm : (stryCov_9fa48("1044"), x / norm)));
  }
}

/**
 * Calculate cosine similarity between two normalized vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (stryMutAct_9fa48("1045")) {
    {}
  } else {
    stryCov_9fa48("1045");
    if (stryMutAct_9fa48("1048") ? vecA.length === vecB.length : stryMutAct_9fa48("1047") ? false : stryMutAct_9fa48("1046") ? true : (stryCov_9fa48("1046", "1047", "1048"), vecA.length !== vecB.length)) {
      if (stryMutAct_9fa48("1049")) {
        {}
      } else {
        stryCov_9fa48("1049");
        throw new Error(stryMutAct_9fa48("1050") ? "" : (stryCov_9fa48("1050"), "Vectors must have the same dimension"));
      }
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; stryMutAct_9fa48("1053") ? i >= vecA.length : stryMutAct_9fa48("1052") ? i <= vecA.length : stryMutAct_9fa48("1051") ? false : (stryCov_9fa48("1051", "1052", "1053"), i < vecA.length); stryMutAct_9fa48("1054") ? i-- : (stryCov_9fa48("1054"), i++)) {
      if (stryMutAct_9fa48("1055")) {
        {}
      } else {
        stryCov_9fa48("1055");
        stryMutAct_9fa48("1056") ? dotProduct -= vecA[i] * vecB[i] : (stryCov_9fa48("1056"), dotProduct += stryMutAct_9fa48("1057") ? vecA[i] / vecB[i] : (stryCov_9fa48("1057"), vecA[i] * vecB[i]));
        stryMutAct_9fa48("1058") ? normA -= vecA[i] * vecA[i] : (stryCov_9fa48("1058"), normA += stryMutAct_9fa48("1059") ? vecA[i] / vecA[i] : (stryCov_9fa48("1059"), vecA[i] * vecA[i]));
        stryMutAct_9fa48("1060") ? normB -= vecB[i] * vecB[i] : (stryCov_9fa48("1060"), normB += stryMutAct_9fa48("1061") ? vecB[i] / vecB[i] : (stryCov_9fa48("1061"), vecB[i] * vecB[i]));
      }
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (stryMutAct_9fa48("1064") ? normA === 0 && normB === 0 : stryMutAct_9fa48("1063") ? false : stryMutAct_9fa48("1062") ? true : (stryCov_9fa48("1062", "1063", "1064"), (stryMutAct_9fa48("1066") ? normA !== 0 : stryMutAct_9fa48("1065") ? false : (stryCov_9fa48("1065", "1066"), normA === 0)) || (stryMutAct_9fa48("1068") ? normB !== 0 : stryMutAct_9fa48("1067") ? false : (stryCov_9fa48("1067", "1068"), normB === 0)))) return 0;
    return stryMutAct_9fa48("1069") ? dotProduct * (normA * normB) : (stryCov_9fa48("1069"), dotProduct / (stryMutAct_9fa48("1070") ? normA / normB : (stryCov_9fa48("1070"), normA * normB)));
  }
}

/**
 * Estimate token count (crude approximation: words/0.75)
 */
export function estimateTokens(text: string): number {
  if (stryMutAct_9fa48("1071")) {
    {}
  } else {
    stryCov_9fa48("1071");
    return Math.ceil(stryMutAct_9fa48("1072") ? text.split(/\s+/).length * 0.75 : (stryCov_9fa48("1072"), text.split(stryMutAct_9fa48("1074") ? /\S+/ : stryMutAct_9fa48("1073") ? /\s/ : (stryCov_9fa48("1073", "1074"), /\s+/)).length / 0.75));
  }
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms: number): Promise<void> {
  if (stryMutAct_9fa48("1075")) {
    {}
  } else {
    stryCov_9fa48("1075");
    return new Promise(stryMutAct_9fa48("1076") ? () => undefined : (stryCov_9fa48("1076"), resolve => setTimeout(resolve, ms)));
  }
}

/**
 * Extract Obsidian wikilinks from text
 */
export function extractWikilinks(text: string): string[] {
  if (stryMutAct_9fa48("1077")) {
    {}
  } else {
    stryCov_9fa48("1077");
    const wikilinkRegex = stryMutAct_9fa48("1079") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("1078") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("1078", "1079"), /\[\[([^\]]+)\]\]/g);
    const wikilinks: string[] = stryMutAct_9fa48("1080") ? ["Stryker was here"] : (stryCov_9fa48("1080"), []);
    let match;
    while (stryMutAct_9fa48("1082") ? (match = wikilinkRegex.exec(text)) === null : stryMutAct_9fa48("1081") ? false : (stryCov_9fa48("1081", "1082"), (match = wikilinkRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("1083")) {
        {}
      } else {
        stryCov_9fa48("1083");
        wikilinks.push(match[1]);
      }
    }
    return stryMutAct_9fa48("1084") ? [] : (stryCov_9fa48("1084"), [...new Set(wikilinks)]); // Remove duplicates
  }
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  if (stryMutAct_9fa48("1085")) {
    {}
  } else {
    stryCov_9fa48("1085");
    const tagRegex = stryMutAct_9fa48("1087") ? /#([^a-zA-Z0-9_/-]+)/g : stryMutAct_9fa48("1086") ? /#([a-zA-Z0-9_/-])/g : (stryCov_9fa48("1086", "1087"), /#([a-zA-Z0-9_/-]+)/g);
    const tags: string[] = stryMutAct_9fa48("1088") ? ["Stryker was here"] : (stryCov_9fa48("1088"), []);
    let match;
    while (stryMutAct_9fa48("1090") ? (match = tagRegex.exec(text)) === null : stryMutAct_9fa48("1089") ? false : (stryCov_9fa48("1089", "1090"), (match = tagRegex.exec(text)) !== null)) {
      if (stryMutAct_9fa48("1091")) {
        {}
      } else {
        stryCov_9fa48("1091");
        tags.push(match[1]);
      }
    }
    return stryMutAct_9fa48("1092") ? [] : (stryCov_9fa48("1092"), [...new Set(tags)]); // Remove duplicates
  }
}

/**
 * Clean markdown content for better embedding
 */
export function cleanMarkdown(text: string): string {
  if (stryMutAct_9fa48("1093")) {
    {}
  } else {
    stryCov_9fa48("1093");
    return stryMutAct_9fa48("1094") ? text
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
    .replace(/\n\s*\n/g, "\n\n") : (stryCov_9fa48("1094"), text
    // Remove frontmatter
    .replace(stryMutAct_9fa48("1100") ? /^---[\s\S]*?---\n/ : stryMutAct_9fa48("1099") ? /^---[\s\s]*?---\n?/ : stryMutAct_9fa48("1098") ? /^---[\S\S]*?---\n?/ : stryMutAct_9fa48("1097") ? /^---[^\s\S]*?---\n?/ : stryMutAct_9fa48("1096") ? /^---[\s\S]---\n?/ : stryMutAct_9fa48("1095") ? /---[\s\S]*?---\n?/ : (stryCov_9fa48("1095", "1096", "1097", "1098", "1099", "1100"), /^---[\s\S]*?---\n?/), stryMutAct_9fa48("1101") ? "Stryker was here!" : (stryCov_9fa48("1101"), ""))
    // Remove wikilinks but keep the text
    .replace(stryMutAct_9fa48("1103") ? /\[\[([\]]+)\]\]/g : stryMutAct_9fa48("1102") ? /\[\[([^\]])\]\]/g : (stryCov_9fa48("1102", "1103"), /\[\[([^\]]+)\]\]/g), stryMutAct_9fa48("1104") ? "" : (stryCov_9fa48("1104"), "$1"))
    // Remove markdown links but keep the text
    .replace(stryMutAct_9fa48("1108") ? /\[([^\]]+)\]\([)]+\)/g : stryMutAct_9fa48("1107") ? /\[([^\]]+)\]\([^)]\)/g : stryMutAct_9fa48("1106") ? /\[([\]]+)\]\([^)]+\)/g : stryMutAct_9fa48("1105") ? /\[([^\]])\]\([^)]+\)/g : (stryCov_9fa48("1105", "1106", "1107", "1108"), /\[([^\]]+)\]\([^)]+\)/g), stryMutAct_9fa48("1109") ? "" : (stryCov_9fa48("1109"), "$1"))
    // Remove markdown formatting
    .replace(stryMutAct_9fa48("1110") ? /[^*_`~]/g : (stryCov_9fa48("1110"), /[*_`~]/g), stryMutAct_9fa48("1111") ? "Stryker was here!" : (stryCov_9fa48("1111"), ""))
    // Remove headers
    .replace(stryMutAct_9fa48("1115") ? /^#+\S+/gm : stryMutAct_9fa48("1114") ? /^#+\s/gm : stryMutAct_9fa48("1113") ? /^#\s+/gm : stryMutAct_9fa48("1112") ? /#+\s+/gm : (stryCov_9fa48("1112", "1113", "1114", "1115"), /^#+\s+/gm), stryMutAct_9fa48("1116") ? "Stryker was here!" : (stryCov_9fa48("1116"), ""))
    // Clean up extra whitespace
    .replace(stryMutAct_9fa48("1118") ? /\n\S*\n/g : stryMutAct_9fa48("1117") ? /\n\s\n/g : (stryCov_9fa48("1117", "1118"), /\n\s*\n/g), stryMutAct_9fa48("1119") ? "" : (stryCov_9fa48("1119"), "\n\n")).trim());
  }
}

/**
 * Generate breadcrumbs from file path
 */
export function generateBreadcrumbs(filePath: string, vaultPath: string): string[] {
  if (stryMutAct_9fa48("1120")) {
    {}
  } else {
    stryCov_9fa48("1120");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("1121") ? "Stryker was here!" : (stryCov_9fa48("1121"), "")).replace(stryMutAct_9fa48("1123") ? /^\// : stryMutAct_9fa48("1122") ? /\/+/ : (stryCov_9fa48("1122", "1123"), /^\/+/), stryMutAct_9fa48("1124") ? "Stryker was here!" : (stryCov_9fa48("1124"), ""));
    const pathParts = relativePath.split(stryMutAct_9fa48("1125") ? "" : (stryCov_9fa48("1125"), "/"));
    pathParts.pop(); // Remove filename
    return (stryMutAct_9fa48("1129") ? pathParts.length <= 0 : stryMutAct_9fa48("1128") ? pathParts.length >= 0 : stryMutAct_9fa48("1127") ? false : stryMutAct_9fa48("1126") ? true : (stryCov_9fa48("1126", "1127", "1128", "1129"), pathParts.length > 0)) ? pathParts : stryMutAct_9fa48("1130") ? [] : (stryCov_9fa48("1130"), [stryMutAct_9fa48("1131") ? "" : (stryCov_9fa48("1131"), "Root")]);
  }
}

/**
 * Determine content type from file path and frontmatter
 */
export function determineContentType(filePath: string, vaultPath: string, frontmatter: Record<string, any>): string {
  if (stryMutAct_9fa48("1132")) {
    {}
  } else {
    stryCov_9fa48("1132");
    const relativePath = filePath.replace(vaultPath, stryMutAct_9fa48("1133") ? "Stryker was here!" : (stryCov_9fa48("1133"), "")).replace(stryMutAct_9fa48("1135") ? /^\// : stryMutAct_9fa48("1134") ? /\/+/ : (stryCov_9fa48("1134", "1135"), /^\/+/), stryMutAct_9fa48("1136") ? "Stryker was here!" : (stryCov_9fa48("1136"), ""));
    if (stryMutAct_9fa48("1139") ? relativePath.endsWith("MOCs/") : stryMutAct_9fa48("1138") ? false : stryMutAct_9fa48("1137") ? true : (stryCov_9fa48("1137", "1138", "1139"), relativePath.startsWith(stryMutAct_9fa48("1140") ? "" : (stryCov_9fa48("1140"), "MOCs/")))) return stryMutAct_9fa48("1141") ? "" : (stryCov_9fa48("1141"), "moc");
    if (stryMutAct_9fa48("1144") ? relativePath.endsWith("Articles/") : stryMutAct_9fa48("1143") ? false : stryMutAct_9fa48("1142") ? true : (stryCov_9fa48("1142", "1143", "1144"), relativePath.startsWith(stryMutAct_9fa48("1145") ? "" : (stryCov_9fa48("1145"), "Articles/")))) return stryMutAct_9fa48("1146") ? "" : (stryCov_9fa48("1146"), "article");
    if (stryMutAct_9fa48("1149") ? relativePath.endsWith("AIChats/") : stryMutAct_9fa48("1148") ? false : stryMutAct_9fa48("1147") ? true : (stryCov_9fa48("1147", "1148", "1149"), relativePath.startsWith(stryMutAct_9fa48("1150") ? "" : (stryCov_9fa48("1150"), "AIChats/")))) return stryMutAct_9fa48("1151") ? "" : (stryCov_9fa48("1151"), "conversation");
    if (stryMutAct_9fa48("1154") ? relativePath.endsWith("Books/") : stryMutAct_9fa48("1153") ? false : stryMutAct_9fa48("1152") ? true : (stryCov_9fa48("1152", "1153", "1154"), relativePath.startsWith(stryMutAct_9fa48("1155") ? "" : (stryCov_9fa48("1155"), "Books/")))) return stryMutAct_9fa48("1156") ? "" : (stryCov_9fa48("1156"), "book-note");
    if (stryMutAct_9fa48("1159") ? relativePath.endsWith("templates/") : stryMutAct_9fa48("1158") ? false : stryMutAct_9fa48("1157") ? true : (stryCov_9fa48("1157", "1158", "1159"), relativePath.startsWith(stryMutAct_9fa48("1160") ? "" : (stryCov_9fa48("1160"), "templates/")))) return stryMutAct_9fa48("1161") ? "" : (stryCov_9fa48("1161"), "template");

    // Check frontmatter type
    if (stryMutAct_9fa48("1163") ? false : stryMutAct_9fa48("1162") ? true : (stryCov_9fa48("1162", "1163"), frontmatter.type)) {
      if (stryMutAct_9fa48("1164")) {
        {}
      } else {
        stryCov_9fa48("1164");
        return frontmatter.type;
      }
    }
    return stryMutAct_9fa48("1165") ? "" : (stryCov_9fa48("1165"), "note");
  }
}