# AthenaCore AWS Deployment Guide

This document outlines the steps to deploy AthenaCore to AWS using the Serverless Framework.

## Prerequisites

1. Node.js 18.x or later
2. npm or yarn package manager
3. AWS Account with appropriate permissions
4. AWS CLI configured with credentials
5. Serverless Framework installed globally: `npm install -g serverless`

## Environment Setup

1. Copy the example environment file and update with your values:
   ```bash
   cp .env.example .env.dev  # For development
   ```

2. Configure the following environment variables in your `.env.dev` file:
   ```
   # Server configuration
   NODE_ENV=development
   PORT=3000
   
   # AWS configuration
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key
   AWS_SECRET_ACCESS_KEY=your-secret-key
   
   # Quantum service configuration (if applicable)
   QUANTUM_SERVICE_ENDPOINT=
   QUANTUM_SERVICE_API_KEY=
   
   # Logging
   LOG_LEVEL=info
   ```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

3. Deploy to AWS (development stage):
   ```bash
   serverless deploy --stage dev
   ```

4. Deploy to production:
   ```bash
   serverless deploy --stage prod
   ```

## Testing the Deployment

After deployment, you can test the API using the provided endpoints:

```bash
# Get API info
curl -X GET https://your-api-id.execute-api.region.amazonaws.com/dev/

# Example of processing a quantum task (via SQS)
# This requires AWS SDK or AWS CLI configured with appropriate permissions
aws sqs send-message \
  --queue-url https://sqs.region.amazonaws.com/account-id/athenacore-quantum-tasks-dev \
  --message-body '{"taskId":"123","type":"quantum:calculate","payload":{}}'
```

## Infrastructure

The Serverless Framework will create the following AWS resources:

- **API Gateway**: REST API endpoints
- **Lambda Functions**:
  - `athenacore-dev-api`: Handles HTTP requests
  - `athenacore-dev-processQuantumTask`: Processes quantum tasks from SQS
- **SQS Queue**: `athenacore-quantum-tasks-dev` for queuing quantum tasks
- **IAM Roles**: With least-privilege permissions

## Monitoring and Logs

View logs for your Lambda functions:

```bash
# View API logs
serverless logs -f api --stage dev

# View quantum task processor logs
serverless logs -f processQuantumTask --stage dev
```

## Cleanup

To remove all deployed resources:

```bash
serverless remove --stage dev
```

## Troubleshooting

- **Missing Dependencies**: Ensure all dependencies are included in `package.json`
- **Permission Issues**: Verify AWS credentials have sufficient permissions
- **Timeouts**: Adjust the `timeout` in `serverless.yml` if functions are timing out
- **Environment Variables**: Ensure all required environment variables are set
