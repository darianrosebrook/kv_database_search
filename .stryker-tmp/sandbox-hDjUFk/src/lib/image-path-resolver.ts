/**
 * Image Path Resolution for Obsidian Vault
 * Resolves relative image paths from markdown files to absolute file paths
 */
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
  resolvePaths(imagePaths: string[], sourceFilePath: string): PathResolutionResult {
    if (stryMutAct_9fa48("895")) {
      {}
    } else {
      stryCov_9fa48("895");
      const resolved: ResolvedImagePath[] = stryMutAct_9fa48("896") ? ["Stryker was here"] : (stryCov_9fa48("896"), []);
      const failed: Array<{
        originalPath: string;
        error: string;
      }> = stryMutAct_9fa48("897") ? ["Stryker was here"] : (stryCov_9fa48("897"), []);
      for (const imagePath of imagePaths) {
        if (stryMutAct_9fa48("898")) {
          {}
        } else {
          stryCov_9fa48("898");
          try {
            if (stryMutAct_9fa48("899")) {
              {}
            } else {
              stryCov_9fa48("899");
              const resolvedPath = this.resolveSinglePath(imagePath, sourceFilePath);
              if (stryMutAct_9fa48("901") ? false : stryMutAct_9fa48("900") ? true : (stryCov_9fa48("900", "901"), resolvedPath.error)) {
                if (stryMutAct_9fa48("902")) {
                  {}
                } else {
                  stryCov_9fa48("902");
                  failed.push(stryMutAct_9fa48("903") ? {} : (stryCov_9fa48("903"), {
                    originalPath: imagePath,
                    error: resolvedPath.error
                  }));
                }
              } else {
                if (stryMutAct_9fa48("904")) {
                  {}
                } else {
                  stryCov_9fa48("904");
                  resolved.push(resolvedPath);
                }
              }
            }
          } catch (error) {
            if (stryMutAct_9fa48("905")) {
              {}
            } else {
              stryCov_9fa48("905");
              failed.push(stryMutAct_9fa48("906") ? {} : (stryCov_9fa48("906"), {
                originalPath: imagePath,
                error: error instanceof Error ? error.message : String(error)
              }));
            }
          }
        }
      }
      const stats = this.calculateStats(resolved, failed);
      return stryMutAct_9fa48("907") ? {} : (stryCov_9fa48("907"), {
        resolved,
        failed,
        stats
      });
    }
  }
  private resolveSinglePath(imagePath: string, sourceFilePath: string): ResolvedImagePath {
    if (stryMutAct_9fa48("908")) {
      {}
    } else {
      stryCov_9fa48("908");
      // Handle absolute paths
      if (stryMutAct_9fa48("910") ? false : stryMutAct_9fa48("909") ? true : (stryCov_9fa48("909", "910"), path.isAbsolute(imagePath))) {
        if (stryMutAct_9fa48("911")) {
          {}
        } else {
          stryCov_9fa48("911");
          return this.resolveAbsolutePath(imagePath);
        }
      }

      // Handle relative paths
      return this.resolveRelativePath(imagePath, sourceFilePath);
    }
  }
  private resolveAbsolutePath(imagePath: string): ResolvedImagePath {
    if (stryMutAct_9fa48("912")) {
      {}
    } else {
      stryCov_9fa48("912");
      const normalizedPath = path.normalize(imagePath);
      const withinVault = stryMutAct_9fa48("913") ? normalizedPath.endsWith(this.vaultPath) : (stryCov_9fa48("913"), normalizedPath.startsWith(this.vaultPath));
      let exists = stryMutAct_9fa48("914") ? true : (stryCov_9fa48("914"), false);
      let size: number | undefined;
      try {
        if (stryMutAct_9fa48("915")) {
          {}
        } else {
          stryCov_9fa48("915");
          const stat = fs.statSync(normalizedPath);
          exists = stryMutAct_9fa48("916") ? false : (stryCov_9fa48("916"), true);
          size = stat.size;
        }
      } catch {
        if (stryMutAct_9fa48("917")) {
          {}
        } else {
          stryCov_9fa48("917");
          exists = stryMutAct_9fa48("918") ? true : (stryCov_9fa48("918"), false);
        }
      }
      return stryMutAct_9fa48("919") ? {} : (stryCov_9fa48("919"), {
        originalPath: imagePath,
        resolvedPath: normalizedPath,
        exists,
        size,
        extension: path.extname(normalizedPath),
        withinVault,
        relativePath: withinVault ? path.relative(this.vaultPath, normalizedPath) : undefined
      });
    }
  }
  private resolveRelativePath(imagePath: string, sourceFilePath: string): ResolvedImagePath {
    if (stryMutAct_9fa48("920")) {
      {}
    } else {
      stryCov_9fa48("920");
      // Get the directory containing the markdown file
      const sourceDir = path.dirname(sourceFilePath);

      // Try different resolution strategies
      const resolutionAttempts = stryMutAct_9fa48("921") ? [] : (stryCov_9fa48("921"), [// 1. Direct relative to source file
      stryMutAct_9fa48("922") ? () => undefined : (stryCov_9fa48("922"), () => path.resolve(sourceDir, imagePath)), // 2. Relative to vault root
      stryMutAct_9fa48("923") ? () => undefined : (stryCov_9fa48("923"), () => path.resolve(this.vaultPath, imagePath)), // 3. Common image directories within vault
      stryMutAct_9fa48("924") ? () => undefined : (stryCov_9fa48("924"), () => this.tryCommonImageDirectories(imagePath)), // 4. With common prefixes (attachments/, assets/, images/, etc.)
      stryMutAct_9fa48("925") ? () => undefined : (stryCov_9fa48("925"), () => this.tryWithPrefixes(imagePath, sourceDir))]);
      for (const attempt of resolutionAttempts) {
        if (stryMutAct_9fa48("926")) {
          {}
        } else {
          stryCov_9fa48("926");
          try {
            if (stryMutAct_9fa48("927")) {
              {}
            } else {
              stryCov_9fa48("927");
              const resolvedPath = attempt();
              const withinVault = stryMutAct_9fa48("928") ? resolvedPath.endsWith(this.vaultPath) : (stryCov_9fa48("928"), resolvedPath.startsWith(this.vaultPath));

              // Check if file exists
              let exists = stryMutAct_9fa48("929") ? true : (stryCov_9fa48("929"), false);
              let size: number | undefined;
              try {
                if (stryMutAct_9fa48("930")) {
                  {}
                } else {
                  stryCov_9fa48("930");
                  const stat = fs.statSync(resolvedPath);
                  exists = stryMutAct_9fa48("931") ? false : (stryCov_9fa48("931"), true);
                  size = stat.size;
                }
              } catch {
                if (stryMutAct_9fa48("932")) {
                  {}
                } else {
                  stryCov_9fa48("932");
                  // File doesn't exist, continue to next attempt
                  continue;
                }
              }
              return stryMutAct_9fa48("933") ? {} : (stryCov_9fa48("933"), {
                originalPath: imagePath,
                resolvedPath,
                exists: stryMutAct_9fa48("934") ? false : (stryCov_9fa48("934"), true),
                size,
                extension: path.extname(resolvedPath),
                withinVault,
                relativePath: withinVault ? path.relative(this.vaultPath, resolvedPath) : undefined
              });
            }
          } catch {
            if (stryMutAct_9fa48("935")) {
              {}
            } else {
              stryCov_9fa48("935");
              // Resolution failed, try next strategy
              continue;
            }
          }
        }
      }

      // If all attempts failed
      return stryMutAct_9fa48("936") ? {} : (stryCov_9fa48("936"), {
        originalPath: imagePath,
        resolvedPath: stryMutAct_9fa48("937") ? "Stryker was here!" : (stryCov_9fa48("937"), ""),
        exists: stryMutAct_9fa48("938") ? true : (stryCov_9fa48("938"), false),
        extension: path.extname(imagePath),
        withinVault: stryMutAct_9fa48("939") ? true : (stryCov_9fa48("939"), false),
        error: stryMutAct_9fa48("940") ? `` : (stryCov_9fa48("940"), `Could not resolve image path: ${imagePath}`)
      });
    }
  }
  private tryCommonImageDirectories(imagePath: string): string {
    if (stryMutAct_9fa48("941")) {
      {}
    } else {
      stryCov_9fa48("941");
      const commonDirs = stryMutAct_9fa48("942") ? [] : (stryCov_9fa48("942"), [stryMutAct_9fa48("943") ? "" : (stryCov_9fa48("943"), "attachments"), stryMutAct_9fa48("944") ? "" : (stryCov_9fa48("944"), "assets"), stryMutAct_9fa48("945") ? "" : (stryCov_9fa48("945"), "images"), stryMutAct_9fa48("946") ? "" : (stryCov_9fa48("946"), "img"), stryMutAct_9fa48("947") ? "" : (stryCov_9fa48("947"), "media"), stryMutAct_9fa48("948") ? "" : (stryCov_9fa48("948"), "files")]);
      for (const dir of commonDirs) {
        if (stryMutAct_9fa48("949")) {
          {}
        } else {
          stryCov_9fa48("949");
          const fullPath = path.resolve(this.vaultPath, dir, imagePath);
          // Check if this path exists
          if (stryMutAct_9fa48("951") ? false : stryMutAct_9fa48("950") ? true : (stryCov_9fa48("950", "951"), fs.existsSync(fullPath))) {
            if (stryMutAct_9fa48("952")) {
              {}
            } else {
              stryCov_9fa48("952");
              return fullPath;
            }
          }
        }
      }
      throw new Error(stryMutAct_9fa48("953") ? "" : (stryCov_9fa48("953"), "No common directory found"));
    }
  }
  private tryWithPrefixes(imagePath: string, sourceDir: string): string {
    if (stryMutAct_9fa48("954")) {
      {}
    } else {
      stryCov_9fa48("954");
      const prefixes = stryMutAct_9fa48("955") ? [] : (stryCov_9fa48("955"), [stryMutAct_9fa48("956") ? "" : (stryCov_9fa48("956"), "attachments/"), stryMutAct_9fa48("957") ? "" : (stryCov_9fa48("957"), "assets/"), stryMutAct_9fa48("958") ? "" : (stryCov_9fa48("958"), "images/"), stryMutAct_9fa48("959") ? "" : (stryCov_9fa48("959"), "img/"), stryMutAct_9fa48("960") ? "" : (stryCov_9fa48("960"), "media/"), stryMutAct_9fa48("961") ? "" : (stryCov_9fa48("961"), "files/")]);
      for (const prefix of prefixes) {
        if (stryMutAct_9fa48("962")) {
          {}
        } else {
          stryCov_9fa48("962");
          const prefixedPath = path.resolve(sourceDir, prefix, imagePath);
          if (stryMutAct_9fa48("964") ? false : stryMutAct_9fa48("963") ? true : (stryCov_9fa48("963", "964"), fs.existsSync(prefixedPath))) {
            if (stryMutAct_9fa48("965")) {
              {}
            } else {
              stryCov_9fa48("965");
              return prefixedPath;
            }
          }
        }
      }
      throw new Error(stryMutAct_9fa48("966") ? "" : (stryCov_9fa48("966"), "No prefix found"));
    }
  }

  /**
   * Validate that a path points to a valid image file
   */
  validateImagePath(resolvedPath: ResolvedImagePath): boolean {
    if (stryMutAct_9fa48("967")) {
      {}
    } else {
      stryCov_9fa48("967");
      if (stryMutAct_9fa48("970") ? false : stryMutAct_9fa48("969") ? true : stryMutAct_9fa48("968") ? resolvedPath.exists : (stryCov_9fa48("968", "969", "970"), !resolvedPath.exists)) {
        if (stryMutAct_9fa48("971")) {
          {}
        } else {
          stryCov_9fa48("971");
          return stryMutAct_9fa48("972") ? true : (stryCov_9fa48("972"), false);
        }
      }
      if (stryMutAct_9fa48("975") ? resolvedPath.size === undefined && resolvedPath.size === 0 : stryMutAct_9fa48("974") ? false : stryMutAct_9fa48("973") ? true : (stryCov_9fa48("973", "974", "975"), (stryMutAct_9fa48("977") ? resolvedPath.size !== undefined : stryMutAct_9fa48("976") ? false : (stryCov_9fa48("976", "977"), resolvedPath.size === undefined)) || (stryMutAct_9fa48("979") ? resolvedPath.size !== 0 : stryMutAct_9fa48("978") ? false : (stryCov_9fa48("978", "979"), resolvedPath.size === 0)))) {
        if (stryMutAct_9fa48("980")) {
          {}
        } else {
          stryCov_9fa48("980");
          return stryMutAct_9fa48("981") ? true : (stryCov_9fa48("981"), false); // Empty files are not valid images
        }
      }
      if (stryMutAct_9fa48("985") ? resolvedPath.size <= 100 * 1024 * 1024 : stryMutAct_9fa48("984") ? resolvedPath.size >= 100 * 1024 * 1024 : stryMutAct_9fa48("983") ? false : stryMutAct_9fa48("982") ? true : (stryCov_9fa48("982", "983", "984", "985"), resolvedPath.size > (stryMutAct_9fa48("986") ? 100 * 1024 / 1024 : (stryCov_9fa48("986"), (stryMutAct_9fa48("987") ? 100 / 1024 : (stryCov_9fa48("987"), 100 * 1024)) * 1024)))) {
        if (stryMutAct_9fa48("988")) {
          {}
        } else {
          stryCov_9fa48("988");
          // 100MB limit
          return stryMutAct_9fa48("989") ? true : (stryCov_9fa48("989"), false); // Too large for processing
        }
      }
      const validExtensions = stryMutAct_9fa48("990") ? [] : (stryCov_9fa48("990"), [stryMutAct_9fa48("991") ? "" : (stryCov_9fa48("991"), ".png"), stryMutAct_9fa48("992") ? "" : (stryCov_9fa48("992"), ".jpg"), stryMutAct_9fa48("993") ? "" : (stryCov_9fa48("993"), ".jpeg"), stryMutAct_9fa48("994") ? "" : (stryCov_9fa48("994"), ".gif"), stryMutAct_9fa48("995") ? "" : (stryCov_9fa48("995"), ".bmp"), stryMutAct_9fa48("996") ? "" : (stryCov_9fa48("996"), ".tiff"), stryMutAct_9fa48("997") ? "" : (stryCov_9fa48("997"), ".webp"), stryMutAct_9fa48("998") ? "" : (stryCov_9fa48("998"), ".svg")]);
      return validExtensions.includes(stryMutAct_9fa48("999") ? resolvedPath.extension.toUpperCase() : (stryCov_9fa48("999"), resolvedPath.extension.toLowerCase()));
    }
  }

  /**
   * Filter to only valid image paths
   */
  filterValidImages(resolvedPaths: ResolvedImagePath[]): ResolvedImagePath[] {
    if (stryMutAct_9fa48("1000")) {
      {}
    } else {
      stryCov_9fa48("1000");
      return stryMutAct_9fa48("1001") ? resolvedPaths : (stryCov_9fa48("1001"), resolvedPaths.filter(stryMutAct_9fa48("1002") ? () => undefined : (stryCov_9fa48("1002"), path => this.validateImagePath(path))));
    }
  }

  /**
   * Get file statistics for resolved paths
   */
  getFileStats(resolvedPaths: ResolvedImagePath[]): Array<ResolvedImagePath & {
    size: number;
  }> {
    if (stryMutAct_9fa48("1003")) {
      {}
    } else {
      stryCov_9fa48("1003");
      return stryMutAct_9fa48("1004") ? resolvedPaths.map(path => path as ResolvedImagePath & {
        size: number;
      }) : (stryCov_9fa48("1004"), resolvedPaths.filter(stryMutAct_9fa48("1005") ? () => undefined : (stryCov_9fa48("1005"), path => stryMutAct_9fa48("1008") ? path.exists || path.size !== undefined : stryMutAct_9fa48("1007") ? false : stryMutAct_9fa48("1006") ? true : (stryCov_9fa48("1006", "1007", "1008"), path.exists && (stryMutAct_9fa48("1010") ? path.size === undefined : stryMutAct_9fa48("1009") ? true : (stryCov_9fa48("1009", "1010"), path.size !== undefined))))).map(stryMutAct_9fa48("1011") ? () => undefined : (stryCov_9fa48("1011"), path => path as ResolvedImagePath & {
        size: number;
      })));
    }
  }
  private calculateStats(resolved: ResolvedImagePath[], failed: Array<{
    originalPath: string;
    error: string;
  }>): PathResolutionResult["stats"] {
    if (stryMutAct_9fa48("1012")) {
      {}
    } else {
      stryCov_9fa48("1012");
      const withinVault = stryMutAct_9fa48("1013") ? resolved.length : (stryCov_9fa48("1013"), resolved.filter(stryMutAct_9fa48("1014") ? () => undefined : (stryCov_9fa48("1014"), p => p.withinVault)).length);
      return stryMutAct_9fa48("1015") ? {} : (stryCov_9fa48("1015"), {
        total: stryMutAct_9fa48("1016") ? resolved.length - failed.length : (stryCov_9fa48("1016"), resolved.length + failed.length),
        resolved: resolved.length,
        failed: failed.length,
        withinVault,
        outsideVault: stryMutAct_9fa48("1017") ? resolved.length + withinVault : (stryCov_9fa48("1017"), resolved.length - withinVault)
      });
    }
  }

  /**
   * Check if a path is safe (doesn't escape the vault)
   */
  isPathSafe(imagePath: string, sourceFilePath: string): boolean {
    if (stryMutAct_9fa48("1018")) {
      {}
    } else {
      stryCov_9fa48("1018");
      const resolvedPath = path.resolve(path.dirname(sourceFilePath), imagePath);
      return stryMutAct_9fa48("1019") ? resolvedPath.endsWith(this.vaultPath) : (stryCov_9fa48("1019"), resolvedPath.startsWith(this.vaultPath));
    }
  }
}