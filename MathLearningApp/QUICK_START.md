# 快速启动指南

## 配置完成！✅

你的API密钥已配置：
- ✅ 百度OCR
- ✅ DeepSeek
- ✅ iOS配置
- ✅ Android配置

---

## 启动应用

### 方法1: iOS模拟器（推荐）

```bash
cd /Users/evelynshi/math_teach/MathLearningApp

# 1. 安装iOS依赖（首次运行需要）
cd ios && pod install && cd ..

# 2. 启动Metro（在新终端）
npm start

# 3. 运行iOS（在另一个新终端）
npm run ios
```

### 方法2: Android模拟器

```bash
cd /Users/evelynshi/math_teach/MathLearningApp

# 1. 启动Metro（在新终端）
npm start

# 2. 运行Android（在另一个新终端）
npm run android
```

---

## 测试AI功能

### 测试1: OCR识别
1. 打开应用后登录/注册
2. 点击底部"拍照上传"
3. 拍摄一道数学题
4. ✅ 应该看到识别结果

### 测试2: 题目生成
1. 识别题目后选择难度
2. 点击"生成练习题"
3. ✅ 应该看到生成的题目列表

### 测试3: 查看讲解
1. 点击任何题目
2. 点击"知识点讲解"
3. ✅ 应该看到讲解内容

---

## 故障排除

### 问题: Metro启动失败
```bash
# 清理缓存
npm start -- --reset-cache
```

### 问题: iOS编译失败
```bash
cd ios
pod install
cd ..
npm run ios
```

### 问题: Android编译失败
```bash
cd android
./gradlew clean
cd ..
npm run android
```

### 问题: OCR识别失败
- 确保网络连接正常
- 查看Metro终端日志
- 会自动降级到基础识别

### 问题: 题目生成失败
- 会自动降级到本地题库
- 查看DeepSeek API配额

---

## 查看日志

在Metro终端可以看到详细日志：
- `[BaiduOcrService]` - OCR识别日志
- `[DeepSeekService]` - 题目生成日志
- `[AIService]` - AI服务协调日志
- 成本估算（每次API调用）

---

## 下一步

1. ✅ 注册/登录账号
2. ✅ 添加孩子信息
3. ✅ 拍照识别题目
4. ✅ 生成练习题
5. ✅ 查看知识点讲解

祝使用愉快！🎉
