#!/usr/bin/env tsx

/**
 * Simple test server to validate basic functionality
 */

import express from "express";
import cors from "cors";

const app: express.Application = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

app.post("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint working",
    received: req.body,
  });
});

app.listen(PORT, () => {
  console.log(`✅ Test server running on http://localhost:${PORT}`);
  console.log("📊 Health check: http://localhost:3001/health");
  console.log("🧪 Test endpoint: POST http://localhost:3001/test");
});

export default app;
