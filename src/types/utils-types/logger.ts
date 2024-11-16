import chalk from "chalk";
export interface LogEntry {
  level: string;
  message: string;
  metadata: any;
  timestamp: string;
  correlationId?: string;
  source?: string;
}

export interface LogAnalytics {
  totalLogs: number;
  logsByLevel: { [key: string]: number };
  logsBySource: { [key: string]: number };
  errorRate: number;
  averageResponseTime?: number;
  lastAnalyticsUpdate: string;
}

export interface SensitiveFields {
  [key: string]: string[];
}
export interface LogApiEntry {
  message: string;
  source: string;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  requestBody?: any;
  responseBody?: any;
  headers?: any;
  error?: any;
  [key: string]: any;
}

export interface LogDatabaseEntry {
message: string;
source: string;
status: number;
responseTime: number;
error?: any;
}

export enum LogLevel {
  ERROR = "ERROR",
  WARN = "WARN",
  INFO = "INFO",
  DEBUG = "DEBUG",
}

export const LOG_COLORS = {
  [LogLevel.ERROR]: chalk.red,
  [LogLevel.WARN]: chalk.yellow,
  [LogLevel.INFO]: chalk.blue,
  [LogLevel.DEBUG]: chalk.gray,
};

export const LOG_EMOJIS = {
  [LogLevel.INFO]: "🟢",
  [LogLevel.ERROR]: "🔴",
  [LogLevel.DEBUG]: "🔷",
  [LogLevel.WARN]: "⚠️",
};

export const ERROR_COMMENTS = [
  "Oh no, something went kaboom! 💥",
  "Error? In *my* code? Impossible! 😅",
  "Houston, we have a problem! 🚀",
  "Oopsie woopsie! Time to debug! 🐛",
  "Coffee break? Perfect time for an error! ☕",
  "Plot twist: It's not a feature, it's a bug! 🎬",
  "Time to play 'Find the Bug'! 🔍",
  "Error.exe has stopped working... just kidding! 🎮",
  "Debugging: The art of removing bugs. Let's get artistic! 🎨",
  "Even robots make mistakes! *beep boop* 🤖",
];