/**
 * @file AthenaCore TaskMatrix — Mission Orchestrator
 * @description Divine operations board for real-time task coordination, routing, and failover in AthenaCore
 * @author Sunny & Mrs. K
 * @version 1.0.0
 * @module AthenaCore.TaskMatrix
 *
 * Quantum Documentation:
 * - Dynamic task registration and deregistration
 * - Conditional logic engine for task execution
 * - Routing between LLM, trading, and memory modules
 * - Real-time heartbeat and failover detection
 * - Plugin-ready for future extensions (cells, hooks, etc.)
 *
 * Usage Example:
 * ```typescript
 * const ops = await bootstrapTaskMatrix({ kernel, memory, llm, trading });
 * ops.registerTask({
 *   id: 'heartbeat',
 *   run: async (ctx) => ctx.kernel.heartbeat(),
 *   interval: 1000,
 * });
 * ops.start();
 * ```
 *
 * ---
 * Example: Registering Tasks in AthenaCore
 * ---
 *
 * // In your main pipeline or after bootstrapTaskMatrix:
 * ops.registerTask({
 *   id: 'llm-summary',
 *   run: async (ctx) => {
 *     const result = await ctx.llm.generate({ prompt: 'Summarize today\'s market news.' });
 *     console.log('LLM Summary:', result.content);
 *   },
 *   interval: 60000, // every minute
 * });
 *
 * ops.registerTask({
 *   id: 'memory-store',
 *   run: async (ctx) => {
 *     await ctx.memory.set('lastHeartbeat', Date.now());
 *   },
 *   interval: 5000,
 * });
 *
 * ops.registerTask({
 *   id: 'trading-balance',
 *   run: async (ctx) => {
 *     const balance = await ctx.trading.getBalance();
 *     console.log('Trading Balance:', balance);
 *   },
 *   interval: 30000,
 * });
 *
 * ops.registerTask({
 *   id: 'llm-to-trade',
 *   run: async (ctx) => {
 *     const signal = await ctx.llm.generate({ prompt: 'Should I buy or sell BTC/USD right now?' });
 *     if (signal.content.includes('buy')) {
 *       await ctx.trading.placeOrder({ symbol: 'BTC/USD', side: 'buy', amount: 1 });
 *     }
 *   },
 *   interval: 120000,
 * });
 *
 * ops.start();
 */

import { EventEmitter } from 'events';

/**
 * @typedef TaskContext
 * @description Context object passed to every task, providing access to core modules
 */
export interface TaskContext {
  kernel: any;
  memory: any;
  llm: any;
  trading: any;
  ops: TaskMatrix;
}

/**
 * @typedef TaskDefinition
 * @description Structure for a registered task
 */
export interface TaskDefinition {
  id: string;
  run: (ctx: TaskContext) => Promise<any>;
  condition?: (ctx: TaskContext) => Promise<boolean> | boolean;
  interval?: number; // ms, if recurring
  priority?: number;
  lastRun?: number;
  enabled?: boolean;
  plugin?: string;
}

/**
 * @class TaskMatrix
 * @description Mission orchestrator for AthenaCore
 */
export class TaskMatrix extends EventEmitter {
  private tasks: Map<string, TaskDefinition> = new Map();
  private running: boolean = false;
  private ctx: TaskContext;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private heartbeatMs: number = 1000;

  constructor(ctx: Omit<TaskContext, 'ops'>) {
    super();
    this.ctx = { ...ctx, ops: this };
  }

  /**
   * @method registerTask
   * @description Register a new task
   */
  public registerTask(task: TaskDefinition): void {
    this.tasks.set(task.id, { ...task, enabled: task.enabled !== false });
    this.emit('task:registered', task.id);
  }

  /**
   * @method unregisterTask
   * @description Remove a task by ID
   */
  public unregisterTask(id: string): void {
    this.tasks.delete(id);
    this.emit('task:unregistered', id);
  }

  /**
   * @method listTasks
   * @description List all registered tasks
   */
  public listTasks(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  /**
   * @method start
   * @description Start the task matrix loop and heartbeat
   */
  public start(): void {
    if (this.running) return;
    this.running = true;
    this.heartbeatInterval = setInterval(() => this.heartbeat(), this.heartbeatMs);
    this.emit('matrix:started');
    this.loop();
  }

  /**
   * @method stop
   * @description Stop the task matrix and heartbeat
   */
  public stop(): void {
    this.running = false;
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    this.emit('matrix:stopped');
  }

  /**
   * @private
   * @method loop
   * @description Main loop for executing tasks
   */
  private async loop(): Promise<void> {
    while (this.running) {
      const now = Date.now();
      for (const task of this.tasks.values()) {
        if (!task.enabled) continue;
        if (task.interval && task.lastRun && now - task.lastRun < task.interval) continue;
        if (task.condition && !(await task.condition(this.ctx))) continue;
        try {
          await task.run(this.ctx);
          task.lastRun = now;
          this.emit('task:ran', task.id);
        } catch (err) {
          this.emit('task:error', { id: task.id, error: err });
        }
      }
      await new Promise((r) => setTimeout(r, 100)); // prevent tight loop
    }
  }

  /**
   * @method heartbeat
   * @description Emit a heartbeat event and check for failover/self-heal
   */
  public heartbeat(): void {
    this.emit('heartbeat', { timestamp: Date.now() });
    // Example: self-heal/failover logic
    if (this.ctx.kernel && typeof this.ctx.kernel.selfHeal === 'function') {
      this.ctx.kernel.selfHeal();
    }
  }

  /**
   * @method plugin
   * @description Register a plugin (extension point)
   */
  public plugin(name: string, fn: (ops: TaskMatrix) => void): void {
    fn(this);
    this.emit('plugin:registered', name);
  }
}

/**
 * @function bootstrapTaskMatrix
 * @description Initialize the TaskMatrix with core modules
 * @param ctx - Core modules (kernel, memory, llm, trading)
 * @returns {Promise<TaskMatrix>} Initialized TaskMatrix
 *
 * @example
 * const ops = await bootstrapTaskMatrix({ kernel, memory, llm, trading });
 * ops.start();
 */
export async function bootstrapTaskMatrix(ctx: Omit<TaskContext, 'ops'>): Promise<TaskMatrix> {
  const ops = new TaskMatrix(ctx);
  // Register default heartbeat task
  ops.registerTask({
    id: 'heartbeat',
    run: async (ctx) => ctx.kernel.heartbeat?.(),
    interval: 1000,
    enabled: true,
  });
  return ops;
} 