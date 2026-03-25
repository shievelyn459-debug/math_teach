module.exports = {
  preset: 'react-native',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['module:metro-react-native-babel-preset'] }],
  },
  transformIgnorePatterns: [
    // Transform all React Native and related packages
    'node_modules/(?!(?:react-native|@react-native|@react-native-community|@react-navigation|react-native-camera|react-native-paper|react-native-vector-icons|@react-native-async-storage|react-native-pdf-lib|react-native-fs|react-native-share|expo-|@expo|react-native-gesture-handler|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-blob-util|react-native-config|react-native-elements|react-native-image-picker|react-native-permissions|react-native-snap-carousel|react-native-tesseract-ocr)/)',
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
