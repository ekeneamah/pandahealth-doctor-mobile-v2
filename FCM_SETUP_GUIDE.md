# Firebase Cloud Messaging (FCM) Setup Guide

## Overview
This guide walks you through setting up Firebase Cloud Messaging for push notifications in the PandaHealth Doctor app.

## Prerequisites
- Firebase project already created (existing for authentication)
- Physical device or emulator with Google Play Services (for Android)
- iOS device or simulator with APNs configuration (for iOS)

## Backend Setup

### 1. Install Firebase Admin SDK Package (Already Installed)
The Firebase Admin SDK is already installed in the backend project for authentication.

### 2. Update NotificationService with FCM Implementation

The `SendPushNotificationAsync` method in `NotificationService.cs` needs to be implemented with actual FCM logic:

```csharp
public async Task<Result> SendPushNotificationAsync(
    string userId,
    string title,
    string body,
    Dictionary<string, string>? data = null)
{
    try
    {
        // Get user's FCM tokens from user profile
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || string.IsNullOrEmpty(user.FcmToken))
        {
            _logger.LogWarning("User {UserId} has no FCM token registered", userId);
            return Result.Failure("No FCM token found for user");
        }

        // Create FCM message
        var message = new FirebaseAdmin.Messaging.Message
        {
            Token = user.FcmToken,
            Notification = new FirebaseAdmin.Messaging.Notification
            {
                Title = title,
                Body = body
            },
            Data = data ?? new Dictionary<string, string>(),
            Android = new FirebaseAdmin.Messaging.AndroidConfig
            {
                Priority = FirebaseAdmin.Messaging.Priority.High,
                Notification = new FirebaseAdmin.Messaging.AndroidNotification
                {
                    Sound = "default",
                    ChannelId = "panda_health_notifications"
                }
            },
            Apns = new FirebaseAdmin.Messaging.ApnsConfig
            {
                Aps = new FirebaseAdmin.Messaging.Aps
                {
                    Sound = "default",
                    Badge = 1
                }
            }
        };

        // Send message
        var response = await FirebaseAdmin.Messaging.FirebaseMessaging.DefaultInstance
            .SendAsync(message);

        _logger.LogInformation("Push notification sent to user {UserId}, message ID: {MessageId}", 
            userId, response);

        return Result.Success();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error sending push notification to user {UserId}", userId);
        return Result.Failure("Failed to send push notification");
    }
}
```

### 3. Add FCM Token Fields to User Entity

Add to `User.cs`:
```csharp
public string? FcmToken { get; set; }
public string? DeviceId { get; set; }
public string? DevicePlatform { get; set; }
public DateTime? FcmTokenUpdatedAt { get; set; }
```

### 4. Update RegisterFcmTokenAsync Implementation

The method in `NotificationService.cs` needs to save the token to the user profile:

```csharp
public async Task<Result> RegisterFcmTokenAsync(
    string userId,
    string fcmToken,
    string deviceId,
    string platform)
{
    try
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
        {
            return Result.Failure("User not found");
        }

        user.FcmToken = fcmToken;
        user.DeviceId = deviceId;
        user.DevicePlatform = platform;
        user.FcmTokenUpdatedAt = DateTime.UtcNow;

        await _userRepository.UpdateAsync(user);

        _logger.LogInformation("FCM token registered for user {UserId} on {Platform}", 
            userId, platform);

        return Result.Success();
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error registering FCM token for user {UserId}", userId);
        return Result.Failure("Failed to register FCM token");
    }
}
```

### 5. Update Notification Creation to Send Push

Modify `CreateOrUpdateChatNotificationAsync` and `CreateCaseNotificationAsync` to send push notifications:

```csharp
// After creating/updating notification, send push
await SendPushNotificationAsync(
    doctorId,
    title,
    message,
    new Dictionary<string, string>
    {
        { "type", NotificationType.ChatMessage.ToString() },
        { "caseId", caseId },
        { "caseNumber", caseNumber }
    });
```

## Frontend Setup (React Native with Expo)

### 1. Install Required Packages

```bash
cd panda-doctor
npx expo install expo-notifications expo-device expo-constants
```

### 2. Configure app.json

