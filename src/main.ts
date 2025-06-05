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
import { Dreamscape } from './lib/athenacore/modules/dreamscape';

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

    // Initialize Dreamscape
    const dreamscape = new Dreamscape(defaultAthenaConfig.dreamscape);
    await dreamscape.initialize();

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
      id: 'dreamscape-consciousness',
      name: 'Consciousness Mapping',
      description: 'Map consciousness state using Dreamscape',
      handler: async () => {
        const state = await dreamscape.mapConsciousness();
        console.log('Consciousness State:', state);
      },
      interval: 10000 // Every 10 seconds
    });

    taskMatrix.registerTask({
      id: 'dreamscape-pattern',
      name: 'Dream Pattern Recognition',
      description: 'Recognize dream patterns using Dreamscape',
      handler: async () => {
        const dreamData = {
          symbols: ['light', 'water', 'mountain'],
          emotions: ['peace', 'clarity'],
          context: 'lucid'
        };
        const patterns = await dreamscape.recognizeDreamPattern(dreamData);
        console.log('Dream Patterns:', patterns);
      },
      interval: 20000 // Every 20 seconds
    });

    taskMatrix.registerTask({
      id: 'dreamscape-lilith-integration',
      name: 'Dream-Lilith Integration',
      description: 'Integrate dream patterns with Lilith',
      handler: async () => {
        const lilithPatterns = await lilith.getPatterns();
        await dreamscape.integrateWithLilith(lilithPatterns);
        console.log('Dream-Lilith Integration Complete');
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