-- Knowledge Graph Database Schema
-- Supports Graph RAG-enhanced semantic search with entity relationships and multi-hop reasoning

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text matching

-- Entity types enumeration
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

-- Relationship types enumeration
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

-- Content types enumeration (matching existing system)
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

-- Extraction methods enumeration
CREATE TYPE extraction_method AS ENUM (
    'text_extraction',
    'ocr',
    'speech_to_text',
    'manual',
    'nlp_pipeline',
    'llm_extraction'
);

-- ============================================================================
-- CORE ENTITY TABLE
-- ============================================================================

CREATE TABLE knowledge_graph_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Core entity information
    name VARCHAR(500) NOT NULL,
    canonical_name VARCHAR(500) NOT NULL, -- Normalized/canonical form
    type entity_type NOT NULL,
    aliases TEXT[] DEFAULT '{}', -- Alternative names/mentions
    
    -- Confidence and quality metrics
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0),
    validation_status VARCHAR(20) DEFAULT 'unvalidated' CHECK (validation_status IN ('validated', 'unvalidated', 'rejected')),
    
    -- Vector embedding for similarity search (768 dimensions for standard models)
    embedding vector(768),
    
    -- Occurrence and frequency data
    occurrence_count INTEGER DEFAULT 1 CHECK (occurrence_count > 0),
    document_frequency INTEGER DEFAULT 1 CHECK (document_frequency > 0), -- Number of documents containing this entity
    
    -- Source tracking
    source_files TEXT[] NOT NULL DEFAULT '{}',
    extraction_methods extraction_method[] NOT NULL DEFAULT '{}',
    
    -- Temporal information
    first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_occurrence TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata as JSONB for flexibility
    metadata JSONB DEFAULT '{}',
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        setweight(to_tsvector('english', name), 'A') ||
        setweight(to_tsvector('english', coalesce(array_to_string(aliases, ' '), '')), 'B')
    ) STORED,
    
    -- Constraints
    CONSTRAINT valid_confidence_range CHECK (confidence >= 0.7), -- Only high-confidence entities
    CONSTRAINT non_empty_name CHECK (length(trim(name)) > 0),
    CONSTRAINT non_empty_canonical CHECK (length(trim(canonical_name)) > 0)
);

-- ============================================================================
-- ENTITY RELATIONSHIPS TABLE
-- ============================================================================

CREATE TABLE knowledge_graph_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Relationship endpoints
    source_entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    
    -- Relationship properties
    type relationship_type NOT NULL,
    is_directional BOOLEAN DEFAULT false,
    
    -- Confidence and strength metrics
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    strength DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (strength >= 0.0 AND strength <= 1.0),
    
    -- Evidence and support
    cooccurrence_count INTEGER DEFAULT 1 CHECK (cooccurrence_count > 0),
    mutual_information DECIMAL(10,6), -- Statistical measure of association
    pointwise_mutual_information DECIMAL(10,6), -- PMI score
    
    -- Source evidence
    source_chunk_ids UUID[] DEFAULT '{}', -- References to obsidian_chunks
    extraction_context TEXT, -- Context where relationship was found
    supporting_text TEXT[], -- Text snippets supporting this relationship
    
    -- Temporal information
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_observed TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Constraints
    CONSTRAINT no_self_relationships CHECK (source_entity_id != target_entity_id),
    CONSTRAINT valid_confidence_range CHECK (confidence >= 0.5), -- Minimum confidence threshold
    CONSTRAINT valid_cooccurrence CHECK (cooccurrence_count > 0)
);

-- ============================================================================
-- ENTITY-CHUNK MAPPING TABLE
-- ============================================================================

CREATE TABLE entity_chunk_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- References
    entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    chunk_id UUID NOT NULL REFERENCES obsidian_chunks(id) ON DELETE CASCADE,
    
    -- Mapping details
    mention_text TEXT NOT NULL, -- Exact text that was recognized as this entity
    mention_context TEXT, -- Surrounding context
    start_position INTEGER, -- Character position in chunk (if available)
    end_position INTEGER,
    
    -- Extraction details
    extraction_method extraction_method NOT NULL,
    extraction_confidence DECIMAL(3,2) NOT NULL CHECK (extraction_confidence >= 0.0 AND extraction_confidence <= 1.0),
    
    -- Temporal information
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_entity_chunk_mention UNIQUE (entity_id, chunk_id, mention_text),
    CONSTRAINT valid_position_range CHECK (
        (start_position IS NULL AND end_position IS NULL) OR 
        (start_position IS NOT NULL AND end_position IS NOT NULL AND start_position <= end_position)
    )
);

-- ============================================================================
-- SEARCH SESSIONS TABLE (for query optimization and analytics)
-- ============================================================================

CREATE TABLE graph_search_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Query information
    query_text TEXT NOT NULL,
    query_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for deduplication
    search_type VARCHAR(20) NOT NULL CHECK (search_type IN ('vector', 'graph', 'hybrid')),
    
    -- Search parameters
    max_results INTEGER DEFAULT 10,
    max_hops INTEGER DEFAULT 2,
    min_confidence DECIMAL(3,2) DEFAULT 0.5,
    content_type_filters content_type[],
    
    -- Results and performance
    result_count INTEGER NOT NULL DEFAULT 0,
    execution_time_ms INTEGER NOT NULL,
    vector_search_time_ms INTEGER,
    graph_traversal_time_ms INTEGER,
    
    -- Graph traversal metrics
    nodes_visited INTEGER DEFAULT 0,
    edges_traversed INTEGER DEFAULT 0,
    max_hops_reached INTEGER DEFAULT 0,
    
    -- User and session info
    user_id VARCHAR(100), -- Optional user identifier
    session_id VARCHAR(100), -- Optional session identifier
    ip_address INET,
    user_agent TEXT,
    
    -- Temporal information
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Metadata
    metadata JSONB DEFAULT '{}'
);

