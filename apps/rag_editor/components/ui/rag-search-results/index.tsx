"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  FileSpreadsheet,
  ImageIcon,
  File,
  ArrowUpRight,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Zap,
  Sun,
  Moon,
} from "lucide-react";

interface RAGSearchResultsProps {
  query?: string;
  onQueryChange?: (query: string) => void;
}

export function RAGSearchResults({
  query: initialQuery = "quarterly revenue growth",
  onQueryChange,
}: RAGSearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [animationComplete, setAnimationComplete] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const mockResults = [];

  const refinementOptions = [
    "Q4 2024",
    "Year-over-year",
    "Regional",
    "Market expansion",
    "Customer metrics",
  ];

  useEffect(() => {
    setResults([]);
    setAnimationComplete(false);
    // No mock data - results will be empty
  }, [query]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="w-4 h-4" />;
      case "csv":
        return <FileSpreadsheet className="w-4 h-4" />;
      case "image":
        return <ImageIcon className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  const highlightText = (text: string, highlights: any[]) => {
    if (!highlights || highlights.length === 0) return text;

    const parts = [];
    let lastIndex = 0;

    highlights.forEach(({ start, end }) => {
      parts.push(text.slice(lastIndex, start));
      parts.push(
        <mark key={start} className="bg-lime-400 text-black px-0.5">
          {text.slice(start, end)}
        </mark>
      );
      lastIndex = end;
    });
    parts.push(text.slice(lastIndex));

    return parts;
  };

  const handleFeedback = (resultId: number, type: string) => {
    setFeedback((prev) => ({
      ...prev,
      [resultId]: type,
    }));
  };

  const handleRefine = (refinement: string) => {
    const newQuery = `${query} ${refinement}`;
    setQuery(newQuery);
    onQueryChange?.(newQuery);
  };

  const openDocument = (result: any) => {
    console.log("Opening document:", result);
  };

  const theme = {
    bg: darkMode ? "bg-neutral-950" : "bg-neutral-50",
    text: darkMode ? "text-white" : "text-black",
    textMuted: darkMode ? "text-neutral-500" : "text-neutral-500",
    textSecondary: darkMode ? "text-neutral-400" : "text-neutral-600",
    textTertiary: darkMode ? "text-neutral-300" : "text-neutral-700",
    card: darkMode ? "bg-neutral-900" : "bg-white",
    cardBorder: darkMode ? "border-neutral-800" : "border-neutral-200",
    cardBorderHover: darkMode
      ? "hover:border-neutral-700"
      : "hover:border-neutral-300",
    preview: darkMode ? "bg-black" : "bg-neutral-100",
    previewBorder: darkMode ? "border-neutral-800" : "border-neutral-200",
    previewText: darkMode ? "text-neutral-300" : "text-neutral-700",
    button: darkMode ? "bg-white text-black" : "bg-black text-white",
    buttonHover: darkMode
      ? "hover:bg-lime-400"
      : "hover:bg-lime-400 hover:text-black",
    tag: darkMode
      ? "bg-neutral-800 text-neutral-400 border-neutral-700"
      : "bg-neutral-100 text-neutral-600 border-neutral-300",
    refineButton: darkMode
      ? "bg-neutral-900 text-neutral-300 border-neutral-800"
      : "bg-white text-neutral-700 border-neutral-300",
    refineButtonHover: darkMode
      ? "hover:border-neutral-600 hover:bg-neutral-800"
      : "hover:border-neutral-400 hover:bg-neutral-50",
    feedbackInactive: darkMode
      ? "bg-transparent text-neutral-600 border-neutral-800 hover:border-neutral-600"
      : "bg-transparent text-neutral-400 border-neutral-300 hover:border-neutral-500",
    divider: darkMode ? "border-neutral-800" : "border-neutral-200",
  };

  return (
    <div
      className={`min-h-screen ${theme.bg} ${theme.text} p-6 transition-colors`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className={`mb-8 border-b ${theme.divider} pb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-light tracking-tight">
              Search Results
            </h1>
            <div className="flex items-center gap-6 text-sm">
              <div className={`flex items-center gap-6 ${theme.textMuted}`}>
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {results.length} results
                </span>
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  0.34s
                </span>
              </div>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 border ${theme.cardBorder} ${theme.cardBorderHover} transition-all`}
              >
                {darkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className={`font-mono text-sm ${theme.textSecondary}`}>
            {query}
          </div>
        </div>

        {/* Refinement Options */}
        {animationComplete && (
          <div className="mb-8">
            <div
              className={`text-xs uppercase tracking-wider ${theme.textMuted} mb-3`}
            >
              Refine
            </div>
            <div className="flex flex-wrap gap-2">
              {refinementOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRefine(option)}
                  className={`px-3 py-1.5 text-xs ${theme.refineButton} border ${theme.refineButtonHover} transition-all`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results Grid */}
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={result.id}
              className="opacity-0 translate-y-4"
              style={{
                animation: `slideUp 0.5s ease-out ${idx * 0.1}s forwards`,
              }}
            >
              <div
                className={`${theme.card} border ${theme.cardBorder} ${theme.cardBorderHover} transition-all group`}
              >
                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={theme.textMuted}>
                        {getFileIcon(result.type)}
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`text-base font-light ${theme.text} mb-1`}
                        >
                          {result.title}
                        </h3>
                        <div
                          className={`flex items-center gap-3 text-xs ${theme.textMuted} font-mono`}
                        >
                          <span>{result.metadata.author}</span>
                          <span>·</span>
                          <span>{result.metadata.date}</span>
                          <span>·</span>
                          <span className="truncate max-w-xs">
                            {result.metadata.path}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Confidence */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className={`text-2xl font-light ${theme.text}`}>
                          {(result.confidence * 100).toFixed(0)}
                        </div>
                        <div
                          className={`text-xs ${theme.textMuted} uppercase tracking-wider`}
                        >
                          Match
                        </div>
                      </div>
                      <div className="w-1 h-12 bg-lime-400 group-hover:h-16 transition-all"></div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div
                    className={`mb-4 p-4 ${theme.preview} border ${theme.previewBorder} font-mono text-xs ${theme.previewText} leading-relaxed`}
                  >
                    {highlightText(result.preview, result.highlights)}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Object.entries(result.metadata)
                      .filter(
                        ([key]) => !["author", "date", "path"].includes(key)
                      )
                      .map(([key, value]) => (
                        <span
                          key={key}
                          className={`px-2 py-1 ${theme.tag} text-xs font-mono border`}
                        >
                          {key}: {String(value)}
                        </span>
                      ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => openDocument(result)}
                      className={`flex items-center gap-2 px-4 py-2 ${theme.button} ${theme.buttonHover} transition-colors text-sm font-light group/btn`}
                    >
                      Open
                      <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                    </button>

                    {/* Feedback */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleFeedback(result.id, "up")}
                        className={`p-2 transition-all border ${
                          feedback[result.id] === "up"
                            ? "bg-lime-400 text-black border-lime-400"
                            : theme.feedbackInactive
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleFeedback(result.id, "down")}
                        className={`p-2 transition-all border ${
                          feedback[result.id] === "down"
                            ? "bg-red-500 text-white border-red-500"
                            : theme.feedbackInactive
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default RAGSearchResults;
