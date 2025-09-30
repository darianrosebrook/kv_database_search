/**
 * Debug script to inspect PDF structure
 */

import { PDFExtract } from "pdf.js-extract";
import * as fs from "fs";

async function debugPdfStructure() {
  const pdfPath = process.argv[2] || "~/Downloads/ai-first-product-design.pdf";

  console.log(`🔍 Debugging PDF structure: ${pdfPath}\n`);

  const buffer = fs.readFileSync(pdfPath.replace("~", process.env.HOME || ""));
  const tempPath = `/tmp/debug_pdf_${Date.now()}.pdf`;
  fs.writeFileSync(tempPath, buffer);

  const pdfExtract = new PDFExtract();
  const data = await new Promise<any>((resolve, reject) => {
    pdfExtract.extract(tempPath, {}, (err, data) => {
      fs.unlinkSync(tempPath);
      if (err) reject(err);
      else resolve(data);
    });
  });

  console.log(`📄 Total pages: ${data.pages?.length || 0}\n`);

  // Inspect first few pages
  for (let i = 0; i < Math.min(3, data.pages?.length || 0); i++) {
    const page = data.pages[i];
    console.log(`\n📄 Page ${i + 1}:`);
    console.log(`   Width: ${page.width}, Height: ${page.height}`);
    console.log(`   Content items: ${page.content?.length || 0}`);

    if (page.content && page.content.length > 0) {
      // Count different types
      const types: Record<string, number> = {};
      const samples: any[] = [];

      for (const item of page.content) {
        const type = item.type || "unknown";
        types[type] = (types[type] || 0) + 1;

        if (samples.length < 3) {
          samples.push({
            type: item.type,
            str: item.str?.substring(0, 50),
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            hasData: !!item.data,
            dataLength: item.data?.length,
          });
        }
      }

      console.log(`   Content types:`, types);
      console.log(`   Sample items:`);
      samples.forEach((sample, idx) => {
        console.log(`      ${idx + 1}.`, JSON.stringify(sample, null, 8));
      });
    }
  }

  console.log("\n✅ Debug complete");
}

debugPdfStructure().catch(console.error);
