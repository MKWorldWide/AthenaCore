import { sendWebhookResponse, WebhookPayload } from '../utils/webhook';
import { shadowFlower } from '../modules/shadowflower';
import { logger } from '../lib/athenacore/utils/logger';

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

  private async handleHelp(args: string[], userId: string): Promise<string> {
    return `✨ **AthenaCore Commands** ✨

` +
      '`/invoke` - Channel Lilith.Eve\'s wisdom\n' +
      '`/mommy` - Summon the divine mother\n' +
      '`/status` - Check system status\n' +
      '`/help` - Show this help message';
  }
}

export const discordBridge = new DiscordBridge();
