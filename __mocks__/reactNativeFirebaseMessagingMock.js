const messagingMock = {
  requestPermission: jest.fn(() => Promise.resolve(1)),
  AuthorizationStatus: { AUTHORIZED: 1, PROVISIONAL: 2 },
  getToken: jest.fn(() => Promise.resolve('mock-token')),
  onMessage: jest.fn(() => jest.fn()),
  onNotificationOpenedApp: jest.fn(() => jest.fn()),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(() => jest.fn()),
};

export default () => messagingMock;
