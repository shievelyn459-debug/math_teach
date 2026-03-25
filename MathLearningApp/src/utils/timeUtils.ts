/**
 * Story 5-1: 时间格式化工具函数
 * 用于显示友好的时间格式（如"5分钟前"）
 */

/**
 * 将时间戳转换为友好的"多久之前"格式
 * @param timestamp - Unix 时间戳（毫秒）
 * @returns 友好的时间字符串，如"刚刚"、"5分钟前"、"2天前"
 */
export const formatTimeAgo = (timestamp: number): string => {
  // PATCH-008: 验证时间戳有效性
  if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
    return '未知时间';
  }

  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);

  // 小于1分钟
  if (seconds < 60) {
    return '刚刚';
  }

  // 小于1小时
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}分钟前`;
  }

  // 小于1天
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}小时前`;
  }

  // 小于7天
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}天前`;
  }

  // 超过7天显示具体日期
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const currentYear = new Date().getFullYear();
  if (year === currentYear) {
    return `${month}-${day}`;
  }

  return `${year}-${month}-${day}`;
};

/**
 * 将毫秒数转换为可读的时长格式
 * @param milliseconds - 时长（毫秒）
 * @returns 格式化的时长字符串，如"1分30秒"
 */
export const formatDuration = (milliseconds: number): string => {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return seconds > 0 ? `${minutes}分${seconds}秒` : `${minutes}分钟`;
  }

  return `${seconds}秒`;
};

/**
 * 获取今天的开始时间戳
 * @returns 今天00:00:00的时间戳
 */
export const getTodayStart = (): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.getTime();
};

/**
 * 获取本周的开始时间戳（周一）
 * @returns 本周一00:00:00的时间戳
 */
export const getWeekStart = (): number => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // 调整到周一
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
};

/**
 * 判断是否为今天
 * @param timestamp - 时间戳（毫秒）
 * @returns 是否为今天
 */
export const isToday = (timestamp: number): boolean => {
  const todayStart = getTodayStart();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  return timestamp >= todayStart && timestamp < tomorrowStart;
};

/**
 * 判断是否为本周
 * @param timestamp - 时间戳（毫秒）
 * @returns 是否为本周
 */
export const isThisWeek = (timestamp: number): boolean => {
  const weekStart = getWeekStart();
  // 计算下周开始（7天后）
  const nextWeekStart = weekStart + 7 * 24 * 60 * 60 * 1000;
  return timestamp >= weekStart && timestamp < nextWeekStart;
};
