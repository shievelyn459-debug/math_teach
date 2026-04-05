/**
 * 集成测试环境配置
 * Story 8-4: 集成测试补充
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// 测试环境变量
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'sqlite::memory:';
process.env.API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
process.env.API_TIMEOUT = '5000';
process.env.BAIDU_OCR_API_URL = 'http://mock-ocr:8080';
process.env.DEEPSEEK_API_URL = 'http://mock-ai:8080';
process.env.ENABLE_LOGGING = 'false';
process.env.TEST_TIMEOUT = '30000';

// 全局测试超时
jest.setTimeout(30000);

// 测试前设置
beforeAll(async () => {
  console.log('🧪 Setting up integration test environment...');

  // 检查测试数据库连接
  if (process.env.DATABASE_URL?.startsWith('mysql://')) {
    console.log('✅ Using MySQL test database');
  } else {
    console.log('✅ Using SQLite in-memory database');
  }

  // 确保测试目录存在
  const testDir = path.join(__dirname, '../test-results');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

// 测试后清理
afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
});

// 导出测试配置
export const testConfig = {
  timeout: 30000,
  database: {
    url: process.env.DATABASE_URL,
    type: process.env.DATABASE_URL?.startsWith('mysql://') ? 'mysql' : 'sqlite',
  },
  api: {
    baseUrl: process.env.API_BASE_URL,
    timeout: parseInt(process.env.API_TIMEOUT || '5000'),
  },
};
