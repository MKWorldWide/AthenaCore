/**
 * @file AthenaCore Main Entry Point
 * @description Main entry point for AthenaCore
 * @author Sunny & Mrs. K
 * @version 1.0.0
 */

import { AthenaCore } from './lib/athenacore';
import { defaultAthenaConfig } from './config/athenacore';
import { TaskMatrix } from './lib/athenacore/ops/taskmatrix';
import { Lilith } from './lib/athenacore/modules/lilith';

/**
 * @function main
 * @description Main entry point for AthenaCore
 */
async function main() {
  try {
    // Initialize AthenaCore
    const athena = new AthenaCore(defaultAthenaConfig);
    await athena.initialize();

    // Initialize Lilith
    const lilith = new Lilith(defaultAthenaConfig.lilith);
    await lilith.initialize();

    // Initialize TaskMatrix
    const taskMatrix = new TaskMatrix();

    // Register example tasks
    taskMatrix.registerTask({
      id: 'llm-summary',
      name: 'Market News Summary',
      description: 'Generate summary of market news',
      handler: async () => {
        const response = await athena.llm.generate({
          prompt: 'Summarize the latest market news',
          maxTokens: 100
        });
        console.log('Market Summary:', response.content);
      },
      interval: 60000 // Every minute
    });

    taskMatrix.registerTask({
      id: 'memory-store',
      name: 'Memory Update',
      description: 'Update memory with last heartbeat',
      handler: async () => {
        const lastHeartbeat = taskMatrix.getLastHeartbeat();
        await athena.memory.store('heartbeat', lastHeartbeat);
        console.log('Memory Updated:', lastHeartbeat);
      },
      interval: 5000 // Every 5 seconds
    });

    taskMatrix.registerTask({
      id: 'trading-balance',
      name: 'Trading Balance Check',
      description: 'Check and log trading balance',
      handler: async () => {
        const balance = await athena.trading.getBalance();
        console.log('Trading Balance:', balance);
      },
      interval: 30000 // Every 30 seconds
    });

    taskMatrix.registerTask({
      id: 'lilith-pattern',
      name: 'Pattern Recognition',
      description: 'Recognize market patterns using Lilith',
      handler: async () => {
        const marketData = await athena.trading.getMarketData('BTC/USD');
        const patterns = await lilith.recognizePattern(marketData);
        console.log('Recognized Patterns:', patterns);
      },
      interval: 15000 // Every 15 seconds
    });

    taskMatrix.registerTask({
      id: 'lilith-decision',
      name: 'Autonomous Decision',
      description: 'Make trading decisions using Lilith',
      handler: async () => {
        const marketContext = {
          market: 'BTC/USD',
          data: await athena.trading.getMarketData('BTC/USD'),
          patterns: await lilith.getPatterns()
        };
        const decision = await lilith.makeDecision(marketContext);
        console.log('Lilith Decision:', decision);
      },
      interval: 30000 // Every 30 seconds
    });

    taskMatrix.registerTask({
      id: 'llm-to-trade',
      name: 'LLM Trading Decision',
      description: 'Use LLM to decide on trading actions',
      handler: async () => {
        const response = await athena.llm.generate({
          prompt: 'Analyze current market conditions and decide whether to buy or sell BTC/USD',
          maxTokens: 100
        });
        console.log('LLM Trading Decision:', response.content);
      },
      interval: 120000 // Every 2 minutes
    });

    // Start TaskMatrix
    await taskMatrix.start();
    console.log('AthenaCore is operational! 🚀');

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      console.log('\nShutting down AthenaCore...');
      await taskMatrix.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start AthenaCore:', error);
    process.exit(1);
  }
}

// Start AthenaCore
main(); 