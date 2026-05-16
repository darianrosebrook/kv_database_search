import * as crypto from "node:crypto";
import { normalize } from "./text.js";

/**
 * Create a hash using specified algorithm and input
 */
export function createHash(algorithm: string, input: string | Buffer): string {
  return crypto.createHash(algorithm).update(input).digest("hex");
}

/**
 * Create a stable content hash for deterministic IDs
 */
export function createContentHash(text: string): string {
  const normalized = normalize(text);
  return createHash("sha256", normalized);
}

/**
 * Generate a deterministic ID from multiple components
 */
export function generateDeterministicId(
  ...components: (string | number)[]
): string {
  const combined = components.join("_");
  return createHash("md5", combined).slice(0, 8);
}
