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
const assert = __importStar(require("assert"));
const vscode = __importStar(require("vscode"));
// Simple test runner for VS Code extensions
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
            resolve(undefined);
        }
        catch (error) {
            console.error('\n💥 Test suite failed:', error instanceof Error ? error.message : String(error));
            reject(error);
        }
    });
}
// Export the test runner
exports.run = run;
//# sourceMappingURL=extension.test.js.map