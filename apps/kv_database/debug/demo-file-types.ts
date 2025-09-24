#!/usr/bin/env tsx

/**
 * Demo showcasing all supported file types in the unified Obsidian RAG system
 */

interface FileTypeExample {
  name: string;
  description: string;
  fileTypes: string[];
  processing: string;
  searchable: boolean;
  exampleFiles: string[];
}

const fileTypeExamples: FileTypeExample[] = [
  {
    name: "Documents",
    description: "Professional documents with structured content",
    fileTypes: ["PDF", "Word", "Excel", "PowerPoint"],
    processing: "Text extraction, table parsing, metadata extraction",
    searchable: true,
    exampleFiles: [
      "research-paper.pdf",
      "meeting-notes.docx",
      "financial-report.xlsx",
      "presentation.pptx",
    ],
  },
  {
    name: "Images",
    description: "Visual content with OCR text extraction",
    fileTypes: ["JPEG", "PNG", "GIF", "SVG", "BMP", "TIFF", "WebP"],
    processing: "OCR text extraction, confidence scoring",
    searchable: true,
    exampleFiles: [
      "screenshot.jpg",
      "diagram.png",
      "flowchart.gif",
      "architecture.svg",
    ],
  },
  {
    name: "Structured Data",
    description: "Data files with structured content",
    fileTypes: ["JSON", "XML", "CSV"],
    processing: "Schema analysis, field extraction",
    searchable: true,
    exampleFiles: ["config.json", "data-export.xml", "spreadsheet.csv"],
  },
  {
    name: "Text Files",
    description: "Plain text and formatted documents",
    fileTypes: ["Markdown", "Plain Text", "RTF"],
    processing: "Content parsing, link extraction",
    searchable: true,
    exampleFiles: ["notes.md", "readme.txt", "document.rtf"],
  },
  {
    name: "Audio",
    description: "Audio files with speech-to-text transcription",
    fileTypes: ["MP3", "WAV", "FLAC", "MP4", "OGG"],
    processing: "Speech recognition, speaker identification",
    searchable: true,
    exampleFiles: ["interview.mp3", "meeting-recording.wav", "podcast.flac"],
  },
  {
    name: "Video",
    description: "Video files with audio transcription",
    fileTypes: ["MP4", "AVI", "MOV", "WMV", "MKV"],
    processing: "Audio extraction, speech-to-text",
    searchable: true,
    exampleFiles: ["tutorial.mp4", "demo.avi", "presentation.mov"],
  },
];

async function demoFileTypeSupport() {
  console.log("🎯 OBSIDIAN RAG MULTI-MODAL FILE TYPE SUPPORT");
  console.log("=============================================");
  console.log(
    "Comprehensive support for all major file types in your knowledge base\n"
  );

  let totalTypes = 0;

  for (const category of fileTypeExamples) {
    console.log(`📁 ${category.name}`);
    console.log(`${category.description}`);
    console.log(`📋 File types: ${category.fileTypes.join(", ")}`);
    console.log(`⚙️  Processing: ${category.processing}`);
    console.log(`🔍 Searchable: ${category.searchable ? "✅ Yes" : "❌ No"}`);
    console.log(`📄 Example files:`);

    category.exampleFiles.forEach((file) => {
      console.log(`   • ${file}`);
    });

    totalTypes += category.fileTypes.length;
    console.log("");
  }

  console.log("📊 SUMMARY");
  console.log("==========");
  console.log(`🎯 Total file types supported: ${totalTypes}`);
  console.log(`📁 Categories: ${fileTypeExamples.length}`);
  console.log(`🔍 All types are searchable: ✅ Yes`);
  console.log(`🚀 Unified ingestion: ✅ Available`);

  console.log("\n💡 USAGE EXAMPLES");
  console.log("=================");

  const usageExamples = [
    {
      scenario: "Research Vault",
      files: ["paper.pdf", "notes.docx", "data.xlsx", "diagram.png"],
      description: "Academic research with mixed document types",
    },
    {
      scenario: "Software Project",
      files: [
        "README.md",
        "config.json",
        "api-docs.xml",
        "screenshots.png",
        "demo.mp4",
      ],
      description: "Development project with documentation and assets",
    },
    {
      scenario: "Meeting Notes",
      files: [
        "meeting-notes.md",
        "recording.mp3",
        "slides.pptx",
        "action-items.csv",
      ],
      description: "Meeting documentation with audio and structured data",
    },
    {
      scenario: "Personal Knowledge Base",
      files: [
        "daily-notes.md",
        "book-notes.txt",
        "research-papers.pdf",
        "mind-maps.svg",
      ],
      description: "Personal notes with various content types",
    },
  ];

  usageExamples.forEach((example, i) => {
    console.log(`\n${i + 1}. ${example.scenario}`);
    console.log(`   ${example.description}`);
    console.log(`   Files: ${example.files.join(", ")}`);
    console.log(`   ✅ All supported by unified ingestion!`);
  });

  console.log("\n🎉 BENEFITS");
  console.log("===========");
  console.log("• Single command ingests ALL file types");
  console.log("• Automatic content type detection");
  console.log("• OCR for images with text");
  console.log("• Speech-to-text for audio/video");
  console.log("• Structured data parsing");
  console.log("• Cross-referenced search results");
  console.log("• No manual processing required");

  console.log("\n🚀 READY TO USE");
  console.log("===============");
  console.log("The unified Obsidian RAG system supports all major file types");
  console.log("and provides a seamless experience for ingesting your entire");
  console.log("knowledge base with a single command.");
  console.log("\nTry it now: npm run ingest");
}

// Run the demo
demoFileTypeSupport().catch(console.error);
