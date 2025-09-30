/**
 * Dictionary Routes
 *
 * Handles dictionary-related API endpoints for term lookup,
 * canonicalization, and semantic expansion.
 */

import { FastifyInstance } from "fastify";

export function registerDictionaryRoutes(server: FastifyInstance): void {
  const dictionaryAPI = server.services.dictionaryAPI;

  if (!dictionaryAPI) {
    console.warn(
      "⚠️ Dictionary API not available, skipping route registration"
    );
    return;
  }

  // Register the dictionary API plugin
  server.register(dictionaryAPI.getPlugin(), { prefix: "/api/dictionary" });

  console.log("📚 Dictionary routes registered");
}
