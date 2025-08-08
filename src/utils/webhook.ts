import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { logger } from './LogKitten';

// Webhook configuration for different channels
export const WEBHOOK_CONFIG = {
  ATHENA: {
    channelId: '1402739839014666281',
    webhookUrl: 'https://discord.com/api/webhooks/1402739950469779587/0MnYncHuAiMRwl_qxdwDNqG_M5pkVwfRbqb8Z5ATixgICV6V8tgjw10WfeCkZ_aQl4os',
    username: 'Athena',
    avatarUrl: 'https://i.imgur.com/example.png' // Replace with actual Athena avatar URL
  }
  // Add more channel configurations as needed
} as const;

export type ChannelName = keyof typeof WEBHOOK_CONFIG;

export interface WebhookPayload {
  username?: string;
  avatar_url?: string;
  content: string;
  embeds?: any[];
  tts?: boolean;
  channelId?: string; // For backward compatibility
}

class WebhookManager {
  private client: AxiosInstance;
  private defaultConfig: { username: string; avatar_url?: string };

  constructor() {
    this.client = axios.create({
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.defaultConfig = {
      username: 'Athena',
      avatar_url: 'https://i.imgur.com/example.png' // Default avatar
    };
  }

  /**
   * Send a message to a specific channel using its configured webhook
   * @param channel The channel name (must be a key of WEBHOOK_CONFIG)
   * @param content Message content or payload object
   */
  async sendToChannel<T extends ChannelName>(
    channel: T,
    content: string | Omit<WebhookPayload, 'channelId'>
  ): Promise<void> {
    const config = WEBHOOK_CONFIG[channel];
    if (!config) {
      throw new Error(`No webhook configuration found for channel: ${channel}`);
    }

    const payload = this.preparePayload(content);
    await this.executeWebhook(config.webhookUrl, payload);
  }

  /**
   * Send a message using the legacy method (for backward compatibility)
   * @deprecated Use sendToChannel instead for better type safety
   */
  async sendWebhookResponse(content: string | WebhookPayload): Promise<void> {
    const payload = this.preparePayload(content);
    const webhookUrl = process.env.ATHENA_DISCORD_WEBHOOK_URL;
    
    if (!webhookUrl) {
      logger.error('Default Discord webhook URL not configured. Set ATHENA_DISCORD_WEBHOOK_URL in .env');
      return;
    }

    await this.executeWebhook(webhookUrl, payload);
  }

  private preparePayload(content: string | WebhookPayload): WebhookPayload {
    if (typeof content === 'string') {
      return { ...this.defaultConfig, content };
    }
    
    // Extract channelId if present (for backward compatibility)
    const { channelId, ...rest } = content;
    return { ...this.defaultConfig, ...rest };
  }

  private async executeWebhook(url: string, payload: WebhookPayload): Promise<void> {
    try {
      await this.client.post(url, payload);
      logger.info(`Webhook message sent to ${payload.username || 'default'}`);
    } catch (error) {
      const errorMessage = this.formatError(error);
      logger.error(`Failed to send webhook message: ${errorMessage}`);
      throw new Error(`Webhook error: ${errorMessage}`);
    }
  }

  private formatError(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return `Status: ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      } else if (error.request) {
        return 'No response received from webhook server';
      }
    }
    return error.message || 'An unknown error occurred';
  }
}

// Export a singleton instance
export const webhookManager = new WebhookManager();

// Legacy export for backward compatibility
export const sendWebhookResponse = webhookManager.sendWebhookResponse.bind(webhookManager);

// Helper function to send to the Athena channel
export const sendToAthena = (content: string | Omit<WebhookPayload, 'channelId'>) => 
  webhookManager.sendToChannel('ATHENA', content);
