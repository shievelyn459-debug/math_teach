import React from 'react';
import {View, StyleSheet} from 'react-native';
import {designSystem} from '../styles/designSystem';
import {Typography, Spacer} from '../components/ui';

/**
 * 题目列表屏幕
 * 占位实现，后续将在Epic 4中完善
 */
const QuestionListScreen = () => {
  return (
    <View style={styles.container}>
      <Typography variant="displaySmall" style={styles.title}>
        题库
      </Typography>
      <Spacer size="sm" />
      <Typography variant="body" color={designSystem.colors.text.secondary}>
        敬请期待...
      </Typography>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
    backgroundColor: designSystem.colors.background,
  },
  title: {
    textAlign: 'center',
  },
});

export default QuestionListScreen;
