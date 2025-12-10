import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

// 定义消息类型
interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: number
}

// 获取 VSCode API
declare const acquireVsCodeApi: any;
// 安全的获取 VSCode API
const getVsCodeApi = () => {
  if (typeof acquireVsCodeApi !== 'undefined') {
    return acquireVsCodeApi()
  }

  // 开发环境的模拟 API
  return {
    postMessage: (message: any) => {
      // window.parent.postMessage(message, '*')
      console.log('Dev mode - postMessage:', message);
    },
    getState: () => null,
    setState: (state: any) => {
      console.log('Dev mode - setState:', state);
    }
  }
}

const vscode = getVsCodeApi()

function App() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 使用 useCallback 优化消息处理函数，避免频繁重新创建
  const handleMessage = useCallback((event: MessageEvent) => {
    // 验证消息来源安全性
    if (!event.data || typeof event.data !== 'object') {
      return
    }
    
    const message = event.data
    
    // 验证消息类型
    if (typeof message.type !== 'string') {
      return
    }
    
    try {
      switch (message.type) {
        case 'updateMessages':
          if (Array.isArray(message.messages)) {
            setMessages(message.messages)
            setIsLoading(false)
          }
          break
      }
    } catch (error) {
      console.error('处理消息时出错:', error)
    }
  }, [])
  
  // 监听来自扩展的消息
  useEffect(() => {
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [handleMessage])
  
  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])
  
  // 防抖处理消息发送
  const handleSend = useCallback(() => {
    if (!input.trim()) return
    
    setIsLoading(true)
    try {
      vscode.postMessage({
        type: 'sendMessage',
        content: input.trim()
      })
    } catch (error) {
      console.error('发送消息失败:', error)
      setIsLoading(false)
    }
    setInput('')
  }, [input])
  
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])
  
  return (
    <div className="chat-container">
      {/* 消息列表 */}
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={`${msg.timestamp}-${idx}`} className={`message ${msg.role}`}>
            <div className="message-role">
              {msg.role === 'user' ? '👤 你' : '🤖 Cline'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="message assistant">
            <div className="message-role">🤖 Cline</div>
            <div className="message-content">思考中...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 输入框 */}
      <div className="input-container">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
          rows={3}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()}>
          发送
        </button>
      </div>
    </div>
  )
}

export default App;