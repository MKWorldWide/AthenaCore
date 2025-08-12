import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/prisma';
import { logger } from '../utils/logger';
import { AuthorizationError, NotFoundError, ValidationError } from '../plugins/error-handler';
import { hash } from 'bcryptjs';

export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  roles: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

type UserInput = z.infer<typeof userSchema>;

class UserController {
  // List all users (admin only)
  async listUsers(request: FastifyRequest, reply: FastifyReply) {
    // Check if user has admin role
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { users };
  }

  // Get user by ID
  async getUserById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const isAdmin = request.user?.roles?.includes('admin');
    
    // Users can only view their own profile unless they're an admin
    if (request.user?.userId !== id && !isAdmin) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return { user };
  }

  // Create a new user (admin only)
  async createUser(
    request: FastifyRequest<{ Body: UserInput & { password?: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can create users
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { password, ...userData } = request.body;
    
    // Validate input
    const validatedData = userSchema.parse(userData);
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email },
    });

    if (existingUser) {
      throw new ValidationError('Email already in use');
    }

    // Hash password if provided
    const hashedPassword = password ? await hash(password, 10) : undefined;

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword || '', // In a real app, you might want to handle this differently
      },
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info({ userId: user.id, adminId: request.user.userId }, 'User created');
    
    reply.code(201);
    return { user };
  }

  // Update user
  async updateUser(
    request: FastifyRequest<{ Params: { id: string }; Body: Partial<UserInput> }>,
    reply: FastifyReply
  ) {
    const { id } = request.params;
    const isAdmin = request.user?.roles?.includes('admin');
    
    // Users can only update their own profile unless they're an admin
    if (request.user?.userId !== id && !isAdmin) {
      throw new AuthorizationError('Insufficient permissions');
    }

    // Only admins can update roles
    if (request.body.roles && !isAdmin) {
      throw new AuthorizationError('Insufficient permissions to update roles');
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Validate input
    const validatedData = userSchema.partial().parse(request.body);

    // Update user
    const user = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        email: true,
        name: true,
        roles: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info({ userId: user.id, updatedBy: request.user.userId }, 'User updated');
    
    return { user };
  }

  // Delete user (admin only)
  async deleteUser(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ) {
    // Only admins can delete users
    if (!request.user?.roles?.includes('admin')) {
      throw new AuthorizationError('Insufficient permissions');
    }

    const { id } = request.params;

    // Prevent deleting self
    if (request.user.userId === id) {
      throw new ValidationError('Cannot delete your own account');
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Delete user
    await prisma.user.delete({
      where: { id },
    });

    logger.info({ userId: id, deletedBy: request.user.userId }, 'User deleted');
    
    reply.code(204).send();
  }
}

export const userController = new UserController();
