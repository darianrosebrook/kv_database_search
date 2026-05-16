/**
 * Shared Logging Utility
 *
 * Provides consistent logging across all services with configurable levels
 * and structured output for better debugging and monitoring.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  service: string;
  data?: any;
  error?: Error;
}

export interface Logger {
  debug(message: string, data?: any): void;
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, error?: Error, data?: any): void;
}

/**
 * Console-based logger implementation
 */
export class ConsoleLogger implements Logger {
  private serviceName: string;
  private minLevel: LogLevel;

  private readonly levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(serviceName: string, minLevel: LogLevel = "info") {
    this.serviceName = serviceName;
    this.minLevel = minLevel;
  }

  debug(message: string, data?: any): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: any): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: any): void {
    this.log("warn", message, data);
  }

  error(message: string, error?: Error, data?: any): void {
    this.log("error", message, undefined, error, data);
  }

  private log(
    level: LogLevel,
    message: string,
    data?: any,
    error?: Error,
    additionalData?: any
  ): void {
    if (this.levelPriority[level] < this.levelPriority[this.minLevel]) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      data: data || additionalData,
      error,
    };

    this.output(entry);
  }

  private output(entry: LogEntry): void {
    const prefix = `[${
      entry.timestamp
    }] ${entry.service.toUpperCase()} ${entry.level.toUpperCase()}`;

    if (entry.error) {
      console.error(`${prefix}: ${entry.message}`, entry.error);
      if (entry.data) {
        console.error("Additional data:", entry.data);
      }
    } else if (entry.level === "error") {
      console.error(`${prefix}: ${entry.message}`, entry.data || "");
    } else if (entry.level === "warn") {
      console.warn(`${prefix}: ${entry.message}`, entry.data || "");
    } else if (entry.level === "info") {
      console.info(`${prefix}: ${entry.message}`, entry.data || "");
    } else {
      console.log(`${prefix}: ${entry.message}`, entry.data || "");
    }
  }
}

/**
 * No-op logger for testing or when logging is disabled
 */
export class NoOpLogger implements Logger {
  debug(): void {}
  info(): void {}
  warn(): void {}
  error(): void {}
}

/**
 * Logger factory
 */
export class LoggerFactory {
  static create(serviceName: string, level: LogLevel = "info"): Logger {
    if (process.env.NODE_ENV === "test") {
      return new NoOpLogger();
    }

    return new ConsoleLogger(serviceName, level);
  }

  static createConsole(
    serviceName: string,
    level: LogLevel = "info"
  ): ConsoleLogger {
    return new ConsoleLogger(serviceName, level);
  }
}
