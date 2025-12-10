# cline-assistant
> 从无到有开发一个基于智谱大模型的 VSCode AI 代码助手


## 一、项目概述

### 1.1 项目定位

开发一个**轻量级**的 VSCode AI 编程助手扩展，专注于智谱 AI（GLM）大模型，实现核心的代码辅助功能。

### 1.2 核心功能

- ✅ AI 对话界面
- ✅ 文件读写操作
- ✅ 代码生成和修改
- ✅ 命令执行
- ✅ 对话历史保存

### 1.3 技术栈

```
前端: React + TypeScript + Vite
后端: TypeScript + Node.js
通信: VSCode Webview API
AI: 智谱 AI (GLM-4) / DeepSeek
存储: VSCode Storage API
```

### 1.4 支持的 AI 提供商

- ✅ **智谱 AI (GLM-4)**: glm-4-plus, glm-4, glm-4-air
- ✅ **DeepSeek**: deepseek-chat, deepseek-coder

---

## 二、打包测试

```bash
# 1. 清理并重新编译
rm -rf dist/
npm run compile

# 2. 打包成 VSIX
npm run package

# 3. 会生成: cline-assistant-0.1.0.vsix

# 4. 安装测试
code --install-extension cline-assistant-0.1.0.vsix

# 5. 重启 VSCode
npx vite --port=4000

# 6. 测试安装的扩展
# 应该能在扩展列表中看到
```
