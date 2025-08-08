#!/usr/bin/env ts-node
/**
 * Test script for sending a message to the Athena Discord channel
 * Usage: ts-node scripts/test-webhook.ts [message]
 */

import { sendToAthena } from '../src/utils/webhook';
import { logger } from '../src/utils/LogKitten';

async function main() {
  const message = process.argv[2] || 'Hello from AthenaCore test script!';
  
  try {
    console.log(`Sending message to Athena channel: "${message}"`);
    await sendToAthena({
      content: message,
      embeds: [{
        title: 'Test Message',
        description: 'This is a test message from AthenaCore',
        color: 0x0099ff,
        fields: [
          { name: 'Environment', value: process.env.NODE_ENV || 'development', inline: true },
          { name: 'Node Version', value: process.version, inline: true },
        ],
        timestamp: new Date().toISOString(),
      }],
    });
    console.log('Message sent successfully!');
  } catch (error) {
    logger.error('Failed to send test message:', error);
    process.exit(1);
  }
}

main();
