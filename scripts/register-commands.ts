#!/usr/bin/env ts-node
/**
 * Discord Command Registration Script
 * 
 * This script registers slash commands with Discord's API.
 * Run with: ts-node scripts/register-commands.ts
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { DISCORD_COMMANDS, DISCORD_API } from '../src/config/discord';

// Load environment variables
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const DISCORD_APP_ID = process.env.DISCORD_APPLICATION_ID;
const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID; // Optional: For guild-specific commands

if (!DISCORD_TOKEN || !DISCORD_APP_ID) {
  console.error('Missing required environment variables. Check your .env file.');
  process.exit(1);
}

const headers = {
  'Authorization': `Bot ${DISCORD_TOKEN}`,
  'Content-Type': 'application/json',
};

async function registerCommands() {
  try {
    const url = DISCORD_GUILD_ID
      ? DISCORD_API.GUILD_COMMANDS(DISCORD_APP_ID, DISCORD_GUILD_ID)
      : DISCORD_API.GLOBAL_COMMANDS(DISCORD_APP_ID);

    const fullUrl = `${DISCORD_API.BASE_URL}${url}`;
    
    console.log(`Registering ${DISCORD_COMMANDS.length} commands...`);
    console.log(`Target URL: ${fullUrl}`);

    const response = await axios.put(
      fullUrl,
      DISCORD_COMMANDS,
      { headers }
    );

    console.log('Successfully registered commands:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('Error registering commands:');
    if (axios.isAxiosError(error)) {
      console.error('Response:', error.response?.data);
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the registration
registerCommands();
