# Notification System - Quick Start Guide

## Immediate Next Steps

### 1. Backend: Add FCM Token Fields to User Entity

**File:** `pandahealth-be/src/PandaHealth.Core/Entities/User.cs`

Add these properties:
```csharp
public string? FcmToken { get; set; }
public string? DeviceId { get; set; }
public string? DevicePlatform { get; set; }
public DateTime? FcmTokenUpdatedAt { get; set; }
```

### 2. Backend: Update NotificationService FCM Methods

**File:** `pandahealth-be/src/PandaHealth.Application/Services/NotificationService.cs`

Replace the placeholder `SendPushNotificationAsync` with actual implementation (see FCM_SETUP_GUIDE.md lines 25-68).

Replace the placeholder `RegisterFcmTokenAsync` with actual implementation (see FCM_SETUP_GUIDE.md lines 90-118).

### 3. Backend: Update Notification Creation to Send Push

**File:** `pandahealth-be/src/PandaHealth.Application/Services/NotificationService.cs`

In `CreateOrUpdateChatNotificationAsync`, after creating/updating notification, add:
```csharp
// Send push notification
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

Do the same for `CreateCaseNotificationAsync` and `CreateAdminNotificationAsync`.

### 4. Backend: Create Background Cleanup Job

**File:** `pandahealth-be/src/PandaHealth.Api/Services/NotificationCleanupService.cs`

```csharp
using Microsoft.Extensions.Hosting;
using PandaHealth.Application.Interfaces;

namespace PandaHealth.Api.Services;

public class NotificationCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<NotificationCleanupService> _logger;
    private readonly TimeSpan _interval = TimeSpan.FromHours(24);

    public NotificationCleanupService(
        IServiceProvider serviceProvider,
        ILogger<NotificationCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Notification cleanup service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await Task.Delay(_interval, stoppingToken);

                using var scope = _serviceProvider.CreateScope();
                var notificationService = scope.ServiceProvider
                    .GetRequiredService<INotificationService>();

                var result = await notificationService.DeleteOldReadNotificationsAsync();
                
                if (result.IsSuccess)
                {
                    _logger.LogInformation("Notification cleanup completed successfully");
                }
                else
                {
                    _logger.LogWarning("Notification cleanup failed: {Error}", result.Error);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during notification cleanup");
            }
        }
    }
}
```

**Register in Program.cs:**
```csharp
builder.Services.AddHostedService<NotificationCleanupService>();
```

### 5. Backend: Create Firestore Indexes

**File:** `pandahealth-be/firestore.indexes.json` (create if doesn't exist)

```json
{
  "indexes": [
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "DoctorId", "order": "ASCENDING" },
        { "fieldPath": "IsDeleted", "order": "ASCENDING" },
        { "fieldPath": "CreatedAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "DoctorId", "order": "ASCENDING" },
        { "fieldPath": "RelatedEntityId", "order": "ASCENDING" },
        { "fieldPath": "Type", "order": "ASCENDING" },
        { "fieldPath": "IsDeleted", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "notifications",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "IsRead", "order": "ASCENDING" },
        { "fieldPath": "ReadAt", "order": "ASCENDING" },
        { "fieldPath": "IsDeleted", "order": "ASCENDING" }
      ]
    }
  ]
}
```

Deploy indexes:
```bash
firebase deploy --only firestore:indexes
```

### 6. Frontend: Install Notification Packages

```bash
cd panda-doctor
npx expo install expo-notifications expo-device expo-constants
```

### 7. Frontend: Download Firebase Config Files

**Android:**
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Click Settings → Project Settings
4. Under "Your apps", select Android app
5. Download `google-services.json`
6. Place in `panda-doctor/google-services.json`

**iOS:**
1. Same as above, but select iOS app
2. Download `GoogleService-Info.plist`
3. Place in `panda-doctor/GoogleService-Info.plist`

### 8. Frontend: Update app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/images/notification-icon.png",
          "color": "#ffffff"
        }
      ]
    ],
    "notification": {
      "icon": "./assets/images/notification-icon.png",
      "color": "#0088CC"
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

### 9. Frontend: Create FCM Service

Copy the FCM service implementation from `FCM_SETUP_GUIDE.md` (lines 142-268) to:
`panda-doctor/src/services/fcm.service.ts`

### 10. Frontend: Initialize FCM on App Start

**File:** `panda-doctor/app/_layout.tsx`

Add at the top:
```typescript
import { useEffect } from 'react';
import fcmService from '@/src/services/fcm.service';
```

In the component:
```typescript
useEffect(() => {
  fcmService.initialize();
}, []);
```

### 11. Frontend: Update Badge Count

**File:** `panda-doctor/src/screens/notifications/NotificationsScreen.tsx`

Add import:
```typescript
import fcmService from '../../services/fcm.service';
```

Add effect:
```typescript
useEffect(() => {
  fcmService.setBadgeCount(unreadCount);
}, [unreadCount]);
```

## Testing Checklist

### Backend
- [ ] API starts without errors
- [ ] NotificationsController endpoints accessible
- [ ] Chat message creates notification
- [ ] Case assignment creates notification
- [ ] Notification marked as read successfully
- [ ] Delete notification works
- [ ] Unread count accurate
- [ ] Cleanup job runs daily

### Frontend
- [ ] Notifications screen loads
- [ ] Filter by all/unread works
- [ ] Tap notification navigates correctly
- [ ] Mark as read updates badge
- [ ] Delete notification works
- [ ] Mark all as read works
- [ ] Pull to refresh works
- [ ] Auto-polling every 30 seconds
- [ ] Badge count displays correctly
- [ ] FCM token registered

### FCM (Physical Device Required)
- [ ] Device token obtained
- [ ] Token registered with backend
- [ ] Push notification received
- [ ] Notification tap navigates to correct screen
- [ ] Badge count updates
- [ ] Sound and vibration work
- [ ] Notification appears in notification center

## Quick Test Commands

### Backend
```bash
cd pandahealth-be/src/PandaHealth.Api
dotnet run
```

### Frontend
```bash
cd panda-doctor
npx expo start
```

### Test Notification Creation
```bash
# Using curl or Postman
curl -X POST http://localhost:5000/api/notifications/register-token \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "device-token",
    "deviceId": "device-id",
    "platform": "android"
  }'
```

## Troubleshooting

### "Notification service not found"
- Check Program.cs has `AddScoped<INotificationService, NotificationService>()`
- Check Program.cs has `AddScoped<INotificationRepository, NotificationRepository>()`

### "FCM token not received"
- Must use physical device (emulator won't work for FCM)
- Check device permissions granted
- Verify Firebase config files in root directory

### "Badge count not updating"
- Check fcm.service.ts is properly initialized
- Verify setBadgeCount is called in useEffect
- Check platform permissions

### "Notifications not creating"
- Check Firestore connection
- Verify indexes are deployed
- Check service integration in ChatService/CaseService

## Production Deployment

1. **Backend:**
   ```bash
   cd pandahealth-be/src/PandaHealth.Api
   dotnet publish -c Release
   ```

2. **Frontend:**
   ```bash
   cd panda-doctor
   eas build --platform all
   ```

3. **Deploy Firestore Indexes:**
   ```bash
   firebase deploy --only firestore:indexes
   ```

4. **Monitor:**
   - Check application logs
   - Monitor Firebase Console for push delivery
   - Track notification metrics

## Need Help?

- See `NOTIFICATION_IMPLEMENTATION.md` for complete details
- See `FCM_SETUP_GUIDE.md` for FCM-specific setup
- Check Firebase documentation for FCM issues
- Check Expo documentation for notification issues
