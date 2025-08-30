import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import fp from 'fastify-plugin';
import { logger } from '../utils/logger';
import { createHmac } from 'crypto';

// Extend the Fastify types to include our custom properties
declare module 'fastify' {
  interface FastifyRequest {
    userId?: string;
    serviceId?: string;
    isService?: boolean;
  }

  // Extend the JWT type to include our user properties
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      roles: string[];
    };
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// Service authentication hook
const authenticateService = async (request: FastifyRequest, _reply: FastifyReply) => {
  const svcId = request.headers['x-svc-id'] as string;
  const signature = request.headers['x-svc-sign'] as string;

  if (!svcId || !signature) {
    return; // No service authentication attempted
  }

  // Validate service ID and signature
  const isValidSignature = (id: string, sig: string) => {
    if (id !== config.auth.serviceId) return false;
    const expectedSig = createHmac('sha256', config.auth.serviceSecret)
      .update(JSON.stringify((request as any).body) || '')
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
const authenticateJWT = async (request: FastifyRequest, _reply: FastifyReply) => {
  // Skip authentication for public routes
  if (request.routerPath === '/healthz' || request.routerPath === '/v1/status') {
    return;
  }

  // Check for service authentication first
  if (request.headers['x-svc-id']) {
    await authenticateService(request, _reply);
    return;
  }

  try {
    // Verify JWT token and get the payload
    const payload = await request.jwtVerify<{ user: { id: string; email: string; roles: string[] } }>();
    
    // Set user ID from the verified JWT payload
    if (payload?.user?.id) {
      request.userId = payload.user.id;
      // The user property is automatically typed through FastifyJWT
    }
  } catch (err) {
    logger.warn({ error: err }, 'Authentication failed');
    throw err;
  }
};

// Authorization hook
const authorize = (roles: string[]) => {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (request.isService) return; // Service accounts bypass role checks

    try {
      // Verify JWT and get the user roles
      const payload = await request.jwtVerify<{ user: { roles: string[] } }>();
      
      if (!payload?.user) {
        throw new Error('Not authenticated');
      }

      const userRoles = payload.user.roles || [];
      const hasRole = roles.length === 0 || roles.some(role => userRoles.includes(role));

      if (!hasRole) {
        throw new Error('Insufficient permissions');
      }
    } catch (error) {
      // Re-throw with a more specific error if needed
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Authentication failed');
    }
  };
};

const authPlugin: FastifyPluginAsync = async (fastify) => {
  // Add authenticate and authorize methods to fastify instance
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await authenticateJWT(request, reply);
    } catch (err) {
      reply.status(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.decorate('authorize', (roles: string[]) => 
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await authorize(roles)(request, reply);
      } catch (err) {
        reply.status(403).send({ error: 'Forbidden' });
      }
    }
  );

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
