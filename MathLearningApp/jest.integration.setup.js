/**
 * Jest 集成测试环境设置
 * Story 8-4: CI/CD 集成
 */

// Mock AsyncStorage FIRST - before any other imports
jest.mock('@react-native-async-storage/async-storage', () => {
  const mockStorage = {};
  return {
    __INTERNAL_MOCK_STORAGE__: mockStorage,
    setItem: jest.fn((key, value) => {
      mockStorage[key] = value;
      return Promise.resolve();
    }),
    getItem: jest.fn((key) => Promise.resolve(mockStorage[key] || null)),
    removeItem: jest.fn((key) => {
      delete mockStorage[key];
      return Promise.resolve();
    }),
    multiRemove: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => {
      Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(mockStorage))),
  };
});

// Mock native modules that don't work in Node environment
jest.mock('react-native-fs', () => ({
  default: {
    DocumentDirectoryPath: '/tmp/documents',
    TemporaryDirectoryPath: '/tmp/temp',
    CachesDirectoryPath: '/tmp/cache',
    readFile: jest.fn(() => Promise.resolve('')),
    writeFile: jest.fn(() => Promise.resolve()),
    exists: jest.fn(() => Promise.resolve(true)),
    mkdir: jest.fn(() => Promise.resolve()),
    unlink: jest.fn(() => Promise.resolve()),
    stat: jest.fn(() => Promise.resolve({ isFile: () => true, isDirectory: () => false })),
    readDir: jest.fn(() => Promise.resolve([])),
    copyFile: jest.fn(() => Promise.resolve()),
    moveFile: jest.fn(() => Promise.resolve()),
    downloadFile: jest.fn(() => Promise.resolve({ statusCode: 200 })),
  },
}));

jest.mock('react-native-pdf', () => ({
  default: jest.fn().mockImplementation(() => ({
    setPage: jest.fn(),
    getCurrentPage: jest.fn(() => Promise.resolve(0)),
    getPageCount: jest.fn(() => Promise.resolve(1)),
  })),
}));

jest.mock('react-native-blob-util', () => ({
  default: {
    fs: {
      dirs: {
        DocumentDir: '/tmp/documents',
        CacheDir: '/tmp/cache',
      },
      readFile: jest.fn(() => Promise.resolve('')),
      writeFile: jest.fn(() => Promise.resolve()),
      exists: jest.fn(() => Promise.resolve(true)),
      mkdir: jest.fn(() => Promise.resolve()),
      unlink: jest.fn(() => Promise.resolve()),
    },
    ios: {
      openDocument: jest.fn(() => Promise.resolve()),
    },
    android: {
      ActionViewIntent: jest.fn(() => Promise.resolve()),
    },
  },
}));

jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: '/tmp/test.pdf' })),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ uri: '/tmp/test.jpg' })),
}));

jest.mock('react-native-share', () => ({
  default: {
    open: jest.fn(() => Promise.resolve()),
  },
}));

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'mysql://test:test@localhost:3306/math_test';
process.env.API_BASE_URL = process.env.TEST_API_URL || 'http://localhost:3000';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.LOG_LEVEL = 'error'; // 测试时减少日志输出

// 设置全局超时
jest.setTimeout(30000);

// 全局错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock console.log 减少测试输出噪音
if (process.env.SILENT_TESTS === 'true') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  };
}

// 全局测试数据
global.testUtils = {
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  generateRandomId: () => `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};

console.log('🔧 Integration test environment initialized');
