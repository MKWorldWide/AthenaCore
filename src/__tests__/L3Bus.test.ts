import { l3Bus, L3Message } from '../runtime/L3Bus';

describe('L3Bus', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    (l3Bus as any).instance = undefined;
  });

  it('should be a singleton', () => {
    const instance1 = l3Bus;
    const instance2 = l3Bus;
    expect(instance1).toBe(instance2);
  });

  it('should initialize quantum link', (done) => {
    l3Bus.on('quantum:ready', () => {
      expect(l3Bus.isQuantumReady()).toBe(true);
      done();
    });
  });

  it('should send and process messages', async () => {
    const testMessage = {
      type: 'test:message',
      payload: { data: 'test' }
    };

    return new Promise<void>((resolve) => {
      l3Bus.on('message:processed', (message: L3Message) => {
        expect(message.type).toBe(testMessage.type);
        expect(message.payload).toEqual(testMessage.payload);
        resolve();
      });

      l3Bus.send(testMessage);
    });
  });
});
