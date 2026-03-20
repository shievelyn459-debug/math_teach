import React, {useState, useRef, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Modal} from 'react-native';
import {RNCamera} from 'react-native-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {Button, Card, Title} from 'react-native-paper';
import {recognitionApi} from '../services/api';
import {RecognitionResult, QuestionType, ManualCorrection} from '../types';
import QuestionTypeSelector from '../components/QuestionTypeSelector';
import {preferencesService} from '../services/preferencesService';

const CameraScreen = () => {
  const cameraRef = useRef<RNCamera>(null);
  const [isTakingPicture, setIsTakingPicture] = useState(false);
  const [isRecognizing, setIsRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showManualCorrection, setShowManualCorrection] = useState(false);
  const [currentImageUri, setCurrentImageUri] = useState<string>('');
  const [suggestedType, setSuggestedType] = useState<QuestionType | null>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsTakingPicture(true);
    setRecognitionResult(null);
    setError(null);

    try {
      const options = {
        quality: 0.8,
        base64: true,
        fixOrientation: true,
        forceUpOrientation: true,
      };

      const data = await cameraRef.current.takePictureAsync(options);
      console.log('Picture taken:', data.uri);

      // 识别题目类型
      await recognizeQuestionType(data.uri);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('错误', '拍照失败，请重试');
    } finally {
      setIsTakingPicture(false);
    }
  };

  const recognizeQuestionType = async (imageUri: string) => {
    setIsRecognizing(true);
    setCurrentImageUri(imageUri);
    try {
      const response = await recognitionApi.recognizeQuestionType(imageUri);

      if (response.success && response.data) {
        setRecognitionResult(response.data);

        // 检查是否有用户偏好建议
        const suggestion = await preferencesService.suggestQuestionType(
          response.data.questionType
        );
        setSuggestedType(suggestion);

        const alertMessage = suggestion
          ? `题目类型: ${getQuestionTypeLabel(response.data.questionType)}\n置信度: ${(response.data.confidence * 100).toFixed(1)}%\n\n根据您的偏好，建议类型: ${getQuestionTypeLabel(suggestion)}`
          : `题目类型: ${getQuestionTypeLabel(response.data.questionType)}\n置信度: ${(response.data.confidence * 100).toFixed(1)}%`;

        Alert.alert(
          '识别成功',
          alertMessage,
          [
            {text: '确定', onPress: () => console.log('确定')},
            {text: '不对？', onPress: () => setShowManualCorrection(true)}
          ]
        );
      } else {
        setError(response.error?.message || '识别失败');
        Alert.alert('识别失败', response.error?.message || '无法识别题目类型', [
          {text: '确定', onPress: () => console.log('确定')},
          {text: '手动选择', onPress: () => setShowManualCorrection(true)}
        ]);
      }
    } catch (error) {
      console.error('Recognition error:', error);
      setError(error instanceof Error ? error.message : '识别过程出错');
      Alert.alert('错误', '识别过程出错，请重试');
    } finally {
      setIsRecognizing(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType): string => {
    const labels = {
      [QuestionType.ADDITION]: '加法',
      [QuestionType.SUBTRACTION]: '减法',
      [QuestionType.WORD_PROBLEM]: '应用题'
    };
    return labels[type] || '未知类型';
  };

  const handleManualCorrection = async (selectedType: QuestionType) => {
    if (!recognitionResult) return;

    console.log('手动修正题目类型:', selectedType);

    try {
      // 记录纠正到偏好服务
      await preferencesService.recordCorrection(
        recognitionResult.questionType,
        selectedType,
        currentImageUri
      );

      // 创建手动纠正记录
      const correction: ManualCorrection = {
        id: Date.now().toString(),
        originalType: recognitionResult.questionType,
        correctedType: selectedType,
        imageUri: currentImageUri,
        timestamp: new Date(),
      };

      // 提交到API（用于AI学习）
      await recognitionApi.submitManualCorrection(correction);

      // 更新本地状态
      setRecognitionResult(prev => prev ? {
        ...prev,
        questionType: selectedType,
        correctedQuestionType: selectedType,
        isCorrected: true
      } : null);

      setShowManualCorrection(false);
      Alert.alert('已修正', `题目类型已更新为: ${getQuestionTypeLabel(selectedType)}`);
    } catch (error) {
      console.error('Failed to record manual correction:', error);
      // 即使记录失败，也更新本地状态
      setRecognitionResult(prev => prev ? {
        ...prev,
        questionType: selectedType,
        correctedQuestionType: selectedType,
        isCorrected: true
      } : null);
      setShowManualCorrection(false);
      Alert.alert('已修正', `题目类型已更新为: ${getQuestionTypeLabel(selectedType)}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>拍摄数学题目</Text>

      <Card style={styles.instructionCard}>
        <Card.Content>
          <Title>使用说明</Title>
          <Text style={styles.instructionText}>
            1. 确保题目清晰完整{'\n'}
            2. 保持光线充足{'\n'}
            3. 对准题目后点击拍照{'\n'}
            4. 系统将自动识别题目类型
          </Text>
        </Card.Content>
      </Card>

      {/* 识别状态显示 */}
      {isRecognizing && (
        <View style={styles.recognitionStatus}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.recognitionText}>正在识别题目类型...</Text>
        </View>
      )}

      {error && (
        <Card style={styles.errorCard}>
          <Card.Content>
            <Title style={styles.errorTitle}>识别错误</Title>
            <Text style={styles.errorText}>{error}</Text>
          </Card.Content>
        </Card>
      )}

      {recognitionResult && (
        <Card style={styles.resultCard}>
          <Card.Content>
            <Title>识别结果</Title>
            <Text style={styles.resultText}>
              题目类型: {getQuestionTypeLabel(recognitionResult.questionType)}
            </Text>
            <Text style={styles.resultText}>
              置信度: {(recognitionResult.confidence * 100).toFixed(1)}%
            </Text>
            <Text style={styles.resultText}>
              知识点: {recognitionResult.knowledgePoint}
            </Text>
            <Button
              mode="outlined"
              onPress={() => setShowManualCorrection(true)}
              style={styles.correctionButton}
            >
              不对？手动修正
            </Button>
          </Card.Content>
        </Card>
      )}

      <View style={styles.cameraContainer}>
        <RNCamera
          ref={cameraRef}
          style={styles.preview}
          type={RNCamera.Constants.Type.back}
          flashMode={RNCamera.Constants.FlashMode.off}
          androidCameraPermissionOptions={{
            title: '相机权限',
            message: '需要相机权限来拍摄题目',
            buttonPositive: '确定',
            buttonNegative: '取消',
          }}
        />

        <View style={styles.cameraOverlay}>
          <View style={styles.focusFrame}>
            <Text style={styles.focusText}>将题目框在此区域内</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.captureButton, (isTakingPicture || isRecognizing) && styles.captureButtonDisabled]}
        onPress={takePicture}
        disabled={isTakingPicture || isRecognizing}>
        <Icon name="camera" size={40} color="white" />
        {(isTakingPicture || isRecognizing) && (
          <ActivityIndicator style={styles.buttonActivity} color="white" />
        )}
      </TouchableOpacity>

      {/* 手动修正组件 */}
      <QuestionTypeSelector
        visible={showManualCorrection}
        currentType={recognitionResult?.questionType}
        onSelect={handleManualCorrection}
        onCancel={() => setShowManualCorrection(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    margin: 20,
  },
  instructionCard: {
    margin: 15,
    borderRadius: 10,
  },
  instructionText: {
    marginTop: 10,
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  preview: {
    flex: 1,
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  focusFrame: {
    flex: 1,
    borderColor: 'white',
    borderWidth: 2,
    margin: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusText: {
    color: 'white',
    fontSize: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  captureButton: {
    alignSelf: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  captureButtonDisabled: {
    backgroundColor: 'gray',
  },
  recognitionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  recognitionText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
  },
  errorCard: {
    margin: 15,
    backgroundColor: '#ffebee',
    borderColor: '#f44336',
    borderWidth: 1,
  },
  errorTitle: {
    color: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    marginTop: 5,
  },
  resultCard: {
    margin: 15,
    backgroundColor: '#e8f5e9',
    borderColor: '#4caf50',
    borderWidth: 1,
  },
  resultText: {
    fontSize: 16,
    marginVertical: 3,
    color: '#333',
  },
  correctionButton: {
    marginTop: 10,
    borderColor: '#2196f3',
  },
  buttonActivity: {
    position: 'absolute',
  },
});

export default CameraScreen;