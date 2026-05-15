/**
 * Workspace Routes
 *
 * Handles workspace CRUD operations and management endpoints.
 */

import { FastifyInstance } from "fastify";

/**
 * Register workspace routes
 */
export function registerWorkspaceRoutes(server: FastifyInstance): void {
  /**
   * List all workspaces
   */
  server.get("/api/workspaces", async (request, reply) => {
    const { workspaceManager } = request.server.services;

    if (!workspaceManager) {
      reply.code(503);
      return { workspaces: [], total: 0, error: "Workspace manager not available" };
    }

    try {
      const { type, status, owner } = request.query as {
        type?: string;
        status?: string;
        owner?: string;
      };

      let workspaces = await workspaceManager.listWorkspaces();

      if (type) {
        workspaces = workspaces.filter((ws) => ws.type.category === type);
      }
      if (status) {
        workspaces = workspaces.filter((ws) => ws.status.current === status);
      }
      if (owner) {
        workspaces = workspaces.filter((ws) =>
          ws.permissions.owner.includes(owner)
        );
      }

      reply.code(200);
      return { workspaces, total: workspaces.length };
    } catch (e) {
      const error = e as Error;
      console.error("Workspace listing failed:", error);
      reply.code(500);
      return { workspaces: [], total: 0, error: error.message };
    }
  });

  /**
   * Get a single workspace by name or ID
   */
  server.get("/api/workspaces/:identifier", async (request, reply) => {
    const { workspaceManager } = request.server.services;

    if (!workspaceManager) {
      reply.code(503);
      return { error: "Workspace manager not available" };
    }

    const { identifier } = request.params as { identifier: string };

    try {
      const workspace = await workspaceManager.getWorkspace(identifier);

      if (!workspace) {
        reply.code(404);
        return { error: `Workspace '${identifier}' not found` };
      }

      reply.code(200);
      return { workspace };
    } catch (e) {
      const error = e as Error;
      console.error("Get workspace failed:", error);
      reply.code(500);
      return { error: error.message };
    }
  });

  /**
   * Create a new workspace
   */
  server.post("/api/workspaces", async (request, reply) => {
    const { workspaceManager } = request.server.services;

    if (!workspaceManager) {
      reply.code(503);
      return { error: "Workspace manager not available" };
    }

    const { name, description, type, owner } = request.body as {
      name?: string;
      description?: string;
      type?: {
        category?: string;
        subtype?: string;
        scope?: string;
        domain?: string;
      };
      owner?: string;
    };

    if (!name || !description) {
      reply.code(400);
      return { error: "Name and description are required" };
    }

    try {
      const workspaceType = {
        category: (type?.category as any) || "personal",
        subtype: type?.subtype || "default",
        scope: (type?.scope as any) || "private",
        domain: type?.domain || "general",
        restrictions: [],
      };

      const workspace = await workspaceManager.createWorkspace(
        name,
        description,
        workspaceType,
        owner || "default"
      );

      reply.code(201);
      return { workspace };
    } catch (e) {
      const error = e as Error;
      console.error("Create workspace failed:", error);

      if (error.message.includes("already exists")) {
        reply.code(409);
        return { error: error.message };
      }

      reply.code(500);
      return { error: error.message };
    }
  });

  /**
   * Update a workspace
   */
  server.put("/api/workspaces/:identifier", async (request, reply) => {
    const { workspaceManager } = request.server.services;

    if (!workspaceManager) {
      reply.code(503);
      return { error: "Workspace manager not available" };
    }

    const { identifier } = request.params as { identifier: string };
    const updates = request.body as Record<string, unknown>;

    if (!updates || Object.keys(updates).length === 0) {
      reply.code(400);
      return { error: "Updates are required" };
    }

    try {
      const workspace = await workspaceManager.updateWorkspace(
        identifier,
        updates as any
      );

      reply.code(200);
      return { workspace };
    } catch (e) {
      const error = e as Error;
      console.error("Update workspace failed:", error);

      if (error.message.includes("not found")) {
        reply.code(404);
        return { error: error.message };
      }

      reply.code(500);
      return { error: error.message };
    }
  });

  /**
   * Delete a workspace
   */
  server.delete("/api/workspaces/:identifier", async (request, reply) => {
    const { workspaceManager } = request.server.services;

    if (!workspaceManager) {
      reply.code(503);
      return { error: "Workspace manager not available" };
    }

    const { identifier } = request.params as { identifier: string };

    try {
      await workspaceManager.deleteWorkspace(identifier);

      reply.code(200);
      return { success: true };
    } catch (e) {
      const error = e as Error;
      console.error("Delete workspace failed:", error);

      if (error.message.includes("not found")) {
        reply.code(404);
        return { error: error.message };
      }

      reply.code(500);
      return { error: error.message };
    }
  });

  /**
   * Get workspace statistics
   */
  server.get(
    "/api/workspaces/:identifier/statistics",
    async (request, reply) => {
      const { workspaceManager } = request.server.services;

      if (!workspaceManager) {
        reply.code(503);
        return { error: "Workspace manager not available" };
      }

      const { identifier } = request.params as { identifier: string };

      try {
        const statistics =
          await workspaceManager.getWorkspaceStatistics(identifier);

        reply.code(200);
        return { identifier, statistics };
      } catch (e) {
        const error = e as Error;
        console.error("Get workspace statistics failed:", error);
        reply.code(500);
        return { error: error.message };
      }
    }
  );
}
