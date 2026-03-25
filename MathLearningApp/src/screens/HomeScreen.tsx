import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image} from 'react-native';
import {Card, Title, Paragraph, Button} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {generationHistoryService} from '../services/generationHistoryService';
import {feedbackManager, MilestoneType} from '../services/feedbackManager';
import {GenerationRecord} from '../types';
import RecentPracticeCard from '../components/RecentPracticeCard';
import HelpDialog from '../components/HelpDialog';
import OnboardingTour from '../components/OnboardingTour';
import CelebrationOverlay from '../components/CelebrationOverlay';
import {checkTourCompleted} from '../components/OnboardingTour';
import {launchImageLibrary} from 'react-native-image-picker';

// PATCH-017: 提取魔法数字为常量
const MAX_RECENT_ITEMS = 5;

const HomeScreen = ({navigation}: any) => {
  const [recentGenerations, setRecentGenerations] = useState<GenerationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // 追踪timeout用于清理
  const tourTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // 加载最近练习记录
  useEffect(() => {
    loadRecentGenerations();
    checkFirstTimeUser();

    return () => {
      isMountedRef.current = false;
      // 清理timeout
      if (tourTimeoutRef.current) {
        clearTimeout(tourTimeoutRef.current);
      }
    };
  }, []);

  // 检查是否首次使用用户（修复竞态条件）
  const checkFirstTimeUser = async () => {
    try {
      const completed = await checkTourCompleted('HomeScreen');
      if (!completed && isMountedRef.current) {
        // 延迟一点显示导览，让用户先看看界面
        // 使用ref追踪timeout以便在unmount时清理
        tourTimeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) {
            setShowTour(true);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Failed to check tour completion:', error);
    }
  };

  /**
   * 加载最近练习记录
   */
  const loadRecentGenerations = async () => {
    try {
      setIsLoading(true);
      const generations = await generationHistoryService.getRecentGenerations(MAX_RECENT_ITEMS);
      if (isMountedRef.current) {
        setRecentGenerations(generations);
      }

      // 检查里程碑（并行检查以提高性能）
      const allGenerations = await generationHistoryService.getAllGenerations();
      const totalCount = allGenerations.length;

      // 并行检查所有里程碑并显示庆祝
      const milestones = [
        {type: MilestoneType.FIRST_GENERATION, message: '🎉 第一次生成题目，太棒了！'},
        {type: MilestoneType.FIVE_GENERATIONS, message: '🌟 已生成5次题目，坚持得真好！'},
        {type: MilestoneType.TEN_GENERATIONS, message: '🏆 练习达人！已完成10次练习'},
      ];

      // 并行检查里程碑
      const results = await Promise.all(
        milestones.map(m => feedbackManager.checkMilestone(m.type, totalCount))
      );

      // 如果有里程碑达成，显示庆祝
      const achievedIndex = results.findIndex(r => r === true);
      if (achievedIndex !== -1 && isMountedRef.current) {
        setCelebrationMessage(milestones[achievedIndex].message);
        setShowCelebration(true);
      }
    } catch (error) {
      console.error('Failed to load recent generations:', error);
      feedbackManager.showFriendlyError(error, '加载练习记录', () => loadRecentGenerations());
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  /**
   * 刷新最近练习记录
   */
  const refreshRecentGenerations = async () => {
    await loadRecentGenerations();
  };

  /**
   * 从相册选择图片进行识别
   */
  const handleUploadImage = async () => {
    try {
      console.log('[HomeScreen] Upload image button pressed');
      setIsUploading(true);

      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        includeBase64: true,
        quality: 0.8,
        presentationStyle: 'pageSheet',
      });

      console.log('[HomeScreen] Image picker result:', result);

      if (result.didCancel) {
        console.log('[HomeScreen] User cancelled image picker');
        setIsUploading(false);
        return;
      }

      if (result.errorCode) {
        console.error('[HomeScreen] ImagePicker error:', result.errorMessage);
        Alert.alert('错误', result.errorMessage || '选择图片失败');
        setIsUploading(false);
        return;
      }

      if (result.assets && result.assets[0]) {
        const asset = result.assets[0];
        console.log('[HomeScreen] Image selected:', asset.uri);

        // 导航到相机界面，传递选中的图片URI
        navigation.navigate('Camera', {
          selectedImageUri: asset.uri,
          selectedImageBase64: asset.base64,
        });
      }
    } catch (error) {
      console.error('[HomeScreen] Error picking image:', error);
      Alert.alert('错误', '选择图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
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
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={styles.title}>一年级数学学习助手</Text>
            <Text style={styles.subtitle}>让家长轻松掌握辅导方法</Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowHelp(true)}
            style={styles.helpButton}
            accessibilityLabel="帮助">
            <Icon name="help-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 功能入口区域 - 两个并排卡片 */}
      <View style={styles.actionCardsContainer}>
        {/* 左侧：拍照上传 */}
        <TouchableOpacity
          style={styles.actionCardLeft}
          onPress={() => navigation?.navigate('Camera')}
          activeOpacity={0.9}>
          <View style={styles.actionCardContent}>
            <View style={styles.actionIconContainerLeft}>
              <Icon name="camera-alt" size={32} color="#2196F3" />
            </View>
            <Text style={styles.actionCardTitleLeft}>拍照上传</Text>
            <Text style={styles.actionCardTextLeft}>拍摄题目自动识别</Text>
          </View>
        </TouchableOpacity>

        {/* 右侧：上传图片 */}
        <TouchableOpacity
          style={[styles.actionCardRight, isUploading && styles.actionCardDisabled]}
          onPress={handleUploadImage}
          disabled={isUploading}
          activeOpacity={0.9}>
          <View style={styles.actionCardContent}>
            <View style={styles.actionIconContainerRight}>
              {isUploading ? (
                <ActivityIndicator size={28} color="#4CAF50" />
              ) : (
                <Icon name="photo-library" size={32} color="#4CAF50" />
              )}
            </View>
            <Text style={styles.actionCardTitleRight}>上传图片</Text>
            <Text style={styles.actionCardTextRight}>从相册选择识别</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* 最近练习部分 */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.sectionHeader}>
            <Title style={styles.cardTitle}>📚 最近练习</Title>
            {recentGenerations.length > 0 && (
              <TouchableOpacity
                onPress={() => navigation?.navigate('QuestionList')}
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

      {/* 帮助对话框 */}
      <HelpDialog
        visible={showHelp}
        screenId="HomeScreen"
        onClose={() => setShowHelp(false)}
      />

      {/* 入门导览 */}
      <OnboardingTour
        visible={showTour}
        screenId="HomeScreen"
        onComplete={() => setShowTour(false)}
        onSkip={() => setShowTour(false)}
      />

      {/* 成功庆祝 */}
      <CelebrationOverlay
        visible={showCelebration}
        message={celebrationMessage}
        duration={2000}
        onComplete={() => setShowCelebration(false)}
      />
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
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 5,
  },
  helpButton: {
    padding: 8,
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
  // 功能卡片容器
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    marginTop: 15,
    marginBottom: 10,
    gap: 10,
  },
  // 左侧拍照上传卡片
  actionCardLeft: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E3F2FD',
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  // 右侧上传图片卡片
  actionCardRight: {
    flex: 1,
    height: 140,
    borderRadius: 16,
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: 20,
    flex: 1,
    justifyContent: 'center',
  },
  // 左侧图标容器
  actionIconContainerLeft: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // 右侧图标容器
  actionIconContainerRight: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  // 左侧标题
  actionCardTitleLeft: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1565C0',
    marginTop: 12,
    textAlign: 'center',
  },
  // 右侧标题
  actionCardTitleRight: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 12,
    textAlign: 'center',
  },
  // 左侧说明文字
  actionCardTextLeft: {
    fontSize: 13,
    color: '#546E7A',
    textAlign: 'center',
    marginTop: 4,
  },
  // 右侧说明文字
  actionCardTextRight: {
    fontSize: 13,
    color: '#546E7A',
    textAlign: 'center',
    marginTop: 4,
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
