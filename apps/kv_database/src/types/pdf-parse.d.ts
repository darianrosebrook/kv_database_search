declare module "pdf-parse" {
  interface PDFData {
    text: string;
    numpages: number;
    info: Record<string, any>;
    metadata: Record<string, any>;
    version: string;
  }

  interface PDFOptions {
    version?: string;
    max?: number;
    pagerender?: Function;
  }

  function parse(buffer: Buffer, options?: PDFOptions): Promise<PDFData>;
  export = parse;
}
