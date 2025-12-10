import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import App from '../../src/webview/App';

// Mock VSCode API
const mockPostMessage = jest.fn();
Object.defineProperty(global, 'acquireVsCodeApi', {
  value: () => ({
    postMessage: mockPostMessage
  }),
  writable: true
});

// Mock scrollIntoView
Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
  value: jest.fn(),
  writable: true
});

describe('App Component', () => {
  beforeEach(() => {
    mockPostMessage.mockClear();
  });

  it('应该渲染输入框和发送按钮', () => {
    render(<App />);
    
    expect(screen.getByPlaceholderText(/输入消息/i)).toBeInTheDocument();
    expect(screen.getByText(/发送/i)).toBeInTheDocument();
  });

  it('应该显示接收到的消息', async () => {
    render(<App />);

    // 模拟接收消息
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'updateMessages',
        messages: [
          { role: 'user', content: 'Hello', timestamp: Date.now() },
          { role: 'assistant', content: 'Hi!', timestamp: Date.now() }
        ]
      }
    });

    window.dispatchEvent(messageEvent);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
      expect(screen.getByText('Hi!')).toBeInTheDocument();
    });
  });

  it('应该在输入文本后显示发送按钮为可用状态', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;
    const sendButton = screen.getByText(/发送/i);

    // 初始状态按钮应该是禁用的（因为输入框为空）
    expect(sendButton).toBeDisabled();
    
    // 输入文本
    await user.clear(input);
    await user.type(input, 'test message');
    
    // 确保输入框有值且按钮可用
    expect(input).toHaveValue('test message');
    expect(sendButton).not.toBeDisabled();
  });

  it('应该渲染发送按钮并在有输入时可用', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;
    const sendButton = screen.getByText(/发送/i);

    // 初始状态按钮应该禁用（输入框为空）
    expect(sendButton).toBeDisabled();
    
    // 输入文本后按钮应该可用
    await user.clear(input);
    await user.type(input, 'test message');
    
    expect(input).toHaveValue('test message');
    expect(sendButton).not.toBeDisabled();
  });

  it('应该正确处理输入和按钮状态', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText(/输入消息/i) as HTMLTextAreaElement;
    const sendButton = screen.getByText(/发送/i);

    // 验证初始状态
    expect(input).toHaveValue('');
    expect(sendButton).toBeDisabled();
    
    // 输入空格应该仍然禁用按钮
    await user.type(input, '   ');
    expect(sendButton).toBeDisabled();
    
    // 清空并输入有效文本
    await user.clear(input);
    await user.type(input, 'valid message');
    
    expect(input).toHaveValue('valid message');
    expect(sendButton).not.toBeDisabled();
  });
});
