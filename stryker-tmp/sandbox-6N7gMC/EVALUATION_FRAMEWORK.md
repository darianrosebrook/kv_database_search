# 📊 RAG System Evaluation Framework

A comprehensive evaluation framework for measuring and improving RAG (Retrieval-Augmented Generation) system performance.

## 🚀 Features

### Core Evaluation Capabilities
- **Relevance Metrics**: Precision, Recall, F1-Score, NDCG, MRR
- **Performance Benchmarking**: Latency tracking and regression detection
- **Statistical Analysis**: A/B testing with significance testing
- **Automated Testing**: Synthetic and real-world dataset support

### Advanced Features
- **Multi-dimensional Ranking Analysis**: 10+ ranking factors evaluation
- **User Personalization Testing**: Preference learning validation
- **Temporal Relevance Assessment**: Content freshness evaluation
- **Diversity Scoring**: Result variety optimization

## 📋 Quick Start

### 1. Load a Test Dataset
```bash
# Load the design system queries dataset
npm run evaluation load-dataset evaluation-datasets/design-system-queries.json

# Or create a synthetic dataset
npm run evaluation create-dataset synthetic-test 50
```

### 2. Run Basic Evaluation
```bash
# Evaluate with baseline settings
npm run evaluation evaluate design-system-queries

# Evaluate with advanced features enabled
npm run evaluation evaluate design-system-queries --rerank true --advanced true --hybrid true
```

### 3. Run Comprehensive Evaluation
```bash
# Run full evaluation suite with comparison
npm run evaluation comprehensive
```

## 🧪 Evaluation Commands

### Dataset Management
```bash
# Create synthetic dataset
npm run evaluation create-dataset <name> [size]

# Load dataset from JSON file
npm run evaluation load-dataset <filepath>

# Example: Load design system queries
npm run evaluation load-dataset evaluation-datasets/design-system-queries.json
```

### Performance Evaluation
```bash
# Basic evaluation
npm run evaluation evaluate <dataset-name>

# Advanced evaluation with options
npm run evaluation evaluate <dataset-name> --rerank true --advanced true --user user123

# A/B testing between variants
npm run evaluation ab-test <dataset-name>
```

### Benchmarking & Monitoring
```bash
# Performance benchmarking
npm run evaluation benchmark search 20

# Performance history analysis
npm run evaluation performance

# Regression detection
npm run evaluation regression 1.1  # 10% threshold
```

## 📊 Evaluation Metrics

### Relevance Metrics
- **Precision**: Fraction of retrieved results that are relevant
- **Recall**: Fraction of relevant results that are retrieved
- **F1-Score**: Harmonic mean of precision and recall
- **NDCG**: Normalized Discounted Cumulative Gain
- **MRR**: Mean Reciprocal Rank

### Ranking Factors
- Semantic Similarity
- Lexical Similarity
- Keyword Match
- Title Match
- Context Match
- Intent Alignment
- **Temporal Relevance** ⭐
- **User Preference** ⭐
- **Diversity Score** ⭐
- **Cluster Similarity** ⭐

## 🎯 Sample Results

### Baseline vs Enhanced Comparison
```
📊 BASELINE vs ENHANCED:
• Precision: 72.34% → 84.21% (+16.39%)
• Recall: 68.92% → 81.45% (+18.17%)
• F1 Score: 70.56% → 82.79% (+17.33%)
• Latency: 145.2ms → 178.3ms (+22.8ms change)
```

### Ranking Factor Analysis
```
🔍 RANKING FACTOR CONTRIBUTIONS:
• Semantic Similarity: 32.4%
• User Preference: 18.7%
• Temporal Relevance: 15.2%
• Lexical Similarity: 12.8%
• Diversity Score: 8.9%
• Keyword Match: 7.2%
• Title Match: 4.8%
```

## 📁 Dataset Formats

### JSON Dataset Structure
```json
{
  "name": "design-system-queries",
  "description": "Real-world design system queries",
  "queries": [
    {
      "id": "button-component",
      "query": "How do I implement a primary button component?",
      "expectedResults": ["chunk_123", "chunk_456"],
      "intent": "component",
      "difficulty": "easy",
      "category": "component"
    }
  ]
}
```

### Query Properties
- **id**: Unique identifier
- **query**: Search query text
- **expectedResults**: Array of relevant chunk IDs (optional)
- **intent**: Query intent type (component, process, concept, reference)
- **difficulty**: Query difficulty (easy, medium, hard)
- **category**: Content category for analysis

## 🔧 Configuration Options

### Search Options
```typescript
{
  limit: 10,                    // Max results to retrieve
  rerank: true,                 // Enable result reranking
  hybridRanking: true,          // Use hybrid ranking system
  enableAdvancedRanking: true,  // Enable advanced ranking features
  userId: "user123"            // User ID for personalization
}
```

