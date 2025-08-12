import { FastifyPluginAsync } from 'fastify';
import { config } from '../config';
import fp from 'fastify-plugin';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import fastifyJwt from '@fastify/jwt';
import { swagger } from './swagger';
import { errorHandler } from './error-handler';
import { authPlugin } from './auth';
import { queuePlugin } from './queue';

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
    origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN.split(','),
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
    max: config.RATE_LIMIT_MAX,
    timeWindow: config.RATE_LIMIT_TIME_WINDOW * 1000, // Convert to ms
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
  });

  // JWT Authentication
  await fastify.register(fastifyJwt, {
    secret: config.JWT_SECRET,
    sign: {
      expiresIn: config.JWT_EXPIRES_IN,
    },
    verify: {
      maxAge: config.JWT_EXPIRES_IN,
    },
  });

  // Swagger/OpenAPI documentation
  if (config.ENABLE_OPENAPI) {
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
