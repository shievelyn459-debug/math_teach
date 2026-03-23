/**
 * Story 5-2: 帮助内容服务测试
 * 测试 HelpContentService 的所有功能
 */

import {helpContentService} from '../helpContentService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

import AsyncStorage from '@react-native-async-storage/async-storage';

describe('HelpContentService', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await helpContentService.clearCache();
  });

  describe('初始化', () => {
    it('应该成功初始化', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue(null);

      await helpContentService.initialize();

      expect(getItemMock).toHaveBeenCalled();
    });

    it('应该加载缓存的帮助内容', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      const mockContent = {
        HomeScreen: {
          screenId: 'HomeScreen',
          title: '首页使用指南',
          lastUpdated: Date.now(),
          sections: [{title: '测试', content: '内容'}],
        },
      };
      getItemMock.mockResolvedValueOnce('1.0.0');
      getItemMock.mockResolvedValueOnce(JSON.stringify(mockContent));

      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('HomeScreen');
      expect(content).not.toBeNull();
      expect(content?.title).toBe('首页使用指南');
    });

    it('应该使用默认内容当缓存为空时', async () => {
      const getItemMock = AsyncStorage.getItem as jest.Mock;
      getItemMock.mockResolvedValue(null);

      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('HomeScreen');
      expect(content).not.toBeNull();
    });
  });

  describe('获取帮助内容', () => {
    it('应该返回指定屏幕的帮助内容', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('HomeScreen');

      expect(content).not.toBeNull();
      expect(content?.screenId).toBe('HomeScreen');
      expect(content?.title).toBe('首页使用指南');
    });

    it('应该返回CameraScreen的帮助内容', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('CameraScreen');

      expect(content).not.toBeNull();
      expect(content?.screenId).toBe('CameraScreen');
      expect(content?.sections.length).toBeGreaterThan(0);
    });

    it('应该返回GeneratedQuestionsList的帮助内容', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent(
        'GeneratedQuestionsList'
      );

      expect(content).not.toBeNull();
      expect(content?.screenId).toBe('GeneratedQuestionsList');
    });

    it('应该返回ProfileScreen的帮助内容', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('ProfileScreen');

      expect(content).not.toBeNull();
      expect(content?.screenId).toBe('ProfileScreen');
    });

    it('应该返回通用帮助当屏幕不存在时', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('UnknownScreen');

      expect(content).not.toBeNull();
      expect(content?.screenId).toBe('Generic');
    });
  });

  describe('搜索帮助内容', () => {
    beforeEach(async () => {
      await helpContentService.initialize();
    });

    it('应该搜索标题', async () => {
      const results = await helpContentService.searchHelp('首页');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].title).toContain('首页');
    });

    it('应该搜索内容', async () => {
      const results = await helpContentService.searchHelp('拍照');

      expect(results.length).toBeGreaterThan(0);
    });

    it('应该搜索FAQ', async () => {
      const results = await helpContentService.searchHelp('如何');

      expect(results.length).toBeGreaterThan(0);
    });

    it('应该返回空结果当搜索词不存在时', async () => {
      const results = await helpContentService.searchHelp('不存在的关键词xyz');

      expect(results).toEqual([]);
    });

    it('应该处理空搜索词', async () => {
      const results = await helpContentService.searchHelp('');

      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('获取所有帮助内容', () => {
    it('应该返回所有帮助内容', async () => {
      await helpContentService.initialize();

      const allContent = await helpContentService.getAllHelpContent();

      expect(allContent.length).toBeGreaterThan(0);
      expect(allContent.length).toBeGreaterThanOrEqual(4); // 至少4个屏幕
    });
  });

  describe('刷新缓存', () => {
    it('应该刷新缓存并更新版本', async () => {
      const setItemMock = AsyncStorage.setItem as jest.Mock;
      setItemMock.mockResolvedValue(undefined);

      await helpContentService.refreshCache();

      expect(setItemMock).toHaveBeenCalledWith(
        'help_content_version',
        '1.0.0'
      );
    });
  });

  describe('清除缓存', () => {
    it('应该清除所有缓存', async () => {
      const removeItemMock = AsyncStorage.removeItem as jest.Mock;
      removeItemMock.mockResolvedValue(undefined);

      await helpContentService.clearCache();

      expect(removeItemMock).toHaveBeenCalledWith('help_content_cache');
      expect(removeItemMock).toHaveBeenCalledWith('help_content_version');
    });
  });

  describe('帮助内容结构', () => {
    it('HomeScreen应该包含sections', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('HomeScreen');

      expect(content?.sections.length).toBeGreaterThan(0);
      expect(content?.sections[0].title).toBeTruthy();
      expect(content?.sections[0].content).toBeTruthy();
    });

    it('HomeScreen应该包含FAQ', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('HomeScreen');

      expect(content?.faq).toBeDefined();
      expect(content?.faq!.length).toBeGreaterThan(0);
      expect(content?.faq![0].question).toBeTruthy();
      expect(content?.faq![0].answer).toBeTruthy();
    });

    it('CameraScreen应该包含拍照提示', async () => {
      await helpContentService.initialize();

      const content = await helpContentService.getHelpContent('CameraScreen');

      const tipsSection = content?.sections.find(s =>
        s.tips && s.tips.length > 0
      );
      expect(tipsSection).toBeDefined();
    });
  });

  describe('帮助内容质量', () => {
    it('所有帮助内容应该有标题', async () => {
      await helpContentService.initialize();

      const allContent = await helpContentService.getAllHelpContent();

      for (const content of allContent) {
        expect(content.title).toBeTruthy();
        expect(content.title.length).toBeGreaterThan(0);
      }
    });

    it('所有sections应该有内容', async () => {
      await helpContentService.initialize();

      const allContent = await helpContentService.getAllHelpContent();

      for (const content of allContent) {
        for (const section of content.sections) {
          expect(section.content).toBeTruthy();
          expect(section.content.length).toBeGreaterThan(0);
        }
      }
    });

    it('所有FAQ应该有问答', async () => {
      await helpContentService.initialize();

      const allContent = await helpContentService.getAllHelpContent();

      for (const content of allContent) {
        if (content.faq) {
          for (const faq of content.faq) {
            expect(faq.question).toBeTruthy();
            expect(faq.answer).toBeTruthy();
            expect(faq.question.length).toBeGreaterThan(0);
            expect(faq.answer.length).toBeGreaterThan(0);
          }
        }
      }
    });
  });
});
