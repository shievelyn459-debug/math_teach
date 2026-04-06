/**
 * E2E Test: User Registration and Login Flow
 * Covers: Registration, Login, Logout, Password Reset
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { createTestUser, TIMEOUTS } from './utils/testData';
import {
  waitForVisible,
  tapElement,
  replaceText,
  waitForNotVisible,
} from './utils/helpers';
import { AUTH, NAV, PROFILE } from './utils/testIDs';

describe('User Authentication Flow', () => {
  let testUser: ReturnType<typeof createTestUser>;

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES', camera: 'YES' },
    });
    testUser = createTestUser();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Registration Flow', () => {
    it('should display welcome screen on app launch', async () => {
      await detoxExpect(element(by.id(AUTH.WELCOME_SCREEN))).toBeVisible();
      await detoxExpect(element(by.id(AUTH.REGISTER_BUTTON))).toBeVisible();
      await detoxExpect(element(by.id(AUTH.LOGIN_BUTTON))).toBeVisible();
    });

    it('should navigate to registration screen', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);
    });

    it('should validate registration form fields', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      // Submit empty form
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      // Should show validation errors
      await waitForVisible('name-error');
      await waitForVisible('email-error');
      await waitForVisible('password-error');
    });

    it('should validate email format', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await replaceText(AUTH.EMAIL_INPUT, 'invalid-email');
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      await waitForVisible('email-error');
    });

    it('should validate password strength', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await replaceText(AUTH.PASSWORD_INPUT, '123');
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      await waitForVisible('password-error');
    });

    it('should validate password confirmation match', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await replaceText(AUTH.NAME_INPUT, testUser.name);
      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, testUser.password);
      await replaceText(AUTH.CONFIRM_PASSWORD_INPUT, 'different-password');
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      await waitForVisible('confirm-password-error');
    });

    it('should complete registration successfully', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      await replaceText(AUTH.NAME_INPUT, testUser.name);
      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, testUser.password);
      await replaceText(AUTH.CONFIRM_PASSWORD_INPUT, testUser.password);
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      // Should navigate to home screen after successful registration
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.LONG);
    });

    it('should handle duplicate email registration', async () => {
      await tapElement(AUTH.REGISTER_BUTTON);
      await waitForVisible(AUTH.REGISTER_SCREEN);

      // Try to register with same email
      await replaceText(AUTH.NAME_INPUT, 'Another User');
      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, 'Password123!');
      await replaceText(AUTH.CONFIRM_PASSWORD_INPUT, 'Password123!');
      await tapElement(AUTH.REGISTER_SUBMIT_BUTTON);

      // Should show error
      await waitForVisible(AUTH.LOGIN_ERROR_MESSAGE);
    });
  });

  describe('Login Flow', () => {
    it('should navigate to login screen', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
    });

    it('should validate login form', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      // Submit empty form
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      await waitForVisible('email-error');
      await waitForVisible('password-error');
    });

    it('should show error for invalid credentials', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, 'wrong-password');
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      await waitForVisible(AUTH.LOGIN_ERROR_MESSAGE, TIMEOUTS.MEDIUM);
    });

    it('should login successfully with correct credentials', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);

      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, testUser.password);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);

      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.LONG);
    });

    it('should persist login session after app restart', async () => {
      // Login first
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, testUser.password);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.LONG);

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should still be logged in
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.MEDIUM);
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      // Ensure logged in
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await replaceText(AUTH.EMAIL_INPUT, testUser.email);
      await replaceText(AUTH.PASSWORD_INPUT, testUser.password);
      await tapElement(AUTH.LOGIN_SUBMIT_BUTTON);
      await waitForVisible(NAV.HOME_SCREEN, TIMEOUTS.LONG);
    });

    it('should logout successfully', async () => {
      await tapElement(NAV.PROFILE_TAB);
      await waitForVisible(PROFILE.PROFILE_SCREEN);
      await tapElement(PROFILE.LOGOUT_BUTTON);

      await waitForVisible(AUTH.WELCOME_SCREEN);
    });

    it('should require login after logout', async () => {
      await tapElement(NAV.PROFILE_TAB);
      await waitForVisible(PROFILE.PROFILE_SCREEN);
      await tapElement(PROFILE.LOGOUT_BUTTON);
      await waitForVisible(AUTH.WELCOME_SCREEN);

      // Restart app
      await device.terminateApp();
      await device.launchApp();

      // Should show welcome screen, not home
      await waitForVisible(AUTH.WELCOME_SCREEN);
    });
  });

  describe('Password Reset Flow', () => {
    it('should navigate to forgot password screen', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await tapElement(AUTH.FORGOT_PASSWORD_BUTTON);

      await waitForVisible(AUTH.FORGOT_PASSWORD_SCREEN);
    });

    it('should send password reset email', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await tapElement(AUTH.FORGOT_PASSWORD_BUTTON);
      await waitForVisible(AUTH.FORGOT_PASSWORD_SCREEN);

      await replaceText(AUTH.RESET_EMAIL_INPUT, testUser.email);
      await tapElement(AUTH.SEND_RESET_BUTTON);

      await waitForVisible(AUTH.RESET_SUCCESS_MESSAGE, TIMEOUTS.MEDIUM);
    });

    it('should validate email for password reset', async () => {
      await tapElement(AUTH.LOGIN_BUTTON);
      await waitForVisible(AUTH.LOGIN_SCREEN);
      await tapElement(AUTH.FORGOT_PASSWORD_BUTTON);
      await waitForVisible(AUTH.FORGOT_PASSWORD_SCREEN);

      await replaceText(AUTH.RESET_EMAIL_INPUT, 'invalid-email');
      await tapElement(AUTH.SEND_RESET_BUTTON);

      await waitForVisible('email-error');
    });
  });
});
