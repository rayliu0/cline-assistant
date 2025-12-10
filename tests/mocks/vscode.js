// VSCode API mock for testing
const vscode = {
  workspace: {
    workspaceFolders: [{
      uri: {
        fsPath: '/test/workspace'
      }
    }],
    getConfiguration: jest.fn(() => ({
      get: jest.fn(),
      update: jest.fn(),
      inspect: jest.fn()
    })),
    onDidChangeConfiguration: jest.fn()
  },
  window: {
    showInformationMessage: jest.fn(),
    showErrorMessage: jest.fn(),
    createWebviewPanel: jest.fn(() => ({
      webview: {
        postMessage: jest.fn(),
        onDidReceiveMessage: jest.fn()
      },
      onDidChangeViewState: jest.fn(),
      dispose: jest.fn()
    }))
  },
  commands: {
    registerCommand: jest.fn(),
    executeCommand: jest.fn()
  },
  extensions: {
    getExtension: jest.fn(),
    all: []
  },
  env: {
    appName: 'VS Code Test',
    uriScheme: 'vscode'
  },
  Uri: {
    file: jest.fn((path) => ({
      fsPath: path,
      scheme: 'file'
    }))
  }
};

module.exports = vscode;