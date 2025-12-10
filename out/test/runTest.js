const path = require('path');
const { runTests } = require('@vscode/test-electron');

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `runTests` via the extensionDevelopmentPath option.
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');

    // The path to the specific test file
    // Passed to `runTests` via the extensionTestsPath option.
    const extensionTestsPath = path.resolve(__dirname, './suite/extension.test.js');

    // Download VS Code, unzip it and run the integration test
    await runTests({ 
      extensionDevelopmentPath, 
      extensionTestsPath,
      launchArgs: ['--disable-extensions'] // Disable other extensions
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();