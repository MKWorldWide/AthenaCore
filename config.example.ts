/**
 * Example configuration file
 * Copy this file to config.ts and update with your values
 */

export const config = {
  // Server configuration
  NODE_ENV: 'development',
  PORT: 3000,
  
  // AWS configuration
  AWS_REGION: 'us-east-1',
  AWS_ACCESS_KEY_ID: 'your-aws-access-key',
  AWS_SECRET_ACCESS_KEY: 'your-aws-secret-key',
  
  // Quantum service configuration
  QUANTUM_SERVICE_ENDPOINT: 'https://your-quantum-service.com/api',
  QUANTUM_SERVICE_API_KEY: 'your-quantum-service-api-key',
  
  // Logging
  LOG_LEVEL: 'info',
} as const;
