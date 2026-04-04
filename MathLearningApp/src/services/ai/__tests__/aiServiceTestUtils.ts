/**
 * AI服务测试工具
 * 用于验证百度OCR和DeepSeek配置是否正确
 */

import {validateAIConfig} from '../../../config/aiConfig';
import {baiduOcrService} from '../baiduOcrService';
import {deepseekService} from '../deepseekService';
import {localQuestionGenerator} from '../localQuestionGenerator';

/**
 * 运行所有AI服务测试
 */
export async function testAIServices() {
  console.log('========== AI服务测试 ==========');

  // 1. 验证配置
  console.log('\n1. 验证配置...');
  const configValidation = validateAIConfig();
  if (configValidation.valid) {
    console.log('✓ 配置验证通过');
  } else {
    console.error('✗ 配置验证失败:');
    configValidation.errors.forEach(err => console.error('  -', err));
    return;
  }

  // 2. 测试百度OCR
  console.log('\n2. 测试百度OCR...');
  if (baiduOcrService.isAvailable()) {
    console.log('✓ 百度OCR服务可用');
  } else {
    console.error('✗ 百度OCR服务不可用（请检查BAIDU_OCR_API_KEY和BAIDU_OCR_SECRET_KEY）');
  }

  // 3. 测试DeepSeek
  console.log('\n3. 测试DeepSeek...');
  if (deepseekService.isAvailable()) {
    console.log('✓ DeepSeek服务可用');
  } else {
    console.error('✗ DeepSeek服务不可用（请检查DEEPSEEK_API_KEY）');
  }

  // 4. 测试本地生成器
  console.log('\n4. 测试本地题目生成器...');
  const localQuestions = await localQuestionGenerator.generateQuestions(
    'addition' as any,
    'easy' as any,
    2,
    '1' as any
  );
  console.log(`✓ 本地生成器正常，生成了${localQuestions.length}道题`);
  localQuestions.forEach((q, i) => {
    console.log(`  ${i + 1}. ${q.question} = ${q.answer}`);
  });

  // 5. 测试AI服务协调器
  console.log('\n5. 测试AI服务协调器...');
  const {aiService} = await import('../index');
  const availability = aiService.checkAvailability();
  console.log('  OCR可用性:', availability.ocr);
  console.log('  生成可用性:', availability.generation);

  console.log('\n========== 测试完成 ==========');
}

/**
 * 简化版：只检查配置
 */
export function quickCheck() {
  const validation = validateAIConfig();
  console.log('AI配置验证结果:', validation.valid ? '✓ 通过' : '✗ 失败');
  if (!validation.valid) {
    console.log('错误信息:', validation.errors);
  }
  return validation.valid;
}
