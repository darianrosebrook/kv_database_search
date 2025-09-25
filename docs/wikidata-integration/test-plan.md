# Wikidata Integration Test Plan

## Test Strategy Overview

This test plan ensures comprehensive validation of Wikidata JSON dump integration following CAWS framework requirements for Tier 2 features (mutation ≥ 50%, branch coverage ≥ 80%, contracts mandatory).

## Test Categories

### 1. Unit Tests (Target: 90%+ branch coverage)

#### 1.1 Streaming JSON Parser Tests
**File**: `apps/kv_database/tests/unit/wikidata/streaming-parser.test.ts`

```typescript
describe('WikidataStreamingParser [A1]', () => {
  let parser: WikidataStreamingParser;
  
  beforeEach(() => {
    parser = new WikidataStreamingParser();
  });

  describe('parseWikidataDump', () => {
    it('processes valid Wikidata JSON entities', async () => {
      const testFile = createTempFile([
        '{"id":"Q1","type":"item","labels":{"en":{"language":"en","value":"Universe"}}}',
        '{"id":"Q2","type":"item","labels":{"en":{"language":"en","value":"Earth"}}}'
      ]);
      
      const entities: WikidataEntity[] = [];
      for await (const entity of parser.parseWikidataDump(testFile)) {
        entities.push(entity);
      }
      
      expect(entities).toHaveLength(2);
      expect(entities[0].id).toBe('Q1');
      expect(entities[1].id).toBe('Q2');
    });

    it('handles malformed JSON lines gracefully', async () => {
      const testFile = createTempFile([
        '{"id":"Q1","type":"item","labels":{"en":{"language":"en","value":"Universe"}}}',
        '{"id":"Q2","type":"item"', // Malformed JSON
        '{"id":"Q3","type":"item","labels":{"en":{"language":"en","value":"Earth"}}}'
      ]);
      
      const entities: WikidataEntity[] = [];
      const errors: string[] = [];
      
      parser.on('parseError', (error) => errors.push(error));
      
      for await (const entity of parser.parseWikidataDump(testFile)) {
        entities.push(entity);
      }
      
      expect(entities).toHaveLength(2);
      expect(errors).toHaveLength(1);
      expect(entities.map(e => e.id)).toEqual(['Q1', 'Q3']);
    });

    it('processes entities at target rate [INV: 1000+ entities/second]', async () => {
      const testFile = createLargeTestFile(10000);
      const startTime = Date.now();
      
      let count = 0;
      for await (const entity of parser.parseWikidataDump(testFile)) {
        count++;
      }
      
      const duration = (Date.now() - startTime) / 1000;
      const rate = count / duration;
      
      expect(rate).toBeGreaterThan(1000);
      expect(count).toBe(10000);
    });

    it('handles empty and whitespace-only lines', async () => {
      const testFile = createTempFile([
        '',
        '  ',
        '{"id":"Q1","type":"item","labels":{"en":{"language":"en","value":"Test"}}}',
        '\t',
        '{"id":"Q2","type":"item","labels":{"en":{"language":"en","value":"Test2"}}}'
      ]);
      
      const entities: WikidataEntity[] = [];
      for await (const entity of parser.parseWikidataDump(testFile)) {
        entities.push(entity);
      }
      
      expect(entities).toHaveLength(2);
    });

    it('removes trailing commas from JSON lines', async () => {
      const testFile = createTempFile([
        '{"id":"Q1","type":"item","labels":{"en":{"language":"en","value":"Test"}}},',
        '{"id":"Q2","type":"item","labels":{"en":{"language":"en","value":"Test2"}}}'
      ]);
      
      const entities: WikidataEntity[] = [];
      for await (const entity of parser.parseWikidataDump(testFile)) {
        entities.push(entity);
      }
      
      expect(entities).toHaveLength(2);
    });
  });

  describe('processEntity', () => {
    it('extracts labels correctly', () => {
      const rawEntity = {
        id: 'Q2',
        type: 'item',
        labels: {
          en: { language: 'en', value: 'Earth' },
          es: { language: 'es', value: 'Tierra' }
        }
      };
      
      const processed = parser.processEntity(rawEntity);
      
      expect(processed.labels).toHaveLength(2);
      expect(processed.labels[0]).toEqual({ language: 'en', value: 'Earth' });
      expect(processed.labels[1]).toEqual({ language: 'es', value: 'Tierra' });
    });

    it('extracts descriptions correctly', () => {
      const rawEntity = {
        id: 'Q2',
        type: 'item',
        descriptions: {
          en: { language: 'en', value: 'third planet from the Sun' }
        }
      };
      
      const processed = parser.processEntity(rawEntity);
      
      expect(processed.descriptions).toHaveLength(1);
      expect(processed.descriptions[0].value).toBe('third planet from the Sun');
    });

    it('extracts aliases correctly', () => {
      const rawEntity = {
        id: 'Q2',
        type: 'item',
        aliases: {
          en: [
            { language: 'en', value: 'Planet Earth' },
            { language: 'en', value: 'Terra' }
          ]
        }
      };
      
      const processed = parser.processEntity(rawEntity);
      
      expect(processed.aliases).toHaveLength(2);
      expect(processed.aliases.map(a => a.value)).toContain('Planet Earth');
      expect(processed.aliases.map(a => a.value)).toContain('Terra');
    });
  });
});
```

#### 1.2 Entity Processor Tests
**File**: `apps/kv_database/tests/unit/wikidata/entity-processor.test.ts`

