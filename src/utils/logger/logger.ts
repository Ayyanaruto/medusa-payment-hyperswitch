import fs from "fs";
import path from "path";
import crypto from "crypto";
import chalk from "chalk";
import figlet from "figlet";

import {
  LogLevel,
  LogEntry,
  LogAnalytics,
  SensitiveFields,
  LOG_COLORS,
  LOG_EMOJIS,
  ERROR_COMMENTS,
} from "../../types/utils-types";

/**
 * Logger class to handle logging, log rotation, and analytics.
 *
 * @class Logger
 * @property {string} logFile - Path to the log file.
 * @property {string} analyticsFile - Path to the analytics file.
 * @property {SensitiveFields} sensitiveFields - Fields to be masked in logs.
 * @property {number} rotationSizeInBytes - Maximum size of the log file before rotation.
 * @property {number} maxLogFiles - Maximum number of log files to keep.
 * @property {LogAnalytics} analytics - Analytics data for logs.
 * @property {NodeJS.Timeout} analyticsUpdateInterval - Interval for updating analytics.
 *
 * @constructor
 * @param {string} [logDirectory] - Directory to store log files.
 * @param {number} [rotationSizeInBytes=5242880] - Maximum size of the log file before rotation (default is 5MB).
 * @param {number} [maxLogFiles=5] - Maximum number of log files to keep (default is 5).
 * @param {number} [analyticsUpdateFrequency=300000] - Frequency of analytics update in milliseconds (default is 5 minutes).
 *
 * @method initializeAnalytics - Initializes the analytics data.
 * @returns {LogAnalytics} - The initialized analytics data.
 *
 * @method startAnalyticsUpdate - Starts the interval for updating analytics.
 * @param {number} frequency - Frequency of analytics update in milliseconds.
 *
 * @method parseLogLine - Parses a log line to extract log entry.
 * @param {string} line - The log line to parse.
 * @returns {LogEntry | null} - The parsed log entry or null if parsing fails.
 *
 * @method updateAnalytics - Updates the analytics data based on the log file.
 *
 * @method printAnalyticsSummary - Prints a summary of the analytics data to the console.
 *
 * @method ensureLogFileExists - Ensures that the log file and its directory exist.
 *
 * @method maskSensitiveData - Masks sensitive data in the log entry.
 * @param {any} data - The data to mask.
 * @param {string} operation - The operation type to determine which fields to mask.
 * @returns {any} - The masked data.
 *
 * @method formatLogEntry - Formats a log entry into a string.
 * @param {LogEntry} logEntry - The log entry to format.
 * @returns {string} - The formatted log entry string.
 *
 * @method rotateLogsIfNeeded - Rotates the log files if the current log file exceeds the maximum size.
 *
 * @method generateCorrelationId - Generates a unique correlation ID.
 * @returns {string} - The generated correlation ID.
 *
 * @method formatConsoleOutput - Formats the log entry for console output.
 * @param {LogEntry} logEntry - The log entry to format.
 * @returns {string} - The formatted console output string.
 *
 * @method writeLog - Writes a log entry to the log file and console.
 * @param {LogEntry} logEntry - The log entry to write.
 *
 * @method info - Logs an info level message.
 * @param {string} message - The log message.
 * @param {any} metadata - Additional metadata for the log entry.
 * @param {string} [source] - The source of the log entry.
 *
 * @method error - Logs an error level message.
 * @param {string} message - The log message.
 * @param {any} metadata - Additional metadata for the log entry.
 * @param {string} [source] - The source of the log entry.
 *
 * @method debug - Logs a debug level message.
 * @param {string} message - The log message.
 * @param {any} metadata - Additional metadata for the log entry.
 * @param {string} [source] - The source of the log entry.
 *
 * @method warn - Logs a warn level message.
 * @param {string} message - The log message.
 * @param {any} metadata - Additional metadata for the log entry.
 * @param {string} [source] - The source of the log entry.
 *
 * @method destroy - Cleans up resources used by the logger.
 */
