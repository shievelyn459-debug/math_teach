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
      const expected = new Date('2026-03-23T00:00:00Z').getTime();
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
      const expected = new Date('2026-03-23T00:00:00Z').getTime(); // Monday
      expect(result).toBe(expected);
    });

    it('should return Monday timestamp when today is Monday', () => {
      jest.setSystemTime(new Date('2026-03-23T12:00:00Z').getTime()); // Monday
      const result = getWeekStart();
      const expected = new Date('2026-03-23T00:00:00Z').getTime();
      expect(result).toBe(expected);
    });

    it('should return previous Monday timestamp when today is Sunday', () => {
      jest.setSystemTime(new Date('2026-03-29T12:00:00Z').getTime()); // Sunday
      const result = getWeekStart();
      const expected = new Date('2026-03-23T00:00:00Z').getTime(); // Previous Monday
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
      const today = new Date('2026-03-23T12:00:00Z').getTime();
      expect(isToday(today)).toBe(true);
    });

    it('should return true for early today timestamp', () => {
      const earlyToday = new Date('2026-03-23T00:00:01Z').getTime();
      expect(isToday(earlyToday)).toBe(true);
    });

    it('should return false for yesterday timestamp', () => {
      const yesterday = new Date('2026-03-22T23:59:59Z').getTime();
      expect(isToday(yesterday)).toBe(false);
    });

    it('should return false for tomorrow timestamp', () => {
      const tomorrow = new Date('2026-03-24T00:00:01Z').getTime();
      expect(isToday(tomorrow)).toBe(false);
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
      const sunday = new Date('2026-03-22T23:59:59Z').getTime();
      expect(isThisWeek(sunday)).toBe(false);
    });

    it('should return false for next Monday', () => {
      const nextMonday = new Date('2026-03-30T00:00:01Z').getTime();
      expect(isThisWeek(nextMonday)).toBe(false);
    });
  });
});
