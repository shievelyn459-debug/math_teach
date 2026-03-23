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

    it('returns an encouragement phrase containing positive words', () => {
      const phrase = getSupportivePhrase('encouragement');
      // 检查是否包含鼓励性词汇
      const encouragingWords = ['好', '继续', '进步', '努力', '相信', '可以', '尝试', '称赞', '难不倒'];
      const hasEncouragingWords = encouragingWords.some(word => phrase.includes(word));
      expect(hasEncouragingWords).toBe(true);
    });

    it('returns a reassurance phrase containing comforting words', () => {
      const phrase = getSupportivePhrase('reassurance');
      // 检查是否包含安慰性词汇
      const reassuringWords = ['没关系', '慢慢', '一起', '再试', '学习', '担心', '机会', '不急', '帮'];
      const hasReassuringWords = reassuringWords.some(word => phrase.includes(word));
      expect(hasReassuringWords).toBe(true);
    });

    it('returns a celebration phrase with emoji or positive words', () => {
      const phrase = getSupportivePhrase('celebration');
      // 检查是否包含庆祝emoji或积极词汇
      const hasCelebrationEmoji = /[🎉🌟✨💪🏆]/.test(phrase);
      const hasPositiveWords = ['棒', '好', '厉害', '了不起'].some(word => phrase.includes(word));
      expect(hasCelebrationEmoji || hasPositiveWords).toBe(true);
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
      // 检查是否包含友好词汇
      const hasFriendlyWords = ['小问题', '小插曲', '再试', '没关系'].some(word => message.includes(word));
      expect(hasFriendlyWords).toBe(true);
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
