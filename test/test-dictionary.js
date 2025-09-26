const {
  ObsidianDatabase,
} = require("./dist/apps/kv_database/src/lib/database");
const fs = require("fs");
const path = require("path");

// Try to load the dictionary service source directly
try {
  const dictionaryServicePath =
    "./apps/kv_database/src/lib/dictionary-service.ts";
  const dictionaryApiPath = "./apps/kv_database/src/lib/dictionary-api.ts";

  if (fs.existsSync(dictionaryServicePath)) {
    console.log("✅ Dictionary service source exists");
  } else {
    console.log("❌ Dictionary service source not found");
  }

  if (fs.existsSync(dictionaryApiPath)) {
    console.log("✅ Dictionary API source exists");
  } else {
    console.log("❌ Dictionary API source not found");
  }

  // Try to read the dictionary service to see if it's valid
  const dictionaryServiceContent = fs.readFileSync(
    dictionaryServicePath,
    "utf8"
  );
  console.log("✅ Dictionary service file is readable");
  console.log(
    "📊 Dictionary service file size:",
    dictionaryServiceContent.length,
    "characters"
  );

  // Check if it has the expected exports
  if (dictionaryServiceContent.includes("export class DictionaryService")) {
    console.log("✅ DictionaryService class found");
  } else {
    console.log("❌ DictionaryService class not found");
  }

  if (dictionaryServiceContent.includes("async lookupTerms")) {
    console.log("✅ lookupTerms method found");
  } else {
    console.log("❌ lookupTerms method not found");
  }
} catch (error) {
  console.error("❌ Error reading dictionary files:", error.message);
}
