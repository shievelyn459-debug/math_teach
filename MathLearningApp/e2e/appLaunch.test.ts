/**
 * Simple E2E Test: App Launch
 * Basic test to verify Detox configuration works
 */

import { device, element, by, expect as detoxExpect } from 'detox';

describe('App Launch', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
    });
  });

  it('should launch the app successfully', async () => {
    // Wait for app to load
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take a screenshot to verify app launched
    await device.takeScreenshot('app-launch');

    console.log('App launched successfully');
  });
});
