const fs = require('fs');
const path = require('path');

// Check if package.json exists
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('Error: package.json not found');
  process.exit(1);
}

// Read package.json
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// List of required dev dependencies
const requiredDevDeps = [
  'typescript',
  '@types/node',
  'dotenv'
];

// List of required dependencies
const requiredDeps = [
  '@opentelemetry/sdk-node',
  '@opentelemetry/auto-instrumentations-node',
  '@opentelemetry/exporter-trace-otlp-http',
  '@opentelemetry/resources',
  '@opentelemetry/semantic-conventions',
  '@opentelemetry/api'
];

// Check for missing dependencies
const missingDevDeps = requiredDevDeps.filter(dep => !packageJson.devDependencies?.[dep]);
const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies?.[dep]);

// Generate installation commands
const commands = [];
if (missingDevDeps.length > 0) {
  commands.push(`pnpm add -D ${missingDevDeps.join(' ')}`);
}
if (missingDeps.length > 0) {
  commands.push(`pnpm add ${missingDeps.join(' ')}`);
}

if (commands.length > 0) {
  console.log('Missing dependencies detected. Please run the following commands:');
  commands.forEach(cmd => console.log(`  ${cmd}`));
  process.exit(1);
} else {
  console.log('All required dependencies are installed.');
  process.exit(0);
}
