/**
 * Jest 集成测试后环境设置
 * Story 8-4: CI/CD 集成
 */

// 扩展 Jest 匹配器
expect.extend({
  toBeValidApiResponse(received) {
    const pass =
      received &&
      typeof received === 'object' &&
      typeof received.success === 'boolean' &&
      (received.success ? received.data !== undefined : received.error !== undefined);

    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid API response`
          : `expected ${received} to be a valid API response with success boolean and data/error`,
    };
  },

  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be within range ${floor} - ${ceiling}`
          : `expected ${received} to be within range ${floor} - ${ceiling}`,
    };
  },

  toHaveError(received, errorCode) {
    const pass = received && received.error && received.error.code === errorCode;
    return {
      pass,
      message: () =>
        pass
          ? `expected response not to have error code ${errorCode}`
          : `expected response to have error code ${errorCode}, got ${received?.error?.code}`,
    };
  },
});

// 每个测试套件前的设置
beforeAll(() => {
  // 初始化测试环境
  console.log('🚀 Starting integration test suite');
});

// 每个测试套件后的清理
afterAll(() => {
  // 清理测试环境
  console.log('🧹 Finished integration test suite');
});

// 每个测试前的设置
beforeEach(() => {
  // 重置所有mock
  jest.clearAllMocks();
});

// 每个测试后的清理
afterEach(() => {
  // 清理测试产生的副作用
});

// 全局错误捕获 - 保存原始console.error避免递归
const originalConsoleError = console.error;
global.console.error = (...args) => {
  // 在测试中抑制特定错误
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('Warning:') || args[0].includes('componentWill'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
