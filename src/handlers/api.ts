import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { l3Bus } from '../runtime/L3Bus';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    // Initialize L3Bus
    await l3Bus.ensureReady();

    // Process the incoming event
    const response = {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'AthenaCore API is running',
        timestamp: new Date().toISOString(),
        quantumReady: l3Bus.isQuantumReady(),
        path: event.path,
        httpMethod: event.httpMethod,
      }),
    };

    return response;
  } catch (error) {
    console.error('Error in API handler:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
