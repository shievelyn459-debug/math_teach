/**
 * Story 1-5: Child List Screen
 * Display all children with swipe-to-edit and swipe-to-delete actions
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Child, Grade} from '../types';
import {childApi} from '../services/api';
import {activeChildService} from '../services/activeChildService';
import {useActiveChild} from '../contexts/ActiveChildContext';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

/**
 * 孩子列表项组件
 */
interface ChildListItemProps {
  child: Child;
  isActive: boolean;
  onPress: (child: Child) => void;
  onEdit: (child: Child) => void;
  onDelete: (child: Child) => void;
}

const ChildListItem: React.FC<ChildListItemProps> = ({
  child,
  isActive,
  onPress,
  onEdit,
  onDelete,
}) => {
  const theme = useTheme();

  const getGradeDisplayName = (grade: Grade): string => {
    return activeChildService.getGradeDisplayName(grade);
  };

  const formatBirthday = (birthday?: Date): string => {
    if (!birthday) return '生日未设置';
    const date = new Date(birthday);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  };

  return (
    <View style={[styles.childItem, {borderColor: isActive ? theme.colors.primary : designSystem.colors.border}]}>
      <TouchableOpacity
        style={styles.childItemContent}
        onPress={() => onPress(child)}
        testID={`child-item-${child.id}`}>
        {/* 头像/图标 */}
        <View style={[styles.avatarContainer, {backgroundColor: theme.colors.primary}]}>
          {child.avatar ? (
            <Typography variant="headlineSmall" color={designSystem.colors.text.inverse}>
              {child.name.charAt(0)}
            </Typography>
          ) : (
            <Icon name="child-care" size="xl" color={designSystem.colors.text.inverse} />
          )}
        </View>

        {/* 孩子信息 */}
        <View style={styles.childInfo}>
          <View style={styles.nameRow}>
            <Typography variant="headlineSmall" style={styles.childName}>
              {child.name}
            </Typography>
            {isActive && (
              <View style={[styles.activeBadge, {backgroundColor: theme.colors.primary}]}>
                <Icon name="check-circle" size="sm" color={designSystem.colors.text.inverse} />
                <Typography variant="caption" color={designSystem.colors.text.inverse} style={styles.activeText}>
                  当前
                </Typography>
              </View>
            )}
          </View>
          <Typography variant="caption" color={designSystem.colors.text.secondary}>
            {getGradeDisplayName(child.grade)}
          </Typography>
          <Typography variant="overline" color={designSystem.colors.text.hint}>
            {formatBirthday(child.birthday)}
          </Typography>
        </View>

        {/* 编辑按钮 */}
        <TouchableOpacity
          onPress={() => onEdit(child)}
          style={styles.editButton}
          testID={`edit-child-${child.id}`}>
          <Icon name="edit" size="lg" color={theme.colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 删除按钮（滑动显示） */}
      <TouchableOpacity
        style={[styles.deleteButton, {backgroundColor: theme.colors.error}]}
        onPress={() => onDelete(child)}
        testID={`delete-child-${child.id}`}>
        <Icon name="delete" size="lg" color={designSystem.colors.text.inverse} />
        <Typography variant="body" color={designSystem.colors.text.inverse} style={styles.deleteButtonText}>
          删除
        </Typography>
      </TouchableOpacity>
    </View>
  );
};

/**
 * 孩子列表屏幕
 */
