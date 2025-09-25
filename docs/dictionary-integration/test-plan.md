# Dictionary Integration Test Plan

## Overview

This test plan ensures comprehensive coverage of dictionary integration functionality following CAWS Tier 2 requirements (≥80% branch coverage, ≥50% mutation score, mandatory contract tests, integration testing with real containers).

## Test Strategy

### Risk Assessment: Tier 2
- **Rationale**: Dictionary integration affects core search functionality and entity extraction accuracy
- **Requirements**: 
  - Branch coverage ≥80%
  - Mutation score ≥50%
  - Contract tests mandatory
  - Integration tests with Testcontainers
  - E2E smoke tests required
  - Performance budgets enforced

### Test Pyramid Structure

```
    E2E Tests (5%)
   ┌─────────────────┐
   │ Critical Paths  │
   └─────────────────┘
  
  Integration Tests (25%)
 ┌─────────────────────┐
 │ Service Integration │
 │ Database Operations │
 │ External APIs       │
 └─────────────────────┘

    Unit Tests (70%)
   ┌─────────────────────┐
   │ Business Logic      │
   │ Data Transformations│
   │ Edge Cases          │
   │ Property Tests      │
   └─────────────────────┘
```

## Unit Tests (Target: ≥80% coverage, ≥50% mutation score)

### Dictionary Service Core Logic

#### WordNet Integration Tests
```typescript
describe('WordNetService', () => {
  describe('synset lookup', () => {
    it('finds synsets by lemma with confidence scoring [A1]', async () => {
      const service = new WordNetService(mockWordNetData);
      
      const result = await service.findSynsets('technology');
      
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        synsetId: 'technology.n.01',
        lemma: 'technology',
        partOfSpeech: 'noun',
        definition: expect.stringContaining('application of scientific knowledge'),
        confidence: expect.numberBetween(0.8, 1.0)
      });
    });

    it('handles ambiguous terms with context disambiguation [A1]', async () => {
      const service = new WordNetService(mockWordNetData);
      const context = 'Apple Inc. develops innovative technology products';
      
      const result = await service.findSynsets('apple', { context });
      
      // Should prefer organization context over fruit
      expect(result[0].definition).toContain('company');
      expect(result[0].confidence).toBeGreaterThan(0.8);
    });

    it('returns empty array for unknown terms', async () => {
      const service = new WordNetService(mockWordNetData);
      
      const result = await service.findSynsets('nonexistentword123');
      
      expect(result).toEqual([]);
    });
  });

  describe('semantic relationships', () => {
    it('extracts hypernym relationships with confidence [A3]', async () => {
      const service = new WordNetService(mockWordNetData);
      
      const relationships = await service.getSemanticRelationships('technology.n.01');
      
      const hypernyms = relationships.filter(r => r.type === 'hypernym');
      expect(hypernyms).toHaveLength(1);
      expect(hypernyms[0]).toMatchObject({
        type: 'hypernym',
        target: 'application.n.01',
        confidence: expect.numberBetween(0.7, 1.0)
      });
    });

    it('handles bidirectional relationships correctly', async () => {
      const service = new WordNetService(mockWordNetData);
      
      const synonyms = await service.getSemanticRelationships('car.n.01', ['synonym']);
      
      expect(synonyms).toContainEqual(
        expect.objectContaining({
          type: 'synonym',
          target: 'automobile.n.01',
          bidirectional: true
        })
      );
    });

    // Property-based test for relationship consistency
    it('maintains relationship consistency across lookups', async () => {
      const service = new WordNetService(mockWordNetData);
      
      await fc.assert(fc.asyncProperty(
        fc.constantFrom('technology.n.01', 'car.n.01', 'computer.n.01'),
        async (synsetId) => {
          const relationships1 = await service.getSemanticRelationships(synsetId);
          const relationships2 = await service.getSemanticRelationships(synsetId);
          
          expect(relationships1).toEqual(relationships2);
        }
      ));
    });
  });
});
```

