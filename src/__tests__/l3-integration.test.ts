import { L3Bus, l3Bus } from '../runtime/L3Bus';
import { divinaRelay } from '../services/DivinaRelay';
import PGES from '../agents/PGES';

describe('L3 Integration', () => {
  // Test L3Bus functionality
  describe('L3Bus', () => {
    it('should initialize quantum link', async () => {
      // Create a new instance to ensure we're testing from a clean state
      const testBus = new L3Bus();
      
      try {
        // Verify the bus is initially not ready
        expect(testBus.isQuantumReady()).toBe(false);
        
        // Set up event listener before initialization
        let readyEventEmitted = false;
        testBus.on('quantum:ready', () => {
          readyEventEmitted = true;
        });
        
        // Wait for initialization to complete
        await testBus.ensureReady();
        
        // Verify the ready state after initialization
        expect(testBus.isQuantumReady()).toBe(true);
        
        // Verify the ready event was emitted
        expect(readyEventEmitted).toBe(true);
        
        // Test that ensureReady() resolves immediately when already ready
        const startTime = Date.now();
        await testBus.ensureReady();
        const duration = Date.now() - startTime;
        expect(duration).toBeLessThan(50); // Should resolve immediately
      } finally {
        // Clean up
        testBus.removeAllListeners();
      }
    });

    it('should send and process messages', async () => {
      // Ensure the bus is ready
      await l3Bus.ensureReady();
      
      const testMessage = {
        type: 'test:message',
        payload: { data: 'test' }
      };

      // Set up the message processed listener first
      const messageProcessed = new Promise<void>((resolve) => {
        l3Bus.once('message:processed', (message) => {
          expect(message.type).toBe(testMessage.type);
          expect(message.payload).toEqual(testMessage.payload);
          resolve();
        });
      });

      // Send the message
      await l3Bus.send(testMessage);
      
      // Wait for the message to be processed
      await messageProcessed;
    });
  });

  // Test DivinaRelay functionality
  describe('DivinaRelay', () => {
    it('should be a singleton', () => {
      const instance1 = divinaRelay;
      const instance2 = divinaRelay;
      expect(instance1).toBe(instance2);
    });

    it('should schedule quantum tasks', async () => {
      const task = {
        operation: 'test:operation',
        parameters: { test: 'data' }
      };

      const taskId = await divinaRelay.scheduleQuantumTask(task);
      expect(taskId).toBeDefined();
      
      const taskStatus = divinaRelay.getTaskStatus(taskId);
      expect(taskStatus.status).toBe('queued');
    });
  });

  // Test PGES integration
  describe('PGES', () => {
    it('should initialize and execute', async () => {
      const result = await PGES.execute('test');
      expect(result).toContain('PGES execution completed');
    });

    it('should handle quantum state requests', async () => {
      const task = {
        operation: 'test:state',
        parameters: { test: 'state' }
      };
      
      const taskId = await divinaRelay.scheduleQuantumTask(task);
      const state = await PGES.getQuantumState(taskId);
      
      expect(state).toBeDefined();
      expect(state.status).toBeDefined();
    });
  });
});
