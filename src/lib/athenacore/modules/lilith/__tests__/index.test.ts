/**
 * @file AthenaCore Lilith Module Tests
 * @description Test suite for the Lilith module
 * @author Sunny & Mrs. K
 * @version 1.0.0
 */

import { Lilith, LilithConfig, Pattern, Decision } from '../index';

describe('Lilith Module', () => {
  let lilith: Lilith;
  const defaultConfig: LilithConfig = {
    patternRecognition: {
      enabled: true,
      minConfidence: 0.7,
      maxPatterns: 100
    },
    decisionMaking: {
      enabled: true,
      autonomy: 0.8,
      maxDecisions: 50
    },
    learning: {
      enabled: true,
      adaptationRate: 0.1,
      memorySize: 1000
    }
  };

  beforeEach(async () => {
    lilith = new Lilith(defaultConfig);
    await lilith.initialize();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      expect(lilith).toBeDefined();
      const patterns = lilith.getPatterns();
      const decisions = lilith.getDecisions();
      expect(patterns).toHaveLength(0);
      expect(decisions).toHaveLength(0);
    });

    it('should throw error when using uninitialized instance', async () => {
      const uninitializedLilith = new Lilith(defaultConfig);
      await expect(uninitializedLilith.recognizePattern({})).rejects.toThrow('Lilith not initialized');
    });
  });

  describe('Pattern Recognition', () => {
    it('should recognize patterns in input data', async () => {
      const testData = { market: 'BTC/USD', price: 50000 };
      const patterns = await lilith.recognizePattern(testData);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        type: 'custom',
        confidence: expect.any(Number),
        data: { input: testData }
      });
    });

    it('should emit pattern:recognized event', (done) => {
      const testData = { market: 'ETH/USD', price: 3000 };
      
      lilith.on('pattern:recognized', (pattern: Pattern) => {
        expect(pattern).toBeDefined();
        expect(pattern.data.input).toEqual(testData);
        done();
      });

      lilith.recognizePattern(testData);
    });
  });

  describe('Decision Making', () => {
    it('should make decisions based on context', async () => {
      const context = { market: 'BTC/USD', trend: 'bullish' };
      const decision = await lilith.makeDecision(context);
      
      expect(decision).toMatchObject({
        type: 'action',
        confidence: expect.any(Number),
        action: expect.any(String),
        reasoning: expect.any(String)
      });
    });

    it('should emit decision:made event', (done) => {
      const context = { market: 'ETH/USD', trend: 'bearish' };
      
      lilith.on('decision:made', (decision: Decision) => {
        expect(decision).toBeDefined();
        expect(decision.metadata.context).toContain('ETH/USD');
        done();
      });

      lilith.makeDecision(context);
    });
  });

  describe('Learning', () => {
    it('should learn from data', async () => {
      const learningData = { pattern: 'market_cycle', outcome: 'success' };
      
      await expect(lilith.learn(learningData)).resolves.not.toThrow();
    });

    it('should emit learning:updated event', (done) => {
      const learningData = { pattern: 'price_action', outcome: 'failure' };
      
      lilith.on('learning:updated', (data) => {
        expect(data).toHaveProperty('timestamp');
        done();
      });

      lilith.learn(learningData);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', async () => {
      const newConfig: Partial<LilithConfig> = {
        patternRecognition: {
          enabled: true,
          minConfidence: 0.8,
          maxPatterns: 200
        }
      };

      lilith.updateConfig(newConfig);
      const patterns = await lilith.recognizePattern({ test: 'data' });
      expect(patterns[0].confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('should reinitialize after config update', async () => {
      const newConfig: Partial<LilithConfig> = {
        decisionMaking: {
          enabled: true,
          autonomy: 0.9,
          maxDecisions: 100
        }
      };

      await expect(lilith.updateConfig(newConfig)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in pattern recognition', async () => {
      const invalidData = undefined;
      await expect(lilith.recognizePattern(invalidData)).rejects.toThrow();
    });

    it('should handle errors in decision making', async () => {
      const invalidContext = null;
      await expect(lilith.makeDecision(invalidContext as any)).rejects.toThrow();
    });

    it('should emit error events', (done) => {
      lilith.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      lilith.recognizePattern(undefined);
    });
  });
}); 