#### Entity Canonicalization Tests
```typescript
describe('EntityCanonicalizationService', () => {
  let service: EntityCanonicalizationService;
  let mockDictionaryService: jest.Mocked<DictionaryService>;

  beforeEach(() => {
    mockDictionaryService = createMockDictionaryService();
    service = new EntityCanonicalizationService(mockDictionaryService);
  });

  describe('canonicalize entities', () => {
    it('canonicalizes entity names using dictionary data [A1]', async () => {
      const entities: RawEntity[] = [
        { name: 'Apple Computer', type: 'ORGANIZATION' },
        { name: 'tech innovation', type: 'CONCEPT' }
      ];

      mockDictionaryService.lookup.mockResolvedValue([
        {
          term: 'Apple Computer',
          canonicalForm: 'Apple Inc.',
          confidence: 0.92,
          sources: [{ source: 'wiktionary', definition: 'Technology company' }]
        }
      ]);

      const result = await service.canonicalizeEntities(entities);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        originalName: 'Apple Computer',
        canonicalName: 'Apple Inc.',
        confidence: 0.92,
        source: 'wiktionary'
      });
    });

    it('preserves original names when no canonical form found', async () => {
      const entities: RawEntity[] = [
        { name: 'CustomEntityName123', type: 'OTHER' }
      ];

      mockDictionaryService.lookup.mockResolvedValue([]);

      const result = await service.canonicalizeEntities(entities);

      expect(result[0]).toMatchObject({
        originalName: 'CustomEntityName123',
        canonicalName: 'CustomEntityName123',
        confidence: 1.0,
        source: 'original'
      });
    });

    it('handles batch processing efficiently', async () => {
      const entities = Array.from({ length: 100 }, (_, i) => ({
        name: `Entity${i}`,
        type: 'CONCEPT' as const
      }));

      const startTime = Date.now();
      await service.canonicalizeEntities(entities);
      const duration = Date.now() - startTime;

      // Should process 100 entities in under 1 second
      expect(duration).toBeLessThan(1000);
    });

    // Property-based test for canonicalization invariants
    it('maintains canonicalization invariants', async () => {
      await fc.assert(fc.asyncProperty(
        fc.array(fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          type: fc.constantFrom('PERSON', 'ORGANIZATION', 'CONCEPT')
        }), { minLength: 1, maxLength: 10 }),
        async (entities) => {
          const result = await service.canonicalizeEntities(entities);
          
          // Invariant: result length equals input length
          expect(result).toHaveLength(entities.length);
          
          // Invariant: all results have valid confidence scores
          result.forEach(r => {
            expect(r.confidence).toBeGreaterThanOrEqual(0);
            expect(r.confidence).toBeLessThanOrEqual(1);
          });
          
          // Invariant: canonical names are non-empty
          result.forEach(r => {
            expect(r.canonicalName.trim()).not.toBe('');
          });
        }
      ));
    });
  });

  describe('error handling', () => {
    it('gracefully handles dictionary service failures', async () => {
      const entities: RawEntity[] = [
        { name: 'TestEntity', type: 'CONCEPT' }
      ];

      mockDictionaryService.lookup.mockRejectedValue(new Error('Dictionary service unavailable'));

      const result = await service.canonicalizeEntities(entities);

      // Should fallback to original names
      expect(result[0]).toMatchObject({
        originalName: 'TestEntity',
        canonicalName: 'TestEntity',
        confidence: 1.0,
        source: 'fallback'
      });
    });

    it('handles partial failures in batch processing', async () => {
      const entities: RawEntity[] = [
        { name: 'ValidEntity', type: 'CONCEPT' },
        { name: 'FailingEntity', type: 'CONCEPT' }
      ];

      mockDictionaryService.lookup
        .mockResolvedValueOnce([{ 
          term: 'ValidEntity', 
          canonicalForm: 'Valid Entity', 
          confidence: 0.9,
          sources: []
        }])
        .mockRejectedValueOnce(new Error('Lookup failed'));

      const result = await service.canonicalizeEntities(entities);

      expect(result).toHaveLength(2);
      expect(result[0].canonicalName).toBe('Valid Entity');
      expect(result[1].canonicalName).toBe('FailingEntity'); // fallback
    });
  });
});
```

