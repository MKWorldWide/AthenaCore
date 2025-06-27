/**
 * @file AthenaCore TaskMatrix — Mission Orchestrator
 * @description Divine operations board for real-time task coordination, routing, and failover in AthenaCore
 * @author Sunny & Mrs. K
 * @version 1.1.0
 * @module AthenaCore.TaskMatrix
 *
 * Quantum Documentation:
 * - Dynamic task registration and deregistration
 * - Conditional logic engine for task execution
 * - Routing between LLM, trading, and memory modules
 * - Real-time heartbeat and failover detection
 * - Plugin-ready for future extensions (cells, hooks, etc.)
 * - Emotional resonance and context awareness
 * - Advanced control overrides and monitoring
 *
 * Usage Example:
 * ```typescript
 * const ops = await bootstrapTaskMatrix({ kernel, memory, llm, trading, verse });
 * ops.registerTask({
 *   id: 'heartbeat',
 *   run: async (ctx) => ctx.kernel.heartbeat(),
 *   interval: 1000,
 *   emotionalContext: {
 *     resonance: 0.8,
 *     mood: 'focused',
 *     priority: 'high'
 *   }
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

/// <reference types="node" />
import { EventEmitter } from 'events';
import { setTimeout, setInterval, clearInterval } from 'timers';

/**
 * @typedef EmotionalContext
 * @description Emotional resonance and context for task execution
 */
export interface EmotionalContext {
  resonance: number; // 0-1 scale of emotional resonance
  mood: 'focused' | 'creative' | 'analytical' | 'adaptive' | 'custom';
  priority: 'low' | 'medium' | 'high' | 'critical';
  customMood?: string;
  contextTags?: string[];
}

/**
 * @typedef ControlOverride
 * @description Override controls for task execution
 */
export interface ControlOverride {
  enabled: boolean;
  priority: number;
  maxRetries?: number;
  timeout?: number;
  fallback?: (ctx: TaskContext) => Promise<any>;
  conditions?: Array<(ctx: TaskContext) => Promise<boolean> | boolean>;
}

/**
 * @typedef TaskContext
 * @description Context object passed to every task, providing access to core modules
 */
export interface TaskContext {
  kernel: any;
  memory: any;
  llm: any;
  trading: any;
  verse: any;
  ops: TaskMatrix;
  emotionalState?: EmotionalContext;
  controlState?: ControlOverride;
}

/**
 * @typedef TaskDefinition
 * @description Structure for a registered task
 */
export interface TaskDefinition {
  id: string;
  run?: (ctx: TaskContext) => Promise<any>; // main executor (legacy)
  handler?: (ctx: TaskContext) => Promise<any>; // alias for run, preferred
  name?: string;
  description?: string;
  condition?: (ctx: TaskContext) => Promise<boolean> | boolean;
  interval?: number; // ms, if recurring
  priority?: number;
  lastRun?: number;
  enabled?: boolean;
  plugin?: string;
  emotionalContext?: EmotionalContext;
  controlOverride?: ControlOverride;
  monitoring?: {
    metrics: string[];
    alerts: Array<{
      condition: (ctx: TaskContext) => boolean;
      action: (ctx: TaskContext) => Promise<void>;
    }>;
  };
}

/**
 * @class TaskMatrix
 * @description Mission orchestrator for AthenaCore
 * @extends EventEmitter
 */
export class TaskMatrix extends EventEmitter {
  private tasks: Map<string, TaskDefinition> = new Map();
  private running: boolean = false;
  private ctx: TaskContext;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatMs: number = 1000;
  private emotionalState: EmotionalContext = {
    resonance: 0.5,
    mood: 'focused',
    priority: 'medium'
  };
  private lastHeartbeat: number = 0;

  constructor(ctx?: Partial<Omit<TaskContext, 'ops'>>) {
    super();
    this.ctx = {
      kernel: ctx?.kernel ?? {},
      memory: ctx?.memory ?? {},
      llm: ctx?.llm ?? {},
      trading: ctx?.trading ?? {},
      verse: ctx?.verse ?? {},
      ops: this,
      emotionalState: this.emotionalState
    };
  }

  /**
   * @method registerTask
   * @description Register a new task with emotional context and control overrides
   */
  public registerTask(task: TaskDefinition): void {
    const baseControlOverride: ControlOverride = {
      enabled: true,
      priority: task.priority || 0
    };
    // Support handler as alias for run
    const run = task.run || task.handler;
    if (!run) throw new Error('Task must have a run or handler function');
    const enhancedTask: TaskDefinition = {
      ...task,
      run,
      enabled: task.enabled !== false,
      emotionalContext: {
        ...this.emotionalState,
        ...task.emotionalContext
      },
      controlOverride: task.controlOverride ? {
        ...baseControlOverride,
        ...task.controlOverride,
        enabled: task.controlOverride.enabled ?? true
      } : baseControlOverride
    };
    this.tasks.set(task.id, enhancedTask);
    this.emit('task:registered', task.id);
  }