```typescript
describe('WikidataEntityProcessor [A2, A3]', () => {
  let processor: WikidataEntityProcessor;
  let mockDb: jest.Mocked<ObsidianDatabase>;
  let mockEmbeddings: jest.Mocked<DocumentEmbeddingService>;
  
  beforeEach(() => {
    mockDb = createMockDatabase();
    mockEmbeddings = createMockEmbeddingService();
    processor = new WikidataEntityProcessor(mockDb, mockEmbeddings);
  });

  describe('processEntity', () => {
    it('generates searchable text from multilingual labels [A2]', async () => {
      const entity = WikidataEntityFactory.create({
        labels: [
          { language: 'en', value: 'Earth' },
          { language: 'es', value: 'Tierra' },
          { language: 'fr', value: 'Terre' }
        ],
        descriptions: [
          { language: 'en', value: 'third planet from the Sun' }
        ]
      });
      
      const result = await processor.processEntity(entity);
      
      expect(result.searchableText).toContain('Earth');
      expect(result.searchableText).toContain('Tierra');
      expect(result.searchableText).toContain('Terre');
      expect(result.searchableText).toContain('third planet from the Sun');
    });

    it('processes claims into relationships [A3]', async () => {
      const entity = WikidataEntityFactory.create({
        claims: [
          {
            property: 'P31', // instance of
            value: {
              type: 'wikibase-entityid',
              value: 'Q634' // planet
            },
            qualifiers: [],
            references: [],
            rank: 'normal'
          },
          {
            property: 'P279', // subclass of
            value: {
              type: 'wikibase-entityid',
              value: 'Q87017' // terrestrial planet
            },
            qualifiers: [],
            references: [],
            rank: 'normal'
          }
        ]
      });
      
      const result = await processor.processEntity(entity);
      
      expect(result.relationships).toHaveLength(2);
      expect(result.relationships[0].type).toBe('instance_of');
      expect(result.relationships[0].targetEntityId).toBe('Q634');
      expect(result.relationships[1].type).toBe('subclass_of');
      expect(result.relationships[1].targetEntityId).toBe('Q87017');
    });

    it('generates embeddings for semantic search', async () => {
      const entity = WikidataEntityFactory.createEarth();
      mockEmbeddings.generateEmbedding.mockResolvedValue([0.1, 0.2, 0.3]);
      
      const result = await processor.processEntity(entity);
      
      expect(mockEmbeddings.generateEmbedding).toHaveBeenCalledWith(
        expect.stringContaining('Earth')
      );
      expect(result.embedding).toEqual([0.1, 0.2, 0.3]);
    });

    it('handles entities with no claims gracefully', async () => {
      const entity = WikidataEntityFactory.create({
        claims: []
      });
      
      const result = await processor.processEntity(entity);
      
      expect(result.relationships).toHaveLength(0);
      expect(result.processedAt).toBeInstanceOf(Date);
    });
  });

  describe('buildSearchableText', () => {
    it('prioritizes English labels and descriptions', () => {
      const entity = WikidataEntityFactory.create({
        labels: [
          { language: 'de', value: 'Erde' },
          { language: 'en', value: 'Earth' },
          { language: 'es', value: 'Tierra' }
        ],
        descriptions: [
          { language: 'de', value: 'dritter Planet von der Sonne' },
          { language: 'en', value: 'third planet from the Sun' }
        ]
      });
      
      const text = processor.buildSearchableText(entity);
      
      expect(text.indexOf('Earth')).toBeLessThan(text.indexOf('Erde'));
      expect(text.indexOf('third planet')).toBeLessThan(text.indexOf('dritter Planet'));
    });

    it('includes aliases in searchable text', () => {
      const entity = WikidataEntityFactory.create({
        aliases: [
          { language: 'en', value: 'Planet Earth' },
          { language: 'en', value: 'Terra' }
        ]
      });
      
      const text = processor.buildSearchableText(entity);
      
      expect(text).toContain('Planet Earth');
      expect(text).toContain('Terra');
    });

    it('limits to major languages for performance', () => {
      const entity = WikidataEntityFactory.create({
        labels: [
          { language: 'en', value: 'Earth' },
          { language: 'zh', value: '地球' },
          { language: 'xyz', value: 'SomeRareLanguage' } // Should be excluded
        ]
      });
      
      const text = processor.buildSearchableText(entity);
      
      expect(text).toContain('Earth');
      expect(text).toContain('地球');
      expect(text).not.toContain('SomeRareLanguage');
    });
  });

  describe('mapPropertyToRelationType', () => {
    it('maps common Wikidata properties correctly', () => {
      expect(processor.mapPropertyToRelationType('P31')).toBe('instance_of');
      expect(processor.mapPropertyToRelationType('P279')).toBe('subclass_of');
      expect(processor.mapPropertyToRelationType('P361')).toBe('part_of');
      expect(processor.mapPropertyToRelationType('P527')).toBe('has_part');
      expect(processor.mapPropertyToRelationType('P171')).toBe('parent_taxon');
    });

    it('returns null for unmapped properties', () => {
      expect(processor.mapPropertyToRelationType('P999999')).toBeNull();
    });
  });

  describe('calculateClaimConfidence', () => {
    it('assigns higher confidence to preferred rank claims', () => {
      const preferredClaim = { rank: 'preferred', references: [{}] };
      const normalClaim = { rank: 'normal', references: [{}] };
      
      const preferredConfidence = processor.calculateClaimConfidence(preferredClaim);
      const normalConfidence = processor.calculateClaimConfidence(normalClaim);
      
      expect(preferredConfidence).toBeGreaterThan(normalConfidence);
    });

    it('assigns lower confidence to deprecated claims', () => {
      const deprecatedClaim = { rank: 'deprecated', references: [] };
      const normalClaim = { rank: 'normal', references: [] };
      
      const deprecatedConfidence = processor.calculateClaimConfidence(deprecatedClaim);
      const normalConfidence = processor.calculateClaimConfidence(normalClaim);
      
      expect(deprecatedConfidence).toBeLessThan(normalConfidence);
    });
  });
});
```

#### 1.3 Entity Linking Tests
**File**: `apps/kv_database/tests/unit/wikidata/entity-linking.test.ts`

```typescript
describe('WikidataEntityLinkingService [A4]', () => {
  let linkingService: WikidataEntityLinkingService;
  let mockDb: jest.Mocked<ObsidianDatabase>;
  
  beforeEach(() => {
    mockDb = createMockDatabase();
    linkingService = new WikidataEntityLinkingService(mockDb);
  });

  describe('linkToExistingEntities', () => {
    it('finds exact label matches with high confidence', async () => {
      const wikidataEntity = WikidataEntityFactory.create({
        id: 'Q2',
        labels: [{ language: 'en', value: 'Earth' }]
      });
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'local-123', name: 'Earth', confidence_score: 0.95 }]
      });
      
      const links = await linkingService.linkToExistingEntities(wikidataEntity);
      
      expect(links).toHaveLength(1);
      expect(links[0].confidenceScore).toBe(0.95);
      expect(links[0].linkingMethod).toBe('exact_label_match');
    });

    it('finds fuzzy matches for similar names', async () => {
      const wikidataEntity = WikidataEntityFactory.create({
        labels: [{ language: 'en', value: 'United States of America' }]
      });
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No exact matches
        .mockResolvedValueOnce({ // Fuzzy matches
          rows: [{ id: 'local-456', name: 'United States', similarity: 0.85 }]
        });
      
      const links = await linkingService.linkToExistingEntities(wikidataEntity);
      
      expect(links).toHaveLength(1);
      expect(links[0].linkingMethod).toBe('fuzzy_match');
      expect(links[0].confidenceScore).toBeCloseTo(0.85, 2);
    });

    it('finds semantic matches using embeddings', async () => {
      const wikidataEntity = WikidataEntityFactory.create({
        labels: [{ language: 'en', value: 'Planet Earth' }]
      });
      
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No exact matches
        .mockResolvedValueOnce({ rows: [] }) // No fuzzy matches
        .mockResolvedValueOnce({ // Semantic matches
          rows: [{ id: 'local-789', name: 'Earth', similarity_score: 0.88 }]
        });
      
      const links = await linkingService.linkToExistingEntities(wikidataEntity);
      
      expect(links).toHaveLength(1);
      expect(links[0].linkingMethod).toBe('semantic_similarity');
      expect(links[0].confidenceScore).toBe(0.88);
    });

    it('deduplicates and ranks results by confidence', async () => {
      const wikidataEntity = WikidataEntityFactory.create({
        labels: [{ language: 'en', value: 'Earth' }]
      });
      
      // Mock multiple matching strategies returning overlapping results
      mockDb.query
        .mockResolvedValueOnce({ // Exact matches
          rows: [{ id: 'local-123', name: 'Earth', confidence_score: 0.95 }]
        })
        .mockResolvedValueOnce({ // Fuzzy matches (same entity)
          rows: [{ id: 'local-123', name: 'Earth', similarity: 0.90 }]
        })
        .mockResolvedValueOnce({ // Semantic matches
          rows: [{ id: 'local-456', name: 'Planet Earth', similarity_score: 0.82 }]
        });
      
      const links = await linkingService.linkToExistingEntities(wikidataEntity);
      
      expect(links).toHaveLength(2); // Deduplicated
      expect(links[0].confidenceScore).toBeGreaterThan(links[1].confidenceScore); // Ranked
    });
  });

  describe('findExactLabelMatches', () => {
    it('performs case-insensitive matching', async () => {
      const entity = WikidataEntityFactory.create({
        labels: [{ language: 'en', value: 'EARTH' }]
      });
      
      mockDb.query.mockResolvedValueOnce({
        rows: [{ id: 'local-123', name: 'earth', confidence_score: 0.95 }]
      });
      
      const matches = await linkingService.findExactLabelMatches(entity);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(e.name) = LOWER($1)'),
        ['EARTH']
      );
      expect(matches).toHaveLength(1);
    });

    it('returns empty array when no English label exists', async () => {
      const entity = WikidataEntityFactory.create({
        labels: [{ language: 'es', value: 'Tierra' }]
      });
      
      const matches = await linkingService.findExactLabelMatches(entity);
      
      expect(matches).toHaveLength(0);
      expect(mockDb.query).not.toHaveBeenCalled();
    });
  });
});
```

