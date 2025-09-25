-- Migration: Create Knowledge Graph Schema
-- Version: 001
-- Description: Initial schema for Graph RAG-enhanced semantic search
-- Author: Graph RAG Implementation Team
-- Date: 2025-01-25

-- This migration creates the complete knowledge graph schema including:
-- - Entity and relationship tables
-- - Indexes for performance optimization  
-- - Triggers for data consistency
-- - Views for common queries
-- - Configuration tables

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'knowledge_graph_entities') THEN
        RAISE NOTICE 'Knowledge graph schema already exists, skipping migration';
        RETURN;
    END IF;
END
$$;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE entity_type AS ENUM (
    'PERSON',
    'ORGANIZATION', 
    'LOCATION',
    'CONCEPT',
    'TECHNOLOGY',
    'PRODUCT',
    'EVENT',
    'DATE',
    'MONEY',
    'OTHER'
);

CREATE TYPE relationship_type AS ENUM (
    'WORKS_FOR',
    'PART_OF',
    'RELATED_TO',
    'MENTIONS',
    'LOCATED_IN',
    'CREATED_BY',
    'USED_BY',
    'SIMILAR_TO',
    'DEPENDS_ON',
    'COLLABORATES_WITH',
    'COMPETES_WITH',
    'INFLUENCES',
    'OTHER'
);

CREATE TYPE content_type AS ENUM (
    'pdf',
    'video', 
    'audio',
    'image',
    'markdown',
    'html',
    'csv',
    'office_document',
    'office_spreadsheet',
    'office_presentation'
);

CREATE TYPE extraction_method AS ENUM (
    'text_extraction',
    'ocr',
    'speech_to_text',
    'manual',
    'nlp_pipeline',
    'llm_extraction'
);

-- Create main tables
CREATE TABLE knowledge_graph_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(500) NOT NULL,
    canonical_name VARCHAR(500) NOT NULL,
    type entity_type NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0),
    validation_status VARCHAR(20) DEFAULT 'unvalidated' CHECK (validation_status IN ('validated', 'unvalidated', 'rejected')),
    embedding vector(768),
    occurrence_count INTEGER DEFAULT 1 CHECK (occurrence_count > 0),
    document_frequency INTEGER DEFAULT 1 CHECK (document_frequency > 0),
    source_files TEXT[] NOT NULL DEFAULT '{}',
    extraction_methods extraction_method[] NOT NULL DEFAULT '{}',
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', coalesce(array_to_string(aliases, ' '), '')), 'B')
    ) STORED,
    CONSTRAINT valid_confidence_range CHECK (confidence >= 0.7),
    CONSTRAINT non_empty_name CHECK (length(trim(name)) > 0),
    CONSTRAINT non_empty_canonical CHECK (length(trim(canonical_name)) > 0)
);

CREATE TABLE knowledge_graph_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    type relationship_type NOT NULL,
    is_directional BOOLEAN DEFAULT false,
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    strength DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
    cooccurrence_count INTEGER DEFAULT 1 CHECK (cooccurrence_count > 0),
    mutual_information DECIMAL(10,6),
    pointwise_mutual_information DECIMAL(10,6),
    source_chunk_ids UUID[] DEFAULT '{}',
    extraction_context TEXT,
    supporting_text TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}',
    CONSTRAINT no_self_relationships CHECK (source_entity_id != target_entity_id),
    CONSTRAINT valid_confidence_range CHECK (confidence >= 0.5),
    CONSTRAINT valid_cooccurrence CHECK (cooccurrence_count > 0)
);

CREATE TABLE entity_chunk_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES obsidian_chunks(id) ON DELETE CASCADE,
    mention_text TEXT NOT NULL,
    mention_context TEXT,
    start_position INTEGER,
    end_position INTEGER,
    extraction_method extraction_method NOT NULL,
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_entity_chunk_mention UNIQUE (entity_id, chunk_id, mention_text),
    CONSTRAINT valid_position_range CHECK (
        (start_position IS NULL AND end_position IS NULL) OR 
        (start_position IS NOT NULL AND end_position IS NOT NULL AND start_position <= end_position)
    )
);

