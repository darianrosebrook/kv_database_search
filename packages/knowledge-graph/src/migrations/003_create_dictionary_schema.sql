-- Migration: Create Dictionary Integration Schema
-- Version: 003
-- Description: Dictionary data integration for enhanced semantic search
-- Author: Dictionary Integration Team
-- Date: 2025-01-25
-- Depends on: 001_create_knowledge_graph_schema.sql, 002_create_provenance_schema.sql

-- This migration creates the dictionary integration schema including:
-- - Dictionary source management tables
-- - Lexical relationship storage
-- - Entity canonicalization mappings
-- - Performance optimization indexes
-- - Data integrity constraints

BEGIN;

-- Check if migration has already been applied
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'dictionary_sources') THEN
        RAISE NOTICE 'Dictionary schema already exists, skipping migration';
        RETURN;
    END IF;
END
$$;

-- ============================================================================
-- DICTIONARY SOURCE MANAGEMENT
-- ============================================================================

-- Dictionary source types enumeration
CREATE TYPE dictionary_source_type AS ENUM (
    'wordnet',
    'wiktionary', 
    'openthesaurus',
    'freedict',
    'custom'
);

-- Dictionary source status enumeration
CREATE TYPE dictionary_source_status AS ENUM (
    'available',
    'updating',
    'unavailable',
    'deprecated'
);

-- Dictionary sources registry
CREATE TABLE dictionary_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name dictionary_source_type NOT NULL,
    version VARCHAR(50) NOT NULL,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    status dictionary_source_status NOT NULL DEFAULT 'available',
    
    -- Metadata and capabilities
    description TEXT,
    capabilities TEXT[] DEFAULT '{}', -- ['definitions', 'synonyms', 'relationships', 'etymology']
    entry_count INTEGER DEFAULT 0 CHECK (entry_count >= 0),
    
    -- Data integrity
    data_checksum VARCHAR(64), -- SHA-256 of source data
    schema_version VARCHAR(20) NOT NULL DEFAULT '1.0',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_sync TIMESTAMPTZ,
    
    -- Configuration
    config JSONB DEFAULT '{}',
    
    -- Constraints
    UNIQUE(name, version, language),
    CONSTRAINT valid_language_code CHECK (language ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

-- ============================================================================
-- LEXICAL DATA STORAGE
-- ============================================================================

-- Part of speech enumeration
CREATE TYPE part_of_speech AS ENUM (
    'noun',
    'verb', 
    'adjective',
    'adverb',
    'pronoun',
    'preposition',
    'conjunction',
    'interjection',
    'other'
);

-- Semantic relationship types (WordNet-based)
CREATE TYPE semantic_relationship_type AS ENUM (
    'hypernym',      -- is-a (more general)
    'hyponym',       -- is-a (more specific)
    'meronym',       -- part-of
    'holonym',       -- has-part
    'synonym',       -- same meaning
    'antonym',       -- opposite meaning
    'similar_to',    -- similar meaning
    'also',          -- see also
    'entails',       -- verb entailment
    'causes',        -- causation
    'derived_from',  -- morphological derivation
    'related_to'     -- general relation
);

-- Synsets (synonym sets) - core lexical units
CREATE TABLE synsets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synset_id VARCHAR(50) NOT NULL, -- e.g., 'technology.n.01'
    source_id UUID NOT NULL REFERENCES dictionary_sources(id) ON DELETE CASCADE,
    
    -- Lexical properties
    lemma VARCHAR(200) NOT NULL, -- canonical form
    part_of_speech part_of_speech NOT NULL,
    definition TEXT NOT NULL,
    examples TEXT[] DEFAULT '{}',
    
    -- Quality metrics
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    usage_frequency INTEGER DEFAULT 0 CHECK (usage_frequency >= 0),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(synset_id, source_id),
    CONSTRAINT non_empty_definition CHECK (length(trim(definition)) > 0),
    CONSTRAINT non_empty_lemma CHECK (length(trim(lemma)) > 0)
);

