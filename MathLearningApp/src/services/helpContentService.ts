/**
 * Story 5-2: 帮助内容服务
 * 管理应用的帮助内容，支持缓存和搜索
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = 'help_content_cache';
const CACHE_VERSION_KEY = 'help_content_version';
const CURRENT_VERSION = '1.0.0';
const MAX_SEARCH_QUERY_LENGTH = 100; // 搜索查询最大长度
const MAX_CACHE_SIZE = 100; // 缓存最大条目数（LRU策略）

/**
 * 帮助区块
 */
export interface HelpSection {
  title: string;
  content: string;
  image?: string;
  tips?: string[];
}

/**
 * FAQ 项目
 */
export interface FAQItem {
  question: string;
  answer: string;
}

/**
 * 帮助内容
 */
export interface HelpContent {
  screenId: string;
  title: string;
  sections: HelpSection[];
  faq?: FAQItem[];
  lastUpdated: number;
}

/**
 * 帮助内容服务类
 */
class HelpContentService {
  private cache: Map<string, HelpContent> = new Map();
  private initialized = false;
  private initializationPromise: Promise<void> | null = null;
  private cacheAccessOrder: string[] = []; // 用于LRU淘汰

  /**
   * 初始化服务（防竞态条件）
   */
  async initialize(): Promise<void> {
    // 如果正在初始化，返回相同的Promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      if (this.initialized) {
        return;
      }

      try {
        // 检查缓存版本
        const cachedVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);

        if (cachedVersion === CURRENT_VERSION) {
          // 加载缓存
          await this.loadCache();
        } else {
          // 版本不匹配，重新加载所有内容
          await this.refreshCache();
        }

