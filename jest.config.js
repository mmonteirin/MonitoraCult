module.exports = {
  preset: 'react-native',
  setupFiles: [],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation)/)'
  ],
  moduleNameMapper: {
    "^@react-native-async-storage/async-storage$": "<rootDir>/__mocks__/asyncStorageMock.js",
    "^@react-native-firebase/messaging$": "<rootDir>/__mocks__/reactNativeFirebaseMessagingMock.js",
    "^@react-native-firebase/app$": "<rootDir>/__mocks__/reactNativeFirebaseAppMock.js"
  }
};
