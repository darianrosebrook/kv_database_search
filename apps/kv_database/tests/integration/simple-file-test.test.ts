import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

describe("Simple File Availability Test", () => {
  const testFilesDir = path.join(process.cwd(), "test", "test-files");

  it("should find the test files directory", () => {
    expect(fs.existsSync(testFilesDir)).toBe(true);
  });

  it("should list all available test files", () => {
    const files = fs.readdirSync(testFilesDir);
    console.log("\n=== Available Test Files ===");
    files.forEach((file) => {
      const filePath = path.join(testFilesDir, file);
      const stats = fs.statSync(filePath);
      console.log(`${file} (${(stats.size / 1024).toFixed(1)} KB)`);
    });

    expect(files.length).toBeGreaterThan(0);
  });

  it("should be able to read PDF files as buffers", () => {
    const pdfFile = path.join(testFilesDir, "05-versions-space.pdf");
    if (fs.existsSync(pdfFile)) {
      const buffer = fs.readFileSync(pdfFile);
      console.log(`PDF file size: ${buffer.length} bytes`);
      console.log(`PDF header: ${buffer.subarray(0, 8).toString()}`);

      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
    } else {
      console.warn("PDF file not found, skipping test");
    }
  });

  it("should be able to read image files as buffers", () => {
    const imageFile = path.join(testFilesDir, "darian-square.png");
    if (fs.existsSync(imageFile)) {
      const buffer = fs.readFileSync(imageFile);
      console.log(`Image file size: ${buffer.length} bytes`);
      console.log(`PNG header: ${buffer.subarray(0, 8).toString("hex")}`);

      expect(buffer.length).toBeGreaterThan(0);
      // PNG signature: 89 50 4E 47 0D 0A 1A 0A
      expect(buffer.subarray(1, 4).toString()).toBe("PNG");
    } else {
      console.warn("Image file not found, skipping test");
    }
  });

  it("should be able to read text files", () => {
    const textFile = path.join(
      testFilesDir,
      "The birth of Inter  Figma Blog.md"
    );
    if (fs.existsSync(textFile)) {
      const content = fs.readFileSync(textFile, "utf-8");
      console.log(`Markdown file size: ${content.length} characters`);
      console.log(`First line: ${content.split("\n")[0]}`);

      expect(content.length).toBeGreaterThan(0);
      expect(typeof content).toBe("string");
    } else {
      console.warn("Markdown file not found, skipping test");
    }
  });
});
