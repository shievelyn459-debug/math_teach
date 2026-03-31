/**
 * 知识点讲解内容组件
 * Story 3-2: generate-knowledge-point-explanation
 * Task 5: Create explanation display components
 * Story 3-4: multiple-explanation-formats
 * Added multi-format support
 */

import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
  ActivityIndicator,
} from 'react-native';
import {
  Explanation,
  ExplanationSection,
  ExplanationSectionType,
  TeachingTip,
  ExplanationExample,
  ExplanationFormat,
} from '../types/explanation';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

interface ExplanationContentProps {
  explanation: Explanation;
  currentFormat: ExplanationFormat;  // Story 3-4: 当前格式
  onSectionPress?: (sectionType: ExplanationSectionType) => void;
  isTransitioning?: boolean;  // Story 3-5: 是否正在切换格式
}

/**
 * 讲解内容展示组件
 * 支持可折叠章节、数学公式显示、逐步例题
 * Story 3-4: 支持多格式展示（文字/动画/视频）
 * Story 3-5: 支持格式切换过渡状态
 */
export const ExplanationContent: React.FC<ExplanationContentProps> = ({
  explanation,
  currentFormat,
  onSectionPress,
  isTransitioning = false,
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<ExplanationSectionType>>(
    new Set([ExplanationSectionType.DEFINITION])
  );

  const toggleSection = (sectionType: ExplanationSectionType) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionType)) {
      newExpanded.delete(sectionType);
    } else {
      newExpanded.add(sectionType);
    }
    setExpandedSections(newExpanded);
    onSectionPress?.(sectionType);

    // 通知辅助功能
    AccessibilityInfo.announceForAccessibility(
      newExpanded.has(sectionType)
        ? `${getSectionTitle(sectionType)}已展开`
        : `${getSectionTitle(sectionType)}已收起`
    );
  };

  const getSectionTitle = (type: ExplanationSectionType): string => {
    const titles: Record<ExplanationSectionType, string> = {
      [ExplanationSectionType.DEFINITION]: '概念说明',
      [ExplanationSectionType.METHODS]: '解题方法',
      [ExplanationSectionType.EXAMPLES]: '常见例题',
      [ExplanationSectionType.TIPS]: '辅导技巧',
    };
    return titles[type] || type;
  };

  const getSectionIcon = (type: ExplanationSectionType): string => {
    const icons: Record<ExplanationSectionType, string> = {
      [ExplanationSectionType.DEFINITION]: '💡',
      [ExplanationSectionType.METHODS]: '📝',
      [ExplanationSectionType.EXAMPLES]: '✏️',
      [ExplanationSectionType.TIPS]: '⭐',
    };
    return icons[type] || '📖';
  };

  // Story 3-4: 根据格式渲染不同内容
  const renderContent = () => {
    // Story 3-5: 过渡状态显示
    if (isTransitioning) {
      return (
        <View style={styles.transitioningContainer}>
          <ActivityIndicator size="large" color={designSystem.colors.primary} />
          <Spacer size="md" />
          <Typography variant="body" color={designSystem.colors.text.hint}>
            正在切换格式...
          </Typography>
        </View>
      );
    }

    switch (currentFormat) {
      case ExplanationFormat.TEXT:
        return (
          <>
            {/* 知识点标题 */}
            <View style={styles.header}>
              <Typography variant="displaySmall" style={styles.knowledgePointName}>
                {explanation.knowledgePointName}
              </Typography>
              <View style={styles.metaRow}>
                <Typography variant="caption" color={designSystem.colors.text.hint}>
                  阅读时间: {explanation.estimatedReadTime}分钟
                </Typography>
                <Typography variant="caption" color={designSystem.colors.text.hint}>
                  质量分数: {Math.round(explanation.qualityScore * 100)}%
                </Typography>
              </View>
            </View>

            {/* 讲解章节 */}
            {explanation.sections
              .sort((a, b) => a.order - b.order)
              .map(section => (
                <SectionCard
                  key={section.type}
                  section={section}
                  isExpanded={expandedSections.has(section.type)}
                  onToggle={() => toggleSection(section.type)}
                  icon={getSectionIcon(section.type)}
                  title={getSectionTitle(section.type)}
                />
              ))}

            {/* 家长辅导技巧 */}
            <View style={styles.teachingTipsContainer}>
              <Typography variant="headlineSmall" style={styles.teachingTipsTitle}>
                💡 家长辅导技巧
              </Typography>
              {explanation.teachingTips.map((tip) => (
                <TeachingTipCard key={tip.id} tip={tip} />
              ))}
            </View>
          </>
        );

      case ExplanationFormat.ANIMATION:
        return <FormatPlaceholder format="animation" title="动画演示" />;

      case ExplanationFormat.VIDEO:
        return <FormatPlaceholder format="video" title="视频讲解" />;

      default:
        return null;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {renderContent()}
    </ScrollView>
  );
};

/**
 * Story 3-4: 格式占位符组件
 * 用于展示尚未实现的格式
 */
