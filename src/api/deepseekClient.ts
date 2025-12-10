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

export class DeepSeekClient {
  private apiKey: string
  private baseUrl = 'https://api.deepseek.com/v1'
  private model: string
  
  constructor(apiKey: string, model: string = 'deepseek-chat') {
    this.apiKey = apiKey
    this.model = model
  }
  
  /**
   * 流式调用 DeepSeek API
   */
  async *streamChat(messages: Message[]): AsyncGenerator<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        stream: true,
        temperature: 1.0,
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
    
    // 解析 SSE 流
    for await (const chunk of this.parseSSEStream(response.data)) {
      if (chunk.choices[0]?.delta?.content) {
        yield chunk.choices[0].delta.content
      }
    }
  }
  
  /**
   * 非流式调用
   */
  async chat(messages: Message[]): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: this.model,
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