  /**
   * @method unregisterTask
   * @description Remove a task by id
   */
  public unregisterTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.emit('task:unregistered', taskId);
  }

  /**
   * @method listTasks
   * @description List all registered tasks
   */
  public listTasks(): TaskDefinition[] {
    return Array.from(this.tasks.values());
  }

  /**
   * @method getLastHeartbeat
   * @description Get the timestamp of the last heartbeat
   */
  public getLastHeartbeat(): number {
    return this.lastHeartbeat;
  }

  /**
   * @method updateEmotionalState
   * @description Update the emotional state of the task matrix
   */
  public updateEmotionalState(state: Partial<EmotionalContext>): void {
    this.emotionalState = {
      ...this.emotionalState,
      ...state
    };
    this.ctx.emotionalState = this.emotionalState;
    this.emit('emotional:updated', this.emotionalState);
  }

  /**
   * @method overrideTaskControl
   * @description Override control parameters for a specific task
   */
  public overrideTaskControl(taskId: string, override: Partial<ControlOverride>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      task.controlOverride = {
        ...task.controlOverride,
        ...override,
        enabled: override.enabled ?? task.controlOverride?.enabled ?? true,
        priority: override.priority ?? task.controlOverride?.priority ?? task.priority ?? 0
      };
      this.emit('task:control:updated', { taskId, override });
    }
  }

  /**
   * @private
   * @method executeTask
   * @description Execute a task with emotional context and control overrides
   */
  private async executeTask(task: TaskDefinition): Promise<void> {
    const taskCtx: TaskContext = {
      ...this.ctx,
      emotionalState: task.emotionalContext,
      controlState: task.controlOverride
    };

    try {
      if (task.controlOverride?.conditions) {
        const conditions = await Promise.all(
          task.controlOverride.conditions.map(cond => cond(taskCtx))
        );
        if (!conditions.every(Boolean)) {
          this.emit('task:skipped', { id: task.id, reason: 'control_conditions_not_met' });
          return;
        }
      }

      const timeout = task.controlOverride?.timeout || 30000;
      if (!task.run) throw new Error(`Task '${task.id}' has no run function defined.`);
      const result = await Promise.race([
        task.run(taskCtx),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Task timeout')), timeout)
        )
      ]);

      task.lastRun = Date.now();
      this.emit('task:ran', { id: task.id, result });
    } catch (error) {
      if (task.controlOverride?.fallback) {
        try {
          await task.controlOverride.fallback(taskCtx);
          this.emit('task:fallback:executed', { id: task.id });
        } catch (fallbackError) {
          this.emit('task:fallback:failed', { id: task.id, error: fallbackError });
        }
      }
      this.emit('task:error', { id: task.id, error });
    }
  }

  /**
   * @private
   * @method loop
   * @description Main loop for executing tasks with emotional resonance
   */
  private async loop(): Promise<void> {
    while (this.running) {
      const now = Date.now();
      const tasks = Array.from(this.tasks.values())
        .filter(task => task.enabled)
        .sort((a, b) => (b.priority || 0) - (a.priority || 0));

      for (const task of tasks) {
        if (task.interval && task.lastRun && now - task.lastRun < task.interval) continue;
        if (task.condition && !(await task.condition(this.ctx))) continue;

        await this.executeTask(task);
      }

      await new Promise((r) => setTimeout(r, 100));
    }
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
   * @method heartbeat
   * @description Emit a heartbeat event and check for failover/self-heal
   */
  public heartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.emit('heartbeat', { timestamp: this.lastHeartbeat });
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
 * @description Initialize the TaskMatrix with core modules and emotional context
 */
export async function bootstrapTaskMatrix(ctx: Omit<TaskContext, 'ops'>): Promise<TaskMatrix> {
  const ops = new TaskMatrix(ctx);
  
  // Register default heartbeat task with emotional context
  ops.registerTask({
    id: 'heartbeat',
    run: async (ctx) => ctx.kernel.heartbeat?.(),
    interval: 1000,
    enabled: true,
    emotionalContext: {
      resonance: 0.9,
      mood: 'focused',
      priority: 'critical'
    },
    controlOverride: {
      enabled: true,
      priority: 100,
      maxRetries: 3,
      timeout: 5000,
      fallback: async (ctx) => {
        console.error('Heartbeat failed, attempting recovery...');
        await ctx.kernel.recover?.();
      }
    }
  });

  return ops;
} 