// Multi-Modal Processing Interface - Comprehensive UI for all content types
import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Workspace,
  MultiModalProcessingResult,
  ContentTypeInfo,
  ProcessingStatus,
  ProcessorOptions,
  WorkspaceServiceResponse,
  DataSource,
} from '../services/WorkspaceService';
import {
  GraphQuery,
  GraphQueryResult,
  PathFindingOptions,
  PatternAnalysisResult,
  QueryContext,
} from '../services/GraphQueryService';
import { multiModalService } from '../services/MultiModalService';
import { workspaceService } from '../services/WorkspaceService';
import { graphQueryService } from '../services/GraphQueryService';

interface MultiModalInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onProcessingComplete?: (result: MultiModalProcessingResult) => void;
}

interface FileWithPreview extends File {
  preview?: string;
  contentType?: string;
  detectedType?: ContentTypeInfo;
}

export const MultiModalInterface: React.FC<MultiModalInterfaceProps> = ({
  isOpen,
  onClose,
  onProcessingComplete,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [currentTab, setCurrentTab] = useState<'upload' | 'workspace' | 'graph' | 'settings'>('upload');
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPreview[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<Record<string, ProcessingStatus>>({});
  const [processingResults, setProcessingResults] = useState<Record<string, MultiModalProcessingResult>>({});

  // Workspace state
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>('');
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState('');

  // Graph Query state
  const [graphQuery, setGraphQuery] = useState('');
  const [isGraphQuerying, setIsGraphQuerying] = useState(false);
  const [graphQueryResult, setGraphQueryResult] = useState<GraphQueryResult | null>(null);
  const [selectedEntities, setSelectedEntities] = useState<string[]>([]);

  // Settings state
  const [processorOptions, setProcessorOptions] = useState<ProcessorOptions>({
    enableOCR: true,
    enableImageClassification: true,
    enableAudioTranscription: true,
    enableVideoProcessing: true,
    enableSpeechRecognition: true,
    extractMetadata: true,
    chunkSize: 1000,
    chunkOverlap: 200,
    maxEntities: 100,
    minConfidence: 0.6,
    language: 'en',
    domain: 'general',
  });

  // UI state
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const processingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  React.useEffect(() => {
    if (isOpen) {
      loadWorkspaces();
      loadSupportedContentTypes();
    }
  }, [isOpen]);

  React.useEffect(() => {
    // Set up polling for processing status
    if (isProcessing && Object.keys(processingProgress).length > 0) {
      processingIntervalRef.current = setInterval(() => {
        checkProcessingStatus();
      }, 1000);
    } else {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
        processingIntervalRef.current = null;
      }
    }

    return () => {
      if (processingIntervalRef.current) {
        clearInterval(processingIntervalRef.current);
      }
    };
  }, [isProcessing, processingProgress]);

  // ============================================================================
  // WORKSPACE MANAGEMENT
  // ============================================================================

  const loadWorkspaces = async () => {
    try {
      const response = await workspaceService.listWorkspaces();
      if (response.success && response.data) {
        setWorkspaces(response.data);
      }
    } catch (error) {
      console.error('Failed to load workspaces:', error);
    }
  };

  const createWorkspace = async () => {
    if (!newWorkspaceName.trim()) return;

    setIsCreatingWorkspace(true);
    try {
      const response = await workspaceService.createWorkspace(
        newWorkspaceName,
        newWorkspaceDescription
      );

      if (response.success) {
        setSuccessMessage(`Workspace "${newWorkspaceName}" created successfully`);
        setNewWorkspaceName('');
        setNewWorkspaceDescription('');
        loadWorkspaces();
      } else {
        setError(response.error || 'Failed to create workspace');
      }
    } catch (error) {
      setError('Failed to create workspace');
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  // ============================================================================
  // FILE HANDLING
  // ============================================================================

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const newFiles: FileWithPreview[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i] as FileWithPreview;
      const contentType = await multiModalService.detectContentType(file);
      file.detectedType = contentType;

      // Create preview for images
      if (contentType.type === 'raster_image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          file.preview = e.target?.result as string;
          setUploadedFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(file);
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const removeFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ============================================================================
  // PROCESSING
  // ============================================================================

  const checkProcessingStatus = async () => {
    const filesToCheck = Object.keys(processingProgress);

    for (const fileId of filesToCheck) {
      try {
        const status = await multiModalService.getProcessingStatus(fileId);
        setProcessingProgress(prev => ({
          ...prev,
          [fileId]: status,
        }));

        if (status.status === 'completed' && status.result) {
          setProcessingResults(prev => ({
            ...prev,
            [fileId]: {
              fileId,
              fileName: status.fileName,
              contentType: status.result?.metadata?.type || 'unknown',
              results: [status.result],
              summary: {
                totalTextLength: status.result.text.length,
                totalChunks: status.result.chunks?.length || 0,
                totalEntities: status.result.entities?.length || 0,
                totalImages: status.result.images?.length || 0,
                processingTime: status.result.processingTime,
                success: true,
                errors: [],
              },
              metadata: {
                uploadedAt: new Date().toISOString(),
                processedAt: new Date().toISOString(),
                version: '1.0.0',
                processorVersions: {},
              },
            },
          }));

          onProcessingComplete?.(processingResults[fileId]);

          // Remove from processing
          setProcessingProgress(prev => {
            const updated = { ...prev };
            delete updated[fileId];
            return updated;
          });
        }
      } catch (error) {
        console.error(`Failed to check status for ${fileId}:`, error);
      }
    }
  };

  const processFiles = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const filesToProcess = uploadedFiles.filter(file =>
        !processingProgress[file.name + file.size]
      );

      for (const file of filesToProcess) {
        setProcessingProgress(prev => ({
          ...prev,
          [file.name + file.size]: {
            fileId: file.name + file.size,
            fileName: file.name,
            status: 'processing',
            progress: 0,
            startedAt: new Date().toISOString(),
          },
        }));

        // Process the file
        const result = await multiModalService.processFile(file, processorOptions);

        setProcessingResults(prev => ({
          ...prev,
          [file.name + file.size]: result,
        }));

        onProcessingComplete?.(result);

        // Update status
        setProcessingProgress(prev => ({
          ...prev,
          [file.name + file.size]: {
            fileId: file.name + file.size,
            fileName: file.name,
            status: 'completed',
            progress: 100,
            result: result.results[0],
            completedAt: new Date().toISOString(),
          },
        }));
      }
    } catch (error) {
      setError('Failed to process files');
      console.error('Processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // ============================================================================
  // GRAPH QUERY
  // ============================================================================

  const handleGraphQuery = async () => {
    if (!graphQuery.trim()) return;

    setIsGraphQuerying(true);
    try {
      const context: QueryContext = {
        workspaceName: selectedWorkspace,
      };

      const result = await graphQueryService.processNaturalLanguageQuery(
        graphQuery,
        context
      );

      setGraphQueryResult(result);
    } catch (error) {
      setError('Failed to process graph query');
      console.error('Graph query error:', error);
    } finally {
      setIsGraphQuerying(false);
    }
  };

  const handlePathFinding = async (startEntity: string, endEntity: string) => {
    try {
      const options: PathFindingOptions = {
        startEntity,
        endEntity,
        maxDepth: 3,
        algorithm: 'astar',
      };

      const result = await graphQueryService.findPaths(options);
      return result;
    } catch (error) {
      console.error('Path finding error:', error);
      return null;
    }
  };

  const handlePatternAnalysis = async (entities: string[]) => {
    try {
      const context: QueryContext = {
        workspaceName: selectedWorkspace,
      };

      const result = await graphQueryService.analyzePatterns(entities, context);
      return result;
    } catch (error) {
      console.error('Pattern analysis error:', error);
      return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const renderUploadTab = () => (
    <div className="space-y-6">
      {/* File Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="space-y-4">
          <div className="text-4xl">📁</div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Upload Files</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to select
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.docx,.xlsx,.pptx,.jpg,.jpeg,.png,.gif,.bmp,.tiff,.mp3,.wav,.mp4,.avi,.md,.txt,.json,.xml,.csv"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files)}
            />
          </div>
        </div>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{file.name}</span>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-destructive hover:text-destructive/80"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                {file.detectedType && (
                  <div className="text-xs bg-accent px-2 py-1 rounded">
                    {file.detectedType.icon} {file.detectedType.name}
                  </div>
                )}
                {file.preview && (
                  <img
                    src={file.preview}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Processing Options */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Processing Options</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.enableOCR}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  enableOCR: e.target.checked
                }))}
              />
              <span>Enable OCR</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.enableImageClassification}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  enableImageClassification: e.target.checked
                }))}
              />
              <span>Image Classification</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.enableAudioTranscription}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  enableAudioTranscription: e.target.checked
                }))}
              />
              <span>Audio Transcription</span>
            </label>
          </div>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.enableVideoProcessing}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  enableVideoProcessing: e.target.checked
                }))}
              />
              <span>Video Processing</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.enableSpeechRecognition}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  enableSpeechRecognition: e.target.checked
                }))}
              />
              <span>Speech Recognition</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={processorOptions.extractMetadata}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  extractMetadata: e.target.checked
                }))}
              />
              <span>Extract Metadata</span>
            </label>
          </div>
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-end">
        <button
          onClick={processFiles}
          disabled={uploadedFiles.length === 0 || isProcessing}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Process Files'}
        </button>
      </div>
    </div>
  );

  const renderWorkspaceTab = () => (
    <div className="space-y-6">
      {/* Workspace List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Workspaces</h3>
        <div className="space-y-2">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedWorkspace === workspace.name
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setSelectedWorkspace(workspace.name)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">{workspace.name}</h4>
                  {workspace.description && (
                    <p className="text-sm text-muted-foreground">{workspace.description}</p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <div>{workspace.statistics.totalDocuments} documents</div>
                  <div>{workspace.statistics.totalEntities} entities</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Workspace */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Create New Workspace</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
              placeholder="Enter workspace name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={newWorkspaceDescription}
              onChange={(e) => setNewWorkspaceDescription(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg"
              placeholder="Enter workspace description"
              rows={3}
            />
          </div>
          <button
            onClick={createWorkspace}
            disabled={!newWorkspaceName.trim() || isCreatingWorkspace}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
          >
            {isCreatingWorkspace ? 'Creating...' : 'Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderGraphTab = () => (
    <div className="space-y-6">
      {/* Graph Query Input */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Natural Language Graph Query</h3>
        <div className="space-y-2">
          <textarea
            value={graphQuery}
            onChange={(e) => setGraphQuery(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg"
            placeholder="Ask me about relationships, paths, patterns, or entities..."
            rows={4}
          />
          <div className="flex gap-2">
            <button
              onClick={handleGraphQuery}
              disabled={!graphQuery.trim() || isGraphQuerying}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50"
            >
              {isGraphQuerying ? 'Querying...' : 'Query Graph'}
            </button>
            <select
              value={selectedWorkspace}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              className="px-3 py-2 border border-border rounded-lg"
            >
              <option value="">No workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.name}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Graph Query Results */}
      {graphQueryResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Results</h3>
          <div className="border rounded-lg p-4 space-y-4">
            <div>
              <h4 className="font-medium">Entities Found ({graphQueryResult.results.nodes.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {graphQueryResult.results.nodes.slice(0, 10).map((node, index) => (
                  <div key={index} className="text-sm bg-accent p-2 rounded">
                    {node.text} ({node.type})
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium">Relationships ({graphQueryResult.results.edges.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {graphQueryResult.results.edges.slice(0, 10).map((edge, index) => (
                  <div key={index} className="text-sm bg-accent p-2 rounded">
                    {edge.source} → {edge.target} ({edge.type})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Advanced Settings</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium">Processing Options</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="number"
                value={processorOptions.chunkSize}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  chunkSize: parseInt(e.target.value)
                }))}
                className="w-20 px-2 py-1 border border-border rounded"
              />
              <span>Chunk Size</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="number"
                value={processorOptions.chunkOverlap}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  chunkOverlap: parseInt(e.target.value)
                }))}
                className="w-20 px-2 py-1 border border-border rounded"
              />
              <span>Chunk Overlap</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="number"
                value={processorOptions.maxEntities}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  maxEntities: parseInt(e.target.value)
                }))}
                className="w-20 px-2 py-1 border border-border rounded"
              />
              <span>Max Entities</span>
            </label>
          </div>
        </div>
        <div className="space-y-4">
          <h4 className="font-medium">Quality Settings</h4>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="number"
                value={processorOptions.minConfidence}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  minConfidence: parseFloat(e.target.value)
                }))}
                step="0.1"
                min="0"
                max="1"
                className="w-20 px-2 py-1 border border-border rounded"
              />
              <span>Min Confidence</span>
            </label>
            <label className="flex items-center space-x-2">
              <select
                value={processorOptions.language}
                onChange={(e) => setProcessorOptions(prev => ({
                  ...prev,
                  language: e.target.value
                }))}
                className="px-3 py-2 border border-border rounded"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="ru">Russian</option>
                <option value="ja">Japanese</option>
                <option value="ko">Korean</option>
                <option value="zh">Chinese</option>
              </select>
              <span>Language</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed inset-4 bg-background border border-border rounded-lg shadow-lg overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Multi-Modal Processing</h2>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border">
            <div className="flex">
              {[
                { id: 'upload', label: 'Upload Files', icon: '📁' },
                { id: 'workspace', label: 'Workspaces', icon: '🏢' },
                { id: 'graph', label: 'Graph Query', icon: '🕸️' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors ${
                    currentTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-auto max-h-[calc(100vh-200px)]">
            <AnimatePresence mode="wait">
              {currentTab === 'upload' && (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderUploadTab()}
                </motion.div>
              )}
              {currentTab === 'workspace' && (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderWorkspaceTab()}
                </motion.div>
              )}
              {currentTab === 'graph' && (
                <motion.div
                  key="graph"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderGraphTab()}
                </motion.div>
              )}
              {currentTab === 'settings' && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {renderSettingsTab()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MultiModalInterface;
