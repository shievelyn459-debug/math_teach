#!/bin/bash
# Story 8.2: 测试覆盖率生成脚本
# 用途: 生成完整的测试覆盖率报告（HTML + LCOV）

set -e  # 遇到错误立即退出

echo "🔍 开始生成测试覆盖率报告..."
echo ""

# 清理旧的覆盖率报告
if [ -d "coverage" ]; then
    echo "🧹 清理旧的覆盖率报告..."
    rm -rf coverage
fi

# 运行测试并生成覆盖率报告
echo "📊 运行测试套件并收集覆盖率数据..."
npm test -- --coverage --coverageReporters=text --coverageReporters=text-summary --coverageReporters=lcov --coverageReporters=html --no-cache

# 检查测试是否成功
TEST_EXIT_CODE=$?

echo ""
echo "===================="

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ 测试全部通过！"
else
    echo "⚠️  部分测试失败（退出码: $TEST_EXIT_CODE），但覆盖率报告已生成"
fi

echo ""

# 检查覆盖率报告是否生成
if [ -f "coverage/lcov.info" ] && [ -f "coverage/coverage-summary.json" ]; then
    echo "✅ 覆盖率报告生成成功！"
    echo ""
    echo "📍 报告位置:"
    echo "   📊 HTML 可视化报告: coverage/lcov-report/index.html"
    echo "   📄 LCOV 报告: coverage/lcov.info"
    echo "   📝 JSON 摘要: coverage/coverage-summary.json"
    echo "   📋 详细分析: docs/test-coverage-report.md"
    echo ""

    # 尝试提取总体覆盖率
    if command -v jq &> /dev/null; then
        echo "📈 总体覆盖率:"
        cat coverage/coverage-summary.json | jq -r '.total | "   语句: \(.statements.pct)%\n   分支: \(.branches.pct)%\n   函数: \(.functions.pct)%\n   行: \(.lines.pct)%"'
        echo ""
    fi

    # 如果在 macOS 上，提供打开命令
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "💡 提示: 运行 'open coverage/lcov-report/index.html' 在浏览器中查看详细报告"
        echo ""
    fi

    exit 0
else
    echo "❌ 覆盖率报告生成失败"
    echo "   请检查测试是否正常运行"
    exit 1
fi
