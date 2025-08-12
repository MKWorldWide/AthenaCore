import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { serviceController } from '../controllers/service.controller';

async function serviceRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all services (admin only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['services'],
        summary: 'List all services (admin only)',
        security: [{ bearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            tag: { type: 'string' },
            isActive: { type: 'boolean' },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'number', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              services: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    baseUrl: { type: 'string' },
                    healthCheckPath: { type: 'string' },
                    isActive: { type: 'boolean' },
                    tags: { type: 'array', items: { type: 'string' } },
                    lastHealthCheck: { type: 'string', format: 'date-time', nullable: true },
                    lastHealthCheckStatus: { type: 'string', nullable: true },
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
    serviceController.listServices.bind(serviceController)
  );

  // Get service by ID (admin only)
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['services'],
        summary: 'Get service by ID (admin only)',
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
              service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  baseUrl: { type: 'string' },
                  healthCheckPath: { type: 'string' },
                  isActive: { type: 'boolean' },
                  tags: { type: 'array', items: { type: 'string' } },
                  metadata: { type: 'object', additionalProperties: true },
                  rateLimit: {
                    type: 'object',
                    properties: {
                      windowMs: { type: 'number' },
                      max: { type: 'number' },
                    },
                    nullable: true,
                  },
                  lastHealthCheck: { type: 'string', format: 'date-time', nullable: true },
                  lastHealthCheckStatus: { type: 'string', nullable: true },
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
    serviceController.getServiceById.bind(serviceController)
  );

  // Get service by name (admin only)
  fastify.get(
    '/name/:name',
    {
      schema: {
        tags: ['services'],
        summary: 'Get service by name (admin only)',
        security: [{ bearerAuth: [] }],
        params: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  baseUrl: { type: 'string' },
                  healthCheckPath: { type: 'string' },
                  isActive: { type: 'boolean' },
                  tags: { type: 'array', items: { type: 'string' } },
                  metadata: { type: 'object', additionalProperties: true },
                  rateLimit: {
                    type: 'object',
                    properties: {
                      windowMs: { type: 'number' },
                      max: { type: 'number' },
                    },
                    nullable: true,
                  },
                  lastHealthCheck: { type: 'string', format: 'date-time', nullable: true },
                  lastHealthCheckStatus: { type: 'string', nullable: true },
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
    serviceController.getServiceByName.bind(serviceController)
  );

  // Create a new service (admin only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['services'],
        summary: 'Create a new service (admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['name', 'baseUrl'],
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            baseUrl: { type: 'string', format: 'uri' },
            healthCheckPath: { type: 'string', default: '/healthz' },
            isActive: { type: 'boolean', default: true },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
              default: [],
            },
            metadata: { 
              type: 'object',
              additionalProperties: true,
            },
            rateLimit: {
              type: 'object',
              properties: {
                windowMs: { type: 'number', minimum: 1000, default: 60000 },
                max: { type: 'number', minimum: 1, default: 100 },
              },
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  baseUrl: { type: 'string' },
                  healthCheckPath: { type: 'string' },
                  isActive: { type: 'boolean' },
                  tags: { type: 'array', items: { type: 'string' } },
                  metadata: { type: 'object', additionalProperties: true },
                  rateLimit: {
                    type: 'object',
                    properties: {
                      windowMs: { type: 'number' },
                      max: { type: 'number' },
                    },
                    nullable: true,
                  },
                  serviceKey: { type: 'string' }, // Only returned on creation
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
    serviceController.createService.bind(serviceController)
  );

  // Update service (admin only)
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['services'],
        summary: 'Update service (admin only)',
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
            baseUrl: { type: 'string', format: 'uri' },
            healthCheckPath: { type: 'string' },
            isActive: { type: 'boolean' },
            tags: { 
              type: 'array', 
              items: { type: 'string' },
            },
            metadata: { 
              type: 'object',
              additionalProperties: true,
            },
            rateLimit: {
              type: 'object',
              properties: {
                windowMs: { type: 'number', minimum: 1000 },
                max: { type: 'number', minimum: 1 },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  description: { type: 'string', nullable: true },
                  baseUrl: { type: 'string' },
                  healthCheckPath: { type: 'string' },
                  isActive: { type: 'boolean' },
                  tags: { type: 'array', items: { type: 'string' } },
                  metadata: { type: 'object', additionalProperties: true },
                  rateLimit: {
                    type: 'object',
                    properties: {
                      windowMs: { type: 'number' },
                      max: { type: 'number' },
                    },
                    nullable: true,
                  },
                  lastHealthCheck: { type: 'string', format: 'date-time', nullable: true },
                  lastHealthCheckStatus: { type: 'string', nullable: true },
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
    serviceController.updateService.bind(serviceController)
  );

  // Delete service (admin only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['services'],
        summary: 'Delete service (admin only)',
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
    serviceController.deleteService.bind(serviceController)
  );

  // Regenerate service key (admin only)
  fastify.post(
    '/:id/regenerate-key',
    {
      schema: {
        tags: ['services'],
        summary: 'Regenerate service key (admin only)',
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
              service: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  name: { type: 'string' },
                  serviceKey: { type: 'string' }, // Only returned on regeneration
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
    serviceController.regenerateServiceKey.bind(serviceController)
  );

  // Check service health (admin only)
  fastify.get(
    '/:id/health',
    {
      schema: {
        tags: ['services'],
        summary: 'Check service health (admin only)',
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
              healthy: { type: 'boolean' },
              status: { type: 'number' },
              statusText: { type: 'string' },
              data: { type: 'object', additionalProperties: true },
              timestamp: { type: 'string', format: 'date-time' },
              error: { type: 'string', nullable: true },
            },
          },
        },
      },
      preValidation: [fastify.authenticate, fastify.authorize(['admin'])],
    },
    serviceController.checkServiceHealth.bind(serviceController)
  );

  // Service self-registration (no auth required)
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['services'],
        summary: 'Register a new service (public)',
        description: 'Register a new service and get a service key. Requires admin approval.',
        body: {
          type: 'object',
          required: ['name', 'baseUrl'],
          properties: {
            name: { type: 'string', minLength: 1 },
            description: { type: 'string' },
            baseUrl: { type: 'string', format: 'uri' },
            healthCheckPath: { type: 'string', default: '/healthz' },
            contactEmail: { type: 'string', format: 'email' },
            metadata: { 
              type: 'object',
              additionalProperties: true,
            },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              serviceId: { type: 'string', format: 'uuid' },
              requiresApproval: { type: 'boolean' },
              serviceKey: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      // In a real implementation, this would create a pending service registration
      // that requires admin approval before the service is activated
      // For now, we'll just return a success message
      
      return reply.code(201).send({
        message: 'Service registration request received. An admin will review your request shortly.',
        serviceId: 'pending-approval',
        requiresApproval: true,
        serviceKey: null,
      });
    }
  );
}

export default serviceRoutes;
