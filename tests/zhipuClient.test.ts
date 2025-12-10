import { ZhipuClient } from '../src/api/zhipuClient'

describe('ZhipuClient', () => {
  it('should chat with GLM', async () => {
    const client = new ZhipuClient(process.env.ZHIPU_API_KEY!)
    const response = await client.chat([
      { role: 'user', content: 'Hello' }
    ])
    
    expect(response).toBeDefined()
    expect(response.length).toBeGreaterThan(0)
  })
  
  it('should stream chat', async () => {
    const client = new ZhipuClient(process.env.ZHIPU_API_KEY!)
    const chunks: string[] = []
    
    for await (const chunk of client.streamChat([
      { role: 'user', content: 'Hello' }
    ])) {
      chunks.push(chunk)
    }
    
    expect(chunks.length).toBeGreaterThan(0)
  })
});
