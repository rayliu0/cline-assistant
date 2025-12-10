"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeepSeekClient = void 0;
const axios_1 = __importDefault(require("axios"));
class DeepSeekClient {
    constructor(apiKey, model = 'deepseek-chat') {
        this.baseUrl = 'https://api.deepseek.com/v1';
        this.apiKey = apiKey;
        this.model = model;
    }
    /**
     * 流式调用 DeepSeek API
     */
    async *streamChat(messages) {
        const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
            model: this.model,
            messages,
            stream: true,
            temperature: 1.0,
            max_tokens: 8192
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            responseType: 'stream'
        });
        // 解析 SSE 流
        for await (const chunk of this.parseSSEStream(response.data)) {
            if (chunk.choices[0]?.delta?.content) {
                yield chunk.choices[0].delta.content;
            }
        }
    }
    /**
     * 非流式调用
     */
    async chat(messages) {
        const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
            model: this.model,
            messages,
            stream: false
        }, {
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data.choices[0].message.content;
    }
    /**
     * 解析 SSE 流
     */
    async *parseSSEStream(stream) {
        let buffer = '';
        for await (const chunk of stream) {
            buffer += chunk.toString();
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6).trim();
                    if (data === '[DONE]')
                        return;
                    if (data) {
                        try {
                            yield JSON.parse(data);
                        }
                        catch (e) {
                            console.error('Parse error:', e);
                        }
                    }
                }
            }
        }
    }
}
exports.DeepSeekClient = DeepSeekClient;
//# sourceMappingURL=deepseekClient.js.map