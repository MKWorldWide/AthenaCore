import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { eventController } from '../controllers/event.controller';

async function eventRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all events with optional filtering
  fastify.get(
    '/',
    {
      schema: {
        tags: ['events'],
        summary: 'List all events (admin only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            type: { type: 'string' },
            entityType: { type: 'string' },
            entityId: { type: 'string' },
            severity: { 
              type: 'string', 
              enum: ['debug', 'info', 'warn', 'error', 'critical'] 
            },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            limit: { type: 'number', minimum: 1, maximum: 1000, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    type: { type: 'string' },
                    entityType: { type: 'string' },
                    entityId: { type: 'string' },
                    message: { type: 'string', nullable: true },
                    severity: { 
                      type: 'string',
                      enum: ['debug', 'info', 'warn', 'error', 'critical']
                    },
                    source: { type: 'string' },
                    metadata: { type: 'object', additionalProperties: true },
                    user: {
                      type: 'object',
                      nullable: true,
                      properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string', nullable: true },
                      },
                    },
                    createdAt: { type: 'string', format: 'date-time' },
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
    eventController.listEvents.bind(eventController)
  );

  // Get event by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['events'],
        summary: 'Get event by ID',
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
              event: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  type: { type: 'string' },
                  entityType: { type: 'string' },
                  entityId: { type: 'string' },
                  message: { type: 'string', nullable: true },
                  severity: { 
                    type: 'string',
                    enum: ['debug', 'info', 'warn', 'error', 'critical']
                  },
                  source: { type: 'string' },
                  metadata: { type: 'object', additionalProperties: true },
                  user: {
                    type: 'object',
                    nullable: true,
                    properties: {
                      id: { type: 'string' },
                      email: { type: 'string' },
                      name: { type: 'string', nullable: true },
                    },
                  },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    eventController.getEventById.bind(eventController)
  );

  // Create a new event
  fastify.post(
    '/',
    {
      schema: {
        tags: ['events'],
        summary: 'Create a new event',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['type', 'entityType', 'entityId'],
          properties: {
            type: { type: 'string', minLength: 1 },
            entityType: { type: 'string', minLength: 1 },
            entityId: { type: 'string', minLength: 1 },
            message: { type: 'string' },
            metadata: { type: 'object', additionalProperties: true },
            severity: { 
              type: 'string', 
              enum: ['debug', 'info', 'warn', 'error', 'critical'],
              default: 'info' 
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              event: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  type: { type: 'string' },
                  entityType: { type: 'string' },
                  entityId: { type: 'string' },
                  message: { type: 'string', nullable: true },
                  severity: { type: 'string' },
                  source: { type: 'string' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    eventController.createEvent.bind(eventController)
  );

  // Cleanup old events (admin only)
  fastify.post(
    '/cleanup',
    {
      schema: {
        tags: ['events'],
        summary: 'Cleanup old events (admin only)', 
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['olderThanDays'],
          properties: {
            olderThanDays: { 
              type: 'number', 
              minimum: 1,
              description: 'Delete events older than this many days',
            },
            types: { 
              type: 'array',
              items: { type: 'string' },
              description: 'Only delete events of these types (optional)', 
            },
            entityTypes: {
              type: 'array',
              items: { type: 'string' },
              description: 'Only delete events for these entity types (optional)',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              deleted: { type: 'number' },
              olderThan: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    eventController.cleanupEvents.bind(eventController)
  );
}

export default eventRoutes;
