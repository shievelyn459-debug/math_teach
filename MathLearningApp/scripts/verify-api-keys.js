/**
 * API密钥验证脚本 (兼容版本)
 * 运行: node scripts/verify-api-keys.js
 */

// 使用绝对路径读取.env文件
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const https = require('https');

// 从.env读取配置
const BAIDU_API_KEY = process.env.BAIDU_OCR_API_KEY;
const BAIDU_SECRET_KEY = process.env.BAIDU_OCR_SECRET_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

console.log('========== API密钥验证 ==========\n');

// HTTPS请求封装
function httpsRequest(options) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// 1. 验证百度OCR
async function testBaiduOCR() {
  console.log('1. 测试百度OCR...');
  console.log('   API Key:', BAIDU_API_KEY ? `${BAIDU_API_KEY.substring(0, 10)}...` : '❌ 未设置');
  console.log('   Secret Key:', BAIDU_SECRET_KEY ? `${BAIDU_SECRET_KEY.substring(0, 10)}...` : '❌ 未设置');

  if (!BAIDU_API_KEY || !BAIDU_SECRET_KEY) {
    console.log('   ❌ 百度OCR密钥未配置\n');
    return false;
  }

  try {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}`;
    const url = new URL(tokenUrl);

    const result = await httpsRequest({
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
    });

    if (result.status === 200 && result.data.access_token) {
      console.log('   ✅ 百度OCR密钥验证成功！');
      return true;
    } else {
      console.log('   ❌ 百度OCR密钥无效:', result.data.error_description || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('   ❌ 百度OCR验证失败:', error.message);
    return false;
  }
}

// 2. 验证DeepSeek
async function testDeepSeek() {
  console.log('\n2. 测试DeepSeek...');
  console.log('   API Key:', DEEPSEEK_API_KEY ? `${DEEPSEEK_API_KEY.substring(0, 10)}...` : '❌ 未设置');

  if (!DEEPSEEK_API_KEY) {
    console.log('   ❌ DeepSeek密钥未配置\n');
    return false;
  }

  try {
    const result = await httpsRequest({
      hostname: 'api.deepseek.com',
      path: '/v1/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
    });

    if (result.status === 200) {
      console.log('   ✅ DeepSeek密钥验证成功！');
      const models = result.data.data || [];
      if (models.length > 0) {
        console.log('   可用模型:', models.map(m => m.id).join(', '));
      }
      return true;
    } else if (result.status === 401) {
      console.log('   ❌ DeepSeek密钥无效');
      return false;
    } else {
      console.log('   ❌ DeepSeek验证失败: HTTP', result.status);
      return false;
    }
  } catch (error) {
    console.log('   ❌ DeepSeek验证失败:', error.message);
    return false;
  }
}

// 运行所有测试
async function runTests() {
  const baiduOK = await testBaiduOCR();
  const deepseekOK = await testDeepSeek();

  console.log('\n========== 验证结果 ==========');
  if (baiduOK && deepseekOK) {
    console.log('✅ 所有API密钥验证通过！');
    console.log('\n现在你可以启动应用测试了：');
    console.log('  iOS:   npm run ios');
    console.log('  Android: npm run android');
  } else {
    console.log('❌ 部分API密钥验证失败');
    if (!baiduOK) console.log('   - 百度OCR需要检查');
    if (!deepseekOK) console.log('   - DeepSeek需要检查');
  }
}

runTests().catch(console.error);
