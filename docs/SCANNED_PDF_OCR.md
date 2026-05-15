# Scanned PDF OCR

## How It Works

Scanned PDFs (where each page is a rasterized image with little or no extractable text) are automatically detected and processed via OCR.

### Detection

The pipeline checks two things:
1. **Word count**: Extracted text is trimmed and split into words. If fewer than 50 words are found, the text is considered insufficient.
2. **Strategy**: The strategy engine classifies the PDF based on text density and file-size-to-text ratio.

A scanned PDF typically gets classified as `ocr-fallback` (near-zero text) or `image-heavy` (low text density with large file size).

### Processing Flow

```
Scanned PDF
   │
   ├─ Text extraction finds < 50 words
   │
   ├─ Strategy: "ocr-fallback" or "image-heavy"
   │
   ├─ Render pages to PNG using pdfjs-dist + canvas
   │  (no system dependencies needed)
   │
   ├─ OCR each rendered page with Tesseract.js (WASM)
   │
   └─ Return OCR text as the document content
```

### Page Rendering

PDF pages are rendered to PNG images using:
- `pdfjs-dist` (Mozilla's PDF.js) — parses the PDF and renders page content
- `canvas` (node-canvas) — provides the canvas surface for rendering

This is a pure Node.js solution. No system packages like GraphicsMagick, Ghostscript, or ImageMagick are needed.

Default rendering settings:
- **DPI**: 150 (good balance of quality and speed)
- **Format**: PNG (better for OCR than JPEG)
- **Max pages**: 50

### OCR

Each rendered page image is processed by Tesseract.js (a WASM build of Tesseract OCR). The OCR text is cleaned with minimal post-processing:
- Remove pipe characters and null bytes (OCR artifacts)
- Normalize whitespace

## Performance

| Step | Time per Page | Notes |
|------|--------------|-------|
| Page rendering | ~50ms | At 150 DPI |
| OCR | 2-5 seconds | Tesseract.js WASM |
| **Total** | **~2-5 seconds** | Per page |

For a 44-page scanned PDF: approximately 1.5-3.5 minutes total.

### Optimization

```typescript
// Faster processing (lower quality)
{ density: 100, maxPages: 10 }

// Better OCR accuracy (slower)
{ density: 200 }
```

## Configuration

```typescript
const result = await pdfProcessor.process(buffer, {
  enableOCR: true,
  // Force scanned PDF handling even if some text is detected:
  forceStrategy: 'image-heavy',
});
```

## Troubleshooting

### OCR produces no text
- Check that `canvas` npm package is properly installed (may need build tools on some platforms)
- Try increasing DPI: `density: 200`
- Verify the PDF contains actual page content (not just blank pages)

### OCR is slow
- Reduce `maxPages` to process fewer pages
- Lower `density` for faster rendering
- Consider processing in a background queue for large documents

### Poor OCR quality
- Increase `density` to 200 or 300 for higher resolution rendering
- Check source PDF scan quality — low-resolution scans produce poor OCR regardless of settings
- For very poor scans, consider preprocessing the rendered images (contrast enhancement, deskewing)
