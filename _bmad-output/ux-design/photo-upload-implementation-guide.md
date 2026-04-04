# 拍照上传页面 - 前端实现指南

## 文档信息

| 项目 | 内容 |
|------|------|
| 项目名称 | MathLearningApp |
| 页面名称 | 拍照上传页面 |
| 技术栈 | React Native + TypeScript |
| 目标平台 | iOS / Android 平板 |
| 版本 | 1.0 |
| 日期 | 2026-03-31 |

---

## 1. 文件结构建议

```
src/
├── screens/
│   └── PhotoUpload/
│       ├── index.tsx                 # 页面入口
│       ├── PhotoUploadScreen.tsx     # 主页面组件
│       ├── PhotoPreviewScreen.tsx    # 预览确认页面
│       └── styles.ts                 # 样式文件
├── components/
│   ├── PhotoUpload/
│   │   ├── TipCard.tsx               # 提示卡片组件
│   │   ├── ActionButton.tsx          # 操作按钮组件
│   │   ├── IllustrationPlaceholder.tsx # 示意图组件
│   │   ├── QualityIndicator.tsx      # 质量指示器
│   │   └── index.ts                  # 组件导出
│   └── common/
│       ├── Button/
│       │   ├── PrimaryButton.tsx
│       │   └── SecondaryButton.tsx
│       └── Loading/
│           └── LoadingOverlay.tsx
├── hooks/
│   ├── usePhotoCapture.ts            # 拍照Hook
│   ├── useImagePicker.ts             # 相册选择Hook
│   └── useImageQuality.ts            # 图片质量检测Hook
├── services/
│   └── imageUpload.ts                # 图片上传服务
├── utils/
│   ├── imageUtils.ts                 # 图片处理工具
│   └── permissions.ts                # 权限工具
└── constants/
    └── theme.ts                      # 主题常量
```

---

## 2. 主题常量定义

```typescript
// src/constants/theme.ts

export const COLORS = {
  // 主色调
  primary: '#FF9800',      // 温暖橙色
  primaryDark: '#F57C00',  // 按下状态
  secondary: '#42A5F5',    // 淡蓝色

  // 背景色
  background: '#FAFAFA',
  card: '#FFFFFF',

  // 文字色
  textPrimary: '#212121',
  textSecondary: '#757575',
  textHint: '#9E9E9E',

  // 状态色
  success: '#4CAF50',
  error: '#F44336',
  warning: '#FF9800',

  // 边框色
  border: '#E0E0E0',
  divider: '#EEEEEE',
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 24,
    fontWeight: '500' as const,
    lineHeight: 31,
  },
  h2: {
    fontSize: 20,
    fontWeight: '500' as const,
    lineHeight: 26,
  },
  body1: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  body2: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  button: {
    fontSize: 18,
    fontWeight: '500' as const,
    lineHeight: 22,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;
```

---

## 3. 核心组件实现

### 3.1 主页面组件

```typescript
// src/screens/PhotoUpload/PhotoUploadScreen.tsx

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { TipCard, ActionButton, IllustrationPlaceholder } from '../../components/PhotoUpload';
import { usePhotoCapture } from '../../hooks/usePhotoCapture';
import { useImagePicker } from '../../hooks/useImagePicker';
import { COLORS, SPACING } from '../../constants/theme';

interface PhotoUploadScreenProps {}

export const PhotoUploadScreen: React.FC<PhotoUploadScreenProps> = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  const { capturePhoto } = usePhotoCapture({
    onSuccess: (uri) => {
      navigation.navigate('PhotoPreview', { imageUri: uri });
    },
    onError: (error) => {
      // 处理错误
    },
  });

  const { pickImage } = useImagePicker({
    onSuccess: (uri) => {
      navigation.navigate('PhotoPreview', { imageUri: uri });
    },
    onError: (error) => {
      // 处理错误
    },
  });

  const tips = [
    '确保光线充足',
    '把题目放在桌面上',
    '平板垂直对准题目',
    '保持稳定，避免模糊',
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 提示卡片 */}
        <TipCard
          title="拍摄小贴士"
          tips={tips}
          icon="📷"
          style={styles.tipCard}
        />

        {/* 示意图区域 */}
        <IllustrationPlaceholder
          type="photo-guide"
          style={styles.illustration}
        />

        {/* 操作按钮 */}
        <View style={styles.buttonContainer}>
          <ActionButton
            text="开始拍照"
            icon="📷"
            variant="primary"
            onPress={capturePhoto}
            style={styles.button}
          />
          <ActionButton
            text="从相册选择"
            icon="🖼️"
            variant="secondary"
            onPress={pickImage}
            style={styles.button}
          />
        </View>

        {/* 底部提示 */}
        <Text style={styles.hint}>
          💡 在灯下拍摄，保持平板稳定
        </Text>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.md,
  },
  tipCard: {
    marginBottom: SPACING.xl,
  },
  illustration: {
    marginBottom: SPACING.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  button: {
    flex: 1,
    maxWidth: 200,
  },
  hint: {
    textAlign: 'center',
    color: COLORS.textHint,
    fontSize: 16,
    lineHeight: 24,
  },
});
```

