"use client"

import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "./button"
import { Caption } from "./typography"
import { Bold, Italic, Link, List, ListOrdered, Quote, Code, Eye, Edit3, Maximize2 } from "lucide-react"

interface MarkdownEditorProps {
  initialContent?: string
  title?: string
  onContentChange?: (content: string) => void
  onTitleChange?: (title: string) => void
  className?: string
}

export function MarkdownEditor({
  initialContent = "",
  title = "Untitled Document",
  onContentChange,
  onTitleChange,
  className,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [documentTitle, setDocumentTitle] = useState(title)
  const [isPreview, setIsPreview] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    onContentChange?.(newContent)
  }

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle)
    onTitleChange?.(newTitle)
  }

  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)
    const newContent = content.substring(0, start) + before + selectedText + after + content.substring(end)

    handleContentChange(newContent)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length)
    }, 0)
  }

  const formatMarkdown = (content: string) => {
    // Simple markdown to HTML conversion for preview
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
      .replace(
        /^> (.*$)/gim,
        '<blockquote class="border-l-4 border-border pl-4 italic text-muted-foreground">$1</blockquote>',
      )
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/g, "<br>")
  }

  return (
    <div className={cn("h-full flex flex-col bg-background", isFullscreen && "fixed inset-0 z-50", className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex-1 min-w-0">
          <input
            value={documentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-title font-medium bg-transparent border-none outline-none w-full truncate focus:ring-0"
            placeholder="Document title..."
          />
          <Caption>Last edited 2 minutes ago</Caption>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className={cn(isPreview && "bg-accent")}
          >
            {isPreview ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {!isPreview && (
        <div className="flex items-center gap-1 p-2 border-b border-border">
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("**", "**")} title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("*", "*")} title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("`", "`")} title="Code">
            <Code className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("[", "](url)")} title="Link">
            <Link className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("- ", "")} title="Bullet List">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("1. ", "")} title="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => insertMarkdown("> ", "")} title="Quote">
            <Quote className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Editor/Preview */}
      <div className="flex-1 overflow-hidden">
        {isPreview ? (
          <div className="h-full overflow-y-auto p-6">
            <div
              className="prose prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Start writing your thoughts..."
            className="w-full h-full p-6 bg-transparent border-none outline-none resize-none font-mono text-body leading-relaxed focus:ring-0"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          />
        )}
      </div>
    </div>
  )
}
