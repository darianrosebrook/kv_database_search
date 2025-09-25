#!/usr/bin/env tsx

/**
 * Obsidian RAG File System Watcher
 *
 * Real-time file system monitoring for Obsidian vault changes.
 * Automatically detects and processes file modifications, additions,
 * deletions, and moves to keep the knowledge base synchronized.
 *
 * @author @darianrosebrook
 */

import chokidar from "chokidar";
import type { FSWatcher } from "chokidar";
import * as fs from "fs";
import * as path from "path";
import { EventEmitter } from "events";
import { ObsidianDatabase } from "./database";
import { ObsidianEmbeddingService } from "./embeddings";
import { MultiModalIngestionPipeline } from "./multi-modal-ingest";
import { createHash, generateDeterministicId } from "./utils";

export interface FileChangeEvent {
  type: "add" | "change" | "unlink" | "addDir" | "unlinkDir";
  path: string;
  timestamp: Date;
  stats?: fs.Stats;
  oldPath?: string; // For rename/move operations
}

export interface FileChangeBatch {
  changes: FileChangeEvent[];
  batchId: string;
  timestamp: Date;
  processingStartTime: Date;
  processingEndTime?: Date;
  processedFiles: number;
  errors: string[];
}

export interface FileWatcherOptions {
  vaultPath: string;
  ignored?: string[];
  persistent?: boolean;
  ignoreInitial?: boolean;
  debounceMs?: number;
  batchProcessing?: boolean;
  batchSize?: number;
  batchDelayMs?: number;
  enableReindexing?: boolean;
  reindexIntervalHours?: number;
}

export interface FileWatcherStats {
  totalFilesWatched: number;
  totalChangesDetected: number;
  totalBatchesProcessed: number;
  averageBatchSize: number;
  processingTime: number;
  errors: number;
  lastActivity: Date;
}

/**
 * File system watcher for Obsidian vault synchronization
 */
