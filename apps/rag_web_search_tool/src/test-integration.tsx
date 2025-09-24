// Test component to verify RAG integration
import { useState } from "react";
import { apiService } from "./lib/api";

export function TestIntegration() {
  const [query, setQuery] = useState("button component");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testSearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.search(query, {
        limit: 5,
        rerank: true,
        minSimilarity: 0.1,
      });

      setResults(response);
      console.log("Search results:", response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    try {
      const health = await apiService.getHealth();
      console.log("Health check:", health);
      alert(
        `Health: ${health.status}\nDatabase: ${health.services.database.totalChunks} chunks\nEmbeddings: ${health.services.embeddings.model}`
      );
    } catch (err) {
      console.error("Health check error:", err);
      alert(
        "Health check failed: " +
          (err instanceof Error ? err.message : "Unknown error")
      );
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">RAG Integration Test</h1>

      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Test Query:</label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter search query..."
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={testSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            {loading ? "Searching..." : "Test Search"}
          </button>

          <button
            onClick={testHealth}
            className="px-4 py-2 bg-green-500 text-white rounded"
          >
            Test Health
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Search Results</h2>
          <div className="text-sm text-gray-600">
            Found {results.results.length} results in {results.latencyMs}ms
          </div>

          <div className="space-y-3">
            {results.results.map((result: any, index: number) => (
              <div key={result.id} className="border rounded p-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium">{result.meta.section}</h3>
                  <span className="text-sm text-gray-500">
                    {(result.cosineSimilarity * 100).toFixed(1)}% match
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  {result.text.substring(0, 200)}...
                </p>
                <div className="text-xs text-gray-500">
                  Type: {result.meta.contentType} | Path:{" "}
                  {result.meta.breadcrumbs.join(" > ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


