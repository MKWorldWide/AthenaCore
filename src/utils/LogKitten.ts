/**
 * LogKitten - A flexible and extensible logging utility for AthenaCore
 * 
 * Provides structured logging with support for multiple log levels, custom formatters,
 * and pluggable transports (console, file, remote, etc.).
 */

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  namespace: string;
  message: string;
  data?: any;
  error?: Error;
}

export interface LogTransport {
  (entry: LogEntry): void | Promise<void>;
}

export interface LogKittenOptions {
  level?: LogLevel;
  transports?: LogTransport[];
  format?: (entry: LogEntry) => string;
}

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
  trace: 4,
};

export class LogKitten {
  private namespace: string;
  private level: LogLevel;
  private transports: LogTransport[] = [];
  private format: (entry: LogEntry) => string;

  constructor(namespace: string, options: LogKittenOptions = {}) {
    this.namespace = namespace;
    this.level = options.level || 'info';
    this.transports = options.transports || [];
    
    // Default formatter
    this.format = options.format || ((entry: LogEntry) => {
      const timestamp = entry.timestamp.toISOString();
      const level = entry.level.toUpperCase().padEnd(5);
      const namespace = `[${entry.namespace}]`;
      const message = entry.message;
      
      let output = `${timestamp} ${level} ${namespace} ${message}`;
      
      if (entry.error) {
        output += `\n${entry.error.stack || entry.error.message}`;
      }
      
      if (entry.data !== undefined) {
        try {
          const dataStr = typeof entry.data === 'string' 
            ? entry.data 
            : JSON.stringify(entry.data, null, 2);
          output += `\n${dataStr}`;
        } catch (e) {
          output += `\n[Non-serializable data]`;
        }
      }
      
      return output;
    });
    
    // Add console transport by default if none provided
    if (this.transports.length === 0) {
      this.transports.push(this.consoleTransport.bind(this));
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] <= LEVEL_PRIORITY[this.level];
  }
  
  private async log(level: LogLevel, message: string, data?: any, error?: Error): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }
    
    const entry: LogEntry = {
      timestamp: new Date(),
      level,
      namespace: this.namespace,
      message,
      data,
      error,
    };
    
    // Process transports in parallel
    await Promise.all(
      this.transports.map(transport => {
        try {
          return Promise.resolve(transport(entry));
        } catch (e) {
          // Prevent logging errors from breaking the application
          console.error(`Error in log transport:`, e);
          return Promise.resolve();
        }
      })
    );
  }
  
  // Built-in console transport
  private consoleTransport(entry: LogEntry): void {
    const formatted = this.format(entry);
    const method = entry.level === 'error' ? 'error' :
                  entry.level === 'warn' ? 'warn' :
                  'log';
    
    // Group related logs for better readability
    if (entry.data || entry.error) {
      console.groupCollapsed(formatted.split('\n')[0]);
      console[method](formatted);
      console.groupEnd();
    } else {
      console[method](formatted);
    }
  }
  
  // Public logging methods
  public error(message: string, error?: Error, data?: any): void {
    this.log('error', message, data, error).catch(console.error);
  }
  
  public warn(message: string, data?: any): void {
    this.log('warn', message, data).catch(console.error);
  }
  
  public info(message: string, data?: any): void {
    this.log('info', message, data).catch(console.error);
  }
  
  public debug(message: string, data?: any): void {
    this.log('debug', message, data).catch(console.error);
  }
  
  public trace(message: string, data?: any): void {
    this.log('trace', message, data).catch(console.error);
  }
  
  // Child logger with namespace inheritance
  public child(namespace: string): LogKitten {
    return new LogKitten(`${this.namespace}:${namespace}`, {
      level: this.level,
      transports: this.transports,
      format: this.format,
    });
  }
  
  // Add a custom transport
  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }
  
  // Set the log level
  public setLevel(level: LogLevel): void {
    this.level = level;
  }
  
  // Create a file transport
  public static fileTransport(filePath: string): LogTransport {
    const fs = require('fs');
    const path = require('path');
    const { promisify } = require('util');
    
    const appendFile = promisify(fs.appendFile);
    const mkdir = promisify(fs.mkdir);
    
    return async (entry: LogEntry) => {
      try {
        // Ensure directory exists
        const dir = path.dirname(filePath);
        await mkdir(dir, { recursive: true });
        
        // Append to file
        await appendFile(filePath, `${JSON.stringify(entry)}\n`, 'utf8');
      } catch (error) {
        console.error('Error writing to log file:', error);
      }
    };
  }
  
  // Create a remote transport
  public static httpTransport(endpoint: string, options: {
    method?: string;
    headers?: Record<string, string>;
    transform?: (entry: LogEntry) => any;
  } = {}): LogTransport {
    const fetch = require('node-fetch');
    const { URL } = require('url');
    
    return async (entry: LogEntry) => {
      try {
        const body = options.transform 
          ? options.transform(entry)
          : entry;
        
        await fetch(endpoint, {
          method: options.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          body: JSON.stringify(body),
        });
      } catch (error) {
        console.error('Error sending log to remote:', error);
      }
    };
  }
}

// Default logger instance
export const logger = new LogKitten('athena');

// Helper function to create a logger
export function createLogger(namespace: string, options?: LogKittenOptions): LogKitten {
  return new LogKitten(namespace, options);
}

// Helper function to set the default log level
export function setDefaultLevel(level: LogLevel): void {
  logger.setLevel(level);
}
