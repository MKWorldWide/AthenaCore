import { divineBus } from '../divine/DivineBus';
import { l3Bus, L3Message } from '../runtime/L3Bus';
import { LogKitten } from '../utils/LogKitten';

export class DivineBusIntegration {
  private static instance: DivineBusIntegration;
  private logger: LogKitten;
  private isInitialized: boolean = false;

  private constructor() {
    this.logger = new LogKitten('DivineBusIntegration');
  }

  public static getInstance(): DivineBusIntegration {
    if (!DivineBusIntegration.instance) {
      DivineBusIntegration.instance = new DivineBusIntegration();
    }
    return DivineBusIntegration.instance;
  }

  public async initialize(port: number = 9000): Promise<void> {
    if (this.isInitialized) {
      this.logger.info('DivineBus integration already initialized');
      return;
    }

    try {
      // Start the DivineBus server
      await divineBus.start(port);
      this.logger.info(`DivineBus server started on port ${port}`);

      // Register L3Bus event handlers
      this.setupL3BusHandlers();

      // Register DivineBus message handlers
      this.setupDivineBusHandlers();

      this.isInitialized = true;
      this.logger.info('DivineBus integration initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize DivineBus integration:', error);
      throw error;
    }
  }

  private setupL3BusHandlers(): void {
    // Forward L3Bus messages to connected LilithOS clients
    l3Bus.on('message:queued', (message: L3Message) => {
      divineBus.sendToLilith('l3_message', {
        type: 'queued',
        messageId: message.id,
        timestamp: message.timestamp,
        messageType: message.type,
      }).catch((error: unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to forward L3Bus message:', errorObj);
      });
    });

    l3Bus.on('message:processing', (message: L3Message) => {
      divineBus.sendToLilith('l3_message', {
        type: 'processing',
        messageId: message.id,
        timestamp: Date.now(),
        messageType: message.type,
      }).catch((error: unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to forward L3Bus processing event:', errorObj);
      });
    });

    l3Bus.on('message:processed', (result: { id: string }) => {
      divineBus.sendToLilith('l3_message', {
        type: 'processed',
        messageId: result.id,
        timestamp: Date.now(),
        status: 'completed',
      }).catch((error: unknown) => {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to forward L3Bus processed event:', errorObj);
      });
    });

    l3Bus.on('message:error', (error: { id: string, error?: Error }) => {
      divineBus.sendToLilith('l3_message', {
        type: 'error',
        messageId: error.id,
        timestamp: Date.now(),
        error: error.error?.message || 'Unknown error',
      }).catch((err: unknown) => {
        const errorObj = err instanceof Error ? err : new Error(String(err));
        this.logger.error('Failed to forward L3Bus error event:', errorObj);
      });
    });
  }

  private setupDivineBusHandlers(): void {
    // Register handler for LilithOS module control
    divineBus.registerHandler('control_module', async (payload) => {
      const { action, moduleName, params = {} } = payload;
      
      try {
        switch (action) {
          case 'restart':
            // In a real implementation, this would interface with L3Bus
            // to restart the specified module
            this.logger.info(`Restarting module: ${moduleName}`);
            return { success: true, module: moduleName };
          
          case 'status':
            // Return module status
            return { 
              success: true, 
              module: moduleName, 
              status: 'running', // In a real implementation, get actual status
              lastUpdated: Date.now()
            };
          
          case 'config':
            // Update module configuration
            this.logger.info(`Updating config for module: ${moduleName}`, params);
            return { success: true, module: moduleName, updated: true };
          
          default:
            throw new Error(`Unsupported action: ${action}`);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Module control error (${action} ${moduleName}):`, errorObj);
        throw errorObj;
      }
    });

    // Register handler for biometric data requests
    divineBus.registerHandler('get_biometrics', async () => {
      try {
        // In a real implementation, this would collect system metrics
        const metrics = {
          timestamp: Date.now(),
          cpu: {
            usage: 0, // Placeholder
            temperature: 0, // Placeholder
          },
          memory: {
            total: 0, // Placeholder
            used: 0, // Placeholder
            free: 0, // Placeholder
          },
          processes: {
            total: 0, // Placeholder
            running: 0, // Placeholder
          },
        };
        
        return { success: true, metrics };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to collect biometrics:', errorObj);
        throw errorObj;
      }
    });

    // Register handler for dream sync requests
    divineBus.registerHandler('begin_dreamsync', async (payload) => {
      try {
        const { syncType = 'full', priority = 'normal' } = payload || {};
        this.logger.info(`Initiating dream sync (type: ${syncType}, priority: ${priority})`);
        
        // In a real implementation, this would trigger the dream sync process
        // and return a sync ID for tracking
        const syncId = `sync_${Date.now()}`;
        
        return { 
          success: true, 
          syncId,
          status: 'queued',
          timestamp: Date.now()
        };
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to begin dream sync:', errorObj);
        throw errorObj;
      }
    });

    // Register handler for incoming messages
    divineBus.registerHandler('message', async (payload) => {
      const { type, data } = payload;
      this.logger.debug(`Received message of type ${type}`, data);

      try {
        switch (type) {
          case 'ping':
            this.logger.debug('Ping received, responding with pong');
            divineBus.sendToLilith('pong', { timestamp: Date.now() })
              .catch((error: unknown) => {
                const errorObj = error instanceof Error ? error : new Error(String(error));
                this.logger.error('Failed to send pong:', errorObj);
              });
            break;

          case 'get_metrics':
            this.handleGetMetrics();
            break;

          case 'restart_module':
            this.handleRestartModule(data);
            break;

          case 'get_biometrics':
            this.handleGetBiometrics(data);
            break;

          case 'begin_dreamsync':
            this.handleBeginDreamsync(data);
            break;

          case 'l3_message':
            this.handleL3Message(data);
            break;

          default:
            this.logger.warn(`Unknown message type: ${type}`);
        }
      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Error handling message type ${type}:`, errorObj);
      }
    });
  }

