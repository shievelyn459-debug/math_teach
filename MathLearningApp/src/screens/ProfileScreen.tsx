/**
 * Story 1-4: 用户个人中心屏幕（更新版）
 * 显示完整的用户信息，支持编辑功能
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import {useNavigation} from '@react-navigation/native';
import {ProfileField, EditableProfileField} from '../components/ProfileField';
import {authService} from '../services/authService';
import {userApi} from '../services/api';
import {User} from '../types';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

/**
 * 用户个人中心屏幕
 * Story 1-4: 显示完整用户信息（姓名、邮箱、电话、头像）
 */
const ProfileScreen = ({navigation}: any) => {
  const theme = useTheme();
  const navigator = useNavigation();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * 加载用户资料 (AC1: 用户可以查看当前资料信息)
   */
  const loadUserProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('[ProfileScreen] Failed to load profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // 初始化时获取当前用户
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
      setLoading(false);
    }

    // 从服务器获取最新资料
    loadUserProfile();

    // 监听认证状态变化
    const unsubscribe = authService.onAuthStateChanged((authUser) => {
      setUser(authUser);
    });

    return unsubscribe;
  }, []);

  /**
   * 下拉刷新
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadUserProfile();
  };

  /**
   * 导航到编辑资料页面 (AC8: 用户可以取消编辑)
   */
  const handleEditProfile = () => {
    if (!user) return;

    (navigator as any).navigate('EditProfile', {
      user: user,
      onRefresh: handleRefresh,
    });
  };

  /**
   * 退出登录
   */
  const handleLogout = async () => {
    Alert.alert('退出登录', '确定要退出登录吗？', [
      {text: '取消', style: 'cancel'},
      {
        text: '确定',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          navigation.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
        },
      },
    ]);
  };

  // 加载状态
  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Spacer size="md" />
        <Typography variant="body" color={designSystem.colors.text.secondary}>
          加载中...
        </Typography>
      </View>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
          <Typography variant="headlineMedium" style={styles.userName}>
            未登录
          </Typography>
          <Typography variant="body" style={styles.userEmail}>
            请先登录
          </Typography>
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}>
          <Typography variant="bodyLarge" color={designSystem.colors.text.inverse}>
            前往登录
          </Typography>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[theme.colors.primary]}
          tintColor={theme.colors.primary}
        />
      }>
      {/* 头部用户信息卡片 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <View style={[styles.avatarPlaceholder, {backgroundColor: designSystem.colors.surface.primary}]}>
          <Typography variant="displaySmall" color={theme.colors.primary}>
            {user.name.charAt(0).toUpperCase()}
          </Typography>
        </View>
        <Typography variant="headlineMedium" color={designSystem.colors.text.inverse} style={styles.userName}>
          {user.name}
        </Typography>
        <Typography variant="body" color={designSystem.colors.text.inverse} style={styles.userEmail}>
          {user.email}
        </Typography>
      </View>

      {/* 个人信息部分 (AC1: 显示姓名、邮箱、电话) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="person" size="sm" color={theme.colors.primary} />
          <Spacer size="sm" horizontal />
          <Typography variant="bodyLarge" color={theme.colors.primary}>
            个人信息
          </Typography>
        </View>

        <EditableProfileField
          label="姓名"
          value={user.name}
          onPress={handleEditProfile}
          testID="profile-name"
        />

        <EditableProfileField
          label="邮箱地址"
          value={user.email}
          onPress={handleEditProfile}
          testID="profile-email"
        />

        <EditableProfileField
          label="电话号码"
          value={user.phone}
          onPress={handleEditProfile}
          testID="profile-phone"
        />
      </View>

      {/* 账户操作部分 */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="settings" size="sm" color={theme.colors.primary} />
          <Spacer size="sm" horizontal />
          <Typography variant="bodyLarge" color={theme.colors.primary}>
            账户操作
          </Typography>
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleEditProfile}
          testID="edit-profile-button">
          <View style={styles.menuItemLeft}>
            <Icon name="edit" size="md" color={designSystem.colors.text.secondary} />
            <Spacer size="md" horizontal />
            <Typography variant="body">编辑资料</Typography>
          </View>
          <Icon name="chevron-right" size="md" color={designSystem.colors.text.hint} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => (navigation as any).navigate('ChildList')}
          testID="child-management-button">
          <View style={styles.menuItemLeft}>
            <Icon name="child-care" size="md" color={designSystem.colors.text.secondary} />
            <Spacer size="md" horizontal />
            <Typography variant="body">孩子信息管理</Typography>
          </View>
          <Icon name="chevron-right" size="md" color={designSystem.colors.text.hint} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="history" size="md" color={designSystem.colors.text.secondary} />
            <Spacer size="md" horizontal />
            <Typography variant="body">学习记录</Typography>
          </View>
          <Icon name="chevron-right" size="md" color={designSystem.colors.text.hint} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="settings-applications" size="md" color={designSystem.colors.text.secondary} />
            <Spacer size="md" horizontal />
            <Typography variant="body">设置</Typography>
          </View>
          <Icon name="chevron-right" size="md" color={designSystem.colors.text.hint} />
        </TouchableOpacity>
      </View>

      {/* 退出登录按钮 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Typography variant="bodyLarge" color={designSystem.colors.error.main}>
          退出登录
        </Typography>
      </TouchableOpacity>

      {/* 刷新指示器 */}
      {refreshing && (
        <View style={styles.refreshingIndicator}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Spacer size="sm" horizontal />
          <Typography variant="caption" color={designSystem.colors.text.secondary}>
            刷新中...
          </Typography>
        </View>
      )}
    </ScrollView>
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
    padding: designSystem.spacing.xl,
    paddingTop: 60, // Safe area padding
    borderBottomLeftRadius: designSystem.borderRadius.xl,
    borderBottomRightRadius: designSystem.borderRadius.xl,
    alignItems: 'center',
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: designSystem.borderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
  },
  userName: {
    marginBottom: designSystem.spacing.xs,
  },
  userEmail: {
    opacity: 0.9,
  },
  sectionContainer: {
    marginTop: designSystem.spacing.xl,
    paddingHorizontal: designSystem.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designSystem.spacing.md,
    marginLeft: designSystem.spacing.xs,
  },
  menuItem: {
    backgroundColor: designSystem.colors.surface.primary,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...designSystem.shadows.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginButton: {
    margin: designSystem.spacing.lg,
    marginTop: designSystem.spacing.xl,
    backgroundColor: designSystem.colors.primary,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    alignItems: 'center',
  },
  logoutButton: {
    margin: designSystem.spacing.lg,
    marginTop: designSystem.spacing.xl,
    backgroundColor: designSystem.colors.error.light,
    padding: designSystem.spacing.lg,
    borderRadius: designSystem.borderRadius.lg,
    alignItems: 'center',
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: designSystem.spacing.sm,
  },
});

export default ProfileScreen;
