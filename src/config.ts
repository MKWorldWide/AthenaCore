import dotenv from 'dotenv';
import path from 'path';
import { readFileSync } from 'fs';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`),
});

// Read package.json for version info
const pkg = JSON.parse(readFileSync(path.join(process.cwd(), 'package.json'), 'utf-8'));

export interface OTELConfig {
  enabled: boolean;
  serviceName: string;
  endpoint: string;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  ssl: boolean;
}

export interface RedisConfig {
  url: string;
  ttl: number;
  maxRetries: number;
  connectTimeout: number;
  commandTimeout: number;
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  serviceKey: string;
  serviceId: string;
}

export interface ServerConfig {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  host: string;
  baseUrl: string;
  corsOrigins: string[];
  requestTimeout: number;
  rateLimit: {
    windowMs: number;
    max: number;
  };
  buildHash: string;
  version: string;
}

export interface Config {
  // Core
  nodeEnv: 'development' | 'production' | 'test';
  isDev: boolean;
  isProd: boolean;
  isTest: boolean;
  
  // Server
  server: ServerConfig;
  
  // Database
  db: DatabaseConfig;
  
  // Redis
  redis: RedisConfig;
  
  // Auth
  auth: AuthConfig;
  
  // OpenTelemetry
  otel: OTELConfig;
  
  // Package info
  pkg: {
    name: string;
    version: string;
    description: string;
  };
}

// Parse environment variables with defaults
const config: Config = {
  // Core
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
  isDev: process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  
  // Server
  server: {
    nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 4001,
    host: process.env.HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL || 'http://localhost:4001',
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : [],
    requestTimeout: process.env.REQUEST_TIMEOUT ? parseInt(process.env.REQUEST_TIMEOUT, 10) : 30000,
    rateLimit: {
      windowMs: process.env.RATE_LIMIT_WINDOW_MS ? parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) : 15 * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX ? parseInt(process.env.RATE_LIMIT_MAX, 10) : 100,
    },
    buildHash: process.env.BUILD_HASH || 'dev',
    version: pkg.version,
  },
  
  // Database
  db: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/athena',
    maxConnections: process.env.DB_MAX_CONNECTIONS ? parseInt(process.env.DB_MAX_CONNECTIONS, 10) : 10,
    ssl: process.env.DB_SSL === 'true',
  },
  
  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    ttl: process.env.REDIS_TTL ? parseInt(process.env.REDIS_TTL, 10) : 86400, // 1 day
    maxRetries: process.env.REDIS_MAX_RETRIES ? parseInt(process.env.REDIS_MAX_RETRIES, 10) : 3,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT ? parseInt(process.env.REDIS_CONNECT_TIMEOUT, 10) : 10000,
    commandTimeout: process.env.REDIS_COMMAND_TIMEOUT ? parseInt(process.env.REDIS_COMMAND_TIMEOUT, 10) : 5000,
  },
  
  // Auth
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'insecure-jwt-secret',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
    serviceKey: process.env.SERVICE_KEY || 'insecure-service-key',
    serviceId: process.env.SERVICE_ID || 'athena-core',
  },
  
  // OpenTelemetry
  otel: {
    enabled: process.env.OTEL_ENABLED === 'true',
    serviceName: process.env.OTEL_SERVICE_NAME || 'athena-core',
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    logLevel: (process.env.OTEL_LOG_LEVEL as OTELConfig['logLevel']) || 'info',
  },
  
  // Package info
  pkg: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
};

export { config };
