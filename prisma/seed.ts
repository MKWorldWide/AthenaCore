import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { config } from '../src/config';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('Starting database seeding...');

  // Create default admin user if not exists
  const adminEmail = 'admin@example.com';
  const adminPassword = await hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: adminPassword,
      roles: ['admin', 'user'],
    },
  });

  // Create default service if not exists
  const service = await prisma.service.upsert({
    where: { name: 'athena-core' },
    update: {},
    create: {
      name: 'athena-core',
      description: 'AthenaCore API Service',
      baseUrl: `http://localhost:${config.PORT}`,
      apiKey: await hash(config.SVC_SECRET, 10),
    },
  });

  // Create some sample intents
  const intents = [
    {
      name: 'greet',
      match: '^(hi|hello|hey|greetings)',
      targetService: 'athena-core',
      priority: 1,
      metadata: {
        response: 'Hello! How can I help you today?',
        type: 'greeting',
      },
    },
    {
      name: 'get_help',
      match: 'help|support|assistance',
      targetService: 'athena-core',
      priority: 2,
      metadata: {
        response: 'Here is some help information...',
        type: 'support',
      },
    },
  ];

  for (const intent of intents) {
    await prisma.intent.upsert({
      where: { name: intent.name },
      update: {},
      create: intent,
    });
  }

  logger.info('Database seeded successfully!');
  logger.info(`Admin user: ${admin.email}`);
  logger.info(`Service: ${service.name}`);
}

main()
  .catch((e) => {
    logger.error(e, 'Failed to seed database');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
