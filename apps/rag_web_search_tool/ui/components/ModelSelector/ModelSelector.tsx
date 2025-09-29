import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Brain, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "../primitives/Button";
import { Select, SelectContent, SelectTrigger } from "../forms/Select";
import { SelectProvider } from "../forms/Select/SelectProvider";
import { apiService } from "../../../src/lib/api";
import styles from "./ModelSelector.module.scss";

interface Model {
  name: string;
  size: number;
  modified_at: string;
  details?: {
    format?: string;
    family?: string;
    parameter_size?: string;
    quantization_level?: string;
  };
}

interface ModelSelectorProps {
  selectedModel?: string;
  onModelChange: (model: string) => void;
  className?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  className,
}: ModelSelectorProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getModels();
      if (response.error) {
        setError(response.error);
      } else {
        setModels(response.models);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setLoading(false);
    }
  };

  const formatModelSize = (size: number) => {
    const gb = size / (1024 * 1024 * 1024);
    return `${gb.toFixed(1)}GB`;
  };

  const formatModelName = (name: string) => {
    // Clean up model names for display
    return name
      .replace(/^.*\//, "") // Remove any path prefixes
      .replace(/[_-]/g, " ") // Replace underscores and hyphens with spaces
      .replace(/\b\w/g, (l) => l.toUpperCase()); // Title case
  };

  const getModelIcon = (model: Model) => {
    if (model.name.includes("llama")) return "🦙";
    if (model.name.includes("mistral")) return "🌪️";
    if (model.name.includes("codellama")) return "💻";
    if (model.name.includes("phi")) return "🧠";
    return "🤖";
  };

  // Convert models to options format
  const modelOptions = models.map((model) => ({
    id: model.name,
    title: model.name,
  }));

  return (
    <div className={`${styles.modelSelector} ${className || ""}`}>
      <SelectProvider
        options={modelOptions}
        value={selectedModel}
        onChange={(selected) => {
          if (selected && !Array.isArray(selected)) {
            onModelChange(selected.id);
          }
        }}
      >
        <Select>
          <SelectTrigger
            className={styles.trigger}
            placeholder={selectedModel || "Select model"}
          />

          <SelectContent className={styles.content}>
            <div className={styles.contentHeader}>
              <div className={styles.headerTitle}>
                <Brain className={styles.headerIcon} />
                Available Models
              </div>
              <Button
                variant="ghost"
                size="small"
                onClick={loadModels}
                disabled={loading}
                className={styles.refreshButton}
              >
                <RefreshCw
                  className={`${styles.refreshIcon} ${
                    loading ? styles.spinning : ""
                  }`}
                />
                Refresh
              </Button>
            </div>

            <div className={styles.modelsList}>
              {loading ? (
                <div className={styles.loading}>
                  <RefreshCw
                    className={`${styles.loadingIcon} ${styles.spinning}`}
                  />
                  Loading models...
                </div>
              ) : error ? (
                <div className={styles.error}>
                  <AlertCircle className={styles.errorIcon} />
                  <div className={styles.errorContent}>
                    <p className={styles.errorTitle}>Failed to load models</p>
                    <p className={styles.errorMessage}>{error}</p>
                    <Button
                      variant="secondary"
                      size="small"
                      onClick={loadModels}
                    >
                      Try Again
                    </Button>
                  </div>
                </div>
              ) : models.length === 0 ? (
                <div className={styles.empty}>
                  <Brain className={styles.emptyIcon} />
                  <p>No models available</p>
                  <p className={styles.emptyHint}>
                    Make sure Ollama is running and has models installed
                  </p>
                </div>
              ) : (
                models.map((model) => (
                  <div
                    key={model.name}
                    className={styles.modelItem}
                    onClick={() => onModelChange(model.name)}
                  >
                    <div className={styles.modelItemContent}>
                      <div className={styles.modelHeader}>
                        <span className={styles.modelEmoji}>
                          {getModelIcon(model)}
                        </span>
                        <span className={styles.modelName}>
                          {formatModelName(model.name)}
                        </span>
                        {selectedModel === model.name && (
                          <span className={styles.selectedBadge}>Selected</span>
                        )}
                      </div>
                      <div className={styles.modelMeta}>
                        <span className={styles.modelSize}>
                          {formatModelSize(model.size)}
                        </span>
                        <span className={styles.modelModified}>
                          Updated{" "}
                          {new Date(model.modified_at).toLocaleDateString()}
                        </span>
                      </div>
                      {model.details && (
                        <div className={styles.modelDetails}>
                          {model.details.parameter_size && (
                            <span className={styles.detailItem}>
                              {model.details.parameter_size}
                            </span>
                          )}
                          {model.details.quantization_level && (
                            <span className={styles.detailItem}>
                              {model.details.quantization_level}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </SelectContent>
        </Select>
      </SelectProvider>
    </div>
  );
}

export default ModelSelector;
