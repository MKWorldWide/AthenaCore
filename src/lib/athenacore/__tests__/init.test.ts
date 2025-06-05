import { initAthenaCore } from '../init';
import { DEFAULT_CONFIG } from '@/config/athenacore';

describe('AthenaCore Initialization', () => {
  it('should initialize with default configuration', async () => {
    const athena = await initAthenaCore(DEFAULT_CONFIG);
    
    expect(athena).toBeDefined();
    expect(athena.kernel).toBeDefined();
    expect(athena.memory).toBeDefined();
    expect(athena.llm).toBeDefined();
    expect(athena.trading).toBeDefined();
    expect(athena.ops).toBeDefined();
  });

  it('should handle custom configuration', async () => {
    const customConfig = {
      ...DEFAULT_CONFIG,
      kernel: {
        ...DEFAULT_CONFIG.kernel,
        debug: true,
        maxConcurrentOps: 20
      }
    };

    const athena = await initAthenaCore(customConfig);
    
    expect(athena).toBeDefined();
    expect(athena.kernel).toBeDefined();
  });

  it('should throw error with invalid configuration', async () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      kernel: {
        ...DEFAULT_CONFIG.kernel,
        maxConcurrentOps: -1 // Invalid value
      }
    };

    await expect(initAthenaCore(invalidConfig)).rejects.toThrow();
  });
}); 