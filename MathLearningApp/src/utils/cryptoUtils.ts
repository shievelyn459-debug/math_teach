/**
 * 加密工具函数
 *
 * Story 6-2 P0修复 - 安全相关工具
 *
 * 功能：
 * - SHA-256密码哈希
 * - 常量时间字符串比较
 * - 安全令牌签名
 * - UUID v4生成（加密安全）
 */

import * as Crypto from 'expo-crypto';

/**
 * SHA-256密码哈希
 * 修复P0-1: 实现SHA-256密码哈希（替代弱32位整数哈希）
 *
 * @param password 明文密码
 * @returns SHA-256哈希值（十六进制字符串）
 */
export async function hashPasswordSHA256(password: string): Promise<string> {
  const salt = 'math_learning_salt_v1';
  const data = password + salt;

  // 使用expo-crypto的SHA-256摘要
  const hashArray = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data,
    {encoding: Crypto.CryptoEncoding.HEX}
  );

  return hashArray;
}

/**
 * 常量时间字符串比较
 * 修复P0-7: 防止时序攻击的密码比较
 *
 * @param a 字符串A
 * @param b 字符串B
 * @returns 是否相等
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * 生成安全签名（SHA-256）
 * 修复P0-2: 使用加密安全的签名算法（替代32位整数签名）
 *
 * @param data 要签名的数据
 * @param secret 签名密钥
 * @returns SHA-256签名（十六进制字符串）
 */
export async function generateSignatureSHA256(data: string, secret: string): Promise<string> {
  const combined = data + secret;

  const signature = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    combined,
    {encoding: Crypto.CryptoEncoding.HEX}
  );

  return signature;
}

/**
 * 验证签名
 *
 * @param data 原始数据
 * @param signature 签名
 * @param secret 签名密钥
 * @returns 签名是否有效
 */
export async function verifySignature(
  data: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await generateSignatureSHA256(data, secret);

  // 使用常量时间比较
  return timingSafeEqual(expectedSignature, signature);
}

/**
 * 生成UUID v4（使用加密安全的随机数）
 * 修复部分P0-2相关问题
 *
 * @returns UUID v4字符串
 */
export function generateSecureUUID(): string {
  // 使用expo-crypto的随机字节生成
  const bytes = Crypto.getRandomValues(new Uint8Array(16));

  // 设置版本号为4（随机UUID）
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // 设置变体为RFC 4122
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // 转换为十六进制字符串
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  // 格式化为UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return [
    hex.substring(0, 8),
    hex.substring(8, 12),
    hex.substring(12, 16),
    hex.substring(16, 20),
    hex.substring(20, 32),
  ].join('-');
}

/**
 * SHA-256哈希通用函数
 *
 * @param data 输入数据
 * @returns SHA-256哈希值（十六进制字符串）
 */
export async function sha256Hash(data: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    data,
    {encoding: Crypto.CryptoEncoding.HEX}
  );
}
