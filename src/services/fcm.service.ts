import messaging from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import notificationService from './notification.service';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class FcmService {
  private fcmToken: string | null = null;
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;

  /**
   * Initialize FCM and register device token
   */
  async initialize(): Promise<void> {
    try {
      // Check if running on physical device
      if (!Device.isDevice) {
        console.log('FCM: Must use physical device for push notifications');
        return;
      }

      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('FCM: Permission not granted for push notifications');
        return;
      }

      // Get FCM token
      const token = await this.getDeviceToken();
      if (!token) {
        console.log('FCM: Failed to get device token');
        return;
      }

      this.fcmToken = token;

      // Register with backend
      await this.registerWithBackend(token);

      // Set up notification listeners
      this.setupNotificationListeners();

      // Configure Android notification channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('panda_health_notifications', {
          name: 'PandaHealth Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#0088CC',
          sound: 'default',
        });
      }

      console.log('FCM: Initialization complete');
    } catch (error) {
      console.error('FCM: Initialization error:', error);
    }
  }

  /**
   * Get native FCM device token (for Firebase Cloud Messaging)
   */
  private async getDeviceToken(): Promise<string | null> {
    try {
      // Request permission for iOS
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('FCM: Permission not granted');
        return null;
      }

      // Get FCM token
      const token = await messaging().getToken();
      console.log('FCM: Native device token obtained:', token);
      return token;
    } catch (error) {
      console.error('FCM: Error getting device token:', error);
      return null;
    }
  }

  /**
   * Register token with backend
   */
  private async registerWithBackend(token: string): Promise<void> {
    try {
      const deviceId = Constants.deviceId || Constants.sessionId || 'unknown';
      const platform = Platform.OS;

      await notificationService.registerFcmToken(token, deviceId, platform);
      console.log('FCM: Token registered with backend');
    } catch (error) {
      console.error('FCM: Error registering token with backend:', error);
    }
  }

  /**
   * Set up notification listeners
   */
  private setupNotificationListeners(): void {
    // Handle notification received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener((notification) => {
      console.log('FCM: Notification received:', notification);
      // You can show an in-app notification or update state here
    });

    // Handle notification response (user tapped notification)
    this.responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('FCM: Notification tapped:', response);
      this.handleNotificationTap(response.notification);
    });
  }

  /**
   * Handle notification tap - navigation will be handled by the app
   */
  private handleNotificationTap(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    console.log('FCM: Notification tap data:', data);
    
    // The navigation will be handled by NotificationsScreen when user taps the notification
    // Data structure: { type, caseId, caseNumber, notificationId }
  }

  /**
   * Clean up listeners
   */
  cleanup(): void {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }

  /**
   * Get current FCM token
   */
  getFcmToken(): string | null {
    return this.fcmToken;
  }

  /**
   * Clear badge count
   */
  async clearBadgeCount(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  /**
   * Set badge count
   */
  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleLocalNotification(title: string, body: string, data?: any): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });
  }
}

export default new FcmService();
