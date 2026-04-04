# AI服务配置指南

## 快速开始

### 1. 填入API密钥

编辑项目根目录的 `.env` 文件：

```bash
# 百度OCR
BAIDU_OCR_API_KEY=你的API_Key
BAIDU_OCR_SECRET_KEY=你的Secret_Key

# DeepSeek
DEEPSEEK_API_KEY=sk-你的API密钥
```

### 2. 运行应用

```bash
# 安装依赖（如果还没安装）
npm install --legacy-peer-deps

# 启动Metro
npm start

# 新终端窗口运行应用
npm run ios   # iOS模拟器
npm run android   # Android模拟器
```

### 3. 验证配置

在应用中测试以下功能：

#### 测试OCR识别
1. 进入"拍照上传"页面
2. 拍摄一道数学题
3. 查看识别结果

#### 测试题目生成
1. 识别题目后选择难度
2. 点击"生成练习题"
3. 查看生成的题目

---

## 故障排除

### 问题：OCR识别失败
**症状**：拍照后提示"识别失败"

**解决方案**：
1. 检查 `.env` 文件中的百度OCR密钥是否正确
2. 确保网络连接正常
3. 查看控制台是否有错误信息

### 问题：题目生成失败
**症状**：生成题目时提示失败

**解决方案**：
1. 检查DeepSeek API密钥是否正确
2. 如果DeepSeek不可用，会自动降级到本地生成
3. 检查网络连接

### 问题：iOS编译失败
**症状**：iOS编译时找不到`react-native-config`

**解决方案**：
```bash
cd ios
pod install
cd ..
npm run ios
```

---

## API密钥位置

### 百度OCR
- 登录：https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
- 创建应用后查看：API Key 和 Secret Key

### DeepSeek
- 登录：https://platform.deepseek.com/
- 获取API Key：https://platform.deepseek.com/api_keys

---

## 开发提示

### 调试AI服务

在代码中添加调试日志：

```typescript
import {aiService} from './services/ai';

// 查看服务可用性
const status = aiService.checkAvailability();
console.log('OCR服务:', status.ocr);
console.log('生成服务:', status.generation);

// 查看使用统计
const stats = aiService.getUsageStats();
console.log('DeepSeek使用:', stats.deepseek);
```

### 本地降级测试

要测试本地降级功能，可以在 `.env` 中设置：

```bash
# 禁用AI生成，只用本地题库
ENABLE_AI_GENERATION=false
```

---

## 成本监控

### 百度OCR成本
- 免费额度：500次/天
- 超出后：¥0.002/次

### DeepSeek成本
- 查看使用统计：`aiService.getUsageStats()`
- 每天约100次生成 ≈ ¥0.3

---

生成日期: 2026-03-24
