import fs from 'fs';
import path from 'path';

// Mapping of common Tailwind classes to CSS properties using design tokens
const tailwindToCssMap = {
  // Layout
  'flex': 'display: flex;',
  'inline-flex': 'display: inline-flex;',
  'grid': 'display: grid;',
  
  'flex-col': 'flex-direction: column;',
  'flex-row': 'flex-direction: row;',
  
  'items-center': 'align-items: center;',
  'justify-center': 'justify-content: center;',
  
  // Spacing
  'gap-1': 'gap: 0.25rem;',
  'gap-1.5': 'gap: 0.375rem;',
  'gap-3': 'gap: 0.75rem;',
  'gap-6': 'gap: 1.5rem;',
  
  'p-3': 'padding: 0.75rem;',
  'px-3': 'padding-left: 0.75rem; padding-right: 0.75rem;',
  'px-4': 'padding-left: 1rem; padding-right: 1rem;',
  'py-1': 'padding-top: 0.25rem; padding-bottom: 0.25rem;',
  
  // Sizing
  'w-full': 'width: 100%;',
  'h-9': 'height: 2.25rem;',
  'h-7': 'height: 1.75rem;',
  'min-w-0': 'min-width: 0;',
  
  // Colors (using CSS variables)
  'bg-card': 'background-color: var(--card);',
  'bg-background': 'background-color: var(--background);',
  'bg-transparent': 'background-color: transparent;',
  'bg-input': 'background-color: var(--input);',
  
  'text-card-foreground': 'color: var(--card-foreground);',
  'text-muted-foreground': 'color: var(--muted-foreground);',
  'text-foreground': 'color: var(--foreground);',
  
  'border': 'border: 1px solid var(--border);',
  'border-input': 'border-color: var(--input);',
  'border-destructive': 'border-color: var(--destructive);',
  
  // Border radius
  'rounded-md': 'border-radius: var(--radius-md);',
  'rounded-lg': 'border-radius: var(--radius-lg);',
  
  // Typography
  'text-sm': 'font-size: 0.875rem;',
  'text-base': 'font-size: 1rem;',
  'font-medium': 'font-weight: 500;',
  
  // Shadows
  'shadow-xs': 'box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);',
  
  // Interactions
  'transition-all': 'transition: all 0.2s ease-in-out;',
  'transition-colors': 'transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out, border-color 0.2s ease-in-out;',
  
  'outline-none': 'outline: none;',
  
  'disabled:pointer-events-none': '&:disabled { pointer-events: none; }',
  'disabled:cursor-not-allowed': '&:disabled { cursor: not-allowed; }',
  'disabled:opacity-50': '&:disabled { opacity: 0.5; }',
  
  // Focus states
  'focus-visible:border-ring': '&:focus-visible { border-color: var(--ring); }',
  'focus-visible:ring-ring/50': '&:focus-visible { outline: 3px solid color-mix(in srgb, var(--ring) 50%, transparent); }',
  'focus-visible:ring-[3px]': '&:focus-visible { outline: 3px solid color-mix(in srgb, var(--ring) 50%, transparent); }',
  
  // Aria invalid states
  'aria-invalid:ring-destructive/20': '&[aria-invalid="true"] { outline: 3px solid color-mix(in srgb, var(--destructive) 20%, transparent); }',
  'aria-invalid:border-destructive': '&[aria-invalid="true"] { border-color: var(--destructive); }',
};

function convertTailwindToScss(componentName, tailwindClasses) {
  const scssRules = [];
  const pseudoRules = {};
  
  tailwindClasses.forEach(className => {
    if (tailwindToCssMap[className]) {
      let css = tailwindToCssMap[className];
      
      // Handle pseudo-classes
      if (css.includes('&:')) {
        const pseudoMatch = css.match(/&(:[^\s{]+)\s*{\s*([^}]+)\s*}/);
        if (pseudoMatch) {
          const pseudo = pseudoMatch[1];
          const rule = pseudoMatch[2];
          if (!pseudoRules[pseudo]) pseudoRules[pseudo] = [];
          pseudoRules[pseudo].push(rule);
        }
      } else {
        scssRules.push(css);
      }
    }
  });
  
  let scss = `.${componentName} {\n`;
  scss += scssRules.map(rule => `  ${rule}`).join('\n');
  
  Object.entries(pseudoRules).forEach(([pseudo, rules]) => {
    scss += `\n\n  ${pseudo} {\n`;
    scss += rules.map(rule => `    ${rule}`).join('\n');
    scss += '\n  }';
  });
  
  scss += '\n}\n';
  
  return scss;
}

function extractTailwindClasses(content) {
  const classes = [];
  
  // Match className={cn(...)} patterns with multiple arguments
  const cnRegex = /className=\{cn\(([\s\S]*?)\)\}/g;
  let match;
  while ((match = cnRegex.exec(content)) !== null) {
    const args = match[1];
    // Split by commas but be careful about nested structures
    const parts = args.split(',').map(part => part.trim());
    
    parts.forEach(part => {
      // Remove quotes and extract class names
      const cleanPart = part.replace(/['"]/g, '').trim();
      if (cleanPart && !cleanPart.startsWith('className') && !cleanPart.includes('...') && !cleanPart.includes('${')) {
        const classArray = cleanPart.split(/\s+/).filter(cls => cls.trim());
        classes.push(...classArray);
      }
    });
  }
  
  return [...new Set(classes)]; // Remove duplicates
}

// Main conversion function
function convertComponent(componentPath) {
  const componentName = path.basename(componentPath);
  const tsxPath = path.join(componentPath, `${componentName}.tsx`);
  const scssPath = path.join(componentPath, `${componentName}.module.scss`);
  
  if (!fs.existsSync(tsxPath)) {
    console.log(`Skipping ${componentPath} - no TSX file found`);
    return;
  }
  
  const content = fs.readFileSync(tsxPath, 'utf8');
  const classes = extractTailwindClasses(content);
  
  console.log(`Found ${classes.length} classes for ${componentName}:`, classes.slice(0, 10), classes.length > 10 ? '...' : '');
  
  if (classes.length === 0) {
    console.log(`No Tailwind classes found in ${tsxPath}`);
    return;
  }
  
  const scss = convertTailwindToScss(componentName, classes);
  
  fs.writeFileSync(scssPath, scss);
  console.log(`Generated SCSS for ${componentName}`);
}

// CLI usage
const componentPath = process.argv[2];
if (!componentPath) {
  console.log('Usage: node scripts/convert-tailwind-to-scss.js <component-path>');
  process.exit(1);
}

convertComponent(componentPath);
