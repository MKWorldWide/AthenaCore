import { divineBus } from '../DivineBus';
import net from 'net';
import { v4 as uuidv4 } from 'uuid';

describe('DivineBus', () => {
  let bus: ReturnType<typeof divineBus>;
  const TEST_PORT = 9001; // Different port for testing
  
  beforeAll(async () => {
    bus = divineBus;
    await bus.start(TEST_PORT);
  });
  
  afterAll(async () => {
    await bus.stop();
  });
  
  test('should start and accept connections', (done) => {
    const client = net.createConnection({ port: TEST_PORT }, () => {
      expect(client.connecting).toBe(false);
      client.end();
      done();
    });
    
    client.on('error', done);
  });
  
  test('should handle ping messages', async () => {
    const response = await bus.sendToLilith('ping');
    expect(response).toBeDefined();
    expect(response.status).toBe('received');
  });
  
  test('should call registered handlers', async () => {
    const testId = uuidv4();
    const testData = { test: 'data', id: testId };
    
    // Register a test handler
    bus.registerHandler('test_handler', async (payload) => {
      return { ...payload, processed: true };
    });
    
    // Send a test message
    const response = await bus.sendToLilith('test_handler', testData);
    
    expect(response).toBeDefined();
    expect(response.processed).toBe(true);
    expect(response.id).toBe(testId);
  });
  
  test('should handle errors in handlers', async () => {
    // Register a handler that throws an error
    bus.registerHandler('error_handler', async () => {
      throw new Error('Test error');
    });
    
    await expect(bus.sendToLilith('error_handler')).rejects.toThrow();
  });
  
  test('should handle invalid message types', async () => {
    await expect(bus.sendToLilith('nonexistent_handler')).rejects.toThrow();
  });
});
