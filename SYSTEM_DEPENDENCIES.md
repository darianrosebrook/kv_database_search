# System Dependencies

This project requires several system-level dependencies for full functionality, particularly for multi-modal content processing including OCR, image analysis, and video processing.

## Required System Packages

### Image and Document Processing
- **ImageMagick** - Image manipulation and format conversion
  - Installation: `brew install imagemagick`
  - Required for: Image format conversion, EXIF data extraction, color analysis

- **Leptonica** - Image processing library
  - Installation: `brew install leptonica`
  - Required for: Low-level image processing operations used by Tesseract

- **Tesseract OCR** - Optical Character Recognition
  - Installation: `brew install tesseract`
  - Required for: Text extraction from images
  - Language data: `tesseract --list-langs` should show available languages

### Video Processing
- **FFmpeg** - Video and audio processing
  - Installation: `brew install ffmpeg`
  - Required for: Video keyframe extraction, format conversion, metadata extraction
  - Components:
    - `ffmpeg` - Main video processing tool
    - `ffprobe` - Video metadata extraction

### URL-Based Video Ingestion (Optional)
- **yt-dlp** - Video downloader for YouTube and 1000+ other platforms
  - Installation: `brew install yt-dlp`
  - Required for: `video-extract --from-url <url>` mode (no impact on local-file extraction)
  - Verify: `yt-dlp --version`

### Additional Image Libraries (Recommended)
- **WebP tools** - WebP image format support
  - Installation: `brew install webp`
  - Required for: WebP image format support in ImageMagick

- **libheif** - HEIF/HEIC image format support
  - Installation: `brew install libheif`
  - Required for: Modern image format support

## Installation Verification

After installing these dependencies, verify they are working:

```bash
# Check Tesseract languages
tesseract --list-langs

# Check FFmpeg installation
ffmpeg -version
ffprobe -version

# Check ImageMagick
magick -version
```

## Runtime Dependencies

The following Node.js packages require these system dependencies:

- `tesseract.js` - Requires Tesseract OCR system package
- `fluent-ffmpeg` - Requires FFmpeg system package
- `canvas` - May require additional image libraries for full functionality
- Image processing operations in the multi-modal processors

## Troubleshooting

### Tesseract Issues
If OCR fails with "Error attempting to read image":
1. Ensure Tesseract language data is installed
2. Verify image format is supported (JPEG, PNG, BMP, TIFF)
3. Check that Leptonica is properly installed

### FFmpeg Issues
If video processing fails:
1. Ensure FFmpeg is in PATH
2. Check that the video file format is supported
3. Verify ffprobe can read the video metadata

### ImageMagick Issues
If image processing fails:
1. Ensure ImageMagick is properly installed
2. Check that required image formats are supported
3. Verify that additional libraries (libheif, webp) are installed for modern formats

## Development Setup

For local development, ensure all system dependencies are installed before running tests or the application. The test suite includes integration tests that verify these system dependencies are available and functioning correctly.

## Production Deployment

When deploying to production environments, ensure these system packages are installed via the platform's package manager (apt, yum, etc.) rather than Homebrew if on Linux systems.
