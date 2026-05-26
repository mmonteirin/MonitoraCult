import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NotificationsProvider, useNotifications } from '../context/NotificationsContext';

function TestComp() {
  const { unreadCount, getFCMToken } = useNotifications();
  const [token, setToken] = React.useState(null);
  React.useEffect(() => {
    getFCMToken().then(setToken);
  }, []);
  return (
    <>
      <>{String(unreadCount)}</>
      <>{token || 'notoken'}</>
    </>
  );
}

test('NotificationsProvider initializes FCM and exposes token', async () => {
  const r = render(
    <NotificationsProvider>
      <TestComp />
    </NotificationsProvider>
  );

  await waitFor(() => expect(r.getByText('0')).toBeTruthy());
  await waitFor(() => expect(r.getByText('token-abc')).toBeTruthy());
  expect(AsyncStorage.setItem).toHaveBeenCalled();
});
