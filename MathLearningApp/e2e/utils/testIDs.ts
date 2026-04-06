/**
 * Test IDs for E2E Tests
 * Centralized testID constants for consistent element identification
 */

// Auth Screens
export const AUTH = {
  // Welcome/Landing
  WELCOME_SCREEN: 'welcome-screen',
  REGISTER_BUTTON: 'register-button',
  LOGIN_BUTTON: 'login-button',

  // Login
  LOGIN_SCREEN: 'login-screen',
  EMAIL_INPUT: 'email-input',
  PASSWORD_INPUT: 'password-input',
  FORGOT_PASSWORD_BUTTON: 'forgot-password-button',
  LOGIN_SUBMIT_BUTTON: 'login-button',
  LOGIN_ERROR_MESSAGE: 'login-error-message',

  // Register
  REGISTER_SCREEN: 'register-screen',
  NAME_INPUT: 'name-input',
  CONFIRM_PASSWORD_INPUT: 'confirm-password-input',
  REGISTER_SUBMIT_BUTTON: 'submit-button',
  REGISTRATION_SUCCESS: 'registration-success',

  // Password Reset
  FORGOT_PASSWORD_SCREEN: 'forgot-password-screen',
  RESET_EMAIL_INPUT: 'reset-email-input',
  SEND_RESET_BUTTON: 'send-reset-button',
  RESET_SUCCESS_MESSAGE: 'reset-success-message',

  // Navigation tabs
  PROFILE_TAB: 'profile-tab',
};

// Home/Navigation
export const NAV = {
  HOME_SCREEN: 'home-screen',
  CAMERA_TAB: 'camera-tab',
  HISTORY_TAB: 'history-tab',
  PROFILE_TAB: 'profile-tab',
  SETTINGS_TAB: 'settings-tab',
};

// Camera/Upload
export const CAMERA = {
  CAMERA_SCREEN: 'camera-screen',
  TAKE_PHOTO_BUTTON: 'take-photo-button',
  GALLERY_BUTTON: 'gallery-button',
  CAPTURE_BUTTON: 'capture-button',
  RETAKE_BUTTON: 'retake-button',
  USE_PHOTO_BUTTON: 'use-photo-button',
  CAMERA_PERMISSION_DENIED: 'camera-permission-denied',
};

// Processing
export const PROCESSING = {
  PROCESSING_SCREEN: 'processing-screen',
  LOADING_INDICATOR: 'loading-indicator',
  PROGRESS_BAR: 'progress-bar',
  PROCESSING_STATUS: 'processing-status',
  RETRY_BUTTON: 'retry-button',
};

// Result/Question
export const RESULT = {
  RESULT_SCREEN: 'result-screen',
  QUESTION_IMAGE: 'question-image',
  QUESTION_TYPE: 'question-type',
  DIFFICULTY_SELECTOR: 'difficulty-selector',
  DIFFICULTY_EASY: 'difficulty-easy',
  DIFFICULTY_MEDIUM: 'difficulty-medium',
  DIFFICULTY_HARD: 'difficulty-hard',
  GENERATE_BUTTON: 'generate-button',
  EXPORT_PDF_BUTTON: 'export-pdf-button',
};

// Explanation
export const EXPLANATION = {
  EXPLANATION_SCREEN: 'explanation-screen',
  KNOWLEDGE_POINT: 'knowledge-point',
  EXPLANATION_CONTENT: 'explanation-content',
  FORMAT_SELECTOR: 'format-selector',
  FORMAT_TEXT: 'format-text',
  FORMAT_VIDEO: 'format-video',
  FORMAT_AUDIO: 'format-audio',
};

// PDF
export const PDF = {
  PDF_LIST_SCREEN: 'pdf-list-screen',
  PDF_ITEM: (id: string) => `pdf-item-${id}`,
  PDF_PREVIEW_SCREEN: 'pdf-preview-screen',
  PDF_VIEWER: 'pdf-viewer',
  DOWNLOAD_BUTTON: 'download-button',
  SHARE_BUTTON: 'share-button',
  PRINT_BUTTON: 'print-button',
};

// Child Management
export const CHILD = {
  CHILD_LIST_SCREEN: 'child-list-screen',
  ADD_CHILD_BUTTON: 'add-child-button',
  CHILD_FORM_SCREEN: 'child-form-screen',
  CHILD_NAME_INPUT: 'child-name-input',
  CHILD_GRADE_INPUT: 'child-grade-input',
  CHILD_BIRTHDATE_INPUT: 'child-birthdate-input',
  CHILD_GENDER_INPUT: 'child-gender-input',
  SAVE_CHILD_BUTTON: 'save-child-button',
  CHILD_ITEM: (id: string) => `child-item-${id}`,
  EDIT_CHILD_BUTTON: (id: string) => `edit-child-${id}`,
  DELETE_CHILD_BUTTON: (id: string) => `delete-child-${id}`,
  CONFIRM_DELETE_BUTTON: 'confirm-delete-button',
  CANCEL_DELETE_BUTTON: 'cancel-delete-button',
};

// Profile
export const PROFILE = {
  PROFILE_SCREEN: 'profile-screen',
  EDIT_PROFILE_BUTTON: 'edit-profile-button',
  LOGOUT_BUTTON: 'logout-button',
  EDIT_PROFILE_SCREEN: 'edit-profile-screen',
  UPDATE_PROFILE_BUTTON: 'update-profile-button',
  CHANGE_PASSWORD_BUTTON: 'change-password-button',
};

// Common
export const COMMON = {
  ERROR_MESSAGE: 'error-message',
  SUCCESS_MESSAGE: 'success-message',
  LOADING_OVERLAY: 'loading-overlay',
  EMPTY_STATE: 'empty-state',
  RETRY_BUTTON: 'retry-button',
  CANCEL_BUTTON: 'cancel-button',
  CONFIRM_BUTTON: 'confirm-button',
  CLOSE_BUTTON: 'close-button',
  MODAL: 'modal',
  ALERT: 'alert',
};

// History
export const HISTORY = {
  HISTORY_SCREEN: 'history-screen',
  HISTORY_LIST: 'history-list',
  HISTORY_ITEM: (id: string) => `history-item-${id}`,
  CLEAR_HISTORY_BUTTON: 'clear-history-button',
};