        this.initialized = true;
      } catch (error) {
        console.error('Failed to initialize help content service:', error);
        // 即使失败也继续使用默认内容
        this.loadDefaultContent();
        this.initialized = true;
      }
    })();

    return this.initializationPromise;
  }

  /**
   * 获取帮助内容
   * @param screenId 屏幕 ID
   * @returns 帮助内容
   */
  async getHelpContent(screenId: string): Promise<HelpContent | null> {
    // 输入验证
    if (!screenId || typeof screenId !== 'string') {
      console.warn('Invalid screenId provided to getHelpContent');
      return this.getGenericHelp();
    }

    if (!this.initialized) {
      await this.initialize();
    }

    const content = this.cache.get(screenId);

    if (!content) {
      // 如果没有找到，返回通用帮助
      return this.getGenericHelp();
    }

    // 更新LRU顺序
    this.updateCacheAccessOrder(screenId);

    return content;
  }

  /**
   * 搜索帮助内容
   * @param query 搜索关键词
   * @returns 匹配的帮助内容列表
   */
  async searchHelp(query: string): Promise<HelpContent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // 输入验证 - 限制查询长度
    if (!query || typeof query !== 'string') {
      return Array.from(this.cache.values());
    }

    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return Array.from(this.cache.values());
    }

    if (trimmedQuery.length > MAX_SEARCH_QUERY_LENGTH) {
      console.warn(`Search query too long, truncating to ${MAX_SEARCH_QUERY_LENGTH} characters`);
      query = trimmedQuery.substring(0, MAX_SEARCH_QUERY_LENGTH);
    }

    const lowerQuery = query.toLowerCase();
    const results: HelpContent[] = [];

    for (const content of this.cache.values()) {
      // 搜索标题
      if (content.title.toLowerCase().includes(lowerQuery)) {
        results.push(content);
        continue;
      }

      // 搜索区块内容
      const hasMatchingSection = content.sections.some(
        section =>
          section.title.toLowerCase().includes(lowerQuery) ||
          section.content.toLowerCase().includes(lowerQuery)
      );

      if (hasMatchingSection) {
        results.push(content);
        continue;
      }

      // 搜索 FAQ
      const hasMatchingFAQ = content.faq?.some(
        item =>
          item.question.toLowerCase().includes(lowerQuery) ||
          item.answer.toLowerCase().includes(lowerQuery)
      );

      if (hasMatchingFAQ) {
        results.push(content);
      }
    }

    return results;
  }

  /**
   * 更新缓存访问顺序（LRU）
   */
  private updateCacheAccessOrder(key: string): void {
    const index = this.cacheAccessOrder.indexOf(key);
    if (index > -1) {
      this.cacheAccessOrder.splice(index, 1);
    }
    this.cacheAccessOrder.push(key);

    // 如果超过最大缓存大小，删除最旧的条目
    if (this.cacheAccessOrder.length > MAX_CACHE_SIZE) {
      const oldestKey = this.cacheAccessOrder.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
  }

  /**
   * 获取所有帮助内容
   */
  async getAllHelpContent(): Promise<HelpContent[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return Array.from(this.cache.values());
  }

  /**
   * 刷新缓存
   */
  async refreshCache(): Promise<void> {
    this.loadDefaultContent();
    await this.saveCache();
    await AsyncStorage.setItem(CACHE_VERSION_KEY, CURRENT_VERSION);
  }

  /**
   * 加载缓存
   */
  private async loadCache(): Promise<void> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);

      if (cached) {
        try {
          const parsed = JSON.parse(cached);

          // 验证解析结果是否为对象
          if (parsed && typeof parsed === 'object') {
            const entries = Object.entries(parsed);

            // 验证每个条目
            for (const [key, value] of entries) {
              if (value && typeof value === 'object' && value.screenId && value.title) {
                this.cache.set(key, value as HelpContent);
                this.cacheAccessOrder.push(key);
              }
            }
          } else {
            console.warn('Invalid cache data format, loading default content');
            this.loadDefaultContent();
          }
        } catch (parseError) {
          console.error('Failed to parse cached data:', parseError);
          this.loadDefaultContent();
        }
      } else {
        this.loadDefaultContent();
      }
    } catch (error) {
      console.error('Failed to load help content cache:', error);
      this.loadDefaultContent();
    }
  }

  /**
   * 保存缓存
   */
  private async saveCache(): Promise<void> {
    try {
      const obj = Object.fromEntries(this.cache);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(obj));
    } catch (error) {
      console.error('Failed to save help content cache:', error);
    }
  }

  /**
   * 加载默认帮助内容
   */
  private loadDefaultContent(): void {
    this.cache.clear();
    this.cacheAccessOrder = [];

    // HomeScreen 帮助
    this.cache.set('HomeScreen', {
      screenId: 'HomeScreen',
      title: '首页使用指南',
      lastUpdated: Date.now(),
      sections: [
        {
          title: '拍照上传题目',
          content: '点击首页的"拍照上传题目"卡片，可以快速拍摄数学题照片。系统会自动识别题目类型，并生成相应的练习题。',
          tips: [
            '确保题目完整清晰',
            '保持光线充足',
            '对准题目后点击拍照'
          ]
        },
        {
          title: '最近练习',
          content: '这里显示您最近的练习记录，点击任何记录可以查看详细题目和答案。',
          tips: [
            '最多显示5条最近记录',
            '点击"查看全部"可以查看所有历史'
          ]
        },
        {
          title: '学习进度',
          content: '查看孩子的整体学习进度和统计数据。',
        },
        {
          title: '辅导小贴士',
          content: '为您提供实用的数学辅导建议和技巧。',
        }
      ],
      faq: [
        {
          question: '如何开始第一次练习？',
          answer: '点击"拍照上传题目"，拍摄一道数学题，系统会自动识别并生成练习题。'
        },
        {
          question: '可以查看以前的练习吗？',
          answer: '可以，点击"最近练习"中的"查看全部"可以看到所有历史记录。'
        },
        {
          question: '如何删除练习记录？',
          answer: '目前在练习详情页面可以删除单条记录。'
        }
      ]
    });

    // CameraScreen 帮助
    this.cache.set('CameraScreen', {
      screenId: 'CameraScreen',
      title: '拍照识别指南',
      lastUpdated: Date.now(),
      sections: [
        {
          title: '如何拍摄好题目',
          content: '拍摄清晰的题目照片可以帮助系统更准确地识别。',
          tips: [
            '确保题目完整在画面中',
            '保持手机稳定，避免模糊',
            '光线要充足，避免阴影',
            '题目文字要清晰可见'
          ]
        },
        {
          title: '拍照流程',
          content: '1. 对准数学题\n2. 点击拍照按钮\n3. 确认题目类型\n4. 选择难度\n5. 等待生成练习题',
        },
        {
          title: '系统处理过程',
          content: '拍照后，系统会经历以下步骤：上传图片 → 识别题目 → 选择类型 → 选择难度 → 生成练习题。整个过程通常在30秒内完成。',
        }
      ],
      faq: [
        {
          question: '系统识别不出题目怎么办？',
          answer: '请确保题目清晰完整。如果仍然无法识别，可以手动选择题目类型。'
        },
        {
          question: '识别错误可以修改吗？',
          answer: '可以，在确认题目类型时，可以手动修改识别结果。'
        },
        {
          question: '处理时间太长怎么办？',
          answer: '网络不稳定可能导致处理时间延长。请检查网络连接，或稍后重试。'
        }
      ]
    });

    // GeneratedQuestionsList 帮助
    this.cache.set('GeneratedQuestionsList', {
      screenId: 'GeneratedQuestionsList',
      title: '练习题使用指南',
      lastUpdated: Date.now(),
      sections: [
        {
          title: '查看答案',
          content: '点击任何题目卡片，可以展开查看详细答案和解析。',
        },
        {
          title: '导出PDF',
          content: '点击右上角的PDF图标，可以将练习题导出为PDF文件，方便打印或分享。',
          tips: [
            'PDF包含题目和答案',
            '可以保存到本地',
            '可以通过其他应用分享'
          ]
        },
        {
          title: '难度说明',
          content: '简单：适合基础练习\n中等：适合巩固提高\n困难：适合挑战提升',
        }
      ],
      faq: [
        {
          question: '如何分享练习题？',
          answer: '导出PDF后，可以通过微信、邮件等应用分享。'
        },
        {
          question: '答案可以隐藏吗？',
          answer: '可以，题目默认折叠答案，点击后才会显示，方便让孩子先做题。'
        },
        {
          question: '可以打印练习题吗？',
          answer: '可以，导出PDF后，使用系统的打印功能即可打印。'
        }
      ]
    });

    // ProfileScreen 帮助
    this.cache.set('ProfileScreen', {
      screenId: 'ProfileScreen',
      title: '个人中心指南',
      lastUpdated: Date.now(),
      sections: [
        {
          title: '管理个人信息',
          content: '可以查看和修改您的个人信息，包括姓名、手机号等。',
        },
        {
          title: '孩子信息管理',
          content: '添加或编辑孩子的信息，包括姓名、年级等，帮助我们提供更适合的练习内容。',
        },
        {
          title: '设置',
          content: '可以调整应用设置，如通知、声音等。',
        }
      ],
      faq: [
        {
          question: '如何修改孩子年级？',
          answer: '在"孩子信息"部分，点击编辑按钮可以修改年级等信息。'
        },
        {
          question: '可以添加多个孩子吗？',
          answer: '目前支持添加一个孩子的信息。'
        }
      ]
    });
  }

  /**
   * 获取通用帮助
   */
  private getGenericHelp(): HelpContent {
    return {
      screenId: 'Generic',
      title: '应用使用帮助',
      lastUpdated: Date.now(),
      sections: [
        {
          title: '欢迎使用',
          content: '这是一个帮助家长辅导孩子数学学习的应用。通过拍照识别数学题，自动生成练习题。',
        },
        {
          title: '主要功能',
          content: '• 拍照上传题目：快速识别数学题\n• 生成练习题：根据题目自动生成\n• 导出PDF：保存和分享练习题\n• 学习进度：跟踪孩子的学习情况',
        }
      ],
      faq: [
        {
          question: '如何开始使用？',
          answer: '首次使用建议先完善个人信息和孩子信息，然后点击"拍照上传题目"开始第一次练习。'
        },
        {
          question: '使用收费吗？',
          answer: '目前应用完全免费使用。'
        }
      ]
    };
  }

  /**
   * 清除缓存（用于调试）
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(CACHE_KEY);
      await AsyncStorage.removeItem(CACHE_VERSION_KEY);
      this.cache.clear();
      this.loadDefaultContent();
    } catch (error) {
      console.error('Failed to clear help content cache:', error);
    }
  }
}

// 导出单例实例
export const helpContentService = new HelpContentService();
