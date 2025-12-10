"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZhipuClient = void 0;
const axios_1 = __importDefault(require("axios"));
class ZhipuClient {
    constructor(apiKey) {
        this.baseUrl = 'https://open.bigmodel.cn/api/paas/v4';
        this.apiKey = apiKey;
    }
    /**
     * 流式调用智谱 API
     */
    async *streamChat(messages) {
        console.log('发送请求：', messages);
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
                model: 'glm-4-plus',
                messages,
                stream: true,
                temperature: 0.95,
                top_p: 0.7,
                max_tokens: 8192
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                responseType: 'stream'
            });
            console.log('响应状态：', response.status);
            // 解析 SSE 流
            for await (const chunk of this.parseSSEStream(response.data)) {
                if (chunk.choices[0]?.delta?.content) {
                    yield chunk.choices[0].delta.content;
                }
            }
        }
        catch (error) {
            console.error('API 错误: ', error);
            throw error;
        }
    }
    /**
     * 非流式调用
     */
    async chat(messages) {
        const response = await axios_1.default.post(`${this.baseUrl}/chat/completions`, {
            model: 'glm-4-plus',
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
exports.ZhipuClient = ZhipuClient;
//# sourceMappingURL=zhipuClient.js.map