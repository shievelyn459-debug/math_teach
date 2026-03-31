import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  useWindowDimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {PDFFileInfo} from '../types';
import {pdfService} from '../services/pdfService';
import {getFontSize, getScaledSpacing, getNumColumns} from '../styles/tablet';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

type NavigationProp = StackNavigationProp<any, 'PDFList'>;

interface Props {
  navigation: NavigationProp;
}

const PDFListScreen: React.FC<Props> = ({navigation}) => {
  const {width, height} = useWindowDimensions();
  const isLandscape = width > height;
  const isLargeTablet = width >= 900;
  const numColumns = isLandscape && isLargeTablet ? 2 : 1;

  // Responsive font sizes
  const itemNameFontSize = getFontSize(16, width);
  const itemMetaFontSize = getFontSize(12, width);

  // Responsive spacing
  const headerPadding = getScaledSpacing(16, width);
  const listPadding = getScaledSpacing(16, width);
  const itemMargin = getScaledSpacing(12, width);
  const itemPadding = getScaledSpacing(12, width);

  const [pdfs, setPdfs] = useState<PDFFileInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 加载 PDF 列表
  const loadPDFs = async () => {
    try {
      setError(null);
      const savedPDFs = await pdfService.getSavedPDFs();
      setPdfs(savedPDFs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载 PDF 列表失败';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // 初始加载
  useEffect(() => {
    loadPDFs();
  }, []);

  // 下拉刷新
  const handleRefresh = () => {
    setRefreshing(true);
    loadPDFs();
  };

  // 分享 PDF
  const handleShare = async (filePath: string) => {
    try {
      await pdfService.sharePDF(filePath, {
        title: '分享练习题',
        message: '一年级数学练习题',
        subject: '数学练习题',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '分享失败';
      Alert.alert('分享失败', errorMessage);
    }
  };

  // 打印 PDF
  const handlePrint = async (filePath: string) => {
    try {
      await pdfService.printPDF(filePath);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '打印失败';
      Alert.alert('打印失败', errorMessage);
    }
  };

  // 打开 PDF
  const handleOpen = async (filePath: string) => {
    try {
      const opened = await pdfService.openPDF(filePath);
      if (!opened) {
        Alert.alert('提示', '没有安装PDF查看器应用');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '打开文件失败';
      Alert.alert('打开失败', errorMessage);
    }
  };

  // 删除 PDF
  const handleDelete = (pdf: PDFFileInfo) => {
    Alert.alert('确认删除', `确定要删除 "${pdf.name}" 吗？`, [
      {text: '取消', style: 'cancel'},
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          try {
            await pdfService.deletePDF(pdf.path);
            // 从列表中移除
            setPdfs(pdfs.filter(p => p.path !== pdf.path));
          } catch (err) {
            const errorMessage = err instanceof Error ? err.message : '删除失败';
            Alert.alert('删除失败', errorMessage);
          }
        },
      },
    ]);
  };

  // 渲染列表项
  const renderItem = ({item, index}: {item: PDFFileInfo; index: number}) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // 计算两列布局时的右边距
    const itemStyle = [
      styles.itemContainer,
      {
        marginBottom: itemMargin,
        padding: itemPadding,
      },
      numColumns > 1 && index % 2 === 1
        ? {marginLeft: getScaledSpacing(8, width)}
        : {},
      numColumns > 1 ? {flex: 1} : {},
    ];

    return (
      <View style={itemStyle}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleOpen(item.path)}>
          <View style={styles.itemIconContainer}>
            <Icon
              name="description"
              size="lg"
              color={designSystem.colors.info.main}
            />
          </View>
          <View style={styles.itemInfo}>
            <Typography
              variant="headlineSmall"
              numberOfLines={1}
              style={{fontSize: itemNameFontSize}}>
              {item.name}
            </Typography>
            <Typography
              variant="caption"
              color={designSystem.colors.text.hint}
              style={{fontSize: itemMetaFontSize}}>
              {formatDate(item.modifiedAt)} · {pdfService.getFormattedFileSize(item.size)}
            </Typography>
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, {minHeight: 48, minWidth: 48}]}
            onPress={() => handleShare(item.path)}>
            <Icon name="share" size="sm" color={designSystem.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {minHeight: 48, minWidth: 48}]}
            onPress={() => handlePrint(item.path)}>
            <Icon name="print" size="sm" color={designSystem.colors.text.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, {minHeight: 48, minWidth: 48}]}
            onPress={() => handleDelete(item)}>
            <Icon name="delete" size="sm" color={designSystem.colors.error.main} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name="folder-open"
        size="xl"
        color={designSystem.colors.text.disabled}
      />
      <Spacer size="lg" />
      <Typography variant="headlineMedium" align="center">
        暂无保存的 PDF
      </Typography>
      <Spacer size="sm" />
      <Typography
        variant="caption"
        color={designSystem.colors.text.hint}
        align="center">
        生成一些练习题并保存，然后就会在这里显示
      </Typography>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={designSystem.colors.primary} />
        <Spacer size="lg" />
        <Typography variant="body" color={designSystem.colors.text.secondary}>
          加载中...
        </Typography>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, {padding: headerPadding}]}>
        <Typography variant="displaySmall">我的 PDF</Typography>
        <Typography variant="caption" color={designSystem.colors.text.secondary}>
          {pdfs.length} 个文件
        </Typography>
      </View>

      {/* 错误状态 */}
      {error && !refreshing && (
        <View style={styles.errorContainer}>
          <Typography variant="body" color={designSystem.colors.error.dark}>
            {error}
          </Typography>
          <Spacer size="md" />
          <TouchableOpacity
            style={[styles.retryButton, {minHeight: 48}]}
            onPress={handleRefresh}>
            <Typography variant="body" color={designSystem.colors.text.inverse}>
              重试
            </Typography>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF 列表 */}
      <FlatList
        data={pdfs}
        renderItem={renderItem}
        keyExtractor={item => item.path}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        contentContainerStyle={
          pdfs.length === 0
            ? styles.emptyList
            : [styles.list, {padding: listPadding}]
        }
        ListEmptyComponent={!error ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={designSystem.colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: designSystem.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
  },
  header: {
    backgroundColor: designSystem.colors.surface.primary,
    borderBottomWidth: 1,
    borderBottomColor: designSystem.colors.border,
  },
  list: {
    // Padding is now set dynamically
  },
  emptyList: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: designSystem.colors.surface.primary,
    borderRadius: designSystem.borderRadius.lg,
    // marginBottom and padding are now set dynamically
    ...designSystem.shadows.sm,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 48,
    borderRadius: designSystem.borderRadius.md,
    backgroundColor: designSystem.colors.info.light,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: designSystem.spacing.md,
  },
  itemInfo: {
    flex: 1,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designSystem.spacing.xs,
  },
  actionButton: {
    borderRadius: designSystem.borderRadius.xl,
    backgroundColor: designSystem.colors.surface.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designSystem.spacing.xxxl,
  },
  errorContainer: {
    margin: designSystem.spacing.lg,
    padding: designSystem.spacing.lg,
    backgroundColor: designSystem.colors.error.light,
    borderRadius: designSystem.borderRadius.md,
    borderWidth: 1,
    borderColor: designSystem.colors.error.border,
  },
  retryButton: {
    backgroundColor: designSystem.colors.error.dark,
    paddingHorizontal: designSystem.spacing.lg,
    paddingVertical: designSystem.spacing.sm,
    borderRadius: designSystem.borderRadius.sm,
    alignSelf: 'flex-start',
  },
});

export default PDFListScreen;