### 2. Integration Tests (Target: Real database, Testcontainers)

#### 2.1 Database Integration Tests
**File**: `apps/kv_database/tests/integration/wikidata/database-integration.test.ts`

```typescript
describe('Wikidata Database Integration [A2, A4]', () => {
  let container: StartedPostgreSqlContainer;
  let db: ObsidianDatabase;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer()
      .withDatabase('test_wikidata')
      .withUsername('test')
      .withPassword('test')
      .start();
    
    db = new ObsidianDatabase(container.getConnectionUri());
    await db.runMigrations();
  });
  
  afterAll(async () => {
    await container.stop();
  });

  beforeEach(async () => {
    await db.query('TRUNCATE wikidata_entities, wikidata_labels, wikidata_claims CASCADE');
  });

  describe('entity storage and retrieval', () => {
    it('stores and retrieves Wikidata entities correctly [A2]', async () => {
      const entity = WikidataEntityFactory.createEarth();
      
      await db.storeWikidataEntity(entity);
      
      const retrieved = await db.getWikidataEntity('Q2');
      expect(retrieved).toBeDefined();
      expect(retrieved!.id).toBe('Q2');
      expect(retrieved!.labels).toHaveLength(4); // en, es, fr, de
      expect(retrieved!.labels.find(l => l.language === 'en')?.value).toBe('Earth');
    });

    it('supports multilingual search across labels [A2]', async () => {
      const entities = [
        WikidataEntityFactory.create({
          id: 'Q2',
          labels: [{ language: 'en', value: 'Earth' }]
        }),
        WikidataEntityFactory.create({
          id: 'Q3',
          labels: [{ language: 'es', value: 'Tierra' }]
        }),
        WikidataEntityFactory.create({
          id: 'Q4',
          labels: [{ language: 'fr', value: 'Terre' }]
        })
      ];
      
      for (const entity of entities) {
        await db.storeWikidataEntity(entity);
      }
      
      // Test English search
      const englishResults = await db.searchWikidataEntities('Earth');
      expect(englishResults).toHaveLength(1);
      expect(englishResults[0].id).toBe('Q2');
      
      // Test Spanish search
      const spanishResults = await db.searchWikidataEntities('Tierra');
      expect(spanishResults).toHaveLength(1);
      expect(spanishResults[0].id).toBe('Q3');
      
      // Test French search
      const frenchResults = await db.searchWikidataEntities('Terre');
      expect(frenchResults).toHaveLength(1);
      expect(frenchResults[0].id).toBe('Q4');
    });

    it('stores claims with proper relationships [A3]', async () => {
      const entity = WikidataEntityFactory.create({
        id: 'Q2',
        claims: [
          {
            property: 'P31',
            value: { type: 'wikibase-entityid', value: 'Q634' },
            qualifiers: [],
            references: [],
            rank: 'normal'
          }
        ]
      });
      
      await db.storeWikidataEntity(entity);
      
      const claims = await db.getWikidataClaims('Q2');
      expect(claims).toHaveLength(1);
      expect(claims[0].property_id).toBe('P31');
      expect(claims[0].value_data.value).toBe('Q634');
    });

    it('handles concurrent entity storage without conflicts', async () => {
      const entities = Array.from({ length: 10 }, (_, i) =>
        WikidataEntityFactory.create({ id: `Q${i + 1}` })
      );
      
      const promises = entities.map(entity => db.storeWikidataEntity(entity));
      await Promise.all(promises);
      
      const count = await db.query('SELECT COUNT(*) FROM wikidata_entities');
      expect(parseInt(count.rows[0].count)).toBe(10);
    });
  });

  describe('entity linking', () => {
    it('creates cross-reference links with confidence scores [A4]', async () => {
      // Create local entity
      const localEntity = await db.createEntity({
        name: 'Earth',
        type: 'concept',
        description: 'Our planet'
      });
      
      // Create Wikidata entity
      const wikidataEntity = WikidataEntityFactory.createEarth();
      await db.storeWikidataEntity(wikidataEntity);
      
      // Create link
      await db.createEntityWikidataLink({
        localEntityId: localEntity.id,
        wikidataEntityId: 'Q2',
        confidenceScore: 0.95,
        linkingMethod: 'exact_label_match'
      });
      
      const links = await db.getEntityWikidataLinks(localEntity.id);
      expect(links).toHaveLength(1);
      expect(links[0].confidenceScore).toBe(0.95);
      expect(links[0].wikidataEntityId).toBe('Q2');
      expect(links[0].linkingMethod).toBe('exact_label_match');
    });

    it('prevents duplicate links for same entity pair', async () => {
      const localEntity = await db.createEntity({
        name: 'Earth',
        type: 'concept'
      });
      
      const wikidataEntity = WikidataEntityFactory.createEarth();
      await db.storeWikidataEntity(wikidataEntity);
      
      const linkData = {
        localEntityId: localEntity.id,
        wikidataEntityId: 'Q2',
        confidenceScore: 0.95,
        linkingMethod: 'exact_label_match'
      };
      
      await db.createEntityWikidataLink(linkData);
      
      // Attempt to create duplicate link
      await expect(db.createEntityWikidataLink(linkData))
        .rejects.toThrow(/duplicate key value violates unique constraint/);
    });

    it('supports querying links by confidence threshold', async () => {
      const localEntities = await Promise.all([
        db.createEntity({ name: 'Earth', type: 'concept' }),
        db.createEntity({ name: 'Mars', type: 'concept' }),
        db.createEntity({ name: 'Venus', type: 'concept' })
      ]);
      
      const wikidataEntities = [
        WikidataEntityFactory.create({ id: 'Q2' }), // Earth
        WikidataEntityFactory.create({ id: 'Q111' }), // Mars
        WikidataEntityFactory.create({ id: 'Q313' }) // Venus
      ];
      
      for (const entity of wikidataEntities) {
        await db.storeWikidataEntity(entity);
      }
      
      // Create links with different confidence scores
      await db.createEntityWikidataLink({
        localEntityId: localEntities[0].id,
        wikidataEntityId: 'Q2',
        confidenceScore: 0.95,
        linkingMethod: 'exact_label_match'
      });
      
      await db.createEntityWikidataLink({
        localEntityId: localEntities[1].id,
        wikidataEntityId: 'Q111',
        confidenceScore: 0.75,
        linkingMethod: 'fuzzy_match'
      });
      
      await db.createEntityWikidataLink({
        localEntityId: localEntities[2].id,
        wikidataEntityId: 'Q313',
        confidenceScore: 0.60,
        linkingMethod: 'semantic_similarity'
      });
      
      // Query high-confidence links only
      const highConfidenceLinks = await db.getHighConfidenceLinks(0.80);
      expect(highConfidenceLinks).toHaveLength(1);
      expect(highConfidenceLinks[0].confidenceScore).toBe(0.95);
    });
  });

  describe('search performance with large datasets', () => {
    it('maintains search performance with 50k+ entities [INV: ≤ 300ms p95]', async () => {
      // Insert large number of entities
      const batchSize = 1000;
      const totalEntities = 50000;
      
      for (let i = 0; i < totalEntities; i += batchSize) {
        const batch = Array.from({ length: Math.min(batchSize, totalEntities - i) }, (_, j) =>
          WikidataEntityFactory.create({
            id: `Q${i + j + 1}`,
            labels: [{ language: 'en', value: `Entity ${i + j + 1}` }]
          })
        );
        
        await db.batchStoreWikidataEntities(batch);
      }
      
      // Perform multiple search operations and measure performance
      const searchQueries = [
        'Entity 1000',
        'Entity 25000',
        'Entity 49999',
        'random search term',
        'another test query'
      ];
      
      const searchTimes: number[] = [];
      
      for (const query of searchQueries) {
        const startTime = Date.now();
        await db.searchWikidataEntities(query);
        searchTimes.push(Date.now() - startTime);
      }
      
      const averageTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      const maxTime = Math.max(...searchTimes);
      
      expect(averageTime).toBeLessThan(200); // Average under 200ms
      expect(maxTime).toBeLessThan(300); // P95 under 300ms
    });
  });
});
```

