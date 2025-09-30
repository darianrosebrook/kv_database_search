/**
 * Main Server Entry Point
 *
 * Orchestrates all server components: routes, services, and startup.
 */

import { createServer, initializeServer, startServer } from "./bootstrap.js";
import { registerSearchRoutes } from "./routes/search.js";
import { registerHealthRoutes } from "./routes/health.js";
import { registerIngestionRoutes } from "./routes/ingestion.js";
import { registerVaultRoutes } from "./routes/vault.js";
import { registerDictionaryRoutes } from "./routes/dictionary.js";

/**
 * Initialize and start the complete server
 */
export async function startMainServer(): Promise<void> {
  try {
    // Create Fastify server instance
    const server = await createServer();

    // Initialize services
    await initializeServer(server);

    // Register all route modules
    registerHealthRoutes(server);
    registerSearchRoutes(server);
    registerIngestionRoutes(server);
    registerVaultRoutes(server);

    // Register dictionary routes
    registerDictionaryRoutes(server);

    // TODO: Register additional route modules as they are extracted:
    // registerChatRoutes(server);
    // registerWebSearchRoutes(server);
    // registerGraphRoutes(server);
    // registerWorkspaceRoutes(server);
    // registerFederatedSearchRoutes(server);
    // registerTemporalRoutes(server);
    // registerMLRoutes(server);

    // Start the server
    await startServer(server);
  } catch (error) {
    console.error("❌ Failed to start main server:", error);
    process.exit(1);
  }
}

// Start the server if this file is run directly (ES module equivalent)
if (import.meta.url === `file://${process.argv[1]}`) {
  startMainServer().catch(console.error);
}
