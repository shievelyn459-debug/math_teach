/**
 * E2E Test Data Factory
 * Generates consistent test data for E2E tests
 */

// Generate unique email for testing
export const generateTestEmail = (): string => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `e2e-test-${timestamp}-${random}@example.com`;
};

// Test user data
export interface TestUser {
  email: string;
  password: string;
  name: string;
}

export const createTestUser = (): TestUser => ({
  email: generateTestEmail(),
  password: 'TestPassword123!',
  name: 'E2E Test User',
});

// Predefined test user for login tests (must exist in backend)
export const existingTestUser: TestUser = {
  email: 'e2e-existing@example.com',
  password: 'ExistingPass123!',
  name: 'Existing Test User',
};

// Test child data
export interface TestChild {
  name: string;
  grade: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
}

export const createTestChild = (): TestChild => ({
  name: `Test Child ${Date.now()}`,
  grade: '一年级',
  birthDate: '2018-01-01',
  gender: 'male',
});

// Test question data
export interface TestQuestion {
  imageUri: string;
  expectedType: string;
  expectedDifficulty: 'easy' | 'medium' | 'hard';
}

export const sampleQuestions: TestQuestion[] = [
  {
    imageUri: 'test-assets/addition.jpg',
    expectedType: 'addition',
    expectedDifficulty: 'easy',
  },
  {
    imageUri: 'test-assets/subtraction.jpg',
    expectedType: 'subtraction',
    expectedDifficulty: 'medium',
  },
];

// Test timeout constants
export const TIMEOUTS = {
  SHORT: 5000,
  MEDIUM: 15000,
  LONG: 30000,
  VERY_LONG: 60000,
};

// Retry configuration
export const RETRY_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};
