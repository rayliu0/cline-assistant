import * as vscode from 'vscode'
import * as path from 'path'
import { AIClient, AIProvider } from '../api/aiClient'
import { ToolManager } from './tools'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

/**
 * ChatViewProvider - Webview 管理器
 * 
 * 功能：
 * 1. 管理 Webview 生命周期
 * 2. 处理与 React UI 的消息通信
 * 3. 调用 AI API 进行对话
 * 4. 支持工具系统调用
 * 5. 支持虚拟滚动的长对话历史
 */
export class ChatViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView
  private messages: Message[] = []
  private aiClient?: AIClient
  private currentProvider?: AIProvider
  private toolManager: ToolManager

  constructor(
    private readonly extensionUri: vscode.Uri,
    private readonly context: vscode.ExtensionContext
  ) {
    this.toolManager = new ToolManager()
    this.initializeClient()

    // 监听配置变化
    vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration('aiAssistant')) {
        this.initializeClient()
      }
    })
  }

  /**
 * 初始化 AI 客户端
 * 根据用户配置选择合适的 AI 提供商（智谱AI 或 DeepSeek）
 */
  private initializeClient() {
    const config = vscode.workspace.getConfiguration('aiAssistant')
    const provider = config.get<AIProvider>('provider') || 'zhipu'

    let apiKey: string | undefined
    let model: string | undefined

    if (provider === 'zhipu') {
      apiKey = config.get<string>('zhipu.apiKey')
      model = config.get<string>('zhipu.model') || 'glm-4-plus'
    } else if (provider === 'deepseek') {
      apiKey = config.get<string>('deepseek.apiKey')
      model = config.get<string>('deepseek.model') || 'deepseek-chat'
    }

    if (apiKey) {
      this.aiClient = new AIClient({
        provider,
        apiKey,
        model
      })
      this.currentProvider = provider
      console.log(`AI 客户端已初始化: ${provider} - ${model}`)
    } else {
      console.warn(`未配置 ${provider} API Key`)
    }
  }

  /**
  * VSCode 调用此方法来解析和显示 Webview
  */
  resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    token: vscode.CancellationToken
  ) {
    this.view = webviewView

    // 配置 Webview 选项
    webviewView.webview.options = {
      enableScripts: true, // 允许运行 JavaScript
      localResourceRoots: [
        vscode.Uri.joinPath(this.extensionUri, 'dist/webview')
      ]
    }

    // 设置 HTML 内容
    webviewView.webview.html = this.getHtmlContent(webviewView.webview)

    // 监听来自 Webview 的消息
    webviewView.webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'sendMessage':
          // 处理用户发送的消息
          await this.handleUserMessage(message.content)
          break

        case 'clearChat':
          // 清空对话历史
          this.messages = []
          this.sendMessagesToWebview()
          vscode.window.showInformationMessage('对话已清空')
          break

        case 'exportChat':
          // 导出对话历史
          await this.exportChatHistory()
          break

        case 'ready':
          // Webview 已准备就绪，发送初始数据
          this.sendMessagesToWebview()
          break

        default:
          console.warn('未知的消息类型:', message.type)
      }
    })

    // Webview 可见性变化监听
    webviewView.onDidChangeVisibility(() => {
      if (webviewView.visible) {
        // Webview 变为可见时，发送最新消息
        this.sendMessagesToWebview()
      }
    })

    // 发送初始消息历史
    this.sendMessagesToWebview()
  }

  /**
   * 处理用户消息
   * 支持流式响应和工具调用
   */
  public async handleUserMessage(content: string) {
    console.log('1. 用户消息:', content);
    console.log('2. AI Client:', !!this.aiClient);
    console.log('3. Provider:', this.currentProvider);

    if (!this.aiClient) {
      const providerName = this.currentProvider === 'deepseek' ? 'DeepSeek' : '智谱 AI';
      vscode.window.showErrorMessage(`请先配置 ${providerName} API Key`);
      return;
    }

    // 添加用户消息
    const userMessage: Message = {
      role: 'user',
      content,
      timestamp: Date.now()
    };
    this.messages.push(userMessage);
    this.sendMessagesToWebview();

    // 构建系统提示（包含工具信息）
    const systemPrompt = this.getSystemPrompt();
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.messages.map(m => ({ role: m.role, content: m.content }))
    ];

    // 调用 AI API
    try {
      let assistantContent = '';
      const assistantMessage: Message = {
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      };
      this.messages.push(assistantMessage);

      // 流式接收响应
      for await (const chunk of this.aiClient.streamChat(conversationMessages)) {
        assistantContent += chunk;
        assistantMessage.content = assistantContent;
        // 实时更新到 Webview（虚拟滚动会自动优化渲染）
        this.sendMessagesToWebview();
      }

      // 解析并执行工具调用
      const toolCalls = this.parseToolCalls(assistantContent);
      debugger
      if (toolCalls.length > 0) {
        await this.executeToolCalls(toolCalls);
      }

    } catch (error: any) {
      console.error('AI API 错误:', error);
      vscode.window.showErrorMessage(`API 错误: ${error.message}`);

      // 添加错误消息
      const errorMessage: Message = {
        role: 'assistant',
        content: `抱歉，发生了错误：${error.message}`,
        timestamp: Date.now()
      };
      this.messages.push(errorMessage);
      this.sendMessagesToWebview();
    }
  }

  /**
   * 构建系统提示
   * 这个方法生成一个详细的提示，告诉 AI 所有可用的工具
   */
  private getSystemPrompt(): string {
    // 1. 获取所有注册的工具
    const tools = this.toolManager.getTools();
    // 2. 格式化每个工具的描述
    // 将工具信息转换为 AI 容易理解的格式
    const toolsDesc = tools.map(tool => {
      return `
工具名称: ${tool.name}
描述: ${tool.description}
参数格式: ${JSON.stringify(tool.parameters, null, 2)}
`.trim()
    }).join('\n\n---\n\n')

    return `你是一个专业的 AI 编程助手。

## 你的能力

你可以使用以下工具来帮助用户完成任务：

${toolsDesc}

## 工具使用规则

1. 当你需要使用工具时，请在回复中包含 JSON 格式的工具调用：
   \`\`\`json
   {
     "tool": "工具名称",
     "params": {
       "参数名1": "参数值1"
     }
   }
   \`\`\`

2. 工具执行后，我会返回结果，请根据结果继续回答

3. 优先使用工具获取准确信息，而不是猜测

## 注意事项

- 回答要简洁专业
- 代码要有注释
- 解释要清晰易懂
- 优先使用工具而不是猜测或编造信息
`
  }

  /**
   * 从 AI 响应中解析工具调用
   */
  private parseToolCalls(content: string): Array<{ tool: string, params: any }> {
    const toolCalls: Array<{ tool: string, params: any }> = [];
    const jsonBlockRegex = /```json\s*(\{[\s\S]*?\})\s*```/g;
    let match;

    while ((match = jsonBlockRegex.exec(content)) !== null) {
      try {
        const toolCall = JSON.parse(match[1]);
        if (toolCall.tool && toolCall.params) {
          toolCalls.push(toolCall);
        }
      } catch (e) {
        console.warn('解析工具调用失败:', match[1]);
      }
    }

    return toolCalls;
  }

  /**
   * 执行工具调用
   */
  private async executeToolCalls(toolCalls: Array<{ tool: string, params: any }>) {
    for (const toolCall of toolCalls) {
      try {
        const result = await this.toolManager.execute(toolCall.tool, toolCall.params);

        // 添加工具结果到对话
        const resultMessage: Message = {
          role: 'user',
          content: `[工具执行结果]\n工具: ${toolCall.tool}\n状态: 成功\n返回内容:\n${result}`,
          timestamp: Date.now()
        };
        this.messages.push(resultMessage);
        this.sendMessagesToWebview();

        // 让 AI 继续处理
        await this.continueConversation();
      } catch (error: any) {
        console.error('工具执行失败:', error);

        const errorMessage: Message = {
          role: 'user',
          content: `[工具执行结果]\n工具: ${toolCall.tool}\n状态: 失败\n错误: ${error.message}`,
          timestamp: Date.now()
        };
        this.messages.push(errorMessage);
        this.sendMessagesToWebview();

        await this.continueConversation();
      }
    }
  }

  /**
   * 让 AI 继续对话（处理工具结果）
   */
  private async continueConversation() {
    if (!this.aiClient) return;

    const systemPrompt = this.getSystemPrompt();
    const conversationMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...this.messages.map(m => ({ role: m.role, content: m.content }))
    ];

    let assistantContent = '';
    const assistantMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    this.messages.push(assistantMessage);

    for await (const chunk of this.aiClient.streamChat(conversationMessages)) {
      assistantContent += chunk;
      assistantMessage.content = assistantContent;
      this.sendMessagesToWebview();
    }

    // 检查是否还有新的工具调用
    const newToolCalls = this.parseToolCalls(assistantContent);
    if (newToolCalls.length > 0) {
      await this.executeToolCalls(newToolCalls);
    }
  }

  /**
   * 发送消息到 Webview
   * Webview 使用虚拟滚动，可以高效处理大量消息
   */
  private sendMessagesToWebview() {
    if (this.view) {
      this.view.webview.postMessage({
        type: 'updateMessages',
        messages: this.messages
      });
    }
  }

  /**
   * 导出对话历史
   */
  private async exportChatHistory() {
    if (this.messages.length === 0) {
      vscode.window.showInformationMessage('没有对话历史可以导出')
      return
    }

    // 格式化对话内容
    const content = this.messages.map(msg => {
      const role = msg.role === 'user' ? '用户' : 'AI'
      const time = new Date(msg.timestamp).toLocaleString('zh-CN')
      return `## ${role} [${time}]\n\n${msg.content}\n\n---\n`
    }).join('\n')

    // 创建文档
    const doc = await vscode.workspace.openTextDocument({
      content,
      language: 'markdown'
    })

    await vscode.window.showTextDocument(doc)
    vscode.window.showInformationMessage('对话历史已导出')
  }

  /**
   * 生成 Webview HTML 内容
   */
  private getHtmlContent(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist/webview/main.js')
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'dist/webview/index.css')
    )

    // 生成随机 nonce 用于 CSP
    const nonce = this.getNonce()

    return `<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <!-- Content Security Policy -->
      <meta http-equiv="Content-Security-Policy" content="
        default-src 'none';
        style-src ${webview.cspSource} 'unsafe-inline';
        script-src 'nonce-${nonce}';
        img-src ${webview.cspSource} data:;
        font-src ${webview.cspSource};
      ">
      
      <link href="${styleUri}" rel="stylesheet">
      <title>AI助手</title>
    </head>
    <body>
      <div id="root"></div>
      <script nonce="${nonce}" type="module" src="${scriptUri}"></script>
    </body>
    </html>`
  }

  /**
   * 生成随机 nonce
   */
  private getNonce(): string {
    let text = ''
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length))
    }
    return text
  }
}