#### Synonym Expansion Tests
```typescript
describe('SynonymExpansionService', () => {
  let service: SynonymExpansionService;
  let mockDictionaryService: jest.Mocked<DictionaryService>;

  beforeEach(() => {
    mockDictionaryService = createMockDictionaryService();
    service = new SynonymExpansionService(mockDictionaryService);
  });

  describe('expand search terms', () => {
    it('expands terms with relevant synonyms [A2]', async () => {
      const queryTerms = ['car', 'technology'];

      mockDictionaryService.expandTerms.mockResolvedValue([
        {
          originalTerm: 'car',
          expandedTerms: [
            { term: 'automobile', expansionType: 'synonym', relevanceScore: 0.95 },
            { term: 'vehicle', expansionType: 'hypernym', relevanceScore: 0.87 }
          ]
        },
        {
          originalTerm: 'technology',
          expandedTerms: [
            { term: 'engineering', expansionType: 'synonym', relevanceScore: 0.82 },
            { term: 'innovation', expansionType: 'related_term', relevanceScore: 0.76 }
          ]
        }
      ]);

      const result = await service.expandSearchTerms(queryTerms);

      expect(result.expansions).toHaveLength(2);
      expect(result.expansions[0].expandedTerms).toContainEqual(
        expect.objectContaining({
          term: 'automobile',
          expansionType: 'synonym',
          relevanceScore: 0.95
        })
      );
    });

    it('respects maximum expansions per term limit', async () => {
      const queryTerms = ['technology'];
      const maxExpansions = 3;

      mockDictionaryService.expandTerms.mockResolvedValue([
        {
          originalTerm: 'technology',
          expandedTerms: Array.from({ length: 10 }, (_, i) => ({
            term: `synonym${i}`,
            expansionType: 'synonym' as const,
            relevanceScore: 0.9 - (i * 0.05)
          }))
        }
      ]);

      const result = await service.expandSearchTerms(queryTerms, { maxExpansionsPerTerm: maxExpansions });

      expect(result.expansions[0].expandedTerms).toHaveLength(maxExpansions);
      // Should keep highest relevance scores
      expect(result.expansions[0].expandedTerms[0].relevanceScore).toBeGreaterThan(0.85);
    });

    it('filters expansions by relevance threshold', async () => {
      const queryTerms = ['test'];
      const relevanceThreshold = 0.8;

      mockDictionaryService.expandTerms.mockResolvedValue([
        {
          originalTerm: 'test',
          expandedTerms: [
            { term: 'high_relevance', expansionType: 'synonym', relevanceScore: 0.9 },
            { term: 'low_relevance', expansionType: 'related_term', relevanceScore: 0.6 }
          ]
        }
      ]);

      const result = await service.expandSearchTerms(queryTerms, { relevanceThreshold });

      expect(result.expansions[0].expandedTerms).toHaveLength(1);
      expect(result.expansions[0].expandedTerms[0].term).toBe('high_relevance');
    });
  });
});
```

### Data Processing Tests

#### Dictionary Data Ingestion Tests
```typescript
describe('DictionaryDataIngestion', () => {
  let ingestionService: DictionaryDataIngestionService;
  let mockDatabase: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDatabase = createMockDatabase();
    ingestionService = new DictionaryDataIngestionService(mockDatabase);
  });

  describe('WordNet data processing', () => {
    it('processes WordNet synset data correctly [A5]', async () => {
      const wordNetData = `
        00001740-n 09:synset technology.n.01 the application of scientific knowledge for practical purposes
        00001741-n 09:synset engineering.n.01 the discipline dealing with the art or science of applying scientific knowledge
      `;

      const result = await ingestionService.processWordNetData(wordNetData);

      expect(result.processedSynsets).toBe(2);
      expect(result.errors).toHaveLength(0);
      
      expect(mockDatabase.insertSynsets).toHaveBeenCalledWith([
        expect.objectContaining({
          synsetId: 'technology.n.01',
          lemma: 'technology',
          partOfSpeech: 'noun',
          definition: 'the application of scientific knowledge for practical purposes'
        }),
        expect.objectContaining({
          synsetId: 'engineering.n.01',
          lemma: 'engineering',
          partOfSpeech: 'noun'
        })
      ]);
    });

    it('handles malformed WordNet data gracefully', async () => {
      const malformedData = `
        invalid-line-format
        00001740-n 09:synset technology.n.01 valid definition
        another-invalid-line
      `;

      const result = await ingestionService.processWordNetData(malformedData);

      expect(result.processedSynsets).toBe(1);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain('invalid-line-format');
    });

    it('validates synset data integrity', async () => {
      const invalidSynsetData = `
        00001740-n 09:synset .n.01  # empty lemma
        00001741-n 09:synset technology.n.01  # missing definition
      `;

      const result = await ingestionService.processWordNetData(invalidSynsetData);

      expect(result.processedSynsets).toBe(0);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('Wiktionary data processing', () => {
    it('processes Wiktionary XML data correctly', async () => {
      const wiktionaryXML = `
        <page>
          <title>technology</title>
          <text>
            ==English==
            ===Noun===
            # The application of scientific knowledge for practical purposes
            ====Synonyms====
            * [[engineering]]
            * [[applied science]]
          </text>
        </page>
      `;

      const result = await ingestionService.processWiktionaryData(wiktionaryXML);

      expect(result.processedEntries).toBe(1);
      expect(mockDatabase.insertLexicalEntries).toHaveBeenCalledWith([
        expect.objectContaining({
          wordForm: 'technology',
          canonicalForm: 'technology',
          pronunciation: expect.any(String),
          etymology: expect.any(String)
        })
      ]);
    });
  });

  describe('batch processing', () => {
    it('processes large datasets in batches', async () => {
      const largeSynsetData = Array.from({ length: 10000 }, (_, i) => 
        `0000${i.toString().padStart(4, '0')}-n 09:synset word${i}.n.01 definition ${i}`
      ).join('\n');

      const result = await ingestionService.processWordNetData(largeSynsetData, { batchSize: 1000 });

      expect(result.processedSynsets).toBe(10000);
      expect(mockDatabase.insertSynsets).toHaveBeenCalledTimes(10); // 10 batches
    });

    it('maintains data integrity across batch boundaries', async () => {
      const synsetData = Array.from({ length: 2500 }, (_, i) => 
        `0000${i.toString().padStart(4, '0')}-n 09:synset word${i}.n.01 definition ${i}`
      ).join('\n');

      await ingestionService.processWordNetData(synsetData, { batchSize: 1000 });

      // Verify all batches were processed
      const totalInserted = mockDatabase.insertSynsets.mock.calls
        .reduce((sum, call) => sum + call[0].length, 0);
      
      expect(totalInserted).toBe(2500);
    });
  });
});
```

