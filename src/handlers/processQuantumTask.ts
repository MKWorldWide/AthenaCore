import { SQSEvent, SQSHandler, SQSBatchResponse, SQSBatchItemFailure } from 'aws-lambda';
import { divinaRelay } from '../services/DivinaRelay';

export const handler: SQSHandler = async (event: SQSEvent): Promise<SQSBatchResponse> => {
  const batchItemFailures: SQSBatchItemFailure[] = [];
  
  try {
    console.log('Processing quantum task:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
      try {
        const task = JSON.parse(record.body);
        console.log('Processing task:', task);
        
        // Process the quantum task using DivinaRelay
        const result = await divinaRelay.scheduleQuantumTask(task);
        console.log('Task scheduled successfully:', result);
        
      } catch (error) {
        console.error('Error processing record:', error);
        // Add failed message ID to batchItemFailures for proper error handling
        batchItemFailures.push({ itemIdentifier: record.messageId });
      }
    }
    
    return { batchItemFailures };
  } catch (error) {
    console.error('Error in processQuantumTask handler:', error);
    // Mark all messages as failed if there's an unhandled error
    return {
      batchItemFailures: event.Records.map(record => ({
        itemIdentifier: record.messageId
      }))
    };
  }
};
