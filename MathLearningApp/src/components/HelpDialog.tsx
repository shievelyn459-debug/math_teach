/**
 * Story 5-2: 帮助对话框组件
 * 显示帮助内容，支持搜索和导航
 */

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import {Card, Title, Searchbar, Button, useTheme} from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {helpContentService, HelpContent, HelpSection} from '../services/helpContentService';
import {getScaledSpacing, getFontSize} from '../styles/tablet';

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
    try {
      const content = await helpContentService.getHelpContent(screenId);
      setHelpContent(content);
    } catch (error) {
      console.error('Failed to load help content:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索功能
  useEffect(() => {
    const performSearch = async () => {
      if (searchQuery.trim().length > 0) {
        setIsSearching(true);
        const results = await helpContentService.searchHelp(searchQuery);
        setSearchResults(results);
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    };

    const timeoutId = setTimeout(performSearch, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const renderSection = (section: HelpSection, index: number) => (
    <View key={index} style={[styles.section, {marginBottom: spacing}]}>
      <Text style={[styles.sectionTitle, {fontSize: fontSize * 1.1, color: theme.colors.primary}]}>
        {section.title}
      </Text>
      <Text style={[styles.sectionContent, {fontSize, lineHeight: fontSize * 1.5}]}>
        {section.content}
      </Text>
      {section.tips && section.tips.length > 0 && (
        <View style={styles.tipsContainer}>
          {section.tips.map((tip, i) => (
            <View key={i} style={[styles.tipItem, {flexDirection: 'row', alignItems: 'flex-start'}]}>
              <Text style={[styles.tipBullet, {color: theme.colors.primary, marginRight: spacing / 2}]}>
                •
              </Text>
              <Text style={[styles.tipText, {fontSize, flex: 1}]}>{tip}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderFAQ = (faq: {question: string; answer: string}[], index: number) => (
    <View key={index} style={[styles.faqContainer, {marginTop: spacing}]}>
      <Text style={[styles.faqTitle, {fontSize: fontSize * 1.1, color: theme.colors.primary}]}>
        常见问题
      </Text>
      {faq.map((item, i) => (
        <View key={i} style={[styles.faqItem, {marginBottom: spacing}]}>
          <Text style={[styles.faqQuestion, {fontSize, fontWeight: '600', marginBottom: spacing / 2}]}>
            Q: {item.question}
          </Text>
          <Text style={[styles.faqAnswer, {fontSize, lineHeight: fontSize * 1.5}]}>
            A: {item.answer}
          </Text>
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
            <Text style={[styles.headerTitle, {fontSize: fontSize * 1.2, color: 'white'}]}>
              {isSearching ? '搜索结果' : (helpContent?.title || '帮助')}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="white" />
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
            />
          </View>
        </View>

        {/* 内容区域 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, {padding: spacing}]}>
          {isLoading ? (
            <View style={styles.centerContainer}>
              <Text style={{fontSize}}>加载中...</Text>
            </View>
          ) : isSearching ? (
            <>
              {searchResults.length === 0 ? (
                <View style={styles.centerContainer}>
                  <Icon name="search-off" size={48} color={theme.colors.placeholder} />
                  <Text style={[styles.emptyText, {fontSize, marginTop: spacing}]}>
                    没有找到相关内容
                  </Text>
                </View>
              ) : (
                searchResults.map((content, index) => (
                  <Card key={index} style={[styles.resultCard, {marginBottom: spacing}]}>
                    <Card.Content>
                      <Text style={[styles.resultTitle, {fontSize: fontSize * 1.1, color: theme.colors.primary}]}>
                        {content.title}
                      </Text>
                      {content.sections.slice(0, 2).map((section, i) => renderSection(section, i))}
                    </Card.Content>
                  </Card>
                ))
              )}
            </>
          ) : helpContent ? (
            <>
              {helpContent.sections.map((section, index) => renderSection(section, index))}
              {helpContent.faq && helpContent.faq.length > 0 && renderFAQ(helpContent.faq, 0)}
            </>
          ) : (
            <View style={styles.centerContainer}>
              <Text style={{fontSize}}>帮助内容加载失败</Text>
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
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
    elevation: 0,
    backgroundColor: 'white',
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
    paddingVertical: 40,
  },
  emptyText: {
    color: '#757575',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionContent: {
    lineHeight: 24,
  },
  tipsContainer: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
  },
  tipItem: {
    marginBottom: 6,
  },
  tipBullet: {
    fontSize: 16,
  },
  tipText: {
    lineHeight: 20,
  },
  faqContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
  },
  faqTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  faqItem: {
    marginBottom: 16,
  },
  faqQuestion: {
    marginBottom: 4,
  },
  faqAnswer: {
    lineHeight: 22,
  },
  resultCard: {
    elevation: 2,
  },
  resultTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  footer: {
    borderTopWidth: 1,
  },
  closeButtonBottom: {
    paddingVertical: 4,
  },
});

export default HelpDialog;
