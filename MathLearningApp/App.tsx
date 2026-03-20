import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';

// 导入页面组件
import HomeScreen from './src/screens/HomeScreen';
import CameraScreen from './src/screens/CameraScreen';
import QuestionListScreen from './src/screens/QuestionListScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import QuestionDetailScreen from './src/screens/QuestionDetailScreen';
import ExplainScreen from './src/screens/ExplainScreen';

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

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{headerShown: false}}>
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}