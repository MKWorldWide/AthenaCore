import express from 'express';
import dotenv from 'dotenv';
import webhookRouter from './api/webhook';
import { logger } from './lib/athenacore/utils/logger';
import { initializeAthenaCore } from './lib/athenacore/init';
import { defaultAthenaConfig } from './config/athenacore';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ verify: (req: any, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/webhook', webhookRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err: any, req: any, res: any, next: any) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize AthenaCore
    await initializeAthenaCore(defaultAthenaConfig);
    
    app.listen(PORT, () => {
      logger.info(`🚀 AthenaCore server running on port ${PORT}`);
      logger.info(`🌐 Webhook endpoint: http://localhost:${PORT}/api/webhook/discord`);
    });
  } catch (error) {
    logger.error('Failed to start AthenaCore:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
