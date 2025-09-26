import { Pool } from "pg";
import { EventEmitter } from "events";

export interface MetricValue {
  timestamp: Date;
  value: number;
  labels: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  status: "active" | "resolved" | "suppressed";
  triggeredAt: Date;
  resolvedAt?: Date;
  condition: AlertCondition;
  metadata: Record<string, unknown>;
  notifications: NotificationRecord[];
}

export interface AlertCondition {
  metric: string;
  operator: "gt" | "gte" | "lt" | "lte" | "eq" | "ne";
  threshold: number;
  duration: number; // seconds
  evaluationWindow: number; // seconds
  labels?: Record<string, string>;
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: AlertCondition;
  severity: "low" | "medium" | "high" | "critical";
  enabled: boolean;
  notifications: NotificationChannel[];
  suppressionRules: SuppressionRule[];
  metadata: Record<string, unknown>;
}

export interface NotificationChannel {
  type: "email" | "slack" | "webhook" | "pagerduty" | "console";
  config: Record<string, unknown>;
  enabled: boolean;
}

export interface NotificationRecord {
  id: string;
  alertId: string;
  channel: NotificationChannel;
  sentAt: Date;
  status: "sent" | "failed" | "pending";
  error?: string;
}

export interface SuppressionRule {
  id: string;
  name: string;
  condition: string; // Expression to evaluate
  duration: number; // seconds
  enabled: boolean;
}

export interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  lastCheck: Date;
  responseTime: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface SystemMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-1
    load: number[];
  };
  memory: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // 0-1
  };
  disk: {
    used: number; // bytes
    total: number; // bytes
    usage: number; // 0-1
    iops: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  database: {
    connections: number;
    maxConnections: number;
    queryTime: number; // avg ms
    lockWaits: number;
    deadlocks: number;
  };
}

export interface ApplicationMetrics {
  timestamp: Date;
  requests: {
    total: number;
    rate: number; // per second
    errorRate: number; // 0-1
    avgResponseTime: number; // ms
    p95ResponseTime: number; // ms
    p99ResponseTime: number; // ms
  };
  search: {
    queriesTotal: number;
    queriesRate: number; // per second
    avgQueryTime: number; // ms
    cacheHitRate: number; // 0-1
    vectorSearchTime: number; // ms
    graphTraversalTime: number; // ms
  };
  reasoning: {
    operationsTotal: number;
    operationsRate: number; // per second
    avgReasoningTime: number; // ms
    avgPathLength: number;
    avgConfidence: number; // 0-1
  };
  knowledgeGraph: {
    nodeCount: number;
    relationshipCount: number;
    avgDegree: number;
    ingestionRate: number; // entities per second
    processingQueueSize: number;
  };
}

export interface PerformanceProfile {
  operation: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  metadata: Record<string, unknown>;
  stackTrace?: string[];
  resourceUsage?: {
    cpu: number;
    memory: number;
    io: number;
  };
}

/**
 * Comprehensive monitoring and alerting system for the Graph RAG system
 * Provides metrics collection, health checks, alerting, and performance profiling
 */
export class MonitoringSystem extends EventEmitter {
  private pool: Pool;
  private metrics: Map<string, MetricValue[]> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private alertRules: Map<string, AlertRule> = new Map();
  private healthChecks: Map<string, HealthCheck> = new Map();
  private performanceProfiles: Map<string, PerformanceProfile> = new Map();
  private metricsRetentionDays: number = 30;
  private metricsCollectionInterval: number = 30000; // 30 seconds
  private healthCheckInterval: number = 60000; // 1 minute
  private alertEvaluationInterval: number = 15000; // 15 seconds

  constructor(
    pool: Pool,
    config: {
      metricsRetentionDays?: number;
      metricsCollectionInterval?: number;
      healthCheckInterval?: number;
      alertEvaluationInterval?: number;
    } = {}
  ) {
    super();
    this.pool = pool;
    this.metricsRetentionDays = config.metricsRetentionDays || 30;
    this.metricsCollectionInterval = config.metricsCollectionInterval || 30000;
    this.healthCheckInterval = config.healthCheckInterval || 60000;
    this.alertEvaluationInterval = config.alertEvaluationInterval || 15000;

    this.initializeMonitoring();
  }