export class ObsidianFileWatcher extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private options: Required<FileWatcherOptions>;
  private isWatching = false;
  private pendingChanges: FileChangeEvent[] = [];
  private processingTimer: NodeJS.Timeout | null = null;
  private stats: FileWatcherStats;
  private processingFiles: Set<string> = new Set(); // Track files currently being processed
  private conflictQueue: FileChangeEvent[] = []; // Queue for conflicting changes
  private lastFileHashes: Map<string, string> = new Map(); // Store file content hashes

  constructor(
    private db: ObsidianDatabase,
    private embeddings: ObsidianEmbeddingService,
    private ingestionPipeline: MultiModalIngestionPipeline,
    options: FileWatcherOptions,
    private wsManager?: any // WebSocket manager for real-time notifications
  ) {
    super();

    // Validate WebSocket manager if provided
    if (this.wsManager && typeof this.wsManager.broadcast !== "function") {
      console.warn("WebSocket manager provided but missing broadcast method");
      this.wsManager = undefined;
    }

    // Set default options
    this.options = {
      vaultPath: options.vaultPath,
      ignored: options.ignored || [
        "**/node_modules/**",
        "**/.git/**",
        "**/.obsidian/**",
      ],
      persistent: options.persistent ?? true,
      ignoreInitial: options.ignoreInitial ?? true,
      debounceMs: options.debounceMs ?? 500,
      batchProcessing: options.batchProcessing ?? true,
      batchSize: options.batchSize ?? 10,
      batchDelayMs: options.batchDelayMs ?? 2000,
      enableReindexing: options.enableReindexing ?? true,
      reindexIntervalHours: options.reindexIntervalHours ?? 24,
      ...options,
    };

    this.stats = {
      totalFilesWatched: 0,
      totalChangesDetected: 0,
      totalBatchesProcessed: 0,
      averageBatchSize: 0,
      processingTime: 0,
      errors: 0,
      lastActivity: new Date(),
    };

    this.initializeWatcher();
  }

  /**
   * Initialize the file system watcher
   */
  private initializeWatcher(): void {
    if (this.watcher) {
      this.watcher.close();
    }

    this.watcher = chokidar.watch(this.options.vaultPath, {
      ignored: this.options.ignored,
      persistent: this.options.persistent,
      ignoreInitial: this.options.ignoreInitial,
      awaitWriteFinish: {
        stabilityThreshold: this.options.debounceMs,
        pollInterval: 100,
      },
    });

    // Set up event handlers
    this.watcher
      .on("add", async (path, stats) =>
        this.handleFileEvent("add", path, stats)
      )
      .on("change", async (path, stats) =>
        this.handleFileEvent("change", path, stats)
      )
      .on("unlink", async (path) => this.handleFileEvent("unlink", path))
      .on("addDir", async (path, stats) =>
        this.handleFileEvent("addDir", path, stats)
      )
      .on("unlinkDir", async (path) => this.handleFileEvent("unlinkDir", path))
      .on("ready", () => this.handleWatcherReady())
      .on("error", (error: unknown) => this.handleWatcherError(error instanceof Error ? error : new Error(String(error))))
      .on("raw", (event, path, details) =>
        this.handleRawEvent(event, path, details)
      );

    this.isWatching = true;
  }

  /**
   * Handle individual file events
   */
  private async handleFileEvent(
    type: FileChangeEvent["type"],
    filePath: string,
    stats?: fs.Stats
  ): Promise<void> {
    if (!this.isWatching) return;

    // Skip temporary files
    if (this.isTemporaryFile(filePath)) return;

    const event: FileChangeEvent = {
      type,
      path: filePath,
      timestamp: new Date(),
      stats,
    };

    this.pendingChanges.push(event);
    this.stats.totalChangesDetected++;
    this.stats.lastActivity = new Date();

    // Debounce processing
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    if (this.options.batchProcessing) {
      // Batch processing
      this.processingTimer = setTimeout(() => {
        this.processBatch();
      }, this.options.batchDelayMs);
    } else {
      // Process immediately
      this.processBatch();
    }

    // Check for conflicts before processing
    const conflictCheck = await this.checkForConflicts(event);
    if (conflictCheck.hasConflict) {
      const resolvedEvent = await this.resolveConflict(event, conflictCheck);
      if (!resolvedEvent) {
        // Conflict not resolved, don't process
        return;
      }
      // Use resolved event instead
      Object.assign(event, resolvedEvent);
    }

    // Emit individual event
    this.emit("fileChange", event);

    // Broadcast WebSocket event
    if (this.wsManager) {
      this.wsManager.broadcast({
        type: "fileChange",
        data: event,
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Process a batch of file changes
   */
  private async processBatch(): Promise<void> {
    if (this.pendingChanges.length === 0) return;

    const batch: FileChangeBatch = {
      changes: [...this.pendingChanges],
      batchId: generateDeterministicId(),
      timestamp: new Date(),
      processingStartTime: new Date(),
      processedFiles: 0,
      errors: [],
    };

    this.pendingChanges = [];
    this.processingTimer = null;

    this.emit("batchStart", batch);

    try {
      const results = await this.processFileChanges(batch.changes);

      batch.processingEndTime = new Date();
      batch.processedFiles = results.processedFiles;
      batch.errors = results.errors;

      this.stats.totalBatchesProcessed++;
      this.stats.processingTime +=
        batch.processingEndTime.getTime() - batch.processingStartTime.getTime();

      // Update average batch size
      this.stats.averageBatchSize =
        (this.stats.averageBatchSize * (this.stats.totalBatchesProcessed - 1) +
          batch.changes.length) /
        this.stats.totalBatchesProcessed;

      // Store batch information in database
      await this.storeBatchInfo(batch);

      this.emit("batchComplete", batch);

      // Broadcast WebSocket event
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: "batchComplete",
          data: batch,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      batch.errors.push(
        error instanceof Error ? error.message : "Unknown error"
      );
      this.stats.errors++;
      this.emit("batchError", { batch, error });

      // Broadcast WebSocket event
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: "error",
          data: { message: "Batch processing error", batch, error },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  /**
   * Process individual file changes
   */
  private async processFileChanges(changes: FileChangeEvent[]): Promise<{
    processedFiles: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let processedFiles = 0;

    for (const change of changes) {
      try {
        await this.processSingleChange(change);
        processedFiles++;
      } catch (error) {
        const errorMessage = `Failed to process ${change.type} for ${
          change.path
        }: ${error instanceof Error ? error.message : "Unknown error"}`;
        errors.push(errorMessage);
        this.emit("processingError", { change, error: errorMessage });

        // Broadcast WebSocket event
        if (this.wsManager) {
          this.wsManager.broadcast({
            type: "error",
            data: {
              message: "File processing error",
              change,
              error: errorMessage,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }
    }

    return { processedFiles, errors };
  }

  /**
   * Process a single file change
   */
  private async processSingleChange(change: FileChangeEvent): Promise<void> {
    const { type, path: filePath } = change;

    // Mark file as being processed
    this.processingFiles.add(filePath);

    try {
      switch (type) {
        case "add":
        case "change":
          await this.handleFileUpdate(filePath, change);
          break;

        case "unlink":
          await this.handleFileDeletion(filePath);
          break;

        case "addDir":
          await this.handleDirectoryAddition(filePath);
          break;

        case "unlinkDir":
          await this.handleDirectoryDeletion(filePath);
          break;
      }
    } finally {
      // Remove file from processing set
      this.processingFiles.delete(filePath);

      // Process conflict queue if available
      await this.processConflictQueue();
    }
  }

  /**
   * Handle file updates (add/change)
   */
  private async handleFileUpdate(
    filePath: string,
    change: FileChangeEvent
  ): Promise<void> {
    // Check if file needs processing
    if (!this.shouldProcessFile(filePath)) return;

    // Get file stats
    const stats = await fs.promises.stat(filePath);

    // Check if file has been modified since last processing
    const lastProcessed = await this.getLastProcessedTime(filePath);
    if (lastProcessed && stats.mtime <= lastProcessed) {
      this.emit("fileSkipped", { path: filePath, reason: "not modified" });
      return;
    }

    // Process the file
    const filePaths = [filePath];
    const result = await this.ingestionPipeline.ingestFiles(filePaths, {
      skipExisting: false, // Force reprocessing
      batchSize: 1,
    });

    // Update file processing timestamp
    await this.updateFileProcessedTime(filePath, stats.mtime);

    this.emit("fileProcessed", {
      path: filePath,
      change,
      result,
      stats,
    });

    // Broadcast WebSocket event
    if (this.wsManager) {
      this.wsManager.broadcast({
        type: "fileProcessed",
        data: { path: filePath, result, change },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle file deletion
   */
  private async handleFileDeletion(filePath: string): Promise<void> {
    // Remove from database
    await this.db.deleteChunksByFile(filePath);

    // Update file tracking
    await this.removeFileTracking(filePath);

    this.emit("fileDeleted", { path: filePath });

    // Broadcast WebSocket event
    if (this.wsManager) {
      this.wsManager.broadcast({
        type: "fileDeleted",
        data: { path: filePath },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Handle directory addition
   */
  private async handleDirectoryAddition(dirPath: string): Promise<void> {
    // Scan directory for files to process
    const files = await this.scanDirectoryForFiles(dirPath);
    if (files.length > 0) {
      const result = await this.ingestionPipeline.ingestFiles(files, {
        batchSize: this.options.batchSize,
      });

      this.emit("directoryProcessed", {
        path: dirPath,
        filesProcessed: result.processedFiles,
        result,
      });
    }
  }

  /**
   * Handle directory deletion
   */
  private async handleDirectoryDeletion(dirPath: string): Promise<void> {
    // Remove all files from this directory from database
    await this.db.deleteChunksByFile(dirPath + "/*");

    // Update directory tracking
    await this.removeDirectoryTracking(dirPath);

    this.emit("directoryDeleted", { path: dirPath });
  }

  /**
   * Scan directory for processable files
   */
  private async scanDirectoryForFiles(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(currentPath: string): Promise<void> {
      const entries = await fs.promises.readdir(currentPath, {
        withFileTypes: true,
      });

      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else if (entry.isFile() && this.shouldProcessFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }

    await scanDir(dirPath);
    return files;
  }

  /**
   * Check for file conflicts
   */
  private async checkForConflicts(change: FileChangeEvent): Promise<{
    hasConflict: boolean;
    conflictType: "concurrent_edit" | "file_in_use" | "none";
    resolutionStrategy: "skip" | "queue" | "force" | "merge";
    conflictData?: any;
  }> {
    const filePath = change.path;

    // Check if file is currently being processed
    if (this.processingFiles.has(filePath)) {
      return {
        hasConflict: true,
        conflictType: "file_in_use",
        resolutionStrategy: "queue",
        conflictData: { currentlyProcessing: true },
      };
    }

    // Check for concurrent edits by comparing file hashes
    try {
      const currentHash = await this.getFileHash(filePath);
      const lastHash = this.lastFileHashes.get(filePath);

      if (lastHash && currentHash !== lastHash && change.type === "change") {
        return {
          hasConflict: true,
          conflictType: "concurrent_edit",
          resolutionStrategy: "merge",
          conflictData: {
            lastHash,
            currentHash,
            changeDetected: true,
          },
        };
      }

      // Update hash for next comparison
      this.lastFileHashes.set(filePath, currentHash);
    } catch (error) {
      // If we can't read the file, assume conflict
      return {
        hasConflict: true,
        conflictType: "file_in_use",
        resolutionStrategy: "queue",
        conflictData: { fileAccessError: true },
      };
    }

    return {
      hasConflict: false,
      conflictType: "none",
      resolutionStrategy: "skip",
    };
  }

  /**
   * Get file hash for conflict detection
   */
  private async getFileHash(filePath: string): Promise<string> {
    try {
      const content = await fs.promises.readFile(filePath);
      return createHash("md5").update(content.toString()).digest("hex");
    } catch {
      return "";
    }
  }

  /**
   * Resolve file conflicts
   */
  private async resolveConflict(
    change: FileChangeEvent,
    conflict: Awaited<ReturnType<typeof this.checkForConflicts>>
  ): Promise<FileChangeEvent | null> {
    const { conflictType, resolutionStrategy, conflictData } = conflict;

    switch (conflictType) {
      case "file_in_use":
        if (resolutionStrategy === "queue") {
          // Add to conflict queue for later processing
          this.conflictQueue.push(change);

          // Broadcast conflict event
          if (this.wsManager) {
            this.wsManager.broadcast({
              type: "conflictDetected",
              data: {
                filePath: change.path,
                conflictType: "file_in_use",
                queued: true,
                message: "File is currently being processed, queued for later",
              },
              timestamp: new Date().toISOString(),
            });
          }

          this.emit("fileConflict", {
            change,
            conflictType,
            resolution: "queued",
            data: conflictData,
          });

          return null; // Don't process immediately
        }
        break;

      case "concurrent_edit":
        if (resolutionStrategy === "merge") {
          // For now, we'll use a simple strategy: last write wins
          // In a more sophisticated implementation, we could:
          // 1. Compare the changes
          // 2. Try to merge them
          // 3. Ask user for resolution
          // 4. Keep both versions

          // Broadcast conflict resolution event
          if (this.wsManager) {
            this.wsManager.broadcast({
              type: "conflictDetected",
              data: {
                filePath: change.path,
                conflictType: "concurrent_edit",
                resolution: "last_write_wins",
                message: "Concurrent edit detected, using latest version",
              },
              timestamp: new Date().toISOString(),
            });
          }

          this.emit("fileConflict", {
            change,
            conflictType,
            resolution: "last_write_wins",
            data: conflictData,
          });

          return change; // Process with latest version
        }
        break;

      case "none":
        return change; // No conflict, process normally
    }

    return null; // Conflict not resolved
  }

  /**
   * Process conflict queue
   */
  private async processConflictQueue(): Promise<void> {
    if (this.conflictQueue.length === 0 || this.processingFiles.size > 0) {
      return; // No conflicts to process or files are busy
    }

    const queuedChanges = [...this.conflictQueue];
    this.conflictQueue = [];

    for (const change of queuedChanges) {
      try {
        const conflictCheck = await this.checkForConflicts(change);
        if (!conflictCheck.hasConflict) {
          await this.processSingleChange(change);
        } else {
          // Still has conflict, re-queue or handle differently
          this.conflictQueue.push(change);
        }
      } catch (error) {
        this.emit("processingError", {
          change,
          error: `Failed to process queued change: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        });
      }
    }
  }

  /**
   * Check if a file should be processed
   */
  private shouldProcessFile(filePath: string): boolean {
    // Check file extension
    const ext = path.extname(filePath).toLowerCase();
    const supportedExtensions = [
      ".md",
      ".txt",
      ".pdf",
      ".docx",
      ".doc",
      ".xlsx",
      ".xls",
      ".pptx",
      ".ppt",
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".bmp",
      ".tiff",
      ".webp",
      ".mp3",
      ".wav",
      ".flac",
      ".m4a",
      ".aac",
      ".mp4",
      ".avi",
      ".mov",
      ".mkv",
      ".json",
      ".xml",
      ".csv",
    ];

    if (!supportedExtensions.includes(ext)) return false;

    // Check file size (skip very large files)
    try {
      const stats = fs.statSync(filePath);
      if (stats.size > 100 * 1024 * 1024) {
        // 100MB limit
        return false;
      }
    } catch {
      return false;
    }

    return true;
  }

  /**
   * Check if a file is temporary
   */
  private isTemporaryFile(filePath: string): boolean {
    const tempPatterns = [
      /\.tmp$/,
      /\.temp$/,
      /\.swp$/,
      /\.lock$/,
      /~$/,
      /^\..*\.sw[a-z]$/,
      /~backup/,
    ];

    return tempPatterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Get last processed time for a file
   */
  private async getLastProcessedTime(filePath: string): Promise<Date | null> {
    try {
      // In a real implementation, this would query the database
      // For now, we'll use a simple file-based approach
      const hash = createHash("md5").update(filePath.toString()).digest("hex");
      const trackingFile = path.join(
        this.options.vaultPath,
        ".obsidian-rag",
        "file-tracking",
        `${hash}.json`
      );

      if (fs.existsSync(trackingFile)) {
        const data = JSON.parse(fs.readFileSync(trackingFile, "utf-8"));
        return new Date(data.lastProcessed);
      }
    } catch (error) {
      // Silently fail - file hasn't been processed before
    }

    return null;
  }

  /**
   * Update file processed time
   */
  private async updateFileProcessedTime(
    filePath: string,
    processedTime: Date
  ): Promise<void> {
    try {
      const trackingDir = path.join(
        this.options.vaultPath,
        ".obsidian-rag",
        "file-tracking"
      );
      await fs.promises.mkdir(trackingDir, { recursive: true });

      const hash = createHash("md5").update(filePath.toString()).digest("hex");
      const trackingFile = path.join(trackingDir, `${hash}.json`);

      const data = {
        filePath,
        lastProcessed: processedTime.toISOString(),
        processedAt: new Date().toISOString(),
        fileHash: createHash("md5")
          .update(fs.readFileSync(filePath))
          .digest("hex"),
      };

      await fs.promises.writeFile(trackingFile, JSON.stringify(data, null, 2));
    } catch (error) {
      // Silently fail - tracking is not critical
    }
  }

  /**
   * Store batch information
   */
  private async storeBatchInfo(batch: FileChangeBatch): Promise<void> {
    try {
      const batchDir = path.join(
        this.options.vaultPath,
        ".obsidian-rag",
        "batches"
      );
      await fs.promises.mkdir(batchDir, { recursive: true });

      const batchFile = path.join(batchDir, `${batch.batchId}.json`);
      await fs.promises.writeFile(batchFile, JSON.stringify(batch, null, 2));
    } catch (error) {
      // Silently fail - batch tracking is not critical
    }
  }

  /**
   * Remove file tracking
   */
  private async removeFileTracking(filePath: string): Promise<void> {
    try {
      const hash = createHash("md5").update(filePath.toString()).digest("hex");
      const trackingFile = path.join(
        this.options.vaultPath,
        ".obsidian-rag",
        "file-tracking",
        `${hash}.json`
      );

      if (fs.existsSync(trackingFile)) {
        await fs.promises.unlink(trackingFile);
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Remove directory tracking
   */
  private async removeDirectoryTracking(dirPath: string): Promise<void> {
    try {
      const trackingDir = path.join(
        this.options.vaultPath,
        ".obsidian-rag",
        "directory-tracking"
      );

      // Remove all files in this directory from tracking
      const files = await fs.promises.readdir(trackingDir);
      for (const file of files) {
        const trackingFile = path.join(trackingDir, file);
        const data = JSON.parse(
          await fs.promises.readFile(trackingFile, "utf-8")
        );

        if (data.filePath.startsWith(dirPath)) {
          await fs.promises.unlink(trackingFile);
        }
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Handle watcher ready event
   */
  private handleWatcherReady(): void {
    this.emit("watcherReady");
  }

  /**
   * Handle watcher error
   */
  private handleWatcherError(error: Error): void {
    this.emit("watcherError", error);
  }

  /**
   * Handle raw file system events
   */
  private handleRawEvent(event: string, path: string, details: any): void {
    // Log raw events for debugging
    this.emit("rawEvent", { event, path, details });
  }

  /**
   * Start watching
   */
  start(): void {
    if (!this.isWatching) {
      this.initializeWatcher();
    }
  }

  /**
   * Stop watching
   */
  async stop(): Promise<void> {
    this.isWatching = false;

    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }

    this.emit("watcherStopped");
  }

  /**
   * Get watcher statistics
   */
  getStats(): FileWatcherStats {
    return { ...this.stats };
  }

  /**
   * Force reprocess a file
   */
  async forceReprocess(filePath: string): Promise<void> {
    await this.handleFileUpdate(filePath, {
      type: "change",
      path: filePath,
      timestamp: new Date(),
    });
  }

  /**
   * Force reprocess all files
   */
  async forceReprocessAll(): Promise<void> {
    const files = await this.scanDirectoryForFiles(this.options.vaultPath);
    const result = await this.ingestionPipeline.ingestFiles(files, {
      skipExisting: false,
      batchSize: this.options.batchSize,
    });

    this.emit("forceReprocessComplete", {
      filesProcessed: result.processedFiles,
      result,
    });

    // Broadcast WebSocket event
    if (this.wsManager) {
      this.wsManager.broadcast({
        type: "forceReprocessComplete",
        data: { filesProcessed: result.processedFiles, result },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * Rollback a file to a specific version
   */
  async rollbackFile(
    filePath: string,
    versionId: string,
    options: { force?: boolean } = {}
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Get available versions
      const versions = await this.db.getDocumentVersions(filePath);

      if (versions.length === 0) {
        return {
          success: false,
          message: "No versions found for file",
          error: "File has no version history",
        };
      }

      // Find target version
      const targetVersion = versions.find((v) => v.versionId === versionId);
      if (!targetVersion) {
        return {
          success: false,
          message: "Version not found",
          error: `Version ${versionId} not found`,
        };
      }

      // Check if file exists on disk
      if (!fs.existsSync(filePath)) {
        if (!options.force) {
          return {
            success: false,
            message: "File does not exist on disk",
            error: "Use force=true to create file from version",
          };
        }

        // Create file from version content
        const versionData = await this.db.getVersionContent(
          targetVersion.versionId
        );
        if (!versionData) {
          return {
            success: false,
            message: "Version content not found",
            error: "Cannot retrieve content for this version",
          };
        }

        await fs.promises.writeFile(filePath, versionData.content);
      }

      // Get version content and restore it
      const versionData = await this.db.getVersionContent(
        targetVersion.versionId
      );
      if (!versionData) {
        return {
          success: false,
          message: "Version content not found",
          error: "Cannot retrieve content for this version",
        };
      }

      // Backup current file if it exists and force is false
      if (fs.existsSync(filePath) && !options.force) {
        const backupPath = `${filePath}.backup.${Date.now()}`;
        await fs.promises.copyFile(filePath, backupPath);
        console.log(`📋 Created backup: ${backupPath}`);
      }

      // Write version content to file
      await fs.promises.writeFile(filePath, versionData.content);

      // Update file modification time to match version
      const versionTime = new Date(targetVersion.createdAt);
      await fs.promises.utimes(filePath, versionTime, versionTime);

      // Create new version record for the rollback
      const rollbackVersion = {
        versionId: this.generateVersionId(),
        contentHash: versionData.contentHash,
        embeddingHash: versionData.embeddingHash,
        createdAt: new Date(),
        changeSummary: `Rolled back to version ${targetVersion.versionId}`,
        changeType: "modified" as const,
        metadata: {
          rolledBackFrom: targetVersion.versionId,
          rollbackTime: new Date().toISOString(),
        },
        processingMetadata: {
          processedAt: new Date(),
          processor: "file-watcher",
          version: "1.0.0",
          parameters: { rollback: true },
          processingTime: 0,
          success: true,
        },
        chunks: 0, // Will be calculated when file is processed
      };

      await this.db.createDocumentVersion(filePath, rollbackVersion);

      this.emit("rollbackComplete", {
        filePath,
        versionId: targetVersion.versionId,
        rollbackVersion: rollbackVersion.versionId,
        success: true,
      });

      // Broadcast WebSocket event
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: "rollbackComplete",
          data: {
            filePath,
            versionId: targetVersion.versionId,
            rollbackVersion: rollbackVersion.versionId,
            success: true,
            message: `Successfully rolled back ${filePath} to version ${targetVersion.versionId}`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: `Successfully rolled back ${filePath} to version ${targetVersion.versionId}`,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.emit("rollbackError", {
        filePath,
        versionId,
        error: errorMessage,
      });

      // Broadcast WebSocket event
      if (this.wsManager) {
        this.wsManager.broadcast({
          type: "error",
          data: {
            message: "Rollback failed",
            filePath,
            versionId,
            error: errorMessage,
          },
          timestamp: new Date().toISOString(),
        });
      }

      return {
        success: false,
        message: "Rollback failed",
        error: errorMessage,
      };
    }
  }

  /**
   * Get available versions for a file
   */
  async getFileVersions(filePath: string): Promise<any[]> {
    try {
      const versions = await this.db.getDocumentVersions(filePath);
      return versions.map((v) => ({
        versionId: v.versionId,
        contentHash: v.contentHash,
        embeddingHash: v.embeddingHash,
        createdAt: v.createdAt,
        changeSummary: v.changeSummary,
        changeType: v.changeType,
        chunks: v.chunks,
      }));
    } catch (error) {
      console.error(`Failed to get versions for ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Generate a unique version ID
   */
  private generateVersionId(): string {
    return `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Factory function to create a file watcher
 */
export function createFileWatcher(
  db: ObsidianDatabase,
  embeddings: ObsidianEmbeddingService,
  ingestionPipeline: MultiModalIngestionPipeline,
  options: FileWatcherOptions
): ObsidianFileWatcher {
  return new ObsidianFileWatcher(db, embeddings, ingestionPipeline, options);
}
