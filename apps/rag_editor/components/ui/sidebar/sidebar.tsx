"use client";

import type React from "react";

import { cn } from "@/lib/utils";
import { Button } from "../button";
import { Title, Caption, Micro } from "../typography";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  MessageSquare,
  Settings,
  User,
  Plus,
  Search,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchVaultFiles, type VaultFilesResponse } from "@/lib/api";
import { useChatState } from "@/hooks/use-chat-state";
import styles from "./sidebar.module.scss";

interface SidebarProps {
  className?: string;
}

interface FileTreeItem {
  id: string;
  name: string;
  type: "folder" | "file" | "chat";
  path: string;
  children?: FileTreeItem[];
  isOpen?: boolean;
  isLoading?: boolean;
  hasChildren?: boolean;
}

function FileTreeNode({
  item,
  level = 0,
  onLoadChildren,
  onFileClick,
}: {
  item: FileTreeItem;
  level?: number;
  onLoadChildren?: (path: string) => Promise<void>;
  onFileClick?: (path: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(item.isOpen || false);
  const router = useRouter();

  const handleToggle = async () => {
    if (item.type === "folder") {
      if (!isOpen && onLoadChildren && item.hasChildren) {
        await onLoadChildren(item.path);
      }
      setIsOpen(!isOpen);
    } else if (item.type === "file" && onFileClick) {
      onFileClick(item.path);
    }
  };

  const Icon =
    item.type === "folder"
      ? isOpen
        ? FolderOpen
        : Folder
      : item.type === "chat"
      ? MessageSquare
      : FileText;

  return (
    <div className={styles.fileTreeNode}>
      <div
        className={styles.nodeContent}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {item.type === "folder" && (
          <button className={styles.toggleButton}>
            {item.isLoading ? (
              <Loader2 className={cn(styles.toggleIcon, styles.loading)} />
            ) : isOpen ? (
              <ChevronDown className={styles.toggleIcon} />
            ) : (
              <ChevronRight className={styles.toggleIcon} />
            )}
          </button>
        )}
        <Icon
          className={cn(styles.nodeIcon, {
            [styles.folder]: item.type === "folder",
            [styles.file]: item.type === "file",
            [styles.loading]: item.isLoading,
          })}
        />
        <span className={styles.nodeName}>{item.name}</span>
      </div>
      {item.type === "folder" && isOpen && item.children && (
        <div className={styles.nodeChildren}>
          {item.children.map((child) => (
            <FileTreeNode
              key={child.id}
              item={child}
              level={level + 1}
              onLoadChildren={onLoadChildren}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className }: SidebarProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [fileTreeData, setFileTreeData] = useState<FileTreeItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [fileTreeError, setFileTreeError] = useState<string | null>(null);

  // Chat state
  const { getRecentChats, isLoading: isLoadingChats } = useChatState();

  // Load root directory on mount
  useEffect(() => {
    loadDirectoryContents();
  }, []);

  const loadDirectoryContents = async (path = "") => {
    try {
      setFileTreeError(null);
      const response = await fetchVaultFiles(path);

      if (response.error) {
        setFileTreeError(response.error);
        return;
      }

      if (path === "") {
        // Root directory - set as file tree data
        const rootItems = response.files.map((file) => ({
          id: file.path,
          name: file.name,
          type:
            file.type === "directory"
              ? "folder"
              : ("file" as "folder" | "file"),
          path: file.path,
          hasChildren: file.type === "directory",
          children: [] as FileTreeItem[],
        }));
        setFileTreeData(rootItems);
      } else {
        // Subdirectory - update the specific folder in the tree
        setFileTreeData((prevData) =>
          updateFolderContents(prevData, path, response.files)
        );
      }
    } catch (error) {
      setFileTreeError(
        error instanceof Error ? error.message : "Failed to load files"
      );
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const updateFolderContents = (
    tree: FileTreeItem[],
    folderPath: string,
    files: any[]
  ): FileTreeItem[] => {
    return tree.map((item) => {
      if (item.path === folderPath) {
        return {
          ...item,
          children: files.map((file) => ({
            id: file.path,
            name: file.name,
            type:
              file.type === "directory"
                ? "folder"
                : ("file" as "folder" | "file"),
            path: file.path,
            hasChildren: file.type === "directory",
            children: [] as FileTreeItem[],
          })),
        };
      }

      if (item.children) {
        return {
          ...item,
          children: updateFolderContents(item.children, folderPath, files),
        };
      }

      return item;
    });
  };

  const handleLoadChildren = async (path: string) => {
    // Mark the folder as loading
    setFileTreeData((prevData) => updateLoadingState(prevData, path, true));

    try {
      await loadDirectoryContents(path);
    } finally {
      // Mark as not loading
      setFileTreeData((prevData) => updateLoadingState(prevData, path, false));
    }
  };

  const updateLoadingState = (
    tree: FileTreeItem[],
    path: string,
    isLoading: boolean
  ): FileTreeItem[] => {
    return tree.map((item) => {
      if (item.path === path) {
        return { ...item, isLoading };
      }

      if (item.children) {
        return {
          ...item,
          children: updateLoadingState(item.children, path, isLoading),
        };
      }

      return item;
    });
  };

  const handleFileClick = (path: string) => {
    // Navigate to document editor
    const encodedPath = encodeURIComponent(path);
    router.push(`/workspace/document/${encodedPath}`);
  };

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/search-chat?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className={cn(styles.sidebar, className)}>
      {/* Header */}
      <div className={styles.sidebarHeader}>
        <div className={styles.headerContent}>
          <Title className="text-lg">
            <a href="/workspace">Workspace</a>
          </Title>
          <Button variant="ghost" size="sm" className={styles.settingsButton}>
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search files..."
            className={styles.searchInput}
          />
        </div>
      </div>

      {/* File Tree, grows to fill the space */}
      <div className={styles.sidebarContent}>
        <div className={cn(styles.section, styles.filesSection)}>
          <div className={styles.sectionHeader}>
            <Micro className="text-muted-foreground">Files</Micro>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className={styles.sectionItems}>
            {isLoadingFiles ? (
              <div className={styles.loadingState}>
                <Loader2 className={styles.loadingIcon} />
              </div>
            ) : fileTreeError ? (
              <div className={styles.errorState}>{fileTreeError}</div>
            ) : fileTreeData.length > 0 ? (
              fileTreeData.map((item) => (
                <FileTreeNode
                  key={item.id}
                  item={item}
                  onLoadChildren={handleLoadChildren}
                  onFileClick={handleFileClick}
                />
              ))
            ) : (
              <div className={styles.emptyState}>No files found</div>
            )}
          </div>
        </div>

        {/* Recent Chats */}
        <div className={cn(styles.section, styles.chatsSection)}>
          <div className={styles.sectionHeader}>
            <Micro className="text-muted-foreground">Recent Chats</Micro>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => router.push("/chat")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className={styles.sectionItems}>
            {isLoadingChats ? (
              <div className={cn(styles.chatItem, styles.loading)}>
                Loading chats...
              </div>
            ) : getRecentChats(5).length > 0 ? (
              getRecentChats(5).map((chat) => (
                <div
                  key={chat.id}
                  className={styles.chatItem}
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  title={chat.title}
                >
                  {chat.title}
                </div>
              ))
            ) : (
              <div className={cn(styles.chatItem, styles.loading)}>
                No recent chats
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Menu */}
      <div className={styles.sidebarFooter}>
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            <User className={styles.userIcon} />
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>User</div>
            <Caption className={styles.userStatus}>Not signed in</Caption>
          </div>
        </div>
      </div>
    </div>
  );
}
