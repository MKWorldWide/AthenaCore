/**
 * @file config.ts
 * @description Configuration for the DivineBus bridge
 */

export interface DivineBusConfig {
  /**
   * Whether the DivineBus is enabled
   * @default false
   */
  enabled: boolean;
  
  /**
   * Host to bind the DivineBus server to
   * @default '127.0.0.1'
   */
  host: string;
  
  /**
   * Port to bind the DivineBus server to
   * @default 9000
   */
  port: number;
  
  /**
   * Shared secret for message signing and verification
   * In production, this should be set via environment variable DIVINE_BUS_SECRET
   * @default 'dev-secret-change-me'
   */
  sharedSecret: string;
  
  /**
   * Heartbeat interval in milliseconds
   * @default 10000 (10 seconds)
   */
  heartbeatInterval: number;
  
  /**
   * RPC timeout in milliseconds
   * @default 3000 (3 seconds)
   */
  rpcTimeout: number;
  
  /**
   * Maximum number of connection retries
   * @default 5
   */
  maxRetries: number;
  
  /**
   * Delay between connection retries in milliseconds
   * @default 1000 (1 second)
   */
  retryDelay: number;
  
  /**
   * Enable TLS/SSL for secure communication
   * @default false
   */
  tls: {
    enabled: boolean;
    /**
     * Path to TLS certificate file (PEM format)
     */
    certPath?: string;
    /**
     * Path to TLS private key file (PEM format)
     */
    keyPath?: string;
    /**
     * Path to CA certificate file (PEM format)
     */
    caPath?: string;
    /**
     * Whether to reject unauthorized TLS connections
     * @default true
     */
    rejectUnauthorized: boolean;
  };
  
  /**
   * Logging configuration
   */
  logging: {
    /**
     * Log level (error, warn, info, debug, trace)
     * @default 'info'
     */
    level: string;
    
    /**
     * Whether to log to console
     * @default true
     */
    console: boolean;
    
    /**
     * Path to log file (optional)
     */
    file?: string;
    
    /**
     * Whether to log message contents (be careful with sensitive data)
     * @default false
     */
    logMessageContents: boolean;
  };
}

/**
 * Default configuration for DivineBus
 */
export const defaultDivineBusConfig: DivineBusConfig = {
  enabled: process.env.DIVINE_BUS_ENABLED === 'true' || false,
  host: process.env.DIVINE_BUS_HOST || '127.0.0.1',  
  port: parseInt(process.env.DIVINE_BUS_PORT || '9000', 10),
  sharedSecret: process.env.DIVINE_BUS_SECRET || 'dev-secret-change-me',
  heartbeatInterval: 10000, // 10 seconds
  rpcTimeout: 3000, // 3 seconds
  maxRetries: 5,
  retryDelay: 1000, // 1 second
  tls: {
    enabled: process.env.DIVINE_BUS_TLS_ENABLED === 'true' || false,
    certPath: process.env.DIVINE_BUS_TLS_CERT_PATH,
    keyPath: process.env.DIVINE_BUS_TLS_KEY_PATH,
    caPath: process.env.DIVINE_BUS_TLS_CA_PATH,
    rejectUnauthorized: process.env.DIVINE_BUS_TLS_REJECT_UNAUTHORIZED !== 'false',
  },
  logging: {
    level: process.env.DIVINE_BUS_LOG_LEVEL || 'info',
    console: process.env.DIVINE_BUS_LOG_CONSOLE !== 'false',
    file: process.env.DIVINE_BUS_LOG_FILE,
    logMessageContents: process.env.DIVINE_BUS_LOG_MESSAGE_CONTENTS === 'true',
  },
};

/**
 * Merge user configuration with defaults
 */
export function getDivineBusConfig(overrides: Partial<DivineBusConfig> = {}): DivineBusConfig {
  return {
    ...defaultDivineBusConfig,
    ...overrides,
    tls: {
      ...defaultDivineBusConfig.tls,
      ...(overrides.tls || {}),
    },
    logging: {
      ...defaultDivineBusConfig.logging,
      ...(overrides.logging || {}),
    },
  };
}
