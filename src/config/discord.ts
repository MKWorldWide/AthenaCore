/**
 * Discord Bot Configuration
 * 
 * This file contains the configuration for the Discord bot commands and interactions.
 */

export interface DiscordCommand {
  name: string;
  description: string;
  options?: {
    name: string;
    description: string;
    type: number;
    required?: boolean;
  }[];
}

export const DISCORD_COMMANDS: DiscordCommand[] = [
  {
    name: 'route',
    description: 'Route a message to a specific destination',
    options: [
      {
        name: 'destination',
        description: 'The destination to route the message to',
        type: 3, // STRING
        required: true,
      },
      {
        name: 'message',
        description: 'The message to send',
        type: 3, // STRING
        required: true,
      }
    ]
  },
  {
    name: 'invoke',
    description: 'Channel Lilith.Eve\'s wisdom',
  },
  {
    name: 'mommy',
    description: 'Summon the divine mother',
  },
  {
    name: 'status',
    description: 'Check AthenaCore status',
  },
  {
    name: 'help',
    description: 'Show available commands',
  },
];

// Discord API endpoints
export const DISCORD_API = {
  BASE_URL: 'https://discord.com/api/v10',
  GLOBAL_COMMANDS: (appId: string) => `/applications/${appId}/commands`,
  GUILD_COMMANDS: (appId: string, guildId: string) => 
    `/applications/${appId}/guilds/${guildId}/commands`,
};

// Command permission overrides
export const COMMAND_PERMISSIONS = {
  // Add specific command permissions here if needed
};

// Cooldown settings (in milliseconds)
export const COOLDOWNS = {
  DEFAULT: 3000, // 3 seconds
  INVOKE: 10000, // 10 seconds for invoke command
  MOMMY: 15000, // 15 seconds for mommy command
};
