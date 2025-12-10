import { ToolManager } from '../../src/extension/tools';
import * as fs from 'fs/promises';

// Mock fs/promises
jest.mock('fs/promises');

describe('ToolManager', () => {
  let toolManager: ToolManager;

  beforeEach(() => {
    toolManager = new ToolManager();
    jest.clearAllMocks();
  });

  describe('read_file', () => {
    it('应该成功读取文件', async () => {
      const mockContent = 'test file content';
      (fs.readFile as jest.Mock).mockResolvedValue(mockContent);

      const result = await toolManager.execute('read_file', {
        path: 'test.txt'
      });

      expect(result).toBe(mockContent);
      expect(fs.readFile).toHaveBeenCalledWith(
        '/test/workspace/test.txt',
        'utf-8'
      );
    });

    it('应该处理文件不存在错误', async () => {
      (fs.readFile as jest.Mock).mockRejectedValue(
        new Error('ENOENT: no such file')
      );

      await expect(
        toolManager.execute('read_file', { path: 'missing.txt' })
      ).rejects.toThrow('ENOENT');
    });
  });

  describe('write_file', () => {
    it('应该成功写入文件', async () => {
      (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
      (fs.writeFile as jest.Mock).mockResolvedValue(undefined);

      const result = await toolManager.execute('write_file', {
        path: 'new.txt',
        content: 'new content'
      });

      expect(result).toContain('文件已写入');
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/workspace/new.txt',
        'new content',
        'utf-8'
      );
    });
  });

  describe('list_files', () => {
    it('应该列出目录文件', async () => {
      (fs.readdir as jest.Mock).mockResolvedValue([
        'file1.txt',
        'file2.js',
        'dir1'
      ]);

      const result = await toolManager.execute('list_files', {
        path: '.'
      });

      expect(result).toContain('file1.txt');
      expect(result).toContain('file2.js');
      expect(result).toContain('dir1');
    });
  });
});
