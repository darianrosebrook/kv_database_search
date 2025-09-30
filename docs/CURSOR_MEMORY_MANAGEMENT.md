# Cursor Memory Management Guide

## Problem Identified

Cursor was experiencing high memory usage and crashes due to several factors:

1. **TypeScript Compilation**: 39MB heap increase per compilation
2. **Database Connection Pools**: 20 max connections per instance (reduced to 5)
3. **Large Test Data**: 50MB+ buffers in tests (reduced to 5MB)
4. **Memory Accumulation**: No garbage collection between operations
5. **Long Test Timeouts**: 30-60 second timeouts allowing memory to accumulate

## Solutions Implemented

### 1. Database Connection Pool Optimization
- **Before**: `max: 20, min: 5, idleTimeoutMillis: 30000`
- **After**: `max: 5, min: 1, idleTimeoutMillis: 10000`
- **Impact**: Reduces memory usage by ~75% for database connections

### 2. Test Configuration Optimization
- **Before**: `testTimeout: 30000, hookTimeout: 60000, retry: 2`
- **After**: `testTimeout: 15000, hookTimeout: 30000, retry: 1`
- **Impact**: Prevents memory accumulation during long-running tests

### 3. Test Data Size Reduction
- **Before**: 50MB image buffers, 5000x repeated content
- **After**: 5MB image buffers, 1000x repeated content
- **Impact**: Reduces memory pressure during testing

### 4. Memory Cleanup Integration
- Added garbage collection to test cleanup
- Added buffer clearing after large operations
- Added file cleanup after tests

## Memory Monitoring Tools

### Available Scripts

```bash
# Monitor memory usage during operations
npm run memory:monitor

# Run stress test to identify memory issues
npm run memory:stress

# Check current memory status
npm run memory:cleanup status

# Force garbage collection
npm run memory:cleanup gc

# Run tests with memory monitoring
npm run memory:cleanup test
```

### Memory Thresholds

- **Heap Usage**: Should stay below 500MB
- **RSS Usage**: Should stay below 1GB
- **Warning**: Heap > 400MB or RSS > 800MB
- **Critical**: Heap > 500MB or RSS > 1GB

## Best Practices for Cursor Development

### 1. Regular Memory Monitoring
```bash
# Check memory status before starting work
npm run memory:cleanup status

# Monitor during development
npm run memory:monitor
```

### 2. Periodic Cleanup
```bash
# Force cleanup if memory gets high
npm run memory:cleanup cleanup

# Run garbage collection
npm run memory:cleanup gc
```

### 3. Test Management
```bash
# Run tests with memory monitoring
npm run memory:cleanup test

# Use smaller test batches
npm run test:unit:quick
```

### 4. Cursor Configuration
Add to your Cursor settings:
```json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false,
  "typescript.preferences.includeCompletionsForModuleExports": false
}
```

## Memory Usage Patterns

### Normal Development
- **Heap**: 50-200MB
- **RSS**: 200-500MB
- **Operations**: TypeScript compilation, file watching, testing

### High Memory Scenarios
- **TypeScript Compilation**: +39MB heap
- **Database Operations**: +6MB RSS per 10 connections
- **Large File Processing**: +22MB heap, +54MB RSS
- **Test Execution**: +4MB heap, +25MB RSS

### Critical Memory Scenarios
- **Multiple Compilations**: 200MB+ heap
- **Concurrent Tests**: 300MB+ RSS
- **Large File Processing**: 400MB+ RSS
- **Memory Leaks**: Continuous growth without cleanup

## Troubleshooting

### If Cursor Crashes
1. Check memory usage: `npm run memory:cleanup status`
2. Force cleanup: `npm run memory:cleanup cleanup`
3. Restart Cursor with increased memory: `NODE_OPTIONS="--max-old-space-size=8192" cursor`
4. Run memory stress test: `npm run memory:stress`

### If Tests Fail
1. Reduce test data sizes
2. Increase timeouts temporarily
3. Run tests in smaller batches
4. Check for memory leaks in test cleanup

### If Database Issues
1. Check connection pool settings
2. Ensure proper cleanup in tests
3. Monitor database memory usage
4. Consider using in-memory databases for tests

## Monitoring Commands

```bash
# Quick memory check
npm run memory:cleanup check

# Detailed memory report
npm run memory:cleanup status

# Run full memory analysis
npm run memory:monitor

# Test memory under stress
npm run memory:stress
```

## Future Improvements

1. **Incremental TypeScript Compilation**: Reduce compilation memory usage
2. **Memory-Mapped Files**: For large data processing
3. **Connection Pooling**: Shared pools across services
4. **Test Parallelization**: Better memory management for concurrent tests
5. **Memory Profiling**: Automated memory leak detection

## Conclusion

The implemented fixes should significantly reduce Cursor's memory usage and prevent crashes. The key was identifying that TypeScript compilation and database connection pools were the primary culprits, followed by large test data and inadequate cleanup.

Regular monitoring and cleanup will help maintain stable memory usage during development.
