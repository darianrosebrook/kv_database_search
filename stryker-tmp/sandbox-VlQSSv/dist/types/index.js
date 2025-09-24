// @ts-nocheck
// =============================================================================
// CORE DATA STRUCTURES
// =============================================================================
// =============================================================================
// MULTI-MODAL CONTENT TYPES
// =============================================================================
// Content type definitions
export var ContentType;
(function (ContentType) {
    // Text-based
    ContentType["MARKDOWN"] = "markdown";
    ContentType["PLAIN_TEXT"] = "plain_text";
    ContentType["RICH_TEXT"] = "rich_text";
    // Documents
    ContentType["PDF"] = "pdf";
    ContentType["OFFICE_DOC"] = "office_document";
    ContentType["OFFICE_SHEET"] = "office_spreadsheet";
    ContentType["OFFICE_PRESENTATION"] = "office_presentation";
    // Images
    ContentType["RASTER_IMAGE"] = "raster_image";
    ContentType["VECTOR_IMAGE"] = "vector_image";
    ContentType["DOCUMENT_IMAGE"] = "document_image";
    // Audio
    ContentType["AUDIO"] = "audio";
    ContentType["SPEECH"] = "speech";
    // Video
    ContentType["VIDEO"] = "video";
    // Structured Data
    ContentType["JSON"] = "json";
    ContentType["XML"] = "xml";
    ContentType["CSV"] = "csv";
    // Binary/Other
    ContentType["BINARY"] = "binary";
    ContentType["UNKNOWN"] = "unknown";
})(ContentType || (ContentType = {}));
