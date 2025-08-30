import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import pino from 'pino';
import { config } from './config';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { prisma } from './db/prisma';
import { redis } from './db/redis';
import { Queue } from 'bullmq';

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    queues: Map<string, Queue>;
  }
  
  interface FastifyBaseLogger extends pino.BaseLogger {
    msgPrefix?: string;
  }
}

export async function createServer(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  // Create Fastify with HTTP/1.1 server
  const app = Fastify({
    ...opts,
    logger: {
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
      msgPrefix: ''
    } as const,
    disableRequestLogging: config.nodeEnv === 'test',
    trustProxy: true,
  });

  // Register plugins
  // Register plugins with empty options
  await registerPlugins(app, {});

  // Register routes with empty options
  await registerRoutes(app, {});

  // Health check endpoint
  app.get('/healthz', async () => {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Check Redis connection
    await redis.ping();
    
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Status endpoint with system information
  app.get('/v1/status', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    memory: process.memoryUsage(),
  }));

  // Initialize queues map
  app.decorate('queues', new Map<string, Queue>());

  // Graceful shutdown
  const shutdown = async () => {
    app.log.info('Starting graceful shutdown...');
    
    // Close Fastify server
    await app.close();
    
    // Close database connections
    await prisma.$disconnect();
    await redis.quit();
    
    // Close all queues
    const queues = app.queues ? Array.from(app.queues.values()) : [];
    await Promise.all(queues.map(queue => queue.close()));
    
    app.log.info('Graceful shutdown complete');
    process.exit(0);
  };

  // Handle shutdown signals
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  return app;
}

// Start the server if this file is run directly
if (require.main === module) {
  (async () => {
    try {
      const app = await createServer();
      
      await app.ready();
      
      // Start listening
      const address = await app.listen({
        port: config.server.port,
        host: config.server.host,
      });
      
      app.log.info(`Server listening at ${address}`);
      
      // Register service with service registry if needed
      if (config.nodeEnv === 'production') {
        // TODO: Implement service registration
        app.log.info('Service registration would happen here in production');
      }
    } catch (err) {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  })();
}

export default createServer;
