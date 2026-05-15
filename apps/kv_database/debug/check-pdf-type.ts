/**
 * Check if PDF is scanned/rasterized
 */

import pdfParse from "pdf-parse";
import * as fs from "fs";

async function checkPdfType() {
  const pdfPath = process.argv[2] || "~/Downloads/ai-first-product-design.pdf";

  console.log(`🔍 Checking PDF type: ${pdfPath}\n`);

  const buffer = fs.readFileSync(pdfPath.replace("~", process.env.HOME || ""));

  try {
    const data = await pdfParse(buffer);

    console.log(`📊 PDF Info:`);
    console.log(`   Pages: ${data.numpages}`);
    console.log(`   Text length: ${data.text?.length || 0}`);
    console.log(`   Has text: ${(data.text?.length || 0) > 50}`);
    console.log(`\n📝 Metadata:`, JSON.stringify(data.info, null, 2));
    console.log(`\n📄 First 500 chars of text:`);
    console.log(`---`);
    console.log(data.text?.substring(0, 500) || "(no text)");
    console.log(`---`);

    // Check if it's likely a scanned/image PDF
    const avgTextPerPage = (data.text?.length || 0) / data.numpages;
    console.log(`\n📈 Analysis:`);
    console.log(`   Avg text per page: ${avgTextPerPage.toFixed(1)} chars`);

    if (avgTextPerPage < 50) {
      console.log(`   ⚠️  This appears to be a SCANNED/IMAGE-BASED PDF`);
      console.log(`   💡 The entire pages are likely rasterized images`);
      console.log(
        `   💡 We need to extract the page images and run OCR on them`
      );
    } else {
      console.log(`   ✅ This appears to be a text-based PDF`);
    }
  } catch (error) {
    console.error("❌ Error parsing PDF:", error);
  }
}

checkPdfType().catch(console.error);
