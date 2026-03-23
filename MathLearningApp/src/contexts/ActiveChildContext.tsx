/**
 * Story 1-5: Active Child Context
 * React Context for app-wide active child state management
 */

import React, {createContext, useContext, useState, useEffect, ReactNode} from 'react';
import {Child} from '../types';
import {activeChildService} from '../services/activeChildService';

/**
 * Active Child Context类型
 */
interface ActiveChildContextType {
  activeChild: Child | null;
  setActiveChild: (child: Child | null) => Promise<{success: boolean; error?: string}>;
  clearActiveChild: () => Promise<void>;
  isLoading: boolean;
}

/**
 * 创建Context
 */
const ActiveChildContext = createContext<ActiveChildContextType | undefined>(undefined);

/**
 * Provider Props
 */
interface ActiveChildProviderProps {
  children: ReactNode;
  availableChildren?: Child[]; // 可用的孩子列表（用于验证）
}

/**
 * Active Child Provider组件
 * 提供全局活跃孩子状态管理
 */
export const ActiveChildProvider: React.FC<ActiveChildProviderProps> = ({
  children,
  availableChildren = [],
}) => {
  const [activeChild, setActiveChildState] = useState<Child | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // 初始化：从服务恢复活跃孩子
    const initializeActiveChild = async () => {
      try {
        await activeChildService.waitForInitialization();
        if (!mounted) return;

        const child = activeChildService.getActiveChild();

        // 验证活跃孩子是否仍然在可用列表中
        if (child && availableChildren && availableChildren.length > 0) {
          const isValid = availableChildren.some(c => c.id === child.id);
          if (!isValid) {
            // 活跃孩子不在可用列表中，清除它
            await activeChildService.clearActiveChild();
            if (mounted) {
              setActiveChildState(null);
            }
            return;
          }
        }

        if (mounted) {
          setActiveChildState(child);
        }
      } catch (error) {
        console.error('[ActiveChildProvider] Failed to initialize:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeActiveChild();

    // 监听活跃孩子变化
    const unsubscribe = activeChildService.onActiveChildChanged((child) => {
      if (mounted) {
        setActiveChildState(child);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [availableChildren]);

  /**
   * 设置活跃孩子
   */
  const setActiveChild = async (child: Child | null) => {
    const result = await activeChildService.setActiveChild(child, availableChildren);
    return result;
  };

  /**
   * 清除活跃孩子
   */
  const clearActiveChild = async () => {
    await activeChildService.clearActiveChild();
  };

  const value: ActiveChildContextType = {
    activeChild,
    setActiveChild,
    clearActiveChild,
    isLoading,
  };

  return <ActiveChildContext.Provider value={value}>{children}</ActiveChildContext.Provider>;
};

/**
 * useActiveChild Hook
 * 用于在组件中访问活跃孩子状态
 */
export const useActiveChild = (): ActiveChildContextType => {
  const context = useContext(ActiveChildContext);
  if (context === undefined) {
    throw new Error('useActiveChild must be used within an ActiveChildProvider');
  }
  return context;
};

export default ActiveChildContext;
