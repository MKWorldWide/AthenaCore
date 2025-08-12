import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { webhookController } from '../controllers/webhook.controller';

async function webhookRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all webhooks
  fastify.get(
    '/',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'List all webhooks (admin only)',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              webhooks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    url: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    events: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
                    retryCount: { type: 'number' },
                    retryDelay: { type: 'number' },
                    timeout: { type: 'number' },
                    lastDeliveryStatus: { type: 'string', nullable: true },
                    lastDeliveryAt: { type: 'string', format: 'date-time', nullable: true },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    webhookController.listWebhooks.bind(webhookController)
  );

  // Get webhook by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Get webhook by ID (admin only)',
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
              webhook: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  url: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  events: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                  headers: { type: 'object', additionalProperties: { type: 'string' } },
                  retryCount: { type: 'number' },
                  retryDelay: { type: 'number' },
                  timeout: { type: 'number' },
                  lastDeliveryStatus: { type: 'string', nullable: true },
                  lastDeliveryAt: { type: 'string', format: 'date-time', nullable: true },
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
    webhookController.getWebhookById.bind(webhookController)
  );

  // Create a new webhook
  fastify.post(
    '/',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Create a new webhook (admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'url', 'events'],
          properties: {
            name: { type: 'string', minLength: 1 },
            url: { type: 'string', format: 'uri' },
            description: { type: 'string' },
            events: { 
              type: 'array', 
              items: { type: 'string', minLength: 1 },
              minItems: 1,
            },
            secret: { type: 'string', minLength: 16 },
            isActive: { type: 'boolean' },
            headers: { 
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            retryCount: { type: 'number', minimum: 0, maximum: 10 },
            retryDelay: { type: 'number', minimum: 1000, maximum: 60000 },
            timeout: { type: 'number', minimum: 1000, maximum: 300000 },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              webhook: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  url: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  events: { type: 'array', items: { type: 'string' } },
                  secret: { type: 'string' },
                  isActive: { type: 'boolean' },
                  headers: { type: 'object', additionalProperties: { type: 'string' } },
                  retryCount: { type: 'number' },
                  retryDelay: { type: 'number' },
                  timeout: { type: 'number' },
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
    webhookController.createWebhook.bind(webhookController)
  );

  // Update webhook
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Update webhook (admin only)',
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
            url: { type: 'string', format: 'uri' },
            description: { type: 'string' },
            events: { 
              type: 'array', 
              items: { type: 'string', minLength: 1 },
            },
            isActive: { type: 'boolean' },
            headers: { 
              type: 'object',
              additionalProperties: { type: 'string' },
            },
            retryCount: { type: 'number', minimum: 0, maximum: 10 },
            retryDelay: { type: 'number', minimum: 1000, maximum: 60000 },
            timeout: { type: 'number', minimum: 1000, maximum: 300000 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              webhook: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  url: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  events: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                  headers: { type: 'object', additionalProperties: { type: 'string' } },
                  retryCount: { type: 'number' },
                  retryDelay: { type: 'number' },
                  timeout: { type: 'number' },
                  lastDeliveryStatus: { type: 'string', nullable: true },
                  lastDeliveryAt: { type: 'string', format: 'date-time', nullable: true },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    webhookController.updateWebhook.bind(webhookController)
  );

  // Delete webhook
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Delete webhook (admin only)',
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
    webhookController.deleteWebhook.bind(webhookController)
  );

  // Regenerate webhook secret
  fastify.post(
    '/:id/regenerate-secret',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Regenerate webhook secret (admin only)',
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
              webhook: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  secret: { type: 'string' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    webhookController.regenerateSecret.bind(webhookController)
  );

  // Test webhook delivery
  fastify.post(
    '/:id/test',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Test webhook delivery (admin only)',
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
            payload: { 
              type: 'object',
              additionalProperties: true,
              default: { test: true },
            },
            eventType: { 
              type: 'string',
              default: 'test.event',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              status: { type: 'number' },
              statusText: { type: 'string' },
              data: { type: 'object', additionalProperties: true },
              headers: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    webhookController.testWebhook.bind(webhookController)
  );

  // List webhook deliveries
  fastify.get(
    '/:id/deliveries',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'List webhook deliveries (admin only)', 
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'number', minimum: 0, default: 0 },
            event: { type: 'string' },
            status: { type: 'string' },
            success: { type: 'boolean' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              deliveries: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    event: { type: 'string' },
                    statusCode: { type: 'number' },
                    success: { type: 'boolean' },
                    error: { type: 'string', nullable: true },
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
    async (request, reply) => {
      // Implementation for listing webhook deliveries
      // This would be similar to the other list endpoints
      // but for webhook deliveries
      return { 
        deliveries: [],
        pagination: {
          total: 0,
          limit: 20,
          offset: 0,
        },
      };
    }
  );

  // Get webhook delivery details
  fastify.get(
    '/deliveries/:deliveryId',
    {
      schema: {
        tags: ['webhooks'],
        summary: 'Get webhook delivery details (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['deliveryId'],
          properties: {
            deliveryId: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              delivery: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  webhookId: { type: 'string', format: 'uuid' },
                  event: { type: 'string' },
                  statusCode: { type: 'number' },
                  success: { type: 'boolean' },
                  error: { type: 'string', nullable: true },
                  request: { type: 'object', additionalProperties: true },
                  response: { type: 'object', additionalProperties: true, nullable: true },
                  duration: { type: 'number', nullable: true },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    async (request, reply) => {
      // Implementation for getting webhook delivery details
      return {
        delivery: {
          id: request.params.deliveryId,
          webhookId: '',
          event: '',
          statusCode: 0,
          success: false,
          error: null,
          request: {},
          response: null,
          duration: 0,
          createdAt: new Date().toISOString(),
        },
      };
    }
  );
}

export default webhookRoutes;
