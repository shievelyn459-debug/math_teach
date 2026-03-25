/**
 * 自定义错误类
 *
 * Story 6-2 P1修复 - 更好的错误处理
 */

/**
 * 验证错误
 */
export class ValidationError extends Error {
  constructor(
    public field: string,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * 数据库错误
 */
export class DatabaseError extends Error {
  constructor(
    public code: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * 认证错误
 */
export class AuthenticationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * 用户不存在错误
 */
export class UserNotFoundError extends Error {
  constructor(userId?: string) {
    super(userId ? `User not found: ${userId}` : 'User not found');
    this.name = 'UserNotFoundError';
  }
}

/**
 * 账户锁定错误
 */
export class AccountLockedError extends Error {
  constructor(
    public lockedUntil?: number,
    message: string = 'Account is temporarily locked'
  ) {
    super(message);
    this.name = 'AccountLockedError';
  }
}
