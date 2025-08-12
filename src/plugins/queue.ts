import { Queue, Worker, QueueEvents, QueueScheduler } from 'bullmq';
import { FastifyPluginAsync } from 'fastify';
import { redis } from '../db/redis';
import { logger } from '../utils/logger';
import { config } from '../config';
import { join } from 'path';
import { readdir } from 'fs/promises';

declare module 'fastify' {
  interface FastifyInstance {
    queues: Map<string, Queue>;
    workers: Map<string, Worker>;
    queueEvents: Map<string, QueueEvents>;
    queueSchedulers: Map<string, QueueScheduler>;
  }
}

interface JobHandler<T = any> {
  (payload: T, jobId: string): Promise<void>;
}

interface QueueConfig {
  name: string;
  concurrency?: number;
  processor: JobHandler;
}

class QueueManager {
  private static instance: QueueManager;
  private queues: Map<string, Queue> = new Map();
  private workers: Map<string, Worker> = new Map();
  private queueEvents: Map<string, QueueEvents> = new Map();
  private queueSchedulers: Map<string, QueueScheduler> = new Map();

  private constructor() {}

  public static getInstance(): QueueManager {
    if (!QueueManager.instance) {
      QueueManager.instance = new QueueManager();
    }
    return QueueManager.instance;
  }

  public async createQueue<T = any>({
    name,
    concurrency = 1,
    processor,
  }: QueueConfig): Promise<Queue> {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    // Create queue
    const queue = new Queue(name, {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 1000, // Keep last 1000 completed jobs
        removeOnFail: 5000, // Keep last 5000 failed jobs
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    // Create worker
    const worker = new Worker(
      name,
      async (job) => {
        try {
          await processor(job.data, job.id!);
        } catch (error) {
          logger.error({ error, jobId: job.id, queue: name }, 'Job failed');
          throw error; // Let BullMQ handle retries
        }
      },
      {
        connection: redis,
        concurrency,
      }
    );

    // Create queue events
    const queueEvents = new QueueEvents(name, { connection: redis });
    const queueScheduler = new QueueScheduler(name, { connection: redis });

    // Event listeners
    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      logger.info({ jobId, queue: name }, 'Job completed');
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error({ jobId, queue: name, reason: failedReason }, 'Job failed');
    });

    queueEvents.on('stalled', ({ jobId }) => {
      logger.warn({ jobId, queue: name }, 'Job stalled');
    });

    // Store instances
    this.queues.set(name, queue);
    this.workers.set(name, worker);
    this.queueEvents.set(name, queueEvents);
    this.queueSchedulers.set(name, queueScheduler);

    logger.info(`Queue ${name} initialized with concurrency ${concurrency}`);
    return queue;
  }

  public getQueue(name: string): Queue | undefined {
    return this.queues.get(name);
  }

  public async closeAll(): Promise<void> {
    // Close all workers
    await Promise.all(
      Array.from(this.workers.values()).map((worker) => worker.close())
    );

    // Close all queues
    await Promise.all(
      Array.from(this.queues.values()).map((queue) => queue.close())
    );

    // Close all queue events
    await Promise.all(
      Array.from(this.queueEvents.values()).map((events) => events.close())
    );

    // Close all queue schedulers
    await Promise.all(
      Array.from(this.queueSchedulers.values()).map((scheduler) =>
        scheduler.close()
      )
    );

    this.queues.clear();
    this.workers.clear();
    this.queueEvents.clear();
    this.queueSchedulers.clear();
  }
}

const queuePlugin: FastifyPluginAsync = async (fastify) => {
  const queueManager = QueueManager.getInstance();
  
  // Initialize queues from the jobs directory
  try {
    const jobsPath = join(__dirname, '../../src/jobs');
    const jobFiles = (await readdir(jobsPath)).filter(
      (file) => file.endsWith('.ts') || file.endsWith('.js')
    );

    for (const file of jobFiles) {
      try {
        const jobModule = await import(join(jobsPath, file));
        if (jobModule.default) {
          await queueManager.createQueue(jobModule.default);
        }
      } catch (error) {
        logger.error({ error, file }, 'Failed to load job');
      }
    }
  } catch (error) {
    logger.warn('No jobs directory found or error reading jobs');
  }

  // Add queue manager to fastify instance
  fastify.decorate('queues', queueManager.queues);
  fastify.decorate('workers', queueManager.workers);
  fastify.decorate('queueEvents', queueManager.queueEvents);
  fastify.decorate('queueSchedulers', queueManager.queueSchedulers);

  // Add queue utility to fastify instance
  fastify.decorate('queue', {
    add: async <T = any>(queueName: string, data: T, options = {}) => {
      const queue = queueManager.getQueue(queueName);
      if (!queue) {
        throw new Error(`Queue ${queueName} not found`);
      }
      return queue.add(queueName, data, options);
    },
    getQueue: (queueName: string) => queueManager.getQueue(queueName),
  });

  // Graceful shutdown
  fastify.addHook('onClose', async () => {
    await queueManager.closeAll();
  });
};

export { queuePlugin };
export default fp(queuePlugin, {
  name: 'queue-plugin',
  fastify: '4.x',
});

export { QueueManager };
