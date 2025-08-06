import express from 'express';
import { Request, Response } from 'express';
import { discordBridge } from '../bridge/discord_bridge';
import { logger } from '../lib/athenacore/utils/logger';
import { verifyKeyMiddleware } from 'discord-interactions';

const router = express.Router();

// Verify incoming requests from Discord
const verifyRequest = (req: Request, res: Response, buf: Buffer) => {
  req.rawBody = buf;
};

// Handle Discord interactions
router.post('/discord', 
  express.raw({ type: 'application/json', verify: verifyRequest }),
  verifyKeyMiddleware(process.env.DISCORD_PUBLIC_KEY || ''),
  async (req: Request, res: Response) => {
    try {
      const { type, data, member, token } = req.body;
      
      // Handle ping events
      if (type === 1) {
        return res.json({ type: 1 });
      }

      // Handle application commands
      if (type === 2) {
        const { name, options } = data;
        const args = options ? options.map((opt: any) => opt.value) : [];
        
        await discordBridge.handleCommand({
          command: name,
          args,
          userId: member?.user?.id || 'unknown',
          channelId: data.channel_id,
          guildId: data.guild_id,
          messageId: data.id
        });

        // Acknowledge the interaction
        return res.json({
          type: 5 // Deferred channel message with source
        });
      }

      res.sendStatus(400);
    } catch (error) {
      logger.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
