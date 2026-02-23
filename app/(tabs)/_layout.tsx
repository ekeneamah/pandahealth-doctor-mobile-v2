import { colors } from '@/src/constants/theme';
import notificationService from '@/src/services/notification.service';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React, { useEffect, useState, useRef } from 'react';
import { Image, StyleSheet, Text, View, AppState } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const [unreadCount, setUnreadCount] = useState(0);
  const insets = useSafeAreaInsets();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef(AppState.currentState);

  const loadUnreadCount = async () => {
    try {
      console.log('[TabLayout] Loading unread count...');
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.totalUnread || 0);
      console.log('[TabLayout] Unread count:', data.totalUnread);
    } catch (error) {
      console.error('[TabLayout] Error loading unread count:', error);
    }
  };

  const startPolling = () => {
    if (intervalRef.current) {
      console.log('[TabLayout] Polling already active');
      return;
    }
    console.log('[TabLayout] Starting unread count polling (60s interval)');
    // Poll every 60 seconds (reduced from 30 to minimize requests)
    intervalRef.current = setInterval(() => {
      loadUnreadCount();
    }, 60000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      console.log('[TabLayout] Stopping unread count polling');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    // Load initial unread count
    loadUnreadCount();
    
    // Start polling
    startPolling();

    // Listen to app state changes
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      console.log('[TabLayout] App state changed:', appState.current, '→', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App came to foreground - refresh count and resume polling
        console.log('[TabLayout] App resumed - refreshing unread count');
        loadUnreadCount();
        startPolling();
      } else if (nextAppState.match(/inactive|background/)) {
        // App went to background - stop polling
        console.log('[TabLayout] App backgrounded - stopping polling');
        stopPolling();
      }

      appState.current = nextAppState;
    });

    return () => {
      stopPolling();
      subscription.remove();
    };
  }, []);


  return (
    <Tabs
      initialRouteName="cases"
      screenOptions={{
        freezeOnBlur: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.gray[400],
        headerShown: true,
        headerTitle: ({ children }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: -60 }}>
            <Image 
              source={require('@/assets/images/pandahealth-doctor-logo.png')} 
              style={{ width: 160, height: 60, marginLeft: 12, marginRight: 2 }}
              resizeMode="contain"
            />
            <Text style={{ fontSize: 23, fontWeight: '700', color: colors.gray[900] }}>
              {children}
            </Text>
          </View>
        ),
        headerLeft: () => null,
        headerStyle: {
          backgroundColor: colors.white,
          shadowColor: colors.gray[900],
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 4,
        },
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 23,
          color: colors.gray[900],
        },
        headerTintColor: colors.primary[600],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopWidth: 0,
          shadowColor: colors.gray[900],
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <Ionicons 
                name={focused ? "notifications" : "notifications-outline"} 
                size={24} 
                color={color} 
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "stats-chart" : "stats-chart-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          title: 'Cases',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "clipboard" : "clipboard-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          href: null,
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "time" : "time-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons 
              name={focused ? "settings" : "settings-outline"} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: -12,
    top: -6,
    backgroundColor: colors.error[500],
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.error[700],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
  },
});

