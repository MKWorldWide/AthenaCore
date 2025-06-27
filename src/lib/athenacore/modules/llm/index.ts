/**
 * @file AthenaCore LLM Module
 * @description Core implementation of the Language Model integration system
 * @author Sunny & Mrs. K
 * @version 2.0.0
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
    duration: number;
  };
  /** Optional error information */
  error?: string;
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
    stopSequences?: string[];
  };
  /** Context for the generation */
  context?: {
    system?: string;
    examples?: Array<{ input: string; output: string }>;
    memory?: Record<string, unknown>;
    conversation?: Array<{ role: 'user' | 'assistant'; content: string }>;
  };
  /** Request metadata */
  metadata?: {
    requestId?: string;
    userId?: string;
    sessionId?: string;
  };
}

/**
 * @interface LLMCacheEntry
 * @description Cache entry structure
 */
interface LLMCacheEntry {
  response: LLMResponse;
  timestamp: number;
  ttl: number;
}

/**
 * @interface LLMStats
 * @description LLM usage statistics
 */
export interface LLMStats {
  totalRequests: number;
  totalTokens: number;
  averageResponseTime: number;
  cacheHitRate: number;
  errors: number;
  lastRequestTime: number;
}

/**
 * @class LLMBridge
 * @description Core LLM integration bridge for AthenaCore
 * @extends EventEmitter
 */
export class LLMBridge extends EventEmitter {
  private config: LLMConfig;
  private model: CustomModel;
  private cache: Map<string, LLMCacheEntry>;
  private stats: LLMStats;
  private isInitialized: boolean = false;
  private initializationPromise?: Promise<void>;

  /**
   * @constructor
   * @param {LLMConfig} config - LLM configuration
   */
  constructor(config: LLMConfig) {
    super();
    this.config = config;
    this.model = new CustomModel(config);
    this.cache = new Map();
    this.stats = {
      totalRequests: 0,
      totalTokens: 0,
      averageResponseTime: 0,
      cacheHitRate: 0,
      errors: 0,
      lastRequestTime: 0
    };
  }

  /**
   * @method initialize
   * @description Initializes the LLM bridge and model
   * @returns {Promise<void>}
   */
  public async initialize(): Promise<void> {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * @private
   * @method performInitialization
   * @description Performs the actual initialization
   */
  private async performInitialization(): Promise<void> {
    try {
      await this.model.initialize();
      this.isInitialized = true;
      this.emit('model:initialized', { 
        timestamp: Date.now(),
        model: this.config.model.name 
      });
    } catch (error) {
      this.isInitialized = false;
      this.emit('error', { 
        type: 'initialization_error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      });
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
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const requestId = request.metadata?.requestId || this.generateRequestId();

    try {
      this.emit('request:started', { requestId, timestamp: startTime });

      const cacheKey = this.generateCacheKey(request);
      
      // Check cache first
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        this.updateStats(true, 0, startTime);
        this.emit('request:cached', { requestId, cacheKey });
        return cachedResponse;
      }

      const response = await this.model.generate(request);
      const duration = Date.now() - startTime;
      
      // Update response with duration
      response.metadata.duration = duration;
      
      // Cache the response
      this.cacheResponse(cacheKey, response);
      
      // Update statistics
      this.updateStats(false, duration, startTime, response.tokens.total);
      
      this.emit('request:completed', { 
        requestId, 
        duration, 
        tokens: response.tokens.total 
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.stats.errors++;
      
      this.emit('request:error', { 
        requestId, 
        error: error instanceof Error ? error.message : String(error),
        duration 
      });
      
      throw error;
    }
  }

  /**
   * @private
   * @method generateRequestId
   * @description Generates a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * @private
   * @method generateCacheKey
   * @description Generates a cache key for the request
   * @param {LLMRequest} request - Generation request
   * @returns {string} Cache key
   */
  private generateCacheKey(request: LLMRequest): string {
    const keyData = {
      prompt: request.prompt,
      parameters: request.parameters,
      context: request.context
    };
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * @private
   * @method getCachedResponse
   * @description Retrieves a cached response if valid
   */
  private getCachedResponse(cacheKey: string): LLMResponse | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.response;
  }

  /**
   * @private
   * @method cacheResponse
   * @description Caches a response with TTL
   */
  private cacheResponse(cacheKey: string, response: LLMResponse): void {
    const ttl = this.config.cache?.ttl || 300000; // 5 minutes default
    this.cache.set(cacheKey, {
      response,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * @private
   * @method updateStats
   * @description Updates usage statistics
   */
  private updateStats(
    isCacheHit: boolean, 
    duration: number, 
    startTime: number, 
    tokens?: number
  ): void {
    this.stats.totalRequests++;
    this.stats.lastRequestTime = startTime;
    
    if (tokens) {
      this.stats.totalTokens += tokens;
    }
    
    if (isCacheHit) {
      this.stats.cacheHitRate = (this.stats.cacheHitRate * (this.stats.totalRequests - 1) + 1) / this.stats.totalRequests;
    } else {
      this.stats.cacheHitRate = (this.stats.cacheHitRate * (this.stats.totalRequests - 1)) / this.stats.totalRequests;
      this.stats.averageResponseTime = (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + duration) / this.stats.totalRequests;
    }
  }

  /**
   * @method clearCache
   * @description Clears the response cache
   */
  public clearCache(): void {
    this.cache.clear();
    this.emit('cache:cleared', { timestamp: Date.now() });
  }

  /**
   * @method getCacheStats
   * @description Returns cache statistics
   */
  public getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: this.stats.cacheHitRate
    };
  }

  /**
   * @method getStats
   * @description Returns usage statistics
   */
  public getStats(): LLMStats {
    return { ...this.stats };
  }

  /**
   * @method updateConfig
   * @description Updates the LLM configuration
   * @param {Partial<LLMConfig>} config - New configuration
   */
  public async updateConfig(config: Partial<LLMConfig>): Promise<void> {
    this.config = { ...this.config, ...config };
    this.model = new CustomModel(this.config);
    this.isInitialized = false;
    this.initializationPromise = undefined;
    
    this.emit('config:updated', { 
      timestamp: Date.now(),
      config: this.config 
    });
    
    await this.initialize();
  }

  /**
   * @method getModelParameters
   * @description Returns the current model parameters
   * @returns {Object} Model parameters
   */
  public getModelParameters(): any {
    return this.model.getParameters();
  }

  /**
   * @method healthCheck
   * @description Performs a health check on the LLM bridge
   */
  public async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      if (!this.isInitialized) {
        return { status: 'unhealthy', details: { reason: 'not_initialized' } };
      }

      // Perform a simple test generation
      const testResponse = await this.generate({
        prompt: 'Hello',
        parameters: { maxTokens: 5 }
      });

      return {
        status: 'healthy',
        details: {
          model: this.config.model.name,
          lastRequest: this.stats.lastRequestTime,
          cacheSize: this.cache.size
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          reason: 'generation_failed',
          error: error instanceof Error ? error.message : String(error)
        }
      };
    }
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
  await bridge.initialize();
  return bridge;
} 