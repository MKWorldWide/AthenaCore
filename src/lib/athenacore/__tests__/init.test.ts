import { initializeAthenaCore } from '../init';
import { DEFAULT_CONFIG } from '../../../config/athenacore';

describe('AthenaCore Initialization', () => {
  it('should initialize successfully with default config', async () => {
    const athena = await initializeAthenaCore(DEFAULT_CONFIG);
    
    expect(athena).toBeDefined();
    expect(athena.llm).toBeDefined();
    expect(athena.verse).toBeDefined();
    expect(athena.lilith).toBeDefined();
    expect(athena.dreamscape).toBeDefined();
    expect(athena.ops).toBeDefined();
  });

  it('should throw error with invalid config', async () => {
    const invalidConfig = {
      ...DEFAULT_CONFIG,
      llm: {
        ...DEFAULT_CONFIG.llm,
        apiKey: '' // Invalid empty API key
      }
    };

    await expect(initializeAthenaCore(invalidConfig)).rejects.toThrow();
  });
}); 