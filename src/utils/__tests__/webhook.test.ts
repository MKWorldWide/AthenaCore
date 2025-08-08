import { webhookManager, sendToAthena, WEBHOOK_CONFIG } from '../webhook';
import axios from 'axios';
import { logger } from '../LogKitten';

// Mock axios and logger
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock logger to prevent actual logging during tests
jest.mock('../LogKitten', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Webhook Manager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ATHENA_DISCORD_WEBHOOK_URL = 'https://example.com/webhook';
  });

  describe('sendToChannel', () => {
    it('should send a message to the Athena channel', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 204 });
      
      const message = 'Test message to Athena channel';
      await webhookManager.sendToChannel('ATHENA', message);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        WEBHOOK_CONFIG.ATHENA.webhookUrl,
        {
          username: 'Athena',
          avatar_url: 'https://i.imgur.com/example.png',
          content: message,
        },
        expect.any(Object)
      );
      
      expect(logger.info).toHaveBeenCalledWith('Webhook message sent to Athena');
    });

    it('should throw an error for unknown channel', async () => {
      await expect(
        webhookManager.sendToChannel('UNKNOWN' as any, 'test')
      ).rejects.toThrow('No webhook configuration found for channel: UNKNOWN');
    });
  });

  describe('sendWebhookResponse (legacy)', () => {
    it('should send a message using the legacy method', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 204 });
      
      const message = 'Legacy test message';
      await webhookManager.sendWebhookResponse(message);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        process.env.ATHENA_DISCORD_WEBHOOK_URL,
        {
          username: 'Athena',
          avatar_url: 'https://i.imgur.com/example.png',
          content: message,
        },
        expect.any(Object)
      );
    });

    it('should handle errors when sending webhook', async () => {
      const error = new Error('Network error');
      mockedAxios.post.mockRejectedValueOnce(error);
      
      await expect(
        webhookManager.sendToChannel('ATHENA', 'test error')
      ).rejects.toThrow('Webhook error: Network error');
      
      expect(logger.error).toHaveBeenCalledWith(
        'Failed to send webhook message: Network error'
      );
    });
  });

  describe('sendToAthena helper', () => {
    it('should send a message to the Athena channel', async () => {
      mockedAxios.post.mockResolvedValueOnce({ status: 204 });
      
      const message = 'Test message via helper';
      await sendToAthena(message);
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        WEBHOOK_CONFIG.ATHENA.webhookUrl,
        {
          username: 'Athena',
          avatar_url: 'https://i.imgur.com/example.png',
          content: message,
        },
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should handle axios response errors', async () => {
      const error = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request' },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(error);
      
      await expect(
        webhookManager.sendToChannel('ATHENA', 'test error')
      ).rejects.toThrow('Webhook error: Status: 400 - {"message":"Bad request"}');
    });

    it('should handle axios request errors', async () => {
      const error = {
        isAxiosError: true,
        request: {},
      };
      mockedAxios.post.mockRejectedValueOnce(error);
      
      await expect(
        webhookManager.sendToChannel('ATHENA', 'test error')
      ).rejects.toThrow('Webhook error: No response received from webhook server');
    });
  });
});