-- Lexical entries (individual words/phrases)
CREATE TABLE lexical_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    synset_id UUID NOT NULL REFERENCES synsets(id) ON DELETE CASCADE,
    
    -- Word form data
    word_form VARCHAR(200) NOT NULL,
    canonical_form VARCHAR(200) NOT NULL,
    aliases TEXT[] DEFAULT '{}',
    
    -- Linguistic properties
    pronunciation VARCHAR(200),
    etymology TEXT,
    morphology JSONB DEFAULT '{}',
    
    -- Usage statistics
    frequency_rank INTEGER,
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    
    -- Quality metrics
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT non_empty_word_form CHECK (length(trim(word_form)) > 0),
    CONSTRAINT non_empty_canonical_form CHECK (length(trim(canonical_form)) > 0)
);

-- Semantic relationships between synsets
CREATE TABLE lexical_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_synset_id UUID NOT NULL REFERENCES synsets(id) ON DELETE CASCADE,
    target_synset_id UUID NOT NULL REFERENCES synsets(id) ON DELETE CASCADE,
    
    -- Relationship properties
    relationship_type semantic_relationship_type NOT NULL,
    confidence DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Directionality
    bidirectional BOOLEAN NOT NULL DEFAULT false,
    
    -- Evidence and validation
    evidence_count INTEGER DEFAULT 1 CHECK (evidence_count > 0),
    validation_status VARCHAR(20) DEFAULT 'unvalidated' CHECK (validation_status IN ('validated', 'unvalidated', 'rejected')),
    
    -- Source tracking
    source_id UUID NOT NULL REFERENCES dictionary_sources(id) ON DELETE CASCADE,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT no_self_reference CHECK (source_synset_id != target_synset_id),
    UNIQUE(source_synset_id, target_synset_id, relationship_type, source_id)
);

-- ============================================================================
-- ENTITY-DICTIONARY INTEGRATION
-- ============================================================================

-- Entity canonicalization mappings
CREATE TABLE entity_canonical_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    
    -- Canonicalization data
    original_name VARCHAR(500) NOT NULL,
    canonical_name VARCHAR(500) NOT NULL,
    canonical_synset_id UUID REFERENCES synsets(id) ON DELETE SET NULL,
    
    -- Quality metrics
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    validation_status VARCHAR(20) DEFAULT 'unvalidated' CHECK (validation_status IN ('validated', 'unvalidated', 'rejected')),
    
    -- Source tracking
    source_id UUID NOT NULL REFERENCES dictionary_sources(id) ON DELETE CASCADE,
    disambiguation_context TEXT,
    
    -- Alternative forms
    alternative_forms TEXT[] DEFAULT '{}',
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(entity_id, source_id),
    CONSTRAINT non_empty_original_name CHECK (length(trim(original_name)) > 0),
    CONSTRAINT non_empty_canonical_name CHECK (length(trim(canonical_name)) > 0)
);

-- Entity synonym mappings
CREATE TABLE entity_synonyms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES knowledge_graph_entities(id) ON DELETE CASCADE,
    
    -- Synonym data
    synonym VARCHAR(500) NOT NULL,
    synonym_type VARCHAR(50) NOT NULL DEFAULT 'exact', -- 'exact', 'near', 'related'
    
    -- Quality metrics
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    relevance_score DECIMAL(3,2) NOT NULL DEFAULT 1.0 CHECK (relevance_score >= 0.0 AND relevance_score <= 1.0),
    
    -- Source tracking
    source_id UUID NOT NULL REFERENCES dictionary_sources(id) ON DELETE CASCADE,
    synset_id UUID REFERENCES synsets(id) ON DELETE SET NULL,
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0 CHECK (usage_count >= 0),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Temporal tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT non_empty_synonym CHECK (length(trim(synonym)) > 0),
    UNIQUE(entity_id, synonym, source_id)
);

-- ============================================================================
-- PERFORMANCE OPTIMIZATION INDEXES
-- ============================================================================

-- Dictionary sources indexes
CREATE INDEX idx_dictionary_sources_name_version ON dictionary_sources(name, version);
CREATE INDEX idx_dictionary_sources_status ON dictionary_sources(status) WHERE status = 'available';
CREATE INDEX idx_dictionary_sources_language ON dictionary_sources(language);

-- Synsets indexes
CREATE INDEX idx_synsets_synset_id ON synsets(synset_id);
CREATE INDEX idx_synsets_source_id ON synsets(source_id);
CREATE INDEX idx_synsets_lemma ON synsets(lemma);
CREATE INDEX idx_synsets_pos ON synsets(part_of_speech);
CREATE INDEX idx_synsets_confidence ON synsets(confidence) WHERE confidence >= 0.7;

