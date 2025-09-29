"use client";

import { useState } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { RelatedContentAside } from "@/components/ui/related-content-aside";

const mockDocument = {
  id: "1",
  title: "Document",
  content: "",
};

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>();

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      setSelectedText(text);
      setIsAsideOpen(true);
    }
  };

  return (
    <WorkspaceLayout>
      <div className="h-full flex" onMouseUp={handleTextSelection}>
        <div className="flex-1 min-w-0">
          <MarkdownEditor
            initialContent={mockDocument.content}
            title={mockDocument.title}
            onContentChange={(content) =>
              console.log("Content changed:", content)
            }
            onTitleChange={(title) => console.log("Title changed:", title)}
          />
        </div>
        <RelatedContentAside
          isOpen={isAsideOpen}
          onClose={() => setIsAsideOpen(false)}
          selectedText={selectedText}
        />
      </div>
    </WorkspaceLayout>
  );
}
