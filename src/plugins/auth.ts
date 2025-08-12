import { FastifyPluginAsync } from 'fastify';
import { config } from '../config';
import fp from 'fastify-plugin';
import { logger } from '../utils/logger';
import { createHmac } from 'crypto';

declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    serviceId?: string;
    isService?: boolean;
  }
}

// Service authentication hook
const authenticateService = async (request: any, _reply: any) => {
  const svcId = request.headers['x-svc-id'] as string;
  const signature = request.headers['x-svc-sign'] as string;

  if (!svcId || !signature) {
    return; // No service authentication attempted
  }

  // In a real app, you would validate the service ID and signature against a database
  const isValidSignature = (id: string, sig: string) => {
    if (id !== config.SVC_ID) return false;
    const expectedSig = createHmac('sha256', config.SVC_SECRET)
      .update(request.raw.body || '')
      .digest('hex');
    return sig === expectedSig;
  };

  if (!isValidSignature(svcId, signature)) {
    throw new Error('Invalid service credentials');
  }

  request.serviceId = svcId;
  request.isService = true;
};

// JWT authentication hook
const authenticateJWT = async (request: any, _reply: any) => {
  try {
    // Skip authentication for public routes
    if (request.routerPath === '/healthz' || request.routerPath === '/v1/status') {
      return;
    }

    // Check for service authentication first
    if (request.headers['x-svc-id']) {
      await request.jwtVerify();
      return;
    }

    // Then check for JWT authentication
    await request.jwtVerify();
    request.userId = request.user.id;
  } catch (err) {
    logger.warn({ error: err }, 'Authentication failed');
    throw err;
  }
};

// Authorization hook
const authorize = (roles: string[]) => {
  return async (request: any, _reply: any) => {
    if (request.isService) return; // Service accounts bypass role checks

    if (!request.user) {
      throw new Error('Not authenticated');
    }

    const userRoles = request.user.roles || [];
    const hasRole = roles.some(role => userRoles.includes(role));

    if (!hasRole) {
      throw new Error('Insufficient permissions');
    }
  };
};

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Add auth decorators
  fastify.decorate('authenticate', authenticateJWT);
  fastify.decorate('authorize', authorize);
  fastify.decorate('authenticateService', authenticateService);

  // Add preHandler hooks
  fastify.addHook('preHandler', async (request, reply) => {
    // Try service auth first
    try {
      await authenticateService(request, reply);
    } catch (err) {
      // If service auth fails, try JWT auth
      if (!request.isService) {
        await authenticateJWT(request, reply).catch(() => {
          // If both auth methods fail, return 401
          reply.status(401).send({ error: 'Unauthorized' });
        });
      } else {
        throw err;
      }
    }
  });
};

export { authPlugin };
export default fp(authPlugin, {
  name: 'auth-plugin',
  fastify: '4.x',
});
