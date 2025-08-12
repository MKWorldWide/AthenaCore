import { FastifyRequest, FastifyReply } from 'fastify';
import { compare, hash } from 'bcryptjs';
import { sign } from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthenticationError, ValidationError } from '../plugins/error-handler';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  name: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    roles: string[];
  };
}

class AuthController {
  async login(request: FastifyRequest<{ Body: LoginInput }>, reply: FastifyReply) {
    const { email, password } = request.body;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Generate JWT token
    const token = this.generateToken(user);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log successful login
    logger.info({ userId: user.id, email: user.email }, 'User logged in');

    // Return token and user info
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 60 * 60 * 24 * 7, // 7 days in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    } satisfies TokenResponse;
  }

  async register(request: FastifyRequest<{ Body: RegisterInput }>, reply: FastifyReply) {
    const { email, password, name } = request.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ValidationError('Email already in use');
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        roles: ['user'], // Default role
      },
    });

    // Generate token
    const token = this.generateToken(user);

    // Log registration
    logger.info({ userId: user.id, email: user.email }, 'New user registered');

    // Return token and user info
    return {
      access_token: token,
      token_type: 'Bearer',
      expires_in: 60 * 60 * 24 * 7, // 7 days in seconds
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
    } satisfies TokenResponse;
  }

  async me(request: FastifyRequest, reply: FastifyReply) {
    if (!request.user) {
      throw new AuthenticationError('Not authenticated');
    }

    const user = await prisma.user.findUnique({
      where: { id: request.user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return { user };
  }

  private generateToken(user: { id: string; email: string; roles: string[] }) {
    return sign(
      {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      config.JWT_SECRET,
      {
        expiresIn: config.JWT_EXPIRES_IN,
      }
    );
  }
}

export const authController = new AuthController();
