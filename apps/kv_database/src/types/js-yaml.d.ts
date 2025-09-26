declare module "js-yaml" {
  export function load(content: string);
  export function safeLoad(content: string);
  export function dump(obj, options?): string;
  export function safeDump(obj, options?): string;

  export namespace types {
    export const SAFE_SCHEMA;
    export const SCHEMA_MAP;
  }
}
