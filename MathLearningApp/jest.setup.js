// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => {
  const AsyncStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    multiRemove: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(),
    multiSet: jest.fn(),
    multiGet: jest.fn(),
    clear: jest.fn(),
  };
  return {
    __esModule: true,
    default: AsyncStorage,
  };
});

// Mock react-native for other modules
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  // Add AccessibilityInfo mock
  RN.AccessibilityInfo = {
    announceForSync: jest.fn(),
    announceForAsync: jest.fn(),
    announceForAccessibility: jest.fn(),
    isScreenReaderEnabled: jest.fn(() => Promise.resolve(false)),
  };
  // Add Platform.select mock for shadows
  RN.Platform.select = (obj) => obj.android || obj.default || obj.ios;
  return RN;
});

// Mock react-native-camera
jest.mock('react-native-camera', () => ({
  RNCamera: {
    Constants: {
      Type: {
        back: 'back',
        front: 'front',
      },
      FlashMode: {
        on: 'on',
        off: 'off',
        torch: 'torch',
        auto: 'auto',
      },
    },
  },
}));

// Mock react-native-vector-icons
jest.mock('react-native-vector-icons/MaterialIcons', () => 'Icon');

// Mock react-native-permissions
jest.mock('react-native-permissions', () => ({
  request: jest.fn(() => Promise.resolve('granted')),
  check: jest.fn(() => Promise.resolve('granted')),
  PERMISSIONS: {
    IOS: {
      CAMERA: 'ios.permission.camera',
    },
    ANDROID: {
      CAMERA: 'android.permission.CAMERA',
    },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
}));

// Mock @react-native-community/netinfo
jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({
      isConnected: true,
      isInternetReachable: true,
      type: 'wifi',
    })
  ),
  addEventListener: jest.fn(() => jest.fn()),
  removeEventListener: jest.fn(),
}));

// Mock expo-crypto
jest.mock('expo-crypto', () => ({
  digestStringAsync: jest.fn((algorithm, value) =>
    Promise.resolve(`mocked-${algorithm}-${value}`)
  ),
  getRandomBytesAsync: jest.fn(() => Promise.resolve(new Uint8Array([1, 2, 3]))),
}));

// Mock expo-print
jest.mock('expo-print', () => ({
  printToFileAsync: jest.fn(() => Promise.resolve({ uri: '/mock/print.pdf' })),
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({
    uri: '/mock/manipulated.png',
    width: 100,
    height: 100,
  })),
}));

// Mock react-native-config
jest.mock('react-native-config', () => ({
  API_BASE_URL: 'http://mock-api.example.com',
  MYSQL_HOST: 'localhost',
  MYSQL_DATABASE: 'test_db',
}));

// Mock react-native-blob-util
jest.mock('react-native-blob-util', () => ({
  fetch: jest.fn(),
  fs: {
    dirs: {
      DocumentDir: '/mock/documents',
      CacheDir: '/mock/cache',
    },
    exists: jest.fn(),
    mkdir: jest.fn(),
    unlink: jest.fn(),
  },
}));

// Mock SettingsManager TurboModule
jest.mock('react-native/Libraries/Settings/NativeSettingsManager', () => ({
  getConstants: () => ({
    settingsTheme: 'light',
  }),
}));

// Mock react-native-pdf
jest.mock('react-native-pdf', () => 'PDF');

/**
 * Story 8.1: 批量测试修复 - 全局 Mocks
 * Date: 2026-04-04
 */

// react-native-pdf-lib mock
jest.mock('react-native-pdf-lib', () => ({
  PDFDocument: {
    create: jest.fn(() => ({
      addPage: jest.fn(() => ({
        addText: jest.fn(),
      })),
      write: jest.fn(() => Promise.resolve('mock-pdf-path')),
    })),
  },
  PDFPage: {
    create: jest.fn(() => ({
      setMediaBox: jest.fn(),
      addText: jest.fn(),
    })),
  },
}));

// Platform mock for specific imports
jest.mock('react-native/Libraries/Utilities/Platform', () => ({
  OS: 'ios',
  Version: '14.0',
  select: (obj) => obj.ios || obj.default || obj.android,
}));