CREATE TABLE graph_search_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text TEXT NOT NULL,
    query_hash VARCHAR(64) NOT NULL,
    search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('vector', 'graph', 'hybrid')),
    max_results INTEGER DEFAULT 10,
    max_hops INTEGER DEFAULT 2,
    min_confidence DECIMAL(3,2) DEFAULT 0.5,
    content_type_filters content_type[],
    result_count INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER NOT NULL,
    vector_search_time_ms INTEGER,
    graph_traversal_time_ms INTEGER,
    nodes_visited INTEGER DEFAULT 0,
    edges_traversed INTEGER DEFAULT 0,
    max_hops_reached INTEGER DEFAULT 0,
    user_id VARCHAR(100),
    session_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE entity_similarity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity1_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    entity2_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    cosine_similarity DECIMAL(5,4) NOT NULL CHECK (cosine_similarity >= -1.0 AND cosine_similarity <= 1.0),
    semantic_similarity DECIMAL(5,4),
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    computation_method VARCHAR(50) NOT NULL DEFAULT 'cosine',
    CONSTRAINT unique_entity_pair UNIQUE (entity1_id, entity2_id),
    CONSTRAINT ordered_entity_pair CHECK (entity1_id < entity2_id)
);

-- Create indexes
CREATE INDEX idx_entities_type ON knowledge_graph_entities(type);
CREATE INDEX idx_entities_confidence ON knowledge_graph_entities(confidence DESC);
CREATE INDEX idx_entities_canonical_name ON knowledge_graph_entities(canonical_name);
CREATE INDEX idx_entities_search_vector ON knowledge_graph_entities USING GIN(search_vector);
CREATE INDEX idx_entities_embedding ON knowledge_graph_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_entities_last_updated ON knowledge_graph_entities(last_updated DESC);
CREATE INDEX idx_entities_source_files ON knowledge_graph_entities USING GIN(source_files);

CREATE INDEX idx_relationships_source ON knowledge_graph_relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON knowledge_graph_relationships(target_entity_id);
CREATE INDEX idx_relationships_type ON knowledge_graph_relationships(type);
CREATE INDEX idx_relationships_confidence ON knowledge_graph_relationships(confidence DESC);
CREATE INDEX idx_relationships_strength ON knowledge_graph_relationships(strength DESC);
CREATE INDEX idx_relationships_created_at ON knowledge_graph_relationships(created_at DESC);
CREATE INDEX idx_relationships_source_type ON knowledge_graph_relationships(source_entity_id, type);
CREATE INDEX idx_relationships_target_type ON knowledge_graph_relationships(target_entity_id, type);
CREATE INDEX idx_relationships_bidirectional ON knowledge_graph_relationships(source_entity_id, target_entity_id, type);

CREATE INDEX idx_entity_chunks_entity ON entity_chunk_mappings(entity_id);
CREATE INDEX idx_entity_chunks_chunk ON entity_chunk_mappings(chunk_id);
CREATE INDEX idx_entity_chunks_method ON entity_chunk_mappings(extraction_method);

CREATE INDEX idx_search_sessions_query_hash ON graph_search_sessions(query_hash);
CREATE INDEX idx_search_sessions_created_at ON graph_search_sessions(created_at DESC);
CREATE INDEX idx_search_sessions_search_type ON graph_search_sessions(search_type);
CREATE INDEX idx_search_sessions_execution_time ON graph_search_sessions(execution_time_ms);

