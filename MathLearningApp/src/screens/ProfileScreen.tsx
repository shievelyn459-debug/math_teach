/**
 * Story 1-4: 用户个人中心屏幕（更新版）
 * 显示完整的用户信息，支持编辑功能
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import {ProfileField, EditableProfileField} from '../components/ProfileField';
import {authService} from '../services/authService';
import {userApi} from '../services/api';
import {User} from '../types';

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
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <ScrollView style={styles.container}>
        <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.userName}>未登录</Text>
          <Text style={styles.userEmail}>请先登录</Text>
        </View>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>前往登录</Text>
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
        {user.avatar ? (
          <View style={styles.avatarContainer}>
            {/* TODO: 添加头像显示 */}
            <Text style={styles.avatarPlaceholder}>{user.name.charAt(0)}</Text>
          </View>
        ) : (
          <View style={[styles.avatarPlaceholder, {backgroundColor: '#fff'}]}>
            <Text style={[styles.avatarText, {color: theme.colors.primary}]}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <Text style={styles.userName}>{user.name}</Text>
        <Text style={styles.userEmail}>{user.email}</Text>
      </View>

      {/* 个人信息部分 (AC1: 显示姓名、邮箱、电话) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Icon name="person" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, {color: theme.colors.primary}]}>
            个人信息
          </Text>
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
          <Icon name="settings" size={20} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, {color: theme.colors.primary}]}>
            账户操作
          </Text>
        </View>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleEditProfile}
          testID="edit-profile-button">
          <View style={styles.menuItemLeft}>
            <Icon name="edit" size={24} color="#666" />
            <Text style={styles.menuItemText}>编辑资料</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="child-care" size={24} color="#666" />
            <Text style={styles.menuItemText}>孩子信息管理</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="history" size={24} color="#666" />
            <Text style={styles.menuItemText}>学习记录</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Icon name="settings-applications" size={24} color="#666" />
            <Text style={styles.menuItemText}>设置</Text>
          </View>
          <Icon name="chevron-right" size={24} color="#999" />
        </TouchableOpacity>
      </View>

      {/* 退出登录按钮 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>

      {/* 刷新指示器 */}
      {refreshing && (
        <View style={styles.refreshingIndicator}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={styles.refreshingText}>刷新中...</Text>
        </View>
      )}
    </ScrollView>
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
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  sectionContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  loginButton: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#007bff',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  logoutButton: {
    margin: 16,
    marginTop: 24,
    backgroundColor: '#ffebee',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#c62828',
  },
  refreshingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  refreshingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileScreen;
