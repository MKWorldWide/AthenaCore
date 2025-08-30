import { FastifyPluginAsync } from 'fastify';
import { config } from '../config';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { swagger } from './swagger';
import { errorHandler } from './error-handler';
import { authPlugin } from './auth';
import { queuePlugin } from './queue';
import jwtPlugin from './jwt';

// Register all plugins
export const registerPlugins: FastifyPluginAsync = async (fastify) => {
  // Error handler must be first
  fastify.setErrorHandler(errorHandler);

  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'"],
      },
    },
  });

  // CORS
  await fastify.register(cors, {
    origin: config.server.corsOrigins.length === 0 ? true : config.server.corsOrigins,
    credentials: true,
    methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'X-SVC-ID',
      'X-SVC-SIGN',
    ],
  });

  // Rate limiting
  await fastify.register(rateLimit, {
    max: config.server.rateLimit.max,
    timeWindow: config.server.rateLimit.windowMs,
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // JWT Authentication
  await fastify.register(jwtPlugin);

  // Swagger/OpenAPI documentation
  if (config.server.nodeEnv !== 'production') {
    await fastify.register(swagger);
  }

  // Authentication plugin
  await fastify.register(authPlugin);

  // Queue plugin
  await fastify.register(queuePlugin);
};

export default fp(registerPlugins, {
  name: 'app-plugins',
  fastify: '4.x',
});
