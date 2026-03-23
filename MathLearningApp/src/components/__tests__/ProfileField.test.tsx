/**
 * Story 1-4: ProfileField 组件测试
 */

import React from 'react';
import {render} from '@testing-library/react-native';
import {ProfileField, EditableProfileField} from '../../components/ProfileField';

describe('ProfileField Component (Story 1-4)', () => {
  it('应该渲染字段标签和值', () => {
    const {getByText} = render(
      <ProfileField label="姓名" value="张三" />
    );

    expect(getByText('姓名')).toBeTruthy();
    expect(getByText('张三')).toBeTruthy();
  });

  it('应该显示"未设置"当值为空', () => {
    const {getByText} = render(
      <ProfileField label="电话" value={undefined} />
    );

    expect(getByText('未设置')).toBeTruthy();
  });

  it('EditableProfileField 应该渲染编辑按钮', () => {
    const mockOnPress = jest.fn();
    const {getByText} = render(
      <EditableProfileField
        label="姓名"
        value="张三"
        onPress={mockOnPress}
      />
    );

    expect(getByText('编辑')).toBeTruthy();
  });
});