### 3.2 提示卡片组件

```typescript
// src/components/PhotoUpload/TipCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface TipCardProps {
  title: string;
  tips: string[];
  icon?: string;
  style?: any;
}

export const TipCard: React.FC<TipCardProps> = ({
  title,
  tips,
  icon = '💡',
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* 标题 */}
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>

      {/* 提示列表 */}
      <View style={styles.tipList}>
        {tips.map((tip, index) => (
          <View key={index} style={styles.tipItem}>
            <Text style={styles.bullet}>✓</Text>
            <Text style={styles.tipText}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    // 阴影
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textPrimary,
  },
  tipList: {
    gap: SPACING.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bullet: {
    color: COLORS.success,
    fontSize: 18,
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  tipText: {
    ...TYPOGRAPHY.body1,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
```

### 3.3 操作按钮组件

```typescript
// src/components/PhotoUpload/ActionButton.tsx

import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

interface ActionButtonProps {
  text: string;
  icon?: string;
  variant: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
  text,
  icon,
  variant,
  onPress,
  disabled = false,
  loading = false,
  style,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };

  const isPrimary = variant === 'primary';

  const buttonStyles: ViewStyle[] = [
    styles.container,
    isPrimary ? styles.primaryContainer : styles.secondaryContainer,
    disabled && styles.disabled,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    isPrimary ? styles.primaryText : styles.secondaryText,
    disabled && styles.disabledText,
  ];

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={buttonStyles}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        {loading ? (
          <ActivityIndicator
            color={isPrimary ? COLORS.card : COLORS.secondary}
          />
        ) : (
          <>
            {icon && <Text style={styles.icon}>{icon}</Text>}
            <Text style={textStyles}>{text}</Text>
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.sm,
  },
  primaryContainer: {
    backgroundColor: COLORS.primary,
  },
  secondaryContainer: {
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.secondary,
  },
  disabled: {
    opacity: 0.5,
  },
  icon: {
    fontSize: 24,
  },
  text: {
    ...TYPOGRAPHY.button,
  },
  primaryText: {
    color: COLORS.card,
  },
  secondaryText: {
    color: COLORS.secondary,
  },
  disabledText: {
    color: COLORS.textHint,
  },
});
```

### 3.4 预览确认页面

