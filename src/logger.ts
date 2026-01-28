export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

/**
 * Singleton Logger utility to standardize application logging.
 * Supports different log levels and optional timestamping.
 */
export class Logger {
  private static instance: Logger;
  private level: LogLevel = LogLevel.INFO;

  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public setLevel(level: LogLevel): void {
    this.level = level;
  }

  public setLogLevelFromString(level: string): void {
    switch (level.toLowerCase()) {
      case 'debug': this.level = LogLevel.DEBUG; break;
      case 'info': this.level = LogLevel.INFO; break;
      case 'warn': this.level = LogLevel.WARN; break;
      case 'error': this.level = LogLevel.ERROR; break;
      case 'silent': this.level = LogLevel.SILENT; break;
      default: this.level = LogLevel.INFO; break;
    }
  }

  private formatMessage(level: string, message: string, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] ${message}`;
  }

  /**
   * Logs a debug message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  /**
   * Logs an info message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(this.formatMessage('INFO', message), ...args);
    }
  }

  /**
   * Logs a warning message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  /**
   * Logs an error message.
   * @param message Message to log
   * @param args Additional arguments
   */
  public error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message), ...args);
    }
  }
}

export const logger = Logger.getInstance();
