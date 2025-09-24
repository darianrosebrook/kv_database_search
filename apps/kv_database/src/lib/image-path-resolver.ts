/**
 * Image Path Resolution for Obsidian Vault
 * Resolves relative image paths from markdown files to absolute file paths
 */

import * as fs from "fs";
import * as path from "path";

export interface ResolvedImagePath {
  /** Original path from the markdown */
  originalPath: string;

  /** Resolved absolute path */
  resolvedPath: string;

  /** Whether the file exists */
  exists: boolean;

  /** File size if exists (bytes) */
  size?: number;

  /** File extension */
  extension: string;

  /** Whether this is within the vault directory */
  withinVault: boolean;

  /** Relative path from vault root */
  relativePath?: string;

  /** Error message if resolution failed */
  error?: string;
}

export interface PathResolutionResult {
  /** Successfully resolved paths */
  resolved: ResolvedImagePath[];

  /** Paths that could not be resolved */
  failed: Array<{
    originalPath: string;
    error: string;
  }>;

  /** Summary statistics */
  stats: {
    total: number;
    resolved: number;
    failed: number;
    withinVault: number;
    outsideVault: number;
  };
}

/**
 * Resolves image paths from markdown content to actual file locations
 */
export class ImagePathResolver {
  constructor(private vaultPath: string) {}

  /**
   * Resolve multiple image paths
   */
  resolvePaths(
    imagePaths: string[],
    sourceFilePath: string
  ): PathResolutionResult {
    const resolved: ResolvedImagePath[] = [];
    const failed: Array<{ originalPath: string; error: string }> = [];

    for (const imagePath of imagePaths) {
      try {
        const resolvedPath = this.resolveSinglePath(imagePath, sourceFilePath);
        if (resolvedPath.error) {
          failed.push({
            originalPath: imagePath,
            error: resolvedPath.error,
          });
        } else {
          resolved.push(resolvedPath);
        }
      } catch (error) {
        failed.push({
          originalPath: imagePath,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const stats = this.calculateStats(resolved, failed);

    return {
      resolved,
      failed,
      stats,
    };
  }

  private resolveSinglePath(
    imagePath: string,
    sourceFilePath: string
  ): ResolvedImagePath {
    // Handle absolute paths
    if (path.isAbsolute(imagePath)) {
      return this.resolveAbsolutePath(imagePath);
    }

    // Handle relative paths
    return this.resolveRelativePath(imagePath, sourceFilePath);
  }

  private resolveAbsolutePath(imagePath: string): ResolvedImagePath {
    const normalizedPath = path.normalize(imagePath);
    const withinVault = normalizedPath.startsWith(this.vaultPath);

    let exists = false;
    let size: number | undefined;

    try {
      const stat = fs.statSync(normalizedPath);
      exists = true;
      size = stat.size;
    } catch {
      exists = false;
    }

    return {
      originalPath: imagePath,
      resolvedPath: normalizedPath,
      exists,
      size,
      extension: path.extname(normalizedPath),
      withinVault,
      relativePath: withinVault
        ? path.relative(this.vaultPath, normalizedPath)
        : undefined,
    };
  }

  private resolveRelativePath(
    imagePath: string,
    sourceFilePath: string
  ): ResolvedImagePath {
    // Get the directory containing the markdown file
    const sourceDir = path.dirname(sourceFilePath);

    // Try different resolution strategies
    const resolutionAttempts = [
      // 1. Direct relative to source file
      () => path.resolve(sourceDir, imagePath),

      // 2. Relative to vault root
      () => path.resolve(this.vaultPath, imagePath),

      // 3. Common image directories within vault
      () => this.tryCommonImageDirectories(imagePath),

      // 4. With common prefixes (attachments/, assets/, images/, etc.)
      () => this.tryWithPrefixes(imagePath, sourceDir),
    ];

    for (const attempt of resolutionAttempts) {
      try {
        const resolvedPath = attempt();
        const withinVault = resolvedPath.startsWith(this.vaultPath);

        // Check if file exists
        let exists = false;
        let size: number | undefined;

        try {
          const stat = fs.statSync(resolvedPath);
          exists = true;
          size = stat.size;
        } catch {
          // File doesn't exist, continue to next attempt
          continue;
        }

        return {
          originalPath: imagePath,
          resolvedPath,
          exists: true,
          size,
          extension: path.extname(resolvedPath),
          withinVault,
          relativePath: withinVault
            ? path.relative(this.vaultPath, resolvedPath)
            : undefined,
        };
      } catch {
        // Resolution failed, try next strategy
        continue;
      }
    }

    // If all attempts failed
    return {
      originalPath: imagePath,
      resolvedPath: "",
      exists: false,
      extension: path.extname(imagePath),
      withinVault: false,
      error: `Could not resolve image path: ${imagePath}`,
    };
  }

  private tryCommonImageDirectories(imagePath: string): string {
    const commonDirs = [
      "attachments",
      "assets",
      "images",
      "img",
      "media",
      "files",
    ];

    for (const dir of commonDirs) {
      const fullPath = path.resolve(this.vaultPath, dir, imagePath);
      // Check if this path exists
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    throw new Error("No common directory found");
  }

  private tryWithPrefixes(imagePath: string, sourceDir: string): string {
    const prefixes = [
      "attachments/",
      "assets/",
      "images/",
      "img/",
      "media/",
      "files/",
    ];

    for (const prefix of prefixes) {
      const prefixedPath = path.resolve(sourceDir, prefix, imagePath);
      if (fs.existsSync(prefixedPath)) {
        return prefixedPath;
      }
    }

    throw new Error("No prefix found");
  }

  /**
   * Validate that a path points to a valid image file
   */
  validateImagePath(resolvedPath: ResolvedImagePath): boolean {
    if (!resolvedPath.exists) {
      return false;
    }

    if (resolvedPath.size === undefined || resolvedPath.size === 0) {
      return false; // Empty files are not valid images
    }

    if (resolvedPath.size > 100 * 1024 * 1024) {
      // 100MB limit
      return false; // Too large for processing
    }

    const validExtensions = [
      ".png",
      ".jpg",
      ".jpeg",
      ".gif",
      ".bmp",
      ".tiff",
      ".webp",
      ".svg",
    ];
    return validExtensions.includes(resolvedPath.extension.toLowerCase());
  }

  /**
   * Filter to only valid image paths
   */
  filterValidImages(resolvedPaths: ResolvedImagePath[]): ResolvedImagePath[] {
    return resolvedPaths.filter((path) => this.validateImagePath(path));
  }

  /**
   * Get file statistics for resolved paths
   */
  getFileStats(
    resolvedPaths: ResolvedImagePath[]
  ): Array<ResolvedImagePath & { size: number }> {
    return resolvedPaths
      .filter((path) => path.exists && path.size !== undefined)
      .map((path) => path as ResolvedImagePath & { size: number });
  }

  private calculateStats(
    resolved: ResolvedImagePath[],
    failed: Array<{ originalPath: string; error: string }>
  ): PathResolutionResult["stats"] {
    const withinVault = resolved.filter((p) => p.withinVault).length;

    return {
      total: resolved.length + failed.length,
      resolved: resolved.length,
      failed: failed.length,
      withinVault,
      outsideVault: resolved.length - withinVault,
    };
  }

  /**
   * Check if a path is safe (doesn't escape the vault)
   */
  isPathSafe(imagePath: string, sourceFilePath: string): boolean {
    const resolvedPath = path.resolve(path.dirname(sourceFilePath), imagePath);
    return resolvedPath.startsWith(this.vaultPath);
  }
}