#### 2.2 End-to-End Processing Tests
**File**: `apps/kv_database/tests/integration/wikidata/e2e-processing.test.ts`

```typescript
describe('Wikidata End-to-End Processing [A1, A5, A6]', () => {
  let container: StartedPostgreSqlContainer;
  let db: ObsidianDatabase;
  let processor: WikidataBatchProcessor;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    db = new ObsidianDatabase(container.getConnectionUri());
    await db.runMigrations();
    
    const parser = new WikidataStreamingParser();
    const entityProcessor = new WikidataEntityProcessor(db, new DocumentEmbeddingService());
    processor = new WikidataBatchProcessor(parser, entityProcessor, db);
  });
  
  afterAll(async () => {
    await container.stop();
  });

  describe('full dump processing simulation [A1]', () => {
    it('processes sample Wikidata dump file successfully', async () => {
      const sampleDumpPath = path.join(__dirname, '../../fixtures/sample-wikidata-dump.json');
      
      // Create sample dump with 1000 entities
      const entities = Array.from({ length: 1000 }, (_, i) =>
        JSON.stringify(WikidataEntityFactory.create({ id: `Q${i + 1}` }))
      );
      
      fs.writeFileSync(sampleDumpPath, entities.join('\n'));
      
      const stats = await processor.processDump(sampleDumpPath);
      
      expect(stats.totalEntities).toBe(1000);
      expect(stats.processedEntities).toBe(1000);
      expect(stats.errorCount).toBe(0);
      
      // Verify entities are stored in database
      const count = await db.query('SELECT COUNT(*) FROM wikidata_entities');
      expect(parseInt(count.rows[0].count)).toBe(1000);
      
      // Cleanup
      fs.unlinkSync(sampleDumpPath);
    });

    it('handles processing errors gracefully without stopping', async () => {
      const sampleDumpPath = path.join(__dirname, '../../fixtures/error-dump.json');
      
      const entities = [
        JSON.stringify(WikidataEntityFactory.create({ id: 'Q1' })),
        '{"invalid": "json"', // Malformed JSON
        JSON.stringify(WikidataEntityFactory.create({ id: 'Q3' })),
        '', // Empty line
        JSON.stringify(WikidataEntityFactory.create({ id: 'Q5' }))
      ];
      
      fs.writeFileSync(sampleDumpPath, entities.join('\n'));
      
      const stats = await processor.processDump(sampleDumpPath);
      
      expect(stats.totalEntities).toBe(4); // Only valid entities counted
      expect(stats.processedEntities).toBe(3); // Successfully processed
      expect(stats.errorCount).toBeGreaterThan(0);
      
      // Verify valid entities are stored
      const storedEntities = await db.query('SELECT id FROM wikidata_entities ORDER BY id');
      expect(storedEntities.rows.map(r => r.id)).toEqual(['Q1', 'Q3', 'Q5']);
      
      fs.unlinkSync(sampleDumpPath);
    });
  });

  describe('search integration [A5]', () => {
    beforeEach(async () => {
      // Setup test entities
      const testEntities = [
        WikidataEntityFactory.createEarth(),
        WikidataEntityFactory.create({
          id: 'Q111',
          labels: [{ language: 'en', value: 'Mars' }],
          descriptions: [{ language: 'en', value: 'fourth planet from the Sun' }]
        }),
        WikidataEntityFactory.create({
          id: 'Q313',
          labels: [{ language: 'en', value: 'Venus' }],
          descriptions: [{ language: 'en', value: 'second planet from the Sun' }]
        })
      ];
      
      for (const entity of testEntities) {
        await db.storeWikidataEntity(entity);
      }
    });

    it('returns Wikidata entities in search results [A5]', async () => {
      const searchService = new WikidataSearchEnhancement(db, new DocumentEmbeddingService());
      
      const results = await searchService.searchWikidataEntities('planet');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.id === 'Q2')).toBe(true); // Earth
      expect(results.some(r => r.id === 'Q111')).toBe(true); // Mars
      expect(results.some(r => r.id === 'Q313')).toBe(true); // Venus
    });

    it('ranks results by relevance score', async () => {
      const searchService = new WikidataSearchEnhancement(db, new DocumentEmbeddingService());
      
      const results = await searchService.searchWikidataEntities('Earth');
      
      expect(results).toHaveLength(3);
      expect(results[0].id).toBe('Q2'); // Earth should be first
      expect(results[0].relevanceScore).toBeGreaterThan(results[1].relevanceScore);
    });

    it('supports multilingual search queries [A2]', async () => {
      // Add Spanish entity
      await db.storeWikidataEntity(WikidataEntityFactory.create({
        id: 'Q5',
        labels: [{ language: 'es', value: 'Sol' }],
        descriptions: [{ language: 'es', value: 'estrella del sistema solar' }]
      }));
      
      const searchService = new WikidataSearchEnhancement(db, new DocumentEmbeddingService());
      
      const results = await searchService.searchWikidataEntities('Sol');
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].id).toBe('Q5');
    });
  });

  describe('incremental updates [A6]', () => {
    it('detects and processes only changed entities', async () => {
      // Initial load
      const initialEntities = [
        WikidataEntityFactory.create({ id: 'Q1' }),
        WikidataEntityFactory.create({ id: 'Q2' })
      ];
      
      for (const entity of initialEntities) {
        await db.storeWikidataEntity(entity);
      }
      
      const initialCount = await db.query('SELECT COUNT(*) FROM wikidata_entities');
      expect(parseInt(initialCount.rows[0].count)).toBe(2);
      
      // Simulate incremental update with new and modified entities
      const updateEntities = [
        { ...initialEntities[0], labels: [{ language: 'en', value: 'Updated Entity 1' }] }, // Modified
        WikidataEntityFactory.create({ id: 'Q3' }) // New
      ];
      
      const updateProcessor = new WikidataIncrementalProcessor(db);
      const updateStats = await updateProcessor.processIncrementalUpdate(updateEntities);
      
      expect(updateStats.newEntities).toBe(1);
      expect(updateStats.updatedEntities).toBe(1);
      
      const finalCount = await db.query('SELECT COUNT(*) FROM wikidata_entities');
      expect(parseInt(finalCount.rows[0].count)).toBe(3);
      
      // Verify update was applied
      const updatedEntity = await db.getWikidataEntity('Q1');
      expect(updatedEntity!.labels[0].value).toBe('Updated Entity 1');
    });
  });
});
```

