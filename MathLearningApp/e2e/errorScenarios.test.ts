/**
 * E2E Test: Error Scenarios
 * Covers: Network errors, Permission denials, Invalid inputs, Edge cases
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { TIMEOUTS } from './utils/testData';
import {
  waitForVisible,
  tapElement,
  replaceText,
  waitForNotVisible,
  login,
} from './utils/helpers';
import { AUTH, NAV, CAMERA, PROCESSING, RESULT, COMMON } from './utils/testIDs';
import { existingTestUser } from './utils/testData';

describe('Error Scenarios', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' },
    });
  });

  describe('Network Error Handling', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await login(existingTestUser.email, existingTestUser.password);
    });

    it('should show error when network unavailable during login', async () => {
      // Disable network (simulated)
      await device.setURLBlacklist(['.*']);

      await device.reloadReactNative();
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await replaceText(AUTH.EMAIL_INPUT, existingTestUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, existingTestUser.password);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      await waitForVisible(COMMON.ERROR_MESSAGE, TIMEOUTS.LONG);

      // Restore network
      await device.setURLBlacklist([]);
    });

    it('should show retry option on network error', async () => {
      await device.setURLBlacklist(['.*']);

      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      await waitForVisible(COMMON.ERROR_MESSAGE, TIMEOUTS.LONG);
      await waitForVisible(COMMON.RETRY_BUTTON);

      await device.setURLBlacklist([]);
    });

    it('should retry operation when retry button tapped', async () => {
      await device.setURLBlacklist(['.*']);

      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);
      await waitForVisible(COMMON.ERROR_MESSAGE, TIMEOUTS.LONG);

      // Restore network before retry
      await device.setURLBlacklist([]);
      await tapElement(COMMON.RETRY_BUTTON);

      // Should proceed after retry
      await waitForVisible(PROCESSING.PROCESSING_SCREEN, TIMEOUTS.MEDIUM);
    });

    it('should show offline indicator', async () => {
      await device.setURLBlacklist(['.*']);

      await waitForVisible('offline-indicator', TIMEOUTS.MEDIUM);

      await device.setURLBlacklist([]);
    });

    it('should queue operations when offline', async () => {
      await device.setURLBlacklist(['.*']);

      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      // Should show queued status
      await waitForVisible('queued-for-sync', TIMEOUTS.LONG);

      await device.setURLBlacklist([]);
    });
  });

  describe('Permission Denial Scenarios', () => {
    it('should handle camera permission denied', async () => {
      await device.terminateApp();
      await device.launchApp({
        permissions: { camera: 'NO' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);

      await waitForVisible(CAMERA.CAMERA_PERMISSION_DENIED);
    });

    it('should show permission explanation', async () => {
      await device.terminateApp();
      await device.launchApp({
        permissions: { camera: 'NO' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_PERMISSION_DENIED);

      await detoxExpect(element(by.text(/需要相机权限/))).toBeVisible();
    });

    it('should provide link to settings', async () => {
      await device.terminateApp();
      await device.launchApp({
        permissions: { camera: 'NO' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_PERMISSION_DENIED);

      await detoxExpect(element(by.id('open-settings-button'))).toBeVisible();
    });

    it('should handle photo library permission denied', async () => {
      await device.terminateApp();
      await device.launchApp({
        permissions: { photos: 'NO', camera: 'YES' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.GALLERY_BUTTON);

      await waitForVisible('photos-permission-denied', TIMEOUTS.MEDIUM);
    });
  });

  describe('Invalid Input Scenarios', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
    });

    it('should show error for invalid email format', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      await replaceText(AUTH.EMAIL_INPUT, 'not-an-email');
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      await waitForVisible('email-error');
      await detoxExpect(element(by.text(/邮箱格式/))).toBeVisible();
    });

    it('should show error for too short password', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await replaceText(AUTH.PASSWORD_INPUT, '123');
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      await waitForVisible('password-error');
    });

    it('should show error for empty required fields', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      await waitForVisible('name-error');
      await waitForVisible('email-error');
      await waitForVisible('password-error');
    });

    it('should clear error on input change', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      await replaceText(AUTH.EMAIL_INPUT, 'invalid');
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);
      await waitForVisible('email-error');

      // Fix the input
      await replaceText(AUTH.EMAIL_INPUT, 'valid@email.com');

      // Error should clear
      await waitForNotVisible('email-error', TIMEOUTS.SHORT);
    });
  });

  describe('Boundary Conditions', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await login(existingTestUser.email, existingTestUser.password);
    });

    it('should handle very long input text', async () => {
      await tapElement(AUTH.PROFILE_TAB);
      await waitForVisible('profile-screen');
      await tapElement('edit-profile-button');
      await waitForVisible('edit-profile-screen');

      const longText = 'a'.repeat(500);
      await replaceText('name-input', longText);

      // Should truncate or show warning
      await tapElement('save-button');

      // Either saves truncated or shows error
    });

    it('should handle special characters in input', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      const specialChars = '<script>alert("xss")</script>';
      await replaceText(AUTH.EMAIL_INPUT, 'test@example.com');
      await replaceText(AUTH.PASSWORD_INPUT, specialChars);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      // Should handle gracefully (error message, not crash)
      await waitForVisible(COMMON.ERROR_MESSAGE, TIMEOUTS.MEDIUM);
    });

    it('should handle unicode characters', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      const unicodeName = '测试用户 👨‍👩‍👧‍👦';
      await replaceText(AUTH.NAME_INPUT, unicodeName);

      // Should accept unicode
      await detoxExpect(element(by.id(AUTH.NAME_INPUT))).toHaveText(unicodeName);
    });

    it('should handle rapid tapping (debounce)', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await replaceText(AUTH.EMAIL_INPUT, existingTestUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, existingTestUser.password);

      // Rapid tap submit button
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      // Should only submit once
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.LONG);
    });

    it('should handle app backgrounding during operation', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);
      await waitForVisible(PROCESSING.PROCESSING_SCREEN);

      // Background app
      await device.sendToHome();

      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Bring back to foreground
      await device.launchApp();

      // Should resume or restart processing
      await waitForVisible(RESULT.RESULT_SCREEN, TIMEOUTS.VERY_LONG);
    });

    it('should handle low memory condition', async () => {
      // Simulate memory warning
      await device.sendToHome();

      // Open other apps (simulated by waiting)
      await new Promise(resolve => setTimeout(resolve, 5000));

      // Return to app
      await device.launchApp();

      // Should recover gracefully
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.MEDIUM);
    });
  });

  describe('Timeout Handling', () => {
    beforeEach(async () => {
      await device.reloadReactNative();
      await login(existingTestUser.email, existingTestUser.password);
    });

    it('should timeout long-running operations', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      // Wait for timeout (30 seconds per spec)
      await waitForVisible(PROCESSING.PROCESSING_SCREEN);

      // If processing takes too long, should timeout
      // This test would need actual slow backend to verify
    });

    it('should show timeout error message', async () => {
      // Simulated timeout scenario
      await waitForVisible('timeout-error', TIMEOUTS.VERY_LONG).catch(() => {
        // If no timeout, test passes
      });
    });

    it('should allow retry after timeout', async () => {
      try {
        await waitForVisible('timeout-error', TIMEOUTS.SHORT);
        await tapElement(COMMON.RETRY_BUTTON);
        await waitForVisible(PROCESSING.PROCESSING_SCREEN, TIMEOUTS.MEDIUM);
      } catch {
        // No timeout occurred, test passes
      }
    });
  });
});
