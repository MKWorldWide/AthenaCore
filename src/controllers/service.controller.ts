import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { config } from '../config';

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  baseUrl: z.string().url('Invalid URL').min(1, 'Base URL is required'),
  healthCheckPath: z.string().default('/healthz'),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
  tags: z.array(z.string()).default([]),
  rateLimit: z.object({
    windowMs: z.number().int().min(1000).default(60000), // 1 minute
    max: z.number().int().min(1).default(100), // 100 requests per window
  }).optional(),
});

type ServiceInput = z.infer<typeof serviceSchema>;

class ServiceController {
  // List all services with optional filtering
  async listServices(request: FastifyRequest, reply: FastifyReply) {
    const { 
      tag, 
      isActive, 
      limit = 50, 
      offset = 0 
    } = request.query as {
      tag?: string;
      isActive?: boolean;
      limit?: number;
      offset?: number;
    };

    // Only admins can list all services
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const where: any = {};
    
    if (tag) {
      where.tags = {
        has: tag
      };
    }
    
    if (isActive !== undefined) {
      where.isActive = isActive === true;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { name: 'asc' },
        take: Math.min(limit, 100), // Cap at 100 services per page
        skip: offset,
        select: {
          id: true,
          name: true,
          description: true,
          baseUrl: true,
          healthCheckPath: true,
          isActive: true,
          tags: true,
          lastHealthCheck: true,
          lastHealthCheckStatus: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.service.count({ where }),
    ]);

    return {
      services,
      pagination: {
        total,
        limit: Math.min(limit, 100),
        offset,
      },
    };
  }

  // Get service by ID
  async getServiceById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Only admins can view service details
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Don't return the service key in the response
    const { serviceKey: _, ...result } = service;
    
    return { service: result };
  }

  // Get service by name
  async getServiceByName(
    request: FastifyRequest<{ Params: { name: string } }>,
    reply: FastifyReply
  ) {
    const { name } = request.params;

    const service = await prisma.service.findFirst({
      where: { name },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Only admins can view service details
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Don't return the service key in the response
    const { serviceKey: _, ...result } = service;
    
    return { service: result };
  }

  // Create a new service
  async createService(
    request: FastifyRequest<{ Body: Omit<ServiceInput, 'serviceKey' | 'createdBy' | 'updatedBy'> }>,
    reply: FastifyReply
  ) {
    // Only admins can create services
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const serviceData = request.body;
    
    // Check if service with same name already exists
    const existingService = await prisma.service.findFirst({
      where: { name: serviceData.name },
    });

    if (existingService) {
      throw new ValidationError(`Service with name '${serviceData.name}' already exists`);
    }

    // Validate input
    const validatedData = serviceSchema.parse(serviceData);

    // Generate a service key
    const serviceKey = this.generateServiceKey();

    // Create service
    const service = await prisma.service.create({
      data: {
        ...validatedData,
        serviceKey,
        createdBy: request.user.userId,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ serviceId: service.id, name: service.name, createdBy: request.user.userId }, 'Service created');
    
    // Return the service with the key (only on creation)
    return { 
      service: {
        ...service,
        serviceKey, // Only returned on creation
      },
    };
  }

  // Update service
  async updateService(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: Partial<Omit<ServiceInput, 'serviceKey' | 'createdBy' | 'updatedBy'>> 
    }>,
    reply: FastifyReply
  ) {
    // Only admins can update services
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;
    const serviceData = request.body;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      throw new NotFoundError('Service not found');
    }

    // Validate input
    const validatedData = serviceSchema.partial().parse(serviceData);

    // If updating the name, check for conflicts
    if (validatedData.name && validatedData.name !== existingService.name) {
      const nameConflict = await prisma.service.findFirst({
        where: { 
          name: validatedData.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ValidationError(`Service with name '${validatedData.name}' already exists`);
      }
    }

    // Update service
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        ...validatedData,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ serviceId: updatedService.id, name: updatedService.name, updatedBy: request.user.userId }, 'Service updated');
    
    // Don't return the service key in the response
    const { serviceKey: _, ...result } = updatedService;
    
    return { 
      service: result,
    };
  }

  // Delete service
  async deleteService(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can delete services
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Delete service
    await prisma.service.delete({
      where: { id },
    });

    logger.info({ serviceId: id, name: service.name, deletedBy: request.user.userId }, 'Service deleted');
    
    reply.code(204).send();
  }

  // Regenerate service key
  async regenerateServiceKey(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can regenerate service keys
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Generate new service key
    const newServiceKey = this.generateServiceKey();

    // Update service with new key
    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        serviceKey: newServiceKey,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ serviceId: id, name: service.name, updatedBy: request.user.userId }, 'Service key regenerated');
    
    return { 
      service: {
        ...updatedService,
        serviceKey: newServiceKey, // Only returned on regeneration
      },
    };
  }

  // Check service health
  async checkServiceHealth(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id },
    });

    if (!service) {
      throw new NotFoundError('Service not found');
    }

    // Only admins can check service health
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const healthCheckUrl = new URL(service.healthCheckPath, service.baseUrl).toString();
    
    try {
      const response = await fetch(healthCheckUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'AthenaCore/1.0',
        },
        timeout: 5000, // 5 second timeout
      });

      const isHealthy = response.ok;
      const status = response.status;
      const statusText = response.statusText;
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { message: 'Non-JSON response' };
      }

      // Update service health status
      await prisma.service.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          lastHealthCheckStatus: isHealthy ? 'healthy' : 'unhealthy',
        },
      });

      return {
        healthy: isHealthy,
        status,
        statusText,
        data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // Update service health status
      await prisma.service.update({
        where: { id },
        data: {
          lastHealthCheck: new Date(),
          lastHealthCheckStatus: 'unreachable',
        },
      });

      logger.error({ error, serviceId: id, name: service.name }, 'Service health check failed');
      
      return {
        healthy: false,
        status: 0,
        statusText: 'Unreachable',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Generate a secure service key
  private generateServiceKey(): string {
    return sign(
      { 
        jti: uuidv4(),
        iat: Math.floor(Date.now() / 1000),
      },
      config.JWT_SECRET,
      { expiresIn: '365d' } // Long-lived key, but can be rotated
    );
  }
}

export const serviceController = new ServiceController();
