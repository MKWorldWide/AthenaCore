import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'dev'}`),
});

interface Config {
  // Server configuration
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: number;
  
  // AWS configuration
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_SESSION_TOKEN?: string;
  
  // Quantum service configuration
  QUANTUM_SERVICE_ENDPOINT?: string;
  QUANTUM_SERVICE_API_KEY?: string;
  
  // Logging
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'http' | 'verbose' | 'debug' | 'silly';
}

// Default configuration
const defaultConfig: Partial<Config> = {
  NODE_ENV: 'development',
  PORT: 3000,
  LOG_LEVEL: 'info',
};

// Parse environment variables with defaults
const config: Config = {
  NODE_ENV: (process.env.NODE_ENV as Config['NODE_ENV']) || 'development',
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  AWS_REGION: process.env.AWS_REGION || 'us-east-1',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_SESSION_TOKEN: process.env.AWS_SESSION_TOKEN,
  QUANTUM_SERVICE_ENDPOINT: process.env.QUANTUM_SERVICE_ENDPOINT,
  QUANTUM_SERVICE_API_KEY: process.env.QUANTUM_SERVICE_API_KEY,
  LOG_LEVEL: (process.env.LOG_LEVEL as Config['LOG_LEVEL']) || 'info',
};

// Apply defaults
Object.keys(defaultConfig).forEach((key) => {
  if (config[key as keyof Config] === undefined) {
    // @ts-ignore
    config[key] = defaultConfig[key as keyof typeof defaultConfig];
  }
});

export default config;