export class Logger {
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
    analyticsUpdateFrequency: number = 60000 * 1 // 5 minute
  ) {
    const baseDir = logDirectory || process.cwd();
    this.logFile = path.join(baseDir, "application.log");
    this.analyticsFile = path.join(baseDir, "analytics.log");
    this.rotationSizeInBytes = rotationSizeInBytes;
    this.maxLogFiles = maxLogFiles;

    this.sensitiveFields = {
      payment: [
        "secret_key",
        "secretKey",
        "card_number",
        "cvv",
        "payment_response_hash_key",
        "paymentHashKey",
        "payment_hash_key",
        "api_key",
        "client_secret",
      ],
      encryption: [
        "encryption_key",
        "private_key",
        "salt",
        "iv",
        "tag",
        "ciphertext",
        "key",
        "secret_key",
        "secretKey",
        "paymentHashKey",
        "hashed_secret_key",
        "plaintext",
      ],
      database: [
        "connection_string",
        "password",
        "auth_token",
        "secret_key",
        "secretKey",
        "hashed_secret_key",
        "payment_response_hash_key",
        "payment_hash_key",
        "tag",
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

      // this.printAnalyticsSummary();
    } catch (error) {
      console.error("Error updating analytics:", error);
    }
  }

  // private printAnalyticsSummary(): void {
  //     console.log("\n=== Logger Analytics Summary ===");
  //     console.log(figlet.textSync("Analytics", { horizontalLayout: 'full' }));
  //     console.log(`Total Logs: ${this.analytics.totalLogs}`);
  //     console.log(`Error Rate: ${this.analytics.errorRate.toFixed(2)}%`);
  //     if (this.analytics.averageResponseTime) {
  //         console.log(
  //             `Avg Response Time: ${this.analytics.averageResponseTime.toFixed(2)}ms`
  //         );
  //     }
  //     console.log("\nLogs by Level:");
  //     Object.entries(this.analytics.logsByLevel).forEach(([level, count]) => {
  //         const colorize = LOG_COLORS[level as LogLevel] || chalk.white;
  //         const emoji = LOG_EMOJIS[level as LogLevel] || "";
  //         console.log(colorize(`  ${emoji} ${level}: ${count}`));
  //     });
  //     console.log("\nLogs by Source:");
  //     Object.entries(this.analytics.logsBySource).forEach(([source, count]) => {
  //         console.log(chalk.cyan(`  ${source}: ${count}`));
  //     });
  //     console.log("\nLast Updated:", this.analytics.lastAnalyticsUpdate);
  //     console.log("============================\n");
  // }

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
        } else if (fieldsToMask.includes(key)) {
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

        console.log(
          `✅ Log rotation completed! Old log file: ${rotatedFilePath}`
        );

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
            console.log(`🗑️ Old log file deleted: ${fileToDelete}`);
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
    const emoji = LOG_EMOJIS[logEntry.level as LogLevel] || "";
    const timestamp = chalk.grey(logEntry.timestamp);
    const correlationId = chalk.grey(`[${logEntry.correlationId}]`);
    const source = logEntry.source ? chalk.cyan(`[${logEntry.source}]`) : "";
    const message = colorize(`${emoji} ${logEntry.message}`);
    const metadata =
      Object.keys(logEntry.metadata).length > 0
        ? chalk.grey(JSON.stringify(logEntry.metadata))
        : "";

    return `${timestamp} ${correlationId} ${source} ${message} ${metadata}`;
  }

  private async writeLog(logEntry: LogEntry): Promise<void> {
    try {
      await this.rotateLogsIfNeeded();
      let maskedMetadata = this.maskSensitiveData(logEntry.metadata, "payment");
      maskedMetadata = this.maskSensitiveData(maskedMetadata, "auth");
      maskedMetadata = this.maskSensitiveData(maskedMetadata, "encryption");
      maskedMetadata = this.maskSensitiveData(maskedMetadata, "database");

      if (maskedMetadata.responseBody) {
        maskedMetadata.responseBody = this.maskSensitiveData(
          maskedMetadata.responseBody,
          "payment"
        );
        maskedMetadata.responseBody = this.maskSensitiveData(
          maskedMetadata.responseBody,
          "auth"
        );
        maskedMetadata.responseBody = this.maskSensitiveData(
          maskedMetadata.responseBody,
          "encryption"
        );
        maskedMetadata.responseBody = this.maskSensitiveData(
          maskedMetadata.responseBody,
          "database"
        );
      }

      if (maskedMetadata.requestBody) {
        maskedMetadata.reqBody = this.maskSensitiveData(
          maskedMetadata.requestBody,
          "payment"
        );
        maskedMetadata.reqBody = this.maskSensitiveData(
          maskedMetadata.requestBody,
          "auth"
        );
        maskedMetadata.reqBody = this.maskSensitiveData(
          maskedMetadata.requestBody,
          "encryption"
        );
        maskedMetadata.reqBody = this.maskSensitiveData(
          maskedMetadata.requestBody,
          "database"
        );
      }

      logEntry.metadata = maskedMetadata;

      const logLine = this.formatLogEntry(logEntry);
      fs.appendFileSync(this.logFile, logLine);

      if (logEntry.level === LogLevel.ERROR) {
        const randomComment =
          ERROR_COMMENTS[Math.floor(Math.random() * ERROR_COMMENTS.length)];
        console.log(chalk.red(randomComment));
      }

      console.log(this.formatConsoleOutput(logEntry));
    } catch (error) {
      console.error("Failed to write log:", error);
    }
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
// //Example usage:
// const logger = new Logger();
// logger.info("Hello, world!", { user : "Alice" });
// logger.error("Something went wrong!", { error: "Error message" });
// logger.debug("Debugging info", { data: "Debug data" });
// logger.warn("Warning message", { warning: "Warning data" });
