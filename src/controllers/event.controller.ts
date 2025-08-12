import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';

export const eventSchema = z.object({
  type: z.string().min(1, 'Event type is required'),
  entityType: z.string().min(1, 'Entity type is required'),
  entityId: z.string().min(1, 'Entity ID is required'),
  metadata: z.record(z.any()).optional(),
  severity: z.enum(['debug', 'info', 'warn', 'error', 'critical']).default('info'),
  source: z.string().optional(),
});

type EventInput = z.infer<typeof eventSchema>;

class EventController {
  // List all events with optional filtering
  async listEvents(request: FastifyRequest, reply: FastifyReply) {
    const { 
      type, 
      entityType, 
      entityId, 
      severity,
      startDate,
      endDate,
      limit = 50, 
      offset = 0 
    } = request.query as {
      type?: string;
      entityType?: string;
      entityId?: string;
      severity?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    };

    // Only admins can view all events
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const where: any = {};
    
    if (type) where.type = type;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;
    if (severity) where.severity = severity;
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 1000), // Cap at 1000 events
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: {
        total,
        limit: Math.min(limit, 1000),
        offset,
      },
    };
  }

  // Get event by ID
  async getEventById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Only admins or the event creator can view the event
    if (!request.user?.roles?.includes('admin') && event.createdBy !== request.user?.userId) {
      throw new AuthorizationError('Insufficient permissions');
    }

    return { event };
  }

  // Create a new event
  async createEvent(
    request: FastifyRequest<{ Body: Omit<EventInput, 'createdBy' | 'source'> }>,
    reply: FastifyReply
  ) {
    // Only admins or services can create events
    if (!request.user?.roles?.includes('admin') && !request.isService) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const eventData = request.body;
    
    // Validate input
    const validatedData = eventSchema.parse({
      ...eventData,
      source: request.isService ? 'service' : 'api',
    });

    // Create event
    const event = await prisma.event.create({
      data: {
        ...validatedData,
        createdBy: request.user?.userId || 'system',
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    // Log the event based on severity
    const logContext = {
      eventId: event.id,
      type: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      userId: event.createdBy,
    };

    switch (event.severity) {
      case 'error':
      case 'critical':
        logger.error(logContext, event.message || 'Event occurred');
        break;
      case 'warn':
        logger.warn(logContext, event.message || 'Event occurred');
        break;
      case 'debug':
        logger.debug(logContext, event.message || 'Event occurred');
        break;
      case 'info':
      default:
        logger.info(logContext, event.message || 'Event occurred');
        break;
    }

    reply.code(201);
    return { event };
  }

  // Delete events older than a certain date (admin only)
  async cleanupEvents(
    request: FastifyRequest<{ 
      Body: { 
        olderThanDays: number;
        types?: string[];
        entityTypes?: string[];
      } 
    }>,
    reply: FastifyReply
  ) {
    // Only admins can cleanup events
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { olderThanDays, types, entityTypes } = request.body;
    
    if (olderThanDays < 1) {
      throw new ValidationError('Must keep at least 1 day of events');
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const where: any = {
      createdAt: {
        lt: cutoffDate,
      },
    };

    if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (entityTypes && entityTypes.length > 0) {
      where.entityType = { in: entityTypes };
    }

    // Get count before deletion for logging
    const count = await prisma.event.count({ where });

    // Delete events in batches to avoid timeouts
    const BATCH_SIZE = 1000;
    let deletedCount = 0;
    let hasMore = true;

    while (hasMore) {
      const eventsToDelete = await prisma.event.findMany({
        where,
        select: { id: true },
        take: BATCH_SIZE,
        orderBy: { createdAt: 'asc' },
      });

      if (eventsToDelete.length === 0) {
        hasMore = false;
        break;
      }

      const ids = eventsToDelete.map((e) => e.id);
      
      await prisma.event.deleteMany({
        where: { id: { in: ids } },
      });

      deletedCount += eventsToDelete.length;

      // Small delay to prevent database overload
      if (eventsToDelete.length === BATCH_SIZE) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info({
      deletedCount,
      olderThanDays,
      types,
      entityTypes,
      performedBy: request.user.userId,
    }, 'Cleaned up old events');

    return { 
      deleted: deletedCount,
      olderThan: cutoffDate,
    };
  }
}

export const eventController = new EventController();
