import { motion } from "motion/react";
import { GitBranch, FileText, Link } from "lucide-react";

interface GraphNode {
  id: string;
  label: string;
  type: "current" | "related" | "source";
  x: number;
  y: number;
}

interface GraphEdge {
  from: string;
  to: string;
  strength: number;
}

interface KnowledgeGraphProps {
  currentDoc: string;
  relatedDocs: string[];
}

export function KnowledgeGraph({
  currentDoc,
  relatedDocs,
}: KnowledgeGraphProps) {
  // Only show nodes for actual data - no fallbacks
  const nodes: GraphNode[] = [
    { id: "current", label: currentDoc, type: "current", x: 50, y: 50 },
    ...(relatedDocs[0]
      ? [
          {
            id: "related1",
            label: relatedDocs[0],
            type: "related" as const,
            x: 20,
            y: 20,
          },
        ]
      : []),
    ...(relatedDocs[1]
      ? [
          {
            id: "related2",
            label: relatedDocs[1],
            type: "related" as const,
            x: 80,
            y: 30,
          },
        ]
      : []),
    ...(relatedDocs[2]
      ? [
          {
            id: "related3",
            label: relatedDocs[2],
            type: "related" as const,
            x: 70,
            y: 80,
          },
        ]
      : []),
    { id: "source1", label: "Documentation", type: "source", x: 30, y: 85 },
  ];

  // Only create edges for nodes that actually exist
  const edges: GraphEdge[] = [
    ...(relatedDocs[0]
      ? [{ from: "current", to: "related1", strength: 0.9 }]
      : []),
    ...(relatedDocs[1]
      ? [{ from: "current", to: "related2", strength: 0.7 }]
      : []),
    ...(relatedDocs[2]
      ? [{ from: "current", to: "related3", strength: 0.6 }]
      : []),
    ...(relatedDocs[0]
      ? [{ from: "related1", to: "source1", strength: 0.8 }]
      : []),
  ];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <GitBranch className="w-4 h-4 text-muted-foreground" />
        <span>Knowledge Graph</span>
      </div>

      <div className="relative w-full h-32 bg-muted/30 rounded-md overflow-hidden">
        <svg className="w-full h-full">
          {/* Render edges */}
          {edges.map((edge, index) => {
            const fromNode = nodes.find((n) => n.id === edge.from);
            const toNode = nodes.find((n) => n.id === edge.to);
            if (!fromNode || !toNode) return null;

            return (
              <motion.line
                key={`edge-${index}`}
                x1={`${fromNode.x}%`}
                y1={`${fromNode.y}%`}
                x2={`${toNode.x}%`}
                y2={`${toNode.y}%`}
                stroke="currentColor"
                strokeWidth={edge.strength * 2}
                className="text-muted-foreground/40"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              />
            );
          })}

          {/* Render nodes */}
          {nodes.map((node, index) => (
            <motion.g
              key={node.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <circle
                cx={`${node.x}%`}
                cy={`${node.y}%`}
                r={node.type === "current" ? "6" : "4"}
                fill="currentColor"
                className={
                  node.type === "current"
                    ? "text-primary"
                    : node.type === "related"
                    ? "text-accent-foreground"
                    : "text-muted-foreground"
                }
              />
            </motion.g>
          ))}
        </svg>

        {/* Node labels */}
        {nodes.map((node) => (
          <div
            key={`label-${node.id}`}
            className="absolute text-xs bg-background/80 px-1 rounded pointer-events-none"
            style={{
              left: `${node.x}%`,
              top: `${node.y + (node.type === "current" ? 8 : 6)}%`,
              transform: "translateX(-50%)",
            }}
          >
            {node.label}
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full" />
            Current
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-accent-foreground rounded-full" />
            Related
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link className="w-3 h-3" />
          {edges.length} connections
        </div>
      </div>
    </div>
  );
}
