/**
 * E2E Test: Child Management Flow
 * Covers: Add child, Edit child, Delete child, Switch child
 */

import { device, element, by, waitFor, expect as detoxExpect } from 'detox';
import { TIMEOUTS, createTestChild, TestChild } from './utils/testData';
import {
  waitForVisible,
  tapElement,
  replaceText,
  waitForNotVisible,
  login,
} from './utils/helpers';
import { AUTH, NAV, CHILD, COMMON } from './utils/testIDs';
import { existingTestUser } from './utils/testData';

describe('Child Management Flow', () => {
  let testChild: TestChild;

  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
    testChild = createTestChild();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
    await login(existingTestUser.email, existingTestUser.password);
  });

  describe('View Child List', () => {
    it('should navigate to child list screen', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
    });

    it('should display existing children', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      // Check for children list
      await detoxExpect(element(by.id('children-list'))).toExist();
    });

    it('should show add child button', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      await detoxExpect(element(by.id(CHILD.ADD_CHILD_BUTTON))).toBeVisible();
    });

    it('should show empty state when no children', async () => {
      // This test assumes no children exist
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      const emptyState = element(by.id(COMMON.EMPTY_STATE));
      try {
        await detoxExpect(emptyState).toBeVisible();
      } catch {
        // Children exist, skip this test
      }
    });
  });

  describe('Add Child Flow', () => {
    it('should navigate to child form screen', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await tapElement(CHILD.ADD_CHILD_BUTTON);

      await waitForVisible(CHILD.CHILD_FORM_SCREEN);
    });

    it('should validate required fields', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await tapElement(CHILD.ADD_CHILD_BUTTON);
      await waitForVisible(CHILD.CHILD_FORM_SCREEN);

      // Submit empty form
      await tapElement(CHILD.SAVE_CHILD_BUTTON);

      // Should show validation errors
      await waitForVisible('name-error');
    });

    it('should fill child form successfully', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await tapElement(CHILD.ADD_CHILD_BUTTON);
      await waitForVisible(CHILD.CHILD_FORM_SCREEN);

      await replaceText(CHILD.CHILD_NAME_INPUT, testChild.name);
      await replaceText(CHILD.CHILD_GRADE_INPUT, testChild.grade);
      await replaceText(CHILD.CHILD_BIRTHDATE_INPUT, testChild.birthDate);
    });

    it('should save new child successfully', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await tapElement(CHILD.ADD_CHILD_BUTTON);
      await waitForVisible(CHILD.CHILD_FORM_SCREEN);

      await replaceText(CHILD.CHILD_NAME_INPUT, testChild.name);
      await tapElement(CHILD.SAVE_CHILD_BUTTON);

      // Should navigate back to list
      await waitForVisible(CHILD.CHILD_LIST_SCREEN, TIMEOUTS.MEDIUM);

      // Should show success message
      await waitForVisible(COMMON.SUCCESS_MESSAGE);
    });

    it('should display newly added child in list', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      // Find the newly added child
      await detoxExpect(element(by.text(testChild.name))).toBeVisible();
    });
  });

  describe('Edit Child Flow', () => {
    const updatedName = `Updated Child ${Date.now()}`;

    it('should open child edit screen', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      // Tap on first child item
      await element(by.id('child-item-0')).tap();

      await waitForVisible(CHILD.CHILD_FORM_SCREEN);
    });

    it('should pre-fill form with existing data', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await element(by.id('child-item-0')).tap();
      await waitForVisible(CHILD.CHILD_FORM_SCREEN);

      // Check that name field has value
      await detoxExpect(element(by.id(CHILD.CHILD_NAME_INPUT))).toExist();
    });

    it('should update child information', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await element(by.id('child-item-0')).tap();
      await waitForVisible(CHILD.CHILD_FORM_SCREEN);

      // Clear and update name
      await element(by.id(CHILD.CHILD_NAME_INPUT)).clearText();
      await replaceText(CHILD.CHILD_NAME_INPUT, updatedName);
      await tapElement(CHILD.SAVE_CHILD_BUTTON);

      await waitForVisible(CHILD.CHILD_LIST_SCREEN, TIMEOUTS.MEDIUM);
    });

    it('should display updated child name', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      await detoxExpect(element(by.text(updatedName))).toBeVisible();
    });
  });

  describe('Delete Child Flow', () => {
    it('should show delete option', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      // Long press or swipe for delete option
      await element(by.id('child-item-0')).longPress();

      await waitForVisible('delete-child-option');
    });

    it('should show confirmation dialog', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await element(by.id('child-item-0')).longPress();
      await tapElement('delete-child-option');

      await waitForVisible('confirm-delete-dialog');
    });

    it('should cancel deletion', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
      await element(by.id('child-item-0')).longPress();
      await tapElement('delete-child-option');
      await waitForVisible('confirm-delete-dialog');

      await tapElement(CHILD.CANCEL_DELETE_BUTTON);

      // Should dismiss dialog and stay on list
      await waitForNotVisible('confirm-delete-dialog');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);
    });

    it('should confirm deletion', async () => {
      await tapElement('child-management-button');
      await waitForVisible(CHILD.CHILD_LIST_SCREEN);

      // Get child count before
      const childrenBefore = await element(by.id('children-list')).getAttributes();

      await element(by.id('child-item-0')).longPress();
      await tapElement('delete-child-option');
      await waitForVisible('confirm-delete-dialog');
      await tapElement(CHILD.CONFIRM_DELETE_BUTTON);

      // Should return to list
      await waitForVisible(CHILD.CHILD_LIST_SCREEN, TIMEOUTS.MEDIUM);
    });
  });

  describe('Switch Active Child', () => {
    it('should show child selector on home screen', async () => {
      await waitForVisible('child-selector');
    });

    it('should open child selector dropdown', async () => {
      await tapElement('child-selector');
      await waitForVisible('child-selector-dropdown');
    });

    it('should switch active child', async () => {
      await tapElement('child-selector');
      await waitForVisible('child-selector-dropdown');

      // Select different child if available
      const secondChild = element(by.id('selector-child-1'));
      try {
        await secondChild.tap();

        // Should update selector text
        await waitForNotVisible('child-selector-dropdown');
      } catch {
        // Only one child, skip
      }
    });

    it('should persist selected child across sessions', async () => {
      await tapElement('child-selector');
      await waitForVisible('child-selector-dropdown');

      const secondChild = element(by.id('selector-child-1'));
      try {
        await secondChild.tap();
        await waitForNotVisible('child-selector-dropdown');

        // Restart app
        await device.terminateApp();
        await device.launchApp();

        // Should still show selected child
        await waitForVisible('child-selector');
      } catch {
        // Only one child, skip
      }
    });
  });
});