### 3. Performance Tests

#### 3.1 Memory Management Tests
**File**: `apps/kv_database/tests/performance/wikidata/memory-management.test.ts`

```typescript
describe('Wikidata Memory Management [INV: Memory ≤ 4GB]', () => {
  let processor: WikidataBatchProcessor;
  
  beforeEach(() => {
    const mockDb = createMockDatabase();
    const mockParser = new WikidataStreamingParser();
    const mockEntityProcessor = new WikidataEntityProcessor(mockDb, createMockEmbeddingService());
    processor = new WikidataBatchProcessor(mockParser, mockEntityProcessor, mockDb);
  });

  describe('batch processing memory usage', () => {
    it('maintains memory usage under 4GB during large batch processing', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Process large batch of entities
      const largeBatch = Array.from({ length: 10000 }, () =>
        WikidataEntityFactory.create()
      );
      
      await processor.processBatch(largeBatch);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = (finalMemory - initialMemory) / (1024 * 1024 * 1024); // GB
      
      expect(memoryIncrease).toBeLessThan(4);
    });

    it('performs garbage collection when memory threshold reached', async () => {
      const memoryMonitor = new MemoryMonitor();
      
      // Mock high memory usage
      jest.spyOn(processor, 'getMemoryUsage').mockReturnValue(4500); // 4.5GB
      
      const gcSpy = jest.spyOn(processor, 'performGarbageCollection');
      
      const batch = Array.from({ length: 1000 }, () =>
        WikidataEntityFactory.create()
      );
      
      await processor.processBatch(batch);
      
      expect(gcSpy).toHaveBeenCalled();
    });

    it('releases memory after batch completion', async () => {
      const memoryBefore = process.memoryUsage().heapUsed;
      
      const batch = Array.from({ length: 5000 }, () =>
        WikidataEntityFactory.create()
      );
      
      await processor.processBatch(batch);
      
      // Force garbage collection
      if (global.gc) {
        global.gc();
      }
      
      const memoryAfter = process.memoryUsage().heapUsed;
      const memoryIncrease = (memoryAfter - memoryBefore) / (1024 * 1024); // MB
      
      // Memory increase should be minimal after GC
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });

  describe('streaming parser memory efficiency', () => {
    it('processes large files without loading entire content into memory', async () => {
      const largeFilePath = createLargeTestFile(100000); // 100k entities
      const parser = new WikidataStreamingParser();
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      let processedCount = 0;
      for await (const entity of parser.parseWikidataDump(largeFilePath)) {
        processedCount++;
        
        // Check memory periodically
        if (processedCount % 10000 === 0) {
          const currentMemory = process.memoryUsage().heapUsed;
          const memoryIncrease = (currentMemory - initialMemory) / (1024 * 1024 * 1024);
          expect(memoryIncrease).toBeLessThan(2); // Less than 2GB increase
        }
      }
      
      expect(processedCount).toBe(100000);
      
      // Cleanup
      fs.unlinkSync(largeFilePath);
    });
  });
});
```

#### 3.2 Processing Throughput Tests
**File**: `apps/kv_database/tests/performance/wikidata/throughput.test.ts`