## Integration Tests (Testcontainers + Real Data)

### Database Integration Tests
```typescript
describe('Dictionary Database Integration', () => {
  let container: StartedPostgreSqlContainer;
  let databaseService: DatabaseService;
  let dictionaryService: DictionaryService;

  beforeAll(async () => {
    container = await new PostgreSqlContainer('postgres:16')
      .withDatabase('test_dictionary')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    const connectionUri = container.getConnectionUri();
    
    // Run migrations
    await runMigrations(connectionUri);
    
    // Seed test dictionary data
    await seedDictionaryTestData(connectionUri);
    
    databaseService = new DatabaseService(connectionUri);
    dictionaryService = new DictionaryService(databaseService);
  });

  afterAll(async () => {
    await container.stop();
  });

  describe('dictionary lookup operations', () => {
    it('performs end-to-end dictionary lookup with real data [A1,A2,A3]', async () => {
      // Test with real WordNet data
      const lookupRequest: DictionaryLookupRequest = {
        terms: ['technology', 'computer', 'innovation'],
        sources: ['wordnet', 'wiktionary'],
        includeRelationships: true,
        maxSynonyms: 5
      };

      const result = await dictionaryService.lookup(lookupRequest);

      expect(result.results).toHaveLength(3);
      
      const technologyResult = result.results.find(r => r.term === 'technology');
      expect(technologyResult).toBeDefined();
      expect(technologyResult!.canonicalForm).toBe('technology');
      expect(technologyResult!.confidence).toBeGreaterThan(0.8);
      expect(technologyResult!.sources).toHaveLength(2); // wordnet + wiktionary
      
      // Verify synonyms are included
      const wordnetSource = technologyResult!.sources.find(s => s.source === 'wordnet');
      expect(wordnetSource!.synonyms).toContain('engineering');
      
      // Verify relationships are included
      expect(wordnetSource!.relationships).toContainEqual(
        expect.objectContaining({
          type: 'hypernym',
          target: expect.any(String),
          confidence: expect.numberBetween(0.5, 1.0)
        })
      );
    });

    it('handles entity canonicalization with database persistence', async () => {
      const entities: EntityToCanonicalizeRequest[] = [
        {
          name: 'Apple Computer',
          type: 'ORGANIZATION',
          context: 'Technology company founded by Steve Jobs'
        },
        {
          name: 'tech innovation',
          type: 'CONCEPT'
        }
      ];

      const result = await dictionaryService.canonicalizeEntities({ entities });

      expect(result.results).toHaveLength(2);
      
      // Verify canonicalization results
      const appleResult = result.results.find(r => r.originalName === 'Apple Computer');
      expect(appleResult).toBeDefined();
      expect(appleResult!.canonicalName).toBe('Apple Inc.');
      expect(appleResult!.confidence).toBeGreaterThan(0.8);
      
      // Verify data was persisted to database
      const storedCanonicalizations = await databaseService.query(`
        SELECT * FROM entity_canonical_forms 
        WHERE original_name = $1
      `, ['Apple Computer']);
      
      expect(storedCanonicalizations.rows).toHaveLength(1);
      expect(storedCanonicalizations.rows[0].canonical_name).toBe('Apple Inc.');
    });

    it('maintains performance within SLA during concurrent operations', async () => {
      const concurrentRequests = Array.from({ length: 10 }, (_, i) => ({
        terms: [`term${i}`, `concept${i}`],
        sources: ['wordnet'] as const,
        includeRelationships: false
      }));

      const startTime = Date.now();
      
      const results = await Promise.all(
        concurrentRequests.map(req => dictionaryService.lookup(req))
      );
      
      const duration = Date.now() - startTime;
      
      // Should handle 10 concurrent requests in under 2 seconds
      expect(duration).toBeLessThan(2000);
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(result.results).toBeDefined();
      });
    });
  });

  describe('dictionary data updates', () => {
    it('handles dictionary source updates with versioning [A5]', async () => {
      // Simulate dictionary update
      const newSourceVersion = {
        name: 'wordnet' as const,
        version: '3.2',
        language: 'en',
        description: 'Updated WordNet version',
        entryCount: 120000
      };

      await dictionaryService.updateDictionarySource(newSourceVersion);

      // Verify new version is available
      const sources = await dictionaryService.getDictionarySources();
      const wordnetSources = sources.sources.filter(s => s.name === 'wordnet');
      
      expect(wordnetSources).toHaveLength(2); // old + new version
      expect(wordnetSources.some(s => s.version === '3.2')).toBe(true);
      
      // Verify old version is marked as deprecated
      const oldVersion = wordnetSources.find(s => s.version === '3.1');
      expect(oldVersion!.status).toBe('deprecated');
    });

    it('maintains data consistency during blue-green deployment', async () => {
      // Start with active dictionary service
      const initialLookup = await dictionaryService.lookup({
        terms: ['technology'],
        sources: ['wordnet']
      });
      
      expect(initialLookup.results).toHaveLength(1);
      
      // Simulate blue-green deployment
      await dictionaryService.startBlueGreenDeployment('wordnet', '3.2');
      
      // Service should remain available during deployment
      const duringDeploymentLookup = await dictionaryService.lookup({
        terms: ['technology'],
        sources: ['wordnet']
      });
      
      expect(duringDeploymentLookup.results).toHaveLength(1);
      
      // Complete deployment
      await dictionaryService.completeBlueGreenDeployment('wordnet', '3.2');
      
      // Verify service uses new version
      const postDeploymentLookup = await dictionaryService.lookup({
        terms: ['technology'],
        sources: ['wordnet']
      });
      
      expect(postDeploymentLookup.results).toHaveLength(1);
      expect(postDeploymentLookup.metadata?.sourcesQueried).toContain('wordnet');
    });
  });

  describe('error handling and resilience', () => {
    it('gracefully degrades when dictionary source unavailable', async () => {
      // Simulate dictionary source failure
      await databaseService.query(`
        UPDATE dictionary_sources 
        SET status = 'unavailable' 
        WHERE name = 'wiktionary'
      `);

      const result = await dictionaryService.lookup({
        terms: ['technology'],
        sources: ['wordnet', 'wiktionary']
      });

      // Should still return results from available sources
      expect(result.results).toHaveLength(1);
      expect(result.results[0].sources).toHaveLength(1);
      expect(result.results[0].sources[0].source).toBe('wordnet');
    });

    it('handles database connection failures with circuit breaker', async () => {
      // Simulate database connection failure
      await container.stop();

      const lookupPromise = dictionaryService.lookup({
        terms: ['technology'],
        sources: ['wordnet']
      });

      // Should fail fast with circuit breaker
      await expect(lookupPromise).rejects.toThrow(/circuit breaker|connection/i);
      
      // Restart container for cleanup
      container = await new PostgreSqlContainer('postgres:16')
        .withDatabase('test_dictionary')
        .start();
    });
  });
});
```