  /**
   * Record a metric value
   */
  recordMetric(
    name: string,
    value: number,
    labels: Record<string, string> = {},
    metadata?: Record<string, unknown>
  ): void {
    const metric: MetricValue = {
      timestamp: new Date(),
      value,
      labels,
      metadata,
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metricHistory = this.metrics.get(name)!;
    metricHistory.push(metric);

    // Keep only recent metrics in memory
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
    const filtered = metricHistory.filter((m) => m.timestamp > cutoff);
    this.metrics.set(name, filtered);

    // Emit metric event
    this.emit("metric", { name, metric });

    // Store in database asynchronously
    this.storeMetric(name, metric).catch((error) => {
      console.error(`Failed to store metric ${name}:`, error);
    });
  }

  /**
   * Record multiple metrics at once
   */
  recordMetrics(
    metrics: Array<{
      name: string;
      value: number;
      labels?: Record<string, string>;
      metadata?: Record<string, unknown>;
    }>
  ): void {
    for (const metric of metrics) {
      this.recordMetric(
        metric.name,
        metric.value,
        metric.labels,
        metric.metadata
      );
    }
  }

  /**
   * Get metric history
   */
  getMetrics(
    name: string,
    timeRange?: { start: Date; end: Date },
    labels?: Record<string, string>
  ): MetricValue[] {
    const metrics = this.metrics.get(name) || [];

    let filtered = metrics;

    // Filter by time range
    if (timeRange) {
      filtered = filtered.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
      );
    }

    // Filter by labels
    if (labels) {
      filtered = filtered.filter((m) => {
        return Object.entries(labels).every(
          ([key, value]) => m.labels[key] === value
        );
      });
    }

    return filtered.sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );
  }

  /**
   * Calculate metric statistics
   */
  getMetricStats(
    name: string,
    timeRange?: { start: Date; end: Date },
    labels?: Record<string, string>
  ): {
    count: number;
    min: number;
    max: number;
    avg: number;
    sum: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const metrics = this.getMetrics(name, timeRange, labels);

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const avg = sum / values.length;

    const percentile = (p: number) => {
      const index = Math.ceil((values.length * p) / 100) - 1;
      return values[Math.max(0, index)];
    };

    return {
      count: values.length,
      min: values[0],
      max: values[values.length - 1],
      avg,
      sum,
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
    };
  }

  /**
   * Add an alert rule
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    console.log(`📊 Alert rule added: ${rule.name}`);
  }

  /**
   * Remove an alert rule
   */
  removeAlertRule(ruleId: string): void {
    this.alertRules.delete(ruleId);
    console.log(`📊 Alert rule removed: ${ruleId}`);
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.status === "active"
    );
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string, reason?: string): void {
    const alert = this.alerts.get(alertId);
    if (alert && alert.status === "active") {
      alert.status = "resolved";
      alert.resolvedAt = new Date();
      if (reason) {
        alert.metadata.resolutionReason = reason;
      }

      this.emit("alertResolved", alert);
      console.log(`🔔 Alert resolved: ${alert.name}`);
    }
  }

  /**
   * Add a health check
   */
  addHealthCheck(
    name: string,
    checkFunction: () => Promise<{
      status: "healthy" | "degraded" | "unhealthy";
      responseTime: number;
      error?: string;
      metadata?: Record<string, unknown>;
    }>
  ): void {
    // Store the check function and run it periodically
    const runCheck = async () => {
      const startTime = performance.now();
      try {
        const result = await checkFunction();
        const responseTime = performance.now() - startTime;

        const healthCheck: HealthCheck = {
          name,
          status: result.status,
          lastCheck: new Date(),
          responseTime,
          error: result.error,
          metadata: result.metadata || {},
        };

        this.healthChecks.set(name, healthCheck);
        this.emit("healthCheck", healthCheck);

        // Record as metric
        this.recordMetric(`health_check.${name}.response_time`, responseTime, {
          status: result.status,
        });

        this.recordMetric(
          `health_check.${name}.status`,
          result.status === "healthy" ? 1 : 0,
          {
            status: result.status,
          }
        );
      } catch (error) {
        const responseTime = performance.now() - startTime;
        const healthCheck: HealthCheck = {
          name,
          status: "unhealthy",
          lastCheck: new Date(),
          responseTime,
          error: error instanceof Error ? error.message : String(error),
          metadata: {},
        };

        this.healthChecks.set(name, healthCheck);
        this.emit("healthCheck", healthCheck);

        this.recordMetric(`health_check.${name}.response_time`, responseTime, {
          status: "unhealthy",
        });

        this.recordMetric(`health_check.${name}.status`, 0, {
          status: "unhealthy",
        });
      }
    };

    // Run immediately and then on interval
    runCheck();
    setInterval(runCheck, this.healthCheckInterval);

    console.log(`🏥 Health check added: ${name}`);
  }

  /**
   * Get health check status
   */
  getHealthStatus(): {
    overall: "healthy" | "degraded" | "unhealthy";
    checks: HealthCheck[];
    summary: {
      total: number;
      healthy: number;
      degraded: number;
      unhealthy: number;
    };
  } {
    const checks = Array.from(this.healthChecks.values());

    const summary = {
      total: checks.length,
      healthy: checks.filter((c) => c.status === "healthy").length,
      degraded: checks.filter((c) => c.status === "degraded").length,
      unhealthy: checks.filter((c) => c.status === "unhealthy").length,
    };

    let overall: "healthy" | "degraded" | "unhealthy" = "healthy";
    if (summary.unhealthy > 0) {
      overall = "unhealthy";
    } else if (summary.degraded > 0) {
      overall = "degraded";
    }

    return { overall, checks, summary };
  }

  /**
   * Start performance profiling
   */
  startProfile(
    operation: string,
    metadata: Record<string, unknown> = {}
  ): string {
    const profileId = `${operation}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(7)}`;

    const profile: PerformanceProfile = {
      operation,
      startTime: new Date(),
      metadata,
    };

    this.performanceProfiles.set(profileId, profile);
    return profileId;
  }

  /**
   * End performance profiling
   */
  endProfile(
    profileId: string,
    additionalMetadata?: Record<string, unknown>
  ): PerformanceProfile | null {
    const profile = this.performanceProfiles.get(profileId);
    if (!profile) return null;

    profile.endTime = new Date();
    profile.duration = profile.endTime.getTime() - profile.startTime.getTime();

    if (additionalMetadata) {
      profile.metadata = { ...profile.metadata, ...additionalMetadata };
    }

    // Record performance metrics
    this.recordMetric(
      `performance.${profile.operation}.duration`,
      profile.duration,
      {
        operation: profile.operation,
      },
      profile.metadata
    );

    // Clean up
    this.performanceProfiles.delete(profileId);

    this.emit("profileComplete", profile);
    return profile;
  }

  /**
   * Collect system metrics
   */
  async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = new Date();

    // Get system metrics (would use actual system monitoring libraries)
    const systemMetrics: SystemMetrics = {
      timestamp,
      cpu: {
        usage: Math.random() * 0.8, // Mock data
        load: [Math.random(), Math.random(), Math.random()],
      },
      memory: {
        used: process.memoryUsage().heapUsed,
        total: process.memoryUsage().heapTotal,
        usage: process.memoryUsage().heapUsed / process.memoryUsage().heapTotal,
      },
      disk: {
        used: 1000000000, // Mock data
        total: 10000000000, // Mock data
        usage: 0.1,
        iops: Math.random() * 1000,
      },
      network: {
        bytesIn: Math.random() * 1000000,
        bytesOut: Math.random() * 1000000,
        packetsIn: Math.random() * 10000,
        packetsOut: Math.random() * 10000,
      },
      database: await this.collectDatabaseMetrics(),
    };

    // Record individual metrics
    this.recordMetric("system.cpu.usage", systemMetrics.cpu.usage);
    this.recordMetric("system.memory.usage", systemMetrics.memory.usage);
    this.recordMetric("system.disk.usage", systemMetrics.disk.usage);
    this.recordMetric(
      "system.database.connections",
      systemMetrics.database.connections
    );

    return systemMetrics;
  }

  /**
   * Collect application-specific metrics
   */
  async collectApplicationMetrics(): Promise<ApplicationMetrics> {
    const timestamp = new Date();

    // Get application metrics from various sources
    const applicationMetrics: ApplicationMetrics = {
      timestamp,
      requests: {
        total: 0, // Would get from request counter
        rate: 0, // Would calculate from recent requests
        errorRate: 0, // Would calculate from error counter
        avgResponseTime: 0, // Would get from response time metrics
        p95ResponseTime: 0,
        p99ResponseTime: 0,
      },
      search: {
        queriesTotal: 0, // Would get from search counter
        queriesRate: 0,
        avgQueryTime: 0,
        cacheHitRate: 0,
        vectorSearchTime: 0,
        graphTraversalTime: 0,
      },
      reasoning: {
        operationsTotal: 0,
        operationsRate: 0,
        avgReasoningTime: 0,
        avgPathLength: 0,
        avgConfidence: 0,
      },
      knowledgeGraph: await this.collectKnowledgeGraphMetrics(),
    };

    // Record individual metrics
    this.recordMetric("app.requests.rate", applicationMetrics.requests.rate);
    this.recordMetric(
      "app.search.queries_rate",
      applicationMetrics.search.queriesRate
    );
    this.recordMetric(
      "app.reasoning.operations_rate",
      applicationMetrics.reasoning.operationsRate
    );
    this.recordMetric(
      "app.kg.node_count",
      applicationMetrics.knowledgeGraph.nodeCount
    );

    return applicationMetrics;
  }

  /**
   * Initialize monitoring system
   */
  private async initializeMonitoring(): Promise<void> {
    console.log("📊 Initializing monitoring system...");

    // Create database tables for metrics storage
    await this.createMetricsTables();

    // Set up default alert rules
    this.setupDefaultAlertRules();

    // Set up default health checks
    this.setupDefaultHealthChecks();

    // Start periodic metric collection
    setInterval(() => {
      this.collectSystemMetrics().catch((error) => {
        console.error("Failed to collect system metrics:", error);
      });
    }, this.metricsCollectionInterval);

    setInterval(() => {
      this.collectApplicationMetrics().catch((error) => {
        console.error("Failed to collect application metrics:", error);
      });
    }, this.metricsCollectionInterval);

    // Start alert evaluation
    setInterval(() => {
      this.evaluateAlerts().catch((error) => {
        console.error("Failed to evaluate alerts:", error);
      });
    }, this.alertEvaluationInterval);

    // Start metric cleanup
    setInterval(() => {
      this.cleanupOldMetrics().catch((error) => {
        console.error("Failed to cleanup old metrics:", error);
      });
    }, 24 * 60 * 60 * 1000); // Daily

    console.log("✅ Monitoring system initialized");
  }

  /**
   * Create database tables for metrics storage
   */
  private async createMetricsTables(): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS monitoring_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          value DOUBLE PRECISION NOT NULL,
          labels JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}',
          timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_name_timestamp 
        ON monitoring_metrics (name, timestamp DESC)
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_monitoring_metrics_labels 
        ON monitoring_metrics USING GIN (labels)
      `);

      await client.query(`
        CREATE TABLE IF NOT EXISTS monitoring_alerts (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          severity VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          triggered_at TIMESTAMP WITH TIME ZONE NOT NULL,
          resolved_at TIMESTAMP WITH TIME ZONE,
          condition JSONB NOT NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
    } finally {
      client.release();
    }
  }

  /**
   * Store metric in database
   */
  private async storeMetric(name: string, metric: MetricValue): Promise<void> {
    const client = await this.pool.connect();

    try {
      await client.query(
        `
        INSERT INTO monitoring_metrics (name, value, labels, metadata, timestamp)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          name,
          metric.value,
          JSON.stringify(metric.labels),
          JSON.stringify(metric.metadata || {}),
          metric.timestamp,
        ]
      );
    } finally {
      client.release();
    }
  }

  /**
   * Set up default alert rules
   */
  private setupDefaultAlertRules(): void {
    // High CPU usage alert
    this.addAlertRule({
      id: "high_cpu_usage",
      name: "High CPU Usage",
      description: "CPU usage is above 80% for more than 5 minutes",
      condition: {
        metric: "system.cpu.usage",
        operator: "gt",
        threshold: 0.8,
        duration: 300, // 5 minutes
        evaluationWindow: 60, // 1 minute
      },
      severity: "high",
      enabled: true,
      notifications: [
        {
          type: "console",
          config: {},
          enabled: true,
        },
      ],
      suppressionRules: [],
      metadata: {},
    });

    // High memory usage alert
    this.addAlertRule({
      id: "high_memory_usage",
      name: "High Memory Usage",
      description: "Memory usage is above 90% for more than 2 minutes",
      condition: {
        metric: "system.memory.usage",
        operator: "gt",
        threshold: 0.9,
        duration: 120, // 2 minutes
        evaluationWindow: 30, // 30 seconds
      },
      severity: "critical",
      enabled: true,
      notifications: [
        {
          type: "console",
          config: {},
          enabled: true,
        },
      ],
      suppressionRules: [],
      metadata: {},
    });

    // Search query performance alert
    this.addAlertRule({
      id: "slow_search_queries",
      name: "Slow Search Queries",
      description: "Average search query time is above 2 seconds",
      condition: {
        metric: "app.search.avg_query_time",
        operator: "gt",
        threshold: 2000, // 2 seconds
        duration: 180, // 3 minutes
        evaluationWindow: 60, // 1 minute
      },
      severity: "medium",
      enabled: true,
      notifications: [
        {
          type: "console",
          config: {},
          enabled: true,
        },
      ],
      suppressionRules: [],
      metadata: {},
    });
  }

  /**
   * Set up default health checks
   */
  private setupDefaultHealthChecks(): void {
    // Database connectivity check
    this.addHealthCheck("database", async () => {
      const startTime = performance.now();
      try {
        const client = await this.pool.connect();
        await client.query("SELECT 1");
        client.release();

        return {
          status: "healthy",
          responseTime: performance.now() - startTime,
          metadata: { connections: this.pool.totalCount },
        };
      } catch (error) {
        return {
          status: "unhealthy",
          responseTime: performance.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });

    // Knowledge graph health check
    this.addHealthCheck("knowledge_graph", async () => {
      const startTime = performance.now();
      try {
        const client = await this.pool.connect();
        const result = await client.query(
          "SELECT COUNT(*) as count FROM kg_nodes"
        );
        client.release();

        const nodeCount = parseInt(result.rows[0].count);

        return {
          status: nodeCount > 0 ? "healthy" : "degraded",
          responseTime: performance.now() - startTime,
          metadata: { nodeCount },
        };
      } catch (error) {
        return {
          status: "unhealthy",
          responseTime: performance.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    });
  }

  /**
   * Evaluate alert rules
   */
  private async evaluateAlerts(): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      try {
        await this.evaluateAlertRule(rule);
      } catch (error) {
        console.error(`Failed to evaluate alert rule ${rule.id}:`, error);
      }
    }
  }

  /**
   * Evaluate a single alert rule
   */
  private async evaluateAlertRule(rule: AlertRule): Promise<void> {
    const now = new Date();
    const windowStart = new Date(
      now.getTime() - rule.condition.evaluationWindow * 1000
    );

    const metrics = this.getMetrics(
      rule.condition.metric,
      {
        start: windowStart,
        end: now,
      },
      rule.condition.labels
    );

    if (metrics.length === 0) return;

    // Calculate if condition is met
    const values = metrics.map((m) => m.value);
    const conditionMet = this.evaluateCondition(values, rule.condition);

    const existingAlert = Array.from(this.alerts.values()).find(
      (alert) => alert.name === rule.name && alert.status === "active"
    );

    if (conditionMet && !existingAlert) {
      // Trigger new alert
      const alert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        name: rule.name,
        description: rule.description,
        severity: rule.severity,
        status: "active",
        triggeredAt: now,
        condition: rule.condition,
        metadata: {
          ruleId: rule.id,
          triggerValue: values[values.length - 1],
          ...rule.metadata,
        },
        notifications: [],
      };

      this.alerts.set(alert.id, alert);
      this.emit("alertTriggered", alert);

      // Send notifications
      await this.sendAlertNotifications(alert, rule.notifications);

      console.log(`🚨 Alert triggered: ${alert.name} (${alert.severity})`);
    } else if (!conditionMet && existingAlert) {
      // Resolve existing alert
      this.resolveAlert(existingAlert.id, "Condition no longer met");
    }
  }

  /**
   * Evaluate alert condition
   */
  private evaluateCondition(
    values: number[],
    condition: AlertCondition
  ): boolean {
    if (values.length === 0) return false;

    const latestValue = values[values.length - 1];

    switch (condition.operator) {
      case "gt":
        return latestValue > condition.threshold;
      case "gte":
        return latestValue >= condition.threshold;
      case "lt":
        return latestValue < condition.threshold;
      case "lte":
        return latestValue <= condition.threshold;
      case "eq":
        return latestValue === condition.threshold;
      case "ne":
        return latestValue !== condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Send alert notifications
   */
  private async sendAlertNotifications(
    alert: Alert,
    channels: NotificationChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      if (!channel.enabled) continue;

      try {
        await this.sendNotification(alert, channel);
      } catch (error) {
        console.error(
          `Failed to send notification via ${channel.type}:`,
          error
        );
      }
    }
  }

  /**
   * Send a single notification
   */
  private async sendNotification(
    alert: Alert,
    channel: NotificationChannel
  ): Promise<void> {
    const notification: NotificationRecord = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      alertId: alert.id,
      channel,
      sentAt: new Date(),
      status: "pending",
    };

    try {
      switch (channel.type) {
        case "console":
          console.log(`🔔 ALERT: ${alert.name} - ${alert.description}`);
          break;
        case "email":
          // Would implement email sending
          console.log(`📧 Email alert: ${alert.name}`);
          break;
        case "slack":
          // Would implement Slack webhook
          console.log(`💬 Slack alert: ${alert.name}`);
          break;
        case "webhook":
          // Would implement webhook call
          console.log(`🔗 Webhook alert: ${alert.name}`);
          break;
        default:
          throw new Error(`Unknown notification channel type: ${channel.type}`);
      }

      notification.status = "sent";
    } catch (error) {
      notification.status = "failed";
      notification.error =
        error instanceof Error ? error.message : String(error);
      throw error;
    } finally {
      alert.notifications.push(notification);
    }
  }

  /**
   * Collect database-specific metrics
   */
  private async collectDatabaseMetrics(): Promise<SystemMetrics["database"]> {
    const client = await this.pool.connect();

    try {
      // Get connection stats
      const connectionStats = {
        connections: this.pool.totalCount,
        maxConnections: this.pool.options.max || 10,
      };

      // Get query performance stats (simplified)
      const queryStats = await client
        .query(
          `
        SELECT 
          COALESCE(AVG(mean_exec_time), 0) as avg_query_time,
          COALESCE(SUM(calls), 0) as total_queries
        FROM pg_stat_statements 
        WHERE query NOT LIKE '%pg_stat_statements%'
        LIMIT 1
      `
        )
        .catch(() => ({ rows: [{ avg_query_time: 0, total_queries: 0 }] }));

      return {
        connections: connectionStats.connections,
        maxConnections: connectionStats.maxConnections,
        queryTime: parseFloat(queryStats.rows[0]?.avg_query_time || "0"),
        lockWaits: 0, // Would get from pg_stat_database
        deadlocks: 0, // Would get from pg_stat_database
      };
    } finally {
      client.release();
    }
  }

  /**
   * Collect knowledge graph specific metrics
   */
  private async collectKnowledgeGraphMetrics(): Promise<
    ApplicationMetrics["knowledgeGraph"]
  > {
    const client = await this.pool.connect();

    try {
      const nodeCountResult = await client.query(
        "SELECT COUNT(*) as count FROM kg_nodes"
      );
      const relationshipCountResult = await client.query(
        "SELECT COUNT(*) as count FROM kg_relationships"
      );

      const nodeCount = parseInt(nodeCountResult.rows[0].count);
      const relationshipCount = parseInt(relationshipCountResult.rows[0].count);

      return {
        nodeCount,
        relationshipCount,
        avgDegree: nodeCount > 0 ? (relationshipCount * 2) / nodeCount : 0,
        ingestionRate: 0, // Would track from ingestion pipeline
        processingQueueSize: 0, // Would track from processing queue
      };
    } finally {
      client.release();
    }
  }

  /**
   * Clean up old metrics from database
   */
  private async cleanupOldMetrics(): Promise<void> {
    const client = await this.pool.connect();

    try {
      const cutoffDate = new Date(
        Date.now() - this.metricsRetentionDays * 24 * 60 * 60 * 1000
      );

      const result = await client.query(
        `
        DELETE FROM monitoring_metrics 
        WHERE timestamp < $1
      `,
        [cutoffDate]
      );

      console.log(`🧹 Cleaned up ${result.rowCount} old metrics`);
    } finally {
      client.release();
    }
  }
}
