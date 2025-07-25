/**
 * @file L3Bus.ts
 * @description Quantum communication bus for managing L3 state and message passing
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

export interface L3Message {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  quantumSignature?: string;
}

export class L3Bus extends EventEmitter {
  private static instance: L3Bus;
  private messageQueue: Map<string, L3Message> = new Map();
  private quantumReady: boolean = false;
  private initializationPromise: Promise<void>;

  /**
   * @internal
   * @privateRemarks
   * Made public for testing purposes. In production code, use L3Bus.getInstance() instead.
   */
  public constructor() {
    super();
    this.initializationPromise = this.initializeQuantumLink();
  }

  public async ensureReady(): Promise<void> {
    await this.initializationPromise;
  }

  public static getInstance(): L3Bus {
    if (!L3Bus.instance) {
      L3Bus.instance = new L3Bus();
    }
    return L3Bus.instance;
  }

  private async initializeQuantumLink(): Promise<void> {
    if (this.quantumReady) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      // Simulate quantum connection initialization with a small delay
      setTimeout(() => {
        this.quantumReady = true;
        // Emit the ready event before resolving the promise
        this.emit('quantum:ready');
        resolve();
      }, 10);
    });
  }

  public async send(message: Omit<L3Message, 'id' | 'timestamp'>): Promise<string> {
    await this.ensureReady();
    
    const l3Message: L3Message = {
      id: uuidv4(),
      ...message,
      timestamp: Date.now()
    };

    this.messageQueue.set(l3Message.id, l3Message);
    this.emit('message:queued', l3Message);
    
    // Process the message immediately since we're already initialized
    await this.processMessage(l3Message);
    
    return l3Message.id;
  }

  private async processMessage(message: L3Message): Promise<void> {
    try {
      // Process message through quantum channel
      this.emit('message:processing', message);
      
      // Forward to quantum processor
      // const result = await quantumProcessor.process(message);
      
      this.messageQueue.delete(message.id);
      this.emit('message:processed', { ...message, status: 'completed' });
    } catch (error) {
      this.emit('message:error', { ...message, error });
    }
  }

  public getMessageStatus(messageId: string): L3Message | undefined {
    return this.messageQueue.get(messageId);
  }

  public isQuantumReady(): boolean {
    return this.quantumReady;
  }
}

export const l3Bus = L3Bus.getInstance();
