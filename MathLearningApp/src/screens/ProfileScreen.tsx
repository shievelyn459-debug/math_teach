import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {useTheme} from 'react-native-paper';
import {authService} from '../services/authService';

/**
 * 用户个人中心屏幕
 * 占位实现，后续将在Story 1-4, 1-5中完善
 */
const ProfileScreen = ({navigation}: any) => {
  const theme = useTheme();
  const user = authService.getCurrentUser();

  const handleLogout = async () => {
    await authService.logout();
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'}],
    });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 头部用户信息卡片 */}
      <View style={[styles.header, {backgroundColor: theme.colors.primary}]}>
        <Text style={styles.userName}>{user?.name || '未登录'}</Text>
        <Text style={styles.userEmail}>{user?.email || ''}</Text>
      </View>

      {/* 菜单选项 */}
      <View style={styles.menuContainer}>
        <Text style={styles.menuTitle}>个人设置</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>编辑资料</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>孩子信息管理</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>学习记录</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuItemText}>设置</Text>
        </TouchableOpacity>
      </View>

      {/* 退出登录按钮 */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
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
  menuContainer: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  menuTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
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
});

export default ProfileScreen;
