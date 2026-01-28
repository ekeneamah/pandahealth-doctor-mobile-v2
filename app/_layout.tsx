import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import 'react-native-reanimated';
import { enableFreeze } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { useColorScheme } from '@/hooks/use-color-scheme';
import fcmService from '@/src/services/fcm.service';
import { useAuthStore } from '@/src/store/auth.store';

// Disable screen freezing to fix IndexOutOfBoundsException
enableFreeze(false);

export const unstable_settings = {
  initialRouteName: 'login',
};

function useProtectedRoute() {
  const segments = useSegments();
  const { isAuthenticated, isHydrated } = useAuthStore();
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    if (!isHydrated || hasNavigated) return;

    const inAuthGroup = segments[0] === 'login';

    // Use setTimeout to ensure navigation happens after mount
    setTimeout(() => {
      if (!isAuthenticated && !inAuthGroup) {
        router.replace('/login');
        setHasNavigated(true);
      } else if (isAuthenticated && inAuthGroup) {
        router.replace('/(tabs)');
        setHasNavigated(true);
      }
    }, 1);
  }, [isAuthenticated, segments, isHydrated, hasNavigated]);
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const { isHydrated, isAuthenticated } = useAuthStore();

  // Initialize FCM when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fcmService.initialize();
    }
    
    // Cleanup on unmount
    return () => {
      fcmService.cleanup();
    };
  }, [isAuthenticated]);

  // Show loading screen while auth state is hydrating
  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colorScheme === 'dark' ? '#000' : '#fff' }}>
        <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#fff' : '#0a7ea4'} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <RootLayoutNav />
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  useProtectedRoute();

  return (
    <Stack screenOptions={{ headerShown: false, freezeOnBlur: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="case/[id]"
        options={{
          headerShown: true,
          title: 'Case Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
