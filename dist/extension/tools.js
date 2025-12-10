"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolManager = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
class ToolManager {
    constructor() {
        this.tools = new Map();
        this.registerDefaultTools();
    }
    registerDefaultTools() {
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
        });
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
        });
    }
    register(tool) {
        this.tools.set(tool.name, tool);
    }
    async execute(name, params) {
        const tool = this.tools.get(name);
        if (!tool) {
            throw new Error(`工具不存在: ${name}`);
        }
        return await tool.execute(params);
    }
    getTools() {
        return Array.from(this.tools.values());
    }
}
exports.ToolManager = ToolManager;
//# sourceMappingURL=tools.js.map