/**
 * @file AthenaCore Verse Configuration
 * @description Configuration settings for Verse module
 * @author Sunny & Mrs. K
 * @version 1.0.0
 */

/**
 * @interface VerseConfig
 * @description Configuration interface for Verse module
 */
export interface VerseConfig {
  /** Enable/disable code caching */
  enableCache: boolean;
  /** Maximum cache size in MB */
  maxCacheSize: number;
  /** Default imports to include in generated code */
  defaultImports: string[];
  /** Code generation settings */
  generation: {
    /** Maximum code complexity (0-1) */
    maxComplexity: number;
    /** Target performance score (0-1) */
    targetPerformance: number;
    /** Target maintainability score (0-1) */
    targetMaintainability: number;
    /** Whether to include examples in generated code */
    includeExamples: boolean;
    /** Whether to include documentation in generated code */
    includeDocumentation: boolean;
  };
  /** Code analysis settings */
  analysis: {
    /** Whether to analyze code complexity */
    analyzeComplexity: boolean;
    /** Whether to analyze performance */
    analyzePerformance: boolean;
    /** Whether to analyze maintainability */
    analyzeMaintainability: boolean;
    /** Whether to suggest optimizations */
    suggestOptimizations: boolean;
  };
  /** Optimization settings */
  optimization: {
    /** Whether to optimize for performance */
    optimizePerformance: boolean;
    /** Whether to optimize for maintainability */
    optimizeMaintainability: boolean;
    /** Whether to optimize for complexity */
    optimizeComplexity: boolean;
    /** Maximum optimization iterations */
    maxIterations: number;
  };
}

/**
 * @constant defaultVerseConfig
 * @description Default configuration for Verse module
 */
export const defaultVerseConfig: VerseConfig = {
  enableCache: true,
  maxCacheSize: 100,
  defaultImports: [
    '/Verse.org/Simulation',
    '/Fortnite.com/Devices',
    '/Fortnite.com/Agents',
    '/Fortnite.com/Events'
  ],
  generation: {
    maxComplexity: 0.7,
    targetPerformance: 0.8,
    targetMaintainability: 0.8,
    includeExamples: true,
    includeDocumentation: true
  },
  analysis: {
    analyzeComplexity: true,
    analyzePerformance: true,
    analyzeMaintainability: true,
    suggestOptimizations: true
  },
  optimization: {
    optimizePerformance: true,
    optimizeMaintainability: true,
    optimizeComplexity: true,
    maxIterations: 3
  }
}; 