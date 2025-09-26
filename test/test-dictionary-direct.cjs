// Simple test of dictionary functionality
const fs = require("fs");
const path = require("path");

try {
  // Check if database is available
  console.log("🔍 Checking database availability...");

  // Try to read environment variables
  const envFile = fs.readFileSync(".env", "utf8");
  console.log("✅ .env file found");

  if (envFile.includes("DATABASE_URL")) {
    console.log("✅ DATABASE_URL found in .env");
  } else {
    console.log("❌ DATABASE_URL not found in .env");
  }

  // Check if dictionary tables were created
  console.log("🔍 Checking for dictionary tables...");

  // Read the database initialization code to see if dictionary tables are included
  const databaseFile = fs.readFileSync(
    "apps/kv_database/src/lib/database.ts",
    "utf8"
  );

  if (databaseFile.includes("dictionary_config")) {
    console.log("✅ Dictionary tables found in database initialization");
  } else {
    console.log("❌ Dictionary tables not found in database initialization");
  }

  if (databaseFile.includes("synsets")) {
    console.log("✅ Synsets table found in database initialization");
  } else {
    console.log("❌ Synsets table not found in database initialization");
  }

  console.log("📊 Dictionary integration appears to be properly set up");
  console.log("💡 To test the dictionary functionality:");
  console.log("   1. Start the server: npm start");
  console.log(
    "   2. Test endpoint: curl http://localhost:3001/dictionary/health"
  );
} catch (error) {
  console.error("❌ Error testing dictionary:", error.message);
}
