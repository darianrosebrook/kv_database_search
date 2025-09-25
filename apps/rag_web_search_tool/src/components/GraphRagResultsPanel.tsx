import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraphRagSearchResult,
  GraphRagEntity,
  GraphRagRelationship,
  ReasoningResult,
  ReasoningPath,
} from "../lib/graph-rag-api";

interface GraphRagResultsPanelProps {
  results: GraphRagSearchResult[];
  reasoningResults?: ReasoningResult;
  isLoading: boolean;
  selectedResult: GraphRagSearchResult | null;
  onSelectResult: (result: GraphRagSearchResult) => void;
  onViewDocument: (url: string) => void;
  onAddToContext: (result: GraphRagSearchResult) => void;
  onAskFollowUp: (question: string, context: GraphRagSearchResult) => void;
  onRefineSearch: (query: string) => void;
  onExploreEntity: (entity: GraphRagEntity) => void;
  onExploreRelationship: (relationship: GraphRagRelationship) => void;
  onReasonAbout: (entities: GraphRagEntity[]) => void;
  query: string;
}

export function GraphRagResultsPanel({
  results,
  reasoningResults,
  isLoading,
  selectedResult,
  onSelectResult,
  onViewDocument,
  onAddToContext,
  onAskFollowUp,
  onRefineSearch,
  onExploreEntity,
  onExploreRelationship,
  onReasonAbout,
  query,
}: GraphRagResultsPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "results" | "entities" | "reasoning"
  >("results");
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [showProvenance, setShowProvenance] = useState<string | null>(null);

  // Extract all unique entities from results
  const allEntities = React.useMemo(() => {
    const entityMap = new Map<string, GraphRagEntity>();
    results.forEach((result) => {
      result.entities.forEach((entity) => {
        if (
          !entityMap.has(entity.id) ||
          entityMap.get(entity.id)!.confidence < entity.confidence
        ) {
          entityMap.set(entity.id, entity);
        }
      });
    });
    return Array.from(entityMap.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }, [results]);

  // Extract all unique relationships from results
  const allRelationships = React.useMemo(() => {
    const relationshipMap = new Map<string, GraphRagRelationship>();
    results.forEach((result) => {
      result.relationships.forEach((relationship) => {
        if (!relationshipMap.has(relationship.id)) {
          relationshipMap.set(relationship.id, relationship);
        }
      });
    });
    return Array.from(relationshipMap.values()).sort(
      (a, b) => b.confidence - a.confidence
    );
  }, [results]);

  const getEntityTypeColor = (type: string) => {
    const colors = {
      PERSON: "bg-blue-100 text-blue-800 border-blue-200",
      ORGANIZATION: "bg-green-100 text-green-800 border-green-200",
      CONCEPT: "bg-purple-100 text-purple-800 border-purple-200",
      DOCUMENT: "bg-orange-100 text-orange-800 border-orange-200",
      TECHNOLOGY: "bg-cyan-100 text-cyan-800 border-cyan-200",
      LOCATION: "bg-red-100 text-red-800 border-red-200",
      EVENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PROCESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
      METRIC: "bg-pink-100 text-pink-800 border-pink-200",
      PRODUCT: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return (
      colors[type as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getRelationshipTypeColor = (type: string) => {
    const colors = {
      MENTIONS: "text-blue-600",
      CONTAINS: "text-green-600",
      RELATES_TO: "text-purple-600",
      DEPENDS_ON: "text-orange-600",
      CAUSES: "text-red-600",
      PART_OF: "text-cyan-600",
      SIMILAR_TO: "text-indigo-600",
      OPPOSITE_OF: "text-pink-600",
      TEMPORAL_BEFORE: "text-yellow-600",
      TEMPORAL_AFTER: "text-emerald-600",
    };
    return colors[type as keyof typeof colors] || "text-gray-600";
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Searching knowledge graph...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="border-b border-border mb-4">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("results")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "results"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Results ({results.length})
          </button>
          <button
            onClick={() => setActiveTab("entities")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "entities"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Entities ({allEntities.length})
          </button>
          <button
            onClick={() => setActiveTab("reasoning")}
            className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "reasoning"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            }`}
          >
            Reasoning{" "}
            {reasoningResults ? `(${reasoningResults.paths.length})` : "(0)"}
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto">
        <AnimatePresence mode="wait">
          {activeTab === "results" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {results.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No results found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your search terms or explore entities
                  </p>
                </div>
              ) : (
                results.map((result) => (
                  <div
                    key={result.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedResult?.id === result.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => onSelectResult(result)}
                  >
                    {/* Result Header */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground">
                          {result.metadata.section || "Document"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {result.metadata.sourceFile}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                          Score: {result.score.toFixed(3)}
                        </span>
                        <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                          Sim: {result.similarity.toFixed(3)}
                        </span>
                      </div>
                    </div>

                    {/* Result Content */}
                    <p className="text-sm text-foreground mb-3 line-clamp-3">
                      {result.text}
                    </p>

                    {/* Entities */}
                    {result.entities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Entities ({result.entities.length}):
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {result.entities.slice(0, 5).map((entity) => (
                            <button
                              key={entity.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onExploreEntity(entity);
                              }}
                              className={`text-xs px-2 py-1 rounded border transition-colors hover:shadow-sm ${getEntityTypeColor(
                                entity.type
                              )}`}
                              title={`${entity.name} (${
                                entity.type
                              }, confidence: ${entity.confidence.toFixed(2)})`}
                            >
                              {entity.name}
                            </button>
                          ))}
                          {result.entities.length > 5 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{result.entities.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Relationships */}
                    {result.relationships.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2">
                          Relationships ({result.relationships.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.relationships
                            .slice(0, 3)
                            .map((relationship) => (
                              <button
                                key={relationship.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onExploreRelationship(relationship);
                                }}
                                className={`text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors ${getRelationshipTypeColor(
                                  relationship.type
                                )}`}
                                title={`${
                                  relationship.type
                                } (confidence: ${relationship.confidence.toFixed(
                                  2
                                )})`}
                              >
                                {relationship.type}
                              </button>
                            ))}
                          {result.relationships.length > 3 && (
                            <span className="text-xs text-muted-foreground px-2 py-1">
                              +{result.relationships.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToContext(result);
                        }}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                      >
                        Add to Context
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onAskFollowUp("Tell me more about this", result);
                        }}
                        className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 transition-colors"
                      >
                        Ask Follow-up
                      </button>
                      {result.entities.length >= 2 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onReasonAbout(result.entities.slice(0, 2));
                          }}
                          className="text-xs bg-accent text-accent-foreground px-3 py-1 rounded hover:bg-accent/90 transition-colors"
                        >
                          Find Connections
                        </button>
                      )}
                      {result.provenance && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProvenance(
                              showProvenance === result.id ? null : result.id
                            );
                          }}
                          className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded hover:bg-muted/80 transition-colors"
                        >
                          Provenance
                        </button>
                      )}
                    </div>

                    {/* Provenance Details */}
                    {showProvenance === result.id && result.provenance && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 bg-muted rounded border"
                      >
                        <h4 className="text-xs font-medium mb-2">
                          Search Provenance
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="font-medium">Strategy:</span>{" "}
                            {result.provenance.searchStrategy}
                          </div>
                          <div>
                            <span className="font-medium">Vector Time:</span>{" "}
                            {result.provenance.vectorSearchTime.toFixed(1)}ms
                          </div>
                          <div>
                            <span className="font-medium">Graph Time:</span>{" "}
                            {result.provenance.graphTraversalTime.toFixed(1)}ms
                          </div>
                          <div>
                            <span className="font-medium">Total Time:</span>{" "}
                            {result.provenance.totalExecutionTime.toFixed(1)}ms
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "entities" && (
            <motion.div
              key="entities"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {allEntities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No entities found</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Search for content to discover entities
                  </p>
                </div>
              ) : (
                allEntities.map((entity) => (
                  <div
                    key={entity.id}
                    className="border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => onExploreEntity(entity)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-foreground">
                          {entity.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span
                            className={`text-xs px-2 py-1 rounded border ${getEntityTypeColor(
                              entity.type
                            )}`}
                          >
                            {entity.type}
                          </span>
                          <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                            Confidence: {entity.confidence.toFixed(3)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {entity.aliases && entity.aliases.length > 0 && (
                      <div className="mb-2">
                        <p className="text-xs font-medium text-muted-foreground mb-1">
                          Aliases:
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entity.aliases.join(", ")}
                        </p>
                      </div>
                    )}

                    {entity.properties &&
                      Object.keys(entity.properties).length > 0 && (
                        <div className="mb-2">
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Properties:
                          </p>
                          <div className="text-xs text-muted-foreground">
                            {Object.entries(entity.properties)
                              .slice(0, 3)
                              .map(([key, value]) => (
                                <div key={key}>
                                  <span className="font-medium">{key}:</span>{" "}
                                  {String(value)}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                    <div className="flex items-center gap-2 pt-2 border-t border-border">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExploreEntity(entity);
                        }}
                        className="text-xs bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
                      >
                        Explore
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRefineSearch(
                            `${entity.name} ${entity.type.toLowerCase()}`
                          );
                        }}
                        className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded hover:bg-secondary/90 transition-colors"
                      >
                        Search Related
                      </button>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === "reasoning" && (
            <motion.div
              key="reasoning"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {!reasoningResults || reasoningResults.paths.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    No reasoning paths found
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Select entities to explore their relationships
                  </p>
                  {allEntities.length >= 2 && (
                    <button
                      onClick={() => onReasonAbout(allEntities.slice(0, 2))}
                      className="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 transition-colors"
                    >
                      Find Relationships
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Reasoning Summary */}
                  <div className="bg-muted rounded-lg p-4 mb-4">
                    <h3 className="font-medium mb-2">Reasoning Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Paths Found:</span>{" "}
                        {reasoningResults.paths.length}
                      </div>
                      <div>
                        <span className="font-medium">Average Depth:</span>{" "}
                        {reasoningResults.metrics.averageDepth.toFixed(1)}
                      </div>
                      <div>
                        <span className="font-medium">Confidence:</span>{" "}
                        {reasoningResults.confidence.toFixed(3)}
                      </div>
                      <div>
                        <span className="font-medium">Processing Time:</span>{" "}
                        {reasoningResults.metrics.processingTime.toFixed(1)}ms
                      </div>
                    </div>
                    {reasoningResults.explanation && (
                      <p className="text-sm text-muted-foreground mt-2">
                        {reasoningResults.explanation}
                      </p>
                    )}
                  </div>

                  {/* Best Path */}
                  {reasoningResults.bestPath && (
                    <div className="border-2 border-primary rounded-lg p-4 mb-4">
                      <h3 className="font-medium text-primary mb-2">
                        Best Reasoning Path
                      </h3>
                      <ReasoningPathComponent
                        path={reasoningResults.bestPath}
                        onExploreEntity={onExploreEntity}
                        onExploreRelationship={onExploreRelationship}
                      />
                    </div>
                  )}

                  {/* All Paths */}
                  <div className="space-y-3">
                    {reasoningResults.paths.map((path, index) => (
                      <div key={path.id} className="border rounded-lg p-4">
                        <h4 className="font-medium mb-2">
                          Path {index + 1} (Confidence:{" "}
                          {path.confidence.toFixed(3)}, Depth: {path.depth})
                        </h4>
                        <ReasoningPathComponent
                          path={path}
                          onExploreEntity={onExploreEntity}
                          onExploreRelationship={onExploreRelationship}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Component to display reasoning paths
function ReasoningPathComponent({
  path,
  onExploreEntity,
  onExploreRelationship,
}: {
  path: ReasoningPath;
  onExploreEntity: (entity: GraphRagEntity) => void;
  onExploreRelationship: (relationship: GraphRagRelationship) => void;
}) {
  const getEntityTypeColor = (type: string) => {
    const colors = {
      PERSON: "bg-blue-100 text-blue-800 border-blue-200",
      ORGANIZATION: "bg-green-100 text-green-800 border-green-200",
      CONCEPT: "bg-purple-100 text-purple-800 border-purple-200",
      DOCUMENT: "bg-orange-100 text-orange-800 border-orange-200",
      TECHNOLOGY: "bg-cyan-100 text-cyan-800 border-cyan-200",
      LOCATION: "bg-red-100 text-red-800 border-red-200",
      EVENT: "bg-yellow-100 text-yellow-800 border-yellow-200",
      PROCESS: "bg-indigo-100 text-indigo-800 border-indigo-200",
      METRIC: "bg-pink-100 text-pink-800 border-pink-200",
      PRODUCT: "bg-emerald-100 text-emerald-800 border-emerald-200",
    };
    return (
      colors[type as keyof typeof colors] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  return (
    <div>
      {/* Entity Chain */}
      <div className="mb-3">
        <p className="text-xs font-medium text-muted-foreground mb-2">
          Entity Chain:
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {path.entities.map((entity, index) => (
            <React.Fragment key={entity.id}>
              <button
                onClick={() => onExploreEntity(entity)}
                className={`text-xs px-2 py-1 rounded border transition-colors hover:shadow-sm ${getEntityTypeColor(
                  entity.type
                )}`}
                title={`${entity.name} (${
                  entity.type
                }, confidence: ${entity.confidence.toFixed(2)})`}
              >
                {entity.name}
              </button>
              {index < path.entities.length - 1 && (
                <span className="text-muted-foreground">→</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Relationship Chain */}
      {path.relationships.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Relationships:
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {path.relationships.map((relationship, index) => (
              <React.Fragment key={relationship.id}>
                <button
                  onClick={() => onExploreRelationship(relationship)}
                  className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/80 transition-colors text-foreground"
                  title={`${
                    relationship.type
                  } (confidence: ${relationship.confidence.toFixed(2)})`}
                >
                  {relationship.type}
                </button>
                {index < path.relationships.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Explanation */}
      {path.explanation && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">
            Explanation:
          </p>
          <p className="text-sm text-foreground">{path.explanation}</p>
        </div>
      )}

      {/* Evidence */}
      {path.evidence.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Evidence:
          </p>
          <div className="space-y-1">
            {path.evidence.slice(0, 2).map((evidence, index) => (
              <div key={evidence.id} className="text-xs bg-muted p-2 rounded">
                <span className="font-medium">{evidence.type}:</span>{" "}
                {evidence.content}
                <span className="text-muted-foreground ml-2">
                  (confidence: {evidence.confidence.toFixed(2)})
                </span>
              </div>
            ))}
            {path.evidence.length > 2 && (
              <p className="text-xs text-muted-foreground">
                +{path.evidence.length - 2} more evidence items
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
