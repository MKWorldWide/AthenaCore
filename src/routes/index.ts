import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import intentRoutes from './intent.routes';
import jobRoutes from './job.routes';
import eventRoutes from './event.routes';
import webhookRoutes from './webhook.routes';
import secretRoutes from './secret.routes';
import serviceRoutes from './service.routes';

export async function registerRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  // Health check route (no auth required)
  fastify.get('/healthz', async () => {
    return { status: 'ok' };
  });

  // API v1 routes
  fastify.register(
    async (api) => {
      // Auth routes (no auth required)
      api.register(authRoutes, { prefix: '/auth' });

      // Protected routes (require authentication)
      api.register(
        async (protectedRoutes) => {
          // Add authentication hook to all protected routes
          protectedRoutes.addHook('onRequest', async (request, reply) => {
            try {
              await request.jwtVerify();
            } catch (err) {
              reply.unauthorized('Invalid or missing token');
            }
          });

          // Register protected routes
          protectedRoutes.register(userRoutes, { prefix: '/users' });
          protectedRoutes.register(intentRoutes, { prefix: '/intents' });
          protectedRoutes.register(jobRoutes, { prefix: '/jobs' });
          protectedRoutes.register(eventRoutes, { prefix: '/events' });
          protectedRoutes.register(webhookRoutes, { prefix: '/webhooks' });
          protectedRoutes.register(secretRoutes, { prefix: '/secrets' });
          protectedRoutes.register(serviceRoutes, { prefix: '/services' });
        },
        { prefix: '/v1' }
      );
    },
    { prefix: '/api' }
  );
}

export default registerRoutes;
