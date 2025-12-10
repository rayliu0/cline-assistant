import { ZhipuClient } from './zhipuClient'
import { DeepSeekClient } from './deepseekClient'

export type AIProvider = 'zhipu' | 'deepseek'

export interface AIClientConfig {
  provider: AIProvider
  apiKey: string
  model?: string
}

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/**
 * 统一的 AI 客户端接口
 */
export class AIClient {
  private client: ZhipuClient | DeepSeekClient
  
  constructor(config: AIClientConfig) {
    switch (config.provider) {
      case 'zhipu':
        this.client = new ZhipuClient(config.apiKey)
        break
      case 'deepseek':
        this.client = new DeepSeekClient(
          config.apiKey,
          config.model || 'deepseek-chat'
        )
        break
      default:
        throw new Error(`不支持的 AI 提供商: ${config.provider}`)
    }
  }
  
  async *streamChat(messages: Message[]): AsyncGenerator<string> {
    yield* this.client.streamChat(messages)
  }
  
  async chat(messages: Message[]): Promise<string> {
    return await this.client.chat(messages)
  }
}
