/**
 * Component Token Accessibility Validator
 * 
 * Validates individual component token files for accessibility compliance
 */

import { validateColorPair, type ColorPair, type ValidationResult, WCAG_LEVELS, type WCAGLevel } from './tokenValidator';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

export interface ComponentTokenValidation {
  componentName: string;
  filePath: string;
  colorPairs: ColorPair[];
  results: ValidationResult[];
  isValid: boolean;
  issues: string[];
}

/**
 * Component-specific color pair patterns
 * Maps component anatomy to expected color relationships
 */
const COMPONENT_COLOR_PATTERNS = {
  // Text-based components
  text: [
    { fg: 'color', bg: 'background', context: 'Text color on background', level: 'AA_NORMAL' as WCAGLevel },
  ],
  
  // Interactive components
  button: [
    { fg: 'color', bg: 'background', context: 'Button text on button background', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorHover', bg: 'backgroundHover', context: 'Button text on hover background', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorDisabled', bg: 'backgroundDisabled', context: 'Disabled button text', level: 'AA_LARGE' as WCAGLevel },
  ],
  
  // Input components
  input: [
    { fg: 'color', bg: 'background', context: 'Input text color', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'placeholder', bg: 'background', context: 'Placeholder text', level: 'AA_LARGE' as WCAGLevel },
    { fg: 'colorFocused', bg: 'backgroundFocused', context: 'Focused input text', level: 'AA_NORMAL' as WCAGLevel },
  ],
  
  // Card/container components
  card: [
    { fg: 'color', bg: 'background', context: 'Card text on card background', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorSecondary', bg: 'background', context: 'Secondary card text', level: 'AA_NORMAL' as WCAGLevel },
  ],
  
  // Status components
  alert: [
    { fg: 'color', bg: 'background', context: 'Alert text on alert background', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorIcon', bg: 'background', context: 'Alert icon color', level: 'AA_NORMAL' as WCAGLevel },
  ],
  
  // Navigation components
  navigation: [
    { fg: 'color', bg: 'background', context: 'Navigation text', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorActive', bg: 'backgroundActive', context: 'Active navigation item', level: 'AA_NORMAL' as WCAGLevel },
    { fg: 'colorHover', bg: 'backgroundHover', context: 'Hovered navigation item', level: 'AA_NORMAL' as WCAGLevel },
  ],
};

/**
 * Extracts color pairs from a component token file
 */
function extractComponentColorPairs(tokenFilePath: string, componentName: string): ColorPair[] {
  const pairs: ColorPair[] = [];
  
  try {
    const tokenContent = fs.readFileSync(tokenFilePath, 'utf8');
    const tokenData = JSON.parse(tokenContent);
    const tokens = tokenData.tokens || {};
    
    // Determine component type from name or tokens
    const componentType = inferComponentType(componentName, tokens);
    const patterns = COMPONENT_COLOR_PATTERNS[componentType] || [];
    
    // Extract color pairs based on patterns
    patterns.forEach(pattern => {
      const fgToken = findTokenValue(tokens, pattern.fg);
      const bgToken = findTokenValue(tokens, pattern.bg);
      
      if (fgToken && bgToken && isColorValue(fgToken) && isColorValue(bgToken)) {
        pairs.push({
          foreground: resolveColorValue(fgToken),
          background: resolveColorValue(bgToken),
          context: `${componentName}: ${pattern.context}`,
          requiredLevel: pattern.level,
        });
      }
    });
    
    // Also check for common color + background combinations
    const commonPairs = extractCommonColorPairs(tokens, componentName);
    pairs.push(...commonPairs);
    
  } catch (error) {
    console.warn(`Warning: Could not parse component tokens for ${componentName}:`, error.message);
  }
  
  return pairs;
}

/**
 * Infers component type from name and tokens
 */
function inferComponentType(componentName: string, tokens: any): keyof typeof COMPONENT_COLOR_PATTERNS {
  const name = componentName.toLowerCase();
  
  if (name.includes('button')) return 'button';
  if (name.includes('input') || name.includes('textarea') || name.includes('field')) return 'input';
  if (name.includes('card')) return 'card';
  if (name.includes('alert') || name.includes('toast') || name.includes('notification')) return 'alert';
  if (name.includes('nav') || name.includes('menu') || name.includes('tab')) return 'navigation';
  
  // Default to text for unknown components
  return 'text';
}

/**
 * Finds a token value by key (supports nested keys)
 */
function findTokenValue(tokens: any, key: string): string | null {
  // Direct key lookup
  if (tokens[key]) return tokens[key];
  
  // Nested lookup for common patterns
  const nestedPaths = [
    key,
    `container.${key}`,
    `text.${key}`,
    `background.${key}`,
    `foreground.${key}`,
    `primary.${key}`,
    `secondary.${key}`,
  ];
  
  for (const path of nestedPaths) {
    const value = getNestedValue(tokens, path);
    if (value) return value;
  }
  
  return null;
}

/**
 * Gets nested object value by dot notation path
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Checks if a value represents a color
 */
function isColorValue(value: string): boolean {
  // Check for hex colors
  if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(value)) return true;
  
  // Check for design token references
  if (value.startsWith('{') && value.endsWith('}')) return true;
  
  // Check for CSS color functions
  if 