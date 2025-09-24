# Multi-Modal RAG Testing Suite

This directory contains comprehensive tests for the Obsidian RAG system's multi-modal content processing capabilities.

## Test Structure

```
tests/
├── unit/                          # Unit tests (fast, isolated)
│   ├── multi-modal.test.ts        # Content detection & metadata extraction
│   ├── multi-modal-ingest.test.ts # Ingestion pipeline
│   └── ingest-multi-modal.test.ts # CLI interface
├── integration/                   # Integration tests (with dependencies)
│   └── multi-modal.integration.test.ts # End-to-end ingestion
├── setup.ts                       # Test environment setup
└── README.md                      # This file
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Multi-Modal Specific Tests
```bash
# Unit tests for multi-modal functionality
npm run test:unit:multi-modal

# Integration tests for multi-modal functionality
npm run test:integration:multi-modal
```

### Watch Mode (for development)
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

## Test Categories

### 🔍 Unit Tests (`tests/unit/`)

#### `multi-modal.test.ts`
Tests the core content detection and metadata extraction logic:
- **Content Type Detection**: MIME type analysis, file signatures, extension validation
- **Content Analysis**: Text detection, structured data recognition, encoding detection
- **Metadata Extraction**: File metadata, content-specific metadata, quality assessment
- **Error Handling**: Graceful failure handling and error reporting

#### `multi-modal-ingest.test.ts`
Tests the ingestion pipeline components:
- **File Processing**: Batch processing, rate limiting, error recovery
- **Content Chunking**: Structure-aware chunking, size-based chunking, content-specific chunking
- **Configuration**: Batch size, rate limiting, skip existing options
- **Statistics**: Content type tracking, processing metrics

#### `ingest-multi-modal.test.ts`
Tests the CLI interface and file discovery:
- **Argument Parsing**: Command-line option parsing and validation
- **File Discovery**: Pattern matching, include/exclude logic, recursive directory traversal
- **Content Type Analysis**: File type breakdown and reporting
- **Validation Logic**: Ingestion result validation and error checking

### 🔗 Integration Tests (`tests/integration/`)

#### `multi-modal.integration.test.ts`
End-to-end tests with real dependencies:
- **Database Integration**: PostgreSQL with pgvector for chunk storage
- **Full Pipeline**: Complete ingestion workflow from files to searchable chunks
- **Content Types**: Testing various file formats (text, JSON, CSV, etc.)
- **Performance**: Memory usage, processing time, scalability testing
- **Error Scenarios**: File corruption, permission issues, large files
- **Data Persistence**: Chunk storage, metadata preservation, searchability

## Test Environment

### Dependencies
- **PostgreSQL**: Via Testcontainers for integration tests
- **Vitest**: Test runner and assertion library
- **Node.js**: Runtime environment
- **File System**: Temporary directories for test files

### Setup
Tests use Testcontainers to spin up isolated PostgreSQL instances for integration testing. Unit tests use mocks to avoid external dependencies.

### Cleanup
- Temporary files are cleaned up after each test
- Database containers are stopped and removed
- Mocks are reset between tests

## Test Data

### Sample Files
Tests create various sample files for different content types:
- **Text files**: Plain text, Markdown with headers and sections
- **Structured data**: JSON objects, CSV files, XML documents
- **Large files**: Performance testing with bigger content
- **Edge cases**: Empty files, corrupted content, permission issues

### Mock Data
Unit tests use comprehensive mocks for:
- File system operations (fs.statSync, fs.readFileSync)
- Database operations (chunk storage, retrieval)
- Embedding service calls
- External API responses

## Coverage Goals

### Code Coverage
- **Branches**: 80% minimum
- **Functions**: 80% minimum
- **Lines**: 80% minimum
- **Statements**: 80% minimum

### Feature Coverage
- **Content Types**: All supported file formats
- **Error Scenarios**: Common failure modes and edge cases
- **Configuration Options**: All CLI flags and ingestion settings
- **Performance**: Memory usage, processing time, scalability

## Running Specific Test Files

### Debug a Single Test
```bash
# Run specific test file
npx vitest run tests/unit/multi-modal.test.ts

# Run with verbose output
npx vitest run tests/unit/multi-modal.test.ts --reporter=verbose

