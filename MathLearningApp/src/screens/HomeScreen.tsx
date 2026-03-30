import React, {useState, useEffect, useRef} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert} from 'react-native';
import {Card as PaperCard, Title, Paragraph} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {generationHistoryService} from '../services/generationHistoryService';
import {feedbackManager, MilestoneType} from '../services/feedbackManager';
import {GenerationRecord} from '../types';
import RecentPracticeCard from '../components/RecentPracticeCard';
import HelpDialog from '../components/HelpDialog';
import OnboardingTour from '../components/OnboardingTour';
import CelebrationOverlay from '../components/CelebrationOverlay';
import {checkTourCompleted} from '../components/OnboardingTour';
import {launchImageLibrary} from 'react-native-image-picker';

// 导入设计系统和 UI 组件
import {designSystem} from '../styles/designSystem';
import {Card, Button, Icon, Typography, Spacer} from '../components/ui';

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RECENT_ITEMS = 5;

// ============================================================================
// COMPONENT
// ============================================================================

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

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Typography variant="headlineMedium" color={designSystem.colors.text.inverse}>
              一年级数学学习助手
            </Typography>
            <Spacer size="xs" />
            <Typography variant="body" color={designSystem.colors.text.inverse}>
              让家长轻松掌握辅导方法
            </Typography>
          </View>
          <TouchableOpacity
            onPress={() => setShowHelp(true)}
            style={styles.helpButton}
            accessibilityLabel="帮助">
            <Icon name="help-outline" size="lg" color={designSystem.colors.text.inverse} />
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
              <Icon name="camera-alt" size="lg" color={designSystem.colors.info.default} />
            </View>
            <Typography variant="headlineSmall" color={designSystem.colors.info.dark}>
              拍照上传
            </Typography>
            <Spacer size="xs" />
            <Typography variant="caption" color={designSystem.colors.text.tertiary}>
              拍摄题目自动识别
            </Typography>
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
                <ActivityIndicator size={28} color={designSystem.colors.success.default} />
              ) : (
                <Icon name="photo-library" size="lg" color={designSystem.colors.success.default} />
              )}
            </View>
            <Typography variant="headlineSmall" color={designSystem.colors.success.dark}>
              上传图片
            </Typography>
            <Spacer size="xs" />
            <Typography variant="caption" color={designSystem.colors.text.tertiary}>
              从相册选择识别
            </Typography>
          </View>
        </TouchableOpacity>
      </View>

      {/* 最近练习部分 */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Icon name="menu-book" size="md" color={designSystem.colors.primary} />
            <Spacer size="sm" direction="horizontal" />
            <Typography variant="headlineSmall" color={designSystem.colors.text.primary}>
              最近练习
            </Typography>
          </View>
          {recentGenerations.length > 0 && (
            <TouchableOpacity
              onPress={() => navigation?.navigate('QuestionList')}
              style={styles.viewAllButton}>
              <Typography variant="body" color={designSystem.colors.primary}>
                查看全部
              </Typography>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={designSystem.colors.primary} />
          </View>
        ) : recentGenerations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="edit-note" size="xl" color={designSystem.colors.text.disabled} />
            <Spacer size="md" />
            <Typography variant="headlineSmall" color={designSystem.colors.text.primary}>
              还没有练习记录
            </Typography>
            <Spacer size="sm" />
            <Typography variant="body" color={designSystem.colors.text.secondary} align="center">
              点击上方"拍照上传题目"开始第一次练习吧！
            </Typography>
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
      </Card>

      <Card variant="outlined" padding="lg" style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Icon name="bar-chart" size="md" color={designSystem.colors.primary} />
          <Spacer size="sm" direction="horizontal" />
          <Typography variant="headlineSmall" color={designSystem.colors.text.primary}>
            学习进度
          </Typography>
        </View>
        <Spacer size="sm" />
        <Typography variant="body" color={designSystem.colors.text.secondary} align="center">
          暂无学习数据
        </Typography>
      </Card>

      <Card variant="outlined" padding="lg" style={styles.card}>
        <View style={styles.sectionTitleRow}>
          <Icon name="lightbulb" size="md" color={designSystem.colors.primary} />
          <Spacer size="sm" direction="horizontal" />
          <Typography variant="headlineSmall" color={designSystem.colors.text.primary}>
            辅导小贴士
          </Typography>
        </View>
        <Spacer size="sm" />
        <Typography variant="body" color={designSystem.colors.text.primary}>
          • 一年级学生适合使用实物辅助理解{'\n'}• 多使用生活化的例子解释数学概念{'\n'}• 鼓励孩子自己动手操作
        </Typography>
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

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  header: {
    backgroundColor: designSystem.colors.primary,
    padding: designSystem.spacing.xl,
    paddingTop: designSystem.spacing.xxxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
  },
  helpButton: {
    padding: designSystem.spacing.xs,
  },
  card: {
    margin: designSystem.spacing.lg,
  },
  // 功能卡片容器
  actionCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: designSystem.spacing.lg,
    marginTop: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.md,
    gap: designSystem.spacing.md,
  },
  // 左侧拍照上传卡片
  actionCardLeft: {
    flex: 1,
    height: 140,
    borderRadius: designSystem.borderRadius.xl,
    backgroundColor: designSystem.colors.info.light,
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.info.default,
    ...designSystem.shadows.md,
  },
  // 右侧上传图片卡片
  actionCardRight: {
    flex: 1,
    height: 140,
    borderRadius: designSystem.borderRadius.xl,
    backgroundColor: designSystem.colors.success.light,
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.success.default,
    ...designSystem.shadows.md,
  },
  actionCardDisabled: {
    opacity: 0.5,
  },
  actionCardContent: {
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xl,
    flex: 1,
    justifyContent: 'center',
  },
  // 图标容器
  actionIconContainerLeft: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: designSystem.colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.sm,
  },
  actionIconContainerRight: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: designSystem.colors.surface.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.sm,
  },
  // Section 样式
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllButton: {
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.xs,
  },
  loadingContainer: {
    paddingVertical: designSystem.spacing.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: designSystem.spacing.xxl,
    alignItems: 'center',
  },
  recentList: {
    // 留空，卡片自带间距
  },
});

export default HomeScreen;
