import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

/**
 * 题目列表屏幕
 * 占位实现，后续将在Epic 4中完善
 */
const QuestionListScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>题库</Text>
      <Text style={styles.subtitle}>敬请期待...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});

export default QuestionListScreen;
