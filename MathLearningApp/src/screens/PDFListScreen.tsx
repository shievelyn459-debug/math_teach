import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
  useWindowDimensions,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {PDFFileInfo} from '../types';
import {pdfService} from '../services/pdfService';
import {getFontSize, getScaledSpacing, getNumColumns} from '../styles/tablet';

type NavigationProp = StackNavigationProp<any, 'PDFList'>;

interface Props {
  navigation: NavigationProp;
}

const PDFListScreen: React.FC<Props> = ({navigation}) => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isLargeTablet = width >= 900;
  const numColumns = isLandscape && isLargeTablet ? 2 : 1;

  // Responsive font sizes
  const headerTitleFontSize = getFontSize(24, width);
  const headerInfoFontSize = getFontSize(14, width);
  const itemNameFontSize = getFontSize(16, width);
  const itemMetaFontSize = getFontSize(12, width);
  const emptyTitleFontSize = getFontSize(20, width);
  const emptyMessageFontSize = getFontSize(14, width);
  const buttonFontSize = getFontSize(16, width);

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
        ? { marginLeft: getScaledSpacing(8, width) }
        : {},
      numColumns > 1 ? { flex: 1 } : {},
    ];

    return (
      <View style={itemStyle}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleOpen(item.path)}>
          <View style={[styles.itemIconContainer, { minHeight: 48 }]}>
            <Text style={[styles.itemIcon, { fontSize: getFontSize(24, width) }]}>📄</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={[styles.itemName, { fontSize: itemNameFontSize }]} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={[styles.itemMeta, { fontSize: itemMetaFontSize }]}>
              {formatDate(item.modifiedAt)} · {pdfService.getFormattedFileSize(item.size)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={[styles.actionButton, { minHeight: 48, minWidth: 48 }]}
            onPress={() => handleShare(item.path)}>
            <Text style={[styles.actionIcon, { fontSize: getFontSize(16, width) }]}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { minHeight: 48, minWidth: 48 }]}
            onPress={() => handlePrint(item.path)}>
            <Text style={[styles.actionIcon, { fontSize: getFontSize(16, width) }]}>🖨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { minHeight: 48, minWidth: 48 }]}
            onPress={() => handleDelete(item)}>
            <Text style={[styles.actionIcon, styles.deleteIcon, { fontSize: getFontSize(16, width) }]}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyIcon, { fontSize: getFontSize(64, width) }]}>📁</Text>
      <Text style={[styles.emptyTitle, { fontSize: emptyTitleFontSize }]}>暂无保存的 PDF</Text>
      <Text style={[styles.emptyMessage, { fontSize: emptyMessageFontSize }]}>
        生成一些练习题并保存，然后就会在这里显示
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={[styles.loadingText, { fontSize: buttonFontSize }]}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={[styles.header, { padding: headerPadding }]}>
        <Text style={[styles.headerTitle, { fontSize: headerTitleFontSize }]}>我的 PDF</Text>
        <Text style={[styles.headerCount, { fontSize: headerInfoFontSize }]}>{pdfs.length} 个文件</Text>
      </View>

      {/* 错误状态 */}
      {error && !refreshing && (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { fontSize: headerInfoFontSize }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { minHeight: 48 }]}
            onPress={handleRefresh}>
            <Text style={[styles.retryButtonText, { fontSize: buttonFontSize }]}>重试</Text>
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
        contentContainerStyle={pdfs.length === 0 ? styles.emptyList : [styles.list, { padding: listPadding }]}
        ListEmptyComponent={!error ? renderEmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#2196f3"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  header: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#333',
  },
  headerCount: {
    color: '#666',
    marginTop: 4,
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
    backgroundColor: 'white',
    borderRadius: 12,
    // marginBottom and padding are now set dynamically
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIconContainer: {
    width: 48,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    // Font size is now set dynamically
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemMeta: {
    color: '#999',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    // Font size is now set dynamically
  },
  deleteIcon: {
    color: '#f44336',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    color: '#999',
    textAlign: 'center',
  },
  errorContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#c62828',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PDFListScreen;
