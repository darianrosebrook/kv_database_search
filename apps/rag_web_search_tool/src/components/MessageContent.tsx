import React from "react";

interface MessageContentProps {
  content: string;
  type: "user" | "assistant" | "error";
}

export function MessageContent({ content, type }: MessageContentProps) {
  // Clean up the content and ensure proper formatting
  const cleanContent = content
    .trim()
    .replace(/\n\s*\n\s*\n+/g, "\n\n") // Replace multiple newlines with double newlines
    .replace(/^\s*[\-\*]\s*/gm, "• ") // Convert markdown-style bullets to proper bullets
    .replace(/^\s*\d+\.\s*/gm, (match, offset, string) => {
      // Convert numbered lists to proper format
      const lineStart = string.lastIndexOf("\n", offset) + 1;
      const lineContent = string.slice(lineStart, offset);
      const indent = lineContent.match(/^\s*/)?.[0] || "";
      const number = match.match(/\d+/)?.[0] || "1";
      return `${indent}${number}. `;
    })
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") // Convert **bold** to <strong>
    .replace(/\*(.*?)\*/g, "<em>$1</em>") // Convert *italic* to <em>
    .replace(
      /`([^`]+)`/g,
      "<code class='bg-muted px-1 py-0.5 rounded text-sm'>$1</code>"
    ) // Convert `code` to styled code
    .replace(
      /```([^`]+)```/g,
      "<pre class='bg-muted p-3 rounded-lg overflow-x-auto'><code>$1</code></pre>"
    ); // Convert ```code blocks```

  return (
    <div className="prose prose-sm max-w-none dark:prose-invert">
      <div
        className="whitespace-pre-wrap break-words leading-relaxed"
        dangerouslySetInnerHTML={{ __html: cleanContent }}
      />
    </div>
  );
}
