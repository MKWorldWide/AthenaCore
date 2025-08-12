import { z } from 'zod';
import dotenvFlow from 'dotenv-flow';

// Load environment variables from .env files
dotenvFlow.config({
  node_env: process.env.NODE_ENV || 'development',
  default_node_env: 'development',
  silent: true,
  path: process.cwd(),
});

// Define the schema for environment variables
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4001),
  HOST: z.string().default('0.0.0.0'),
  
  // Database
  DATABASE_URL: z.string().min(1, 'Database URL is required'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT secret must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Service Authentication
  SVC_ID: z.string().default('athena-core'),
  SVC_SECRET: z.string().min(32, 'Service secret must be at least 32 characters'),
  
  // CORS
  CORS_ORIGIN: z.string().default('*'),
  
  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  LOG_PRETTY: z.enum(['true', 'false']).default('false').transform(v => v === 'true'),
  
  // OpenTelemetry
  OTEL_SERVICE_NAME: z.string().default('athena-core'),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_TIME_WINDOW: z.coerce.number().default(60), // in seconds
  
  // Webhooks
  WEBHOOK_TIMEOUT: z.coerce.number().default(5000), // in ms
  WEBHOOK_MAX_RETRIES: z.coerce.number().default(3),
  
  // Email (optional)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('noreply@example.com'),
  
  // Feature Flags
  ENABLE_OPENAPI: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
  ENABLE_SWAGGER_UI: z.enum(['true', 'false']).default('true').transform(v => v === 'true'),
});

// Parse environment variables
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Export the validated config
export const config = parsed.data;

export default config;
