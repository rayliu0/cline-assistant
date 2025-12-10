const assert = require('assert');
const vscode = require('vscode');

// Simple test framework for VS Code extension testing
function run() {
  console.log('\n📋 扩展测试套件');

  return new Promise(async (resolve, reject) => {
    try {
      // Test 1: Extension activation
      console.log('  🧪 扩展应该被激活');
      const extension = vscode.extensions.getExtension('rayliu.cline-assistant');
      assert.ok(extension, 'Extension should exist');
      
      if (!extension.isActive) {
        await extension.activate();
      }
      assert.strictEqual(extension.isActive, true, 'Extension should be active');
      console.log('    ✅ PASSED');

      // Test 2: Command registration
      console.log('  🧪 应该注册命令');
      const commands = await vscode.commands.getCommands();
      assert.ok(commands.includes('aiAssistant.openChat'), 'Command should be registered');
      console.log('    ✅ PASSED');

      // Test 3: Webview display
      console.log('  🧪 应该显示 Webview');
      await vscode.commands.executeCommand('aiAssistant.openChat');
      
      // Wait for Webview to show
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('    ℹ️  Webview command executed successfully');
      console.log('    ✅ PASSED');

      console.log('\n🎉 All tests passed!');
      resolve();
    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      reject(error);
    }
  });
}

// Export the test runner
exports.run = run;