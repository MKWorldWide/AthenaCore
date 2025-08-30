import fp from 'fastify-plugin';
import fastifyJwt from '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';
import { config } from '../config';

// Extend the Fastify types to include our JWT user type
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  }
}

const jwtPlugin: FastifyPluginAsync = async (fastify) => {
  // Register JWT plugin with configuration
  await fastify.register(fastifyJwt, {
    secret: config.auth.jwtSecret,
    cookie: {
      cookieName: 'token',
      signed: true,
    },
    sign: {
      expiresIn: config.auth.jwtExpiresIn,
    },
  });

  // Add issuer to sign options
  fastify.jwt.options = fastify.jwt.options || {};
  fastify.jwt.options.sign = fastify.jwt.options.sign || {};
  Object.assign(fastify.jwt.options.sign, { issuer: 'athena-core' });

  // Add JWT utility methods to the Fastify instance
  fastify.decorate('generateToken', (payload: { id: string; email: string; roles: string[] }) => {
    return fastify.jwt.sign({ user: payload });
  });

  fastify.decorate('verifyToken', async (token: string) => {
    return fastify.jwt.verify(token);
  });
};

export default fp(jwtPlugin, {
  name: 'jwt-plugin',
  fastify: '4.x',
});
