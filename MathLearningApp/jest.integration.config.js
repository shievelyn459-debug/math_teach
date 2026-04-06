/**
 * Jest 集成测试配置
 * Story 8-4: CI/CD 集成
 */

module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: ['**/*.integration.test.{ts,tsx}'],
  testTimeout: 30000, // 集成测试需要更长的超时时间

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // 设置文件
  setupFiles: ['./jest.integration.setup.js'],
  setupFilesAfterEnv: ['./jest.integration.afterEnv.js'],

  // 覆盖率配置
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/',
    '\\.d\\.ts$',
  ],

  // 变换配置
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-fs|react-native-pdf|react-native-blob-util|expo-)/)',
  ],

  // 模块文件扩展名
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // 全局变量
  globals: {
    __DEV__: true,
  },

  // 测试路径忽略
  testPathIgnorePatterns: [
    '/node_modules/',
    '/android/',
    '/ios/',
  ],

  // 清除模拟
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,

  // 详细输出
  verbose: true,

  // 最大工作进程
  maxWorkers: 4,

  // 错误时停止
  bail: 0,

  // 缓存
  cache: true,
  cacheDirectory: '<rootDir>/tmp/jest_integration_cache',
};