### API Integration Tests
```typescript
describe('Dictionary Service API Integration', () => {
  let app: Application;
  let server: Server;
  let baseURL: string;

  beforeAll(async () => {
    app = await createTestApp();
    server = app.listen(0);
    const address = server.address() as AddressInfo;
    baseURL = `http://localhost:${address.port}`;
  });

  afterAll(async () => {
    await server.close();
  });

  describe('API contract compliance', () => {
    it('conforms to OpenAPI dictionary service specification', async () => {
      const response = await fetch(`${baseURL}/api/v1/dictionary/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms: ['technology'],
          sources: ['wordnet'],
          includeRelationships: true
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      
      // Validate against OpenAPI schema
      const validation = await validateAgainstSchema(data, 'DictionaryLookupResponse');
      expect(validation.valid).toBe(true);
      
      expect(data).toMatchObject({
        results: expect.arrayContaining([
          expect.objectContaining({
            term: 'technology',
            canonicalForm: expect.any(String),
            confidence: expect.numberBetween(0, 1),
            sources: expect.arrayContaining([
              expect.objectContaining({
                source: 'wordnet',
                definition: expect.any(String)
              })
            ])
          })
        ]),
        metadata: expect.objectContaining({
          requestId: expect.any(String),
          processingTimeMs: expect.any(Number)
        })
      });
    });

    it('handles validation errors correctly', async () => {
      const response = await fetch(`${baseURL}/api/v1/dictionary/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms: [], // Invalid: empty array
          sources: ['wordnet']
        })
      });

      expect(response.status).toBe(400);
      
      const error = await response.json();
      expect(error).toMatchObject({
        error: 'VALIDATION_ERROR',
        message: expect.stringContaining('terms'),
        details: expect.any(Object)
      });
    });

    it('enforces rate limiting', async () => {
      const requests = Array.from({ length: 100 }, () =>
        fetch(`${baseURL}/api/v1/dictionary/lookup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terms: ['test'],
            sources: ['wordnet']
          })
        })
      );

      const responses = await Promise.all(requests);
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});
```

## Contract Tests

### Provider Contract Tests
```typescript
describe('Dictionary Service Provider Contracts', () => {
  let provider: Pact;

  beforeAll(async () => {
    provider = new Pact({
      consumer: 'knowledge-graph-service',
      provider: 'dictionary-service',
      port: 1234,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'INFO'
    });

    await provider.setup();
  });

  afterAll(async () => {
    await provider.finalize();
  });

  describe('dictionary lookup contract', () => {
    it('provides dictionary lookup with expected response format', async () => {
      await provider
        .given('dictionary service has WordNet data for technology')
        .uponReceiving('a request for dictionary lookup')
        .withRequest({
          method: 'POST',
          path: '/api/v1/dictionary/lookup',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            terms: ['technology'],
            sources: ['wordnet'],
            includeRelationships: true
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            results: [
              {
                term: 'technology',
                canonicalForm: 'technology',
                confidence: Matchers.decimal(),
                sources: [
                  {
                    source: 'wordnet',
                    synsetId: Matchers.string('technology.n.01'),
                    definition: Matchers.string(),
                    partOfSpeech: 'noun',
                    synonyms: Matchers.eachLike('engineering'),
                    relationships: Matchers.eachLike({
                      type: 'hypernym',
                      target: Matchers.string(),
                      confidence: Matchers.decimal()
                    })
                  }
                ]
              }
            ],
            metadata: {
              requestId: Matchers.uuid(),
              processingTimeMs: Matchers.integer(),
              sourcesQueried: ['wordnet']
            }
          }
        });

      const client = new DictionaryServiceClient(`http://localhost:1234`);
      const response = await client.lookup({
        terms: ['technology'],
        sources: ['wordnet'],
        includeRelationships: true
      });

      expect(response.results).toHaveLength(1);
      expect(response.results[0].term).toBe('technology');
    });
  });

  describe('entity canonicalization contract', () => {
    it('provides entity canonicalization with confidence scores', async () => {
      await provider
        .given('dictionary service can canonicalize Apple Computer')
        .uponReceiving('a request for entity canonicalization')
        .withRequest({
          method: 'POST',
          path: '/api/v1/dictionary/canonicalize',
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            entities: [
              {
                name: 'Apple Computer',
                type: 'ORGANIZATION',
                context: 'Technology company'
              }
            ]
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            results: [
              {
                originalName: 'Apple Computer',
                canonicalName: 'Apple Inc.',
                confidence: Matchers.decimal(),
                source: 'wiktionary',
                reasoning: Matchers.string()
              }
            ]
          }
        });

      const client = new DictionaryServiceClient(`http://localhost:1234`);
      const response = await client.canonicalizeEntities({
        entities: [
          {
            name: 'Apple Computer',
            type: 'ORGANIZATION',
            context: 'Technology company'
          }
        ]
      });

      expect(response.results).toHaveLength(1);
      expect(response.results[0].canonicalName).toBe('Apple Inc.');
    });
  });
});
```

### Consumer Contract Tests
```typescript
describe('Knowledge Graph Service Consumer Contracts', () => {
  let mockProvider: Pact;

  beforeAll(async () => {
    mockProvider = new Pact({
      consumer: 'knowledge-graph-service',
      provider: 'dictionary-service',
      port: 1234
    });

    await mockProvider.setup();
  });

  afterAll(async () => {
    await mockProvider.finalize();
  });

  it('consumes dictionary lookup responses correctly', async () => {
    await mockProvider
      .given('dictionary service is available')
      .uponReceiving('a dictionary lookup request')
      .withRequest({
        method: 'POST',
        path: '/api/v1/dictionary/lookup',
        body: {
          terms: Matchers.eachLike('technology'),
          sources: Matchers.eachLike('wordnet')
        }
      })
      .willRespondWith({
        status: 200,
        body: {
          results: Matchers.eachLike({
            term: 'technology',
            canonicalForm: 'technology',
            confidence: 0.95,
            sources: Matchers.eachLike({
              source: 'wordnet',
              definition: Matchers.string()
            })
          })
        }
      });

    // Test that knowledge graph service can consume the response
    const knowledgeGraphService = new KnowledgeGraphService({
      dictionaryServiceUrl: 'http://localhost:1234'
    });

    const entities = await knowledgeGraphService.extractEntitiesWithDictionary(
      'Technology is transforming our world'
    );

    expect(entities).toContainEqual(
      expect.objectContaining({
        name: 'technology',
        canonicalName: 'technology',
        dictionaryEnhanced: true
      })
    );
  });
});
```

## E2E Tests (Critical User Paths)

### Dictionary-Enhanced Search E2E
```typescript
describe('Dictionary-Enhanced Search E2E', () => {
  let page: Page;

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto('/search');
  });

  afterEach(async () => {
    await page.close();
  });

  it('returns relevant results for synonym queries [A2]', async () => {
    // Search for "car" should return results for "automobile", "vehicle"
    await page.fill('[data-testid="search-input"]', 'car');
    await page.click('[data-testid="search-button"]');

    // Wait for results to load
    await page.waitForSelector('[data-testid="search-results"]');

    // Verify synonym expansion worked
    const resultsText = await page.textContent('[data-testid="search-results"]');
    expect(resultsText).toContain('automobile');
    expect(resultsText).toContain('vehicle');

    // Verify search metadata shows synonym expansion
    await page.click('[data-testid="search-details-toggle"]');
    const expandedTerms = await page.textContent('[data-testid="expanded-terms"]');
    expect(expandedTerms).toContain('automobile');
    expect(expandedTerms).toContain('vehicle');
  });

  it('displays semantic relationships in entity details [A3]', async () => {
    // Navigate to entity detail page
    await page.goto('/entity/technology-123');

    // Verify semantic relationships section is visible
    await expect(page.locator('[data-testid="semantic-relationships"]')).toBeVisible();

    // Verify synonyms are displayed
    const synonymsSection = page.locator('[data-testid="synonyms-list"]');
    await expect(synonymsSection).toContainText('engineering');
    await expect(synonymsSection).toContainText('applied science');

    // Verify hypernym relationships
    const hypernymsSection = page.locator('[data-testid="hypernyms-list"]');
    await expect(hypernymsSection).toContainText('application');

    // Test relationship navigation
    await page.click('[data-testid="relationship-link-engineering"]');
    await expect(page).toHaveURL(/\/entity\/engineering-/);
  });

  it('handles multilingual entity recognition [A4]', async () => {
    // Search with non-English terms that should be linked to English entities
    await page.fill('[data-testid="search-input"]', 'technologie'); // French for technology
    await page.click('[data-testid="search-button"]');

    await page.waitForSelector('[data-testid="search-results"]');

    // Should find English "technology" results
    const resultsText = await page.textContent('[data-testid="search-results"]');
    expect(resultsText).toContain('technology');

    // Verify multilingual mapping is shown
    await page.click('[data-testid="search-details-toggle"]');
    const mappingInfo = await page.textContent('[data-testid="language-mappings"]');
    expect(mappingInfo).toContain('technologie → technology');
  });

  it('maintains search performance with dictionary enhancement', async () => {
    const searchTerm = 'artificial intelligence machine learning';
    
    const startTime = Date.now();
    
    await page.fill('[data-testid="search-input"]', searchTerm);
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    
    const endTime = Date.now();
    const searchDuration = endTime - startTime;
    
    // Search should complete within performance budget
    expect(searchDuration).toBeLessThan(2000); // 2 second budget
    
    // Verify results are enhanced with dictionary data
    const resultsCount = await page.locator('[data-testid="result-item"]').count();
    expect(resultsCount).toBeGreaterThan(0);
  });
});
```

## Performance Tests

### Load Testing
```typescript
describe('Dictionary Service Performance', () => {
  it('handles concurrent dictionary lookups within SLA', async () => {
    const concurrentUsers = 50;
    const requestsPerUser = 10;
    
    const userPromises = Array.from({ length: concurrentUsers }, async (_, userId) => {
      const requests = Array.from({ length: requestsPerUser }, async (_, requestId) => {
        const startTime = Date.now();
        
        const response = await fetch('/api/v1/dictionary/lookup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            terms: [`term${userId}-${requestId}`],
            sources: ['wordnet']
          })
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(response.status).toBe(200);
        expect(duration).toBeLessThan(250); // 250ms SLA
        
        return duration;
      });
      
      return Promise.all(requests);
    });
    
    const allDurations = (await Promise.all(userPromises)).flat();
    
    // Calculate performance metrics
    const avgDuration = allDurations.reduce((sum, d) => sum + d, 0) / allDurations.length;
    const p95Duration = allDurations.sort((a, b) => a - b)[Math.floor(allDurations.length * 0.95)];
    
    expect(avgDuration).toBeLessThan(150); // Average under 150ms
    expect(p95Duration).toBeLessThan(250); // P95 under 250ms
  });

  it('maintains memory usage within bounds during batch processing', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Process large batch of dictionary operations
    const largeBatch = Array.from({ length: 10000 }, (_, i) => ({
      terms: [`batch-term-${i}`],
      sources: ['wordnet'] as const
    }));
    
    for (const request of largeBatch) {
      await dictionaryService.lookup(request);
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
  });
});
```

## Test Data Management

### Test Fixtures
```typescript
// Dictionary test data fixtures
export const wordNetTestData = {
  synsets: [
    {
      synsetId: 'technology.n.01',
      lemma: 'technology',
      partOfSpeech: 'noun',
      definition: 'the application of scientific knowledge for practical purposes',
      examples: ['technology has changed our lives'],
      confidence: 0.95
    },
    {
      synsetId: 'engineering.n.01',
      lemma: 'engineering',
      partOfSpeech: 'noun',
      definition: 'the discipline dealing with the art or science of applying scientific knowledge',
      examples: ['engineering is a challenging field'],
      confidence: 0.92
    }
  ],
  relationships: [
    {
      sourceId: 'technology.n.01',
      targetId: 'application.n.01',
      type: 'hypernym',
      confidence: 0.87
    },
    {
      sourceId: 'technology.n.01',
      targetId: 'engineering.n.01',
      type: 'synonym',
      confidence: 0.82
    }
  ]
};