### Ranking Configuration
```typescript
{
  temporalConfig: {
    maxAgeDays: 365,           // Content older than this gets penalty
    recencyBoost: 0.2,         // Boost for recent content
    updateFrequencyWeight: 0.1  // Weight for frequently updated content
  },
  diversityConfig: {
    clusterThreshold: 0.8,     // Similarity threshold for clustering
    maxSimilarResults: 3,      // Max similar results allowed
    diversityWeight: 0.15      // Diversity penalty weight
  }
}
```

## 📈 Advanced Usage

### Custom Evaluation Metrics
```typescript
// Extend evaluation framework with custom metrics
class CustomEvaluationFramework extends EvaluationFramework {
  async evaluateCustomMetric(query: EvaluationQuery): Promise<number> {
    // Implement custom evaluation logic
    return customScore;
  }
}
```

### Automated Regression Testing
```bash
# Set up automated regression testing
npm run evaluation regression 1.05  # 5% threshold

# Run in CI/CD pipeline
#!/bin/bash
npm run evaluation comprehensive
if [ $? -ne 0 ]; then
  echo "❌ Performance regression detected!"
  exit 1
fi
```

### Performance Monitoring Dashboard
```typescript
// Set up continuous monitoring
const evaluator = new EvaluationFramework(searchService);

// Run periodic evaluations
setInterval(async () => {
  const metrics = await evaluator.evaluateDataset('production-queries');
  await sendToMonitoringDashboard(metrics);
}, 3600000); // Hourly
```

## 📋 Best Practices

### Dataset Creation
1. **Diverse Queries**: Include various difficulty levels and intent types
2. **Real-World Relevance**: Use actual user queries when possible
3. **Ground Truth**: Manually annotate relevant results for accuracy
4. **Regular Updates**: Refresh datasets as system evolves

### Evaluation Strategy
1. **Baseline First**: Always establish baseline metrics before optimization
2. **Statistical Significance**: Use statistical tests for meaningful comparisons
3. **Multi-Metric**: Don't optimize for single metrics at expense of others
4. **Continuous Monitoring**: Set up automated evaluation pipelines

### Performance Optimization
1. **Regression Detection**: Monitor for performance degradation
2. **Benchmark Regularly**: Establish performance baselines
3. **Profile Bottlenecks**: Identify and optimize slow components
4. **Load Testing**: Test under realistic load conditions

## 🔍 Troubleshooting

### Common Issues

**High Latency with Advanced Ranking**
```bash
# Disable advanced features for faster evaluation
npm run evaluation evaluate dataset --advanced false
```

**Low Statistical Significance**
```bash
# Increase dataset size for more reliable results
npm run evaluation create-dataset large-test 200
```

**Memory Issues with Large Datasets**
```bash
# Process datasets in batches
npm run evaluation evaluate dataset --limit 50
```

## 📊 Integration Examples

### CI/CD Pipeline Integration
```yaml
# .github/workflows/evaluation.yml
name: RAG Evaluation
on: [pull_request, push]

jobs:
  evaluate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run evaluation
        run: npm run evaluation comprehensive

      - name: Upload reports
        uses: actions/upload-artifact@v3
        with:
          name: evaluation-reports
          path: evaluation-reports/
```

### Custom Evaluation Scripts
```typescript
// custom-evaluation.ts
import { EvaluationFramework } from './src/lib/evaluation.js';

async function customEvaluation() {
  const evaluator = new EvaluationFramework(searchService);

  // Load custom dataset
  await evaluator.loadTestDatasetFromFile('custom-dataset.json');

  // Run evaluation with custom options
  const metrics = await evaluator.evaluateDataset('custom-dataset', {
    enableAdvancedRanking: true,
    userId: 'test-user'
  });

  // Generate custom report
  console.log('🎯 Custom Evaluation Results:');
  console.log(`Precision: ${(metrics.averagePrecision * 100).toFixed(2)}%`);
  console.log(`Recall: ${(metrics.averageRecall * 100).toFixed(2)}%`);
}

customEvaluation();
```

## 📈 Roadmap

### Planned Enhancements
- **Real-time Evaluation**: Live performance monitoring
- **User Feedback Integration**: Incorporate user satisfaction ratings
- **Multi-modal Evaluation**: Support for image/text/video search
- **Federated Evaluation**: Distributed evaluation across multiple systems
- **AI-Powered Analysis**: ML-based performance insights

---

## 🎉 Impact Summary

The evaluation framework provides:

✅ **Measurable Quality Improvements**: Quantify search relevance gains
✅ **Performance Regression Detection**: Catch issues before they impact users
✅ **Data-Driven Optimization**: Make informed system improvement decisions
✅ **Continuous Monitoring**: Ensure sustained system performance
✅ **Comparative Analysis**: Validate feature effectiveness through A/B testing

This framework transforms RAG system development from guesswork to data-driven optimization, ensuring every enhancement delivers measurable value to users.