-- Full-text search on synset definitions
CREATE INDEX idx_synsets_definition_fts ON synsets USING gin(to_tsvector('english', definition));

-- Lexical entries indexes
CREATE INDEX idx_lexical_entries_synset_id ON lexical_entries(synset_id);
CREATE INDEX idx_lexical_entries_word_form ON lexical_entries(word_form);
CREATE INDEX idx_lexical_entries_canonical_form ON lexical_entries(canonical_form);
CREATE INDEX idx_lexical_entries_frequency ON lexical_entries(frequency_rank) WHERE frequency_rank IS NOT NULL;

-- Full-text search on word forms and aliases
CREATE INDEX idx_lexical_entries_word_fts ON lexical_entries USING gin(
    to_tsvector('english', word_form || ' ' || canonical_form || ' ' || coalesce(array_to_string(aliases, ' '), ''))
);

-- Lexical relationships indexes
CREATE INDEX idx_lexical_relationships_source ON lexical_relationships(source_synset_id);
CREATE INDEX idx_lexical_relationships_target ON lexical_relationships(target_synset_id);
CREATE INDEX idx_lexical_relationships_type ON lexical_relationships(relationship_type);
CREATE INDEX idx_lexical_relationships_confidence ON lexical_relationships(confidence) WHERE confidence >= 0.5;

-- Composite index for relationship queries
CREATE INDEX idx_lexical_relationships_composite ON lexical_relationships(source_synset_id, relationship_type, confidence DESC);

-- Entity canonicalization indexes
CREATE INDEX idx_entity_canonical_forms_entity_id ON entity_canonical_forms(entity_id);
CREATE INDEX idx_entity_canonical_forms_canonical_name ON entity_canonical_forms(canonical_name);
CREATE INDEX idx_entity_canonical_forms_synset_id ON entity_canonical_forms(canonical_synset_id) WHERE canonical_synset_id IS NOT NULL;
CREATE INDEX idx_entity_canonical_forms_confidence ON entity_canonical_forms(confidence) WHERE confidence >= 0.7;

-- Entity synonyms indexes
CREATE INDEX idx_entity_synonyms_entity_id ON entity_synonyms(entity_id);
CREATE INDEX idx_entity_synonyms_synonym ON entity_synonyms(synonym);
CREATE INDEX idx_entity_synonyms_type ON entity_synonyms(synonym_type);
CREATE INDEX idx_entity_synonyms_confidence ON entity_synonyms(confidence) WHERE confidence >= 0.5;

-- Full-text search on synonyms
CREATE INDEX idx_entity_synonyms_fts ON entity_synonyms USING gin(to_tsvector('english', synonym));

-- ============================================================================
-- DATA INTEGRITY TRIGGERS
-- ============================================================================

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_dictionary_sources_updated_at BEFORE UPDATE ON dictionary_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_synsets_updated_at BEFORE UPDATE ON synsets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lexical_entries_updated_at BEFORE UPDATE ON lexical_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lexical_relationships_updated_at BEFORE UPDATE ON lexical_relationships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entity_canonical_forms_updated_at BEFORE UPDATE ON entity_canonical_forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_entity_synonyms_updated_at BEFORE UPDATE ON entity_synonyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DICTIONARY INTEGRATION VIEWS
-- ============================================================================

-- View for entity enrichment with dictionary data
CREATE VIEW entity_dictionary_enrichment AS
SELECT 
    e.id as entity_id,
    e.name as original_name,
    e.canonical_name,
    e.type as entity_type,
    
    -- Canonicalization data
    ecf.canonical_name as dictionary_canonical_name,
    ecf.confidence as canonicalization_confidence,
    ecf.source_id as canonicalization_source_id,
    ds1.name as canonicalization_source_name,
    
    -- Synonyms aggregation
    COALESCE(
        array_agg(DISTINCT es.synonym ORDER BY es.confidence DESC) 
        FILTER (WHERE es.synonym IS NOT NULL), 
        '{}'::text[]
    ) as dictionary_synonyms,
    
    -- Semantic relationships count
    COUNT(DISTINCT lr.id) as semantic_relationships_count,
    
    -- Quality metrics
    AVG(es.confidence) as avg_synonym_confidence,
    MAX(ecf.confidence) as max_canonicalization_confidence
    
