import Fastify, { FastifyInstance, FastifyServerOptions } from 'fastify';
import { join } from 'path';
import { config } from './config';
import { logger } from './utils/logger';
import { registerPlugins } from './plugins';
import { registerRoutes } from './routes';
import { prisma } from './db/prisma';
import { redis } from './db/redis';
import { Queue } from 'bullmq';

export async function createServer(opts: FastifyServerOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    ...opts,
    logger,
    disableRequestLogging: config.NODE_ENV === 'test',
    trustProxy: true,
  });

  // Register plugins
  await registerPlugins(app);

  // Register routes
  await registerRoutes(app);

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
    env: config.NODE_ENV,
    memory: process.memoryUsage(),
  }));

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Starting graceful shutdown...');
    
    // Close Fastify server
    await app.close();
    
    // Close database connections
    await prisma.$disconnect();
    await redis.quit();
    
    // Close all queues
    const queues = app.queues || [];
    await Promise.all(queues.map((queue: Queue) => queue.close()));
    
    logger.info('Graceful shutdown complete');
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
        port: config.PORT,
        host: config.HOST,
      });
      
      logger.info(`Server listening at ${address}`);
      
      // Register service with service registry if needed
      if (config.NODE_ENV === 'production') {
        // TODO: Implement service registration
        logger.info('Service registration would happen here in production');
      }
    } catch (err) {
      logger.error(err, 'Failed to start server');
      process.exit(1);
    }
  })();
}

export default createServer;
