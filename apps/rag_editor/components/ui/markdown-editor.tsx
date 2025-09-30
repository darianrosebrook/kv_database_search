"use client";

import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Caption } from "./typography";
import styles from "./markdown-editor/markdown-editor.module.scss";
import {
  Bold,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Code,
  Eye,
  Edit3,
  Maximize2,
} from "lucide-react";

interface MarkdownEditorProps {
  initialContent?: string;
  title?: string;
  onContentChange?: (content: string) => void;
  onTitleChange?: (title: string) => void;
  onTextSelect?: (selectedText: string) => void;
  className?: string;
  isSaving?: boolean;
  saveError?: string | null;
}

export function MarkdownEditor({
  initialContent = "",
  title = "Untitled Document",
  onContentChange,
  onTitleChange,
  onTextSelect,
  className,
  isSaving = false,
  saveError = null,
}: MarkdownEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [documentTitle, setDocumentTitle] = useState(title);
  const [isPreview, setIsPreview] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextSelection = () => {
    const textarea = textareaRef.current;
    if (!textarea || !onTextSelect) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (start !== end) {
      const selectedText = content.substring(start, end).trim();
      if (selectedText.length > 0) {
        onTextSelect(selectedText);
      }
    }
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    onContentChange?.(newContent);
  };

  const handleTitleChange = (newTitle: string) => {
    setDocumentTitle(newTitle);
    onTitleChange?.(newTitle);
  };

  const insertMarkdown = (before: string, after = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newContent =
      content.substring(0, start) +
      before +
      selectedText +
      after +
      content.substring(end);

    handleContentChange(newContent);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const formatMarkdown = (content: string) => {
    // Simple markdown to HTML conversion for preview
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.*?)\*/g, "<em>$1</em>")
      .replace(
        /`(.*?)`/g,
        '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>'
      )
      .replace(
        /^> (.*$)/gim,
        '<blockquote class="border-l-4 border-border pl-4 italic text-muted-foreground">$1</blockquote>'
      )
      .replace(/^- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n/g, "<br>");
  };

  return (
    <div
      className={cn(
        styles.markdownEditor,
        isFullscreen && styles.fullscreen,
        className
      )}
    >
      {/* Header */}
      <div className={styles.editorHeader}>
        <div className={styles.titleSection}>
          <input
            value={documentTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className={styles.documentTitle}
            placeholder="Document title..."
          />
          <div className={styles.statusBar}>
            {isSaving && (
              <Caption className={styles.statusSaving}>Saving...</Caption>
            )}
            {saveError && (
              <Caption className={styles.statusError}>
                Save failed: {saveError}
              </Caption>
            )}
            {!isSaving && !saveError && (
              <Caption className={styles.statusDefault}>
                Last edited recently
              </Caption>
            )}
          </div>
        </div>
        <div className={styles.headerActions}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
            className={cn(styles.toggleButton, isPreview && styles.active)}
          >
            {isPreview ? (
              <Edit3 className={styles.iconMd} />
            ) : (
              <Eye className={styles.iconMd} />
            )}
            {isPreview ? "Edit" : "Preview"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
          >
            <Maximize2 className={styles.iconMd} />
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      {!isPreview && (
        <div className={styles.toolbar}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("**", "**")}
            title="Bold"
          >
            <Bold className={styles.iconMd} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("*", "*")}
            title="Italic"
          >
            <Italic className={styles.iconMd} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("`", "`")}
            title="Code"
          >
            <Code className={styles.iconMd} />
          </Button>
          <div className={styles.toolbarDivider} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("[", "](url)")}
            title="Link"
          >
            <Link className={styles.iconMd} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("- ", "")}
            title="Bullet List"
          >
            <List className={styles.iconMd} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("1. ", "")}
            title="Numbered List"
          >
            <ListOrdered className={styles.iconMd} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => insertMarkdown("> ", "")}
            title="Quote"
          >
            <Quote className={styles.iconMd} />
          </Button>
        </div>
      )}

      {/* Editor/Preview */}
      <div className={styles.editorContainer}>
        {isPreview ? (
          <div className={styles.editorContent}>
            <div
              className={styles.proseContent}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            onMouseUp={handleTextSelection}
            onKeyUp={(e) => {
              if (
                e.key === "ArrowLeft" ||
                e.key === "ArrowRight" ||
                e.key === "ArrowUp" ||
                e.key === "ArrowDown"
              ) {
                handleTextSelection();
              }
            }}
            placeholder="Start writing your thoughts..."
            className={styles.editorTextarea}
            style={{ fontFamily: "var(--font-jetbrains-mono)" }}
          />
        )}
      </div>
    </div>
  );
}
