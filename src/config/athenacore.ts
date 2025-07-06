/**
 * @file AthenaCore Configuration
 * @description Core configuration types and interfaces for AthenaCore system
 * @author Sunny & Mrs. K
 * @version 1.0.0
 * @module AthenaCore
 */

import { LilithConfig } from '../lib/athenacore/modules/lilith';
import { DreamscapeConfig } from '../lib/athenacore/modules/dreamscape';

/**
 * @interface KernelConfig
 * @description Configuration for the core kernel system
 */
export interface KernelConfig {
  /** Maximum number of concurrent operations */
  maxConcurrentOps: number;
  /** Debug mode flag */
  debug: boolean;
  /** System heartbeat interval in milliseconds */
  heartbeatInterval: number;
  /** Resource allocation limits */
  resourceLimits: {
    memory: number;
    cpu: number;
    gpu?: number;
  };
}

/**
 * @interface MemoryConfig
 * @description Configuration for the memory management system
 */
export interface MemoryConfig {
  /** Maximum memory capacity in bytes */
  maxCapacity: number;
  /** Memory persistence configuration */
  persistence: {
    enabled: boolean;
    path: string;
    interval: number;
  };
  /** Cache configuration */
  cache: {
    enabled: boolean;
    maxSize: number;
    ttl: number;
  };
  redisUrl?: string;
  vectorStore?: "pinecone" | "weaviate" | "local";
}

/**
 * @interface LLMConfig
 * @description Configuration for the LLM integration bridge
 */
export interface LLMConfig {
  /** API endpoint for LLM service */
  endpoint: string;
  /** API key for authentication */
  apiKey: string;
  /** Model configuration */
  model: {
    name: string;
    version: string;
    parameters: Record<string, unknown>;
  };
  /** Request timeout in milliseconds */
  timeout: number;
  provider: "openai" | "mistral" | "custom";
  temperature: number;
  /** Cache configuration */
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
}

/**
 * @interface TradingConfig
 * @description Configuration for the trading relay system
 */
export interface TradingConfig {
  /** Trading platform API endpoint */
  endpoint: string;
  /** API credentials */
  credentials: {
    key: string;
    secret: string;
  };
  /** Trading parameters */
  parameters: {
    maxPositionSize: number;
    riskLimit: number;
    allowedInstruments: string[];
  };
  platform: "oanda" | "binance" | "paper";
  accountId: string;
}

/**
 * @interface AthenaConfig
 * @description Main configuration interface for AthenaCore system
 */
export interface AthenaConfig {
  /** Kernel configuration */
  kernel: {
    name: string;
    sovereignty: boolean;
    autoSelfHeal: boolean;
  };
  /** Memory system configuration */
  memory: MemoryConfig;
  /** LLM integration configuration */
  llm: LLMConfig;
  /** Trading system configuration */
  trading: TradingConfig;
  lilith: LilithConfig;
  dreamscape: DreamscapeConfig;
}

/**
 * @constant DEFAULT_CONFIG
 * @description Default configuration values for AthenaCore
 */
export const DEFAULT_CONFIG: AthenaConfig = {
  kernel: {
    name: "AthenaCore",
    sovereignty: true,
    autoSelfHeal: true,
  },
  memory: {
    maxCapacity: 1024 * 1024 * 1024, // 1GB
    persistence: {
      enabled: true,
      path: "./data/memory",
      interval: 60000, // 1 minute
    },
    cache: {
      enabled: true,
      maxSize: 100 * 1024 * 1024, // 100MB
      ttl: 3600000, // 1 hour
    },
    redisUrl: process.env.REDIS_URL,
    vectorStore: "pinecone",
  },
  llm: {
    endpoint: "https://api.openai.com/v1",
    apiKey: "",
    model: {
      name: "gpt-4",
      version: "latest",
      parameters: {},
    },
    timeout: 30000,
    provider: "openai",
    temperature: 0.25,
    cache: {
      enabled: true,
      ttl: 300000, // 5 minutes
      maxSize: 1000
    }
  },
  trading: {
    endpoint: "https://api.trading.com/v1",
    credentials: {
      key: "",
      secret: "",
    },
    parameters: {
      maxPositionSize: 100000,
      riskLimit: 0.02,
      allowedInstruments: ["BTC/USD", "ETH/USD"],
    },
    platform: "oanda",
    accountId: process.env.OANDA_ACCOUNT_ID || "",
  },
  lilith: {
    patternRecognition: {
      enabled: true,
      minConfidence: 0.7,
      maxPatterns: 100,
      algorithms: ["market", "behavioral", "temporal"],
      sensitivity: 0.8
    },
    decisionMaking: {
      enabled: true,
      autonomy: 0.8,
      maxDecisions: 50,
      riskTolerance: 0.3,
      learningRate: 0.1
    },
    learning: {
      enabled: true,
      adaptationRate: 0.1,
      memorySize: 1000,
      reinforcementLearning: true
    },
    performance: {
      maxConcurrentAnalyses: 10,
      timeout: 30000,
      retryAttempts: 3
    }
  },
  dreamscape: {
    consciousness: {
      enabled: true,
      mappingInterval: 1000,
      minStability: 0.7,
      depthLevels: 5,
      sensitivity: 0.8
    },
    patternRecognition: {
      enabled: true,
      minClarity: 0.8,
      maxPatterns: 100,
      algorithms: ["symbolic", "emotional", "archetypal"],
      archetypeMapping: true
    },
    integration: {
      withLilith: true,
      withAthena: true,
      syncInterval: 5000,
      crossPatternAnalysis: true
    },
    performance: {
      maxConcurrentMappings: 5,
      timeout: 30000,
      cacheSize: 1000
    }
  }
};

/**
 * @constant defaultAthenaConfig
 * @description Export the default configuration for backward compatibility
 */
export const defaultAthenaConfig = DEFAULT_CONFIG; 