const ChildListScreen = ({route}: any) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const {activeChild, setActiveChild} = useActiveChild();

  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 加载孩子列表
   */
  const loadChildren = async () => {
    try {
      const response = await childApi.getChildren();
      if (response.success && response.data) {
        setChildren(response.data);
      }
    } catch (error) {
      console.error('[ChildListScreen] Failed to load children:', error);
      Alert.alert('错误', '加载孩子列表失败');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 使用useFocusEffect在屏幕聚焦时刷新
  useFocusEffect(
    React.useCallback(() => {
      loadChildren();
    }, [])
  );

  /**
   * 下拉刷新
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChildren();
  };

  /**
   * 选择活跃孩子
   */
  const handleSelectChild = async (child: Child) => {
    const result = await setActiveChild(child);
    if (result.success) {
      Alert.alert('成功', `已选择${child.name}为当前学习孩子`);
    } else {
      Alert.alert('错误', result.error || '设置失败');
    }
  };

  /**
   * 导航到添加孩子屏幕
   */
  const handleAddChild = () => {
    (navigation as any).navigate('ChildForm', {
      mode: 'add',
      onRefresh: loadChildren,
    });
  };

  /**
   * 导航到编辑孩子屏幕
   */
  const handleEditChild = (child: Child) => {
    (navigation as any).navigate('ChildForm', {
      mode: 'edit',
      child: child,
      onRefresh: loadChildren,
    });
  };

  /**
   * 删除孩子
   */
  const handleDeleteChild = (child: Child) => {
    const isActiveChild = activeChild?.id === child.id;

    Alert.alert(
      '确认删除',
      `确定要删除${child.name}吗？${isActiveChild ? '\n\n这是当前选中的孩子，删除后需要选择其他孩子。' : ''}`,
      [
        {text: '取消', style: 'cancel'},
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await childApi.deleteChild(child.id);
              if (response.success) {
                // 从列表中移除
                const remainingChildren = children.filter(c => c.id !== child.id);

                // 如果删除的是活跃孩子，处理活跃孩子变更
                if (isActiveChild) {
                  const newActiveChild = await activeChildService.handleDeletedChild(
                    child.id,
                    remainingChildren
                  );

                  if (newActiveChild) {
                    Alert.alert(
                      '已删除',
                      `${child.name}已删除\n当前学习孩子已切换为${newActiveChild.name}`
                    );
                  } else {
                    Alert.alert('已删除', `${child.name}已删除\n您还没有添加其他孩子`);
                  }
                } else {
                  Alert.alert('已删除', `${child.name}已删除`);
                }

                await loadChildren();
              } else {
                Alert.alert('删除失败', response.error?.message || '请稍后重试');
              }
            } catch (error) {
              console.error('[ChildListScreen] Failed to delete child:', error);
              Alert.alert('删除失败', '请稍后重试');
            }
          },
        },
      ]
    );
  };

  /**
   * 渲染孩子列表项
   */
  const renderChildItem = ({item}: {item: Child}) => {
    const isActive = activeChild?.id === item.id;
    return (
      <ChildListItem
        child={item}
        isActive={isActive}
        onPress={handleSelectChild}
        onEdit={handleEditChild}
        onDelete={handleDeleteChild}
      />
    );
  };

  /**
   * 渲染空状态
   */
  const renderEmptyState = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyState}>
        <Icon name="child-care" size="xl" color={designSystem.colors.text.disabled} />
        <Spacer size="lg" />
        <Typography variant="headlineMedium" align="center">
          还没有添加孩子
        </Typography>
        <Spacer size="sm" />
        <Typography variant="caption" color={designSystem.colors.text.secondary} align="center">
          添加孩子的信息，让我们为他们提供个性化的学习体验
        </Typography>
        <Spacer size="xxl" />
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
          onPress={handleAddChild}
          testID="add-first-child-button">
          <Icon name="add" size="lg" color={designSystem.colors.text.inverse} />
          <Typography variant="body" color={designSystem.colors.text.inverse} style={styles.addButtonText}>
            添加第一个孩子
          </Typography>
        </TouchableOpacity>
      </View>
    );
  };

  // 加载状态
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Spacer size="lg" />
          <Typography variant="body" color={designSystem.colors.text.secondary}>
            加载中...
          </Typography>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <Typography variant="displaySmall" color={designSystem.colors.text.inverse}>
          我的孩子
        </Typography>
        <Typography variant="caption" color={designSystem.colors.text.inverse}>
          管理孩子的信息
        </Typography>
      </View>

      {/* 孩子列表 */}
      {children.length > 0 ? (
        <FlatList
          data={children}
          keyExtractor={(item) => item.id}
          renderItem={renderChildItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[theme.colors.primary]}
              tintColor={theme.colors.primary}
            />
          }
        />
      ) : (
        renderEmptyState()
      )}

      {/* 添加按钮 */}
      {children.length > 0 && (
        <TouchableOpacity
          style={[styles.floatingActionButton, {backgroundColor: theme.colors.primary}]}
          onPress={handleAddChild}
          testID="add-child-button">
          <Icon name="add" size="lg" color={designSystem.colors.text.inverse} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: designSystem.spacing.xxl,
    paddingTop: designSystem.spacing.xxxl + designSystem.spacing.xxl,
    borderBottomLeftRadius: designSystem.borderRadius.xl,
    borderBottomRightRadius: designSystem.borderRadius.xl,
  },
  listContent: {
    padding: designSystem.spacing.lg,
  },
  childItem: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.md,
    borderWidth: 2,
    overflow: 'hidden',
    ...designSystem.shadows.sm,
  },
  childItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.lg,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: designSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designSystem.spacing.md,
  },
  childInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.xs,
  },
  childName: {
    marginRight: designSystem.spacing.sm,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs / 2,
    borderRadius: designSystem.borderRadius.lg,
  },
  activeText: {
    marginLeft: designSystem.spacing.xs,
  },
  childGrade: {
    marginBottom: designSystem.spacing.xs / 2,
  },
  editButton: {
    padding: designSystem.spacing.sm,
    marginLeft: designSystem.spacing.sm,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.lg,
    height: 92,
  },
  deleteButtonText: {
    marginLeft: designSystem.spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxxl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designSystem.spacing.xxl,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.full,
  },
  addButtonText: {
    marginLeft: designSystem.spacing.sm,
  },
  floatingActionButton: {
    position: 'absolute',
    right: designSystem.spacing.xxl,
    bottom: designSystem.spacing.xxl,
    width: 56,
    height: 56,
    borderRadius: designSystem.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...designSystem.shadows.md,
  },
});

export default ChildListScreen;
