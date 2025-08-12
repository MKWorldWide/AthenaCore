import { FastifyPluginAsync } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { config } from '../config';
import { version } from '../../package.json';

const swagger: FastifyPluginAsync = async (fastify) => {
  // Only register Swagger in development or if explicitly enabled
  if (config.NODE_ENV !== 'production' || config.ENABLE_SWAGGER_UI) {
    // Register Swagger
    await fastify.register(fastifySwagger, {
      openapi: {
        info: {
          title: 'AthenaCore API',
          description: 'API documentation for AthenaCore service',
          version,
        },
        servers: [
          {
            url: `http://localhost:${config.PORT}`,
            description: 'Development server',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
              description: 'Enter JWT token',
            },
            serviceAuth: {
              type: 'apiKey',
              name: 'X-SVC-ID',
              in: 'header',
              description: 'Service authentication',
            },
          },
        },
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
      hideUntagged: true,
    });

    // Register Swagger UI
    await fastify.register(fastifySwaggerUi, {
      routePrefix: '/docs',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: false,
      },
      staticCSP: true,
      transformStaticCSP: (header) => header,
      transformSpecification: (swaggerObject) => swaggerObject,
      transformSpecificationClone: true,
    });

    // Add documentation routes
    fastify.get('/openapi.json', { schema: { hide: true } }, (req, reply) => {
      reply.send(fastify.swagger());
    });
  }
};

export { swagger };
export default swagger;
