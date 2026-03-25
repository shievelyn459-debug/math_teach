/**
 * 验证工具函数
 *
 * Story 6-2 P0修复 - 输入验证相关工具
 *
 * 功能：
 * - 邮箱格式验证
 * - 邮箱长度验证
 * - 邮箱规范化
 */

/**
 * 邮箱验证结果
 */
interface EmailValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * RFC 5321邮箱最大长度
 */
const MAX_EMAIL_LENGTH = 254;

/**
 * RFC 5322邮箱格式正则（简化版，覆盖大部分情况）
 * 支持格式：local-part@domain
 */
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * 验证邮箱格式和长度
 * 修复P0-6: 添加邮箱格式和长度验证
 *
 * @param email 邮箱地址
 * @returns 验证结果
 */
export function validateEmail(email: string): EmailValidationResult {
  // 检查长度
  if (email.length > MAX_EMAIL_LENGTH) {
    return {
      valid: false,
      error: `邮箱地址过长（最大${MAX_EMAIL_LENGTH}字符）`,
    };
  }

  if (email.length === 0) {
    return {
      valid: false,
      error: '邮箱地址不能为空',
    };
  }

  // 检查格式
  if (!EMAIL_REGEX.test(email)) {
    return {
      valid: false,
      error: '邮箱格式不正确',
    };
  }

  return {valid: true};
}

/**
 * 规范化邮箱地址
 * - 转换为小写
 * - 去除首尾空格
 *
 * 修复P0-6相关: 确保邮箱规范化的一致性
 *
 * @param email 原始邮箱
 * @returns 规范化后的邮箱
 */
export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

/**
 * 验证并规范化邮箱
 * 结合验证和规范化功能
 *
 * @param email 原始邮箱
 * @returns {success, normalizedEmail?, error?}
 */
export function validateAndNormalizeEmail(email: string): {
  success: boolean;
  normalizedEmail?: string;
  error?: string;
} {
  // 先规范化
  const normalized = normalizeEmail(email);

  // 再验证
  const validation = validateEmail(normalized);

  if (!validation.valid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  return {
    success: true,
    normalizedEmail: normalized,
  };
}

/**
 * 验证密码强度
 *
 * @param password 密码
 * @returns 验证结果
 */
export function validatePassword(password: string): EmailValidationResult {
  if (password.length < 8) {
    return {
      valid: false,
      error: '密码至少需要8个字符',
    };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: '密码过长（最大128字符）',
    };
  }

  // 检查是否包含至少一个字母和数字
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      valid: false,
      error: '密码必须包含字母和数字',
    };
  }

  return {valid: true};
}

/**
 * 验证手机号格式（中国大陆）
 * 可选字段，但如果提供则需要验证格式
 *
 * @param phone 手机号
 * @returns 验证结果
 */
export function validatePhone(phone: string | undefined): EmailValidationResult {
  if (!phone) {
    return {valid: true}; // 可选字段
  }

  // 去除常见格式字符
  const cleaned = phone.replace(/[\s-()]/g, '');

  // 中国大陆手机号：1开头，11位数字
  const phoneRegex = /^1[3-9]\d{9}$/;

  if (!phoneRegex.test(cleaned)) {
    return {
      valid: false,
      error: '手机号格式不正确',
    };
  }

  return {valid: true};
}
