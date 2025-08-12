import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { userController } from '../controllers/user.controller';
import { userSchema } from '../schemas/user.schema';

async function userRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // List all users (admin only)
  fastify.get(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'List all users (admin only)',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              users: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    name: { type: 'string', nullable: true },
                    roles: { type: 'array', items: { type: 'string' } },
                    isActive: { type: 'boolean' },
                    lastLogin: { type: 'string', format: 'date-time', nullable: true },
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
    userController.listUsers.bind(userController)
  );

  // Get user by ID
  fastify.get(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Get user by ID',
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
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                  lastLogin: { type: 'string', format: 'date-time', nullable: true },
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
    userController.getUserById.bind(userController)
  );

  // Create user (admin only)
  fastify.post(
    '/',
    {
      schema: {
        tags: ['users'],
        summary: 'Create a new user (admin only)',
        security: [{ bearerAuth: [] }],
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            password: { type: 'string', minLength: 8 },
            roles: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
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
    userController.createUser.bind(userController)
  );

  // Update user
  fastify.put(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Update user',
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
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            password: { type: 'string', minLength: 8 },
            roles: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                  isActive: { type: 'boolean' },
                  lastLogin: { type: 'string', format: 'date-time', nullable: true },
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
    userController.updateUser.bind(userController)
  );

  // Delete user (admin only)
  fastify.delete(
    '/:id',
    {
      schema: {
        tags: ['users'],
        summary: 'Delete user (admin only)',
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
    userController.deleteUser.bind(userController)
  );
}

export default userRoutes;
