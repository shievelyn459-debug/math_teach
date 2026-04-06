/**
 * Test Stability Utilities
 * Provides retry mechanisms and smart waiting strategies
 */

import { device, element, by, waitFor } from 'detox';

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  let delay = finalConfig.initialDelay;

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.log(`Attempt ${attempt}/${finalConfig.maxRetries} failed: ${error}`);

      if (attempt < finalConfig.maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * finalConfig.backoffMultiplier, finalConfig.maxDelay);
      }
    }
  }

  throw lastError;
};

/**
 * Smart wait that handles dynamic content
 */
export const smartWait = async (
  testID: string,
  options: {
    timeout?: number;
    pollingInterval?: number;
    condition?: 'visible' | 'notVisible' | 'exist';
  } = {}
): Promise<void> => {
  const {
    timeout = 30000,
    pollingInterval = 500,
    condition = 'visible',
  } = options;

  const startTime = Date.now();
  let el = element(by.id(testID));

  while (Date.now() - startTime < timeout) {
    try {
      switch (condition) {
        case 'visible':
          await expect(el).toBeVisible();
          return;
        case 'notVisible':
          await expect(el).toBeNotVisible();
          return;
        case 'exist':
          await expect(el).toExist();
          return;
      }
    } catch {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
    }
  }

  throw new Error(`Timeout waiting for element ${testID} to be ${condition}`);
};

/**
 * Wait for network idle
 */
export const waitForNetworkIdle = async (
  timeout: number = 5000
): Promise<void> => {
  // Wait for network activity to settle
  await new Promise(resolve => setTimeout(resolve, timeout));
};

/**
 * Wait for animation to complete
 */
export const waitForAnimation = async (
  duration: number = 300
): Promise<void> => {
  await new Promise(resolve => setTimeout(resolve, duration));
};

/**
 * Stabilize flaky test by waiting for UI to settle
 */
export const stabilizeUI = async (): Promise<void> => {
  await waitForNetworkIdle(1000);
  await waitForAnimation(300);
};

/**
 * Debug helper to capture state on failure
 */
export const captureState = async (testName: string): Promise<void> => {
  try {
    const screenshot = await device.takeScreenshot(`debug-${testName}`);
    console.log(`Debug screenshot saved: ${screenshot}`);
  } catch (error) {
    console.error('Failed to capture debug screenshot:', error);
  }
};
