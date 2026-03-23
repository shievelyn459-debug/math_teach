/**
 * Story 5-4: Tone Guidelines 工具测试
 */

import {
  getSupportivePhrase,
  rewriteErrorMessage,
  enhanceSuccessMessage,
  rewriteLoadingMessage,
  checkMessageTone,
  getEmptyStateContent,
} from '../toneGuidelines';

describe('Tone Guidelines', () => {
  describe('getSupportivePhrase', () => {
    it('returns a greeting phrase', () => {
      const phrase = getSupportivePhrase('greeting');
      expect(typeof phrase).toBe('string');
      expect(phrase.length).toBeGreaterThan(0);
    });

    it('returns an encouragement phrase', () => {
      const phrase = getSupportivePhrase('encouragement');
      expect(phrase).toContain('好') || expect(phrase).toContain('继续');
    });

    it('returns a reassurance phrase', () => {
      const phrase = getSupportivePhrase('reassurance');
      expect(phrase).toContain('没关系') || expect(phrase).toContain('慢慢');
    });

    it('returns a celebration phrase', () => {
      const phrase = getSupportivePhrase('celebration');
      expect(phrase).toMatch(/[🎉🌟✨💪🏆]/);
    });
  });

  describe('rewriteErrorMessage', () => {
    it('rewrites network error message', () => {
      const message = rewriteErrorMessage('network');
      expect(message).toContain('网络');
      expect(message).toMatch(/[💫🍃]/);
    });

    it('rewrites upload failed message', () => {
      const message = rewriteErrorMessage('uploadFailed');
      expect(message).toContain('上传');
      expect(message).toMatch(/[😊]/);
    });

    it('rewrites recognition failed message', () => {
      const message = rewriteErrorMessage('recognitionFailed');
      expect(message).toContain('模糊') || expect(message).toContain('识别');
    });

    it('returns default message for unknown error', () => {
      const message = rewriteErrorMessage('unknown' as any);
      expect(message).toContain('小问题');
    });
  });

  describe('enhanceSuccessMessage', () => {
    it('enhances generated success message', () => {
      const message = enhanceSuccessMessage('generated');
      expect(message).toContain('太棒了') || expect(message).toContain('🎉');
    });

    it('enhances saved success message', () => {
      const message = enhanceSuccessMessage('saved');
      expect(message).toContain('✨') || expect(message).toContain('很好');
    });

    it('enhances completed success message', () => {
      const message = enhanceSuccessMessage('completed');
      expect(message).toContain('🌟') || expect(message).toContain('加油');
    });
  });

  describe('rewriteLoadingMessage', () => {
    it('rewrites loading message', () => {
      const message = rewriteLoadingMessage('loading');
      expect(message).toContain('准备') || expect(message).toContain('🌈');
    });

    it('rewrites processing message', () => {
      const message = rewriteLoadingMessage('processing');
      expect(message).toContain('努力') || expect(message).toContain('☀️');
    });

    it('rewrites waiting message', () => {
      const message = rewriteLoadingMessage('waiting');
      expect(message).toContain('耐心') || expect(message).toContain('🍃');
    });
  });

  describe('checkMessageTone', () => {
    it('flags harsh language', () => {
      const result = checkMessageTone('这是一个错误');
      expect(result.isAppropriate).toBe(false);
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('approves friendly language', () => {
      const result = checkMessageTone('让我们一起试试看');
      expect(result.isAppropriate).toBe(true);
    });

    it('flags "你" language', () => {
      const result = checkMessageTone('你必须这样做');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('getEmptyStateContent', () => {
    it('returns content for no practice', () => {
      const content = getEmptyStateContent('noPractice');
      expect(content.title).toBe('准备好开始了吗？');
      expect(content.cta).toBe('拍第一道题');
    });

    it('returns content for no history', () => {
      const content = getEmptyStateContent('noHistory');
      expect(content.title).toBe('崭新的开始');
      expect(content.message).toContain('进步');
    });

    it('returns content for no favorites', () => {
      const content = getEmptyStateContent('noFavorites');
      expect(content.title).toContain('收藏');
      expect(content.cta).toBe('去练习');
    });
  });
});
