/**
 * E2E Test Helpers
 * Common utilities for Detox E2E tests
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { TIMEOUTS } from './testData';

/**
 * Wait for element to be visible
 */
export const waitForVisible = async (
  testID: string,
  timeout: number = TIMEOUTS.MEDIUM
): Promise<void> => {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
};

/**
 * Wait for element to disappear
 */
export const waitForNotVisible = async (
  testID: string,
  timeout: number = TIMEOUTS.MEDIUM
): Promise<void> => {
  await waitFor(element(by.id(testID)))
    .toBeNotVisible()
    .withTimeout(timeout);
};

/**
 * Wait for text to appear
 */
export const waitForText = async (
  text: string,
  timeout: number = TIMEOUTS.MEDIUM
): Promise<void> => {
  await waitFor(element(by.text(text)))
    .toBeVisible()
    .withTimeout(timeout);
};

/**
 * Tap element by testID
 */
export const tapElement = async (testID: string): Promise<void> => {
  await element(by.id(testID)).tap();
};

/**
 * Type text into input field
 */
export const typeText = async (testID: string, text: string): Promise<void> => {
  await element(by.id(testID)).typeText(text);
};

/**
 * Clear text from input field
 */
export const clearText = async (testID: string): Promise<void> => {
  await element(by.id(testID)).clearText();
};

/**
 * Replace text in input field
 */
export const replaceText = async (testID: string, text: string): Promise<void> => {
  await element(by.id(testID)).replaceText(text);
};

/**
 * Scroll to element
 */
export const scrollTo = async (
  scrollViewTestID: string,
  elementTestID: string,
  direction: 'up' | 'down' | 'left' | 'right' = 'down'
): Promise<void> => {
  await waitFor(element(by.id(elementTestID)))
    .toBeVisible()
    .whileElement(by.id(scrollViewTestID))
    .scroll(100, direction);
};

/**
 * Swipe element
 */
export const swipe = async (
  testID: string,
  direction: 'up' | 'down' | 'left' | 'right',
  speed: 'fast' | 'slow' = 'fast',
  percentage: number = 0.75
): Promise<void> => {
  await element(by.id(testID)).swipe(direction, speed, percentage);
};

/**
 * Check if element exists
 */
export const elementExists = async (testID: string): Promise<boolean> => {
  try {
    await detoxExpect(element(by.id(testID))).toExist();
    return true;
  } catch {
    return false;
  }
};

/**
 * Check if element is visible
 */
export const elementIsVisible = async (testID: string): Promise<boolean> => {
  try {
    await detoxExpect(element(by.id(testID))).toBeVisible();
    return true;
  } catch {
    return false;
  }
};

/**
 * Take screenshot on failure
 */
export const takeScreenshot = async (name: string): Promise<void> => {
  const path = await device.takeScreenshot(name);
  console.log(`Screenshot saved to: ${path}`);
};

/**
 * Wait for loading to complete
 */
export const waitForLoadingComplete = async (
  loadingTestID: string = 'loading-indicator',
  timeout: number = TIMEOUTS.LONG
): Promise<void> => {
  await waitForNotVisible(loadingTestID, timeout);
};

/**
 * Navigate back
 */
export const goBack = async (): Promise<void> => {
  // Try different back button IDs based on platform/navigation
  const backButtonIds = ['back-button', 'header-back', 'nav-back'];

  for (const testID of backButtonIds) {
    if (await elementExists(testID)) {
      await tapElement(testID);
      return;
    }
  }

  // Fallback: Android hardware back button
  if (device.getPlatform() === 'android') {
    await device.pressBack();
  }
};

/**
 * Login helper
 */
export const login = async (email: string, password: string): Promise<void> => {
  await waitForVisible('login-screen');
  await replaceText('email-input', email);
  await replaceText('password-input', password);
  await tapElement('login-button');
  await waitForVisible('home-screen', TIMEOUTS.LONG);
};

/**
 * Logout helper
 */
export const logout = async (): Promise<void> => {
  await tapElement('profile-tab');
  await waitForVisible('profile-screen');
  await tapElement('logout-button');
  await waitForVisible('login-screen');
};

/**
 * Register helper
 */
export const register = async (
  name: string,
  email: string,
  password: string
): Promise<void> => {
  await waitForVisible('welcome-screen');
  await tapElement('register-button');
  await waitForVisible('register-screen');
  await replaceText('name-input', name);
  await replaceText('email-input', email);
  await replaceText('password-input', password);
  await replaceText('confirm-password-input', password);
  await tapElement('submit-button');
  await waitForVisible('home-screen', TIMEOUTS.LONG);
};
