import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';
import { Queue } from 'bullmq';

type JobStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused' | 'stuck';

const jobSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  queue: z.string().min(1, 'Queue is required'),
  data: z.record(z.any()).optional(),
  priority: z.number().int().min(1).max(10).default(5),
  delay: z.number().int().min(0).default(0),
  attempts: z.number().int().min(1).default(3),
  backoff: z.object({
    type: z.enum(['fixed', 'exponential']).default('exponential'),
    delay: z.number().int().min(1000).default(60000),
  }).optional(),
  metadata: z.record(z.any()).optional(),
});

type JobInput = z.infer<typeof jobSchema>;

class JobController {
  // List all jobs with optional filtering
  async listJobs(request: FastifyRequest, reply: FastifyReply) {
    const { 
      status = 'all', 
      queue: queueName, 
      limit = 20, 
      offset = 0 
    } = request.query as {
      status?: JobStatus | 'all';
      queue?: string;
      limit?: number;
      offset?: number;
    };

    // Only admins can view all jobs
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const where: any = {};
    
    if (queueName) {
      where.queue = queueName;
    }
    
    if (status !== 'all') {
      where.status = status;
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 100),
        skip: offset,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        total,
        limit: Math.min(limit, 100),
        offset,
      },
    };
  }

  // Get job by ID
  async getJobById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Only admins or the job creator can view the job
    if (!request.user?.roles?.includes('admin') && job.createdBy !== request.user?.userId) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Get job details from BullMQ if available
    let jobDetails = null;
    if (job.queue && job.bullJobId) {
      try {
        const queue = new Queue(job.queue, { connection: request.redis });
        const bullJob = await queue.getJob(job.bullJobId);
        
        if (bullJob) {
          jobDetails = {
            id: bullJob.id,
            name: bullJob.name,
            queue: bullJob.queue.name,
            data: bullJob.data,
            opts: bullJob.opts,
            progress: await bullJob.getProgress(),
            attemptsMade: bullJob.attemptsMade,
            failedReason: bullJob.failedReason,
            stacktrace: bullJob.stacktrace,
            returnvalue: bullJob.returnvalue,
            processedOn: bullJob.processedOn,
            finishedOn: bullJob.finishedOn,
            timestamp: bullJob.timestamp,
          };
        }
      } catch (error) {
        logger.error({ error, jobId: id }, 'Error fetching job details from BullMQ');
      }
    }

    return { job, details: jobDetails };
  }

  // Create a new job
  async createJob(
    request: FastifyRequest<{ Body: Omit<JobInput, 'status'> }>,
    reply: FastifyReply
  ) {
    // Only admins or services can create jobs
    if (!request.user?.roles?.includes('admin') && !request.isService) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const jobData = request.body;
    
    // Validate input
    const validatedData = jobSchema.parse(jobData);

    // Check if queue exists
    const queue = request.queues?.get(validatedData.queue);
    if (!queue) {
      throw new ValidationError(`Queue '${validatedData.queue}' not found`);
    }

    // Add job to BullMQ queue
    const bullJob = await queue.add(
      validatedData.name,
      validatedData.data || {},
      {
        jobId: undefined, // Let BullMQ generate a job ID
        priority: validatedData.priority,
        delay: validatedData.delay,
        attempts: validatedData.attempts,
        backoff: validatedData.backoff,
        metadata: {
          ...validatedData.metadata,
          createdBy: request.user?.userId || 'system',
          createdAt: new Date().toISOString(),
        },
      }
    );

    // Create job record in database
    const job = await prisma.job.create({
      data: {
        name: validatedData.name,
        queue: validatedData.queue,
        status: 'waiting',
        data: validatedData.data || {},
        metadata: {
          ...validatedData.metadata,
          createdBy: request.user?.userId || 'system',
          bullJobId: bullJob.id,
        },
        createdBy: request.user?.userId || 'system',
      },
    });

    logger.info({ jobId: job.id, queue: job.queue, createdBy: job.createdBy }, 'Job created');
    
    reply.code(202);
    return { job };
  }

  // Cancel a job
  async cancelJob(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    // Find the job
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Only admins or the job creator can cancel the job
    if (!request.user?.roles?.includes('admin') && job.createdBy !== request.user?.userId) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Only waiting or active jobs can be cancelled
    if (!['waiting', 'active'].includes(job.status)) {
      throw new ValidationError(`Cannot cancel job with status '${job.status}'`);
    }

    // Try to remove from BullMQ queue if possible
    if (job.queue && job.metadata?.bullJobId) {
      try {
        const queue = new Queue(job.queue, { connection: request.redis });
        const bullJob = await queue.getJob(job.metadata.bullJobId);
        
        if (bullJob) {
          await bullJob.remove();
        }
      } catch (error) {
        logger.error({ error, jobId: id }, 'Error removing job from BullMQ');
      }
    }

    // Update job status
    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        status: 'failed',
        completedAt: new Date(),
        metadata: {
          ...job.metadata,
          cancelled: true,
          cancelledAt: new Date().toISOString(),
          cancelledBy: request.user?.userId || 'system',
        },
      },
    });

    logger.info({ jobId: updatedJob.id, cancelledBy: request.user?.userId }, 'Job cancelled');
    
    return { job: updatedJob };
  }

  // Retry a failed job
  async retryJob(
    request: FastifyRequest<{ 
      Params: { id: string };
      Body?: { delay?: number; priority?: number };
    }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const { delay = 0, priority = 5 } = request.body || {};

    // Find the job
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundError('Job not found');
    }

    // Only admins or the job creator can retry the job
    if (!request.user?.roles?.includes('admin') && job.createdBy !== request.user?.userId) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Only failed jobs can be retried
    if (job.status !== 'failed') {
      throw new ValidationError(`Cannot retry job with status '${job.status}'`);
    }

    // Get the original job data
    const jobData = {
      name: job.name,
      queue: job.queue,
      data: job.data,
      priority: priority || job.metadata?.priority || 5,
      delay: delay || 0,
      attempts: (job.attempts || 0) + 1,
      backoff: job.metadata?.backoff || { type: 'exponential', delay: 60000 },
      metadata: {
        ...job.metadata,
        retried: true,
        retriedAt: new Date().toISOString(),
        retriedBy: request.user?.userId || 'system',
        previousJobId: job.id,
      },
    };

    // Add the job back to the queue
    const queue = request.queues?.get(job.queue);
    if (!queue) {
      throw new ValidationError(`Queue '${job.queue}' not found`);
    }

    const bullJob = await queue.add(
      jobData.name,
      jobData.data,
      {
        priority: jobData.priority,
        delay: jobData.delay,
        attempts: jobData.attempts,
        backoff: jobData.backoff,
        metadata: jobData.metadata,
      }
    );

    // Create a new job record for the retry
    const newJob = await prisma.job.create({
      data: {
        name: jobData.name,
        queue: jobData.queue,
        status: 'waiting',
        data: jobData.data,
        attempts: jobData.attempts,
        metadata: {
          ...jobData.metadata,
          bullJobId: bullJob.id,
        },
        createdBy: request.user?.userId || 'system',
      },
    });

    // Update the original job to mark it as retried
    await prisma.job.update({
      where: { id: job.id },
      data: {
        metadata: {
          ...job.metadata,
          retried: true,
          retriedAt: new Date().toISOString(),
          retriedBy: request.user?.userId || 'system',
          retriedJobId: newJob.id,
        },
      },
    });

    logger.info({ 
      originalJobId: job.id, 
      newJobId: newJob.id, 
      retriedBy: request.user?.userId 
    }, 'Job retried');
    
    reply.code(201);
    return { job: newJob };
  }
}

export const jobController = new JobController();
