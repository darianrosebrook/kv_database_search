import { setupTestDatabase, teardownTestDatabase } from "./setup";

// Global setup for all tests
export async function setup() {
  console.log("🚀 Setting up test database...");
  await setupTestDatabase();
  console.log("✅ Test database ready");
}

export async function teardown() {
  console.log("🛑 Tearing down test database...");
  await teardownTestDatabase();
  console.log("✅ Test database cleaned up");
}
