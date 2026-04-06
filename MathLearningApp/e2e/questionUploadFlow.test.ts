/**
 * E2E Test: Question Upload and Recognition Flow
 * Covers: Camera capture, Gallery upload, OCR recognition
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { TIMEOUTS } from './utils/testData';
import {
  waitForVisible,
  tapElement,
  waitForNotVisible,
  login,
} from './utils/helpers';
import { AUTH, NAV, CAMERA, PROCESSING, RESULT } from './utils/testIDs';
import { existingTestUser } from './utils/testData';

describe('Question Upload and Recognition Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    // Login before each test
    await login(existingTestUser.email, existingTestUser.password);
  });

  describe('Camera Capture Flow', () => {
    it('should navigate to camera screen from home', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
    });

    it('should display camera preview', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await detoxExpect(element(by.id('camera-preview'))).toBeVisible();
    });

    it('should take photo successfully', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);

      // Should show preview after capture
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
    });

    it('should retake photo if not satisfied', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);

      await tapElement(CAMERA.RETAKE_BUTTON);

      // Should return to camera
      await waitForVisible(CAMERA.CAMERA_SCREEN);
    });

    it('should use captured photo', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);

      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      // Should navigate to processing
      await waitForVisible(PROCESSING.PROCESSING_SCREEN, TIMEOUTS.MEDIUM);
    });
  });

  describe('Gallery Upload Flow', () => {
    it('should open gallery from camera screen', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.GALLERY_BUTTON);

      // Gallery picker should open (platform specific)
      await waitForVisible('gallery-picker', TIMEOUTS.MEDIUM);
    });

    it('should select photo from gallery', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.GALLERY_BUTTON);
      await waitForVisible('gallery-picker', TIMEOUTS.MEDIUM);

      // Select first photo
      await tapElement('gallery-photo-0');

      // Should navigate to processing
      await waitForVisible(PROCESSING.PROCESSING_SCREEN, TIMEOUTS.MEDIUM);
    });
  });

  describe('OCR Recognition Flow', () => {
    it('should show processing indicator during recognition', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      await waitForVisible(PROCESSING.PROCESSING_SCREEN);
      await waitForVisible(PROCESSING.LOADING_INDICATOR);
    });

    it('should complete recognition within time limit', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);

      // Wait for processing to complete (30 second limit)
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);

      // Should show result
      await waitForVisible(RESULT.RESULT_SCREEN, TIMEOUTS.MEDIUM);
    });

    it('should display recognized question type', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);

      await waitForVisible(RESULT.QUESTION_TYPE);
    });

    it('should allow manual correction of question type', async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible(RESULT.RESULT_SCREEN);

      // Tap to change question type
      await tapElement(RESULT.QUESTION_TYPE);
      await waitForVisible('question-type-modal');

      // Select different type
      await tapElement('question-type-subtraction');

      // Verify type changed
      await detoxExpect(element(by.id(RESULT.QUESTION_TYPE))).toHaveText('减法');
    });
  });

  describe('Difficulty Selection', () => {
    beforeEach(async () => {
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_SCREEN);
      await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
      await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
      await tapElement(CAMERA.USE_PHOTO_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible(RESULT.RESULT_SCREEN);
    });

    it('should display difficulty selector', async () => {
      await waitForVisible(RESULT.DIFFICULTY_SELECTOR);
    });

    it('should select easy difficulty', async () => {
      await tapElement(RESULT.DIFFICULTY_EASY);
      await detoxExpect(element(by.id(RESULT.DIFFICULTY_EASY))).toHaveToggleValue(true);
    });

    it('should select medium difficulty', async () => {
      await tapElement(RESULT.DIFFICULTY_MEDIUM);
      await detoxExpect(element(by.id(RESULT.DIFFICULTY_MEDIUM))).toHaveToggleValue(true);
    });

    it('should select hard difficulty', async () => {
      await tapElement(RESULT.DIFFICULTY_HARD);
      await detoxExpect(element(by.id(RESULT.DIFFICULTY_HARD))).toHaveToggleValue(true);
    });
  });

  describe('Camera Permission Handling', () => {
    it('should handle camera permission denied', async () => {
      // Launch without camera permission
      await device.terminateApp();
      await device.launchApp({
        permissions: { camera: 'NO' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);

      await waitForVisible(CAMERA.CAMERA_PERMISSION_DENIED);
    });

    it('should show permission request guidance', async () => {
      await device.terminateApp();
      await device.launchApp({
        permissions: { camera: 'NO' },
      });

      await login(existingTestUser.email, existingTestUser.password);
      await tapElement(NAV.CAMERA_TAB);
      await waitForVisible(CAMERA.CAMERA_PERMISSION_DENIED);

      // Should show guidance
      await detoxExpect(element(by.text('请在设置中允许访问相机'))).toBeVisible();
    });
  });
});
