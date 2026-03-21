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
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AccessibilityInfo,
} from 'react-native';
import {
  Explanation,
  ExplanationSection,
  ExplanationSectionType,
  TeachingTip,
  ExplanationExample,
  ExplanationFormat,
} from '../types/explanation';

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
    AccessibilityInfo.announceForSync(
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
          <ActivityIndicator size="large" color="#2196f3" />
          <Text style={styles.transitioningText}>正在切换格式...</Text>
        </View>
      );
    }

    switch (currentFormat) {
      case ExplanationFormat.TEXT:
        return (
          <>
            {/* 知识点标题 */}
            <View style={styles.header}>
              <Text style={styles.knowledgePointName}>
                {explanation.knowledgePointName}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  阅读时间: {explanation.estimatedReadTime}分钟
                </Text>
                <Text style={styles.metaText}>
                  质量分数: {Math.round(explanation.qualityScore * 100)}%
                </Text>
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
              <Text style={styles.teachingTipsTitle}>💡 家长辅导技巧</Text>
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
      <Text style={styles.placeholderEmoji}>{emoji}</Text>
      <Text style={styles.placeholderTitle}>{title} 即将推出</Text>
      <Text style={styles.placeholderDescription}>{description}</Text>
      <View style={styles.placeholderTimeline}>
        <Text style={styles.placeholderTimelineText}>{timeline}</Text>
      </View>
      <View style={styles.placeholderNote}>
        <Text style={styles.placeholderNoteText}>
          💡 您可以先查看文字讲解，内容同样详细易懂
        </Text>
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
        <Text style={styles.sectionIcon}>{icon}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
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
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
};

const ExamplesContent: React.FC<{examples: ExplanationExample[]}> = ({examples}) => {
  return (
    <View style={styles.examplesContent}>
      {examples.map((example, index) => (
        <View key={index} style={styles.exampleCard}>
          <Text style={styles.exampleQuestion}>
            Q{index + 1}: {example.question}
          </Text>
          <Text style={styles.exampleAnswer}>答案: {example.answer}</Text>

          <View style={styles.stepsContainer}>
            <Text style={styles.stepsTitle}>解题步骤:</Text>
            {example.steps.map((step, stepIndex) => (
              <View key={stepIndex} style={styles.stepRow}>
                <Text style={styles.stepNumber}>{stepIndex + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>

          {example.difficulty && (
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>
                难度: {example.difficulty === 'easy' ? '简单' : example.difficulty === 'medium' ? '中等' : '困难'}
              </Text>
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
        <Text style={styles.tipTitle}>{tip.title}</Text>
        <Text style={styles.tipExpandIcon}>{expanded ? '▼' : '▶'}</Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.tipContent}>
          <Text style={styles.tipDescription}>{tip.description}</Text>

          {tip.dos.length > 0 && (
            <View style={styles.dosContainer}>
              <Text style={styles.dosTitle}>✅ 应该这样做:</Text>
              {tip.dos.map((item, index) => (
                <Text key={index} style={styles.doItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {tip.donts.length > 0 && (
            <View style={styles.dontsContainer}>
              <Text style={styles.dontsTitle}>❌ 不要这样做:</Text>
              {tip.donts.map((item, index) => (
                <Text key={index} style={styles.dontItem}>
                  • {item}
                </Text>
              ))}
            </View>
          )}

          {tip.practiceActivity && (
            <View style={styles.practiceActivityContainer}>
              <Text style={styles.practiceActivityTitle}>🎯 实践活动</Text>
              <Text style={styles.practiceActivityText}>{tip.practiceActivity}</Text>
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
    backgroundColor: '#f8f9fa',
  },
  contentContainer: {
    padding: 16,
  },
  header: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  knowledgePointName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  expandIcon: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  sectionContent: {
    padding: 16,
  },
  textContent: {
    gap: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#34495e',
  },
  examplesContent: {
    gap: 16,
  },
  exampleCard: {
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  exampleQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  exampleAnswer: {
    fontSize: 15,
    color: '#27ae60',
    fontWeight: '500',
    marginBottom: 12,
  },
  stepsContainer: {
    marginTop: 8,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498db',
    marginRight: 8,
    minWidth: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#34495e',
    lineHeight: 20,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  difficultyText: {
    fontSize: 12,
    color: '#2980b9',
    fontWeight: '500',
  },
  teachingTipsContainer: {
    marginTop: 8,
  },
  teachingTipsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  tipCard: {
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fffbf0',
  },
  tipTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#d35400',
  },
  tipExpandIcon: {
    fontSize: 12,
    color: '#f39c12',
  },
  tipContent: {
    padding: 12,
  },
  tipDescription: {
    fontSize: 14,
    color: '#34495e',
    marginBottom: 12,
    lineHeight: 20,
  },
  dosContainer: {
    marginBottom: 12,
  },
  dosTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 6,
  },
  doItem: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
  dontsContainer: {
    marginBottom: 12,
  },
  dontsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#e74c3c',
    marginBottom: 6,
  },
  dontItem: {
    fontSize: 14,
    color: '#34495e',
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 18,
  },
  practiceActivityContainer: {
    backgroundColor: '#e8f5e9',
    borderRadius: 6,
    padding: 10,
  },
  practiceActivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 6,
  },
  practiceActivityText: {
    fontSize: 14,
    color: '#34495e',
    lineHeight: 18,
  },
  // Story 3-5: 格式切换过渡状态样式
  transitioningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    minHeight: 200,
  },
  transitioningText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginTop: 16,
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
    fontSize: 64,
    marginBottom: 20,
  },
  placeholderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
    textAlign: 'center',
  },
  placeholderDescription: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  placeholderTimeline: {
    backgroundColor: '#fff3e0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 20,
  },
  placeholderTimelineText: {
    fontSize: 14,
    color: '#ef6c00',
    fontWeight: '500',
  },
  placeholderNote: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4caf50',
  },
  placeholderNoteText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
});