const FormatPlaceholder: React.FC<{
  format: 'animation' | 'video';
  title: string;
}> = ({format, title}) => {
  const config = {
    animation: {
      emoji: '🎬',
      description: '我们正在为这个知识点制作生动的动画演示，帮助您更直观地理解概念。',
      timeline: '预计上线时间：2026年第二季度',
    },
    video: {
      emoji: '🎥',
      description: '专业老师正在录制这个知识点的视频讲解，包含详细的例题演示和辅导技巧。',
      timeline: '预计上线时间：2026年第二季度',
    },
  };

  const {emoji, description, timeline} = config[format];

  return (
    <View style={styles.placeholderContainer}>
      <Typography variant="displayLarge" style={styles.placeholderEmoji}>{emoji}</Typography>
      <Typography variant="headlineMedium" align="center" style={styles.placeholderTitle}>
        {title} 即将推出
      </Typography>
      <Typography
        variant="body"
        color={designSystem.colors.text.hint}
        align="center"
        style={styles.placeholderDescription}>
        {description}
      </Typography>
      <View style={styles.placeholderTimeline}>
        <Typography variant="caption" color={designSystem.colors.warning.dark}>
          {timeline}
        </Typography>
      </View>
      <View style={styles.placeholderNote}>
        <Typography variant="body" color={designSystem.colors.success.dark}>
          💡 您可以先查看文字讲解，内容同样详细易懂
        </Typography>
      </View>
    </View>
  );
};

interface SectionCardProps {
  section: ExplanationSection;
  isExpanded: boolean;
  onToggle: () => void;
  icon: string;
  title: string;
}

const SectionCard: React.FC<SectionCardProps> = ({
  section,
  isExpanded,
  onToggle,
  icon,
  title,
}) => {
  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={onToggle}
        accessible={true}
        accessibilityLabel={`${title}，${isExpanded ? '点击收起' : '点击展开'}`}
        accessibilityRole="button"
        accessibilityState={{expanded: isExpanded}}>
        <Typography variant="headlineSmall">{icon}</Typography>
        <Spacer size="md" />
        <Typography variant="headlineSmall" style={styles.sectionTitle}>{title}</Typography>
        <Typography variant="caption" color={designSystem.colors.text.hint}>
          {isExpanded ? '▼' : '▶'}
        </Typography>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.sectionContent}>
          {section.type === ExplanationSectionType.EXAMPLES && section.examples ? (
            <ExamplesContent examples={section.examples} />
          ) : (
            <TextContent content={section.content} />
          )}
        </View>
      )}
    </View>
  );
};

const TextContent: React.FC<{content: string[]}> = ({content}) => {
  return (
    <View style={styles.textContent}>
      {content.map((paragraph, index) => (
        <Typography key={index} variant="body" style={styles.paragraph}>
          {paragraph}
        </Typography>
      ))}
    </View>
  );
};

