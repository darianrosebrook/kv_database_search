/**
 * Extract links from text using configurable patterns
 */
export function extractLinks(
  text: string,
  linkFormats: Array<{
    pattern: RegExp;
    extractTarget: (match: RegExpMatchArray) => string;
    extractDisplayText?: (match: RegExpMatchArray) => string | undefined;
  }>
): string[] {
  const links: string[] = [];

  for (const format of linkFormats) {
    const regex = new RegExp(format.pattern.source, format.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const target = format.extractTarget(match);
      if (target) {
        links.push(target);
      }
    }
  }

  return Array.from(new Set(links));
}

/**
 * Extract hashtags from text
 */
export function extractHashtags(text: string): string[] {
  const tagRegex = /#([a-zA-Z0-9_/-]+)/g;
  const tags: string[] = [];
  let match;
  while ((match = tagRegex.exec(text)) !== null) {
    tags.push(match[1]);
  }
  return Array.from(new Set(tags));
}

/**
 * Extract tags from text using configurable patterns
 */
export function extractTags(
  text: string,
  tagFormats: Array<{
    pattern: RegExp;
    extractTag: (match: RegExpMatchArray) => string;
  }>
): string[] {
  const tags: string[] = [];

  for (const format of tagFormats) {
    const regex = new RegExp(format.pattern.source, format.pattern.flags);
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = format.extractTag(match);
      if (tag) {
        tags.push(tag);
      }
    }
  }

  return Array.from(new Set(tags));
}
