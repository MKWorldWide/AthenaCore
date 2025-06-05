/**
 * @file AthenaCore Configuration
 * @description Core configuration types and interfaces for AthenaCore system
 * @author Sunny & Mrs. K
 * @version 1.0.0
 * @module AthenaCore
 */

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
}

/**
 * @interface AthenaConfig
 * @description Main configuration interface for AthenaCore system
 */
export interface AthenaConfig {
  /** Kernel configuration */
  kernel: KernelConfig;
  /** Memory system configuration */
  memory: MemoryConfig;
  /** LLM integration configuration */
  llm: LLMConfig;
  /** Trading system configuration */
  trading: TradingConfig;
}

/**
 * @constant DEFAULT_CONFIG
 * @description Default configuration values for AthenaCore
 */
export const DEFAULT_CONFIG: AthenaConfig = {
  kernel: {
    maxConcurrentOps: 10,
    debug: false,
    heartbeatInterval: 1000,
    resourceLimits: {
      memory: 1024 * 1024 * 1024, // 1GB
      cpu: 4,
    },
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
  },
}; 