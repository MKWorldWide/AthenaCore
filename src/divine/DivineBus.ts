/**
 * @file DivineBus.ts
 * @description Secure RPC bridge between AthenaCore and LilithOS
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import * as net from 'net';
import * as tls from 'tls';
import * as crypto from 'crypto';
import { l3Bus } from '../runtime/L3Bus';

export interface DivineMessage {
  id: string;
  type: string;
  timestamp: number;
  payload: any;
  signature?: string;
}

export type DivineHandler = (payload: any) => Promise<any>;

export class DivineBus extends EventEmitter {
  private static instance: DivineBus;
  private server: net.Server | null = null;
  private clients: Set<net.Socket> = new Set();
  private handlers: Map<string, DivineHandler> = new Map();
  private isConnected: boolean = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 10000; // 10 seconds
  private readonly RPC_TIMEOUT = 3000; // 3 seconds
  private readonly sharedSecret: string; // In production, load this from a secure source

  private constructor() {
    super();
    this.sharedSecret = process.env.DIVINE_BUS_SECRET || 'dev-secret-change-me';
    this.initializeHandlers();
  }

  public static getInstance(): DivineBus {
    if (!DivineBus.instance) {
      DivineBus.instance = new DivineBus();
    }
    return DivineBus.instance;
  }

  private initializeHandlers(): void {
    // Register default handlers
    this.registerHandler('ping', async () => 'pong');
    this.registerHandler('get_status', async () => ({
      status: 'online',
      timestamp: Date.now(),
      version: process.env.npm_package_version || '0.1.0',
    }));
  }

  public async start(port: number = 9000): Promise<void> {
    if (this.server) {
      throw new Error('DivineBus server already started');
    }

    this.server = net.createServer(this.handleConnection.bind(this));
    
    return new Promise((resolve, reject) => {
      if (!this.server) return reject(new Error('Server not initialized'));
      
      this.server.listen(port, '127.0.0.1', () => {
        console.log(`DivineBus listening on 127.0.0.1:${port}`);
        this.isConnected = true;
        this.startHeartbeat();
        resolve();
      });

      this.server.on('error', (err) => {
        console.error('DivineBus server error:', err);
        reject(err);
      });
    });
  }

  public async stop(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    for (const client of this.clients) {
      client.destroy();
    }
    this.clients.clear();

    // Close the server
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
      });
      this.server = null;
    }

    this.isConnected = false;
  }

  public registerHandler(type: string, handler: DivineHandler): void {
    this.handlers.set(type, handler);
  }

  public async sendToLilith(type: string, payload: any = {}): Promise<any> {
    if (!this.isConnected) {
      throw new Error('Not connected to LilithOS');
    }

    const message: DivineMessage = {
      id: uuidv4(),
      type,
      timestamp: Date.now(),
      payload,
    };

    // Sign the message
    message.signature = this.signMessage(message);

    // In a real implementation, we would send this to LilithOS
    // For now, we'll just log it
    console.log('Sending message to LilithOS:', JSON.stringify(message, null, 2));
    
    // Simulate a response for now
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ status: 'received', messageId: message.id });
      }, 100);
    });
  }

  private handleConnection(socket: net.Socket): void {
    console.log('New connection from', socket.remoteAddress);
    this.clients.add(socket);

    let buffer = '';
    
    socket.on('data', (data) => {
      try {
        buffer += data.toString();
        let boundary;
        
        // Process complete messages (assuming newline-delimited JSON)
        while ((boundary = buffer.indexOf('\n')) !== -1) {
          const messageStr = buffer.substring(0, boundary);
          buffer = buffer.substring(boundary + 1);
          
          if (messageStr.trim()) {
            this.handleMessage(socket, messageStr);
          }
        }
      } catch (err) {
        console.error('Error processing message:', err);
        this.sendError(socket, 'invalid_message', 'Failed to process message');
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      this.clients.delete(socket);
    });

    socket.on('close', () => {
      console.log('Client disconnected');
      this.clients.delete(socket);
    });
  }

  private async handleMessage(socket: net.Socket, messageStr: string): Promise<void> {
    try {
      const message: DivineMessage = JSON.parse(messageStr);
      
      // Verify message signature
      if (!this.verifyMessage(message)) {
        throw new Error('Invalid message signature');
      }

      const handler = this.handlers.get(message.type);
      if (!handler) {
        throw new Error(`No handler for message type: ${message.type}`);
      }

      // Process the message
      const result = await Promise.race([
        handler(message.payload),
        new Promise((_, reject) => 
          setTimeout(
            () => reject(new Error('Handler timed out')), 
            this.RPC_TIMEOUT
          )
        )
      ]);

      // Send the response
      const response: DivineMessage = {
        id: uuidv4(),
        type: `${message.type}_response`,
        timestamp: Date.now(),
        payload: result,
      };
      response.signature = this.signMessage(response);
      
      this.sendMessage(socket, response);
    } catch (err) {
      console.error('Error handling message:', err);
      this.sendError(socket, 'processing_error', err instanceof Error ? err.message : 'Unknown error');
    }
  }

  private sendMessage(socket: net.Socket, message: DivineMessage): void {
    try {
      const messageStr = JSON.stringify(message) + '\n';
      socket.write(messageStr);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  }

  private sendError(socket: net.Socket, code: string, message: string): void {
    const errorMessage: DivineMessage = {
      id: uuidv4(),
      type: 'error',
      timestamp: Date.now(),
      payload: { code, message },
    };
    errorMessage.signature = this.signMessage(errorMessage);
    this.sendMessage(socket, errorMessage);
  }

  private signMessage(message: Omit<DivineMessage, 'signature'>): string {
    const hmac = crypto.createHmac('sha256', this.sharedSecret);
    hmac.update(JSON.stringify({
      id: message.id,
      type: message.type,
      timestamp: message.timestamp,
      payload: message.payload,
    }));
    return hmac.digest('hex');
  }

  private verifyMessage(message: DivineMessage): boolean {
    if (!message.signature) return false;
    
    const { signature, ...messageWithoutSig } = message;
    const calculatedSig = this.signMessage(messageWithoutSig);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(calculatedSig)
    );
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.clients.size > 0) {
        const heartbeat: DivineMessage = {
          id: uuidv4(),
          type: 'heartbeat',
          timestamp: Date.now(),
          payload: { uptime: process.uptime() },
        };
        heartbeat.signature = this.signMessage(heartbeat);
        
        // Broadcast to all connected clients
        const messageStr = JSON.stringify(heartbeat) + '\n';
        for (const client of this.clients) {
          try {
            client.write(messageStr);
          } catch (err) {
            console.error('Error sending heartbeat:', err);
            this.clients.delete(client);
          }
        }
      }
    }, this.HEARTBEAT_INTERVAL);
  }

  public async sendCommand(command: string, payload: any = {}): Promise<any> {
    return this.sendToLilith(command, payload);
  }

  public async restartModule(moduleName: string): Promise<boolean> {
    try {
      const response = await this.sendCommand('restart_module', { module: moduleName });
      return response?.success === true;
    } catch (err) {
      console.error(`Failed to restart module ${moduleName}:`, err);
      return false;
    }
  }

  public async beginDreamSync(): Promise<boolean> {
    try {
      const response = await this.sendCommand('begin_dreamsync');
      return response?.success === true;
    } catch (err) {
      console.error('Failed to begin dream sync:', err);
      return false;
    }
  }

  public async getBiometrics(): Promise<any> {
    try {
      return await this.sendCommand('get_biometrics');
    } catch (err) {
      console.error('Failed to get biometrics:', err);
      return null;
    }
  }
}

export const divineBus = DivineBus.getInstance();

// Initialize and start the bus when imported
if (require.main === module) {
  const bus = DivineBus.getInstance();
  bus.start().catch(console.error);
  
  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down DivineBus...');
    await bus.stop();
    process.exit(0);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
