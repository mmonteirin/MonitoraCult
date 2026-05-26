import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { SocialProvider, useSocial } from '../context/SocialContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

function TestComp() {
  const { toggleLike, isLiked, toggleFollow, isFollowing } = useSocial();
  React.useEffect(() => {
    toggleLike('post1');
    toggleFollow('user1');
  }, []);
  return (
    <>
      <>{isLiked('post1') ? 'liked' : 'not'}</>
      <>{isFollowing('user1') ? 'following' : 'not'}</>
    </>
  );
}

test('SocialProvider toggles like and follow and persists', async () => {
  const r = render(
    <SocialProvider>
      <TestComp />
    </SocialProvider>
  );

  await waitFor(() => {
    expect(r.getByText('liked')).toBeTruthy();
    expect(r.getByText('following')).toBeTruthy();
  });

  expect(AsyncStorage.setItem).toHaveBeenCalled();
});
