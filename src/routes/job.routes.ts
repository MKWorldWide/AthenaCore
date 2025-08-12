import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { jobController } from '../controllers/job.controller';

async function jobRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all jobs with optional filtering
  fastify.get(
    '/',
    {
      schema: {
        tags: ['jobs'],
        summary: 'List all jobs',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            status: { 
              type: 'string', 
              enum: ['all', 'waiting', 'active', 'completed', 'failed', 'delayed', 'paused', 'stuck'],
              default: 'all' 
            },
            queue: { type: 'string' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              jobs: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    queue: { type: 'string' },
                    status: { 
                      type: 'string',
                      enum: ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused', 'stuck'],
                    },
                    attempts: { type: 'number' },
                    data: { type: 'object', additionalProperties: true },
                    metadata: { type: 'object', additionalProperties: true },
                    error: { type: 'string', nullable: true },
                    startedAt: { type: 'string', format: 'date-time', nullable: true },
                    completedAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
              pagination: {
                type: 'object',
                properties: {
                  total: { type: 'number' },
                  limit: { type: 'number' },
                  offset: { type: 'number' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    jobController.listJobs.bind(jobController)
  );

  // Get job by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Get job by ID',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              job: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  queue: { type: 'string' },
                  status: { 
                    type: 'string',
                    enum: ['waiting', 'active', 'completed', 'failed', 'delayed', 'paused', 'stuck'],
                  },
                  attempts: { type: 'number' },
                  data: { type: 'object', additionalProperties: true },
                  metadata: { type: 'object', additionalProperties: true },
                  error: { type: 'string', nullable: true },
                  startedAt: { type: 'string', format: 'date-time', nullable: true },
                  completedAt: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
              details: {
                type: 'object',
                nullable: true,
                additionalProperties: true,
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    jobController.getJobById.bind(jobController)
  );

  // Create a new job
  fastify.post(
    '/',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Create a new job',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'queue'],
          properties: {
            name: { type: 'string', minLength: 1 },
            queue: { type: 'string', minLength: 1 },
            data: { type: 'object', additionalProperties: true },
            priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
            delay: { type: 'number', minimum: 0, default: 0 },
            attempts: { type: 'number', minimum: 1, default: 3 },
            backoff: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['fixed', 'exponential'], default: 'exponential' },
                delay: { type: 'number', minimum: 1000, default: 60000 },
              },
              default: { type: 'exponential', delay: 60000 },
            },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        response: {
          202: {
            type: 'object',
            properties: {
              job: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  queue: { type: 'string' },
                  status: { type: 'string' },
                  data: { type: 'object', additionalProperties: true },
                  metadata: { type: 'object', additionalProperties: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    jobController.createJob.bind(jobController)
  );

  // Cancel a job
  fastify.post(
    '/:id/cancel',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Cancel a job',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              job: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  queue: { type: 'string' },
                  status: { type: 'string' },
                  completedAt: { type: 'string', format: 'date-time', nullable: true },
                  metadata: { type: 'object', additionalProperties: true },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    jobController.cancelJob.bind(jobController)
  );

  // Retry a failed job
  fastify.post(
    '/:id/retry',
    {
      schema: {
        tags: ['jobs'],
        summary: 'Retry a failed job',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        body: {
          type: 'object',
          properties: {
            delay: { type: 'number', minimum: 0, default: 0 },
            priority: { type: 'number', minimum: 1, maximum: 10, default: 5 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              job: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  queue: { type: 'string' },
                  status: { type: 'string' },
                  attempts: { type: 'number' },
                  data: { type: 'object', additionalProperties: true },
                  metadata: { type: 'object', additionalProperties: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    jobController.retryJob.bind(jobController)
  );
}

export default jobRoutes;
