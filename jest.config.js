module.exports = {
  projects: [
    {
      displayName: 'node',
      preset: 'ts-jest',
      testEnvironment: 'node',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/extension/**/*.test.ts', '**/integration/**/*.test.ts'],
      testPathIgnorePatterns: ['<rootDir>/tests/e2e'],
      transform: {
        '^.+\\.ts$': ['ts-jest', {
          tsconfig: 'tsconfig.json',
        }],
      },
      collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/webview/**',
      ],
      coverageDirectory: 'coverage',
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^vscode$': '<rootDir>/tests/mocks/vscode.js',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    },
    {
      displayName: 'webview',
      preset: 'ts-jest',
      testEnvironment: 'jsdom',
      roots: ['<rootDir>/tests'],
      testMatch: ['**/webview/**/*.test.tsx'],
      testPathIgnorePatterns: ['<rootDir>/tests/e2e'],
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: 'tsconfig.webview.json',
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^vscode$': '<rootDir>/tests/mocks/vscode.js',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
      },
      setupFilesAfterEnv: ['<rootDir>/tests/setup.ts', '@testing-library/jest-dom'],
    }
  ],
};