```typescript
describe('Wikidata Processing Throughput [INV: 1000+ entities/second]', () => {
  let processor: WikidataBatchProcessor;
  let container: StartedPostgreSqlContainer;
  let db: ObsidianDatabase;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    db = new ObsidianDatabase(container.getConnectionUri());
    await db.runMigrations();
    
    const parser = new WikidataStreamingParser();
    const entityProcessor = new WikidataEntityProcessor(db, new DocumentEmbeddingService());
    processor = new WikidataBatchProcessor(parser, entityProcessor, db);
  });
  
  afterAll(async () => {
    await container.stop();
  });

  describe('entity processing rate', () => {
    it('processes entities at target rate of 1000+ per second', async () => {
      const testEntities = Array.from({ length: 5000 }, () =>
        WikidataEntityFactory.create()
      );
      
      const startTime = Date.now();
      await processor.processBatch(testEntities);
      const endTime = Date.now();
      
      const duration = (endTime - startTime) / 1000; // seconds
      const rate = testEntities.length / duration;
      
      expect(rate).toBeGreaterThan(1000);
    });

    it('maintains throughput with complex entities', async () => {
      const complexEntities = Array.from({ length: 2000 }, () =>
        WikidataEntityFactory.create({
          labels: Array.from({ length: 10 }, (_, i) => ({
            language: `lang${i}`,
            value: `Label ${i}`
          })),
          descriptions: Array.from({ length: 5 }, (_, i) => ({
            language: `lang${i}`,
            value: `Description ${i}`
          })),
          claims: Array.from({ length: 20 }, () => ({
            property: 'P31',
            value: { type: 'wikibase-entityid', value: 'Q123' },
            qualifiers: [],
            references: [],
            rank: 'normal'
          }))
        })
      );
      
      const startTime = Date.now();
      await processor.processBatch(complexEntities);
      const endTime = Date.now();
      
      const duration = (endTime - startTime) / 1000;
      const rate = complexEntities.length / duration;
      
      expect(rate).toBeGreaterThan(500); // Lower threshold for complex entities
    });

    it('scales processing with parallel workers', async () => {
      const testEntities = Array.from({ length: 10000 }, () =>
        WikidataEntityFactory.create()
      );
      
      // Test with different concurrency levels
      const concurrencyLevels = [1, 5, 10, 20];
      const results: { concurrency: number; rate: number }[] = [];
      
      for (const concurrency of concurrencyLevels) {
        processor.setConcurrencyLimit(concurrency);
        
        const startTime = Date.now();
        await processor.processBatch(testEntities);
        const endTime = Date.now();
        
        const duration = (endTime - startTime) / 1000;
        const rate = testEntities.length / duration;
        
        results.push({ concurrency, rate });
      }
      
      // Verify that higher concurrency improves throughput (up to a point)
      expect(results[1].rate).toBeGreaterThan(results[0].rate); // 5 > 1
      expect(results[2].rate).toBeGreaterThan(results[1].rate); // 10 > 5
    });
  });

  describe('database insertion performance', () => {
    it('maintains insertion rate with batch operations', async () => {
      const entities = Array.from({ length: 10000 }, () =>
        WikidataEntityFactory.create()
      );
      
      const startTime = Date.now();
      await db.batchStoreWikidataEntities(entities);
      const endTime = Date.now();
      
      const duration = (endTime - startTime) / 1000;
      const rate = entities.length / duration;
      
      expect(rate).toBeGreaterThan(2000); // Database insertion should be faster
    });

    it('handles concurrent insertions without deadlocks', async () => {
      const batchSize = 1000;
      const numBatches = 10;
      
      const batches = Array.from({ length: numBatches }, (_, batchIndex) =>
        Array.from({ length: batchSize }, (_, entityIndex) =>
          WikidataEntityFactory.create({
            id: `Q${batchIndex * batchSize + entityIndex + 1}`
          })
        )
      );
      
      const startTime = Date.now();
      
      // Process all batches concurrently
      await Promise.all(
        batches.map(batch => db.batchStoreWikidataEntities(batch))
      );
      
      const endTime = Date.now();
      
      const totalEntities = numBatches * batchSize;
      const duration = (endTime - startTime) / 1000;
      const rate = totalEntities / duration;
      
      expect(rate).toBeGreaterThan(1500);
      
      // Verify all entities were stored
      const count = await db.query('SELECT COUNT(*) FROM wikidata_entities');
      expect(parseInt(count.rows[0].count)).toBe(totalEntities);
    });
  });
});
```

#### 3.3 Search Performance Tests
**File**: `apps/kv_database/tests/performance/wikidata/search-performance.test.ts`

```typescript
describe('Wikidata Search Performance [INV: ≤ 300ms p95]', () => {
  let container: StartedPostgreSqlContainer;
  let db: ObsidianDatabase;
  let searchService: WikidataSearchEnhancement;
  
  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    db = new ObsidianDatabase(container.getConnectionUri());
    await db.runMigrations();
    
    searchService = new WikidataSearchEnhancement(db, new DocumentEmbeddingService());
    
    // Populate with realistic dataset
    await populateWithWikidataEntities(100000);
  });
  
  afterAll(async () => {
    await container.stop();
  });

  describe('search response times', () => {
    it('maintains search performance under 300ms p95 with large dataset', async () => {
      const searchQueries = [
        'Earth',
        'United States',
        'Albert Einstein',
        'World War II',
        'Solar System',
        'DNA',
        'Computer Science',
        'Mathematics',
        'Philosophy',
        'Art'
      ];
      
      const searchTimes: number[] = [];
      
      // Perform multiple searches to get statistical data
      for (let i = 0; i < 100; i++) {
        const query = searchQueries[i % searchQueries.length];
        
        const startTime = Date.now();
        await searchService.searchWikidataEntities(query, { maxResults: 20 });
        const endTime = Date.now();
        
        searchTimes.push(endTime - startTime);
      }
      
      // Calculate percentiles
      searchTimes.sort((a, b) => a - b);
      const p50 = searchTimes[Math.floor(searchTimes.length * 0.5)];
      const p95 = searchTimes[Math.floor(searchTimes.length * 0.95)];
      const p99 = searchTimes[Math.floor(searchTimes.length * 0.99)];
      
      console.log(`Search performance: P50=${p50}ms, P95=${p95}ms, P99=${p99}ms`);
      
      expect(p50).toBeLessThan(100); // Median under 100ms
      expect(p95).toBeLessThan(300); // P95 under 300ms
      expect(p99).toBeLessThan(500); // P99 under 500ms
    });

    it('maintains performance with complex multilingual queries', async () => {
      const multilingualQueries = [
        'Earth Tierra Terre Erde', // Multiple languages
        'United States Estados Unidos États-Unis', 
        'Computer Computadora Ordinateur Rechner',
        'Science Ciencia Science Wissenschaft'
      ];
      
      const searchTimes: number[] = [];
      
      for (const query of multilingualQueries) {
        for (let i = 0; i < 25; i++) {
          const startTime = Date.now();
          await searchService.searchWikidataEntities(query);
          searchTimes.push(Date.now() - startTime);
        }
      }
      
      const averageTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
      const maxTime = Math.max(...searchTimes);
      
      expect(averageTime).toBeLessThan(200);
      expect(maxTime).toBeLessThan(400);
    });

    it('benefits from caching for repeated queries', async () => {
      const query = 'Popular Search Term';
      
      // First search (cold cache)
      const coldStart = Date.now();
      await searchService.searchWikidataEntities(query);
      const coldTime = Date.now() - coldStart;
      
      // Second search (warm cache)
      const warmStart = Date.now();
      await searchService.searchWikidataEntities(query);
      const warmTime = Date.now() - warmStart;
      
      // Cached search should be significantly faster
      expect(warmTime).toBeLessThan(coldTime * 0.5);
      expect(warmTime).toBeLessThan(50); // Cached queries under 50ms
    });
  });

  describe('concurrent search performance', () => {
    it('handles concurrent searches without performance degradation', async () => {
      const concurrentQueries = Array.from({ length: 50 }, (_, i) => `Query ${i}`);
      
      const startTime = Date.now();
      
      const promises = concurrentQueries.map(query =>
        searchService.searchWikidataEntities(query)
      );
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      const averageTime = (endTime - startTime) / concurrentQueries.length;
      
      expect(averageTime).toBeLessThan(300);
    });

    it('maintains throughput under load', async () => {
      const queries = ['Earth', 'Mars', 'Venus', 'Jupiter', 'Saturn'];
      const concurrentUsers = 20;
      const queriesPerUser = 10;
      
      const startTime = Date.now();
      
      const userPromises = Array.from({ length: concurrentUsers }, async () => {
        for (let i = 0; i < queriesPerUser; i++) {
          const query = queries[i % queries.length];
          await searchService.searchWikidataEntities(query);
        }
      });
      
      await Promise.all(userPromises);
      
      const endTime = Date.now();
      const totalQueries = concurrentUsers * queriesPerUser;
      const queriesPerSecond = totalQueries / ((endTime - startTime) / 1000);
      
      expect(queriesPerSecond).toBeGreaterThan(50); // At least 50 queries/second
    });
  });

  async function populateWithWikidataEntities(count: number): Promise<void> {
    const batchSize = 1000;
    
    for (let i = 0; i < count; i += batchSize) {
      const batch = Array.from({ length: Math.min(batchSize, count - i) }, (_, j) => {
        const entityId = i + j + 1;
        return WikidataEntityFactory.create({
          id: `Q${entityId}`,
          labels: [
            { language: 'en', value: `Entity ${entityId}` },
            { language: 'es', value: `Entidad ${entityId}` }
          ],
          descriptions: [
            { language: 'en', value: `Description for entity ${entityId}` }
          ]
        });
      });
      
      await db.batchStoreWikidataEntities(batch);
    }
  }
});
```

