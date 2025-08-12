import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { authController } from '../controllers/auth.controller';
import { loginSchema, registerSchema } from '../schemas/auth.schema';

async function authRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // Login route
  fastify.post(
    '/login',
    {
      schema: {
        tags: ['auth'],
        summary: 'User login',
        body: loginSchema,
        response: {
          200: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              token_type: { type: 'string' },
              expires_in: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    authController.login.bind(authController)
  );

  // Register route
  fastify.post(
    '/register',
    {
      schema: {
        tags: ['auth'],
        summary: 'User registration',
        body: registerSchema,
        response: {
          201: {
            type: 'object',
            properties: {
              access_token: { type: 'string' },
              token_type: { type: 'string' },
              expires_in: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
      },
    },
    authController.register.bind(authController)
  );

  // Get current user info
  fastify.get(
    '/me',
    {
      preValidation: [fastify.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Get current user info',
        security: [{ bearerAuth: [] }],
        response: {
          200: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  roles: { type: 'array', items: { type: 'string' } },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
    authController.me.bind(authController)
  );
}

export default authRoutes;
