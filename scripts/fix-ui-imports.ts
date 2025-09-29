#!/usr/bin/env tsx

import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join, parse } from "path";

const UI_COMPONENTS_DIR = join(process.cwd(), "apps/rag_editor/components/ui");

function fixImportPaths() {
  console.log("Fixing import paths in UI components...");

  // Get all component directories
  const componentDirs = readdirSync(UI_COMPONENTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`Found ${componentDirs.length} component directories`);

  let processedCount = 0;
  let updatedCount = 0;

  for (const componentDir of componentDirs) {
    const componentPath = join(UI_COMPONENTS_DIR, componentDir);
    const componentFile = readdirSync(componentPath).find(
      (file) => file.endsWith(".tsx") || file.endsWith(".ts")
    );

    if (!componentFile || componentFile === "index.tsx") continue;

    const filePath = join(componentPath, componentFile);
    processedCount++;

    const wasUpdated = updateImportPaths(filePath, componentDirs);
    if (wasUpdated) {
      updatedCount++;
      console.log(`  ✓ Updated imports in: ${componentDir}/${componentFile}`);
    }
  }

  console.log(`\n✅ Import path fixes complete!`);
  console.log(
    `Processed ${processedCount} files, updated ${updatedCount} files`
  );
}

function updateImportPaths(filePath: string, componentDirs: string[]): boolean {
  let content = readFileSync(filePath, "utf-8");
  let updated = false;

  // Update relative imports that point to other UI components
  // Handle patterns like: import { Button } from './button'
  const importRegex = /import\s+{[^}]+}\s+from\s+['"`](\.\/[^'"`]+)['"`]/g;

  content = content.replace(importRegex, (match, importPath) => {
    // Check if this import points to a component that was moved to a folder
    const targetComponent = importPath.split("/").pop(); // Get the last part
    if (componentDirs.includes(targetComponent)) {
      // Update the import path to point to the parent directory (since we're now in a subfolder)
      const newImportPath = "../" + targetComponent;
      updated = true;
      return match.replace(importPath, newImportPath);
    }
    return match;
  });

  // Also handle single named imports like: import { Button } from './button'
  const singleImportRegex =
    /import\s+{\s*([^}]+)\s*}\s+from\s+['"`](\.\/[^'"`]+)['"`]/g;

  content = content.replace(singleImportRegex, (match, imports, importPath) => {
    const targetComponent = importPath.split("/").pop();
    if (componentDirs.includes(targetComponent)) {
      const newImportPath = "../" + targetComponent;
      updated = true;
      return match.replace(importPath, newImportPath);
    }
    return match;
  });

  if (updated) {
    writeFileSync(filePath, content, "utf-8");
  }

  return updated;
}

// Run the script
fixImportPaths();