### 4. Contract Tests

#### 4.1 API Contract Tests
**File**: `apps/kv_database/tests/contract/wikidata/api-contracts.test.ts`

```typescript
describe('Wikidata API Contracts', () => {
  let server: TestServer;
  
  beforeAll(async () => {
    server = new TestServer();
    await server.start();
  });
  
  afterAll(async () => {
    await server.stop();
  });

  describe('Wikidata Entity API', () => {
    it('conforms to OpenAPI schema for entity retrieval', async () => {
      const response = await request(server.app)
        .get('/api/wikidata/entities/Q2')
        .expect(200);
      
      // Validate against OpenAPI schema
      const validator = new OpenAPIValidator('apps/contracts/wikidata-integration-api.yaml');
      const validation = validator.validate('/wikidata/entities/{id}', 'get', response.body);
      
      expect(validation.errors).toHaveLength(0);
      expect(response.body).toMatchObject({
        id: 'Q2',
        type: 'item',
        labels: expect.any(Array),
        descriptions: expect.any(Array)
      });
    });

    it('conforms to schema for entity search', async () => {
      const response = await request(server.app)
        .get('/api/wikidata/search')
        .query({ q: 'Earth', limit: 10 })
        .expect(200);
      
      const validator = new OpenAPIValidator('apps/contracts/wikidata-integration-api.yaml');
      const validation = validator.validate('/wikidata/search', 'get', response.body);
      
      expect(validation.errors).toHaveLength(0);
      expect(response.body).toMatchObject({
        results: expect.any(Array),
        total: expect.any(Number),
        limit: 10,
        offset: 0
      });
    });

    it('returns proper error format for invalid entity ID', async () => {
      const response = await request(server.app)
        .get('/api/wikidata/entities/INVALID')
        .expect(404);
      
      expect(response.body).toMatchObject({
        error: expect.any(String),
        code: 'ENTITY_NOT_FOUND',
        details: expect.any(Object)
      });
    });
  });

  describe('Entity Linking API', () => {
    it('conforms to schema for entity linking requests', async () => {
      const linkingRequest = {
        localEntityId: 'local-123',
        wikidataEntityId: 'Q2',
        confidenceScore: 0.95,
        linkingMethod: 'exact_label_match'
      };
      
      const response = await request(server.app)
        .post('/api/wikidata/links')
        .send(linkingRequest)
        .expect(201);
      
      const validator = new OpenAPIValidator('apps/contracts/wikidata-integration-api.yaml');
      const validation = validator.validate('/wikidata/links', 'post', response.body);
      
      expect(validation.errors).toHaveLength(0);
      expect(response.body).toMatchObject({
        id: expect.any(String),
        localEntityId: linkingRequest.localEntityId,
        wikidataEntityId: linkingRequest.wikidataEntityId,
        confidenceScore: linkingRequest.confidenceScore
      });
    });
  });
});
```

### 5. End-to-End Tests

#### 5.1 User Journey Tests
**File**: `apps/kv_database/tests/e2e/wikidata/user-journeys.test.ts`

```typescript
describe('Wikidata Integration User Journeys [A5]', () => {
  let browser: Browser;
  let page: Page;
  
  beforeAll(async () => {
    browser = await chromium.launch();
  });
  
  afterAll(async () => {
    await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('http://localhost:3000');
  });
  
  afterEach(async () => {
    await page.close();
  });

  describe('enhanced search with Wikidata context [A5]', () => {
    it('displays Wikidata entities in search results', async () => {
      // Search for a term that should match Wikidata entities
      await page.fill('[data-testid="search-input"]', 'Earth');
      await page.click('[data-testid="search-button"]');
      
      // Wait for results to load
      await page.waitForSelector('[data-testid="search-results"]');
      
      // Verify Wikidata entities appear in results
      const wikidataResults = await page.locator('[data-testid="wikidata-result"]');
      expect(await wikidataResults.count()).toBeGreaterThan(0);
      
      // Verify result contains expected Wikidata information
      const firstResult = wikidataResults.first();
      await expect(firstResult.locator('[data-testid="entity-id"]')).toContainText('Q2');
      await expect(firstResult.locator('[data-testid="entity-label"]')).toContainText('Earth');
    });

    it('shows multilingual labels for Wikidata entities [A2]', async () => {
      await page.fill('[data-testid="search-input"]', 'Earth');
      await page.click('[data-testid="search-button"]');
      
      await page.waitForSelector('[data-testid="wikidata-result"]');
      
      // Click on a Wikidata result to view details
      await page.click('[data-testid="wikidata-result"]:first-child');
      
      // Verify multilingual labels are displayed
      await expect(page.locator('[data-testid="label-en"]')).toContainText('Earth');
      await expect(page.locator('[data-testid="label-es"]')).toContainText('Tierra');
      await expect(page.locator('[data-testid="label-fr"]')).toContainText('Terre');
    });

    it('displays entity relationships from Wikidata claims [A3]', async () => {
      await page.fill('[data-testid="search-input"]', 'Earth');
      await page.click('[data-testid="search-button"]');
      
      await page.waitForSelector('[data-testid="wikidata-result"]');
      await page.click('[data-testid="wikidata-result"]:first-child');
      
      // Navigate to relationships tab
      await page.click('[data-testid="relationships-tab"]');
      
      // Verify relationships are displayed
      const relationships = await page.locator('[data-testid="relationship-item"]');
      expect(await relationships.count()).toBeGreaterThan(0);
      
      // Verify specific relationship (instance of -> planet)
      await expect(page.locator('[data-testid="relationship-instance-of"]')).toContainText('planet');
    });

    it('links local entities to Wikidata entities [A4]', async () => {
      // First, create a local entity
      await page.click('[data-testid="create-entity-button"]');
      await page.fill('[data-testid="entity-name-input"]', 'Our Planet Earth');
      await page.fill('[data-testid="entity-description-input"]', 'The planet we live on');
      await page.click('[data-testid="save-entity-button"]');
      
      // Navigate to entity linking
      await page.click('[data-testid="link-to-wikidata-button"]');
      
      // Search for Wikidata entity to link
      await page.fill('[data-testid="wikidata-search-input"]', 'Earth');
      await page.click('[data-testid="wikidata-search-button"]');
      
      // Select Earth (Q2) from results
      await page.click('[data-testid="wikidata-option-Q2"]');
      await page.click('[data-testid="create-link-button"]');
      
      // Verify link was created
      await expect(page.locator('[data-testid="wikidata-link"]')).toContainText('Q2');
      await expect(page.locator('[data-testid="confidence-score"]')).toContainText('0.95');
    });
  });

  describe('search performance [INV: ≤ 300ms response]', () => {
    it('returns search results within performance budget', async () => {
      const startTime = Date.now();
      
      await page.fill('[data-testid="search-input"]', 'Solar System');
      await page.click('[data-testid="search-button"]');
      
      // Wait for results to appear
      await page.waitForSelector('[data-testid="search-results"]');
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      expect(responseTime).toBeLessThan(2000); // UI response under 2 seconds
      
      // Check if performance metrics are displayed (for debugging)
      const performanceInfo = await page.locator('[data-testid="search-performance"]');
      if (await performanceInfo.count() > 0) {
        const searchTime = await performanceInfo.textContent();
        const apiResponseTime = parseInt(searchTime?.match(/(\d+)ms/)?.[1] || '0');
        expect(apiResponseTime).toBeLessThan(300);
      }
    });
  });
});
```

