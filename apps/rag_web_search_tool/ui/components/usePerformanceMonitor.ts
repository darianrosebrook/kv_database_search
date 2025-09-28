/**
 * Performance monitoring hook
 */
import { useEffect, useRef } from "react";

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage?: number;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const metrics = useRef<PerformanceMetrics[]>([]);

  useEffect(() => {
    renderStartTime.current = performance.now();
  });

  useEffect(() => {
    const renderTime = performance.now() - renderStartTime.current;
    const timestamp = Date.now();

    const metric: PerformanceMetrics = {
      renderTime,
      timestamp,
    };

    // Try to get memory usage if available
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      metric.memoryUsage = memory.usedJSHeapSize;
    }

    metrics.current.push(metric);

    // Keep only last 10 metrics
    if (metrics.current.length > 10) {
      metrics.current = metrics.current.slice(-10);
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[Performance] ${componentName}:`, metric);
    }
  });

  return {
    metrics: metrics.current,
    getAverageRenderTime: () => {
      if (metrics.current.length === 0) return 0;
      const total = metrics.current.reduce((sum, m) => sum + m.renderTime, 0);
      return total / metrics.current.length;
    },
  };
};
