import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";

interface LogEntry {
  level: string;
  message: string;
  metadata: any;
  timestamp: string;
  correlationId?: string;
  source?: string;
}

interface LogAnalytics {
  totalLogs: number;
  logsByLevel: { [key: string]: number };
  logsBySource: { [key: string]: number };
  errorRate: number;
  averageResponseTime?: number;
  lastAnalyticsUpdate: string;
}

interface SensitiveFields {
  [key: string]: string[];
}
interface ApiLogMetadata {
  requestType: string;
  endpoint: string;
  browser: string;
  userAgent?: string;
  responseTime?: number;
  statusCode: number;
  requestId?: string | string[];
  clientIp?: string;
  connector?: string;
  payment_method?: Object ;
  requestBody?: Object;
  requestHeaders?: Object;
  queryParams?: Object;
  responseBody?: Object;
  responseHeaders?: Object;
}

enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

const LOG_COLORS = {
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.DEBUG]: chalk.gray,
};

class Logger {
  protected logFile: string;
  protected analyticsFile: string;
  protected sensitiveFields: SensitiveFields;
  private readonly rotationSizeInBytes: number;
  private readonly maxLogFiles: number;
  private readonly analytics: LogAnalytics;
  private analyticsUpdateInterval: NodeJS.Timeout;

  constructor(
    logDirectory?: string,
    rotationSizeInBytes: number = 5 * 1024 * 1024,
    maxLogFiles: number = 5,
    analyticsUpdateFrequency: number = 60000 // 1 minute
  ) {
    const baseDir = logDirectory || process.cwd();
    this.logFile = path.join(baseDir, "application.log");
    this.analyticsFile = path.join(baseDir, "analytics.log");
    this.rotationSizeInBytes = rotationSizeInBytes;
    this.maxLogFiles = maxLogFiles;

    this.sensitiveFields = {
      payment: [
        "secret_key",
        "card_number",
        "cvv",
        "payment_response_hash_key",
      ],
      auth: ["password", "token", "api_key", "secret"],
      encryption: [
        "encryption_key",
        "private_key",
        "salt",
        "iv",
        "tag",
        "ciphertext",
        "key",
        "secret_key",
        "hashed_secret_key",
        "plaintext",
      ],
      database: [
        "connection_string",
        "password",
        "auth_token",
        "secret_key",
        "hashed_secret_key",
        "payment_response_hash_key",
        "payment_hash_key",
        "tag"
      ],
    };

    this.analytics = this.initializeAnalytics();
    this.ensureLogFileExists();
    this.startAnalyticsUpdate(analyticsUpdateFrequency);
  }

  private initializeAnalytics(): LogAnalytics {
    return {
      totalLogs: 0,
      logsByLevel: {},
      logsBySource: {},
      errorRate: 0,
      averageResponseTime: 0,
      lastAnalyticsUpdate: new Date().toISOString(),
    };
  }

  private startAnalyticsUpdate(frequency: number): void {
    this.analyticsUpdateInterval = setInterval(() => {
      this.updateAnalytics();
    }, frequency);
  }

  private parseLogLine(line: string): LogEntry | null {
    try {
      const jsonMatch = RegExp(/\{.*\}/).exec(line);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error("Error parsing log line:", error);
    }
    return null;
  }

