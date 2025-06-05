import { CustomModel } from '../model';
import { LLMConfig } from '@/config/athenacore';
import { LLMRequest } from '../index';

describe('CustomModel', () => {
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

  let model: CustomModel;

  beforeEach(() => {
    model = new CustomModel(mockConfig);
  });

  describe('initialization', () => {
    it('should initialize with provided configuration', () => {
      expect(model).toBeDefined();
    });

    it('should set default parameters', () => {
      const parameters = model.getParameters();
      
      expect(parameters.architecture).toBe('transformer');
      expect(parameters.layers).toBe(12);
      expect(parameters.hiddenSize).toBe(768);
      expect(parameters.attentionHeads).toBe(12);
      expect(parameters.vocabSize).toBe(50000);
      expect(parameters.maxSequenceLength).toBe(2048);
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

    it('should throw error if not initialized', async () => {
      await expect(model.generate(mockRequest)).rejects.toThrow('Model not initialized');
    });

    it('should generate response after initialization', async () => {
      await model.initialize();
      const response = await model.generate(mockRequest);
      
      expect(response).toHaveProperty('content');
      expect(response).toHaveProperty('confidence');
      expect(response).toHaveProperty('tokens');
      expect(response).toHaveProperty('metadata');
    });

    it('should include correct metadata in response', async () => {
      await model.initialize();
      const response = await model.generate(mockRequest);
      
      expect(response.metadata.model).toBe(mockConfig.model.name);
      expect(response.metadata.temperature).toBe(mockRequest.parameters?.temperature);
      expect(response.metadata.timestamp).toBeDefined();
    });
  });

  describe('parameter updates', () => {
    it('should update parameters', async () => {
      const newParameters = {
        layers: 24,
        hiddenSize: 1024,
        attentionHeads: 16
      };

      model.updateParameters(newParameters);
      const parameters = model.getParameters();
      
      expect(parameters.layers).toBe(24);
      expect(parameters.hiddenSize).toBe(1024);
      expect(parameters.attentionHeads).toBe(16);
    });

    it('should require reinitialization after parameter update', async () => {
      await model.initialize();
      model.updateParameters({ layers: 24 });
      
      await expect(model.generate({ prompt: 'test' })).rejects.toThrow('Model not initialized');
    });
  });

  describe('token estimation', () => {
    it('should estimate tokens for input text', async () => {
      await model.initialize();
      const request: LLMRequest = {
        prompt: 'This is a test prompt with multiple words'
      };

      const response = await model.generate(request);
      
      expect(response.tokens.prompt).toBeGreaterThan(0);
      expect(response.tokens.completion).toBeGreaterThan(0);
      expect(response.tokens.total).toBe(response.tokens.prompt + response.tokens.completion);
    });
  });
}); 