## Test Data Management

### Test Fixtures and Factories

#### Wikidata Entity Factory
**File**: `apps/kv_database/tests/factories/wikidata-entity.factory.ts`

```typescript
export class WikidataEntityFactory {
  static create(overrides: Partial<WikidataEntity> = {}): WikidataEntity {
    const defaults: WikidataEntity = {
      id: `Q${Math.floor(Math.random() * 1000000)}`,
      type: 'item',
      labels: [
        { language: 'en', value: faker.lorem.word() }
      ],
      descriptions: [
        { language: 'en', value: faker.lorem.sentence() }
      ],
      aliases: [],
      claims: [],
      sitelinks: [],
      processedAt: new Date()
    };
    
    return { ...defaults, ...overrides };
  }

  static createEarth(): WikidataEntity {
    return this.create({
      id: 'Q2',
      labels: [
        { language: 'en', value: 'Earth' },
        { language: 'es', value: 'Tierra' },
        { language: 'fr', value: 'Terre' },
        { language: 'de', value: 'Erde' }
      ],
      descriptions: [
        { language: 'en', value: 'third planet from the Sun in the Solar System' },
        { language: 'es', value: 'tercer planeta del sistema solar' }
      ],
      claims: [
        {
          property: 'P31', // instance of
          value: {
            type: 'wikibase-entityid',
            value: 'Q634' // planet
          },
          qualifiers: [],
          references: [],
          rank: 'normal'
        }
      ]
    });
  }

  static createBatch(count: number, template?: Partial<WikidataEntity>): WikidataEntity[] {
    return Array.from({ length: count }, (_, i) => 
      this.create({
        id: `Q${i + 1}`,
        ...template
      })
    );
  }

  static createWithClaims(claims: WikidataClaim[]): WikidataEntity {
    return this.create({ claims });
  }

  static createMultilingual(languages: string[]): WikidataEntity {
    const labels = languages.map(lang => ({
      language: lang,
      value: `${faker.lorem.word()}_${lang}`
    }));
    
    const descriptions = languages.map(lang => ({
      language: lang,
      value: `${faker.lorem.sentence()}_${lang}`
    }));
    
    return this.create({ labels, descriptions });
  }
}
```

### Test Data Fixtures

#### Sample Wikidata JSON
**File**: `apps/kv_database/test-data/fixtures/sample-wikidata-entities.json`

```json
[
  {
    "id": "Q2",
    "type": "item",
    "labels": {
      "en": {"language": "en", "value": "Earth"},
      "es": {"language": "es", "value": "Tierra"},
      "fr": {"language": "fr", "value": "Terre"}
    },
    "descriptions": {
      "en": {"language": "en", "value": "third planet from the Sun in the Solar System"}
    },
    "aliases": {
      "en": [
        {"language": "en", "value": "Planet Earth"},
        {"language": "en", "value": "Terra"}
      ]
    },
    "claims": {
      "P31": [{
        "mainsnak": {
          "snaktype": "value",
          "property": "P31",
          "datavalue": {
            "value": {"entity-type": "item", "id": "Q634"},
            "type": "wikibase-entityid"
          }
        },
        "type": "statement",
        "rank": "normal"
      }]
    },
    "sitelinks": {
      "enwiki": {
        "site": "enwiki",
        "title": "Earth",
        "badges": []
      }
    }
  }
]
```

## Test Execution Strategy

### Continuous Integration Pipeline

#### Test Execution Order
1. **Static Analysis** (lint, typecheck, security scan)
2. **Unit Tests** (fast feedback, high coverage)
3. **Integration Tests** (database, API contracts)
4. **Performance Tests** (memory, throughput, search latency)
5. **End-to-End Tests** (user journeys, UI functionality)

#### Performance Benchmarking
- **Baseline Establishment**: Record performance metrics before Wikidata integration
- **Regression Detection**: Compare post-integration metrics against baseline
- **Performance Gates**: Fail CI if performance degrades beyond thresholds

#### Test Data Management
- **Isolated Test Databases**: Each test suite uses fresh database instance
- **Deterministic Test Data**: Use factories with fixed seeds for reproducible tests
- **Cleanup Procedures**: Automatic cleanup after test completion

## Success Criteria

### Coverage Targets (CAWS Tier 2 Requirements)
- **Branch Coverage**: ≥ 80%
- **Mutation Score**: ≥ 50%
- **Contract Compliance**: 100% API contract adherence
- **Integration Coverage**: All major user journeys tested

### Performance Benchmarks
- **Entity Processing**: ≥ 1000 entities/second
- **Memory Usage**: ≤ 4GB during processing
- **Search Latency**: ≤ 300ms p95
- **Concurrent Users**: Support 50+ concurrent searches

### Quality Gates
- **Zero Critical Security Issues**: SAST scan clean
- **Zero High-Priority Bugs**: All P0/P1 issues resolved
- **Performance Regression**: < 10% degradation from baseline
- **Test Stability**: < 0.5% flake rate across all test suites

This comprehensive test plan ensures robust validation of the Wikidata integration feature while maintaining the high quality standards required by the CAWS framework.
