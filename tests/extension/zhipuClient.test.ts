import { ZhipuClient } from '../../src/api/zhipuClient';
import nock from 'nock';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ZhipuClient', () => {
  let client: ZhipuClient;
  const apiKey = '9ba9dd5ad5db4660a14bdbfca6117223';

  beforeEach(() => {
    client = new ZhipuClient(apiKey);
    jest.clearAllMocks();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('chat', () => {
    it('应该成功调用 API', async () => {
      // Mock API 响应
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          choices: [{
            message: {
              content: 'Hello!'
            }
          }]
        }
      });

      const response = await client.chat([
        { role: 'user', content: 'Hi' }
      ]);

      expect(response).toBe('Hello!');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4-plus',
          messages: [{ role: 'user', content: 'Hi' }],
          stream: false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
    });

    it('应该处理 API 错误', async () => {
      const error = new Error('Request failed with status code 401');
      mockedAxios.post.mockRejectedValueOnce(error);

      await expect(client.chat([
        { role: 'user', content: 'Hi' }
      ])).rejects.toThrow('Request failed with status code 401');
    });
  });

  describe('streamChat', () => {
    it('应该正确处理流式响应', async () => {
      // Mock 流式响应
      const mockChunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
        'data: {"choices":[{"delta":{"content":" World"}}]}\n\n',
        'data: [DONE]\n\n'
      ];

      // 创建一个模拟的流
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        }
      };

      // 模拟 console.log 以避免测试输出
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      mockedAxios.post.mockResolvedValueOnce({
        data: mockStream,
        status: 200
      });

      const chunks: string[] = [];
      for await (const chunk of client.streamChat([
        { role: 'user', content: 'Hi' }
      ])) {
        chunks.push(chunk);
      }

      expect(chunks).toEqual(['Hello', ' World']);
      
      // 恢复 console 方法
      consoleSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('应该处理流式 API 错误', async () => {
      const error = new Error('Stream failed');
      mockedAxios.post.mockRejectedValueOnce(error);

      // 模拟 console.error 以避免测试输出
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const chunks: string[] = [];
      try {
        for await (const chunk of client.streamChat([
          { role: 'user', content: 'Hi' }
        ])) {
          chunks.push(chunk);
        }
        // 如果没有抛出错误，测试应该失败
        expect(true).toBe(false);
      } catch (err) {
        expect(err).toBe(error);
      }
      
      // 恢复 console 方法
      consoleSpy.mockRestore();
    });
  });
});
