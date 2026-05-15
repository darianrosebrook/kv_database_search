# PDF OCR Implementation

## Overview

The PDF processing pipeline extracts text from all types of PDFs — text-based documents, scanned/rasterized pages, and mixed-content documents with both text and embedded images (diagrams, charts, screenshots).

## Architecture

### Processing Strategy Engine

The `PDFProcessingStrategyEngine` analyzes each PDF and selects one of four strategies:

| Strategy | When Used | OCR Behavior |
|----------|-----------|--------------|
| `text-focused` | High text density (>200 chars/page), low file-size-to-text ratio (<2KB/char) | Skips OCR — text extraction is sufficient |
| `hybrid` | Moderate text density with higher file-size-to-text ratio (2-5KB/char) | Runs both text extraction AND page-rendering OCR |
| `image-heavy` | Low text density (<50 chars/page) or very high file-size ratio | Renders all pages and OCRs them |
| `ocr-fallback` | Near-zero extractable text (<100 chars total) | Full page-rendering OCR |

### Text Sufficiency Check

The pipeline determines whether extracted text is "sufficient" using **word count on trimmed text**, not raw character length:

```typescript
const trimmedText = textResult.text.trim();
const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
const hasSufficientTextContent = wordCount > 50 && textResult.confidence > 0.7;
```

This prevents scanned PDFs with whitespace-only extraction (e.g., 608 chars of newlines from a 68-page slide deck) from being incorrectly classified as having text content.

### OCR Decision Logic

```
PDF File
   │
   ├─ Text Extraction (pdf-parse + pdf.js-extract)
   │
   ├─ Strategy Engine determines approach
   │
   ├─ IF strategy is "text-focused" AND hasSufficientTextContent
   │  └─ Return extracted text only (skip OCR)
   │
   └─ OTHERWISE (hybrid, image-heavy, ocr-fallback)
      │
      ├─ Render pages to PNG via pdfjs-dist + canvas
      ├─ OCR each rendered page with Tesseract.js
      ├─ Combine extracted text + OCR text
      └─ Return combined result
```

### PDF Page Rendering

Pages are rendered using `pdfjs-dist` and `canvas` (Node.js packages) — no system dependencies like GraphicsMagick or Ghostscript are needed.

```
Algorithm:
1. Load PDF with pdfjs-dist getDocument()
2. For each page:
   a. Get page viewport at target scale (density / 72 DPI)
   b. Create node-canvas at viewport dimensions
   c. Render page to canvas context
   d. Export canvas to PNG buffer
3. Return RenderedPage[] with actual dimensions from viewport
```

### OCR Text Enhancement

The `enhanceOCRText()` function applies minimal, safe post-processing to OCR output:
- Remove pipe characters (`|`) — common OCR artifacts
- Remove null characters
- Normalize excessive whitespace (collapse multiple spaces, limit consecutive newlines)

Previously, this function also replaced all `0` characters with `O` and aggressively joined single-spaced letters. Both of these were removed because they caused more harm than good — destroying numeric data and corrupting acronyms.

## Components

| Component | File | Responsibility |
|-----------|------|----------------|
| `PDFProcessingPipeline` | `pipelines/pdf-processing-pipeline.ts` | Orchestrates the full pipeline |
| `PDFProcessingStrategyEngine` | `strategies/pdf-processing-strategy.ts` | Selects processing strategy |
| `PDFTextExtractor` | `core/pdf-text-extractor.ts` | Text extraction via pdf-parse and pdf.js-extract |
| `PDFPageRenderer` | `core/pdf-page-renderer.ts` | Renders PDF pages to images via pdfjs-dist+canvas |
| `ImageOCRExtractor` | `core/image-ocr-extractor.ts` | Runs Tesseract.js OCR on rendered page images |
| `OCRProcessor` | `ocr-processor.ts` | OCR with text enhancement |

## Configuration

### Enable/Disable OCR

```typescript
const result = await pdfProcessor.process(buffer, {
  enableOCR: true,  // Enable OCR extraction
  enableEntityAnalysis: true,
  enableQualityAnalysis: true,
});
```

### Force a Specific Strategy

```typescript
const result = await pdfProcessor.process(buffer, {
  forceStrategy: 'hybrid',  // Force hybrid processing
  enableOCR: true,
});
```

## Performance

- **Text-focused PDFs**: Fast — only text extraction, no rendering
- **Page rendering**: ~50ms per page at 150 DPI
- **OCR per page**: 2-5 seconds (Tesseract.js WASM)
- **44-page scanned PDF**: ~1.5-3.5 minutes total
- **Page limit**: Default 50 pages max for OCR

### Optimization Options

```typescript
// Faster (lower quality)
{ density: 100, maxPages: 10 }

// Better quality (slower)
{ density: 200, format: 'png' }
```

## Dependencies

All processing uses Node.js packages — no system-level dependencies required for PDF processing:

- `pdfjs-dist` — PDF parsing and page rendering
- `canvas` — Node.js canvas for rendering PDF pages
- `tesseract.js` — WASM-based OCR engine
- `pdf-parse` — Fast text extraction

## Troubleshooting

### No OCR Results
- Check that the strategy allows OCR (not `text-focused`)
- Force OCR: `enableOCR: true` with `forceStrategy: 'hybrid'`
- Check logs for page rendering or Tesseract errors

### Low OCR Quality
- Increase rendering DPI: `density: 200` or higher
- Check source PDF quality (low-resolution scans produce poor OCR)
- Verify `canvas` package is properly installed

### Performance Issues
- Reduce `maxPages` to limit OCR scope
- Lower `density` for faster rendering
- Use `text-focused` strategy for text-heavy PDFs that don't need OCR
