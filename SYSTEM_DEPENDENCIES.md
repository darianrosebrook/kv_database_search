# System Dependencies

This project requires several system-level dependencies for full functionality, particularly for multi-modal content processing including OCR, image analysis, and video processing.

## Required System Packages

### Video Processing
- **FFmpeg** - Video and audio processing
  - Installation: `brew install ffmpeg`
  - Required for: Video keyframe extraction, audio extraction, format conversion, metadata extraction
  - Components:
    - `ffmpeg` - Main video/audio processing tool
    - `ffprobe` - Video metadata extraction

### URL-Based Video Ingestion (Optional)
- **yt-dlp** - Video downloader for YouTube and 1000+ other platforms
  - Installation: `brew install yt-dlp`
  - Required for: `video-extract --from-url <url>` mode (no impact on local-file extraction)
  - Verify: `yt-dlp --version`

### OCR (Required for image text extraction)
- **Tesseract** - Native OCR binary
  - Installation: `brew install tesseract` (macOS), `apt install tesseract-ocr` (Debian/Ubuntu)
  - Required for: `OCRProcessor` and `ImageClassificationProcessor` in `@kv/processors`. The processor discovers the binary at `/opt/homebrew/bin/tesseract`, `/usr/local/bin/tesseract`, `/usr/bin/tesseract`, or on `PATH`.
  - Verify: `tesseract --version`

### Additional Image Libraries (Recommended)
- **WebP tools** - WebP image format support
  - Installation: `brew install webp`

- **libheif** - HEIF/HEIC image format support
  - Installation: `brew install libheif`

## No Longer Required

The following system dependencies were previously required but have been replaced:

- **GraphicsMagick / Ghostscript** - Previously required by `pdf2pic` for PDF page rendering. Now replaced by `pdfjs-dist` + `canvas` (Node.js packages), which render PDF pages entirely in-process without system dependencies.
- **ImageMagick** - No longer required for core functionality. The `canvas` npm package handles image rendering needs.

## OCR engine note

`tesseract.js` (the WASM port) appears in `package.json` for legacy reasons but the active OCR code path in `@kv/processors` spawns the native `tesseract` binary via `child_process` for performance and accuracy. The remaining `tesseract.js`-based tests in `packages/processors/tests/unit/ocr-*.test.ts` are stale and known to fail; they will be rewritten or removed in a future cleanup pass.

## Installation Verification

After installing the required dependencies, verify they are working:

```bash
# Check FFmpeg installation
ffmpeg -version
ffprobe -version
```

## Runtime Dependencies

The following Node.js packages handle processing without additional system dependencies:

- `pdfjs-dist` - PDF parsing and page rendering (no system PDF tools needed)
- `canvas` - Node.js canvas implementation for PDF page rendering
- `fluent-ffmpeg` - Requires FFmpeg system package for video/audio processing
- `sherpa-onnx` - Speech-to-text processing (bundles its own models)

## Troubleshooting

### OCR Issues
If OCR produces poor results:
1. Ensure image quality is sufficient (minimum ~150 DPI for scanned documents)
2. Verify image format is supported (JPEG, PNG, BMP, TIFF)
3. Check `tesseract.js` worker initialization in logs

### FFmpeg Issues
If video processing fails:
1. Ensure FFmpeg is in PATH
2. Check that the video file format is supported
3. Verify ffprobe can read the video metadata

### PDF Rendering Issues
If PDF page rendering fails:
1. Check that `pdfjs-dist` and `canvas` are installed (`pnpm install`)
2. The `canvas` package may need build tools on some platforms (Python, C++ compiler)
3. Check logs for pdfjs-dist errors during page rendering

## Development Setup

For local development, ensure FFmpeg is installed before running tests or the application. All other processing dependencies are handled by Node.js packages installed via `pnpm install`.

## Production Deployment

When deploying to production:
- Install FFmpeg via the platform's package manager (`apt install ffmpeg`, `yum install ffmpeg`, etc.)
- The `canvas` npm package may require build dependencies on Linux (`build-essential`, `libcairo2-dev`, `libjpeg-dev`, `libpango1.0-dev`, `libgif-dev`)
- All other dependencies are pure JavaScript/WASM and require no system packages
