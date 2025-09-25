/**
 * CAWS Shared Types and Interfaces
 *
 * Consolidated type definitions used across all CAWS tools
 *
 * @author @darianrosebrook
 */

// =============================================================================
// CORE INTERFACES
// =============================================================================

export interface ValidationResult {
  passed: boolean;
  score: number;
  details: Record<string, any>;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

export interface GateResult extends ValidationResult {
  tier?: number;
  tierPolicy?: TierPolicy;
}

export interface AccessibilityResult {
  passed: boolean;
  violations: Array<{
    rule: string;
    severity: "error" | "warning" | "info";
    message: string;
    location?: string;
  }>;
  score: number;
  recommendations: string[];
}

export interface PerformanceResult {
  endpoint: string;
  p95_ms: number;
  budget_ms: number;
  passed: boolean;
  deviation_percent: number;
}

export interface ContractValidationResult {
  isValid: boolean;
  errors: Array<{
    type: "request" | "response" | "schema";
    endpoint: string;
    message: string;
    details?: any;
  }>;
  coverage: {
    endpointsTested: number;
    totalEndpoints: number;
    schemasValidated: number;
  };
}

export interface TrustScoreComponents {
  coverage_branch: number;
  mutation_score: number;
  contracts_consumer: boolean;
  contracts_provider: boolean;
  a11y_passed: boolean;
  perf_within_budget: boolean;
  flake_rate: number;
}

export interface TrustScoreResult {
  total_score: number;
  tier: string;
  components: TrustScoreComponents;
  breakdown: {
    coverage: number;
    mutation: number;
    contracts: number;
    a11y: number;
    perf: number;
    flake: number;
  };
  recommendations: string[];
}

// =============================================================================
// FEATURE FLAG TYPES
// =============================================================================

export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  environment: string[];
  userGroups: string[];
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
  killSwitch?: boolean;
}

export interface FeatureFlagUpdate {
  name: string;
  enabled?: boolean;
  rolloutPercentage?: number;
  environment?: string[];
  userGroups?: string[];
  killSwitch?: boolean;
}

export interface FeatureFlagEvaluation {
  enabled: boolean;
  flag: FeatureFlag;
  reason: string;
}

export interface FeatureContext {
  environment: string;
  userId?: string;
  userGroups?: string[];
  requestId?: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// CONFIGURATION TYPES
// =============================================================================

export interface PerformanceBudget {
  api_p95_ms: number;
  ingestion_rate?: number;
  ocr_processing_ms?: number;
  speech_processing_per_second?: number;
}

export interface TierPolicy {
  min_branch: number;
  min_coverage: number;
  min_mutation: number;
  requires_contracts: boolean;
  requires_manual_review?: boolean;
}

// =============================================================================
// CAWS GATE TYPES
// =============================================================================

export interface CoverageData {
  branches: { pct: number };
  functions: { pct: number };
  lines: { pct: number };
  statements: { pct: number };
}

export interface MutationData {
  metrics: {
    killed?: number;
    survived?: number;
    totalDetected?: number;
  };
}

export interface ContractTestResults {
  numPassed: number;
  numTotal: number;
  consumer?: boolean;
  provider?: boolean;
}

export interface TierPolicyConfig {
  [tier: number]: TierPolicy;
}

export interface GateCheckOptions {
  tier: number;
  workingDirectory?: string;
  verbose?: boolean;
}

export interface CawsConfig {
  version?: string;
  environment?: string;
  tiers: Record<string, TierPolicy>;
  defaultTier: string;
  workingSpecPath: string;
  provenancePath: string;
  cawsDirectory: string;
  paths?: Record<string, string>;
  gates?: Record<string, any>;
  tools?: Record<string, any>;
  logging?: Record<string, any>;
  features?: Record<string, any>;
}

export const CawsConfigSchema = {
  type: "object",
  properties: {
    version: { type: "string" },
    environment: { type: "string" },
    tiers: { type: "object" },
    defaultTier: { type: "string" },
    workingSpecPath: { type: "string" },
    provenancePath: { type: "string" },
    cawsDirectory: { type: "string" },
    paths: { type: "object" },
    gates: { type: "object" },
    tools: { type: "object" },
    logging: { type: "object" },
    features: { type: "object" },
  },
  required: [
    "tiers",
    "defaultTier",
    "workingSpecPath",
    "provenancePath",
    "cawsDirectory",
  ],
};

// =============================================================================
// MIGRATION TYPES
// =============================================================================

export interface MigrationStep {
  id: string;
  description: string;
  sql: string;
  rollback_sql?: string;
  dependencies?: string[];
}

// =============================================================================
// TEST TYPES
// =============================================================================

export interface TestResult {
  title: string;
  fullName: string;
  status: "passed" | "failed" | "pending" | "skipped";
  duration: number;
  failureMessages: string[];
}

export interface TestSuiteResult {
  name: string;
  status: "passed" | "failed";
  testResults: TestResult[];
  startTime: number;
  endTime: number;
}

export interface FlakeDetectionResult {
  flakyTests: string[];
  varianceScore: number;
  totalRuns: number;
  recommendations: string[];
}

export interface HistoricalTestData {
  runs: TestRun[];
  quarantined: Set<string>;
  lastUpdated: string;
}

export interface TestRun {
  timestamp: number;
  results: Map<string, TestResult>;
  variance: number;
}

// =============================================================================
// PROVENANCE TYPES
// =============================================================================

export interface ProvenanceData {
  agent: string;
  model: string;
  commit: string;
  artifacts: string[];
  results: {
    coverage_branch: number;
    mutation_score: number;
    tests_passed: number;
    a11y?: string;
    perf?: any;
    contracts?: {
      consumer: boolean;
      provider: boolean;
    };
    flake_rate?: number;
  };
  approvals: Array<{
    approver: string;
    timestamp: string;
    type: string;
  }>;
  generatedAt: string;
  metadata?: Record<string, any>;
}

// =============================================================================
// MULTI-MODAL TYPES
// =============================================================================

export interface MultiModalIngestionConfig {
  batchSize?: number;
  rateLimitMs?: number;
  skipExisting?: boolean;
  includePatterns?: string[];
  excludePatterns?: string[];
  enableOCR?: boolean;
  enableSpeechToText?: boolean;
  maxFileSize?: number;
}

export interface MultiModalIngestionResult {
  totalFiles: number;
  processedFiles: number;
  skippedFiles: number;
  failedFiles: number;
  totalChunks: number;
  processedChunks: number;
  errors: string[];
  contentTypeStats: Record<string, number>;
}
