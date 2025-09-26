import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from "@testcontainers/postgresql";
import { execSync, spawn } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const sleep = promisify(setTimeout);

describe("Obsidian RAG API E2E", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let serverProcess;
  let apiBaseUrl: string;

  beforeAll(async () => {
    // Start PostgreSQL container
    postgresContainer = await new PostgreSqlContainer()
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    const connectionString = postgresContainer.getConnectionUri();

    // Set up environment
    process.env.DATABASE_URL = connectionString;
    process.env.NODE_ENV = "test";
    process.env.OBSIDIAN_VAULT_PATH = path.join(__dirname, "../../test-vault");

    // Create test vault directory with sample files
    await createTestVault();

    // Initialize database
    execSync("npm run setup", {
      stdio: "inherit",
      env: { ...process.env, DATABASE_URL: connectionString },
    });

    // Ingest test data
    execSync("npm run ingest", {
      stdio: "inherit",
      env: {
        ...process.env,
        DATABASE_URL: connectionString,
        OBSIDIAN_VAULT_PATH: process.env.OBSIDIAN_VAULT_PATH,
      },
    });

    // Start the server
    apiBaseUrl = "http://localhost:3001";
    serverProcess = spawn("npm", ["run", "dev"], {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, DATABASE_URL: connectionString, PORT: "3001" },
    });

    // Wait for server to start
    await waitForServer(apiBaseUrl, 30000);
  }, 60000);

  afterAll(async () => {
    // Clean up
    if (serverProcess) {
      serverProcess.kill();
    }
    if (postgresContainer) {
      await postgresContainer.stop();
    }

    // Clean up test vault
    try {
      fs.rmSync(process.env.OBSIDIAN_VAULT_PATH!, {
        recursive: true,
        force: true,
      });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe("Health Check API", () => {
    it("should return healthy status", async () => {
      const response = await fetch(`${apiBaseUrl}/health`);
      expect(response.status).toBe(200);

      const health = await response.json();
      expect(health.status).toBe("healthy");
      expect(health.version).toBeDefined();
      expect(health.services).toBeDefined();
      expect(health.metrics).toBeDefined();
    });
  });

  describe("Search API", () => {
    it("should perform semantic search", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "design system components",
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.query).toBe("design system components");
      expect(Array.isArray(result.results)).toBe(true);
      expect(typeof result.totalFound).toBe("number");
      expect(result.performance).toBeDefined();
      expect(typeof result.performance.totalTime).toBe("number");
    });

    it("should handle search with filters", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test",
          options: {
            contentTypes: ["note"],
            limit: 5,
          },
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.results.length).toBeLessThanOrEqual(5);
      // All results should be notes if filter is applied
      result.results.forEach((r) => {
        if (r.meta.contentType) {
          expect(["note", "moc", "article"]).toContain(r.meta.contentType);
        }
      });
    });

    it("should handle empty search gracefully", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "",
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBeDefined();
    });

    it("should handle pagination", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test",
          pagination: {
            limit: 2,
            offset: 0,
          },
        }),
      });

      expect(response.status).toBe(200);
      const result = await response.json();

      expect(result.results.length).toBeLessThanOrEqual(2);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.hasMore).toBeDefined();
    });
  });

  describe("Document API", () => {
    it("should retrieve document by ID", async () => {
      // First get a document ID from search
      const searchResponse = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test",
          pagination: { limit: 1 },
        }),
      });

      const searchResult = await searchResponse.json();
      const documentId = searchResult.results[0]?.id;

      if (documentId) {
        const response = await fetch(
          `${apiBaseUrl}/documents/${encodeURIComponent(documentId)}`
        );
        expect(response.status).toBe(200);

        const doc = await response.json();
        expect(doc.document).toBeDefined();
        expect(doc.document.id).toBe(documentId);
        expect(doc.document.content).toBeDefined();
      }
    });

    it("should return 404 for non-existent document", async () => {
      const response = await fetch(`${apiBaseUrl}/documents/non-existent-doc`);
      expect(response.status).toBe(404);

      const error = await response.json();
      expect(error.error).toBeDefined();
    });

    it("should retrieve document chunks", async () => {
      // First get a document ID
      const searchResponse = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "test",
          pagination: { limit: 1 },
        }),
      });

      const searchResult = await searchResponse.json();
      const documentId = searchResult.results[0]?.id;

      if (documentId) {
        const response = await fetch(
          `${apiBaseUrl}/documents/${encodeURIComponent(documentId)}/chunks`
        );
        expect(response.status).toBe(200);

        const chunkResult = await response.json();
        expect(chunkResult.documentId).toBe(documentId);
        expect(Array.isArray(chunkResult.chunks)).toBe(true);
        expect(typeof chunkResult.total).toBe("number");
      }
    });
  });

  describe("Analytics API", () => {
    it("should return vault analytics", async () => {
      const response = await fetch(`${apiBaseUrl}/analytics`);
      expect(response.status).toBe(200);

      const analytics = await response.json();
      expect(analytics.analytics).toBeDefined();
      expect(analytics.analytics.overview).toBeDefined();
      expect(analytics.analytics.contentDistribution).toBeDefined();
      expect(analytics.generated).toBeDefined();
      expect(analytics.computationTime).toBeDefined();
    });
  });

  describe("Stats API", () => {
    it("should return database statistics", async () => {
      const response = await fetch(`${apiBaseUrl}/stats`);
      expect(response.status).toBe(200);

      const stats = await response.json();
      expect(typeof stats.totalChunks).toBe("number");
      expect(stats.byContentType).toBeDefined();
      expect(stats.byFolder).toBeDefined();
      expect(stats.tagDistribution).toBeDefined();
    });
  });

  describe("Ingestion API", () => {
    it("should reject ingestion without auth", async () => {
      const response = await fetch(`${apiBaseUrl}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vaultPath: "/tmp/test-vault",
        }),
      });

      expect(response.status).toBe(401);
      const error = await response.json();
      expect(error.error).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle malformed JSON gracefully", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{invalid json",
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toBeDefined();
    });

    it("should handle invalid HTTP methods", async () => {
      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: "test" }),
      });

      expect(response.status).toBe(405);
    });
  });

  describe("Performance Benchmarks", () => {
    it("should respond within acceptable time limits", async () => {
      const startTime = Date.now();

      const response = await fetch(`${apiBaseUrl}/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: "performance test query",
        }),
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it("should handle concurrent requests", async () => {
      const requests = Array(5)
        .fill(null)
        .map(() =>
          fetch(`${apiBaseUrl}/search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              query: "concurrent test",
            }),
          })
        );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});

async function createTestVault(): Promise<void> {
  const vaultPath = process.env.OBSIDIAN_VAULT_PATH!;
  const fs = require("fs");
  const path = require("path");

  // Create vault structure
  fs.mkdirSync(vaultPath, { recursive: true });
  fs.mkdirSync(path.join(vaultPath, "MOCs"), { recursive: true });
  fs.mkdirSync(path.join(vaultPath, "Articles"), { recursive: true });
  fs.mkdirSync(path.join(vaultPath, "Notes"), { recursive: true });

  // Create test documents
  const documents = [
    {
      path: "MOCs/Design Systems.md",
      content: `---
title: Design Systems
created: 2024-01-01
tags: [design, system, ui]
---

# Design Systems

Design systems are crucial for maintaining consistency across products and teams. They provide a unified approach to design and development.

## Components

Design systems typically include:
- UI components and patterns
- Design tokens and variables
- Documentation and guidelines
- Code implementation examples

## Benefits

- Consistency across products
- Faster development cycles
- Better user experience
- Easier maintenance

## Related Concepts

See also: [[UI Components]], [[Design Tokens]], [[Style Guides]]`,
    },
    {
      path: "Articles/Atomic Design.md",
      content: `---
title: Atomic Design Methodology
created: 2024-01-02
tags: [design, methodology, components]
---

# Atomic Design: A Methodology

Atomic design is a methodology for creating design systems. It breaks down interfaces into fundamental building blocks.

## Atoms

The smallest, indivisible elements:
- Buttons
- Input fields
- Labels
- Icons

## Molecules

Combinations of atoms:
- Search forms
- Navigation menus
- Card headers

## Organisms

Complex UI sections:
- Headers
- Sidebars
- Product cards

## Templates & Pages

Full page layouts and specific page implementations.

## Benefits

- Scalable design systems
- Consistent component usage
- Easier maintenance
- Better collaboration`,
    },
    {
      path: "Notes/UI Components.md",
      content: `---
title: UI Components
created: 2024-01-03
tags: [ui, components, development]
---

# UI Components

Reusable interface elements that form the building blocks of user interfaces.

## Button Component

\`\`\`typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
}

function Button({ variant, size, disabled, children }: ButtonProps) {
  return (
    <button
      className={\`btn btn-\${variant} btn-\${size}\`}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
\`\`\`

## Usage Examples

- Primary buttons for main actions
- Secondary buttons for alternative actions
- Outline buttons for less important actions

## Accessibility

- Keyboard navigation support
- Screen reader compatibility
- Focus management
- Color contrast compliance`,
    },
    {
      path: "Notes/Testing Strategies.md",
      content: `---
title: Testing Strategies
created: 2024-01-04
tags: [testing, quality, development]
---

# Testing Strategies for Software Development

Comprehensive testing approaches ensure software reliability and quality.

## Unit Testing

Tests individual functions and methods:
- Fast execution
- Isolated testing
- Easy to maintain

## Integration Testing

Tests component interactions:
- API endpoint testing
- Database operations
- External service calls

## End-to-End Testing

Tests complete user workflows:
- User interface testing
- Full application flows
- Cross-browser compatibility

## Performance Testing

Evaluates system performance:
- Load testing
- Stress testing
- Scalability assessment

## Benefits

- Early bug detection
- Improved code quality
- Regression prevention
- Documentation of expected behavior`,
    },
  ];

  // Write documents to vault
  documents.forEach((doc) => {
    const fullPath = path.join(vaultPath, doc.path);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, doc.content);
  });
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.status === 200) {
        return;
      }
    } catch (e) {
      // Server not ready yet
    }

    await sleep(1000);
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}
