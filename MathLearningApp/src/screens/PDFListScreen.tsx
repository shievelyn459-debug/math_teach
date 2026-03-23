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
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/native-stack';
import {PDFFileInfo} from '../types';
import {pdfService} from '../services/pdfService';

type NavigationProp = StackNavigationProp<any, 'PDFList'>;

interface Props {
  navigation: NavigationProp;
}

const PDFListScreen: React.FC<Props> = ({navigation}) => {
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
  const renderItem = ({item}: {item: PDFFileInfo}) => {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return (
      <View style={styles.itemContainer}>
        <TouchableOpacity
          style={styles.itemContent}
          onPress={() => handleOpen(item.path)}>
          <View style={styles.itemIconContainer}>
            <Text style={styles.itemIcon}>📄</Text>
          </View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.itemMeta}>
              {formatDate(item.modifiedAt)} · {pdfService.getFormattedFileSize(item.size)}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleShare(item.path)}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePrint(item.path)}>
            <Text style={styles.actionIcon}>🖨</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDelete(item)}>
            <Text style={[styles.actionIcon, styles.deleteIcon]}>🗑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 空状态
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📁</Text>
      <Text style={styles.emptyTitle}>暂无保存的 PDF</Text>
      <Text style={styles.emptyMessage}>
        生成一些练习题并保存，然后就会在这里显示
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196f3" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 头部 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的 PDF</Text>
        <Text style={styles.headerCount}>{pdfs.length} 个文件</Text>
      </View>

      {/* 错误状态 */}
      {error && !refreshing && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>重试</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* PDF 列表 */}
      <FlatList
        data={pdfs}
        renderItem={renderItem}
        keyExtractor={item => item.path}
        contentContainerStyle={pdfs.length === 0 ? styles.emptyList : styles.list}
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
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  headerCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
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
    height: 48,
    borderRadius: 8,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemIcon: {
    fontSize: 24,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: '#999',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
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
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
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
    fontSize: 14,
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
