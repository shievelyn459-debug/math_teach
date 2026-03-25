/**
 * StudyDataRepository Performance Tests
 *
 * Story 6-4 AC3: 统计查询性能测试通过
 *
 * 测试要求：
 * - 1000条记录的统计查询性能（<1秒）
 * - 10000条记录的查询性能（<2秒）
 * - 时间范围查询使用索引优化
 */

import {studyDataRepository} from '../StudyDataRepository';
import {prisma} from '../prismaClient';
import {Action} from '@prisma/client';

describe('StudyDataRepository Performance', () => {
  const TEST_CHILD_ID = 'perf-test-child';
  const TEST_PARENT_ID = 'perf-test-parent';

  // 清理测试数据
  beforeAll(async () => {
    // 删除可能存在的测试数据
    await studyDataRepository.deleteByChild(TEST_CHILD_ID);
  });

  afterAll(async () => {
    // 清理测试数据
    await studyDataRepository.deleteByChild(TEST_CHILD_ID);
  });

  /**
   * AC3 Task 3.1: 1000条记录统计查询性能测试
   */
  describe('1000 Records Performance', () => {
    beforeAll(async () => {
      console.time('setup-1000-records');
      // 创建1000条测试记录
      const records = Array.from({length: 1000}, (_, i) => ({
        recordId: `perf-1000-${i}`,
        childId: TEST_CHILD_ID,
        parentId: TEST_PARENT_ID,
        questionId: `question-${i}`,
        action: (i % 3 === 0 ? 'upload' : i % 2 === 0 ? 'practice' : 'review') as Action,
        duration: Math.floor(Math.random() * 60000) + 10000, // 10-70秒
        correct: Math.random() > 0.3, // 70%正确率
        questionType: ['加法', '减法', '乘法', '除法'][i % 4],
        difficulty: ['easy', 'medium', 'hard'][i % 3],
      }));

      // 使用批量创建提高性能
      await studyDataRepository.createMany(records);
      console.timeEnd('setup-1000-records');
    });

    it('should calculate statistics within 1 second for 1000 records', async () => {
      const startTime = Date.now();
      const stats = await studyDataRepository.getStatistics(TEST_CHILD_ID);
      const duration = Date.now() - startTime;

      console.log(`Statistics query duration: ${duration}ms`);
      console.log('Stats:', stats);

      expect(duration).toBeLessThan(1000); // < 1秒
      expect(stats.totalQuestions).toBe(1000);
      expect(stats.practiceCount).toBeGreaterThan(0);
      expect(stats.accuracy).toBeGreaterThanOrEqual(0);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should query time range efficiently using index for 1000 records', async () => {
      const startDate = new Date('2026-01-01');
      const endDate = new Date('2026-12-31');

      const startTime = Date.now();
      const records = await studyDataRepository.findByTimeRange(
        TEST_CHILD_ID,
        startDate,
        endDate
      );
      const duration = Date.now() - startTime;

      console.log(`Time range query duration: ${duration}ms`);
      console.log(`Records found: ${records.length}`);

      expect(duration).toBeLessThan(500); // < 500ms
      expect(records.length).toBe(1000);
    });

    it('should use composite index for parent-child query efficiently', async () => {
      const startTime = Date.now();
      const records = await studyDataRepository.findByParentIdAndChildId(
        TEST_PARENT_ID,
        TEST_CHILD_ID
      );
      const duration = Date.now() - startTime;

      console.log(`Composite index query duration: ${duration}ms`);

      expect(duration).toBeLessThan(300); // < 300ms
      expect(records.length).toBe(1000);
    });
  });

  /**
   * AC3 Task 3.2: 大数据量测试 - 10000条记录
   */
  describe('10000 Records Performance', () => {
    const LARGE_TEST_CHILD_ID = 'perf-test-child-large';

    beforeAll(async () => {
      console.time('setup-10000-records');
      // 清理可能存在的数据
      await studyDataRepository.deleteByChild(LARGE_TEST_CHILD_ID);

      // 创建10000条测试记录
      const batchSize = 100;
      for (let batch = 0; batch < 100; batch++) {
        const records = Array.from({length: batchSize}, (_, i) => {
          const index = batch * batchSize + i;
          return {
            recordId: `perf-10000-${index}`,
            childId: LARGE_TEST_CHILD_ID,
            parentId: TEST_PARENT_ID,
            questionId: `question-${index}`,
            action: (index % 3 === 0 ? 'upload' : index % 2 === 0 ? 'practice' : 'review') as Action,
            duration: Math.floor(Math.random() * 60000) + 10000,
            correct: Math.random() > 0.3,
          };
        });

        await studyDataRepository.createMany(records);

        // 每10批打印一次进度
        if (batch % 10 === 0) {
          console.log(`Created ${(batch + 1) * batchSize} records...`);
        }
      }
      console.timeEnd('setup-10000-records');
    });

    afterAll(async () => {
      await studyDataRepository.deleteByChild(LARGE_TEST_CHILD_ID);
    });

    it('should calculate statistics within 2 seconds for 10000 records', async () => {
      const startTime = Date.now();
      const stats = await studyDataRepository.getStatistics(LARGE_TEST_CHILD_ID);
      const duration = Date.now() - startTime;

      console.log(`10000 records statistics duration: ${duration}ms`);

      expect(duration).toBeLessThan(2000); // < 2秒
      expect(stats.totalQuestions).toBe(10000);
      expect(stats.averageDuration).toBeGreaterThan(0);
    });

    it('should handle concurrent query operations efficiently', async () => {
      const startTime = Date.now();

      // 并发执行多个查询
      const results = await Promise.all([
        studyDataRepository.getStatistics(LARGE_TEST_CHILD_ID),
        studyDataRepository.findByAction('practice'),
        studyDataRepository.findByTimeRange(
          LARGE_TEST_CHILD_ID,
          new Date('2026-01-01'),
          new Date('2026-12-31')
        ),
      ]);

      const duration = Date.now() - startTime;

      console.log(`Concurrent queries duration: ${duration}ms`);

      expect(duration).toBeLessThan(3000); // < 3秒
      expect(results[0].totalQuestions).toBe(10000);
    });
  });

  /**
   * AC3 Task 3.3: 统计准确性测试
   */
  describe('Statistics Accuracy', () => {
    const ACCURACY_TEST_CHILD_ID = 'perf-test-child-accuracy';

    beforeAll(async () => {
      await studyDataRepository.deleteByChild(ACCURACY_TEST_CHILD_ID);

      // 创建具有已知统计特征的测试数据
      const records = [
        // 100条练习记录，其中80条正确
        ...Array.from({length: 80}, (_, i) => ({
          recordId: `accuracy-practice-correct-${i}`,
          childId: ACCURACY_TEST_CHILD_ID,
          parentId: TEST_PARENT_ID,
          questionId: `question-${i}`,
          action: 'practice' as Action,
          duration: 30000,
          correct: true,
        })),
        ...Array.from({length: 20}, (_, i) => ({
          recordId: `accuracy-practice-wrong-${i}`,
          childId: ACCURACY_TEST_CHILD_ID,
          parentId: TEST_PARENT_ID,
          questionId: `question-${i}`,
          action: 'practice' as Action,
          duration: 20000,
          correct: false,
        })),
        // 30条上传记录
        ...Array.from({length: 30}, (_, i) => ({
          recordId: `accuracy-upload-${i}`,
          childId: ACCURACY_TEST_CHILD_ID,
          parentId: TEST_PARENT_ID,
          action: 'upload' as Action,
          duration: 0,
        })),
        // 20条复习记录
        ...Array.from({length: 20}, (_, i) => ({
          recordId: `accuracy-review-${i}`,
          childId: ACCURACY_TEST_CHILD_ID,
          parentId: TEST_PARENT_ID,
          action: 'review' as Action,
          duration: 15000,
        })),
      ];

      await studyDataRepository.createMany(records);
    });

    afterAll(async () => {
      await studyDataRepository.deleteByChild(ACCURACY_TEST_CHILD_ID);
    });

    it('should calculate correct accuracy rate', async () => {
      const stats = await studyDataRepository.getStatistics(ACCURACY_TEST_CHILD_ID);

      // 80正确 / 100练习 = 80%
      expect(stats.accuracy).toBe(0.8);
      expect(stats.correctCount).toBe(80);
    });

    it('should calculate correct counts by action type', async () => {
      const stats = await studyDataRepository.getStatistics(ACCURACY_TEST_CHILD_ID);

      expect(stats.totalQuestions).toBe(150); // 100 + 30 + 20
      expect(stats.practiceCount).toBe(100);
      expect(stats.uploadCount).toBe(30);
      expect(stats.reviewCount).toBe(20);
    });

    it('should calculate correct average duration for practice records', async () => {
      const stats = await studyDataRepository.getStatistics(ACCURACY_TEST_CHILD_ID);

      // (80 * 30000 + 20 * 20000) / 100 = 28000
      expect(stats.averageDuration).toBe(28000);
    });
  });
});
