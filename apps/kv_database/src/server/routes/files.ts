/**
 * File Routes
 *
 * Handles file system operations on the indexed document directory.
 */

import { FastifyInstance } from "fastify";

/**
 * Register file routes
 */
export function registerFileRoutes(server: FastifyInstance): void {
  /**
   * Files endpoint
   */
  server.get("/api/files", async (request, reply) => {
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

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        files: [],
        total: 0,
        folder: folder || "/",
        recursive,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("Files listing failed:", error);
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
   * File read endpoint
   */
  server.get("/api/files/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        path: filePath,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("File read failed:", error);
      reply.code(404);
      return {
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * File write endpoint
   */
  server.post("/api/files/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];
    const { content } = request.body as { content: string };

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        success: false,
        path: filePath,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("File write failed:", error);
      reply.code(500);
      return {
        success: false,
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * File delete endpoint
   */
  server.delete("/api/files/file/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const filePath = (request.params as any)["*"];

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        success: false,
        path: filePath,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("File delete failed:", error);
      reply.code(500);
      return {
        success: false,
        path: filePath,
        error: error.message,
      };
    }
  });

  /**
   * Directory creation endpoint
   */
  server.post("/api/files/directory/*", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const dirPath = (request.params as any)["*"];

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        success: false,
        path: dirPath,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("Directory creation failed:", error);
      reply.code(500);
      return {
        success: false,
        path: dirPath,
        error: error.message,
      };
    }
  });

  /**
   * File search endpoint
   */
  server.post("/api/files/search", async (request, reply) => {
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

    // Check if ingestion pipeline is available
    if (!ingestionPipeline) {
      reply.code(503);
      return {
        query,
        results: [],
        total: 0,
        folder,
        fileTypes,
        error: "Ingestion pipeline not available",
      };
    }

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
      console.error("File search failed:", error);
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