export const wiktionaryTestData = {
  entries: [
    {
      word: 'technology',
      language: 'en',
      partOfSpeech: 'noun',
      definitions: [
        'The application of scientific knowledge for practical purposes',
        'Machinery and equipment developed from the application of scientific knowledge'
      ],
      synonyms: ['engineering', 'applied science'],
      etymology: 'From Greek tekhnologia',
      pronunciation: '/tɛkˈnɒlədʒi/'
    }
  ]
};
```

### Database Seeding
```typescript
export async function seedDictionaryTestData(connectionUri: string): Promise<void> {
  const client = new Client({ connectionString: connectionUri });
  await client.connect();

  try {
    // Insert dictionary sources
    await client.query(`
      INSERT INTO dictionary_sources (name, version, language, status, description, entry_count)
      VALUES 
        ('wordnet', '3.1', 'en', 'available', 'Princeton WordNet 3.1', 117659),
        ('wiktionary', '2025-01-01', 'en', 'available', 'English Wiktionary dump', 750000)
    `);

    // Insert test synsets
    for (const synset of wordNetTestData.synsets) {
      await client.query(`
        INSERT INTO synsets (synset_id, source_id, lemma, part_of_speech, definition, confidence)
        VALUES ($1, (SELECT id FROM dictionary_sources WHERE name = 'wordnet'), $2, $3, $4, $5)
      `, [synset.synsetId, synset.lemma, synset.partOfSpeech, synset.definition, synset.confidence]);
    }

    // Insert test relationships
    for (const rel of wordNetTestData.relationships) {
      await client.query(`
        INSERT INTO lexical_relationships (source_synset_id, target_synset_id, relationship_type, confidence, source_id)
        VALUES 
          ((SELECT id FROM synsets WHERE synset_id = $1), 
           (SELECT id FROM synsets WHERE synset_id = $2), 
           $3, $4, (SELECT id FROM dictionary_sources WHERE name = 'wordnet'))
      `, [rel.sourceId, rel.targetId, rel.type, rel.confidence]);
    }

  } finally {
    await client.end();
  }
}
```

## Test Execution Strategy

### CI/CD Integration
```yaml
# .github/workflows/dictionary-tests.yml
name: Dictionary Integration Tests

