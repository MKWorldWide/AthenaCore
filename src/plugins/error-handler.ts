import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

// Custom error classes
export class AuthenticationError extends Error {
  statusCode = 401;
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  statusCode = 403;
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class ValidationError extends Error {
  statusCode = 400;
  constructor(message = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  statusCode = 404;
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends Error {
  statusCode = 429;
  constructor(message = 'Too many requests') {
    super(message);
    this.name = 'RateLimitError';
  }
}

// Error handler function
export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  // Log the error
  const logContext = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    request: {
      id: request.id,
      method: request.method,
      url: request.url,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    },
  };

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError('Validation error');
    validationError.statusCode = 400;
    error = validationError;
    logContext.error.details = error.errors;
  }

  // Log the error with appropriate level
  if (error.statusCode && error.statusCode >= 500) {
    logger.error(logContext, 'Server error');
  } else if (error.statusCode === 404) {
    logger.debug(logContext, 'Not found');
  } else if (error.statusCode === 401 || error.statusCode === 403) {
    logger.warn(logContext, 'Authentication/Authorization error');
  } else if (error.statusCode === 400 || error.statusCode === 422) {
    logger.info(logContext, 'Client error');
  } else {
    logger.error(logContext, 'Unhandled error');
  }

  // Send error response
  const statusCode = error.statusCode || 500;
  const response = {
    statusCode,
    error: error.name || 'InternalServerError',
    message: statusCode >= 500 ? 'Internal Server Error' : error.message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: error.stack,
      ...(error instanceof ZodError && { details: error.errors }),
    }),
  };

  reply.status(statusCode).send(response);
};

// Type augmentation for Fastify
declare module 'fastify' {
  interface FastifyInstance {
    errors: {
      AuthenticationError: typeof AuthenticationError;
      AuthorizationError: typeof AuthorizationError;
      ValidationError: typeof ValidationError;
      NotFoundError: typeof NotFoundError;
      RateLimitError: typeof RateLimitError;
    };
  }
}