# Run with debugging
npx vitest run tests/unit/multi-modal.test.ts --inspect-brk
```

### Run Tests in Specific Directory
```bash
# Run all unit tests
npx vitest run tests/unit/

# Run all integration tests
npx vitest run tests/integration/
```

## Test Configuration

### Vitest Configuration
Located in `vitest.config.ts`:
- **Environment**: Node.js
- **Globals**: Vitest globals available
- **Setup**: `tests/setup.ts` for common test configuration
- **Timeouts**: 30s for tests, 60s for hooks
- **Retries**: 2 retries for flaky tests
- **Coverage**: V8 provider with detailed reporting

### Environment Variables
For integration tests requiring external services:
- `DATABASE_URL`: PostgreSQL connection (auto-configured by Testcontainers)
- `EMBEDDING_MODEL`: Model name for embeddings
- `EMBEDDING_DIMENSION`: Embedding vector dimensions

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("ComponentName", () => {
  let component: any;

  beforeEach(() => {
    // Setup
    component = new ComponentName();
  });

  describe("methodName", () => {
    it("should handle normal case", () => {
      // Arrange
      const input = "test input";

      // Act
      const result = component.methodName(input);

      // Assert
      expect(result).toBe("expected output");
    });

    it("should handle edge case", () => {
      // Test edge cases and error conditions
    });
  });
});
```

### Integration Test Template
```typescript
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";

describe("IntegrationTest", () => {
  let postgresContainer: StartedPostgreSqlContainer;
  let service: any;

  beforeEach(async () => {
    // Start dependencies
    postgresContainer = await new PostgreSqlContainer()
      .withDatabase("testdb")
      .withUsername("testuser")
      .withPassword("testpass")
      .start();

    // Initialize service
    service = new Service(postgresContainer.getConnectionUri());
  }, 60000);

  afterEach(async () => {
    // Cleanup
    await service.cleanup();
    await postgresContainer.stop();
  });

  it("should perform end-to-end operation", async () => {
    // Test full workflow
    const result = await service.performOperation();

    expect(result.success).toBe(true);
  });
});
```

## Test Results Interpretation

### Success Criteria
- ✅ **All tests pass**: No failing tests
- ✅ **Coverage thresholds met**: Minimum 80% coverage
- ✅ **No memory leaks**: Tests clean up resources properly
- ✅ **Performance acceptable**: Tests complete within timeouts

### Common Issues
- **Timeout errors**: Increase timeout or optimize test
- **Memory issues**: Check for resource leaks in test setup/teardown
- **Flaky tests**: Use retries or stabilize test conditions
- **Coverage gaps**: Add tests for uncovered code paths

## Continuous Integration

### GitHub Actions
Tests run automatically on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

### Quality Gates
- **Unit tests**: Must pass with 80% coverage
- **Integration tests**: Must pass on all supported Node versions
- **Linting**: Must pass ESLint rules
- **Type checking**: Must pass TypeScript compilation

### Performance Monitoring
- Test execution time tracked
- Coverage trends monitored
- Failure patterns analyzed

## Troubleshooting

### Common Test Failures

#### Database Connection Issues
```bash
# Check if Docker is running
docker ps

# Check available disk space
df -h

# Restart Docker service
sudo systemctl restart docker
```

#### Memory Issues
```bash
# Check available memory
free -h

# Kill hanging processes
pkill -f "testcontainers"

# Increase Node memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

#### File Permission Issues
```bash
# Fix test directory permissions
chmod -R 755 tests/
chown -R $USER:$USER tests/
```

### Debug Mode
```bash
# Run with debug logging
DEBUG=vite:* npm test

# Run single test with breakpoint
npx vitest run tests/unit/multi-modal.test.ts --inspect-brk

# Run with verbose output
npm test -- --reporter=verbose
```

## Contributing

### Adding New Tests
1. Create test file in appropriate directory (`unit/` or `integration/`)
2. Follow naming convention: `*.test.ts` or `*.spec.ts`
3. Include descriptive test names and comments
4. Ensure tests are isolated and don't depend on external state
5. Add performance assertions where appropriate

### Test Maintenance
- Keep tests updated with code changes
- Remove obsolete tests
- Update test data as requirements change
- Monitor test execution time and optimize slow tests

This comprehensive testing suite ensures the multi-modal functionality is robust, performant, and maintainable. 🧪✨
