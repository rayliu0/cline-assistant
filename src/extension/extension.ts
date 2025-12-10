import * as vscode from 'vscode'
import { ChatViewProvider } from './webviewProvider'

export function activate(context: vscode.ExtensionContext) {
  console.log('AI代码助手已激活');

  // 创建 Webview Provider
  const chatProvider = new ChatViewProvider(context.extensionUri, context);
  
  debugger;
  // 注册 Webview
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      'aiAssistant.chatView',
      chatProvider
    )
  );
  
  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('aiAssistant.openChat', () => {
      vscode.commands.executeCommand('aiAssistant.chatView.focus')
    })
  );
}

export function deactivate() {
  console.log('智谱助手已停用')
}