const ExamplesContent: React.FC<{examples: ExplanationExample[]}> = ({examples}) => {
  return (
    <View style={styles.examplesContent}>
      {examples.map((example, index) => (
        <View key={index} style={styles.exampleCard}>
          <Typography variant="body" style={styles.exampleQuestion}>
            Q{index + 1}: {example.question}
          </Typography>
          <Typography variant="body" color={designSystem.colors.success.default} style={styles.exampleAnswer}>
            答案: {example.answer}
          </Typography>

          <View style={styles.stepsContainer}>
            <Typography variant="caption" color={designSystem.colors.text.hint} style={styles.stepsTitle}>
              解题步骤:
            </Typography>
            {example.steps.map((step, stepIndex) => (
              <View key={stepIndex} style={styles.stepRow}>
                <Typography variant="body" color={designSystem.colors.info.default} style={styles.stepNumber}>
                  {stepIndex + 1}.
                </Typography>
                <Typography variant="body" style={styles.stepText}>{step}</Typography>
              </View>
            ))}
          </View>

          {example.difficulty && (
            <View style={styles.difficultyBadge}>
              <Typography variant="overline" color={designSystem.colors.info.dark}>
                难度: {example.difficulty === 'easy' ? '简单' : example.difficulty === 'medium' ? '中等' : '困难'}
              </Typography>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const TeachingTipCard: React.FC<{tip: TeachingTip}> = ({tip}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.tipCard}>
      <TouchableOpacity
        style={styles.tipHeader}
        onPress={() => setExpanded(!expanded)}
        accessible={true}
        accessibilityLabel={`${tip.title}，${expanded ? '点击收起' : '点击展开'}`}
        accessibilityRole="button"
        accessibilityState={{expanded}}>
        <Typography variant="body" color={designSystem.colors.warning.dark} style={styles.tipTitle}>
          {tip.title}
        </Typography>
        <Typography variant="caption" color={designSystem.colors.warning.default}>
          {expanded ? '▼' : '▶'}
        </Typography>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.tipContent}>
          <Typography variant="body" color={designSystem.colors.text.secondary} style={styles.tipDescription}>
            {tip.description}
          </Typography>

          {tip.dos.length > 0 && (
            <View style={styles.dosContainer}>
              <Typography variant="caption" color={designSystem.colors.success.default} style={styles.dosTitle}>
                ✅ 应该这样做:
              </Typography>
              {tip.dos.map((item, index) => (
                <Typography key={index} variant="body" style={styles.doItem}>
                  • {item}
                </Typography>
              ))}
            </View>
          )}

          {tip.donts.length > 0 && (
            <View style={styles.dontsContainer}>
              <Typography variant="caption" color={designSystem.colors.error.default} style={styles.dontsTitle}>
                ❌ 不要这样做:
              </Typography>
              {tip.donts.map((item, index) => (
                <Typography key={index} variant="body" style={styles.dontItem}>
                  • {item}
                </Typography>
              ))}
            </View>
          )}

          {tip.practiceActivity && (
            <View style={styles.practiceActivityContainer}>
              <Typography variant="caption" color={designSystem.colors.success.dark} style={styles.practiceActivityTitle}>
                🎯 实践活动
              </Typography>
              <Typography variant="body" style={styles.practiceActivityText}>{tip.practiceActivity}</Typography>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.surface.secondary,
  },
  contentContainer: {
    padding: designSystem.spacing.md,
  },
  header: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    padding: designSystem.spacing.lg,
    marginBottom: designSystem.spacing.md,
    ...designSystem.shadows.sm,
  },
  knowledgePointName: {
    marginBottom: designSystem.spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionCard: {
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    marginBottom: designSystem.spacing.md,
    overflow: 'hidden',
    ...designSystem.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface.secondary,
  },
  sectionTitle: {
    flex: 1,
  },
  sectionContent: {
    padding: designSystem.spacing.md,
  },
  textContent: {
    gap: designSystem.spacing.md,
  },
  paragraph: {
    lineHeight: 24,
    color: designSystem.colors.text.primary,
  },
  examplesContent: {
    gap: designSystem.spacing.md,
  },
  exampleCard: {
    backgroundColor: designSystem.colors.info.light,
    borderRadius: designSystem.borderRadius.md,
    padding: designSystem.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.info.default,
  },
  exampleQuestion: {
    fontWeight: '600',
    marginBottom: designSystem.spacing.sm,
  },
  exampleAnswer: {
    fontWeight: '500',
    marginBottom: designSystem.spacing.md,
  },
  stepsContainer: {
    marginTop: designSystem.spacing.sm,
  },
  stepsTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: designSystem.spacing.xs,
  },
  stepNumber: {
    fontWeight: '600',
    marginRight: designSystem.spacing.sm,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    lineHeight: 20,
    color: designSystem.colors.text.primary,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: designSystem.colors.info.lighter,
    paddingHorizontal: designSystem.spacing.sm,
    paddingVertical: designSystem.spacing.xs,
    borderRadius: designSystem.borderRadius.sm,
    marginTop: designSystem.spacing.sm,
  },
  teachingTipsContainer: {
    marginTop: designSystem.spacing.sm,
  },
  teachingTipsTitle: {
    marginBottom: designSystem.spacing.md,
  },
  tipCard: {
    backgroundColor: designSystem.colors.warning.lighter,
    borderRadius: designSystem.borderRadius.md,
    marginBottom: designSystem.spacing.sm,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.warning.default,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designSystem.spacing.md,
    backgroundColor: designSystem.colors.warning.light,
  },
  tipTitle: {
    flex: 1,
    fontWeight: '600',
  },
  tipContent: {
    padding: designSystem.spacing.md,
  },
  tipDescription: {
    marginBottom: designSystem.spacing.md,
    lineHeight: 20,
  },
  dosContainer: {
    marginBottom: designSystem.spacing.md,
  },
  dosTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  doItem: {
    marginLeft: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.xs,
    lineHeight: 18,
    color: designSystem.colors.text.primary,
  },
  dontsContainer: {
    marginBottom: designSystem.spacing.md,
  },
  dontsTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  dontItem: {
    marginLeft: designSystem.spacing.sm,
    marginBottom: designSystem.spacing.xs,
    lineHeight: 18,
    color: designSystem.colors.text.primary,
  },
  practiceActivityContainer: {
    backgroundColor: designSystem.colors.success.lighter,
    borderRadius: designSystem.borderRadius.sm,
    padding: designSystem.spacing.md,
  },
  practiceActivityTitle: {
    marginBottom: designSystem.spacing.sm,
  },
  practiceActivityText: {
    lineHeight: 18,
    color: designSystem.colors.text.primary,
  },
  // Story 3-5: 格式切换过渡状态样式
  transitioningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  // Story 3-4: 格式占位符样式
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 400,
  },
  placeholderEmoji: {
    marginBottom: 20,
  },
  placeholderTitle: {
    marginBottom: designSystem.spacing.md,
  },
  placeholderDescription: {
    lineHeight: 24,
    marginBottom: designSystem.spacing.xl,
    paddingHorizontal: 20,
  },
  placeholderTimeline: {
    backgroundColor: designSystem.colors.warning.lighter,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.xl,
    marginBottom: designSystem.spacing.xl,
  },
  placeholderNote: {
    backgroundColor: designSystem.colors.success.lighter,
    paddingHorizontal: designSystem.spacing.md,
    paddingVertical: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: designSystem.colors.success.default,
  },
});