```typescript
// src/screens/PhotoUpload/PhotoPreviewScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { ActionButton, QualityIndicator } from '../../components/PhotoUpload';
import { useImageQuality } from '../../hooks/useImageQuality';
import { uploadImage } from '../../services/imageUpload';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

type PhotoPreviewRouteProp = RouteProp<{
  PhotoPreview: { imageUri: string };
}, 'PhotoPreview'>;

export const PhotoPreviewScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<PhotoPreviewRouteProp>();
  const { imageUri } = route.params;

  const [isUploading, setIsUploading] = useState(false);
  const { quality, checkQuality } = useImageQuality();

  useEffect(() => {
    checkQuality(imageUri);
  }, [imageUri]);

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleUsePhoto = async () => {
    if (quality === 'poor') {
      Alert.alert(
        '照片质量提示',
        '照片有点模糊，建议重拍以获得更好的识别效果。确定要使用这张照片吗？',
        [
          { text: '重新拍摄', style: 'cancel', onPress: handleRetake },
          { text: '继续使用', onPress: uploadPhoto },
        ]
      );
    } else {
      await uploadPhoto();
    }
  };

  const uploadPhoto = async () => {
    setIsUploading(true);
    try {
      await uploadImage(imageUri);
      navigation.navigate('Success', { message: '照片已上传，正在识别中...' });
    } catch (error) {
      Alert.alert('上传失败', '请检查网络后重试');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 照片预览 */}
      <View style={styles.previewContainer}>
        <Image
          source={{ uri: imageUri }}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      {/* 质量指示器 */}
      <QualityIndicator quality={quality} style={styles.qualityIndicator} />

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        <ActionButton
          text="重新拍摄"
          icon="🔄"
          variant="secondary"
          onPress={handleRetake}
          disabled={isUploading}
          style={styles.button}
        />
        <ActionButton
          text="使用这张"
          icon="✓"
          variant="primary"
          onPress={handleUsePhoto}
          loading={isUploading}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    padding: SPACING.lg,
  },
  previewContainer: {
    flex: 1,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  image: {
    flex: 1,
    width: '100%',
  },
  qualityIndicator: {
    marginVertical: SPACING.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  button: {
    flex: 1,
  },
});
```

---

## 4. 自定义 Hooks

### 4.1 拍照 Hook

```typescript
// src/hooks/usePhotoCapture.ts

import { useCallback } from 'react';
import { launchCamera, CameraOptions, ImagePickerResponse } from 'react-native-image-picker';
import { requestCameraPermission } from '../utils/permissions';

interface UsePhotoCaptureOptions {
  onSuccess: (uri: string) => void;
  onError: (error: string) => void;
}

export const usePhotoCapture = (options: UsePhotoCaptureOptions) => {
  const { onSuccess, onError } = options;

  const capturePhoto = useCallback(async () => {
    // 请求权限
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      onError('需要相机权限才能拍照');
      return;
    }

    const cameraOptions: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      saveToPhotos: false,
      cameraType: 'back',
    };

    launchCamera(cameraOptions, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        onError(response.errorMessage || '拍照失败');
        return;
      }

      if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          onSuccess(uri);
        }
      }
    });
  }, [onSuccess, onError]);

  return { capturePhoto };
};
```

### 4.2 相册选择 Hook

```typescript
// src/hooks/useImagePicker.ts

import { useCallback } from 'react';
import { launchImageLibrary, ImageLibraryOptions, ImagePickerResponse } from 'react-native-image-picker';
import { requestStoragePermission } from '../utils/permissions';

interface UseImagePickerOptions {
  onSuccess: (uri: string) => void;
  onError: (error: string) => void;
}

export const useImagePicker = (options: UseImagePickerOptions) => {
  const { onSuccess, onError } = options;

  const pickImage = useCallback(async () => {
    // 请求权限
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      onError('需要相册权限才能选择照片');
      return;
    }

    const libraryOptions: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      selectionLimit: 1,
    };

    launchImageLibrary(libraryOptions, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        onError(response.errorMessage || '选择照片失败');
        return;
      }

      if (response.assets && response.assets[0]) {
        const uri = response.assets[0].uri;
        if (uri) {
          onSuccess(uri);
        }
      }
    });
  }, [onSuccess, onError]);

  return { pickImage };
};
```

### 4.3 图片质量检测 Hook

