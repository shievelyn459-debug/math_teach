#!/bin/bash

# Story 8.1: 批量测试修复脚本
# 使用方法: bash scripts/fix-tests-batch.sh

set -e

PROJECT_ROOT="/Users/evelynshi/math_teach/MathLearningApp"
cd "$PROJECT_ROOT"

echo "🚀 Story 8.1: 批量测试修复开始"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. 备份原始文件
echo -e "${YELLOW}📦 步骤 1: 备份原始测试文件...${NC}"
BACKUP_DIR="$PROJECT_ROOT/.test-backup-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r src/components/__tests__ "$BACKUP_DIR/components"
cp -r src/screens/__tests__ "$BACKUP_DIR/screens"
cp -r src/services/__tests__ "$BACKUP_DIR/services"
cp jest.setup.js "$BACKUP_DIR/jest.setup.js.backup"
echo -e "${GREEN}✅ 备份完成: $BACKUP_DIR${NC}"

# 2. 添加全局 Mocks 到 jest.setup.js
echo -e "${YELLOW}🔧 步骤 2: 添加全局 Mocks...${NC}"
if ! grep -q "Story 8.1: 批量测试修复" jest.setup.js; then
  cat >> jest.setup.js << 'MOCK_EOF'

/**
 * Story 8.1: 批量测试修复 - 全局 Mocks
 * Date: 2026-04-04
 */

// react-native-pdf-lib mock
jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(() => ({
        addText: jest.fn(),
      })),
      write: jest.fn(() => Promise.resolve('mock-pdf-path')),
    })),
  },
  PDFPage: {
    create: jest.fn(() => ({
      setMediaBox: jest.fn(),
      addText: jest.fn(),
    })),
  },
}));

// Platform mock
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '14.0',
  select: (obj) => obj.ios || obj.default,
}));

// AccessibilityInfo mock
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.AccessibilityInfo = {
    announceForAccessibility: jest.fn(),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  };
  return RN;
});
MOCK_EOF
  echo -e "${GREEN}✅ 全局 Mocks 添加完成${NC}"
else
  echo -e "${YELLOW}⚠️  Mocks 已存在，跳过${NC}"
fi

# 3. 创建 __mocks__ 目录和文件
echo -e "${YELLOW}📝 步骤 3: 创建 Mock 文件...${NC}"
mkdir -p src/__mocks__/config

# aiConfig mock
cat > src/__mocks__/config/aiConfig.ts << 'EOF'
export const aiConfig = {
  apiKey: 'test-api-key',
  baseURL: 'https://api.test.com',
  model: 'test-model',
};
EOF

# react-native-pdf-lib mock (备用)
mkdir -p src/__mocks__/react-native-pdf-lib
cat > src/__mocks__/react-native-pdf-lib/index.js << 'EOF'
module.exports = {
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(),
      write: jest.fn(() => Promise.resolve('mock-path')),
    })),
  },
  PDFPage: {
    create: jest.fn(() => ({
      setMediaBox: jest.fn(),
      addText: jest.fn(),
    })),
  },
};
EOF

echo -e "${GREEN}✅ Mock 文件创建完成${NC}"

# 4. 运行测试验证
echo -e "${YELLOW}🧪 步骤 4: 运行测试验证...${NC}"
echo "运行中... (这可能需要1-2分钟)"
npm test -- --passWithNoTests --silent 2>&1 | tail -20

# 获取测试结果
RESULT=$(npm test 2>&1 | grep "Test Suites:" | tail -1)
echo -e "\n${GREEN}📊 测试结果:${NC}"
echo "$RESULT"

# 5. 生成修复报告
echo -e "\n${YELLOW}📄 步骤 5: 生成修复报告...${NC}"
REPORT_FILE="$PROJECT_ROOT/docs/test-fix-report-$(date +%Y%m%d_%H%M%S).md"
cat > "$REPORT_FILE" << EOF
# Story 8.1: 批量测试修复报告

**执行时间:** $(date '+%Y-%m-%d %H:%M:%S')
**备份位置:** $BACKUP_DIR

## 修复内容

✅ 添加全局 Mocks (jest.setup.js)
✅ 创建 aiConfig mock
✅ 创建 react-native-pdf-lib mock
✅ 备份原始测试文件

## 测试结果

\`\`\`
$RESULT
\`\`\`

## 后续步骤

1. 如果仍有失败测试，查看详细报告: docs/batch-fix-plan-8-1.md
2. 恢复备份（如需要）: cp -r $BACKUP_DIR/* ./
3. 运行单个测试: npm test -- <filename>

---
**Story:** 8-1-fix-failed-tests
**Agent:** Dev Agent (Claude Opus 4.6)
EOF

echo -e "${GREEN}✅ 修复报告已生成: $REPORT_FILE${NC}"

# 完成
echo ""
echo "================================"
echo -e "${GREEN}✨ 批量修复完成！${NC}"
echo ""
echo "📁 备份位置: $BACKUP_DIR"
echo "📄 详细计划: docs/batch-fix-plan-8-1.md"
echo "📊 修复报告: $REPORT_FILE"
echo ""
echo "🔍 下一步:"
echo "  1. 查看测试结果: npm test"
echo "  2. 查看详细计划: cat docs/batch-fix-plan-8-1.md"
echo "  3. 查看修复报告: cat $REPORT_FILE"
echo ""
