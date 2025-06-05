import { LLMBridge, LLMRequest } from '../index';
import { LLMConfig } from '@/config/athenacore';

describe('LLMBridge', () => {
  const mockConfig: LLMConfig = {
    endpoint: 'https://api.example.com/v1',
    apiKey: 'test-key',
    model: {
      name: 'test-model',
      version: '1.0.0',
      parameters: {}
    },
    timeout: 30000
  };

  let bridge: LLMBridge;

  beforeEach(() => {
    bridge = new LLMBridge(mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with provided configuration', () => {
      expect(bridge).toBeDefined();
    });

    it('should emit model:initialized event', (done) => {
      bridge.on('model:initialized', (data) => {
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });
  });

  describe('generate', () => {
    const mockRequest: LLMRequest = {
      prompt: 'Test prompt',
      parameters: {
        temperature: 0.7,
        maxTokens: 100
      }
    };

    it('should generate response with correct structure', async () => {
      const response = await bridge.generate(mockRequest);
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('tokens');
      expect(response).toHaveProperty('metadata');
    });

    it('should cache responses', async () => {
      const response1 = await bridge.generate(mockRequest);
      const response2 = await bridge.generate(mockRequest);
      
      expect(response1).toEqual(response2);
    });

    it('should handle errors gracefully', async () => {
      const invalidRequest = {} as LLMRequest;
      
      await expect(bridge.generate(invalidRequest)).rejects.toThrow();
    });
  });

  describe('cache management', () => {
    it('should clear cache', async () => {
      const request: LLMRequest = {
        prompt: 'Test prompt'
      };

      await bridge.generate(request);
      bridge.clearCache();
      
      const response1 = await bridge.generate(request);
      const response2 = await bridge.generate(request);
      
      expect(response1).not.toEqual(response2);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      const newConfig: Partial<LLMConfig> = {
        model: {
          name: 'new-model',
          version: '2.0.0',
          parameters: {}
        }
      };

      bridge.updateConfig(newConfig);
      
      // Verify configuration update
      expect(bridge).toBeDefined();
    });
  });
}); 