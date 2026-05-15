# PDF OCR — Summary of Changes

## Current State

The PDF processing pipeline handles all PDF types automatically:

| PDF Type | Example | Strategy | What Happens |
|----------|---------|----------|--------------|
| Text-heavy document | Research papers, articles | `text-focused` | Text extraction only (fast) |
| Mixed content | Technical docs with diagrams | `hybrid` | Text extraction + page OCR |
| Image-heavy slides | Presentation decks, slide exports | `image-heavy` | Full page rendering + OCR |
| Scanned documents | Scanned paper documents | `ocr-fallback` | Full page rendering + OCR |

## Key Changes (Latest)

### 1. Replaced pdf2pic with pdfjs-dist + canvas

**Before:** PDF page rendering used `pdf2pic`, which required GraphicsMagick and Ghostscript as system dependencies. These would silently fail when not installed.

**After:** Pages are rendered using `pdfjs-dist` (Mozilla's PDF.js) and `canvas` (node-canvas). Both are npm packages — no system dependencies needed for PDF processing.

### 2. Fixed text sufficiency check

**Before:** `hasSufficientTextContent` used `text.length > 100`, which counts whitespace and newlines. A 68-page slide deck with 608 chars of pure newlines would pass this check, causing OCR to be skipped.

**After:** Uses word count on trimmed text: `wordCount > 50`. Only actual words count toward sufficiency.

### 3. Fixed OCR text corruption

**Before:** `enhanceOCRText()` applied two destructive transformations:
- `replace(/0/g, "O")` — Turned all zeros into letter O, destroying dates, version numbers, IDs
- Aggressive letter joining loop — Corrupted acronyms like "U S A" and single-letter words

**After:** Both removed. OCR output now uses only safe whitespace normalization.

### 4. Added hybrid strategy tier

**Before:** PDFs were either `text-focused` (skip OCR) or `image-heavy`/`ocr-fallback` (full OCR). Mixed-content PDFs with good text AND embedded images were classified as `text-focused`, losing all image content.

**After:** A new `hybrid` tier catches PDFs with moderate file-size-to-text ratio (2-5 KB/char), indicating embedded images alongside text. These get both text extraction and page OCR.

### 5. Removed dead embedded image extraction path

**Before:** The pipeline tried to find embedded images via `pdf.js-extract` using `item.type === "image"`. This check never matched in any test PDF — the entire code path was dead.

**After:** Removed. The pipeline goes straight to page rendering for OCR, which reliably captures all visual content including embedded images.

### 6. Restructured OCR decision logic

**Before:** OCR was only attempted when `hasSufficientTextContent` was false, regardless of strategy.

**After:** OCR decision depends on strategy:
- `text-focused` + sufficient text → skip OCR
- Everything else → render pages and OCR them

## System Dependencies

PDF processing no longer requires any system-level dependencies. See `SYSTEM_DEPENDENCIES.md` for the full list of what's needed (only FFmpeg for video processing).

## Files

- `apps/kv_database/src/lib/processors/core/pdf-page-renderer.ts` — Page rendering (pdfjs-dist + canvas)
- `apps/kv_database/src/lib/processors/pipelines/pdf-processing-pipeline.ts` — Pipeline orchestration
- `apps/kv_database/src/lib/processors/strategies/pdf-processing-strategy.ts` — Strategy selection
- `apps/kv_database/src/lib/processors/ocr-processor.ts` — OCR with text enhancement
