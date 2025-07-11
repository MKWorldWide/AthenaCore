/**
 * @file AthenaCore Dreamscape Module Tests
 * @description Test suite for the Dreamscape module
 * @author Sunny & Mrs. K
 * @version 1.0.0
 */

import { Dreamscape, DreamscapeConfig, DreamPattern, ConsciousnessState } from '../index';
import { Pattern } from '../../lilith';

describe('Dreamscape Module', () => {
  let dreamscape: Dreamscape;
  const defaultConfig: DreamscapeConfig = {
    consciousness: {
      enabled: true,
      mappingInterval: 1000,
      minStability: 0.7,
      depthLevels: 5,
      sensitivity: 0.8
    },
    patternRecognition: {
      enabled: true,
      minClarity: 0.8,
      maxPatterns: 100,
      algorithms: ['symbolic', 'emotional', 'archetypal'],
      archetypeMapping: true
    },
    integration: {
      withLilith: true,
      withAthena: true,
      syncInterval: 5000,
      crossPatternAnalysis: true
    },
    performance: {
      maxConcurrentMappings: 5,
      timeout: 30000,
      cacheSize: 1000
    }
  };

  beforeEach(async () => {
    dreamscape = new Dreamscape(defaultConfig);
    await dreamscape.initialize();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', async () => {
      expect(dreamscape).toBeDefined();
      const patterns = dreamscape.getPatterns();
      const states = dreamscape.getStates();
      expect(patterns).toHaveLength(0);
      expect(states).toHaveLength(0);
    });

    it('should throw error when using uninitialized instance', async () => {
      const uninitializedDreamscape = new Dreamscape(defaultConfig);
      await expect(uninitializedDreamscape.mapConsciousness()).rejects.toThrow('Dreamscape not initialized');
    });
  });

  describe('Consciousness Mapping', () => {
    it('should map consciousness state', async () => {
      const state = await dreamscape.mapConsciousness();
      
      expect(state).toMatchObject({
        level: expect.any(Number),
        focus: expect.any(Number),
        awareness: expect.any(Number),
        patterns: expect.any(Array)
      });
    });

    it('should emit consciousness:mapped event', (done) => {
      dreamscape.on('consciousness:mapped', (state: ConsciousnessState) => {
        expect(state).toBeDefined();
        expect(state.metadata.stability).toBeGreaterThanOrEqual(0);
        done();
      });

      dreamscape.mapConsciousness();
    });
  });

  describe('Dream Pattern Recognition', () => {
    it('should recognize dream patterns', async () => {
      const dreamData = {
        symbols: ['light', 'water', 'mountain'],
        emotions: ['peace', 'clarity'],
        context: {
          environment: 'lucid',
          timeOfDay: 'night',
          emotionalState: 'peaceful'
        },
        timestamp: Date.now()
      };
      
      const patterns = await dreamscape.recognizeDreamPattern(dreamData);
      
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toMatchObject({
        type: expect.any(String),
        level: expect.any(Number),
        symbols: expect.any(Array),
        emotions: expect.any(Array)
      });
    });

    it('should emit pattern:recognized event', (done) => {
      const dreamData = {
        symbols: ['fire', 'earth', 'wind'],
        emotions: ['power', 'strength'],
        context: {
          environment: 'archetype',
          timeOfDay: 'dawn',
          emotionalState: 'powerful'
        },
        timestamp: Date.now()
      };
      
      dreamscape.on('pattern:recognized', (pattern: DreamPattern) => {
        expect(pattern).toBeDefined();
        expect(pattern.symbols).toContain('fire');
        done();
      });

      dreamscape.recognizeDreamPattern(dreamData);
    });
  });

  describe('Lilith Integration', () => {
    it('should integrate with Lilith patterns', async () => {
      const lilithPatterns: Pattern[] = [{
        id: 'lilith_1',
        type: 'market',
        confidence: 0.9,
        data: { market: 'BTC/USD' },
        timestamp: Date.now(),
        metadata: {
          source: 'lilith',
          context: 'market_analysis',
          tags: ['crypto'],
          complexity: 0.8,
          reliability: 0.9
        }
      }];

      await expect(dreamscape.integrateWithLilith(lilithPatterns)).resolves.not.toThrow();
    });

    it('should emit integration:lilith event', (done) => {
      const lilithPatterns: Pattern[] = [{
        id: 'lilith_2',
        type: 'behavior',
        confidence: 0.85,
        data: { behavior: 'pattern' },
        timestamp: Date.now(),
        metadata: {
          source: 'lilith',
          context: 'behavior_analysis',
          tags: ['pattern'],
          complexity: 0.7,
          reliability: 0.85
        }
      }];

      dreamscape.on('integration:lilith', (data) => {
        expect(data).toHaveProperty('timestamp');
        done();
      });

      dreamscape.integrateWithLilith(lilithPatterns);
    });
  });

  describe('Configuration Updates', () => {
    it('should update configuration', async () => {
      const newConfig: Partial<DreamscapeConfig> = {
        consciousness: {
          enabled: true,
          mappingInterval: 2000,
          minStability: 0.8,
          depthLevels: 5,
          sensitivity: 0.8
        }
      };

      dreamscape.updateConfig(newConfig);
      const state = await dreamscape.mapConsciousness();
      expect(state.metadata.stability).toBeGreaterThanOrEqual(0.8);
    });

    it('should reinitialize after config update', async () => {
      const newConfig: Partial<DreamscapeConfig> = {
        patternRecognition: {
          enabled: true,
          minClarity: 0.9,
          maxPatterns: 200,
          algorithms: ['symbolic', 'emotional', 'archetypal'],
          archetypeMapping: true
        }
      };

      await expect(dreamscape.updateConfig(newConfig)).resolves.not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in consciousness mapping', async () => {
      const invalidData = undefined;
      await expect(dreamscape.mapConsciousness()).rejects.toThrow();
    });

    it('should handle errors in pattern recognition', async () => {
      const invalidData = null;
      await expect(dreamscape.recognizeDreamPattern(invalidData as any)).rejects.toThrow();
    });

    it('should emit error events', (done) => {
      dreamscape.on('error', (error) => {
        expect(error).toBeDefined();
        done();
      });

      dreamscape.recognizeDreamPattern(null as any);
    });
  });
}); 