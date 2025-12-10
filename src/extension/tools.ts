import * as vscode from 'vscode'
import * as fs from 'fs/promises'
import * as path from 'path'

export interface Tool {
  name: string
  description: string
  parameters: any
  execute: (params: any) => Promise<string>
}

export class ToolManager {
  private tools: Map<string, Tool> = new Map();
  
  constructor() {
    this.registerDefaultTools();
  }
  
  private registerDefaultTools() {
    // 读取文件
    this.register({
      name: 'read_file',
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      },
      execute: async (params) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error('没有打开的工作区');
        }

        const filePath = path.join(workspaceFolder.uri.fsPath, params.path);
        const content = await fs.readFile(filePath, 'utf-8');
        return content;
      }
    });

    // 写入文件
    this.register({
      name: 'write_file',
      description: '写入文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      },
      execute: async (params) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error('没有打开的工作区');
        }
        
        const filePath = path.join(workspaceFolder.uri.fsPath, params.path);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, params.content, 'utf-8');
        return `文件已写入: ${params.path}`;
      }
    })
    
    // 列出文件
    this.register({
      name: 'list_files',
      description: '列出目录中的文件',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '目录路径' }
        }
      },
      execute: async (params) => {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
          throw new Error('没有打开的工作区');
        }
        
        const dirPath = params.path 
          ? path.join(workspaceFolder.uri.fsPath, params.path)
          : workspaceFolder.uri.fsPath;

        const files = await fs.readdir(dirPath);
        return files.join('\n');
      }
    })
  }

  register(tool: Tool) {
    this.tools.set(tool.name, tool);
  }

  async execute(name: string, params: any): Promise<string> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`工具不存在: ${name}`);
    }

    return await tool.execute(params);
  }
  
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }
}