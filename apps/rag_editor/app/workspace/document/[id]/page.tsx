"use client"

import { useState } from "react"
import { WorkspaceLayout } from "@/components/workspace-layout"
import { MarkdownEditor } from "@/components/ui/markdown-editor"
import { RelatedContentAside } from "@/components/ui/related-content-aside"

const mockDocument = {
  id: "1",
  title: "Architecture Notes",
  content: `# System Architecture Overview

This document outlines the high-level architecture for our knowledge management platform.

## Core Components

### Vector Search Engine
The semantic search functionality is powered by a **vector database** that stores document embeddings. We're evaluating several options:

- **Pinecone**: Managed vector database with excellent performance
- **Weaviate**: Open-source with GraphQL interface
- **Chroma**: Lightweight and easy to integrate

### Document Processing Pipeline
All documents go through a processing pipeline that:

1. Extracts text content
2. Generates embeddings using OpenAI's text-embedding-ada-002
3. Stores vectors with metadata
4. Indexes for fast retrieval

## Implementation Notes

The RAG (Retrieval Augmented Generation) system combines:
- Semantic search for relevant context
- LLM integration for intelligent responses
- Real-time document analysis

> "The goal is to create a system that understands context and relationships between ideas, not just keyword matching."

## Next Steps

- [ ] Implement vector database integration
- [ ] Build document processing pipeline  
- [ ] Create semantic search API
- [ ] Integrate with chat interface`,
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [isAsideOpen, setIsAsideOpen] = useState(false)
  const [selectedText, setSelectedText] = useState<string>()

  const handleTextSelection = () => {
    const selection = window.getSelection()
    const text = selection?.toString().trim()

    if (text && text.length > 10) {
      setSelectedText(text)
      setIsAsideOpen(true)
    }
  }

  return (
    <WorkspaceLayout>
      <div className="h-full flex" onMouseUp={handleTextSelection}>
        <div className="flex-1 min-w-0">
          <MarkdownEditor
            initialContent={mockDocument.content}
            title={mockDocument.title}
            onContentChange={(content) => console.log("Content changed:", content)}
            onTitleChange={(title) => console.log("Title changed:", title)}
          />
        </div>
        <RelatedContentAside isOpen={isAsideOpen} onClose={() => setIsAsideOpen(false)} selectedText={selectedText} />
      </div>
    </WorkspaceLayout>
  )
}
