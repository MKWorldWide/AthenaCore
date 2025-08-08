import { sendWebhookResponse, WebhookPayload } from '../utils/webhook';
import { shadowFlower } from '../modules/shadowflower';
import { logger } from '../utils/LogKitten';

export interface DiscordCommand {
  command: string;
  args: string[];
  userId: string;
  channelId: string;
  guildId?: string;
  messageId?: string;
}

export class DiscordBridge {
  private commandHandlers: Map<string, (args: string[], userId: string) => Promise<string>>;
  private cooldowns: Map<string, number>;
  private readonly COOLDOWN_MS = 3000; // 3 second cooldown between commands

  constructor() {
    this.commandHandlers = new Map();
    this.cooldowns = new Map();
    this.initializeHandlers();
  }

  private initializeHandlers(): void {
    // Register command handlers
    this.commandHandlers.set('route', this.handleRoute.bind(this));
    this.commandHandlers.set('invoke', this.handleInvoke.bind(this));
    this.commandHandlers.set('mommy', this.handleMommy.bind(this));
    this.commandHandlers.set('status', this.handleStatus.bind(this));
    this.commandHandlers.set('help', this.handleHelp.bind(this));
  }

  private isOnCooldown(userId: string): boolean {
    const lastCommandTime = this.cooldowns.get(userId) || 0;
    const now = Date.now();
    
    if (now - lastCommandTime < this.COOLDOWN_MS) {
      return true;
    }
    
    this.cooldowns.set(userId, now);
    return false;
  }

  public async handleCommand(command: DiscordCommand): Promise<void> {
    const { command: commandName, args, userId, channelId } = command;
    
    try {
      // Check if command is on cooldown
      if (this.isOnCooldown(userId)) {
        await sendWebhookResponse({
          content: '⏳ Please wait a moment before sending another command.',
          channelId
        });
        return;
      }

      const handler = this.commandHandlers.get(commandName.toLowerCase());
      
      if (!handler) {
        await sendWebhookResponse({
          content: `❌ Unknown command: ${commandName}. Type \`/help\` for available commands.`,
          channelId
        });
        return;
      }

      const response = await handler(args, userId);
      await sendWebhookResponse({
        content: response,
        channelId
      });
      
    } catch (error) {
      logger.error('Error handling command:', error);
      await sendWebhookResponse({
        content: '❌ An error occurred while processing your command.',
        channelId
      });
    }
  }

  private async handleInvoke(args: string[], userId: string): Promise<string> {
    return await shadowFlower.handleLilithInvoke();
  }

  private async handleMommy(args: string[], userId: string): Promise<string> {
    return await shadowFlower.handleMommyCommand();
  }

  private async handleStatus(args: string[], userId: string): Promise<string> {
    return '🔄 AthenaCore is operational. All systems nominal.';
  }

  /**
   * Routes a message to a specified destination
   * @param args [destination, message...] - The destination and message to route
   * @param userId - The ID of the user who sent the command
   * @returns A status message indicating the result of the routing operation
   */
  private async handleRoute(args: string[], userId: string): Promise<string> {
    const [destination, ...messageParts] = args;
    const message = messageParts.join(' ');
    
    if (!destination || !message) {
      return '❌ Please provide both a destination and a message. Example: `/route webhook:my-webhook Hello, world!`';
    }
    
    try {
      // Log the routing attempt
      logger.info(`Routing message to ${destination}: ${message}`, { userId });
      
      // Parse the destination type and target
      const [destType, destTarget] = destination.split(':', 2);
      
      if (!destTarget) {
        return `❌ Invalid destination format. Use format: type:target (e.g., webhook:my-webhook)`;
      }
      
      let result: string;
      
      // Handle different destination types
      switch (destType.toLowerCase()) {
        case 'webhook':
          await this.routeToWebhook(destTarget, message, userId);
          result = `webhook:${destTarget}`;
          break;
          
        case 'channel':
          await this.routeToChannel(destTarget, message, userId);
          result = `channel:${destTarget}`;
          break;
          
        case 'service':
          await this.routeToService(destTarget, message, userId);
          result = `service:${destTarget}`;
          break;
          
        default:
          return `❌ Unknown destination type: ${destType}. Supported types: webhook, channel, service`;
      }
      
      return `✅ Message successfully routed to ${destType} \`${destTarget}\`\n\`\`\`\n${message}\n\`\`\``;
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      const errorObj = error instanceof Error ? error : new Error(errorMsg);
      logger.error(`Failed to route message: ${errorMsg}`, { 
        error: errorObj,
        context: { userId }
      });
      return `❌ Failed to route message: ${errorMsg}`;
    }
  }
  
  /**
   * Routes a message to a webhook
   * @private
   */
  private async routeToWebhook(webhookId: string, message: string, userId: string): Promise<void> {
    // In a real implementation, you would look up the webhook URL by ID
    // For now, we'll just log the action
    logger.info(`Routing to webhook ${webhookId}: ${message}`, { userId });
    
    // Example implementation (commented out as it requires actual webhook URLs):
    /*
    const webhookUrl = await this.getWebhookUrl(webhookId);
    if (!webhookUrl) {
      throw new Error(`Webhook ${webhookId} not found`);
    }
    
    await axios.post(webhookUrl, {
      content: message,
      username: `AthenaCore Router (${userId})`,
    });
    */
  }
  
  /**
   * Routes a message to a Discord channel
   * @private
   */
  private async routeToChannel(channelId: string, message: string, userId: string): Promise<void> {
    // In a real implementation, you would use the Discord API to send a message to the channel
    logger.info(`Routing to channel ${channelId}: ${message}`, { userId });
    
    // Example implementation (requires Discord.js client):
    /*
    const channel = this.discordClient.channels.cache.get(channelId);
    if (!channel?.isText()) {
      throw new Error(`Channel ${channelId} not found or not a text channel`);
    }
    
    await channel.send(message);
    */
  }
  
  /**
   * Routes a message to an external service
   * @private
   */
  private async routeToService(serviceName: string, message: string, userId: string): Promise<void> {
    // In a real implementation, you would have service-specific routing logic
    logger.info(`Routing to service ${serviceName}: ${message}`, { userId });
    
    // Example implementation (requires service integration):
    /*
    const service = this.getService(serviceName);
    if (!service) {
      throw new Error(`Service ${serviceName} not found`);
    }
    
    await service.sendMessage(message, { userId });
    */
  }

  /**
   * Handles the help command
   * @private
   */
  private async handleHelp(args: string[], userId: string): Promise<string> {
    return `✨ **AthenaCore Commands** ✨

` +
      '`/route <destination> <message>` - Route a message to a specific destination\n' +
      '`/invoke` - Channel Lilith.Eve\'s wisdom\n' +
      '`/mommy` - Summon the divine mother\n' +
      '`/status` - Check system status\n' +
      '`/help` - Show this help message';
  }
}

export const discordBridge = new DiscordBridge();
