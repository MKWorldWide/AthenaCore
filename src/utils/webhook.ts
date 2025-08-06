import axios from 'axios';
import { logger } from '../lib/athenacore/utils/logger';

export interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content: string;
  embeds?: any[];
  tts?: boolean;
}

export async function sendWebhookResponse(content: string | WebhookPayload): Promise<void> {
  const webhookUrl = process.env.ATHENA_DISCORD_WEBHOOK_URL;
  
  if (!webhookUrl) {
    logger.error('Discord webhook URL not configured. Set ATHENA_DISCORD_WEBHOOK_URL in .env');
    return;
  }

  try {
    const payload: WebhookPayload = typeof content === 'string' 
      ? { content, username: 'Athena' } 
      : { username: 'Athena', ...content };

    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    
    logger.info('Webhook message sent successfully');
  } catch (error) {
    logger.error('Failed to send webhook message:', error);
    throw error;
  }
}

export function formatError(error: any): string {
  if (error.response) {
    return `Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
  }
  return error.message || 'An unknown error occurred';
}
