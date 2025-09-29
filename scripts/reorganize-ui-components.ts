#!/usr/bin/env tsx

import {
  readdirSync,
  mkdirSync,
  renameSync,
  writeFileSync,
  readFileSync,
} from "fs";
import { join, parse, relative } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = parse(__filename).dir;

const UI_COMPONENTS_DIR = join(process.cwd(), "apps/rag_editor/components/ui");

function updateImportPaths(filePath: string, componentDirs: string[]) {
  let content = readFileSync(filePath, "utf-8");
  let updated = false;

  // Update relative imports that point to other UI components
  const importRegex = /import\s+{[^}]+}\s+from\s+['"`](\.\.?\/[^'"`]+)['"`]/g;

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
    /import\s+{\s*([^}]+)\s*}\s+from\s+['"`](\.\.?\/[^'"`]+)['"`]/g;

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
    console.log(`  ✓ Updated imports in: ${filePath}`);
  }
}

function reorganizeUIComponents() {
  console.log("Reorganizing UI components...");

  // Get all files in the ui directory
  const files = readdirSync(UI_COMPONENTS_DIR);

  // Filter for .tsx and .ts files
  const componentFiles = files.filter(
    (file) =>
      (file.endsWith(".tsx") || file.endsWith(".ts")) && !file.includes("index") // Skip any existing index files
  );

  console.log(`Found ${componentFiles.length} component files to reorganize`);

  // Get component names for import path updates
  const componentDirs = componentFiles.map((file) => parse(file).name);

  for (const file of componentFiles) {
    const filePath = join(UI_COMPONENTS_DIR, file);
    const parsedFile = parse(file);
    const componentName = parsedFile.name; // filename without extension
    const componentDir = join(UI_COMPONENTS_DIR, componentName);

    console.log(`Processing: ${componentName}`);

    // Create component directory
    mkdirSync(componentDir, { recursive: true });

    // Move the component file to the new directory
    const newFilePath = join(componentDir, file);
    renameSync(filePath, newFilePath);

    // Update import paths in the moved file
    updateImportPaths(newFilePath, componentDirs);

    // Create index.tsx file
    const indexContent = `export { default } from './${file}';
export * from './${file}';
`;
    writeFileSync(join(componentDir, "index.tsx"), indexContent);

    // Create [componentName].module.scss file (empty initially)
    writeFileSync(join(componentDir, `${componentName}.module.scss`), "");

    console.log(`  ✓ Created folder: ${componentName}/`);
    console.log(`  ✓ Moved: ${file} → ${componentName}/${file}`);
    console.log(`  ✓ Created: ${componentName}/index.tsx`);
    console.log(`  ✓ Created: ${componentName}/${componentName}.module.scss`);
  }

  console.log("\n✅ Reorganization complete!");
  console.log(`Processed ${componentFiles.length} components`);
}

// Run the script
reorganizeUIComponents();
