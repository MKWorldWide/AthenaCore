import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { intentController } from '../controllers/intent.controller';

async function intentRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all intents
  fastify.get(
    '/',
    {
      schema: {
        tags: ['intents'],
        summary: 'List all intents',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            search: { type: 'string' },
            service: { type: 'string' },
            activeOnly: { type: 'string', enum: ['true', 'false'], default: 'true' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              intents: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    match: { type: 'string' },
                    targetService: { type: 'string' },
                    priority: { type: 'number' },
                    isActive: { type: 'boolean' },
                    metadata: { type: 'object', additionalProperties: true },
                    createdBy: { type: 'string', nullable: true },
                    updatedBy: { type: 'string', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    intentController.listIntents.bind(intentController)
  );

  // Get intent by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['intents'],
        summary: 'Get intent by ID',
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
              intent: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  match: { type: 'string' },
                  targetService: { type: 'string' },
                  priority: { type: 'number' },
                  isActive: { type: 'boolean' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdBy: { type: 'string', nullable: true },
                  updatedBy: { type: 'string', nullable: true },
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
    intentController.getIntentById.bind(intentController)
  );

  // Create a new intent (admin only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['intents'],
        summary: 'Create a new intent (admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'match', 'targetService'],
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            match: { type: 'string', minLength: 1 },
            targetService: { type: 'string', minLength: 1 },
            priority: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean' },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              intent: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  match: { type: 'string' },
                  targetService: { type: 'string' },
                  priority: { type: 'number' },
                  isActive: { type: 'boolean' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdBy: { type: 'string', nullable: true },
                  updatedBy: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    intentController.createIntent.bind(intentController)
  );

  // Update intent (admin only)
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['intents'],
        summary: 'Update intent (admin only)',
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
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            match: { type: 'string', minLength: 1 },
            targetService: { type: 'string', minLength: 1 },
            priority: { type: 'number', minimum: 1 },
            isActive: { type: 'boolean' },
            metadata: { type: 'object', additionalProperties: true },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              intent: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  match: { type: 'string' },
                  targetService: { type: 'string' },
                  priority: { type: 'number' },
                  isActive: { type: 'boolean' },
                  metadata: { type: 'object', additionalProperties: true },
                  createdBy: { type: 'string', nullable: true },
                  updatedBy: { type: 'string', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    intentController.updateIntent.bind(intentController)
  );

  // Delete intent (admin only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['intents'],
        summary: 'Delete intent (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          204: { type: 'null' },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    intentController.deleteIntent.bind(intentController)
  );

  // Match intent from text
  fastify.post(
    '/match',
    {
      schema: {
        tags: ['intents'],
        summary: 'Match intent from text',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['text'],
          properties: {
            text: { type: 'string', minLength: 1 },
            context: { type: 'object', additionalProperties: true },
            service: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              match: { type: 'boolean' },
              intent: {
                type: 'object',
                nullable: true,
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  targetService: { type: 'string' },
                  metadata: { type: 'object', additionalProperties: true },
                },
              },
              context: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  matchedText: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate],
    },
    intentController.matchIntent.bind(intentController)
  );
}

export default intentRoutes;
