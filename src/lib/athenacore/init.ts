/**
 * @file AthenaCore Bootstrap — Sovereign Initialization Sequence
 * @description Core initialization module for AthenaCore, establishing the foundation for autonomous operations
 * @author Sunny & Mrs. K
 * @version 1.0.0
 * @module AthenaCore
 */

import { createCoreKernel } from "@/lib/athenacore/kernel";
import { initializeMemoryBank } from "@/lib/athenacore/memory";
import { connectToTradingRelay } from "@/lib/athenacore/modules/trading";
import { initializeLLMBridge } from "@/lib/athenacore/modules/llm";
import { bootstrapTaskMatrix } from "@/lib/athenacore/ops/taskmatrix";
import { AthenaConfig } from "@/config/athenacore";

/**
 * @interface AthenaCoreInstance
 * @description Represents the fully initialized AthenaCore system with all its components
 */
export interface AthenaCoreInstance {
  kernel: ReturnType<typeof createCoreKernel>;
  memory: ReturnType<typeof initializeMemoryBank>;
  llm: ReturnType<typeof initializeLLMBridge>;
  trading: ReturnType<typeof connectToTradingRelay>;
  ops: ReturnType<typeof bootstrapTaskMatrix>;
}

/**
 * @function initAthenaCore
 * @description Initializes the AthenaCore system with all required components and configurations
 * 
 * @param {AthenaConfig} config - Configuration object containing all necessary settings
 * @returns {Promise<AthenaCoreInstance>} Promise resolving to the initialized AthenaCore instance
 * 
 * @example
 * ```typescript
 * const config = {
 *   kernel: { /* kernel settings */ },
 *   memory: { /* memory settings */ },
 *   llm: { /* LLM settings */ },
 *   trading: { /* trading settings */ }
 * };
 * 
 * const athena = await initAthenaCore(config);
 * ```
 */
export async function initAthenaCore(config: AthenaConfig): Promise<AthenaCoreInstance> {
  console.log("🧬 AthenaCore: Initializing Kernel...");

  // Initialize core components
  const kernel = await createCoreKernel(config.kernel);
  const memory = await initializeMemoryBank(config.memory);
  const llm = await initializeLLMBridge(config.llm);
  const trading = await connectToTradingRelay(config.trading);
  
  // Bootstrap operational matrix
  const ops = await bootstrapTaskMatrix({ kernel, memory, llm, trading });

  console.log("💠 AthenaCore is live and sovereign.");
  return { kernel, memory, llm, trading, ops };
} 