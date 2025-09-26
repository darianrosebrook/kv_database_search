import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  ImagePathResolver,
  ResolvedImagePath,
  PathResolutionResult,
} from "../../src/lib/image-path-resolver";
import * as fs from "fs";
import * as path from "path";

// Mock fs module
vi.mock("fs", () => ({
  default: {
    statSync: vi.fn(),
    existsSync: vi.fn(),
  },
  statSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("ImagePathResolver", () => {
  let resolver: ImagePathResolver;
  const vaultPath = "/test/vault";

  beforeEach(() => {
    resolver = new ImagePathResolver(vaultPath);
    vi.clearAllMocks();
  });

  describe("resolvePaths", () => {
    it("should resolve absolute paths", () => {
      const imagePaths = ["/test/vault/images/test.png"];
      const sourceFilePath = "/test/vault/notes/document.md";

      // Mock file exists
      fs.statSync.mockReturnValue({ size: 1024 });
      fs.existsSync.mockReturnValue(true);

      const result = resolver.resolvePaths(imagePaths, sourceFilePath);

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].originalPath).toBe(
        "/test/vault/images/test.png"
      );
      expect(result.resolved[0].resolvedPath).toBe(
        "/test/vault/images/test.png"
      );
      expect(result.resolved[0].exists).toBe(true);
      expect(result.resolved[0].withinVault).toBe(true);
      expect(result.stats.resolved).toBe(1);
    });

    it("should handle missing files", () => {
      const imagePaths = ["missing.png"];
      const sourceFilePath = "/test/vault/notes/document.md";

      // Mock file doesn't exist in any location
      fs.existsSync.mockReturnValue(false);
      fs.statSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      const result = resolver.resolvePaths(imagePaths, sourceFilePath);

      expect(result.failed).toHaveLength(1);
      expect(result.failed[0].originalPath).toBe("missing.png");
      expect(result.failed[0].error).toContain("Could not resolve image path");
    });

    it("should resolve relative paths", () => {
      const imagePaths = ["images/screenshot.png"];
      const sourceFilePath = "/test/vault/notes/document.md";

      // Mock file exists at resolved location
      fs.statSync.mockReturnValue({ size: 2048 });
      fs.existsSync.mockImplementation((path: string) => {
        return path === "/test/vault/notes/images/screenshot.png";
      });

      const result = resolver.resolvePaths(imagePaths, sourceFilePath);

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].originalPath).toBe("images/screenshot.png");
      expect(result.resolved[0].resolvedPath).toBe(
        "/test/vault/notes/images/screenshot.png"
      );
      expect(result.resolved[0].exists).toBe(true);
    });
  });

  describe("validateImagePath", () => {
    it("should validate existing image files", () => {
      const resolvedPath: ResolvedImagePath = {
        originalPath: "test.png",
        resolvedPath: "/path/to/test.png",
        exists: true,
        size: 1024,
        extension: ".png",
        withinVault: true,
      };

      const isValid = resolver.validateImagePath(resolvedPath);
      expect(isValid).toBe(true);
    });

    it("should reject non-existent files", () => {
      const resolvedPath: ResolvedImagePath = {
        originalPath: "missing.png",
        resolvedPath: "/path/to/missing.png",
        exists: false,
        extension: ".png",
        withinVault: true,
      };

      const isValid = resolver.validateImagePath(resolvedPath);
      expect(isValid).toBe(false);
    });

    it("should reject empty files", () => {
      const resolvedPath: ResolvedImagePath = {
        originalPath: "empty.png",
        resolvedPath: "/path/to/empty.png",
        exists: true,
        size: 0,
        extension: ".png",
        withinVault: true,
      };

      const isValid = resolver.validateImagePath(resolvedPath);
      expect(isValid).toBe(false);
    });

    it("should reject files that are too large", () => {
      const resolvedPath: ResolvedImagePath = {
        originalPath: "large.png",
        resolvedPath: "/path/to/large.png",
        exists: true,
        size: 200 * 1024 * 1024, // 200MB
        extension: ".png",
        withinVault: true,
      };

      const isValid = resolver.validateImagePath(resolvedPath);
      expect(isValid).toBe(false);
    });

    it("should reject non-image files", () => {
      const resolvedPath: ResolvedImagePath = {
        originalPath: "document.pdf",
        resolvedPath: "/path/to/document.pdf",
        exists: true,
        size: 1024,
        extension: ".pdf",
        withinVault: true,
      };

      const isValid = resolver.validateImagePath(resolvedPath);
      expect(isValid).toBe(false);
    });
  });

  describe("filterValidImages", () => {
    it("should filter to only valid images", () => {
      const resolvedPaths: ResolvedImagePath[] = [
        {
          originalPath: "valid.png",
          resolvedPath: "/path/to/valid.png",
          exists: true,
          size: 1024,
          extension: ".png",
          withinVault: true,
        },
        {
          originalPath: "invalid.pdf",
          resolvedPath: "/path/to/invalid.pdf",
          exists: true,
          size: 1024,
          extension: ".pdf",
          withinVault: true,
        },
        {
          originalPath: "missing.jpg",
          resolvedPath: "/path/to/missing.jpg",
          exists: false,
          extension: ".jpg",
          withinVault: true,
        },
      ];

      const filtered = resolver.filterValidImages(resolvedPaths);

      expect(filtered).toHaveLength(1);
      expect(filtered[0].originalPath).toBe("valid.png");
    });
  });

  describe("getFileStats", () => {
    it("should return stats for existing files", () => {
      const resolvedPaths: ResolvedImagePath[] = [
        {
          originalPath: "file1.png",
          resolvedPath: "/path/to/file1.png",
          exists: true,
          size: 1024,
          extension: ".png",
          withinVault: true,
        },
        {
          originalPath: "file2.jpg",
          resolvedPath: "/path/to/file2.jpg",
          exists: true,
          size: 2048,
          extension: ".jpg",
          withinVault: true,
        },
        {
          originalPath: "missing.png",
          resolvedPath: "/path/to/missing.png",
          exists: false,
          extension: ".png",
          withinVault: true,
        },
      ];

      const stats = resolver.getFileStats(resolvedPaths);

      expect(stats).toHaveLength(2);
      expect(stats[0].size).toBe(1024);
      expect(stats[1].size).toBe(2048);
    });
  });

  describe("isPathSafe", () => {
    it("should allow paths within vault", () => {
      const sourceFilePath = "/test/vault/notes/document.md";
      const imagePath = "images/screenshot.png";

      const isSafe = resolver.isPathSafe(imagePath, sourceFilePath);
      expect(isSafe).toBe(true);
    });

    it("should reject paths that escape vault", () => {
      const sourceFilePath = "/test/vault/notes/document.md";
      const imagePath = "../../../outside-vault/image.png";

      const isSafe = resolver.isPathSafe(imagePath, sourceFilePath);
      expect(isSafe).toBe(false);
    });

    it("should allow absolute paths within vault", () => {
      const sourceFilePath = "/test/vault/notes/document.md";
      const imagePath = "/test/vault/images/screenshot.png";

      const isSafe = resolver.isPathSafe(imagePath, sourceFilePath);
      expect(isSafe).toBe(true);
    });
  });

  describe("common image directories", () => {
    it("should try common image directories when direct resolution fails", () => {
      const sourceFilePath = "/test/vault/notes/document.md";
      const imagePaths = ["screenshot.png"];

      // Mock that direct path doesn't exist, but attachments path does
      fs.existsSync.mockImplementation((path: string) => {
        return path === "/test/vault/attachments/screenshot.png";
      });
      fs.statSync.mockReturnValue({ size: 1024 });

      const result = resolver.resolvePaths(imagePaths, sourceFilePath);

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].resolvedPath).toBe(
        "/test/vault/attachments/screenshot.png"
      );
    });

    it("should try with common prefixes", () => {
      const sourceFilePath = "/test/vault/notes/document.md";
      const imagePaths = ["screenshot.png"];

      // Mock that direct path doesn't exist, but assets path does
      fs.existsSync.mockImplementation((path: string) => {
        return path === "/test/vault/notes/assets/screenshot.png";
      });
      fs.statSync.mockReturnValue({ size: 1024 });

      const result = resolver.resolvePaths(imagePaths, sourceFilePath);

      expect(result.resolved).toHaveLength(1);
      expect(result.resolved[0].resolvedPath).toBe(
        "/test/vault/notes/assets/screenshot.png"
      );
    });
  });

  describe("statistics calculation", () => {
    it("should calculate correct statistics", () => {
      const resolved: ResolvedImagePath[] = [
        {
          originalPath: "image1.png",
          resolvedPath: "/test/vault/image1.png",
          exists: true,
          size: 1024,
          extension: ".png",
          withinVault: true,
        },
        {
          originalPath: "image2.jpg",
          resolvedPath: "/outside/image2.jpg",
          exists: true,
          size: 2048,
          extension: ".jpg",
          withinVault: false,
        },
      ];

      const failed = [{ originalPath: "missing.png", error: "File not found" }];

      const stats = resolver.calculateStats(resolved, failed);

      expect(stats.total).toBe(3);
      expect(stats.resolved).toBe(2);
      expect(stats.failed).toBe(1);
      expect(stats.withinVault).toBe(1);
      expect(stats.outsideVault).toBe(1);
    });
  });
});
