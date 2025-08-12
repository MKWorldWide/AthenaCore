const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing development dependencies...');
try {
  // Install TypeScript and Node.js type definitions
  execSync('pnpm add -D typescript @types/node dotenv', { stdio: 'inherit' });
  
  // Install OpenTelemetry packages
  console.log('Installing OpenTelemetry packages...');
  execSync('pnpm add @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions @opentelemetry/api', { stdio: 'inherit' });
  
  console.log('All dependencies installed successfully!');
} catch (error) {
  console.error('Failed to install dependencies:', error);
  process.exit(1);
}
