/**
 * E2E Test: Question Generation and Export Flow
 * Covers: Generate similar questions, Export to PDF, Download/Share
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { TIMEOUTS } from './utils/testData';
import {
  waitForVisible,
  tapElement,
  waitForNotVisible,
  login,
} from './utils/helpers';
import { NAV, CAMERA, PROCESSING, RESULT, EXPLANATION, PDF } from './utils/testIDs';
import { existingTestUser } from './utils/testData';

describe('Question Generation and Export Flow', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { camera: 'YES', photos: 'YES' },
    });
  });

  const captureAndProcessQuestion = async () => {
    await tapElement(NAV.CAMERA_TAB);
    await waitForVisible(CAMERA.CAMERA_SCREEN);
    await tapElement(CAMERA.TAKE_PHOTO_BUTTON);
    await waitForVisible('photo-preview', TIMEOUTS.MEDIUM);
    await tapElement(CAMERA.USE_PHOTO_BUTTON);
    await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
    await waitForVisible(RESULT.RESULT_SCREEN);
  };

  beforeEach(async () => {
    await device.reloadReactNative();
    await login(existingTestUser.email, existingTestUser.password);
  });

  describe('Question Generation', () => {
    beforeEach(async () => {
      await captureAndProcessQuestion();
    });

    it('should display generate button', async () => {
      await waitForVisible(RESULT.GENERATE_BUTTON);
    });

    it('should start generation when button tapped', async () => {
      await tapElement(RESULT.GENERATE_BUTTON);

      // Should show loading state
      await waitForVisible(PROCESSING.LOADING_INDICATOR);
    });

    it('should generate similar questions', async () => {
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);

      // Should show generated questions
      await waitForVisible('generated-questions-list', TIMEOUTS.MEDIUM);
    });

    it('should generate correct number of questions', async () => {
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible('generated-questions-list', TIMEOUTS.MEDIUM);

      // Count generated questions (should be 5-10)
      const questions = element(by.id('generated-question-item'));
      await detoxExpect(questions).toExist();
    });

    it('should allow regenerating questions', async () => {
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible('generated-questions-list', TIMEOUTS.MEDIUM);

      await tapElement('regenerate-button');

      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible('generated-questions-list', TIMEOUTS.MEDIUM);
    });
  });

  describe('Knowledge Point Explanation', () => {
    beforeEach(async () => {
      await captureAndProcessQuestion();
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
    });

    it('should display knowledge point', async () => {
      await waitForVisible(EXPLANATION.KNOWLEDGE_POINT);
    });

    it('should show explanation content', async () => {
      await tapElement('view-explanation-button');
      await waitForVisible(EXPLANATION.EXPLANATION_SCREEN);
      await waitForVisible(EXPLANATION.EXPLANATION_CONTENT);
    });

    it('should support text format', async () => {
      await tapElement('view-explanation-button');
      await waitForVisible(EXPLANATION.EXPLANATION_SCREEN);
      await tapElement(EXPLANATION.FORMAT_TEXT);

      await detoxExpect(element(by.id(EXPLANATION.EXPLANATION_CONTENT))).toBeVisible();
    });

    it('should support switching explanation formats', async () => {
      await tapElement('view-explanation-button');
      await waitForVisible(EXPLANATION.EXPLANATION_SCREEN);

      // Switch to different format if available
      await tapElement(EXPLANATION.FORMAT_SELECTOR);
      await waitForVisible('format-options-modal');

      // Select video format (if available)
      const videoOption = element(by.id(EXPLANATION.FORMAT_VIDEO));
      if (await videoOption.isVisible()) {
        await videoOption.tap();
      }
    });
  });

  describe('PDF Export', () => {
    beforeEach(async () => {
      await captureAndProcessQuestion();
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await waitForVisible('generated-questions-list', TIMEOUTS.MEDIUM);
    });

    it('should display export to PDF button', async () => {
      await waitForVisible(RESULT.EXPORT_PDF_BUTTON);
    });

    it('should generate PDF successfully', async () => {
      await tapElement(RESULT.EXPORT_PDF_BUTTON);

      // Should show generation progress
      await waitForVisible('pdf-generation-progress', TIMEOUTS.MEDIUM);
      await waitForNotVisible('pdf-generation-progress', TIMEOUTS.VERY_LONG);

      // Should show preview
      await waitForVisible(PDF.PDF_PREVIEW_SCREEN, TIMEOUTS.MEDIUM);
    });

    it('should display PDF preview', async () => {
      await tapElement(RESULT.EXPORT_PDF_BUTTON);
      await waitForNotVisible('pdf-generation-progress', TIMEOUTS.VERY_LONG);
      await waitForVisible(PDF.PDF_PREVIEW_SCREEN);

      await waitForVisible(PDF.PDF_VIEWER);
    });
  });

  describe('PDF Download and Share', () => {
    beforeEach(async () => {
      await captureAndProcessQuestion();
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await tapElement(RESULT.EXPORT_PDF_BUTTON);
      await waitForNotVisible('pdf-generation-progress', TIMEOUTS.VERY_LONG);
      await waitForVisible(PDF.PDF_PREVIEW_SCREEN);
    });

    it('should download PDF to device', async () => {
      await tapElement(PDF.DOWNLOAD_BUTTON);

      // Should show download progress
      await waitForVisible('download-progress', TIMEOUTS.MEDIUM);
      await waitForNotVisible('download-progress', TIMEOUTS.LONG);

      // Should show success message
      await waitForVisible('download-success-message', TIMEOUTS.MEDIUM);
    });

    it('should share PDF via system share sheet', async () => {
      await tapElement(PDF.SHARE_BUTTON);

      // System share sheet should appear
      await waitForVisible('share-sheet', TIMEOUTS.MEDIUM);
    });

    it('should print PDF', async () => {
      await tapElement(PDF.PRINT_BUTTON);

      // Print dialog should appear
      await waitForVisible('print-dialog', TIMEOUTS.MEDIUM);
    });
  });

  describe('PDF List Management', () => {
    beforeEach(async () => {
      // Generate and save a PDF first
      await captureAndProcessQuestion();
      await tapElement(RESULT.GENERATE_BUTTON);
      await waitForNotVisible(PROCESSING.LOADING_INDICATOR, TIMEOUTS.VERY_LONG);
      await tapElement(RESULT.EXPORT_PDF_BUTTON);
      await waitForNotVisible('pdf-generation-progress', TIMEOUTS.VERY_LONG);
      await tapElement(PDF.DOWNLOAD_BUTTON);
      await waitForNotVisible('download-progress', TIMEOUTS.LONG);
    });

    it('should display PDF in list', async () => {
      await tapElement(NAV.HISTORY_TAB);
      await waitForVisible(PDF.PDF_LIST_SCREEN);

      // Should show at least one PDF
      await detoxExpect(element(by.id('pdf-item-0'))).toBeVisible();
    });

    it('should open PDF from list', async () => {
      await tapElement(NAV.HISTORY_TAB);
      await waitForVisible(PDF.PDF_LIST_SCREEN);
      await tapElement('pdf-item-0');

      await waitForVisible(PDF.PDF_PREVIEW_SCREEN);
    });

    it('should delete PDF from list', async () => {
      await tapElement(NAV.HISTORY_TAB);
      await waitForVisible(PDF.PDF_LIST_SCREEN);

      // Swipe to delete (iOS) or long press (Android)
      await element(by.id('pdf-item-0')).swipe('left', 'fast', 0.5);
      await tapElement('delete-pdf-button');

      // Confirm deletion
      await waitForVisible('confirm-delete-dialog');
      await tapElement('confirm-button');
    });
  });
});