```typescript
// src/hooks/useImageQuality.ts

import { useState, useCallback } from 'react';
import ImageResizer from 'react-native-image-resizer';

type QualityLevel = 'excellent' | 'good' | 'poor' | 'checking';

interface QualityResult {
  clarity: number;  // 0-100
  brightness: number; // 0-100
  completeness: number; // 0-100
}

export const useImageQuality = () => {
  const [quality, setQuality] = useState<QualityLevel>('checking');
  const [details, setDetails] = useState<QualityResult | null>(null);

  const checkQuality = useCallback(async (imageUri: string) => {
    setQuality('checking');

    try {
      // 这里可以集成真实的图片质量检测算法
      // 目前使用模拟数据
      const result = await analyzeImageQuality(imageUri);

      setDetails(result);

      // 根据综合评分确定质量等级
      const overallScore = (result.clarity + result.brightness + result.completeness) / 3;

      if (overallScore >= 80) {
        setQuality('excellent');
      } else if (overallScore >= 60) {
        setQuality('good');
      } else {
        setQuality('poor');
      }
    } catch (error) {
      setQuality('good'); // 默认为良好
    }
  }, []);

  return { quality, details, checkQuality };
};

// 模拟图片质量分析
const analyzeImageQuality = async (uri: string): Promise<QualityResult> => {
  // 实际实现中可以：
  // 1. 使用 TensorFlow Lite 进行模糊检测
  // 2. 分析图片亮度
  // 3. 使用边缘检测判断完整性

  // 模拟返回
  return {
    clarity: 85,
    brightness: 78,
    completeness: 92,
  };
};
```

---

## 5. 服务层

### 5.1 图片上传服务

```typescript
// src/services/imageUpload.ts

import { Platform } from 'react-native';
import { compressImage } from '../utils/imageUtils';

const API_BASE_URL = 'https://api.mathlearningapp.com';

export const uploadImage = async (uri: string): Promise<string> => {
  // 1. 压缩图片
  const compressedUri = await compressImage(uri, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
  });

  // 2. 创建 FormData
  const formData = new FormData();
  const filename = uri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: Platform.OS === 'ios' ? compressedUri.replace('file://', '') : compressedUri,
    name: filename,
    type,
  } as any);

  // 3. 上传
  const response = await fetch(`${API_BASE_URL}/upload`, {
    method: 'POST',
    body: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (!response.ok) {
    throw new Error('上传失败');
  }

  const data = await response.json();
  return data.imageUrl;
};
```

---

## 6. 工具函数

### 6.1 权限请求

```typescript
// src/utils/permissions.ts

import { Platform, PermissionsAndroid, Linking, Alert } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export const requestCameraPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA
    );
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }

  const result = await request(PERMISSIONS.IOS.CAMERA);

  if (result === RESULTS.BLOCKED) {
    Alert.alert(
      '权限被拒绝',
      '请在设置中开启相机权限',
      [
        { text: '取消', style: 'cancel' },
        { text: '去设置', onPress: () => Linking.openSettings() },
      ]
    );
    return false;
  }

  return result === RESULTS.GRANTED;
};

export const requestStoragePermission = async (): Promise<boolean> => {
  if (Platform.OS === 'android') {
    if (Platform.Version >= 33) {
      // Android 13+ 使用新的权限
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    } else {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  // iOS 不需要相册权限请求，系统会自动处理
  return true;
};
```

### 6.2 图片处理

```typescript
// src/utils/imageUtils.ts

import ImageResizer from 'react-native-image-resizer';

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export const compressImage = async (
  uri: string,
  options: CompressOptions = {}
): Promise<string> => {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.8 } = options;

  try {
    const result = await ImageResizer.createResizedImage(
      uri,
      maxWidth,
      maxHeight,
      'JPEG',
      quality * 100,
      0,
      undefined,
      false,
      { mode: 'contain', onlyScaleDown: true }
    );

    return result.uri;
  } catch (error) {
    console.error('Image compression failed:', error);
    return uri; // 返回原始 URI
  }
};

export const getImageDimensions = async (
  uri: string
): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
};
```

---

## 7. 依赖包

### 7.1 必需依赖

```json
{
  "dependencies": {
    "react-native-image-picker": "^7.0.0",
    "react-native-image-resizer": "^1.4.5",
    "react-native-permissions": "^4.0.0",
    "react-native-reanimated": "^3.0.0",
    "@react-navigation/native": "^6.0.0",
    "@react-navigation/native-stack": "^6.0.0"
  }
}
```

### 7.2 安装命令

