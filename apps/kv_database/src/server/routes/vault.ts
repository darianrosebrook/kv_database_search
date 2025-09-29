/**
 * Vault Routes
 *
 * Handles file system operations and vault management endpoints.
 */

import { FastifyInstance } from "fastify";
import * as fs from "fs";
import * as path from "path";

/**
 * Register vault routes
 */
export function registerVaultRoutes(server: FastifyInstance): void {
  /**
   * Vault files endpoint
   */
  server.get("/api/vault/files", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const {
      folder,
      recursive = false,
      limit = 100,
    } = request.query as {
      folder?: string;
      recursive?: boolean;
      limit?: number;
    };

    try {
      const files = await ingestionPipeline.listFiles(folder, {
        recursive,
        limit,
      });

      reply.code(200);
      return {
        files,
        total: files.length,
        folder: folder || "/",
        recursive,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault files listing failed:", error);
      reply.code(500);
      return {
        files: [],
        total: 0,
        folder: folder || "/",
        recursive,
        error: error.message,
      };
    }
  });

  /**
   * Vault file read endpoint
   */
  server.get("/api/vault/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];

    try {
      const content = await ingestionPipeline.readFile(filePath);

      reply.code(200);
      return {
        path: filePath,
        content,
        size: content.length,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault file read failed:", error);
      reply.code(404);
      return {
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * Vault file write endpoint
   */
  server.post("/api/vault/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];
    const { content } = request.body as { content: string };

    try {
      const result = await ingestionPipeline.writeFile(filePath, content);

      reply.code(200);
      return {
        success: true,
        path: filePath,
        message: result.message,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault file write failed:", error);
      reply.code(500);
      return {
        success: false,
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * Vault file delete endpoint
   */
  server.delete("/api/vault/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];

    try {
      const result = await ingestionPipeline.deleteFile(filePath);

      reply.code(200);
      return {
        success: true,
        path: filePath,
        message: result.message,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault file delete failed:", error);
      reply.code(500);
      return {
        success: false,
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * Vault directory creation endpoint
   */
  server.post("/api/vault/directory/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const dirPath = (request.params as any)["*"];

    try {
      const result = await ingestionPipeline.createDirectory(dirPath);

      reply.code(200);
      return {
        success: true,
        path: dirPath,
        message: result.message,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault directory creation failed:", error);
      reply.code(500);
      return {
        success: false,
        path: dirPath,
        error: error.message,
      };
    }
  });

  /**
   * Vault search endpoint
   */
  server.post("/api/vault/search", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const {
      query,
      folder,
      fileTypes,
      limit = 50,
    } = request.body as {
      query: string;
      folder?: string;
      fileTypes?: string[];
      limit?: number;
    };

    try {
      const results = await ingestionPipeline.searchFiles(query, {
        folder,
        fileTypes,
        limit,
      });

      reply.code(200);
      return {
        query,
        results,
        total: results.length,
        folder,
        fileTypes,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Vault search failed:", error);
      reply.code(500);
      return {
        query,
        results: [],
        total: 0,
        folder,
        fileTypes,
        error: error.message,
      };
    }
  });

  /**
   * Recent documents endpoint
   */
  server.get("/api/recent-documents", async (request, reply) => {
    const { database } = request.server.services;
    const { limit = 20, days = 7 } = request.query as {
      limit?: number;
      days?: number;
    };

    try {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const recentDocs = await database.getRecentDocuments(limit, since);

      reply.code(200);
      return {
        documents: recentDocs,
        total: recentDocs.length,
        since: since.toISOString(),
        days,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Recent documents fetch failed:", error);
      reply.code(500);
      return {
        documents: [],
        total: 0,
        since: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        days,
        error: error.message,
      };
    }
  });
}