CREATE INDEX idx_similarity_cache_entity1 ON entity_similarity_cache(entity1_id);
CREATE INDEX idx_similarity_cache_entity2 ON entity_similarity_cache(entity2_id);
CREATE INDEX idx_similarity_cache_similarity ON entity_similarity_cache(cosine_similarity DESC);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_entities_last_updated 
    BEFORE UPDATE ON knowledge_graph_entities 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_relationships_updated_at 
    BEFORE UPDATE ON knowledge_graph_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE OR REPLACE FUNCTION normalize_entity_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(trim(regexp_replace(input_name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION set_canonical_name()
RETURNS TRIGGER AS $$
BEGIN
    NEW.canonical_name = normalize_entity_name(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_entity_canonical_name
    BEFORE INSERT OR UPDATE ON knowledge_graph_entities
    FOR EACH ROW EXECUTE FUNCTION set_canonical_name();

CREATE OR REPLACE FUNCTION prevent_duplicate_relationships()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM knowledge_graph_relationships 
        WHERE (
            (source_entity_id = NEW.source_entity_id AND target_entity_id = NEW.target_entity_id) OR
            (NOT NEW.is_directional AND source_entity_id = NEW.target_entity_id AND target_entity_id = NEW.source_entity_id)
        ) AND type = NEW.type AND id != COALESCE(NEW.id, uuid_generate_v4())
    ) THEN
        RAISE EXCEPTION 'Duplicate relationship already exists between entities % and % of type %', 
            NEW.source_entity_id, NEW.target_entity_id, NEW.type;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_duplicate_relationships_trigger
    BEFORE INSERT OR UPDATE ON knowledge_graph_relationships
    FOR EACH ROW EXECUTE FUNCTION prevent_duplicate_relationships();

-- Create views
CREATE VIEW entity_statistics AS
SELECT 
    type,
    COUNT(*) as entity_count,
    AVG(confidence) as avg_confidence,
    AVG(occurrence_count) as avg_occurrences,
    MIN(first_seen) as earliest_entity,
    MAX(last_updated) as latest_update
FROM knowledge_graph_entities
GROUP BY type;

CREATE VIEW relationship_statistics AS
SELECT 
    type,
    COUNT(*) as relationship_count,
    AVG(confidence) as avg_confidence,
    AVG(strength) as avg_strength,
    AVG(cooccurrence_count) as avg_cooccurrence
FROM knowledge_graph_relationships
GROUP BY type;

CREATE VIEW entity_connectivity AS
SELECT 
    e.id,
    e.name,
    e.type,
    COUNT(r.id) as connection_count,
    AVG(r.strength) as avg_relationship_strength
FROM knowledge_graph_entities e
LEFT JOIN knowledge_graph_relationships r ON (e.id = r.source_entity_id OR e.id = r.target_entity_id)
GROUP BY e.id, e.name, e.type
ORDER BY connection_count DESC;

-- Create configuration table
CREATE TABLE graph_config (
    key VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO graph_config (key, value, description) VALUES
('min_entity_confidence', '0.7', 'Minimum confidence threshold for entity inclusion'),
('min_relationship_confidence', '0.5', 'Minimum confidence threshold for relationship inclusion'),
('max_traversal_hops', '3', 'Maximum number of hops for graph traversal'),
('similarity_threshold', '0.7', 'Minimum similarity threshold for entity matching'),
('cache_similarity_ttl_hours', '24', 'TTL for similarity cache entries in hours'),
('enable_auto_merge', 'false', 'Whether to automatically merge similar entities');

-- Record migration completion
CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(20) PRIMARY KEY,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    description TEXT
);

INSERT INTO schema_migrations (version, description) VALUES 
('001', 'Create knowledge graph schema for Graph RAG-enhanced semantic search');

COMMIT;

-- Rollback script (for reference, not executed)
/*
-- To rollback this migration:

BEGIN;

-- Drop views
DROP VIEW IF EXISTS entity_connectivity;
DROP VIEW IF EXISTS relationship_statistics;
DROP VIEW IF EXISTS entity_statistics;

-- Drop triggers
DROP TRIGGER IF EXISTS prevent_duplicate_relationships_trigger ON knowledge_graph_relationships;
DROP TRIGGER IF EXISTS set_entity_canonical_name ON knowledge_graph_entities;
DROP TRIGGER IF EXISTS update_relationships_updated_at ON knowledge_graph_relationships;
DROP TRIGGER IF EXISTS update_entities_last_updated ON knowledge_graph_entities;

-- Drop functions
DROP FUNCTION IF EXISTS prevent_duplicate_relationships();
DROP FUNCTION IF EXISTS set_canonical_name();
DROP FUNCTION IF EXISTS normalize_entity_name(TEXT);
DROP FUNCTION IF EXISTS update_last_updated_column();

-- Drop tables (in reverse dependency order)
DROP TABLE IF EXISTS entity_similarity_cache;
DROP TABLE IF EXISTS graph_search_sessions;
DROP TABLE IF EXISTS entity_chunk_mappings;
DROP TABLE IF EXISTS knowledge_graph_relationships;
DROP TABLE IF EXISTS knowledge_graph_entities;
DROP TABLE IF EXISTS graph_config;

-- Drop types
DROP TYPE IF EXISTS extraction_method;
DROP TYPE IF EXISTS content_type;
DROP TYPE IF EXISTS relationship_type;
DROP TYPE IF EXISTS entity_type;

-- Remove migration record
DELETE FROM schema_migrations WHERE version = '001';

COMMIT;
*/
