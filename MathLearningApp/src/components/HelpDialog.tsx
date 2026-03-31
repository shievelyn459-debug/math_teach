/**
 * Story 5-2: 帮助对话框组件
 * 显示帮助内容，支持搜索和导航
 */

import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import {Card, Searchbar, Button, useTheme} from 'react-native-paper';
import {helpContentService, HelpContent, HelpSection} from '../services/helpContentService';
import {getScaledSpacing, getFontSize} from '../styles/tablet';
import {designSystem} from '../styles/designSystem';
import {Typography, Icon, Spacer} from '../components/ui';

interface HelpDialogProps {
  visible: boolean;
  screenId: string;
  onClose: () => void;
}

/**
 * 帮助对话框组件
 */
const HelpDialog: React.FC<HelpDialogProps> = ({visible, screenId, onClose}) => {
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const isTablet = width >= 600;

  const [helpContent, setHelpContent] = useState<HelpContent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<HelpContent[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // 防止搜索竞态条件 - 追踪最新的搜索请求
  const searchRequestIdRef = useRef(0);

  const spacing = getScaledSpacing(16, width);
  const fontSize = getFontSize(16, width);

  // 加载帮助内容
  useEffect(() => {
    if (visible && !isSearching) {
      loadHelpContent();
    }
  }, [visible, screenId, isSearching]);

  const loadHelpContent = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const content = await helpContentService.getHelpContent(screenId);
      setHelpContent(content);
    } catch (error) {
      console.error('Failed to load help content:', error);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索功能（修复竞态条件）
  useEffect(() => {
    const performSearch = async () => {
      // 生成新的请求ID
      const requestId = ++searchRequestIdRef.current;

      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const results = await helpContentService.searchHelp(searchQuery);

        // 只更新最新的搜索结果
        if (requestId === searchRequestIdRef.current) {
          setSearchResults(results);
        }
      } else {
        if (requestId === searchRequestIdRef.current) {
          setIsSearching(false);
          setSearchResults([]);
        }
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => {
      clearTimeout(timeoutId);
      // 清除时增加请求ID，确保超时的搜索不会更新结果
      searchRequestIdRef.current++;
    };
  }, [searchQuery]);

  const renderSection = (section: HelpSection, index: number) => (
    <View key={index} style={[styles.section, {marginBottom: spacing}]}>
      <Typography
        variant="headlineSmall"
        color={theme.colors.primary}
        style={styles.sectionTitle}>
        {section.title}
      </Typography>
      <Typography
        variant="body"
        style={[styles.sectionContent, {lineHeight: fontSize * 1.5}]}>
        {section.content}
      </Typography>
      {section.tips && section.tips.length > 0 && (
        <View style={styles.tipsContainer}>
          {section.tips.map((tip, i) => (
            <View key={i} style={[styles.tipItem, {flexDirection: 'row', alignItems: 'flex-start'}]}>
              <Typography
                variant="body"
                color={theme.colors.primary}
                style={{marginRight: spacing / 2}}>
                •
              </Typography>
              <Typography variant="body" style={{flex: 1}}>{tip}</Typography>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFAQ = (faq: {question: string; answer: string}[], index: number) => (
    <View key={index} style={[styles.faqContainer, {marginTop: spacing}]}>
      <Typography
        variant="headlineSmall"
        color={theme.colors.primary}
        style={styles.faqTitle}>
        常见问题
      </Typography>
      {faq.map((item, i) => (
        <View key={i} style={[styles.faqItem, {marginBottom: spacing}]}>
          <Typography
            variant="body"
            style={{fontWeight: '600', marginBottom: spacing / 2}}>
            Q: {item.question}
          </Typography>
          <Typography
            variant="body"
            style={{lineHeight: fontSize * 1.5}}>
            A: {item.answer}
          </Typography>
        </View>
      ))}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}>
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        {/* 头部 */}
        <View style={[styles.header, {padding: spacing, backgroundColor: theme.colors.primary}]}>
          <View style={styles.headerContent}>
            <Typography
              variant="headlineMedium"
              color={designSystem.colors.surface.primary}
              style={styles.headerTitle}>
              {isSearching ? '搜索结果' : (helpContent?.title || '帮助')}
            </Typography>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size="lg" color={designSystem.colors.surface.primary} />
            </TouchableOpacity>
          </View>

          {/* 搜索框 */}
          <View style={[styles.searchContainer, {marginTop: spacing}]}>
            <Searchbar
              placeholder="搜索帮助内容..."
              onChangeText={setSearchQuery}
              value={searchQuery}
              style={styles.searchBar}
              iconColor={theme.colors.primary}
              accessibilityLabel="搜索帮助内容"
              accessibilityHint="输入关键词搜索帮助"
            />
          </View>
        </View>

        {/* 内容区域 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, {padding: spacing}]}
          accessibilityLabel="帮助内容"
          accessibilityRole="text">
          {isLoading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Spacer size="md" />
              <Typography variant="body">加载中...</Typography>
            </View>
          ) : isSearching ? (
            <>
              {searchResults.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Icon name="search-off" size="xl" color={designSystem.colors.text.hint} />
                  <Spacer size="md" />
                  <Typography
                    variant="body"
                    color={designSystem.colors.text.secondary}>
                    没有找到相关内容
                  </Typography>
                </View>
              ) : (
                searchResults.map((content, index) => (
                  <Card key={index} style={[styles.resultCard, {marginBottom: spacing}]}>
                    <Card.Content>
                      <Typography
                        variant="headlineSmall"
                        color={theme.colors.primary}
                        style={styles.resultTitle}>
                        {content.title}
                      </Typography>
                      {content.sections.slice(0, 2).map((section, i) => renderSection(section, i))}
                      {content.sections.length > 2 && (
                        <Typography
                          variant="body"
                          color={theme.colors.primary}
                          style={styles.moreText}>
                          还有 {content.sections.length - 2} 个区块...
                        </Typography>
                      )}
                    </Card.Content>
                  </Card>
                ))
              )}
            </>
          ) : loadError ? (
            <View style={styles.centerContainer}>
              <Icon name="error-outline" size="xl" color={designSystem.colors.error.default} />
              <Spacer size="md" />
              <Typography
                variant="headlineSmall"
                color={designSystem.colors.error.default}
                style={styles.errorTitle}>
                帮助内容加载失败
              </Typography>
              <Spacer size="md" />
              <Button
                mode="contained"
                onPress={loadHelpContent}
                accessibilityLabel="重试加载帮助内容">
                重试
              </Button>
            </View>
          ) : helpContent ? (
            <>
              {helpContent.sections.map((section, index) => renderSection(section, index))}
              {helpContent.faq && helpContent.faq.length > 0 && renderFAQ(helpContent.faq, 0)}
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Typography variant="body">帮助内容加载失败</Typography>
            </View>
          )}
        </ScrollView>

        {/* 底部按钮 */}
        <View style={[styles.footer, {padding: spacing, borderTopColor: theme.colors.divider}]}>
          <Button mode="contained" onPress={onClose} style={styles.closeButtonBottom}>
            关闭
          </Button>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  closeButton: {
    padding: designSystem.spacing.xs,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: designSystem.colors.surface.primary,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designSystem.spacing.xxl,
  },
  errorTitle: {
    fontWeight: '600',
  },
  moreText: {
    fontStyle: 'italic',
    marginTop: designSystem.spacing.sm,
  },
  section: {
    marginBottom: designSystem.spacing.md,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.sm,
  },
  sectionContent: {
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: designSystem.spacing.md,
    backgroundColor: designSystem.colors.surface.secondary,
    padding: designSystem.spacing.md,
    borderRadius: designSystem.borderRadius.md,
  },
  tipItem: {
    marginBottom: designSystem.spacing.xs,
  },
  faqContainer: {
    marginTop: designSystem.spacing.xl,
    borderTopWidth: 1,
    borderTopColor: designSystem.colors.border,
    paddingTop: designSystem.spacing.md,
  },
  faqTitle: {
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.md,
  },
  faqItem: {
    marginBottom: designSystem.spacing.md,
  },
  resultCard: {
    elevation: 2,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: designSystem.spacing.md,
  },
  footer: {
    borderTopWidth: 1,
  },
  closeButtonBottom: {
    paddingVertical: designSystem.spacing.xs,
  },
});

export default HelpDialog;