```bash
# 核心依赖
npm install react-native-image-picker react-native-image-resizer react-native-permissions

# 动画
npm install react-native-reanimated

# 导航
npm install @react-navigation/native @react-navigation/native-stack

# iOS pod install
cd ios && pod install
```

### 7.3 iOS 权限配置

```xml
<!-- ios/MathLearningApp/Info.plist -->
<key>NSCameraUsageDescription</key>
<string>MathLearningApp 需要使用相机来拍摄数学题目</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MathLearningApp 需要访问相册来选择题目照片</string>
```

### 7.4 Android 权限配置

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```

---

## 8. 测试建议

### 8.1 单元测试

```typescript
// __tests__/components/ActionButton.test.tsx

import { render, fireEvent } from '@testing-library/react-native';
import { ActionButton } from '../../src/components/PhotoUpload/ActionButton';

describe('ActionButton', () => {
  it('renders correctly with primary variant', () => {
    const { getByText } = render(
      <ActionButton text="开始拍照" variant="primary" onPress={() => {}} />
    );
    expect(getByText('开始拍照')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionButton text="开始拍照" variant="primary" onPress={onPress} />
    );
    fireEvent.press(getByText('开始拍照'));
    expect(onPress).toHaveBeenCalled();
  });

  it('is disabled when loading', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ActionButton
        text="开始拍照"
        variant="primary"
        onPress={onPress}
        loading
      />
    );
    fireEvent.press(getByText('开始拍照'));
    expect(onPress).not.toHaveBeenCalled();
  });
});
```

### 8.2 集成测试

```typescript
// __tests__/screens/PhotoUploadScreen.test.tsx

import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PhotoUploadScreen } from '../../src/screens/PhotoUpload/PhotoUploadScreen';

// Mock hooks
jest.mock('../../src/hooks/usePhotoCapture', () => ({
  usePhotoCapture: () => ({
    capturePhoto: jest.fn(),
  }),
}));

jest.mock('../../src/hooks/useImagePicker', () => ({
  useImagePicker: () => ({
    pickImage: jest.fn(),
  }),
}));

describe('PhotoUploadScreen', () => {
  it('renders all tips', () => {
    const { getByText } = render(<PhotoUploadScreen />);
    expect(getByText('确保光线充足')).toBeTruthy();
    expect(getByText('把题目放在桌面上')).toBeTruthy();
  });

  it('renders action buttons', () => {
    const { getByText } = render(<PhotoUploadScreen />);
    expect(getByText('开始拍照')).toBeTruthy();
    expect(getByText('从相册选择')).toBeTruthy();
  });
});
```

---

## 9. 性能优化

### 9.1 图片优化

| 策略 | 实现 |
|------|------|
| 压缩 | 上传前压缩到 1920×1080，质量 80% |
| 缓存 | 使用 FastImage 缓存已加载图片 |
| 懒加载 | 预览页使用渐进式加载 |

### 9.2 动画优化

```typescript
// 使用 Reanimated 2 的 worklet 在 UI 线程执行动画
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

// 避免在动画中使用 JS 线程
```

### 9.3 内存管理

```typescript
// 及时释放图片资源
useEffect(() => {
  return () => {
    // 清理图片缓存
    if (imageUri) {
      Image.clearMemoryCache();
    }
  };
}, [imageUri]);
```

---

## 10. 实现清单

### MVP 阶段

- [ ] 创建文件结构
- [ ] 实现主题常量
- [ ] 实现 TipCard 组件
- [ ] 实现 ActionButton 组件
- [ ] 实现 PhotoUploadScreen
- [ ] 实现 PhotoPreviewScreen
- [ ] 实现 usePhotoCapture Hook
- [ ] 实现 useImagePicker Hook
- [ ] 实现权限请求
- [ ] 实现图片上传
- [ ] 编写单元测试
- [ ] 真机测试

### 后续优化

- [ ] 实现图片质量检测
- [ ] 添加呼吸动画效果
- [ ] 实现引导动画
- [ ] 添加错误重试机制
- [ ] 性能优化

---

## 变更记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| 1.0 | 2026-03-31 | 初始版本 | Sally |

---

*文档由 BMAD UX Designer Agent 生成*
