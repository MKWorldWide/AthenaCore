import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { logger } from './utils/logger';
import { config } from './config';

// Configure OTEL logging
if (process.env.OTEL_DEBUG === 'true') {
  diag.setLogger(new DiagConsoleLogger(), {
    logLevel: DiagLogLevel.DEBUG,
  });
}

let sdk: NodeSDK | null = null;

export async function startOtel() {
  if (!config.otel.enabled) {
    logger.info('OpenTelemetry is disabled');
    return;
  }

  try {
    logger.info('Initializing OpenTelemetry...');

    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.otel.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.pkg.version,
      'deployment.environment': config.nodeEnv,
    });

    const traceExporter = new OTLPTraceExporter({
      url: config.otel.endpoint,
      headers: {},
    });

    sdk = new NodeSDK({
      resource,
      traceExporter,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable fs auto-instrumentation as it's too verbose
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
        }),
      ],
    });

    sdk.start();
    logger.info('OpenTelemetry initialized');
  } catch (error) {
    logger.error({ error }, 'Failed to initialize OpenTelemetry');
    throw error;
  }
}

export async function shutdownOtel() {
  if (!sdk) return;
  
  try {
    logger.info('Shutting down OpenTelemetry...');
    await sdk.shutdown();
    logger.info('OpenTelemetry shutdown complete');
  } catch (error) {
    logger.error({ error }, 'Error shutting down OpenTelemetry');
  } finally {
    sdk = null;
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownOtel();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownOtel();
  process.exit(0);
});

// Auto-start if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startOtel().catch((error) => {
    logger.error({ error }, 'Failed to start OpenTelemetry');
    process.exit(1);
  });
}
