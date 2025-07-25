import { SQSEvent, SQSHandler } from 'aws-lambda';
import { divinaRelay } from '../services/DivinaRelay';

export const handler: SQSHandler = async (event: SQSEvent) => {
  try {
    console.log('Processing quantum task:', JSON.stringify(event, null, 2));
    
    for (const record of event.Records) {
      const task = JSON.parse(record.body);
      console.log('Processing task:', task);
      
      // Process the quantum task using DivinaRelay
      const result = await divinaRelay.processQuantumTask(task);
      console.log('Task processed successfully:', result);
      
      // Here you would typically update the task status in your database
      // or notify another service about the task completion
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Quantum task processed successfully' }),
    };
  } catch (error) {
    console.error('Error processing quantum task:', error);
    
    // In a production environment, you would want to implement proper error handling
    // and potentially retry logic for failed tasks
    throw error;
  }
};
