/**
 * Ingestion Routes
 *
 * Handles data ingestion and processing endpoints.
 */

import { FastifyInstance } from "fastify";
import type { IngestRequest, IngestResponse } from "../../types/index";

/**
 * Register ingestion routes
 */
export function registerIngestionRoutes(server: FastifyInstance): void {
  /**
   * Ingestion endpoint
   */
  server.post("/ingest", async (request, reply): Promise<IngestResponse> => {
    const { ingestionPipeline } = request.server.services;
    const ingestRequest = request.body as IngestRequest;

    try {
      const result = await ingestionPipeline.ingest(ingestRequest);

      reply.code(200);
      return {
        success: true,
        documentsProcessed: result.documentsProcessed,
        chunksCreated: result.chunksCreated,
        embeddingsGenerated: result.embeddingsGenerated,
        processingTime: result.processingTime,
        message: result.message,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Ingestion failed:", error);
      reply.code(500);
      return {
        success: false,
        documentsProcessed: 0,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        processingTime: 0,
        error: error.message,
        message: "Ingestion failed",
      };
    }
  });

  /**
   * Incremental ingestion endpoint
   */
  server.post(
    "/ingest/incremental",
    async (request, reply): Promise<IngestResponse> => {
      const { ingestionPipeline } = request.server.services;
      const { path, recursive = true } = request.body as {
        path?: string;
        recursive?: boolean;
      };

      try {
        const result = await ingestionPipeline.ingestIncremental(path, {
          recursive,
        });

        reply.code(200);
        return {
          success: true,
          documentsProcessed: result.documentsProcessed,
          chunksCreated: result.chunksCreated,
          embeddingsGenerated: result.embeddingsGenerated,
          processingTime: result.processingTime,
          message: result.message,
        };
      } catch (e) {
        const error = e as Error;
        console.error("Incremental ingestion failed:", error);
        reply.code(500);
        return {
          success: false,
          documentsProcessed: 0,
          chunksCreated: 0,
          embeddingsGenerated: 0,
          processingTime: 0,
          error: error.message,
          message: "Incremental ingestion failed",
        };
      }
    }
  );

  /**
   * File status endpoint
   */
  server.get("/files/status/:path", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const { path } = request.params as { path: string };

    try {
      const status = await ingestionPipeline.getFileStatus(path);

      reply.code(200);
      return {
        path,
        status: status.status,
        lastModified: status.lastModified,
        lastProcessed: status.lastProcessed,
        checksum: status.checksum,
        needsUpdate: status.needsUpdate,
      };
    } catch (e) {
      const error = e as Error;
      console.error("File status check failed:", error);
      reply.code(500);
      return {
        path,
        status: "error",
        error: error.message,
      };
    }
  });

  /**
   * Changed files endpoint
   */
  server.get("/files/changed", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const { since } = request.query as { since?: string };

    try {
      const sinceDate = since
        ? new Date(since)
        : new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const changedFiles = await ingestionPipeline.getChangedFiles(sinceDate);

      reply.code(200);
      return {
        since: sinceDate.toISOString(),
        files: changedFiles,
        total: changedFiles.length,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Changed files check failed:", error);
      reply.code(500);
      return {
        since: since || new Date().toISOString(),
        files: [],
        total: 0,
        error: error.message,
      };
    }
  });

  /**
   * File versions endpoint
   */
  server.get("/files/versions/:path", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const { path } = request.params as { path: string };
    const { limit = 10 } = request.query as { limit?: number };

    try {
      const versions = await ingestionPipeline.getFileVersions(path, limit);

      reply.code(200);
      return {
        path,
        versions,
        total: versions.length,
      };
    } catch (e) {
      const error = e as Error;
      console.error("File versions check failed:", error);
      reply.code(500);
      return {
        path,
        versions: [],
        total: 0,
        error: error.message,
      };
    }
  });

  /**
   * Rollback file endpoint
   */
  server.post("/files/rollback/:path", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;
    const { path } = request.params as { path: string };
    const { version } = request.body as { version: string };

    try {
      const result = await ingestionPipeline.rollbackFile(path, version);

      reply.code(200);
      return {
        success: true,
        path,
        version,
        message: result.message,
      };
    } catch (e) {
      const error = e as Error;
      console.error("File rollback failed:", error);
      reply.code(500);
      return {
        success: false,
        path,
        version,
        error: error.message,
        message: "Rollback failed",
      };
    }
  });

  /**
   * Conflict status endpoint
   */
  server.get("/files/conflicts", async (request, reply) => {
    const { ingestionPipeline } = request.server.services;

    try {
      const conflicts = await ingestionPipeline.getConflicts();

      reply.code(200);
      return {
        conflicts,
        total: conflicts.length,
      };
    } catch (e) {
      const error = e as Error;
      console.error("Conflicts check failed:", error);
      reply.code(500);
      return {
        conflicts: [],
        total: 0,
        error: error.message,
      };
    }
  });
}
