import * as fs from "fs";
import * as os from "os";
import * as path from "path";

/**
 * Create a temporary directory for media processing.
 * Returns the absolute path to the created directory.
 */
export function createTempDir(prefix: string = "media-processing"): string {
  const base = path.join(os.tmpdir(), prefix);
  fs.mkdirSync(base, { recursive: true });
  return fs.mkdtempSync(path.join(base, "work-"));
}

/**
 * Remove a temporary directory and all its contents.
 * Silently ignores if the directory doesn't exist.
 */
export function cleanupTempDir(dir: string): void {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
}
