import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {ActivityIndicator, View, StyleSheet} from 'react-native';

// 导入页面组件
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import QuestionListScreen from './src/screens/QuestionListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuestionDetailScreen from './src/screens/QuestionDetailScreen';
import ExplainScreen from './src/screens/ExplainScreen';
import {ExplanationScreen} from './src/screens/ExplanationScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import SetNewPasswordScreen from './src/screens/SetNewPasswordScreen';
import EditProfileScreen from './src/screens/EditProfileScreen';
import PDFPreviewScreen from './src/screens/PDFPreviewScreen';
import PDFListScreen from './src/screens/PDFListScreen';
import GeneratedQuestionsList from './src/screens/GeneratedQuestionsList';
import ChildListScreen from './src/screens/ChildListScreen';
import ChildFormScreen from './src/screens/ChildFormScreen';

// 导入认证服务
import {authService} from './src/services/authService';
// 导入活跃孩子Context
import {ActiveChildProvider} from './src/contexts/ActiveChildContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        tabBarIcon: ({focused, color, size}) => {
          let iconName: string;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home';
          } else if (route.name === 'Camera') {
            iconName = focused ? 'camera' : 'camera';
          } else if (route.name === 'Questions') {
            iconName = focused ? 'list' : 'list';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person';
          } else {
            iconName = 'help';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007bff',
        tabBarInactiveTintColor: 'gray',
      })}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{title: '首页'}}
      />
      <Tab.Screen
        name="Camera"
        component={CameraScreen}
        options={{title: '拍照上传'}}
      />
      <Tab.Screen
        name="Questions"
        component={QuestionListScreen}
        options={{title: '题库'}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: '我的'}}
      />
    </Tab.Navigator>
  );
}

/**
 * 认证流程包装器
 * 根据用户认证状态显示不同的导航流程
 * 修复：等待认证服务初始化完成后再检查状态，避免竞态条件
 */
function AuthNavigator() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    // 检查初始认证状态（等待初始化完成）
    const checkAuthStatus = async () => {
      try {
        // 等待认证服务完全初始化
        await authService.waitForInitialization();

        if (!mounted) return;

        // 检查认证状态
        const authenticated = await authService.isAuthenticated();
        if (mounted) {
          setIsAuthenticated(authenticated);
          setIsInitialized(true);
        }
      } catch (error) {
        console.error('[AuthNavigator] Failed to check auth status:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsInitialized(true);
        }
      }
    };

    checkAuthStatus();

    // 监听认证状态变化
    const unsubscribe = authService.onAuthStateChanged((user) => {
      if (mounted) {
        setIsAuthenticated(user !== null);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // 显示加载指示器（等待初始化完成）
  if (!isInitialized || isAuthenticated === null) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{headerShown: false}}
      initialRouteName={isAuthenticated ? 'Main' : 'Login'}>
      {/* 认证流程 */}
      {!isAuthenticated && (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{gestureEnabled: false}}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{title: '注册'}}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{title: '忘记密码'}}
          />
          <Stack.Screen
            name="SetNewPassword"
            component={SetNewPasswordScreen}
            options={{title: '设置新密码'}}
          />
        </>
      )}

      {/* 主应用流程 */}
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen
        name="QuestionDetail"
        component={QuestionDetailScreen}
        options={{title: '题目详情'}}
      />
      <Stack.Screen
        name="Explain"
        component={ExplainScreen}
        options={{title: '知识点讲解'}}
      />
      <Stack.Screen
        name="ExplanationScreen"
        component={ExplanationScreen}
        options={{
          title: '知识点讲解',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="GeneratedQuestionsList"
        component={GeneratedQuestionsList}
        options={{
          title: '练习题',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: '编辑资料',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="PDFPreview"
        component={PDFPreviewScreen}
        options={{
          title: 'PDF 预览',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="PDFList"
        component={PDFListScreen}
        options={{
          title: '我的 PDF',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="ChildList"
        component={ChildListScreen}
        options={{
          title: '我的孩子',
          headerBackTitle: '返回',
        }}
      />
      <Stack.Screen
        name="ChildForm"
        component={ChildFormScreen}
        options={{
          title: '孩子信息',
          headerBackTitle: '返回',
        }}
      />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <ActiveChildProvider>
        <AuthNavigator />
      </ActiveChildProvider>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});