import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { sign } from 'jsonwebtoken';
import { config } from '../config';

const webhookSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL').min(1, 'URL is required'),
  description: z.string().optional(),
  events: z.array(z.string()).min(1, 'At least one event type is required'),
  secret: z.string().optional(),
  isActive: z.boolean().default(true),
  headers: z.record(z.string()).optional(),
  retryCount: z.number().int().min(0).default(3),
  retryDelay: z.number().int().min(0).default(5000), // 5 seconds
  timeout: z.number().int().min(1000).default(10000), // 10 seconds
});

type WebhookInput = z.infer<typeof webhookSchema>;

class WebhookController {
  // List all webhooks
  async listWebhooks(request: FastifyRequest, reply: FastifyReply) {
    // Only admins can list all webhooks
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const webhooks = await prisma.webhook.findMany({
      orderBy: { name: 'asc' },
    });

    return { webhooks };
  }

  // Get webhook by ID
  async getWebhookById(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;

    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    // Only admins can view webhook details
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    return { webhook };
  }

  // Create a new webhook
  async createWebhook(
    request: FastifyRequest<{ Body: Omit<WebhookInput, 'isActive'> }>,
    reply: FastifyReply
  ) {
    // Only admins can create webhooks
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const webhookData = request.body;
    
    // Validate input
    const validatedData = webhookSchema.parse({
      ...webhookData,
      isActive: true, // Default to active
    });

    // Generate a secret if not provided
    const secret = validatedData.secret || this.generateSecret();

    // Create webhook
    const webhook = await prisma.webhook.create({
      data: {
        ...validatedData,
        secret,
        createdBy: request.user.userId,
      },
    });

    logger.info({ webhookId: webhook.id, createdBy: request.user.userId }, 'Webhook created');
    
    reply.code(201);
    return { 
      webhook: {
        ...webhook,
        secret, // Only return the secret on creation
      } 
    };
  }

  // Update webhook
  async updateWebhook(
    request: FastifyRequest<{ 
      Params: { id: string }; 
      Body: Partial<Omit<WebhookInput, 'secret'>> 
    }>,
    reply: FastifyReply
  ) {
    // Only admins can update webhooks
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;
    const webhookData = request.body;

    // Check if webhook exists
    const existingWebhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!existingWebhook) {
      throw new NotFoundError('Webhook not found');
    }

    // Validate input
    const validatedData = webhookSchema.partial().parse(webhookData);

    // Update webhook
    const webhook = await prisma.webhook.update({
      where: { id },
      data: {
        ...validatedData,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ webhookId: webhook.id, updatedBy: request.user.userId }, 'Webhook updated');
    
    return { webhook };
  }

  // Delete webhook
  async deleteWebhook(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can delete webhooks
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    // Delete webhook
    await prisma.webhook.delete({
      where: { id },
    });

    logger.info({ webhookId: id, deletedBy: request.user.userId }, 'Webhook deleted');
    
    reply.code(204).send();
  }

  // Regenerate webhook secret
  async regenerateSecret(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can regenerate secrets
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    // Generate new secret
    const newSecret = this.generateSecret();

    // Update webhook with new secret
    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: {
        secret: newSecret,
        updatedBy: request.user.userId,
      },
    });

    logger.info({ webhookId: id, updatedBy: request.user.userId }, 'Webhook secret regenerated');
    
    return { 
      webhook: {
        ...updatedWebhook,
        secret: newSecret, // Only return the new secret on regeneration
      } 
    };
  }

  // Test webhook delivery
  async testWebhook(
    request: FastifyRequest<{ 
      Params: { id: string };
      Body?: {
        payload?: Record<string, any>;
        eventType?: string;
      };
    }>,
    reply: FastifyReply
  ) {
    // Only admins can test webhooks
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;
    const { payload = { test: true }, eventType = 'test.event' } = request.body || {};

    // Check if webhook exists
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    });

    if (!webhook) {
      throw new NotFoundError('Webhook not found');
    }

    if (!webhook.isActive) {
      throw new ValidationError('Webhook is not active');
    }

    // Create a test delivery
    const deliveryId = uuidv4();
    const timestamp = new Date().toISOString();
    const signature = this.signWebhookPayload(webhook.secret, payload, timestamp);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Webhook-Id': webhook.id,
      'X-Webhook-Event': eventType,
      'X-Webhook-Timestamp': timestamp,
      'X-Webhook-Signature': signature,
      'User-Agent': 'AthenaCore/1.0',
      ...webhook.headers,
    };

    // Make the webhook request
    try {
      const response = await axios({
        method: 'POST',
        url: webhook.url,
        headers,
        data: {
          event: eventType,
          id: deliveryId,
          timestamp,
          data: payload,
        },
        timeout: webhook.timeout,
        validateStatus: () => true, // Always resolve, even on error status codes
      });

      // Log the delivery
      await this.logWebhookDelivery(webhook, {
        id: deliveryId,
        event: eventType,
        statusCode: response.status,
        request: {
          headers,
          body: {
            event: eventType,
            id: deliveryId,
            timestamp,
            data: payload,
          },
        },
        response: {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
        },
        success: response.status >= 200 && response.status < 300,
        error: response.status >= 400 ? response.statusText : null,
      }, request.user.userId);

      return { 
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers,
      };
    } catch (error) {
      // Log the failed delivery
      await this.logWebhookDelivery(webhook, {
        id: deliveryId,
        event: eventType,
        statusCode: 0,
        request: {
          headers,
          body: {
            event: eventType,
            id: deliveryId,
            timestamp,
            data: payload,
          },
        },
        response: null,
        success: false,
        error: error.message,
        stack: error.stack,
      }, request.user.userId);

      throw new Error(`Webhook delivery failed: ${error.message}`);
    }
  }

  // Helper to log webhook deliveries
  private async logWebhookDelivery(
    webhook: any,
    delivery: {
      id: string;
      event: string;
      statusCode: number;
      request: any;
      response: any;
      success: boolean;
      error?: string | null;
      stack?: string;
    },
    userId: string
  ) {
    try {
      await prisma.webhookDelivery.create({
        data: {
          id: delivery.id,
          webhookId: webhook.id,
          event: delivery.event,
          statusCode: delivery.statusCode,
          request: delivery.request,
          response: delivery.response,
          success: delivery.success,
          error: delivery.error,
          createdBy: userId,
        },
      });

      // Log the delivery
      const logContext = {
        webhookId: webhook.id,
        deliveryId: delivery.id,
        event: delivery.event,
        statusCode: delivery.statusCode,
        success: delivery.success,
        url: webhook.url,
        userId,
      };

      if (delivery.success) {
        logger.info(logContext, 'Webhook delivery succeeded');
      } else {
        logger.error(
          { ...logContext, error: delivery.error },
          'Webhook delivery failed'
        );
      }
    } catch (error) {
      logger.error(
        { error, webhookId: webhook?.id, deliveryId: delivery?.id },
        'Failed to log webhook delivery'
      );
    }
  }

  // Helper to generate a secure webhook secret
  private generateSecret(): string {
    return sign(
      { id: uuidv4(), timestamp: Date.now() },
      config.JWT_SECRET,
      { expiresIn: '10y' }
    );
  }

  // Helper to sign webhook payload
  private signWebhookPayload(secret: string, payload: any, timestamp: string): string {
    const hmac = require('crypto').createHmac('sha256', secret);
    const signature = hmac.update(`${timestamp}.${JSON.stringify(payload)}`).digest('hex');
    return `sha256=${signature}`;
  }
}

export const webhookController = new WebhookController();
