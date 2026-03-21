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
  RN.AccessibilityInfo = {
    announceForSync: jest.fn(),
    announceForAsync: jest.fn(),
  };
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
