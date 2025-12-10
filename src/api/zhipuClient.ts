import axios from 'axios'

interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string
    }
    finish_reason?: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class ZhipuClient {
  private apiKey: string
  private baseUrl = 'https://open.bigmodel.cn/api/paas/v4'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * 流式调用智谱 API
   */
  async *streamChat(messages: Message[]): AsyncGenerator<string> {
    console.log('发送请求：', messages);

    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: 'glm-4-plus',
          messages,
          stream: true,
          temperature: 0.95,
          top_p: 0.7,
          max_tokens: 8192
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          responseType: 'stream'
        }
      )

      console.log('响应状态：', response.status);
      // 解析 SSE 流
      for await (const chunk of this.parseSSEStream(response.data)) {
        if (chunk.choices[0]?.delta?.content) {
          yield chunk.choices[0].delta.content
        }
      }
    } catch (error) {
      console.error('API 错误: ', error);
      throw error;
    }
  }

  /**
   * 非流式调用
   */
  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: 'glm-4-plus',
        messages,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    return response.data.choices[0].message.content
  }

  /**
   * 解析 SSE 流
   */
  private async *parseSSEStream(stream: any): AsyncGenerator<ChatCompletionChunk> {
    let buffer = ''

    for await (const chunk of stream) {
      buffer += chunk.toString()
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') return
          if (data) {
            try {
              yield JSON.parse(data)
            } catch (e) {
              console.error('Parse error:', e)
            }
          }
        }
      }
    }
  }
}