import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';

export const intentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  match: z.string().min(1, 'Match pattern is required'),
  targetService: z.string().min(1, 'Target service is required'),
  priority: z.number().int().min(1).default(1),
  isActive: z.boolean().default(true),
  metadata: z.record(z.any()).optional(),
});

type IntentInput = z.infer<typeof intentSchema>;

class IntentController {
  // List all intents
  async listIntents(request: FastifyRequest, reply: FastifyReply) {
    const { search, service, activeOnly = 'true' } = request.query as {
      search?: string;
      service?: string;
      activeOnly?: string;
    };

    const isActive = activeOnly === 'true';

    const intents = await prisma.intent.findMany({
      where: {
        ...(search && {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
          ],
        }),
        ...(service && { targetService: service }),
        ...(isActive && { isActive: true }),
      },
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
    });

    return { intents };
  }

  // Get intent by ID
  async getIntentById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const intent = await prisma.intent.findUnique({
      where: { id },
    });

    if (!intent) {
      throw new NotFoundError('Intent not found');
    }

    return { intent };
  }

  // Create a new intent
  async createIntent(
    request: FastifyRequest<{ Body: Omit<IntentInput, 'isActive'> }>,
    reply: FastifyReply
  ) {
    // Only admins can create intents
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const intentData = request.body;

    // Check if intent with same name already exists
    const existingIntent = await prisma.intent.findFirst({
      where: { name: intentData.name },
    });

    if (existingIntent) {
      throw new ValidationError('Intent with this name already exists');
    }

    // Create intent
    const intent = await prisma.intent.create({
      data: {
        ...intentData,
        createdBy: request.user.userId,
      },
    });

    logger.info({ intentId: intent.id, userId: request.user.userId }, 'Intent created');
    
    reply.code(201);
    return { intent };
  }

  // Update intent
  async updateIntent(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: Partial<Omit<IntentInput, 'id'>> 
    }>,
    reply: FastifyReply
  ) {
    // Only admins can update intents
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;
    const intentData = request.body;

    // Check if intent exists
    const existingIntent = await prisma.intent.findUnique({
      where: { id },
    });

    if (!existingIntent) {
      throw new NotFoundError('Intent not found');
    }

    // If name is being updated, check for conflicts
    if (intentData.name && intentData.name !== existingIntent.name) {
      const nameExists = await prisma.intent.findFirst({
        where: { name: intentData.name, id: { not: id } },
      });

      if (nameExists) {
        throw new ValidationError('Intent with this name already exists');
      }
    }

    // Update intent
    const intent = await prisma.intent.update({
      where: { id },
      data: {
        ...intentData,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ intentId: intent.id, userId: request.user.userId }, 'Intent updated');
    
    return { intent };
  }

  // Delete intent
  async deleteIntent(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can delete intents
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if intent exists
    const intent = await prisma.intent.findUnique({
      where: { id },
    });

    if (!intent) {
      throw new NotFoundError('Intent not found');
    }

    // Delete intent
    await prisma.intent.delete({
      where: { id },
    });

    logger.info({ intentId: id, userId: request.user.userId }, 'Intent deleted');
    
    reply.code(204).send();
  }

  // Match intent from text
  async matchIntent(
    request: FastifyRequest<{ 
      Body: { 
        text: string; 
        context?: Record<string, any>;
        service?: string;
      } 
    }>,
    reply: FastifyReply
  ) {
    const { text, context = {}, service } = request.body;

    // Get all active intents, optionally filtered by service
    const intents = await prisma.intent.findMany({
      where: {
        isActive: true,
        ...(service && { targetService: service }),
      },
      orderBy: [{ priority: 'asc' }],
    });

    // Find the first matching intent
    for (const intent of intents) {
      try {
        const regex = new RegExp(intent.match, 'i');
        if (regex.test(text)) {
          // Log the match
          await prisma.event.create({
            data: {
              type: 'INTENT_MATCHED',
              entityType: 'Intent',
              entityId: intent.id,
              metadata: {
                text,
                context,
                matchedPattern: intent.match,
                service: intent.targetService,
              },
              createdBy: request.user?.userId || 'system',
            },
          });

          return { 
            match: true, 
            intent: {
              id: intent.id,
              name: intent.name,
              targetService: intent.targetService,
              metadata: intent.metadata,
            },
            context: {
              ...context,
              matchedText: text.match(new RegExp(intent.match, 'i'))?.[0],
            },
          };
        }
      } catch (error) {
        logger.error({ error, intentId: intent.id }, 'Error matching intent');
        continue;
      }
    }

    // No match found
    return { match: false };
  }
}

export const intentController = new IntentController();
