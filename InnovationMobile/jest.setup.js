// ─────────────────────────────────────────────────────────────
// jest.setup.js
// ─────────────────────────────────────────────────────────────
// Phase 7 — runs once before any test. Stubs the modules that
// React Native brings in at import time but can't be exercised in
// a Node test environment (NativeEventEmitter, gesture-handler,
// SecureStore, etc.). Without these mocks the test suite errors
// out at module-load time before any test code runs.
// ─────────────────────────────────────────────────────────────

// Silence the "Animated: `useNativeDriver` is not supported" warning
// that fires from RN internals when no native driver is available.
// (RN 0.77+ moved the helper to src/private/animated/NativeAnimatedHelper.js.)
jest.mock('react-native/src/private/animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Mock gesture-handler — the Jest runner has no native UI thread.
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    GestureHandlerRootView: View,
    Directions: {},
  };
});

// Mock expo-secure-store — relies on a native module that doesn't exist
// in the Node test environment. Phase 1's token store goes through this.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// Mock expo-linking — deep-link handling isn't exercised in unit tests.
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path) => `innovationmobile://${path}`),
  openURL: jest.fn(async () => true),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
  getInitialURL: jest.fn(async () => null),
}));

// Mock expo-linear-gradient — uses native rendering internally.
jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: (props) => React.createElement(View, props, props.children),
  };
});

// Stub fetch globally so any test that doesn't explicitly mock it has a
// safe default. Tests that hit the API client should mock `fetch` per test.
if (typeof global.fetch !== 'function') {
  global.fetch = jest.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => '{}',
    json: async () => ({}),
    headers: { get: () => null },
    blob: async () => new Blob(),
  }));
}