-- ============================================================================
-- ENTITY SIMILARITY CACHE (for performance optimization)
-- ============================================================================

CREATE TABLE entity_similarity_cache (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Entity pair
    entity1_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    entity2_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    
    -- Similarity metrics
    cosine_similarity DECIMAL(5,4) NOT NULL CHECK (cosine_similarity >= -1.0 AND cosine_similarity <= 1.0),
    semantic_similarity DECIMAL(5,4), -- Additional semantic similarity if available
    
    -- Cache metadata
    computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    computation_method VARCHAR(50) NOT NULL DEFAULT 'cosine',
    
    -- Constraints
    CONSTRAINT unique_entity_pair UNIQUE (entity1_id, entity2_id),
    CONSTRAINT ordered_entity_pair CHECK (entity1_id < entity2_id) -- Ensure consistent ordering
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Entity indexes
CREATE INDEX idx_entities_type ON knowledge_graph_entities(type);
CREATE INDEX idx_entities_confidence ON knowledge_graph_entities(confidence DESC);
CREATE INDEX idx_entities_canonical_name ON knowledge_graph_entities(canonical_name);
CREATE INDEX idx_entities_search_vector ON knowledge_graph_entities USING GIN(search_vector);
CREATE INDEX idx_entities_embedding ON knowledge_graph_entities USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_entities_last_updated ON knowledge_graph_entities(last_updated DESC);
CREATE INDEX idx_entities_source_files ON knowledge_graph_entities USING GIN(source_files);

-- Relationship indexes
CREATE INDEX idx_relationships_source ON knowledge_graph_relationships(source_entity_id);
CREATE INDEX idx_relationships_target ON knowledge_graph_relationships(target_entity_id);
CREATE INDEX idx_relationships_type ON knowledge_graph_relationships(type);
CREATE INDEX idx_relationships_confidence ON knowledge_graph_relationships(confidence DESC);
CREATE INDEX idx_relationships_strength ON knowledge_graph_relationships(strength DESC);
CREATE INDEX idx_relationships_created_at ON knowledge_graph_relationships(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX idx_relationships_source_type ON knowledge_graph_relationships(source_entity_id, type);
CREATE INDEX idx_relationships_target_type ON knowledge_graph_relationships(target_entity_id, type);
CREATE INDEX idx_relationships_bidirectional ON knowledge_graph_relationships(source_entity_id, target_entity_id, type);

-- Entity-chunk mapping indexes
CREATE INDEX idx_entity_chunks_entity ON entity_chunk_mappings(entity_id);
CREATE INDEX idx_entity_chunks_chunk ON entity_chunk_mappings(chunk_id);
CREATE INDEX idx_entity_chunks_method ON entity_chunk_mappings(extraction_method);

-- Search session indexes
CREATE INDEX idx_search_sessions_query_hash ON graph_search_sessions(query_hash);
CREATE INDEX idx_search_sessions_created_at ON graph_search_sessions(created_at DESC);
CREATE INDEX idx_search_sessions_search_type ON graph_search_sessions(search_type);
CREATE INDEX idx_search_sessions_execution_time ON graph_search_sessions(execution_time_ms);

-- Similarity cache indexes
CREATE INDEX idx_similarity_cache_entity1 ON entity_similarity_cache(entity1_id);
CREATE INDEX idx_similarity_cache_entity2 ON entity_similarity_cache(entity2_id);
CREATE INDEX idx_similarity_cache_similarity ON entity_similarity_cache(cosine_similarity DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update last_updated timestamp
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_entities_last_updated 
    BEFORE UPDATE ON knowledge_graph_entities 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_relationships_updated_at 
    BEFORE UPDATE ON knowledge_graph_relationships 
    FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- Function to maintain canonical names
CREATE OR REPLACE FUNCTION normalize_entity_name(input_name TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Normalize entity names: trim, lowercase, remove extra spaces
    RETURN lower(trim(regexp_replace(input_name, '\s+', ' ', 'g')));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Trigger to automatically set canonical names
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

-- Function to prevent duplicate relationships
CREATE OR REPLACE FUNCTION prevent_duplicate_relationships()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for existing relationship in either direction (unless directional)
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

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for entity statistics
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

-- View for relationship statistics  
CREATE VIEW relationship_statistics AS
SELECT 
    type,
    COUNT(*) as relationship_count,
    AVG(confidence) as avg_confidence,
    AVG(strength) as avg_strength,
    AVG(cooccurrence_count) as avg_cooccurrence
FROM knowledge_graph_relationships
GROUP BY type;

-- View for highly connected entities (hubs)
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

-- ============================================================================
-- INITIAL DATA AND CONFIGURATION
-- ============================================================================

-- Insert configuration parameters
CREATE TABLE IF NOT EXISTS graph_config (
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
('enable_auto_merge', 'false', 'Whether to automatically merge similar entities')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
