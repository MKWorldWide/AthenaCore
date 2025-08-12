import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { secretController } from '../controllers/secret.controller';

async function secretRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all secrets (admin only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['secrets'],
        summary: 'List all secrets (admin only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            tag: { type: 'string' },
            isSensitive: { type: 'boolean' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              secrets: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    key: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    tags: { type: 'array', items: { type: 'string' } },
                    isSensitive: { type: 'boolean' },
                    expiresAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    createdBy: { type: 'string' },
                    updatedBy: { type: 'string' },
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
    secretController.listSecrets.bind(secretController)
  );

  // Get secret by ID (admin only)
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Get secret by ID (admin only)',
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
              secret: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  key: { type: 'string' },
                  value: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  tags: { type: 'array', items: { type: 'string' } },
                  isSensitive: { type: 'boolean' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string' },
                  updatedBy: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    secretController.getSecretById.bind(secretController)
  );

  // Get secret by key (admin only)
  fastify.get(
    '/key/:key',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Get secret by key (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              secret: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  key: { type: 'string' },
                  value: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  tags: { type: 'array', items: { type: 'string' } },
                  isSensitive: { type: 'boolean' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string' },
                  updatedBy: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    secretController.getSecretByKey.bind(secretController)
  );

  // Create a new secret (admin only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Create a new secret (admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['key', 'value'],
          properties: {
            key: { type: 'string', minLength: 1 },
            value: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
              default: [],
            },
            isSensitive: { type: 'boolean', default: true },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              secret: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  key: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  tags: { type: 'array', items: { type: 'string' } },
                  isSensitive: { type: 'boolean' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  createdBy: { type: 'string' },
                  updatedBy: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    secretController.createSecret.bind(secretController)
  );

  // Update secret (admin only)
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Update secret (admin only)',
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
            value: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
            },
            isSensitive: { type: 'boolean' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              secret: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  key: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  tags: { type: 'array', items: { type: 'string' } },
                  isSensitive: { type: 'boolean' },
                  expiresAt: { type: 'string', format: 'date-time', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time' },
                  updatedBy: { type: 'string' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    secretController.updateSecret.bind(secretController)
  );

  // Delete secret (admin only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Delete secret (admin only)',
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
    secretController.deleteSecret.bind(secretController)
  );

  // Get secret value by key (for services)
  fastify.get(
    '/service/:key',
    {
      schema: {
        tags: ['secrets'],
        summary: 'Get secret value by key (for services)',
        description: 'Service authentication required',
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: { type: 'string' },
          },
        },
        headers: {
          type: 'object',
          required: ['x-service-key'],
          properties: {
            'x-service-key': { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              isSensitive: { type: 'boolean' },
            },
          },
        },
      },
    },
    secretController.getSecretValue.bind(secretController)
  );
}

export default secretRoutes;
