# 一年级数学学习平板app - 技术架构设计文档

## 📋 架构设计概述

本文档详细描述了一年级数学学习平板app的技术架构设计，基于PRD需求进行系统化的架构规划。

## 🏗️ 整体架构设计

### 架构模式
- **混合架构** - 前端应用 + 第三方AI服务 + 自建MySQL数据库
- 跨平台支持（iOS + Android平板）
- 无服务器架构（Serverless for AI）+ 关系型数据库

### 系统组件

#### 1. 前端应用层
- 移动应用界面（React Native）
- 用户界面组件
- 照片上传功能
- 结果展示界面
- PDF生成和预览

#### 2. AI服务集成层
- 百度OCR API集成服务
- DeepSeek Chat API集成服务
- API密钥管理和安全存储
- 降级方案处理（本地题库）

#### 3. 数据访问层
- MySQL数据访问服务（Prisma ORM）
- 用户数据CRUD操作
- 题目历史记录管理
- 生成记录存储和查询
- 本地缓存同步机制
- 事务管理和数据一致性保证

#### 4. 业务逻辑层
- 用户管理服务
- 题目处理协调服务
- 知识点讲解生成服务
- PDF生成服务

## 📊 技术栈选择

### 核心技术栈
- **前端**: React Native
- **AI服务**:
  - 百度OCR API（题目识别）
  - DeepSeek Chat API（题目生成和讲解）
  - 备选：OpenAI API（降级方案）
- **数据库**: MySQL 8.0+（自建关系型数据库）
- **ORM**: Prisma（类型安全的数据库访问）
- **数据库驱动**: mysql2（高性能MySQL驱动）
- **本地缓存**: AsyncStorage（离线支持）
- **降级方案**: 本地题库和模板

## 📋 数据库设计

### MongoDB文档结构

#### 用户集合 (users)
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  password: String,
  profile: {
    name: String,
    phone: String,
    children: [{
      name: String,
      grade: String,
      birthday: Date
    }]
  },
  preferences: {
    language: String,
    notification: Boolean,
    difficulty: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

#### 题目集合 (problems)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  imageId: String,
  originalImage: String,
  processedImage: String,
  problemType: String,
  difficulty: String,
  recognizedText: String,
  correctAnswer: String,
  knowledgePoints: [String],
  createdAt: Date,
  updatedAt: Date
}
```

#### 生成历史集合 (generations)
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  originalProblemId: ObjectId,
  generatedProblems: [{
    problem: String,
    answer: String,
    explanation: String,
    difficulty: String
  }],
  pdfGenerated: Boolean,
  pdfUrl: String,
  createdAt: Date
}
```

#### 知识点库集合 (knowledgePoints)
```javascript
{
  _id: ObjectId,
  name: String,
  category: String,
  description: String,
  examples: [String],
  relatedProblems: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

### 索引设计
- 用户ID + 创建时间（降序）
- 题目类型 + 难度级别 + 创建时间
- 用户ID + 原始题目ID + 创建时间
- 知识点名称 + 类别 + 更新时间

## 📊 性能优化策略

### 数据归档策略
- 时间-based归档（6个月阈值）
- 数据分层存储（活跃/归档/冷数据）
- 自动归档任务（每月运行）

## ☁️ 部署架构设计

### 混合部署架构
- **客户端**: React Native移动应用
- **AI服务**: 第三方API（百度、DeepSeek）
- **数据库服务器**: 自建MySQL服务器（云服务器/VPS）
  - 推荐配置: 2核CPU, 4GB内存, 20GB SSD
  - 操作系统: Ubuntu 22.04 LTS
  - 数据库: MySQL 8.0+
- **CDN**: CloudFront（静态资源加速）
- **监控**: 第三方API监控 + MySQL性能监控
- **备份**: 自动化备份策略（每日增量 + 每周全量）

## 🔒 安全架构设计

### DevSecOps流程
- 代码安全扫描（SAST/DAST）
- 容器安全实践
- 基础设施安全配置
- CI/CD集成安全测试

## 📊 监控和日志架构

### 业务指标监控
- 用户指标：活跃度、留存率、参与度
- 功能使用指标：上传次数、生成次数、成功率
- 性能指标：响应时间、错误率、正常运行时间

### 预测性告警系统
- 用户流失预测模型
- 性能趋势分析
- 容量规划预警
- 多渠道通知系统

## 📈 架构优势

1. **高性能**：30秒内完成题目处理
2. **高可用性**：99.9%正常运行时间
3. **可扩展性**：支持1000-10000用户
4. **安全性**：数据加密、儿童隐私保护
5. **灵活性**：适应不断变化的教育需求

## 📋 实施建议

1. **开发阶段**：采用敏捷开发方法
2. **测试策略**：全面的单元测试、集成测试、性能测试
3. **部署流程**：CI/CD自动化部署
4. **监控体系**：实时监控和预测性告警
5. **迭代计划**：从MVP开始，逐步扩展功能

---

**文档创建时间**: 2026-03-19
**架构设计版本**: 1.0
**设计者**: 技术架构师