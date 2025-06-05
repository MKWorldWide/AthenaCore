/**
 * @file AthenaCore LLM Module
 * @description Core implementation of the Language Model integration system
 * @author Sunny & Mrs. K
 * @version 1.0.0
 * @module AthenaCore.LLM
 */

import { LLMConfig } from '@/config/athenacore';
import { EventEmitter } from 'events';
import { CustomModel } from './model';

/**
 * @interface LLMResponse
 * @description Structure for LLM response data
 */
export interface LLMResponse {
  /** Generated text content */
  content: string;
  /** Confidence score for the generation */
  confidence: number;
  /** Token usage statistics */
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  /** Metadata about the generation */
  metadata: {
    model: string;
    temperature: number;
    timestamp: number;
  };
}

/**
 * @interface LLMRequest
 * @description Structure for LLM request data
 */
export interface LLMRequest {
  /** Input prompt */
  prompt: string;
  /** Generation parameters */
  parameters?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
  /** Context for the generation */
  context?: {
    system?: string;
    examples?: Array<{ input: string; output: string }>;
    memory?: Record<string, unknown>;
  };
}

/**
 * @class LLMBridge
 * @description Core LLM integration bridge for AthenaCore
 * @extends EventEmitter
 */
export class LLMBridge extends EventEmitter {
  private config: LLMConfig;
  private model: CustomModel;
  private cache: Map<string, LLMResponse>;

  /**
   * @constructor
   * @param {LLMConfig} config - LLM configuration
   */
  constructor(config: LLMConfig) {
    super();
    this.config = config;
    this.model = new CustomModel(config);
    this.cache = new Map();
    this.initializeModel();
  }

  /**
   * @private
   * @method initializeModel
   * @description Initializes the language model with configuration
   */
  private async initializeModel(): Promise<void> {
    try {
      await this.model.initialize();
      this.emit('model:initialized', { timestamp: Date.now() });
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * @method generate
   * @description Generates text based on the provided request
   * @param {LLMRequest} request - Generation request
   * @returns {Promise<LLMResponse>} Generated response
   */
  public async generate(request: LLMRequest): Promise<LLMResponse> {
    try {
      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        return this.cache.get(cacheKey)!;
      }

      const response = await this.model.generate(request);
      
      // Cache the response
      this.cache.set(cacheKey, response);
      
      return response;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * @private
   * @method generateCacheKey
   * @description Generates a cache key for the request
   * @param {LLMRequest} request - Generation request
   * @returns {string} Cache key
   */
  private generateCacheKey(request: LLMRequest): string {
    return JSON.stringify({
      prompt: request.prompt,
      parameters: request.parameters,
      context: request.context
    });
  }

  /**
   * @method clearCache
   * @description Clears the response cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * @method updateConfig
   * @description Updates the LLM configuration
   * @param {Partial<LLMConfig>} config - New configuration
   */
  public updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config };
    this.model = new CustomModel(this.config);
    this.initializeModel();
  }

  /**
   * @method getModelParameters
   * @description Returns the current model parameters
   * @returns {Object} Model parameters
   */
  public getModelParameters(): any {
    return this.model.getParameters();
  }
}

/**
 * @function initializeLLMBridge
 * @description Creates and initializes a new LLM bridge instance
 * @param {LLMConfig} config - LLM configuration
 * @returns {Promise<LLMBridge>} Initialized LLM bridge
 */
export async function initializeLLMBridge(config: LLMConfig): Promise<LLMBridge> {
  const bridge = new LLMBridge(config);
  await bridge.initializeModel();
  return bridge;
} 