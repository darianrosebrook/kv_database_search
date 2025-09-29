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
    <div>
      <div
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer",
          "hover:bg-accent/50 transition-colors group",
          "text-sm"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {item.type === "folder" && (
          <button className="p-0.5 hover:bg-accent rounded">
            {item.isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : isOpen ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}
        <Icon
          className={cn(
            "h-4 w-4 flex-shrink-0",
            item.type === "folder" ? "text-blue-500" : "text-muted-foreground",
            item.isLoading && "animate-pulse"
          )}
        />
        <span className="truncate text-foreground group-hover:text-foreground">
          {item.name}
        </span>
      </div>
      {item.type === "folder" && isOpen && item.children && (
        <div className="animate-in">
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
    <div
      className={cn(
        "w-64 h-full bg-card border-r border-border flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-border top-0 sticky">
        <div className="flex items-center justify-between mb-4">
          <Title className="text-lg">
            <a href="/workspace">Workspace</a>
          </Title>
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            placeholder="Search files..."
            className="w-full pl-10 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* File Tree, grows to fill the space */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-2">
          <div className="flex items-center justify-between px-2 py-2">
            <Micro className="text-muted-foreground">Files</Micro>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {isLoadingFiles ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : fileTreeError ? (
              <div className="text-center py-4 text-destructive text-sm">
                {fileTreeError}
              </div>
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
              <div className="text-center py-4 text-muted-foreground text-sm">
                No files found
              </div>
            )}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="flex-1 p-2 border-t border-border bottom-0">
          <div className="flex items-center justify-between px-2 py-2">
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
          <div className="space-y-0.5">
            {isLoadingChats ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                Loading chats...
              </div>
            ) : getRecentChats(5).length > 0 ? (
              getRecentChats(5).map((chat) => (
                <div
                  key={chat.id}
                  className="px-2 py-1.5 text-xs hover:bg-accent rounded cursor-pointer truncate"
                  onClick={() => router.push(`/chat/${chat.id}`)}
                  title={chat.title}
                >
                  {chat.title}
                </div>
              ))
            ) : (
              <div className="px-2 py-1 text-xs text-muted-foreground">
                No recent chats
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Menu */}
      <div className="p-4 border-t border-border bottom-0">
        <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer transition-colors">
          <div className="w-8 h-8 bg-workspace-accent rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-workspace-accent-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium truncate">User</div>
            <Caption className="truncate">Not signed in</Caption>
          </div>
        </div>
      </div>
    </div>
  );
}