Add notification configuration:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/sounds/notification.wav"],
          "mode": "production"
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#0088CC",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new notifications"
    },
    "android": {
      "googleServicesFile": "./google-services.json",
      "permissions": [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "WAKE_LOCK",
        "POST_NOTIFICATIONS"
      ]
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    }
  }
}
```

### 3. Download Firebase Config Files

**For Android:**
1. Go to Firebase Console → Project Settings → Your Android App
2. Download `google-services.json`
3. Place in project root: `panda-doctor/google-services.json`

**For iOS:**
1. Go to Firebase Console → Project Settings → Your iOS App
2. Download `GoogleService-Info.plist`
3. Place in project root: `panda-doctor/GoogleService-Info.plist`

### 4. Create FCM Service

Create `src/services/fcm.service.ts`:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import notificationService from './notification.service';
import authService from './auth.service';

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
        });
      }

      console.log('FCM: Initialization complete');
    } catch (error) {
      console.error('FCM: Initialization error:', error);
    }
  }

  /**
   * Get device push token
   */
  private async getDeviceToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      
      if (!projectId) {
        console.error('FCM: No project ID found');
        return null;
      }

      const token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;

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
    Notifications.addNotificationReceivedListener((notification) => {
      console.log('FCM: Notification received:', notification);
    });

    // Handle notification response (user tapped notification)
    Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('FCM: Notification tapped:', response);
      this.handleNotificationTap(response.notification);
    });
  }

  /**
   * Handle notification tap
   */
  private handleNotificationTap(notification: Notifications.Notification): void {
    const data = notification.request.content.data;
    
    // Navigation will be handled by the app based on notification type
    // This is just logging for now
    console.log('FCM: Handle notification navigation:', data);
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
}

export default new FcmService();
```

### 5. Initialize FCM on App Start

Update `app/_layout.tsx`:

```typescript
import { useEffect } from 'react';
import fcmService from '@/src/services/fcm.service';

export default function RootLayout() {
  useEffect(() => {
    // Initialize FCM
    fcmService.initialize();
  }, []);

  // ... rest of layout
}
```

### 6. Update Badge Count

In `NotificationsScreen.tsx`, update badge count when loading notifications:

```typescript
useEffect(() => {
  loadNotifications();
  
  // Update badge
  fcmService.setBadgeCount(unreadCount);
}, [unreadCount]);
```

## Testing

### 1. Test Backend
```bash
# Start the API
cd pandahealth-be/src/PandaHealth.Api
dotnet run
```

### 2. Test Frontend
```bash
# Start Expo
cd panda-doctor
npx expo start

# Build for device testing
npx expo run:android
# or
npx expo run:ios
```

### 3. Send Test Notification

Use Postman to test:

**Register Token:**
```http
POST http://localhost:5000/api/notifications/register-token
Authorization: Bearer {your-jwt-token}
Content-Type: application/json

{
  "fcmToken": "your-device-token",
  "deviceId": "device-id",
  "platform": "android"
}
```

**Create Test Notification (via case assignment):**
```http
POST http://localhost:5000/api/cases/{caseId}/assign
Authorization: Bearer {admin-jwt-token}
Content-Type: application/json

{
  "doctorId": "doctor-user-id"
}
```

## Troubleshooting

### Android Issues
- Ensure `google-services.json` is in the root directory
- Check that Google Play Services is installed
- Verify Firebase project has Android app configured

### iOS Issues
- Ensure `GoogleService-Info.plist` is in the root directory
- Check APNs configuration in Firebase Console
- Verify provisioning profiles include push notification capability

### Token Not Received
- Check device permissions
- Verify Firebase project ID in `app.json`
- Check logs for FCM errors

## Production Considerations

1. **Token Refresh**: Implement token refresh logic when tokens expire
2. **Multi-Device**: Support multiple devices per user
3. **Notification Grouping**: Group related notifications
4. **Rich Notifications**: Add images, actions, and expanded views
5. **Analytics**: Track notification delivery and engagement
6. **Rate Limiting**: Prevent notification spam
7. **Quiet Hours**: Respect user preferences for notification timing

## Additional Resources

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Admin SDK for .NET](https://firebase.google.com/docs/admin/setup)
