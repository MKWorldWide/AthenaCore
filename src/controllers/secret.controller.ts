import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';
import { encrypt, decrypt } from '../utils/crypto';
import { config } from '../config';

const secretSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  isSensitive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
});

type SecretInput = z.infer<typeof secretSchema>;

class SecretController {
  // List all secrets with optional filtering
  async listSecrets(request: FastifyRequest, reply: FastifyReply) {
    const { 
      tag, 
      isSensitive, 
      limit = 50, 
      offset = 0 
    } = request.query as {
      tag?: string;
      isSensitive?: boolean;
      limit?: number;
      offset?: number;
    };

    // Only admins can list all secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const where: any = {};
    
    if (tag) {
      where.tags = {
        has: tag
      };
    }
    
    if (isSensitive !== undefined) {
      where.isSensitive = isSensitive === true;
    }

    const [secrets, total] = await Promise.all([
      prisma.secret.findMany({
        where,
        orderBy: { key: 'asc' },
        take: Math.min(limit, 100), // Cap at 100 secrets per page
        skip: offset,
        select: {
          id: true,
          key: true,
          description: true,
          tags: true,
          isSensitive: true,
          expiresAt: true,
          createdAt: true,
          updatedAt: true,
          createdBy: true,
          updatedBy: true,
        },
      }),
      prisma.secret.count({ where }),
    ]);

    return {
      secrets,
      pagination: {
        total,
        limit: Math.min(limit, 100),
        offset,
      },
    };
  }

  // Get secret by ID
  async getSecretById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const secret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    // Only admins can view secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Decrypt the secret value if it's sensitive and the user has permission
    let decryptedValue = '';
    if (secret.isSensitive) {
      try {
        decryptedValue = decrypt(secret.value, config.ENCRYPTION_KEY);
      } catch (error) {
        logger.error({ error, secretId: secret.id }, 'Failed to decrypt secret value');
        throw new Error('Failed to decrypt secret value');
      }
    } else {
      decryptedValue = secret.value;
    }

    return { 
      secret: {
        ...secret,
        value: decryptedValue,
      } 
    };
  }

  // Get secret by key
  async getSecretByKey(
    request: FastifyRequest<{ Params: { key: string } }>,
    reply: FastifyReply
  ) {
    const { key } = request.params;

    const secret = await prisma.secret.findFirst({
      where: { key },
    });

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    // Only admins can view secrets by key
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Decrypt the secret value if it's sensitive and the user has permission
    let decryptedValue = '';
    if (secret.isSensitive) {
      try {
        decryptedValue = decrypt(secret.value, config.ENCRYPTION_KEY);
      } catch (error) {
        logger.error({ error, secretId: secret.id, key: secret.key }, 'Failed to decrypt secret value');
        throw new Error('Failed to decrypt secret value');
      }
    } else {
      decryptedValue = secret.value;
    }

    return { 
      secret: {
        ...secret,
        value: decryptedValue,
      } 
    };
  }

  // Create a new secret
  async createSecret(
    request: FastifyRequest<{ Body: Omit<SecretInput, 'createdBy' | 'updatedBy'> }>,
    reply: FastifyReply
  ) {
    // Only admins can create secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const secretData = request.body;
    
    // Check if secret with same key already exists
    const existingSecret = await prisma.secret.findFirst({
      where: { key: secretData.key },
    });

    if (existingSecret) {
      throw new ValidationError(`Secret with key '${secretData.key}' already exists`);
    }

    // Validate input
    const validatedData = secretSchema.parse(secretData);

    // Encrypt the secret value if it's sensitive
    let encryptedValue = validatedData.value;
    if (validatedData.isSensitive) {
      try {
        encryptedValue = encrypt(validatedData.value, config.ENCRYPTION_KEY);
      } catch (error) {
        logger.error({ error, key: validatedData.key }, 'Failed to encrypt secret value');
        throw new Error('Failed to encrypt secret value');
      }
    }

    // Create secret
    const secret = await prisma.secret.create({
      data: {
        ...validatedData,
        value: encryptedValue,
        createdBy: request.user.userId,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ secretId: secret.id, key: secret.key, createdBy: request.user.userId }, 'Secret created');
    
    // Don't return the encrypted value in the response
    const { value: _, ...result } = secret;
    
    reply.code(201);
    return { 
      secret: result,
    };
  }

  // Update secret
  async updateSecret(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: Partial<Omit<SecretInput, 'key' | 'createdBy' | 'updatedBy'>> 
    }>,
    reply: FastifyReply
  ) {
    // Only admins can update secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;
    const secretData = request.body;

    // Check if secret exists
    const existingSecret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!existingSecret) {
      throw new NotFoundError('Secret not found');
    }

    // Validate input
    const validatedData = secretSchema.partial().parse(secretData);

    // If updating the value and it's sensitive, encrypt it
    let encryptedValue = validatedData.value;
    if (validatedData.value !== undefined) {
      const isSensitive = validatedData.isSensitive ?? existingSecret.isSensitive;
      if (isSensitive) {
        try {
          encryptedValue = encrypt(validatedData.value, config.ENCRYPTION_KEY);
        } catch (error) {
          logger.error({ error, secretId: existingSecret.id, key: existingSecret.key }, 'Failed to encrypt secret value');
          throw new Error('Failed to encrypt secret value');
        }
      }
    }

    // Update secret
    const updatedSecret = await prisma.secret.update({
      where: { id },
      data: {
        ...validatedData,
        ...(encryptedValue && { value: encryptedValue }),
        updatedBy: request.user.userId,
      },
    });

    logger.info({ secretId: updatedSecret.id, key: updatedSecret.key, updatedBy: request.user.userId }, 'Secret updated');
    
    // Don't return the encrypted value in the response
    const { value: _, ...result } = updatedSecret;
    
    return { 
      secret: result,
    };
  }

  // Delete secret
  async deleteSecret(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can delete secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if secret exists
    const secret = await prisma.secret.findUnique({
      where: { id },
    });

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    // Delete secret
    await prisma.secret.delete({
      where: { id },
    });

    logger.info({ secretId: id, key: secret.key, deletedBy: request.user.userId }, 'Secret deleted');
    
    reply.code(204).send();
  }

  // Get secret value by key (for services)
  async getSecretValue(
    request: FastifyRequest<{ 
      Params: { key: string }; 
      Headers: { 'x-service-key': string } 
    }>,
    reply: FastifyReply
  ) {
    const { key } = request.params;
    const serviceKey = request.headers['x-service-key'];

    // Verify service key
    if (!serviceKey) {
      throw new AuthorizationError('Service key is required');
    }

    // In a real implementation, you would validate the service key against your service registry
    // For now, we'll just check if it's not empty
    if (serviceKey !== config.SERVICE_KEY) {
      throw new AuthorizationError('Invalid service key');
    }

    const secret = await prisma.secret.findFirst({
      where: { key },
    });

    if (!secret) {
      throw new NotFoundError('Secret not found');
    }

    // Decrypt the secret value if it's sensitive
    let decryptedValue = '';
    if (secret.isSensitive) {
      try {
        decryptedValue = decrypt(secret.value, config.ENCRYPTION_KEY);
      } catch (error) {
        logger.error({ error, secretId: secret.id, key: secret.key }, 'Failed to decrypt secret value');
        throw new Error('Failed to decrypt secret value');
      }
    } else {
      decryptedValue = secret.value;
    }

    return { 
      key: secret.key,
      value: decryptedValue,
      isSensitive: secret.isSensitive,
    };
  }
}

export const secretController = new SecretController();
