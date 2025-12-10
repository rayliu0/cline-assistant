"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClient = void 0;
const zhipuClient_1 = require("./zhipuClient");
const deepseekClient_1 = require("./deepseekClient");
/**
 * 统一的 AI 客户端接口
 */
class AIClient {
    constructor(config) {
        switch (config.provider) {
            case 'zhipu':
                this.client = new zhipuClient_1.ZhipuClient(config.apiKey);
                break;
            case 'deepseek':
                this.client = new deepseekClient_1.DeepSeekClient(config.apiKey, config.model || 'deepseek-chat');
                break;
            default:
                throw new Error(`不支持的 AI 提供商: ${config.provider}`);
        }
    }
    async *streamChat(messages) {
        yield* this.client.streamChat(messages);
    }
    async chat(messages) {
        return await this.client.chat(messages);
    }
}
exports.AIClient = AIClient;
//# sourceMappingURL=aiClient.js.map