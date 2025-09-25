-- Migration: Create Provenance and Explanation Schema
-- Version: 002
-- Description: Adds comprehensive provenance tracking and explanation generation capabilities

-- UP: Apply the schema changes
CREATE OR REPLACE FUNCTION migrate_up_002() RETURNS VOID AS $$
BEGIN
    -- Table for storing provenance records
    CREATE TABLE IF NOT EXISTS provenance_records (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        user_id VARCHAR(255),
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        operation JSONB NOT NULL, -- ProvenanceOperation
        input_data JSONB NOT NULL, -- ProvenanceInput
        output_data JSONB NOT NULL, -- ProvenanceOutput
        processing_steps JSONB NOT NULL, -- ProcessingStep[]
        data_lineage JSONB NOT NULL, -- DataLineage[]
        quality_metrics JSONB NOT NULL, -- QualityMetrics
        audit_trail JSONB NOT NULL, -- AuditEvent[]
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for efficient querying
    CREATE INDEX IF NOT EXISTS idx_provenance_session_id ON provenance_records (session_id);
    CREATE INDEX IF NOT EXISTS idx_provenance_user_id ON provenance_records (user_id);
    CREATE INDEX IF NOT EXISTS idx_provenance_timestamp ON provenance_records (timestamp);
    CREATE INDEX IF NOT EXISTS idx_provenance_operation_type ON provenance_records USING GIN ((operation->>'type'));
    CREATE INDEX IF NOT EXISTS idx_provenance_confidence ON provenance_records USING GIN (((output_data->>'confidence')::float));

    -- Table for storing generated explanations
    CREATE TABLE IF NOT EXISTS explanations (
        id VARCHAR(255) PRIMARY KEY,
        provenance_id VARCHAR(255) NOT NULL REFERENCES provenance_records(id) ON DELETE CASCADE,
        template_id VARCHAR(255) NOT NULL,
        language VARCHAR(10) DEFAULT 'en',
        complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('simple', 'detailed', 'technical')),
        title TEXT NOT NULL,
        summary TEXT NOT NULL,
        sections JSONB NOT NULL, -- ExplanationSection[]
        visualizations JSONB DEFAULT '[]', -- VisualizationSpec[]
        interactive_elements JSONB DEFAULT '[]', -- InteractiveElement[]
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for explanations
    CREATE INDEX IF NOT EXISTS idx_explanations_provenance_id ON explanations (provenance_id);
    CREATE INDEX IF NOT EXISTS idx_explanations_template_id ON explanations (template_id);
    CREATE INDEX IF NOT EXISTS idx_explanations_complexity ON explanations (complexity);
    CREATE INDEX IF NOT EXISTS idx_explanations_confidence ON explanations (confidence);

    -- Table for explanation templates
    CREATE TABLE IF NOT EXISTS explanation_templates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        template TEXT NOT NULL,
        variables JSONB NOT NULL, -- string[]
        applicable_operations JSONB NOT NULL, -- string[]
        language VARCHAR(10) DEFAULT 'en',
        complexity VARCHAR(20) NOT NULL CHECK (complexity IN ('simple', 'detailed', 'technical')),
        version VARCHAR(50) DEFAULT '1.0.0',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for templates
    CREATE INDEX IF NOT EXISTS idx_templates_complexity ON explanation_templates (complexity);
    CREATE INDEX IF NOT EXISTS idx_templates_active ON explanation_templates (active);
    CREATE INDEX IF NOT EXISTS idx_templates_operations ON explanation_templates USING GIN (applicable_operations);

    -- Table for tracking data lineage relationships
    CREATE TABLE IF NOT EXISTS data_lineage_graph (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        source_id VARCHAR(255) NOT NULL,
        source_type VARCHAR(50) NOT NULL, -- 'file', 'chunk', 'entity', 'relationship', 'inference'
        target_id VARCHAR(255) NOT NULL,
        target_type VARCHAR(50) NOT NULL,
        relationship_type VARCHAR(50) NOT NULL, -- 'derived_from', 'transformed_to', 'inferred_from', 'aggregated_from'
        transformation_method VARCHAR(100),
        confidence FLOAT CHECK (confidence >= 0 AND confidence <= 1),
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for lineage graph
    CREATE INDEX IF NOT EXISTS idx_lineage_source ON data_lineage_graph (source_id, source_type);
    CREATE INDEX IF NOT EXISTS idx_lineage_target ON data_lineage_graph (target_id, target_type);
    CREATE INDEX IF NOT EXISTS idx_lineage_relationship ON data_lineage_graph (relationship_type);

    -- Table for audit events
    CREATE TABLE IF NOT EXISTS audit_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(255) UNIQUE NOT NULL,
        provenance_id VARCHAR(255) REFERENCES provenance_records(id) ON DELETE CASCADE,
        event_type VARCHAR(50) NOT NULL, -- 'access', 'modification', 'validation', 'error', 'warning'
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        actor VARCHAR(255) NOT NULL, -- user, system, algorithm
        action VARCHAR(100) NOT NULL,
        target VARCHAR(255) NOT NULL,
        details JSONB DEFAULT '{}',
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        session_id VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for audit events
    CREATE INDEX IF NOT EXISTS idx_audit_provenance_id ON audit_events (provenance_id);
    CREATE INDEX IF NOT EXISTS idx_audit_event_type ON audit_events (event_type);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events (timestamp);
    CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events (actor);
    CREATE INDEX IF NOT EXISTS idx_audit_severity ON audit_events (severity);
    CREATE INDEX IF NOT EXISTS idx_audit_session_id ON audit_events (session_id);

    -- Table for quality metrics history
    CREATE TABLE IF NOT EXISTS quality_metrics_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        provenance_id VARCHAR(255) NOT NULL REFERENCES provenance_records(id) ON DELETE CASCADE,
        metric_name VARCHAR(100) NOT NULL,
        metric_value FLOAT NOT NULL,
        measurement_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        measurement_context JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for quality metrics
    CREATE INDEX IF NOT EXISTS idx_quality_metrics_provenance ON quality_metrics_history (provenance_id);
    CREATE INDEX IF NOT EXISTS idx_quality_metrics_name ON quality_metrics_history (metric_name);
    CREATE INDEX IF NOT EXISTS idx_quality_metrics_timestamp ON quality_metrics_history (measurement_timestamp);

    -- Table for user feedback on explanations
    CREATE TABLE IF NOT EXISTS explanation_feedback (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        explanation_id VARCHAR(255) NOT NULL REFERENCES explanations(id) ON DELETE CASCADE,
        user_id VARCHAR(255),
        session_id VARCHAR(255),
        feedback_type VARCHAR(50) NOT NULL, -- 'helpful', 'not_helpful', 'incorrect', 'incomplete', 'too_complex', 'too_simple'
        rating INTEGER CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        improvement_suggestions JSONB DEFAULT '[]',
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes for feedback
    CREATE INDEX IF NOT EXISTS idx_feedback_explanation_id ON explanation_feedback (explanation_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON explanation_feedback (user_id);
    CREATE INDEX IF NOT EXISTS idx_feedback_type ON explanation_feedback (feedback_type);
    CREATE INDEX IF NOT EXISTS idx_feedback_rating ON explanation_feedback (rating);
    CREATE INDEX IF NOT EXISTS idx_feedback_timestamp ON explanation_feedback (timestamp);

    -- Create update trigger function if it doesn't exist
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $trigger$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $trigger$ LANGUAGE plpgsql;

    -- Apply update triggers
    CREATE OR REPLACE TRIGGER update_provenance_records_updated_at
        BEFORE UPDATE ON provenance_records
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE OR REPLACE TRIGGER update_explanations_updated_at
        BEFORE UPDATE ON explanations
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    CREATE OR REPLACE TRIGGER update_explanation_templates_updated_at
        BEFORE UPDATE ON explanation_templates
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

    -- Create views
    CREATE OR REPLACE VIEW provenance_summary AS
    SELECT 
        DATE_TRUNC('day', timestamp) as date,
        operation->>'type' as operation_type,
        operation->>'subtype' as operation_subtype,
        COUNT(*) as operation_count,
        AVG((output_data->>'confidence')::float) as avg_confidence,
        AVG(JSONB_ARRAY_LENGTH(output_data->'results')) as avg_result_count,
        AVG((quality_metrics->>'accuracy')::float) as avg_accuracy,
        AVG((quality_metrics->>'completeness')::float) as avg_completeness,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT user_id) as unique_users
    FROM provenance_records
    WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY DATE_TRUNC('day', timestamp), operation->>'type', operation->>'subtype'
    ORDER BY date DESC, operation_type, operation_subtype;

    CREATE OR REPLACE VIEW explanation_effectiveness AS
    SELECT 
        e.template_id,
        e.complexity,
        COUNT(*) as explanation_count,
        AVG(e.confidence) as avg_explanation_confidence,
        COUNT(f.id) as feedback_count,
        AVG(f.rating) as avg_rating,
        COUNT(CASE WHEN f.feedback_type = 'helpful' THEN 1 END) as helpful_count,
        COUNT(CASE WHEN f.feedback_type = 'not_helpful' THEN 1 END) as not_helpful_count,
        COUNT(CASE WHEN f.feedback_type = 'incorrect' THEN 1 END) as incorrect_count
    FROM explanations e
    LEFT JOIN explanation_feedback f ON e.id = f.explanation_id
    WHERE e.generated_at >= CURRENT_DATE - INTERVAL '30 days'
    GROUP BY e.template_id, e.complexity
    ORDER BY avg_rating DESC NULLS LAST, explanation_count DESC;

    -- Create utility functions
    CREATE OR REPLACE FUNCTION cleanup_old_provenance(retention_days INTEGER DEFAULT 90)
    RETURNS INTEGER AS $cleanup$
    DECLARE
        deleted_count INTEGER;
    BEGIN
        -- Delete old provenance records and cascade to related tables
        DELETE FROM provenance_records 
        WHERE timestamp < CURRENT_TIMESTAMP - (retention_days || ' days')::INTERVAL;
        
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Log the cleanup operation
        INSERT INTO audit_events (
            event_id, event_type, timestamp, actor, action, target, details, severity
        ) VALUES (
            'cleanup_' || EXTRACT(EPOCH FROM NOW())::TEXT,
            'modification',
            NOW(),
            'system',
            'cleanup_old_provenance',
            'provenance_records',
            jsonb_build_object('deleted_count', deleted_count, 'retention_days', retention_days),
            'low'
        );
        
        RETURN deleted_count;
    END;
    $cleanup$ LANGUAGE plpgsql;

    CREATE OR REPLACE FUNCTION get_provenance_stats(days_back INTEGER DEFAULT 7)
    RETURNS TABLE (
        total_operations BIGINT,
        unique_sessions BIGINT,
        unique_users BIGINT,
        avg_confidence NUMERIC,
        avg_quality_score NUMERIC,
        operation_breakdown JSONB
    ) AS $stats$
    BEGIN
        RETURN QUERY
        SELECT 
            COUNT(*) as total_operations,
            COUNT(DISTINCT session_id) as unique_sessions,
            COUNT(DISTINCT user_id) as unique_users,
            ROUND(AVG((output_data->>'confidence')::float), 3) as avg_confidence,
            ROUND(AVG((quality_metrics->>'accuracy')::float), 3) as avg_quality_score,
            jsonb_object_agg(
                operation->>'type', 
                COUNT(*)
            ) as operation_breakdown
        FROM provenance_records
        WHERE timestamp >= CURRENT_TIMESTAMP - (days_back || ' days')::INTERVAL
        GROUP BY (); -- Group by nothing to get overall stats
    END;
    $stats$ LANGUAGE plpgsql;

    -- Insert default explanation templates
    INSERT INTO explanation_templates (
        id, name, description, template, variables, applicable_operations, 
        language, complexity, version, active
    ) VALUES 
    (
        'search_simple',
        'Simple Search Explanation',
        'Basic explanation of search results for general users',
        'Found {{resultCount}} results for your search "{{query}}" with {{confidence}}% confidence.',
        '["query", "resultCount", "confidence"]',
        '["search"]',
        'en',
        'simple',
        '1.0.0',
        true
    ),
    (
        'search_detailed',
        'Detailed Search Explanation',
        'Comprehensive explanation of search methodology and results',
        'Your search for "{{query}}" used {{searchStrategy}} approach, analyzing {{sourceCount}} sources to find {{resultCount}} relevant results with {{confidence}}% confidence. The search process involved {{processingSteps}} steps including vector similarity matching and knowledge graph traversal.',
        '["query", "searchStrategy", "sourceCount", "resultCount", "confidence", "processingSteps"]',
        '["search"]',
        'en',
        'detailed',
        '1.0.0',
        true
    ),
    (
        'reasoning_technical',
        'Technical Reasoning Explanation',
        'Technical explanation of reasoning process for expert users',
        'Reasoning analysis starting from {{startEntities}} using {{reasoningType}} approach. Applied {{logicalRules}} logical rules across {{pathCount}} reasoning paths with average confidence {{avgConfidence}}%. Best path: {{bestPathExplanation}}',
        '["startEntities", "reasoningType", "logicalRules", "pathCount", "avgConfidence", "bestPathExplanation"]',
        '["reasoning"]',
        'en',
        'technical',
        '1.0.0',
        true
    )
    ON CONFLICT (id) DO NOTHING;

    RAISE NOTICE 'Migration 002: Provenance schema created successfully';
END;
$$ LANGUAGE plpgsql;

-- DOWN: Revert the schema changes
CREATE OR REPLACE FUNCTION migrate_down_002() RETURNS VOID AS $$
BEGIN
    -- Drop views
    DROP VIEW IF EXISTS explanation_effectiveness;
    DROP VIEW IF EXISTS provenance_summary;
    
    -- Drop functions
    DROP FUNCTION IF EXISTS get_provenance_stats(INTEGER);
    DROP FUNCTION IF EXISTS cleanup_old_provenance(INTEGER);
    
    -- Drop triggers
    DROP TRIGGER IF EXISTS update_explanation_templates_updated_at ON explanation_templates;
    DROP TRIGGER IF EXISTS update_explanations_updated_at ON explanations;
    DROP TRIGGER IF EXISTS update_provenance_records_updated_at ON provenance_records;
    
    -- Drop tables (in reverse dependency order)
    DROP TABLE IF EXISTS explanation_feedback;
    DROP TABLE IF EXISTS quality_metrics_history;
    DROP TABLE IF EXISTS audit_events;
    DROP TABLE IF EXISTS data_lineage_graph;
    DROP TABLE IF EXISTS explanation_templates;
    DROP TABLE IF EXISTS explanations;
    DROP TABLE IF EXISTS provenance_records;
    
    RAISE NOTICE 'Migration 002: Provenance schema removed successfully';
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_up_002();
