import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Re-export all utilities from the main utils index
export * from "./utils/index";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