  private async updateAnalytics(): Promise<void> {
    try {
      const logs = fs
        .readFileSync(this.logFile, "utf-8")
        .split("\n")
        .filter((line) => line.trim())
        .map((line) => this.parseLogLine(line))
        .filter((log): log is LogEntry => log !== null);

      this.analytics.totalLogs = logs.length;
      this.analytics.logsByLevel = {};
      this.analytics.logsBySource = {};
      let errorCount = 0;
      let totalResponseTime = 0;
      let responseTimeCount = 0;

      logs.forEach((log) => {
        this.analytics.logsByLevel[log.level] =
          (this.analytics.logsByLevel[log.level] || 0) + 1;

        if (log.source) {
          this.analytics.logsBySource[log.source] =
            (this.analytics.logsBySource[log.source] || 0) + 1;
        }

        if (log.level === LogLevel.ERROR) {
          errorCount++;
        }

        if (log.metadata?.responseTime) {
          totalResponseTime += log.metadata.responseTime;
          responseTimeCount++;
        }
      });

      this.analytics.errorRate =
        logs.length > 0 ? (errorCount / logs.length) * 100 : 0;
      this.analytics.averageResponseTime =
        responseTimeCount > 0
          ? totalResponseTime / responseTimeCount
          : undefined;
      this.analytics.lastAnalyticsUpdate = new Date().toISOString();

      const analyticsLog = `[${new Date().toISOString()}] ANALYTICS ${JSON.stringify(
        this.analytics
      )}\n`;
      fs.writeFileSync(this.analyticsFile, analyticsLog);

      this.printAnalyticsSummary();
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  private printAnalyticsSummary(): void {
    console.log("\n=== Logger Analytics Summary ===");
    console.log(`Total Logs: ${this.analytics.totalLogs}`);
    console.log(`Error Rate: ${this.analytics.errorRate.toFixed(2)}%`);
    if (this.analytics.averageResponseTime) {
      console.log(
        `Avg Response Time: ${this.analytics.averageResponseTime.toFixed(2)}ms`
      );
    }
    console.log("\nLogs by Level:");
    Object.entries(this.analytics.logsByLevel).forEach(([level, count]) => {
      const colorize = LOG_COLORS[level as LogLevel] || chalk.white;
      console.log(colorize(`  ${level}: ${count}`));
    });
    console.log("\nLogs by Source:");
    Object.entries(this.analytics.logsBySource).forEach(([source, count]) => {
      console.log(chalk.cyan(`  ${source}: ${count}`));
    });
    console.log("\nLast Updated:", this.analytics.lastAnalyticsUpdate);
    console.log("============================\n");
  }

  private ensureLogFileExists(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    if (!fs.existsSync(this.logFile)) {
      fs.writeFileSync(this.logFile, "");
    }
  }

  private maskSensitiveData(data: any, operation: string): any {
    if (!data) return data;

    const fieldsToMask = this.sensitiveFields[operation] || [];
    const maskedData = JSON.parse(JSON.stringify(data));

    const maskValue = (obj: any) => {
      for (const key in obj) {
        if (typeof obj[key] === "object" && obj[key] !== null) {
          maskValue(obj[key]);
        } else if (fieldsToMask.includes(key.toLowerCase())) {
          obj[key] = "********";
        }
      }
    };

    maskValue(maskedData);
    return maskedData;
  }

  private formatLogEntry(logEntry: LogEntry): string {
    const timestamp = new Date().toISOString();
    const logData = JSON.stringify(logEntry);
    return `[${timestamp}] ${logEntry.level} ${logData}\n`;
  }

  private async rotateLogsIfNeeded(): Promise<void> {
    try {
      const stats = fs.statSync(this.logFile);
      if (stats.size >= this.rotationSizeInBytes) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedFilePath = `${this.logFile}.${timestamp}`;

        fs.renameSync(this.logFile, rotatedFilePath);
        fs.writeFileSync(this.logFile, "");

        // Clean up old log files
        const logFiles = fs
          .readdirSync(path.dirname(this.logFile))
          .filter((file) => file.startsWith(path.basename(this.logFile)))
          .sort(
            (a, b) =>
              fs
                .statSync(path.join(path.dirname(this.logFile), b))
                .mtime.getTime() -
              fs
                .statSync(path.join(path.dirname(this.logFile), a))
                .mtime.getTime()
          );

        while (logFiles.length > this.maxLogFiles) {
          const fileToDelete = logFiles.pop();
          if (fileToDelete) {
            fs.unlinkSync(path.join(path.dirname(this.logFile), fileToDelete));
          }
        }
      }
    } catch (error) {
      console.error("Error rotating logs:", error);
    }
  }

  private generateCorrelationId(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  private formatConsoleOutput(logEntry: LogEntry): string {
    const colorize = LOG_COLORS[logEntry.level as LogLevel] || chalk.white;
    const timestamp = chalk.grey(logEntry.timestamp);
    const correlationId = chalk.grey(`[${logEntry.correlationId}]`);
    const source = logEntry.source ? chalk.cyan(`[${logEntry.source}]`) : "";
    const message = colorize(logEntry.message);
    const metadata =
      Object.keys(logEntry.metadata).length > 0
        ? chalk.grey(JSON.stringify(logEntry.metadata))
        : "";

    return `${timestamp} ${correlationId} ${source} ${message} ${metadata}`;
  }

  private async writeLog(logEntry: LogEntry): Promise<void> {
    try {
      await this.rotateLogsIfNeeded();

      // Write to file in log format
      const logLine = this.formatLogEntry(logEntry);
      fs.appendFileSync(this.logFile, logLine);

      // Print to console with formatting
      console.log(this.formatConsoleOutput(logEntry));
    } catch (error) {
      console.error("Failed to write log:", error);
    }
  }

  async logPayment(message: string, metadata: any): Promise<void> {
    const maskedMetadata = this.maskSensitiveData(metadata, "payment");
    await this.info(message, maskedMetadata, "PAYMENT");
  }

  async logEncryption(message: string, metadata: any): Promise<void> {
    const maskedMetadata = this.maskSensitiveData(metadata, "encryption");
    await this.info(message, maskedMetadata, "ENCRYPTION");
  }

  async logDecryption(message: string, metadata: any): Promise<void> {
    const maskedMetadata = this.maskSensitiveData(metadata, "encryption");
    await this.warn(message, maskedMetadata, "DECRYPTION");
  }

  async logDatabase(message: string, metadata: any): Promise<void> {
    const maskedMetadata = this.maskSensitiveData(metadata, "database");
    await this.info(message, maskedMetadata, "DATABASE");
  }

  async logAuthorization(message: string, metadata: any): Promise<void> {
    const maskedMetadata = this.maskSensitiveData(metadata, "auth");
    await this.info(message, maskedMetadata, "AUTH");
  }
  async logApi(
    level: string,
    message: string,
    metadata: ApiLogMetadata,
    source: string = "API"
  ): Promise<void> {
    switch (level) {
      case "INFO":
        level = LogLevel.INFO;
        break;
      case "ERROR":
        level = LogLevel.ERROR;
        break;
      case "WARN":
        level = LogLevel.WARN;
        break;
      default:
        level = LogLevel.DEBUG;
        break;
    }
      
    const logEntry: LogEntry = {
      level,
      message,
      metadata: {
        ...metadata,
        responseTime: `${metadata.responseTime}ms`,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId(),
      source,
    };
    await this.writeLog(logEntry);
  }
  async info(message: string, metadata: any, source?: string): Promise<void> {
    
    const logEntry: LogEntry = {
      level: LogLevel.INFO,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId(),
      source,
    };
    await this.writeLog(logEntry);
  }

  async error(message: string, metadata: any, source?: string): Promise<void> {
    const logEntry: LogEntry = {
      level: LogLevel.ERROR,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId(),
      source,
    };
    await this.writeLog(logEntry);
  }

  async debug(message: string, metadata: any, source?: string): Promise<void> {
    const logEntry: LogEntry = {
      level: LogLevel.DEBUG,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId(),
      source,
    };
    await this.writeLog(logEntry);
  }

  async warn(message: string, metadata: any, source?: string): Promise<void> {
    const logEntry: LogEntry = {
      level: LogLevel.WARN,
      message,
      metadata,
      timestamp: new Date().toISOString(),
      correlationId: this.generateCorrelationId(),
      source,
    };
    await this.writeLog(logEntry);
  }

  destroy(): void {
    if (this.analyticsUpdateInterval) {
      clearInterval(this.analyticsUpdateInterval);
    }
  }
}

export default Logger;
