import { useRouter, useSegments } from 'expo-router';
import { Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

const TAB_ROUTES = ['index', 'dashboard', 'cases', 'settings'] as const;

export function useSwipeNavigation() {
  const router = useRouter();
  const segments = useSegments();

  const getCurrentTabIndex = () => {
    const currentTab = segments[1] as string;
    if (currentTab === undefined || currentTab === '') return 0; // index route
    return TAB_ROUTES.indexOf(currentTab as any);
  };

  const navigateToTab = (direction: 'left' | 'right') => {
    const currentIndex = getCurrentTabIndex();
    let newIndex = currentIndex;

    if (direction === 'left' && currentIndex < TAB_ROUTES.length - 1) {
      newIndex = currentIndex + 1;
    } else if (direction === 'right' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    }

    if (newIndex !== currentIndex) {
      const route = TAB_ROUTES[newIndex];
      router.push(`/(tabs)${route === 'index' ? '' : `/${route}`}`);
    }
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((event) => {
      if (Math.abs(event.velocityX) > 500 || Math.abs(event.translationX) > 100) {
        if (event.translationX > 0) {
          runOnJS(navigateToTab)('right');
        } else {
          runOnJS(navigateToTab)('left');
        }
      }
    });

  return swipeGesture;
}
