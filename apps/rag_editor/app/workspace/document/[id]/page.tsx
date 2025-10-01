"use client";

import React, { useState } from "react";
import { WorkspaceLayout } from "@/components/workspace-layout";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { RelatedContentAside } from "@/components/ui/related-content-aside";
import {
  fetchVaultDocument,
  saveVaultDocument,
  type VaultDocument,
  getApiBaseUrl,
} from "@/lib/api";
import { fetchRecentDocuments } from "@/lib/api";
import { useAppState } from "@/hooks/use-app-state";
import styles from "./page.module.scss";

interface DocumentData {
  id: string;
  title: string;
  content: string;
  frontmatter?: Record<string, unknown>;
  path?: string;
  error?: string;
}

const getDocument = async (id: string): Promise<DocumentData> => {
  try {
    // Validate document ID
    if (!id || id === "null" || id === "undefined") {
      return {
        id,
        title: "Invalid Document",
        content: `# Error\n\nInvalid document ID: "${id}"\n\nPlease select a valid document from the recent documents list.`,
        error: "Invalid document ID",
      };
    }

    // The id is the document path from the recent documents API
    const vaultDoc = await fetchVaultDocument(id);

    if (vaultDoc.error) {
      return {
        id,
        title: "Error Loading Document",
        content: `# Error\n\nFailed to load document: ${vaultDoc.error}`,
        error: vaultDoc.error,
      };
    }

    // Extract title from frontmatter or filename
    const title =
      (vaultDoc.frontmatter?.title as string) ||
      vaultDoc.name.replace(/\.[^/.]+$/, "") || // Remove extension
      "Untitled Document";

    return {
      id,
      title,
      content: vaultDoc.body || vaultDoc.content, // Use body (without frontmatter) for editing
      frontmatter: vaultDoc.frontmatter,
      path: vaultDoc.path,
    };
  } catch (error) {
    console.error("Failed to load document:", error);
    return {
      id,
      title: "Error Loading Document",
      content: `# Error\n\nFailed to load document: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

export default function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [isAsideOpen, setIsAsideOpen] = useState(false);
  const [selectedText, setSelectedText] = useState<string>();
  const [relatedItems, setRelatedItems] = useState<any[]>([]);
  const [isSearchingRelated, setIsSearchingRelated] = useState(false);
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { openDocumentTab, tabs, switchToTab } = useAppState();

  // Unwrap the params Promise using React.use()
  const { id } = React.use(params);

  React.useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      try {
        // Decode the URL-encoded document ID
        const decodedId = decodeURIComponent(id);
        const doc = await getDocument(decodedId);
        setDocument(doc);

        // Create a tab for this document if one doesn't already exist
        const existingTab = tabs.find(
          (tab) =>
            tab.type === "document" && tab.content?.documentId === decodedId
        );

        if (!existingTab && doc.title && !doc.error) {
          openDocumentTab(decodedId, doc.path, doc.title);
        } else if (existingTab) {
          // Switch to the existing tab
          switchToTab(existingTab.id);
        }
      } catch (error) {
        console.error("Failed to load document:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [id, tabs, openDocumentTab, switchToTab]);

  const handleTextSelectionAndSearch = async (selectedText: string) => {
    setSelectedText(selectedText);
    setIsAsideOpen(true);
    setIsSearchingRelated(true);

    try {
      // Get the API base URL dynamically
      const apiBaseUrl = await getApiBaseUrl();

      // Use the search API to find semantically similar documents
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: selectedText,
          limit: 5,
          mode: "comprehensive",
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const searchData = await response.json();

      // Convert search results to related items format
      const relatedItems = (searchData.results || [])
        .filter((result: any) => result.id !== id) // Exclude current document
        .slice(0, 5)
        .map((result: any) => ({
          id: result.id || result.filePath || `result-${Math.random()}`,
          title: result.title || result.fileName || "Untitled Document",
          type: "document" as const,
          excerpt:
            result.summary || result.text?.substring(0, 150) + "..." || "",
          confidence: result.score || 0.5,
          lastModified: result.lastModified,
        }));

      setRelatedItems(relatedItems);
    } catch (error) {
      console.error("Failed to search for related content:", error);
      setRelatedItems([]);
    } finally {
      setIsSearchingRelated(false);
    }
  };

  const handleSaveDocument = async (content: string, title?: string) => {
    if (!document?.path) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      // Update frontmatter with new title if provided
      const updatedFrontmatter =
        title && title !== document.title
          ? { ...document.frontmatter, title }
          : document.frontmatter;

      const result = await saveVaultDocument(
        document.path,
        content,
        updatedFrontmatter
      );

      if (!result.success) {
        setSaveError(result.error || "Failed to save document");
      } else {
        // Update local document state
        setDocument((prev) =>
          prev
            ? {
                ...prev,
                content,
                title: title || prev.title,
                frontmatter: updatedFrontmatter,
              }
            : null
        );
      }
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save document"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    const text = selection?.toString().trim();

    if (text && text.length > 10) {
      handleTextSelectionAndSearch(text);
    }
  };

  if (isLoading) {
    return (
      <WorkspaceLayout>
        <div className={styles.loadingState}>
          <div className={styles.loadingMessage}>Loading document...</div>
        </div>
      </WorkspaceLayout>
    );
  }

  if (!document) {
    return (
      <WorkspaceLayout>
        <div className={styles.errorState}>
          <div className={styles.errorContent}>
            <div className={styles.errorTitle}>Failed to load document</div>
            <div className={styles.errorMessage}>
              Document not found or access denied
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className={styles.documentLayout}>
        <div className={styles.editorPane}>
          <MarkdownEditor
            initialContent={document.content}
            title={document.title}
            onContentChange={(content) => handleSaveDocument(content)}
            onTitleChange={(title) =>
              handleSaveDocument(document.content, title)
            }
            onTextSelect={(selectedText) => {
              handleTextSelectionAndSearch(selectedText).catch(console.error);
            }}
            isSaving={isSaving}
            saveError={saveError}
          />
        </div>
        <RelatedContentAside
          isOpen={isAsideOpen}
          onClose={() => setIsAsideOpen(false)}
          selectedText={selectedText}
          relatedItems={relatedItems}
          isLoading={isSearchingRelated}
        />
      </div>
    </WorkspaceLayout>
  );
}