FROM knowledge_graph_entities e
LEFT JOIN entity_canonical_forms ecf ON e.id = ecf.entity_id
LEFT JOIN dictionary_sources ds1 ON ecf.source_id = ds1.id
LEFT JOIN entity_synonyms es ON e.id = es.entity_id
LEFT JOIN synsets s ON ecf.canonical_synset_id = s.id
LEFT JOIN lexical_relationships lr ON s.id = lr.source_synset_id OR s.id = lr.target_synset_id
GROUP BY 
    e.id, e.name, e.canonical_name, e.type,
    ecf.canonical_name, ecf.confidence, ecf.source_id, ds1.name;

-- View for dictionary source health monitoring
CREATE VIEW dictionary_source_health AS
SELECT 
    ds.id,
    ds.name,
    ds.version,
    ds.language,
    ds.status,
    ds.entry_count,
    ds.last_sync,
    
    -- Usage statistics
    COUNT(DISTINCT s.id) as synset_count,
    COUNT(DISTINCT le.id) as lexical_entry_count,
    COUNT(DISTINCT lr.id) as relationship_count,
    COUNT(DISTINCT ecf.id) as canonicalization_count,
    
    -- Quality metrics
    AVG(s.confidence) as avg_synset_confidence,
    AVG(lr.confidence) as avg_relationship_confidence,
    
    -- Freshness indicators
    EXTRACT(EPOCH FROM (NOW() - ds.last_sync)) / 3600 as hours_since_sync,
    CASE 
        WHEN ds.last_sync IS NULL THEN 'never_synced'
        WHEN ds.last_sync < NOW() - INTERVAL '24 hours' THEN 'stale'
        WHEN ds.last_sync < NOW() - INTERVAL '1 hour' THEN 'aging'
        ELSE 'fresh'
    END as freshness_status
    
FROM dictionary_sources ds
LEFT JOIN synsets s ON ds.id = s.source_id
LEFT JOIN lexical_entries le ON s.id = le.synset_id
LEFT JOIN lexical_relationships lr ON ds.id = lr.source_id
LEFT JOIN entity_canonical_forms ecf ON ds.id = ecf.source_id
GROUP BY ds.id, ds.name, ds.version, ds.language, ds.status, ds.entry_count, ds.last_sync;

-- ============================================================================
-- DICTIONARY CONFIGURATION
-- ============================================================================

-- Dictionary integration configuration table
CREATE TABLE dictionary_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT non_empty_key CHECK (length(trim(key)) > 0)
);

-- Insert default configuration
INSERT INTO dictionary_config (key, value, description) VALUES
('cache_ttl_seconds', '3600', 'Dictionary lookup cache TTL in seconds'),
('max_synonyms_per_entity', '10', 'Maximum number of synonyms to store per entity'),
('min_confidence_threshold', '0.7', 'Minimum confidence threshold for dictionary data'),
('enable_auto_canonicalization', 'true', 'Enable automatic entity canonicalization'),
('preferred_sources', '["wordnet", "wiktionary"]', 'Preferred dictionary sources in order'),
('batch_size', '1000', 'Batch size for dictionary processing operations'),
('enable_relationship_inference', 'true', 'Enable semantic relationship inference'),
('max_relationship_depth', '3', 'Maximum depth for relationship traversal');

-- Apply update trigger to config table
CREATE TRIGGER update_dictionary_config_updated_at BEFORE UPDATE ON dictionary_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETION
-- ============================================================================

-- Record migration completion
INSERT INTO schema_migrations (version, description, applied_at) VALUES 
('003', 'Create dictionary integration schema', NOW())
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- ============================================================================
-- POST-MIGRATION NOTES
-- ============================================================================

-- Performance recommendations:
-- 1. Consider partitioning large tables (synsets, lexical_entries) by source_id
-- 2. Monitor query performance and add additional indexes as needed
-- 3. Implement regular VACUUM and ANALYZE on dictionary tables
-- 4. Consider using connection pooling for dictionary service queries

-- Data integrity recommendations:
-- 1. Implement regular data validation checks
-- 2. Monitor dictionary source health via dictionary_source_health view
-- 3. Set up alerts for stale dictionary data
-- 4. Implement backup and recovery procedures for dictionary data
