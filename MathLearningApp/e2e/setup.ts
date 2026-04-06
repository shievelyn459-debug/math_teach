import { device, element, by, waitFor } from 'detox';

// Global test configuration
declare global {
  var TEST_TIMEOUT: number;
  var RETRY_COUNT: number;
}

// Configure default timeouts and retries
global.TEST_TIMEOUT = 30000;
global.RETRY_COUNT = 3;

// Helper to wait for element with retry
export const waitForElement = async (matcher: Detox.NativeMatcher, timeout: number = global.TEST_TIMEOUT) => {
  return waitFor(element(matcher))
    .toBeVisible()
    .withTimeout(timeout);
};

// Helper to wait for element to disappear
export const waitForElementToDisappear = async (matcher: Detox.NativeMatcher, timeout: number = global.TEST_TIMEOUT) => {
  return waitFor(element(matcher))
    .toBeNotVisible()
    .withTimeout(timeout);
};

// Clean up before each test
beforeEach(async () => {
  // Reload React Native for clean state
  await device.reloadReactNative();
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
