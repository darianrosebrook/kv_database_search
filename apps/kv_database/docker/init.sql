-- Test database initialization for Obsidian RAG
-- This script runs when the PostgreSQL container starts

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant permissions to test user
GRANT ALL PRIVILEGES ON DATABASE test_rag_db TO testuser;
GRANT ALL ON SCHEMA public TO testuser;
