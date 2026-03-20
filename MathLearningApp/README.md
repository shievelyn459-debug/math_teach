# 一年级数学学习平板app

## 项目简介

这是一个专门为一年级学生家长设计的数学学习辅助应用。通过智能题目识别、同类型题目生成和知识点讲解，帮助家长轻松掌握辅导方法。

## 主要功能

### 🎯 核心功能
1. **题目拍照上传** - 家长可以拍照上传孩子的数学题目
2. **智能题目识别** - 自动识别题目类型、难度和知识点
3. **同类型题目生成** - 根据原题自动生成类似题目供练习
4. **知识点讲解** - 提供详细的解题思路和知识点说明
5. **PDF导出** - 可将生成的题目导出为PDF格式

### 📱 用户界面
- 简洁直观的平板优化界面
- 大字体、易操作的设计
- 底部导航栏方便功能切换

## 技术栈

- **框架**: React Native 0.74.3
- **语言**: TypeScript
- **导航**: React Navigation
- **UI组件**: React Native Paper, React Native Elements
- **相机**: React Native Camera
- **文件操作**: React Native FS
- **图标**: React Native Vector Icons

## 项目结构

```
MathLearningApp/
├── App.tsx                 # 应用入口
├── package.json           # 依赖配置
├── README.md             # 项目说明
└── src/
    ├── screens/          # 页面组件
    │   ├── HomeScreen.tsx
    │   ├── CameraScreen.tsx
    │   ├── QuestionListScreen.tsx
    │   ├── ProfileScreen.tsx
    │   ├── QuestionDetailScreen.tsx
    │   └── ExplainScreen.tsx
    ├── components/       # 可复用组件
    ├── types/           # TypeScript类型定义
    │   └── index.ts
    ├── utils/           # 工具函数
    ├── services/        # API服务
    │   └── api.ts
    └── assets/          # 静态资源
```

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. iOS运行
```bash
npm run ios
```

### 3. Android运行
```bash
npm run android
```

## 开发指南

### 添加新页面
1. 在 `src/screens/` 目录创建新页面组件
2. 在 `App.tsx` 中添加到导航配置
3. 如果需要，添加相应的类型定义

### API集成
所有API调用都在 `src/services/api.ts` 中管理，新增API接口时请遵循现有规范。

### 组件开发
- 使用TypeScript编写类型安全的组件
- 遵循React Native最佳实践
- 使用React Native Paper进行样式设计

## 环境要求

- Node.js >= 16
- React Native CLI
- iOS开发环境（Xcode）
- Android开发环境（Android Studio）

## 注意事项

1. 本应用需要相机权限，请确保在设备上正确配置
2. PDF导出功能需要文件系统权限
3. 网络请求配置了30秒超时，确保网络环境稳定

## 下一步计划

1. [ ] 完善题目识别功能
2. [ ] 实现同类型题目生成算法
3. [ ] 添加知识点讲解模块
4. [ ] 实现PDF导出功能
5. [ ] 添加用户注册登录系统
6. [ ] 实现学习进度追踪