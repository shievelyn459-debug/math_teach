/**
 * Story 1-5: Child List Screen
 * Display all children with swipe-to-edit and swipe-to-delete actions
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {Child, Grade} from '../types';
import {childApi} from '../services/api';
import {activeChildService} from '../services/activeChildService';
import {useActiveChild} from '../contexts/ActiveChildContext';

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
    <View style={[styles.childItem, {borderColor: isActive ? theme.colors.primary : '#e0e0e0'}]}>
      <TouchableOpacity
        style={styles.childItemContent}
        onPress={() => onPress(child)}
        testID={`child-item-${child.id}`}>
        {/* 头像/图标 */}
        <View style={[styles.avatarContainer, {backgroundColor: theme.colors.primary}]}>
          {child.avatar ? (
            <Text style={styles.avatarText}>{child.name.charAt(0)}</Text>
          ) : (
            <Icon name="child-care" size={32} color="#fff" />
          )}
        </View>

        {/* 孩子信息 */}
        <View style={styles.childInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.childName}>{child.name}</Text>
            {isActive && (
              <View style={[styles.activeBadge, {backgroundColor: theme.colors.primary}]}>
                <Icon name="check-circle" size={16} color="#fff" />
                <Text style={styles.activeText}>当前</Text>
              </View>
            )}
          </View>
          <Text style={styles.childGrade}>{getGradeDisplayName(child.grade)}</Text>
          <Text style={styles.childBirthday}>{formatBirthday(child.birthday)}</Text>
        </View>

        {/* 编辑按钮 */}
        <TouchableOpacity
          onPress={() => onEdit(child)}
          style={styles.editButton}
          testID={`edit-child-${child.id}`}>
          <Icon name="edit" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </TouchableOpacity>

      {/* 删除按钮（滑动显示） */}
      <TouchableOpacity
        style={[styles.deleteButton, {backgroundColor: theme.colors.error}]}
        onPress={() => onDelete(child)}
        testID={`delete-child-${child.id}`}>
        <Icon name="delete" size={24} color="#fff" />
        <Text style={styles.deleteButtonText}>删除</Text>
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
        <Icon name="child-care" size={80} color="#ccc" />
        <Text style={styles.emptyStateTitle}>还没有添加孩子</Text>
        <Text style={styles.emptyStateDescription}>
          添加孩子的信息，让我们为他们提供个性化的学习体验
        </Text>
        <TouchableOpacity
          style={[styles.addButton, {backgroundColor: theme.colors.primary}]}
          onPress={handleAddChild}
          testID="add-first-child-button">
          <Icon name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>添加第一个孩子</Text>
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
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <Text style={styles.headerTitle}>我的孩子</Text>
        <Text style={styles.headerSubtitle}>管理孩子的信息</Text>
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
          <Icon name="add" size={28} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  listContent: {
    padding: 16,
  },
  childItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  childItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  childInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  childName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  activeText: {
    fontSize: 12,
    color: '#fff',
    marginLeft: 4,
  },
  childGrade: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  childBirthday: {
    fontSize: 12,
    color: '#999',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    height: 92,
  },
  deleteButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  floatingActionButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default ChildListScreen;
