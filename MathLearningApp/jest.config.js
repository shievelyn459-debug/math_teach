module.exports = {
  preset: 'react-native',
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|react-native-camera|@react-navigation|react-native-paper|react-native-vector-icons|@react-native-async-storage)/)',
  ],
  setupFiles: ['./node_modules/react-native/jest/setup.js', './jest.setup.js'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Fix for React Native 0.73+ Flow syntax in setup files
  globals: {
    __TEST__: true,
  },
  testEnvironment: 'node',
};
