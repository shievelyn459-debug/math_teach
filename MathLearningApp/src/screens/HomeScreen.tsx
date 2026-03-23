import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator} from 'react-native';
import {Card, Title, Paragraph, Button} from 'react-native-paper';
import {generationHistoryService} from '../services/generationHistoryService';
import {GenerationRecord} from '../types';
import RecentPracticeCard from '../components/RecentPracticeCard';

// PATCH-017: 提取魔法数字为常量
const MAX_RECENT_ITEMS = 5;

const HomeScreen = ({navigation}: any) => {
  const [recentGenerations, setRecentGenerations] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 加载最近练习记录
  useEffect(() => {
    loadRecentGenerations();
  }, []);

  /**
   * 加载最近练习记录
   */
  const loadRecentGenerations = async () => {
    try {
      setIsLoading(true);
      const generations = await generationHistoryService.getRecentGenerations(MAX_RECENT_ITEMS);
      setRecentGenerations(generations);
    } catch (error) {
      console.error('Failed to load recent generations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 刷新最近练习记录
   */
  const refreshRecentGenerations = async () => {
    await loadRecentGenerations();
  };

  // 当屏幕获得焦点时刷新数据（从其他页面返回时）
  useEffect(() => {
    // PATCH-007: 添加导航空值检查
    if (!navigation) {
      return;
    }

    const unsubscribe = navigation.addListener('focus', () => {
      refreshRecentGenerations();
    });

    return unsubscribe;
  }, [navigation]);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>一年级数学学习助手</Text>
        <Text style={styles.subtitle}>让家长轻松掌握辅导方法</Text>
      </View>

      <Card style={styles.card} onPress={() => navigation.navigate('Camera')}>
        <Card.Content>
          <Title style={styles.cardTitle}>📸 拍照上传题目</Title>
          <Paragraph>
            拍摄孩子的数学作业题目，系统将自动识别并生成同类型题目
          </Paragraph>
        </Card.Content>
      </Card>

      {/* 最近练习部分 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.cardTitle}>📚 最近练习</Title>
            {recentGenerations.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('QuestionList')}
                style={styles.viewAllButton}>
                <Text style={styles.viewAllText}>查看全部</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007bff" />
            </View>
          ) : recentGenerations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyTitle}>还没有练习记录</Text>
              <Text style={styles.emptyMessage}>
                点击上方"拍照上传题目"开始第一次练习吧！
              </Text>
            </View>
          ) : (
            <View style={styles.recentList}>
              {recentGenerations
                .filter(record => record && record.id) // PATCH-016: 过滤掉没有有效 ID 的记录
                .map(record => (
                  <RecentPracticeCard
                    key={record.id}
                    record={record}
                  />
                ))}
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>📊 学习进度</Title>
          <Text style={styles.emptyText}>暂无学习数据</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>💡 辅导小贴士</Title>
          <Text style={styles.tipText}>
            • 一年级学生适合使用实物辅助理解
            {'\n'}• 多使用生活化的例子解释数学概念
            {'\n'}• 鼓励孩子自己动手操作
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#333',
  },
  // 新增样式
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007bff',
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentList: {
    // 留空，卡片自带间距
  },
});

export default HomeScreen;
