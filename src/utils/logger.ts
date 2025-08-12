import pino from 'pino';
import { config } from '../config';

// Create a logger instance
const logger = pino({
  level: config.LOG_LEVEL,
  transport: config.LOG_PRETTY
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  base: {
    env: config.NODE_ENV,
    service: config.OTEL_SERVICE_NAME,
  },
});

// Add request ID to logs in a Fastify-compatible way
export const requestLogger = logger.child({ name: 'request' });

// General application logger
export const appLogger = logger.child({ name: 'app' });

// Database logger
export const dbLogger = logger.child({ name: 'db' });

// Job queue logger
export const queueLogger = logger.child({ name: 'queue' });

// Webhook logger
export const webhookLogger = logger.child({ name: 'webhook' });

// Authentication logger
export const authLogger = logger.child({ name: 'auth' });

// Default export for backward compatibility
export const logger = appLogger;
export default logger;