  private async handleRestartModule(moduleName: string): Promise<void> {
    if (!moduleName) {
      this.logger.warn('Restart module called without module name');
      return;
    }

    try {
      // In a real implementation, this would interact with the module system
      this.logger.info(`Restarting module: ${moduleName}`);
      
      // Simulate module restart
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      await divineBus.sendToLilith('module_restarted', {
        module: moduleName,
        success: true,
        timestamp: Date.now(),
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Failed to restart module ${moduleName}:`, errorObj);
      
      await divineBus.sendToLilith('module_restart_failed', {
        module: moduleName,
        error: errorObj.message,
        timestamp: Date.now(),
      }).catch((err: unknown) => {
        const sendErr = err instanceof Error ? err : new Error(String(err));
        this.logger.error('Failed to send restart failure notification:', sendErr);
      });
    }
  }

  private async handleGetMetrics(): Promise<void> {
    try {
      const metrics = await this.collectSystemMetrics();
      await divineBus.sendToLilith('metrics', metrics);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to collect or send metrics:', errorObj);
    }
  }

  private async handleGetBiometrics(data: any): Promise<void> {
    try {
      // In a real implementation, this would collect system metrics
      const metrics = {
        timestamp: Date.now(),
        cpu: {
          usage: 0, // Placeholder
          temperature: 0, // Placeholder
        },
        memory: {
          total: 0, // Placeholder
          used: 0, // Placeholder
          free: 0, // Placeholder
        },
        processes: {
          total: 0, // Placeholder
          running: 0, // Placeholder
        },
      };
      
      await divineBus.sendToLilith('biometrics', metrics);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to collect or send biometrics:', errorObj);
    }
  }

  private async handleBeginDreamsync(data: any): Promise<void> {
    try {
      const { syncType = 'full', priority = 'normal' } = data || {};
      this.logger.info(`Initiating dream sync (type: ${syncType}, priority: ${priority})`);
      
      // In a real implementation, this would trigger the dream sync process
      // and return a sync ID for tracking
      const syncId = `sync_${Date.now()}`;
      
      await divineBus.sendToLilith('dreamsync_started', { 
        syncId,
        status: 'queued',
        timestamp: Date.now()
      });
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to begin dream sync:', errorObj);
    }
  }

  private async collectSystemMetrics(): Promise<any> {
    try {
      // In a real implementation, this would collect actual system metrics
      // For now, we'll return simulated data
      return {
        timestamp: Date.now(),
        system: {
          uptime: process.uptime(),
          platform: process.platform,
          arch: process.arch,
          nodeVersion: process.version,
          memory: {
            rss: process.memoryUsage().rss,
            heapTotal: process.memoryUsage().heapTotal,
            heapUsed: process.memoryUsage().heapUsed,
            external: process.memoryUsage().external,
          },
          cpu: {
            usage: process.cpuUsage(),
          },
        },
        // Add more metrics as needed
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to collect system metrics:', errorObj);
      throw errorObj;
    }
  }

  private async handleL3Message(data: any): Promise<void> {
    try {
      // Create a properly typed L3Message
      const l3Message: Omit<L3Message, 'id' | 'timestamp'> & { type: string } = {
        type: 'divine_message',
        payload: data,
      };
      
      // Forward message to L3Bus
      await l3Bus.send(l3Message);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to send message to L3Bus:', errorObj);
    }
  }

  public async sendToL3Bus(message: any): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('DivineBus integration not initialized');
    }

    try {
      // Create a properly typed L3Message
      const l3Message: Omit<L3Message, 'id' | 'timestamp'> & { type: string } = {
        type: 'divine_message',
        payload: message,
      };
      
      // Forward message to L3Bus
      await l3Bus.send(l3Message);
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to send message to L3Bus:', errorObj);
      throw errorObj;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      await divineBus.stop();
      this.isInitialized = false;
      this.logger.info('DivineBus integration stopped');
    } catch (error) {
      this.logger.error('Error stopping DivineBus integration:', error);
      throw error;
    }
  }
}

export const divineBusIntegration = DivineBusIntegration.getInstance();
