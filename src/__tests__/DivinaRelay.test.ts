import { divinaRelay } from '../services/DivinaRelay';
import { l3Bus } from '../runtime/L3Bus';

describe('DivinaRelay', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    (divinaRelay as any).instance = undefined;
  });

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

  it('should handle quantum task results', async () => {
    const testResult = { result: 'success', data: 'test data' };
    
    // Simulate a quantum task result
    l3Bus.emit('message:processed', {
      id: 'test-message-id',
      type: 'quantum:task:result',
      payload: {
        taskId: 'test-task-id',
        result: testResult
      },
      timestamp: Date.now()
    });

    // Give the event loop a chance to process the event
    await new Promise(resolve => setTimeout(resolve, 10));
    
    const taskStatus = divinaRelay.getTaskStatus('test-task-id');
    expect(taskStatus.status).toBe('completed');
    expect(taskStatus.result).toEqual(testResult);
  });
});
