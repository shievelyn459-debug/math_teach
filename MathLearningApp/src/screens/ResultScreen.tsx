import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {RecognitionResult} from '../types';
import KnowledgePointTag from '../components/KnowledgePointTag';

interface ResultScreenProps {
  recognitionResult: RecognitionResult | null;
  isLoading: boolean;
  onKnowledgePointPress: (knowledgePointId: string) => void;
  onBack: () => void;
}

/**
 * 题目识别结果屏幕
 * 显示识别结果和知识点标签 (AC: 1, 4, 6)
 */
const ResultScreen: React.FC<ResultScreenProps> = ({
  recognitionResult,
  isLoading,
  onKnowledgePointPress,
  onBack,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>正在识别知识点...</Text>
      </View>
    );
  }

  if (!recognitionResult) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>识别失败，请重试</Text>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>返回</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const {questionType, difficulty, knowledgePoints, extractedText} =
    recognitionResult;

  return (
    <ScrollView style={styles.container}>
      {/* 题目类型和难度 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>识别结果</Text>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>题目类型：</Text>
          <Text style={styles.resultValue}>{questionType}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>难度等级：</Text>
          <Text style={styles.resultValue}>{difficulty}</Text>
        </View>
        <View style={styles.resultRow}>
          <Text style={styles.resultLabel}>识别置信度：</Text>
          <Text style={styles.resultValue}>
            {Math.round(recognitionResult.confidence * 100)}%
          </Text>
        </View>
      </View>

      {/* 知识点标签 (AC: 1, 4, 6) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>知识点</Text>
        {knowledgePoints ? (
          <>
            {/* 主要知识点 */}
            <View style={styles.primaryKpContainer}>
              <Text style={styles.primaryKpLabel}>主要知识点：</Text>
              <KnowledgePointTag
                matchResult={knowledgePoints.primaryKnowledgePoint}
                onPress={(mr) => onKnowledgePointPress(mr.knowledgePoint.id)}
              />
            </View>

            {/* 其他知识点 (AC: 3 - 支持多个知识点) */}
            {knowledgePoints.knowledgePoints.length > 1 && (
              <View style={styles.otherKpsContainer}>
                <Text style={styles.otherKpsLabel}>相关知识点：</Text>
                <View style={styles.tagsContainer}>
                  {knowledgePoints.knowledgePoints
                    .filter(
                      (kp) =>
                        kp.knowledgePoint.id !==
                        knowledgePoints.primaryKnowledgePoint.knowledgePoint.id
                    )
                    .map((kp, index) => (
                      <KnowledgePointTag
                        key={index}
                        matchResult={kp}
                        onPress={(mr) =>
                          onKnowledgePointPress(mr.knowledgePoint.id)
                        }
                      />
                    ))}
                </View>
              </View>
            )}

            {/* 降级提示 (AC: 7) */}
            {knowledgePoints.fallbackUsed && (
              <View style={styles.fallbackWarning}>
                <Text style={styles.fallbackWarningText}>
                  ⚠️ 未能自动识别具体知识点，请参考详细讲解
                </Text>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.noKpText}>知识点识别中...</Text>
        )}
      </View>

      {/* 提取的文本 */}
      {extractedText && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>提取的文本</Text>
          <Text style={styles.extractedText}>{extractedText}</Text>
        </View>
      )}

      {/* 返回按钮 */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backButtonText}>返回</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultLabel: {
    fontSize: 15,
    color: '#666',
    width: 100,
  },
  resultValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  primaryKpContainer: {
    marginBottom: 12,
  },
  primaryKpLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  otherKpsContainer: {
    marginTop: 8,
  },
  otherKpsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  fallbackWarning: {
    backgroundColor: '#fff3e0',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  fallbackWarningText: {
    fontSize: 13,
    color: '#ef6c00',
    lineHeight: 18,
  },
  noKpText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  extractedText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  backButton: {
    backgroundColor: '#2196f3',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
});

export default ResultScreen;
