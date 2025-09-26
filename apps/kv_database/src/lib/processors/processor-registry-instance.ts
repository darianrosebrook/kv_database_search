/**
 * Singleton instance of the processor registry
 * 
 * This file is separate from processor-registry.ts to avoid circular dependencies
 * that can occur when processors import from multi-modal.ts which imports the registry.
 * 
 * @author @darianrosebrook
 */

import { ContentProcessorRegistry } from "./processor-registry";

/**
 * Singleton instance of the processor registry
 */
export const contentProcessorRegistry = new ContentProcessorRegistry();
