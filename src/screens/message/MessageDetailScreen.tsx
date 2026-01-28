import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native';
import notificationService, { Notification } from '../../services/notification.service';

export default function MessageDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [notification, setNotification] = useState<Notification | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotification();
  }, [id]);

  const loadNotification = async () => {
    try {
      setLoading(true);
      // Get all notifications and find the one we need
      // In a production app, you'd have a getNotificationById endpoint
      const notifications = await notificationService.getNotifications(undefined, 1, 100);
      const found = notifications.find((n) => n.id === id);

      if (found) {
        setNotification(found);
        
        // Mark as read if not already
        if (!found.isRead) {
          await notificationService.markAsRead(id);
        }
      } else {
        Alert.alert('Error', 'Notification not found');
        router.back();
      }
    } catch (error: any) {
      console.error('Error loading notification:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to load message');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0088CC" />
        <Text style={styles.loadingText}>Loading message...</Text>
      </View>
    );
  }

  if (!notification) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color="#ccc" />
        <Text style={styles.errorText}>Message not found</Text>
      </View>
    );
  }

  const iconColor = notificationService.getNotificationColor(notification.type);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: iconColor + '10' }]}>
        <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
          <Ionicons name="mail" size={32} color={iconColor} />
        </View>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.timestamp}>
          {new Date(notification.createdAt).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>

      {/* Message Content */}
      <View style={styles.messageContainer}>
        <Text style={styles.message}>{notification.message}</Text>

        {/* Metadata */}
        {notification.metadata && Object.keys(notification.metadata).length > 0 && (
          <View style={styles.metadataContainer}>
            <Text style={styles.metadataTitle}>Additional Information:</Text>
            {Object.entries(notification.metadata).map(([key, value]) => (
              <View key={key} style={styles.metadataRow}>
                <Text style={styles.metadataKey}>{key}:</Text>
                <Text style={styles.metadataValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Case Reference */}
        {notification.caseNumber && (
          <View style={styles.caseReferenceContainer}>
            <Ionicons name="folder-open-outline" size={20} color="#0088CC" />
            <Text style={styles.caseReferenceText}>
              Related to Case #{notification.caseNumber}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  messageContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  message: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  metadataContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  metadataTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  metadataRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  metadataKey: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginRight: 8,
    textTransform: 'capitalize',
  },
  metadataValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  caseReferenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    gap: 8,
  },
  caseReferenceText: {
    fontSize: 14,
    color: '#0088CC',
    fontWeight: '500',
  },
});
