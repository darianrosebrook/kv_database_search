declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    version: string;
  }

  interface PDFOptions {
    version?: string;
    max?: number;
    pagerender?: (page: number) => Promise<string>;
  }

  function parse(buffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = parse;
}