on:
  pull_request:
    paths:
      - 'apps/kv_database/src/lib/dictionary/**'
      - 'apps/contracts/dictionary-service-api.yaml'
      - 'docs/dictionary-integration/**'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:unit:dictionary -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          flags: dictionary-unit-tests

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:integration:dictionary
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: test-results/

  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:contract:dictionary
      - name: Publish Pact
        run: npm run pact:publish

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e:dictionary
      - name: Upload Playwright Report
        uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/

  mutation-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:mutation:dictionary
      - name: Check mutation score
        run: |
          SCORE=$(jq '.mutationScore' reports/mutation/mutation.json)
          if (( $(echo "$SCORE < 0.5" | bc -l) )); then
            echo "Mutation score $SCORE is below threshold 0.5"
            exit 1
          fi
```

## Success Criteria

### Coverage Targets
- **Unit Test Coverage**: ≥80% branch coverage
- **Mutation Test Score**: ≥50% mutation score
- **Integration Test Coverage**: All critical paths tested
- **E2E Test Coverage**: All user-facing features tested

### Performance Targets
- **Dictionary Lookup**: ≤50ms p95 latency
- **Entity Canonicalization**: ≤100ms for batch of 10 entities
- **Search Enhancement**: ≤250ms p95 with synonym expansion
- **Concurrent Load**: Handle 50 concurrent users with <5% error rate

### Quality Gates
- All tests must pass in CI/CD pipeline
- No critical security vulnerabilities
- API contracts must be validated
- Performance budgets must be met
- Accessibility requirements must be satisfied

This comprehensive test plan ensures the dictionary integration feature meets CAWS Tier 2 requirements while providing robust coverage of functionality, performance, and reliability.
