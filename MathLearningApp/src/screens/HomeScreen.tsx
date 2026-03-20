import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity} from 'react-native';
import {Card, Title, Paragraph, Button} from 'react-native-paper';

const HomeScreen = ({navigation}: any) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>一年级数学学习助手</Text>
        <Text style={styles.subtitle}>让家长轻松掌握辅导方法</Text>
      </View>

      <Card style={styles.card} onPress={() => navigation.navigate('Camera')}>
        <Card.Content>
          <Title style={styles.cardTitle}>📸 拍照上传题目</Title>
          <Paragraph>
            拍摄孩子的数学作业题目，系统将自动识别并生成同类型题目
          </Paragraph>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>📚 最近练习</Title>
          <Text style={styles.emptyText}>暂无练习记录</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>📊 学习进度</Title>
          <Text style={styles.emptyText}>暂无学习数据</Text>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>💡 辅导小贴士</Title>
          <Text style={styles.tipText}>
            • 一年级学生适合使用实物辅助理解
            {'\n'}• 多使用生活化的例子解释数学概念
            {'\n'}• 鼓励孩子自己动手操作
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007bff',
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
  },
  card: {
    margin: 15,
    borderRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
  tipText: {
    fontSize: 14,
    lineHeight: 24,
    color: '#333',
  },
});

export default HomeScreen;