import pino from 'pino';

// Create the base logger configuration
const loggerConfig = {
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.LOG_PRETTY === 'true' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  } : undefined,
  formatters: {
    level: (label: string) => ({ level: label }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
  base: {
    env: process.env.NODE_ENV || 'development',
    service: process.env.OTEL_SERVICE_NAME || 'athena-core',
  },
};

// Create the main logger instance
const mainLogger = pino(loggerConfig);

// Create child loggers with proper typing
const appLogger = mainLogger.child({ name: 'app' });
const requestLogger = mainLogger.child({ name: 'request' });
const dbLogger = mainLogger.child({ name: 'db' });
const queueLogger = mainLogger.child({ name: 'queue' });
const webhookLogger = mainLogger.child({ name: 'webhook' });
const authLogger = mainLogger.child({ name: 'auth' });

// Export all loggers
export {
  appLogger as logger,
  requestLogger,
  dbLogger,
  queueLogger,
  webhookLogger,
  authLogger,
};

// Default export is the main app logger
export default appLogger;
