// @ts-nocheck
declare module "js-yaml" {
  export function load(content: string): any;
  export function safeLoad(content: string): any;
  export function dump(obj: any, options?: any): string;
  export function safeDump(obj: any, options?: any): string;
  export namespace types {
    export const SAFE_SCHEMA: any;
    export const SCHEMA_MAP: any;
  }
}