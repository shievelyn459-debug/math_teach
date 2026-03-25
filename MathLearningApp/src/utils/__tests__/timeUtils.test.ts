/**
 * Story 5-1: timeUtils 单元测试
 */

import {
  formatTimeAgo,
  formatDuration,
  getTodayStart,
  getWeekStart,
  isToday,
  isThisWeek,
} from '../timeUtils';

describe('timeUtils', () => {
  describe('formatTimeAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-23T12:00:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "刚刚" for less than 1 minute ago', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 30 * 1000)).toBe('刚刚');
      expect(formatTimeAgo(now - 59 * 1000)).toBe('刚刚');
    });

    it('should return "X分钟前" for less than 1 hour ago', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 60 * 1000)).toBe('1分钟前');
      expect(formatTimeAgo(now - 5 * 60 * 1000)).toBe('5分钟前');
      expect(formatTimeAgo(now - 59 * 60 * 1000)).toBe('59分钟前');
    });

    it('should return "X小时前" for less than 1 day ago', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 60 * 60 * 1000)).toBe('1小时前');
      expect(formatTimeAgo(now - 5 * 60 * 60 * 1000)).toBe('5小时前');
      expect(formatTimeAgo(now - 23 * 60 * 60 * 1000)).toBe('23小时前');
    });

    it('should return "X天前" for less than 7 days ago', () => {
      const now = Date.now();
      expect(formatTimeAgo(now - 24 * 60 * 60 * 1000)).toBe('1天前');
      expect(formatTimeAgo(now - 3 * 24 * 60 * 60 * 1000)).toBe('3天前');
      expect(formatTimeAgo(now - 6 * 24 * 60 * 60 * 1000)).toBe('6天前');
    });

    it('should return formatted date for older than 7 days in current year', () => {
      const timestamp = new Date('2026-03-01T12:00:00Z').getTime();
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('03-01');
    });

    it('should return formatted date with year for previous year', () => {
      const timestamp = new Date('2025-12-25T12:00:00Z').getTime();
      const result = formatTimeAgo(timestamp);
      expect(result).toBe('2025-12-25');
    });
  });

  describe('formatDuration', () => {
    it('should return "X秒" for less than 1 minute', () => {
      expect(formatDuration(1000)).toBe('1秒');
      expect(formatDuration(30 * 1000)).toBe('30秒');
      expect(formatDuration(59 * 1000)).toBe('59秒');
    });

    it('should return "X分X秒" for minutes with seconds', () => {
      expect(formatDuration(60 * 1000)).toBe('1分钟');
      expect(formatDuration(90 * 1000)).toBe('1分30秒');
      expect(formatDuration(5 * 60 * 1000 + 30 * 1000)).toBe('5分30秒');
    });

    it('should return "X分钟" for whole minutes', () => {
      expect(formatDuration(2 * 60 * 1000)).toBe('2分钟');
      expect(formatDuration(10 * 60 * 1000)).toBe('10分钟');
    });

    it('should handle zero milliseconds', () => {
      expect(formatDuration(0)).toBe('0秒');
    });
  });

  describe('getTodayStart', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-23T15:30:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return timestamp for today at 00:00:00', () => {
      const result = getTodayStart();
      // 计算本地时区的预期值（从设置的系统时间推算）
      const systemTime = new Date().getTime();
      const expected = new Date(systemTime).setHours(0, 0, 0, 0);
      expect(result).toBe(expected);
    });
  });

  describe('getWeekStart', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return Monday timestamp when today is Wednesday', () => {
      jest.setSystemTime(new Date('2026-03-25T12:00:00Z').getTime()); // Wednesday
      const result = getWeekStart();
      // 本地时区的周一 00:00:00
      const wednesday = new Date();
      const day = wednesday.getDay();
      const diff = wednesday.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(wednesday.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const expected = monday.getTime();
      expect(result).toBe(expected);
    });

    it('should return Monday timestamp when today is Monday', () => {
      jest.setSystemTime(new Date('2026-03-23T12:00:00Z').getTime()); // Monday
      const result = getWeekStart();
      // 本地时区的周一 00:00:00
      const monday = new Date();
      monday.setHours(0, 0, 0, 0);
      const expected = monday.getTime();
      expect(result).toBe(expected);
    });

    it('should return previous Monday timestamp when today is Sunday', () => {
      jest.setSystemTime(new Date('2026-03-29T12:00:00Z').getTime()); // Sunday
      const result = getWeekStart();
      // 本地时区的周一 00:00:00
      const sunday = new Date();
      const day = sunday.getDay();
      const diff = sunday.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(sunday.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      const expected = monday.getTime();
      expect(result).toBe(expected);
    });
  });

  describe('isToday', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-23T12:00:00Z').getTime());
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true for today timestamp', () => {
      const now = new Date().getTime();
      expect(isToday(now)).toBe(true);
    });

    it('should return true for early today timestamp', () => {
      const today = new Date();
      today.setHours(0, 0, 1, 0);
      const earlyToday = today.getTime();
      expect(isToday(earlyToday)).toBe(true);
    });

    it('should return false for yesterday timestamp', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(23, 59, 59, 999);
      const yesterdayTimestamp = yesterday.getTime();
      expect(isToday(yesterdayTimestamp)).toBe(false);
    });

    it('should return false for tomorrow timestamp', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 1, 0);
      const tomorrowTimestamp = tomorrow.getTime();
      expect(isToday(tomorrowTimestamp)).toBe(false);
    });
  });

  describe('isThisWeek', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-03-25T12:00:00Z').getTime()); // Wednesday
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return true for Monday of this week', () => {
      const monday = new Date('2026-03-23T12:00:00Z').getTime();
      expect(isThisWeek(monday)).toBe(true);
    });

    it('should return true for today', () => {
      const today = new Date('2026-03-25T12:00:00Z').getTime();
      expect(isThisWeek(today)).toBe(true);
    });

    it('should return false for previous Sunday', () => {
      // 系统时间是周三，上周日应该是本周一之前
      const now = new Date();
      const dayOfWeek = now.getDay();
      // 计算上周日（如果今天是周三(3)，上周日是3天前）
      const lastSunday = new Date(now);
      lastSunday.setDate(now.getDate() - dayOfWeek - 1);
      lastSunday.setHours(23, 59, 59, 999);
      const sundayTimestamp = lastSunday.getTime();
      expect(isThisWeek(sundayTimestamp)).toBe(false);
    });

    it('should return false for next Monday', () => {
      // 下周一应该是本周之后
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(now);
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 1, 0);
      const mondayTimestamp = nextMonday.getTime();
      expect(isThisWeek(mondayTimestamp)).toBe(false);
    });
  });
});
