import { PrismaClient } from '@prisma/client';
import { dbLogger as logger } from '../utils/logger';

// Add logging to Prisma client
const prisma = new PrismaClient({
  log: [
    { level: 'warn', emit: 'event' },
    { level: 'info', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'query', emit: 'event' },
  ],
});

// Log Prisma events
prisma.$on('query', (e) => {
  logger.debug({
    query: e.query,
    params: e.params,
    duration: e.duration,
    target: e.target,
  }, 'Database query executed');
});

prisma.$on('warn', (e) => {
  logger.warn(e, 'Prisma warning');
});

prisma.$on('info', (e) => {
  logger.info(e, 'Prisma info');
});

prisma.$on('error', (e) => {
  logger.error(e, 'Prisma error');
});

// Handle process termination
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export { prisma };
export * from '@prisma/client';
